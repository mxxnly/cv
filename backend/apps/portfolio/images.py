import logging
from io import BytesIO
from pathlib import Path

from django.core.files.base import ContentFile
from django.db.models.fields.files import FieldFile
from PIL import Image, ImageOps

logger = logging.getLogger(__name__)


def optimize_image(field_file: FieldFile, max_side: int = 2000, quality: int = 84) -> None:
    """Downscale a freshly uploaded image and re-encode it as WebP.

    Already stored files (`_committed=True`) and animated images are left untouched.
    """
    if not field_file or getattr(field_file, "_committed", True):
        return

    try:
        field_file.open()
        image = Image.open(field_file)
        if getattr(image, "is_animated", False):
            return

        image = ImageOps.exif_transpose(image)
        image.thumbnail((max_side, max_side), Image.Resampling.LANCZOS)

        if image.mode not in ("RGB", "RGBA"):
            has_alpha = image.mode in ("LA", "PA") or "transparency" in image.info
            image = image.convert("RGBA" if has_alpha else "RGB")

        buffer = BytesIO()
        image.save(buffer, format="WEBP", quality=quality, method=6)
    except Exception:  # Corrupted or unsupported file: keep the original upload.
        logger.warning("Image optimization skipped for %s", field_file.name, exc_info=True)
        return

    name = Path(field_file.name).with_suffix(".webp").name
    field_file.save(name, ContentFile(buffer.getvalue()), save=False)

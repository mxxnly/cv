from io import BytesIO

import pytest
from django.core.files.uploadedfile import SimpleUploadedFile
from PIL import Image

from apps.portfolio.models import Profile, Project, split_lines

pytestmark = pytest.mark.django_db


def _png(width: int, height: int) -> SimpleUploadedFile:
    buffer = BytesIO()
    Image.new("RGBA", (width, height), (120, 110, 240, 255)).save(buffer, format="PNG")
    return SimpleUploadedFile("cover.png", buffer.getvalue(), content_type="image/png")


def test_profile_is_singleton():
    Profile.objects.create(full_name="First", headline="Dev")
    Profile(full_name="Second", headline="Dev").save()

    assert Profile.objects.count() == 1
    assert Profile.load().full_name == "Second"


def test_project_slug_is_generated_and_unique():
    first = Project.objects.create(title="Moon App", summary="One")
    second = Project.objects.create(title="Moon App", summary="Two")

    assert first.slug == "moon-app"
    assert second.slug == "moon-app-2"


def test_uploaded_cover_is_resized_to_webp():
    project = Project.objects.create(title="Big", summary="Large cover", cover=_png(3000, 1500))

    assert project.cover.name.endswith(".webp")
    with Image.open(project.cover.path) as image:
        assert image.format == "WEBP"
        assert max(image.size) == 2000


def test_split_lines_strips_bullets():
    assert split_lines("- one\n\n• two\n  three  ") == ["one", "two", "three"]

"""sitemap.xml with one entry per language and hreflang alternates (uk, en, x-default)."""

from django.conf import settings
from django.http import HttpRequest, HttpResponse
from django.utils.html import escape
from django.views.decorators.cache import cache_control
from django.views.decorators.http import require_GET

from .models import Product

# Frontend routes without the language prefix. Keep in sync with frontend/src/routes.
STATIC_PATHS = (
    "",
    "products",
    "prices",
    "support",
    "about",
    "contacts",
    "legal/offer",
    "legal/privacy",
    "legal/terms",
    "legal/refund",
    "legal/cookies",
)


def site_urls() -> list[dict]:
    paths = list(STATIC_PATHS) + [
        f"products/{slug}"
        for slug in Product.objects.filter(
            publish_status=Product.PublishStatus.PUBLISHED, is_private=False
        ).values_list("slug", flat=True)
    ]
    domain = settings.COMPANY.get("site.domain", "localhost")
    languages = settings.COMPANY.get("site.languages", ["uk", "en"])
    default = settings.COMPANY.get("site.default_language", "uk")
    entries = []
    for path in paths:
        suffix = f"/{path}" if path else ""
        alternates = {lang: f"https://{domain}/{lang}{suffix}" for lang in languages}
        alternates["x-default"] = alternates[default]
        for lang in languages:
            entries.append({"loc": alternates[lang], "alternates": alternates})
    return entries


@require_GET
@cache_control(public=True, max_age=3600)
def sitemap_view(request: HttpRequest) -> HttpResponse:
    items = []
    for entry in site_urls():
        links = "".join(
            f'<xhtml:link rel="alternate" hreflang="{lang}" href="{escape(href)}"/>'
            for lang, href in entry["alternates"].items()
        )
        items.append(f"<url><loc>{escape(entry['loc'])}</loc>{links}</url>")
    body = (
        '<?xml version="1.0" encoding="UTF-8"?>\n'
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" '
        'xmlns:xhtml="http://www.w3.org/1999/xhtml">\n' + "\n".join(items) + "\n</urlset>\n"
    )
    return HttpResponse(body, content_type="application/xml; charset=utf-8")

from django.conf import settings
from django.http import HttpRequest, HttpResponse, JsonResponse
from django.views.decorators.cache import cache_control
from django.views.decorators.http import require_GET


def site_flags() -> dict:
    """Environment flags the frontend needs to decide on badges and indexing."""
    return {
        "environment": settings.SITE_ENV,
        "has_placeholders": settings.COMPANY.has_placeholders,
        "show_test_data_badge": settings.SITE_ENV != "production"
        and settings.COMPANY.has_placeholders,
        "indexable": settings.SITE_ENV == "production" and not settings.COMPANY.has_placeholders,
    }


@require_GET
@cache_control(public=True, max_age=300)
def company_view(request: HttpRequest) -> JsonResponse:
    """Public company data straight from config/company.json plus environment flags."""
    return JsonResponse({"company": settings.COMPANY.public(), "flags": site_flags()})


@require_GET
@cache_control(public=True, max_age=3600)
def robots_view(request: HttpRequest) -> HttpResponse:
    if site_flags()["indexable"]:
        domain = settings.COMPANY.get("site.domain")
        body = f"User-agent: *\nAllow: /\nDisallow: /admin/\nDisallow: /api/\n\nSitemap: https://{domain}/sitemap.xml\n"
    else:
        # Placeholder data or non-production environment: keep the whole site out of search.
        body = "User-agent: *\nDisallow: /\n"
    return HttpResponse(body, content_type="text/plain; charset=utf-8")

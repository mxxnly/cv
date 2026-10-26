from django.urls import path

from .sitemap import sitemap_view
from .views import (
    ContactView,
    PriceListView,
    ProductDetailView,
    ProductListView,
    SiteContentView,
    SupportView,
)

# /api/health/ is answered by HealthCheckMiddleware; /api/company/ lives in apps.core.
api_urlpatterns = [
    path("products/", ProductListView.as_view(), name="products"),
    path("products/<slug:slug>/", ProductDetailView.as_view(), name="product-detail"),
    path("prices/", PriceListView.as_view(), name="prices"),
    path("site/", SiteContentView.as_view(), name="site-content"),
    path("contact/", ContactView.as_view(), name="contact"),
    path("support/", SupportView.as_view(), name="support"),
]

root_urlpatterns = [
    path("sitemap.xml", sitemap_view, name="sitemap"),
]

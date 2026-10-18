from django.urls import path

from .views import ContactView, PortfolioView

# /api/health/ is answered by HealthCheckMiddleware (before host validation).
urlpatterns = [
    path("portfolio/", PortfolioView.as_view(), name="portfolio"),
    path("contact/", ContactView.as_view(), name="contact"),
]

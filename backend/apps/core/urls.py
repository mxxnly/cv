from django.urls import path

from .views import company_view, robots_view

urlpatterns = [
    path("api/company/", company_view, name="company"),
    path("robots.txt", robots_view, name="robots"),
]

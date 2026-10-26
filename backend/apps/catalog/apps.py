from django.apps import AppConfig


class CatalogConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "apps.catalog"
    verbose_name = "Каталог"

    def ready(self):
        from . import models
        from .versioning import connect_signals

        connect_signals(
            (
                models.Category,
                models.Product,
                models.Plan,
                models.ProductLink,
                models.ProductFAQ,
                models.Testimonial,
                models.SiteSettings,
            )
        )

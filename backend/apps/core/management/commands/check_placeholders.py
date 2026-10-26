import os

from django.conf import settings
from django.core.management.base import BaseCommand, CommandError


class Command(BaseCommand):
    help = (
        "List placeholder fields in config/company.json. Exits with an error when a production "
        "build/deploy is attempted while placeholders remain (unless ALLOW_PLACEHOLDERS=1)."
    )

    def add_arguments(self, parser):
        parser.add_argument(
            "--strict",
            action="store_true",
            help="Fail whenever placeholders exist, regardless of the environment.",
        )

    def handle(self, *args, strict: bool = False, **options):
        company = settings.COMPANY
        if not company.has_placeholders:
            self.stdout.write(self.style.SUCCESS("company.json: no placeholders left."))
            return

        self.stdout.write(f"company.json ({company.path}) still has placeholder fields:")
        for item in company.placeholders:
            self.stdout.write(f"  - {item}")

        production = (
            not settings.DEBUG
            or os.environ.get("NODE_ENV") == "production"
            or os.environ.get("SITE_ENV") == "production"
        )
        allowed = os.environ.get("ALLOW_PLACEHOLDERS", "").strip().lower() in {"1", "true", "yes"}
        if strict or (production and not allowed):
            raise CommandError(
                "Production build is blocked until every placeholder in config/company.json is "
                "replaced with real data (see README → «Замінити перед запуском»). "
                "For staging set ALLOW_PLACEHOLDERS=1."
            )
        self.stdout.write(self.style.WARNING("Placeholders allowed in this environment."))

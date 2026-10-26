"""
Django settings for the MXXNLY Labs site.

All environment-specific values come from environment variables (see `.env.example`);
all company data comes from config/company.json (see `apps.core.company`).
"""

import os
import tempfile
from pathlib import Path

from django.core.exceptions import ImproperlyConfigured
from django.urls import reverse_lazy

from apps.core.company import load_company

BASE_DIR = Path(__file__).resolve().parent.parent


def env(name: str, default: str = "") -> str:
    return os.environ.get(name, default)


def env_bool(name: str, default: bool = False) -> bool:
    return env(name, str(int(default))).strip().lower() in {"1", "true", "yes", "on"}


def env_list(name: str, default: str = "") -> list[str]:
    return [item.strip() for item in env(name, default).split(",") if item.strip()]


# ========== CORE ==========
DEBUG = env_bool("DEBUG", False)
SECRET_KEY = env("SECRET_KEY", "dev-insecure-secret-key" if DEBUG else "")
if not SECRET_KEY:
    raise ImproperlyConfigured("SECRET_KEY must be set when DEBUG is off.")

# development | staging | production. Controls the «Тестові дані» badge and the placeholder gate.
SITE_ENV = env("SITE_ENV", "development" if DEBUG else "production")
ALLOW_PLACEHOLDERS = env_bool("ALLOW_PLACEHOLDERS", False)

# ========== COMPANY ==========
# Single source of company data (brand, seller, contacts, analytics ids). Never hard-code these.
COMPANY = load_company(env("COMPANY_CONFIG") or None)
SITE_NAME = COMPANY.get("brand.name", "MXXNLY Labs")

ALLOWED_HOSTS = env_list("ALLOWED_HOSTS", "localhost,127.0.0.1")
CSRF_TRUSTED_ORIGINS = env_list("CSRF_TRUSTED_ORIGINS", "http://localhost,http://127.0.0.1")

INSTALLED_APPS = [
    "unfold",
    "unfold.contrib.filters",
    "unfold.contrib.forms",
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "rest_framework",
    "apps.core",
    "apps.portfolio",
    "django_cleanup.apps.CleanupConfig",
]

MIDDLEWARE = [
    "apps.core.middleware.HealthCheckMiddleware",
    "django.middleware.security.SecurityMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.locale.LocaleMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
    # noindex for the whole site while placeholder data remains (see config/company.json).
    "apps.core.middleware.PlaceholderNoindexMiddleware",
]

ROOT_URLCONF = "config.urls"
WSGI_APPLICATION = "config.wsgi.application"
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

# ========== DATABASE ==========
# PostgreSQL inside Docker, SQLite fallback for quick local runs and CI.
if env("POSTGRES_HOST"):
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.postgresql",
            "NAME": env("POSTGRES_DB", "portfolio"),
            "USER": env("POSTGRES_USER", "portfolio"),
            "PASSWORD": env("POSTGRES_PASSWORD"),
            "HOST": env("POSTGRES_HOST"),
            "PORT": env("POSTGRES_PORT", "5432"),
            "CONN_MAX_AGE": 60,
            "CONN_HEALTH_CHECKS": True,
        }
    }
else:
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.sqlite3",
            "NAME": BASE_DIR / "db.sqlite3",
        }
    }

CACHES = {
    "default": {
        "BACKEND": "django.core.cache.backends.filebased.FileBasedCache",
        "LOCATION": Path(tempfile.gettempdir()) / "mxxnly-labs-cache",
    }
}

AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

# ========== I18N ==========
LANGUAGE_CODE = "en"
LANGUAGES = [("en", "English")]
TIME_ZONE = env("TIME_ZONE", "Europe/Kyiv")
USE_I18N = True
USE_TZ = True

# ========== STATIC & MEDIA ==========
STATIC_URL = "/static/"
STATIC_ROOT = BASE_DIR / "staticfiles"
MEDIA_URL = "/media/"
MEDIA_ROOT = BASE_DIR / "media"

STORAGES = {
    "default": {"BACKEND": "django.core.files.storage.FileSystemStorage"},
    "staticfiles": {
        "BACKEND": (
            "django.contrib.staticfiles.storage.StaticFilesStorage"
            if DEBUG
            else "whitenoise.storage.CompressedManifestStaticFilesStorage"
        )
    },
}

FILE_UPLOAD_MAX_MEMORY_SIZE = 10 * 1024 * 1024
DATA_UPLOAD_MAX_MEMORY_SIZE = 25 * 1024 * 1024

# ========== SECURITY ==========
# Traefik/nginx terminate TLS and pass the original scheme in X-Forwarded-Proto.
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
USE_X_FORWARDED_HOST = True
X_FRAME_OPTIONS = "SAMEORIGIN"
SECURE_CONTENT_TYPE_NOSNIFF = True
SECURE_REFERRER_POLICY = "strict-origin-when-cross-origin"

if env_bool("DJANGO_SECURE", False):
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
    SECURE_HSTS_SECONDS = 60 * 60 * 24 * 30
    SECURE_HSTS_INCLUDE_SUBDOMAINS = True

# ========== DRF ==========
REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": [],
    "DEFAULT_PERMISSION_CLASSES": ["rest_framework.permissions.AllowAny"],
    "DEFAULT_RENDERER_CLASSES": ["rest_framework.renderers.JSONRenderer"]
    + (["rest_framework.renderers.BrowsableAPIRenderer"] if DEBUG else []),
    "DEFAULT_PARSER_CLASSES": ["rest_framework.parsers.JSONParser"],
    "DEFAULT_THROTTLE_RATES": {"contact": env("CONTACT_THROTTLE_RATE", "5/hour")},
    # Number of reverse proxies in front of Django (nginx = 1, traefik + nginx = 2).
    "NUM_PROXIES": int(env("NUM_PROXIES", "1")),
}

# ========== NOTIFICATIONS (contact form) ==========
EMAIL_BACKEND = (
    "django.core.mail.backends.smtp.EmailBackend"
    if env("EMAIL_HOST")
    else "django.core.mail.backends.console.EmailBackend"
)
EMAIL_HOST = env("EMAIL_HOST")
EMAIL_PORT = int(env("EMAIL_PORT", "587"))
EMAIL_HOST_USER = env("EMAIL_HOST_USER")
EMAIL_HOST_PASSWORD = env("EMAIL_HOST_PASSWORD")
EMAIL_USE_TLS = env_bool("EMAIL_USE_TLS", True)
DEFAULT_FROM_EMAIL = env("DEFAULT_FROM_EMAIL", EMAIL_HOST_USER or f"noreply@{COMPANY.get('site.domain', 'localhost')}")
CONTACT_NOTIFY_EMAIL = env("CONTACT_NOTIFY_EMAIL")
TELEGRAM_BOT_TOKEN = env("TELEGRAM_BOT_TOKEN")
TELEGRAM_CHAT_ID = env("TELEGRAM_CHAT_ID")

# ========== LOGGING ==========
LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {"simple": {"format": "[{asctime}] mxxnly-labs {levelname} {name}: {message}", "style": "{"}},
    "handlers": {"console": {"class": "logging.StreamHandler", "formatter": "simple"}},
    "root": {"handlers": ["console"], "level": env("LOG_LEVEL", "INFO")},
    "loggers": {"django.db.backends": {"level": "WARNING"}},
}


# ========== ADMIN (Unfold) ==========
def environment_callback(request):
    colors = {"development": "warning", "staging": "info", "production": "success"}
    return [SITE_ENV.capitalize(), colors.get(SITE_ENV, "warning")]


UNFOLD = {
    "SITE_TITLE": SITE_NAME,
    "SITE_HEADER": SITE_NAME,
    "SITE_SUBHEADER": "Адмінка продуктів і цін",
    "SITE_SYMBOL": "science",
    "SITE_URL": "/",
    "SHOW_HISTORY": True,
    "SHOW_VIEW_ON_SITE": True,
    "SHOW_BACK_BUTTON": True,
    "ENVIRONMENT": "config.settings.environment_callback",
    "COLORS": {
        "base": {
            "50": "oklch(98.5% .003 275)",
            "100": "oklch(96.5% .005 275)",
            "200": "oklch(92.5% .008 275)",
            "300": "oklch(86.5% .012 275)",
            "400": "oklch(70.5% .02 275)",
            "500": "oklch(55% .025 275)",
            "600": "oklch(44.5% .028 275)",
            "700": "oklch(37% .03 275)",
            "800": "oklch(27.5% .028 275)",
            "900": "oklch(20.5% .026 275)",
            "950": "oklch(13.5% .022 275)",
        },
        "primary": {
            "50": "oklch(97.5% .013 282)",
            "100": "oklch(94.5% .027 282)",
            "200": "oklch(89.5% .052 282)",
            "300": "oklch(82% .092 282)",
            "400": "oklch(72% .14 282)",
            "500": "oklch(63% .175 282)",
            "600": "oklch(55% .19 282)",
            "700": "oklch(48% .175 282)",
            "800": "oklch(40.5% .145 282)",
            "900": "oklch(34% .11 282)",
            "950": "oklch(24.5% .08 282)",
        },
    },
    "SIDEBAR": {
        "show_search": True,
        "show_all_applications": False,
        "navigation": [
            {
                "title": "About",
                "items": [
                    {
                        "title": "Profile",
                        "icon": "person",
                        "link": reverse_lazy("admin:portfolio_profile_changelist"),
                    },
                    {
                        "title": "Services",
                        "icon": "auto_awesome",
                        "link": reverse_lazy("admin:portfolio_service_changelist"),
                    },
                ],
            },
            {
                "title": "Skills",
                "separator": True,
                "items": [
                    {
                        "title": "Skills",
                        "icon": "bolt",
                        "link": reverse_lazy("admin:portfolio_skill_changelist"),
                    },
                    {
                        "title": "Skill categories",
                        "icon": "category",
                        "link": reverse_lazy("admin:portfolio_skillcategory_changelist"),
                    },
                ],
            },
            {
                "title": "Projects",
                "separator": True,
                "items": [
                    {
                        "title": "Projects",
                        "icon": "rocket_launch",
                        "link": reverse_lazy("admin:portfolio_project_changelist"),
                    },
                    {
                        "title": "Project categories",
                        "icon": "folder_open",
                        "link": reverse_lazy("admin:portfolio_projectcategory_changelist"),
                    },
                ],
            },
            {
                "title": "Career",
                "separator": True,
                "items": [
                    {
                        "title": "Experience & education",
                        "icon": "work_history",
                        "link": reverse_lazy("admin:portfolio_experience_changelist"),
                    },
                    {
                        "title": "Certificates",
                        "icon": "workspace_premium",
                        "link": reverse_lazy("admin:portfolio_certificate_changelist"),
                    },
                    {
                        "title": "Testimonials",
                        "icon": "format_quote",
                        "link": reverse_lazy("admin:portfolio_testimonial_changelist"),
                    },
                ],
            },
            {
                "title": "Inbox",
                "separator": True,
                "items": [
                    {
                        "title": "Messages",
                        "icon": "mail",
                        "link": reverse_lazy("admin:portfolio_contactmessage_changelist"),
                        "badge": "apps.portfolio.admin.unread_messages_badge",
                    },
                ],
            },
            {
                "title": "Access",
                "separator": True,
                "collapsible": True,
                "items": [
                    {
                        "title": "Users",
                        "icon": "people",
                        "link": reverse_lazy("admin:auth_user_changelist"),
                    },
                    {
                        "title": "Groups",
                        "icon": "group",
                        "link": reverse_lazy("admin:auth_group_changelist"),
                    },
                ],
            },
        ],
    },
}

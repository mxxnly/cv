"""Public API: read-only catalog endpoints with cache + ETag, plus the two form endpoints."""

import hashlib
import json
import logging

from django.conf import settings
from django.core.cache import cache
from django.db.models import Prefetch
from django.http import Http404
from rest_framework import status
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView

from .models import Plan, Product, SiteSettings, Testimonial
from .notifications import notify_new_entry
from .serializers import (
    ContactMessageSerializer,
    ProductDetailSerializer,
    ProductListSerializer,
    SiteSettingsSerializer,
    SupportRequestSerializer,
    TestimonialSerializer,
)
from .turnstile import verify_turnstile
from .versioning import catalog_version

logger = logging.getLogger(__name__)

CACHE_TTL = 300
PUBLIC_CACHE_CONTROL = "public, max-age=60, stale-while-revalidate=300"


def request_lang(request: Request) -> str:
    lang = request.query_params.get("lang") or request.headers.get("Accept-Language", "uk")[:2]
    return lang if lang in ("uk", "en") else settings.COMPANY.get("site.default_language", "uk")


def public_products():
    return (
        Product.objects.filter(publish_status=Product.PublishStatus.PUBLISHED, is_private=False)
        .select_related("category")
        .prefetch_related(
            Prefetch("plans", queryset=Plan.objects.filter(is_published=True)), "links", "faq"
        )
    )


class CachedReadView(APIView):
    """GET view whose JSON body is cached per (name, lang, catalog version) and served with an ETag.

    The catalog version is bumped by signals whenever catalog content changes (see versioning.py),
    so a change in the admin is visible within one request while unchanged data costs one cache hit.
    """

    cache_name = ""

    def build(self, request: Request, lang: str, **kwargs) -> dict | list:
        raise NotImplementedError

    def get(self, request: Request, **kwargs) -> Response:
        lang = request_lang(request)
        version = catalog_version()
        key_source = f"{self.cache_name}:{lang}:{version}:{json.dumps(kwargs, sort_keys=True)}"
        etag = 'W/"' + hashlib.sha256(key_source.encode()).hexdigest()[:24] + '"'
        if request.headers.get("If-None-Match") == etag:
            response = Response(status=status.HTTP_304_NOT_MODIFIED)
        else:
            cache_key = "catalog:" + hashlib.sha256(key_source.encode()).hexdigest()
            data = cache.get(cache_key)
            if data is None:
                data = self.build(request, lang, **kwargs)
                cache.set(cache_key, data, CACHE_TTL)
            response = Response(data)
        response["ETag"] = etag
        response["Cache-Control"] = PUBLIC_CACHE_CONTROL
        response["Vary"] = "Accept-Language"
        response["Content-Language"] = lang
        return response


class ProductListView(CachedReadView):
    cache_name = "products"

    def build(self, request, lang):
        return ProductListSerializer(public_products(), many=True, context={"lang": lang}).data


class ProductDetailView(CachedReadView):
    cache_name = "product"

    def build(self, request, lang, slug: str):
        product = public_products().filter(slug=slug).first()
        if product is None:
            raise Http404
        return ProductDetailSerializer(product, context={"lang": lang}).data


class PriceListView(CachedReadView):
    """Every published plan of every public product: the page an ad can link to."""

    cache_name = "prices"

    def build(self, request, lang):
        products = [p for p in public_products() if p.public_plans()]
        company = settings.COMPANY
        return {
            "currency": company.get("pricing.currency", "USD"),
            "tax_note": company.get(f"pricing.tax_note.{lang}")
            or company.get("pricing.tax_note.uk", ""),
            "refund_days": company.get("pricing.refund_days", 14),
            "note": SiteSettings.load().localized("price_note", lang),
            "products": ProductDetailSerializer(products, many=True, context={"lang": lang}).data,
        }


class SiteContentView(CachedReadView):
    """Editable texts (SLA, notes, about) plus visible testimonials for the home page."""

    cache_name = "site"

    def build(self, request, lang):
        settings_obj = SiteSettings.load()
        testimonials = (
            Testimonial.objects.filter(is_visible=True).select_related("product")
            if settings_obj.testimonials_enabled
            else Testimonial.objects.none()
        )
        return {
            "settings": SiteSettingsSerializer(settings_obj, context={"lang": lang}).data,
            "testimonials": TestimonialSerializer(testimonials, many=True).data,
        }


# ========== FORMS ==========
class FormView(APIView):
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "forms"
    serializer_class = None
    kind = ""

    def post(self, request: Request) -> Response:
        serializer = self.serializer_class(data=request.data)
        serializer.is_valid(raise_exception=True)

        # Bots that fill the honeypot get a fake success and nothing is stored.
        if serializer.validated_data.get("website"):
            return Response({"ok": True}, status=status.HTTP_201_CREATED)

        if settings.TURNSTILE_SECRET_KEY:
            token = serializer.validated_data.get("turnstile_token", "")
            if not verify_turnstile(token, self.client_ip(request)):
                return Response(
                    {
                        "turnstile_token": [
                            "Перевірка не пройдена. Оновіть сторінку і спробуйте ще раз."
                        ]
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

        entry = serializer.save(ip_hash=self.ip_hash(request))
        logger.info("%s #%s received", self.kind, entry.pk)  # no personal data in logs
        notify_new_entry(entry)
        return Response({"ok": True, "id": entry.pk}, status=status.HTTP_201_CREATED)

    def client_ip(self, request: Request) -> str:
        # Same proxy-aware logic DRF uses for throttling (respects NUM_PROXIES).
        return self.get_throttles()[0].get_ident(request) or ""

    def ip_hash(self, request: Request) -> str:
        ip = self.client_ip(request)
        return hashlib.sha256(f"{ip}:{settings.SECRET_KEY}".encode()).hexdigest()[:32] if ip else ""


class ContactView(FormView):
    serializer_class = ContactMessageSerializer
    kind = "contact message"


class SupportView(FormView):
    serializer_class = SupportRequestSerializer
    kind = "support request"

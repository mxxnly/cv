"""Read-only serializers for the public API.

Each serializer localises bilingual fields via ``context["lang"]``.
"""

from django.conf import settings
from rest_framework import serializers

from .models import (
    ATTRIBUTION_KEYS,
    ContactMessage,
    Plan,
    Product,
    ProductFAQ,
    ProductLink,
    SiteSettings,
    SupportRequest,
    Testimonial,
    split_lines,
    split_paragraphs,
)


class LocalizedSerializer(serializers.ModelSerializer):
    @property
    def lang(self) -> str:
        return self.context.get("lang", "uk")

    def text(self, obj, field: str) -> str:
        return obj.localized(field, self.lang)


class PlanSerializer(LocalizedSerializer):
    limit = serializers.SerializerMethodField()
    includes = serializers.SerializerMethodField()
    buy_url = serializers.SerializerMethodField()
    period_label = serializers.SerializerMethodField()

    class Meta:
        model = Plan
        fields = (
            "id",
            "slug",
            "name",
            "price",
            "currency",
            "period",
            "period_label",
            "limit",
            "includes",
            "is_example",
            "is_recommended",
            "valid_until",
            "buy_url",
        )

    def get_limit(self, obj: Plan) -> str:
        return self.text(obj, "limit")

    def get_includes(self, obj: Plan) -> list[str]:
        return split_lines(self.text(obj, "includes"))

    def get_buy_url(self, obj: Plan) -> str:
        if obj.buy_url:
            return obj.buy_url
        base = settings.COMPANY.get("payment.link_base", "")
        return f"{base}{obj.product.slug}/{obj.slug}" if base else ""

    def get_period_label(self, obj: Plan) -> str:
        labels = {
            "uk": {"month": "/ міс", "year": "/ рік", "once": "разово", "on_request": "за запитом"},
            "en": {"month": "/ mo", "year": "/ yr", "once": "one-time", "on_request": "on request"},
        }
        return labels.get(self.lang, labels["uk"])[obj.period]


class ProductLinkSerializer(LocalizedSerializer):
    label = serializers.SerializerMethodField()

    class Meta:
        model = ProductLink
        fields = ("kind", "label", "url")

    def get_label(self, obj: ProductLink) -> str:
        return self.text(obj, "label") or obj.get_kind_display()


class ProductFAQSerializer(LocalizedSerializer):
    question = serializers.SerializerMethodField()
    answer = serializers.SerializerMethodField()

    class Meta:
        model = ProductFAQ
        fields = ("question", "answer")

    def get_question(self, obj):
        return self.text(obj, "question")

    def get_answer(self, obj):
        return self.text(obj, "answer")


class MinPriceSerializer(PlanSerializer):
    class Meta(PlanSerializer.Meta):
        fields = ("price", "currency", "period", "period_label", "is_example")


class ProductListSerializer(LocalizedSerializer):
    tagline = serializers.SerializerMethodField()
    category = serializers.SerializerMethodField()
    min_price = serializers.SerializerMethodField()
    links = serializers.SerializerMethodField()
    has_example_prices = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = (
            "id",
            "slug",
            "name",
            "tagline",
            "category",
            "availability",
            "tint",
            "icon",
            "cta",
            "min_price",
            "has_example_prices",
            "links",
            "prices_updated_at",
        )

    def get_tagline(self, obj):
        return self.text(obj, "tagline")

    def get_category(self, obj):
        return (
            {"slug": obj.category.slug, "name": obj.category.localized("name", self.lang)}
            if obj.category
            else None
        )

    def get_min_price(self, obj):
        plan = obj.min_plan()
        return MinPriceSerializer(plan, context=self.context).data if plan else None

    def get_has_example_prices(self, obj):
        return any(plan.is_example for plan in obj.public_plans())

    def get_links(self, obj):
        return ProductLinkSerializer(obj.links.all(), many=True, context=self.context).data


class ProductDetailSerializer(ProductListSerializer):
    description = serializers.SerializerMethodField()
    features = serializers.SerializerMethodField()
    audience = serializers.SerializerMethodField()
    support_terms = serializers.SerializerMethodField()
    plans = serializers.SerializerMethodField()
    faq = serializers.SerializerMethodField()
    seo = serializers.SerializerMethodField()

    class Meta(ProductListSerializer.Meta):
        fields = (
            *ProductListSerializer.Meta.fields,
            "description",
            "features",
            "audience",
            "support_terms",
            "plans",
            "faq",
            "seo",
        )

    def get_description(self, obj):
        return split_paragraphs(self.text(obj, "description"))

    def get_features(self, obj):
        return split_lines(self.text(obj, "features"))

    def get_audience(self, obj):
        return split_lines(self.text(obj, "audience"))

    def get_support_terms(self, obj):
        return split_paragraphs(self.text(obj, "support_terms"))

    def get_plans(self, obj):
        return PlanSerializer(obj.public_plans(), many=True, context=self.context).data

    def get_faq(self, obj):
        return ProductFAQSerializer(obj.faq.all(), many=True, context=self.context).data

    def get_seo(self, obj):
        return {
            "title": self.text(obj, "seo_title") or obj.name,
            "description": self.text(obj, "seo_description") or self.text(obj, "tagline"),
        }


class TestimonialSerializer(serializers.ModelSerializer):
    product = serializers.SlugRelatedField(slug_field="slug", read_only=True)

    class Meta:
        model = Testimonial
        fields = ("id", "author", "role", "company", "text", "language", "url", "product")


class SiteSettingsSerializer(LocalizedSerializer):
    support_sla = serializers.SerializerMethodField()
    price_note = serializers.SerializerMethodField()
    about = serializers.SerializerMethodField()

    class Meta:
        model = SiteSettings
        fields = (
            "support_sla",
            "price_note",
            "about",
            "about_is_placeholder",
            "testimonials_enabled",
        )

    def get_support_sla(self, obj):
        return self.text(obj, "support_sla")

    def get_price_note(self, obj):
        return self.text(obj, "price_note")

    def get_about(self, obj):
        return split_paragraphs(self.text(obj, "about"))


# ========== FORMS ==========
class AttributionField(serializers.DictField):
    """Only known UTM/gclid keys, each trimmed to 200 characters; everything else is dropped."""

    child = serializers.CharField(allow_blank=True, max_length=500)

    def to_internal_value(self, data):
        data = super().to_internal_value(data)
        return {k: str(v)[:200] for k, v in data.items() if k in ATTRIBUTION_KEYS and v}


class FormSerializerMixin(serializers.Serializer):
    # Honeypot: real users never see this field, bots usually fill it.
    website = serializers.CharField(required=False, allow_blank=True, write_only=True)
    turnstile_token = serializers.CharField(required=False, allow_blank=True, write_only=True)
    attribution = AttributionField(required=False)
    product = serializers.SlugRelatedField(
        slug_field="slug", queryset=Product.objects.all(), required=False, allow_null=True
    )
    language = serializers.ChoiceField(choices=["uk", "en"], required=False, default="uk")

    def create(self, validated_data):
        validated_data.pop("website", None)
        validated_data.pop("turnstile_token", None)
        return super().create(validated_data)


class ContactMessageSerializer(FormSerializerMixin, serializers.ModelSerializer):
    class Meta:
        model = ContactMessage
        fields = (
            "name",
            "email",
            "topic",
            "message",
            "product",
            "language",
            "attribution",
            "website",
            "turnstile_token",
        )
        extra_kwargs = {"name": {"min_length": 2}, "message": {"min_length": 10}}


class SupportRequestSerializer(FormSerializerMixin, serializers.ModelSerializer):
    class Meta:
        model = SupportRequest
        fields = (
            "name",
            "email",
            "subject",
            "message",
            "product",
            "language",
            "attribution",
            "website",
            "turnstile_token",
        )
        extra_kwargs = {
            "name": {"min_length": 2},
            "subject": {"min_length": 3},
            "message": {"min_length": 10},
        }

from django.conf import settings
from django.contrib import admin, messages
from django.contrib.auth.admin import GroupAdmin as BaseGroupAdmin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.contrib.auth.models import Group, User
from django.db.models import QuerySet
from django.http import HttpRequest, HttpResponseRedirect
from django.urls import reverse
from django.utils.html import format_html
from unfold.admin import ModelAdmin, StackedInline, TabularInline
from unfold.decorators import action, display
from unfold.forms import AdminPasswordChangeForm, UserChangeForm, UserCreationForm

from .models import (
    Category,
    ContactMessage,
    Plan,
    PriceHistory,
    Product,
    ProductFAQ,
    ProductLink,
    SiteSettings,
    SupportRequest,
    Testimonial,
)
from .versioning import bump_catalog_version

admin.site.site_header = settings.SITE_NAME
admin.site.site_title = settings.SITE_NAME
admin.site.index_title = "Керування сайтом"


def unread_messages_badge(request: HttpRequest) -> int | None:
    return ContactMessage.objects.filter(is_read=False).count() or None


def open_support_badge(request: HttpRequest) -> int | None:
    return SupportRequest.objects.exclude(status=SupportRequest.Status.RESOLVED).count() or None


# ========== AUTH ==========
admin.site.unregister(User)
admin.site.unregister(Group)


@admin.register(User)
class UserAdmin(BaseUserAdmin, ModelAdmin):
    form = UserChangeForm
    add_form = UserCreationForm
    change_password_form = AdminPasswordChangeForm


@admin.register(Group)
class GroupAdmin(BaseGroupAdmin, ModelAdmin):
    pass


# ========== CATALOG ==========
@admin.register(Category)
class CategoryAdmin(ModelAdmin):
    list_display = ("name_uk", "name_en", "slug", "order")
    list_editable = ("order",)
    prepopulated_fields = {"slug": ("name_en",)}


class PlanInline(TabularInline):
    model = Plan
    extra = 0
    fields = (
        "name",
        "price",
        "currency",
        "period",
        "limit_uk",
        "is_example",
        "is_published",
        "is_recommended",
        "order",
    )
    ordering_field = "order"
    hide_ordering_field = True
    show_change_link = True
    tab = True


class ProductLinkInline(TabularInline):
    model = ProductLink
    extra = 0
    fields = ("kind", "label_uk", "label_en", "url", "order")
    ordering_field = "order"
    hide_ordering_field = True
    tab = True


class ProductFAQInline(StackedInline):
    model = ProductFAQ
    extra = 0
    fields = (("question_uk", "question_en"), ("answer_uk", "answer_en"), "order")
    ordering_field = "order"
    hide_ordering_field = True
    tab = True


@admin.register(Product)
class ProductAdmin(ModelAdmin):
    inlines = (PlanInline, ProductLinkInline, ProductFAQInline)
    list_display = (
        "name",
        "availability_badge",
        "publish_badge",
        "is_private",
        "min_price_display",
        "prices_updated_at",
        "order",
    )
    list_editable = ("order",)
    list_filter = ("publish_status", "availability", "is_private", "category")
    search_fields = ("name", "slug", "tagline_uk", "tagline_en")
    readonly_fields = ("prices_updated_at", "created_at", "updated_at")
    actions = ("publish", "unpublish")
    warn_unsaved_form = True
    fieldsets = (
        (
            "Основне",
            {
                "classes": ("tab",),
                "fields": (
                    "name",
                    "slug",
                    "category",
                    ("availability", "publish_status", "is_private"),
                    ("tint", "icon", "cta"),
                ),
            },
        ),
        (
            "Тексти (uk)",
            {
                "classes": ("tab",),
                "fields": (
                    "tagline_uk",
                    "description_uk",
                    "features_uk",
                    "audience_uk",
                    "support_terms_uk",
                ),
            },
        ),
        (
            "Texts (en)",
            {
                "classes": ("tab",),
                "fields": (
                    "tagline_en",
                    "description_en",
                    "features_en",
                    "audience_en",
                    "support_terms_en",
                ),
            },
        ),
        (
            "SEO",
            {
                "classes": ("tab",),
                "fields": (
                    ("seo_title_uk", "seo_title_en"),
                    ("seo_description_uk", "seo_description_en"),
                ),
            },
        ),
        (
            "Службове",
            {"classes": ("tab",), "fields": ("prices_updated_at", "created_at", "updated_at")},
        ),
    )

    @display(
        description="Статус", label={"available": "success", "beta": "info", "soon": "warning"}
    )
    def availability_badge(self, obj: Product):
        return obj.availability, obj.get_availability_display()

    @display(description="Публікація", label={"draft": "warning", "published": "success"})
    def publish_badge(self, obj: Product):
        return obj.publish_status, obj.get_publish_status_display()

    @display(description="Ціна від")
    def min_price_display(self, obj: Product):
        plan = obj.min_plan()
        if plan is None:
            return "—"
        example = ' <span style="opacity:.6">(приклад)</span>' if plan.is_example else ""
        return format_html(
            "{} {} {}{}", plan.price, plan.currency, plan.get_period_display(), format_html(example)
        )

    @action(description="Опублікувати")
    def publish(self, request: HttpRequest, queryset: QuerySet):
        count = queryset.update(publish_status=Product.PublishStatus.PUBLISHED)
        bump_catalog_version()  # update() bypasses signals
        self.message_user(request, f"Опубліковано: {count}", messages.SUCCESS)

    @action(description="Зняти з публікації")
    def unpublish(self, request: HttpRequest, queryset: QuerySet):
        count = queryset.update(publish_status=Product.PublishStatus.DRAFT)
        bump_catalog_version()
        self.message_user(request, f"Знято з публікації: {count}", messages.SUCCESS)


class PriceHistoryInline(TabularInline):
    model = PriceHistory
    extra = 0
    can_delete = False
    fields = ("changed_at", "old_price", "new_price", "currency", "note")
    readonly_fields = ("changed_at", "old_price", "new_price", "currency")
    ordering = ("-changed_at",)

    def has_add_permission(self, request, obj=None):
        return False


@admin.register(Plan)
class PlanAdmin(ModelAdmin):
    inlines = (PriceHistoryInline,)
    list_display = (
        "name",
        "product",
        "price",
        "currency",
        "period",
        "example_badge",
        "is_published",
        "is_recommended",
        "valid_until",
        "updated_at",
    )
    list_filter = ("product", "is_published", "is_example", "period")
    list_editable = ("is_published",)
    search_fields = ("name", "product__name")
    readonly_fields = ("created_at", "updated_at")
    fieldsets = (
        (
            None,
            {
                "fields": (
                    "product",
                    "name",
                    "slug",
                    ("price", "currency", "period"),
                    ("is_example", "is_published", "is_recommended"),
                    "valid_until",
                    "buy_url",
                )
            },
        ),
        ("Що входить", {"fields": (("limit_uk", "limit_en"), ("includes_uk", "includes_en"))}),
        ("Службове", {"fields": ("order", "created_at", "updated_at")}),
    )

    @display(description="Приклад", label={"yes": "warning", "no": "success"}, boolean=False)
    def example_badge(self, obj: Plan):
        return ("yes", "приклад") if obj.is_example else ("no", "справжня")


@admin.register(PriceHistory)
class PriceHistoryAdmin(ModelAdmin):
    list_display = ("changed_at", "plan", "old_price", "new_price", "currency", "note")
    list_filter = ("plan__product",)
    readonly_fields = ("plan", "old_price", "new_price", "currency", "changed_at")

    def has_add_permission(self, request):
        return False


@admin.register(Testimonial)
class TestimonialAdmin(ModelAdmin):
    list_display = ("author", "company", "product", "language", "is_visible", "order")
    list_editable = ("is_visible", "order")
    list_filter = ("is_visible", "language", "product")


# ========== INBOX ==========
class InboxAdmin(ModelAdmin):
    readonly_fields = (
        "name",
        "email",
        "message",
        "language",
        "product",
        "attribution",
        "ip_hash",
        "created_at",
    )
    search_fields = ("name", "email", "message")

    def has_add_permission(self, request):
        return False


@admin.register(ContactMessage)
class ContactMessageAdmin(InboxAdmin):
    list_display = ("name", "topic", "product", "created_at", "is_read")
    list_filter = ("is_read", "topic", "product")
    list_editable = ("is_read",)
    actions = ("mark_read",)

    @action(description="Позначити прочитаними")
    def mark_read(self, request, queryset):
        queryset.update(is_read=True)

    def change_view(self, request, object_id, form_url="", extra_context=None):
        ContactMessage.objects.filter(pk=object_id, is_read=False).update(is_read=True)
        return super().change_view(request, object_id, form_url, extra_context)


@admin.register(SupportRequest)
class SupportRequestAdmin(InboxAdmin):
    list_display = ("subject", "name", "product", "status", "created_at", "updated_at")
    list_filter = ("status", "product")
    list_editable = ("status",)
    readonly_fields = (*InboxAdmin.readonly_fields, "subject", "updated_at")


# ========== SETTINGS ==========
@admin.register(SiteSettings)
class SiteSettingsAdmin(ModelAdmin):
    fieldsets = (
        (
            "Підтримка й ціни",
            {"fields": (("support_sla_uk", "support_sla_en"), ("price_note_uk", "price_note_en"))},
        ),
        ("Про нас", {"fields": ("about_uk", "about_en", "about_is_placeholder")}),
        ("Блоки", {"fields": ("testimonials_enabled",)}),
    )

    def has_add_permission(self, request):
        return False

    def has_delete_permission(self, request, obj=None):
        return False

    def changelist_view(self, request, extra_context=None):
        obj = SiteSettings.load()
        return HttpResponseRedirect(reverse("admin:catalog_sitesettings_change", args=[obj.pk]))

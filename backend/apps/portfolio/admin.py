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
    Certificate,
    ContactMessage,
    Experience,
    Profile,
    Project,
    ProjectCategory,
    ProjectImage,
    Service,
    Skill,
    SkillCategory,
    SocialLink,
    Stat,
    Testimonial,
)

admin.site.site_header = settings.SITE_NAME
admin.site.site_title = settings.SITE_NAME
admin.site.index_title = "Керування сайтом"


def unread_messages_badge(request: HttpRequest) -> int | None:
    return ContactMessage.objects.filter(is_read=False).count() or None


def image_header(title: str, subtitle: str, image, squared: bool = True) -> list:
    """Row header for Unfold lists: title, subtitle, initials and an optional thumbnail."""
    picture = {"path": image.url, "squared": squared} if image else None
    initials = "".join(word[0] for word in title.split()[:2]).upper()
    return [title, subtitle, initials, picture]


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


# ========== PROFILE ==========
class StatInline(TabularInline):
    model = Stat
    extra = 0
    ordering_field = "order"
    hide_ordering_field = True
    tab = True
    verbose_name_plural = "Numbers"


class SocialLinkInline(TabularInline):
    model = SocialLink
    extra = 0
    fields = ("platform", "url", "label", "is_visible", "order")
    ordering_field = "order"
    hide_ordering_field = True
    tab = True


@admin.register(Profile)
class ProfileAdmin(ModelAdmin):
    inlines = (StatInline, SocialLinkInline)
    warn_unsaved_form = True
    fieldsets = (
        (
            "General",
            {
                "classes": ("tab",),
                "fields": (
                    "full_name",
                    "brand",
                    "headline",
                    "roles",
                    "tagline",
                    "avatar",
                    "about",
                ),
            },
        ),
        (
            "Contacts",
            {
                "classes": ("tab",),
                "fields": (
                    ("email", "phone"),
                    ("location", "timezone"),
                    ("is_available", "availability_text"),
                    "resume",
                    "contact_text",
                ),
            },
        ),
        (
            "Site & SEO",
            {
                "classes": ("tab",),
                "fields": ("language", "footer_text", "seo_title", "seo_description"),
            },
        ),
    )

    def has_add_permission(self, request: HttpRequest) -> bool:
        return False

    def has_delete_permission(self, request: HttpRequest, obj=None) -> bool:
        return False

    def changelist_view(self, request: HttpRequest, extra_context=None):
        # Singleton: the list page jumps straight to the only profile.
        profile = Profile.load()
        return HttpResponseRedirect(reverse("admin:portfolio_profile_change", args=[profile.pk]))

    def response_change(self, request: HttpRequest, obj):
        if "_continue" not in request.POST and "_addanother" not in request.POST:
            self.message_user(request, "Profile saved ✨", messages.SUCCESS)
            return HttpResponseRedirect(request.path)
        return super().response_change(request, obj)


# ========== SERVICES ==========
@admin.register(Service)
class ServiceAdmin(ModelAdmin):
    list_display = ("title", "icon", "is_visible")
    list_editable = ("is_visible",)
    search_fields = ("title", "description")
    ordering_field = "order"
    hide_ordering_field = True


# ========== SKILLS ==========
class SkillInline(TabularInline):
    model = Skill
    extra = 0
    fields = ("name", "level", "is_featured", "is_visible", "order")
    ordering_field = "order"
    hide_ordering_field = True


@admin.register(SkillCategory)
class SkillCategoryAdmin(ModelAdmin):
    list_display = ("name", "description", "skills_count")
    search_fields = ("name",)
    inlines = (SkillInline,)
    ordering_field = "order"
    hide_ordering_field = True

    @display(description="Skills")
    def skills_count(self, obj: SkillCategory) -> int:
        return obj.skills.count()


@admin.register(Skill)
class SkillAdmin(ModelAdmin):
    list_display = ("name", "category", "level", "is_featured", "is_visible")
    list_editable = ("level", "is_featured", "is_visible")
    list_filter = ("category", "level", "is_featured", "is_visible")
    list_filter_submit = True
    search_fields = ("name",)
    ordering_field = "order"
    hide_ordering_field = True


# ========== PROJECTS ==========
@admin.register(ProjectCategory)
class ProjectCategoryAdmin(ModelAdmin):
    list_display = ("name", "slug")
    prepopulated_fields = {"slug": ("name",)}
    search_fields = ("name",)
    ordering_field = "order"
    hide_ordering_field = True


class ProjectImageInline(StackedInline):
    model = ProjectImage
    extra = 0
    fields = ("image", "caption", "order")
    ordering_field = "order"
    hide_ordering_field = True
    tab = True


@admin.register(Project)
class ProjectAdmin(ModelAdmin):
    list_display = (
        "project_header",
        "category",
        "status_label",
        "year",
        "is_featured",
        "is_visible",
    )
    list_display_links = ("project_header",)
    list_editable = ("is_featured", "is_visible")
    list_filter = ("category", "status", "is_featured", "is_visible")
    list_filter_submit = True
    search_fields = ("title", "summary", "description")
    prepopulated_fields = {"slug": ("title",)}
    autocomplete_fields = ("technologies",)
    inlines = (ProjectImageInline,)
    ordering_field = "order"
    hide_ordering_field = True
    warn_unsaved_form = True
    fieldsets = (
        (
            "General",
            {
                "classes": ("tab",),
                "fields": (
                    ("title", "slug"),
                    ("category", "status"),
                    ("role", "year"),
                    "summary",
                    "description",
                    "highlights",
                    "technologies",
                ),
            },
        ),
        (
            "Media & links",
            {
                "classes": ("tab",),
                "fields": ("cover", "accent_color", ("live_url", "repo_url")),
            },
        ),
        (
            "Display",
            {"classes": ("tab",), "fields": ("is_featured", "is_visible")},
        ),
    )

    @display(description="Project", header=True)
    def project_header(self, obj: Project) -> list:
        return image_header(obj.title, obj.summary[:70], obj.cover)

    @display(
        description="Status",
        label={
            Project.Status.LIVE: "success",
            Project.Status.IN_PROGRESS: "warning",
            Project.Status.COMPLETED: "info",
            Project.Status.ARCHIVED: "danger",
        },
    )
    def status_label(self, obj: Project) -> tuple[str, str]:
        return obj.status, obj.get_status_display()


# ========== EXPERIENCE ==========
@admin.register(Experience)
class ExperienceAdmin(ModelAdmin):
    list_display = ("experience_header", "kind_label", "period", "is_visible")
    list_display_links = ("experience_header",)
    list_editable = ("is_visible",)
    list_filter = ("kind", "is_visible")
    search_fields = ("title", "organization", "description")
    autocomplete_fields = ("technologies",)
    date_hierarchy = "start_date"
    warn_unsaved_form = True
    fieldsets = (
        (
            "General",
            {
                "classes": ("tab",),
                "fields": (
                    "kind",
                    ("title", "organization"),
                    ("organization_url", "logo"),
                    ("location", "employment_type"),
                    ("start_date", "end_date"),
                    "is_visible",
                ),
            },
        ),
        (
            "Description",
            {"classes": ("tab",), "fields": ("description", "achievements", "technologies")},
        ),
    )

    @display(description="Position", header=True)
    def experience_header(self, obj: Experience) -> list:
        return image_header(obj.title, obj.organization, obj.logo)

    @display(
        description="Type",
        label={
            Experience.Kind.WORK: "info",
            Experience.Kind.FREELANCE: "success",
            Experience.Kind.EDUCATION: "warning",
            Experience.Kind.VOLUNTEER: "danger",
        },
    )
    def kind_label(self, obj: Experience) -> tuple[str, str]:
        return obj.kind, obj.get_kind_display()

    @display(description="Period", ordering="start_date")
    def period(self, obj: Experience) -> str:
        end = obj.end_date.strftime("%m.%Y") if obj.end_date else "present"
        return f"{obj.start_date:%m.%Y} — {end}"


# ========== CERTIFICATES & TESTIMONIALS ==========
@admin.register(Certificate)
class CertificateAdmin(ModelAdmin):
    list_display = ("certificate_header", "issued_at", "is_visible")
    list_display_links = ("certificate_header",)
    list_editable = ("is_visible",)
    search_fields = ("title", "issuer")
    ordering_field = "order"
    hide_ordering_field = True

    @display(description="Certificate", header=True)
    def certificate_header(self, obj: Certificate) -> list:
        return image_header(obj.title, obj.issuer, obj.image)


@admin.register(Testimonial)
class TestimonialAdmin(ModelAdmin):
    list_display = ("author_header", "short_text", "is_visible")
    list_display_links = ("author_header",)
    list_editable = ("is_visible",)
    search_fields = ("author", "company", "text")
    ordering_field = "order"
    hide_ordering_field = True

    @display(description="Author", header=True)
    def author_header(self, obj: Testimonial) -> list:
        subtitle = " · ".join(part for part in (obj.role, obj.company) if part)
        return image_header(obj.author, subtitle, obj.avatar, squared=False)

    @display(description="Testimonial")
    def short_text(self, obj: Testimonial) -> str:
        return obj.text[:90] + ("…" if len(obj.text) > 90 else "")


# ========== CONTACT MESSAGES ==========
@admin.register(ContactMessage)
class ContactMessageAdmin(ModelAdmin):
    list_display = ("sender_header", "subject", "created_at", "is_read")
    list_display_links = ("sender_header",)
    list_filter = ("is_read",)
    search_fields = ("name", "email", "subject", "message")
    readonly_fields = (
        "name",
        "email_link",
        "subject",
        "message",
        "created_at",
        "ip_address",
        "user_agent",
    )
    fields = (*readonly_fields, "is_read")
    actions = ("mark_read", "mark_unread")
    date_hierarchy = "created_at"

    def has_add_permission(self, request: HttpRequest) -> bool:
        return False

    def change_view(self, request: HttpRequest, object_id, form_url="", extra_context=None):
        ContactMessage.objects.filter(pk=object_id, is_read=False).update(is_read=True)
        return super().change_view(request, object_id, form_url, extra_context)

    @display(description="Sender", header=True)
    def sender_header(self, obj: ContactMessage) -> list:
        title = obj.name if obj.is_read else f"● {obj.name}"
        return [title, obj.email, obj.name[:1].upper(), None]

    @display(description="Email")
    def email_link(self, obj: ContactMessage) -> str:
        subject = f"Re: {obj.subject}" if obj.subject else "Re: your message"
        return format_html('<a href="mailto:{}?subject={}">{}</a>', obj.email, subject, obj.email)

    @action(description="Mark as read")
    def mark_read(self, request: HttpRequest, queryset: QuerySet) -> None:
        updated = queryset.update(is_read=True)
        self.message_user(request, f"Marked as read: {updated}", messages.SUCCESS)

    @action(description="Mark as unread")
    def mark_unread(self, request: HttpRequest, queryset: QuerySet) -> None:
        updated = queryset.update(is_read=False)
        self.message_user(request, f"Marked as unread: {updated}", messages.SUCCESS)

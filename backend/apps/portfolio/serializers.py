from rest_framework import serializers

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


class StatSerializer(serializers.ModelSerializer):
    class Meta:
        model = Stat
        fields = ("value", "label")


class SocialLinkSerializer(serializers.ModelSerializer):
    label = serializers.SerializerMethodField()

    class Meta:
        model = SocialLink
        fields = ("platform", "url", "label")

    def get_label(self, obj: SocialLink) -> str:
        return str(obj)


class ProfileSerializer(serializers.ModelSerializer):
    brand = serializers.SerializerMethodField()
    roles = serializers.ListField(source="roles_list", child=serializers.CharField())
    stats = StatSerializer(many=True)
    socials = serializers.SerializerMethodField()

    class Meta:
        model = Profile
        fields = (
            "full_name",
            "brand",
            "headline",
            "roles",
            "tagline",
            "about",
            "avatar",
            "location",
            "timezone",
            "email",
            "phone",
            "is_available",
            "availability_text",
            "resume",
            "contact_text",
            "footer_text",
            "language",
            "seo_title",
            "seo_description",
            "stats",
            "socials",
        )

    def get_brand(self, obj: Profile) -> str:
        return obj.brand or (obj.full_name.split() or [""])[0]

    def get_socials(self, obj: Profile) -> list[dict]:
        visible = [link for link in obj.socials.all() if link.is_visible]
        return SocialLinkSerializer(visible, many=True).data


class ServiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Service
        fields = ("id", "title", "description", "icon")


class SkillSerializer(serializers.ModelSerializer):
    class Meta:
        model = Skill
        fields = ("id", "name", "level")


class SkillCategorySerializer(serializers.ModelSerializer):
    skills = serializers.SerializerMethodField()

    class Meta:
        model = SkillCategory
        fields = ("id", "name", "description", "skills")

    def get_skills(self, obj: SkillCategory) -> list[dict]:
        return SkillSerializer([s for s in obj.skills.all() if s.is_visible], many=True).data


class TechnologyField(serializers.RelatedField):
    def to_representation(self, value: Skill) -> str:
        return value.name


class ExperienceSerializer(serializers.ModelSerializer):
    achievements = serializers.ListField(source="achievements_list", child=serializers.CharField())
    technologies = TechnologyField(many=True, read_only=True)

    class Meta:
        model = Experience
        fields = (
            "id",
            "kind",
            "title",
            "organization",
            "organization_url",
            "logo",
            "location",
            "employment_type",
            "start_date",
            "end_date",
            "description",
            "achievements",
            "technologies",
        )


class ProjectCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = ProjectCategory
        fields = ("id", "name", "slug")


class ProjectImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProjectImage
        fields = ("id", "image", "caption")


class ProjectSerializer(serializers.ModelSerializer):
    category = serializers.SlugRelatedField(slug_field="slug", read_only=True)
    highlights = serializers.ListField(source="highlights_list", child=serializers.CharField())
    technologies = TechnologyField(many=True, read_only=True)
    images = ProjectImageSerializer(many=True, read_only=True)

    class Meta:
        model = Project
        fields = (
            "id",
            "slug",
            "title",
            "category",
            "summary",
            "description",
            "highlights",
            "cover",
            "images",
            "role",
            "year",
            "status",
            "live_url",
            "repo_url",
            "technologies",
            "accent_color",
            "is_featured",
        )


class CertificateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Certificate
        fields = ("id", "title", "issuer", "issued_at", "credential_url", "image")


class TestimonialSerializer(serializers.ModelSerializer):
    class Meta:
        model = Testimonial
        fields = ("id", "author", "role", "company", "avatar", "text", "url")


class ContactMessageSerializer(serializers.ModelSerializer):
    # Honeypot: real users never see this field, bots usually fill it.
    website = serializers.CharField(required=False, allow_blank=True, write_only=True)

    class Meta:
        model = ContactMessage
        fields = ("name", "email", "subject", "message", "website")
        extra_kwargs = {
            "name": {"min_length": 2},
            "message": {"min_length": 10},
        }

    def create(self, validated_data: dict) -> ContactMessage:
        validated_data.pop("website", None)
        return super().create(validated_data)

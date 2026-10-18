from django.db.models import Prefetch
from rest_framework import status
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView

from .models import (
    Certificate,
    Experience,
    Profile,
    Project,
    ProjectCategory,
    Service,
    Skill,
    SkillCategory,
    SocialLink,
    Testimonial,
)
from .notifications import notify_new_message
from .serializers import (
    CertificateSerializer,
    ContactMessageSerializer,
    ExperienceSerializer,
    ProfileSerializer,
    ProjectCategorySerializer,
    ProjectSerializer,
    ServiceSerializer,
    SkillCategorySerializer,
    SkillSerializer,
    TestimonialSerializer,
)


class PortfolioView(APIView):
    """Everything the one-page site needs in a single request."""

    def get(self, request: Request) -> Response:
        profile = (
            Profile.objects.prefetch_related(
                "stats", Prefetch("socials", queryset=SocialLink.objects.order_by("order", "pk"))
            )
            .filter(pk=1)
            .first()
        )
        visible_skills = Skill.objects.filter(is_visible=True)
        uncategorized = visible_skills.filter(category__isnull=True)
        projects = (
            Project.objects.filter(is_visible=True)
            .select_related("category")
            .prefetch_related("technologies", "images")
        )
        used_categories = ProjectCategory.objects.filter(
            projects__in=projects.values("pk")
        ).distinct()

        skill_categories = SkillCategorySerializer(
            SkillCategory.objects.prefetch_related("skills")
            .filter(skills__is_visible=True)
            .distinct(),
            many=True,
        ).data
        if uncategorized.exists():
            skill_categories.append(
                {
                    "id": 0,
                    "name": "",
                    "description": "",
                    "skills": SkillSerializer(uncategorized, many=True).data,
                }
            )

        data = {
            "profile": ProfileSerializer(profile).data if profile else None,
            "services": ServiceSerializer(Service.objects.filter(is_visible=True), many=True).data,
            "skill_categories": skill_categories,
            "featured_skills": list(
                Skill.objects.filter(is_featured=True).values_list("name", flat=True)
            ),
            "experience": ExperienceSerializer(
                Experience.objects.filter(is_visible=True).prefetch_related("technologies"),
                many=True,
            ).data,
            "project_categories": ProjectCategorySerializer(used_categories, many=True).data,
            "projects": ProjectSerializer(projects, many=True).data,
            "certificates": CertificateSerializer(
                Certificate.objects.filter(is_visible=True), many=True
            ).data,
            "testimonials": TestimonialSerializer(
                Testimonial.objects.filter(is_visible=True), many=True
            ).data,
        }
        response = Response(data)
        response["Cache-Control"] = "no-cache"
        return response


class ContactView(APIView):
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "contact"

    def post(self, request: Request) -> Response:
        serializer = ContactMessageSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        # Bots that fill the honeypot get a fake success and nothing is stored.
        if serializer.validated_data.get("website"):
            return Response({"ok": True}, status=status.HTTP_201_CREATED)

        message = serializer.save(
            ip_address=self.get_client_ip(request),
            user_agent=request.headers.get("User-Agent", "")[:300],
        )
        notify_new_message(message)
        return Response({"ok": True}, status=status.HTTP_201_CREATED)

    def get_client_ip(self, request: Request) -> str | None:
        # Same proxy-aware logic DRF uses for throttling (respects NUM_PROXIES).
        return self.get_throttles()[0].get_ident(request) or None

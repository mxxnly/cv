from django.core.exceptions import ValidationError
from django.core.validators import FileExtensionValidator, RegexValidator
from django.db import models
from django.utils.text import slugify

from .images import optimize_image

HEX_COLOR_VALIDATOR = RegexValidator(r"^#[0-9A-Fa-f]{6}$", "Color in #RRGGBB format")
LINES_HELP = "One item per line"
PARAGRAPHS_HELP = "Separate paragraphs with a blank line"


def validate_link(value: str) -> None:
    allowed = ("http://", "https://", "mailto:", "tel:", "tg://")
    if not value.startswith(allowed):
        raise ValidationError("The link must start with http(s)://, mailto:, tel: or tg://")


def split_lines(text: str) -> list[str]:
    return [line.strip(" -•\t") for line in text.splitlines() if line.strip(" -•\t")]


class OrderedModel(models.Model):
    order = models.PositiveIntegerField("Order", default=0, db_index=True)

    class Meta:
        abstract = True
        ordering = ("order", "pk")


class OptimizedImagesMixin(models.Model):
    """Re-encodes newly uploaded images listed in `optimized_images` ({field: max_side})."""

    optimized_images: dict[str, int] = {}

    class Meta:
        abstract = True

    def save(self, *args, **kwargs):
        for field_name, max_side in self.optimized_images.items():
            optimize_image(getattr(self, field_name), max_side=max_side)
        super().save(*args, **kwargs)


# ========== PROFILE ==========
class Profile(OptimizedImagesMixin, models.Model):
    """Singleton with personal data. Always stored with pk=1."""

    class Language(models.TextChoices):
        EN = "en", "English"
        UK = "uk", "Ukrainian"

    full_name = models.CharField("Full name", max_length=120)
    brand = models.CharField(
        "Header signature",
        max_length=40,
        blank=True,
        help_text="Short text logo in the navigation. Empty — the first word of the name.",
    )
    headline = models.CharField(
        "Specialization", max_length=160, help_text="E.g.: Full-stack developer"
    )
    roles = models.TextField(
        "Roles (hero animation)",
        blank=True,
        help_text="Rotate one after another under the name. " + LINES_HELP,
    )
    tagline = models.CharField("Short hero description", max_length=320, blank=True)
    about = models.TextField("About me", blank=True, help_text=PARAGRAPHS_HELP)
    avatar = models.ImageField("Photo", upload_to="profile/", blank=True)

    location = models.CharField("Location", max_length=120, blank=True)
    timezone = models.CharField(
        "Time zone",
        max_length=64,
        default="Europe/Kyiv",
        help_text="IANA format (Europe/Kyiv) — for the live clock on the site",
    )
    email = models.EmailField("Email", blank=True)
    phone = models.CharField("Phone", max_length=40, blank=True)

    is_available = models.BooleanField("Open to offers", default=True)
    availability_text = models.CharField(
        "Status text", max_length=80, blank=True, help_text="E.g.: Open to new projects"
    )
    resume = models.FileField(
        "Resume (CV)",
        upload_to="resume/",
        blank=True,
        validators=[FileExtensionValidator(["pdf", "doc", "docx"])],
    )

    contact_text = models.CharField(
        "Contact section text",
        max_length=300,
        blank=True,
        help_text="Short call to action under the contact section heading",
    )
    footer_text = models.CharField("Footer text", max_length=200, blank=True)
    language = models.CharField(
        "Site interface language",
        max_length=2,
        choices=Language.choices,
        default=Language.EN,
        help_text="Language of section headings, buttons and the form",
    )

    seo_title = models.CharField("SEO title", max_length=70, blank=True)
    seo_description = models.CharField("SEO description", max_length=170, blank=True)

    updated_at = models.DateTimeField("Updated", auto_now=True)

    optimized_images = {"avatar": 1200}

    class Meta:
        verbose_name = "Profile"
        verbose_name_plural = "Profile"

    def __str__(self) -> str:
        return self.full_name

    def save(self, *args, **kwargs):
        self.pk = 1
        super().save(*args, **kwargs)

    def delete(self, *args, **kwargs):
        raise ValidationError("The profile cannot be deleted — it can only be edited.")

    @classmethod
    def load(cls) -> "Profile":
        profile, _ = cls.objects.get_or_create(
            pk=1, defaults={"full_name": "Your name", "headline": "Developer"}
        )
        return profile

    @property
    def roles_list(self) -> list[str]:
        return split_lines(self.roles)


class Stat(OrderedModel):
    profile = models.ForeignKey(Profile, on_delete=models.CASCADE, related_name="stats")
    value = models.CharField("Value", max_length=20, help_text="E.g.: 5+, 40, 100%")
    label = models.CharField("Label", max_length=60, help_text="E.g.: years of experience")

    class Meta(OrderedModel.Meta):
        verbose_name = "Number"
        verbose_name_plural = "Numbers (stats)"

    def __str__(self) -> str:
        return f"{self.value} {self.label}"


class SocialLink(OrderedModel):
    class Platform(models.TextChoices):
        GITHUB = "github", "GitHub"
        GITLAB = "gitlab", "GitLab"
        LINKEDIN = "linkedin", "LinkedIn"
        TELEGRAM = "telegram", "Telegram"
        X = "x", "X (Twitter)"
        INSTAGRAM = "instagram", "Instagram"
        FACEBOOK = "facebook", "Facebook"
        YOUTUBE = "youtube", "YouTube"
        DRIBBBLE = "dribbble", "Dribbble"
        BEHANCE = "behance", "Behance"
        MEDIUM = "medium", "Medium"
        DEVTO = "devto", "DEV.to"
        STACKOVERFLOW = "stackoverflow", "Stack Overflow"
        LEETCODE = "leetcode", "LeetCode"
        DISCORD = "discord", "Discord"
        EMAIL = "email", "Email"
        WEBSITE = "website", "Website"
        OTHER = "other", "Other"

    profile = models.ForeignKey(Profile, on_delete=models.CASCADE, related_name="socials")
    platform = models.CharField("Platform", max_length=20, choices=Platform.choices)
    url = models.CharField("Link", max_length=300, validators=[validate_link])
    label = models.CharField(
        "Label", max_length=60, blank=True, help_text="E.g.: @username. Empty — the platform name."
    )
    is_visible = models.BooleanField("Visible", default=True)

    class Meta(OrderedModel.Meta):
        verbose_name = "Social link"
        verbose_name_plural = "Social links"

    def __str__(self) -> str:
        return self.label or self.get_platform_display()


# ========== SERVICES ==========
class Service(OrderedModel):
    class Icon(models.TextChoices):
        CODE = "code", "Code"
        LAYOUT = "layout", "Interfaces"
        SERVER = "server", "Server / API"
        DATABASE = "database", "Databases"
        SMARTPHONE = "smartphone", "Mobile"
        CLOUD = "cloud", "Cloud / DevOps"
        BOT = "bot", "Bots / automation"
        PALETTE = "palette", "Design"
        SHIELD = "shield", "Security"
        CPU = "cpu", "AI / ML"
        ROCKET = "rocket", "Product launch"
        SPARKLES = "sparkles", "Other"

    title = models.CharField("Title", max_length=80)
    description = models.TextField("Description", max_length=400)
    icon = models.CharField("Icon", max_length=20, choices=Icon.choices, default=Icon.CODE)
    is_visible = models.BooleanField("Visible", default=True)

    class Meta(OrderedModel.Meta):
        verbose_name = "Service"
        verbose_name_plural = "Services"

    def __str__(self) -> str:
        return self.title


# ========== SKILLS ==========
class SkillCategory(OrderedModel):
    name = models.CharField("Name", max_length=60, unique=True)
    description = models.CharField("Description", max_length=200, blank=True)

    class Meta(OrderedModel.Meta):
        verbose_name = "Skill category"
        verbose_name_plural = "Skill categories"

    def __str__(self) -> str:
        return self.name


class Skill(OrderedModel):
    class Level(models.IntegerChoices):
        NEW = 1, "🌑 Learning"
        CRESCENT = 2, "🌒 Basic"
        QUARTER = 3, "🌓 Confident"
        GIBBOUS = 4, "🌔 Advanced"
        FULL = 5, "🌕 Expert"

    category = models.ForeignKey(
        SkillCategory,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="skills",
        verbose_name="Category",
    )
    name = models.CharField("Name", max_length=60, unique=True)
    level = models.PositiveSmallIntegerField("Level", choices=Level.choices, default=Level.QUARTER)
    is_featured = models.BooleanField(
        "In the marquee", default=False, help_text="Show in the animated skills ticker"
    )
    is_visible = models.BooleanField(
        "Show in the skills section",
        default=True,
        help_text="Turn off if the technology is only needed as a project/experience tag",
    )

    class Meta(OrderedModel.Meta):
        verbose_name = "Skill"
        verbose_name_plural = "Skills"

    def __str__(self) -> str:
        return self.name


# ========== EXPERIENCE ==========
class Experience(OptimizedImagesMixin, models.Model):
    class Kind(models.TextChoices):
        WORK = "work", "Work"
        FREELANCE = "freelance", "Freelance"
        EDUCATION = "education", "Education"
        VOLUNTEER = "volunteer", "Volunteering"

    kind = models.CharField("Type", max_length=12, choices=Kind.choices, default=Kind.WORK)
    title = models.CharField("Position / degree", max_length=120)
    organization = models.CharField("Company / institution", max_length=120)
    organization_url = models.URLField("Company website", blank=True)
    logo = models.ImageField("Logo", upload_to="experience/", blank=True)
    location = models.CharField("Location", max_length=120, blank=True)
    employment_type = models.CharField(
        "Format", max_length=60, blank=True, help_text="E.g.: Full-time · Remote"
    )
    start_date = models.DateField("Start")
    end_date = models.DateField("End", null=True, blank=True, help_text="Empty — present")
    description = models.TextField("Description", blank=True, help_text=PARAGRAPHS_HELP)
    achievements = models.TextField("Achievements", blank=True, help_text=LINES_HELP)
    technologies = models.ManyToManyField(
        Skill, blank=True, related_name="experiences", verbose_name="Technologies"
    )
    is_visible = models.BooleanField("Visible", default=True)

    optimized_images = {"logo": 400}

    class Meta:
        verbose_name = "Experience / education"
        verbose_name_plural = "Experience & education"
        ordering = ("-start_date", "-pk")

    def __str__(self) -> str:
        return f"{self.title} — {self.organization}"

    def clean(self):
        if self.end_date and self.start_date and self.end_date < self.start_date:
            raise ValidationError({"end_date": "The end date is earlier than the start date."})

    @property
    def achievements_list(self) -> list[str]:
        return split_lines(self.achievements)


# ========== PROJECTS ==========
class ProjectCategory(OrderedModel):
    name = models.CharField("Name", max_length=60, unique=True)
    slug = models.SlugField("Slug", max_length=60, unique=True)

    class Meta(OrderedModel.Meta):
        verbose_name = "Project category"
        verbose_name_plural = "Project categories"

    def __str__(self) -> str:
        return self.name


class Project(OrderedModel, OptimizedImagesMixin):
    class Status(models.TextChoices):
        LIVE = "live", "Live"
        IN_PROGRESS = "in_progress", "In progress"
        COMPLETED = "completed", "Completed"
        ARCHIVED = "archived", "Archived"

    title = models.CharField("Title", max_length=120)
    slug = models.SlugField("Slug", max_length=140, unique=True, blank=True)
    category = models.ForeignKey(
        ProjectCategory,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="projects",
        verbose_name="Category",
    )
    summary = models.CharField("Short description (card)", max_length=280)
    description = models.TextField("Full description", blank=True, help_text=PARAGRAPHS_HELP)
    highlights = models.TextField("Highlights", blank=True, help_text=LINES_HELP)
    cover = models.ImageField(
        "Cover", upload_to="projects/", blank=True, help_text="Recommended 16:10"
    )
    role = models.CharField("My role", max_length=120, blank=True)
    year = models.PositiveSmallIntegerField("Year", null=True, blank=True)
    status = models.CharField(
        "Status", max_length=12, choices=Status.choices, default=Status.COMPLETED
    )
    live_url = models.URLField("Live URL", blank=True)
    repo_url = models.URLField("Repository", blank=True)
    technologies = models.ManyToManyField(
        Skill, blank=True, related_name="projects", verbose_name="Technologies"
    )
    accent_color = models.CharField(
        "Accent color",
        max_length=7,
        blank=True,
        validators=[HEX_COLOR_VALIDATOR],
        help_text="Card glow color. Empty — moon silver.",
    )
    is_featured = models.BooleanField("Featured (large card)", default=False)
    is_visible = models.BooleanField("Visible", default=True)
    created_at = models.DateTimeField("Created", auto_now_add=True)
    updated_at = models.DateTimeField("Updated", auto_now=True)

    optimized_images = {"cover": 2000}

    class Meta(OrderedModel.Meta):
        verbose_name = "Project"
        verbose_name_plural = "Projects"

    def __str__(self) -> str:
        return self.title

    def save(self, *args, **kwargs):
        if not self.slug:
            base = slugify(self.title, allow_unicode=False) or "project"
            slug, index = base, 2
            while Project.objects.filter(slug=slug).exclude(pk=self.pk).exists():
                slug, index = f"{base}-{index}", index + 1
            self.slug = slug
        super().save(*args, **kwargs)

    @property
    def highlights_list(self) -> list[str]:
        return split_lines(self.highlights)


class ProjectImage(OrderedModel, OptimizedImagesMixin):
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name="images")
    image = models.ImageField("Image", upload_to="projects/gallery/")
    caption = models.CharField("Caption", max_length=160, blank=True)

    optimized_images = {"image": 2200}

    class Meta(OrderedModel.Meta):
        verbose_name = "Image"
        verbose_name_plural = "Gallery"

    def __str__(self) -> str:
        return self.caption or f"{self.project} #{self.pk}"


# ========== CERTIFICATES & TESTIMONIALS ==========
class Certificate(OrderedModel, OptimizedImagesMixin):
    title = models.CharField("Title", max_length=160)
    issuer = models.CharField("Issuer", max_length=120)
    issued_at = models.DateField("Issue date", null=True, blank=True)
    credential_url = models.URLField("Credential URL", blank=True)
    image = models.ImageField("Image", upload_to="certificates/", blank=True)
    is_visible = models.BooleanField("Visible", default=True)

    optimized_images = {"image": 1600}

    class Meta(OrderedModel.Meta):
        verbose_name = "Certificate"
        verbose_name_plural = "Certificates"

    def __str__(self) -> str:
        return self.title


class Testimonial(OrderedModel, OptimizedImagesMixin):
    author = models.CharField("Author", max_length=100)
    role = models.CharField("Position", max_length=120, blank=True)
    company = models.CharField("Company", max_length=120, blank=True)
    avatar = models.ImageField("Photo", upload_to="testimonials/", blank=True)
    text = models.TextField("Testimonial", max_length=1200)
    url = models.URLField("Link (LinkedIn, etc.)", blank=True)
    is_visible = models.BooleanField("Visible", default=True)

    optimized_images = {"avatar": 400}

    class Meta(OrderedModel.Meta):
        verbose_name = "Testimonial"
        verbose_name_plural = "Testimonials"

    def __str__(self) -> str:
        return f"{self.author}: {self.text[:40]}"


# ========== CONTACT ==========
class ContactMessage(models.Model):
    name = models.CharField("Name", max_length=100)
    email = models.EmailField("Email")
    subject = models.CharField("Subject", max_length=160, blank=True)
    message = models.TextField("Message", max_length=5000)
    is_read = models.BooleanField("Read", default=False, db_index=True)
    ip_address = models.GenericIPAddressField("IP", null=True, blank=True)
    user_agent = models.CharField("User-Agent", max_length=300, blank=True)
    created_at = models.DateTimeField("Received", auto_now_add=True)

    class Meta:
        verbose_name = "Message"
        verbose_name_plural = "Messages"
        ordering = ("is_read", "-created_at")

    def __str__(self) -> str:
        return f"{self.name} <{self.email}>"

from django.core.exceptions import ValidationError
from django.core.validators import FileExtensionValidator, RegexValidator
from django.db import models
from django.utils.text import slugify

from .images import optimize_image

HEX_COLOR_VALIDATOR = RegexValidator(r"^#[0-9A-Fa-f]{6}$", "Колір у форматі #RRGGBB")
LINES_HELP = "Кожен пункт з нового рядка"
PARAGRAPHS_HELP = "Абзаци розділяйте порожнім рядком"


def validate_link(value: str) -> None:
    allowed = ("http://", "https://", "mailto:", "tel:", "tg://")
    if not value.startswith(allowed):
        raise ValidationError("Посилання має починатися з http(s)://, mailto:, tel: або tg://")


def split_lines(text: str) -> list[str]:
    return [line.strip(" -•\t") for line in text.splitlines() if line.strip(" -•\t")]


class OrderedModel(models.Model):
    order = models.PositiveIntegerField("Порядок", default=0, db_index=True)

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
        UK = "uk", "Українська"
        EN = "en", "English"

    full_name = models.CharField("Повне ім'я", max_length=120)
    brand = models.CharField(
        "Підпис у шапці",
        max_length=40,
        blank=True,
        help_text="Короткий логотип-текст у навігації. Якщо порожньо — перше слово імені.",
    )
    headline = models.CharField(
        "Спеціалізація", max_length=160, help_text="Напр.: Full-stack розробник"
    )
    roles = models.TextField(
        "Ролі (анімація в hero)",
        blank=True,
        help_text="Змінюються по черзі під іменем. " + LINES_HELP,
    )
    tagline = models.CharField("Короткий опис у hero", max_length=320, blank=True)
    about = models.TextField("Про мене", blank=True, help_text=PARAGRAPHS_HELP)
    avatar = models.ImageField("Фото", upload_to="profile/", blank=True)

    location = models.CharField("Локація", max_length=120, blank=True)
    timezone = models.CharField(
        "Часовий пояс",
        max_length=64,
        default="Europe/Kyiv",
        help_text="IANA-формат (Europe/Kyiv) — для живого годинника на сайті",
    )
    email = models.EmailField("Email", blank=True)
    phone = models.CharField("Телефон", max_length=40, blank=True)

    is_available = models.BooleanField("Відкритий до пропозицій", default=True)
    availability_text = models.CharField(
        "Текст статусу", max_length=80, blank=True, help_text="Напр.: Відкритий до нових проєктів"
    )
    resume = models.FileField(
        "Резюме (CV)",
        upload_to="resume/",
        blank=True,
        validators=[FileExtensionValidator(["pdf", "doc", "docx"])],
    )

    contact_text = models.CharField(
        "Текст у блоці контактів",
        max_length=300,
        blank=True,
        help_text="Короткий заклик під заголовком секції контактів",
    )
    footer_text = models.CharField("Текст у футері", max_length=200, blank=True)
    language = models.CharField(
        "Мова інтерфейсу сайту",
        max_length=2,
        choices=Language.choices,
        default=Language.UK,
        help_text="Мова заголовків секцій, кнопок і форми",
    )

    seo_title = models.CharField("SEO заголовок", max_length=70, blank=True)
    seo_description = models.CharField("SEO опис", max_length=170, blank=True)

    updated_at = models.DateTimeField("Оновлено", auto_now=True)

    optimized_images = {"avatar": 1200}

    class Meta:
        verbose_name = "Профіль"
        verbose_name_plural = "Профіль"

    def __str__(self) -> str:
        return self.full_name

    def save(self, *args, **kwargs):
        self.pk = 1
        super().save(*args, **kwargs)

    def delete(self, *args, **kwargs):
        raise ValidationError("Профіль не можна видалити — його можна лише редагувати.")

    @classmethod
    def load(cls) -> "Profile":
        profile, _ = cls.objects.get_or_create(
            pk=1, defaults={"full_name": "Ваше ім'я", "headline": "Розробник"}
        )
        return profile

    @property
    def roles_list(self) -> list[str]:
        return split_lines(self.roles)


class Stat(OrderedModel):
    profile = models.ForeignKey(Profile, on_delete=models.CASCADE, related_name="stats")
    value = models.CharField("Значення", max_length=20, help_text="Напр.: 5+, 40, 100%")
    label = models.CharField("Підпис", max_length=60, help_text="Напр.: років досвіду")

    class Meta(OrderedModel.Meta):
        verbose_name = "Цифра"
        verbose_name_plural = "Цифри (статистика)"

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
        WEBSITE = "website", "Сайт"
        OTHER = "other", "Інше"

    profile = models.ForeignKey(Profile, on_delete=models.CASCADE, related_name="socials")
    platform = models.CharField("Платформа", max_length=20, choices=Platform.choices)
    url = models.CharField("Посилання", max_length=300, validators=[validate_link])
    label = models.CharField(
        "Підпис", max_length=60, blank=True, help_text="Напр.: @username. Якщо порожньо — назва."
    )
    is_visible = models.BooleanField("Показувати", default=True)

    class Meta(OrderedModel.Meta):
        verbose_name = "Соцмережа"
        verbose_name_plural = "Соцмережі"

    def __str__(self) -> str:
        return self.label or self.get_platform_display()


# ========== SERVICES ==========
class Service(OrderedModel):
    class Icon(models.TextChoices):
        CODE = "code", "Код"
        LAYOUT = "layout", "Інтерфейси"
        SERVER = "server", "Сервер / API"
        DATABASE = "database", "Бази даних"
        SMARTPHONE = "smartphone", "Мобільні"
        CLOUD = "cloud", "Хмара / DevOps"
        BOT = "bot", "Боти / автоматизація"
        PALETTE = "palette", "Дизайн"
        SHIELD = "shield", "Безпека"
        CPU = "cpu", "AI / ML"
        ROCKET = "rocket", "Запуск продукту"
        SPARKLES = "sparkles", "Інше"

    title = models.CharField("Назва", max_length=80)
    description = models.TextField("Опис", max_length=400)
    icon = models.CharField("Іконка", max_length=20, choices=Icon.choices, default=Icon.CODE)
    is_visible = models.BooleanField("Показувати", default=True)

    class Meta(OrderedModel.Meta):
        verbose_name = "Послуга"
        verbose_name_plural = "Послуги"

    def __str__(self) -> str:
        return self.title


# ========== SKILLS ==========
class SkillCategory(OrderedModel):
    name = models.CharField("Назва", max_length=60, unique=True)
    description = models.CharField("Опис", max_length=200, blank=True)

    class Meta(OrderedModel.Meta):
        verbose_name = "Категорія навичок"
        verbose_name_plural = "Категорії навичок"

    def __str__(self) -> str:
        return self.name


class Skill(OrderedModel):
    class Level(models.IntegerChoices):
        NEW = 1, "🌑 Вивчаю"
        CRESCENT = 2, "🌒 Базовий"
        QUARTER = 3, "🌓 Впевнений"
        GIBBOUS = 4, "🌔 Просунутий"
        FULL = 5, "🌕 Експерт"

    category = models.ForeignKey(
        SkillCategory,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="skills",
        verbose_name="Категорія",
    )
    name = models.CharField("Назва", max_length=60, unique=True)
    level = models.PositiveSmallIntegerField("Рівень", choices=Level.choices, default=Level.QUARTER)
    is_featured = models.BooleanField(
        "У біжучому рядку", default=False, help_text="Показувати в анімованій стрічці навичок"
    )
    is_visible = models.BooleanField(
        "Показувати в секції навичок",
        default=True,
        help_text="Вимкніть, якщо технологія потрібна лише як тег проєкту/досвіду",
    )

    class Meta(OrderedModel.Meta):
        verbose_name = "Навичка"
        verbose_name_plural = "Навички"

    def __str__(self) -> str:
        return self.name


# ========== EXPERIENCE ==========
class Experience(OptimizedImagesMixin, models.Model):
    class Kind(models.TextChoices):
        WORK = "work", "Робота"
        FREELANCE = "freelance", "Фриланс"
        EDUCATION = "education", "Освіта"
        VOLUNTEER = "volunteer", "Волонтерство"

    kind = models.CharField("Тип", max_length=12, choices=Kind.choices, default=Kind.WORK)
    title = models.CharField("Посада / спеціальність", max_length=120)
    organization = models.CharField("Компанія / заклад", max_length=120)
    organization_url = models.URLField("Сайт компанії", blank=True)
    logo = models.ImageField("Логотип", upload_to="experience/", blank=True)
    location = models.CharField("Локація", max_length=120, blank=True)
    employment_type = models.CharField(
        "Формат", max_length=60, blank=True, help_text="Напр.: Full-time · Remote"
    )
    start_date = models.DateField("Початок")
    end_date = models.DateField("Завершення", null=True, blank=True, help_text="Порожньо — досі")
    description = models.TextField("Опис", blank=True, help_text=PARAGRAPHS_HELP)
    achievements = models.TextField("Досягнення", blank=True, help_text=LINES_HELP)
    technologies = models.ManyToManyField(
        Skill, blank=True, related_name="experiences", verbose_name="Технології"
    )
    is_visible = models.BooleanField("Показувати", default=True)

    optimized_images = {"logo": 400}

    class Meta:
        verbose_name = "Досвід / освіта"
        verbose_name_plural = "Досвід та освіта"
        ordering = ("-start_date", "-pk")

    def __str__(self) -> str:
        return f"{self.title} — {self.organization}"

    def clean(self):
        if self.end_date and self.start_date and self.end_date < self.start_date:
            raise ValidationError({"end_date": "Дата завершення раніше за дату початку."})

    @property
    def achievements_list(self) -> list[str]:
        return split_lines(self.achievements)


# ========== PROJECTS ==========
class ProjectCategory(OrderedModel):
    name = models.CharField("Назва", max_length=60, unique=True)
    slug = models.SlugField("Slug", max_length=60, unique=True)

    class Meta(OrderedModel.Meta):
        verbose_name = "Категорія проєктів"
        verbose_name_plural = "Категорії проєктів"

    def __str__(self) -> str:
        return self.name


class Project(OrderedModel, OptimizedImagesMixin):
    class Status(models.TextChoices):
        LIVE = "live", "Працює (live)"
        IN_PROGRESS = "in_progress", "В розробці"
        COMPLETED = "completed", "Завершено"
        ARCHIVED = "archived", "Архів"

    title = models.CharField("Назва", max_length=120)
    slug = models.SlugField("Slug", max_length=140, unique=True, blank=True)
    category = models.ForeignKey(
        ProjectCategory,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="projects",
        verbose_name="Категорія",
    )
    summary = models.CharField("Короткий опис (картка)", max_length=280)
    description = models.TextField("Повний опис", blank=True, help_text=PARAGRAPHS_HELP)
    highlights = models.TextField("Ключові моменти", blank=True, help_text=LINES_HELP)
    cover = models.ImageField(
        "Обкладинка", upload_to="projects/", blank=True, help_text="Рекомендовано 16:10"
    )
    role = models.CharField("Моя роль", max_length=120, blank=True)
    year = models.PositiveSmallIntegerField("Рік", null=True, blank=True)
    status = models.CharField(
        "Статус", max_length=12, choices=Status.choices, default=Status.COMPLETED
    )
    live_url = models.URLField("Посилання на сайт", blank=True)
    repo_url = models.URLField("Репозиторій", blank=True)
    technologies = models.ManyToManyField(
        Skill, blank=True, related_name="projects", verbose_name="Технології"
    )
    accent_color = models.CharField(
        "Акцентний колір",
        max_length=7,
        blank=True,
        validators=[HEX_COLOR_VALIDATOR],
        help_text="Колір світіння картки. Порожньо — місячне срібло.",
    )
    is_featured = models.BooleanField("Головний (велика картка)", default=False)
    is_visible = models.BooleanField("Показувати", default=True)
    created_at = models.DateTimeField("Створено", auto_now_add=True)
    updated_at = models.DateTimeField("Оновлено", auto_now=True)

    optimized_images = {"cover": 2000}

    class Meta(OrderedModel.Meta):
        verbose_name = "Проєкт"
        verbose_name_plural = "Проєкти"

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
    image = models.ImageField("Зображення", upload_to="projects/gallery/")
    caption = models.CharField("Підпис", max_length=160, blank=True)

    optimized_images = {"image": 2200}

    class Meta(OrderedModel.Meta):
        verbose_name = "Зображення"
        verbose_name_plural = "Галерея"

    def __str__(self) -> str:
        return self.caption or f"{self.project} #{self.pk}"


# ========== CERTIFICATES & TESTIMONIALS ==========
class Certificate(OrderedModel, OptimizedImagesMixin):
    title = models.CharField("Назва", max_length=160)
    issuer = models.CharField("Видавець", max_length=120)
    issued_at = models.DateField("Дата видачі", null=True, blank=True)
    credential_url = models.URLField("Посилання на сертифікат", blank=True)
    image = models.ImageField("Зображення", upload_to="certificates/", blank=True)
    is_visible = models.BooleanField("Показувати", default=True)

    optimized_images = {"image": 1600}

    class Meta(OrderedModel.Meta):
        verbose_name = "Сертифікат"
        verbose_name_plural = "Сертифікати"

    def __str__(self) -> str:
        return self.title


class Testimonial(OrderedModel, OptimizedImagesMixin):
    author = models.CharField("Автор", max_length=100)
    role = models.CharField("Посада", max_length=120, blank=True)
    company = models.CharField("Компанія", max_length=120, blank=True)
    avatar = models.ImageField("Фото", upload_to="testimonials/", blank=True)
    text = models.TextField("Відгук", max_length=1200)
    url = models.URLField("Посилання (LinkedIn тощо)", blank=True)
    is_visible = models.BooleanField("Показувати", default=True)

    optimized_images = {"avatar": 400}

    class Meta(OrderedModel.Meta):
        verbose_name = "Відгук"
        verbose_name_plural = "Відгуки"

    def __str__(self) -> str:
        return f"{self.author}: {self.text[:40]}"


# ========== CONTACT ==========
class ContactMessage(models.Model):
    name = models.CharField("Ім'я", max_length=100)
    email = models.EmailField("Email")
    subject = models.CharField("Тема", max_length=160, blank=True)
    message = models.TextField("Повідомлення", max_length=5000)
    is_read = models.BooleanField("Прочитано", default=False, db_index=True)
    ip_address = models.GenericIPAddressField("IP", null=True, blank=True)
    user_agent = models.CharField("User-Agent", max_length=300, blank=True)
    created_at = models.DateTimeField("Отримано", auto_now_add=True)

    class Meta:
        verbose_name = "Повідомлення"
        verbose_name_plural = "Повідомлення"
        ordering = ("is_read", "-created_at")

    def __str__(self) -> str:
        return f"{self.name} <{self.email}>"

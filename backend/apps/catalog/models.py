"""Catalog: products, plans (prices), links, FAQ, price history, inbox and site settings.

Content is bilingual: every user-facing text has a `_uk` (primary) and `_en` field. The public API
picks one language per request (see serializers). Prices are numbers with a currency; `is_example`
marks temporary prices («приклад»), and nothing is public until `is_published` is set.
"""

from decimal import Decimal

from django.core.exceptions import ValidationError
from django.core.validators import MinValueValidator
from django.db import models
from django.utils import timezone
from django.utils.text import slugify

LINES_HELP = "Один пункт на рядок"
PARAGRAPHS_HELP = "Абзаци розділяйте порожнім рядком"
LANGUAGES = ("uk", "en")


def split_lines(text: str) -> list[str]:
    return [line.strip(" -•\t") for line in text.splitlines() if line.strip(" -•\t")]


def split_paragraphs(text: str) -> list[str]:
    return [p.strip() for p in text.replace("\r\n", "\n").split("\n\n") if p.strip()]


class OrderedModel(models.Model):
    order = models.PositiveIntegerField("Порядок", default=0, db_index=True)

    class Meta:
        abstract = True
        ordering = ("order", "pk")


class LocalizedMixin:
    """`obj.localized("tagline", "en")` returns the English field, falling back to Ukrainian."""

    def localized(self, field: str, lang: str) -> str:
        value = getattr(self, f"{field}_{lang}", "") if lang in LANGUAGES else ""
        return value or getattr(self, f"{field}_uk", "")


# ========== CATEGORIES & PRODUCTS ==========
class Category(LocalizedMixin, OrderedModel):
    slug = models.SlugField("Slug", max_length=60, unique=True)
    name_uk = models.CharField("Назва (uk)", max_length=80)
    name_en = models.CharField("Name (en)", max_length=80, blank=True)

    class Meta(OrderedModel.Meta):
        verbose_name = "Категорія"
        verbose_name_plural = "Категорії"

    def __str__(self) -> str:
        return self.name_uk


class Product(LocalizedMixin, OrderedModel):
    class Availability(models.TextChoices):
        AVAILABLE = "available", "Доступний"
        BETA = "beta", "Бета"
        SOON = "soon", "Скоро"

    class PublishStatus(models.TextChoices):
        DRAFT = "draft", "Чернетка"
        PUBLISHED = "published", "Опубліковано"

    class Tint(models.TextChoices):
        LAVENDER = "lavender", "Лаванда"
        PERIWINKLE = "periwinkle", "Барвінок"
        MAUVE = "mauve", "Мальва"

    class Icon(models.TextChoices):
        SHIELD = "shield", "Щит (безпека, VPN)"
        DOCUMENT = "document", "Документ (накладні, звіти)"
        BOX = "box", "Коробка (продукт)"
        BOT = "bot", "Бот / автоматизація"
        CHART = "chart", "Графік / аналітика"
        GLOBE = "globe", "Мережа / веб"

    class Cta(models.TextChoices):
        BUY = "buy", "Купити"
        DEMO = "demo", "Запросити демо"
        CONTACT = "contact", "Зв'язатися"

    slug = models.SlugField("Slug (у URL)", max_length=80, unique=True, blank=True)
    name = models.CharField("Назва", max_length=120, help_text="Напр.: MXXNLY VPN")
    category = models.ForeignKey(
        Category,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="products",
        verbose_name="Категорія",
    )

    tagline_uk = models.CharField("Короткий опис (uk)", max_length=200)
    tagline_en = models.CharField("Short description (en)", max_length=200, blank=True)
    description_uk = models.TextField("Опис (uk)", blank=True, help_text=PARAGRAPHS_HELP)
    description_en = models.TextField("Description (en)", blank=True, help_text=PARAGRAPHS_HELP)
    features_uk = models.TextField("Можливості (uk)", blank=True, help_text=LINES_HELP)
    features_en = models.TextField("Features (en)", blank=True, help_text=LINES_HELP)
    audience_uk = models.TextField("Для кого (uk)", blank=True, help_text=LINES_HELP)
    audience_en = models.TextField("Audience (en)", blank=True, help_text=LINES_HELP)
    support_terms_uk = models.TextField(
        "Умови підтримки (uk)", blank=True, help_text=PARAGRAPHS_HELP
    )
    support_terms_en = models.TextField("Support terms (en)", blank=True, help_text=PARAGRAPHS_HELP)

    availability = models.CharField(
        "Статус продукту", max_length=12, choices=Availability.choices, default=Availability.SOON
    )
    publish_status = models.CharField(
        "Публікація",
        max_length=12,
        choices=PublishStatus.choices,
        default=PublishStatus.DRAFT,
        db_index=True,
    )
    is_private = models.BooleanField(
        "Приватний проєкт",
        default=False,
        help_text="Ніколи не показується на сайті й в API, навіть якщо опублікований (напр. Khonsu).",
    )
    tint = models.CharField(
        "Відтінок картки", max_length=12, choices=Tint.choices, default=Tint.LAVENDER
    )
    icon = models.CharField("Іконка", max_length=12, choices=Icon.choices, default=Icon.BOX)
    cta = models.CharField("Головна дія", max_length=10, choices=Cta.choices, default=Cta.CONTACT)

    seo_title_uk = models.CharField("SEO title (uk)", max_length=70, blank=True)
    seo_title_en = models.CharField("SEO title (en)", max_length=70, blank=True)
    seo_description_uk = models.CharField("SEO description (uk)", max_length=170, blank=True)
    seo_description_en = models.CharField("SEO description (en)", max_length=170, blank=True)

    prices_updated_at = models.DateTimeField("Ціни оновлено", null=True, blank=True)
    created_at = models.DateTimeField("Створено", auto_now_add=True)
    updated_at = models.DateTimeField("Оновлено", auto_now=True)

    class Meta(OrderedModel.Meta):
        verbose_name = "Продукт"
        verbose_name_plural = "Продукти"

    def __str__(self) -> str:
        return self.name

    def save(self, *args, **kwargs):
        if not self.slug:
            base = (
                slugify(self.name.replace("MXXNLY", "").strip()) or slugify(self.name) or "product"
            )
            slug, index = base, 2
            while Product.objects.filter(slug=slug).exclude(pk=self.pk).exists():
                slug, index = f"{base}-{index}", index + 1
            self.slug = slug
        super().save(*args, **kwargs)

    @property
    def is_public(self) -> bool:
        return self.publish_status == self.PublishStatus.PUBLISHED and not self.is_private

    def public_plans(self):
        return [plan for plan in self.plans.all() if plan.is_published]

    def min_plan(self):
        priced = [p for p in self.public_plans() if p.price is not None]
        return min(priced, key=lambda p: p.price) if priced else None

    @property
    def description_paragraphs_uk(self) -> list[str]:
        return split_paragraphs(self.description_uk)


class Plan(LocalizedMixin, OrderedModel):
    """A price item of a product: one tariff with a number, a currency and a billing period."""

    class Period(models.TextChoices):
        MONTH = "month", "за місяць"
        YEAR = "year", "за рік"
        ONCE = "once", "разово"
        ON_REQUEST = "on_request", "за запитом"

    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name="plans")
    slug = models.SlugField("Slug", max_length=60, blank=True)
    name = models.CharField("Назва тарифу", max_length=80, help_text="Напр.: Basic, Pro, Team")
    price = models.DecimalField(
        "Ціна",
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        validators=[MinValueValidator(Decimal("0"))],
        help_text="Порожньо, якщо «за запитом»",
    )
    currency = models.CharField("Валюта", max_length=3, default="USD")
    period = models.CharField("Період", max_length=12, choices=Period.choices, default=Period.MONTH)
    limit_uk = models.CharField(
        "Ліміт (uk)", max_length=160, blank=True, help_text="Напр.: до 300 накладних/міс"
    )
    limit_en = models.CharField("Limit (en)", max_length=160, blank=True)
    includes_uk = models.TextField("Що входить (uk)", blank=True, help_text=LINES_HELP)
    includes_en = models.TextField("Included (en)", blank=True, help_text=LINES_HELP)

    is_example = models.BooleanField(
        "Приклад",
        default=True,
        help_text="Тимчасова ціна-приклад. На сайті показується мітка «приклад».",
    )
    is_published = models.BooleanField("Опубліковано", default=False, db_index=True)
    is_recommended = models.BooleanField("Рекомендований", default=False)
    valid_until = models.DateField("Ціна дійсна до", null=True, blank=True)
    buy_url = models.URLField(
        "Посилання на оплату",
        blank=True,
        help_text="Зовнішній платіжний сервіс. Порожньо: формується з payment.link_base у config/company.json.",
    )

    created_at = models.DateTimeField("Створено", auto_now_add=True)
    updated_at = models.DateTimeField("Оновлено", auto_now=True)

    class Meta(OrderedModel.Meta):
        verbose_name = "Тариф"
        verbose_name_plural = "Тарифи"
        constraints = [
            models.UniqueConstraint(fields=("product", "slug"), name="unique_plan_slug_per_product")
        ]

    def __str__(self) -> str:
        return f"{self.product.name} · {self.name}"

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name) or "plan"
        previous = Plan.objects.filter(pk=self.pk).first() if self.pk else None
        super().save(*args, **kwargs)
        price_changed = (
            previous is None or previous.price != self.price or previous.currency != self.currency
        )
        if price_changed:
            PriceHistory.objects.create(
                plan=self,
                old_price=previous.price if previous else None,
                new_price=self.price,
                currency=self.currency,
            )
            Product.objects.filter(pk=self.product_id).update(prices_updated_at=timezone.now())

    def clean(self):
        if self.period != self.Period.ON_REQUEST and self.price is None:
            raise ValidationError({"price": "Вкажіть ціну або оберіть період «за запитом»."})


class ProductLink(LocalizedMixin, OrderedModel):
    class Kind(models.TextChoices):
        BUY = "buy", "Купити"
        DOCS = "docs", "Документація"
        DEMO = "demo", "Демо"
        OTHER = "other", "Інше"

    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name="links")
    kind = models.CharField("Тип", max_length=8, choices=Kind.choices, default=Kind.OTHER)
    label_uk = models.CharField("Підпис (uk)", max_length=60, blank=True)
    label_en = models.CharField("Label (en)", max_length=60, blank=True)
    url = models.URLField("URL", max_length=500)

    class Meta(OrderedModel.Meta):
        verbose_name = "Посилання"
        verbose_name_plural = "Посилання"

    def __str__(self) -> str:
        return self.label_uk or self.get_kind_display()


class ProductFAQ(LocalizedMixin, OrderedModel):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name="faq")
    question_uk = models.CharField("Запитання (uk)", max_length=200)
    question_en = models.CharField("Question (en)", max_length=200, blank=True)
    answer_uk = models.TextField("Відповідь (uk)")
    answer_en = models.TextField("Answer (en)", blank=True)

    class Meta(OrderedModel.Meta):
        verbose_name = "FAQ"
        verbose_name_plural = "FAQ"

    def __str__(self) -> str:
        return self.question_uk


class PriceHistory(models.Model):
    plan = models.ForeignKey(Plan, on_delete=models.CASCADE, related_name="history")
    old_price = models.DecimalField(
        "Стара ціна", max_digits=10, decimal_places=2, null=True, blank=True
    )
    new_price = models.DecimalField(
        "Нова ціна", max_digits=10, decimal_places=2, null=True, blank=True
    )
    currency = models.CharField("Валюта", max_length=3)
    changed_at = models.DateTimeField("Змінено", auto_now_add=True)
    note = models.CharField("Примітка", max_length=200, blank=True)

    class Meta:
        verbose_name = "Зміна ціни"
        verbose_name_plural = "Історія цін"
        ordering = ("-changed_at",)

    def __str__(self) -> str:
        return f"{self.plan}: {self.old_price} → {self.new_price} {self.currency}"


# ========== TESTIMONIALS (real ones only) ==========
class Testimonial(OrderedModel):
    author = models.CharField("Автор", max_length=100)
    role = models.CharField("Посада", max_length=120, blank=True)
    company = models.CharField("Компанія", max_length=120, blank=True)
    text = models.TextField("Відгук", max_length=1200)
    language = models.CharField(
        "Мова відгуку", max_length=2, choices=[("uk", "uk"), ("en", "en")], default="uk"
    )
    url = models.URLField(
        "Джерело (посилання)", blank=True, help_text="Публічне підтвердження відгуку"
    )
    product = models.ForeignKey(
        Product, on_delete=models.SET_NULL, null=True, blank=True, related_name="testimonials"
    )
    is_visible = models.BooleanField(
        "Показувати", default=False, help_text="Лише справжні відгуки з дозволом автора"
    )

    class Meta(OrderedModel.Meta):
        verbose_name = "Відгук"
        verbose_name_plural = "Відгуки"

    def __str__(self) -> str:
        return f"{self.author}: {self.text[:40]}"


# ========== TEAM ==========
MAX_PHOTO_BYTES = 3 * 1024 * 1024


def validate_photo_size(file) -> None:
    if file.size > MAX_PHOTO_BYTES:
        raise ValidationError("Фото більше 3 МБ: стисніть його перед завантаженням.")


class TeamMember(LocalizedMixin, OrderedModel):
    """A person shown on the «Про нас» page; filled in through the admin."""

    name = models.CharField("Ім'я", max_length=100, help_text="Одне написання для обох мов")
    role_uk = models.CharField("Посада (uk)", max_length=120)
    role_en = models.CharField("Role (en)", max_length=120, blank=True)
    bio_uk = models.TextField("Про людину (uk)", max_length=600, blank=True)
    bio_en = models.TextField("About (en)", max_length=600, blank=True)
    photo = models.ImageField(
        "Фото",
        upload_to="team/",
        blank=True,
        validators=[validate_photo_size],
        help_text="Квадратне фото від 600×600 px, до 3 МБ. Без фото показуються ініціали.",
    )
    telegram = models.CharField("Telegram", max_length=64, blank=True, help_text="Напр.: @nickname")
    github = models.URLField("GitHub", blank=True)
    linkedin = models.URLField("LinkedIn", blank=True)
    is_visible = models.BooleanField("Показувати", default=True)

    class Meta(OrderedModel.Meta):
        verbose_name = "Член команди"
        verbose_name_plural = "Команда"

    def __str__(self) -> str:
        return self.name


# ========== INBOX ==========
ATTRIBUTION_KEYS = (
    "utm_source",
    "utm_medium",
    "utm_campaign",
    "utm_term",
    "utm_content",
    "gclid",
    "landing",
    "referrer",
)


class InboxBase(models.Model):
    """Common fields of the two forms. Stores the minimum of personal data: name, email, text."""

    name = models.CharField("Ім'я", max_length=100)
    email = models.EmailField("Email")
    message = models.TextField("Повідомлення", max_length=5000)
    language = models.CharField("Мова", max_length=2, default="uk")
    product = models.ForeignKey(
        Product, on_delete=models.SET_NULL, null=True, blank=True, verbose_name="Продукт"
    )
    attribution = models.JSONField("Джерело (UTM, gclid)", default=dict, blank=True)
    ip_hash = models.CharField(
        "Хеш IP",
        max_length=32,
        blank=True,
        help_text="Лише для захисту від спаму; сам IP не зберігається",
    )
    created_at = models.DateTimeField("Отримано", auto_now_add=True)

    class Meta:
        abstract = True


class ContactMessage(InboxBase):
    class Topic(models.TextChoices):
        GENERAL = "general", "Загальне"
        SALES = "sales", "Купівля / ціни"
        PARTNERSHIP = "partnership", "Співпраця"

    topic = models.CharField("Тема", max_length=12, choices=Topic.choices, default=Topic.GENERAL)
    is_read = models.BooleanField("Прочитано", default=False, db_index=True)

    class Meta:
        verbose_name = "Повідомлення"
        verbose_name_plural = "Повідомлення (контакти)"
        ordering = ("is_read", "-created_at")

    def __str__(self) -> str:
        return f"{self.name} · {self.get_topic_display()}"


class SupportRequest(InboxBase):
    class Status(models.TextChoices):
        NEW = "new", "Нове"
        IN_PROGRESS = "in_progress", "У роботі"
        RESOLVED = "resolved", "Вирішено"

    subject = models.CharField("Тема звернення", max_length=160)
    status = models.CharField(
        "Статус", max_length=12, choices=Status.choices, default=Status.NEW, db_index=True
    )
    updated_at = models.DateTimeField("Оновлено", auto_now=True)

    class Meta:
        verbose_name = "Звернення в підтримку"
        verbose_name_plural = "Звернення в підтримку"
        ordering = ("status", "-created_at")

    def __str__(self) -> str:
        return f"#{self.pk} {self.subject}"


# ========== SETTINGS ==========
class SiteSettings(LocalizedMixin, models.Model):
    """Singleton with editable site texts that are not company data (those live in config/company.json)."""

    support_sla_uk = models.CharField(
        "SLA підтримки (uk)",
        max_length=200,
        default="Відповідаємо протягом 1 робочого дня (Пн–Пт).",
    )
    support_sla_en = models.CharField(
        "Support SLA (en)", max_length=200, default="We reply within 1 business day (Mon–Fri)."
    )
    price_note_uk = models.CharField(
        "Примітка до цін (uk)",
        max_length=300,
        blank=True,
        default="Ціни є прикладами і можуть змінитися до запуску.",
    )
    price_note_en = models.CharField(
        "Price note (en)",
        max_length=300,
        blank=True,
        default="Prices are examples and may change before launch.",
    )
    about_uk = models.TextField("Про нас (uk)", blank=True, help_text=PARAGRAPHS_HELP)
    about_en = models.TextField("About (en)", blank=True, help_text=PARAGRAPHS_HELP)
    about_is_placeholder = models.BooleanField("Текст «Про нас» є заглушкою", default=True)
    testimonials_enabled = models.BooleanField(
        "Показувати блок відгуків",
        default=True,
        help_text="Блок усе одно прихований, поки немає видимих відгуків",
    )
    updated_at = models.DateTimeField("Оновлено", auto_now=True)

    class Meta:
        verbose_name = "Налаштування сайту"
        verbose_name_plural = "Налаштування сайту"

    def __str__(self) -> str:
        return "Налаштування сайту"

    def save(self, *args, **kwargs):
        self.pk = 1
        super().save(*args, **kwargs)

    def delete(self, *args, **kwargs):
        raise ValidationError("Налаштування не можна видалити, лише редагувати.")

    @classmethod
    def load(cls) -> "SiteSettings":
        obj, _ = cls.objects.get_or_create(pk=1)
        return obj

from datetime import date

from django.core.management.base import BaseCommand, CommandError
from django.db import transaction

from apps.portfolio.models import (
    Certificate,
    Experience,
    Profile,
    Project,
    ProjectCategory,
    Service,
    Skill,
    SkillCategory,
    SocialLink,
    Stat,
    Testimonial,
)

SKILLS = {
    "Backend": (
        "Серверна логіка, API та дані",
        [
            ("Python", 5),
            ("Django", 5),
            ("Django REST", 5),
            ("FastAPI", 4),
            ("PostgreSQL", 4),
            ("Redis", 3),
            ("Celery", 4),
        ],
    ),
    "Frontend": (
        "Інтерфейси, анімації та UX",
        [
            ("TypeScript", 4),
            ("React", 4),
            ("Next.js", 3),
            ("Tailwind CSS", 5),
            ("Motion", 3),
            ("WebGL", 2),
        ],
    ),
    "DevOps": (
        "Інфраструктура та доставка",
        [("Docker", 5), ("GitHub Actions", 4), ("Nginx", 4), ("Linux", 4), ("Traefik", 3)],
    ),
    "Інструменти": (
        "Щоденний набір",
        [("Git", 5), ("Pytest", 4), ("Figma", 3), ("Aiogram", 4)],
    ),
}

PROJECTS = [
    {
        "title": "Lunar CRM",
        "category": "web",
        "summary": "CRM для невеликих команд з канбан-дошками, аналітикою та Telegram-інтеграцією.",
        "description": (
            "Lunar CRM з'явилась як внутрішній інструмент для агенції й виросла в повноцінний "
            "продукт. Вона збирає ліди з сайту, месенджерів і пошти в одну стрічку.\n\n"
            "Бекенд побудований на Django REST з фоновими задачами в Celery, фронтенд — React з "
            "оптимістичними оновленнями та офлайн-кешем."
        ),
        "highlights": "Час обробки ліда скоротився на 40%\nРеал-тайм оновлення через WebSocket\n"
        "Рольова модель доступу на рівні об'єктів",
        "tech": ["Django", "Django REST", "React", "TypeScript", "PostgreSQL", "Celery", "Docker"],
        "role": "Full-stack розробник",
        "year": 2026,
        "status": Project.Status.LIVE,
        "accent": "#8b7cf6",
        "featured": True,
    },
    {
        "title": "Orbit Analytics",
        "category": "web",
        "summary": "Дашборд аналітики з інтерактивними графіками та експортом звітів у PDF.",
        "description": "Платформа для збору подій з мобільних застосунків і побудови воронок.",
        "highlights": "Обробка 2 млн подій на добу\nКастомні графіки на D3",
        "tech": ["FastAPI", "Redis", "React", "TypeScript", "Tailwind CSS"],
        "role": "Backend розробник",
        "year": 2025,
        "status": Project.Status.COMPLETED,
        "accent": "#38bdf8",
        "featured": False,
    },
    {
        "title": "Tide Bot",
        "category": "bots",
        "summary": "Telegram-бот для запису до барбершопів з онлайн-оплатою та нагадуваннями.",
        "description": "Бот обслуговує мережу з 6 закладів і самостійно керує розкладом майстрів.",
        "highlights": "1500+ активних користувачів\nОплата через Monobank API",
        "tech": ["Python", "Aiogram", "PostgreSQL", "Docker"],
        "role": "Автор",
        "year": 2025,
        "status": Project.Status.LIVE,
        "accent": "#f5c66b",
        "featured": False,
    },
    {
        "title": "Crater UI",
        "category": "open-source",
        "summary": "Open-source набір React-компонентів з акцентом на доступність і анімації.",
        "description": "Бібліотека з 40+ компонентів, темізацією через CSS-змінні та Storybook.",
        "highlights": "300+ зірок на GitHub\nПовна підтримка клавіатурної навігації",
        "tech": ["React", "TypeScript", "Motion", "Tailwind CSS"],
        "role": "Мейнтейнер",
        "year": 2024,
        "status": Project.Status.IN_PROGRESS,
        "accent": "#34d399",
        "featured": False,
    },
    {
        "title": "Selene Deploy",
        "category": "open-source",
        "summary": "Шаблон CI/CD для Docker-проєктів: збірка, сканування та деплой в один клік.",
        "description": "GitHub Actions + GHCR + Traefik з автоматичними SSL-сертифікатами.",
        "highlights": "Деплой за 90 секунд\nTrivy-сканування образів",
        "tech": ["Docker", "GitHub Actions", "Traefik", "Nginx", "Linux"],
        "role": "Автор",
        "year": 2024,
        "status": Project.Status.COMPLETED,
        "accent": "#f472b6",
        "featured": False,
    },
    {
        "title": "Night Market",
        "category": "web",
        "summary": "Маркетплейс handmade-товарів з пошуком, кошиком і кабінетом продавця.",
        "description": "Повноцінний e-commerce з адмінкою для модерації та статистикою продажів.",
        "highlights": "Пошук з повнотекстовим індексом\nSSR для SEO",
        "tech": ["Next.js", "Django REST", "PostgreSQL", "Redis"],
        "role": "Full-stack розробник",
        "year": 2023,
        "status": Project.Status.ARCHIVED,
        "accent": "#fb923c",
        "featured": False,
    },
]


class Command(BaseCommand):
    help = "Fill the database with demo portfolio content (replace it later in the admin)."

    def add_arguments(self, parser):
        parser.add_argument(
            "--force", action="store_true", help="Delete existing content before seeding."
        )

    @transaction.atomic
    def handle(self, *args, force: bool = False, **options):
        if Project.objects.exists() and not force:
            raise CommandError("Content already exists. Use --force to replace it with demo data.")

        if force:
            content_models = (
                Project,
                ProjectCategory,
                Skill,
                SkillCategory,
                Experience,
                Service,
                Certificate,
                Testimonial,
                Stat,
                SocialLink,
            )
            for model in content_models:
                model.objects.all().delete()

        profile = Profile.load()
        profile.full_name = "Олекса Місяць"
        profile.brand = "olexa"
        profile.headline = "Full-stack розробник"
        profile.roles = (
            "Python / Django розробник\nReact + TypeScript інженер\n"
            "Автор Telegram-ботів\nDevOps-ентузіаст"
        )
        profile.tagline = (
            "Створюю швидкі, красиві та надійні вебпродукти — від архітектури бекенду "
            "до інтерфейсів, які хочеться гортати."
        )
        profile.about = (
            "Привіт! Я розробник, який любить, коли складні системи виглядають просто. "
            "Понад чотири роки будую вебзастосунки: від API та фонових задач до анімованих "
            "інтерфейсів і CI/CD.\n\n"
            "Найбільше кайфую від проєктів, де треба поєднати інженерну точність з естетикою: "
            "продумана архітектура, чистий код і деталі, які помічають користувачі.\n\n"
            "Поза кодом — астрофотографія, нічні прогулянки й хороша кава."
        )
        profile.location = "Київ, Україна"
        profile.timezone = "Europe/Kyiv"
        profile.email = "hello@example.com"
        profile.is_available = True
        profile.availability_text = "Відкритий до нових проєктів"
        profile.contact_text = (
            "Маєте ідею, проєкт чи просто хочете привітатися? Напишіть — відповім протягом доби."
        )
        profile.footer_text = "Зроблено з місячним світлом"
        profile.language = Profile.Language.UK
        profile.seo_title = "Олекса Місяць — Full-stack розробник"
        profile.seo_description = "Портфоліо full-stack розробника: Python, Django, React, DevOps."
        profile.save()

        for order, (value, label) in enumerate(
            [
                ("4+", "роки досвіду"),
                ("30+", "завершених проєктів"),
                ("15", "задоволених клієнтів"),
                ("99%", "аптайм продуктів"),
            ]
        ):
            Stat.objects.create(profile=profile, value=value, label=label, order=order)

        for order, (platform, url, label) in enumerate(
            [
                ("github", "https://github.com/username", "@username"),
                ("telegram", "https://t.me/username", "@username"),
                ("linkedin", "https://linkedin.com/in/username", ""),
                ("email", "mailto:hello@example.com", "hello@example.com"),
            ]
        ):
            SocialLink.objects.create(
                profile=profile, platform=platform, url=url, label=label, order=order
            )

        services = [
            (
                "Backend та API",
                "Проєктую та розробляю надійні REST API, інтеграції й фонові задачі на Python.",
                Service.Icon.SERVER,
            ),
            (
                "Frontend",
                "Інтерфейси на React і TypeScript з плавними анімаціями та увагою до деталей.",
                Service.Icon.LAYOUT,
            ),
            (
                "DevOps",
                "Docker, CI/CD, моніторинг і деплой, який не страшно запускати в п'ятницю.",
                Service.Icon.CLOUD,
            ),
            (
                "Боти та автоматизація",
                "Telegram-боти, парсери та скрипти, що забирають рутину.",
                Service.Icon.BOT,
            ),
        ]
        for order, (title, description, icon) in enumerate(services):
            Service.objects.create(title=title, description=description, icon=icon, order=order)

        skills: dict[str, Skill] = {}
        for cat_order, (category_name, (description, items)) in enumerate(SKILLS.items()):
            category = SkillCategory.objects.create(
                name=category_name, description=description, order=cat_order
            )
            for order, (name, level) in enumerate(items):
                skills[name] = Skill.objects.create(
                    category=category,
                    name=name,
                    level=level,
                    order=order,
                    is_featured=level >= 3,
                )

        categories = {}
        for order, (slug, name) in enumerate(
            [("web", "Веб"), ("bots", "Боти"), ("open-source", "Open Source")]
        ):
            categories[slug] = ProjectCategory.objects.create(name=name, slug=slug, order=order)

        for order, data in enumerate(PROJECTS):
            project = Project.objects.create(
                title=data["title"],
                category=categories[data["category"]],
                summary=data["summary"],
                description=data["description"],
                highlights=data["highlights"],
                role=data["role"],
                year=data["year"],
                status=data["status"],
                accent_color=data["accent"],
                is_featured=data["featured"],
                live_url="https://example.com",
                repo_url="https://github.com/username",
                order=order,
            )
            project.technologies.set(skills[name] for name in data["tech"])

        experience = [
            {
                "kind": Experience.Kind.WORK,
                "title": "Senior Full-stack Developer",
                "organization": "Nebula Labs",
                "location": "Київ · віддалено",
                "employment_type": "Full-time",
                "start_date": date(2024, 3, 1),
                "end_date": None,
                "description": "Розробляю SaaS-платформу для логістики: архітектура бекенду, "
                "менторинг команди, впровадження CI/CD.",
                "achievements": "Скоротив час відповіді API у 3 рази\n"
                "Перевів інфраструктуру на Docker і GitHub Actions\nМенторю 3 junior-розробників",
                "tech": ["Python", "Django", "React", "TypeScript", "Docker", "PostgreSQL"],
            },
            {
                "kind": Experience.Kind.WORK,
                "title": "Python Developer",
                "organization": "Crescent Studio",
                "location": "Львів",
                "employment_type": "Full-time",
                "start_date": date(2022, 6, 1),
                "end_date": date(2024, 2, 1),
                "description": "Бекенд для e-commerce проєктів клієнтів студії, інтеграції з "
                "платіжними системами та службами доставки.",
                "achievements": "Запустив 12 проєктів у продакшн\nНаписав внутрішню бібліотеку "
                "інтеграцій з Нова Пошта API",
                "tech": ["Python", "Django REST", "Celery", "Redis"],
            },
            {
                "kind": Experience.Kind.FREELANCE,
                "title": "Розробник Telegram-ботів",
                "organization": "Фриланс",
                "location": "Віддалено",
                "employment_type": "Part-time",
                "start_date": date(2021, 1, 1),
                "end_date": date(2022, 5, 1),
                "description": "Боти для малого бізнесу: запис, оплати, CRM-інтеграції.",
                "achievements": "20+ ботів для клієнтів з 5 країн",
                "tech": ["Python", "Aiogram", "PostgreSQL"],
            },
            {
                "kind": Experience.Kind.EDUCATION,
                "title": "Бакалавр комп'ютерних наук",
                "organization": "КПІ ім. Ігоря Сікорського",
                "location": "Київ",
                "employment_type": "",
                "start_date": date(2018, 9, 1),
                "end_date": date(2022, 6, 30),
                "description": "Спеціалізація — програмна інженерія та розподілені системи.",
                "achievements": "Диплом з відзнакою",
                "tech": [],
            },
        ]
        for data in experience:
            tech = data.pop("tech")
            item = Experience.objects.create(**data)
            item.technologies.set(skills[name] for name in tech)

        Certificate.objects.create(
            title="AWS Certified Developer – Associate",
            issuer="Amazon Web Services",
            issued_at=date(2025, 4, 12),
            credential_url="https://example.com",
            order=0,
        )
        Certificate.objects.create(
            title="Meta Front-End Developer",
            issuer="Coursera",
            issued_at=date(2023, 11, 3),
            credential_url="https://example.com",
            order=1,
        )

        Testimonial.objects.create(
            author="Ірина Коваль",
            role="Product Manager",
            company="Nebula Labs",
            text="Олекса — рідкісне поєднання сильного інженера та людини з відчуттям продукту. "
            "Завжди пропонує рішення, а не проблеми.",
            order=0,
        )
        Testimonial.objects.create(
            author="Martin Hughes",
            role="Founder",
            company="Orbit Analytics",
            text="Delivered our analytics backend ahead of schedule. Clean code, great "
            "communication, and a genuinely beautiful dashboard.",
            order=1,
        )

        self.stdout.write(self.style.SUCCESS("🌕 Demo content created. Edit it at /admin/."))

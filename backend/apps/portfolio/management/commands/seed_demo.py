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
        "Server logic, APIs and data",
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
        "Interfaces, animations and UX",
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
        "Infrastructure and delivery",
        [("Docker", 5), ("GitHub Actions", 4), ("Nginx", 4), ("Linux", 4), ("Traefik", 3)],
    ),
    "Tools": (
        "Everyday toolkit",
        [("Git", 5), ("Pytest", 4), ("Figma", 3), ("Aiogram", 4)],
    ),
}

PROJECTS = [
    {
        "title": "Lunar CRM",
        "category": "web",
        "summary": "CRM for small teams with kanban boards, analytics and a Telegram integration.",
        "description": (
            "Lunar CRM started as an internal tool for an agency and grew into a full product. "
            "It collects leads from the website, messengers and email into a single feed.\n\n"
            "The backend is built on Django REST with Celery background jobs; the frontend is "
            "React with optimistic updates and an offline cache."
        ),
        "highlights": "Lead processing time cut by 40%\nReal-time updates over WebSocket\n"
        "Object-level role-based access control",
        "tech": ["Django", "Django REST", "React", "TypeScript", "PostgreSQL", "Celery", "Docker"],
        "role": "Full-stack developer",
        "year": 2026,
        "status": Project.Status.LIVE,
        "accent": "#8b7cf6",
        "featured": True,
    },
    {
        "title": "Orbit Analytics",
        "category": "web",
        "summary": "Analytics dashboard with interactive charts and PDF report export.",
        "description": "A platform for collecting events from mobile apps and building funnels.",
        "highlights": "Processes 2M events per day\nCustom D3 charts",
        "tech": ["FastAPI", "Redis", "React", "TypeScript", "Tailwind CSS"],
        "role": "Backend developer",
        "year": 2025,
        "status": Project.Status.COMPLETED,
        "accent": "#38bdf8",
        "featured": False,
    },
    {
        "title": "Tide Bot",
        "category": "bots",
        "summary": "Telegram bot for barbershop bookings with online payments and reminders.",
        "description": (
            "The bot serves a chain of 6 locations and manages the barbers' schedules on its own."
        ),
        "highlights": "1,500+ active users\nPayments via Monobank API",
        "tech": ["Python", "Aiogram", "PostgreSQL", "Docker"],
        "role": "Author",
        "year": 2025,
        "status": Project.Status.LIVE,
        "accent": "#f5c66b",
        "featured": False,
    },
    {
        "title": "Crater UI",
        "category": "open-source",
        "summary": "Open-source React component kit focused on accessibility and animation.",
        "description": "A library of 40+ components with CSS-variable theming and Storybook.",
        "highlights": "300+ stars on GitHub\nFull keyboard navigation support",
        "tech": ["React", "TypeScript", "Motion", "Tailwind CSS"],
        "role": "Maintainer",
        "year": 2024,
        "status": Project.Status.IN_PROGRESS,
        "accent": "#34d399",
        "featured": False,
    },
    {
        "title": "Selene Deploy",
        "category": "open-source",
        "summary": "CI/CD template for Docker projects: build, scan and deploy in one click.",
        "description": "GitHub Actions + GHCR + Traefik with automatic SSL certificates.",
        "highlights": "Deploys in 90 seconds\nTrivy image scanning",
        "tech": ["Docker", "GitHub Actions", "Traefik", "Nginx", "Linux"],
        "role": "Author",
        "year": 2024,
        "status": Project.Status.COMPLETED,
        "accent": "#f472b6",
        "featured": False,
    },
    {
        "title": "Night Market",
        "category": "web",
        "summary": "Handmade goods marketplace with search, cart and a seller dashboard.",
        "description": "A complete e-commerce site with a moderation admin and sales statistics.",
        "highlights": "Full-text search index\nSSR for SEO",
        "tech": ["Next.js", "Django REST", "PostgreSQL", "Redis"],
        "role": "Full-stack developer",
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
        profile.full_name = "Alex Moon"
        profile.brand = "alex"
        profile.headline = "Full-stack developer"
        profile.roles = (
            "Python / Django developer\nReact + TypeScript engineer\n"
            "Telegram bot author\nDevOps enthusiast"
        )
        profile.tagline = (
            "I build fast, beautiful and reliable web products — from backend architecture "
            "to interfaces you want to keep scrolling."
        )
        profile.about = (
            "Hi! I'm a developer who likes it when complex systems look simple. "
            "For over four years I've been building web applications: from APIs and background "
            "jobs to animated interfaces and CI/CD.\n\n"
            "I enjoy projects most when engineering precision meets aesthetics: "
            "thoughtful architecture, clean code and the details users notice.\n\n"
            "Away from code — astrophotography, night walks and good coffee."
        )
        profile.location = "Kyiv, Ukraine"
        profile.timezone = "Europe/Kyiv"
        profile.email = "hello@example.com"
        profile.is_available = True
        profile.availability_text = "Open to new projects"
        profile.contact_text = (
            "Have an idea, a project, or just want to say hi? Write to me — I reply within a day."
        )
        profile.footer_text = "Made with moonlight"
        profile.language = Profile.Language.EN
        profile.seo_title = "Alex Moon — Full-stack developer"
        profile.seo_description = "Full-stack developer portfolio: Python, Django, React, DevOps."
        profile.save()

        for order, (value, label) in enumerate(
            [
                ("4+", "years of experience"),
                ("30+", "completed projects"),
                ("15", "happy clients"),
                ("99%", "product uptime"),
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
                "Backend & APIs",
                "I design and build reliable REST APIs, integrations and background jobs "
                "in Python.",
                Service.Icon.SERVER,
            ),
            (
                "Frontend",
                "React and TypeScript interfaces with smooth animations and attention to detail.",
                Service.Icon.LAYOUT,
            ),
            (
                "DevOps",
                "Docker, CI/CD, monitoring and deployments you aren't afraid to run on a Friday.",
                Service.Icon.CLOUD,
            ),
            (
                "Bots & automation",
                "Telegram bots, scrapers and scripts that take the routine off your plate.",
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
            [("web", "Web"), ("bots", "Bots"), ("open-source", "Open Source")]
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
                "location": "Kyiv · Remote",
                "employment_type": "Full-time",
                "start_date": date(2024, 3, 1),
                "end_date": None,
                "description": "Building a logistics SaaS platform: backend architecture, "
                "team mentoring, CI/CD adoption.",
                "achievements": "Cut API response time by 3x\n"
                "Moved the infrastructure to Docker and GitHub Actions\n"
                "Mentoring 3 junior developers",
                "tech": ["Python", "Django", "React", "TypeScript", "Docker", "PostgreSQL"],
            },
            {
                "kind": Experience.Kind.WORK,
                "title": "Python Developer",
                "organization": "Crescent Studio",
                "location": "Lviv",
                "employment_type": "Full-time",
                "start_date": date(2022, 6, 1),
                "end_date": date(2024, 2, 1),
                "description": "Backend for the studio's client e-commerce projects, integrations "
                "with payment providers and delivery services.",
                "achievements": "Shipped 12 projects to production\nWrote an internal library "
                "of Nova Poshta API integrations",
                "tech": ["Python", "Django REST", "Celery", "Redis"],
            },
            {
                "kind": Experience.Kind.FREELANCE,
                "title": "Telegram Bot Developer",
                "organization": "Freelance",
                "location": "Remote",
                "employment_type": "Part-time",
                "start_date": date(2021, 1, 1),
                "end_date": date(2022, 5, 1),
                "description": "Bots for small businesses: bookings, payments, CRM integrations.",
                "achievements": "20+ bots for clients from 5 countries",
                "tech": ["Python", "Aiogram", "PostgreSQL"],
            },
            {
                "kind": Experience.Kind.EDUCATION,
                "title": "BSc in Computer Science",
                "organization": "Igor Sikorsky Kyiv Polytechnic Institute",
                "location": "Kyiv",
                "employment_type": "",
                "start_date": date(2018, 9, 1),
                "end_date": date(2022, 6, 30),
                "description": "Major in software engineering and distributed systems.",
                "achievements": "Graduated with honours",
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
            author="Iryna Koval",
            role="Product Manager",
            company="Nebula Labs",
            text="Alex is a rare mix of a strong engineer and a person with real product sense. "
            "Always brings solutions, not problems.",
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

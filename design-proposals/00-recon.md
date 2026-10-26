# Етап 1 · Розвідка репозиторію (тільки читання)

Дата: 2026-10-26. Репозиторій `github.com/mxxnly/cv`, гілка `main`, 2 коміти, робоче дерево чисте.

## 1. Стек і структура

| Шар | Що є |
|---|---|
| Бекенд | Python 3.13, Django 5.2, DRF 3.18, django-unfold (адмінка), django-cleanup, Pillow (WebP-оптимізація), gunicorn, whitenoise |
| База | PostgreSQL 17 у Docker; SQLite як fallback без `POSTGRES_HOST` (локально й у CI) |
| Фронтенд | React 19, TypeScript 6, Vite 8, Tailwind CSS 4, Motion, Lenis, TanStack Query, lucide-react, simple-icons, шрифти через fontsource (Manrope, Cormorant Garamond, JetBrains Mono), WebGL-місяць |
| Інфраструктура | docker-compose (base) + `docker/development.yml` / `production.yml` (Traefik + Let's Encrypt, образи з GHCR) / `production-ip.yml` (без домену); nginx-шлюз `/api,/admin,/static → Django`, `/media`, решта → SPA |
| CI/CD | `ci.yml`: ruff, pytest (Postgres-сервіс), ESLint, tsc, vitest, vite build, Docker build на PR. `deploy.yml`: CI → build & push 3 образів у GHCR → Trivy → scp/ssh `make deploy-prod` → healthcheck `/api/health/` → очищення GHCR |
| Запуск | `make up` (Docker), `make seed`, `make test`, `make lint`; без Docker: `manage.py runserver` + `npm run dev` з проксі |
| Секрети | Лише через env (`.env`, `.env.example`). `.env` у gitignore і зараз **ідентичний** `.env.example` (паролі `admin/admin`, `portfolio`); справжніх секретів у репозиторії немає. Продакшн-`.env` рендериться з GitHub Secret `PROD_ENV_FILE` |

Модель даних (`apps/portfolio`): `Profile` (singleton), `Stat`, `SocialLink`, `Service`, `SkillCategory`, `Skill`, `Experience`, `ProjectCategory`, `Project`, `ProjectImage`, `Certificate`, `Testimonial`, `ContactMessage`. Одна міграція `0001_initial`.

API: `GET /api/portfolio/` (усе однією відповіддю, `Cache-Control: no-cache`), `POST /api/contact/` (DRF `ScopedRateThrottle` 5/год, honeypot `website`, сповіщення email/Telegram у фоновому потоці), `GET /api/health/` (middleware до перевірки хостів).

Адмінка: Unfold, drag-and-drop порядок, inline для Stat/SocialLink, бейдж непрочитаних.

Тести: pytest (API, адмінка кожної моделі, моделі, throttling, health), vitest (ui, lib). Lint: ruff (E,F,W,I,B,UP,DJ,SIM,RUF), ESLint + TS strict.

## 2. Особисті дані, CV, старі бренди

| Де | Що | Статус |
|---|---|---|
| Git-історія | автор `Maksym Skladan <maksskladan@gmail.com>`, перший коміт від `mxxnly` | лишається в історії; у коді імені немає |
| `backend/media/` (не в git) | справжнє фото профілю (`profile/*.webp`), логотипи роботодавців (`experience/akcu-logo-round.webp`, `images.webp`, `photo_2026-01-12…webp`) | локальні файли, в репозиторій не потрапляють; при ребрендингу видалити локально |
| Бренд «Portfolio / Moon» | `README.md`, `package.json` (`portfolio-frontend`), `pyproject.toml` (`portfolio-backend`), `docker-compose.yml` (`name: portfolio`), назви образів `portfolio-*`, `admin.site.site_header`, `UNFOLD.SITE_TITLE/SUBHEADER` («Moonlit admin»), `gunicorn proc_name`, кеш `portfolio-cache`, `DEFAULT_FROM_EMAIL=portfolio@localhost`, тексти сповіщень «New message from the portfolio» | переписати |
| Favicon / OG | `frontend/public/favicon.svg` (місяць), `apple-touch-icon.png`, `og-image.png` 1200×630 | замінити |
| `index.html` | `<title>Portfolio</title>`, description «Personal developer portfolio», `lang="en"`, theme-color | замінити |
| Домени / email | лише плейсхолдери `example.com`, `you@example.com`, `admin@example.com`, `hello@example.com`; `REGISTRY=ghcr.io/mxxnly` у Makefile, `.env.example`, `docker/production.yml` | реєстр лишити (власник GitHub), решта стане конфігом компанії |
| Seed | вигадані «Alex Moon», «Nebula Labs», «Crescent Studio» тощо (`seed_demo.py`), тести спираються на них | замінити на сид продуктів |
| CV-поля | `Profile.resume` (upload `resume/`), `roles`, `is_available`, `avatar`, `Experience`, `Certificate`, `Skill` | видалити або винести |
| i18n | фронтенд `strings.ts` uk/en з «місячними» формулюваннями («Повідомлення летить до місяця»); мова задається глобально в `Profile.language`, окремих URL для мов немає; бекенд `LANGUAGES=[en]`, uk-локаль адмінки видалена в 2-му коміті | переписати; зробити маршрути `/uk/…`, `/en/…` |
| robots | `Allow: /`, `Disallow: /admin/` | тимчасово `Disallow: /` + noindex |

## 3. Що залишити, переписати, видалити

**Залишити (корисна основа):**
- Docker/compose-розкладка (dev, prod з Traefik, prod без домену), nginx-шлюз, Makefile, CI/CD з GHCR, Trivy, healthcheck.
- Django + DRF + Unfold, `HealthCheckMiddleware`, `optimize_image`, `ensure_superuser`, `OrderedModel`, `ContactMessage` + honeypot + throttling + сповіщення (email/Telegram) у фоні.
- Vite/React/TS/Tailwind 4, токени тем (`data-theme`), `ThemeProvider` з View Transitions, `I18nProvider`, `Button`, `Modal`, `Reveal`, `SectionHeading`, `ContactForm` (переробити під нові поля), ESLint/TS/Vitest, ruff/pytest.

**Переписати:**
- Моделі: `Profile` → `Settings`/`Company` (з конфігу), `Project` → `Product` + `Plan`/`PriceItem` + `Category` + `Link` + `PriceHistory`; `ContactMessage` + новий `SupportRequest`.
- API: замість одного `/api/portfolio/` зробити `/api/products`, `/api/products/:slug`, `/api/prices` з ETag/кешем; `/api/contact`, `/api/support`.
- Фронтенд: одна сторінка → маршрутизація (react-router) з мовними префіксами, hreflang, canonical, OG, JSON-LD; сторінки з п. 5 ТЗ; cookie-банер + Consent Mode v2.
- Усі назви, meta, README, адмін-заголовки, тексти сповіщень, назви образів `portfolio-*` → `mxxnly-labs-*` (або лишити з поясненням у README).
- Seed → продукти-приклади з міткою «приклад».

**Видалити:**
- WebGL-місяць, зоряне небо, шейдери, Lenis-скрол (вага і LCP для реклами), «місячні» компоненти (`MoonPhase`, `moon.ts`, `moonShaders.ts`, `StarField`, `MoonCanvas`, `SkyBackground`).
- CV-сутності: `Experience`, `Certificate`, `Skill`/`SkillCategory`, `Stat`, `Testimonial` можна лишити як «справжні відгуки» (блок прихований без записів).
- Поля `resume`, `roles`, `avatar`, `is_available`, `availability_text`.
- Локальні медіа профілю/роботодавців у `backend/media/`.

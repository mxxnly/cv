# 🌙 Portfolio — "Moon"

A single-page portfolio with an admin panel. All content (profile, projects, skills, experience,
certificates, testimonials, social links) is edited in the admin, and the site picks up changes instantly.

**Stack:** Django 5.2 · DRF · Unfold admin · PostgreSQL 17 · React 19 · TypeScript · Vite · Tailwind CSS 4 ·
Motion · Lenis · WebGL · Docker · nginx · Traefik · GitHub Actions

---

## ✨ What's inside

**Site**

- 🌕 **Procedural WebGL moon**: craters, maria, libration, cursor reaction. The moon phase is tied
  to scroll: the page goes through a full lunar cycle and ends with a full moon in the contact section.
- ✨ Starry sky with parallax, twinkling and shooting stars. In daytime, dust motes float in the air instead of stars.
- 🌗 Two themes (dark "night" and light "dawn") with a circular transition via the View Transitions API.
  The system theme is used by default.
- 🌑→🌕 Skill level is shown as a moon phase, and the navigation logo "fills up" as you scroll.
- Animations: headings appear word by word, text "reveals" on scroll, magnetic buttons,
  cards with a cursor spotlight, a skills marquee, a timeline that draws itself, counters,
  smooth scrolling, and a lunar horizon with an Earthrise in the footer.
- Generative covers: a project without an image gets a unique lunar landscape in its own colour.
- Interface in English or Ukrainian (switchable in the admin), responsive, `prefers-reduced-motion`.
- Contact form with validation, honeypot and rate limiting, notifications via Telegram and/or email.

**Admin** (`/admin/`, Unfold theme)

- Singleton profile with tabs; numbers and social links are edited inline.
- Drag-and-drop ordering of projects, skills, services, certificates and testimonials.
- Projects with a gallery, accent colour, statuses and technology tags (autocomplete).
- Inbox messages with an unread counter in the menu.
- Uploaded images are automatically compressed to WebP, and old files are deleted.

---

## 🗂️ Structure

```
portfolio/
├── backend/                  # Django + DRF
│   ├── config/               # settings, urls, wsgi
│   ├── apps/portfolio/       # models, admin, API, tests, seed_demo
│   ├── entrypoint.sh         # wait for DB → migrations → superuser
│   └── gunicorn.conf.py
├── frontend/                 # React + TypeScript + Vite
│   └── src/
│       ├── api/              # types and queries (TanStack Query)
│       ├── components/
│       │   ├── sky/          # WebGL moon, stars, background
│       │   ├── sections/     # Hero, About, Skills, Experience, Projects…
│       │   ├── layout/       # Navbar, Footer, ThemeToggle
│       │   └── ui/           # buttons, cards, headings, modal…
│       ├── i18n/             # interface strings en/uk
│       └── styles/           # design tokens for both themes
├── docker/                   # Dockerfiles + compose overrides for dev/prod
├── nginx/                    # gateway: /api, /admin, /static → Django, /media, the rest → SPA
├── .github/workflows/        # ci.yml + deploy.yml
├── docker-compose.yml
└── Makefile
```

---

## 🚀 Running locally

Requires Docker and `make` (on Windows run from Git Bash).

```bash
make up      # creates .env from .env.example, builds images, starts the stack
make seed    # (optional) fills the site with demo content
```

- Site: http://localhost
- Admin: http://localhost/admin/ (login and password come from `DJANGO_SUPERUSER_*` in `.env`, `admin` / `admin` by default)

The code is mounted into the containers: Django restarts itself, Vite refreshes the page via HMR.

### Main commands

| Command | What it does |
|---|---|
| `make help` | all commands with descriptions |
| `make up` / `make down` | start / stop the dev stack |
| `make logs SERVICE=backend` | logs (without `SERVICE` — logs of all services) |
| `make seed` | demo content (**replaces** existing content) |
| `make migrate` / `make makemigrations` | migrations |
| `make test` | pytest + vitest |
| `make lint` | ruff + migrations check + ESLint + TypeScript |
| `make shell CONTAINER=backend` | shell in a container |
| `make nuke` | stop the stack and **delete the database** |

### Without Docker

```bash
# backend (SQLite instead of Postgres)
cd backend
python -m venv .venv && source .venv/Scripts/activate   # Linux/macOS: .venv/bin/activate
pip install -r requirements-dev.txt
export DEBUG=1 SECRET_KEY=dev
python manage.py migrate && python manage.py seed_demo && python manage.py createsuperuser
python manage.py runserver

# frontend (in another terminal): proxies /api, /admin, /media to :8000
cd frontend && npm install && npm run dev   # → http://localhost:5173
```

---

## 🌍 Production and CI/CD

### How the pipeline works

```
push to main ─► CI (ruff, pytest, eslint, tsc, vitest, build)
             ─► build 3 images → GHCR (backend, frontend, nginx)
             ─► Trivy scan (report in artifacts)
             ─► deploy: scp compose files → ssh → make deploy-prod
             ─► healthcheck https://DOMAIN/api/health/
             ─► clean up old images (the latest 15 are kept)
pull request ─► CI + Docker image build check
```

Manual run: **Actions → 🚀 Production CI/CD → Run workflow** (a single image can be rebuilt).

On the server: Traefik (HTTPS from Let's Encrypt, `www` → main domain redirect) → nginx → Django / SPA.
Migrations are applied automatically when the backend starts.

### 1. Server preparation (once)

```bash
curl -fsSL https://get.docker.com | sh       # Docker + compose plugin
apt-get install -y make
mkdir -p /opt/portfolio
```

DNS: A records for `example.com` and `www.example.com` pointing to the server IP. Ports 80 and 443 must be open.

### 2. GitHub setup

**Settings → Secrets and variables → Actions**

| Type | Name | Value |
|---|---|---|
| Secret | `PROD_SERVER_HOST` | server IP or domain |
| Secret | `PROD_SERVER_USER` | SSH user (e.g. `root`) |
| Secret | `PROD_SERVER_SSH_KEY` | private SSH key (the whole file contents) |
| Secret | `PROD_SERVER_PORT` | *(optional)* SSH port, `22` by default |
| Secret | `PROD_ENV_FILE` | *(optional)* full contents of the production `.env`; if set, the file is updated on every deploy |
| Variable | `DOMAIN` | `example.com`: for the environment link and the healthcheck |
| Variable | `PROD_PROJECT_DIR` | *(optional)* `/opt/portfolio` by default |

If `PROD_ENV_FILE` is not set, create `/opt/portfolio/.env` on the server manually. Required variables:

```dotenv
DOMAIN=example.com
ACME_EMAIL=you@example.com
DEBUG=0
SECRET_KEY=<python -c "import secrets; print(secrets.token_urlsafe(50))">
ALLOWED_HOSTS=example.com,www.example.com
CSRF_TRUSTED_ORIGINS=https://example.com,https://www.example.com
POSTGRES_DB=portfolio
POSTGRES_USER=portfolio
POSTGRES_PASSWORD=<strong password>
DJANGO_SUPERUSER_USERNAME=admin
DJANGO_SUPERUSER_PASSWORD=<strong password>
DJANGO_SUPERUSER_EMAIL=you@example.com
```

### 3. Deploy

Push to `main`, and GitHub Actions does the rest. On the server you can use the same commands:
`make ps-prod`, `make logs-prod`, `make backup-prod`, `make restore-prod FILE=…`.

---

## 🔔 New message notifications

Messages from the form are always saved in the admin. To also receive them on your phone, add to `.env`:

- **Telegram:** `TELEGRAM_BOT_TOKEN` (a bot from @BotFather) and `TELEGRAM_CHAT_ID` (find your id via @userinfobot).
- **Email:** `CONTACT_NOTIFY_EMAIL` + SMTP (`EMAIL_HOST`, `EMAIL_HOST_USER`, `EMAIL_HOST_PASSWORD`…).

---

## 🧪 Code quality

- Backend: **ruff** (lint + format), **pytest**: API, admin (every page), models, image optimisation, throttling.
- Frontend: **ESLint** (with React Compiler rules), **TypeScript strict**, **Vitest** + Testing Library.
- All of it runs in CI on every PR and before every deploy.

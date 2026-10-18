# 🌙 Portfolio — «Місяць»

Односторінкове портфоліо з адмінкою. Увесь контент (профіль, проєкти, навички, досвід, сертифікати,
відгуки, соцмережі) редагується в адмінці, сайт підхоплює зміни одразу.

**Стек:** Django 5.2 · DRF · Unfold admin · PostgreSQL 17 · React 19 · TypeScript · Vite · Tailwind CSS 4 ·
Motion · Lenis · WebGL · Docker · nginx · Traefik · GitHub Actions

---

## ✨ Що всередині

**Сайт**

- 🌕 **Процедурний WebGL-місяць**: кратери, моря, лібрація, реакція на курсор. Фаза місяця прив'язана
  до скролу: сторінка проходить повний місячний цикл і закінчується повнею в блоці контактів.
- ✨ Зоряне небо з паралаксом, мерехтінням і падаючими зірками. Удень замість зірок «пилинки» в повітрі.
- 🌗 Дві теми (темна «ніч» і світла «світанок») з круговим переходом через View Transitions API.
  За замовчуванням береться системна тема.
- 🌑→🌕 Рівень навичок показано фазою місяця, логотип у навігації «наповнюється» під час скролу.
- Анімації: заголовки з'являються по словах, текст «проявляється» під час скролу, магнітні кнопки,
  картки з прожектором за курсором, бігучий рядок навичок, таймлайн, що прокреслюється, лічильники,
  плавний скрол, у футері місячний горизонт зі сходом Землі.
- Генеративні обкладинки: проєкт без картинки отримує унікальний місячний пейзаж у своєму кольорі.
- Інтерфейс українською або англійською (перемикається в адмінці), адаптив, `prefers-reduced-motion`.
- Форма зворотного зв'язку з валідацією, honeypot і rate limit, сповіщення в Telegram та/або на email.

**Адмінка** (`/admin/`, тема Unfold, повністю українською)

- Профіль-синглтон з вкладками; цифри й соцмережі редагуються інлайном.
- Drag-and-drop сортування проєктів, навичок, послуг, сертифікатів і відгуків.
- Проєкти з галереєю, акцентним кольором, статусами та тегами технологій (автокомпліт).
- Вхідні повідомлення з лічильником непрочитаних у меню.
- Завантажені зображення автоматично стискаються в WebP, старі файли видаляються.

---

## 🗂️ Структура

```
portfolio/
├── backend/                  # Django + DRF
│   ├── config/               # settings, urls, wsgi
│   ├── apps/portfolio/       # моделі, адмінка, API, тести, seed_demo
│   ├── locale/uk/            # переклад рядків Unfold
│   ├── entrypoint.sh         # очікування БД → міграції → суперкористувач
│   └── gunicorn.conf.py
├── frontend/                 # React + TypeScript + Vite
│   └── src/
│       ├── api/              # типи та запити (TanStack Query)
│       ├── components/
│       │   ├── sky/          # WebGL-місяць, зорі, фон
│       │   ├── sections/     # Hero, About, Skills, Experience, Projects…
│       │   ├── layout/       # Navbar, Footer, ThemeToggle
│       │   └── ui/           # кнопки, картки, заголовки, модалка…
│       ├── i18n/             # тексти інтерфейсу uk/en
│       └── styles/           # дизайн-токени обох тем
├── docker/                   # Dockerfile'и + compose-оверрайди dev/prod
├── nginx/                    # шлюз: /api, /admin, /static → Django, /media, решта → SPA
├── .github/workflows/        # ci.yml + deploy.yml
├── docker-compose.yml
└── Makefile
```

---

## 🚀 Локальний запуск

Потрібні Docker і `make` (на Windows запускай із Git Bash).

```bash
make up      # створить .env з .env.example, збере образи, підніме стек
make seed    # (необов'язково) заповнить сайт демо-контентом
```

- Сайт: http://localhost
- Адмінка: http://localhost/admin/ (логін і пароль задаються `DJANGO_SUPERUSER_*` у `.env`, за замовчуванням `admin` / `admin`)

Код монтується в контейнери: Django перезапускається сам, Vite оновлює сторінку через HMR.

### Основні команди

| Команда | Що робить |
|---|---|
| `make help` | усі команди з описом |
| `make up` / `make down` | запустити / зупинити dev-стек |
| `make logs SERVICE=backend` | логи (без `SERVICE` логи всіх сервісів) |
| `make seed` | демо-контент (**замінює** наявний) |
| `make migrate` / `make makemigrations` | міграції |
| `make test` | pytest + vitest |
| `make lint` | ruff + перевірка міграцій + ESLint + TypeScript |
| `make shell CONTAINER=backend` | shell у контейнері |
| `make nuke` | зупинити стек і **видалити базу** |

### Без Docker

```bash
# backend (SQLite замість Postgres)
cd backend
python -m venv .venv && source .venv/Scripts/activate   # Linux/macOS: .venv/bin/activate
pip install -r requirements-dev.txt
export DEBUG=1 SECRET_KEY=dev
python manage.py migrate && python manage.py seed_demo && python manage.py createsuperuser
python manage.py runserver

# frontend (в іншому терміналі): проксує /api, /admin, /media на :8000
cd frontend && npm install && npm run dev   # → http://localhost:5173
```

---

## 🌍 Продакшн і CI/CD

### Як працює пайплайн

```
push у main ─► CI (ruff, pytest, eslint, tsc, vitest, build)
            ─► збірка 3 образів → GHCR (backend, frontend, nginx)
            ─► Trivy-сканування (звіт в артефактах)
            ─► деплой: scp compose-файлів → ssh → make deploy-prod
            ─► healthcheck https://DOMAIN/api/health/
            ─► чистка старих образів (залишаються останні 15)
pull request ─► CI + перевірка збірки Docker-образів
```

Ручний запуск: **Actions → 🚀 Production CI/CD → Run workflow** (можна перезібрати один образ).

На сервері: Traefik (HTTPS від Let's Encrypt, редирект `www` → основний домен) → nginx → Django / SPA.
Міграції застосовуються автоматично під час старту бекенду.

### 1. Підготовка сервера (один раз)

```bash
curl -fsSL https://get.docker.com | sh       # Docker + compose plugin
apt-get install -y make
mkdir -p /opt/portfolio
```

DNS: A-записи `example.com` і `www.example.com` на IP сервера. Порти 80 і 443 мають бути відкриті.

### 2. Налаштування GitHub

**Settings → Secrets and variables → Actions**

| Тип | Назва | Значення |
|---|---|---|
| Secret | `PROD_SERVER_HOST` | IP або домен сервера |
| Secret | `PROD_SERVER_USER` | користувач SSH (напр. `root`) |
| Secret | `PROD_SERVER_SSH_KEY` | приватний SSH-ключ (весь вміст файлу) |
| Secret | `PROD_SERVER_PORT` | *(необов'язково)* порт SSH, за замовчуванням `22` |
| Secret | `PROD_ENV_FILE` | *(необов'язково)* повний вміст продакшн-`.env`; якщо задано, файл оновлюється на кожному деплої |
| Variable | `DOMAIN` | `example.com`: для посилання в environment і healthcheck |
| Variable | `PROD_PROJECT_DIR` | *(необов'язково)* за замовчуванням `/opt/portfolio` |

Якщо `PROD_ENV_FILE` не задано, створи `/opt/portfolio/.env` на сервері вручну. Обов'язкові змінні:

```dotenv
DOMAIN=example.com
ACME_EMAIL=you@example.com
DEBUG=0
SECRET_KEY=<python -c "import secrets; print(secrets.token_urlsafe(50))">
ALLOWED_HOSTS=example.com,www.example.com
CSRF_TRUSTED_ORIGINS=https://example.com,https://www.example.com
POSTGRES_DB=portfolio
POSTGRES_USER=portfolio
POSTGRES_PASSWORD=<надійний пароль>
DJANGO_SUPERUSER_USERNAME=admin
DJANGO_SUPERUSER_PASSWORD=<надійний пароль>
DJANGO_SUPERUSER_EMAIL=you@example.com
```

### 3. Деплой

Push у `main`, і все інше робить GitHub Actions. На сервері можна користуватися тими самими командами:
`make ps-prod`, `make logs-prod`, `make backup-prod`, `make restore-prod FILE=…`.

---

## 🔔 Сповіщення про нові повідомлення

Повідомлення з форми завжди зберігаються в адмінці. Щоб отримувати їх ще й на телефон, додай у `.env`:

- **Telegram:** `TELEGRAM_BOT_TOKEN` (бот від @BotFather) і `TELEGRAM_CHAT_ID` (свій id можна дізнатися в @userinfobot).
- **Email:** `CONTACT_NOTIFY_EMAIL` + SMTP (`EMAIL_HOST`, `EMAIL_HOST_USER`, `EMAIL_HOST_PASSWORD`…).

---

## 🧪 Якість коду

- Backend: **ruff** (лінт + формат), **pytest**: API, адмінка (усі сторінки), моделі, оптимізація зображень, throttling.
- Frontend: **ESLint** (з правилами React Compiler), **TypeScript strict**, **Vitest** + Testing Library.
- Усе це запускається в CI на кожен PR і перед кожним деплоєм.

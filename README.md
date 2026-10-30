# MXXNLY Labs: сайт компанії

Сайт команди розробників MXXNLY Labs: каталог продуктів із прайс-листами, сторінки продуктів,
підтримка, контакти, юридичні сторінки, посадкові сторінки для реклами. Торгова назва MXXNLY Labs;
продавець ФОП Складан М. Я. (не окрема юридична особа).

**Стек:** Django 5.2 · DRF · Unfold · PostgreSQL 17 · React 19 · TypeScript · Vite · Tailwind CSS 4 ·
react-router · Docker · nginx · Traefik · GitHub Actions.

> **Стан:** усі заглушки ще на місці (див. «Замінити перед запуском»). Поки вони є, production-збірка
> навмисно падає, а сайт закритий від індексації.

---

## Зміст

1. [Запуск локально](#запуск-локально)
2. [Змінні середовища](#змінні-середовища)
3. [Дані компанії: один файл](#дані-компанії-один-файл)
4. [Замінити перед запуском](#замінити-перед-запуском)
5. [Як додати продукт і змінити ціну](#як-додати-продукт-і-змінити-ціну)
6. [API](#api)
7. [Сторінки й маршрути](#сторінки-й-маршрути)
8. [Аналітика, згода на cookie, конверсії](#аналітика-згода-на-cookie-конверсії)
9. [Google Ads: чек-лист перед запуском реклами](#google-ads-чек-лист-перед-запуском-реклами)
10. [SEO](#seo)
11. [Безпека і персональні дані](#безпека-і-персональні-дані)
12. [Деплой](#деплой)
13. [Якість: тести, лінт, CI](#якість-тести-лінт-ci)
14. [Структура](#структура)
15. [Рішення за замовчуванням](#рішення-за-замовчуванням)

---

## Запуск локально

Потрібні Docker і `make`.

```bash
make up      # створює .env з .env.example, збирає образи, запускає стек → http://localhost
make seed    # 18 продуктів портфеля з тарифами; ціни-приклади з міткою «приклад», Khonsu: реальні з khonsu.cc
```

- Сайт: http://localhost/uk (англійська: http://localhost/en)
- Адмінка: http://localhost/admin/ (`DJANGO_SUPERUSER_*` з `.env`, за замовчуванням `admin` / `admin`)
- Зайняті порти: змініть `HTTP_PORT`, `BACKEND_PORT_HOST`, `POSTGRES_PORT_HOST` у `.env`.

Код змонтовано в контейнери: Django перезапускається сам, Vite оновлює сторінку через HMR.

| Команда | Що робить |
|---|---|
| `make help` | усі команди |
| `make up` / `make down` | запуск / зупинка dev-стеку |
| `make seed` | приклади продуктів (**замінює** наявні) |
| `make test` | pytest + vitest |
| `make lint` | ruff + перевірка міграцій + ESLint + TypeScript |
| `make check-placeholders` | список заглушок у `config/company.json` |
| `make csp-hash` | хеш inline-скрипта теми для CSP (після зміни `frontend/index.html`) |
| `make migrate` / `make makemigrations` | міграції |
| `make nuke` | зупинити стек і **видалити базу** |

Без Docker: бекенд `cd backend && pip install -r requirements-dev.txt && DEBUG=1 SECRET_KEY=dev python manage.py migrate && python manage.py seed_demo --publish && python manage.py runserver`
(SQLite), фронтенд `cd frontend && npm install && npm run dev` (проксі на `:8000`).

## Змінні середовища

Усі описані в [`.env.example`](.env.example). Секрети живуть лише в змінних середовища.

| Змінна | Призначення |
|---|---|
| `DEBUG`, `SECRET_KEY`, `ALLOWED_HOSTS`, `CSRF_TRUSTED_ORIGINS` | стандартні Django |
| `SITE_ENV` | `development` / `staging` / `production`: мітка «Тестові дані», індексація, бейдж в адмінці |
| `ALLOW_PLACEHOLDERS` | `1` лише для staging: дозволяє production-збірку з заглушками |
| `COMPANY_CONFIG` | шлях до `company.json` (за замовчуванням `../config/company.json`, у Docker `/config/company.json`) |
| `POSTGRES_*` | база (без `POSTGRES_HOST` використовується SQLite) |
| `FORMS_THROTTLE_RATE` | ліміт форм на IP, за замовчуванням `5/hour` |
| `TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY` | Cloudflare Turnstile (необов'язково; honeypot і ліміт діють завжди) |
| `CONTACT_NOTIFY_EMAIL`, `EMAIL_*`, `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID` | сповіщення про нові форми |
| `DOMAIN`, `ACME_EMAIL`, `REGISTRY`, `IMAGE_TAG` | production (Traefik, GHCR) |

## Дані компанії: один файл

Усі дані компанії (назва, продавець, реквізити, контакти, домен, платіжний провайдер,
ідентифікатори аналітики, стан юридичних текстів) живуть у [`config/company.json`](config/company.json).
Звідти їх беруть бекенд (`settings.COMPANY`, `GET /api/company/`, листи, sitemap, robots),
фронтенд (Vite-плагін підставляє значення в `index.html` і константу `__COMPANY__`) і CI.
Жорстко прописаних реквізитів у шаблонах немає. Формат: [`config/README.md`](config/README.md).

Поля з `placeholder: true` є тимчасовими заглушками. Поки вони лишаються:

- `python manage.py check_placeholders` і production-збірка фронтенду (`NODE_ENV=production`) **падають**
  зі списком полів; Docker-образи для production не збираються (`ALLOW_PLACEHOLDERS=1` лише для staging);
- весь сайт отримує `X-Robots-Tag: noindex, nofollow`, `/robots.txt` віддає `Disallow: /`, sitemap не
  вказується;
- у `SITE_ENV=development|staging` над шапкою показується смужка «Тестові дані», а заглушки в підвалі
  підкреслені пунктиром.

Заглушкам навмисно не дано схожих на справжні реквізитів, номерів карток чи IBAN.

## Замінити перед запуском

`config/company.json`:

- [ ] `seller.tax_id`: РНОКПП або номер запису в ЄДР (зараз приховано як `********`)
- [ ] `seller.address`, `seller.address_en`: вказати номер будинку замість `***` (с. Липівці, вул. Юліана Ковальського)
- [x] `contacts.email`, `contacts.telegram`, `contacts.phone`: заповнено 26.10.2026
- [x] `site.domain` = mxxnly.com, `DOMAIN` у production-`.env`: заповнено 26.10.2026
- [ ] `payment.provider` (`TBD`), `payment.link_base` (`https://example.com/pay/`); або `buy_url` у кожному тарифі
- [ ] `pricing.tax_note`: підтвердити у бухгалтера формулювання про ПДВ і прибрати `tax_note_placeholder`
- [ ] `analytics.ga4_measurement_id`, `analytics.ads_conversion_id`, `analytics.ads_conversion_labels.*`
- [ ] `legal.documents_placeholder`: юридичні тексти (uk і en) перевірені юристом (тоді зникне мітка «ЧЕРНЕТКА» у конфігу; текст мітки на сторінках прибрати в `frontend/src/i18n/strings.ts` → `legal.draft`)

Адмінка і контент:

- [ ] Тарифи: зняти прапорець «Приклад» (`is_example`), перевірити ціни, валюту, період, «дійсна до», опублікувати
- [ ] Продукти: статус, тексти uk/en, SEO-поля, посилання на документацію/демо/оплату (зараз `example.com`)
- [ ] Налаштування сайту → «Про нас»: справжній текст, зняти «є заглушкою»
- [ ] Відгуки: лише справжні з дозволом автора, інакше блок лишається прихованим

Середовище:

- [ ] production-`.env`: `SITE_ENV=production`, `SECRET_KEY`, паролі, `ALLOWED_HOSTS`, `CSRF_TRUSTED_ORIGINS`, SMTP/Telegram
- [ ] Локально видалити старі медіа CV: `backend/media/` (не в git)
- [ ] `python manage.py check_placeholders` виводить «no placeholders left»

## Як додати продукт і змінити ціну

**Новий продукт.** Адмінка → Каталог → Продукти → Додати. Заповніть назву, slug, тексти uk (en за
бажанням, інакше показується uk), статус (`Доступний` / `Бета` / `Скоро`), відтінок картки, іконку,
головну дію (`Купити` / `Запросити демо` / `Зв'язатися`). У вкладках додайте тарифи, посилання
(купівля, документація, демо) і FAQ. Публікація: поле «Публікація» → «Опубліковано» або дія
«Опублікувати» у списку. Прапорець «Приватний проєкт» ховає продукт назавжди (так зберігається Khonsu).

**Ціна.** Тарифи → потрібний тариф → змініть «Ціна» / «Валюта» / «Період» / «Дійсна до» і збережіть.
Автоматично: запис в «Історію цін» (стара і нова ціна), оновлення «Ціни оновлено» у продукту, скидання
кешу API (ETag змінюється). Тариф видно на сайті лише з прапорцем «Опубліковано»; прапорець «Приклад»
додає мітку «приклад» біля ціни. Ціна порожня + період «за запитом» = тариф «Custom».

З коду: `python manage.py seed_demo --force --publish` відтворює продукти з сиду (18 продуктів: VPN, Selene, Khonsu, Lunaflow та решта портфеля; дані в `seed_demo.py` і `_seed_portfolio.py`).

## API

Публічне API лише для читання, JSON, кеш 5 хв на сервері + `ETag`/`304`, `Cache-Control: public, max-age=60`.
Мова через `?lang=uk|en` (або `Accept-Language`), відповідь має `Content-Language`.

| Метод і шлях | Що повертає |
|---|---|
| `GET /api/products/?lang=uk` | опубліковані, не приватні продукти: статус, мінімальна ціна, посилання |
| `GET /api/products/<slug>/` | продукт з описом, можливостями, тарифами, FAQ, умовами підтримки, SEO |
| `GET /api/prices/` | усі опубліковані тарифи всіх продуктів + примітки про податки/повернення |
| `GET /api/site/` | тексти з «Налаштувань сайту» і видимі відгуки |
| `GET /api/company/` | публічні дані з `company.json` + прапорці середовища (`has_placeholders`, `indexable`) |
| `POST /api/contact/`, `POST /api/support/` | форми: валідація, honeypot `website`, ліміт `5/hour`, необов'язковий `turnstile_token`, `attribution` (UTM, gclid) |
| `GET /api/health/` | healthcheck (до перевірки `ALLOWED_HOSTS`) |
| `GET /robots.txt`, `GET /sitemap.xml` | генеруються Django з урахуванням заглушок і мов |

Адмінка (`/admin/`) є захищеним CRUD: продукти, тарифи, історія цін (тільки читання), категорії,
вхідні повідомлення й звернення з бейджами непрочитаних, відгуки, налаштування сайту.

## Сторінки й маршрути

Усі сторінки мають мовний префікс: `/en/...` (основна) і `/uk/...`; `/` перенаправляє на `/en` (на `/uk`,
якщо браузер віддає перевагу українській). Старі шляхи без префікса отримують `/en`.

| Шлях | Сторінка |
|---|---|
| `/` | головна: герой, ключові продукти з цінами «від», «Розробляємо й підтримуємо», відгуки (лише справжні, інакше прихований), контакти |
| `/products`, `/products/:slug` | каталог з фільтрами за статусом; продукт: опис, можливості, для кого, тарифи, FAQ, підтримка, посилання, дата оновлення цін |
| `/prices` | прайс-лист: усі тарифи, що входить, термін дії, повернення, податки, оплата |
| `/support` | форма звернення, SLA, канали, FAQ |
| `/about`, `/contacts` | про нас (текст-заглушка позначений), контакти з реквізитами ФОП |
| `/legal/offer`, `/legal/privacy`, `/legal/terms`, `/legal/refund`, `/legal/cookies` | юридичні чернетки двома мовами з міткою «ЧЕРНЕТКА, потребує перевірки юристом» (`frontend/src/content/legal/*.uk.md` і `*.en.md`, реквізити через токени `{{...}}`; українська редакція має пріоритет) |
| `/lp/:slug` | посадкова сторінка під кампанію: без навігації, одна дія, тарифи з умовами, реквізити; `noindex` |
| будь-який інший | 404; помилки рендера ловить сторінка помилки |

Реквізити продавця, посилання на документи, примітки про ціни (валюта, податки, повернення, термін дії,
платіжний провайдер) є на кожній сторінці.

## Аналітика, згода на cookie, конверсії

- Банер cookie з трьома діями (Прийняти / Відхилити / Налаштувати: аналітика та реклама окремо). Вибір
  зберігається в `localStorage` (`cookie-consent`), змінюється через «Налаштування cookie» в підвалі.
- **Google Consent Mode v2**: за замовчуванням `ad_storage`, `ad_user_data`, `ad_personalization`,
  `analytics_storage` = `denied` (`frontend/src/lib/consent.ts`, виконується до будь-якого тегу).
  `gtag.js` завантажується лише після згоди **і** лише якщо ідентифікатори в `company.json` не є
  заглушками: у dev нічого не відправляється в Google.
- **Атрибуція**: `utm_*`, `gclid`, сторінка входу та referrer запам'ятовуються в `sessionStorage` на
  першій сторінці сесії й передаються з формами (видно в адмінці як «Джерело»).
- **Конверсії** (`trackConversion`): `lead` при відправці форми (`generate_lead`), `checkout` при кліку
  «Купити» (`begin_checkout` з `item_id`, сумою й валютою). `purchase` відбувається на зовнішньому
  платіжному сервісі: імпортуйте її в Google Ads з провайдера або через офлайн-конверсії, коли провайдер
  буде обраний. Мітки конверсій: `analytics.ads_conversion_labels.*`.
- Ідентифікатори GA4 і Google Ads у конфігу є заглушками (`G-PLACEHOLDER0`, `AW-0000000000`).

## Google Ads: чек-лист перед запуском реклами

Повний звіт з посиланнями на політики: [`docs/google-ads-vpn-policy.md`](docs/google-ads-vpn-policy.md)
(перевірено 26.10.2026; політики змінюються, перевіряйте перед кожним запуском).

**Висновок щодо VPN.** Рекламувати платний VPN у Google Ads можна: окремої заборони чи сертифікації
для VPN немає. Єдине пряме обмеження, політика «Enabling dishonest behavior», забороняє рекламу VPN
як засобу обходу гео-обмежень. Україна, Польща, Німеччина, США, Велика Британія: дозволено; Росія та
санкційні території: заборонено; Китай: фактично заборонено (не підтверджено первинною сторінкою
політики). Сайт вже не обіцяє анонімності чи обходу блокувань; у текстах це варто й надалі уникати.

Перед запуском:

- [ ] Усі пункти «Замінити перед запуском» виконані; `SITE_ENV=production`, `robots.txt` віддає `Allow: /`
- [ ] Ціни, валюта, період і умови в оголошеннях збігаються з `/prices` і `/lp/:slug` (посадкова сторінка
      кампанії: `https://<домен>/uk/lp/vpn`, `.../lp/selene`)
- [ ] Повна ціна з інтервалом списання, податками, умовами автопродовження і повернення помітна на лендингу
      («Dishonest pricing practices», діє з 28.10.2025)
- [ ] Жодних «№1», «100% безпека», «анонімність», «обхід блокувань», «no logs» без документального підтвердження
- [ ] Реквізити продавця, контакти, оферта, політика конфіденційності, умови використання, повернення
      опубліковані і перевірені юристом; сторінки не містять «ЧЕРНЕТКА»
- [ ] Банер згоди і Consent Mode v2 працюють (перевірити в Tag Assistant: `ad_user_data`, `ad_personalization`)
- [ ] Конверсії `lead` і `checkout` налаштовані в Google Ads; `purchase` імпортується з платіжного провайдера
- [ ] Пройдено Advertiser verification; дані акаунта збігаються з платіжним профілем ФОП
- [ ] Core Web Vitals у зеленій зоні (PageSpeed Insights для `/uk`, `/uk/prices`, `/uk/lp/vpn`)
- [ ] Не таргетувати Росію, Крим, т. зв. ДНР/ЛНР, Іран, Кубу, КНДР

## SEO

- `title`, `description`, `canonical`, `hreflang` (`uk`, `en`, `x-default`), Open Graph і `og:locale` на
  кожній сторінці (`frontend/src/lib/seo.ts`).
- JSON-LD `Organization` усюди, `Product` з `Offer` на сторінках продуктів.
- `/sitemap.xml` з усіма мовними версіями і `xhtml:link` alternates; `/robots.txt` залежить від заглушок.
- Сторінка `/lp/:slug` має `noindex`: вона для реклами, канонічна версія є на `/products/:slug`.
- Сайт є SPA: Google рендерить JavaScript, але для максимальної швидкості індексації можна додати
  попередній рендер (prerender) пізніше; дані завантажуються одним малим запитом, LCP є текстом.
- Швидкість: шрифти самохостяться (Bricolage Grotesque + Onest для кирилиці, IBM Plex Mono для міток), без анімаційних бібліотек, без розмиття, CSS ~10 кБ gzip,
  JS ~150 кБ gzip (React + router + query).

## Безпека і персональні дані

- Секрети лише в змінних середовища; `.env` у gitignore.
- Заголовки на SPA в production (`docker/frontend.nginx.conf`): Content-Security-Policy (дозволені лише
  власний домен, gtag/analytics і Turnstile), HSTS, `X-Content-Type-Options`, `X-Frame-Options`,
  `Referrer-Policy`, `Permissions-Policy`; Django додає свої для `/api` і `/admin`. Після зміни
  inline-скрипта теми в `frontend/index.html` оновіть хеш командою `make csp-hash`.
- CSRF: адмінка використовує Django CSRF; публічні форми приймають лише JSON на тому самому домені
  (CORS не відкрито), з honeypot, лімітом за IP і необов'язковим Turnstile.
- Форми зберігають мінімум: ім'я, email, текст, обраний продукт, UTM/gclid; IP лише як солений хеш
  (`ip_hash`) для боротьби зі спамом; User-Agent не зберігається.
- Логи без персональних даних: записується лише `contact message #id received`.
- Оплата: тільки посилання на зовнішній сервіс (`payment.link_base` або `buy_url` тарифу). Дані карток на
  сайті не обробляються й не зберігаються.
- Медіа-завантажень на сайті зараз немає; оптимізатор зображень зі старого коду (`optimize_image`) лишився в історії git, якщо знадобиться.

## Деплой

```
push у main ─► CI (ruff, pytest на Postgres, eslint, tsc, vitest, vite build)
             ─► збірка 3 образів → GHCR (mxxnly-labs-backend, -frontend, -nginx)
                 ❌ падає, поки в config/company.json є заглушки (ALLOW_PLACEHOLDERS лише для staging)
             ─► Trivy (звіт в артефактах)
             ─► scp compose-файлів → ssh → make deploy-prod → healthcheck https://DOMAIN/api/health/
             ─► очищення старих образів (лишається 15)
```

Ручний запуск: **Actions → 🚀 Production CI/CD → Run workflow** (можна перебрати один образ).

На сервері: Traefik (HTTPS від Let's Encrypt, `www` → основний домен) → nginx → Django / SPA.
Домен mxxnly.com обслуговується через Cloudflare (проксі увімкнено): у `.env` задано `TRUSTED_PROXY_IPS`
з діапазонами Cloudflare, щоб Django бачив реальні IP відвідувачів (ліміти форм, хеш IP). Режим SSL у
Cloudflare має бути **Full (strict)**, сертифікат на сервері видає Let's Encrypt.
Міграції застосовуються при старті бекенду. Без домену: `docker/production-ip.yml` (nginx на `:80`).

**Підготовка сервера (один раз):** `curl -fsSL https://get.docker.com | sh`, `apt-get install -y make`,
`mkdir -p /opt/mxxnly-labs`, A-записи домену і `www` на сервер, відкриті порти 80 і 443.

**GitHub → Settings → Secrets and variables → Actions:**

| Тип | Назва | Значення |
|---|---|---|
| Secret | `PROD_SERVER_HOST`, `PROD_SERVER_USER`, `PROD_SERVER_SSH_KEY`, `PROD_SERVER_PORT` (необов'язково) | доступ по SSH |
| Secret | `PROD_ENV_FILE` (необов'язково) | повний вміст production-`.env`; оновлюється при кожному деплої |
| Variable | `DOMAIN` | домен для посилання середовища і healthcheck |
| Variable | `PROD_PROJECT_DIR` | за замовчуванням `/opt/mxxnly-labs` |
| Variable | `ALLOW_PLACEHOLDERS` | `1` **лише** для staging-сервера |

Мінімальний production-`.env`:

```dotenv
DOMAIN=mxxnly.example
ACME_EMAIL=you@example.com
SITE_ENV=production
DEBUG=0
SECRET_KEY=<python -c "import secrets; print(secrets.token_urlsafe(50))">
ALLOWED_HOSTS=mxxnly.example,www.mxxnly.example
CSRF_TRUSTED_ORIGINS=https://mxxnly.example,https://www.mxxnly.example
POSTGRES_DB=mxxnly
POSTGRES_USER=mxxnly
POSTGRES_PASSWORD=<strong password>
DJANGO_SUPERUSER_USERNAME=admin
DJANGO_SUPERUSER_PASSWORD=<strong password>
DJANGO_SUPERUSER_EMAIL=you@example.com
CONTACT_NOTIFY_EMAIL=... або TELEGRAM_BOT_TOKEN/TELEGRAM_CHAT_ID
```

На сервері доступні `make ps-prod`, `make logs-prod`, `make backup-prod`, `make restore-prod FILE=…`.

## Якість: тести, лінт, CI

- Бекенд: **ruff** (lint + format), **pytest**: API (публікація/приватність продуктів, локалізація, ETag/304,
  прайс, форми, honeypot, ліміт, Turnstile, атрибуція), моделі (історія цін, slug, валідація тарифу),
  адмінка (кожна сторінка), sitemap, robots, noindex, `check_placeholders`, seed.
- Фронтенд: **ESLint** (правила React Compiler), **TypeScript strict**, **Vitest**: форматування цін і дат,
  токени юридичних текстів, атрибуція, згода (Consent Mode), валідація форм, компоненти.
- CI на кожному PR і перед деплоєм, плюс перевірка збірки Docker-образів на PR.
- Локально: `make check` (лінт + тести).

## Структура

```
config/company.json         дані компанії (єдине джерело), config/README.md
backend/
  config/                   settings, urls (SITE_ENV, COMPANY, Unfold)
  apps/core/                company loader, check_placeholders, ensure_superuser, health, robots, noindex
  apps/catalog/             моделі, адмінка, API, форми, сповіщення, sitemap, seed_demo, тести
frontend/
  index.html                meta з company.json (%COMPANY_NAME% тощо), бутстрап теми (?theme=light|dark)
  vite.config.ts            плагін company.json + перевірка заглушок
  src/
    company.ts              __COMPANY__, заглушки, середовище
    i18n/                   словники uk/en, href з мовним префіксом
    api/                    типи, клієнт, TanStack Query
    lib/                    seo, consent (Consent Mode v2), attribution, format, validation
    components/             layout (Header, Footer, Logo), ProductCard, PlanCard, InquiryForm, CookieBanner, ui/
    pages/                  Home, Products, ProductPage, Prices, StaticPages, Legal, Landing
    content/legal/          чернетки юридичних текстів (uk, markdown)
  public/                   favicon.svg, icon-*.png, apple-touch-icon.png, og-image.png, site.webmanifest
design-proposals/           етап 2: варіанти логотипа й дизайну; раунд 1 (не обрано), раунд 2: round-2/, обрано 01 Riso (двофарбний друк: папір, чорнило, кобальт, рожевий)
docs/google-ads-vpn-policy.md   перевірка політик Google Ads щодо VPN
docker/, nginx/             образи, compose-оверлеї, шлюз (robots/sitemap → Django)
.github/workflows/          ci.yml, deploy.yml
```

## Рішення за замовчуванням

- **Ціни не публікуються за замовчуванням.** `Plan.is_published=False`, `Product.publish_status=draft`;
  `make seed` публікує приклади лише для перегляду в dev (`--publish`), мітка «приклад» лишається.
- **Портфель із 18 продуктів.** Крім VPN (доступний) і Selene (бета), усі продукти зі статусом «Скоро» й
  ціною-прикладом; Haven і Moondust без тарифів (реклама, безкоштовні). Назви й ціни взято з плану портфеля.
- **Khonsu** показується в бета-статусі з реальним прайсом із khonsu.cc/pricing (New Moon $0, Crescent
  $7.99, Full Moon $14.99, Supermoon $24.99 на місяць, Eclipse $349 разово; річна оплата в описі тарифів),
  мітки «приклад» немає, кнопка «Купити» веде на khonsu.cc. Якщо його треба сховати, ставте «Приватний проєкт».
- **Selene** є робочою назвою парсера накладних (колишній Invoice); змінюється полем «Назва» в адмінці.
- **Одна адмінка Unfold** замість окремої панелі: усе CRUD-керування продуктами й цінами там.
- **Дані компанії у JSON**, а не в `.env`: їх читають і Python, і Vite, і CI; заглушки позначені явно.
- **Мови через префікс URL**, англійська основна (`x-default`), українська друга; EN-тексти беруться з
  полів `_en`, порожні падають до uk. Юридичні документи є обома мовами; англійська є перекладом, і в тексті зазначено, що
  у разі розбіжностей чинна українська редакція.
- **SPA збережено** (React + Vite), бо це корисна частина старого коду; «місячні» ефекти, Lenis, Motion
  і CV-сутності видалені заради швидкості й CWV.
- **Платіжний провайдер «TBD»**: кнопка «Купити» веде на `payment.link_base/<product>/<plan>` або
  `buy_url` тарифу; інтеграції й обробки карток немає.
- **Відгуки** показуються лише з прапорцем «Показувати»; за замовчуванням блок прихований.
- **Команда** на сторінці «Про нас» заповнюється в адмінці (Сайт → Команда): ім'я, посада й опис українською й англійською, фото (квадратне, до 3 МБ; без фото показуються ініціали), посилання Telegram, GitHub, LinkedIn. Поки немає жодного видимого запису, блок прихований. Фото лежать у `media/team/` (на проді це том `media_data`).
- **Cookie-згода** зберігається локально (без сервера), аналітика з ідентифікаторами-заглушками не
  вантажиться навіть після згоди.
- **Назви Docker-образів** змінено на `mxxnly-labs-*`; старі `portfolio-*` у GHCR можна видалити вручну.
- **Старі локальні медіа** (`backend/media/`, не в git) не видалялися автоматично: зробіть це вручну.

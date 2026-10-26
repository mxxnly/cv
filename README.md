# MXXNLY Labs: сайт компанії

Сайт команди розробників MXXNLY Labs: каталог продуктів із прайс-листами, сторінки продуктів,
підтримка, контакти, юридичні сторінки. Торгова назва MXXNLY Labs; продавець ФОП Складан М. Я.

> Стан: ребрендинг у процесі. Етапи 1–3 виконані (розвідка, дизайн, конфіг компанії), далі
> бекенд каталогу, сторінки, SEO/Ads, тести. Цей README доповнюється на кожному етапі.

**Стек:** Django 5.2 · DRF · Unfold · PostgreSQL 17 · React 19 · TypeScript · Vite · Tailwind CSS 4 ·
Docker · nginx · Traefik · GitHub Actions.

---

## Дані компанії: один файл

Усі дані компанії (назва, продавець, реквізити, контакти, домен, платіжний провайдер, ідентифікатори
аналітики) живуть у [`config/company.json`](config/company.json). Шаблони, листи, API і meta-теги
беруть значення звідти, жорстко прописаних значень немає. Формат і правила: [`config/README.md`](config/README.md).

Поля з `placeholder: true` є тимчасовими заглушками. Поки вони лишаються:

- `python manage.py check_placeholders` і production-збірка фронтенду (`NODE_ENV=production`) **падають**
  зі списком полів; Docker-образи для production не збираються. Для staging задайте `ALLOW_PLACEHOLDERS=1`;
- весь сайт отримує `X-Robots-Tag: noindex, nofollow`, а `/robots.txt` віддає `Disallow: /`;
- у `SITE_ENV=development|staging` на сторінках показується мітка «Тестові дані».

## Замінити перед запуском

Чек-лист заглушок у `config/company.json` (усі позначені `placeholder: true`):

- [ ] `seller.tax_id`: РНОКПП або номер запису в ЄДР (зараз `0000000000`)
- [ ] `seller.address`, `seller.address_en`: адреса ФОП (зараз «м. Львів, вул. Приклад, 1»)
- [ ] `contacts.email` (`hello@example.com`), `contacts.phone` (`+380 00 000 00 00`), `contacts.telegram` (`@mxxnly_placeholder`)
- [ ] `site.domain` (`mxxnly.example`) і такий самий `DOMAIN` у `.env`
- [ ] `payment.provider` (`TBD`), `payment.link_base` (`https://example.com/pay/`)
- [ ] `pricing.tax_note`: підтвердити у бухгалтера формулювання про ПДВ
- [ ] `analytics.ga4_measurement_id`, `analytics.ads_conversion_id`, `analytics.ads_conversion_labels.*`
- [ ] `legal.documents`: юридичні тексти перевірені юристом, прибрати позначку «ЧЕРНЕТКА»
- [ ] Ціни продуктів в адмінці: зняти мітку «приклад», опублікувати
- [ ] Змінні середовища production (`SECRET_KEY`, паролі, `SITE_ENV=production`, SMTP/Telegram)

Після цього `python manage.py check_placeholders` має вивести «no placeholders left».

---

## Запуск локально

Потрібні Docker і `make`.

```bash
make up      # створює .env з .env.example, збирає образи, запускає стек → http://localhost
make seed    # (необов'язково) приклади продуктів
```

Адмінка: http://localhost/admin/ (`DJANGO_SUPERUSER_*` з `.env`, за замовчуванням `admin` / `admin`).

| Команда | Що робить |
|---|---|
| `make help` | усі команди |
| `make up` / `make down` | запуск / зупинка dev-стеку |
| `make test` | pytest + vitest |
| `make lint` | ruff + перевірка міграцій + ESLint + TypeScript |
| `make check-placeholders` | список заглушок у `config/company.json` |
| `make nuke` | зупинити стек і **видалити базу** |

Змінні середовища описані в [`.env.example`](.env.example). Секрети лише там, у репозиторії їх немає.

## Деплой

Push у `main` → GitHub Actions: CI → збірка образів `mxxnly-labs-{backend,frontend,nginx}` у GHCR →
Trivy → деплой по SSH (`make deploy-prod`) → healthcheck. Production-збірка образів містить перевірку
заглушок і падає, поки `config/company.json` не заповнений (див. вище). Налаштування секретів і
змінних GitHub описані в розділі «Деплой» нижче (буде доповнено на етапі 7).

---

## Структура

```
config/company.json       дані компанії (єдине джерело)
backend/                  Django + DRF
  apps/core/              конфіг компанії, health, robots, noindex, перевірка заглушок
  apps/portfolio/         (тимчасово) старий застосунок; замінюється на apps/catalog на етапі 4
frontend/                 React + TypeScript + Vite
design-proposals/         етап 2: варіанти логотипа й дизайну, обраний напрямок 04-soft-violet
docker/, nginx/           образи, compose-оверлеї, шлюз
.github/workflows/        ci.yml, deploy.yml
```

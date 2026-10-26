"""The company products. Prices created here are examples and marked «приклад»."""

from datetime import date

from django.core.management.base import BaseCommand, CommandError
from django.db import transaction

from apps.catalog.models import Category, Plan, Product, ProductFAQ, ProductLink, SiteSettings

PRODUCTS = [
    {
        "name": "MXXNLY VPN",
        "slug": "vpn",
        "category": "network",
        "availability": Product.Availability.AVAILABLE,
        "tint": Product.Tint.PERIWINKLE,
        "icon": Product.Icon.SHIELD,
        "cta": Product.Cta.BUY,
        "tagline_uk": "Шифроване з'єднання для публічних Wi-Fi і невеликих команд",
        "tagline_en": "Encrypted connection for public Wi-Fi and small teams",
        "description_uk": (
            "MXXNLY VPN шифрує трафік між вашим пристроєм і нашим сервером, щоб у кафе, готелі чи "
            "аеропорту ваші дані не читав власник мережі.\n\n"
            "Для команд є спільне адміністрування: один акаунт, кілька пристроїв, прості правила доступу. "
            "Ми не обіцяємо анонімність і не позиціонуємо сервіс як засіб обходу блокувань."
        ),
        "description_en": (
            "MXXNLY VPN encrypts traffic between your device and our server so that the owner of a café, "
            "hotel or airport network cannot read your data.\n\n"
            "Teams get shared administration: one account, several devices, simple access rules. "
            "We do not promise anonymity and do not position the service as a tool for bypassing blocks."
        ),
        "features_uk": "Шифрування WireGuard\nДодатки для macOS, Windows, iOS, Android\nДо 20 пристроїв у плані Team\nСпільне адміністрування для команд\nБез логування відвіданих сайтів\nПідтримка через email і Telegram",
        "features_en": "WireGuard encryption\nApps for macOS, Windows, iOS, Android\nUp to 20 devices on Team\nShared administration for teams\nNo logging of visited sites\nSupport via email and Telegram",
        "audience_uk": "Фрілансери, які працюють із публічних мереж\nНевеликі команди з віддаленими співробітниками\nВласники кількох пристроїв",
        "audience_en": "Freelancers working from public networks\nSmall teams with remote members\nOwners of several devices",
        "support_terms_uk": "Відповідь протягом 1 робочого дня через email або Telegram. Оновлення входять у тариф.",
        "support_terms_en": "Reply within 1 business day via email or Telegram. Updates are included in the plan.",
        "seo_title_uk": "MXXNLY VPN: шифроване з'єднання для команд",
        "seo_title_en": "MXXNLY VPN: encrypted connection for teams",
        "seo_description_en": "Encrypted connection on public networks for freelancers and small teams. Plans from 5 USD per month (example).",
        "seo_description_uk": "Шифроване з'єднання у публічних мережах для фрілансерів і невеликих команд. Плани від 5 USD на місяць (приклад).",
        "plans": [
            (
                "Basic",
                5,
                "1 пристрій",
                "1 device",
                "1 пристрій\nУсі сервери\nПідтримка email",
                "1 device\nAll servers\nEmail support",
                False,
            ),
            (
                "Pro",
                9,
                "5 пристроїв",
                "5 devices",
                "5 пристроїв\nУсі сервери\nПідтримка email і Telegram",
                "5 devices\nAll servers\nEmail and Telegram support",
                True,
            ),
            (
                "Team",
                29,
                "до 20 пристроїв",
                "up to 20 devices",
                "До 20 пристроїв\nСпільне адміністрування\nПріоритетна підтримка",
                "Up to 20 devices\nShared administration\nPriority support",
                False,
            ),
        ],
        "links": [
            (
                ProductLink.Kind.DOCS,
                "Документація",
                "Documentation",
                "https://example.com/docs/vpn",
            ),
        ],
        "faq": [
            (
                "Чи зберігаєте ви історію відвіданих сайтів?",
                "Do you keep a history of visited sites?",
                "Ні. Ми зберігаємо лише технічні дані, потрібні для роботи акаунта й оплати.",
                "No. We only keep the technical data needed for your account and billing.",
            ),
            (
                "Чи можна повернути кошти?",
                "Can I get a refund?",
                "Так, протягом 14 днів з моменту оплати (чернетка умов, потребує перевірки юристом).",
                "Yes, within 14 days of payment (draft terms, pending legal review).",
            ),
        ],
    },
    {
        "name": "MXXNLY Selene",
        "slug": "selene",
        "category": "documents",
        "availability": Product.Availability.BETA,
        "tint": Product.Tint.LAVENDER,
        "icon": Product.Icon.DOCUMENT,
        "cta": Product.Cta.DEMO,
        "tagline_uk": "Парсер паперових накладних із перевіркою за довідниками",
        "tagline_en": "Parser for paper invoices with reference-book validation",
        "description_uk": (
            "Фотографуєте або скануєте накладну і отримуєте структуровані рядки: товар, кількість, ціна, сума. "
            "Назви товарів і контрагентів звіряються з вашими довідниками, розбіжності виділяються для ручної перевірки.\n\n"
            "Результат експортується у CSV, XLSX або передається через API у вашу облікову систему."
        ),
        "description_en": (
            "Photograph or scan an invoice and get structured rows: item, quantity, price, total. "
            "Item and counterparty names are matched against your reference books; mismatches are flagged for review.\n\n"
            "Results export to CSV, XLSX or go through the API into your accounting system."
        ),
        "features_uk": "Розпізнавання фото і сканів\nПеревірка за довідниками товарів і контрагентів\nПозначення розбіжностей\nЕкспорт CSV, XLSX, API\nІсторія й пошук за обробленими накладними\nРолі в команді",
        "features_en": "Photo and scan recognition\nValidation against item and counterparty reference books\nMismatch highlighting\nCSV, XLSX and API export\nHistory and search\nTeam roles",
        "audience_uk": "Невеликі магазини й склади\nБухгалтерії та аутсорс\nДистриб'ютори з кількома точками прийому",
        "audience_en": "Small shops and warehouses\nAccounting firms\nDistributors with several receiving points",
        "support_terms_uk": "Відповідь протягом 1 робочого дня. У бета-версії можливі зміни інтерфейсу; оновлення входять у тариф.",
        "support_terms_en": "Reply within 1 business day. Interface may change during beta; updates are included.",
        "seo_title_uk": "MXXNLY Selene: парсер паперових накладних",
        "seo_title_en": "MXXNLY Selene: paper invoice parser",
        "seo_description_en": "Recognition of paper invoices with reference-book validation. Plans from 49 USD per month (example).",
        "seo_description_uk": "Розпізнавання паперових накладних із перевіркою за довідниками. Тарифи від 49 USD на місяць (приклад).",
        "plans": [
            (
                "Starter",
                49,
                "до 300 накладних/міс",
                "up to 300 invoices/mo",
                "До 300 накладних на місяць\nПеревірка за довідниками\nЕкспорт CSV / XLSX\nПідтримка email",
                "Up to 300 invoices per month\nReference-book validation\nCSV / XLSX export\nEmail support",
                False,
            ),
            (
                "Business",
                129,
                "до 1500 накладних/міс",
                "up to 1500 invoices/mo",
                "До 1500 накладних на місяць\nУсе зі Starter\nAPI та ролі в команді\nПідтримка email і Telegram",
                "Up to 1500 invoices per month\nEverything in Starter\nAPI and team roles\nEmail and Telegram support",
                True,
            ),
            (
                "Custom",
                None,
                "понад 1500 накладних",
                "over 1500 invoices",
                "Окремі довідники й інтеграції\nУгода про рівень підтримки",
                "Custom reference books and integrations\nSupport agreement",
                False,
            ),
        ],
        "links": [
            (ProductLink.Kind.DEMO, "Демо", "Demo", "https://example.com/demo/selene"),
            (
                ProductLink.Kind.DOCS,
                "Документація",
                "Documentation",
                "https://example.com/docs/selene",
            ),
        ],
        "faq": [
            (
                "Які формати накладних підтримуються?",
                "Which invoice formats are supported?",
                "Фото з телефона (JPG, HEIC), скани (PDF, PNG) і типові друковані форми; рукописні поля розпізнаються з нижчою точністю.",
                "Phone photos (JPG, HEIC), scans (PDF, PNG) and common printed forms; handwritten fields are recognised with lower accuracy.",
            ),
            (
                "Що означає «бета»?",
                "What does beta mean?",
                "Продукт працює, але інтерфейс і ліміти ще можуть змінюватися. Ціни бети є прикладами.",
                "The product works, but the interface and limits may still change. Beta prices are examples.",
            ),
        ],
    },
    {
        "name": "MXXNLY Khonsu",
        "slug": "khonsu",
        "category": None,
        "availability": Product.Availability.SOON,
        "tint": Product.Tint.MAUVE,
        "icon": Product.Icon.BOX,
        "cta": Product.Cta.CONTACT,
        "tagline_uk": "Готуємо до анонсу",
        "tagline_en": "Getting ready for the announcement",
        "description_uk": (
            "MXXNLY Khonsu зараз у розробці. Опис можливостей, тарифи й дата запуску з'являться на цій "
            "сторінці після анонсу.\n\nЗалиште контакт через форму, і ми повідомимо першими."
        ),
        "description_en": (
            "MXXNLY Khonsu is in development. Features, pricing and the launch date will appear on this "
            "page after the announcement.\n\nLeave your contact through the form and we will let you know first."
        ),
        "seo_title_uk": "MXXNLY Khonsu: скоро",
        "seo_title_en": "MXXNLY Khonsu: coming soon",
        "seo_description_en": "A new MXXNLY Labs product in development. Details after the announcement.",
        "seo_description_uk": "Новий продукт MXXNLY Labs у розробці. Деталі після анонсу.",
        "plans": [],
        "links": [],
        "faq": [],
    },
    {
        "name": "MXXNLY Lunaflow",
        "slug": "lunaflow",
        "category": None,
        "availability": Product.Availability.SOON,
        "tint": Product.Tint.LAVENDER,
        "icon": Product.Icon.CHART,
        "cta": Product.Cta.CONTACT,
        "tagline_uk": "Готуємо до анонсу",
        "tagline_en": "Getting ready for the announcement",
        "description_uk": (
            "MXXNLY Lunaflow зараз у розробці. Опис можливостей, тарифи й дата запуску з'являться на цій "
            "сторінці після анонсу.\n\nЗалиште контакт через форму, і ми повідомимо першими."
        ),
        "description_en": (
            "MXXNLY Lunaflow is in development. Features, pricing and the launch date will appear on this "
            "page after the announcement.\n\nLeave your contact through the form and we will let you know first."
        ),
        "seo_title_uk": "MXXNLY Lunaflow: скоро",
        "seo_title_en": "MXXNLY Lunaflow: coming soon",
        "seo_description_en": "A new MXXNLY Labs product in development. Details after the announcement.",
        "seo_description_uk": "Новий продукт MXXNLY Labs у розробці. Деталі після анонсу.",
        "plans": [],
        "links": [],
        "faq": [],
    },
]


class Command(BaseCommand):
    help = "Create the company products (VPN, Selene, Khonsu, Lunaflow) with example prices."

    def add_arguments(self, parser):
        parser.add_argument("--force", action="store_true", help="Delete existing products first.")
        parser.add_argument(
            "--publish",
            action="store_true",
            help="Publish products and plans (still labelled «приклад»). Default: everything stays a draft.",
        )

    @transaction.atomic
    def handle(self, *args, force: bool = False, publish: bool = False, **options):
        if Product.objects.exists() and not force:
            raise CommandError(
                "Products already exist. Use --force to replace them with the examples."
            )
        if force:
            Product.objects.all().delete()
            Category.objects.all().delete()

        categories = {
            "network": Category.objects.create(
                slug="network", name_uk="Мережа", name_en="Network", order=0
            ),
            "documents": Category.objects.create(
                slug="documents", name_uk="Документообіг", name_en="Documents", order=1
            ),
        }
        publish_status = Product.PublishStatus.PUBLISHED if publish else Product.PublishStatus.DRAFT

        for order, source in enumerate(PRODUCTS):
            data = dict(source)
            plans, links, faq = data.pop("plans"), data.pop("links"), data.pop("faq")
            category = data.pop("category")
            product = Product.objects.create(
                category=categories.get(category),
                publish_status=publish_status
                if not data.get("is_private")
                else Product.PublishStatus.DRAFT,
                order=order,
                **data,
            )
            for p_order, (
                name,
                price,
                limit_uk,
                limit_en,
                inc_uk,
                inc_en,
                recommended,
            ) in enumerate(plans):
                Plan.objects.create(
                    product=product,
                    name=name,
                    price=price,
                    currency="USD",
                    period=Plan.Period.MONTH if price is not None else Plan.Period.ON_REQUEST,
                    limit_uk=limit_uk,
                    limit_en=limit_en,
                    includes_uk=inc_uk,
                    includes_en=inc_en,
                    is_example=True,
                    is_published=publish,
                    is_recommended=recommended,
                    valid_until=date(2026, 12, 31),
                    order=p_order,
                )
            for l_order, (kind, label_uk, label_en, url) in enumerate(links):
                ProductLink.objects.create(
                    product=product,
                    kind=kind,
                    label_uk=label_uk,
                    label_en=label_en,
                    url=url,
                    order=l_order,
                )
            for f_order, (q_uk, q_en, a_uk, a_en) in enumerate(faq):
                ProductFAQ.objects.create(
                    product=product,
                    question_uk=q_uk,
                    question_en=q_en,
                    answer_uk=a_uk,
                    answer_en=a_en,
                    order=f_order,
                )

        site = SiteSettings.load()
        if not site.about_uk:
            site.about_uk = (
                "MXXNLY Labs — невелика команда розробників. Ми робимо власні програмні продукти і "
                "супроводжуємо їх після запуску: оновлення, підтримка, документація.\n\n"
                "Юридично діє ФОП Складан М. Я.; MXXNLY Labs є торговою назвою. (Текст-заглушка, замінити.)"
            )
            site.about_en = (
                "MXXNLY Labs is a small team of developers. We build our own software products and look "
                "after them after launch: updates, support, documentation.\n\n"
                "The legal entity is sole proprietor Skladan M. Ya.; MXXNLY Labs is a trade name. (Placeholder text.)"
            )
            site.about_is_placeholder = True
            site.save()

        state = (
            "published (labelled «приклад»)"
            if publish
            else "drafts (use --publish to show them on the site)"
        )
        self.stdout.write(self.style.SUCCESS(f"Products created as {state}. Edit them at /admin/."))

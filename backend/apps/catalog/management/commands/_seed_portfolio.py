"""The rest of the MXXNLY Labs portfolio for `seed_demo` (everything except VPN and Selene).

Source: the portfolio plan (names, ideas, price per unit). Khonsu prices are the real ones from
https://khonsu.cc/pricing (checked 2026-10-30); every other price is a planning example and is
seeded with `is_example=True`. All of these products except Khonsu are not built yet, so they
are «Скоро» and ask people to leave a contact.
"""

from apps.catalog.models import Product, ProductLink

T = Product.Tint
I = Product.Icon  # noqa: E741
A = Product.Availability
C = Product.Cta

CATEGORIES = [
    ("network", "Мережа", "Network"),
    ("documents", "Документообіг", "Documents"),
    ("automation", "Автоматизація", "Automation"),
    ("finance", "Фінанси й облік", "Finance"),
    ("sync", "Синхронізація й безпека", "Sync and security"),
    ("tools", "Інструменти й ігри", "Tools and games"),
]

SOON_UK = "Продукт у розробці: склад і ціни можуть змінитися до запуску. Залиште контакт, і ми повідомимо першими."
SOON_EN = "In development: scope and prices may change before launch. Leave a contact and we will let you know first."


def _seo(name: str, tagline: str) -> dict:
    title = f"{name}: {tagline}"
    if len(title) > 70:
        title = title[:67].rstrip() + "..."
    return {"title": title, "description": tagline[:170]}


def product(
    name,
    category,
    tint,
    icon,
    tagline,
    description,
    features,
    audience,
    plans=(),
    *,
    slug=None,
    availability=A.SOON,
    cta=C.CONTACT,
    links=(),
    faq=(),
    support_terms=None,
):
    """`tagline`, `description`, `features`, `audience`, `support_terms` are (uk, en) pairs."""
    seo_uk = _seo(name, tagline[0])
    seo_en = _seo(name, tagline[1])
    data = {
        "name": name,
        "category": category,
        "availability": availability,
        "tint": tint,
        "icon": icon,
        "cta": cta,
        "tagline_uk": tagline[0],
        "tagline_en": tagline[1],
        "description_uk": description[0] + "\n\n" + SOON_UK
        if availability == A.SOON
        else description[0],
        "description_en": description[1] + "\n\n" + SOON_EN
        if availability == A.SOON
        else description[1],
        "features_uk": features[0],
        "features_en": features[1],
        "audience_uk": audience[0],
        "audience_en": audience[1],
        "seo_title_uk": seo_uk["title"],
        "seo_title_en": seo_en["title"],
        "seo_description_uk": seo_uk["description"],
        "seo_description_en": seo_en["description"],
        "plans": list(plans),
        "links": list(links),
        "faq": list(faq),
    }
    if slug:
        data["slug"] = slug
    if support_terms:
        data["support_terms_uk"], data["support_terms_en"] = support_terms
    return data


def plan(name, price, limit, includes, *, recommended=False, **opts):
    """`limit` and `includes` are (uk, en) pairs; opts: period, is_example, buy_url."""
    return (name, price, limit[0], limit[1], includes[0], includes[1], recommended, opts)


# ---------------------------------------------------------------------------------------------
# Khonsu: real prices from khonsu.cc/pricing. Yearly: Crescent $79, Full Moon $149, Supermoon $249.
KHONSU_PRICING = "https://khonsu.cc/pricing"
_REAL = {"is_example": False, "buy_url": KHONSU_PRICING}

KHONSU = product(
    "MXXNLY Khonsu",
    "sync",
    T.MAUVE,
    I.GLOBE,
    (
        "Миттєва синхронізація файлів, паролів, буфера й завдань між усіма пристроями",
        "Instant sync of files, passwords, clipboard and tasks across all your devices",
    ),
    (
        "Khonsu об'єднує на всіх платформах менеджер паролів, буфер обміну, дошку завдань (Board), "
        "передачу файлів (Beam) і публічну скриньку для завантажень (Public Inbox). Тарифи названо "
        "фазами Місяця: від безкоштовного New Moon до разової покупки Eclipse.\n\n"
        "Сайт і застосунки працюють окремо від цього сайту: оплата й акаунт на khonsu.cc.",
        "Khonsu brings a password manager, clipboard sync, a task board (Board), file transfer (Beam) "
        "and a public upload inbox (Public Inbox) to every platform. Plans are named after the lunar "
        "phases: from the free New Moon to the one-time Eclipse purchase.\n\n"
        "The site and the apps run separately from this site: account and billing are on khonsu.cc.",
    ),
    (
        "Синхронізація між пристроями\nМенеджер паролів на кожному тарифі\nBoard: картки, віджети, свайпи\n"
        "Beam: передача файлів до 1 ГБ\nPublic Inbox: посилання для завантажень без акаунта\n"
        "Буфер обміну з історією\nСповіщення між пристроями (від Full Moon)",
        "Multi-device sync\nPassword manager on every plan\nBoard: cards, widgets, swipes\n"
        "Beam: file transfer up to 1 GB\nPublic Inbox: upload links without an account\n"
        "Clipboard with history\nNotification sharing (from Full Moon)",
    ),
    (
        "Ті, хто працює на кількох пристроях\nКоманди, яким потрібен спільний буфер і передача файлів\nВласники великих бібліотек файлів",
        "People working across several devices\nTeams that need a shared clipboard and file transfer\nOwners of large file libraries",
    ),
    plans=[
        plan(
            "New Moon",
            0,
            ("2 пристрої, 1 ГБ", "2 devices, 1 GB"),
            (
                "2 пристрої\n100 карток Board\n1 ГБ сховища\n10 записів буфера\nМенеджер паролів до 50 записів\n5 Beam на день до 25 МБ",
                "2 devices\n100 board cards\n1 GB storage\n10 clipboard clips\nPassword manager up to 50 entries\n5 Beams a day up to 25 MB",
            ),
            period="month",
            **_REAL,
        ),
        plan(
            "Crescent",
            7.99,
            ("5 пристроїв, 50 ГБ; $79 на рік", "5 devices, 50 GB; $79 a year"),
            (
                "5 пристроїв\n5 тис. карток Board\n50 ГБ сховища\n40 записів буфера, 7 днів\nМенеджер паролів до 500 записів\n50 Beam на день до 100 МБ\nРічна оплата: $79 (−17%)",
                "5 devices\n5k board cards\n50 GB storage\n40 clipboard clips, 7 days\nPassword manager up to 500 entries\n50 Beams a day up to 100 MB\nYearly: $79 (save 17%)",
            ),
            period="month",
            **_REAL,
        ),
        plan(
            "Full Moon",
            14.99,
            ("10 пристроїв, 200 ГБ; $149 на рік", "10 devices, 200 GB; $149 a year"),
            (
                "10 пристроїв\n50 тис. карток Board\n200 ГБ сховища\n100 записів буфера, 14 днів\nМенеджер паролів до 5 тис. записів\nBeam без ліміту, файли до 500 МБ\nСповіщення між пристроями\nРічна оплата: $149",
                "10 devices\n50k board cards\n200 GB storage\n100 clipboard clips, 14 days\nPassword manager up to 5k entries\nUnlimited Beam, files up to 500 MB\nNotification sharing\nYearly: $149",
            ),
            recommended=True,
            period="month",
            **_REAL,
        ),
        plan(
            "Supermoon",
            24.99,
            ("20 пристроїв, 1 ТБ; $249 на рік", "20 devices, 1 TB; $249 a year"),
            (
                "20 пристроїв\n200 тис. карток Board\n1 ТБ сховища\n200 записів буфера, 30 днів\nМенеджер паролів до 25 тис. записів\nBeam без ліміту, файли до 1 ГБ\nСповіщення й пріоритетна підтримка\nРічна оплата: $249",
                "20 devices\n200k board cards\n1 TB storage\n200 clipboard clips, 30 days\nPassword manager up to 25k entries\nUnlimited Beam, files up to 1 GB\nNotifications and priority support\nYearly: $249",
            ),
            period="month",
            **_REAL,
        ),
        plan(
            "Eclipse",
            349,
            ("разова покупка, 20 пристроїв, 1 ТБ", "one-time, 20 devices, 1 TB"),
            (
                "Оплата один раз, без підписки\nУсі майбутні оновлення Lunar\n20 пристроїв, 1 ТБ\n500 тис. карток Board\nПріоритетна підтримка",
                "Pay once, no subscription\nAll future Lunar updates\n20 devices, 1 TB\n500k board cards\nPriority support",
            ),
            period="once",
            **_REAL,
        ),
    ],
    availability=A.BETA,
    cta=C.BUY,
    links=[(ProductLink.Kind.BUY, "Тарифи на khonsu.cc", "Plans on khonsu.cc", KHONSU_PRICING)],
    faq=[
        (
            "Де купувати Khonsu?",
            "Where do I buy Khonsu?",
            "На khonsu.cc: акаунт, оплата й завантаження застосунків там. Ціни на цій сторінці взято з прайсу Khonsu.",
            "On khonsu.cc: the account, billing and app downloads are there. Prices on this page come from the Khonsu price list.",
        ),
        (
            "Що таке Eclipse?",
            "What is Eclipse?",
            "Разова покупка без підписки з усіма майбутніми оновленнями Lunar.",
            "A one-time purchase with no subscription that includes all future Lunar updates.",
        ),
    ],
)

# ---------------------------------------------------------------------------------------------
LUNAFLOW = product(
    "MXXNLY Lunaflow",
    "automation",
    T.LAVENDER,
    I.BOT,
    (
        "Готові шаблони й автоматизації для малого бізнесу",
        "Ready-made templates and automations for small businesses",
    ),
    (
        "Excel- і Notion-шаблони та сценарії n8n і Make для вузьких задач: облік накладних, звіти по точках, "
        "відстеження цін. Купуєте один раз, отримуєте файл і чек автоматично.",
        "Excel and Notion templates plus n8n and Make scenarios for narrow tasks: invoice tracking, "
        "per-store reports, price monitoring. You pay once and get the file and receipt automatically.",
    ),
    (
        "Шаблони для Excel і Notion\nСценарії n8n і Make\nІнструкція із запуску\nОновлення шаблонів",
        "Excel and Notion templates\nn8n and Make scenarios\nSetup guide\nTemplate updates",
    ),
    (
        "Власники малого бізнесу\nБухгалтери й менеджери складу",
        "Small business owners\nAccountants and warehouse managers",
    ),
    plans=[
        plan(
            "Шаблон",
            19,
            ("за один шаблон", "per template"),
            ("Файл і інструкція\nОновлення протягом року", "File and guide\nUpdates for a year"),
            period="once",
        )
    ],
)

SELENE_API = product(
    "MXXNLY Selene API",
    "documents",
    T.PERIWINKLE,
    I.DOCUMENT,
    (
        "Розбір накладних, перевірка штрихкодів і реквізитів як API",
        "Invoice parsing, barcode and company-details checks as an API",
    ),
    (
        "API того самого движка, що й MXXNLY Selene, з оплатою за підпискою. Працює з українськими форматами "
        "накладних і реквізитами, яких немає в глобальних API.",
        "The API of the same engine as MXXNLY Selene, billed as a subscription. It works with Ukrainian "
        "invoice formats and company details that global APIs do not cover.",
    ),
    (
        "Розбір накладних із фото й PDF\nПеревірка штрихкодів\nПеревірка реквізитів контрагентів\nДокументація й ключі API",
        "Invoice parsing from photos and PDFs\nBarcode validation\nCounterparty details check\nDocumentation and API keys",
    ),
    (
        "Розробники облікових і складських систем\nІнтегратори",
        "Developers of accounting and warehouse systems\nIntegrators",
    ),
    plans=[
        plan(
            "Developer",
            25,
            ("для розробників", "for developers"),
            ("Ключ API\nДокументація\nПідтримка email", "API key\nDocumentation\nEmail support"),
            period="month",
        )
    ],
    slug="selene-api",
)

ATLAS = product(
    "MXXNLY Atlas",
    "documents",
    T.MAUVE,
    I.BOX,
    (
        "Довідники й документи в одному місці з синхронізацією з Google Sheets і Drive",
        "Reference books and documents in one place, synced with Google Sheets and Drive",
    ),
    (
        "Atlas стежить за версіями довідників (товари, контрагенти, ціни), правами доступу й зв'язками з документами. "
        "Дані лишаються у вашому Google-акаунті; довідники використовує MXXNLY Selene для звірки накладних.",
        "Atlas tracks versions of reference books (items, counterparties, prices), access rights and links to "
        "documents. Data stays in your Google account; MXXNLY Selene uses these books to validate invoices.",
    ),
    (
        "Підключення Google Sheets і Drive\nВерсії довідників\nПрава доступу\nЗв'язки з документами",
        "Google Sheets and Drive connection\nReference-book versions\nAccess rights\nLinks to documents",
    ),
    ("Малі й середні підприємства\nБухгалтерії", "Small and mid-size companies\nAccounting teams"),
    plans=[
        plan(
            "Business",
            15,
            ("для підприємства", "per company"),
            (
                "Довідники й файли\nСинхронізація з Google\nПідтримка через базу знань",
                "Reference books and files\nGoogle sync\nKnowledge-base support",
            ),
            period="month",
        )
    ],
)

PHASE = product(
    "MXXNLY Phase",
    "automation",
    T.PERIWINKLE,
    I.GLOBE,
    (
        "Плагіни для WooCommerce і Shopify: доставка, ПРРО, експорт у бухгалтерію",
        "WooCommerce and Shopify plugins: shipping, fiscal receipts, accounting export",
    ),
    (
        "Інтеграції з українськими сервісами, яких глобальні плагіни не підтримують. Безкоштовна версія приводить "
        "користувачів, ліцензійний ключ відкриває повну.",
        "Integrations with Ukrainian services that global plugins do not support. A free version brings users in, "
        "a license key unlocks the full one.",
    ),
    (
        "Доставка українськими перевізниками\nФіскальні чеки (ПРРО)\nЕкспорт у бухгалтерію\nАвтоматичні оновлення",
        "Shipping with Ukrainian carriers\nFiscal receipts\nAccounting export\nAutomatic updates",
    ),
    ("Інтернет-магазини на WooCommerce\nМагазини на Shopify", "WooCommerce stores\nShopify stores"),
    plans=[
        plan(
            "Monthly",
            7,
            ("1 сайт", "1 site"),
            ("Ліцензійний ключ\nОновлення плагіна", "License key\nPlugin updates"),
            period="month",
        ),
        plan(
            "Yearly",
            79,
            ("1 сайт, річна оплата", "1 site, billed yearly"),
            (
                "Усе з Monthly\nДешевше за місячну оплату",
                "Everything in Monthly\nCheaper than monthly billing",
            ),
            period="year",
            recommended=True,
        ),
    ],
)

TYCHO = product(
    "MXXNLY Tycho",
    "documents",
    T.LAVENDER,
    I.CHART,
    (
        "Інвентаризація телефоном, контроль цін на полицях і облік уцінки",
        "Phone-based stocktaking, shelf price checks and markdown tracking",
    ),
    (
        "Замість сканерів: співробітник перевіряє полиці телефоном, а Tycho звіряє ціни й залишки з каталогом. "
        "Підключення за відео-інструкцією й шаблоном імпорту.",
        "Instead of scanners: staff check shelves with a phone and Tycho matches prices and stock with the catalogue. "
        "Setup is a video guide and an import template.",
    ),
    (
        "Інвентаризація камерою телефона\nКонтроль цінників\nОблік уцінки\nІмпорт каталогу з шаблону",
        "Phone-camera stocktaking\nPrice tag checks\nMarkdown tracking\nCatalogue import from a template",
    ),
    ("Мережі магазинів\nМалі склади", "Store chains\nSmall warehouses"),
    plans=[
        plan(
            "Магазин",
            30,
            ("за один магазин", "per store"),
            (
                "Інвентаризація й ціни\nОблік уцінки\nПідтримка email",
                "Stocktaking and prices\nMarkdown tracking\nEmail support",
            ),
            period="month",
        )
    ],
    slug="tycho",
)

MANI = product(
    "MXXNLY Mani",
    "finance",
    T.PERIWINKLE,
    I.CHART,
    (
        "Автопілот для ФОП: виписки з банку, облік доходів, ліміти групи, податки й ЄСВ",
        "Autopilot for sole proprietors: bank statements, income records, group limits, taxes and social contributions",
    ),
    (
        "Безкоштовні калькулятори й шаблони приводять з пошуку, а платна частина сама підтягує виписки з банку "
        "й готує дані для звітності. Це не бухгалтерська послуга: розрахунки варто звіряти з бухгалтером.",
        "Free calculators and templates bring people in from search; the paid part pulls bank statements and "
        "prepares reporting data. It is not an accounting service: check calculations with an accountant.",
    ),
    (
        "Підключення банків через API\nОблік доходів\nКонтроль ліміту групи\nНагадування про податки й ЄСВ",
        "Bank connections through APIs\nIncome records\nGroup limit tracking\nReminders for taxes and contributions",
    ),
    (
        "ФОП на спрощеній системі\nФрілансери",
        "Sole proprietors on the simplified system\nFreelancers",
    ),
    plans=[
        plan(
            "Autopilot",
            6,
            ("для одного ФОП", "for one sole proprietor"),
            (
                "Виписки з банку\nОблік доходів\nНагадування",
                "Bank statements\nIncome records\nReminders",
            ),
            period="month",
        )
    ],
    slug="mani",
)

HAVEN = product(
    "MXXNLY Haven",
    "finance",
    T.MAUVE,
    I.GLOBE,
    (
        "Калькулятор платежів, гайди й порівняння банків про іпотеку й єОселю",
        "Payment calculator, guides and bank comparison for mortgages and eOselya",
    ),
    (
        "Інформаційний портал про житло: калькулятори, покрокові гайди й порівняння умов банків. Безкоштовний для "
        "відвідувачів, фінансується рекламою й партнерськими заявками, без прямих продажів.",
        "An information portal about housing: calculators, step-by-step guides and bank condition comparisons. "
        "Free for visitors, funded by ads and partner referrals, no direct sales.",
    ),
    (
        "Калькулятор щомісячного платежу\nГайди по єОселі\nПорівняння банків\nАктуальні умови програм",
        "Monthly payment calculator\neOselya guides\nBank comparison\nUp-to-date programme conditions",
    ),
    (
        "Люди, які беруть житло в іпотеку\nУчасники програми єОселя",
        "People taking a mortgage\neOselya participants",
    ),
)

ODO = product(
    "MXXNLY Odo",
    "tools",
    T.LAVENDER,
    I.BOX,
    (
        "Витрати, ТО, терміни ОСЦПВ і техогляду, пробіг для власника авто",
        "Expenses, servicing, insurance and inspection deadlines and mileage for car owners",
    ),
    (
        "Простий застосунок: заносите витрати й пробіг, а нагадування про ТО, страховку й техогляд приходять самі.",
        "A simple app: log expenses and mileage and reminders for servicing, insurance and inspection arrive on their own.",
    ),
    (
        "Облік витрат і пробігу\nНагадування про терміни\nУкраїнські документи в одному місці",
        "Expense and mileage log\nDeadline reminders\nUkrainian documents in one place",
    ),
    (
        "Власники особистих авто\nСім'ї з кількома авто",
        "Private car owners\nFamilies with several cars",
    ),
    plans=[
        plan(
            "Monthly",
            1,
            ("для всіх авто", "all cars"),
            ("Облік і нагадування", "Log and reminders"),
            period="month",
        ),
        plan(
            "Yearly",
            12,
            ("річна оплата", "billed yearly"),
            ("Усе з Monthly", "Everything in Monthly"),
            period="year",
            recommended=True,
        ),
    ],
    slug="odo",
)

LUNACHECK = product(
    "MXXNLY Lunacheck",
    "finance",
    T.PERIWINKLE,
    I.DOCUMENT,
    (
        "Фото чека перетворюється на історію цін, а застосунок підказує, де кошик дешевший",
        "A photo of a receipt becomes a price history and the app shows where your basket is cheaper",
    ),
    (
        "Безкоштовна версія збирає чеки, Pro дає аналітику цін і списки покупок. Використовує той самий движок "
        "розпізнавання, що й MXXNLY Selene.",
        "The free version collects receipts, Pro adds price analytics and shopping lists. It uses the same "
        "recognition engine as MXXNLY Selene.",
    ),
    (
        "Розпізнавання чеків із фото\nІсторія цін на товари\nПорівняння магазинів\nСписки покупок",
        "Receipt recognition from photos\nItem price history\nStore comparison\nShopping lists",
    ),
    (
        "Сім'ї, які рахують бюджет\nЛюбителі знижок",
        "Families who track their budget\nBargain hunters",
    ),
    plans=[
        plan(
            "Pro",
            3,
            ("для сім'ї", "per household"),
            (
                "Аналітика цін\nСписки покупок\nБезліміт чеків",
                "Price analytics\nShopping lists\nUnlimited receipts",
            ),
            period="month",
        )
    ],
)

NOCTURNE = product(
    "MXXNLY Nocturne",
    "sync",
    T.MAUVE,
    I.SHIELD,
    (
        "Паролі, документи й інструкції «якщо зі мною щось станеться» для довірених людей",
        "Passwords, documents and instructions «if something happens to me» for trusted people",
    ),
    (
        "Шифрування на пристрої й передача доступу довіреним людям після періоду неактивності. Природне "
        "розширення Khonsu. Обіцяємо прозору криптографію й відкритий аудит, а не абсолютну безпеку.",
        "On-device encryption and access handover to trusted people after a period of inactivity. A natural "
        "extension of Khonsu. We promise transparent cryptography and an open audit, not absolute security.",
    ),
    (
        "Шифрування на пристрої\nДовірені особи\nПередача доступу після неактивності\nДокументи й інструкції",
        "On-device encryption\nTrusted contacts\nAccess handover after inactivity\nDocuments and instructions",
    ),
    (
        "Люди, які хочуть упорядкувати цифрову спадщину",
        "People who want to organise their digital legacy",
    ),
    plans=[
        plan(
            "Monthly",
            2.5,
            ("для однієї людини", "per person"),
            ("Сейф і довірені особи", "Vault and trusted contacts"),
            period="month",
        ),
        plan(
            "Yearly",
            30,
            ("річна оплата", "billed yearly"),
            ("Усе з Monthly", "Everything in Monthly"),
            period="year",
            recommended=True,
        ),
    ],
)

MOONBASE = product(
    "MXXNLY Moonbase",
    "tools",
    T.LAVENDER,
    I.BOX,
    (
        "Готовий образ для Raspberry Pi чи NAS: фото, файли, паролі й резервні копії вдома",
        "A ready image for Raspberry Pi or NAS: photos, files, passwords and backups at home",
    ),
    (
        "Налаштування домашнього сервера за 15 хвилин замість вихідних із терміналом. Продається ліцензією, "
        "питання збираємо у форумі чи спільноті.",
        "A home server set up in 15 minutes instead of a weekend in the terminal. Sold as a license; "
        "questions are collected in a forum or community.",
    ),
    (
        "Образ для Raspberry Pi і NAS\nФото, файли, паролі\nРезервні копії\nДокументація",
        "Image for Raspberry Pi and NAS\nPhotos, files, passwords\nBackups\nDocumentation",
    ),
    (
        "Любителі домашніх серверів\nТі, хто хоче вийти з хмарних підписок",
        "Home server enthusiasts\nPeople leaving cloud subscriptions",
    ),
    plans=[
        plan(
            "Ліцензія",
            39,
            ("одна установка", "one installation"),
            ("Образ і оновлення\nДокументація", "Image and updates\nDocumentation"),
            period="once",
        )
    ],
    slug="moonbase",
)

MOONDUST = product(
    "MXXNLY Moondust",
    "tools",
    T.PERIWINKLE,
    I.GLOBE,
    (
        "Конвертери й редактори фото, аудіо та PDF, що працюють локально без завантаження файлів на сервер",
        "Converters and editors for photos, audio and PDF that run locally without uploading files",
    ),
    (
        "Браузерні інструменти, де файли не залишають ваш пристрій. Безкоштовні з рекламою, а Pro-версія без "
        "обмежень з'явиться пізніше; ціни Pro ще не визначено.",
        "Browser tools where files never leave your device. Free with ads; an unrestricted Pro version will "
        "come later and its price is not set yet.",
    ),
    (
        "Конвертація й редагування у браузері\nФайли не йдуть на сервер\nФото, аудіо, PDF",
        "In-browser conversion and editing\nFiles are not uploaded\nPhoto, audio, PDF",
    ),
    (
        "Усі, кому треба швидко обробити файл і не віддавати його стороннім",
        "Anyone who needs to process a file quickly without handing it over",
    ),
    slug="moondust",
)

CRESCENT = product(
    "MXXNLY Crescent",
    "tools",
    T.MAUVE,
    I.BOX,
    (
        "Невеликі інструменти для браузера й Windows з підпискою",
        "Small tools for the browser and Windows with a subscription",
    ),
    (
        "Одна болюча задача на утиліту: розширення для Chrome і невеликі програми для Windows. Продаж через "
        "магазини застосунків, відгуки читаємо там же.",
        "One painful task per tool: Chrome extensions and small Windows apps, sold through app stores where "
        "we also read the reviews.",
    ),
    (
        "Розширення для Chrome\nУтиліти для Windows\nОновлення через магазини",
        "Chrome extensions\nWindows utilities\nUpdates through the stores",
    ),
    (
        "Власники кількох ПК\nТі, хто щодня виконує одну й ту саму дію",
        "People with several PCs\nPeople repeating the same task daily",
    ),
    plans=[
        plan(
            "Pro",
            5,
            ("для однієї людини", "per person"),
            ("Усі функції утиліти\nОновлення", "All utility features\nUpdates"),
            period="month",
        )
    ],
    slug="crescent",
)

PERIGEE = product(
    "MXXNLY Perigee",
    "automation",
    T.LAVENDER,
    I.BOT,
    (
        "Telegram-бот: стеження за цінами й курсами, нагадування про платежі й дедлайни ФОП",
        "Telegram bot: price and exchange-rate tracking, payment and sole-proprietor deadline reminders",
    ),
    (
        "Одна корисна функція замість «бота на все». Оплата всередині бота, відповіді на типові питання "
        "автоматичні. Ціни беремо з офіційних джерел.",
        "One useful feature instead of an «everything bot». Payment inside the bot, answers to common questions "
        "are automatic. Prices are taken from official sources.",
    ),
    (
        "Стеження за цінами й курсами\nНагадування про платежі\nДедлайни ФОП\nОплата в боті",
        "Price and rate tracking\nPayment reminders\nSole-proprietor deadlines\nPayment in the bot",
    ),
    (
        "ФОП і фрілансери\nТі, хто стежить за цінами",
        "Sole proprietors and freelancers\nPeople watching prices",
    ),
    plans=[
        plan(
            "Premium",
            2.5,
            ("для одного акаунта", "per account"),
            ("Безліміт стеження\nНагадування", "Unlimited tracking\nReminders"),
            period="month",
        )
    ],
    slug="perigee",
)

FARSIDE = product(
    "MXXNLY Farside",
    "tools",
    T.PERIWINKLE,
    I.BOX,
    ("Невелика інді-гра з одноразовою покупкою", "A small indie game with a one-time purchase"),
    (
        "Робоча назва ігрового напряму студії. Гра виходить на Steam чи мобільні, після релізу це самі продажі "
        "й рідкісні патчі. Жанр і дата ще не визначені.",
        "Working name of the studio's game direction. The game ships on Steam or mobile, and afterwards it is "
        "just sales and occasional patches. Genre and date are not set yet.",
    ),
    (
        "Одноразова покупка\nБез підписки й донату\nПатчі після релізу",
        "One-time purchase\nNo subscription or microtransactions\nPatches after release",
    ),
    ("Гравці, які люблять невеликі авторські ігри", "Players who enjoy small author-driven games"),
    plans=[
        plan(
            "Standard Edition",
            9,
            ("одна копія", "one copy"),
            ("Гра повністю\nПатчі й оновлення", "The full game\nPatches and updates"),
            period="once",
        )
    ],
    slug="farside",
)

PORTFOLIO = [
    KHONSU,
    LUNAFLOW,
    SELENE_API,
    ATLAS,
    PHASE,
    TYCHO,
    MANI,
    HAVEN,
    ODO,
    LUNACHECK,
    NOCTURNE,
    MOONBASE,
    MOONDUST,
    CRESCENT,
    PERIGEE,
    FARSIDE,
]

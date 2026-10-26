# config/company.json

Єдине джерело даних компанії. Звідси беруть значення:

- бекенд (`backend/apps/core/company.py` → `settings.COMPANY`, `GET /api/company/`, листи, sitemap, robots);
- фронтенд (Vite-плагін у `frontend/vite.config.ts` підставляє значення в `index.html` і в константу `__COMPANY__`);
- CI та збірка (перевірка заглушок).

## Формат

Будь-яке значення може бути або звичайним (справжнім), або об'єктом-заглушкою:

```json
"email": { "value": "hello@example.com", "placeholder": true, "note": "необов'язковий коментар" }
```

`placeholder: true` означає «тимчасові дані». Такі поля:

- показуються на сайті з міткою «Тестові дані» лише у `SITE_ENV=development|staging`;
- блокують production-збірку: `python manage.py check_placeholders` і `npm run build` при `NODE_ENV=production`
  падають зі списком полів, якщо не задано `ALLOW_PLACEHOLDERS=1` (лише для staging);
- вмикають `noindex` і `Disallow: /` у robots.txt.

Щоб замінити заглушку, замініть об'єкт на значення: `"email": "sales@mxxnly.com"`. Повний чек-лист
«Замінити перед запуском» є в кореневому README.

Заглушкам навмисно не дано схожих на справжні реквізитів (номерів, IBAN, карток).

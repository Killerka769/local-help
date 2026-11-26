# Local Help

Площадка соседской помощи для городов Дагестана (старт — Махачкала и соседние города). Человек оставляет заявку, сосед откликается, заказчик выбирает исполнителя. После одобрения стороны видят **телефон**. В ленте — город и район, дом и квартиру платформа не собирает. Оплата только на месте. Комиссии и платежей на сайте нет.

Платформа **не сторона сделки**. Встречаться можно у подъезда, в квартиру пускать не обязательно.

Регистрация — телефон + пароль, с 18 лет. Почта не обязательна. Самостоятельного сброса пароля нет. Super-admin может выдать одноразовую ссылку на 1 час **только если человек написал с того же номера** в WhatsApp/SMS.

Роль `SUPER_ADMIN` из env **не выдаётся**. Аккаунт создаёте сами в базе после обычной регистрации.

---

## Красная линия перед публичной ссылкой

Не выкладывать «как есть» и не звать людей, пока не выполнено:

1. `DATABASE_URL`, `JWT_SECRET` (≥32), `CRON_SECRET`, `NEXT_PUBLIC_SUPPORT_CONTACT` заданы.
2. `npx prisma migrate deploy` на **чистой** (или новой) БД: есть `expiresAt` и колонки согласия. Старую БД не удалять — это бэкап.
3. `npm run db:seed` (идемпотентный upsert городов). Без городов регистрация не работает.
4. Свой USER зарегистрирован, SQL: `UPDATE "User" SET role = 'SUPER_ADMIN' WHERE phone = '79XXXXXXXXX';`
5. `npm run build` без ошибки.
6. Ручные тесты из REPORT.md: в публичном JSON нет `address` и нет чужих телефонов до approve; телефон в описании отклоняется.

Пока нет своего домена — `NEXT_PUBLIC_SITE_URL` не ставить. Тогда `robots.txt` запрещает индексацию, в метаданных `noindex`.

Аудит: [`AUDIT.md`](./AUDIT.md). Этот README описывает проект **после** точечных фиксов аудита.

---

## Стек

| Слой | Что |
|---|---|
| Приложение | Next.js 16, App Router, React 19, TypeScript |
| Стили | SCSS-модули (`*.module.scss`) |
| API | Route Handlers в `app/api/**/route.ts` |
| БД | PostgreSQL + Prisma 7 + `@prisma/adapter-pg` (драйвер `pg`) |
| Сессии | JWT (`jose`), cookie `token`, httpOnly, 7 дней |
| Пароли | bcrypt, минимум 8 символов |
| Клиент | TanStack Query v5, react-hook-form, zod |
| Хостинг | Vercel (serverless). Крон: `GET /api/cron/expire-requests` в 03:00 UTC |
| Почта | Resend в зависимостях есть, **не используется** |

Node.js: 20 LTS или новее. ОС разработки: Windows 10/11, PowerShell.

---

## Дерево проекта: что где лежит

```
local-help/
  app/                      страницы и API (App Router)
    page.tsx                главная
    feed/                   публичная лента заявок
    login/  register/
    forgot-password/        честно: «пишите в поддержку», формы сброса нет
    reset-password/         оставлено на будущее, сейчас путь мёртвый
    requests/               мои заявки; new — создать; [id] — карточка
    offers/                 редирект на /profile/offers; [id] — отклик
    profile/                свой профиль; [id] — чужой; offers, favorites, notifications
    settings/               смена пароля, выход со всех устройств, удаление, экспорт
    admin/                  модерация (ADMIN / SUPER_ADMIN)
    how-it-works/ faq/ terms/ privacy/
    blocked/                страница для забаненного
    advertising/            форма рекламы, не рекламировать до трафика
    api/                    все HTTP-эндпоинты, см. таблицу ниже
    components/             UI: Header, Footer, FeedCard, PasswordInput, …
    sitemap.ts  robots.ts  layout.tsx
  lib/                      серверные хелперы (не React)
    auth.ts                 requireUser / requireAdmin / requireSuperAdmin + sessionVersion
    jwt.ts                  секрет JWT, URL сайта
    prisma.ts               клиент Prisma, пул max=5, без query-логов в prod
    http.ts                 HttpError, handleRouteError (401/403 вместо 500)
    contacts.ts             флаги canViewAddress / canViewPhone
    requestExpiry.ts        expiresAt и массовое истечение заявок
    password.ts             минимум 8 символов
    support.ts              почта и Telegram поддержки
    notifications.ts        колокольчик
    dailyLimits.ts          суточный лимит заявок/откликов
    rateLimit.ts            слабый in-memory лимит (на Vercel почти не шарится)
    avatar.ts               https-only, без private-хостов
    adminLog.ts             журнал действий админа
  hooks/                    клиентские запросы к API (useAuth, useFeed, …)
  utils/                    badWords.ts (мат, телефоны в тексте), phoneValidation.ts
  prisma/
    schema.prisma           модели
    migrations/             история схемы; последняя — expiresAt и индексы
    seed.ts                 города Дагестана
    prisma.config.ts        DATABASE_URL для Prisma 7 (не в schema.prisma)
  middleware.ts             Edge: публичные GET, защита /admin и /api, роль из /api/auth/validate
  vercel.json               сборка + крон
  .env.example              список переменных без секретов
  AUDIT.md                  аудит от 26.11.2026 (снимок на тот день)
```

Публичные страницы без логина: `/`, `/feed`, `/requests/:id`, `/profile/:id`, `/how-it-works`, `/faq`, `/terms`, `/privacy`.

Нужен вход: `/requests`, `/requests/new`, `/profile`, `/settings`, `/admin`.

---

## Модель продукта (как устроен сценарий)

1. Пользователь регистрируется (телефон, имя, город, пароль, три чекбокса: соглашение, ПД, 18+).
2. Создаёт заявку: заголовок, описание ≥60 символов, район или ориентир 3–80 символов (дом и квартиру не спрашиваем), бюджет, срок 3/7/30 дней. В БД пишется `expiresAt = createdAt + deadline`.
3. Лента (`/feed`, `GET /api/feed`) показывает **город и район**. Поля `address` в публичном JSON нет.
4. Сосед откликается комментарием. Пока статус `pending` — телефонов нет ни в UI, ни в JSON.
5. Заказчик одобряет один отклик (`updateMany` с `status: pending`, гонка закрыта). Остальные отклоняются. Стороны видят телефоны. Точный адрес обсуждают голосом.
6. Исполнитель жмёт «я выполнил» → уведомление автору → автор подтверждает → обеим кнопка отзыва. Рейтинг — среднее по отзывам, не «+1 за заявку».
7. Крон раз в сутки помечает просроченные `active` как `expired`.

Роли:

- `USER` — обычный.
- `ADMIN` — модерация, баны, удаление заявок. Не выдаёт роли.
- `SUPER_ADMIN` — то же + смена ролей USER↔ADMIN, логи. Назначается **только SQL/Prisma Studio**, не из админки и не из env.

---

## Запуск с нуля (через год)

Нужно: аккаунт [Vercel](https://vercel.com) или любой Node-хостинг, PostgreSQL (Neon / Supabase / любой Postgres 15+), Node 20, git, этот репозиторий.

### 1. Код

PowerShell:

```powershell
cd "D:\Продакшены\local-help"
node -v          # v20 или выше
npm install
```

### 2. Файл окружения

```powershell
copy .env.example .env
copy .env.example .env.local
```

Откройте `.env` и `.env.local`, заполните:

| Переменная | Обязательна | Смысл |
|---|---|---|
| `DATABASE_URL` | да | `postgresql://USER:PASSWORD@HOST:5432/DB?sslmode=require` |
| `JWT_SECRET` | да | ≥32 случайных символа. Иначе API падает при проверке токена |
| `CRON_SECRET` | да на проде | Bearer для крона истечения заявок |
| `NEXT_PUBLIC_SITE_URL` | нет, пока нет домена | `https://ваш-домен.ru` без `/` в конце |
| `NEXT_PUBLIC_SUPPORT_EMAIL` | нет | дефолт в `lib/support.ts` |
| `NEXT_PUBLIC_SUPPORT_TELEGRAM` | нет | ник без `@` |
| `RESEND_API_KEY` / `EMAIL_FROM` | нет | не включать, пока нет домена и рабочей доставки |
| `SUPER_ADMIN_PHONE` | **удалена** | не используется, не добавлять |

Секрет JWT:

```powershell
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

Prisma 7 читает `DATABASE_URL` из `prisma.config.ts`, не из `schema.prisma`. Если миграции «не видят» базу — переменная не подхватилась: проверьте, что `.env` лежит в корне проекта.

### 3. База

```powershell
npx prisma generate
npx prisma migrate deploy
npm run db:seed
```

`migrate deploy` применяет все файлы из `prisma/migrations/`, включая `expiresAt`. Без этой колонки создание заявки и лента падают.

Проверить города:

```powershell
npx prisma studio
```

Таблица `City`: Махачкала, Каспийск, Хасавюрт, Дербент, Буйнакск, Избербаш, Кизляр, Кизилюрт, Дагестанские Огни.

Локальная разработка (не прод):

```powershell
npx prisma migrate dev
```

### 4. Свой SUPER_ADMIN

1. `npm run dev`
2. Откройте http://localhost:3000/register
3. Зарегистрируйтесь своим телефоном (как обычный USER)
4. В Prisma Studio или SQL выставьте роль. Телефон в БД хранится как `79XXXXXXXXX` (11 цифр, без `+` и без ведущей `8`):

```sql
UPDATE "User" SET role = 'SUPER_ADMIN' WHERE phone = '79XXXXXXXXX';
```

5. Выйдите и войдите снова. В шапке появится ссылка в `/admin`.

Нельзя назначить `SUPER_ADMIN` из админки. Можно понизить/повысить других до `ADMIN`.

### 5. Локальный сервер

```powershell
npm run dev
```

http://localhost:3000 — главная, `/feed` — лента, `/admin` — после шага 4.

Сборка как на проде:

```powershell
npm run build
npm start
```

### Чистая база (старую не удалять)

Старая БД — бэкап. Создайте **новую** Postgres, пропишите её `DATABASE_URL`, не делайте `migrate reset` и `db push`.

```powershell
copy .env.example .env
# заполнить DATABASE_URL JWT_SECRET CRON_SECRET NEXT_PUBLIC_SUPPORT_CONTACT
npm install
npx prisma generate
npx prisma migrate deploy
npm run db:seed
npm run build
npm run dev
```

Регистрация на http://localhost:3000/register, затем:

```sql
UPDATE "User" SET role = 'SUPER_ADMIN' WHERE phone = '79XXXXXXXXX';
```

Без миграции `expiresAt` создание заявок и лента падают. Без сида на регистрации пустой список городов. Без `JWT_SECRET` ≥32 API не проверяет токены.

### Протокол сброса пароля

Самообслуживания нет. Super-admin:

```powershell
curl -X POST https://ХОСТ/api/admin/users/USER_ID/reset-link -H "Cookie: token=..."
```

Ссылку отдавать **только** если человек написал вам с того же номера (WhatsApp/SMS), что в карточке пользователя. Нет номера — нет восстановления. Ссылка живёт 1 час, одноразовая.

---

## Выкат на Vercel

1. Репозиторий на GitHub / GitLab → New Project на Vercel, Framework: Next.js.
2. Environment Variables — те же, что в `.env.example`. `JWT_SECRET` и `CRON_SECRET` **другие**, не копия с локальной машины, если локаль уже светилась.
3. Deploy. `vercel.json` сам вызывает `prisma generate && next build` и ставит крон `0 3 * * *` → `/api/cron/expire-requests`.
4. После первого деплоя в Vercel CLI или Dashboard: миграции к **прод-базе**.

С локальной машины, если `DATABASE_URL` в текущем `.env` указывает на прод:

```powershell
npx prisma migrate deploy
npm run db:seed
```

Осторожно: не гоняйте `migrate dev` в прод — только `migrate deploy`.

5. Зарегистрируйтесь уже **на прод-URL**, проставьте `SUPER_ADMIN` в прод-БД тем же SQL.
6. В Vercel → Settings → Cron: путь `/api/cron/expire-requests`. Крон должен слать `Authorization: Bearer $CRON_SECRET`. Если хостер сам не подставляет заголовок — добавьте его в настройках крона или проверяйте вручную:

```powershell
curl -H "Authorization: Bearer ВАШ_CRON_SECRET" https://ВАШ-ДЕПЛОЙ/api/cron/expire-requests
```

Ожидается `{ "ok": true, "expired": N }`.

Пока домена нет — людям можно дать превью-URL Vercel **только после красной линии**, с пониманием что это не бренд и индексации нет.

Когда купите домен:

1. Привяжите его в Vercel → Domains.
2. Поставьте `NEXT_PUBLIC_SITE_URL=https://ваш-домен.ru`.
3. Передеплой. Откроются sitemap и индексация.
4. Почту (Resend) **не** включать, пока нет SPF/DKIM и пока письмо реально не пришло на Mail.ru / Яндекс. До этого поддержка — Telegram и ручная почта.

---

## Карта API

Авторизация мутаций: `requireUser()` = JWT + пользователь из БД + совпадение `sessionVersion` + не забанен. Смена пароля, logout-all и бан увеличивают `sessionVersion` — старая cookie перестаёт работать.

Публичные ответы собираются вручную. Поле `district` (район) видно всем. Поля `address` в публичном JSON нет. Телефон — только после approve сторонам сделки.

| Метод | Путь | Кто | Заметка |
|---|---|---|---|
| POST | `/api/auth/register` | публичный | роль всегда USER; нужны terms + privacy + age |
| POST | `/api/auth/login` | публичный | одна ошибка «неверный телефон или пароль»; бан не логинится |
| POST | `/api/auth/logout` | cookie | |
| POST | `/api/auth/logout-all` | свой | +1 sessionVersion |
| POST | `/api/auth/change-password` | свой | +1 sessionVersion, пароль ≥8 |
| POST | `/api/auth/forgot-password` | публичный | **не шлёт письма**, отвечает писать в поддержку |
| GET | `/api/auth/validate` | cookie | для middleware: роль и блок из БД |
| GET/PUT | `/api/profile` | свой | |
| GET | `/api/users/:id` | публичный | без телефона и без адресов заявок |
| GET | `/api/feed` | публичный | `district` + город, без телефона |
| GET/POST | `/api/requests` | GET публичный / POST свой | POST: `district` 3–80 |
| GET/PUT/DELETE | `/api/requests/:id` | GET публичный | `district` всем; телефон после approve |
| POST | `/api/requests/:id/offer` | не автор | отказ, если `expiresAt` прошёл |
| POST | `/api/requests/:id/complete` | автор | закрыть **без** выполнения и без отзыва |
| POST | `/api/admin/users/:id/reset-link` | SUPER_ADMIN | одноразовая ссылка на 1 час |
| GET/DELETE | `/api/offers/:id` | GET: контакты только сторонам после approve |
| POST | `/api/offers/:id/approve` | автор заявки | один победитель |
| POST | `/api/offers/:id/complete-by-executor` | исполнитель | уведомление автору |
| POST | `/api/offers/:id/finalize` | автор | подтверждение |
| GET | `/api/my-requests`, `/api/my-offers` | свой | контакты в my-offers только после approve |
| GET | `/api/notifications` | свой | поле `unreadCount` по всем, не по странице |
| POST | `/api/user/delete` | свой + пароль | каскад отзывов, заявок, токенов |
| GET | `/api/user/export` | свой | выгрузка ПД |
| GET | `/api/cron/expire-requests` | Bearer CRON_SECRET | |
| * | `/api/admin/*` | ADMIN / SUPER_ADMIN | 403 через HttpError |

---

## База: главные таблицы

- `City` — города. Без записей регистрация невозможна.
- `User` — `phone` уникален, `role`, `isBlocked`, `sessionVersion`, `rating`.
- `Request` — `address` хранится, в публичных ответах режется; `expiresAt`, `deadline` дни, `status`: active / expired / closed.
- `Offer` — unique `(requestId, userId)`; status: pending / approved / rejected / completed_by_executor / completed.
- `Review` — unique `(requestId, fromUserId)`, `onDelete: Cascade` с заявки.
- `Notification`, `Favorite`, `Complaint`, `AdminLog`, `UserDailyLimit`, `CityRequest`.
- `EmailVerificationToken`, `PasswordResetToken` — схема есть, продуктово почта выключена.

---

## Поддержка и юр. тексты

Контакты задаются env или дефолтом в `lib/support.ts`. Ими пользуются логин, FAQ, политика, соглашение, футер.

Политика (`/privacy`) описывает фактическое самоудаление в настройках, 18+, что оператор — физлицо до регистрации ИП. Когда появится ИП/ООО — допишите реквизиты в `app/privacy/page.tsx`.

---

## Проверка перед запуском (руками)

1. Гость: `/feed` и карточка заявки — в HTML и в JSON Network нет `address` и чужих телефонов.
2. Отклик в статусе pending: `GET /api/offers/:id` и `GET /api/my-offers` без телефона/адреса заказчика.
3. После approve: обе стороны видят телефон; третья учётка — нет.
4. Два параллельных approve — в БД один `approved`.
5. Смена пароля: старая cookie не проходит `POST /api/requests`.
6. Удаление аккаунта, у которого есть закрытая заявка с отзывом — 200, не 500.
7. Заявка со словами «услуги» и «Махачкала, Дагестан» создаётся; мат — 400.
8. Регистрация без галочки «18 лет» — 400.

---

## Типичные поломки

| Симптом | Что проверить |
|---|---|
| `JWT_SECRET is missing or shorter than 32 characters` | `.env` / Vercel env, длина секрета |
| Prisma: `expiresAt` does not exist | не накатана миграция `20261126200000_expires_at_and_indexes` |
| На регистрации нет городов | `npm run db:seed` |
| После бана / смены пароля API ещё работает | старый деплой без `requireUser`; на актуальном коде не должно |
| Письма не приходят | так и задумано. Не включать Resend без домена |
| Крон 401 | нет заголовка `Authorization: Bearer CRON_SECRET` |
| Админка 403 | роль в БД всё ещё USER; перелогиниться после UPDATE |
| Сборка падает на sitemap | `DATABASE_URL` недоступен на этапе build; sitemap ловит ошибку и отдаёт статику, но generate Prisma всё равно нужен |

Откат фронта: Instant Rollback в Vercel. База сама не откатится — бэкап хостера Postgres.

---

## Чего в этот проект не добавлять

Рекламный кабинет, чат, SMS, карты, PWA, Redis, комиссии, рассылки Resend до рабочей доставки, выдача SUPER_ADMIN из env, публичный адрес в ленте.

Пока в Махачкале нет живых заявок — не открывать «всю Россию».

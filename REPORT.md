# REPORT.md — Local Help, финальный заход

Дата: 26 ноября 2026. Сборка: `tsc --noEmit` = 0, `next build` = 0. `eslint .` = 112 problems (42 errors, 70 warnings), не чистили. Живая БД, миграции, 12 ручных кейсов и WhatsApp-превью — **НЕ ПРОВЕРЕНО**.

---

## 1. ВЕРДИКТ

**Не готов давать ссылку живым людям.**

Что мешает:

- Миграции `expiresAt` и согласия **не накатывались** на базу (запрет `db push` / `migrate reset` / живая БД). Без них создание заявок, лента и регистрация с timestamps упадут.
- Двенадцать обязательных ручных тестов **не гонялись** в рантайме. Закрытие дыр видно в коде, не в HTTP.
- `SUPPORT_CONTACT` / `NEXT_PUBLIC_SUPPORT_CONTACT` — плейсхолдер. Пока пусто, в политике и FAQ нет рабочего контакта.
- Оператор ПД в политике — `[ФИО/ИП]`. Без ФИО ссылка = продукт без названного оператора.
- Крон без заголовка `Authorization: Bearer $CRON_SECRET` отвечает 401. Если хостер сам не подставляет секрет, заявки не истекают.

Код красной линии в репозитории закрыт точечными коммитами. Это не разрешение звать людей.

---

## 2. Трассировка F01..F40

Статус после работы. «Чем проверено»: чтение кода и `tsc`/`build`, если не сказано иное. Рантайм нигде не ставился.

| ID | Статус | Файл:строка | Чем проверено |
|---|---|---|---|
| F01 | сделано | `app/api/feed/route.ts:97-101`, `app/api/requests/route.ts:38-41`, `app/api/requests/[id]/route.ts:92`, `app/api/users/[id]/route.ts:81` | Публичный JSON: `district` из колонки `address`, поля `address` нет. Карточка рисует город+район. Улицу не собираем. |
| F02 | сделано | `app/api/offers/[id]/route.ts:50-86` | Ответ собирается вручную. `phone` только если `isContactStatus` и caller = автор или исполнитель. |
| F03 | сделано | `app/api/requests/[id]/route.ts:73-120`, `lib/contacts.ts:24-42` | Телефон оффера — автору и исполнителю и только после approved/completed_*. Pending — без телефона. |
| F04 | сделано | `app/api/my-offers/route.ts:49-62` | `author.phone` только при `isContactStatus`. `district`, не `address`. |
| F05 | сделано | `lib/auth.ts:44-127`, `app/api/auth/change-password/route.ts:58-67` | `getAuthedUser`: jwt + user из БД + `sessionVersion` + `isBlocked`. Смена пароля `sessionVersion += 1` и удаляет cookie. |
| F06 | сделано | `app/api/auth/forgot-password`, FAQ, `app/api/admin/users/[id]/reset-link/route.ts` | Самосброса нет. Super-admin выдаёт ссылку на 1 час. |
| F07 | сделано | `utils/badWords.ts:74-231` | Этнонимы/«услуги» сняты. Контакты через `containsContacts`. «жопа» в стоп-листе для растяжки. POST и PUT. |
| F08 | сделано | `app/api/user/delete/route.ts:32-71` | Перед user: reviews (from/to/requestId), offers, favorites, complaints, notifications, tokens, limits, requests. |
| F09 | сделано | `middleware.ts:64-73,94-96` | Публичные API — GET ленты/городов/профиля/карточки. POST без cookie = 401 в middleware. |
| F10 | сделано | `middleware.ts:129-141`, `app/api/admin/users/[id]/ban/route.ts:16-36,87-107` | Роль и `isBlocked` из `/api/auth/validate`. Self-ban/unban и SUPER_ADMIN запрещены. |
| F11 | сделано | `app/api/auth/login/route.ts:50-63` | Одна ошибка «неверный телефон или пароль». Забаненный — 403, JWT не выдаётся. |
| F12 | сделано | `app/api/offers/[id]/approve/route.ts` | `updateMany` where `status: pending`. Не 1 — откат. |
| F13 | сделано | `app/api/requests/[id]/offer/route.ts:55-57` | `status !== "active" \|\| expiresAt <= now` → 400. |
| F14 | частично | `lib/rateLimit.ts` | In-memory Map на serverless. Лимиты на login/register/advertising есть, между инстансами не работают. Redis не ставили. |
| F15 | сделано | `next.config.ts:3-6` | `images.remotePatterns: []`. Hostname `"**"` нет. |
| F16 | сделано | `app/api/feed/route.ts:32-34`, `app/api/cron/expire-requests/route.ts` | SQL `status active AND expiresAt > now`. `updateMany` из GET убран. Крон раз в сутки. |
| F17 | сделано | `lib/jwt.ts:11-26`, `app/sitemap.ts:8`, `app/robots.ts:5-22`, `app/layout.tsx:9-45` | `getSiteUrl()`. Без `NEXT_PUBLIC_SITE_URL` — noindex. Профили `/profile/:id`. |
| F18 | сделано | `app/profile/[id]/page.tsx:256` | `targetType="user"`. |
| F19 | сделано | `complete-by-executor/route.ts:35-48`, `finalize/route.ts:35-52`, `complete/route.ts:37-55` | Исполнитель → уведомление автору → confirm → closed+completed → уведомление исполнителю. Прямой `/complete` = закрыть без выполнения, без отзыва. |
| F20 | частично | `register/route.ts:33-100`, `privacy/page.tsx:24` | Чекбоксы + timestamps в БД. Оператор `[ФИО/ИП]` не заполнен. |
| F21 | сделано | `lib/prisma.ts:17` | Prod: `log: ["error"]`. Pool `max: 5`. |
| F22 | сделано | `prisma/migrations/20261126200000_expires_at_and_indexes/migration.sql:11-17` | Индексы `(cityId,status,createdAt)`, `(status,expiresAt)`, `Offer.userId`. |
| F23 | частично | admin full, city-requests, complaints | Пагинация части списков есть. N+1 жалоб и «загрузить всё» в full не трогали. |
| F24 | сделано | `app/api/notifications/mark-read/route.ts:17-19` | `updateMany` where `{ id, userId }`. |
| F25 | сделано | `app/api/notifications/route.ts:25-38`, `hooks/useNotifications.ts:52-54,34` | `unreadCount` с сервера. Poll 60 с. |
| F26 | сделано | `lib/jwt.ts:1-8`, `login/route.ts:66-70` | JWT без phone. Секрет <32 символов — throw. |
| F27 | сделано | `send-verification/route.ts:20-24` | Нет console.log ссылки. From из env. Нет ключа — 503. |
| F28 | сделано | `app/api/reviews/route.ts:17` | `requireUser()`. Мёртвый middleware-копипаст снят. |
| F29 | сделано | `app/offers/page.tsx:3` | `redirect("/profile/offers")`. |
| F30 | частично | faq/how-it-works/privacy/terms | Основной текст сверен. Остатки — §10. |
| F31 | сделано | register + `lib/password.ts` | Пароль ≥8. |
| F32 | сделано | `lib/auth.ts:129-134`, `lib/http.ts:13-15` | `HttpError(403)` → JSON 403, не 500. |
| F33 | сделано | `lib/district.ts`, форма new | Район 3–80, label «Район или ориентир». |
| F34 | сделано | `app/api/requests/route.ts:81` | Описание 60–1500 на сервере, как на клиенте. |
| F35 | не сделано | FeedCard/Header `<img>` | P3, не в скоупе. |
| F36 | не сделано | нет `*.test.*` | P3, не в скоупе. |
| F37 | сделано | `app/page.tsx:80-81`, `app/feed/page.tsx:268-276` | Гость: «Смотреть заявки» → `/feed`. Пустая лента: «В вашем районе пока тихо» + кнопка создания. |
| F38 | частично | `app/api/advertising/route.ts:7-14` | `requireUser` + in-memory 3/час. Капчи нет. |
| F39 | сделано | `app/admin/page.tsx` | Option SUPER_ADMIN в селекте нет. |
| F40 | не сделано | admin SCSS без `@media` | P3, не в скоупе. |

Ответы ДА/НЕТ:

1. Телефоны в title/description/comment блокируются? **ДА** (код). `isValidText`/`isValidName` → `containsContacts`. Поля: title/description/district заявки POST+PUT, comment отклика, comment отзыва POST+PUT, name и description профиля. Рантайм **НЕ ПРОВЕРЕН**.
2. Мат-фильтр на PUT заявки? **ДА**. `app/api/requests/[id]/route.ts:164-180` — `isValidText` на title, description, district.
3. Что видит гость в ленте? **Город + район.** Колонка БД `address` хранит район. Публичный JSON: поле `district`, поля `address` нет. Улицу не собираем.
4. Крон требует CRON_SECRET? **ДА.** `app/api/cron/expire-requests/route.ts:4-8`. Нет секрета или заголовок не `Bearer ${secret}` → 401.
5. Из `/api/feed` убран «загрузить все active и фильтровать в JS»? **ДА.** `findMany`+`count` с `where` в SQL. `updateMany` в GET нет.
6. Согласие с ПД в БД? **ДА.** `termsAcceptedAt`, `privacyAcceptedAt`, `ageConfirmedAt`. Регистрация без трёх чекбоксов → 400.
7. Абсолютные URL без `NEXT_PUBLIC_SITE_URL`? `VERCEL_URL` (https), иначе `x-forwarded-host`/`host` запроса, иначе `http://localhost:3000`. Пустой строки и выдуманного домена нет. У `layout` metadata `getSiteUrl()` **без Request** — на билде без Vercel это localhost. **НЕ ПРОВЕРЕНО** в WhatsApp.
8. F10? **ДА** (код).
9. F15, F21, F27? **ДА** (код).
10. F19, F37? **ДА** (код).

---

## 3. Таблица изменений

| Задача | Файлы | Что изменено | Хеш |
|---|---|---|---|
| 1 | `utils/badWords.ts` + вызовы POST/PUT | Нормализация контактов, regex телефонов/мессенджеров/@, ошибка про контакты | `f1a638d` |
| 2 | `lib/district.ts`, API сериализаторы, форма, оферта/FAQ | Публично `district`, форма «Район или ориентир» 3–80 | `271c4e7` |
| 3 | `app/page.tsx`, `app/feed/page.tsx`, карточка, `lib/jwt.ts`, how-it-works | Гость → лента, empty CTA, safety copy, `getSiteUrl` | `2bbf8a9` |
| 4 | complete / complete-by-executor / finalize, UI заявки | Один путь + уведомления в `$transaction`; `/complete` = без выполнения | `0775cae` |
| 5 | cron, prisma, next.config, middleware, ban, support, migrate indexes | Гигиена из ТЗ | `49bb0a6` |
| 6 | schema+migration consent, register, privacy | Timestamps согласия, 18+, self-delete в политике | `1c899bc` |
| 7 | `app/api/admin/users/[id]/reset-link/route.ts`, README | Одноразовая ссылка 1 ч, adminLog | `9752d23` |
| 8 | `prisma/seed.ts`, `.env.example`, `README.md`, оставшиеся API | Upsert городов, путь на чистую БД, requireUser на хвостах | `538ce04` |
| 9 | `REPORT.md`, `CHANGELOG-AUDIT.md`, `utils/badWords.ts` (жопа), `app/blocked/page.tsx`, `app/profile/[id]/layout.tsx`, копирайт главной/README | Отчёт, хвосты | `da11b60` |

---

## 4. КЛЮЧЕВОЙ КОД ДОСЛОВНО

### а) нормализация + regex телефонов

```
export const CONTACT_IN_TEXT_ERROR =
  "Уберите контакты из текста — они откроются после одобрения отклика";

const PHONE_RUN_RE = /(?:[78]\d{10}|9\d{9})/;

const MESSENGER_RE =
  /(?:https?:\/\/)?(?:wa\.me|api\.whatsapp(?:\.com)?|t\.me|telegram\.me|www\.whatsapp\.com)(?:\/\S*)?/i;

const MESSENGER_WORD_RE =
  /(?:whats?app|вотс\s*апп?|ватс\s*апп?|вацап|телеграм\w*)/i;

const HANDLE_RE = /(?:^|[^\w.])@([A-Za-z][A-Za-z0-9_]{2,31})\b/;

export function normalizeContactText(text: string): string {
  if (!text) return "";
  return text.replace(/[^\p{L}\p{N}]/gu, "");
}

function wordsToDigits(text: string): string {
  let lower = text.toLowerCase();
  for (const [word, digit] of DIGIT_WORDS) {
    lower = lower.split(word).join(digit);
  }
  return lower;
}

function hasPhoneRun(normalized: string): boolean {
  const runs = normalized.match(/\d+/g) ?? [];
  for (const run of runs) {
    if (run.length < 10) continue;
    if (PHONE_RUN_RE.test(run)) return true;
  }
  return false;
}

export function containsPhoneNumber(text: string): boolean {
  if (!text) return false;
  if (hasPhoneRun(normalizeContactText(text))) return true;
  if (hasPhoneRun(normalizeContactText(wordsToDigits(text)))) return true;
  return false;
}

export function containsContactBypass(text: string): boolean {
  if (!text) return false;
  if (MESSENGER_RE.test(text)) return true;
  if (MESSENGER_WORD_RE.test(text)) return true;
  const handle = HANDLE_RE.exec(text);
  if (handle && !text.includes(`@${handle[1]}.`)) return true;
  return false;
}

export function containsContacts(text: string): boolean {
  return containsPhoneNumber(text) || containsContactBypass(text);
}
```

`DIGIT_WORDS` — longest-first: девятьсот→9 … сто→1 (полный список в `utils/badWords.ts:87-128`).

### б) toPublicRequest (сериализатор заявки)

Имени `safeRequest`/`safeOffer` нет. Публичная заявка:

```
function toPublicRequest<T extends { address: string }>(row: T) {
  const { address, ...rest } = row;
  return { ...rest, district: address };
}
```

Лента:

```
requests: requests.map(({ address, ...rest }) => ({
  ...rest,
  district: address,
})),
```

Оффер (`GET /api/offers/:id`): `phone` = `canViewContacts ? … : null`, `district: offer.request.address`. `canViewContacts` = `isContactStatus(status) && (isAuthor || isOfferUser)`.

### в) requireUser целиком

```
export async function getAuthedUser(
  req: Request,
  options: { allowBlocked?: boolean } = {}
): Promise<AuthUser> {
  const token = readToken(req);
  if (!token) {
    throw new HttpError(401, "Не авторизован");
  }

  let userId: string;
  let tokenSessionVersion: number;
  try {
    const { payload } = await jwtVerify(token, getJwtSecretBytes());
    userId = payload.userId as string;
    tokenSessionVersion = (payload.sessionVersion as number) || 0;
  } catch {
    throw new HttpError(401, "Не авторизован");
  }

  if (!userId) {
    throw new HttpError(401, "Не авторизован");
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      phone: true,
      role: true,
      isBlocked: true,
      blockedUntil: true,
      sessionVersion: true,
      cityId: true,
    },
  });

  if (!user) {
    throw new HttpError(401, "Не авторизован");
  }

  if (tokenSessionVersion !== user.sessionVersion) {
    throw new HttpError(401, "Не авторизован");
  }

  const isBlocked = await clearExpiredBan(user.id, user.blockedUntil, user.isBlocked);

  if (isBlocked && !options.allowBlocked) {
    throw new HttpError(403, "Ваш аккаунт заблокирован");
  }

  return {
    id: user.id,
    name: user.name,
    phone: user.phone,
    role: user.role,
    isBlocked,
    sessionVersion: user.sessionVersion,
    cityId: user.cityId,
  };
}

export async function requireUser(
  req: Request,
  options: { allowBlocked?: boolean } = {}
) {
  return getAuthedUser(req, options);
}

export async function requireAdmin(req: Request) {
  const user = await getAuthedUser(req);
  if (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN") {
    throw new HttpError(403, "Доступ запрещён");
  }
  return user;
}
```

### г) проверка CRON_SECRET

```
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const auth = req.headers.get("authorization");
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Нет доступа" }, { status: 401 });
  }

  const count = await expireOverdueRequests();
  return NextResponse.json({ ok: true, expired: count });
}
```

### д) where-условие ленты

```
const where: Prisma.RequestWhereInput = {
  status: "active",
  expiresAt: { gt: new Date() },
  ...(targetCityId && { cityId: targetCityId }),
  ...(deadlineFilter && deadlineFilter !== "all" && { deadline: parseInt(deadlineFilter) }),
  ...(search && {
    OR: [
      { title: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
    ],
  }),
};
```

### е) фрагмент миграции expiresAt и индексы

```
ALTER TABLE "Request" ADD COLUMN "expiresAt" TIMESTAMP(3);

UPDATE "Request"
SET "expiresAt" = "createdAt" + ("deadline" * INTERVAL '1 day')
WHERE "expiresAt" IS NULL;

ALTER TABLE "Request" ALTER COLUMN "expiresAt" SET NOT NULL;

CREATE INDEX "Request_cityId_status_createdAt_idx" ON "Request"("cityId", "status", "createdAt");
CREATE INDEX "Request_status_expiresAt_idx" ON "Request"("status", "expiresAt");
CREATE INDEX "Offer_userId_idx" ON "Offer"("userId");
```

Consent-миграция: три nullable `TIMESTAMP(3)` без DEFAULT — backfill не нужен, старые пользователи остаются NULL.

---

## 5. ENV

| Переменная | Обязательна | Пример | Без неё |
|---|---|---|---|
| `DATABASE_URL` | да | `postgresql://USER:PASSWORD@HOST:5432/localhelp?sslmode=require` | Prisma не стартует |
| `JWT_SECRET` | да, ≥32 | 48 hex из `crypto.randomBytes` | Подпись/проверка токена throw |
| `CRON_SECRET` | да на проде | случайная строка | Крон 401; заявки не истекают по расписанию |
| `NEXT_PUBLIC_SITE_URL` | нет, пока нет домена | `https://ваш-домен.ru` | noindex; URL из `VERCEL_URL` или Host |
| `NEXT_PUBLIC_SUPPORT_CONTACT` | да перед людьми | `support@example.com` или `@channel` | Пустой контакт в политике/FAQ/blocked |
| `SUPPORT_CONTACT` | серверный дубль | то же | Клиентский NEXT_PUBLIC важнее для UI |
| `RESEND_API_KEY` | нет | — | Верификация почты 503. Так и задумано |
| `EMAIL_FROM` | нет | — | То же |
| `SUPER_ADMIN_PHONE` | удалена | не добавлять | Роль только SQL в БД |

---

## 6. ЗАПУСК (чистая БД)

Старую базу **не удалять** — это бэкап. Новая Postgres, новый `DATABASE_URL`.

1. `copy .env.example .env` (Windows) и заполнить `DATABASE_URL`, `JWT_SECRET` (≥32), `CRON_SECRET`, `NEXT_PUBLIC_SUPPORT_CONTACT`.
2. `npm install`
3. `npx prisma generate`
4. `npx prisma migrate deploy`  
   Без миграции: нет `Request.expiresAt` и колонок согласия → падают POST заявки и register timestamps.
5. `npm run db:seed`  
   Без сида: пустой список городов, регистрация не выбрать город.
6. `npm run build` затем `npm run dev` (или `npm start`).
7. Зарегистрироваться на `/register` (телефон, пароль ≥8, три чекбокса).
8. SQL: `UPDATE "User" SET role = 'SUPER_ADMIN' WHERE phone = '79XXXXXXXXX';`
9. Проверить `/admin` под этим аккаунтом.

`migrate reset` и `db push` запрещены.

---

## 7. РУЧНЫЕ ТЕСТЫ

База: `HOST=http://localhost:3000`. Cookie после логина: `-H "Cookie: token=TOKEN"`. Все 12 — **НЕ ПРОВЕРЕНЫ В РАНТАЙМЕ**. Ожидание — по коду.

1. Гость без address/phone в JSON  
   Шаг: `curl -s %HOST%/api/feed`  
   Ожидание: в объектах есть `district` и `city`, нет `address`, нет `phone`.  
   Смотреть: JSON. Карточка `/feed` — город и район.

2. Pending-отклик без контактов  
   Шаг: пользователь B откликается. `curl -s %HOST%/api/offers/OFFER_ID -H "Cookie: token=B"` и `curl -s %HOST%/api/my-offers -H "Cookie: token=B"`  
   Ожидание: `user.phone`/`author.phone` = `null`/`undefined`.  
   Смотреть: JSON, не UI.

3. После approve третий не видит телефон  
   Шаг: A одобряет B. `curl -s %HOST%/api/offers/OFFER_ID -H "Cookie: token=C"` и без cookie.  
   Ожидание: телефоны `null`. A и B видят свои.  
   Смотреть: JSON.

4. Два параллельных approve  
   Шаг:  
   `curl -s -X POST %HOST%/api/offers/O1/approve -H "Cookie: token=A" & curl -s -X POST %HOST%/api/offers/O2/approve -H "Cookie: token=A" & wait`  
   Ожидание: один success, второй ошибка; в БД один `approved`.  
   Смотреть: `Offer.status`.

5. Смена пароля убивает старую cookie на API  
   Шаг: сохранить TOKEN1. `POST /api/auth/change-password` с текущим паролем. Затем `GET /api/profile -H "Cookie: token=TOKEN1"`  
   Ожидание: 401.  
   Смотреть: статус и `sessionVersion`.

6. Удаление аккаунта с отзывом = 200  
   Шаг: закрытая заявка + отзыв. `POST /api/user/delete` `{"password":"..."}`  
   Ожидание: 200, cookie снята, пользователь исчез.  
   Смотреть: HTTP + строка User.

7. Заявка «Бытовые услуги, Махачкала, Дагестан» проходит  
   Шаг: POST `/api/requests` title/description с этими словами, district «Тарки», ≥60 символов описания.  
   Ожидание: 201.  
   Смотреть: тело ответа, `district`.

8. Заявка с «8-928-123-45-67» в описании НЕ проходит  
   Шаг: POST с номером в `description`.  
   Ожидание: 400, текст «Уберите контакты из текста — они откроются после одобрения отклика».  
   Смотреть: `error`.

9. «ЖОООППП111ААА» не проходит  
   Шаг: то же в title или description.  
   Ожидание: 400, «не допустимые слова» / мат-фильтр. Нормализация сжимает к «жопа».  
   Смотреть: `error`.

10. Крон без секрета = 401  
    `curl -s -o NUL -w "%{http_code}" %HOST%/api/cron/expire-requests`  
    Ожидание: 401.  
    С секретом: `curl -H "Authorization: Bearer CRON_SECRET" %HOST%/api/cron/expire-requests` → `{"ok":true,"expired":N}`.

11. Истёкшая заявка не в ленте и не принимает отклики  
    Шаг: в БД `expiresAt` в прошлом, `status=active`. GET `/api/feed`. POST `/api/requests/ID/offer`.  
    Ожидание: нет в ленте; отклик 400 «закрыта или истёк срок».  
    Смотреть: JSON ленты и ответ offer.

12. Ссылка сброса от админа работает  
    Шаг: человек написал с того же номера.  
    `curl -s -X POST %HOST%/api/admin/users/USER_ID/reset-link -H "Cookie: token=SUPER"`  
    Ожидание: `{url, expiresAt}`. Открыть url, задать пароль ≥8. Старая cookie 401. Повтор той же ссылки — отказ. Без SUPER_ADMIN — 403.  
    Смотреть: JSON, `/reset-password`, adminLog `reset_link`.

---

## 8. НЕ СДЕЛАНО

| Что | Почему | Риск |
|---|---|---|
| F14 Redis / общий лимит | Не в скоупе, минимальный диф | Перебор логина/регистрации с нескольких инстансов |
| F23 N+1 жалоб, пагинация full | P2, не блокер при 0–50 пользователях | Админка замедлится позже |
| F35 next/image | P3 | Нет оптимизации картинок |
| F36 автотесты | P3 | Регрессии только руками |
| F40 адаптив админки | P3, один админ | Скролл таблиц на телефоне |
| Капча advertising | in-memory лимит | Спам при открытом кабинете |
| Оператор ПД ФИО | Явный плейсхолдер, заполнит владелец | 152-ФЗ: нет названного оператора |
| Накатка миграций на прод | Запрет трогать живую БД | Запуск без migrate сломает API |
| SMS-восстановление | Нет бюджета/провайдера | Только ручной reset-link |

---

## 9. НЕ ПРОВЕРЕНО В РАНТАЙМЕ

- Все 12 кейсов §7, включая curl.
- `migrate deploy` на чистой и на старой БД (backfill `expiresAt`).
- Повторный `db:seed` (upsert в коде есть, запуск нет).
- WhatsApp OG: заголовок, описание, абсолютный URL превью.
- Крон на Vercel: подставляет ли хостер `Authorization: Bearer $CRON_SECRET`.
- Гонка двух approve под нагрузкой.
- Смена пароля / logout-all против уже открытой вкладки.
- Удаление аккаунта с отзывом на живой Postgres.
- Доставка Resend (выключена, домена нет).
- Lint errors не воспроизводились как runtime-баги.
- Браузер 360/390/768.

---

## 10. РАСХОЖДЕНИЯ ДОКУМЕНТОВ С КОДОМ

- Политика: оператор `[ФИО/ИП]` — в коде нет сущности «оператор», только плейсхолдер.
- FAQ «можно отменить, пока исполнитель не выбран» — после approve автор всё ещё может «Закрыть без выполнения»; оффер не `completed`, отзыва нет.
- Ошибка контактов: «откроются после одобрения» — открывается **телефон**, не улица. Улицу платформа не хранит.
- `layout` metadataBase: без `NEXT_PUBLIC_SITE_URL` и без `VERCEL_URL` на билде = `http://localhost:3000`. API с `Request` берёт Host. OG главной может разъехаться с API-ссылками.
- `AUDIT.md` — снимок **до** фиксов (готовность 35%). Актуальная таблица — этот REPORT, не AUDIT.
- README сценарий ранее писал «адрес до 120» / «видят адрес» — поправлено в этом заходе. Если форк старого README — расхождение.
- Next 16 пишет deprecation: `middleware` → `proxy`. Поведение то же, текст фреймворка врёт про «устарело».
- Колонка БД называется `address`, API — `district`. Клиент, который ждёт `address` в JSON, сломается (это и был контракт задачи 2).

---

## 11. ОСТАТОЧНЫЕ РИСКИ (первая неделя)

- Пустая лента в реальном районе: CTA есть, контента нет. Один мёртвый визит = «сервис пустой».
- Телефон прописью с опечатками («васимь» вместо «восемь») или латиницей «vosem» может пройти фильтр.
- `сто` внутри «просто»/«столовая» после word→digit может склеить цифры. Бюджет до 7 цифр не ловится; 10+ подряд — да.
- Точный адрес в описании словами («второй подъезд кв 14») фильтр не считает телефоном — утечка ориентира, не номера.
- In-memory rate limit: скрипт регистрации/логина с разных IP/инстансов.
- Украденная cookie до смены пароля жива 7 дней.
- Если забыть `CRON_SECRET` на Vercel — просроченные висят, пока кто-то не дёрнет крон руками.
- Старая БД без migrate: 500 на заявках. Старую не дропать, поднять рядом новую.
- Self-delete после сделки стирает отзывы с обеих сторон — дыра в рейтинге у оставшегося.
- Super-admin reset-link в ответе JSON: если отдать не тому — захват аккаунта. Протокол: только входящее с того же номера.
- Нет домена / Resend: забытый пароль = ручная работа в WhatsApp. Очередь в первый же вечер.
- Оператор не назван — жалоба в РКН бьёт по физлицу-владельцу, не по «Local Help».

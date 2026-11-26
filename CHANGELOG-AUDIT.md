# CHANGELOG-AUDIT.md

Исправления по AUDIT.md F01–F40. Финальный заход 26 ноября 2026.

## Коммиты этого захода

| Задача | Хеш | Суть |
|---|---|---|
| 1 | `f1a638d` | Телефоны, мессенджеры и @ники в пользовательском тексте |
| 2 | `271c4e7` | Публично город + район, улицу не собираем |
| 3 | `2bbf8a9` | Гость в ленту, пустая лента с CTA, OG с реального хоста |
| 4 | `0775cae` | Один путь закрытия + уведомления в транзакции |
| 5 | `49bb0a6` | Крон, индексы, SUPPORT_CONTACT, self-ban, prisma log, images |
| 6 | `1c899bc` | timestamps согласия на регистрации |
| 7 | `9752d23` | Super-admin reset-link на 1 час |
| 8 | `538ce04` | Идемпотентный seed, .env.example, путь на чистую БД, requireUser на оставшихся хендлерах |
| 9 | этот коммит | REPORT.md, этот файл, хвосты копирайта и «жопа» |

## Что закрыто в коде (без рантайма)

- Контакты в JSON только после approve сторонам сделки. Публичное поле `district`, колонка БД `address` не переименовывалась.
- `requireUser` / `requireAdmin` / `requireSuperAdmin` → HttpError 401/403, `sessionVersion` и `isBlocked` из БД.
- Лента: `status: active AND expiresAt > now`. Крон с `Authorization: Bearer CRON_SECRET`.
- Согласие: `termsAcceptedAt`, `privacyAcceptedAt`, `ageConfirmedAt`.
- Middleware: роль админа и бан через `/api/auth/validate`.
- Личные `gaydar.*` / `@KillerkaXD` убраны. Контакт — `SUPPORT_CONTACT`.

## Что намеренно не трогали

- In-memory rate limit (F14).
- N+1 в админ-жалобах и пагинация full-карточки (F23).
- `next/image` на аватарах (F35), тесты (F36), адаптив админки (F40).
- `db push` / `migrate reset` / живая БД.

## Проверки сборки

После задач 1–8 и хвостов: `npx tsc --noEmit` = 0, `npm run build` = 0.
`npm run lint` = 112 problems (42 errors, 70 warnings), pre-existing `any` / unused. Не чистили (минимальный диф).
Рантайм против живой БД **не гонялся**.

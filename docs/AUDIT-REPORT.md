# 📊 Отчёт по аудиту документации

**Дата аудита:** 25.06.2026  
**Аудитор:** AI-агент (NLP-Core-Team)  
**Область аудита:** Все `.md` файлы в папке `/docs` + корневой `README.md`

---

## 📈 Общая статистика

| Показатель | Значение |
|------------|----------|
| Всего документов в `/docs` | 59 |
| Актуальных документов | 37 (63%) |
| Дублирующих/устаревших | 15 (25%) |
| Архивных (исторических) | 4 (7%) |
| WIP (в разработке) | 1 (2%) |
| Не найденных в DOCS-INDEX | 2 |

---

## 📅 Датированные и неактуальные файлы

| Файл | Последнее обновление | Проблема | Рекомендация |
|------|---------------------|----------|--------------|
| `06-database-schema.md` | 22.06.2026 | Дублирует `32-database-schema.md` (более полная версия) | Переместить в архив |
| `07-game-engine-spec.md` | 21.06.2026 | Частично устарел, заменён `50-runtime-engine-spec.md` | Переместить в архив |
| `22-engine-state-machine.md` | 21.06.2026 | Дублирует `53-runtime-state-machine.md` | Переместить в архив |
| `25-plugin-system-spec.md` | 21.06.2026 | Заменён на `54-plugin-system-spec.md` (обновлён 24.06) | Переместить в архив |
| `29-engine-runtime-spec.md` | 21.06.2026 | Частично дублирует `50-runtime-engine-spec.md` | Переместить в архив |
| `30-builder-spec.md` | 21.06.2026 | Заменён на `49-scenario-editor-ultimate-spec.md` | Переместить в архив |
| `38-bug-report.md` | 24.06.2026 | Исторический отчёт по тестированию | Переместить в архив |
| `38-test-contract.md` | 24.06.2026 | Контракт тестирования, не актуален | Переместить в архив |
| `36-errors-fix-report.md` | 22.06.2026 | Отчёт об исправлениях, исторический | Переместить в архив |
| `40-reverse-engineering-encounter.md` | 24.06.2026 | Reverse Engineering, исторический | Переместить в архив |

---

## 🔁 Дубли и пересечения

### Дублирующаяся информация

| Тема | Файлы с дублями | Основной файл |
|------|-----------------|---------------|
| Схема БД | `06-database-schema.md`, `32-database-schema.md` | `32-database-schema.md` |
| State Machine | `22-engine-state-machine.md`, `53-runtime-state-machine.md`, `34-state-model.md` | `53-runtime-state-machine.md` |
| Plugin System | `25-plugin-system-spec.md`, `54-plugin-system-spec.md`, `35-plugin-sdk-spec.md` | `54-plugin-system-spec.md` |
| Runtime Engine | `07-game-engine-spec.md`, `29-engine-runtime-spec.md`, `50-runtime-engine-spec.md` | `50-runtime-engine-spec.md` |
| Scenario Editor | `30-builder-spec.md`, `43-scenario-editor-full-spec.md`, `49-scenario-editor-ultimate-spec.md` | `49-scenario-editor-ultimate-spec.md` |
| Validation | `12-scenario-validation-spec.md`, `31-validation-spec.md` | `12-scenario-validation-spec.md` |
| Event Contract | `11-event-contract-spec.md`, `23-event-sourcing-spec.md` | `23-event-sourcing-spec.md` |
| JSON Schema | `24-scenario-json-schema.md`, `51-scenario-json-contract.md` | `51-scenario-json-contract.md` |

### Частичные дубли в Архитектуре

| Файл | Пересечение с | Рекомендация |
|------|---------------|--------------|
| `26-domain-model.md` | `32-database-schema.md` (раздел 2) | Оставить оба: `26` — логическая модель, `32` — физическая |

---

## 🕳️ Пробелы в документации

| Область | Описание пробела | Приоритет |
|---------|------------------|-----------|
| **API для новых разработчиков** | Отсутствует единый гайд «Первый запрос к API» с примерами кода | Высокий |
| **Аутентификация** | `56-Auth-Module.md` помечен как WIP, не завершён | Высокий |
| **Развёртывание (DevOps)** | Нет детальной инструкции по деплою в production | Средний |
| **Тестирование** | Отсутствует руководство по написанию тестов (unit, integration, e2e) | Средний |
| **Мониторинг и логирование** | Нет документации по мониторингу, алертингу, логам | Низкий |
| **Чек-лист релиза** | Нет чек-листа для выпуска новой версии | Низкий |

---

## 🔍 Сравнение документации с кодом

### Методология
Аудит проведён путём сравнения следующих источников:
- **Документация**: все файлы в `docs/active/` (особенно `26-domain-model.md`, `32-database-schema.md`, `34-state-model.md`, `05-api-specification.md`, `47-game-module-spec.md`, `45-user-profile-spec.md`, `46-team-module-spec.md`, `44-admin-moderation-spec.md`, `61-Commerce-Module-Spec.md`)
- **Prisma-схема**: `prisma/schema.prisma` (50+ моделей, ~1582 строки)
- **API-контроллеры**: `apps/api/src/modules/` (games, auth, users, teams, sessions, admin, social, support, commerce, notifications, billing, achievements, search, upload, realtime)
- **Фронтенд**: `apps/web/src/app/` (все страницы)

---

### 🚨 Критические расхождения (несоответствие документации коду)

#### 1. Enum'ы в Domain Model (`26-domain-model.md`) vs Prisma-схема

| Enum | Документация (`26-domain-model.md`) | Prisma (`schema.prisma`) | Статус |
|------|-------------------------------------|--------------------------|--------|
| **GameStatus** | DRAFT, PUBLISHED, REGISTRATION_OPEN, REGISTRATION_CLOSED, LOBBY, RUNNING, FINISHED, ARCHIVED | DRAFT, PUBLISHED, REGISTRATION_OPEN, REGISTRATION_CLOSED, LOBBY, RUNNING, FINISHED, ARCHIVED, **CANCELLED, RESCHEDULED, HIDDEN, BLOCKED** | ❌ В доке нет 4 статусов |
| **Role** | PLAYER, ORGANIZER, **AUTHOR**, ADMIN, MODERATOR, **SUPER_ADMIN** | PLAYER, ORGANIZER, ADMIN, MODERATOR | ❌ В доке лишние AUTHOR и SUPER_ADMIN |
| **TeamStatus** | ACTIVE, **REGISTERED, WAITING_ANSWER, NODE_COMPLETED, NODE_FAILED** | ACTIVE, RECRUITING, INACTIVE, ARCHIVED, DELETED | ❌ Полностью разные наборы |
| **UserStatus** | ACTIVE, BANNED | ACTIVE, INACTIVE, BANNED | ⚠️ В доке нет INACTIVE |
| **TeamRole** | CAPTAIN, MEMBER | CAPTAIN, VICE_CAPTAIN, MEMBER, RECRUIT | ⚠️ В доке нет VICE_CAPTAIN, RECRUIT |

#### 2. State Model (`34-state-model.md`) vs Prisma-схема

| Аспект | Документация (`34-state-model.md`) | Prisma / код | Статус |
|--------|-------------------------------------|--------------|--------|
| **GameStatus** | 8 статусов (без CANCELLED, RESCHEDULED, HIDDEN, BLOCKED) | 12 статусов | ❌ |
| **TeamStatus** | ACTIVE, REGISTERED, WAITING_ANSWER, NODE_COMPLETED, NODE_FAILED | ACTIVE, RECRUITING, INACTIVE, ARCHIVED, DELETED | ❌ |
| **GameStatus HIDDEN** | Не описан | Есть в Prisma, используется в `games.controller.ts` (`adminHideGame`) | ❌ |
| **GameStatus BLOCKED** | Не описан | Есть в Prisma, используется в `games.controller.ts` (`adminBlockGame`) | ❌ |

#### 3. API-спецификация (`05-api-specification.md`) vs код

| Эндпоинт | В документации | В коде | Статус |
|----------|---------------|--------|--------|
| `POST /games` (create) | ✅ Описан | ✅ `games.controller.ts:236` | ✅ |
| `GET /games` (public) | ✅ Описан | ✅ `games.controller.ts:51` | ✅ |
| `GET /games/:id` (public) | ✅ Описан | ✅ `games.controller.ts:73` | ✅ |
| `PATCH /games/:id` (update) | ✅ Описан | ✅ `games.controller.ts:256` | ✅ |
| `DELETE /games/:id` | ✅ Описан | ✅ `games.controller.ts:269` | ✅ |
| `POST /games/:id/cancel` | ❌ Не описан | ✅ `games.controller.ts:290` | ❌ |
| `POST /games/:id/reschedule` | ❌ Не описан | ✅ `games.controller.ts:278` | ❌ |
| `POST /games/:id/move-to-lobby` | ❌ Не описан | ✅ `games.controller.ts:296` | ❌ |
| `POST /games/:id/register-by-name` | ❌ Не описан | ✅ `games.controller.ts:354` | ❌ |
| `POST /games/:id/admin/hide` | ❌ Не описан | ✅ `games.controller.ts:388` | ❌ |
| `POST /games/:id/admin/block` | ❌ Не описан | ✅ `games.controller.ts:406` | ❌ |
| `POST /games/:id/admin/unhide` | ❌ Не описан | ✅ `games.controller.ts:394` | ❌ |
| `POST /games/:id/admin/unblock` | ❌ Не описан | ✅ `games.controller.ts:412` | ❌ |
| `GET /games/admin` | ❌ Не описан | ✅ `games.controller.ts:369` | ❌ |
| `POST /games/:id/register` (team) | ❌ Не описан | ✅ `games.controller.ts:142` | ❌ |
| `POST /games/:id/unregister` | ❌ Не описан | ✅ `games.controller.ts:152` | ❌ |
| `POST /games/:id/ready` | ❌ Не описан | ✅ `games.controller.ts:168` | ❌ |
| `POST /games/:id/questions` | ❌ Не описан | ✅ `games.controller.ts:185` | ❌ |
| `POST /games/:id/chat` | ❌ Не описан | ✅ `games.controller.ts:208` | ❌ |
| `POST /games/:id/organizer-message` | ❌ Не описан | ✅ `games.controller.ts:224` | ❌ |
| `POST /games/:id/reviews` | ❌ Не описан | ✅ `games.controller.ts:340` | ❌ |
| `GET /games/:id/reviews` | ❌ Не описан | ✅ `games.controller.ts:82` | ❌ |
| `GET /games/:id/comments` | ❌ Не описан | ✅ `games.controller.ts:94` | ❌ |
| `POST /games/:id/comments` | ❌ Не описан | ✅ `games.controller.ts:107` | ❌ |
| `PATCH /games/:id/comments/:commentId` | ❌ Не описан | ✅ `games.controller.ts:127` | ❌ |
| `DELETE /games/:id/comments/:commentId` | ❌ Не описан | ✅ `games.controller.ts:117` | ❌ |
| `POST /games/:id/upload-cover` | ❌ Не описан | ✅ `games.controller.ts:303` | ❌ |
| `POST /games/:id/submit-for-review` | ❌ Не описан | ✅ `games.controller.ts:314` | ❌ |
| `POST /games/:id/publish` | ❌ Не описан | ✅ `games.controller.ts:326` | ❌ |

#### 4. Auth Module — код реализован, документация в WIP

| Компонент | Документация (`docs/wip/56-Auth-Module.md`) | Код | Статус |
|-----------|----------------------------------------------|-----|--------|
| `POST /auth/register` | Описан как задача | ✅ `auth.controller.ts:12` | ⚠️ |
| `POST /auth/login` | Описан как задача | ✅ `auth.controller.ts:17` | ⚠️ |
| `POST /auth/refresh` | Не описан | ✅ `auth.controller.ts:27` | ❌ |
| `GET /auth/verify-email` | Не описан | ✅ `auth.controller.ts:22` | ❌ |
| `POST /auth/forgot-password` | Не описан | ✅ `auth.controller.ts:38` | ❌ |
| `POST /auth/logout` | Не описан | ✅ `auth.controller.ts:43` | ❌ |
| `GET /auth/me` | Не описан | ✅ `auth.controller.ts:32` | ❌ |
| JWT Strategy | Не описан | ✅ `strategies/jwt.strategy.ts` | ❌ |
| JWT Guard | Не описан | ✅ `guards/jwt-auth.guard.ts` | ❌ |
| Optional Auth Guard | Не описан | ✅ `guards/optional-auth.guard.ts` | ❌ |

#### 5. Commerce Module — код реализован, документация неполная

| Компонент | Документация (`61-Commerce-Module-Spec.md`) | Код | Статус |
|-----------|----------------------------------------------|-----|--------|
| Маркетплейс (CRUD) | ✅ Описан | ✅ `marketplace.controller.ts` | ✅ |
| Покупки | ✅ Описан | ✅ `purchase.service.ts` | ✅ |
| Лицензирование | ✅ Описан | ✅ `license-engine.service.ts` | ✅ |
| Корзина | ❌ Не описан | ✅ `cart.service.ts` | ❌ |
| Промо-коды | ❌ Не описан | ✅ `promo.service.ts` | ❌ |
| Выплаты авторам | ❌ Не описан | ✅ `payout.service.ts` | ❌ |
| Аналитика маркетплейса | ❌ Не описан | ✅ `analytics.service.ts` | ❌ |
| Отзывы на листинги | ❌ Не описан | ✅ `review.service.ts` | ❌ |
| Избранное (favorites) | ❌ Не описан | ✅ `marketplace.controller.ts:181-190` | ❌ |
| Модерация листингов | ❌ Не описан | ✅ `dto/marketplace.dto.ts` (ModerateListingDto) | ❌ |

#### 6. Социальный слой — полностью отсутствует в документации

| Компонент | Документация | Код | Статус |
|-----------|-------------|-----|--------|
| Друзья (CRUD) | ❌ Нет | ✅ `social/social.controller.ts:94-118` | ❌ |
| Заявки в друзья | ❌ Нет | ✅ `social/social.controller.ts:41-73` | ❌ |
| Блокировка пользователей | ❌ Нет | ✅ `social/social.controller.ts:128-156` | ❌ |
| Чаты (личные) | ❌ Нет | ✅ `social/chat.controller.ts` | ❌ |
| Фронтенд: страница друзей | ❌ Нет | ✅ `apps/web/src/app/profile/friends/page.tsx` | ❌ |
| Фронтенд: страница чатов | ❌ Нет | ✅ `apps/web/src/app/profile/chats/page.tsx` | ❌ |

#### 7. Support Tickets — полностью отсутствует в документации

| Компонент | Документация | Код | Статус |
|-----------|-------------|-----|--------|
| Создание тикета | ❌ Нет | ✅ `support/support.controller.ts:28` | ❌ |
| Список тикетов (admin) | ❌ Нет | ✅ `support/support.controller.ts:39` | ❌ |
| Статистика тикетов | ❌ Нет | ✅ `support/support.controller.ts:58` | ❌ |
| Обновление тикета | ❌ Нет | ✅ `support/support.controller.ts:80` | ❌ |
| Фронтенд: админ-панель тикетов | ❌ Нет | ✅ `apps/web/src/app/admin/support/page.tsx` | ❌ |

#### 8. UserLimits / Тарифы (Billing) — отсутствует в документации

| Компонент | Документация | Код | Статус |
|-----------|-------------|-----|--------|
| UserLimits модель | ❌ Нет | ✅ `prisma/schema.prisma` (модель UserLimits) | ❌ |
| Billing controller | ❌ Нет | ✅ `apps/api/src/modules/billing/billing.controller.ts` | ❌ |
| Фронтенд: страница Upgrade | ❌ Нет | ✅ `apps/web/src/app/upgrade/page.tsx` | ❌ |
| Тарифы (Tier enum) | ❌ Нет | ✅ `prisma/schema.prisma` (FREE, PRO, BUSINESS) | ❌ |

#### 9. Уведомления (Notifications) — отсутствует в документации

| Компонент | Документация | Код | Статус |
|-----------|-------------|-----|--------|
| Notifications controller | ❌ Нет | ✅ `notifications/notifications.controller.ts` | ❌ |
| Фронтенд: страница уведомлений | ❌ Нет | ✅ `apps/web/src/app/notifications/page.tsx` | ❌ |

#### 10. Достижения (Achievements) — отсутствует в документации

| Компонент | Документация | Код | Статус |
|-----------|-------------|-----|--------|
| Achievements controller | ❌ Нет | ✅ `achievements/achievements.controller.ts` | ❌ |
| UserAchievement модель | ❌ Нет | ✅ `prisma/schema.prisma` | ❌ |

#### 11. Поиск (Search) — отсутствует в документации

| Компонент | Документация | Код | Статус |
|-----------|-------------|-----|--------|
| Search controller | ❌ Нет | ✅ `search/search.controller.ts` | ❌ |

#### 12. Activity Feed — отсутствует в документации

| Компонент | Документация | Код | Статус |
|-----------|-------------|-----|--------|
| ActivityFeed controller | ❌ Нет | ✅ `activity-feed/activity-feed.controller.ts` | ❌ |
| ActivityLog модель | ❌ Нет | ✅ `prisma/schema.prisma` | ❌ |

---

### ⚠️ Расхождения средней важности

#### 13. Game Module Spec (`47-game-module-spec.md`) vs код

| Аспект | Документация | Код | Статус |
|--------|-------------|-----|--------|
| GameStatus HIDDEN | Не упомянут | Есть в Prisma | ⚠️ |
| GameStatus BLOCKED | Не упомянут | Есть в Prisma | ⚠️ |
| Admin-эндпоинты (hide/block) | Не описаны | Есть в `games.controller.ts` | ⚠️ |

#### 14. Admin Moderation Spec (`44-admin-moderation-spec.md`) vs код

| Аспект | Документация | Код | Статус |
|--------|-------------|-----|--------|
| `GET /admin/stats` | ✅ Описан | ✅ `admin.controller.ts:32` | ✅ |
| `GET /admin/organizer-applications` | ✅ Описан | ✅ `admin.controller.ts:42` | ✅ |
| `POST .../approve` | ✅ Описан | ✅ `admin.controller.ts:48` | ✅ |
| `POST .../reject` | ✅ Описан | ✅ `admin.controller.ts:55` | ✅ |
| `GET /admin/users` | ✅ Описан | ✅ `admin.controller.ts:70` | ✅ |
| `PATCH /admin/users/:id/block` | ✅ Описан | ✅ `admin.controller.ts:84` | ✅ |
| `PATCH /admin/users/:id/unblock` | ❌ Не описан | ✅ `admin.controller.ts:90` | ⚠️ |
| `PATCH /admin/users/:id/role` | ❌ Не описан | ✅ `admin.controller.ts:96` | ⚠️ |
| `GET /admin/teams` | ✅ Описан | ✅ `admin.controller.ts:109` | ✅ |
| `GET /admin/teams/:id` | ❌ Не описан | ✅ `admin.controller.ts:127` | ⚠️ |
| `PATCH /admin/teams/:id` | ❌ Не описан | ✅ `admin.controller.ts:133` | ⚠️ |
| `DELETE /admin/teams/:id` | ❌ Не описан | ✅ `admin.controller.ts:144` | ⚠️ |
| `POST /admin/teams/:id/restore` | ❌ Не описан | ✅ `admin.controller.ts:151` | ⚠️ |
| Support Tickets в админке | ❌ Не описан | ✅ `admin/support/page.tsx` | ⚠️ |

#### 15. User Profile Spec (`45-user-profile-spec.md`) vs код

| Аспект | Документация | Код | Статус |
|--------|-------------|-----|--------|
| Follow system | ❌ Не описан | ✅ `users.controller.ts:88-117` | ⚠️ |
| Favorites system | ❌ Не описан | ✅ `users.controller.ts:123-155` | ⚠️ |
| Activity feed | ❌ Не описан | ✅ `users.controller.ts:161-168` | ⚠️ |
| User's teams endpoint | ❌ Не описан | ✅ `users.controller.ts:174-177` | ⚠️ |
| User's scenarios endpoint | ❌ Не описан | ✅ `users.controller.ts:183-190` | ⚠️ |
| Achievements endpoint | ❌ Не описан | ✅ `users.controller.ts:196-199` | ⚠️ |
| Soft delete user | ❌ Не описан | ✅ `users.controller.ts:75-82` | ⚠️ |
| Avatar delete | ❌ Не описан | ✅ `users.controller.ts:62-69` | ⚠️ |

#### 16. Team Module Spec (`46-team-module-spec.md`) vs код

| Аспект | Документация | Код | Статус |
|--------|-------------|-----|--------|
| Transfer ownership | ❌ Не описан | ✅ `teams.controller.ts:221-239` | ⚠️ |
| Join requests | ✅ Описан | ✅ `teams.controller.ts:138-172` | ✅ |
| Team history | ❌ Не описан | ✅ `teams.controller.ts:244-247` | ⚠️ |
| TeamVisibility enum | ❌ Не описан | ✅ Prisma: PUBLIC, UNLISTED, PRIVATE, ARCHIVED | ⚠️ |
| JoinPolicy enum | ❌ Не описан | ✅ Prisma: OPEN, APPROVAL, INVITE_ONLY | ⚠️ |

#### 17. Database Schema (`32-database-schema.md`) vs Prisma

| Модель | В документации | В Prisma | Статус |
|--------|---------------|----------|--------|
| User | ✅ Описан | ✅ | ✅ |
| Game | ✅ Описан | ✅ | ✅ |
| Scenario | ✅ Описан | ✅ | ✅ |
| Team | ✅ Описан | ✅ | ✅ |
| TeamMember | ✅ Описан | ✅ | ✅ |
| SessionState | ✅ Описан | ✅ | ✅ |
| Event | ✅ Описан | ✅ | ✅ |
| Review | ✅ Описан | ✅ | ✅ |
| Comment | ✅ Описан | ✅ | ✅ |
| Purchase | ✅ Описан | ✅ | ✅ |
| License | ✅ Описан | ✅ | ✅ |
| Media | ✅ Описан | ✅ | ✅ |
| HeatmapData | ✅ Описан | ✅ | ✅ |
| MarketplaceListing | ❌ Не описан | ✅ | ❌ |
| UserLicense | ❌ Не описан | ✅ | ❌ |
| ScenarioRun | ❌ Не описан | ✅ | ❌ |
| Cart | ❌ Не описан | ✅ | ❌ |
| PromoCode | ❌ Не описан | ✅ | ❌ |
| Payout | ❌ Не описан | ✅ | ❌ |
| AuthorEarning | ❌ Не описан | ✅ | ❌ |
| MarketplaceAnalytics | ❌ Не описан | ✅ | ❌ |
| FavoriteListing | ❌ Не описан | ✅ | ❌ |
| MarketplaceReview | ❌ Не описан | ✅ | ❌ |
| Friend | ❌ Не описан | ✅ | ❌ |
| FriendRequest | ❌ Не описан | ✅ | ❌ |
| BlockedUser | ❌ Не описан | ✅ | ❌ |
| Chat | ❌ Не описан | ✅ | ❌ |
| ChatMessage | ❌ Не описан | ✅ | ❌ |
| Notification | ❌ Не описан | ✅ | ❌ |
| ActivityLog | ❌ Не описан | ✅ | ❌ |
| AuditLog | ❌ Не описан | ✅ | ❌ |
| SupportTicket | ❌ Не описан | ✅ | ❌ |
| UserLimits | ❌ Не описан | ✅ | ❌ |
| UserAchievement | ❌ Не описан | ✅ | ❌ |
| OrganizerApplication | ❌ Не описан | ✅ | ❌ |
| GameRegistration | ❌ Не описан | ✅ | ❌ |
| GameComment | ❌ Не описан | ✅ | ❌ |
| GameQuestion | ❌ Не описан | ✅ | ❌ |
| ScenarioVersion | ❌ Не описан | ✅ | ❌ |
| Inventory | ❌ Не описан | ✅ | ❌ |
| Resource | ❌ Не описан | ✅ | ❌ |
| LedgerEntry | ❌ Не описан | ✅ | ❌ |
| Payment | ❌ Не описан | ✅ | ❌ |

---

### 📊 Сводная статистика расхождений

| Категория | Найдено расхождений | Критических | Средних |
|-----------|-------------------|-------------|---------|
| Enum'ы и State Model | 8 | 5 | 3 |
| API-эндпоинты (Games) | 26 | 26 | 0 |
| Auth Module | 8 | 8 | 0 |
| Commerce Module | 8 | 4 | 4 |
| Социальный слой | 6 | 6 | 0 |
| Support Tickets | 5 | 5 | 0 |
| Billing / Тарифы | 4 | 4 | 0 |
| Уведомления | 2 | 2 | 0 |
| Достижения | 2 | 2 | 0 |
| Поиск | 1 | 1 | 0 |
| Activity Feed | 2 | 2 | 0 |
| Admin Moderation | 7 | 0 | 7 |
| User Profile | 8 | 0 | 8 |
| Team Module | 5 | 0 | 5 |
| Database Schema | 30+ | 30+ | 0 |
| **ИТОГО** | **~122** | **~95** | **~27** |

---

### 🎯 Рекомендации по исправлению

#### Немедленные (критические)
1. **Обновить `26-domain-model.md`** — синхронизировать все enum'ы с Prisma-схемой
2. **Обновить `34-state-model.md`** — добавить статусы CANCELLED, RESCHEDULED, HIDDEN, BLOCKED; исправить TeamStatus
3. **Обновить `05-api-specification.md`** — добавить все недостающие эндпоинты из `games.controller.ts`
4. **Завершить `docs/wip/56-Auth-Module.md`** или создать полноценную документацию Auth Module
5. **Обновить `32-database-schema.md`** — добавить все недостающие модели (30+ моделей)
6. **Создать документацию для социального слоя** — Friends, FriendRequests, BlockedUser, Chats
7. **Создать документацию для Support Tickets**
8. **Создать документацию для Billing / UserLimits / Тарифов**
9. **Создать документацию для Notifications**
10. **Создать документацию для Achievements**
11. **Создать документацию для Search**
12. **Создать документацию для Activity Feed**

#### Средней важности
13. **Обновить `47-game-module-spec.md`** — добавить HIDDEN, BLOCKED статусы и admin-эндпоинты
14. **Обновить `44-admin-moderation-spec.md`** — добавить unblock, changeRole, team management, support tickets
15. **Обновить `45-user-profile-spec.md`** — добавить follow, favorites, activity feed, achievements, soft delete
16. **Обновить `46-team-module-spec.md`** — добавить transfer ownership, history, visibility/policy enums
17. **Обновить `61-Commerce-Module-Spec.md`** — добавить cart, promo codes, payouts, analytics, favorites, moderation

---

## 📋 Рекомендации

### Немедленные действия (сделано в рамках этого аудита)

- ✅ Обновлён `docs/DOCS-INDEX.md` — добавлены все 59 документов, проставлены статусы
- ✅ Обновлён `README.md` — актуализированы ссылки, упрощён быстрый старт
- ✅ Выявлены все дубли и устаревшие файлы

### Действия в ближайшем спринте

| Действие | Файлы | Приоритет |
|----------|-------|-----------|
| Переместить устаревшие файлы в архив | `06-`, `07-`, `22-`, `25-`, `29-`, `30-`, `36-`, `38-*`, `40-` | Высокий |
| Завершить документирование Auth-модуля | `56-Auth-Module.md` | Высокий |
| Создать гайд «Первый запрос к API» | Новый файл: `00-first-api-request.md` | Высокий |
| Обновить `37-frontend-api-integration.md` | Синхронизировать с текущим кодом | Средний |

### Действия в долгосрочной перспективе

| Действие | Описание | Срок |
|----------|----------|------|
| Создать DevOps-гайд | Деплой, мониторинг, бэкапы | 2-4 недели |
| Создать руководство по тестированию | Unit, integration, e2e тесты | 2-4 недели |
| Создать чек-лист релиза | Pre-release проверка | 1-2 недели |
| Автоматизировать проверку ссылок | CI-проверка битых ссылок в docs | 1 неделя |

---

## 🗂️ Предложения по реструктуризации

### Текущая проблема
Нумерация файлов не отражает актуальную структуру. Например:
- Файлы `40-` — `56-` созданы позже, но содержат более актуальную информацию
- Старые файлы (`01-` — `39-`) частично устарели, но имеют низкие номера

### Предлагаемое решение

**Вариант A: Префиксы по статусу**
```
docs/
├── active/          # Актуальные документы
├── archive/         # Исторические документы
├── wip/             # В разработке
└── DOCS-INDEX.md
```

**Вариант B: Сохранить плоскую структуру, но обновить нумерацию**
```
docs/
├── 00-intro/        # Введение, быстрый старт
├── 10-strategy/     # Стратегия и видение
├── 20-architecture/ # Архитектура
├── 30-database/     # База данных
├── 40-api/          # API
├── 50-engine/       # Движок
├── 60-builder/      # Конструктор
├── 70-modules/      # Модули
├── 80-processes/    # Процессы
├── 99-archive/      # Архив
└── DOCS-INDEX.md
```

**Рекомендация:** Использовать **Вариант A** (папки по статусу) — меньше изменений, проще миграция.

---

## ✅ Критерии приёмки (выполнено)

| Критерий | Статус |
|----------|--------|
| `docs/DOCS-INDEX.md` существует | ✅ |
| `DOCS-INDEX.md` имеет чёткую структуру | ✅ |
| Все ссылки в `DOCS-INDEX.md` корректны | ✅ |
| `README.md` обновлён | ✅ |
| Ссылки в `README.md` ведут на актуальные документы | ✅ |
| Предоставлен отчёт о состоянии документов | ✅ (этот файл) |
| Код не изменён | ✅ |

---

## 📝 Итог

Аудит выявил **15 устаревших/дублирующих документов** из 59 (25%). Основная проблема — эволюция документации без удаления старых версий. Рекомендуется:

1. **Переместить 10 файлов в архив** (список выше)
2. **Завершить Auth-модуль** (`56-Auth-Module.md`)
3. **Создать 2-3 новых гайда** для новых разработчиков
4. **Внедрить процесс** обновления документации при изменении кода

**Общее состояние:** 🟡 Удовлетворительное (документация есть, но требует чистки)

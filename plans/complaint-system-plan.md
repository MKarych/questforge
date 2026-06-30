# Система жалоб (Complaint/Report System) — План реализации

## 1. Модель данных (Prisma)

### Новая модель `Complaint`

```prisma
enum ComplaintStatus {
  PENDING    // На рассмотрении
  APPROVED   // Принята — объект заблокирован/удалён
  REJECTED   // Отклонена
}

enum ComplaintReason {
  SPAM            // Спам
  ABUSE           // Оскорбления
  NSFW            // Неприемлемый контент (18+)
  COPYRIGHT       // Нарушение авторских прав
  FRAUD           // Мошенничество
  HARASSMENT      // Преследование
  IMPERSONATION   // Выдача себя за другого
  FALSE_INFO      // Недостоверная информация
  OTHER           // Другое
}

enum ComplaintTargetType {
  GAME
  SCENARIO
  COMMENT
  REVIEW
  MARKETPLACE_REVIEW
  USER
  TEAM
  CHAT_MESSAGE
}

model Complaint {
  id             String              @id @default(uuid()) @db.Uuid
  reporterId     String              @map("reporter_id") @db.Uuid
  targetType     ComplaintTargetType @map("target_type")
  targetId       String              @map("target_id") @db.VarChar(100)
  reason         ComplaintReason
  description    String?             @db.Text
  status         ComplaintStatus     @default(PENDING)
  moderatedBy    String?             @map("moderated_by") @db.Uuid
  moderatedAt    DateTime?           @map("moderated_at")
  moderationNote String?             @map("moderation_note") @db.Text
  createdAt      DateTime            @default(now()) @map("created_at")
  updatedAt      DateTime            @updatedAt @map("updated_at")

  reporter   User @relation(fields: [reporterId], references: [id])
  moderator  User? @relation(fields: [moderatedBy], references: [id])

  @@index([status])
  @@index([targetType, targetId])
  @@index([reporterId])
  @@index([createdAt])
  @@map("complaints")
}
```

### Политика блокировки контента

При принятии жалобы (`APPROVED`) модератор может выбрать действие:
- **soft** — скрыть контент (пометить как `BLOCKED` / скрытый)
- **hard** — удалить контент (физически или soft-delete)

Для каждой целевой сущности нужно предусмотреть поле/статус блокировки:

| Сущность | Поле блокировки | Статус |
|----------|----------------|--------|
| `Game` | `status` | `BLOCKED` (уже есть в enum) |
| `Scenario` | `isPublished` | `false` + `validationStatus = 'BLOCKED'` |
| `Comment` | `deletedAt` | установить `deletedAt` |
| `GameComment` | `deletedAt` | установить `deletedAt` |
| `Review` | нет поля блокировки | добавить `deletedAt` или `status` |
| `MarketplaceReview` | `status` | `REJECTED` (уже есть в enum `ReviewStatus`) |
| `User` | `status` | `BANNED` (уже есть) |
| `Team` | `status` | `DELETED` (уже есть) |
| `ChatMessage` | нет поля блокировки | добавить `deletedAt` |

## 2. API (NestJS)

### Новый модуль `complaints`

```
apps/api/src/modules/complaints/
├── complaints.module.ts
├── complaints.controller.ts
├── complaints.service.ts
├── dto/
│   ├── create-complaint.dto.ts
│   └── moderate-complaint.dto.ts
```

### Эндпоинты

| Метод | Путь | Доступ | Описание |
|-------|------|--------|----------|
| `POST` | `/complaints` | Любой авторизованный | Создать жалобу |
| `GET` | `/admin/complaints` | ADMIN/MODERATOR | Список жалоб (с фильтрацией) |
| `GET` | `/admin/complaints/:id` | ADMIN/MODERATOR | Детали жалобы |
| `POST` | `/admin/complaints/:id/approve` | ADMIN/MODERATOR | Принять жалобу |
| `POST` | `/admin/complaints/:id/reject` | ADMIN/MODERATOR | Отклонить жалобу |

### DTO

**CreateComplaintDto:**
```typescript
class CreateComplaintDto {
  targetType: ComplaintTargetType; // GAME | SCENARIO | COMMENT | REVIEW | MARKETPLACE_REVIEW | USER | TEAM | CHAT_MESSAGE
  targetId: string;                // UUID целевого объекта
  reason: ComplaintReason;         // Причина из enum
  description?: string;            // Описание (опционально)
}
```

**ModerateComplaintDto:**
```typescript
class ModerateComplaintDto {
  action: 'soft' | 'hard';        // Что сделать с контентом
  moderationNote?: string;         // Комментарий модератора
}
```

### Логика `approve` (принятие жалобы)

При принятии жалобы сервис выполняет действие над целевой сущностью:

```
switch (targetType):
  GAME                -> game.status = 'BLOCKED'
  SCENARIO            -> scenario.isPublished = false, scenario.validationStatus = 'BLOCKED'
  COMMENT             -> comment.deletedAt = now()
  GAME_COMMENT        -> gameComment.deletedAt = now()
  REVIEW              -> review.deletedAt = now() (новое поле)
  MARKETPLACE_REVIEW  -> marketplaceReview.status = 'REJECTED'
  USER                -> user.status = 'BANNED'
  TEAM                -> team.status = 'DELETED'
  CHAT_MESSAGE        -> chatMessage.deletedAt = now() (новое поле)
```

## 3. Фронтенд

### 3.1. Компонент `ReportButton`

Универсальная кнопка "Пожаловаться" для всех типов контента.

```
apps/web/src/components/complaints/
├── ReportButton.tsx          // Кнопка + модалка
├── ReportModal.tsx           // Модальное окно с формой
├── ComplaintReasonSelect.tsx // Выпадающий список причин
```

**Пропсы `ReportButton`:**
```typescript
interface ReportButtonProps {
  targetType: ComplaintTargetType;
  targetId: string;
  variant?: 'icon' | 'text' | 'menu-item';
  className?: string;
}
```

### 3.2. Страница админки `/admin/complaints`

```
apps/web/src/app/admin/complaints/
├── page.tsx                  // Список жалоб
├── [id]/
│   └── page.tsx              // Детальный просмотр + модерация
```

**Список жалоб:**
- Таблица со всеми жалобами
- Фильтры: статус (PENDING/APPROVED/REJECTED), тип объекта, дата
- Пагинация
- Цветовая индикация: жёлтый (pending), зелёный (approved), красный (rejected)

**Детальный просмотр:**
- Информация о жалобе (кто, на что, причина, описание)
- Ссылка/превью на целевой объект
- Кнопки "Принять" / "Отклонить"
- При принятии — выбор действия (soft/hard) + комментарий модератора

### 3.3. Интеграция кнопок в существующие страницы

| Страница | Где разместить |
|----------|---------------|
| `/games/[id]` | Кнопка рядом с названием игры |
| `/scenarios/[id]` | Кнопка рядом с названием сценария |
| Комментарии к игре | Кнопка у каждого комментария |
| Отзывы к игре | Кнопка у каждого отзыва |
| `/profile/[id]` | Кнопка "Пожаловаться на пользователя" |
| `/teams/[id]` | Кнопка рядом с названием команды |
| Личные сообщения (чат) | Кнопка у каждого сообщения |

## 4. Обновление навигации админки

Добавить пункт в `AdminNav`:
```typescript
{ href: '/admin/complaints', label: '🚨 Жалобы', roles: ['ADMIN', 'MODERATOR'] }
```

## 5. Обновление API-клиента

Добавить методы в `apps/web/src/lib/api/client.ts`:
- `createComplaint(dto)` — POST /complaints
- `getAdminComplaints(params)` — GET /admin/complaints
- `getAdminComplaintDetail(id)` — GET /admin/complaints/:id
- `approveComplaint(id, dto)` — POST /admin/complaints/:id/approve
- `rejectComplaint(id, note)` — POST /admin/complaints/:id/reject

## 6. Обновление shared-types

Добавить в `packages/shared-types/src/index.ts`:
```typescript
export type ComplaintTargetType = 'GAME' | 'SCENARIO' | 'COMMENT' | 'REVIEW' | 'MARKETPLACE_REVIEW' | 'USER' | 'TEAM' | 'CHAT_MESSAGE';
export type ComplaintReason = 'SPAM' | 'ABUSE' | 'NSFW' | 'COPYRIGHT' | 'FRAUD' | 'HARASSMENT' | 'IMPERSONATION' | 'FALSE_INFO' | 'OTHER';
export type ComplaintStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
```

## 7. Миграция Prisma

```bash
npx prisma migrate dev --name add_complaints
```

## 8. Дополнительные изменения в схеме

Добавить поля для блокировки в модели, где их нет:
- `Review` — добавить `deletedAt DateTime?`
- `ChatMessage` — добавить `deletedAt DateTime?`

## Диаграмма потока

```mermaid
flowchart TD
    User[Пользователь] -->|Нажимает Пожаловаться| ReportButton
    ReportButton -->|Открывает| ReportModal
    ReportModal -->|Выбирает причину + описание| Submit[POST /complaints]
    Submit -->|Создаёт| ComplaintDB[(Complaint)]
    
    Moderator[Модератор] -->|Открывает админку| AdminPage[/admin/complaints]
    AdminPage -->|Смотрит детали| Detail[/admin/complaints/:id]
    Detail -->|Принять| Approve[POST approve]
    Detail -->|Отклонить| Reject[POST reject]
    
    Approve -->|Блокирует контент| TargetEntity[Целевая сущность]
    Approve -->|Помечает жалобу| ComplaintDB
    
    Reject -->|Помечает жалобу| ComplaintDB
```

## Порядок реализации

1. Prisma: модель Complaint + миграция + поля блокировки для Review и ChatMessage
2. API: модуль complaints (controller, service, dto)
3. API: добавить эндпоинты в admin-контроллер или вынести в отдельный модуль
4. Shared-types: добавить типы
5. API-клиент: добавить методы
6. Фронтенд: компонент ReportButton + ReportModal
7. Фронтенд: страница админки /admin/complaints
8. Фронтенд: страница детального просмотра жалобы
9. Интеграция кнопок "Пожаловаться" на всех типах контента
10. Обновление AdminNav
11. Git push
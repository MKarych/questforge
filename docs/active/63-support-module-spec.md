# Support Module: Тикеты поддержки

> **Дата:** 27.06.2026  
> **Статус:** Актуален  
> **Версия:** 1.0  
> **Цель:** Описать систему тикетов поддержки для обращения пользователей к администраторам.

---

## 1. Обзор

Support Module — система тикетов поддержки, позволяющая пользователям создавать обращения, а модераторам/администраторам — обрабатывать их.

**Ключевые возможности:**
- Создание тикета (с авторизацией и без)
- Категоризация обращений
- Назначение ответственного модератора
- Ответы и комментарии
- Статистика для дашборда

---

## 2. Модель данных (Prisma)

```prisma
enum SupportTicketStatus {
  NEW
  IN_PROGRESS
  CLOSED
}

model SupportTicket {
  id          String               @id @default(uuid())
  userId      String?              @map("user_id") @db.Uuid
  email       String               @db.VarChar(255)
  name        String               @db.VarChar(200)
  category    String               @db.VarChar(100)
  message     String               @db.Text
  attachments Json                 @default("[]")
  status      SupportTicketStatus  @default(NEW)
  assignedTo  String?              @map("assigned_to") @db.Uuid
  response    String?              @db.Text
  resolvedAt  DateTime?            @map("resolved_at")
  createdAt   DateTime             @default(now()) @map("created_at")
  updatedAt   DateTime             @updatedAt @map("updated_at")

  user      User?    @Relation(fields: [userId], references: [id], onDelete: SetNull)
  assignee  User?    @Relation("SupportAssignee", fields: [assignedTo], references: [id], onDelete: SetNull)

  @@index([status])
  @@index([userId])
  @@index([assignedTo])
  @@index([createdAt])
  @@map("support_tickets")
}
```

### 2.1. Категории тикетов

| Категория | Описание |
|-----------|----------|
| `TECHNICAL` | Технические проблемы (баги, ошибки) |
| `BILLING` | Вопросы по оплате, возвратам |
| `REPORT` | Жалобы на контент/пользователей |
| `SUGGESTION` | Предложения по улучшению |
| `OTHER` | Другое |

### 2.2. Статусы тикетов

| Статус | Описание |
|--------|----------|
| `NEW` | Создан, ожидает назначения |
| `IN_PROGRESS` | В работе у модератора |
| `CLOSED` | Закрыт (решён) |

---

## 3. API Эндпоинты

### 3.1. Публичный (без авторизации)

```
POST /support
```

Создание тикета. Доступно всем, даже без авторизации.

**Request Body:**
```json
{
  "email": "user@example.com",
  "name": "Иван Иванов",
  "category": "TECHNICAL",
  "message": "Описание проблемы...",
  "attachments": ["url1", "url2"]
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "ticket-uuid",
    "status": "NEW",
    "createdAt": "2025-01-01T12:00:00Z"
  }
}
```

### 3.2. Админ/Модератор

```
GET /support
```

Список тикетов с фильтрацией.

**Query Parameters:**
| Параметр | Тип | Описание |
|----------|-----|----------|
| `status` | string | Фильтр по статусу (NEW, IN_PROGRESS, CLOSED) |
| `limit` | number | Количество (по умолчанию 20) |
| `offset` | number | Смещение |

**Response (200):**
```json
{
  "success": true,
  "data": {
    "items": [...],
    "total": 50
  }
}
```

---

```
GET /support/stats
```

Статистика тикетов (для дашборда).

**Response (200):**
```json
{
  "success": true,
  "data": {
    "total": 150,
    "new": 12,
    "inProgress": 8,
    "closed": 130,
    "avgResponseTime": 3600,
    "avgResolutionTime": 7200
  }
}
```

---

```
GET /support/:id
```

Получение одного тикета.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "ticket-uuid",
    "email": "user@example.com",
    "name": "Иван Иванов",
    "category": "TECHNICAL",
    "message": "Описание...",
    "status": "IN_PROGRESS",
    "assignedTo": "moderator-uuid",
    "response": "Ответ модератора",
    "attachments": [],
    "createdAt": "...",
    "updatedAt": "...",
    "resolvedAt": null
  }
}
```

---

```
PATCH /support/:id
```

Обновление тикета (назначение, ответ, изменение статуса).

**Request Body:**
```json
{
  "status": "IN_PROGRESS",
  "response": "Мы рассмотрим вашу проблему...",
  "assignedTo": "moderator-uuid"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "ticket-uuid",
    "status": "IN_PROGRESS",
    "assignedTo": "moderator-uuid",
    "updatedAt": "2025-01-01T13:00:00Z"
  }
}
```

---

## 4. Фронтенд

### 4.1. Страницы

| Страница | Путь | Доступ |
|----------|------|--------|
| Создать тикет | `/support` | Все |
| Админ-панель тикетов | `/admin/support` | ADMIN, MODERATOR |

### 4.2. Админ-панель

```
┌──────────────────────────────────────────────────────┐
│ 📋 Тикеты поддержки                                    │
├──────────────────────────────────────────────────────┤
│ 🟢 NEW: 12   🟡 IN_PROGRESS: 8   🔵 CLOSED: 130      │
├──────────────────────────────────────────────────────┤
│ [Фильтр: Все ▼] [Поиск...]                            │
├──────────────────────────────────────────────────────┤
│ ID    | Категория  | Статус  | Ответственный | Действия│
│ ------|-----------|--------|--------------|---------│
│ #123  | TECHNICAL | NEW    | —            | [Назнач.]│
│ #124  | BILLING   | IN_PRG | @moder       | [Ответ]  │
│ #125  | REPORT    | CLOSED | @admin       | [Открыть]│
└──────────────────────────────────────────────────────┘
```

---

## 5. Domain Events

```typescript
enum SupportDomainEvent {
  TicketCreated    = 'support.ticket.created',
  TicketUpdated    = 'support.ticket.updated',
  TicketAssigned   = 'support.ticket.assigned',
  TicketReplied    = 'support.ticket.replied',
  TicketClosed     = 'support.ticket.closed',
  TicketReopened   = 'support.ticket.reopened',
}
```

---

## 6. Архитектурные правила

1. **Тикет может создать любой пользователь** — даже без авторизации (через email).
2. **Тикет может обработать только ADMIN/MODERATOR.**
3. **Назначение ответственного** — опционально, но рекомендуется.
4. **Ответ модератора** сохраняется в поле `response`.
5. **Статус автоматически меняется** на `CLOSED` при наличии ответа (опционально).
6. **Все действия логируются** в AuditLog.
7. **Уведомления** создаются при назначении тикета и при ответах.

---

**Дата:** 27.06.2026  
**Статус:** Актуален  
**Версия:** 1.0

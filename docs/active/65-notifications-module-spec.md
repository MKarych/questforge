# Notifications Module: Уведомления

> **Дата:** 27.06.2026  
> **Статус:** Актуален  
> **Версия:** 1.0  
> **Цель:** Описать систему уведомлений платформы.

---

## 1. Обзор

Notifications Module управляет уведомлениями пользователей о событиях платформы:

- **Игровые** — регистрация открыта, игра начата, результат завершён
- **Социальные** — заявка в друзья, новый подписчик, сообщение
- **Коммерческие** — покупка сценария, выплата, промокод
- **Системные** — модерация, блокировка, обновление тарифа

---

## 2. Модель данных (Prisma)

```prisma
model Notification {
  id        String   @id @default(uuid())
  userId    String   @map("user_id") @db.Uuid
  type      String   @db.VarChar(50)
  title     String   @db.VarChar(255)
  message   String?  @db.Text
  link      String?  @db.VarChar(500)
  read      Boolean  @default(false)
  createdAt DateTime @default(now()) @map("created_at")

  user User @Relation(fields: [userId], references: [id])

  @@index([userId])
  @@index([userId, read])
  @@index([createdAt])
  @@map("notifications")
}
```

### 2.1. Типы уведомлений

| Тип | Описание |
|-----|----------|
| `GAME_STARTED` | Игра, на которую подписались, началась |
| `GAME_FINISHED` | Игра завершена, есть результаты |
| `GAME_CANCELLED` | Игра отменена |
| `REGISTRATION_OPEN` | Регистрация на игру открыта |
| `FRIEND_REQUEST` | Новая заявка в друзья |
| `FRIEND_ACCEPTED` | Заявка в друзья принята |
| `MESSAGE` | Новое личное сообщение |
| `PURCHASE_COMPLETED` | Покупка сценария завершена |
| `PAYOUT_PROCESSED` | Выплата обработана |
| `GAME_APPROVED` | Игра одобрена модератором |
| `GAME_REJECTED` | Игра отклонена модератором |
| `TIER_UPGRADED` | Тариф повышен |
| `TICKET_ASSIGNED` | Тикет поддержки назначен |
| `PROMO_CODE` | Новый промокод |

---

## 3. API Эндпоинты

```
GET /notifications
```

Список уведомлений пользователя.

**Query Parameters:**
| Параметр | Тип | Описание |
|----------|-----|----------|
| `read` | boolean | Фильтр по прочитанности |
| `type` | string | Фильтр по типу |
| `limit` | number | Количество (по умолчанию 20) |
| `offset` | number | Смещение |

**Response (200):**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "notif-uuid",
        "type": "FRIEND_REQUEST",
        "title": "Новая заявка в друзья",
        "message": "Алексей Иванов хочет добавить вас в друзья",
        "link": "/profile/alex-ivanov",
        "read": false,
        "createdAt": "2025-01-01T12:00:00Z"
      }
    ],
    "total": 15,
    "unreadCount": 5
  }
}
```

---

```
GET /notifications/unread-count
```

Количество непрочитанных уведомлений.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "count": 5
  }
}
```

---

```
PATCH /notifications/:id/read
```

Отметить уведомление как прочитанное.

**Response (200):**
```json
{
  "success": true,
  "data": { "read": true }
}
```

---

```
POST /notifications/mark-all-read
```

Отметить все уведомления как прочитанные.

**Response (200):**
```json
{
  "success": true,
  "message": "Все уведомления отмечены как прочитанные"
}
```

---

```
DELETE /notifications/:id
```

Удалить уведомление.

---

```
DELETE /notifications
```

Удалить все уведомления (опционально с фильтром `?read=true`).

---

## 4. Создание уведомлений

```typescript
class NotificationService {
  async create(userId: string, type: string, title: string, message?: string, link?: string) {
    return this.prisma.notification.create({
      data: { userId, type, title, message, link },
    });
  }

  async createMany(notifications: Array<{
    userId: string;
    type: string;
    title: string;
    message?: string;
    link?: string;
  }>) {
    return this.prisma.notification.createMany({
      data: notifications,
    });
  }
}
```

---

## 5. WebSocket интеграция

Real-time уведомления через WebSocket:

```typescript
// Сервер → клиент
{
  type: 'NEW_NOTIFICATION',
  payload: {
    id: 'notif-uuid',
    type: 'FRIEND_REQUEST',
    title: 'Новая заявка в друзья',
    message: 'Алексей Иванов...',
    unreadCount: 6
  }
}
```

Клиент подписывается на пространство пользователя:
```
SUBSCRIBE notifications:{userId}
```

---

## 6. Фронтенд

### 6.1. Страница

| Страница | Путь | Описание |
|----------|------|----------|
| Уведомления | `/notifications` | Список всех уведомлений |

### 6.2. Компоненты

- `NotificationBadge` — бейдж с количеством непрочитанных (в шапке)
- `NotificationDropdown` — выпадающий список последних уведомлений
- `NotificationItem` — карточка уведомления
- `NotificationCenter` — полная страница уведомлений

---

## 7. Domain Events (источники уведомлений)

| Событие | Уведомление |
|---------|-------------|
| `game.published` | Organizer → "Ваша игра опубликована" |
| `game.started` | Все зарегистрированные команды → "Игра началась" |
| `friend.request.sent` | Получатель → "Новая заявка в друзья" |
| `friend.request.accepted` | Отправитель → "Вас приняли в друзья" |
| `chat.message.sent` | Получатель → "Новое сообщение" |
| `purchase.completed` | Автор → "Кто-то купил ваш сценарий" |
| `payout.processed` | Автор → "Выплата обработана" |
| `game.moderation.approved` | Organizer → "Игра одобрена" |
| `game.moderation.rejected` | Organizer → "Игра отклонена" |

---

## 8. Архитектурные правила

1. **Уведомления сохраняются в БД** — не теряются при перезагрузке.
2. **Real-time через WebSocket** — для мгновенной доставки.
3. **Группировка** — аналогичные уведомления могут группироваться (не более 10 одинаковых в минуту).
4. **Таймаут хранения** — непрочитанные уведомления хранятся 30 дней, прочитанные — 90 дней.
5. **Настройки** — пользователь может отключить типы уведомлений в настройках профиля.

---

**Дата:** 27.06.2026  
**Статус:** Актуален  
**Версия:** 1.0

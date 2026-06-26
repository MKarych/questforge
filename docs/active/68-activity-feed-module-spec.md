# Activity Feed Module: Лента активности

> **Дата:** 27.06.2026  
> **Статус:** Актуален  
> **Версия:** 1.0  
> **Цель:** Описать систему ленты активности для отслеживания действий пользователей.

---

## 1. Обзор

Activity Feed Module — система логов активности пользователей, которая позволяет:

- Отслеживать действия пользователей (создание игр, сценариев, покупки)
- Показывать ленту активности на страницах профилей
- Формировать ленту для дашборда администратора
- Генерировать события для уведомлений

---

## 2. Модель данных (Prisma)

### 2.1. ActivityLog

```prisma
model ActivityLog {
  id        String   @id @default(uuid())
  userId    String   @map("user_id") @db.Uuid
  type      String   @db.VarChar(50)
  payload   Json     @default("{}")
  createdAt DateTime @default(now()) @map("created_at")
  user      User     @Relation(fields: [userId], references: [id])

  @@index([userId])
  @@index([createdAt])
  @@index([userId, createdAt])
  @@map("activity_logs")
}
```

**Поля:**
- `userId` — кто совершил действие
- `type` — тип действия (создание игры, покупка, и т.д.)
- `payload` — JSON с деталями действия
- `createdAt` — когда произошло

### 2.2. Типы activity-событий

| Тип | Payload | Описание |
|-----|---------|----------|
| `GAME_CREATED` | `{ gameId, title }` | Создана новая игра |
| `GAME_PUBLISHED` | `{ gameId, title }` | Игра опубликована |
| `GAME_STARTED` | `{ gameId, title }` | Игра начата |
| `GAME_FINISHED` | `{ gameId, title }` | Игра завершена |
| `GAME_CANCELLED` | `{ gameId, title }` | Игра отменена |
| `SCENARIO_CREATED` | `{ scenarioId, name }` | Создан сценарий |
| `SCENARIO_PUBLISHED` | `{ scenarioId, name }` | Сценарий опубликован |
| `PURCHASE_COMPLETED` | `{ listingId, title, price }` | Покупка завершена |
| `TEAM_CREATED` | `{ teamId, name }` | Создана команда |
| `USER_REGISTERED` | `{ username }` | Регистрация пользователя |
| `TIER_UPGRADED` | `{ from, to }` | Повышение тарифа |
| `ACHIEVEMENT_UNLOCKED` | `{ type, name }` | Достижение разблокировано |
| `FRIEND_ADDED` | `{ friendId, friendName }` | Добавлен друг |
| `REVIEW_CREATED` | `{ entityId, rating }` | Оставлен отзыв |

---

## 3. API Эндпоинты

### 3.1. Лента активности пользователя

```
GET /users/:id/activity
```

Лента активности конкретного пользователя (публично).

**Query Parameters:**
| Параметр | Тип | Описание |
|----------|-----|----------|
| `type` | string | Фильтр по типу события |
| `limit` | number | Количество (по умолчанию 20) |
| `offset` | number | Смещение |

**Response (200):**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "log-uuid",
        "type": "GAME_CREATED",
        "payload": {
          "gameId": "game-uuid",
          "title": "Тайны старого города"
        },
        "createdAt": "2025-01-01T12:00:00Z"
      },
      {
        "id": "log-uuid-2",
        "type": "SCENARIO_PUBLISHED",
        "payload": {
          "scenarioId": "scenario-uuid",
          "name": "Детектив на набережной"
        },
        "createdAt": "2025-01-02T10:00:00Z"
      }
    ],
    "total": 15
  }
}
```

---

### 3.2. Глобальная лента активности

```
GET /activity-feed
```

Лента активности всех пользователей (для главной страницы / дашборда).

**Query Parameters:**
| Параметр | Тип | Описание |
|----------|-----|----------|
| `type` | string | Фильтр по типу |
| `limit` | number | 1-50 |
| `offset` | number | Смещение |

**Response (200):**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "type": "GAME_CREATED",
        "user": {
          "id": "user-uuid",
          "username": "alex_quest",
          "avatar": "https://..."
        },
        "payload": {
          "title": "Тайны старого города"
        },
        "createdAt": "2025-01-01T12:00:00Z"
      }
    ]
  }
}
```

---

## 4. Создание activity-записей

```typescript
class ActivityFeedService {
  async log(userId: string, type: string, payload: Record<string, unknown>) {
    return this.prisma.activityLog.create({
      data: {
        userId,
        type,
        payload,
      },
    });
  }

  // Пример: после создания игры
  async afterGameCreated(gameId: string, userId: string, title: string) {
    await this.log(userId, 'GAME_CREATED', { gameId, title });
    await this.notificationService.createMany([
      // Уведомления подписчикам организатора
    ]);
  }
}
```

---

## 5. Очистка старых записей

```typescript
// Удалять записи старше 90 дней
await this.prisma.activityLog.deleteMany({
  where: {
    createdAt: {
      lt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
    },
  },
});
```

---

## 6. Фронтенд

### 6.1. Компоненты

- `ActivityFeed` — компонент ленты
- `ActivityItem` — карточка события
- `ActivityFilter` — фильтры по типу

### 6.2. Страницы

| Страница | Путь | Описание |
|----------|------|----------|
| Лента пользователя | `/profile/:id/activity` | Лента конкретного пользователя |
| Главная | `/` | Глобальная лента активности |

---

## 7. Интеграция

Activity Feed интегрируется с:

| Модуль | Событие |
|--------|---------|
| Game Service | GAME_CREATED, GAME_STARTED, GAME_FINISHED, GAME_CANCELLED |
| Scenario Service | SCENARIO_CREATED, SCENARIO_PUBLISHED |
| Commerce Module | PURCHASE_COMPLETED |
| Team Service | TEAM_CREATED |
| Auth Module | USER_REGISTERED |
| Billing Module | TIER_UPGRADED |
| Achievement Module | ACHIEVEMENT_UNLOCKED |
| Social Module | FRIEND_ADDED |
| Review Service | REVIEW_CREATED |

---

## 8. Архитектурные правила

1. **Асинхронная запись.** Запись в activity_log не блокирует основную операцию.
2. **Таймаут хранения.** Записи старше 90 дней удаляются (frequent cron-job).
3. **Публичный доступ.** Лента доступна публично для всех пользователей.
4. **JSON payload.** Гибкая структура для разных типов событий.
5. **Индексация.** Индексы по (userId, createdAt) для быстрого запроса.

---

**Дата:** 27.06.2026  
**Статус:** Актуален  
**Версия:** 1.0

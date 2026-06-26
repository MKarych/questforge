```markdown
# API Specification: Контракты взаимодействия

> **Кодовое имя проекта:** Adventure Engine
> **Уровень документа:** Инженерный контракт
> **Статус:** Утвержден. Изменения только с мажорной версией.

---

## 1. Базовые принципы

### 1.1. Базовый URL

```
Development:  http://localhost:3000/api
Staging:      https://staging.adventure-engine.com/api
Production:   https://api.adventure-engine.com
```

### 1.2. Версионирование

API версионируется через заголовок `Accept-Version` или URL-префикс.

```
Accept-Version: 1.0
```

или

```
/api/v1/games
```

**Правило:** Мажорные изменения → новая версия. Минорные изменения → обратно совместимы.

### 1.3. Авторизация

Используется **JWT** (JSON Web Token).

```
Authorization: Bearer <jwt-token>
```

**Срок жизни токена:** 7 дней.  
**Refresh токен:** выдается вместе с основным, срок жизни 30 дней.

### 1.4. Форматы ответов

**Успешный ответ:**

```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "timestamp": 1700000000000,
    "version": "1.0"
  }
}
```

**Ошибка:**

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Невалидные данные",
    "details": [
      { "field": "email", "message": "Неверный формат email" }
    ]
  }
}
```

### 1.5. Коды ошибок

| Код | HTTP | Описание |
| :--- | :--- | :--- |
| `AUTH_REQUIRED` | 401 | Требуется авторизация |
| `AUTH_EXPIRED` | 401 | Токен истек |
| `AUTH_INVALID` | 401 | Невалидный токен |
| `FORBIDDEN` | 403 | Недостаточно прав |
| `NOT_FOUND` | 404 | Ресурс не найден |
| `VALIDATION_ERROR` | 422 | Ошибка валидации |
| `RATE_LIMIT` | 429 | Слишком много запросов |
| `SESSION_LOCKED` | 409 | Сессия заблокирована другим процессом |
| `INTERNAL_ERROR` | 500 | Внутренняя ошибка сервера |

---

## 2. Auth (Аутентификация)

### 2.1. Регистрация (обычного пользователя)

```
POST /auth/register
```

**Request:**

```json
{
  "email": "player@example.com",
  "password": "securepassword",
  "name": "Алексей"
}
```

**Response (200):**

```json
{
  "success": true,
  "data": {
    "id": "user-123",
    "email": "player@example.com",
    "name": "Алексей",
    "role": "player",
    "token": "jwt-token",
    "refreshToken": "refresh-token"
  }
}
```

---

### 2.2. Логин

```
POST /auth/login
```

**Request:**

```json
{
  "email": "player@example.com",
  "password": "securepassword"
}
```

**Response (200):**

```json
{
  "success": true,
  "data": {
    "id": "user-123",
    "email": "player@example.com",
    "name": "Алексей",
    "role": "player",
    "token": "jwt-token",
    "refreshToken": "refresh-token"
  }
}
```

---

### 2.3. Refresh токен

```
POST /auth/refresh
```

**Request:**

```json
{
  "refreshToken": "refresh-token"
}
```

**Response (200):**

```json
{
  "success": true,
  "data": {
    "token": "new-jwt-token",
    "refreshToken": "new-refresh-token"
  }
}
```

---

### 2.4. Logout

```
POST /auth/logout
```

**Authorization:** Bearer <token>

**Response (200):**

```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

### 2.5. Получение профиля

```
GET /auth/me
```

**Authorization:** Bearer <token>

**Response (200):**

```json
{
  "success": true,
  "data": {
    "id": "user-123",
    "email": "player@example.com",
    "name": "Алексей",
    "role": "player",
    "createdAt": "2025-01-01T12:00:00Z",
    "stats": {
      "gamesPlayed": 5,
      "gamesCompleted": 3,
      "averageScore": 28
    }
  }
}
```

---

### 2.6. Подать заявку на организатора

```
POST /organizer/apply
```

**Authorization:** Bearer <token>

**Request:**

```json
{
  "city": "Минск",
  "phone": "+375291234567",
  "telegram": "@ivan_ivanov",
  "experience": "Провел 5 игр в прошлом"
}
```

**Response (201):**

```json
{
  "success": true,
  "data": {
    "applicationId": "app-123",
    "status": "pending",
    "message": "Заявка отправлена. Ожидайте модерации (1-3 дня).",
    "createdAt": "2025-01-01T12:00:00Z"
  }
}
```

---

### 2.7. Получить статус заявки

```
GET /organizer/application
```

**Authorization:** Bearer <token>

**Response (200):**

```json
{
  "success": true,
  "data": {
    "applicationId": "app-123",
    "status": "pending",
    "rejectionReason": null,
    "createdAt": "2025-01-01T12:00:00Z",
    "updatedAt": "2025-01-02T10:00:00Z"
  }
}
```

---

### 2.8. Получить статус организатора

```
GET /organizer/status
```

**Authorization:** Bearer <token>

**Response (200):**

```json
{
  "success": true,
  "data": {
    "isOrganizer": true,
    "status": "approved",
    "approvedAt": "2025-01-03T12:00:00Z"
  }
}
```

---

## 3. Users (Профили пользователей)

### 3.1. Получить публичный профиль пользователя

```
GET /users/:id
```

**Query Parameters:** нет

**Response (200):**

```json
{
  "success": true,
  "data": {
    "id": "user-123",
    "name": "Алексей",
    "avatarUrl": "https://...",
    "city": "Минск",
    "bio": "Люблю городские квесты",
    "telegram": "@alex_quest",
    "vk": "id123456",
    "whatsapp": "+375291234567",
    "role": "PLAYER",
    "rating": 4.8,
    "reputation": 150,
    "achievements": [
      {
        "id": "ach_first_game",
        "type": "FIRST_GAME",
        "name": "Первая игра",
        "description": "Пройдите свою первую игру",
        "icon": "🎮",
        "unlockedAt": "2025-01-01T12:00:00Z"
      }
    ],
    "gamesCreated": 2,
    "gamesConducted": 5,
    "scenariosCreated": 1,
    "gamesPlayed": 10,
    "reviewsCount": 3,
    "createdAt": "2025-01-01T12:00:00Z",
    "lastSeenAt": "2025-01-10T15:00:00Z"
  }
}
```

---

### 3.2. Получить мой профиль

```
GET /users/me
```

**Authorization:** Bearer <token>

**Response (200):**

```json
{
  "success": true,
  "data": {
    "id": "user-123",
    "email": "alex@example.com",
    "name": "Алексей",
    "avatarUrl": "https://...",
    "city": "Минск",
    "bio": "Люблю городские квесты",
    "telegram": "@alex_quest",
    "vk": "id123456",
    "whatsapp": "+375291234567",
    "role": "PLAYER",
    "rating": 4.8,
    "reputation": 150,
    "achievements": [],
    "organizerStatus": "NOT_APPLIED",
    "gamesCreated": 2,
    "gamesConducted": 5,
    "scenariosCreated": 1,
    "createdAt": "2025-01-01T12:00:00Z",
    "lastLoginAt": "2025-01-10T15:00:00Z",
    "lastSeenAt": "2025-01-10T15:00:00Z"
  }
}
```

---

### 3.3. Обновить мой профиль

```
PATCH /users/me
```

**Authorization:** Bearer <token>

**Request:**

```json
{
  "name": "Алексей Иванов",
  "city": "Минск",
  "bio": "Люблю городские квесты и автоквесты",
  "telegram": "@alex_quest",
  "vk": "id123456",
  "whatsapp": "+375291234567"
}
```

**Response (200):**

```json
{
  "success": true,
  "data": {
    "id": "user-123",
    "name": "Алексей Иванов",
    "avatarUrl": "https://...",
    "city": "Минск",
    "bio": "Люблю городские квесты и автоквесты",
    "telegram": "@alex_quest",
    "vk": "id123456",
    "whatsapp": "+375291234567",
    "role": "PLAYER",
    "rating": 4.8,
    "reputation": 150
  }
}
```

---

### 3.4. Обновить аватар

```
POST /users/me/avatar
```

**Authorization:** Bearer <token>

**Request:**

```json
{
  "avatarUrl": "https://cdn.example.com/avatars/user-123.jpg"
}
```

**Response (200):**

```json
{
  "success": true,
  "data": {
    "id": "user-123",
    "avatarUrl": "https://cdn.example.com/avatars/user-123.jpg",
    "name": "Алексей"
  }
}
```

---

### 3.5. Проверить и выдать достижения

```
POST /users/me/check-achievements
```

**Authorization:** Bearer <token>

**Response (200):**

```json
{
  "success": true,
  "data": [
    {
      "id": "ach_first_game",
      "type": "FIRST_GAME",
      "name": "Первая игра",
      "description": "Пройдите свою первую игру",
      "icon": "🎮",
      "unlockedAt": "2025-01-10T15:00:00Z"
    }
  ]
}
```

---

## 4. Public (Публичная часть — без авторизации)

### 4.1. Публичный каталог игр

```
GET /games/public
```

**Query Parameters:**

| Параметр | Тип | Описание |
| :--- | :--- | :--- |
| `city` | string | Фильтр по городу |
| `dateFrom` | string | Фильтр по дате (ISO) |
| `dateTo` | string | Фильтр по дате (ISO) |
| `type` | string | Тип игры (автоквест, пешеходный) |
| `sort` | string | `date`, `rating`, `popularity` |
| `limit` | number | 1-100, по умолчанию 20 |
| `offset` | number | Смещение для пагинации |

**Response (200):**

```json
{
  "success": true,
  "data": [
    {
      "id": "game-456",
      "title": "Тайны старого города",
      "description": "Прогулка по историческому центру",
      "city": "Минск",
      "date": "2025-01-15T19:00:00Z",
      "duration": 180,
      "price": 15,
      "rating": 4.8,
      "reviewsCount": 45,
      "organizer": {
        "id": "user-123",
        "name": "Иван Иванов"
      },
      "status": "approved",
      "imageUrl": "https://..."
    }
  ],
  "meta": {
    "total": 12,
    "limit": 20,
    "offset": 0
  }
}
```

---

### 4.2. Публичная страница игры

```
GET /games/public/:id
```

**Response (200):**

```json
{
  "success": true,
  "data": {
    "id": "game-456",
    "title": "Тайны старого города",
    "description": "Прогулка по историческому центру",
    "city": "Минск",
    "date": "2025-01-15T19:00:00Z",
    "duration": 180,
    "price": 15,
    "rating": 4.8,
    "reviewsCount": 45,
    "organizer": {
      "id": "user-123",
      "name": "Иван Иванов",
      "avatar": "https://...",
      "gamesCount": 12,
      "organizerRating": 4.9
    },
    "reviews": [
      {
        "id": "review-1",
        "author": "Алексей",
        "rating": 5,
        "text": "Отличная игра!",
        "createdAt": "2025-01-01T12:00:00Z"
      }
    ],
    "comments": [
      {
        "id": "comment-1",
        "author": "Мария",
        "text": "Когда будет следующая игра?",
        "createdAt": "2025-01-02T10:00:00Z"
      }
    ],
    "status": "approved",
    "imageUrl": "https://...",
    "teamsCount": 8,
    "maxTeams": 15,
    "shareLink": "/play/abc123xyz"
  }
}
```

---

## 5. Games (Игры)

### 5.1. Создать игру

```
POST /games
```

**Authorization:** Bearer <token> (только организатор)

**Request:**

```json
{
  "title": "Тайны старого города",
  "description": "Прогулка по историческому центру",
  "city": "Минск",
  "date": "2025-01-15T19:00:00Z",
  "duration": 180,
  "price": 15,
  "maxTeams": 15,
  "scenarioId": "scenario-123"
}
```

**Response (201):**

```json
{
  "success": true,
  "data": {
    "id": "game-456",
    "title": "Тайны старого города",
    "city": "Минск",
    "status": "draft",
    "shareLink": "/play/abc123xyz",
    "createdAt": "2025-01-01T12:00:00Z"
  }
}
```

---

### 5.2. Получить список своих игр

```
GET /games
```

**Authorization:** Bearer <token>

**Query Parameters:**

| Параметр | Тип | Описание |
| :--- | :--- | :--- |
| `status` | string | `draft`, `pending`, `approved`, `rejected`, `active`, `finished` |
| `limit` | number | 1-100, по умолчанию 20 |
| `offset` | number | Смещение для пагинации |

**Response (200):**

```json
{
  "success": true,
  "data": [
    {
      "id": "game-456",
      "title": "Тайны старого города",
      "status": "approved",
      "shareLink": "/play/abc123xyz",
      "playersCount": 45,
      "createdAt": "2025-01-01T12:00:00Z"
    }
  ],
  "meta": {
    "total": 12,
    "limit": 20,
    "offset": 0
  }
}
```

---

### 5.3. Получить игру по ID (для организатора)

```
GET /games/:id
```

**Authorization:** Bearer <token>

**Response (200):**

```json
{
  "success": true,
  "data": {
    "id": "game-456",
    "title": "Тайны старого города",
    "description": "Прогулка по историческому центру",
    "city": "Минск",
    "date": "2025-01-15T19:00:00Z",
    "status": "approved",
    "shareLink": "/play/abc123xyz",
    "scenarioId": "scenario-123",
    "organizerId": "user-123",
    "sessions": [
      {
        "id": "session-789",
        "teamName": "Команда А",
        "score": 45,
        "status": "active"
      }
    ],
    "createdAt": "2025-01-01T12:00:00Z"
  }
}
```

---

### 5.4. Обновить игру

```
PUT /games/:id
```

**Authorization:** Bearer <token> (только организатор игры)

**Request:**

```json
{
  "title": "Тайны старого города (обновлено)",
  "description": "Новое описание",
  "city": "Минск",
  "date": "2025-01-20T19:00:00Z",
  "price": 20
}
```

**Response (200):**

```json
{
  "success": true,
  "data": {
    "id": "game-456",
    "updatedAt": "2025-01-01T13:00:00Z"
  }
}
```

---

### 5.5. Удалить игру

```
DELETE /games/:id
```

**Authorization:** Bearer <token> (только организатор игры)

**Response (200):**

```json
{
  "success": true,
  "message": "Game deleted successfully"
}
```

---

### 5.6. Отправить игру на модерацию

```
POST /games/:id/submit
```

**Authorization:** Bearer <token> (только организатор игры)

**Response (200):**

```json
{
  "success": true,
  "data": {
    "id": "game-456",
    "status": "pending",
    "message": "Игра отправлена на модерацию",
    "submittedAt": "2025-01-01T14:00:00Z"
  }
}
```

---

### 5.7. Получить статус модерации игры

```
GET /games/:id/moderation-status
```

**Authorization:** Bearer <token> (только организатор игры)

**Response (200):**

```json
{
  "success": true,
  "data": {
    "id": "game-456",
    "status": "pending",
    "moderatorComment": null,
    "submittedAt": "2025-01-01T14:00:00Z",
    "moderatedAt": null
  }
}
```

---

### 5.8. Запустить игру

```
POST /games/:id/start
```

**Authorization:** Bearer <token> (только организатор игры)

**Response (200):**

```json
{
  "success": true,
  "data": {
    "id": "game-456",
    "status": "active",
    "startedAt": "2025-01-01T14:00:00Z"
  }
}
```

---

### 5.9. Завершить игру

```
POST /games/:id/finish
```

**Authorization:** Bearer <token> (только организатор игры)

**Response (200):**

```json
{
  "success": true,
  "data": {
    "id": "game-456",
    "status": "finished",
    "finishedAt": "2025-01-01T16:00:00Z"
  }
}
```

---

### 5.10. Отменить игру

```
POST /games/:id/cancel
```

**Authorization:** Bearer <token> (только организатор игры)

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "game-456",
    "status": "CANCELLED",
    "cancelledAt": "2025-01-01T12:00:00Z"
  }
}
```

---

### 5.11. Перенести игру

```
POST /games/:id/reschedule
```

**Authorization:** Bearer <token> (только организатор игры)

**Body:**
```json
{
  "newDate": "2025-02-01T14:00:00Z",
  "reason": "Плохая погода"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "game-456",
    "status": "RESCHEDULED",
    "newDate": "2025-02-01T14:00:00Z"
  }
}
```

---

### 5.12. Переместить в лобби

```
POST /games/:id/move-to-lobby
```

**Authorization:** Bearer <token> (только организатор игры)

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "game-456",
    "status": "LOBBY"
  }
}
```

---

### 5.13. Загрузить обложку

```
POST /games/:id/upload-cover
```

**Authorization:** Bearer <token> (только организатор игры)

**Body:** multipart/form-data (file)

**Response (200):**
```json
{
  "success": true,
  "data": {
    "coverUrl": "https://cdn.questforge.ru/games/abc/cover.jpg"
  }
}
```

---

### 5.14. Отправить на модерацию

```
POST /games/:id/submit-for-review
```

**Authorization:** Bearer <token> (только организатор игры)

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "game-456",
    "moderationStatus": "PENDING"
  }
}
```

---

### 5.15. Опубликовать игру

```
POST /games/:id/publish
```

**Authorization:** Bearer <token> (только организатор игры)

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "game-456",
    "status": "PUBLISHED"
  }
}
```

---

### 5.16. Регистрация команды на игру

```
POST /games/:id/register
```

**Authorization:** Bearer <token> (капитан команды)

**Body:**
```json
{
  "teamId": "team-123"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "teamId": "team-123",
    "status": "REGISTERED"
  }
}
```

---

### 5.17. Отмена регистрации команды

```
POST /games/:id/unregister
```

**Authorization:** Bearer <token> (капитан команды)

**Body:**
```json
{
  "teamId": "team-123"
}
```

**Response (200):**
```json
{
  "success": true
}
```

---

### 5.18. Команда готова

```
POST /games/:id/ready
```

**Authorization:** Bearer <token> (капитан команды)

**Body:**
```json
{
  "teamId": "team-123"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "teamId": "team-123",
    "status": "READY"
  }
}
```

---

### 5.19. Задать вопрос по игре

```
POST /games/:id/questions
```

**Authorization:** Bearer <token> (участник команды)

**Body:**
```json
{
  "teamId": "team-123",
  "question": "Где найти ключ?"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "q-789",
    "answer": "Посмотрите под скамейкой"
  }
}
```

---

### 5.20. Отправить сообщение в чат игры

```
POST /games/:id/chat
```

**Authorization:** Bearer <token> (участник команды)

**Body:**
```json
{
  "teamId": "team-123",
  "message": "Мы нашли подсказку!"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "msg-456",
    "createdAt": "2025-01-01T14:30:00Z"
  }
}
```

---

### 5.21. Отправить сообщение организатору

```
POST /games/:id/organizer-message
```

**Authorization:** Bearer <token> (участник команды)

**Body:**
```json
{
  "teamId": "team-123",
  "message": "Нужна помощь!"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "msg-789",
    "createdAt": "2025-01-01T14:35:00Z"
  }
}
```

---

### 5.22. Регистрация по названию команды (для организатора)

```
POST /games/:id/register-by-name
```

**Authorization:** Bearer <token> (только организатор игры)

**Body:**
```json
{
  "teamName": "Ночные волки",
  "captainName": "Иван Иванов",
  "captainPhone": "+7-900-123-45-67"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "teamId": "team-456",
    "status": "REGISTERED"
  }
}
```

---

### 5.23. Админские эндпоинты для игр

#### Получить все игры (админ/модератор)

```
GET /games/admin
```

**Authorization:** Bearer <token> (ADMIN или MODERATOR)

**Query Parameters:**
- `status` — фильтр по статусу
- `search` — поиск по названию
- `limit` — количество (по умолчанию 20)
- `offset` — смещение

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

#### Скрыть игру

```
POST /games/:id/admin/hide
```

**Authorization:** Bearer <token> (ADMIN или MODERATOR)

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "game-456",
    "status": "HIDDEN"
  }
}
```

#### Показать игру (снять скрытие)

```
POST /games/:id/admin/unhide
```

**Authorization:** Bearer <token> (ADMIN или MODERATOR)

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "game-456",
    "status": "PUBLISHED"
  }
}
```

#### Заблокировать игру

```
POST /games/:id/admin/block
```

**Authorization:** Bearer <token> (ADMIN или MODERATOR)

**Body:**
```json
{
  "reason": "Нарушение правил платформы"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "game-456",
    "status": "BLOCKED"
  }
}
```

#### Разблокировать игру

```
POST /games/:id/admin/unblock
```

**Authorization:** Bearer <token> (ADMIN или MODERATOR)

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "game-456",
    "status": "DRAFT"
  }
}
```

---

### 5.24. Отзывы на игру

#### Оставить отзыв

```
POST /games/:id/reviews
```

**Authorization:** Bearer <token>

**Body:**
```json
{
  "rating": 5,
  "text": "Отличная игра!"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "review-123",
    "rating": 5
  }
}
```

#### Получить отзывы

```
GET /games/:id/reviews
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "items": [...],
    "total": 10
  }
}
```

---

### 5.25. Комментарии к игре

#### Получить комментарии

```
GET /games/:id/comments
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "items": [...],
    "total": 5
  }
}
```

#### Добавить комментарий

```
POST /games/:id/comments
```

**Authorization:** Bearer <token>

**Body:**
```json
{
  "text": "Когда будет следующая игра?"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "comment-456",
    "text": "Когда будет следующая игра?"
  }
}
```

#### Обновить комментарий

```
PATCH /games/:id/comments/:commentId
```

**Authorization:** Bearer <token> (только автор комментария)

**Body:**
```json
{
  "text": "Обновлённый текст"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "comment-456",
    "text": "Обновлённый текст"
  }
}
```

#### Удалить комментарий

```
DELETE /games/:id/comments/:commentId
```

**Authorization:** Bearer <token> (только автор комментария или ADMIN)

**Response (200):**
```json
{
  "success": true
}
```

---

## 7. Sessions (Игровые сессии)

### 7.1. Создать сессию (начать игру)

```
POST /sessions
```

**Request:**

```json
{
  "gameId": "game-456",
  "teamName": "Команда А"
}
```

**Response (201):**

```json
{
  "success": true,
  "data": {
    "sessionId": "session-789",
    "gameId": "game-456",
    "teamName": "Команда А",
    "currentNode": {
      "id": "node-1",
      "type": "text",
      "question": "Как называется главная площадь?"
    },
    "score": 0,
    "status": "active",
    "startedAt": "2025-01-01T14:00:00Z"
  }
}
```

---

### 7.2. Получить состояние сессии

```
GET /sessions/:sessionId
```

**Response (200):**

```json
{
  "success": true,
  "data": {
    "sessionId": "session-789",
    "teamName": "Команда А",
    "currentNodeId": "node-2",
    "score": 10,
    "penalties": 0,
    "status": "active",
    "startedAt": "2025-01-01T14:00:00Z",
    "history": [
      {
        "nodeId": "node-1",
        "result": "success",
        "timestamp": "2025-01-01T14:05:00Z"
      }
    ]
  }
}
```

---

### 7.3. Получить текущее задание

```
GET /sessions/:sessionId/current
```

**Response (200):**

```json
{
  "success": true,
  "data": {
    "nodeId": "node-2",
    "type": "code",
    "question": "Найдите код на колонне",
    "hint": "Колонна у входа в парк"
  }
}
```

---

### 7.4. Отправить ответ

```
POST /sessions/:sessionId/answer
```

**Request (текстовый ответ):**

```json
{
  "nodeId": "node-2",
  "answer": "12345",
  "answerType": "code"
}
```

**Request (фото):**

```json
{
  "nodeId": "node-3",
  "answer": "base64_encoded_image",
  "answerType": "photo"
}
```

**Response (успех, переход к следующему узлу):**

```json
{
  "success": true,
  "data": {
    "result": "success",
    "score": 20,
    "nextNode": {
      "id": "node-3",
      "type": "photo",
      "question": "Сфотографируйтесь у фонтана"
    },
    "message": "✅ Правильно! Переходим к следующему заданию."
  }
}
```

**Response (ошибка, остаемся на том же узле):**

```json
{
  "success": false,
  "error": {
    "code": "INVALID_ANSWER",
    "message": "❌ Неправильный ответ. Попробуйте еще раз."
  }
}
```

**Response (финиш):**

```json
{
  "success": true,
  "data": {
    "result": "finished",
    "score": 30,
    "totalTime": 120,
    "message": "🏁 Поздравляем! Вы завершили игру!"
  }
}
```

---

### 7.5. Получить историю сессии

```
GET /sessions/:sessionId/history
```

**Response (200):**

```json
{
  "success": true,
  "data": [
    {
      "nodeId": "node-1",
      "answer": "Красная",
      "result": "success",
      "timestamp": "2025-01-01T14:05:00Z"
    },
    {
      "nodeId": "node-2",
      "answer": "12345",
      "result": "success",
      "timestamp": "2025-01-01T14:10:00Z"
    }
  ]
}
```

---

### 7.6. Откатить состояние (Time Travel)

```
POST /sessions/:sessionId/rewind
```

**Authorization:** Bearer <token> (только организатор)

**Request:**

```json
{
  "timestamp": "2025-01-01T14:07:00Z"
}
```

**Response (200):**

```json
{
  "success": true,
  "data": {
    "sessionId": "session-789",
    "rewindedTo": "2025-01-01T14:07:00Z",
    "currentNodeId": "node-2",
    "score": 10
  }
}
```

---

### 7.7. Отправить SOS организатору

```
POST /sessions/:sessionId/sos
```

**Request:**

```json
{
  "message": "Мы застряли, не можем найти колонну",
  "location": {
    "lat": 55.7558,
    "lng": 37.6173
  }
}
```

**Response (200):**

```json
{
  "success": true,
  "message": "SOS отправлен организатору"
}
```

---

## 6. Scenarios (Сценарии)

### 6.1. Создать сценарий

```
POST /scenarios
```

**Authorization:** Bearer <token>

**Request:**

```json
{
  "name": "Мой первый сценарий",
  "nodes": [
    {
      "id": "node-1",
      "type": "START",
      "question": "Начало сценария"
    },
    {
      "id": "node-2",
      "type": "TEXT",
      "question": "Как называется главная площадь?",
      "answer": "Красная",
      "transitions": [
        { "when": "success", "to": "node-3" }
      ]
    },
    {
      "id": "node-3",
      "type": "CODE",
      "question": "Найдите код на колонне",
      "answer": "12345",
      "transitions": [
        { "when": "success", "to": "node-4" },
        { "when": "fail", "to": "node-3" }
      ]
    },
    {
      "id": "node-4",
      "type": "PHOTO",
      "question": "Сфотографируйтесь у фонтана",
      "transitions": []
    },
    {
      "id": "node-5",
      "type": "FINISH",
      "question": "Финиш"
    }
  ],
  "edges": [
    { "id": "e1", "from": "node-1", "to": "node-2", "condition": "always" },
    { "id": "e2", "from": "node-2", "to": "node-3", "condition": "success" },
    { "id": "e3", "from": "node-3", "to": "node-4", "condition": "success" },
    { "id": "e4", "from": "node-4", "to": "node-5", "condition": "always" }
  ],
  "startNodeId": "node-1"
}
```

**Response (201):**

```json
{
  "success": true,
  "data": {
    "id": "scenario-123",
    "name": "Мой первый сценарий",
    "version": 1,
    "nodesCount": 5,
    "valid": true,
    "createdAt": "2025-01-01T12:00:00Z"
  }
}
```

---

### 6.2. Получить список сценариев

```
GET /scenarios
```

**Authorization:** Bearer <token>

**Query Parameters:**

| Параметр | Тип | Описание |
| :--- | :--- | :--- |
| `published` | boolean | Только опубликованные |
| `limit` | number | 1-100, по умолчанию 20 |
| `offset` | number | Смещение для пагинации |

**Response (200):**

```json
{
  "success": true,
  "data": [
    {
      "id": "scenario-123",
      "name": "Мой первый сценарий",
      "version": 1,
      "isPublished": true,
      "salesCount": 5,
      "rating": 4.8,
      "createdAt": "2025-01-01T12:00:00Z"
    }
  ],
  "meta": {
    "total": 8,
    "limit": 20,
    "offset": 0
  }
}
```

---

### 6.3. Получить сценарий по ID

```
GET /scenarios/:id
```

**Authorization:** Bearer <token>

**Response (200):**

```json
{
  "success": true,
  "data": {
    "id": "scenario-123",
    "name": "Мой первый сценарий",
    "version": 1,
    "nodes": [...],
    "edges": [...],
    "startNodeId": "node-1",
    "isPublished": true,
    "valid": true,
    "validationErrors": [],
    "createdAt": "2025-01-01T12:00:00Z"
  }
}
```

---

### 6.4. Обновить сценарий

```
PUT /scenarios/:id
```

**Authorization:** Bearer <token>

**Request:** (такой же как при создании)

**Response (200):**

```json
{
  "success": true,
  "data": {
    "id": "scenario-123",
    "version": 2,
    "updatedAt": "2025-01-01T13:00:00Z"
  }
}
```

---

### 6.5. Валидировать сценарий

```
POST /scenarios/:id/validate
```

**Authorization:** Bearer <token>

**Response (200):**

```json
{
  "success": true,
  "data": {
    "valid": true,
    "errors": [],
    "warnings": []
  }
}
```

**Response с ошибками:**

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Сценарий не прошел валидацию",
    "details": [
      { "type": "error", "code": "ERR_NO_START", "message": "Нет узла START" },
      { "type": "error", "code": "ERR_NO_FINISH", "message": "Нет узла FINISH" }
    ]
  }
}
```

---

### 6.6. Опубликовать сценарий

```
POST /scenarios/:id/publish
```

**Authorization:** Bearer <token>

**Request:**

```json
{
  "price": 39,
  "licenseType": "perpetual"
}
```

**Response (200):**

```json
{
  "success": true,
  "data": {
    "id": "scenario-123",
    "isPublished": true,
    "price": 39,
    "licenseType": "perpetual",
    "publishedAt": "2025-01-01T14:00:00Z"
  }
}
```

---

### 6.7. Создать новую версию

```
POST /scenarios/:id/version
```

**Authorization:** Bearer <token>

**Request:**

```json
{
  "nodes": [...],
  "edges": [...],
  "versionNote": "Добавлены ветвления"
}
```

**Response (200):**

```json
{
  "success": true,
  "data": {
    "id": "scenario-123",
    "version": 3,
    "createdAt": "2025-01-01T15:00:00Z"
  }
}
```

---

## 8. Teams (Команды)

### 8.1. Создать команду

```
POST /teams
```

**Authorization:** Bearer <token>

**Request:**

```json
{
  "name": "Ночные волки",
  "description": "Команда для участия в городских квестах"
}
```

**Response (201):**

```json
{
  "success": true,
  "data": {
    "id": "team-123",
    "name": "Ночные волки",
    "description": "Команда для участия в городских квестах",
    "captainId": "user-456",
    "createdAt": "2025-01-01T12:00:00Z"
  }
}
```

---

### 8.2. Получить список команд

```
GET /teams
```

**Query Parameters:**

| Параметр | Тип | Описание |
| :--- | :--- | :--- |
| `city` | string | Фильтр по городу |
| `limit` | number | 1-100, по умолчанию 20 |
| `offset` | number | Смещение для пагинации |

**Response (200):**

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "team-123",
        "name": "Ночные волки",
        "rating": 1250,
        "membersCount": 4,
        "city": "Москва"
      }
    ],
    "total": 10
  }
}
```

---

### 8.3. Получить детали команды

```
GET /teams/:id
```

**Response (200):**

```json
{
  "success": true,
  "data": {
    "id": "team-123",
    "name": "Ночные волки",
    "description": "Команда для участия в городских квестах",
    "captain": {
      "id": "user-456",
      "name": "Алексей",
      "avatar": "https://..."
    },
    "members": [
      {
        "id": "user-456",
        "name": "Алексей",
        "role": "captain",
        "joinedAt": "2025-01-01T12:00:00Z"
      },
      {
        "id": "user-789",
        "name": "Мария",
        "role": "member",
        "joinedAt": "2025-01-02T10:00:00Z"
      }
    ],
    "rating": 1250,
    "gamesPlayed": 5,
    "gamesWon": 2,
    "createdAt": "2025-01-01T12:00:00Z"
  }
}
```

---

### 8.4. Пригласить в команду

```
POST /teams/:id/invite
```

**Authorization:** Bearer <token> (только капитан)

**Request:**

```json
{
  "userId": "user-789"
}
```

**Response (200):**

```json
{
  "success": true,
  "data": {
    "status": "invited",
    "inviteId": "invite-123",
    "message": "Приглашение отправлено"
  }
}
```

---

### 8.5. Вступить в команду (по приглашению)

```
POST /teams/:id/join
```

**Authorization:** Bearer <token>

**Request:**

```json
{
  "inviteToken": "token-123"
}
```

**Response (200):**

```json
{
  "success": true,
  "data": {
    "status": "joined",
    "teamId": "team-123",
    "message": "Вы успешно вступили в команду"
  }
}
```

---

### 8.6. Покинуть команду

```
DELETE /teams/:id/members/me
```

**Authorization:** Bearer <token>

**Response (200):**

```json
{
  "success": true,
  "data": {
    "status": "left",
    "message": "Вы покинули команду"
  }
}
```

---

### 8.7. Исключить участника

```
DELETE /teams/:id/members/:userId
```

**Authorization:** Bearer <token> (только капитан)

**Response (200):**

```json
{
  "success": true,
  "data": {
    "status": "removed",
    "message": "Участник исключен из команды"
  }
}
```

---

## 9. Reviews (Отзывы)

### 9.1. Получить отзывы на игру

```
GET /games/:gameId/reviews
```

**Query Parameters:**

| Параметр | Тип | Описание |
| :--- | :--- | :--- |
| `limit` | number | 1-100, по умолчанию 20 |
| `offset` | number | Смещение для пагинации |

**Response (200):**

```json
{
  "success": true,
  "data": [
    {
      "id": "review-123",
      "author": {
        "id": "user-123",
        "name": "Алексей"
      },
      "rating": 5,
      "text": "Отличная игра! Было очень интересно.",
      "createdAt": "2025-01-01T16:00:00Z"
    }
  ],
  "meta": {
    "total": 45,
    "averageRating": 4.8,
    "limit": 20,
    "offset": 0
  }
}
```

---

### 9.3. Обновить отзыв

```
PUT /reviews/:id
```

**Authorization:** Bearer <token> (только автор отзыва)

**Request:**

```json
{
  "rating": 4,
  "text": "Обновленный текст отзыва"
}
```

**Response (200):**

```json
{
  "success": true,
  "data": {
    "id": "review-123",
    "rating": 4,
    "text": "Обновленный текст отзыва",
    "updatedAt": "2025-01-02T10:00:00Z"
  }
}
```

---

### 9.4. Удалить отзыв

```
DELETE /reviews/:id
```

**Authorization:** Bearer <token> (только автор отзыва или admin)

**Response (200):**

```json
{
  "success": true,
  "message": "Отзыв удален"
}
```

---

## 10. Comments (Обсуждения)

### 10.1. Создать комментарий к игре

```
POST /games/:gameId/comments
```

**Authorization:** Bearer <token>

**Request:**

```json
{
  "text": "Когда будет следующая игра?"
}
```

**Response (201):**

```json
{
  "success": true,
  "data": {
    "id": "comment-123",
    "gameId": "game-456",
    "author": {
      "id": "user-123",
      "name": "Алексей"
    },
    "text": "Когда будет следующая игра?",
    "createdAt": "2025-01-01T17:00:00Z"
  }
}
```

---

### 10.2. Получить комментарии к игре (публично)

```
GET /games/:gameId/comments
```

**Query Parameters:**

| Параметр | Тип | Описание |
| :--- | :--- | :--- |
| `limit` | number | 1-100, по умолчанию 20 |
| `offset` | number | Смещение для пагинации |

**Response (200):**

```json
{
  "success": true,
  "data": [
    {
      "id": "comment-123",
      "author": {
        "id": "user-123",
        "name": "Алексей"
      },
      "text": "Когда будет следующая игра?",
      "createdAt": "2025-01-01T17:00:00Z"
    }
  ],
  "meta": {
    "total": 12,
    "limit": 20,
    "offset": 0
  }
}
```

---

### 10.3. Удалить комментарий

```
DELETE /comments/:id
```

**Authorization:** Bearer <token> (только автор комментария или admin)

**Response (200):**

```json
{
  "success": true,
  "message": "Комментарий удален"
}
```

---

## 11. Marketplace (Маркетплейс)

### 11.1. Получить каталог

```
GET /marketplace
```

**Query Parameters:**

| Параметр | Тип | Описание |
| :--- | :--- | :--- |
| `category` | string | `city`, `quiz`, `business`, `home` |
| `genre` | string | `автоквест`, `пешеходный`, `квиз` |
| `priceMin` | number | Минимальная цена |
| `priceMax` | number | Максимальная цена |
| `rating` | number | Минимальный рейтинг |
| `city` | string | Фильтр по городу |
| `limit` | number | 1-100, по умолчанию 20 |
| `offset` | number | Смещение для пагинации |

**Response (200):**

```json
{
  "success": true,
  "data": [
    {
      "id": "scenario-123",
      "title": "Ночной дозор",
      "description": "Автоквест по ночному городу",
      "category": "city",
      "genre": "автоквест",
      "price": 39,
      "licenseType": "perpetual",
      "rating": 4.8,
      "reviewsCount": 127,
      "salesCount": 45,
      "author": {
        "id": "user-123",
        "name": "Иван Иванов",
        "rating": 4.9
      },
      "createdAt": "2025-01-01T12:00:00Z"
    }
  ],
  "meta": {
    "total": 45,
    "limit": 20,
    "offset": 0
  }
}
```

---

### 11.2. Получить детали пакета

```
GET /marketplace/:id
```

**Response (200):**

```json
{
  "success": true,
  "data": {
    "id": "scenario-123",
    "title": "Ночной дозор",
    "description": "Автоквест по ночному городу",
    "category": "city",
    "genre": "автоквест",
    "price": 39,
    "licenseType": "perpetual",
    "rating": 4.8,
    "reviewsCount": 127,
    "salesCount": 45,
    "author": {
      "id": "user-123",
      "name": "Иван Иванов",
      "rating": 4.9,
      "avatar": "https://..."
    },
    "media": {
      "cover": "https://...",
      "screenshots": ["https://...", "https://..."]
    },
    "whatsIncluded": [
      "Готовый сценарий",
      "Все загадки и ответы",
      "Фотографии локаций",
      "Маршрут с GPS-точками",
      "Таймеры и настройки",
      "Подсказки (3 уровня)",
      "Постер и баннеры",
      "Правила игры",
      "Инструкция организатора",
      "Шаблон Telegram-поста",
      "Шаблон Instagram-поста"
    ],
    "reviews": [
      {
        "id": "review-1",
        "author": "Петр Петров",
        "rating": 5,
        "text": "Отличная игра! Провел уже 3 раза.",
        "createdAt": "2025-01-01T12:00:00Z"
      }
    ]
  }
}
```

---

### 11.3. Купить лицензию

```
POST /marketplace/:id/purchase
```

**Authorization:** Bearer <token>

**Request:**

```json
{
  "licenseType": "commercial",
  "city": "Москва"
}
```

**Response (201):**

```json
{
  "success": true,
  "data": {
    "purchaseId": "purchase-456",
    "scenarioId": "scenario-123",
    "licenseType": "commercial",
    "price": 99,
    "status": "active",
    "expiresAt": "2026-01-01T12:00:00Z",
    "downloadUrl": "https://..."
  }
}
```

---

### 11.4. Получить мои покупки

```
GET /marketplace/purchases
```

**Authorization:** Bearer <token>

**Response (200):**

```json
{
  "success": true,
  "data": [
    {
      "id": "purchase-456",
      "scenarioId": "scenario-123",
      "title": "Ночной дозор",
      "licenseType": "commercial",
      "price": 99,
      "status": "active",
      "purchasedAt": "2025-01-01T12:00:00Z"
    }
  ]
}
```

---

### 11.5. Получить мои продажи (для авторов)

```
GET /marketplace/sales
```

**Authorization:** Bearer <token>

**Response (200):**

```json
{
  "success": true,
  "data": [
    {
      "id": "sale-789",
      "scenarioId": "scenario-123",
      "title": "Ночной дозор",
      "buyerId": "user-456",
      "buyerName": "Петр Петров",
      "licenseType": "commercial",
      "price": 99,
      "royalty": 89.1,
      "status": "completed",
      "soldAt": "2025-01-01T12:00:00Z"
    }
  ],
  "meta": {
    "totalRevenue": 445.5,
    "totalSales": 5
  }
}
```

---

### 11.6. Оставить отзыв на сценарий

```
POST /marketplace/:id/review
```

**Authorization:** Bearer <token>

**Request:**

```json
{
  "rating": 5,
  "text": "Отличный сценарий! Провел уже 3 раза."
}
```

**Response (201):**

```json
{
  "success": true,
  "data": {
    "id": "review-1",
    "rating": 5,
    "text": "Отличный сценарий! Провел уже 3 раза.",
    "createdAt": "2025-01-01T12:00:00Z"
  }
}
```

---

## 12. Admin (Администрирование)

### 12.1. Получить статистику платформы

```
GET /admin/stats
```

**Authorization:** Bearer <token> (только admin)

**Response (200):**

```json
{
  "success": true,
  "data": {
    "totalUsers": 1250,
    "totalOrganizers": 45,
    "totalAuthors": 23,
    "totalGames": 120,
    "totalScenarios": 87,
    "totalSessions": 340,
    "revenue": {
      "total": 23450,
      "month": 3450,
      "growth": 12.5
    },
    "activeGames": 8,
    "activePlayers": 230
  }
}
```

---

### 12.2. Получить список игр на модерации

```
GET /admin/games/pending
```

**Authorization:** Bearer <token> (только admin/moderator)

**Query Parameters:**

| Параметр | Тип | Описание |
| :--- | :--- | :--- |
| `limit` | number | 1-100, по умолчанию 20 |
| `offset` | number | Смещение для пагинации |

**Response (200):**

```json
{
  "success": true,
  "data": [
    {
      "id": "game-456",
      "title": "Тайны старого города",
      "organizer": {
        "id": "user-123",
        "name": "Иван Иванов"
      },
      "city": "Минск",
      "date": "2025-01-15T19:00:00Z",
      "submittedAt": "2025-01-01T14:00:00Z"
    }
  ],
  "meta": {
    "total": 3,
    "limit": 20,
    "offset": 0
  }
}
```

---

### 12.3. Одобрить игру

```
POST /admin/games/:id/approve
```

**Authorization:** Bearer <token> (только admin/moderator)

**Request:**

```json
{
  "comment": "Игра одобрена"
}
```

**Response (200):**

```json
{
  "success": true,
  "data": {
    "id": "game-456",
    "status": "approved",
    "moderatedAt": "2025-01-01T15:00:00Z",
    "moderatorComment": "Игра одобрена"
  }
}
```

---

### 12.4. Отклонить игру

```
POST /admin/games/:id/reject
```

**Authorization:** Bearer <token> (только admin/moderator)

**Request:**

```json
{
  "reason": "Неверно указан город"
}
```

**Response (200):**

```json
{
  "success": true,
  "data": {
    "id": "game-456",
    "status": "rejected",
    "moderatedAt": "2025-01-01T15:00:00Z",
    "rejectionReason": "Неверно указан город"
  }
}
```

---

### 12.5. Получить список заявок организаторов

```
GET /admin/organizer-applications
```

**Authorization:** Bearer <token> (только admin/moderator)

**Query Parameters:**

| Параметр | Тип | Описание |
| :--- | :--- | :--- |
| `status` | string | `pending`, `approved`, `rejected` |
| `limit` | number | 1-100, по умолчанию 20 |
| `offset` | number | Смещение для пагинации |

**Response (200):**

```json
{
  "success": true,
  "data": [
    {
      "id": "app-123",
      "user": {
        "id": "user-123",
        "email": "ivan@example.com",
        "name": "Иван Иванов"
      },
      "city": "Минск",
      "phone": "+375291234567",
      "telegram": "@ivan_ivanov",
      "experience": "Провел 5 игр в прошлом",
      "status": "pending",
      "createdAt": "2025-01-01T12:00:00Z"
    }
  ],
  "meta": {
    "total": 3,
    "limit": 20,
    "offset": 0
  }
}
```

---

### 12.6. Одобрить заявку организатора

```
POST /admin/organizer-applications/:id/approve
```

**Authorization:** Bearer <token> (только admin/moderator)

**Response (200):**

```json
{
  "success": true,
  "data": {
    "id": "app-123",
    "status": "approved",
    "user": {
      "id": "user-123",
      "role": "organizer"
    },
    "approvedAt": "2025-01-01T13:00:00Z"
  }
}
```

---

### 12.7. Отклонить заявку организатора

```
POST /admin/organizer-applications/:id/reject
```

**Authorization:** Bearer <token> (только admin/moderator)

**Request:**

```json
{
  "reason": "Не указан город"
}
```

**Response (200):**

```json
{
  "success": true,
  "data": {
    "id": "app-123",
    "status": "rejected",
    "rejectionReason": "Не указан город",
    "rejectedAt": "2025-01-01T13:00:00Z"
  }
}
```

---

### 12.8. Получить список пользователей

```
GET /admin/users
```

**Authorization:** Bearer <token> (только admin)

**Query Parameters:**

| Параметр | Тип | Описание |
| :--- | :--- | :--- |
| `role` | string | `organizer`, `author`, `player`, `admin` |
| `status` | string | `active`, `blocked` |
| `limit` | number | 1-100, по умолчанию 20 |
| `offset` | number | Смещение для пагинации |

**Response (200):**

```json
{
  "success": true,
  "data": [
    {
      "id": "user-123",
      "email": "organizer@example.com",
      "name": "Иван Иванов",
      "role": "organizer",
      "status": "active",
      "createdAt": "2025-01-01T12:00:00Z"
    }
  ],
  "meta": {
    "total": 1250,
    "limit": 20,
    "offset": 0
  }
}
```

---

### 12.9. Заблокировать пользователя

```
POST /admin/users/:id/block
```

**Authorization:** Bearer <token> (только admin)

**Request:**

```json
{
  "reason": "Нарушение правил сообщества"
}
```

**Response (200):**

```json
{
  "success": true,
  "data": {
    "id": "user-123",
    "status": "blocked",
    "blockedAt": "2025-01-01T12:00:00Z",
    "reason": "Нарушение правил сообщества"
  }
}
```

---

## 13. Analytics (Аналитика)

### 13.1. Получить статистику игры

```
GET /analytics/game/:gameId
```

**Authorization:** Bearer <token> (только организатор игры)

**Response (200):**

```json
{
  "success": true,
  "data": {
    "gameId": "game-456",
    "title": "Тайны старого города",
    "totalSessions": 12,
    "totalPlayers": 45,
    "averageScore": 28.5,
    "averageTime": 145,
    "completionRate": 0.75,
    "popularNodes": [
      { "nodeId": "node-2", "completions": 12 },
      { "nodeId": "node-1", "completions": 12 },
      { "nodeId": "node-3", "completions": 9 }
    ],
    "dropoffNodes": [
      { "nodeId": "node-3", "dropoffs": 3 }
    ],
    "heatmap": [
      { "lat": 55.7558, "lng": 37.6173, "count": 12 },
      { "lat": 55.7568, "lng": 37.6183, "count": 8 }
    ]
  }
}
```

---

### 13.2. Получить общую статистику организатора

```
GET /analytics/organizer
```

**Authorization:** Bearer <token>

**Response (200):**

```json
{
  "success": true,
  "data": {
    "organizerId": "user-123",
    "totalGames": 5,
    "totalSessions": 34,
    "totalPlayers": 156,
    "averageRating": 4.8,
    "totalRevenue": 5670,
    "gamesByStatus": {
      "draft": 2,
      "pending": 1,
      "approved": 1,
      "active": 0,
      "finished": 1
    }
  }
}
```

---

## 14. System (Системные эндпоинты)

### 14.1. Синхронизация времени

```
GET /time
```

**Response (200):**

```json
{
  "success": true,
  "data": {
    "serverTime": 1718970000,
    "timezone": "UTC",
    "iso": "2025-01-01T12:00:00Z"
  }
}
```

---

## 15. WebSocket (Realtime)

### 15.1. Подключение

```
ws://localhost:3000/socket.io/?token=<jwt-token>
```

### 13.2. Комнаты

| Комната | Описание |
| :--- | :--- |
| `game:{gameId}` | Все команды в игре |
| `team:{teamId}` | Только команда |
| `organizer:{organizerId}` | Организатор |

### 13.3. События (от сервера)

| Событие | Описание | Payload |
| :--- | :--- | :--- |
| `game:started` | Игра началась | `{ gameId, title, totalNodes }` |
| `node:enter` | Вход в узел | `{ nodeId, question, type, timer }` |
| `node:exit` | Выход из узла | `{ nodeId, result, score }` |
| `score:updated` | Обновление счета | `{ score, delta, source }` |
| `game:finished` | Игра завершена | `{ finalScore, totalTime }` |
| `state:sync` | Полная синхронизация | `{ sessionId, currentNodeId, score, history }` |
| `error:occurred` | Ошибка | `{ code, message }` |

### 13.4. События (от клиента)

| Событие | Описание | Payload |
| :--- | :--- | :--- |
| `answer:submit` | Отправка ответа | `{ nodeId, answer, answerType }` |
| `hint:request` | Запрос подсказки | `{ nodeId }` |
| `sos:send` | Отправка SOS | `{ message, location }` |

---

## 15. Итоговый контракт

> **API — единственный способ взаимодействия с платформой.**
>
> **Все изменения API версионируются.**
>
> **Frontend использует только API, никогда не обращается к БД напрямую.**

---

**Кодовое имя проекта:** Adventure Engine  
**Главный принцип:** *API — контракт между клиентом и сервером. Нарушение контракта = нарушение архитектуры.*
```
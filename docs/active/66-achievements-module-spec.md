# Achievements Module: Достижения

> **Дата:** 27.06.2026  
> **Статус:** Актуален  
> **Версия:** 1.0  
> **Цель:** Описать систему достижений для геймификации платформы.

---

## 1. Обзор

Achievements Module — система достижений (ачивок), которая поощряет активность пользователей на платформе:

- Создание игр
- Проведение игр
- Участие в играх
- Создание сценариев
- Социальная активность (друзья, подписки)
- Коммерческая активность (продажи сценариев)

---

## 2. Модель данных (Prisma)

```prisma
model UserAchievement {
  id          String   @id @default(uuid())
  userId      String   @map("user_id") @db.Uuid
  type        String   @db.VarChar(50)
  name        String   @db.VarChar(255)
  description String?  @db.Text
  icon        String   @default("🏆") @db.VarChar(50)
  unlockedAt  DateTime @default(now()) @map("unlocked_at")
  user        User     @Relation(fields: [userId], references: [id])

  @@unique([userId, type])
  @@index([userId])
  @@index([type])
}
```

**Правила:**
- Уникальность по паре (userId, type) — одно достижение один раз
- `icon` — эмодзи или URL иконки
- `unlockedAt` — когда открыто (по умолчанию — сейчас)
- Достижения хранятся в JSON-поле `reputationData.achievements` для быстрого доступа

---

## 3. Типы достижений

### 3.1. Игровые

| Тип | Название | Иконка | Условие |
|-----|----------|--------|---------|
| `FIRST_GAME` | Первая игра | 🎮 | Пройти первую игру |
| `GAME_HOST_1` | Первый хозяин | 🏠 | Создать первую игру |
| `GAME_HOST_10` | Опытный хозяин | 🎯 | Создать 10 игр |
| `GAME_HOST_50` | Мастер хозяин | 👑 | Создать 50 игр |
| `GAME_PLAYER_10` | Игрок | 🕹️ | Пройти 10 игр |
| `GAME_PLAYER_50` | Ветеран | ⭐ | Пройти 50 игр |
| `GAME_PLAYER_100` | Легенда | 🌟 | Пройти 100 игр |
| `PERFECT_GAME` | Идеальная игра | 💯 | Пройти игру со 100% баллов |
| `FAST_FINISH` | Спринтер | ⚡ | Завершить игру быстрее всех |

### 3.2. Социальные

| Тип | Название | Иконка | Условие |
|-----|----------|--------|---------|
| `FIRST_FRIEND` | Первый друг | 🤝 | Добавить первого друга |
| `FRIENDS_10` | Социальный | 👥 | 10 друзей |
| `FRIENDS_50` | Популярный | 🌐 | 50 друзей |
| `FIRST_TEAM` | Командный игрок | 🏴 | Создать первую команду |
| `CAPTAIN_10` | Капитан | 🎖️ | 10 команд |
| `FOLLOWER_10` | Влияние | 💬 | 10 подписчиков |
| `FOLLOWER_50` | Звезда | ✨ | 50 подписчиков |

### 3.3. Коммерческие

| Тип | Название | Иконка | Условие |
|-----|----------|--------|---------|
| `FIRST_SCENARIO` | Автор | ✍️ | Создать первый сценарий |
| `PUBLISHED_SCENARIO` | Опубликован | 📝 | Опубликовать сценарий |
| `FIRST_SALE` | Первая продажа | 💰 | Продать первый сценарий |
| `SCENARIO_5` | Продуктивный автор | 📚 | 5 сценариев |
| `SALE_10` | Топ автор | 🏆 | 10 продаж |
| `EARNING_1000` | Заработок 1K | 💎 | Заработать 1000₽ |
| `EARNING_10000` | Заработок 10K | 💠 | Заработать 10000₽ |

### 3.4. Специальные

| Тип | Название | Иконка | Условие |
|-----|----------|--------|---------|
| `VERIFIED_EMAIL` | Верифицирован | ✅ | Подтвердить email |
| `PROFILE_COMPLETE` | Полный профиль | 📋 | Заполнить профиль на 100% |
| `FIRST_REVIEW` | Критик | 📝 | Оставить первый отзыв |
| `MODERATOR` | Модератор | 🛡️ | Получить роль модератора |
| `PREMIUM_USER` | Премиум | 👑 | Подключить PRO тариф |

---

## 4. API Эндпоинты

```
GET /users/:id/achievements
```

Список достижений пользователя.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "type": "FIRST_GAME",
        "name": "Первая игра",
        "description": "Пройдите свою первую игру",
        "icon": "🎮",
        "unlockedAt": "2025-01-01T12:00:00Z"
      }
    ],
    "total": 5,
    "totalAvailable": 25,
    "progress": 20
  }
}
```

---

```
POST /users/me/check-achievements
```

Проверить и выдать новые достижения.

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "type": "FIRST_FRIEND",
      "name": "Первый друг",
      "icon": "🤝",
      "unlockedAt": "2025-01-10T15:00:00Z"
    }
  ]
}
```

---

```
GET /achievements/catalog
```

Полный каталог всех достижений (без привязки к пользователю).

**Response (200):**
```json
{
  "success": true,
  "data": {
    "categories": [
      {
        "name": "Игровые",
        "achievements": [...]
      },
      {
        "name": "Социальные",
        "achievements": [...]
      }
    ]
  }
}
```

---

## 5. Логика проверки достижений

```typescript
class AchievementService {
  async checkAndUnlock(userId: string, trigger: string) {
    const achievementsToCheck = this.getAchievementsForTrigger(trigger);
    const unlocked = await this.prisma.userAchievement.findMany({
      where: { userId },
    });
    const unlockedTypes = new Set(unlocked.map(a => a.type));

    const newlyUnlocked: UserAchievement[] = [];

    for (const template of achievementsToCheck) {
      if (unlockedTypes.has(template.type)) continue;

      if (this.checkCondition(userId, template)) {
        const achievement = await this.prisma.userAchievement.create({
          data: {
            userId,
            type: template.type,
            name: template.name,
            description: template.description,
            icon: template.icon,
            unlockedAt: new Date(),
          },
        });
        newlyUnlocked.push(achievement);

        // Уведомление
        await this.notificationService.create(
          userId,
          'ACHIEVEMENT_UNLOCKED',
          `Достижение разблокировано: ${template.name}`,
          template.description,
          `/profile/${userId}/achievements`
        );
      }
    }

    return newlyUnlocked;
  }
}
```

---

## 6. Фронтенд

### 6.1. Страницы

| Страница | Путь | Описание |
|----------|------|----------|
| Достижения | `/profile/achievements` | Мои достижения |
| Каталог | `/achievements` | Все достижения платформы |

### 6.2. Компоненты

- `AchievementCard` — карточка достижения (открытое/закрытое)
- `AchievementGrid` — сетка достижений
- `AchievementProgress` — прогресс-бар (X/25)
- `AchievementModal` — модальное окно с деталями

---

## 7. Domain Events

```typescript
enum AchievementDomainEvent {
  AchievementUnlocked = 'achievement.unlocked',
  AchievementCheck    = 'achievement.check',
}
```

---

## 8. Архитектурные правила

1. **Одно достижение — один раз.** Уникальность по (userId, type).
2. **Проверка по триггерам.** При ключевых действиях (создание игры, покупка и т.д.) запускается проверка.
3. **Уведомления.** При разблокировке отправляется уведомление.
4. **Публичные данные.** Достижения видны в публичном профиле.
5. **Шаблоны на бэкенде.** Типы и условия достижений определяются на бэкенде, не на фронтенде.

---

**Дата:** 27.06.2026  
**Статус:** Актуален  
**Версия:** 1.0

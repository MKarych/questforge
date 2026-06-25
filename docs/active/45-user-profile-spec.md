markdown
# 45. User Profile Spec: Архитектурный контракт (v2.0)

> **Дата:** 24.06.2026  
> **Статус:** Утвержден (Архитектурный фундамент)  
> **Версия:** 2.0  
> **Цель:** Описать доменную модель пользователя как ядра платформы. Задать правила для всех сервисов и агентов на 5-10 лет вперед.

---

## 1. Фундаментальный принцип

**User — это Aggregate Root.**

Никакой сервис, никакой агент, никакой модуль не имеет права изменять пользователя напрямую. ВСЕ изменения проходят через **User Service**.

---

## 2. Разделение сущностей (User ≠ Identity ≠ Profile)

| Сущность | Что хранит | Меняется часто | Владелец |
| :--- | :--- | :--- | :--- |
| **Identity** | `uuid`, `username`, `email`, `slug`, `roles` | Почти никогда | Identity Service |
| **Profile** | `avatar`, `bio`, `city`, `socialLinks` | Регулярно | User Service |
| **Settings** | `language`, `timezone`, `theme`, `notifications` | Иногда | User Service |
| **Security** | `passwordHash`, `lastLogin`, `devices`, `failedAttempts` | Постоянно | Auth Service |
| **Reputation** | `rating`, `trustScore`, `reviewsCount` | Вычисляется системой | Reputation Service |
| **AI Profile** | `preferences`, `history`, `embeddings`, `context` | Относится к AI | AI Service |
| **Privacy** | Кто видит город, контакты, статистику, достижения | Редко | User Service |
| **Capabilities** | Что может пользователь (HOST_EVENTS, CREATE_SCENARIOS) | Вычисляется системой | Permissions Service |

---

## 3. Identity (Неизменяемая часть)

```typescript
interface Identity {
  uuid: string;              // UUID v7
  username: string;          // @alex_quest
  slug: string;              // alex-quest
  email: string;             // Уникальный
  roles: Role[];             // PLAYER, AUTHOR, ORGANIZER
  status: AccountStatus;     // ACTIVE, BANNED, DELETED
  verified: Verification;    // email, phone, telegram
  createdAt: Date;
  version: number;           // Для optimistic locking
}
4. Profile (Изменяемая часть)
typescript
interface Profile {
  avatar: string;            // URL на S3/MinIO
  bio: string;              // 500 символов
  city: string;
  socialLinks: SocialLinks;  // TG, VK, Discord, YouTube, GitHub
  favorites: Favorites;      // Избранные игры, сценарии, авторы
  lastSeenAt: Date;
  metadata: Record<string, unknown>; // Произвольные данные
}
5. Settings и Security (Инфраструктурные сущности)
5.1. Settings
typescript
interface Settings {
  language: 'ru' | 'en';
  timezone: string;
  theme: 'dark' | 'light';
  notifications: NotificationSettings; // email, telegram, push
  privacy: PrivacySettings;            // Кто видит город, контакты, игры
}
5.2. Security
typescript
interface Security {
  passwordHash: string;
  lastLoginAt: Date;
  failedLoginAttempts: number;
  activeSessions: Session[];
  trustedDevices: Device[];
  passwordChangedAt: Date;
}
6. Reputation (Вычисляется системой)
typescript
interface Reputation {
  rating: number;            // 4.9
  trustScore: number;        // 0-100%
  reviewsCount: number;
  violations: number;        // Нарушения
  completedGames: number;
  achievements: Achievement[];
}
7. AI Profile (Метаданные для агентов)
Этот раздел — самый важный для будущего. Агенты будут читать его, чтобы персонализировать работу.

typescript
interface AIProfile {
  preferences: AIPreferences;
  memory: AIMemory;
  history: AIHistory;
  context: AIContext;
  embeddings: number[];
}

interface AIPreferences {
  genres: string[];
  averageTeamSize: number;
  averageGameDuration: number;
  favoriteDifficulty: 'easy' | 'medium' | 'hard';
}

interface AIMemory {
  knownFacts: string[];
  lastConversation: string;
  memoryVersion: number;
}

interface AIHistory {
  recommendedScenarios: string[];
  previousActions: string[];
  feedback: string[];
}

interface AIContext {
  lastAgentAction: string;
  activeGoals: string[];
  personality: string;
}
8. Domain Events
Каждое изменение публикует событие.

typescript
enum UserDomainEvent {
  UserCreated = 'user.created',
  UserUpdated = 'user.updated',
  AvatarChanged = 'user.avatar.changed',
  UserBanned = 'user.banned',
  RoleAssigned = 'user.role.assigned',
  FollowCreated = 'follow.created',
  AchievementUnlocked = 'achievement.unlocked',
  EmailVerified = 'email.verified',
  ProfilePrivacyChanged = 'privacy.changed',
}
Пример использования:

text
AchievementUnlocked
  ↓
AI Agent
  ↓
Поздравляет пользователя
  ↓
Предлагает новый сценарий
9. API DTO (Разделение ответственности)
Всегда разделяем, что видят разные пользователи.

9.1. PublicUser
typescript
interface PublicUser {
  uuid: string;
  username: string;
  slug: string;
  avatar: string;
  bio: string;
  city: string;
  rating: number;
  achievements: Achievement[];
}
9.2. PrivateUser
typescript
interface PrivateUser extends PublicUser {
  email: string;
  settings: Settings;
  security: Security;
  favorites: Favorites;
}
9.3. AdminUser
typescript
interface AdminUser extends PrivateUser {
  roles: Role[];
  capabilities: Capability[];
  auditLog: AuditLog[];
  deletedAt: Date;
  metadata: Record<string, unknown>;
}
10. Capabilities (Автоматически вычисляемые права)
Не путать с Permissions (что дали админы). Capabilities вычисляет система.

typescript
enum Capability {
  HOST_EVENTS = 'HOST_EVENTS',
  CREATE_SCENARIOS = 'CREATE_SCENARIOS',
  SELL_SCENARIOS = 'SELL_SCENARIOS',
  CREATE_TEAM = 'CREATE_TEAM',
  STREAM_GAME = 'STREAM_GAME',
  MODERATE_CONTENT = 'MODERATE_CONTENT',
}
11. Feature Flags и Metadata
typescript
interface FeatureFlags {
  aiBeta: boolean;
  marketplace: boolean;
  premium: boolean;
  experimentalUI: boolean;
}

interface Metadata {
  steamId: string;
  discordGuildId: string;
  betaTester: boolean;
  migrationVersion: number;
  // Произвольные поля, без миграций
}
12. Data Ownership (Кто владеет данными)
Сервис	Владеет
Identity Service	uuid, email, username, slug, roles, status
User Service	profile, settings, privacy, favorites
Auth Service	password, sessions, devices, failedAttempts
Reputation Service	rating, trustScore, reviews, achievements
AI Service	aiProfile, preferences, memory, history
Permissions Service	capabilities, featureFlags
13. API Эндпоинты
Метод	URL	Описание
GET	/users/:id	Публичный профиль
GET	/users/me	Личные данные
PATCH	/users/me	Обновление профиля
POST	/users/me/avatar	Загрузка аватарки
DELETE	/users/me/avatar	Удаление аватарки
GET	/users/:id/reviews	Отзывы
GET	/users/:id/achievements	Достижения
GET	/users/:id/activity	Лента действий
GET	/users/:id/teams	Команды пользователя
GET	/users/:id/scenarios	Сценарии автора
GET	/users/:id/favorites	Избранное
POST	/users/:id/follow	Подписаться
DELETE	/users/:id/follow	Отписаться
14. Жизненный цикл пользователя
text
REGISTERED
  ↓
EMAIL_VERIFIED
  ↓
FIRST_GAME
  ↓
AUTHOR (если создал сценарий)
  ↓
ORGANIZER (если провел игру)
  ↓
PREMIUM (если подписка)
  ↓
INACTIVE (если не активен)
  ↓
DELETED (Soft Delete)
15. Архитектурные правила (Контракт для агентов)
User — Aggregate Root. Все изменения проходят через User Service.

Никакого прямого доступа к БД. Агенты работают только через API и Domain Events.

UUID никогда не изменяется.

Username уникален и не меняется без подтверждения.

Все удаления — Soft Delete (deletedAt).

Каждое изменение публикует Domain Event.

DTO разделяются на Public / Private / Admin.

Роли и права не смешиваются. Роли дают люди, права вычисляет система.

Репутация вычисляется системой, а не редактируется вручную.

AI Profile принадлежит AI Service, а не User Service.

Metadata допускает расширение без миграций.

Версионирование обязательно (version + optimistic locking).

Новые поля не удаляют старые. Все изменения проходят через миграции с обратной совместимостью.

События — единственный способ связи между модулями. Один сервис не вызывает методы другого напрямую.

Все изменения логируются (Audit Log).

16. Чек-лист для реализации (для Габена)
Разделить модели на Identity, Profile, Settings, Security, Reputation, AI Profile

Реализовать User Service как Aggregate Root

Настроить Domain Events для каждого важного действия

Внедрить Soft Delete

Реализовать оптимистичную блокировку (version)

Разделить API на Public / Private / Admin DTO

Создать эндпоинты для подписок, избранного и Activity Feed

Реализовать Trust Score (автоматическое вычисление)

Добавить AI Profile (хотя бы структуру данных)

Настроить Audit Log для всех изменений

Перенести настройки приватности и уведомлений в отдельные сущности

Дата: 24.06.2026
Статус: Утвержден
Класс: Архитектурный контракт (10/10)
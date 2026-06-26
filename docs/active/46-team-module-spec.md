markdown
# 46. Team Module Spec: Архитектурный контракт (v2.0)

> **Дата:** 24.06.2026  
> **Статус:** Утвержден (Архитектурный фундамент)  
> **Версия:** 2.0  
> **Цель:** Описать доменную модель команды как ядра социального слоя платформы. Спроектировать систему, которая выдержит 100 000+ команд и десятки сервисов.

---

## 1. Фундаментальный принцип

**Team — это Aggregate Root.**

Команда существует независимо от игр. Это социальная единица, которая может участвовать в играх, иметь свой рейтинг, репутацию и AI-профиль.

Все изменения проходят через **Team Service**. Никакой прямой записи в БД.

---

## 2. Разделение сущностей (Team Identity ≠ Team Profile)

| Сущность | Что хранит | Меняется часто | Владелец |
| :--- | :--- | :--- | :--- |
| **Team Identity** | `uuid`, `slug`, `createdAt` | Почти никогда | Team Service |
| **Team Profile** | `name`, `avatar`, `banner`, `description`, `city`, `country`, `website`, `socials` | Регулярно | Team Service |
| **Team Members** | Список участников с ролями | Постоянно | Team Service |
| **Team Settings** | `privacy`, `joinPolicy`, `limits` | Иногда | Team Service |
| **Team Reputation** | `elo`, `trustScore`, `reports`, `reviews`, `completedGames`, `abandonedGames` | Вычисляется системой | Reputation Service |
| **Team AI Profile** | `favoriteGenres`, `preferredDifficulty`, `preferredDuration`, `recommendedScenarios` | Относится к AI | AI Service |
| **Team Tags** | `detective`, `horror`, `family`, `corporate` | Редко | Team Service |

---

## 3. Team как Aggregate Root

```typescript
interface Team {
  uuid: string;                    // UUID v7
  slug: string;                    // "nochnye-volki"
  status: TeamStatus;              // ACTIVE, RECRUITING, INACTIVE, ARCHIVED, DELETED
  version: number;                 // Для optimistic locking
  deletedAt: Date;                 // Soft Delete
  
  // Связанные сущности (не хранятся здесь, только ссылки)
  profile: TeamProfile;
  settings: TeamSettings;
  stats: TeamStats;
  reputation: TeamReputation;
  ai: TeamAIProfile;
  tags: string[];
  capabilities: TeamCapability[];
}
4. Team Identity (Неизменяемая часть)
typescript
interface TeamIdentity {
  uuid: string;
  slug: string;
  createdAt: Date;
}
5. Team Profile (Изменяемая часть)
typescript
interface TeamProfile {
  name: string;                    // Название команды
  avatar: string;                  // URL на S3/MinIO
  banner: string;                  // Баннер (для страницы команды)
  description: string;             // Описание
  city: string;
  country: string;
  website: string;
  socials: SocialLinks;            // Discord, VK, Telegram, YouTube
}
6. Team Settings и Limits
typescript
interface TeamSettings {
  privacy: TeamVisibility;         // PUBLIC, UNLISTED, PRIVATE, ARCHIVED
  joinPolicy: JoinPolicy;          // OPEN, APPROVAL, INVITE_ONLY
  limits: TeamLimits;
}

enum TeamVisibility {
  PUBLIC = 'PUBLIC',
  UNLISTED = 'UNLISTED',
  PRIVATE = 'PRIVATE',
  ARCHIVED = 'ARCHIVED'
}

enum JoinPolicy {
  OPEN = 'OPEN',
  APPROVAL = 'APPROVAL',
  INVITE_ONLY = 'INVITE_ONLY'
}

interface TeamLimits {
  maxMembers: number;              // По умолчанию 20
  maxInvitesPerDay: number;        // 10
  maxPendingRequests: number;      // 5
  maxChatMessagesPerMinute: number; // 30
}
7. Team Reputation (Вычисляется системой)
typescript
interface TeamReputation {
  elo: number;                     // Рейтинг Elo (для соревнований)
  trustScore: number;              // 0-100%
  reports: number;                 // Жалобы на команду
  completedGames: number;          // Завершённые игры
  abandonedGames: number;          // Брошенные игры
  reviews: Review[];
  totalReviews: number;
  averageRating: number;
}
8. Team AI Profile (Метаданные для агентов)
typescript
interface TeamAIProfile {
  favoriteGenres: string[];        // ['detective', 'horror']
  preferredDifficulty: 'easy' | 'medium' | 'hard';
  preferredDuration: number;       // В минутах
  preferredLocations: string[];    // ['city', 'nature']
  averageTeamSkill: number;        // 1-10
  recommendedScenarios: string[];  // ID сценариев, которые AI рекомендует
}
9. Team Capabilities
Автоматически вычисляемые возможности команды (не путать с правами).

typescript
enum TeamRole {
  CAPTAIN = 'CAPTAIN',
  VICE_CAPTAIN = 'VICE_CAPTAIN',
  MEMBER = 'MEMBER',
  RECRUIT = 'RECRUIT'
}

enum TeamCapability {
  PARTICIPATE_GAMES = 'PARTICIPATE_GAMES',
  HOST_GAMES = 'HOST_GAMES',
  PUBLISH_SCENARIOS = 'PUBLISH_SCENARIOS',
  MARKETPLACE = 'MARKETPLACE',
  VERIFIED_TEAM = 'VERIFIED_TEAM',
  PREMIUM = 'PREMIUM',
  TOURNAMENT = 'TOURNAMENT',
}
10. TeamMember (Участник команды)
typescript
interface TeamMember {
  uuid: string;
  teamId: string;
  userId: string;
  role: TeamRole;                  // CAPTAIN, VICE_CAPTAIN, MEMBER, RECRUIT
  status: MemberStatus;            // ACTIVE, PENDING, LEFT, KICKED
  joinedAt: Date;
  leftAt: Date;
  lastActiveAt: Date;
  permissions: Permission[];       // Права внутри команды
}
11. JoinRequest (Заявка на вступление)
Отдельная сущность, потому что приглашения и заявки — это разные процессы.

typescript
interface JoinRequest {
  uuid: string;
  teamId: string;
  userId: string;
  message: string;                 // Сообщение от пользователя
  status: JoinRequestStatus;       // PENDING, APPROVED, REJECTED, CANCELLED
  createdAt: Date;
  resolvedAt: Date;
  resolvedBy: string;              // ID капитана / вице-капитана
}
12. TeamInvite (Приглашение)
typescript
interface TeamInvite {
  uuid: string;
  teamId: string;
  invitedUserId: string;
  invitedBy: string;
  token: string;
  expiresAt: Date;                 // По умолчанию 7 дней
  status: InviteStatus;            // PENDING, ACCEPTED, DECLINED, EXPIRED
  createdAt: Date;
}
13. Transfer Ownership (Передача капитанства)
Отдельный доменный объект для передачи прав.

typescript
interface OwnershipTransfer {
  uuid: string;
  teamId: string;
  fromUserId: string;              // Текущий капитан
  toUserId: string;                // Новый капитан
  status: TransferStatus;          // PENDING, APPROVED, REJECTED, CANCELLED
  expiresAt: Date;
  createdAt: Date;
  resolvedAt: Date;
}
14. Team Lifecycle
text
CREATED
  ↓
RECRUITING (набор игроков)
  ↓
ACTIVE (активное участие)
  ↓
INACTIVE (бездействие > 30 дней)
  ↓
ARCHIVED (закрыта, но данные сохранены)
  ↓
DELETED (Soft Delete)
15. Domain Events
typescript
enum TeamDomainEvent {
  TeamCreated = 'team.created',
  TeamUpdated = 'team.updated',
  TeamArchived = 'team.archived',
  TeamRestored = 'team.restored',
  TeamDeleted = 'team.deleted',
  
  MemberJoined = 'team.member.joined',
  MemberLeft = 'team.member.left',
  MemberKicked = 'team.member.kicked',
  MemberPromoted = 'team.member.promoted',
  MemberDemoted = 'team.member.demoted',
  
  CaptainChanged = 'team.captain.changed',
  OwnershipTransferred = 'team.ownership.transferred',
  
  InviteSent = 'team.invite.sent',
  InviteAccepted = 'team.invite.accepted',
  InviteDeclined = 'team.invite.declined',
  InviteRevoked = 'team.invite.revoked',
  
  JoinRequestCreated = 'team.join.request.created',
  JoinRequestApproved = 'team.join.request.approved',
  JoinRequestRejected = 'team.join.request.rejected',
  
  SettingsChanged = 'team.settings.changed',
  VisibilityChanged = 'team.visibility.changed',
  
  StatsUpdated = 'team.stats.updated',
}
16. Domain Rules (Инварианты)
ОБЯЗАТЕЛЬНЫЕ правила, которые проверяются при каждом изменении.

text
1. Команда не может существовать без капитана.
2. Капитан всегда является участником команды.
3. Нельзя удалить последнего капитана.
4. После удаления капитана требуется Transfer Ownership.
5. Один пользователь не может иметь две роли одновременно.
6. Нельзя пригласить уже состоящего участника.
7. Нельзя вступить дважды.
8. Максимум один Pending Invite на пользователя.
9. Максимум одна Pending Join Request на пользователя.
10. Команда не может быть удалена, если в ней есть активные участники (кроме капитана).
11. Команда не может участвовать в игре, если статус — ARCHIVED или DELETED.
12. Рейтинг команды обновляется только после завершения игры.
13. Trust Score пересчитывается после каждой игры или отзыва.
14. При удалении капитана автоматически запускается Transfer Ownership.
15. Если Transfer Ownership не подтверждён в течение 7 дней, процесс отменяется.
17. Data Ownership
Сервис	Владеет
Team Service	Identity, Profile, Members, Settings, Invites, Join Requests, Ownership Transfers
Reputation Service	Репутацией, рейтингом, отзывами
AI Service	AI-профилем команды
Stats Service	Игровой статистикой
Chat Service	Чатом команды
Notification Service	Уведомлениями
18. API DTO
18.1. PublicTeam
typescript
interface PublicTeam {
  uuid: string;
  slug: string;
  name: string;
  avatar: string;
  banner: string;
  description: string;
  city: string;
  membersCount: number;
  rating: number;
  trustScore: number;
  tags: string[];
}
18.2. PrivateTeam (для участников)
typescript
interface PrivateTeam extends PublicTeam {
  settings: TeamSettings;
  chat: TeamChat;
  invites: TeamInvite[];
  joinRequests: JoinRequest[];
}
18.3. AdminTeam (для админов)
typescript
interface AdminTeam extends PrivateTeam {
  auditLog: AuditLog[];
  deletedAt: Date;
  metadata: Record<string, unknown>;
}
19. API Эндпоинты
Метод	URL	Описание
POST	/teams	Создать команду
GET	/teams	Список команд (с фильтрами)
GET	/teams/:id	Публичные данные команды
GET	/teams/:id/private	Приватные данные (для участников)
PATCH	/teams/:id	Обновить команду
DELETE	/teams/:id	Удалить команду (Soft Delete)
GET	/teams/:id/members	Список участников
PATCH	/teams/:id/members/:userId	Обновить роль
DELETE	/teams/:id/members/:userId	Исключить участника
POST	/teams/:id/join	Подать заявку
POST	/teams/:id/join/:requestId/approve	Одобрить заявку
POST	/teams/:id/join/:requestId/reject	Отклонить заявку
POST	/teams/:id/leave	Покинуть команду
POST	/teams/:id/invite	Пригласить игрока
POST	/teams/:id/invite/:inviteId/accept	Принять приглашение
POST	/teams/:id/invite/:inviteId/decline	Отклонить приглашение
POST	/teams/:id/transfer	Передать капитанство
POST	/teams/:id/transfer/accept	Принять передачу
GET	/teams/:id/history	История команды
GET	/teams/:id/reputation	Репутация и рейтинг
GET	/teams/:id/reviews	Отзывы
GET	/teams/:id/activity	Activity Feed
GET	/teams/:id/chat	Чат
POST	/teams/:id/chat	Отправить сообщение
20. Архитектурные правила (Контракт для агентов)
Team — Aggregate Root. Все изменения проходят через Team Service.

Domain Rules (инварианты) всегда проверяются перед сохранением.

Никакого прямого доступа к БД.

Каждое изменение публикует Domain Event.

Все удаления — Soft Delete.

Только капитан может: приглашать, исключать, назначать роли, менять настройки, передавать капитанство.

Рейтинг и репутация вычисляются системой.

Все изменения логируются.

Capabilities вычисляются системой, а не редактируются вручную.

Команда может существовать без игр — это социальная единица.

21. Чек-лист для Габена
Разделить Team на Identity, Profile, Settings, Reputation, AI Profile

Реализовать TeamMember с ролями

Реализовать JoinRequest как отдельную сущность

Реализовать TeamInvite с токенами и TTL

Реализовать OwnershipTransfer

Реализовать Team Lifecycle (CREATED → RECRUITING → ACTIVE → ...)

Реализовать Domain Rules (инварианты) на уровне сервиса

Настроить Domain Events

Реализовать Soft Delete

Разделить DTO на Public / Private / Admin

Реализовать эндпоинты для заявок, передач капитанства

Реализовать статистику и репутацию

Добавить AI Profile (структуру)

Добавить Audit Log

Добавить Feature Flags

22. Как проверить
Создать команду → появилась в списке

Подать заявку на вступление → капитан увидел уведомление

Капитан одобрил заявку → пользователь стал участником

Пригласить игрока → игрок получил приглашение

Игрок принял приглашение → появился в составе

Назначить вице-капитана → права изменились

Игрок покинул команду → состав обновился

Передать капитанство → новый капитан получил права

Капитан удалил команду → Soft Delete, данные сохранились

Статистика обновилась после игры

Проверить, что нельзя нарушить Domain Rules (например, удалить последнего капитана)

Дата: 24.06.2026
Статус: Утвержден
Класс: Архитектурный контракт (10/10)
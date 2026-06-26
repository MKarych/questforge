```markdown
# Domain Model: Единая доменная модель системы

> **Кодовое имя проекта:** Adventure Engine
> **Уровень документа:** Архитектурный
> **Статус:** Утвержден

---

## 1. Принципы

- Единый источник истины для всех сущностей
- Все сервисы используют одну модель
- Изменения модели — через этот документ

---

## 2. Агрегаты

### 2.1. Game (Игра)

```typescript
class Game {
  id: string;
  title: string;
  description: string;
  city: string;
  date: Date;
  duration: number; // в минутах
  price: number;
  maxTeams: number;
  status: GameStatus;
  organizerId: string;
  organizer: User;
  scenarioId: string;
  scenario: Scenario;
  teams: Team[];
  settings: GameSettings;
  shareLink: string;
  createdAt: Date;
  updatedAt: Date;
  publishedAt: Date;
  startedAt: Date;
  finishedAt: Date;
  moderationStatus: ModerationStatus;
  moderationComment: string;
}

enum GameStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  REGISTRATION_OPEN = 'REGISTRATION_OPEN',
  REGISTRATION_CLOSED = 'REGISTRATION_CLOSED',
  LOBBY = 'LOBBY',
  RUNNING = 'RUNNING',
  FINISHED = 'FINISHED',
  ARCHIVED = 'ARCHIVED',
  CANCELLED = 'CANCELLED',
  RESCHEDULED = 'RESCHEDULED',
  HIDDEN = 'HIDDEN',
  BLOCKED = 'BLOCKED'
}

enum ModerationStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED'
}
```

---

### 2.2. Scenario (Сценарий)

```typescript
class Scenario {
  id: string;
  name: string;
  description: string;
  authorId: string;
  author: User;
  version: number;
  nodes: Node[];
  edges: Edge[];
  startNodeId: string;
  metadata: ScenarioMetadata;
  isPublished: boolean;
  price: number;
  licenseType: LicenseType;
  validationStatus: ValidationStatus;
  validationErrors: ValidationError[];
  publishedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

class ScenarioMetadata {
  title: string;
  description: string;
  city: string;
  duration: number;
  difficulty: number; // 1-5
  tags: string[];
  category: ScenarioCategory;
}

enum ScenarioCategory {
  QUEST = 'QUEST',
  AUTO_QUEST = 'AUTO_QUEST',
  QUIZ = 'QUIZ',
  RPG = 'RPG',
  ESCAPE = 'ESCAPE',
  CORPORATE = 'CORPORATE'
}

enum LicenseType {
  SINGLE = 'SINGLE',
  MULTI_CITY = 'MULTI_CITY',
  COMMERCIAL = 'COMMERCIAL',
  WHITE_LABEL = 'WHITE_LABEL'
}
```

---

### 2.3. Node (Узел/Задание)

```typescript
class Node {
  id: string;
  type: NodeType;
  title: string;
  description: string;
  config: NodeConfig;
  position: { x: number; y: number };
  rewards: Reward[];
  penalties: Penalty[];
  hints: Hint[];
  mechanics: Mechanic[];
  next: NodeTransitions;
  timeout: TimeoutConfig;
  createdAt: Date;
  updatedAt: Date;
}

type NodeType = 
  | 'START'
  | 'FINISH'
  | 'TEXT_MISSION'
  | 'CODE_MISSION'
  | 'PHOTO_MISSION'
  | 'GPS_MISSION'
  | 'QR_MISSION'
  | 'CHOICE_MISSION'
  | 'TIMER_MISSION'
  | 'BRANCH_NODE'
  | 'NPC_DIALOG'
  | 'COLLECT_ITEM'
  | 'BATTLE_PVE'
  | 'SEA_BATTLE'
  | 'MAP_CELL';
```

---

### 2.4. Edge (Связь между узлами)

```typescript
class Edge {
  id: string;
  from: string; // NodeId
  to: string; // NodeId
  condition: EdgeCondition;
  label: string; // для визуального отображения
}

class EdgeCondition {
  type: 'ALWAYS' | 'SUCCESS' | 'FAIL' | 'TIMEOUT' | 'CUSTOM';
  custom?: ConditionRule;
}

class ConditionRule {
  operator: 'AND' | 'OR' | 'NOT';
  rules: ConditionRule[];
  type: 'SCORE' | 'INVENTORY' | 'TIME' | 'RESOURCE';
  field: string;
  value: any;
  comparator: 'eq' | 'gt' | 'lt' | 'gte' | 'lte' | 'has' | 'not_has';
}
```

---

### 2.5. Team (Команда)

```typescript
class Team {
  id: string;
  name: string;
  gameId: string;
  game: Game;
  captainId: string;
  captain: User;
  members: TeamMember[];
  inventory: Inventory;
  resources: Resources;
  currentNodeId: string;
  currentNode: Node;
  status: TeamStatus;
  score: number;
  penalties: number;
  startedAt: Date;
  finishedAt: Date;
  lastActivityAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

enum TeamStatus {
  ACTIVE = 'ACTIVE',
  RECRUITING = 'RECRUITING',
  INACTIVE = 'INACTIVE',
  ARCHIVED = 'ARCHIVED',
  DELETED = 'DELETED'
}
```

---

### 2.6. TeamMember (Участник команды)

```typescript
class TeamMember {
  id: string;
  teamId: string;
  team: Team;
  userId: string;
  user: User;
  role: TeamMemberRole;
  status: TeamMemberStatus;
  joinedAt: Date;
  leftAt: Date;
}

enum TeamMemberRole {
  CAPTAIN = 'CAPTAIN',
  VICE_CAPTAIN = 'VICE_CAPTAIN',
  MEMBER = 'MEMBER',
  RECRUIT = 'RECRUIT'
}

enum TeamMemberStatus {
  ACTIVE = 'ACTIVE',
  PENDING = 'PENDING',
  LEFT = 'LEFT',
  KICKED = 'KICKED'
}
```

---

### 2.7. User (Пользователь)

```typescript
class User {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  avatar: string;
  role: UserRole;
  status: UserStatus;
  contacts: UserContacts;
  organizerStatus: OrganizerStatus;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt: Date;
}

class UserContacts {
  vkId?: string;
  telegram?: string;
  email: string;
  phone?: string;
}

enum UserRole {
  PLAYER = 'PLAYER',
  ORGANIZER = 'ORGANIZER',
  MODERATOR = 'MODERATOR',
  ADMIN = 'ADMIN'
}

enum UserStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  BANNED = 'BANNED'
}

enum OrganizerStatus {
  NOT_APPLIED = 'NOT_APPLIED',
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED'
}
```

---

### 2.8. Inventory (Инвентарь)

```typescript
class Inventory {
  id: string;
  teamId: string;
  team: Team;
  items: InventoryItem[];
  capacity: number;
  createdAt: Date;
  updatedAt: Date;
}

class InventoryItem {
  id: string;
  itemId: string;
  item: ItemDefinition;
  quantity: number;
  acquiredAt: Date;
  usedAt: Date;
}

class ItemDefinition {
  id: string;
  name: string;
  description: string;
  type: ItemType;
  icon: string;
  effects: ItemEffect[];
  rarity: 'COMMON' | 'UNCOMMON' | 'RARE' | 'EPIC' | 'LEGENDARY';
}

enum ItemType {
  KEY = 'KEY',
  CONSUMABLE = 'CONSUMABLE',
  CURRENCY = 'CURRENCY',
  QUEST = 'QUEST',
  WEAPON = 'WEAPON',
  ARMOR = 'ARMOR'
}
```

---

### 2.9. Resources (Ресурсы)

```typescript
class Resources {
  id: string;
  teamId: string;
  team: Team;
  score: number;
  reputation: number;
  money: number;
  energy: number;
  lives: number;
  custom: Record<string, number>;
  createdAt: Date;
  updatedAt: Date;
}
```

---

### 2.10. Event (Событие) — вне Domain Model

```typescript
// Event находится в Event Store, а не в Domain Model
// Domain Model не знает о событиях

interface DomainEvent {
  id: string;
  type: EventType;
  gameId: string;
  teamId?: string;
  nodeId?: string;
  payload: Record<string, unknown>;
  timestamp: number;
  sequence: number;
  version: number;
}
```

---

## 3. Связи между агрегатами

```
Game 1 ── * Team
Game 1 ── 1 Scenario
Scenario 1 ── * Node
Node 1 ── * Edge
Team 1 ── * TeamMember
Team 1 ── 1 Inventory
Team 1 ── 1 Resources
User 1 ── * Game (organizer)
User 1 ── * Scenario (author)
TeamMember 1 ── 1 User
```

---

## 4. Итоговый принцип

> **Все сущности описаны в одном месте.**
>
> **Изменения модели — только через этот документ.**
>
> **Все сервисы используют одну модель.**

---

**Кодовое имя проекта:** Adventure Engine  
**Главный принцип:** *Единая модель — основа всей системы.*
```
```markdown
# Database Schema: Модели данных для PostgreSQL

> **Кодовое имя проекта:** Adventure Engine
> **Уровень документа:** Инженерный контракт
> **Статус:** Утвержден. Изменения только с мажорной версией.

---

## 1. Принципы проектирования

### 1.1. Именование
- **Таблицы:** `snake_case`, во множественном числе (`users`, `games`, `sessions`)
- **Поля:** `snake_case`, единственное число (`user_id`, `created_at`)
- **Индексы:** `idx_{table}_{column}` (`idx_users_email`)

### 1.2. Первичные ключи
- Используем `UUID` (версия 4) для всех таблиц.
- Без автоинкремента — для масштабирования и шардирования.

### 1.3. Связи
- Внешние ключи с `ON DELETE RESTRICT` (защита от случайного удаления).
- Каскадное удаление только для событий (`session_events`).

### 1.4. Мягкое удаление
- Используем `deleted_at TIMESTAMP` вместо физического удаления.
- Это позволяет восстанавливать данные и сохранять историю.

### 1.5. Event Sourcing
- Все изменения состояния игр хранятся в `session_events`.
- Это основа для Time Travel, аудита и аналитики.

---

## 2. Модели пользователей

### 2.1. `users` — Пользователи платформы

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(100) NOT NULL,
  avatar_url TEXT,
  city VARCHAR(100),
  bio TEXT,
  telegram VARCHAR(100),
  vk VARCHAR(255),
  whatsapp VARCHAR(100),
  rating FLOAT,
  reputation INT NOT NULL DEFAULT 0,
  achievements JSONB NOT NULL DEFAULT '[]', -- массив достижений
  last_seen_at TIMESTAMP,
  role VARCHAR(50) NOT NULL DEFAULT 'PLAYER', -- PLAYER, ORGANIZER, AUTHOR, ADMIN, MODERATOR
  status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE', -- ACTIVE, INACTIVE, BANNED
  contacts JSONB NOT NULL DEFAULT '{}',
  organizer_status VARCHAR(50) NOT NULL DEFAULT 'NOT_APPLIED', -- NOT_APPLIED, PENDING, APPROVED, REJECTED
  organizer_application_id UUID REFERENCES organizer_applications(id) ON DELETE SET NULL,
  organizer_approved_at TIMESTAMP,
  games_created INT NOT NULL DEFAULT 0,
  games_conducted INT NOT NULL DEFAULT 0,
  scenarios_created INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  last_login_at TIMESTAMP,
  deleted_at TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_users_organizer_status ON users(organizer_status);
CREATE INDEX idx_users_city ON users(city);
CREATE INDEX idx_users_rating ON users(rating);
```

### 2.2. `organizer_applications` — Заявки на статус организатора

```sql
CREATE TABLE organizer_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE RESTRICT,
  city VARCHAR(100) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  telegram VARCHAR(100),
  experience TEXT,
  status VARCHAR(50) NOT NULL DEFAULT 'PENDING', -- PENDING, APPROVED, REJECTED
  rejection_reason TEXT,
  reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_organizer_applications_user_id ON organizer_applications(user_id);
CREATE INDEX idx_organizer_applications_status ON organizer_applications(status);
CREATE INDEX idx_organizer_applications_created_at ON organizer_applications(created_at);
```

### 2.3. `teams` — Команды игроков

```sql
CREATE TABLE teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  captain_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  current_node_id VARCHAR(50),
  score INT NOT NULL DEFAULT 0,
  penalties INT NOT NULL DEFAULT 0,
  status VARCHAR(50) NOT NULL DEFAULT 'REGISTERED', -- REGISTERED, ACTIVE, WAITING_ANSWER, NODE_COMPLETED, NODE_FAILED, NEXT_NODE, FINISHED
  started_at TIMESTAMP NOT NULL DEFAULT NOW(),
  finished_at TIMESTAMP,
  last_activity_at TIMESTAMP NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_teams_game_id ON teams(game_id);
CREATE INDEX idx_teams_captain_id ON teams(captain_id);
CREATE INDEX idx_teams_status ON teams(status);
CREATE INDEX idx_teams_current_node_id ON teams(current_node_id);
```

### 2.4. `team_members` — Участники команд

```sql
CREATE TABLE team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  role VARCHAR(50) NOT NULL DEFAULT 'member', -- member, captain
  status VARCHAR(50) NOT NULL DEFAULT 'active', -- active, pending, left, kicked
  joined_at TIMESTAMP NOT NULL DEFAULT NOW(),
  left_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT team_member_unique UNIQUE (team_id, user_id)
);

CREATE INDEX idx_team_members_team_id ON team_members(team_id);
CREATE INDEX idx_team_members_user_id ON team_members(user_id);
```

### 2.5. `inventory` — Инвентарь команды

```sql
CREATE TABLE inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL UNIQUE REFERENCES teams(id) ON DELETE CASCADE,
  items JSONB NOT NULL DEFAULT '[]',
  capacity INT NOT NULL DEFAULT 20,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_inventory_team_id ON inventory(team_id);
```

### 2.6. `resources` — Ресурсы команды

```sql
CREATE TABLE resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL UNIQUE REFERENCES teams(id) ON DELETE CASCADE,
  score INT NOT NULL DEFAULT 0,
  reputation INT NOT NULL DEFAULT 0,
  money INT NOT NULL DEFAULT 0,
  energy INT NOT NULL DEFAULT 100,
  lives INT NOT NULL DEFAULT 3,
  custom JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_resources_team_id ON resources(team_id);
```

---

## 3. Модели игр и сценариев

### 3.1. `games` — Игры

```sql
CREATE TABLE games (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  city VARCHAR(100) NOT NULL,
  date TIMESTAMP NOT NULL,
  duration INT NOT NULL, -- в минутах
  price DECIMAL(10, 2) DEFAULT 0,
  max_teams INT DEFAULT 50,
  share_link VARCHAR(50) NOT NULL UNIQUE,
  status VARCHAR(50) NOT NULL DEFAULT 'draft', -- draft, pending, approved, rejected, active, finished, cancelled
  moderation_comment TEXT,
  organizer_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  scenario_id UUID REFERENCES scenarios(id) ON DELETE SET NULL,
  image_url TEXT,
  published_at TIMESTAMP,
  submitted_at TIMESTAMP,
  moderated_at TIMESTAMP,
  started_at TIMESTAMP,
  finished_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMP
);

CREATE INDEX idx_games_share_link ON games(share_link);
CREATE INDEX idx_games_organizer_id ON games(organizer_id);
CREATE INDEX idx_games_status ON games(status);
CREATE INDEX idx_games_city ON games(city);
CREATE INDEX idx_games_date ON games(date);
CREATE INDEX idx_games_scenario_id ON games(scenario_id);
```

### 3.2. `scenarios` — Сценарии

```sql
CREATE TABLE scenarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  author_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  version INT NOT NULL DEFAULT 1,
  is_published BOOLEAN NOT NULL DEFAULT FALSE,
  price DECIMAL(10, 2),
  license_type VARCHAR(50), -- perpetual, rental, commercial
  nodes JSONB NOT NULL,
  start_node_id VARCHAR(50) NOT NULL,
  validation_status VARCHAR(50) DEFAULT 'pending', -- pending, valid, invalid
  validation_errors JSONB,
  published_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMP
);

CREATE INDEX idx_scenarios_author_id ON scenarios(author_id);
CREATE INDEX idx_scenarios_is_published ON scenarios(is_published);
CREATE INDEX idx_scenarios_price ON scenarios(price);
```

### 3.3. `scenario_versions` — История версий сценариев

```sql
CREATE TABLE scenario_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scenario_id UUID NOT NULL REFERENCES scenarios(id) ON DELETE CASCADE,
  version INT NOT NULL,
  nodes JSONB NOT NULL,
  start_node_id VARCHAR(50) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_scenario_versions_scenario_id ON scenario_versions(scenario_id);
CREATE UNIQUE INDEX idx_scenario_versions_unique ON scenario_versions(scenario_id, version);
```

---

## 4. Модели сессий (Игровой движок)

### 4.1. `teams` — Команды (состояние сессии)

> В текущей реализации состояние сессии хранится непосредственно в `teams` (score, penalties, current_node_id, status).

```sql
CREATE TABLE teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  captain_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  current_node_id VARCHAR(50),
  score INT NOT NULL DEFAULT 0,
  penalties INT NOT NULL DEFAULT 0,
  status VARCHAR(50) NOT NULL DEFAULT 'REGISTERED',
  started_at TIMESTAMP NOT NULL DEFAULT NOW(),
  finished_at TIMESTAMP,
  last_activity_at TIMESTAMP NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_teams_game_id ON teams(game_id);
CREATE INDEX idx_teams_captain_id ON teams(captain_id);
CREATE INDEX idx_teams_status ON teams(status);
CREATE INDEX idx_teams_current_node_id ON teams(current_node_id);
```

### 4.2. `session_states` — Снапшоты состояния сессии

```sql
CREATE TABLE session_states (
  id UUID NOT NULL,
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  state JSONB NOT NULL,
  sequence INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  PRIMARY KEY (id)
);

CREATE INDEX idx_session_states_team_id ON session_states(team_id);
CREATE INDEX idx_session_states_sequence ON session_states(sequence);
```

### 4.3. `session_events` — Event Sourcing (история всех событий)

> В текущей реализации таблицы `session_events` нет как отдельной таблицы — события хранятся в `events` (см. ниже) и в `session_states`.

```sql
-- События хранятся в таблице events (см. раздел 5.3)
```

---

## 5. Модели социального слоя

### 5.1. `reviews` — Отзывы на игры

```sql
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  text TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_reviews_game_id ON reviews(game_id);
CREATE INDEX idx_reviews_user_id ON reviews(user_id);
CREATE INDEX idx_reviews_rating ON reviews(rating);
```

### 5.2. `comments` — Комментарии к играм (обсуждения)

```sql
CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  text TEXT NOT NULL,
  parent_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMP
);

CREATE INDEX idx_comments_game_id ON comments(game_id);
CREATE INDEX idx_comments_user_id ON comments(user_id);
CREATE INDEX idx_comments_parent_id ON comments(parent_id);
```

### 5.3. `events` — Игровые события (Event Sourcing)

```sql
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type VARCHAR(50) NOT NULL,
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE RESTRICT,
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  node_id VARCHAR(50),
  payload JSONB NOT NULL DEFAULT '{}',
  timestamp TIMESTAMP NOT NULL,
  sequence INT NOT NULL DEFAULT 0,
  version INT NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_events_game_id ON events(game_id);
CREATE INDEX idx_events_team_id ON events(team_id);
CREATE INDEX idx_events_type ON events(type);
CREATE INDEX idx_events_sequence ON events(sequence);
CREATE INDEX idx_events_created_at ON events(created_at);
CREATE INDEX idx_events_game_created ON events(game_id, created_at);
CREATE INDEX idx_events_team_created ON events(team_id, created_at);
```

### 6.1. `licenses` — Лицензии на сценарии

```sql
CREATE TABLE licenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scenario_id UUID NOT NULL REFERENCES scenarios(id) ON DELETE RESTRICT,
  buyer_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  license_type VARCHAR(50) NOT NULL, -- single, multi, commercial, white_label
  city VARCHAR(100),
  price DECIMAL(10, 2) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'active', -- active, expired, revoked
  expires_at TIMESTAMP,
  purchased_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_licenses_scenario_id ON licenses(scenario_id);
CREATE INDEX idx_licenses_buyer_id ON licenses(buyer_id);
CREATE INDEX idx_licenses_status ON licenses(status);
```

### 6.2. `purchases` — Покупки сценариев (транзакции)

```sql
CREATE TABLE purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scenario_id UUID NOT NULL REFERENCES scenarios(id) ON DELETE RESTRICT,
  buyer_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  license_id UUID REFERENCES licenses(id) ON DELETE SET NULL,
  amount DECIMAL(10, 2) NOT NULL,
  commission DECIMAL(10, 2) NOT NULL,
  royalty DECIMAL(10, 2) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'pending', -- pending, completed, refunded
  payment_id VARCHAR(255),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMP
);

CREATE INDEX idx_purchases_scenario_id ON purchases(scenario_id);
CREATE INDEX idx_purchases_buyer_id ON purchases(buyer_id);
CREATE INDEX idx_purchases_status ON purchases(status);
```

---

## 7. Модели медиа

### 7.1. `media` — Файлы (фото, видео, аудио)

```sql
CREATE TABLE media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  filename VARCHAR(255) NOT NULL,
  original_name VARCHAR(255) NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  size INT NOT NULL,
  path TEXT NOT NULL,
  url TEXT NOT NULL,
  game_id UUID REFERENCES games(id) ON DELETE SET NULL,
  team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
  uploaded_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_media_game_id ON media(game_id);
CREATE INDEX idx_media_team_id ON media(team_id);
CREATE INDEX idx_media_uploaded_by ON media(uploaded_by);
```

---

## 8. Модели аналитики

### 8.1. `heatmap_data` — Тепловые карты (геоданные)

```sql
CREATE TABLE heatmap_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  lat DECIMAL(10, 8) NOT NULL,
  lng DECIMAL(11, 8) NOT NULL,
  node_id VARCHAR(50),
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_heatmap_data_game_id ON heatmap_data(game_id);
CREATE INDEX idx_heatmap_data_team_id ON heatmap_data(team_id);
CREATE INDEX idx_heatmap_data_created_at ON heatmap_data(created_at);
```

---

## 9. Индексы для производительности

### 9.1. Составные индексы

```sql
-- Для быстрого поиска активных сессий по игре
CREATE INDEX idx_sessions_game_status ON sessions(game_id, status);

-- Для быстрой загрузки истории сессии
CREATE INDEX idx_session_events_session_created ON session_events(session_id, created_at);

-- Для поиска лицензий по сценарию и статусу
CREATE INDEX idx_licenses_scenario_status ON licenses(scenario_id, status);

-- Для публичного каталога игр (город + дата + статус)
CREATE INDEX idx_games_city_date_status ON games(city, date, status);
```

### 9.2. Индексы для JSONB полей

```sql
-- Для поиска по узлам в сценариях (GIN индекс)
CREATE INDEX idx_scenarios_nodes ON scenarios USING GIN (nodes);

-- Для поиска по payload в событиях (GIN индекс)
CREATE INDEX idx_session_events_payload ON session_events USING GIN (payload);
```

---

## 10. Миграции (Prisma)

### 10.1. Установка Prisma

```bash
npm install @prisma/client
npm install -D prisma
npx prisma init
```

### 10.2. Создание миграции

```bash
npx prisma migrate dev --name init
npx prisma migrate deploy
```

### 10.3. Генерация клиента

```bash
npx prisma generate
```

### 10.4. Prisma Schema (полная модель)

```prisma
// Enums
enum Role {
  PLAYER
  ORGANIZER
  AUTHOR
  ADMIN
  MODERATOR
}

enum UserStatus {
  ACTIVE
  INACTIVE
  BANNED
}

enum OrganizerStatus {
  NOT_APPLIED
  PENDING
  APPROVED
  REJECTED
}

enum GameStatus {
  CREATED
  PUBLISHED
  WAITING_FOR_PLAYERS
  STARTED
  IN_PROGRESS
  PAUSED
  FINISHED
  ARCHIVED
}

enum ModerationStatus {
  PENDING
  APPROVED
  REJECTED
}

enum TeamStatus {
  REGISTERED
  ACTIVE
  WAITING_ANSWER
  NODE_COMPLETED
  NODE_FAILED
  NEXT_NODE
  FINISHED
}

// User model
model User {
  id                    String    @id @default(uuid()) @db.Uuid
  email                 String    @unique @db.VarChar(255)
  passwordHash          String    @map("password_hash") @db.VarChar(255)
  name                  String    @db.VarChar(100)
  avatarUrl             String?   @map("avatar_url") @db.Text
  city                  String?   @db.VarChar(100)
  bio                   String?   @db.Text
  telegram              String?   @db.VarChar(100)
  vk                    String?   @db.VarChar(255)
  whatsapp              String?   @db.VarChar(100)
  rating                Float?
  reputation            Int       @default(0)
  achievements          Json      @default("[]") @db.Json
  lastSeenAt            DateTime? @map("last_seen_at")
  role                  Role      @default(PLAYER)
  status                UserStatus @default(ACTIVE)
  contacts              Json      @default("{}")
  organizerStatus       OrganizerStatus @default(NOT_APPLIED) @map("organizer_status")
  organizerApplicationId String?  @map("organizer_application_id") @db.Uuid
  organizerApprovedAt   DateTime? @map("organizer_approved_at")
  gamesCreated          Int       @default(0) @map("games_created")
  gamesConducted        Int       @default(0) @map("games_conducted")
  scenariosCreated      Int       @default(0) @map("scenarios_created")
  createdAt             DateTime  @default(now()) @map("created_at")
  updatedAt             DateTime  @updatedAt @map("updated_at")
  lastLoginAt           DateTime? @map("last_login_at")
  deletedAt             DateTime? @map("deleted_at")

  games                 Game[]
  scenarios             Scenario[]
  teamMemberships       TeamMember[]
  createdVersions       ScenarioVersion[]
  captainTeams          Team[]
  organizerApplication  OrganizerApplication?
  reviewedApplications  OrganizerApplication[] @relation("ApplicationReviewer")

  @@index([email])
  @@index([role])
  @@index([status])
  @@index([organizerStatus])
  @@index([city])
  @@index([rating])
}

// Team model
model Team {
  id                    String      @id @default(uuid()) @db.Uuid
  name                  String      @db.VarChar(100)
  gameId                String      @map("game_id") @db.Uuid
  game                  Game        @relation(fields: [gameId], references: [id], onDelete: Cascade)
  captainId             String      @map("captain_id") @db.Uuid
  captain               User        @relation(fields: [captainId], references: [id], onDelete: Restrict)
  currentNodeId         String?     @map("current_node_id") @db.VarChar(50)
  score                 Int         @default(0)
  penalties             Int         @default(0)
  status                TeamStatus  @default(REGISTERED)
  startedAt             DateTime    @default(now()) @map("started_at")
  finishedAt            DateTime?   @map("finished_at")
  lastActivityAt        DateTime    @default(now()) @map("last_activity_at")
  createdAt             DateTime    @default(now()) @map("created_at")
  updatedAt             DateTime    @updatedAt @map("updated_at")

  members               TeamMember[]
  inventory             Inventory?
  resources             Resource?

  @@index([gameId])
  @@index([captainId])
  @@index([status])
  @@index([currentNodeId])
}

// TeamMember model
model TeamMember {
  id                    String    @id @default(uuid()) @db.Uuid
  teamId                String    @map("team_id") @db.Uuid
  team                  Team      @relation(fields: [teamId], references: [id], onDelete: Cascade)
  userId                String    @map("user_id") @db.Uuid
  user                  User      @relation(fields: [userId], references: [id], onDelete: Restrict)
  role                  String    @default("member") @db.VarChar(50)
  status                String    @default("active") @db.VarChar(50)
  joinedAt              DateTime  @default(now()) @map("joined_at")
  leftAt                DateTime? @map("left_at")
  createdAt             DateTime  @default(now()) @map("created_at")
  updatedAt             DateTime  @updatedAt @map("updated_at")

  @@unique([teamId, userId], name: "team_member_unique")
  @@index([teamId])
  @@index([userId])
}

// OrganizerApplication model
model OrganizerApplication {
  id              String   @id @default(uuid()) @db.Uuid
  userId          String   @unique @map("user_id") @db.Uuid
  user            User     @relation(fields: [userId], references: [id])
  city            String
  phone           String
  telegram        String?
  experience      String?
  status          String   @default("PENDING")
  rejectionReason String?  @map("rejection_reason")
  reviewedBy      String?  @map("reviewed_by") @db.Uuid
  reviewer        User?    @relation("ApplicationReviewer", fields: [reviewedBy], references: [id], onDelete: SetNull)
  reviewedAt      DateTime? @map("reviewed_at")
  createdAt       DateTime @default(now()) @map("created_at")
  updatedAt       DateTime @updatedAt @map("updated_at")

  @@index([userId])
  @@index([status])
  @@index([createdAt])
}
```

---

## 11. Итоговый контракт

> **База данных — единственный источник персистентности.**
>
> **Все изменения проходят через миграции.**
>
> **Event Sourcing — обязателен для всех игровых сессий.**
>
> **Индексы — обязательны для всех внешних ключей и полей, используемых в WHERE.**

---

**Кодовое имя проекта:** Adventure Engine  
**Главный принцип:** *База данных — источник истины для персистентных данных. Event Sourcing — источник истины для игровой логики.*
```
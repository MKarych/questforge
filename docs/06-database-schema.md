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
  role VARCHAR(50) NOT NULL DEFAULT 'player', -- player, organizer, author, admin, moderator
  status VARCHAR(50) NOT NULL DEFAULT 'active', -- active, blocked
  city VARCHAR(100),
  phone VARCHAR(50),
  telegram VARCHAR(100),
  experience TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_status ON users(status);
```

### 2.2. `organizer_applications` — Заявки на статус организатора

```sql
CREATE TABLE organizer_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  city VARCHAR(100) NOT NULL,
  phone VARCHAR(50) NOT NULL,
  telegram VARCHAR(100),
  experience TEXT,
  status VARCHAR(50) NOT NULL DEFAULT 'pending', -- pending, approved, rejected
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
  captain_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_teams_game_id ON teams(game_id);
CREATE INDEX idx_teams_captain_id ON teams(captain_id);
```

### 2.4. `team_members` — Участники команд

```sql
CREATE TABLE team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  role VARCHAR(50) NOT NULL DEFAULT 'member', -- member, captain
  joined_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_team_members_team_id ON team_members(team_id);
CREATE INDEX idx_team_members_user_id ON team_members(user_id);
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

### 4.1. `sessions` — Игровые сессии

```sql
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE RESTRICT,
  current_node_id VARCHAR(50) NOT NULL,
  score INT NOT NULL DEFAULT 0,
  penalties INT NOT NULL DEFAULT 0,
  status VARCHAR(50) NOT NULL DEFAULT 'active', -- active, paused, finished
  started_at TIMESTAMP NOT NULL DEFAULT NOW(),
  finished_at TIMESTAMP,
  last_activity_at TIMESTAMP NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_sessions_game_id ON sessions(game_id);
CREATE INDEX idx_sessions_team_id ON sessions(team_id);
CREATE INDEX idx_sessions_status ON sessions(status);
CREATE INDEX idx_sessions_current_node_id ON sessions(current_node_id);
```

### 4.2. `session_states` — Снапшоты состояния сессии

```sql
CREATE TABLE session_states (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  state JSONB NOT NULL,
  event_id UUID REFERENCES session_events(id) ON DELETE SET NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_session_states_session_id ON session_states(session_id);
CREATE INDEX idx_session_states_created_at ON session_states(created_at);
```

### 4.3. `session_events` — Event Sourcing (история всех событий)

```sql
CREATE TABLE session_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  node_id VARCHAR(50),
  payload JSONB NOT NULL,
  version INT NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_session_events_session_id ON session_events(session_id);
CREATE INDEX idx_session_events_type ON session_events(type);
CREATE INDEX idx_session_events_created_at ON session_events(created_at);
```

---

## 5. Модели социального слоя

### 5.1. `reviews` — Отзывы на игры

```sql
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  session_id UUID REFERENCES sessions(id) ON DELETE SET NULL,
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  text TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_reviews_game_id ON reviews(game_id);
CREATE INDEX idx_reviews_user_id ON reviews(user_id);
CREATE INDEX idx_reviews_rating ON reviews(rating);
CREATE INDEX idx_reviews_created_at ON reviews(created_at);
```

### 5.2. `comments` — Комментарии к играм (обсуждения)

```sql
CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  text TEXT NOT NULL,
  parent_id UUID REFERENCES comments(id) ON DELETE CASCADE, -- для веток обсуждений
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMP
);

CREATE INDEX idx_comments_game_id ON comments(game_id);
CREATE INDEX idx_comments_user_id ON comments(user_id);
CREATE INDEX idx_comments_parent_id ON comments(parent_id);
CREATE INDEX idx_comments_created_at ON comments(created_at);
```

---

## 6. Модели маркетплейса

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
  session_id UUID REFERENCES sessions(id) ON DELETE SET NULL,
  event_id UUID REFERENCES session_events(id) ON DELETE SET NULL,
  game_id UUID REFERENCES games(id) ON DELETE SET NULL, -- для обложек игр
  uploaded_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_media_session_id ON media(session_id);
CREATE INDEX idx_media_uploaded_by ON media(uploaded_by);
CREATE INDEX idx_media_game_id ON media(game_id);
```

---

## 8. Модели аналитики

### 8.1. `analytics_events` — События для аналитики

```sql
CREATE TABLE analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type VARCHAR(50) NOT NULL,
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  game_id UUID REFERENCES games(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  payload JSONB NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_analytics_events_type ON analytics_events(type);
CREATE INDEX idx_analytics_events_created_at ON analytics_events(created_at);
CREATE INDEX idx_analytics_events_game_id ON analytics_events(game_id);
```

### 8.2. `heatmap_data` — Тепловые карты (геоданные)

```sql
CREATE TABLE heatmap_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  lat DECIMAL(10, 8) NOT NULL,
  lng DECIMAL(11, 8) NOT NULL,
  node_id VARCHAR(50),
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_heatmap_data_game_id ON heatmap_data(game_id);
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

### 10.4. Prisma Schema (пример)

```prisma
model User {
  id               String   @id @default(cuid())
  email            String   @unique
  passwordHash     String
  name             String
  avatarUrl        String?
  role             String   @default("player")
  status           String   @default("active")
  city             String?
  phone            String?
  telegram         String?
  experience       String?
  games            Game[]
  scenarios        Scenario[]
  sessions         Session[]
  reviews          Review[]
  comments         Comment[]
  organizerApp     OrganizerApplication?
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt
  deletedAt        DateTime?
}

model OrganizerApplication {
  id              String   @id @default(cuid())
  userId          String
  user            User     @relation(fields: [userId], references: [id])
  city            String
  phone           String
  telegram        String?
  experience      String?
  status          String   @default("pending")
  rejectionReason String?
  reviewedBy      String?
  reviewedAt      DateTime?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}

model Game {
  id               String   @id @default(cuid())
  title            String
  description      String?
  city             String
  date             DateTime
  duration         Int
  price            Decimal  @default(0)
  maxTeams         Int      @default(50)
  shareLink        String   @unique
  status           String   @default("draft")
  moderationComment String?
  organizerId      String
  organizer        User     @relation(fields: [organizerId], references: [id])
  scenarioId       String?
  scenario         Scenario? @relation(fields: [scenarioId], references: [id])
  imageUrl         String?
  publishedAt      DateTime?
  submittedAt      DateTime?
  moderatedAt      DateTime?
  startedAt        DateTime?
  finishedAt       DateTime?
  sessions         Session[]
  reviews          Review[]
  comments         Comment[]
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt
  deletedAt        DateTime?
}

model Review {
  id          String   @id @default(cuid())
  gameId      String
  game        Game     @relation(fields: [gameId], references: [id])
  userId      String
  user        User     @relation(fields: [userId], references: [id])
  sessionId   String?
  session     Session? @relation(fields: [sessionId], references: [id])
  rating      Int      @default(5)
  text        String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model Comment {
  id          String   @id @default(cuid())
  gameId      String
  game        Game     @relation(fields: [gameId], references: [id])
  userId      String
  user        User     @relation(fields: [userId], references: [id])
  text        String
  parentId    String?
  parent      Comment? @relation(fields: [parentId], references: [id])
  children    Comment[]
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  deletedAt   DateTime?
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
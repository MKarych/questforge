```markdown
# Database Schema: Физическая модель данных PostgreSQL

> **Кодовое имя проекта:** Adventure Engine
> **Уровень документа:** Инженерный
> **Статус:** Утвержден

---

## 1. Принципы

- Все таблицы используют UUID (v4) как первичный ключ
- Внешние ключи с `ON DELETE RESTRICT` (защита от каскадного удаления)
- Мягкое удаление через `deleted_at`
- Партиционирование Event Store по времени
- Индексы для всех внешних ключей и полей WHERE

---

## 2. Таблицы

### 2.1. users

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(100) NOT NULL,
  avatar_url TEXT,
  role VARCHAR(50) NOT NULL DEFAULT 'player',
  status VARCHAR(50) NOT NULL DEFAULT 'active',
  contacts JSONB NOT NULL DEFAULT '{}',
  organizer_status VARCHAR(50) DEFAULT 'not_applied',
  organizer_approved_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  last_login_at TIMESTAMP,
  deleted_at TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_users_organizer_status ON users(organizer_status);
```

---

### 2.2. games

```sql
CREATE TABLE games (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  city VARCHAR(100) NOT NULL,
  date TIMESTAMP NOT NULL,
  duration INT NOT NULL,
  price DECIMAL(10, 2) DEFAULT 0,
  max_teams INT DEFAULT 50,
  share_link VARCHAR(50) NOT NULL UNIQUE,
  status VARCHAR(50) NOT NULL DEFAULT 'draft',
  moderation_status VARCHAR(50) NOT NULL DEFAULT 'pending',
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
CREATE INDEX idx_games_moderation_status ON games(moderation_status);
```

---

### 2.3. scenarios

```sql
CREATE TABLE scenarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  author_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  version INT NOT NULL DEFAULT 1,
  is_published BOOLEAN NOT NULL DEFAULT FALSE,
  price DECIMAL(10, 2),
  license_type VARCHAR(50),
  nodes JSONB NOT NULL,
  edges JSONB NOT NULL,
  start_node_id VARCHAR(50) NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}',
  validation_status VARCHAR(50) DEFAULT 'pending',
  validation_errors JSONB,
  published_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMP
);

CREATE INDEX idx_scenarios_author_id ON scenarios(author_id);
CREATE INDEX idx_scenarios_is_published ON scenarios(is_published);
CREATE INDEX idx_scenarios_price ON scenarios(price);
CREATE INDEX idx_scenarios_validation_status ON scenarios(validation_status);
CREATE INDEX idx_scenarios_nodes ON scenarios USING GIN (nodes);
```

---

### 2.4. scenario_versions

```sql
CREATE TABLE scenario_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scenario_id UUID NOT NULL REFERENCES scenarios(id) ON DELETE CASCADE,
  version INT NOT NULL,
  nodes JSONB NOT NULL,
  edges JSONB NOT NULL,
  start_node_id VARCHAR(50) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_scenario_versions_scenario_id ON scenario_versions(scenario_id);
CREATE UNIQUE INDEX idx_scenario_versions_unique ON scenario_versions(scenario_id, version);
```

---

### 2.5. teams

```sql
CREATE TABLE teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  captain_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  current_node_id VARCHAR(50),
  score INT NOT NULL DEFAULT 0,
  penalties INT NOT NULL DEFAULT 0,
  status VARCHAR(50) NOT NULL DEFAULT 'registered',
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

---

### 2.6. team_members

```sql
CREATE TABLE team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  role VARCHAR(50) NOT NULL DEFAULT 'member',
  status VARCHAR(50) NOT NULL DEFAULT 'active',
  joined_at TIMESTAMP NOT NULL DEFAULT NOW(),
  left_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_team_members_team_id ON team_members(team_id);
CREATE INDEX idx_team_members_user_id ON team_members(user_id);
CREATE UNIQUE INDEX idx_team_members_unique_active ON team_members(team_id, user_id) WHERE status = 'active';
```

---

### 2.7. inventories

```sql
CREATE TABLE inventories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  items JSONB NOT NULL DEFAULT '[]',
  capacity INT NOT NULL DEFAULT 20,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_inventories_team_id ON inventories(team_id);
```

---

### 2.8. resources

```sql
CREATE TABLE resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
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

### 2.9. session_states (снапшоты)

```sql
CREATE TABLE session_states (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  state JSONB NOT NULL,
  sequence INT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_session_states_team_id ON session_states(team_id);
CREATE INDEX idx_session_states_sequence ON session_states(sequence);
```

---

### 2.10. events (партиционированная)

```sql
-- Основная таблица (родитель)
CREATE TABLE events (
  id UUID NOT NULL,
  type VARCHAR(50) NOT NULL,
  game_id UUID NOT NULL,
  team_id UUID,
  node_id VARCHAR(50),
  payload JSONB NOT NULL,
  timestamp TIMESTAMP NOT NULL DEFAULT NOW(),
  sequence INT NOT NULL,
  version INT NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
) PARTITION BY RANGE (created_at);

-- Партиции по месяцам
CREATE TABLE events_2025_01 PARTITION OF events
  FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');
CREATE TABLE events_2025_02 PARTITION OF events
  FOR VALUES FROM ('2025-02-01') TO ('2025-03-01');
-- ... и так далее

CREATE INDEX idx_events_game_id ON events(game_id);
CREATE INDEX idx_events_team_id ON events(team_id);
CREATE INDEX idx_events_type ON events(type);
CREATE INDEX idx_events_sequence ON events(sequence);
CREATE INDEX idx_events_created_at ON events(created_at);
```

---

### 2.11. reviews

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

---

### 2.12. comments

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

---

### 2.13. purchases

```sql
CREATE TABLE purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scenario_id UUID NOT NULL REFERENCES scenarios(id) ON DELETE RESTRICT,
  buyer_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  license_type VARCHAR(50) NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  commission DECIMAL(10, 2) NOT NULL,
  royalty DECIMAL(10, 2) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  payment_id VARCHAR(255),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMP
);

CREATE INDEX idx_purchases_scenario_id ON purchases(scenario_id);
CREATE INDEX idx_purchases_buyer_id ON purchases(buyer_id);
CREATE INDEX idx_purchases_status ON purchases(status);
```

---

### 2.14. licenses

```sql
CREATE TABLE licenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scenario_id UUID NOT NULL REFERENCES scenarios(id) ON DELETE RESTRICT,
  buyer_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  license_type VARCHAR(50) NOT NULL,
  city VARCHAR(100),
  price DECIMAL(10, 2) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'active',
  expires_at TIMESTAMP,
  purchased_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_licenses_scenario_id ON licenses(scenario_id);
CREATE INDEX idx_licenses_buyer_id ON licenses(buyer_id);
CREATE INDEX idx_licenses_status ON licenses(status);
```

---

### 2.15. media

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

### 2.16. heatmap_data

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

## 3. Индексы для производительности

```sql
-- Составные индексы
CREATE INDEX idx_games_city_date_status ON games(city, date, status);
CREATE INDEX idx_teams_game_status ON teams(game_id, status);
CREATE INDEX idx_events_game_created ON events(game_id, created_at);
CREATE INDEX idx_events_team_created ON events(team_id, created_at);

-- Gin индексы для JSONB
CREATE INDEX idx_scenarios_nodes ON scenarios USING GIN (nodes);
CREATE INDEX idx_scenarios_edges ON scenarios USING GIN (edges);
CREATE INDEX idx_scenarios_metadata ON scenarios USING GIN (metadata);
CREATE INDEX idx_events_payload ON events USING GIN (payload);
```

---

## 4. Миграции (Prisma)

```bash
# Создание миграции
npx prisma migrate dev --name init

# Применение миграции
npx prisma migrate deploy

# Генерация клиента
npx prisma generate

# Открытие Prisma Studio
npx prisma studio
```

---

## 5. Итоговый контракт

> **База данных — источник персистентности.**
>
> **Event Store партиционирован по времени.**
>
> **Снапшоты хранятся отдельно.**

---

**Кодовое имя проекта:** Adventure Engine  
**Главный принцип:** *База данных должна пережить миллион событий.*
```
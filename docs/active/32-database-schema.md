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

## 3. Commerce-модели

### 3.1. marketplace_listings

```sql
CREATE TABLE marketplace_listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scenario_id UUID NOT NULL UNIQUE REFERENCES scenarios(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  short_description VARCHAR(500),
  category VARCHAR(100),
  tags TEXT[] NOT NULL DEFAULT '{}',
  cover_url VARCHAR(500),
  banner_url VARCHAR(500),
  price DECIMAL(10, 2) NOT NULL,
  license_type VARCHAR(50) NOT NULL DEFAULT 'SINGLE',
  update_policy VARCHAR(50) NOT NULL DEFAULT 'ALL_UPDATES',
  status VARCHAR(50) NOT NULL DEFAULT 'DRAFT',
  moderation_comment TEXT,
  moderated_by UUID REFERENCES users(id) ON DELETE SET NULL,
  moderated_at TIMESTAMP,
  published_version_id UUID,
  views INT NOT NULL DEFAULT 0,
  favorites INT NOT NULL DEFAULT 0,
  sales INT NOT NULL DEFAULT 0,
  avg_rating FLOAT NOT NULL DEFAULT 0,
  reviews_count INT NOT NULL DEFAULT 0,
  published_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMP
);

CREATE INDEX idx_marketplace_listings_author_id ON marketplace_listings(author_id);
CREATE INDEX idx_marketplace_listings_status ON marketplace_listings(status);
CREATE INDEX idx_marketplace_listings_category ON marketplace_listings(category);
CREATE INDEX idx_marketplace_listings_price ON marketplace_listings(price);
CREATE INDEX idx_marketplace_listings_avg_rating ON marketplace_listings(avg_rating);
CREATE INDEX idx_marketplace_listings_sales ON marketplace_listings(sales);
```

### 3.2. scenario_versions

```sql
CREATE TABLE scenario_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scenario_id UUID NOT NULL REFERENCES scenarios(id) ON DELETE CASCADE,
  version INT NOT NULL,
  version_label VARCHAR(100),
  nodes JSONB NOT NULL DEFAULT '[]',
  edges JSONB NOT NULL DEFAULT '[]',
  start_node_id VARCHAR(50) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'DRAFT',
  changelog TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  created_by_id UUID REFERENCES users(id) ON DELETE SET NULL
);

CREATE UNIQUE INDEX idx_scenario_versions_unique ON scenario_versions(scenario_id, version);
CREATE INDEX idx_scenario_versions_scenario_id ON scenario_versions(scenario_id);
CREATE INDEX idx_scenario_versions_status ON scenario_versions(status);
```

### 3.3. user_licenses

```sql
CREATE TABLE user_licenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  listing_id UUID NOT NULL REFERENCES marketplace_listings(id) ON DELETE CASCADE,
  scenario_version_id UUID NOT NULL REFERENCES scenario_versions(id) ON DELETE CASCADE,
  license_type VARCHAR(50) NOT NULL DEFAULT 'SINGLE',
  status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
  activations_used INT NOT NULL DEFAULT 0,
  activations_limit INT NOT NULL DEFAULT 0,
  expires_at TIMESTAMP,
  update_policy VARCHAR(50) NOT NULL DEFAULT 'ALL_UPDATES',
  purchased_at TIMESTAMP NOT NULL DEFAULT NOW(),
  revoked_at TIMESTAMP,
  revoked_reason VARCHAR(50),
  revoked_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_user_licenses_user_id ON user_licenses(user_id);
CREATE INDEX idx_user_licenses_listing_id ON user_licenses(listing_id);
CREATE INDEX idx_user_licenses_status ON user_licenses(status);
CREATE UNIQUE INDEX idx_user_licenses_user_listing_active ON user_licenses(user_id, listing_id, status) WHERE status = 'ACTIVE';
```

### 3.4. scenario_runs

```sql
CREATE TABLE scenario_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scenario_id UUID NOT NULL,
  organizer_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  license_id UUID NOT NULL REFERENCES user_licenses(id) ON DELETE RESTRICT,
  game_id UUID REFERENCES games(id) ON DELETE SET NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'RUNNING',
  started_at TIMESTAMP NOT NULL DEFAULT NOW(),
  ended_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_scenario_runs_organizer_id ON scenario_runs(organizer_id);
CREATE INDEX idx_scenario_runs_license_id ON scenario_runs(license_id);
CREATE INDEX idx_scenario_runs_scenario_id ON scenario_runs(scenario_id);
CREATE INDEX idx_scenario_runs_game_id ON scenario_runs(game_id);
```

### 3.5. purchases

```sql
CREATE TABLE purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES marketplace_listings(id) ON DELETE RESTRICT,
  scenario_version_id UUID NOT NULL REFERENCES scenario_versions(id) ON DELETE RESTRICT,
  buyer_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  price DECIMAL(10, 2) NOT NULL,
  commission DECIMAL(10, 2) NOT NULL DEFAULT 0,
  royalty DECIMAL(10, 2) NOT NULL DEFAULT 0,
  status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
  payment_id VARCHAR(255),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMP
);

CREATE INDEX idx_purchases_listing_id ON purchases(listing_id);
CREATE INDEX idx_purchases_buyer_id ON purchases(buyer_id);
CREATE INDEX idx_purchases_status ON purchases(status);
```

### 3.6. cart и cart_items

```sql
CREATE TABLE cart (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE cart_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cart_id UUID NOT NULL REFERENCES cart(id) ON DELETE CASCADE,
  listing_id UUID NOT NULL REFERENCES marketplace_listings(id) ON DELETE RESTRICT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_cart_items_cart_id ON cart_items(cart_id);
CREATE INDEX idx_cart_items_listing_id ON cart_items(listing_id);
CREATE INDEX idx_cart_user_id ON cart(user_id);
```

### 3.7. promo_codes

```sql
CREATE TABLE promo_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) NOT NULL UNIQUE,
  discount_type VARCHAR(50) NOT NULL DEFAULT 'PERCENT',
  discount_value DECIMAL(10, 2) NOT NULL,
  max_uses INT,
  uses_count INT NOT NULL DEFAULT 0,
  valid_from TIMESTAMP,
  valid_until TIMESTAMP,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_promo_codes_code ON promo_codes(code);
CREATE INDEX idx_promo_codes_is_active ON promo_codes(is_active);
```

### 3.8. payouts и author_earnings

```sql
CREATE TABLE payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  amount DECIMAL(10, 2) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
  payment_id VARCHAR(255),
  failed_reason TEXT,
  processed_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE author_earnings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  purchase_id UUID NOT NULL REFERENCES purchases(id) ON DELETE RESTRICT,
  amount DECIMAL(10, 2) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_payouts_author_id ON payouts(author_id);
CREATE INDEX idx_payouts_status ON payouts(status);
CREATE INDEX idx_author_earnings_author_id ON author_earnings(author_id);
CREATE INDEX idx_author_earnings_status ON author_earnings(status);
```

### 3.9. marketplace_analytics

```sql
CREATE TABLE marketplace_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES marketplace_listings(id) ON DELETE CASCADE,
  views INT NOT NULL DEFAULT 0,
  favorites INT NOT NULL DEFAULT 0,
  sales INT NOT NULL DEFAULT 0,
  conversion_rate FLOAT NOT NULL DEFAULT 0,
  avg_rating FLOAT NOT NULL DEFAULT 0,
  reviews_count INT NOT NULL DEFAULT 0,
  period VARCHAR(10) NOT NULL DEFAULT 'DAY',
  date DATE NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_marketplace_analytics_listing_id ON marketplace_analytics(listing_id);
CREATE INDEX idx_marketplace_analytics_date ON marketplace_analytics(date);
```

### 3.10. favorite_listings

```sql
CREATE TABLE favorite_listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  listing_id UUID NOT NULL REFERENCES marketplace_listings(id) ON DELETE CASCADE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, listing_id)
);

CREATE INDEX idx_favorite_listings_user_id ON favorite_listings(user_id);
CREATE INDEX idx_favorite_listings_listing_id ON favorite_listings(listing_id);
```

### 3.11. marketplace_reviews

```sql
CREATE TABLE marketplace_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES marketplace_listings(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  text TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_marketplace_reviews_listing_id ON marketplace_reviews(listing_id);
CREATE INDEX idx_marketplace_reviews_user_id ON marketplace_reviews(user_id);
```

---

## 4. Социальные модели

### 4.1. friends

```sql
CREATE TABLE friends (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  friend_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  added_at TIMESTAMP NOT NULL DEFAULT NOW(),
  last_interaction TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, friend_id)
);

CREATE INDEX idx_friends_user_id ON friends(user_id);
CREATE INDEX idx_friends_friend_id ON friends(friend_id);
```

### 4.2. friend_requests

```sql
CREATE TABLE friend_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  to_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
  message TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(from_user_id, to_user_id)
);

CREATE INDEX idx_friend_requests_from_user_id ON friend_requests(from_user_id);
CREATE INDEX idx_friend_requests_to_user_id ON friend_requests(to_user_id);
CREATE INDEX idx_friend_requests_status ON friend_requests(status);
```

### 4.3. blocked_users

```sql
CREATE TABLE blocked_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  blocked_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reason TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, blocked_id)
);

CREATE INDEX idx_blocked_users_user_id ON blocked_users(user_id);
CREATE INDEX idx_blocked_users_blocked_id ON blocked_users(blocked_id);
```

### 4.4. chats

```sql
CREATE TABLE chats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user1_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user2_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  last_message TEXT,
  last_message_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(user1_id, user2_id)
);

CREATE INDEX idx_chats_user1_id ON chats(user1_id);
CREATE INDEX idx_chats_user2_id ON chats(user2_id);
CREATE INDEX idx_chats_last_message_at ON chats(last_message_at);
```

### 4.5. chat_messages

```sql
CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id UUID NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  text TEXT NOT NULL,
  read_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_chat_messages_chat_id ON chat_messages(chat_id);
CREATE INDEX idx_chat_messages_chat_created ON chat_messages(chat_id, created_at);
CREATE INDEX idx_chat_messages_sender_id ON chat_messages(sender_id);
```

### 4.6. follows

```sql
CREATE TABLE follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(follower_id, following_id)
);

CREATE INDEX idx_follows_follower_id ON follows(follower_id);
CREATE INDEX idx_follows_following_id ON follows(following_id);
```

---

## 5. Support, Notifications, Activity

### 5.1. support_tickets

```sql
CREATE TABLE support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  email VARCHAR(255) NOT NULL,
  name VARCHAR(200) NOT NULL,
  category VARCHAR(100) NOT NULL,
  message TEXT NOT NULL,
  attachments JSONB NOT NULL DEFAULT '[]',
  status VARCHAR(50) NOT NULL DEFAULT 'NEW',
  assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
  response TEXT,
  resolved_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_support_tickets_status ON support_tickets(status);
CREATE INDEX idx_support_tickets_user_id ON support_tickets(user_id);
CREATE INDEX idx_support_tickets_assigned_to ON support_tickets(assigned_to);
CREATE INDEX idx_support_tickets_created_at ON support_tickets(created_at);
```

### 5.2. notifications

```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT,
  link VARCHAR(500),
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_user_read ON notifications(user_id, read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);
```

### 5.3. activity_logs

```sql
CREATE TABLE activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX idx_activity_logs_created_at ON activity_logs(created_at);
CREATE INDEX idx_activity_logs_user_created ON activity_logs(user_id, created_at);
```

---

## 6. Audit

### 6.1. audit_logs

```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  action VARCHAR(100) NOT NULL,
  entity VARCHAR(100) NOT NULL,
  entity_id VARCHAR(100) NOT NULL,
  old_value JSONB,
  new_value JSONB,
  ip VARCHAR(45),
  user_agent VARCHAR(500),
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity, entity_id);
```

---

## 7. Game extensions

### 7.1. game_comments

```sql
CREATE TABLE game_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  text TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMP
);

CREATE INDEX idx_game_comments_game_id ON game_comments(game_id);
CREATE INDEX idx_game_comments_author_id ON game_comments(author_id);
CREATE INDEX idx_game_comments_created_at ON game_comments(created_at);
```

### 7.2. game_questions

```sql
CREATE TABLE game_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  question TEXT NOT NULL,
  answer TEXT,
  answered_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_game_questions_game_id ON game_questions(game_id);
CREATE INDEX idx_game_questions_author_id ON game_questions(author_id);
CREATE INDEX idx_game_questions_answered_at ON game_questions(answered_at);
```

---

## 8. Team extensions

### 8.1. team_invites

```sql
CREATE TABLE team_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  invited_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  invited_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  token VARCHAR(255) NOT NULL UNIQUE,
  message TEXT,
  status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_team_invites_team_id ON team_invites(team_id);
CREATE INDEX idx_team_invites_invited_user_id ON team_invites(invited_user_id);
CREATE INDEX idx_team_invites_token ON team_invites(token);
CREATE INDEX idx_team_invites_status ON team_invites(status);
CREATE INDEX idx_team_invites_expires_at ON team_invites(expires_at);
```

### 8.2. join_requests

```sql
CREATE TABLE join_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  message TEXT,
  status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
  resolved_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(team_id, user_id, status)
);

CREATE INDEX idx_join_requests_team_id ON join_requests(team_id);
CREATE INDEX idx_join_requests_user_id ON join_requests(user_id);
CREATE INDEX idx_join_requests_status ON join_requests(status);
```

### 8.3. ownership_transfers

```sql
CREATE TABLE ownership_transfers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  from_user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  to_user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ownership_transfers_team_id ON ownership_transfers(team_id);
CREATE INDEX idx_ownership_transfers_status ON ownership_transfers(status);
CREATE INDEX idx_ownership_transfers_expires_at ON ownership_transfers(expires_at);
```

---

## 9. Billing

### 9.1. user_limits

```sql
CREATE TABLE user_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  tier VARCHAR(50) NOT NULL DEFAULT 'FREE',
  max_games_per_month INT NOT NULL DEFAULT 5,
  max_games_created INT NOT NULL DEFAULT 10,
  max_team_members INT NOT NULL DEFAULT 20,
  max_scenario_size_mb INT NOT NULL DEFAULT 10,
  max_listings INT NOT NULL DEFAULT 3,
  max_promo_codes INT NOT NULL DEFAULT 0,
  current_games_this_month INT NOT NULL DEFAULT 0,
  current_games_created INT NOT NULL DEFAULT 0,
  current_listings INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_user_limits_user_id ON user_limits(user_id);
CREATE INDEX idx_user_limits_tier ON user_limits(tier);
```

### 9.2. ledger_entries

```sql
CREATE TABLE ledger_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  type VARCHAR(50) NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  balance_after DECIMAL(10, 2) NOT NULL,
  reference_id VARCHAR(255),
  description TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ledger_entries_user_id ON ledger_entries(user_id);
CREATE INDEX idx_ledger_entries_type ON ledger_entries(type);
```

### 9.3. payments

```sql
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) NOT NULL DEFAULT 'RUB',
  status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
  provider VARCHAR(50),
  provider_payment_id VARCHAR(255),
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_payments_user_id ON payments(user_id);
CREATE INDEX idx_payments_status ON payments(status);
```

---

## 10. Organizer

### 10.1. organizer_applications

```sql
CREATE TABLE organizer_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  city VARCHAR(100) NOT NULL,
  phone VARCHAR(50),
  telegram VARCHAR(100),
  experience TEXT,
  status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
  rejection_reason TEXT,
  reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_organizer_applications_status ON organizer_applications(status);
CREATE INDEX idx_organizer_applications_user_id ON organizer_applications(user_id);
```

---

## 11. Game registrations

### 11.1. game_registrations

```sql
CREATE TABLE game_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  status VARCHAR(50) NOT NULL DEFAULT 'REGISTERED',
  ready_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(game_id, team_id)
);

CREATE INDEX idx_game_registrations_game_id ON game_registrations(game_id);
CREATE INDEX idx_game_registrations_team_id ON game_registrations(team_id);
CREATE INDEX idx_game_registrations_status ON game_registrations(status);
```

---

## 12. Индексы для производительности

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
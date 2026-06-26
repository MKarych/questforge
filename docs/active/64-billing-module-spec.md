# Billing Module: Тарифы, Лимиты, Оплата

> **Дата:** 27.06.2026  
> **Статус:** Актуален  
> **Версия:** 1.0  
> **Цель:** Описать систему тарифных планов, лимитов и финансов пользователя.

---

## 1. Обзор

Billing Module управляет:
- **Тарифными планами** (FREE, PRO, BUSINESS)
- **Лимитами пользователей** (максимум игр, команд, листингов)
- **Платежами** (входящие платежи, подписки)
- **Легером** (бухгалтерская книга изменений баланса)

---

## 2. Модель данных (Prisma)

### 2.1. UserLimits

```prisma
model UserLimits {
  id                        String   @id @default(uuid())
  user_id                   String   @unique @map("user_id") @db.Uuid
  tier                      String   @default("FREE")
  max_games_per_month       Int      @default(5)
  max_games_created         Int      @default(10)
  max_team_members          Int      @default(20)
  max_scenario_size_mb      Int      @default(10)
  max_listings              Int      @default(3)
  max_promo_codes           Int      @default(0)
  current_games_this_month  Int      @default(0)
  current_games_created     Int      @default(0)
  current_listings          Int      @default(0)
  created_at                DateTime @default(now()) @map("created_at")
  updated_at                DateTime @updatedAt @map("updated_at")

  user User @Relation(fields: [user_id], references: [id], onDelete: Cascade)

  @@index([user_id])
  @@index([tier])
  @@map("user_limits")
}
```

### 2.2. Тарифные планы

| Параметр | FREE | PRO | BUSINESS |
|----------|------|-----|----------|
| Макс. игр/мес | 5 | 20 | ∞ |
| Макс. созданных игр | 10 | 50 | ∞ |
| Макс. участников команды | 20 | 50 | 100 |
| Макс. размер сценария (МБ) | 10 | 50 | 200 |
| Макс. листингов | 3 | 20 | ∞ |
| Промокоды | 0 | 5 | ∞ |
| Аналитика | Базовая | Расширенная | Полная |
| Поддержка | Email | Приоритетная | Персональная |

### 2.3. Payment

```prisma
model Payment {
  id              String   @id @default(uuid())
  user_id         String   @map("user_id") @db.Uuid
  amount          Decimal  @db.Decimal(10, 2)
  currency        String   @default("RUB") @db.VarChar(3)
  status          String   @default("PENDING")
  provider        String?  @db.VarChar(50)
  provider_payment_id String? @db.VarChar(255)
  metadata        Json     @default("{}")
  created_at      DateTime @default(now()) @map("created_at")
  updated_at      DateTime @updatedAt @map("updated_at")

  @@index([user_id])
  @@index([status])
  @@map("payments")
}
```

### 2.4. LedgerEntry

```prisma
model LedgerEntry {
  id            String   @id @default(uuid())
  user_id       String   @map("user_id") @db.Uuid
  type          String   @db.VarChar(50)
  amount        Decimal  @db.Decimal(10, 2)
  balance_after Decimal  @db.Decimal(10, 2)
  reference_id  String?  @db.VarChar(255)
  description   String?  @db.Text
  created_at    DateTime @default(now()) @map("created_at")

  @@index([user_id])
  @@index([type])
  @@map("ledger_entries")
}
```

---

## 3. API Эндпоинты

### 3.1. Тарифы

```
GET /billing/tiers
```

Список доступных тарифных планов.

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "FREE",
      "name": "Бесплатный",
      "price": 0,
      "features": ["5 игр/мес", "20 участников", "базовая аналитика"]
    },
    {
      "id": "PRO",
      "name": "Профессиональный",
      "price": 990,
      "currency": "RUB",
      "period": "MONTH",
      "features": ["20 игр/мес", "50 участников", "расширенная аналитика"]
    },
    {
      "id": "BUSINESS",
      "name": "Бизнес",
      "price": 2990,
      "currency": "RUB",
      "period": "MONTH",
      "features": ["∞ игр", "100 участников", "полная аналитика"]
    }
  ]
}
```

---

```
GET /billing/my-tier
```

Текущий тариф пользователя.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "tier": "FREE",
    "limits": {
      "maxGamesPerMonth": 5,
      "maxGamesCreated": 10,
      "maxTeamMembers": 20
    },
    "current": {
      "gamesThisMonth": 2,
      "gamesCreated": 3,
      "listings": 1
    }
  }
}
```

---

### 3.2. Платежи

```
POST /billing/payments
```

Создание платежа (инициация оплаты).

**Request Body:**
```json
{
  "tier": "PRO",
  "amount": 990,
  "currency": "RUB"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "paymentId": "payment-uuid",
    "status": "PENDING",
    "checkoutUrl": "https://payment.gateway/checkout/..."
  }
}
```

---

```
GET /billing/payments
```

История платежей пользователя.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "payment-uuid",
        "amount": 990,
        "currency": "RUB",
        "status": "COMPLETED",
        "createdAt": "2025-01-01T12:00:00Z"
      }
    ],
    "total": 5
  }
}
```

---

### 3.3. Легер

```
GET /billing/ledger
```

История изменений баланса/лимитов.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "entry-uuid",
        "type": "TIER_UPGRADE",
        "amount": 990,
        "balanceAfter": 0,
        "description": "Переход на тариф PRO",
        "createdAt": "2025-01-01T12:00:00Z"
      }
    ]
  }
}
```

---

## 4. Логика изменения тарифа

```typescript
async upgradeTier(userId: string, newTier: string) {
  // 1. Найти текущие лимиты
  const limits = await prisma.userLimits.findUnique({
    where: { userId },
  });

  // 2. Проверить, не повышен ли уже
  if (limits?.tier === newTier) {
    throw new ConflictException('Тариф уже активен');
  }

  // 3. Создать платёж
  const payment = await this.createPayment(userId, newTier);

  // 4. После успешной оплаты:
  //    a. Обновить tier
  //    b. Обновить лимиты
  //    c. Создать запись в ledger
  //    d. Отправить уведомление
}
```

---

## 5. Проверка лимитов

Перед созданием игры/листинга система проверяет лимиты:

```typescript
async checkLimits(userId: string, entityType: string) {
  const limits = await prisma.userLimits.findUnique({
    where: { userId },
  });

  switch (entityType) {
    case 'GAME':
      if (limits.currentGamesCreated >= limits.maxGamesCreated) {
        throw new BadRequestException('Превышен лимит созданных игр');
      }
      break;
    case 'LISTING':
      if (limits.currentListings >= limits.maxListings) {
        throw new BadRequestException('Превышен лимит листингов');
      }
      break;
  }
}
```

---

## 6. Фронтенд

### 6.1. Страницы

| Страница | Путь | Описание |
|----------|------|----------|
| Upgrade | `/upgrade` | Выбор тарифа |
| Мои платежи | `/billing/payments` | История платежей |
| Мой тариф | `/billing/tier` | Текущий тариф и лимиты |

---

## 7. Domain Events

```typescript
enum BillingDomainEvent {
  TierUpgraded      = 'billing.tier.upgraded',
  TierDowngraded    = 'billing.tier.downgraded',
  PaymentCreated    = 'billing.payment.created',
  PaymentCompleted  = 'billing.payment.completed',
  PaymentFailed     = 'billing.payment.failed',
  LimitExceeded     = 'billing.limit.exceeded',
}
```

---

## 8. Архитектурные правила

1. **UserLimits — обязательная запись** для каждого пользователя (создаётся при регистрации с тарифом FREE).
2. **Все финансовые операции логируются** в LedgerEntry.
3. **Лимиты проверяются** перед созданием игр, листингов и других ресурсов.
4. **Тариф можно повысить** в любой момент (пропорциональный пересчёт).
5. **Платежи через провайдеров** (Stripe/ЮKassa) — статусы синхронизируются через webhooks.

---

**Дата:** 27.06.2026  
**Статус:** Актуален  
**Версия:** 1.0

```markdown
# State Replication Model: Распределенное состояние

> **Кодовое имя проекта:** Adventure Engine
> **Уровень документа:** Инженерный контракт
> **Статус:** Утвержден

---

## 1. Принципы

### 1.1. Три уровня состояния
- **L1: Memory** — для быстрого доступа (активные сессии)
- **L2: Redis** — для распределенного кэширования
- **L3: PostgreSQL** — для постоянного хранения (источник истины)

### 1.2. Однонаправленный поток
Данные движутся только в одном направлении: L1 → L2 → L3.

### 1.3. Асинхронная синхронизация
Синхронизация между уровнями не блокирует основной поток.

### 1.4. Блокировки (Locking)
Каждая сессия блокируется на время обработки события.

### 1.5. Восстановление
При сбое любого уровня система автоматически переключается на следующий.

---

## 2. Три уровня состояния

### 2.1. Уровни

| Уровень | Хранилище | Время жизни | Скорость | Надежность |
| :--- | :--- | :--- | :--- | :--- |
| **L1: Memory** | RAM (Node.js) | 5-15 минут | ⚡⚡⚡⚡⚡ | ❌ (теряется при рестарте) |
| **L2: Redis** | Redis | 1 час | ⚡⚡⚡⚡ | ⚠️ (теряется при падении Redis) |
| **L3: PostgreSQL** | Postgres | Постоянно | ⚡⚡ | ✅ (не теряется) |

### 2.2. Когда что использовать

| Операция | Используемый уровень |
| :--- | :--- |
| Чтение состояния (быстрый доступ) | L1 → L2 → L3 |
| Чтение состояния (постоянное) | L3 |
| Обновление состояния | L1 → L2 (async) → L3 (async) |
| Восстановление после сбоя | L3 → L2 → L1 |

---

## 3. Поток данных между уровнями

### 3.1. Чтение состояния

```text
1. Запрос на чтение состояния
   ↓
2. Проверить L1 (Memory)
   ├─ Есть → вернуть
   └─ Нет → проверить L2 (Redis)
         ├─ Есть → сохранить в L1, вернуть
         └─ Нет → проверить L3 (PostgreSQL)
               ├─ Есть → сохранить в L2 и L1, вернуть
               └─ Нет → вернуть null
```

### 3.2. Запись состояния

```text
1. Запрос на запись состояния
   ↓
2. Сохранить в L1 (Memory) — мгновенно
   ↓
3. Запланировать сохранение в L2 (Redis) — каждые 10 секунд
   ↓
4. Запланировать сохранение в L3 (PostgreSQL) — каждые 30 секунд
   ↓
5. При завершении сессии — сохранить в L3 (немедленно)
```

### 3.3. Диаграмма

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT                                 │
└──────────────────────────────┬──────────────────────────────────┘
                               │ (Read/Write)
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                         STATE MANAGER                          │
└──────────────────────────────┬──────────────────────────────────┘
                               │
         ┌─────────────────────┼─────────────────────┐
         │                     │                     │
         ▼                     ▼                     ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────────┐
│  L1: Memory     │ │  L2: Redis      │ │  L3: PostgreSQL     │
│  (Node.js)      │ │  (Distributed)  │ │  (Persistent)       │
│  TTL: 5-15 min  │ │  TTL: 1 hour    │ │  TTL: ∞             │
│  ⚡⚡⚡⚡⚡       │ │  ⚡⚡⚡⚡        │ │  ⚡⚡               │
└─────────────────┘ └─────────────────┘ └─────────────────────┘
         │                     │                     │
         └─────────────────────┼─────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                    SYNCHRONIZATION SCHEDULER                   │
│  - L1 → L2: каждые 10 секунд                                  │
│  - L2 → L3: каждые 30 секунд                                  │
│  - L2 → L3: при завершении сессии (немедленно)               │
└─────────────────────────────────────────────────────────────────┘
```

---

## 4. Синхронизация

### 4.1. Периодическая синхронизация

```typescript
class SynchronizationScheduler {
  constructor(
    private stateManager: StateManager,
    private redis: RedisClient,
    private db: PrismaClient
  ) {}

  // Запуск периодической синхронизации
  start(): void {
    // L1 → L2 (каждые 10 секунд)
    setInterval(async () => {
      await this.syncMemoryToRedis();
    }, 10000);

    // L2 → L3 (каждые 30 секунд)
    setInterval(async () => {
      await this.syncRedisToDatabase();
    }, 30000);
  }

  // L1 → L2
  private async syncMemoryToRedis(): Promise<void> {
    const activeSessions = this.stateManager.getActiveSessions();
    
    for (const session of activeSessions) {
      const key = `session:${session.id}`;
      await this.redis.set(
        key,
        JSON.stringify(session.state),
        'EX',
        3600 // TTL 1 час
      );
    }
  }

  // L2 → L3
  private async syncRedisToDatabase(): Promise<void> {
    const keys = await this.redis.keys('session:*');
    
    for (const key of keys) {
      const sessionId = key.replace('session:', '');
      const state = await this.redis.get(key);
      
      if (state) {
        await this.db.session_states.create({
          data: {
            session_id: sessionId,
            state: JSON.parse(state),
            created_at: new Date()
          }
        });
      }
    }
  }
}
```

### 4.2. Синхронизация при завершении сессии

```typescript
class StateManager {
  async finishSession(sessionId: string): Promise<void> {
    // 1. Получить состояние из L1
    const state = this.memory.get(sessionId);
    if (!state) {
      // Если нет в L1, пробуем из L2
      const redisState = await this.redis.get(`session:${sessionId}`);
      if (redisState) {
        // Сохраняем в L3
        await this.db.session_states.create({
          data: {
            session_id: sessionId,
            state: JSON.parse(redisState),
            created_at: new Date()
          }
        });
      }
      return;
    }

    // 2. Сохранить в L3 (немедленно)
    await this.db.session_states.create({
      data: {
        session_id: sessionId,
        state: state,
        created_at: new Date()
      }
    });

    // 3. Сохранить в L2 (обновить TTL)
    await this.redis.set(
      `session:${sessionId}`,
      JSON.stringify(state),
      'EX',
      3600
    );

    // 4. Удалить из L1
    this.memory.delete(sessionId);
  }
}
```

---

## 5. Блокировки (Locking)

### 5.1. Принцип

> **1 сессия = 1 активный инстанс Engine.**

### 5.2. Реализация через Redis

```typescript
class LockManager {
  constructor(
    private redis: RedisClient,
    private workerId: string
  ) {}

  // Получить блокировку сессии
  async acquire(sessionId: string): Promise<boolean> {
    const key = `lock:${sessionId}`;
    const result = await this.redis.set(
      key,
      this.workerId,
      'NX', // Only set if not exists
      'EX', // TTL
      30 // 30 секунд
    );
    
    if (result === 'OK') {
      // Периодическое продление блокировки (keepalive)
      this.startKeepalive(sessionId);
      return true;
    }
    
    return false;
  }

  // Освободить блокировку
  async release(sessionId: string): Promise<void> {
    const key = `lock:${sessionId}`;
    // Проверяем, что блокировка принадлежит этому worker'у
    const owner = await this.redis.get(key);
    if (owner === this.workerId) {
      await this.redis.del(key);
    }
    this.stopKeepalive(sessionId);
  }

  // Продление блокировки (keepalive)
  private startKeepalive(sessionId: string): void {
    const interval = setInterval(async () => {
      const key = `lock:${sessionId}`;
      const owner = await this.redis.get(key);
      if (owner === this.workerId) {
        // Продлить TTL на 30 секунд
        await this.redis.expire(key, 30);
      }
    }, 10000);
    
    this.keepalives.set(sessionId, interval);
  }

  private stopKeepalive(sessionId: string): void {
    const interval = this.keepalives.get(sessionId);
    if (interval) {
      clearInterval(interval);
      this.keepalives.delete(sessionId);
    }
  }
}
```

### 5.3. Использование в Orchestrator

```typescript
class EngineOrchestrator {
  async processEvent(sessionId: string, event: PlayerCommand): Promise<Result> {
    // 1. Получить блокировку
    const lock = await this.lockManager.acquire(sessionId);
    if (!lock) {
      throw new LockError('Session is locked by another worker');
    }

    try {
      // 2. Обработка события
      const result = await this.processEventInternal(sessionId, event);
      
      // 3. Освободить блокировку
      await this.lockManager.release(sessionId);
      
      return result;
    } catch (error) {
      // 4. Освободить блокировку при ошибке
      await this.lockManager.release(sessionId);
      throw error;
    }
  }
}
```

---

## 6. Восстановление после сбоя

### 6.1. Типы сбоев

| Тип сбоя | Восстановление |
| :--- | :--- |
| **Падение инстанса Engine** | Другой инстанс берет блокировку и загружает состояние из L2/L3 |
| **Падение Redis** | Engine переключается на L3 (PostgreSQL) |
| **Падение PostgreSQL** | Engine работает с L1/L2, синхронизация откладывается |

### 6.2. Восстановление после падения инстанса

```typescript
class RecoveryManager {
  async recoverSession(sessionId: string): Promise<SessionState> {
    // 1. Попробовать восстановить из L2 (Redis)
    const redisState = await this.redis.get(`session:${sessionId}`);
    if (redisState) {
      const state = JSON.parse(redisState);
      // Сохранить в L1
      this.memory.set(sessionId, state);
      return state;
    }

    // 2. Попробовать восстановить из L3 (PostgreSQL)
    const dbState = await this.db.session_states.findFirst({
      where: { session_id: sessionId },
      orderBy: { created_at: 'desc' }
    });

    if (dbState) {
      const state = dbState.state;
      // Сохранить в L2 и L1
      await this.redis.set(
        `session:${sessionId}`,
        JSON.stringify(state),
        'EX',
        3600
      );
      this.memory.set(sessionId, state);
      return state;
    }

    // 3. Не удалось восстановить
    throw new SessionNotFoundError(sessionId);
  }
}
```

---

## 7. Примеры

### 7.1. Правильная репликация

```typescript
// ✅ ПРАВИЛЬНО — три уровня с синхронизацией
class StateManager {
  async getState(sessionId: string): Promise<SessionState | null> {
    // 1. L1: Memory
    const memState = this.memory.get(sessionId);
    if (memState) return memState;

    // 2. L2: Redis
    const redisState = await this.redis.get(`session:${sessionId}`);
    if (redisState) {
      const parsed = JSON.parse(redisState);
      this.memory.set(sessionId, parsed);
      return parsed;
    }

    // 3. L3: PostgreSQL
    const dbState = await this.db.session_states.findFirst({
      where: { session_id: sessionId },
      orderBy: { created_at: 'desc' }
    });

    if (dbState) {
      const parsed = dbState.state;
      await this.redis.set(`session:${sessionId}`, JSON.stringify(parsed), 'EX', 3600);
      this.memory.set(sessionId, parsed);
      return parsed;
    }

    return null;
  }

  async update(sessionId: string, updates: Partial<SessionState>): Promise<SessionState> {
    // 1. Получить текущее состояние
    const current = await this.getState(sessionId);
    if (!current) throw new SessionNotFoundError(sessionId);

    // 2. Создать новое состояние
    const newState = { ...current, ...updates, updatedAt: new Date() };

    // 3. Сохранить в L1 (синхронно)
    this.memory.set(sessionId, newState);

    // 4. Сохранить в L2 (асинхронно)
    await this.redis.set(`session:${sessionId}`, JSON.stringify(newState), 'EX', 3600);

    // 5. Сохранить в L3 (асинхронно, с задержкой)
    this.scheduleDatabaseSave(sessionId, newState);

    return newState;
  }
}
```

### 7.2. Неправильная репликация

```typescript
// ❌ ПЛОХО — только один уровень
class StateManager {
  async getState(sessionId: string): Promise<SessionState | null> {
    // Только PostgreSQL — медленно
    return await this.db.session_states.findFirst({
      where: { session_id: sessionId }
    });
  }

  async update(sessionId: string, state: SessionState): Promise<void> {
    // Только PostgreSQL — медленно, нет кэширования
    await this.db.session_states.create({
      data: { session_id: sessionId, state }
    });
  }
}
```

---

## 8. Метрики и мониторинг

### 8.1. Метрики репликации

| Метрика | Описание | Порог |
| :--- | :--- | :--- |
| `cache_hit_rate` | Процент попаданий в L1/L2 | > 95% |
| `db_read_latency` | Задержка чтения из L3 | < 50 мс |
| `db_write_latency` | Задержка записи в L3 | < 100 мс |
| `sync_lag` | Задержка синхронизации L1→L2→L3 | < 5 сек |
| `lock_acquisition_time` | Время получения блокировки | < 50 мс |

### 8.2. Мониторинг синхронизации

```typescript
class SyncMonitor {
  async trackSync(from: string, to: string, duration: number): Promise<void> {
    await this.prometheus.histogram('sync_duration_seconds', duration, {
      from,
      to
    });
  }

  async trackCacheHit(level: string): Promise<void> {
    await this.prometheus.counter('cache_hits_total', { level });
  }
}
```

---

## 9. Итоговый контракт

> **3 уровня состояния: Memory, Redis, PostgreSQL.**
>
> **1 сессия = 1 активный worker.**
>
> **Locking — обязателен.**
>
> **Синхронизация — асинхронная.**
>
> **Восстановление — автоматическое.**
>
> **Race conditions невозможны.**

---

**Кодовое имя проекта:** Adventure Engine  
**Главный принцип:** *Состояние — это актив. Оно должно быть доступно, надежно и быстро.*
```
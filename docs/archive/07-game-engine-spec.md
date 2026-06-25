```markdown
# Game Engine Specification: Детальная спецификация движка

> **Кодовое имя проекта:** Adventure Engine
> **Уровень документа:** Инженерный контракт
> **Статус:** Утвержден. Изменения только с мажорной версией.

---

## 1. Общая архитектура

### 1.1. Место Engine в системе

```
┌─────────────────────────────────────────────────────────────────┐
│                         API LAYER                              │
│  - REST endpoints (games, sessions, answers)                   │
│  - WebSocket handlers                                          │
└─────────────────────────────┬───────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    ENGINE ORCHESTRATOR                         │
│  - Единственная точка входа                                    │
│  - Управляет блокировками (Lock)                               │
│  - Координирует 4 модуля                                       │
│  - Управляет транзакциями (Commit/Rollback)                   │
└─────────────────────────────┬───────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
┌───────▼──────────┐ ┌────────▼─────────┐ ┌────────▼─────────┐
│ EVENT PROCESSOR  │ │  RULES ENGINE    │ │STATE MANAGER     │
│ - Принимает      │ │ - Проверяет      │ │ - Обновляет      │
│   событие        │ │   условия        │ │   состояние      │
│ - Валидирует     │ │ - Определяет     │ │ - Сохраняет      │
│   данные         │ │   переход        │ │   события        │
└──────────────────┘ └──────────────────┘ └──────────────────┘
                              │
                    ┌─────────▼──────────┐
                    │TRANSITION RESOLVER │
                    │ - Находит узел     │
                    │ - Проверяет        │
                    │   условия          │
                    └────────────────────┘
```

### 1.2. Принципы работы

1. **Engine — единственный источник истины.**  
   Все игровые состояния хранятся и вычисляются только в Engine.

2. **Детерминизм.**  
   Одинаковый вход → одинаковый выход. Никаких `Date.now()` или `Math.random()` без seed.

3. **Event Sourcing.**  
   Все события сохраняются. Это позволяет откатывать состояние (Time Travel) и восстанавливаться после сбоев.

4. **Idempotency.**  
   Каждое событие обрабатывается строго один раз.

5. **Server-Authoritative.**  
   Frontend никогда не доверяется. Вся логика — только в Engine.

---

## 2. Классы Engine

### 2.1. EngineOrchestrator (Координационный слой)

**Ответственность:** Единственная точка входа в Engine. Управляет блокировками, вызывает 4 модуля, управляет транзакциями.

```typescript
class EngineOrchestrator {
  constructor(
    private lockManager: LockManager,
    private eventProcessor: EventProcessor,
    private rulesEngine: RulesEngine,
    private transitionResolver: TransitionResolver,
    private stateManager: StateManager,
    private eventLog: EventLog,
    private realtimeLayer: RealtimeLayer
  ) {}

  // ============================================
  // Обработка команды от игрока
  // ============================================
  async processEvent(
    sessionId: string,
    command: PlayerCommand
  ): Promise<ProcessingResult> {
    // 1. Получить блокировку сессии (Lock)
    const lock = await this.lockManager.acquire(sessionId);
    if (!lock) throw new LockError('Session locked by another worker');

    try {
      // 2. Загрузить состояние сессии
      const state = await this.stateManager.getState(sessionId);
      if (!state) throw new SessionNotFoundError(sessionId);

      // 3. Проверить идемпотентность (дубликат события)
      if (await this.eventLog.isProcessed(command.id)) {
        return { status: 'ignored', message: 'Duplicate event' };
      }

      // 4. Валидация события
      const validated = await this.eventProcessor.validate(command, state);

      // 5. Вызов Rules Engine
      const transitionType = await this.rulesEngine.evaluate(
        validated.node,
        validated.event,
        { currentTime: Date.now() }
      );

      // 6. Вызов Transition Resolver
      const nextNodeId = await this.transitionResolver.resolve(
        validated.node,
        transitionType,
        state
      );

      // 7. Вызов State Manager (обновление состояния)
      const newState = await this.stateManager.update(sessionId, {
        currentNodeId: nextNodeId,
        score: state.score + (transitionType === 'success' ? 10 : 0),
        penalties: state.penalties + (transitionType === 'fail' ? 1 : 0),
        status: nextNodeId ? 'active' : 'finished'
      });

      // 8. Сохранение события в лог (Event Sourcing)
      await this.eventLog.append(sessionId, command, newState);

      // 9. Отправка события в Realtime Layer
      await this.realtimeLayer.broadcast(sessionId, {
        type: 'STATE_SYNC',
        payload: newState
      });

      // 10. Освободить блокировку
      await this.lockManager.release(sessionId);

      return {
        status: 'success',
        state: newState,
        nextNode: nextNodeId ? await this.getNode(nextNodeId) : null
      };

    } catch (error) {
      // 11. ROLLBACK: при ошибке откатываем состояние
      await this.stateManager.rollback(sessionId);
      await this.lockManager.release(sessionId);
      throw error;
    }
  }

  // ============================================
  // Получение текущего состояния
  // ============================================
  async getSessionState(sessionId: string): Promise<SessionState> {
    return this.stateManager.getState(sessionId);
  }

  // ============================================
  // Time Travel (откат состояния)
  // ============================================
  async rewindSession(
    sessionId: string,
    timestamp: number
  ): Promise<SessionState> {
    // 1. Получить блокировку
    const lock = await this.lockManager.acquire(sessionId);
    if (!lock) throw new LockError('Session locked');

    try {
      // 2. Загрузить все события до timestamp
      const events = await this.eventLog.getEventsBefore(sessionId, timestamp);

      // 3. Пересобрать состояние с нуля
      const replayedState = await this.replayEvents(sessionId, events);

      // 4. Сохранить новое состояние
      await this.stateManager.update(sessionId, replayedState);

      // 5. Отправить обновление
      await this.realtimeLayer.broadcast(sessionId, {
        type: 'STATE_SYNC',
        payload: replayedState
      });

      await this.lockManager.release(sessionId);
      return replayedState;

    } catch (error) {
      await this.lockManager.release(sessionId);
      throw error;
    }
  }

  // ============================================
  // Replay (воспроизведение событий)
  // ============================================
  async replayEvents(
    sessionId: string,
    events: SessionEvent[]
  ): Promise<SessionState> {
    // 1. Создать пустое состояние
    let state = this.createInitialState(sessionId);

    // 2. Последовательно обработать все события
    for (const event of events) {
      // 2a. Восстановить узел
      const node = await this.getNode(event.nodeId);

      // 2b. Вызвать Rules Engine
      const transitionType = await this.rulesEngine.evaluate(node, event, {
        currentTime: event.createdAt
      });

      // 2c. Вызвать Transition Resolver
      const nextNodeId = await this.transitionResolver.resolve(
        node,
        transitionType,
        state
      );

      // 2d. Обновить состояние
      state = await this.stateManager.applyTransition(state, {
        nextNodeId,
        scoreDelta: transitionType === 'success' ? 10 : 0,
        penaltyDelta: transitionType === 'fail' ? 1 : 0
      });
    }

    return state;
  }
}
```

---

### 2.2. EventProcessor (Обработчик событий)

**Ответственность:** Принимает событие, валидирует его, подготавливает для Rules Engine.

```typescript
class EventProcessor {
  // ============================================
  // Валидация события
  // ============================================
  async validate(
    event: PlayerCommand,
    state: SessionState
  ): Promise<ValidatedEvent> {
    // 1. Проверить: существует ли сессия?
    if (!state) throw new SessionNotFoundError();

    // 2. Проверить: активна ли сессия?
    if (state.status !== 'active') throw new SessionNotActiveError();

    // 3. Проверить: принадлежит ли событие текущему узлу?
    if (event.nodeId !== state.currentNodeId) {
      throw new InvalidNodeError('Event does not match current node');
    }

    // 4. Загрузить узел из сценария
    const node = await this.getNode(event.nodeId);
    if (!node) throw new NodeNotFoundError(event.nodeId);

    // 5. Валидация данных в зависимости от типа узла
    this.validatePayload(node, event);

    // 6. Возврат валидированного события
    return { node, event };
  }

  // ============================================
  // Валидация payload по типу узла
  // ============================================
  private validatePayload(node: Node, event: PlayerCommand): void {
    switch (node.type) {
      case 'text':
      case 'code':
        if (!event.answer || typeof event.answer !== 'string') {
          throw new ValidationError('Answer is required');
        }
        break;

      case 'photo':
        if (!event.metadata?.photoUrl) {
          throw new ValidationError('Photo is required');
        }
        break;

      case 'gps':
        if (!event.metadata?.lat || !event.metadata?.lng) {
          throw new ValidationError('GPS coordinates are required');
        }
        break;

      case 'qr':
        if (!event.answer || typeof event.answer !== 'string') {
          throw new ValidationError('QR code is required');
        }
        break;
    }
  }
}
```

---

### 2.3. RulesEngine (Движок правил)

**Ответственность:** Проверяет условия и определяет тип перехода.

```typescript
class RulesEngine {
  // ============================================
  // Оценка условий
  // ============================================
  async evaluate(
    node: Node,
    event: ValidatedEvent,
    context: { currentTime: number }
  ): Promise<TransitionType> {
    // 1. Проверка таймаута
    if (node.timeout && context.currentTime > node.timeout) {
      return 'timeout';
    }

    // 2. Проверка ответа в зависимости от типа узла
    switch (node.type) {
      case 'text':
        return this.evaluateText(node, event);

      case 'code':
        return this.evaluateCode(node, event);

      case 'photo':
        return this.evaluatePhoto(node, event);

      case 'gps':
        return this.evaluateGPS(node, event);

      case 'qr':
        return this.evaluateQR(node, event);

      case 'choice':
        return this.evaluateChoice(node, event);

      default:
        return 'success';
    }
  }

  // ============================================
  // Оценка текстового ответа
  // ============================================
  private evaluateText(node: Node, event: ValidatedEvent): TransitionType {
    const userAnswer = event.answer.trim().toLowerCase();
    const correctAnswer = node.answer.trim().toLowerCase();

    return userAnswer === correctAnswer ? 'success' : 'fail';
  }

  // ============================================
  // Оценка кода
  // ============================================
  private evaluateCode(node: Node, event: ValidatedEvent): TransitionType {
    const userAnswer = event.answer.trim();
    const correctAnswer = node.answer.trim();

    return userAnswer === correctAnswer ? 'success' : 'fail';
  }

  // ============================================
  // Оценка фото (всегда требует ручной проверки)
  // ============================================
  private evaluatePhoto(node: Node, event: ValidatedEvent): TransitionType {
    return 'pending'; // Требуется ручная проверка
  }

  // ============================================
  // Оценка GPS
  // ============================================
  private evaluateGPS(node: Node, event: ValidatedEvent): TransitionType {
    const { lat, lng } = event.metadata;
    const distance = this.calculateDistance(
      lat,
      lng,
      node.lat,
      node.lng
    );

    return distance <= node.radius ? 'success' : 'fail';
  }

  // ============================================
  // Оценка QR-кода
  // ============================================
  private evaluateQR(node: Node, event: ValidatedEvent): TransitionType {
    const userCode = event.answer.trim();
    const correctCode = node.answer.trim();

    return userCode === correctCode ? 'success' : 'fail';
  }

  // ============================================
  // Оценка множественного выбора
  // ============================================
  private evaluateChoice(node: Node, event: ValidatedEvent): TransitionType {
    const userChoice = event.answer;
    const correctChoice = node.correctOption;

    return userChoice === correctChoice ? 'success' : 'fail';
  }

  // ============================================
  // Расчет расстояния (Haversine formula)
  // ============================================
  private calculateDistance(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number
  ): number {
    const R = 6371; // Радиус Земли в км
    const dLat = this.toRad(lat2 - lat1);
    const dLng = this.toRad(lng2 - lng1);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(this.toRad(lat1)) *
      Math.cos(this.toRad(lat2)) *
      Math.sin(dLng / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c * 1000; // Результат в метрах
  }

  private toRad(degrees: number): number {
    return degrees * (Math.PI / 180);
  }
}
```

---

### 2.4. TransitionResolver (Разрешитель переходов)

**Ответственность:** Находит целевой узел по типу перехода.

```typescript
class TransitionResolver {
  // ============================================
  // Поиск целевого узла
  // ============================================
  async resolve(
    node: Node,
    transitionType: TransitionType,
    state: SessionState
  ): Promise<string | null> {
    // 1. Найти переход по типу
    const transition = node.transitions.find(
      t => t.when === transitionType
    );

    // 2. Если переход найден
    if (transition) {
      // Проверка условий (если есть)
      if (transition.condition) {
        const conditionMet = await this.evaluateCondition(
          transition.condition,
          state
        );
        if (!conditionMet) {
          // Если условие не выполнено, ищем fallback
          return this.findFallbackTransition(node, state);
        }
      }
      return transition.to;
    }

    // 3. Если переход не найден, ищем fallback
    return this.findFallbackTransition(node, state);
  }

  // ============================================
  // Поиск fallback перехода
  // ============================================
  private findFallbackTransition(
    node: Node,
    state: SessionState
  ): string | null {
    // Если есть переход по умолчанию (success)
    const defaultTransition = node.transitions.find(
      t => t.when === 'success'
    );
    return defaultTransition ? defaultTransition.to : null;
  }

  // ============================================
  // Оценка пользовательского условия
  // ============================================
  private async evaluateCondition(
    condition: string,
    state: SessionState
  ): Promise<boolean> {
    // Условный парсинг выражений
    // Например: "score > 50" или "penalties < 3"
    // Безопасно выполняется в песочнице (vm2)
    return await this.sandbox.evaluate(condition, state);
  }
}
```

---

### 2.5. StateManager (Менеджер состояния)

**Ответственность:** Единственное место, где меняется состояние сессии.

```typescript
class StateManager {
  constructor(
    private redis: RedisClient,
    private db: PrismaClient,
    private cache: MemoryCache
  ) {}

  // ============================================
  // Получение состояния (L1 → L2 → L3)
  // ============================================
  async getState(sessionId: string): Promise<SessionState | null> {
    // 1. Проверить L1: Memory Cache
    const memState = this.cache.get(sessionId);
    if (memState) return memState;

    // 2. Проверить L2: Redis
    const redisState = await this.redis.get(`session:${sessionId}`);
    if (redisState) {
      const parsed = JSON.parse(redisState);
      this.cache.set(sessionId, parsed);
      return parsed;
    }

    // 3. Проверить L3: PostgreSQL
    const dbState = await this.db.session_states.findFirst({
      where: { session_id: sessionId },
      orderBy: { created_at: 'desc' }
    });

    if (dbState) {
      const parsed = dbState.state;
      await this.redis.set(`session:${sessionId}`, JSON.stringify(parsed), 'EX', 3600);
      this.cache.set(sessionId, parsed);
      return parsed;
    }

    return null;
  }

  // ============================================
  // Обновление состояния
  // ============================================
  async update(
    sessionId: string,
    updates: Partial<SessionState>
  ): Promise<SessionState> {
    // 1. Получить текущее состояние
    const current = await this.getState(sessionId);
    if (!current) throw new SessionNotFoundError(sessionId);

    // 2. Создать новое состояние
    const newState: SessionState = {
      ...current,
      ...updates,
      updatedAt: new Date()
    };

    // 3. Сохранить в L1 (Memory)
    this.cache.set(sessionId, newState);

    // 4. Сохранить в L2 (Redis) с TTL 1 час
    await this.redis.set(
      `session:${sessionId}`,
      JSON.stringify(newState),
      'EX',
      3600
    );

    // 5. Сохранить в L3 (PostgreSQL) — асинхронно
    await this.db.session_states.create({
      data: {
        session_id: sessionId,
        state: newState,
        created_at: new Date()
      }
    });

    return newState;
  }

  // ============================================
  // Откат состояния (Rollback)
  // ============================================
  async rollback(sessionId: string): Promise<void> {
    // 1. Удалить из L1 и L2
    this.cache.delete(sessionId);
    await this.redis.del(`session:${sessionId}`);

    // 2. Загрузить последний снапшот из L3
    const snapshot = await this.db.session_states.findFirst({
      where: { session_id: sessionId },
      orderBy: { created_at: 'desc' },
      skip: 1 // Пропускаем текущий (плохой) снапшот
    });

    if (snapshot) {
      // 3. Восстановить состояние
      this.cache.set(sessionId, snapshot.state);
      await this.redis.set(
        `session:${sessionId}`,
        JSON.stringify(snapshot.state),
        'EX',
        3600
      );
    }
  }
}
```

---

### 2.6. Вспомогательные классы

#### 2.6.1. LockManager (Управление блокировками)

```typescript
class LockManager {
  constructor(private redis: RedisClient) {}

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
    return result === 'OK';
  }

  // Освободить блокировку
  async release(sessionId: string): Promise<void> {
    const key = `lock:${sessionId}`;
    await this.redis.del(key);
  }
}
```

#### 2.6.2. EventLog (Event Sourcing)

```typescript
class EventLog {
  constructor(private db: PrismaClient, private redis: RedisClient) {}

  // Проверка идемпотентности
  async isProcessed(eventId: string): Promise<boolean> {
    const key = `processed:${eventId}`;
    const exists = await this.redis.exists(key);
    return exists === 1;
  }

  // Добавление события
  async append(
    sessionId: string,
    event: PlayerCommand,
    state: SessionState
  ): Promise<void> {
    // 1. Сохранить в PostgreSQL
    await this.db.session_events.create({
      data: {
        session_id: sessionId,
        type: event.type,
        node_id: event.nodeId,
        payload: event,
        created_at: new Date()
      }
    });

    // 2. Отметить как обработанное (Redis, TTL 24 часа)
    await this.redis.set(
      `processed:${event.id}`,
      '1',
      'EX',
      86400
    );
  }

  // Получить события до timestamp
  async getEventsBefore(
    sessionId: string,
    timestamp: number
  ): Promise<SessionEvent[]> {
    const events = await this.db.session_events.findMany({
      where: {
        session_id: sessionId,
        created_at: { lte: new Date(timestamp) }
      },
      orderBy: { created_at: 'asc' }
    });
    return events;
  }
}
```

---

## 3. Поток выполнения (Полная диаграмма)

```
1. Игрок отправляет ответ
   (POST /sessions/:sessionId/answer)
          ↓
2. API Layer принимает запрос
   - Валидирует JWT (если есть)
   - Проверяет существование сессии
          ↓
3. API Layer вызывает EngineOrchestrator.processEvent()
          ↓
4. EngineOrchestrator:
   a. Получает блокировку (LockManager.acquire)
   b. Загружает состояние (StateManager.getState)
   c. Проверяет идемпотентность (EventLog.isProcessed)
          ↓
5. EventProcessor.validate()
   - Проверяет, что событие относится к текущему узлу
   - Валидирует данные в зависимости от типа узла
          ↓
6. RulesEngine.evaluate()
   - Проверяет таймаут
   - Сравнивает ответ с правильным
   - Возвращает transitionType (success/fail/timeout/pending)
          ↓
7. TransitionResolver.resolve()
   - Находит переход по типу
   - Проверяет условия (если есть)
   - Возвращает следующий узел или null (финиш)
          ↓
8. StateManager.update()
   - Обновляет состояние (currentNodeId, score, penalties)
   - Сохраняет в L1 (Memory), L2 (Redis), L3 (PostgreSQL)
          ↓
9. EventLog.append()
   - Сохраняет событие в БД
   - Отмечает как обработанное (Redis)
          ↓
10. EngineOrchestrator:
    a. Отправляет обновление в Realtime Layer (WebSocket)
    b. Освобождает блокировку (LockManager.release)
          ↓
11. API Layer возвращает ответ игроку
    - Новое состояние, следующий узел или финиш
```

---

## 4. Интеграция с API

### 4.1. REST Endpoints, используемые Engine

| Endpoint | Метод | Описание |
| :--- | :--- | :--- |
| `/sessions/:sessionId/answer` | POST | Отправка ответа (вызывает EngineOrchestrator) |
| `/sessions/:sessionId/current` | GET | Получение текущего задания (вызывает StateManager) |
| `/sessions/:sessionId/history` | GET | Получение истории (вызывает EventLog) |
| `/sessions/:sessionId/rewind` | POST | Откат состояния (вызывает EngineOrchestrator.rewind) |

### 4.2. Формат вызова Engine из API

```typescript
// В API Controller
@Post(':sessionId/answer')
async handleAnswer(
  @Param('sessionId') sessionId: string,
  @Body() body: AnswerRequest
) {
  try {
    const result = await this.engineOrchestrator.processEvent(sessionId, {
      id: generateUUID(),
      type: 'PLAYER_ANSWER',
      sessionId,
      nodeId: body.nodeId,
      answer: body.answer,
      answerType: body.answerType,
      metadata: body.metadata,
      timestamp: Date.now()
    });

    return {
      success: true,
      data: result
    };

  } catch (error) {
    if (error instanceof SessionLockedError) {
      return {
        success: false,
        error: {
          code: 'SESSION_LOCKED',
          message: 'Session is being processed'
        }
      };
    }
    throw error;
  }
}
```

---

## 5. Интеграция с БД

### 5.1. Используемые таблицы

| Таблица | Операции | Частота |
| :--- | :--- | :--- |
| `sessions` | SELECT, UPDATE | Каждое событие |
| `session_states` | SELECT, INSERT | Каждое событие (асинхронно) |
| `session_events` | SELECT, INSERT | Каждое событие |
| `scenarios` | SELECT | При загрузке игры |
| `games` | SELECT | При загрузке игры |

### 5.2. Кэширование (Redis)

| Ключ | Содержание | TTL |
| :--- | :--- | :--- |
| `session:{sessionId}` | Текущее состояние сессии | 1 час |
| `lock:{sessionId}` | Блокировка сессии | 30 сек |
| `processed:{eventId}` | Маркер обработанного события | 24 часа |
| `game:{gameId}` | Данные игры | 1 час |
| `scenario:{scenarioId}` | Сценарий игры | 1 час |

---

## 6. Интеграция с Realtime Layer

### 6.1. События, отправляемые Engine

| Событие | Когда отправляется | Содержание |
| :--- | :--- | :--- |
| `STATE_SYNC` | После обновления состояния | Полное состояние сессии |
| `NODE_ENTER` | При переходе на новый узел | Информация о новом узле |
| `NODE_EXIT` | При выходе из узла | Результат выполнения |
| `SCORE_UPDATE` | При изменении счета | Новый счет и причина изменения |
| `GAME_FINISH` | При завершении игры | Финальный счет, время |

### 6.2. Формат отправки

```typescript
// В EngineOrchestrator
await this.realtimeLayer.broadcast(sessionId, {
  type: 'STATE_SYNC',
  payload: {
    sessionId: newState.sessionId,
    currentNodeId: newState.currentNodeId,
    score: newState.score,
    status: newState.status,
    history: newState.history
  }
});
```

---

## 7. Обработка ошибок

### 7.1. Типы ошибок Engine

| Ошибка | Код | HTTP | Описание |
| :--- | :--- | :--- | :--- |
| `SessionNotFoundError` | `SESSION_NOT_FOUND` | 404 | Сессия не найдена |
| `SessionLockedError` | `SESSION_LOCKED` | 409 | Сессия заблокирована другим процессом |
| `InvalidNodeError` | `INVALID_NODE` | 422 | Событие относится к неверному узлу |
| `ValidationError` | `VALIDATION_ERROR` | 422 | Невалидные данные в событии |
| `NodeNotFoundError` | `NODE_NOT_FOUND` | 404 | Узел не найден в сценарии |
| `SessionNotActiveError` | `SESSION_INACTIVE` | 409 | Сессия не в активном статусе |
| `IdempotencyError` | `DUPLICATE_EVENT` | 409 | Дубликат события |

### 7.2. Обработка ошибок в EngineOrchestrator

```typescript
class EngineOrchestrator {
  async processEvent(...) {
    try {
      // ... логика
    } catch (error) {
      // 1. Логирование ошибки
      await this.logger.error(error);

      // 2. Откат состояния (если нужно)
      if (this.isRecoverable(error)) {
        await this.stateManager.rollback(sessionId);
      }

      // 3. Отправка ошибки в Realtime Layer
      await this.realtimeLayer.broadcast(sessionId, {
        type: 'ERROR_OCCURRED',
        payload: {
          code: error.code,
          message: error.message,
          severity: this.getSeverity(error)
        }
      });

      // 4. Проброс ошибки в API Layer
      throw error;
    }
  }
}
```

---

## 8. Итоговый контракт

> **Engine — единственный источник истины.**
>
> **Детерминизм — обязателен.**
>
> **Event Sourcing — обязателен.**
>
> **Все изменения состояния проходят через StateManager.**
>
> **EngineOrchestrator — единственная точка входа.**

---

**Кодовое имя проекта:** Adventure Engine  
**Главный принцип:** *Engine — ядро системы. Все остальное (API, БД, Realtime) — только обертка вокруг Engine.*
```
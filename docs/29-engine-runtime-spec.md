```markdown
# Engine Runtime Specification: Как движок исполняет сценарий

> **Кодовое имя проекта:** Adventure Engine
> **Уровень документа:** Архитектурный / Инженерный
> **Статус:** Утвержден

---

## 1. Принципы

- Движок — единственный источник истины
- Все операции проходят через Engine Orchestrator
- Движок не знает о внешнем мире (БД, API, VK)
- Плагины — единственный способ расширения

---

## 2. Полный поток выполнения

### 2.1. Игрок отправляет ответ

```
1. Игрок отправляет ответ (через WebSocket / VK / API)
   ↓
2. API Gateway принимает запрос
   ↓
3. Проверка аутентификации и авторизации
   ↓
4. Проверка: существует ли сессия?
   ↓
5. Проверка: активна ли сессия?
   ↓
6. Вызов Engine Orchestrator
   ↓
7. Engine Orchestrator:
   a. Проверка блокировки сессии (Lock)
   b. Загрузка состояния сессии
   c. Проверка идемпотентности (дубликат события)
   d. Создание события ANSWER_SUBMITTED
   ↓
8. Event Processor:
   a. Нахождение текущего узла
   b. Получение плагина по типу узла
   c. Валидация ответа (плагин)
   d. Выполнение плагина (execute)
   e. Получение MissionResult
   ↓
9. Rules Engine:
   a. Определение типа перехода (success / fail / timeout)
   b. Нахождение целевого узла
   c. Проверка условий перехода
   ↓
10. State Manager:
    a. Начисление наград (score, items, resources)
    b. Обновление состояния
    c. Создание события ANSWER_ACCEPTED / ANSWER_REJECTED
    d. Создание события NODE_COMPLETED / NODE_FAILED
    ↓
11. Transition Resolver:
    a. Выполнение перехода
    b. Создание события NODE_ASSIGNED
    ↓
12. Engine Orchestrator:
    a. Сохранение всех событий
    b. Сохранение состояния (L1, L2, L3)
    c. Отправка обновления в Realtime Layer
    d. Освобождение блокировки
    ↓
13. API Gateway отправляет ответ игроку
```

---

## 3. Класс EngineOrchestrator

```typescript
class EngineOrchestrator {
  constructor(
    private lockManager: LockManager,
    private eventProcessor: EventProcessor,
    private rulesEngine: RulesEngine,
    private transitionResolver: TransitionResolver,
    private stateManager: StateManager,
    private eventStore: EventStore,
    private realtimeLayer: RealtimeLayer,
    private logger: Logger
  ) {}

  async processAnswer(
    sessionId: string,
    command: AnswerCommand
  ): Promise<AnswerResult> {
    // 1. Блокировка
    const lock = await this.lockManager.acquire(sessionId);
    if (!lock) throw new LockError('Session is locked');

    try {
      // 2. Загрузка состояния
      const state = await this.stateManager.getState(sessionId);
      if (!state) throw new SessionNotFoundError(sessionId);

      // 3. Идемпотентность
      if (await this.eventStore.isProcessed(command.id)) {
        return { status: 'ignored', message: 'Duplicate event' };
      }

      // 4. Создание события
      const submitEvent: Event = {
        id: command.id,
        type: 'ANSWER_SUBMITTED',
        gameId: state.gameId,
        teamId: state.teamId,
        nodeId: state.currentNodeId,
        payload: command.payload,
        timestamp: Date.now(),
        sequence: state.sequence + 1,
        version: 1
      };

      // 5. Обработка события
      const result = await this.eventProcessor.process(submitEvent, state);

      // 6. Обновление состояния
      const newState = await this.stateManager.update(state, result);

      // 7. Сохранение событий
      await this.eventStore.appendMany([
        submitEvent,
        ...result.events
      ]);

      // 8. Отправка обновления
      await this.realtimeLayer.broadcast(sessionId, {
        type: 'STATE_SYNC',
        payload: newState
      });

      // 9. Освобождение блокировки
      await this.lockManager.release(sessionId);

      return {
        status: 'success',
        state: newState,
        nextNode: result.nextNode
      };

    } catch (error) {
      // 10. Ошибка
      await this.lockManager.release(sessionId);
      this.logger.error(error, { sessionId });
      throw error;
    }
  }

  async timeTravel(
    sessionId: string,
    targetEventId: string
  ): Promise<SessionState> {
    const lock = await this.lockManager.acquire(sessionId);
    if (!lock) throw new LockError('Session is locked');

    try {
      // 1. Получить последний снапшот до target
      const snapshot = await this.getSnapshotBefore(sessionId, targetEventId);
      
      // 2. Получить события после снапшота
      const events = await this.eventStore.getEventsAfter(
        sessionId,
        snapshot.timestamp
      );
      
      // 3. Применить события до target
      let state = snapshot.state;
      for (const event of events) {
        if (event.id === targetEventId) break;
        state = await this.applyEvent(state, event);
      }
      
      // 4. Сохранить новое состояние
      await this.stateManager.saveSnapshot(state);

      // 5. Сохранить событие TIME_TRAVEL
      await this.eventStore.append({
        id: uuid(),
        type: 'TIME_TRAVEL',
        gameId: state.gameId,
        teamId: sessionId,
        payload: { targetEventId },
        timestamp: Date.now(),
        sequence: state.sequence + 1,
        version: 1
      });

      await this.lockManager.release(sessionId);
      return state;

    } catch (error) {
      await this.lockManager.release(sessionId);
      throw error;
    }
  }
}
```

---

## 4. Класс EventProcessor

```typescript
class EventProcessor {
  constructor(
    private pluginRegistry: PluginRegistry,
    private rulesEngine: RulesEngine,
    private stateManager: StateManager
  ) {}

  async process(
    event: Event,
    state: SessionState
  ): Promise<ProcessingResult> {
    // 1. Найти текущий узел
    const node = await this.getNode(state.currentNodeId);
    if (!node) throw new NodeNotFoundError(state.currentNodeId);

    // 2. Получить плагин
    const plugin = this.pluginRegistry.get(node.type);
    if (!plugin) throw new PluginNotFoundError(node.type);

    // 3. Валидация конфига
    await plugin.validate(node.config);

    // 4. Выполнение плагина
    const result = await plugin.execute(
      node.config,
      this.createContext(state, event)
    );

    // 5. Создание событий
    const events: Event[] = [];

    if (result.success) {
      events.push({
        id: uuid(),
        type: 'ANSWER_ACCEPTED',
        gameId: state.gameId,
        teamId: state.teamId,
        nodeId: state.currentNodeId,
        payload: { score: result.score },
        timestamp: Date.now(),
        sequence: state.sequence + events.length + 1,
        version: 1
      });

      events.push({
        id: uuid(),
        type: 'NODE_COMPLETED',
        gameId: state.gameId,
        teamId: state.teamId,
        nodeId: state.currentNodeId,
        payload: { score: result.score },
        timestamp: Date.now(),
        sequence: state.sequence + events.length + 1,
        version: 1
      });
    } else {
      events.push({
        id: uuid(),
        type: 'ANSWER_REJECTED',
        gameId: state.gameId,
        teamId: state.teamId,
        nodeId: state.currentNodeId,
        payload: { reason: result.reason },
        timestamp: Date.now(),
        sequence: state.sequence + events.length + 1,
        version: 1
      });

      events.push({
        id: uuid(),
        type: 'NODE_FAILED',
        gameId: state.gameId,
        teamId: state.teamId,
        nodeId: state.currentNodeId,
        payload: { reason: result.reason },
        timestamp: Date.now(),
        sequence: state.sequence + events.length + 1,
        version: 1
      });
    }

    // 6. Определение перехода
    const transitionType = await this.rulesEngine.evaluate(
      node,
      result,
      state
    );

    // 7. Нахождение целевого узла
    const nextNodeId = await this.transitionResolver.resolve(
      node,
      transitionType,
      state
    );

    if (nextNodeId) {
      events.push({
        id: uuid(),
        type: 'NODE_ASSIGNED',
        gameId: state.gameId,
        teamId: state.teamId,
        nodeId: nextNodeId,
        payload: { from: state.currentNodeId },
        timestamp: Date.now(),
        sequence: state.sequence + events.length + 1,
        version: 1
      });
    }

    return {
      success: result.success,
      score: result.score,
      nextNode: nextNodeId,
      events,
      transitionType
    };
  }
}
```

---

## 5. Плагин интерфейс

```typescript
interface MissionPlugin {
  readonly type: string;
  readonly name: string;
  readonly description: string;
  readonly icon: string;
  readonly schema: JSONSchema;

  validate(config: unknown): Promise<boolean>;
  execute(config: unknown, context: ExecutionContext): Promise<MissionResult>;
  serialize(config: unknown): JsonObject;
}

interface ExecutionContext {
  state: SessionState;
  event: Event;
  getAnswer(): string | null;
  getPhoto(): string | null;
  getLocation(): Location | null;
  getInventory(): Inventory;
  getResources(): Resources;
  addItem(item: Item): void;
  hasItem(itemId: string): boolean;
  setResource(name: string, value: number): void;
  getResource(name: string): number;
}

interface MissionResult {
  success: boolean;
  score: number;
  reason?: string;
  next?: string;
  items?: Item[];
  events?: Event[];
}
```

---

## 6. Поток выполнения (диаграмма)

```
┌─────────────────────────────────────────────────────────────────┐
│                     ИГРОК ОТПРАВЛЯЕТ ОТВЕТ                    │
└─────────────────────────────┬───────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     API GATEWAY                                │
│  - Аутентификация                                              │
│  - Авторизация                                                 │
│  - Валидация запроса                                           │
└─────────────────────────────┬───────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    ENGINE ORCHESTRATOR                         │
│  1. Lock (Redis)                                               │
│  2. Загрузка состояния (L1 → L2 → L3)                        │
│  3. Идемпотентность (проверка дубля)                          │
└─────────────────────────────┬───────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      EVENT PROCESSOR                           │
│  1. Найти текущий узел                                         │
│  2. Получить плагин по типу                                    │
│  3. Запустить плагин                                           │
│  4. Получить MissionResult                                     │
└─────────────────────────────┬───────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                       RULES ENGINE                             │
│  1. Определить тип перехода (success / fail / timeout)        │
│  2. Проверить условия                                          │
│  3. Найти целевой узел                                         │
└─────────────────────────────┬───────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                       STATE MANAGER                            │
│  1. Начислить награды (score, items, resources)               │
│  2. Обновить состояние                                         │
│  3. Создать события                                            │
│  4. Сохранить в L1, L2, L3                                    │
└─────────────────────────────┬───────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      REALTIME LAYER                            │
│  1. Отправить обновление игроку                                │
│  2. Освободить блокировку                                      │
└─────────────────────────────────────────────────────────────────┘
```

---

## 7. Snapshot-based Time Travel

```typescript
class TimeTravel {
  async rewind(teamId: string, targetEventId: string): Promise<void> {
    // 1. Получить последний снапшот до target
    const snapshot = await this.getSnapshotBefore(teamId, targetEventId);
    
    // 2. Получить события после снапшота
    const events = await this.eventStore.getEventsAfter(
      teamId,
      snapshot.timestamp
    );
    
    // 3. Применить события до target
    let state = snapshot.state;
    for (const event of events) {
      if (event.id === targetEventId) break;
      state = this.applyEvent(state, event);
    }
    
    // 4. Сохранить новое состояние
    await this.saveState(teamId, state);
  }
}
```

---

## 8. Итоговый контракт

> **Engine Orchestrator — единственная точка входа.**
>
> **Все операции проходят через четкий поток.**
>
> **Плагины — единственный способ расширения.**
>
> **События — основа всех изменений.**

---

**Кодовое имя проекта:** Adventure Engine  
**Главный принцип:** *Четкий поток выполнения — основа надежности.*
```
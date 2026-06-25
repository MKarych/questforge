```markdown
# Execution Model: Scenario → Engine → State

> **Кодовое имя проекта:** Adventure Engine
> **Уровень документа:** Техническое ядро (архитектурный фундамент)
> **Статус:** Утвержден. Изменения только с мажорной версией.

---

## 1. Разделение ответственности

Этот документ фиксирует **единственный источник истины** для всей платформы.

```
┌─────────────────────────────────────────────────────────────┐
│                      SCENARIO (Данные)                     │
│  - JSON/DAG                                                │
│  - Узлы (Nodes) и переходы (Transitions)                   │
│  - Не содержит логики выполнения                            │
└─────────────────────────────┬───────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      GAME ENGINE (Ядро)                    │
│                                                             │
│  ┌────────────────────────────────────────────────────┐    │
│  │               EVENT PROCESSOR                      │    │
│  │  - Принимает события (answer, timer, gps)         │    │
│  │  - Валидирует входные данные                      │    │
│  │  - Вызывает Rules Engine                          │    │
│  └─────────────────────┬──────────────────────────────┘    │
│                        │                                    │
│                        ▼                                    │
│  ┌────────────────────────────────────────────────────┐    │
│  │               RULES ENGINE                         │    │
│  │  - Проверяет условия (success/fail/timeout)       │    │
│  │  - Определяет тип перехода                        │    │
│  │  - Ничего не сохраняет, только вычисляет          │    │
│  └─────────────────────┬──────────────────────────────┘    │
│                        │                                    │
│                        ▼                                    │
│  ┌────────────────────────────────────────────────────┐    │
│  │            TRANSITION RESOLVER                     │    │
│  │  - Находит целевой узел по типу перехода          │    │
│  │  - Учитывает условия (score, time, random)        │    │
│  │  - Возвращает новый узел или null (финиш)         │    │
│  └─────────────────────┬──────────────────────────────┘    │
│                        │                                    │
│                        ▼                                    │
│  ┌────────────────────────────────────────────────────┐    │
│  │             STATE MANAGER                          │    │
│  │  - Единственное место, где меняется состояние      │    │
│  │  - Обновляет currentNodeId, score, penalties      │    │
│  │  - Сохраняет историю событий (Event Sourcing)     │    │
│  │  - Возвращает новое состояние                     │    │
│  └────────────────────────────────────────────────────┘    │
└─────────────────────────────┬───────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      REALTIME LAYER                        │
│  - WebSocket, комнаты, события                             │
│  - Только транспорт, без логики                            │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Scenario (Сценарий)

Статическое описание игры. Создается в **Builder** и сохраняется в БД.

### Формат (упрощенный для MVP)

```json
{
  "id": "scenario-123",
  "version": 1,
  "title": "Ночной дозор",
  "description": "Квест по ночному городу",
  "nodes": [
    {
      "id": "node-1",
      "type": "text",
      "question": "Как называется главная площадь?",
      "answer": "Красная",
      "transitions": [
        { "when": "success", "to": "node-2" }
      ]
    },
    {
      "id": "node-2",
      "type": "code",
      "question": "Найдите код на колонне",
      "answer": "12345",
      "transitions": [
        { "when": "success", "to": "node-3" },
        { "when": "fail", "to": "node-2" }
      ]
    },
    {
      "id": "node-3",
      "type": "photo",
      "question": "Сфотографируйтесь у фонтана",
      "transitions": []
    }
  ],
  "startNodeId": "node-1"
}
```

### Типы узлов (расширяемые)

| Тип | Описание | Валидация |
| :--- | :--- | :--- |
| `text` | Текстовый ответ | Точное совпадение (регистронезависимо) |
| `code` | Числовой/буквенный код | Точное совпадение |
| `photo` | Загрузка фото | Ручная проверка (позже — AI) |
| `gps` | Геолокация | Проверка радиуса |
| `qr` | QR-код | Точное совпадение |
| `choice` | Множественный выбор | Совпадение с вариантом |
| `timer` | Ожидание таймера | Автоматический переход |

### Важно: Transitions вместо nextNodeId

Используем **массив переходов**, а не жесткий `nextNodeId`. Это позволяет:

- Ветвления (success → узел А, fail → узел Б)
- Условные переходы (если score > 100 → секретная ветка)
- Случайные переходы (рандомный выбор)

**Типы условий (when):**
- `"success"` — правильный ответ
- `"fail"` — неправильный ответ
- `"timeout"` — истек таймер
- `"condition"` — пользовательское условие (например, `score > 50`)
- `"random"` — случайный переход

---

## 3. Game Engine (Runtime)

**Единственный источник истины** во время игры.

### Архитектура (4 модуля)

```typescript
// ============================================
// 1. EVENT PROCESSOR
// ============================================
class EventProcessor {
  // Принимает событие, валидирует, вызывает Rules Engine
  process(sessionId: string, event: PlayerEvent): ProcessedEvent {
    // 1. Проверка: есть ли такая сессия?
    // 2. Проверка: активна ли сессия?
    // 3. Проверка: валидны ли данные события?
    // 4. Вызов Rules Engine
    // 5. Возврат результата
  }
}

// ============================================
// 2. RULES ENGINE
// ============================================
class RulesEngine {
  // Проверяет условия и определяет тип перехода
  evaluate(node: Node, event: PlayerEvent, context: SessionContext): TransitionType {
    // 1. В зависимости от типа узла (text/code/photo/gps)
    // 2. Сравнивает ответ с правильным (если есть)
    // 3. Проверяет таймауты, штрафы
    // 4. Возвращает: 'success' | 'fail' | 'timeout'
  }
}

// ============================================
// 3. TRANSITION RESOLVER
// ============================================
class TransitionResolver {
  // Находит целевой узел по типу перехода
  resolve(node: Node, transitionType: TransitionType, context: SessionContext): string | null {
    // 1. Ищет в node.transitions переход с when === transitionType
    // 2. Если есть условие (condition) — проверяет его
    // 3. Возвращает to (ID узла) или null (финиш)
  }
}

// ============================================
// 4. STATE MANAGER
// ============================================
class StateManager {
  // Единственное место, где меняется состояние
  update(sessionId: string, newState: Partial<SessionState>): SessionState {
    // 1. Загружает текущее состояние из БД/кэша
    // 2. Применяет изменения (currentNodeId, score, penalties)
    // 3. Сохраняет событие в историю (Event Sourcing)
    // 4. Сохраняет новое состояние в БД/кэш
    // 5. Возвращает новое состояние
  }
}
```

### Поток выполнения

```
1. Игрок отправляет ответ (Event)
   ↓
2. Event Processor принимает событие
   ↓
3. Rules Engine проверяет правильность
   ↓
4. Transition Resolver находит следующий узел
   ↓
5. State Manager обновляет состояние
   ↓
6. Realtime Layer отправляет новое состояние игроку
```

---

## 4. State (Состояние сессии)

```typescript
interface SessionState {
  sessionId: string;
  teamId: string;
  teamName: string;
  currentNodeId: string;
  score: number;
  penalties: number;
  status: 'active' | 'paused' | 'finished';
  startedAt: Date;
  finishedAt?: Date;
  history: EventLog[];
}
```

---

## 5. Builder (Конструктор)

Инструмент для **создания сценариев** без кода.

- Генерирует **JSON** (Scenario).
- Сохраняет в БД.
- **НЕ ЗНАЕТ**, как исполняется игра.
- **НЕ ЗНАЕТ** про State Machine.

---

## 6. Realtime Layer

Только транспорт.

- WebSocket (Socket.IO)
- Комнаты (по игре/команде)
- События (answer, timer_tick, state_update)

**НЕ СОДЕРЖИТ** логики.

---

## 7. Принципы разработки

1. **Engine — единственный источник истины.**  
   Frontend получает состояние только от Engine.

2. **Builder не знает про Engine.**  
   Он генерирует JSON, который Engine умеет исполнять.

3. **Все события сохраняются.**  
   Это позволяет реализовать Time Travel (откат состояния).

4. **Каждый модуль Engine делает только одну вещь.**  
   Event Processor → Rules Engine → Transition Resolver → State Manager.

5. **Масштабируемость.**  
   Engine — stateless (состояние хранится в БД/Redis). Можно горизонтально масштабировать.

6. **Transitions — основа.**  
   Никаких жестких `nextNodeId`.

---

## 3.5. Engine Orchestrator (Координационный слой) — КРИТИЧЕСКИ ВАЖНО

Без Orchestrator модули Engine будут вызывать друг друга хаотично, что приведет к гонкам и невозможности отката при ошибках.

```
┌─────────────────────────────────────────────────────────────────┐
│                   ENGINE ORCHESTRATOR                         │
│  - Единственная точка входа в Engine                           │
│  - Принимает событие (команду)                                │
│  - Управляет блокировкой сессии (Session Lock)                │
│  - Вызывает Event Processor                                   │
│  - Контролирует атомарность (всё или ничего)                 │
│  - Управляет rollback при ошибке                              │
│  - Отправляет события в Realtime Layer                        │
└─────────────────────────────────────────────────────────────────┘
```

### Принцип работы Orchestrator

```typescript
class EngineOrchestrator {
  async processEvent(sessionId: string, event: Command): Promise<Result> {
    // 1. Получить блокировку сессии (чтобы 2 события не обрабатывались одновременно)
    const lock = await lockManager.acquire(sessionId, this.workerId);
    if (!lock) throw new Error('Session locked by another worker');

    try {
      // 2. Загрузить текущее состояние (из Redis/БД)
      const state = await stateManager.getState(sessionId);

      // 3. Проверить идемпотентность (было ли уже такое событие?)
      if (await eventLog.isProcessed(event.id)) {
        return { status: 'ignored', message: 'Duplicate event' };
      }

      // 4. Вызвать цепочку модулей Engine
      const processed = await eventProcessor.process(event, state);
      const transition = await rulesEngine.evaluate(processed);
      const nextNode = await transitionResolver.resolve(transition);
      const newState = await stateManager.update(sessionId, { 
        currentNodeId: nextNode, 
        score: processed.score 
      });

      // 5. Сохранить событие в лог (Event Sourcing)
      await eventLog.append(sessionId, event, newState);

      // 6. Отправить обновление клиентам (через Realtime)
      await realtimeLayer.broadcast(sessionId, {
        type: 'STATE_SYNC',
        payload: newState
      });

      // 7. Освободить блокировку
      await lockManager.release(sessionId);

      return { status: 'success', state: newState };
    } catch (error) {
      // 8. ROLLBACK: при ошибке откатываем состояние к последнему снапшоту
      await stateManager.rollback(sessionId);
      await lockManager.release(sessionId);
      throw error;
    }
  }
}
```

---

## 7.5. Детерминизм (Правила для Engine)

> **Одинаковый вход → всегда одинаковый выход.**

Это основа для отладки, реплеев и масштабирования.

**Запрещено в Rules Engine:**
- ❌ Использовать `Date.now()` или `new Date()` (время должно приходить извне).
- ❌ Использовать `Math.random()` без фиксированного `seed`.
- ❌ Вызывать внешние API (погода, курс валют) без кэширования результата.

**Разрешено:**
- ✅ Использовать `seed` на основе `sessionId + eventId` для случайных переходов.
- ✅ Передавать `currentTime` как параметр в `evaluate()`.

```typescript
// ✅ Правильно
class RulesEngine {
  evaluate(node: Node, event: Event, context: { currentTime: number }) {
    // Время приходит из Orchestrator
    if (context.currentTime > node.timeout) {
      return 'timeout';
    }
  }
}
```

---

## 7.6. Безопасность: Server-Authoritative Model

**Frontend — никогда не доверяем.**

- Клиент отправляет только **команды** (например, `PLAYER_ANSWER`).
- **ВСЯ** логика проверки (правильность ответа, таймеры, переходы) выполняется ТОЛЬКО в Engine.
- Engine никогда не полагается на `isCorrect` или `score`, присланные с фронтенда.

---

## 7.7. State Replication (Три уровня)

| Уровень | Хранилище | Время жизни | Использование |
| :--- | :--- | :--- | :--- |
| **L1: Memory** | RAM (Node.js) | ~5-15 мин | Активная сессия, быстрый доступ |
| **L2: Redis** | Redis | ~1 час | Кэш для быстрого восстановления |
| **L3: PostgreSQL** | Postgres | Постоянно | Источник истины, аудит, аналитика |

**Правило:** State Manager сначала пишет в L1, синхронизирует с L2 каждые 10 секунд, и сохраняет в L3 при завершении игры.

---

## 7.8. Idempotency (Защита от дублей)

Каждое событие должно обрабатываться **строго один раз**.

```typescript
class EventLog {
  async isProcessed(eventId: string): Promise<boolean> {
    const key = `processed:${eventId}`;
    const exists = await redis.exists(key);
    if (exists) return true;
    
    // Помечаем как обработанное с TTL 24 часа
    await redis.set(key, '1', 'EX', 86400);
    return false;
  }
}
```

**Зачем:** Защита от двойного клика, повторной отправки WebSocket, сетевых ретраев.

---

## 7.9. Связь с Event Contract

Все события, которыми обмениваются Engine и Realtime Layer, **строго соответствуют** типам, описанным в **`docs/11-event-contract-spec.md`**.

- Команды (Client → Engine): `SESSION_CREATE`, `PLAYER_JOIN`, `PLAYER_ANSWER`, `PLAYER_LEAVE`
- События (Engine → Client): `NODE_ENTER`, `NODE_EXIT`, `GAME_FINISH`, `STATE_SYNC`, `ERROR_OCCURRED`

---

## 8. Следующий шаг

Разработать **Game Engine v0**:

- Загрузка Scenario (JSON).
- State Machine (active → узлы → finished).
- Обработка событий (answer).
- Сохранение истории.
- API для получения состояния.

Подробности — в **`docs/07-game-engine-spec.md`**.

---

**Кодовое имя проекта:** Adventure Engine  
**Главный принцип:** *Engine — единственный источник истины. Каждый модуль делает только одну вещь.*
```
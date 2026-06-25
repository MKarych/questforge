```markdown
# Error Model and Recovery: Как система выживает

> **Кодовое имя проекта:** Adventure Engine
> **Уровень документа:** Инженерный контракт
> **Статус:** Утвержден

---

## 1. Принципы

### 1.1. Все ошибки классифицированы
Каждая ошибка имеет тип, код и severity.

### 1.2. Recoverable ошибки не прерывают игру
Если ошибку можно исправить — игрок получает понятное сообщение и продолжает.

### 1.3. Non-recoverable ошибки завершают сессию
Если ошибку нельзя исправить — сессия завершается с понятным объяснением.

### 1.4. Fatal ошибки — это инфраструктура
Ошибки базы данных, Redis, сети — требуют вмешательства DevOps.

### 1.5. Idempotency — обязательна
Каждое событие обрабатывается строго один раз.

---

## 2. Типы ошибок

### 2.1. Recoverable (Можно продолжить)

| Код | HTTP | Описание | Действие |
| :--- | :--- | :--- | :--- |
| `INVALID_ANSWER` | 422 | Неправильный ответ | Отправить ошибку игроку, остаться на том же узле |
| `RATE_LIMIT` | 429 | Слишком много запросов | Задержать ответ, попросить подождать |
| `TIMEOUT` | 408 | Истек таймер | Автоматический переход по timeout |
| `VALIDATION_ERROR` | 422 | Невалидные данные | Отправить ошибку игроку, попросить исправить |
| `SESSION_NOT_ACTIVE` | 409 | Сессия не активна | Отправить ошибку игроку |

### 2.2. Non-recoverable (Сессия сломана)

| Код | HTTP | Описание | Действие |
| :--- | :--- | :--- | :--- |
| `SESSION_NOT_FOUND` | 404 | Сессия не найдена | Завершить сессию, уведомить игрока |
| `SESSION_EXPIRED` | 410 | Сессия истекла | Завершить сессию |
| `NODE_NOT_FOUND` | 404 | Узел не найден | Завершить сессию |
| `SCENARIO_INVALID` | 422 | Сценарий не прошел валидацию | Заблокировать запуск игры |
| `SESSION_CORRUPTED` | 500 | Состояние сессии повреждено | Завершить сессию |

### 2.3. Fatal (Инфраструктура)

| Код | HTTP | Описание | Действие |
| :--- | :--- | :--- | :--- |
| `DB_ERROR` | 503 | Ошибка базы данных | Попробовать reconnect, если не вышло — завершить сессию |
| `REDIS_ERROR` | 503 | Ошибка кэша | Переключиться на DB |
| `LOCK_ERROR` | 503 | Ошибка блокировки | Попробовать повторно |
| `INTERNAL_ERROR` | 500 | Неизвестная ошибка | Завершить сессию, отправить в лог |

---

## 3. Полный список кодов ошибок

```typescript
enum ErrorCode {
  // Recoverable
  INVALID_ANSWER = 'INVALID_ANSWER',
  RATE_LIMIT = 'RATE_LIMIT',
  TIMEOUT = 'TIMEOUT',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  SESSION_NOT_ACTIVE = 'SESSION_NOT_ACTIVE',
  
  // Non-recoverable
  SESSION_NOT_FOUND = 'SESSION_NOT_FOUND',
  SESSION_EXPIRED = 'SESSION_EXPIRED',
  NODE_NOT_FOUND = 'NODE_NOT_FOUND',
  SCENARIO_INVALID = 'SCENARIO_INVALID',
  SESSION_CORRUPTED = 'SESSION_CORRUPTED',
  
  // Fatal
  DB_ERROR = 'DB_ERROR',
  REDIS_ERROR = 'REDIS_ERROR',
  LOCK_ERROR = 'LOCK_ERROR',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
}
```

---

## 4. Recovery flow

### 4.1. Полный flow восстановления

```text
1. Ошибка в Engine
   ↓
2. Engine Orchestrator перехватывает ошибку
   ↓
3. Проверка: recoverable?
   ├─ Да → отправить ошибку игроку, продолжить
   └─ Нет → перейти к recovery
         ↓
4. Проверка: non-recoverable?
   ├─ Да → завершить сессию, уведомить игрока
   └─ Нет → перейти к fatal
         ↓
5. Fatal: инфраструктурная ошибка
   ├─ Попробовать восстановить соединение
   ├─ Если не вышло → завершить сессию
   └─ Отправить в лог для DevOps
```

### 4.2. Реализация в EngineOrchestrator

```typescript
class EngineOrchestrator {
  async processEvent(sessionId: string, event: PlayerCommand): Promise<Result> {
    // 1. Получить блокировку
    const lock = await this.lockManager.acquire(sessionId);
    if (!lock) {
      // Recoverable: можно попробовать позже
      throw new LockError('Session is locked by another worker');
    }

    try {
      // 2. Обработка события
      const result = await this.processEventInternal(sessionId, event);
      
      // 3. Освободить блокировку
      await this.lockManager.release(sessionId);
      
      return result;
      
    } catch (error) {
      // 4. Обработка ошибки
      await this.handleError(sessionId, error);
      
      // 5. Освободить блокировку
      await this.lockManager.release(sessionId);
      
      throw error;
    }
  }
  
  private async handleError(sessionId: string, error: Error): Promise<void> {
    // 1. Логирование
    await this.logger.error(error, { sessionId });
    
    // 2. Классификация
    const errorType = this.classifyError(error);
    
    switch (errorType) {
      case 'recoverable':
        // Отправляем ошибку игроку, но сессия продолжается
        await this.realtimeLayer.broadcast(sessionId, {
          type: 'ERROR_OCCURRED',
          payload: {
            code: error.code,
            message: error.message,
            severity: 'warning'
          }
        });
        break;
        
      case 'non-recoverable':
        // Завершаем сессию
        await this.stateManager.update(sessionId, {
          status: 'finished'
        });
        await this.realtimeLayer.broadcast(sessionId, {
          type: 'GAME_FINISH',
          payload: {
            finalScore: 0,
            totalTime: 0,
            error: error.message
          }
        });
        break;
        
      case 'fatal':
        // Инфраструктурная ошибка
        await this.handleFatalError(sessionId, error);
        break;
    }
  }
}
```

---

## 5. Idempotency (Защита от дублей)

### 5.1. Принцип

> **Каждое событие должно обрабатываться строго один раз.**

### 5.2. Реализация

```typescript
class EventLog {
  async isProcessed(eventId: string): Promise<boolean> {
    const key = `processed:${eventId}`;
    const exists = await this.redis.exists(key);
    if (exists) return true;
    
    // Помечаем как обработанное с TTL 24 часа
    await this.redis.set(key, '1', 'EX', 86400);
    return false;
  }
  
  async append(sessionId: string, event: PlayerCommand, state: SessionState): Promise<void> {
    // Проверка идемпотентности
    if (await this.isProcessed(event.id)) {
      throw new DuplicateEventError(event.id);
    }
    
    // Сохранение в БД
    await this.db.session_events.create({
      data: {
        session_id: sessionId,
        type: event.type,
        node_id: event.nodeId,
        payload: event,
        created_at: new Date()
      }
    });
    
    // Отметка как обработанного (Redis)
    await this.redis.set(`processed:${event.id}`, '1', 'EX', 86400);
  }
}
```

### 5.3. Пример работы

```text
1. Игрок нажимает "Отправить"
   ↓
2. Команда отправлена на сервер (eventId: "evt-001")
   ↓
3. Engine обрабатывает команду
   ↓
4. EventLog помечает "evt-001" как обработанное
   ↓
5. Игрок (по ошибке) нажимает "Отправить" снова
   ↓
6. Engine проверяет: "evt-001" уже обработано
   ↓
7. Возвращает "Duplicate event" без изменения состояния
```

---

## 6. Snapshot restore (Восстановление из снапшота)

### 6.1. Что такое снапшот

Снапшот — это полное состояние сессии в определенный момент времени.

```typescript
interface SessionSnapshot {
  sessionId: string;
  state: SessionState;
  lastEventId: string;
  timestamp: number;
  version: number;
}
```

### 6.2. Когда создается снапшот

| Событие | Частота |
| :--- | :--- |
| После каждого перехода между узлами | Всегда |
| Каждые 10 событий | Всегда |
| При ошибке (перед обработкой события) | Всегда |
| При паузе в игре | По требованию |

### 6.3. Восстановление из снапшота

```typescript
class StateManager {
  async restore(sessionId: string): Promise<SessionState> {
    // 1. Получить последний снапшот
    const snapshot = await this.db.session_states.findFirst({
      where: { session_id: sessionId },
      orderBy: { created_at: 'desc' }
    });
    
    if (!snapshot) {
      throw new SessionNotFoundError(sessionId);
    }
    
    // 2. Получить все события после снапшота
    const events = await this.db.session_events.findMany({
      where: {
        session_id: sessionId,
        created_at: { gt: snapshot.created_at }
      },
      orderBy: { created_at: 'asc' }
    });
    
    // 3. Воспроизвести события
    const state = await this.replayEvents(snapshot.state, events);
    
    // 4. Сохранить восстановленное состояние
    await this.update(sessionId, state);
    
    return state;
  }
}
```

### 6.4. Пример восстановления

```text
1. Сессия "sess-123" работает 2 часа
   ↓
2. Произошла ошибка Redis (fatal)
   ↓
3. State Manager ищет последний снапшот
   ↓
4. Найден снапшот от 14:00 (за 30 минут до ошибки)
   ↓
5. Загружены все события с 14:00 до 14:30
   ↓
6. События воспроизведены детерминированно
   ↓
7. Восстановлено полное состояние на 14:30
   ↓
8. Игра продолжается без потери данных
```

---

## 7. Примеры

### 7.1. Правильная обработка ошибки

```typescript
// ✅ ПРАВИЛЬНО — рековерибл ошибка
class RulesEngine {
  evaluate(node: Node, event: PlayerEvent): TransitionType {
    if (node.type === 'text' && !event.answer) {
      throw new ValidationError('Answer is required for text node');
    }
    // ...
  }
}

// В Orchestrator
try {
  const result = await this.processEventInternal(sessionId, event);
  return result;
} catch (error) {
  if (error instanceof ValidationError) {
    // Recoverable: отправляем ошибку игроку, но сессия продолжается
    await this.realtimeLayer.broadcast(sessionId, {
      type: 'ERROR_OCCURRED',
      payload: {
        code: 'VALIDATION_ERROR',
        message: 'Пожалуйста, заполните поле ответа',
        severity: 'warning'
      }
    });
    return { status: 'error', message: error.message };
  }
  throw error;
}
```

### 7.2. Неправильная обработка ошибки

```typescript
// ❌ ПЛОХО — все ошибки обрабатываются одинаково
try {
  const result = await this.processEventInternal(sessionId, event);
  return result;
} catch (error) {
  // Все ошибки завершают сессию — даже если можно было исправить
  await this.stateManager.update(sessionId, {
    status: 'finished'
  });
  throw error;
}
```

---

## 8. Инструменты для агентов

### 8.1. Класс ErrorHandler

```typescript
class ErrorHandler {
  constructor(
    private logger: Logger,
    private realtimeLayer: RealtimeLayer,
    private stateManager: StateManager
  ) {}

  handle(error: Error, context: ErrorContext): void {
    // 1. Логирование
    this.logger.error(error, context);
    
    // 2. Классификация
    const errorType = this.classify(error);
    
    // 3. Действие в зависимости от типа
    switch (errorType) {
      case 'recoverable':
        this.handleRecoverable(error, context);
        break;
      case 'non-recoverable':
        this.handleNonRecoverable(error, context);
        break;
      case 'fatal':
        this.handleFatal(error, context);
        break;
    }
  }
  
  private classify(error: Error): ErrorType {
    if (error instanceof ValidationError) return 'recoverable';
    if (error instanceof RateLimitError) return 'recoverable';
    if (error instanceof SessionNotFoundError) return 'non-recoverable';
    if (error instanceof DBError) return 'fatal';
    return 'fatal'; // По умолчанию
  }
}
```

### 8.2. Логирование ошибок

```typescript
class Logger {
  error(error: Error, context: ErrorContext): void {
    console.error({
      timestamp: new Date().toISOString(),
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
        code: (error as any).code
      },
      context: {
        sessionId: context.sessionId,
        userId: context.userId,
        eventId: context.eventId
      }
    });
  }
}
```

---

## 9. Мониторинг ошибок

### 9.1. Метрики для мониторинга

| Метрика | Описание | Порог |
| :--- | :--- | :--- |
| `errors_per_minute` | Количество ошибок в минуту | > 10 → алерт |
| `session_crash_rate` | Процент завершенных сессий из-за ошибок | > 5% → алерт |
| `recovery_success_rate` | Процент успешных восстановлений | < 90% → алерт |
| `error_by_type` | Распределение ошибок по типам | Аномалии → алерт |

### 9.2. Интеграция с Grafana

```typescript
class MetricsCollector {
  async trackError(error: Error, context: ErrorContext): Promise<void> {
    const errorType = this.classify(error);
    
    // Отправка метрик в Prometheus
    await this.prometheus.counter('errors_total', {
      type: errorType,
      code: error.code,
      severity: error.severity
    });
  }
}
```

---

## 10. Итоговый контракт

> **Все ошибки классифицированы.**
>
> **Recoverable ошибки не прерывают игру.**
>
> **Idempotency — обязательна.**
>
> **Snapshot создается регулярно.**
>
> **Восстановление — автоматическое.**
>
> **Все ошибки логируются и мониторятся.**

---

**Кодовое имя проекта:** Adventure Engine  
**Главный принцип:** *Система должна выживать. Ошибки — это нормально, если они обрабатываются.*
```
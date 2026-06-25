```markdown
# Engine Determinism Contract: Детерминизм как закон

> **Кодовое имя проекта:** Adventure Engine
> **Уровень документа:** Инженерный контракт (КРИТИЧЕСКИЙ)
> **Статус:** Утвержден. Нарушение = критический баг.

---

## 1. Принцип детерминизма

> **Одинаковый вход → всегда одинаковый выход.**

Это означает, что Engine **обязан** воспроизводить одно и то же состояние при повторном прогоне одних и тех же событий.

### Почему это критически важно

| Причина | Описание |
| :--- | :--- |
| **Отладка** | Баги можно воспроизвести локально, прогнав те же события |
| **Replay** | Можно пересмотреть игру заново, как видеозапись |
| **Аудит** | Можно проверить, что игра прошла честно |
| **Античит** | Можно обнаружить, что клиент подменил данные |
| **Масштабирование** | Можно запускать несколько инстансов Engine с одинаковым результатом |

---

## 2. Что ЗАПРЕЩЕНО (Жесткие запреты)

### ❌ Запрещено: использовать `Date.now()` в Rules Engine

```typescript
// ❌ ПЛОХО — нарушает детерминизм
class RulesEngine {
  evaluate(node: Node, event: Event): TransitionType {
    if (Date.now() > node.timeout) {
      return 'timeout';
    }
  }
}
```

**Почему:** `Date.now()` всегда возвращает разное значение. Невозможно воспроизвести игру.

**Решение:** Время должно приходить из Orchestrator как параметр.

---

### ❌ Запрещено: использовать `Math.random()` без seed

```typescript
// ❌ ПЛОХО — каждый раз разный результат
class RulesEngine {
  evaluate(node: Node, event: Event): TransitionType {
    if (Math.random() > 0.5) {
      return 'success';
    }
    return 'fail';
  }
}
```

**Почему:** `Math.random()` недетерминирован. Невозможно предсказать результат.

**Решение:** Использовать seeded randomness на основе `sessionId + eventId`.

---

### ❌ Запрещено: вызывать внешние API без фиксации результата

```typescript
// ❌ ПЛОХО — внешний API может вернуть разный результат
class RulesEngine {
  async evaluate(node: Node, event: Event): Promise<TransitionType> {
    const weather = await fetchWeather();
    if (weather === 'rain') {
      return 'timeout';
    }
    return 'success';
  }
}
```

**Почему:** Внешний API может вернуть разные данные (погода, курс валют). Невозможно воспроизвести.

**Решение:** Внешние данные должны быть частью сценария или фиксироваться перед началом игры.

---

### ❌ Запрещено: использовать глобальное состояние

```typescript
// ❌ ПЛОХО — глобальное состояние нарушает детерминизм
let totalGames = 0;

class RulesEngine {
  evaluate(node: Node, event: Event): TransitionType {
    if (totalGames > 100) {
      return 'timeout';
    }
    return 'success';
  }
}
```

**Почему:** Глобальное состояние меняется между запусками.

**Решение:** Все зависимости должны передаваться через контекст.

---

## 3. Что РАЗРЕШЕНО (Правильные подходы)

### ✅ Разрешено: использовать seeded randomness

```typescript
// ✅ ХОРОШО — детерминированный рандом
class RulesEngine {
  evaluate(
    node: Node,
    event: Event,
    context: { seed: string }
  ): TransitionType {
    const hash = this.createHash(context.seed + node.id);
    const random = parseInt(hash.substring(0, 8), 16) / 0xFFFFFFFF;
    
    if (random > 0.5) {
      return 'success';
    }
    return 'fail';
  }
  
  private createHash(input: string): string {
    return crypto.createHash('sha256').update(input).digest('hex');
  }
}
```

**Почему:** При одинаковом `seed` результат всегда одинаковый.

---

### ✅ Разрешено: передавать время из Orchestrator

```typescript
// ✅ ХОРОШО — время приходит из Orchestrator
class RulesEngine {
  evaluate(
    node: Node,
    event: Event,
    context: { currentTime: number }
  ): TransitionType {
    if (context.currentTime > node.timeout) {
      return 'timeout';
    }
    return 'success';
  }
}
```

**Почему:** Время фиксировано в контексте. При повторном запуске с тем же временем — тот же результат.

---

### ✅ Разрешено: кэшировать внешние данные

```typescript
// ✅ ХОРОШО — внешние данные кэшируются и фиксируются
class RulesEngine {
  private weatherCache: Map<string, string> = new Map();

  evaluate(
    node: Node,
    event: Event,
    context: { weather: string } // weather приходит из контекста
  ): TransitionType {
    if (context.weather === 'rain') {
      return 'timeout';
    }
    return 'success';
  }
}
```

**Почему:** Внешние данные становятся частью контекста, а не запрашиваются каждый раз.

---

### ✅ Разрешено: использовать контекст для всех внешних зависимостей

```typescript
// ✅ ХОРОШО — все зависимости в контексте
interface EngineContext {
  currentTime: number;
  seed: string;
  weather: string;
  currencyRate: number;
  // ... все, что может меняться
}

class RulesEngine {
  evaluate(
    node: Node,
    event: Event,
    context: EngineContext
  ): TransitionType {
    // Все зависит от контекста, который фиксирован
    if (context.currentTime > node.timeout) {
      return 'timeout';
    }
    return 'success';
  }
}
```

**Почему:** Контекст сохраняется с игрой. При повторном запуске контекст тот же → результат тот же.

---

## 4. Seeded Randomness (Детерминированная случайность)

### 4.1. Принцип работы

```typescript
class SeededRandom {
  private seed: string;
  
  constructor(seed: string) {
    this.seed = seed;
  }
  
  // Генерирует число от 0 до 1
  next(): number {
    const hash = crypto.createHash('sha256');
    hash.update(this.seed);
    const digest = hash.digest('hex');
    this.seed = digest; // Обновляем seed для следующего вызова
    return parseInt(digest.substring(0, 8), 16) / 0xFFFFFFFF;
  }
  
  // Генерирует целое число в диапазоне [min, max]
  nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }
  
  // Выбирает случайный элемент из массива
  pick<T>(array: T[]): T {
    return array[this.nextInt(0, array.length - 1)];
  }
}
```

### 4.2. Использование в Engine

```typescript
class RulesEngine {
  evaluate(
    node: Node,
    event: Event,
    context: { sessionId: string; eventId: string }
  ): TransitionType {
    // Создаем seed на основе sessionId + eventId + nodeId
    const seed = `${context.sessionId}:${context.eventId}:${node.id}`;
    const random = new SeededRandom(seed);
    
    // Теперь результат всегда предсказуем для одинаковых входных данных
    if (random.next() > 0.5) {
      return 'success';
    }
    return 'fail';
  }
}
```

---

## 5. Replay Mode (Воспроизведение)

### 5.1. Принцип работы

```typescript
class ReplayEngine {
  async replay(
    sessionId: string,
    events: SessionEvent[],
    context: EngineContext
  ): Promise<SessionState> {
    // 1. Создаем пустое состояние
    let state = this.createInitialState(sessionId);
    
    // 2. Создаем копию Engine с фиксированным контекстом
    const engine = this.createEngine(context);
    
    // 3. Последовательно обрабатываем все события
    for (const event of events) {
      // 3a. Восстанавливаем узел
      const node = await this.getNode(event.nodeId);
      
      // 3b. Вызываем Rules Engine (детерминированно)
      const transitionType = engine.rulesEngine.evaluate(node, event, context);
      
      // 3c. Вызываем Transition Resolver
      const nextNodeId = engine.transitionResolver.resolve(node, transitionType, state);
      
      // 3d. Обновляем состояние
      state = engine.stateManager.applyTransition(state, {
        nextNodeId,
        scoreDelta: transitionType === 'success' ? 10 : 0,
        penaltyDelta: transitionType === 'fail' ? 1 : 0
      });
    }
    
    return state;
  }
}
```

### 5.2. Использование

```typescript
// Получить все события сессии
const events = await eventLog.getEvents(sessionId);

// Зафиксировать контекст (время, seed, внешние данные)
const context = {
  currentTime: session.startedAt,
  seed: sessionId,
  weather: 'sunny' // было зафиксировано в начале игры
};

// Воспроизвести игру
const replayedState = await replayEngine.replay(sessionId, events, context);

// Проверить, что состояние совпадает
assert(replayedState.score === originalState.score);
assert(replayedState.currentNodeId === originalState.currentNodeId);
```

---

## 6. Pure function rule

### 6.1. Правило

> **Все функции в Engine должны быть чистыми (pure functions).**

**Чистая функция:**
- ✅ Всегда возвращает одинаковый результат для одинаковых аргументов
- ✅ Не имеет побочных эффектов (side effects)
- ✅ Не изменяет внешнее состояние

```typescript
// ✅ Чистая функция
function evaluate(node: Node, event: Event, context: EngineContext): TransitionType {
  // Все зависит только от аргументов
  if (context.currentTime > node.timeout) {
    return 'timeout';
  }
  return 'success';
}
```

**Побочные эффекты (side effects):**
- Сохранение в БД
- Отправка событий в WebSocket
- Запись в файл
- Изменение глобальных переменных

### 6.2. Где разрешены побочные эффекты

| Компонент | Можно иметь побочные эффекты |
| :--- | :--- |
| Engine Orchestrator | ✅ (сохранение в БД, отправка событий) |
| State Manager | ✅ (сохранение в БД/Redis) |
| Event Log | ✅ (сохранение в БД) |
| Event Processor | ❌ (только валидация) |
| Rules Engine | ❌ (только вычисления) |
| Transition Resolver | ❌ (только поиск) |

---

## 7. Примеры

### 7.1. Правильный детерминированный код

```typescript
// ✅ ПРАВИЛЬНО — детерминированный Rules Engine
class RulesEngine {
  evaluate(
    node: Node,
    event: PlayerEvent,
    context: {
      currentTime: number;
      seed: string;
    }
  ): TransitionType {
    // Проверка таймаута
    if (node.timeout && context.currentTime > node.timeout) {
      return 'timeout';
    }
    
    // Проверка ответа
    switch (node.type) {
      case 'text':
      case 'code':
      case 'qr':
        return event.answer === node.answer ? 'success' : 'fail';
      
      case 'choice':
        return event.answer === node.correctOption ? 'success' : 'fail';
      
      case 'gps':
        const distance = this.calculateDistance(event, node);
        return distance <= node.radius ? 'success' : 'fail';
      
      case 'photo':
        return 'pending'; // Требуется ручная проверка
      
      default:
        return 'success';
    }
  }
}
```

### 7.2. Неправильный недетерминированный код

```typescript
// ❌ ПЛОХО — недетерминированный Rules Engine
class RulesEngine {
  evaluate(node: Node, event: PlayerEvent): TransitionType {
    // ❌ Использует Date.now() — недетерминизм
    if (Date.now() > node.timeout) {
      return 'timeout';
    }
    
    // ❌ Использует Math.random() — недетерминизм
    if (node.type === 'choice' && Math.random() > 0.5) {
      return 'success';
    }
    
    // ❌ Вызывает внешнее API — недетерминизм
    const weather = fetchWeather();
    if (weather === 'rain') {
      return 'timeout';
    }
    
    return 'success';
  }
}
```

---

## 8. Инструменты для агентов

### 8.1. Класс ReplayEngine

```typescript
class ReplayEngine {
  constructor(
    private rulesEngine: RulesEngine,
    private transitionResolver: TransitionResolver,
    private stateManager: StateManager
  ) {}
  
  async replay(
    sessionId: string,
    events: SessionEvent[],
    context: EngineContext
  ): Promise<ReplayResult> {
    const startTime = Date.now();
    let state = this.createInitialState(sessionId);
    const processedEvents: ProcessedEvent[] = [];
    
    for (const event of events) {
      const node = await this.getNode(event.nodeId);
      
      // Детерминированная обработка
      const transitionType = this.rulesEngine.evaluate(node, event, context);
      const nextNodeId = this.transitionResolver.resolve(node, transitionType, state);
      
      state = this.stateManager.applyTransition(state, {
        nextNodeId,
        scoreDelta: transitionType === 'success' ? 10 : 0,
        penaltyDelta: transitionType === 'fail' ? 1 : 0
      });
      
      processedEvents.push({
        event,
        transitionType,
        state: { ...state }
      });
    }
    
    return {
      finalState: state,
      processedEvents,
      duration: Date.now() - startTime,
      eventsCount: events.length
    };
  }
}
```

### 8.2. Проверка детерминизма в тестах

```typescript
// ✅ ХОРОШО — тест на детерминизм
describe('Engine Determinism', () => {
  it('should produce same result for same events', async () => {
    const events = getTestEvents();
    const context = getTestContext();
    
    // Первый прогон
    const result1 = await replayEngine.replay('session-1', events, context);
    
    // Второй прогон (те же данные)
    const result2 = await replayEngine.replay('session-1', events, context);
    
    // Результаты должны быть идентичными
    expect(result1.finalState.score).toBe(result2.finalState.score);
    expect(result1.finalState.currentNodeId).toBe(result2.finalState.currentNodeId);
    expect(result1.finalState.penalties).toBe(result2.finalState.penalties);
  });
});
```

---

## 9. Итоговый контракт

> **Engine — детерминированная система.**
>
> **Одинаковый вход → одинаковый выход.**
>
> **Replay mode — обязателен.**
>
> **Нарушение детерминизма = критический баг.**
>
> **Все внешние зависимости передаются через контекст.**

---

**Кодовое имя проекта:** Adventure Engine  
**Главный принцип:** *Детерминизм — это не опция, это закон. Без него система превращается в черный ящик.*
```
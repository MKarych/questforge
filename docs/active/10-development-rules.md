```markdown
# Development Rules: Строгий контракт для агентов

> **Кодовое имя проекта:** Adventure Engine
> **Уровень документа:** Инженерный контракт (ОБЯЗАТЕЛЕН)
> **Статус:** Утвержден. Нарушение = переработка кода.

---

## 1. Главный принцип

> **Engine — единственный источник истины.**
>
> Никакая часть системы (фронтенд, сокеты, база данных) не должна содержать игровую логику.

---

## 2. Что ЗАПРЕЩЕНО (Жесткие запреты)

### ❌ Запрещено: писать бизнес-логику в Realtime Layer

```typescript
// ❌ ПЛОХО — логика в сокете
socket.on('answer', (data) => {
  if (data.answer === 'Красная') {
    // ... проверка здесь
  }
});
```

**Правило:** Realtime Layer — только транспорт. Никакой логики.

---

### ❌ Запрещено: хранить состояние игры во Frontend

```typescript
// ❌ ПЛОХО — состояние на клиенте
const [currentNode, setCurrentNode] = useState();
const [score, setScore] = useState(0);
```

**Правило:** Frontend получает состояние только от Engine. Никакого локального состояния игры.

---

### ❌ Запрещено: использовать `any` в TypeScript

```typescript
// ❌ ПЛОХО
function processEvent(event: any) { ... }
```

**Правило:** Всегда указывайте типы. Используйте `unknown` если тип неизвестен.

---

### ❌ Запрещено: делать Engine монолитным

```typescript
// ❌ ПЛОХО — один класс на всё
class GameEngine {
  handleAnswer() { ... }
  validateAnswer() { ... }
  findTransition() { ... }
  updateState() { ... }
}
```

**Правило:** Engine делится на 5 модулей: Orchestrator, EventProcessor, RulesEngine, TransitionResolver, StateManager.

---

### ❌ Запрещено: использовать `Date.now()` в Rules Engine

```typescript
// ❌ ПЛОХО — нарушает детерминизм
if (Date.now() > node.timeout) {
  return 'timeout';
}
```

**Правило:** Время передается из Orchestrator как параметр.

---

### ❌ Запрещено: использовать `Math.random()` без seed

```typescript
// ❌ ПЛОХО — каждый раз разный результат
if (Math.random() > 0.5) {
  return 'success';
}
```

**Правило:** Используйте seeded randomness на основе `sessionId + eventId`.

---

### ❌ Запрещено: доверять данным с фронтенда

```typescript
// ❌ ПЛОХО — доверяем клиенту
const isCorrect = event.payload.isCorrect;
```

**Правило:** Вся логика проверки выполняется только в Engine. Клиент отправляет только сырые данные.

---

### ❌ Запрещено: менять Event Contract без версионирования

```typescript
// ❌ ПЛОХО — меняем структуру без версии
interface PlayerAnswerPayload {
  answer: string;
  // добавляем новое поле без версии
  metadata: { lat: number; lng: number; };
}
```

**Правило:** Изменение структуры = новая версия контракта.

---

### ❌ Запрещено: обращаться к БД напрямую из Engine

```typescript
// ❌ ПЛОХО — прямой запрос в БД
class EngineOrchestrator {
  async processEvent() {
    const game = await prisma.games.findUnique({ ... });
  }
}
```

**Правило:** Engine работает через StateManager, который абстрагирует доступ к данным.

---

### ❌ Запрещено: игнорировать идемпотентность

```typescript
// ❌ ПЛОХО — нет проверки на дубликат
async processEvent(event) {
  // Обрабатываем событие без проверки
}
```

**Правило:** Каждое событие должно проверяться на дубликат через `EventLog.isProcessed()`.

---

## 3. Что ОБЯЗАНО (Жесткие требования)

### ✅ Обязано: делить Engine на 5 модулей

```
EngineOrchestrator → EventProcessor → RulesEngine → TransitionResolver → StateManager
```

**Правило:** Каждый модуль делает только одну вещь.

---

### ✅ Обязано: использовать Transitions вместо nextNodeId

```json
// ✅ ХОРОШО
"transitions": [
  { "when": "success", "to": "node-2" },
  { "when": "fail", "to": "node-1" }
]
```

**Правило:** Никаких жестких `nextNodeId`. Только массив переходов.

---

### ✅ Обязано: сохранять все события (Event Sourcing)

```typescript
// ✅ ХОРОШО — сохраняем каждое событие
await eventLog.append(sessionId, command, newState);
```

**Правило:** Все события сохраняются в `session_events`. Это основа для Time Travel.

---

### ✅ Обязано: делать Engine stateless

```typescript
// ✅ ХОРОШО — состояние хранится в БД/Redis
class StateManager {
  async getState(sessionId: string): Promise<SessionState> {
    return await redis.get(`session:${sessionId}`);
  }
}
```

**Правило:** Engine не хранит состояние в памяти между запросами.

---

### ✅ Обязано: писать тесты (> 80% покрытия)

```typescript
// ✅ ХОРОШО — юнит-тест для Rules Engine
describe('RulesEngine', () => {
  it('should return success for correct text answer', () => {
    const result = rulesEngine.evaluate(textNode, event);
    expect(result).toBe('success');
  });
});
```

**Правило:** Покрытие Engine > 80%. Остальных модулей > 60%.

---

### ✅ Обязано: использовать typed events

```typescript
// ✅ ХОРОШО — строго типизированное событие
interface PlayerAnswerEvent extends BaseEvent {
  type: 'PLAYER_ANSWER';
  payload: PlayerAnswerPayload;
}
```

**Правило:** Все события соответствуют `11-event-contract-spec.md`.

---

### ✅ Обязано: валидировать сценарии ДО запуска

```typescript
// ✅ ХОРОШО — валидация перед запуском
const validation = await scenarioValidator.validate(scenario);
if (!validation.valid) {
  throw new ValidationError(validation.errors);
}
```

**Правило:** Сценарий не может быть запущен без прохождения валидации.

---

### ✅ Обязано: использовать блокировки (Lock) для сессий

```typescript
// ✅ ХОРОШО — блокировка перед обработкой
const lock = await lockManager.acquire(sessionId);
if (!lock) throw new LockError();
try {
  // обработка события
} finally {
  await lockManager.release(sessionId);
}
```

**Правило:** Каждая сессия блокируется на время обработки события.

---

### ✅ Обязано: возвращать понятные ошибки

```typescript
// ✅ ХОРОШО — понятная ошибка с кодом
throw new SessionNotFoundError(sessionId);
// { code: 'SESSION_NOT_FOUND', message: 'Session not found' }
```

**Правило:** Все ошибки имеют код и понятное сообщение.

---

### ✅ Обязано: документировать API (Swagger/OpenAPI)

```typescript
// ✅ ХОРОШО — документированный эндпоинт
@Post(':sessionId/answer')
@ApiOperation({ summary: 'Send answer to current node' })
@ApiResponse({ status: 200, type: AnswerResponse })
async handleAnswer(...) { ... }
```

**Правило:** Все публичные API документируются.

---

## 4. Где писать логику (Таблица ответственности)

| Компонент | Можно | Нельзя |
| :--- | :--- | :--- |
| **Engine Orchestrator** | Управлять блокировками, координировать модули, управлять транзакциями | Не содержит бизнес-логики |
| **Event Processor** | Валидировать входные данные, подготавливать событие | Не проверяет условия переходов |
| **Rules Engine** | Проверять условия, определять тип перехода | Не сохраняет состояние |
| **Transition Resolver** | Находить целевой узел, проверять условия переходов | Не изменяет состояние |
| **State Manager** | Обновлять состояние, сохранять в БД/кэш | Не проверяет условия |
| **Realtime Layer** | Передавать данные, управлять комнатами | Любая логика |
| **Frontend** | Отображать состояние, отправлять команды | Любая логика |
| **Builder (Конструктор)** | Генерировать JSON (Scenario) | Не знает про Engine |

---

## 5. Как выглядит правильный код (Примеры)

### ✅ Правильно: модуль делает одну вещь

```typescript
// ✅ ПРАВИЛЬНО — каждый модуль отвечает за свою зону
class EventProcessor {
  constructor(
    private rulesEngine: RulesEngine,
    private transitionResolver: TransitionResolver,
    private stateManager: StateManager
  ) {}

  async process(sessionId: string, event: PlayerCommand): Promise<ProcessingResult> {
    // 1. Валидация
    const session = await this.stateManager.getState(sessionId);
    if (!session) throw new SessionNotFoundError(sessionId);

    // 2. Вызов Rules Engine
    const transitionType = await this.rulesEngine.evaluate(
      session.currentNode,
      event
    );

    // 3. Вызов Transition Resolver
    const nextNodeId = await this.transitionResolver.resolve(
      session.currentNode,
      transitionType,
      session
    );

    // 4. Вызов State Manager
    const newState = await this.stateManager.update(sessionId, {
      currentNodeId: nextNodeId,
      score: session.score + (transitionType === 'success' ? 10 : 0)
    });

    return { state: newState, transitionType };
  }
}
```

---

### ✅ Правильно: детерминированный Rules Engine

```typescript
// ✅ ПРАВИЛЬНО — время приходит извне
class RulesEngine {
  evaluate(
    node: Node,
    event: PlayerEvent,
    context: { currentTime: number }
  ): TransitionType {
    if (context.currentTime > node.timeout) {
      return 'timeout';
    }
    // ... остальная логика
  }
}
```

---

### ✅ Правильно: идемпотентность

```typescript
// ✅ ПРАВИЛЬНО — проверка на дубликат
class EngineOrchestrator {
  async processEvent(sessionId: string, event: PlayerCommand) {
    // Проверка идемпотентности
    if (await this.eventLog.isProcessed(event.id)) {
      return { status: 'ignored', message: 'Duplicate event' };
    }
    // ... остальная логика
  }
}
```

---

## 6. Как выглядит ошибка архитектуры (Примеры)

### ❌ Ошибка: всё в одном классе

```typescript
// ❌ ОШИБКА — всё в одном классе
class GameService {
  async handleAnswer(sessionId: string, answer: string) {
    const session = await this.prisma.session.findUnique({ ... });
    const node = await this.prisma.node.findUnique({ ... });
    
    if (answer === node.answer) {
      session.score += 10;
      session.currentNodeId = node.nextNodeId;
      await this.prisma.session.update({ ... });
      this.socket.emit('state_update', session);
    } else {
      session.penalties += 1;
      await this.prisma.session.update({ ... });
      this.socket.emit('error', 'Неверный ответ');
    }
  }
}
```

**Проблемы:**
- Логика в одном классе
- Смешаны: валидация, правила, переходы, сохранение, транспорт
- Нельзя тестировать по частям
- Нельзя масштабировать

---

### ❌ Ошибка: логика на клиенте

```typescript
// ❌ ОШИБКА — логика на фронтенде
const handleAnswer = async (answer: string) => {
  const isCorrect = answer === 'Красная';
  if (isCorrect) {
    setScore(score + 10);
    setCurrentNode(nextNode);
  } else {
    setError('Неверный ответ');
  }
};
```

**Проблема:** Клиент сам проверяет ответ, а не Engine.

---

### ❌ Ошибка: недетерминированный Rules Engine

```typescript
// ❌ ОШИБКА — использует Date.now()
class RulesEngine {
  evaluate(node: Node, event: Event): TransitionType {
    if (Date.now() > node.timeout) { // ❌
      return 'timeout';
    }
  }
}
```

**Проблема:** Невозможно воспроизвести игру.

---

## 7. Тесты

### 7.1. Требования к покрытию

| Модуль | Минимальное покрытие |
| :--- | :--- |
| Engine (все 5 модулей) | > 80% |
| API (NestJS) | > 60% |
| Builder (конструктор) | > 50% |
| Frontend | > 40% |

### 7.2. Виды тестов

| Вид | Описание | Инструмент |
| :--- | :--- | :--- |
| **Unit tests** | Тестирование отдельных функций | Jest |
| **Integration tests** | Тестирование связей модулей | Jest + Supertest |
| **E2E tests** | Полный цикл (API → Engine → БД) | Jest + Supertest |
| **Performance tests** | Нагрузочное тестирование | K6 (опционально) |

### 7.3. Пример теста

```typescript
// ✅ ХОРОШО — юнит-тест Rules Engine
describe('RulesEngine', () => {
  let rulesEngine: RulesEngine;

  beforeEach(() => {
    rulesEngine = new RulesEngine();
  });

  it('should return success for correct text answer', () => {
    const node = { type: 'text', answer: 'Красная' };
    const event = { answer: 'Красная' };
    const result = rulesEngine.evaluate(node, event);
    expect(result).toBe('success');
  });

  it('should return fail for incorrect text answer', () => {
    const node = { type: 'text', answer: 'Красная' };
    const event = { answer: 'Синяя' };
    const result = rulesEngine.evaluate(node, event);
    expect(result).toBe('fail');
  });
});
```

---

## 8. Git

### 8.1. Ветки

```
main          → production
develop       → development
feature/*     → новые фичи
fix/*         → исправление багов
hotfix/*      → срочные исправления
```

### 8.2. Коммиты

```
feat(engine): добавлен Rules Engine
fix(api): исправлена валидация ответа
docs(readme): обновлена документация
test(engine): добавлены тесты для TransitionResolver
refactor(engine): разделен GameEngine на модули
```

### 8.3. Pull Request

- Минимум 1 ревью перед мержем
- Все тесты должны проходить
- Описание PR с контекстом изменений

---

## 9. Документация

| Что обновлять | Когда |
| :--- | :--- |
| `README.md` | При изменении стратегии |
| `01-vision-and-mission.md` | При смене курса |
| `04-execution-model.md` | При изменении архитектуры Engine |
| `05-api-specification.md` | При изменении API |
| `06-database-schema.md` | При изменении схемы БД |
| `07-game-engine-spec.md` | При изменении логики Engine |
| `08-mvp-roadmap.md` | При изменении плана |
| `09-ux-guidelines.md` | При изменении дизайна |
| `10-development-rules.md` | При изменении правил |
| `11-event-contract-spec.md` | При изменении событий |

---

## 10. Итоговый контракт

> **Любой код, который нарушает эти правила, будет отклонен на ревью.**
>
> **Engine — единственный источник истины.**
> **Builder — только JSON.**
> **Realtime Layer — только транспорт.**
> **Frontend — только отображение.**

---

**Кодовое имя проекта:** Adventure Engine  
**Главный принцип:** *Жесткие правила — залог стабильной системы. Нарушение правил = переработка кода.*
```
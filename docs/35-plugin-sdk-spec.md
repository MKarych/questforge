```markdown
# Plugin SDK Specification: SDK для разработчиков плагинов

> **Кодовое имя проекта:** Adventure Engine
> **Уровень документа:** Инженерный
> **Статус:** Утвержден

---

## 1. Принципы

- Плагины регистрируются в движке
- Плагины выполняются в изолированной среде
- Плагины имеют ограничения по ресурсам
- SDK версионируется

---

## 2. Версии

```typescript
const SDK_VERSION = '1.0.0';
const ENGINE_VERSION = '1.0.0';
```

---

## 3. Интерфейс плагина

```typescript
interface MissionPlugin {
  // Метаданные
  readonly type: string;
  readonly name: string;
  readonly description: string;
  readonly icon: string;
  readonly version: string;
  readonly author: string;

  // Схема конфига
  readonly schema: JSONSchema;

  // Методы
  validate(config: unknown): Promise<ValidationResult>;
  execute(config: unknown, context: ExecutionContext): Promise<MissionResult>;
  serialize(config: unknown): JsonObject;
  deserialize(data: JsonObject): unknown;
}
```

---

## 4. Контекст выполнения

```typescript
interface ExecutionContext {
  // Доступ к состоянию
  getState(): SessionState;
  getTeam(): Team;
  getGame(): Game;

  // Доступ к данным
  getAnswer(): string | null;
  getPhoto(): string | null;
  getLocation(): Location | null;
  getInventory(): Inventory;
  getResources(): Resources;

  // Мутации
  addItem(item: Item): void;
  removeItem(itemId: string): void;
  hasItem(itemId: string): boolean;
  setResource(name: string, value: number): void;
  getResource(name: string): number;
  addScore(amount: number): void;
  addPenalty(amount: number): void;

  // Время
  getCurrentTime(): number;
  getElapsedTime(): number;

  // Логирование
  log(message: string, level?: LogLevel): void;

  // Ограничения
  getRemainingTime(): number;
  getMaxIterations(): number;
}
```

---

## 5. Результат выполнения

```typescript
interface MissionResult {
  success: boolean;
  score: number;
  reason?: string;
  next?: string;
  items?: Item[];
  events?: Event[];
}

interface ValidationResult {
  valid: boolean;
  errors?: ValidationError[];
}
```

---

## 6. Ограничения плагинов

### 6.1. Временные ограничения

| Ограничение | Значение |
| :--- | :--- |
| Максимальное время выполнения | 5 секунд |
| Максимальное количество итераций | 1000 |

### 6.2. Память

| Ограничение | Значение |
| :--- | :--- |
| Максимальный размер данных | 1 MB |
| Максимальный размер ответа | 100 KB |

### 6.3. Запрещенные операции

```typescript
// ❌ Запрещено
// - Доступ к файловой системе
// - Сетевые запросы
// - Доступ к БД напрямую
// - Генерация случайных чисел без seed
// - Использование Date.now() (использовать context.getCurrentTime())
// - Бесконечные циклы
// - Рекурсия без ограничений
```

---

## 7. Регистрация плагина

```typescript
class PluginRegistry {
  private plugins: Map<string, MissionPlugin> = new Map();

  register(plugin: MissionPlugin): void {
    // 1. Проверка версии
    if (plugin.version !== SDK_VERSION) {
      throw new Error(`Plugin version mismatch: ${plugin.version} != ${SDK_VERSION}`);
    }

    // 2. Проверка типа
    if (this.plugins.has(plugin.type)) {
      throw new Error(`Plugin ${plugin.type} already registered`);
    }

    // 3. Валидация схемы
    if (!plugin.schema) {
      throw new Error(`Plugin ${plugin.type} missing schema`);
    }

    // 4. Регистрация
    this.plugins.set(plugin.type, plugin);
  }

  get(type: string): MissionPlugin | undefined {
    return this.plugins.get(type);
  }

  getAll(): MissionPlugin[] {
    return Array.from(this.plugins.values());
  }
}
```

---

## 8. Пример плагина (полный)

```typescript
class TextMissionPlugin implements MissionPlugin {
  readonly type = 'TEXT_MISSION';
  readonly name = 'Текстовый ответ';
  readonly description = 'Игрок вводит текстовый ответ';
  readonly icon = '📝';
  readonly version = SDK_VERSION;
  readonly author = 'Adventure Engine Team';

  readonly schema = {
    type: 'object',
    required: ['validation'],
    properties: {
      validation: {
        type: 'object',
        required: ['answers'],
        properties: {
          mode: { type: 'string', enum: ['exact', 'regex', 'contains'] },
          answers: { type: 'array', items: { type: 'string' } }
        }
      },
      rewards: {
        type: 'object',
        properties: {
          score: { type: 'number' }
        }
      },
      penalties: {
        type: 'object',
        properties: {
          score: { type: 'number' }
        }
      }
    }
  };

  async validate(config: unknown): Promise<ValidationResult> {
    // Валидация с помощью AJV
    return { valid: true };
  }

  async execute(config: any, context: ExecutionContext): Promise<MissionResult> {
    const answer = context.getAnswer();
    if (!answer) {
      return { success: false, reason: 'No answer provided' };
    }

    const isCorrect = config.validation.answers.some(
      (a: string) => a.toLowerCase() === answer.toLowerCase()
    );

    if (isCorrect) {
      if (config.rewards?.score) {
        context.addScore(config.rewards.score);
      }
      return {
        success: true,
        score: config.rewards?.score || 0
      };
    } else {
      if (config.penalties?.score) {
        context.addPenalty(config.penalties.score);
      }
      return {
        success: false,
        score: config.penalties?.score || 0,
        reason: 'Incorrect answer'
      };
    }
  }

  serialize(config: unknown): JsonObject {
    return config as JsonObject;
  }

  deserialize(data: JsonObject): unknown {
    return data;
  }
}
```

---

## 9. Sandbox (изолированная среда)

```typescript
class PluginSandbox {
  async execute(
    plugin: MissionPlugin,
    config: unknown,
    context: ExecutionContext
  ): Promise<MissionResult> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Plugin execution timeout (5s)'));
      }, 5000);

      try {
        // Выполнение плагина с ограничениями
        const result = await plugin.execute(config, context);
        clearTimeout(timeout);
        resolve(result);
      } catch (error) {
        clearTimeout(timeout);
        reject(error);
      }
    });
  }
}
```

---

## 10. Версионирование плагинов

```typescript
const SDK_VERSION = '1.0.0';
const ENGINE_VERSION = '1.0.0';

interface PluginManifest {
  type: string;
  name: string;
  version: string;
  engineVersion: string;
  author: string;
  description: string;
  icon: string;
}

class PluginVersionChecker {
  checkCompatibility(plugin: MissionPlugin): boolean {
    // Проверка совместимости версий
    if (plugin.version !== SDK_VERSION) {
      return false;
    }
    return true;
  }
}
```

---

## 11. Тестирование плагинов

```typescript
class PluginTester {
  async test(plugin: MissionPlugin, testCases: TestCase[]): Promise<TestResult[]> {
    const results: TestResult[] = [];

    for (const testCase of testCases) {
      try {
        // 1. Валидация
        await plugin.validate(testCase.config);

        // 2. Выполнение
        const context = this.createMockContext(testCase);
        const result = await plugin.execute(testCase.config, context);

        // 3. Проверка результата
        const passed = this.assertResult(result, testCase.expected);

        results.push({
          name: testCase.name,
          passed,
          result,
          expected: testCase.expected
        });
      } catch (error) {
        results.push({
          name: testCase.name,
          passed: false,
          error: error.message
        });
      }
    }

    return results;
  }
}
```

---

## 12. Итоговый контракт

> **Плагины регистрируются в движке.**
>
> **Плагины выполняются в изолированной среде.**
>
> **Плагины версионируются.**
>
> **Плагины тестируются.**

---

**Кодовое имя проекта:** Adventure Engine  
**Главный принцип:** *Плагины — источник расширяемости.*
```

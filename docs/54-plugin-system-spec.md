```markdown
# 54. Plugin System Spec: Плагинная архитектура

> **Дата:** 24.06.2026  
> **Статус:** Утвержден  
> **Версия:** 1.0  
> **Класс:** Архитектурный контракт (10/10)  
> **Цель:** Описать систему плагинов для расширения функциональности движка.

---

## 1. Принципы

1. **Все типы миссий — плагины.** Каждая миссия (text, code, photo, gps, qr, choice, collect, dialogue) — отдельный плагин.
2. **Плагины регистрируются в движке.** Новые плагины добавляются без изменения ядра.
3. **Плагины имеют чёткий интерфейс.** Validate, Execute, Serialize, Deserialize.
4. **Маркетплейс плагинов.** Авторы могут продавать плагины (сложные типы миссий, интеграции с AI, AR и т.д.).

---

## 2. Интерфейс плагина

```typescript
interface MissionPlugin {
  id: string;
  name: string;
  description: string;
  type: MissionType;
  icon: string;
  version: string;

  // Схема конфига (JSON Schema)
  configSchema: any;

  // Валидация конфига
  validate(config: any): ValidationResult;

  // Выполнение миссии
  execute(context: ExecutionContext, config: any): MissionResult;

  // Сериализация (для JSON контракта)
  serialize(config: any): any;

  // Десериализация
  deserialize(data: any): any;
}
3. Контекст выполнения
typescript
interface ExecutionContext {
  sessionId: string;
  teamId: string;
  team: Team;
  state: State;
  variables: Record<string, any>;
  inventory: Inventory;

  getAnswer(): any;
  getPhoto(): string | null;
  getLocation(): { lat: number; lng: number } | null;

  addScore(amount: number): void;
  addMoney(amount: number): void;
  addItem(item: Item): void;
  hasItem(itemId: string): boolean;
  setVariable(name: string, value: any): void;
  getVariable(name: string): any;
}
4. Результат выполнения
typescript
interface MissionResult {
  success: boolean;
  score: number;
  message?: string;
  rewards?: Reward[];
  nextSceneId?: string;
}
5. Регистрация плагинов
typescript
class PluginRegistry {
  private plugins: Map<string, MissionPlugin> = new Map();

  register(plugin: MissionPlugin): void {
    if (this.plugins.has(plugin.id)) {
      throw new Error(`Plugin ${plugin.id} already registered`);
    }
    this.plugins.set(plugin.id, plugin);
  }

  get(id: string): MissionPlugin | undefined {
    return this.plugins.get(id);
  }

  getAll(): MissionPlugin[] {
    return Array.from(this.plugins.values());
  }
}
6. Пример плагина: TextMission
typescript
class TextMissionPlugin implements MissionPlugin {
  id = 'text-mission';
  name = 'Текстовое задание';
  description = 'Проверка текстового ответа';
  type = 'text';
  icon = '📝';
  version = '1.0.0';

  configSchema = {
    type: 'object',
    required: ['answer'],
    properties: {
      answer: { type: 'string' },
      caseSensitive: { type: 'boolean', default: false },
    }
  };

  validate(config: any): ValidationResult {
    if (!config.answer || typeof config.answer !== 'string') {
      return { valid: false, errors: ['Answer is required'] };
    }
    return { valid: true };
  }

  execute(context: ExecutionContext, config: any): MissionResult {
    const userAnswer = context.getAnswer();
    const correctAnswer = config.answer;
    const caseSensitive = config.caseSensitive || false;

    const isCorrect = caseSensitive
      ? userAnswer === correctAnswer
      : userAnswer.toLowerCase() === correctAnswer.toLowerCase();

    if (isCorrect) {
      context.addScore(10);
      return { success: true, score: 10, message: '✅ Правильно!' };
    } else {
      return { success: false, score: 0, message: '❌ Неправильно' };
    }
  }

  serialize(config: any): any {
    return config;
  }

  deserialize(data: any): any {
    return data;
  }
}
7. Маркетплейс плагинов
typescript
interface PluginListing {
  id: string;
  pluginId: string;
  name: string;
  description: string;
  price: number;
  authorId: string;
  rating: number;
  downloads: number;
  createdAt: Date;
}
8. Архитектурные правила
Плагины не зависят от ядра. Только через интерфейс.

Плагины изолированы. Ошибка в плагине не ломает ядро.

Плагины версионируются. Каждый плагин имеет свою версию.

Плагины можно обновлять. Без перезапуска движка.

Плагины можно продавать. Через маркетплейс.

Дата: 24.06.2026
Статус: Утвержден
Класс: Архитектурный контракт (10/10)
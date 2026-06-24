```markdown
# 51. Scenario JSON Contract: Контракт между редактором и движком

> **Дата:** 24.06.2026  
> **Статус:** Утвержден  
> **Версия:** 1.0  
> **Класс:** Архитектурный контракт (10/10)  
> **Цель:** Описать JSON-схему сценария, которую генерирует редактор и исполняет Runtime Engine.

---

## 1. Принципы

1. **Единый контракт.** Редактор → JSON → Runtime Engine.
2. **Версионирование.** Каждая версия JSON имеет номер.
3. **Обратная совместимость.** Старые сценарии работают с новым движком.
4. **Расширяемость.** Новые типы сцен и миссий добавляются без изменения схемы.
5. **Миграции.** Поддерживается автоматическая миграция между версиями.

---

## 2. Корневая схема

```typescript
interface ScenarioDefinition {
  version: string; // "1.0"
  metadata: ScenarioMetadata;
  scenes: SceneDefinition[];
  variables: VariableDefinition[];
  rewards: RewardDefinition[];
  permissions: PermissionDefinition[];
  triggers: TriggerDefinition[];
}
3. Метаданные
typescript
interface ScenarioMetadata {
  id: string;
  name: string;
  description: string;
  authorId: string;
  city?: string;
  duration?: number; // в минутах
  difficulty?: 'easy' | 'medium' | 'hard';
  tags: string[];
  createdAt: string;
  updatedAt: string;
}
4. Сцены (Scenes)
typescript
interface SceneDefinition {
  id: string;
  type: 'start' | 'finish' | 'location' | 'quiz' | 'dialogue' | 'game' | 'slide';
  title: string;
  description: string;
  missions: MissionDefinition[];
  transitions: TransitionDefinition[];
  view: ViewDefinition;
  metadata: {
    gps?: { lat: number; lng: number; radius: number };
    timer?: number;
    requiredRole?: string;
  };
}
5. Миссии (Missions)
typescript
interface MissionDefinition {
  id: string;
  type: 'text' | 'code' | 'photo' | 'gps' | 'qr' | 'choice' | 'collect' | 'dialogue';
  title: string;
  description: string;
  config: MissionConfig;
  rewards: RewardRef[];
  hints: string[];
}
6. Переходы (Transitions)
typescript
interface TransitionDefinition {
  id: string;
  from: string; // sceneId
  to: string; // sceneId
  condition: ConditionGroup;
  label?: string;
}
7. Переменные (Variables)
typescript
interface VariableDefinition {
  id: string;
  name: string;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  defaultValue: any;
  scope: 'local' | 'global';
}
8. Награды (Rewards)
typescript
interface RewardDefinition {
  id: string;
  type: 'score' | 'money' | 'item' | 'achievement' | 'variable' | 'experience';
  payload: any;
}
9. Условия (Conditions) — AST
typescript
interface ConditionGroup {
  operator: 'AND' | 'OR';
  conditions: (SingleCondition | ConditionGroup)[];
}

interface SingleCondition {
  type: 'variable' | 'score' | 'inventory' | 'flag' | 'role' | 'time';
  operator: 'eq' | 'ne' | 'gt' | 'lt' | 'gte' | 'lte' | 'contains' | 'has';
  left: string | number | boolean;
  right: string | number | boolean;
}
10. Триггеры (Triggers)
typescript
interface TriggerDefinition {
  id: string;
  event: string;
  conditions: ConditionGroup;
  actions: Action[];
}
11. Миграции (Migrations)
typescript
interface ScenarioMigration {
  from: string; // "1.0"
  to: string; // "1.1"
  migrate(data: any): any;
}
Пример миграции:

typescript
{
  from: "1.0",
  to: "1.1",
  migrate: (data) => {
    // Добавить новое поле
    data.metadata.difficulty = 'medium';
    // Добавить пустой массив триггеров
    data.triggers = [];
    return data;
  }
}
12. Пример полного JSON
json
{
  "version": "1.0",
  "metadata": {
    "id": "scenario-001",
    "name": "Ночной дозор",
    "description": "Автоквест по ночному городу",
    "authorId": "user-123",
    "city": "Минск",
    "duration": 180,
    "difficulty": "medium",
    "tags": ["автоквест", "ночной"],
    "createdAt": "2026-06-24T12:00:00Z",
    "updatedAt": "2026-06-24T12:00:00Z"
  },
  "scenes": [
    {
      "id": "scene-start",
      "type": "start",
      "title": "Начало",
      "description": "Добро пожаловать в игру!",
      "missions": [],
      "transitions": [
        {
          "id": "transition-1",
          "from": "scene-start",
          "to": "scene-1",
          "condition": { "operator": "AND", "conditions": [] },
          "label": "Начать"
        }
      ],
      "view": {
        "type": "card",
        "config": {
          "background": "#0F1117",
          "layout": "vertical",
          "interactive": false
        }
      },
      "metadata": {}
    }
  ],
  "variables": [
    {
      "id": "var-score",
      "name": "score",
      "type": "number",
      "defaultValue": 0,
      "scope": "local"
    }
  ],
  "rewards": [],
  "permissions": [],
  "triggers": []
}
13. Валидация JSON
typescript
function validateScenario(json: any): ValidationResult {
  // Проверка версии
  // Проверка обязательных полей
  // Проверка типов
  // Проверка ссылок (переходы ведут к существующим сценам)
  // Проверка циклов
}
Дата: 24.06.2026
Статус: Утвержден
Класс: Архитектурный контракт (10/10)
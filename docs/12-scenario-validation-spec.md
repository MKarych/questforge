
```markdown
# Scenario Validation Spec: Формальная валидация сценариев

> **Кодовое имя проекта:** Adventure Engine
> **Уровень документа:** Инженерный контракт
> **Статус:** Утвержден

---

## 1. Принципы

### 1.1. Сценарий не может быть запущен без валидации
Никаких исключений. Сценарий должен пройти валидацию ДО того, как попадет в Engine.

### 1.2. Валидация — отдельный модуль
Валидатор не зависит от Engine. Он может работать отдельно (в Builder, в CI/CD).

### 1.3. Два уровня валидации
- Schema Validation (структура JSON)
- Runtime Validation (логика графа)

### 1.4. Ошибки валидации блокируют публикацию
Сценарий с ошибками не может быть опубликован в маркетплейсе или запущен.

### 1.5. Валидация возвращает понятные ошибки
Ошибки с кодами, полями и понятными сообщениями.

---

## 2. Два уровня валидации

```
Scenario JSON
     ↓
┌─────────────────────────────────────────────────────────────┐
│  [1. Schema Validation]  ← статическая проверка структуры  │
│  - Все поля на месте                                      │
│  - Правильные типы                                        │
│  - Обязательные поля заполнены                            │
└─────────────────────────────┬───────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  [2. Runtime Validation]  ← логическая проверка графа     │
│  - Все ссылки ведут в существующие узлы                   │
│  - Нет бесконечных циклов                                 │
│  - Нет orphan nodes (недостижимых узлов)                  │
│  - Все fail paths обработаны                              │
└─────────────────────────────┬───────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  [3. Compiled Scenario]  ← готов к запуску в Engine      │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. Schema Validation (Статическая)

### 3.1. Проверка структуры

```typescript
interface ScenarioSchema {
  id: string;                 // required
  version: number;            // required, >= 1
  name: string;               // required, min 3 chars
  description?: string;       // optional
  nodes: NodeSchema[];        // required, min 1 node
  startNodeId: string;        // required
}
```

### 3.2. Проверка узлов (NodeSchema)

```typescript
interface NodeSchema {
  id: string;                 // required, уникальный
  type: NodeType;             // required, из списка разрешенных
  question: string;           // required, min 3 chars
  answer?: string;            // required для text/code/qr
  transitions: Transition[];  // required, массив
  timer?: number;             // optional, в секундах
  penalty?: number;           // optional, штрафные очки
  hint?: string;              // optional, подсказка
  mediaUrls?: string[];       // optional, ссылки на медиа
  options?: string[];         // optional, для choice-узлов
  lat?: number;               // optional, для gps
  lng?: number;               // optional, для gps
  radius?: number;            // optional, для gps (в метрах)
}
```

### 3.3. Проверки Schema

| Проверка | Код ошибки | Описание |
| :--- | :--- | :--- |
| ✅ `id` уникальны | `ERR_DUPLICATE_NODE_ID` | Нет дубликатов ID |
| ✅ `startNodeId` существует | `ERR_MISSING_START_NODE` | Точка входа есть в списке узлов |
| ✅ Все `transitions.to` ссылаются на существующие узлы | `ERR_BROKEN_TRANSITION` | Нет битых ссылок |
| ✅ Для `text`/`code`/`qr` заполнен `answer` | `ERR_MISSING_ANSWER` | Есть правильный ответ |
| ✅ Для `text` заполнен `question` | `ERR_EMPTY_QUESTION` | Есть текст вопроса |
| ✅ Для `choice` заполнены `options` (>= 2) | `ERR_MISSING_OPTIONS` | Есть варианты выбора |
| ✅ Для `gps` заполнены `lat`, `lng`, `radius` | `ERR_MISSING_GPS_DATA` | Есть координаты и радиус |
| ✅ `type` из списка разрешенных | `ERR_UNKNOWN_NODE_TYPE` | Только разрешенные типы |
| ✅ `timer` > 0 (если есть) | `ERR_INVALID_TIMER` | Таймер больше 0 |
| ✅ `penalty` >= 0 (если есть) | `ERR_INVALID_PENALTY` | Штраф не отрицательный |

### 3.4. Разрешенные типы узлов

| Тип | Описание | Обязательные поля |
| :--- | :--- | :--- |
| `text` | Текстовый ответ | `question`, `answer` |
| `code` | Числовой/буквенный код | `question`, `answer` |
| `photo` | Загрузка фото | `question` |
| `gps` | Геолокация | `question`, `lat`, `lng`, `radius` |
| `qr` | QR-код | `question`, `answer` |
| `choice` | Множественный выбор | `question`, `options` |
| `timer` | Ожидание таймера | `question`, `timer` |

---

## 4. Runtime Validation (Логическая)

### 4.1. Проверки графа

| Проверка | Код ошибки | Описание |
| :--- | :--- | :--- |
| ✅ Нет бесконечных циклов | `ERR_INFINITE_LOOP` | Граф должен завершаться |
| ✅ Нет недостижимых узлов | `ERR_ORPHAN_NODE` | Все узлы достижимы из start |
| ✅ Нет dead-end без финала | `ERR_DEAD_END` | Узел без переходов = финиш |
| ✅ Все `fail` paths обработаны | `ERR_UNHANDLED_FAIL` | Если есть fail, должен быть переход |
| ✅ Таймеры имеют `timeout` переход | `ERR_NO_TIMEOUT_TRANSITION` | Для таймеров нужен timeout |

### 4.2. Проверка достижимости

```typescript
function checkReachability(nodes: Node[], startNodeId: string): ValidationResult {
  const visited = new Set<string>();
  const queue = [startNodeId];
  
  while (queue.length > 0) {
    const nodeId = queue.shift()!;
    if (visited.has(nodeId)) continue;
    visited.add(nodeId);
    
    const node = nodes.find(n => n.id === nodeId);
    if (!node) continue;
    
    for (const transition of node.transitions) {
      if (transition.to && !visited.has(transition.to)) {
        queue.push(transition.to);
      }
    }
  }
  
  // Проверяем, что все узлы достижимы
  const orphanNodes = nodes.filter(n => !visited.has(n.id));
  if (orphanNodes.length > 0) {
    return {
      valid: false,
      errors: orphanNodes.map(n => ({
        code: 'ERR_ORPHAN_NODE',
        nodeId: n.id,
        message: `Node "${n.id}" is unreachable from start node`
      }))
    };
  }
  
  return { valid: true };
}
```

### 4.3. Проверка циклов

```typescript
function checkCycles(nodes: Node[], startNodeId: string): ValidationResult {
  const visited = new Set<string>();
  const recursionStack = new Set<string>();
  
  function dfs(nodeId: string): boolean {
    if (recursionStack.has(nodeId)) {
      return true; // Цикл найден
    }
    if (visited.has(nodeId)) {
      return false;
    }
    
    visited.add(nodeId);
    recursionStack.add(nodeId);
    
    const node = nodes.find(n => n.id === nodeId);
    if (node) {
      for (const transition of node.transitions) {
        if (transition.to && dfs(transition.to)) {
          return true;
        }
      }
    }
    
    recursionStack.delete(nodeId);
    return false;
  }
  
  if (dfs(startNodeId)) {
    return {
      valid: false,
      errors: [{
        code: 'ERR_INFINITE_LOOP',
        message: 'Scenario contains an infinite loop'
      }]
    };
  }
  
  return { valid: true };
}
```

### 4.4. Проверка обработки fail

```typescript
function checkFailHandling(nodes: Node[]): ValidationResult {
  const errors: ValidationError[] = [];
  
  for (const node of nodes) {
    const hasFailTransition = node.transitions.some(t => t.when === 'fail');
    const hasSuccessTransition = node.transitions.some(t => t.when === 'success');
    
    // Если есть fail-переход, он должен вести куда-то
    if (hasFailTransition) {
      const failTransition = node.transitions.find(t => t.when === 'fail');
      if (!failTransition?.to) {
        errors.push({
          code: 'ERR_UNHANDLED_FAIL',
          nodeId: node.id,
          message: `Node "${node.id}" has fail transition but no target`
        });
      }
    }
  }
  
  return errors.length > 0 
    ? { valid: false, errors }
    : { valid: true };
}
```

---

## 5. Ошибки валидации (Полный список)

### 5.1. Schema Validation Errors

| Код | Severity | Описание |
| :--- | :--- | :--- |
| `ERR_DUPLICATE_NODE_ID` | error | Дубликат ID узла |
| `ERR_MISSING_START_NODE` | error | startNodeId не существует |
| `ERR_BROKEN_TRANSITION` | error | Переход ведет в несуществующий узел |
| `ERR_MISSING_ANSWER` | error | Для text/code/qr отсутствует answer |
| `ERR_EMPTY_QUESTION` | error | Отсутствует question |
| `ERR_MISSING_OPTIONS` | error | Для choice отсутствуют options |
| `ERR_MISSING_GPS_DATA` | error | Для gps отсутствуют координаты |
| `ERR_UNKNOWN_NODE_TYPE` | error | Неизвестный тип узла |
| `ERR_INVALID_TIMER` | error | Таймер <= 0 |
| `ERR_INVALID_PENALTY` | error | Штраф < 0 |

### 5.2. Runtime Validation Errors

| Код | Severity | Описание |
| :--- | :--- | :--- |
| `ERR_INFINITE_LOOP` | error | Граф содержит бесконечный цикл |
| `ERR_ORPHAN_NODE` | warning | Узел недостижим из start |
| `ERR_DEAD_END` | warning | Узел без переходов (кроме финиша) |
| `ERR_UNHANDLED_FAIL` | error | fail-переход не обработан |
| `ERR_NO_TIMEOUT_TRANSITION` | warning | Таймер без timeout перехода |

### 5.3. Формат ошибки

```typescript
interface ValidationError {
  code: string;
  nodeId?: string;      // ID узла, где произошла ошибка
  field?: string;       // Поле, где произошла ошибка
  message: string;      // Понятное сообщение
  severity: 'error' | 'warning';
}
```

---

## 6. Pre-execution compiler step

```typescript
class ScenarioValidator {
  // ============================================
  // Полная валидация сценария
  // ============================================
  validate(scenario: Scenario): ValidationResult {
    // 1. Schema validation
    const schemaErrors = this.validateSchema(scenario);
    if (schemaErrors.length > 0) {
      return { 
        valid: false, 
        errors: schemaErrors,
        compiled: null
      };
    }
    
    // 2. Runtime validation
    const runtimeErrors = this.validateRuntime(scenario);
    if (runtimeErrors.length > 0) {
      return { 
        valid: false, 
        errors: runtimeErrors,
        compiled: null
      };
    }
    
    // 3. Подготовка к Engine
    const compiled = this.compile(scenario);
    
    return { 
      valid: true, 
      errors: [],
      compiled
    };
  }
  
  // ============================================
  // Schema validation
  // ============================================
  private validateSchema(scenario: Scenario): ValidationError[] {
    const errors: ValidationError[] = [];
    
    // Проверка: id уникальны
    const ids = scenario.nodes.map(n => n.id);
    const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);
    for (const id of duplicates) {
      errors.push({
        code: 'ERR_DUPLICATE_NODE_ID',
        nodeId: id,
        message: `Duplicate node ID: "${id}"`,
        severity: 'error'
      });
    }
    
    // Проверка: startNodeId существует
    if (!scenario.nodes.some(n => n.id === scenario.startNodeId)) {
      errors.push({
        code: 'ERR_MISSING_START_NODE',
        message: `Start node "${scenario.startNodeId}" not found`,
        severity: 'error'
      });
    }
    
    // Проверка: все transitions ведут к существующим узлам
    for (const node of scenario.nodes) {
      for (const transition of node.transitions) {
        if (transition.to && !scenario.nodes.some(n => n.id === transition.to)) {
          errors.push({
            code: 'ERR_BROKEN_TRANSITION',
            nodeId: node.id,
            field: 'transitions.to',
            message: `Transition from "${node.id}" points to non-existent node "${transition.to}"`,
            severity: 'error'
          });
        }
      }
    }
    
    // ... остальные проверки
    return errors;
  }
  
  // ============================================
  // Runtime validation
  // ============================================
  private validateRuntime(scenario: Scenario): ValidationError[] {
    const errors: ValidationError[] = [];
    
    // Проверка: все узлы достижимы
    const reachable = this.getReachableNodes(scenario);
    const orphanNodes = scenario.nodes.filter(n => !reachable.has(n.id));
    for (const node of orphanNodes) {
      errors.push({
        code: 'ERR_ORPHAN_NODE',
        nodeId: node.id,
        message: `Node "${node.id}" is unreachable from start`,
        severity: 'warning'
      });
    }
    
    // Проверка: нет бесконечных циклов
    if (this.hasCycle(scenario)) {
      errors.push({
        code: 'ERR_INFINITE_LOOP',
        message: 'Scenario contains an infinite loop',
        severity: 'error'
      });
    }
    
    // Проверка: все fail paths обработаны
    for (const node of scenario.nodes) {
      const hasFail = node.transitions.some(t => t.when === 'fail');
      const hasFailTarget = node.transitions.some(t => t.when === 'fail' && t.to);
      if (hasFail && !hasFailTarget) {
        errors.push({
          code: 'ERR_UNHANDLED_FAIL',
          nodeId: node.id,
          message: `Node "${node.id}" has fail transition but no target`,
          severity: 'error'
        });
      }
    }
    
    return errors;
  }
  
  // ============================================
  // Compilation (подготовка для Engine)
  // ============================================
  private compile(scenario: Scenario): CompiledScenario {
    return {
      id: scenario.id,
      version: scenario.version,
      name: scenario.name,
      nodes: scenario.nodes.map(node => ({
        ...node,
        // Добавляем индексы для быстрого поиска
        index: scenario.nodes.indexOf(node)
      })),
      startNodeId: scenario.startNodeId,
      // Карта для быстрого доступа по ID
      nodeMap: scenario.nodes.reduce((acc, node) => {
        acc[node.id] = node;
        return acc;
      }, {} as Record<string, Node>)
    };
  }
}
```

---

## 7. Примеры

### 7.1. Правильный сценарий (валидация проходит)

```json
{
  "id": "scenario-123",
  "version": 1,
  "name": "Ночной дозор",
  "nodes": [
    {
      "id": "node-1",
      "type": "text",
      "question": "Как называется главная площадь?",
      "answer": "Красная",
      "transitions": [{ "when": "success", "to": "node-2" }]
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

**Результат:** `{ valid: true, errors: [] }`

---

### 7.2. Сценарий с ошибкой (валидация не проходит)

```json
{
  "id": "scenario-123",
  "version": 1,
  "name": "Сценарий с ошибками",
  "nodes": [
    {
      "id": "node-1",
      "type": "text",
      "question": "Как называется главная площадь?",
      "transitions": [{ "when": "success", "to": "node-2" }]
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
  "startNodeId": "node-100" // ❌ не существует
}
```

**Результат:**
```json
{
  "valid": false,
  "errors": [
    {
      "code": "ERR_MISSING_ANSWER",
      "nodeId": "node-1",
      "message": "Node \"node-1\" is missing required field \"answer\"",
      "severity": "error"
    },
    {
      "code": "ERR_MISSING_START_NODE",
      "message": "Start node \"node-100\" not found",
      "severity": "error"
    }
  ]
}
```

---

### 7.3. Сценарий с циклами (валидация не проходит)

```json
{
  "id": "scenario-123",
  "version": 1,
  "name": "Сценарий с циклом",
  "nodes": [
    {
      "id": "node-1",
      "type": "text",
      "question": "Начало",
      "answer": "start",
      "transitions": [{ "when": "success", "to": "node-2" }]
    },
    {
      "id": "node-2",
      "type": "text",
      "question": "Цикл",
      "answer": "loop",
      "transitions": [{ "when": "success", "to": "node-1" }]
    }
  ],
  "startNodeId": "node-1"
}
```

**Результат:**
```json
{
  "valid": false,
  "errors": [
    {
      "code": "ERR_INFINITE_LOOP",
      "message": "Scenario contains an infinite loop",
      "severity": "error"
    }
  ]
}
```

---

## 8. Интеграция с Builder и Engine

### 8.1. В Builder (при сохранении)

```typescript
// При сохранении сценария в Builder
async function saveScenario(scenario: Scenario): Promise<void> {
  // 1. Валидация
  const result = await scenarioValidator.validate(scenario);
  
  if (!result.valid) {
    // Показываем ошибки пользователю
    throw new ValidationError(result.errors);
  }
  
  // 2. Сохраняем в БД
  await scenarioRepository.save(scenario);
}
```

### 8.2. В Engine (при старте игры)

```typescript
// При старте игры
async function startGame(gameId: string): Promise<void> {
  const scenario = await scenarioRepository.get(gameId);
  
  // 1. Проверка валидации (если не была сохранена)
  const result = await scenarioValidator.validate(scenario);
  if (!result.valid) {
    throw new InvalidScenarioError(result.errors);
  }
  
  // 2. Используем compiled сценарий
  const compiled = result.compiled;
  await engine.startSession(compiled);
}
```

---

## 9. Итоговый контракт

> **Сценарий не может быть опубликован или запущен без прохождения валидации.**
>
> **Валидация отделена от Engine.**
>
> **Ошибки валидации блокируют запуск.**
>
> **Валидация — это защита от глупых ошибок авторов.**

---

**Кодовое имя проекта:** Adventure Engine  
**Главный принцип:** *Лучше отклонить сценарий при создании, чем разбираться с багами во время игры.*
```

```markdown
# Validation Specification: Правила проверки сценариев

> **Кодовое имя проекта:** Adventure Engine
> **Уровень документа:** Инженерный
> **Статус:** Утвержден

---

## 1. Принципы

- Сценарий должен быть валидным ДО запуска
- Валидация в реальном времени (в редакторе)
- Ошибки блокируют публикацию
- Предупреждения — рекомендации

---

## 2. Типы ошибок

### 2.1. Критические ошибки (блокируют публикацию)

| Код | Описание | Пример |
| :--- | :--- | :--- |
| `ERR_NO_START` | Отсутствует START узел | Нет точки входа |
| `ERR_MULTIPLE_START` | Более одного START узла | 2 START узла |
| `ERR_BROKEN_EDGE` | Переход в несуществующий узел | Переход в `node_999` |
| `ERR_INFINITE_LOOP` | Бесконечный цикл | A → B → A |
| `ERR_EMPTY_SCENARIO` | Пустой сценарий | Нет узлов |

### 2.2. Предупреждения (рекомендации)

| Код | Описание | Пример |
| :--- | :--- | :--- |
| `WARN_NO_FINISH` | Отсутствует FINISH узел | Нет конца игры |
| `WARN_ORPHAN_NODE` | Узел недостижим | Узел не связан с START |
| `WARN_NO_HINTS` | Нет подсказок у задания | Узлы без подсказок |
| `WARN_NO_TIMEOUT` | Нет таймаута у задания | Узел без таймаута |

---

## 3. Правила валидации

### 3.1. Структурные правила

```typescript
// 1. Сценарий должен иметь START узел
// 2. Сценарий должен иметь FINISH узел (опционально)
// 3. Узлы должны иметь уникальные ID
// 4. Узлы должны иметь тип
// 5. Узлы должны иметь заголовок
// 6. Узлы должны иметь описание
```

### 3.2. Правила графа

```typescript
// 1. Все узлы достижимы из START
// 2. Нет бесконечных циклов
// 3. Все переходы ведут к существующим узлам
// 4. Нет узлов без переходов (кроме FINISH)
```

### 3.3. Правила данных

```typescript
// 1. TEXT_MISSION должен иметь ответ
// 2. CODE_MISSION должен иметь код
// 3. GPS_MISSION должен иметь координаты и радиус
// 4. QR_MISSION должен иметь QR-код
// 5. CHOICE_MISSION должен иметь варианты
// 6. TIMER_MISSION должен иметь длительность
```

---

## 4. Реализация валидатора

```typescript
class ScenarioValidator {
  private rules: ValidationRule[] = [];

  constructor() {
    this.registerRules();
  }

  private registerRules(): void {
    this.rules.push(new NoStartNodeRule());
    this.rules.push(new MultipleStartNodesRule());
    this.rules.push(new BrokenEdgeRule());
    this.rules.push(new InfiniteLoopRule());
    this.rules.push(new EmptyScenarioRule());
    this.rules.push(new OrphanNodeRule());
    this.rules.push(new NoFinishNodeRule());
    this.rules.push(new NoHintsRule());
    this.rules.push(new NoTimeoutRule());
    this.rules.push(new MissingAnswerRule());
    this.rules.push(new MissingCodeRule());
    this.rules.push(new MissingGPSDataRule());
    this.rules.push(new MissingQRCodeRule());
    this.rules.push(new MissingChoiceOptionsRule());
    this.rules.push(new MissingTimerDurationRule());
  }

  validate(scenario: Scenario): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    for (const rule of this.rules) {
      const result = rule.validate(scenario);
      if (result.type === 'error') {
        errors.push(result);
      } else if (result.type === 'warning') {
        warnings.push(result);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }
}
```

---

## 5. Правила (примеры)

### 5.1. NoStartNodeRule

```typescript
class NoStartNodeRule implements ValidationRule {
  validate(scenario: Scenario): ValidationResultItem {
    const hasStart = scenario.nodes.some(n => n.type === 'START');
    if (!hasStart) {
      return {
        type: 'error',
        code: 'ERR_NO_START',
        message: 'Сценарий должен иметь узел START'
      };
    }
    return null;
  }
}
```

### 5.2. BrokenEdgeRule

```typescript
class BrokenEdgeRule implements ValidationRule {
  validate(scenario: Scenario): ValidationResultItem {
    for (const edge of scenario.edges) {
      if (!scenario.nodes.some(n => n.id === edge.to)) {
        return {
          type: 'error',
          code: 'ERR_BROKEN_EDGE',
          edgeId: edge.id,
          message: `Переход "${edge.id}" ведет к несуществующему узлу`
        };
      }
    }
    return null;
  }
}
```

### 5.3. OrphanNodeRule

```typescript
class OrphanNodeRule implements ValidationRule {
  validate(scenario: Scenario): ValidationResultItem {
    const reachable = this.getReachableNodes(scenario);
    const orphanNodes = scenario.nodes.filter(n => !reachable.has(n.id));
    
    for (const node of orphanNodes) {
      return {
        type: 'warning',
        code: 'WARN_ORPHAN_NODE',
        nodeId: node.id,
        message: `Узел "${node.id}" недостижим из START`
      };
    }
    return null;
  }
}
```

---

## 6. Примеры валидации

### 6.1. Валидный сценарий

```json
{
  "nodes": [
    { "id": "start", "type": "START", "title": "Начало" },
    { "id": "node-1", "type": "TEXT_MISSION", "title": "Найдите код", "answer": "12345" },
    { "id": "finish", "type": "FINISH", "title": "Финиш" }
  ],
  "edges": [
    { "from": "start", "to": "node-1" },
    { "from": "node-1", "to": "finish" }
  ]
}
```

**Результат:** ✅ Валидный

---

### 6.2. Сценарий с ошибками

```json
{
  "nodes": [
    { "id": "node-1", "type": "TEXT_MISSION", "title": "Найдите код" },
    { "id": "node-2", "type": "GPS_MISSION", "title": "Доберитесь до точки" }
  ],
  "edges": [
    { "from": "node-1", "to": "node-3" },
    { "from": "node-2", "to": "node-1" }
  ]
}
```

**Результат:**
```json
{
  "valid": false,
  "errors": [
    {
      "code": "ERR_NO_START",
      "message": "Сценарий должен иметь узел START"
    },
    {
      "code": "ERR_BROKEN_EDGE",
      "message": "Переход ведет к несуществующему узлу node-3"
    },
    {
      "code": "ERR_INFINITE_LOOP",
      "message": "Сценарий содержит бесконечный цикл: node-2 → node-1"
    }
  ],
  "warnings": [
    {
      "code": "WARN_ORPHAN_NODE",
      "nodeId": "node-2",
      "message": "Узел node-2 недостижим из START"
    }
  ]
}
```

---

## 7. Интеграция с редактором

```typescript
class BuilderValidator {
  validateScenario(scenario: Scenario): ValidationResult {
    // 1. Валидация
    const result = this.validator.validate(scenario);

    // 2. Подсветка ошибок на холсте
    for (const error of result.errors) {
      this.highlightNode(error.nodeId, 'error');
    }

    for (const warning of result.warnings) {
      this.highlightNode(warning.nodeId, 'warning');
    }

    // 3. Список ошибок
    this.showValidationPanel(result);

    // 4. Блокировка публикации при ошибках
    if (!result.valid) {
      this.disablePublishButton();
    }

    return result;
  }
}
```

---

## 8. Итоговый контракт

> **Сценарий валидируется ДО запуска.**
>
> **Ошибки блокируют публикацию.**
>
> **Валидация в реальном времени.**

---

**Кодовое имя проекта:** Adventure Engine  
**Главный принцип:** *Лучше отклонить сценарий при создании, чем разбираться с багами во время игры.*
```
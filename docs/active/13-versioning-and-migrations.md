```markdown
# Versioning and Migrations: Стратегия версионирования

> **Кодовое имя проекта:** Adventure Engine
> **Уровень документа:** Инженерный контракт
> **Статус:** Утвержден

---

## 1. Принципы

### 1.1. Каждый сценарий имеет версию
Версия — это семантический идентификатор (Major.Minor.Patch).

### 1.2. Старые сценарии должны работать с новым Engine
Обратная совместимость — обязательна.

### 1.3. Изменения Engine не ломают обратную совместимость
Если изменение ломает совместимость — это мажорная версия Engine.

### 1.4. Миграции — автоматические, но контролируемые
Сценарии мигрируются автоматически при загрузке, но автор может влиять на процесс.

### 1.5. Все версии сценариев сохраняются
История изменений доступна для аудита и отката.

---

## 2. Версионирование сценариев

### 2.1. Семантическое версионирование

```text
Major.Minor.Patch
   │     │     └── Исправление ошибок (обратно совместимо)
   │     └──────── Добавление новых полей (обратно совместимо)
   └────────────── Изменение структуры (НЕ обратно совместимо)
```

### 2.2. Когда менять версию

| Изменение | Версия | Пример |
| :--- | :--- | :--- |
| Исправление опечатки | Patch (1.0.0 → 1.0.1) | Исправлен текст вопроса |
| Добавление нового поля (опционального) | Minor (1.0.0 → 1.1.0) | Добавлена подсказка |
| Добавление нового типа узла | Minor (1.0.0 → 1.1.0) | Добавлен `choice` |
| Изменение структуры transitions | Major (1.0.0 → 2.0.0) | Замена `nextNodeId` на `transitions` |
| Удаление обязательного поля | Major (1.0.0 → 2.0.0) | Удаление `answer` у text узлов |

### 2.3. Формат версии в сценарии

```json
{
  "id": "scenario-123",
  "version": "1.2.3",
  "name": "Ночной дозор",
  "schemaVersion": 1,
  ...
}
```

### 2.4. Таблица совместимости

| Версия сценария | Версия Engine | Совместимость |
| :--- | :--- | :--- |
| 1.x.x | 1.x.x | ✅ Полная |
| 1.x.x | 2.x.x | ✅ Полная (если есть миграция) |
| 2.x.x | 1.x.x | ❌ Нет (новый сценарий на старом Engine) |

---

## 3. Версионирование Engine

### 3.1. Семантическое версионирование Engine

```text
Engine v2.1.0
      │ │ └── Исправление багов
      │ └──── Добавление новых механик (обратно совместимо)
      └────── Изменение API/контрактов (НЕ обратно совместимо)
```

### 3.2. Мажорные версии Engine

| Версия | Изменения |
| :--- | :--- |
| v1.x.x | Базовый Engine (линейные сценарии) |
| v2.x.x | Добавлены ветвления (DAG) |
| v3.x.x | Добавлены сложные условия (score, time) |

### 3.3. Поддержка старых версий Engine

```typescript
interface EngineConfig {
  version: string;
  compatibilityMode: 'strict' | 'compatible' | 'legacy';
  maxScenarioVersion: string;
}
```

---

## 4. Миграция сценариев

### 4.1. Автоматическая миграция

```typescript
class ScenarioMigrator {
  // Миграция сценария к целевой версии
  migrate(scenario: Scenario, targetVersion: string): Scenario {
    let current = scenario;
    
    // Применяем миграции последовательно
    while (current.version < targetVersion) {
      const nextVersion = this.getNextVersion(current.version);
      current = this.applyMigration(current, nextVersion);
    }
    
    return current;
  }
  
  // Применение конкретной миграции
  private applyMigration(scenario: Scenario, targetVersion: string): Scenario {
    switch (targetVersion) {
      case '1.1.0':
        return this.migrateTo_1_1_0(scenario);
      case '1.2.0':
        return this.migrateTo_1_2_0(scenario);
      case '2.0.0':
        return this.migrateTo_2_0_0(scenario);
      default:
        throw new UnsupportedMigrationError(targetVersion);
    }
  }
}
```

### 4.2. Пример миграции: `1.0.0` → `1.1.0` (добавлена подсказка)

```typescript
// v1.0.0
{
  "id": "node-1",
  "type": "text",
  "question": "Как называется главная площадь?",
  "answer": "Красная",
  "nextNodeId": "node-2"
}

// v1.1.0 (добавлена подсказка)
{
  "id": "node-1",
  "type": "text",
  "question": "Как называется главная площадь?",
  "answer": "Красная",
  "hint": "У входа в парк",
  "nextNodeId": "node-2"
}
```

**Миграция:**
```typescript
function migrateTo_1_1_0(scenario: Scenario): Scenario {
  return {
    ...scenario,
    nodes: scenario.nodes.map(node => ({
      ...node,
      hint: node.hint || null // Добавляем поле hint (null по умолчанию)
    })),
    version: '1.1.0'
  };
}
```

### 4.3. Пример миграции: `1.1.0` → `2.0.0` (замена nextNodeId на transitions)

```typescript
// v1.1.0
{
  "id": "node-1",
  "type": "text",
  "question": "Как называется главная площадь?",
  "answer": "Красная",
  "nextNodeId": "node-2"
}

// v2.0.0 (замена на transitions)
{
  "id": "node-1",
  "type": "text",
  "question": "Как называется главная площадь?",
  "answer": "Красная",
  "transitions": [
    { "when": "success", "to": "node-2" }
  ]
}
```

**Миграция:**
```typescript
function migrateTo_2_0_0(scenario: Scenario): Scenario {
  return {
    ...scenario,
    nodes: scenario.nodes.map(node => ({
      ...node,
      // Преобразуем nextNodeId в transitions
      transitions: node.nextNodeId 
        ? [{ when: 'success', to: node.nextNodeId }]
        : [],
      // Удаляем старые поля
      nextNodeId: undefined,
      nextNodeIdOnFail: undefined
    })),
    version: '2.0.0',
    schemaVersion: 2
  };
}
```

---

## 5. Backward compatibility (Обратная совместимость)

### 5.1. Engine умеет работать со старыми сценариями

```typescript
class EngineOrchestrator {
  async processEvent(sessionId: string, event: PlayerCommand) {
    const scenario = await this.getScenario(sessionId);
    
    // Проверяем версию сценария
    if (scenario.version < this.minSupportedVersion) {
      // Автоматическая миграция
      scenario = await this.migrator.migrate(scenario, this.currentVersion);
    }
    
    // ... остальная логика
  }
}
```

### 5.2. Поддержка старых форматов

```typescript
class ScenarioLoader {
  load(scenarioData: any): Scenario {
    // Проверяем schemaVersion
    if (!scenarioData.schemaVersion || scenarioData.schemaVersion < 2) {
      // Автоматическая миграция для старых сценариев
      return this.migrateLegacyScenario(scenarioData);
    }
    return scenarioData;
  }
}
```

---

## 6. Хранение версий в БД

### 6.1. Таблица `scenario_versions`

```sql
CREATE TABLE scenario_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scenario_id UUID NOT NULL REFERENCES scenarios(id) ON DELETE CASCADE,
  version VARCHAR(20) NOT NULL, -- 1.0.0, 1.1.0, 2.0.0
  nodes JSONB NOT NULL,
  start_node_id VARCHAR(50) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  migration_script VARCHAR(100), -- Какой скрипт применили
  previous_version VARCHAR(20) -- Ссылка на предыдущую версию
);

CREATE INDEX idx_scenario_versions_scenario_id ON scenario_versions(scenario_id);
CREATE UNIQUE INDEX idx_scenario_versions_unique ON scenario_versions(scenario_id, version);
```

### 6.2. Получение истории версий

```sql
SELECT version, created_at, created_by
FROM scenario_versions
WHERE scenario_id = 'scenario-123'
ORDER BY created_at DESC;
```

---

## 7. Инструменты для агентов

### 7.1. Класс ScenarioMigrator

```typescript
class ScenarioMigrator {
  private migrations: Migration[] = [];
  
  constructor() {
    // Регистрируем все миграции в порядке возрастания
    this.register('1.1.0', this.migrateTo_1_1_0);
    this.register('2.0.0', this.migrateTo_2_0_0);
    this.register('3.0.0', this.migrateTo_3_0_0);
  }
  
  register(version: string, migration: (scenario: Scenario) => Scenario) {
    this.migrations.push({ version, migration });
    this.migrations.sort((a, b) => compareVersions(a.version, b.version));
  }
  
  migrate(scenario: Scenario, targetVersion: string): Scenario {
    let current = scenario;
    const currentVersion = current.version || '1.0.0';
    
    if (compareVersions(currentVersion, targetVersion) >= 0) {
      return current; // Уже на целевой версии
    }
    
    for (const migration of this.migrations) {
      if (compareVersions(migration.version, currentVersion) > 0 &&
          compareVersions(migration.version, targetVersion) <= 0) {
        current = migration.migration(current);
        current.version = migration.version;
      }
    }
    
    return current;
  }
}
```

### 7.2. Генерация миграции

```bash
# Создать новую миграцию
npm run migration:generate -- --name add-hint-field

# Применить миграции ко всем сценариям
npm run migration:apply -- --target 2.0.0
```

---

## 8. Итоговый контракт

> **Все сценарии версионированы.**
>
> **Старые сценарии всегда работают с новым Engine.**
>
> **Изменения Engine не ломают обратную совместимость.**
>
> **Миграции — автоматические, но контролируемые.**
>
> **История версий сохраняется для аудита.**

---

**Кодовое имя проекта:** Adventure Engine  
**Главный принцип:** *Версионирование — это защита от хаоса. Без версий система умирает.*
```
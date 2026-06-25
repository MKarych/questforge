```markdown
# Scenario JSON Schema: Формат сценария

> **Кодовое имя проекта:** Adventure Engine
> **Уровень документа:** Инженерный контракт
> **Статус:** Утвержден

---

## 1. Принципы

- Единый формат для всех сценариев
- Машиночитаемый (JSON)
- Человекочитаемый (понятная структура)
- Расширяемый (можно добавлять новые типы узлов)
- Версионируемый (обратная совместимость)

---

## 2. Общая структура

```json
{
  "version": "1.0",
  "metadata": {
    "id": "scenario-001",
    "title": "Ночной автоквест",
    "description": "Автоквест по ночному городу",
    "author": "user-001",
    "createdAt": "2026-01-01T12:00:00Z",
    "updatedAt": "2026-01-02T10:00:00Z",
    "city": "Минск",
    "duration": 180,
    "difficulty": 3,
    "tags": ["автоквест", "ночной", "город"]
  },
  "settings": {
    "maxTeams": 50,
    "allowHints": true,
    "allowSkipping": false,
    "defaultScore": 0,
    "timeLimit": 14400
  },
  "nodes": [
    {
      "id": "node-001",
      "type": "START_NODE",
      "title": "Начало игры",
      "description": "Добро пожаловать в автоквест!",
      "next": "node-002"
    },
    {
      "id": "node-002",
      "type": "TEXT_MISSION",
      "title": "Найдите код",
      "description": "Введите код с памятника",
      "validation": {
        "mode": "exact",
        "answers": ["12345"]
      },
      "rewards": {
        "score": 10
      },
      "next": {
        "success": "node-003",
        "fail": "node-002"
      }
    },
    {
      "id": "node-003",
      "type": "FINISH_NODE",
      "title": "Финиш",
      "description": "Поздравляем! Вы завершили игру!"
    }
  ],
  "edges": [
    {
      "id": "edge-001",
      "from": "node-001",
      "to": "node-002",
      "condition": "always"
    },
    {
      "id": "edge-002",
      "from": "node-002",
      "to": "node-003",
      "condition": "success"
    },
    {
      "id": "edge-003",
      "from": "node-002",
      "to": "node-002",
      "condition": "fail"
    }
  ]
}
```

---

## 3. Поля сценария

| Поле | Тип | Обязательное | Описание |
| :--- | :--- | :--- | :--- |
| `version` | string | ✅ | Версия формата |
| `metadata` | object | ✅ | Метаданные сценария |
| `settings` | object | ❌ | Настройки игры |
| `nodes` | array | ✅ | Список узлов |
| `edges` | array | ❌ | Список связей (альтернатива transitions) |

### 3.1. Метаданные

| Поле | Тип | Описание |
| :--- | :--- | :--- |
| `id` | string | Уникальный ID сценария |
| `title` | string | Название |
| `description` | string | Описание |
| `author` | string | ID автора |
| `createdAt` | string | Дата создания (ISO) |
| `updatedAt` | string | Дата обновления (ISO) |
| `city` | string | Город |
| `duration` | number | Длительность в минутах |
| `difficulty` | number | Сложность (1-5) |
| `tags` | string[] | Теги |

### 3.2. Настройки

| Поле | Тип | Описание |
| :--- | :--- | :--- |
| `maxTeams` | number | Максимальное количество команд |
| `allowHints` | boolean | Разрешены подсказки |
| `allowSkipping` | boolean | Разрешен пропуск заданий |
| `defaultScore` | number | Начальное количество очков |
| `timeLimit` | number | Лимит времени (секунды) |

---

## 4. Типы узлов (Node Types)

| Тип | Описание |
| :--- | :--- |
| `START_NODE` | Начало игры |
| `FINISH_NODE` | Конец игры |
| `TEXT_MISSION` | Текстовый ответ |
| `CODE_MISSION` | Кодовый ответ |
| `PHOTO_MISSION` | Фотоотчет |
| `GPS_MISSION` | GPS-точка |
| `QR_MISSION` | QR-код |
| `CHOICE_MISSION` | Выбор варианта |
| `TIMER_MISSION` | Таймер |
| `BRANCH_NODE` | Ветвление |
| `NPC_DIALOG` | Диалог с NPC |
| `COLLECT_ITEM` | Сбор предмета |
| `BATTLE_PVE` | Сражение с NPC |

---

## 5. Версионирование

| Версия | Изменения |
| :--- | :--- |
| `1.0` | Базовый формат (линейные сценарии) |
| `1.1` | Добавлены ветвления (BRANCH_NODE) |
| `2.0` | Добавлены NPC, инвентарь, сражения |

---

## 6. Импорт/Экспорт

```typescript
class ScenarioSerializer {
  // Экспорт в JSON
  export(scenario: Scenario): string {
    return JSON.stringify(scenario, null, 2);
  }
  
  // Импорт из JSON
  import(json: string): Scenario {
    const data = JSON.parse(json);
    this.validate(data);
    return data;
  }
  
  // Валидация
  validate(data: any): boolean {
    // Проверка обязательных полей
    // Проверка типов
    // Проверка ссылок между узлами
    return true;
  }
}
```

---

## 7. Итоговый контракт

> **Все сценарии — в едином формате JSON.**
>
> **Формат версионируется.**
>
> **Импорт/экспорт — обязателен.**

---

**Кодовое имя проекта:** Adventure Engine  
**Главный принцип:** *Единый формат — основа экосистемы.*
``` 
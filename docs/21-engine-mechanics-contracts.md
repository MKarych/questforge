```markdown
# Engine Mechanics Contracts: Контракты механик для движка

> **Кодовое имя проекта:** Adventure Engine
> **Уровень документа:** Инженерный контракт
> **Статус:** Утвержден

---

## 1. Принципы

- Каждая механика — это JSON-контракт
- Контракт определяет: тип, валидацию, награды, переходы
- Движок исполняет контракт, а не знает о механике
- Новые механики добавляются как новые типы без изменения ядра

---

## 2. Базовые механики (MVP)

### 2.1. Текстовый ответ (TEXT_MISSION)

```json
{
  "id": "node_001",
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
  "penalty": {
    "score": -5
  },
  "hints": [
    "Посмотрите на постамент",
    "Код выгравирован сбоку"
  ],
  "next": {
    "success": "node_002",
    "fail": "node_001"
  },
  "timeout": {
    "seconds": 300,
    "next": "node_003"
  }
}
```

**Поля:**
| Поле | Тип | Обязательное | Описание |
| :--- | :--- | :--- | :--- |
| `id` | string | ✅ | Уникальный ID узла |
| `type` | string | ✅ | `TEXT_MISSION` |
| `title` | string | ✅ | Заголовок задания |
| `description` | string | ✅ | Текст задания |
| `validation.mode` | string | ✅ | `exact` / `regex` / `contains` |
| `validation.answers` | string[] | ✅ | Список правильных ответов |
| `rewards.score` | number | ❌ | Количество очков за успех |
| `penalty.score` | number | ❌ | Штраф за неудачу |
| `hints` | string[] | ❌ | Подсказки для игроков |
| `next.success` | string | ✅ | Следующий узел при успехе |
| `next.fail` | string | ❌ | Следующий узел при неудаче |
| `timeout.seconds` | number | ❌ | Таймаут в секундах |
| `timeout.next` | string | ❌ | Узел при таймауте |

---

### 2.2. Кодовый ответ (CODE_MISSION)

```json
{
  "id": "node_002",
  "type": "CODE_MISSION",
  "title": "Введите код",
  "description": "Найдите код на колонне",
  "validation": {
    "mode": "exact",
    "code": "12345"
  },
  "rewards": {
    "score": 10
  },
  "penalty": {
    "score": -5
  },
  "attempts": 3,
  "next": {
    "success": "node_003",
    "fail": "node_002"
  },
  "timeout": {
    "seconds": 120,
    "next": "node_003"
  }
}
```

**Поля:**
| Поле | Тип | Обязательное | Описание |
| :--- | :--- | :--- | :--- |
| `id` | string | ✅ | Уникальный ID узла |
| `type` | string | ✅ | `CODE_MISSION` |
| `title` | string | ✅ | Заголовок задания |
| `description` | string | ✅ | Текст задания |
| `validation.mode` | string | ✅ | `exact` / `mask` |
| `validation.code` | string | ✅ | Правильный код |
| `attempts` | number | ❌ | Максимальное количество попыток |
| `rewards.score` | number | ❌ | Количество очков за успех |
| `penalty.score` | number | ❌ | Штраф за неудачу |
| `next.success` | string | ✅ | Следующий узел при успехе |
| `next.fail` | string | ❌ | Следующий узел при неудаче |
| `timeout.seconds` | number | ❌ | Таймаут в секундах |
| `timeout.next` | string | ❌ | Узел при таймауте |

---

### 2.3. Фотоотчет (PHOTO_MISSION)

```json
{
  "id": "node_003",
  "type": "PHOTO_MISSION",
  "title": "Сделайте фото",
  "description": "Сфотографируйтесь у фонтана",
  "validation": {
    "mode": "manual",
    "ai": false,
    "requirements": ["people", "fountain"]
  },
  "rewards": {
    "score": 15
  },
  "next": {
    "success": "node_004"
  },
  "timeout": {
    "seconds": 600,
    "next": "node_004"
  }
}
```

**Поля:**
| Поле | Тип | Обязательное | Описание |
| :--- | :--- | :--- | :--- |
| `id` | string | ✅ | Уникальный ID узла |
| `type` | string | ✅ | `PHOTO_MISSION` |
| `title` | string | ✅ | Заголовок задания |
| `description` | string | ✅ | Текст задания |
| `validation.mode` | string | ✅ | `manual` / `ai` |
| `validation.ai` | boolean | ❌ | Использовать AI-проверку |
| `validation.requirements` | string[] | ❌ | Требования к фото |
| `rewards.score` | number | ❌ | Количество очков за успех |
| `next.success` | string | ✅ | Следующий узел при успехе |
| `timeout.seconds` | number | ❌ | Таймаут в секундах |
| `timeout.next` | string | ❌ | Узел при таймауте |

---

### 2.4. GPS-точка (GPS_MISSION)

```json
{
  "id": "node_004",
  "type": "GPS_MISSION",
  "title": "Доберитесь до точки",
  "description": "Придите к памятнику",
  "gps": {
    "lat": 56.2312,
    "lng": 54.1123,
    "radius": 50
  },
  "rewards": {
    "score": 20
  },
  "next": {
    "success": "node_005"
  },
  "timeout": {
    "seconds": 900,
    "next": "node_005"
  }
}
```

**Поля:**
| Поле | Тип | Обязательное | Описание |
| :--- | :--- | :--- | :--- |
| `id` | string | ✅ | Уникальный ID узла |
| `type` | string | ✅ | `GPS_MISSION` |
| `title` | string | ✅ | Заголовок задания |
| `description` | string | ✅ | Текст задания |
| `gps.lat` | number | ✅ | Широта |
| `gps.lng` | number | ✅ | Долгота |
| `gps.radius` | number | ✅ | Радиус в метрах |
| `rewards.score` | number | ❌ | Количество очков за успех |
| `next.success` | string | ✅ | Следующий узел при успехе |
| `timeout.seconds` | number | ❌ | Таймаут в секундах |
| `timeout.next` | string | ❌ | Узел при таймауте |

---

### 2.5. QR-код (QR_MISSION)

```json
{
  "id": "node_005",
  "type": "QR_MISSION",
  "title": "Отсканируйте QR",
  "description": "Найдите QR-код на здании",
  "qrCode": "SECRET_001",
  "rewards": {
    "score": 10
  },
  "next": {
    "success": "node_006"
  }
}
```

**Поля:**
| Поле | Тип | Обязательное | Описание |
| :--- | :--- | :--- | :--- |
| `id` | string | ✅ | Уникальный ID узла |
| `type` | string | ✅ | `QR_MISSION` |
| `title` | string | ✅ | Заголовок задания |
| `description` | string | ✅ | Текст задания |
| `qrCode` | string | ✅ | Ожидаемый QR-код |
| `rewards.score` | number | ❌ | Количество очков за успех |
| `next.success` | string | ✅ | Следующий узел при успехе |

---

### 2.6. Выбор варианта (CHOICE_MISSION)

```json
{
  "id": "node_006",
  "type": "CHOICE_MISSION",
  "title": "Выберите правильный ответ",
  "description": "Какой год основания города?",
  "options": [
    { "id": "a", "label": "1723", "correct": true },
    { "id": "b", "label": "1745", "correct": false },
    { "id": "c", "label": "1760", "correct": false }
  ],
  "rewards": {
    "score": 5
  },
  "penalty": {
    "score": -2
  },
  "next": {
    "success": "node_007",
    "fail": "node_006"
  }
}
```

**Поля:**
| Поле | Тип | Обязательное | Описание |
| :--- | :--- | :--- | :--- |
| `id` | string | ✅ | Уникальный ID узла |
| `type` | string | ✅ | `CHOICE_MISSION` |
| `title` | string | ✅ | Заголовок задания |
| `description` | string | ✅ | Текст задания |
| `options` | array | ✅ | Список вариантов |
| `options[].id` | string | ✅ | ID варианта |
| `options[].label` | string | ✅ | Текст варианта |
| `options[].correct` | boolean | ✅ | Правильный ли вариант |
| `rewards.score` | number | ❌ | Количество очков за успех |
| `penalty.score` | number | ❌ | Штраф за неудачу |
| `next.success` | string | ✅ | Следующий узел при успехе |
| `next.fail` | string | ❌ | Следующий узел при неудаче |

---

### 2.7. Таймер (TIMER_MISSION)

```json
{
  "id": "node_007",
  "type": "TIMER_MISSION",
  "title": "Подождите",
  "description": "Следующее задание откроется через 10 минут",
  "duration": 600,
  "next": {
    "success": "node_008"
  }
}
```

**Поля:**
| Поле | Тип | Обязательное | Описание |
| :--- | :--- | :--- | :--- |
| `id` | string | ✅ | Уникальный ID узла |
| `type` | string | ✅ | `TIMER_MISSION` |
| `title` | string | ✅ | Заголовок задания |
| `description` | string | ✅ | Текст задания |
| `duration` | number | ✅ | Длительность в секундах |
| `next.success` | string | ✅ | Следующий узел |

---

### 2.8. Ветвление (BRANCH_NODE)

```json
{
  "id": "node_008",
  "type": "BRANCH_NODE",
  "title": "Выберите путь",
  "description": "Куда пойдете?",
  "branches": [
    {
      "id": "left",
      "label": "Налево",
      "condition": "manual",
      "next": "node_009"
    },
    {
      "id": "right",
      "label": "Направо",
      "condition": "manual",
      "next": "node_010"
    }
  ]
}
```

**Поля:**
| Поле | Тип | Обязательное | Описание |
| :--- | :--- | :--- | :--- |
| `id` | string | ✅ | Уникальный ID узла |
| `type` | string | ✅ | `BRANCH_NODE` |
| `title` | string | ✅ | Заголовок задания |
| `description` | string | ✅ | Текст задания |
| `branches` | array | ✅ | Список веток |
| `branches[].id` | string | ✅ | ID ветки |
| `branches[].label` | string | ✅ | Название ветки |
| `branches[].condition` | string | ✅ | `manual` / `score` / `inventory` |
| `branches[].next` | string | ✅ | Следующий узел |

---

## 3. Расширенные механики (v1.0+)

### 3.1. NPC Диалог (NPC_DIALOG)

```json
{
  "id": "node_020",
  "type": "NPC_DIALOG",
  "title": "Поговорите с NPC",
  "description": "Спросите у старого моряка, где искать клад",
  "npc": {
    "id": "npc_001",
    "name": "Старый моряк",
    "avatar": "https://...",
    "description": "Моряк в синей куртке у причала"
  },
  "dialog": [
    {
      "npc": "Привет, путник. Что ищешь?",
      "options": [
        { "id": "a", "label": "Где найти клад?" },
        { "id": "b", "label": "Ты видел что-то странное?" }
      ]
    }
  ],
  "ai": {
    "enabled": true,
    "context": "Старый моряк, знает тайны города",
    "personality": "добрый, немногословный"
  },
  "next": {
    "success": "node_021"
  }
}
```

---

### 3.2. Сбор предмета (COLLECT_ITEM)

```json
{
  "id": "node_030",
  "type": "COLLECT_ITEM",
  "title": "Найдите предмет",
  "description": "Найдите ключ от заброшенного дома",
  "item": {
    "id": "item_001",
    "name": "Старый ключ",
    "type": "key",
    "description": "Ржавый ключ от заброшенного дома"
  },
  "gps": {
    "lat": 56.2312,
    "lng": 54.1123,
    "radius": 30
  },
  "next": {
    "success": "node_031"
  }
}
```

---

### 3.3. Сражение с NPC (BATTLE_PVE)

```json
{
  "id": "node_040",
  "type": "BATTLE_PVE",
  "title": "Сразитесь с монстром",
  "description": "На пути стоит стражник. Победите его!",
  "enemy": {
    "id": "enemy_001",
    "name": "Стражник",
    "hp": 10,
    "attack": 2,
    "defense": 1
  },
  "rewards": {
    "score": 20,
    "item": "item_002"
  },
  "next": {
    "success": "node_041",
    "fail": "node_040"
  }
}
```

---

## 4. Итоговый контракт

> **Каждая механика — это JSON-контракт.**
>
> **Движок исполняет контракт, а не знает о механике.**
>
> **Новые механики добавляются как новые типы.**

---

**Кодовое имя проекта:** Adventure Engine  
**Главный принцип:** *Контракты — основа расширяемости.*
```
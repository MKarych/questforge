# Search Module: Глобальный поиск

> **Дата:** 27.06.2026  
> **Статус:** Актуален  
> **Версия:** 1.0  
> **Цель:** Описать систему глобального поиска по платформе.

---

## 1. Обзор

Search Module обеспечивает поиск по:

- **Играм** — по названию, описанию, городу, тегам
- **Сценариям** — по названию, описанию, категории, автору
- **Пользователям** — по username, имени, городу
- **Командам** — по названию, городу, тегам
- **Маркетплейсу** — по названию листинга, категории

---

## 2. API Эндпоинты

### 2.1. Глобальный поиск

```
GET /search
```

Глобальный поиск по всем сущностям.

**Query Parameters:**
| Параметр | Тип | Описание |
|----------|-----|----------|
| `q` | string | Поисковый запрос (обязательный) |
| `type` | string | Фильтр по типу: `games`, `scenarios`, `users`, `teams`, `marketplace` |
| `limit` | number | Количество результатов (по умолчанию 20, макс. 100) |
| `offset` | number | Смещение для пагинации |

**Response (200):**
```json
{
  "success": true,
  "data": {
    "query": "Минск",
    "total": 45,
    "results": {
      "games": [
        {
          "id": "game-uuid",
          "title": "Тайны старого города",
          "city": "Минск",
          "date": "2025-02-01T19:00:00Z",
          "status": "PUBLISHED",
          "imageUrl": "https://...",
          "organizer": { "name": "Иван" }
        }
      ],
      "scenarios": [...],
      "users": [...],
      "teams": [...],
      "marketplace": [...]
    }
  }
}
```

### 2.2. Поиск по типу

```
GET /search/games?q=Минск&limit=10
```

Поиск только по играм.

**Query Parameters:**
| Параметр | Тип | Описание |
|----------|-----|----------|
| `q` | string | Поисковый запрос |
| `city` | string | Фильтр по городу |
| `tag` | string | Фильтр по тегу |
| `dateFrom` | string | Фильтр по дате (ISO) |
| `dateTo` | string | Фильтр по дате (ISO) |
| `sort` | string | `date`, `rating`, `popularity`, `relevance` |
| `limit` | number | 1-100 |
| `offset` | number | Смещение |

---

```
GET /search/scenarios?q=детектив&category=quest
```

Поиск по сценариям.

**Query Parameters:**
| Параметр | Тип | Описание |
|----------|-----|----------|
| `q` | string | Поисковый запрос |
| `category` | string | Фильтр по категории |
| `priceMin` | number | Минимальная цена |
| `priceMax` | number | Максимальная цена |
| `author` | string | Фильтр по автору (username) |
| `sort` | string | `rating`, `sales`, `created_at` |

---

```
GET /search/users?q=alex&city=Минск
```

Поиск по пользователям.

**Query Parameters:**
| Параметр | Тип | Описание |
|----------|-----|----------|
| `q` | string | Поисковый запрос (username, имя) |
| `city` | string | Фильтр по городу |
| `role` | string | Фильтр по роли |
| `limit` | number | 1-50 |

---

```
GET /search/teams?q=волки
```

Поиск по командам.

**Query Parameters:**
| Параметр | Тип | Описание |
|----------|-----|----------|
| `q` | string | Поисковый запрос |
| `city` | string | Фильтр по городу |
| `tag` | string | Фильтр по тегу |

---

```
GET /search/marketplace?q=детектив
```

Поиск по маркетплейсу.

**Query Parameters:**
| Параметр | Тип | Описание |
|----------|-----|----------|
| `q` | string | Поисковый запрос |
| `category` | string | Фильтр по категории |
| `priceMin` | number | Минимальная цена |
| `priceMax` | number | Максимальная цена |
| `sort` | string | `rating`, `sales`, `created_at` |

---

## 3. Индексация

### 3.1. Игры

Что индексируется:
- `title` — полнотекстовый поиск (weight A)
- `description` — полнотекстовый поиск (weight B)
- `city` — точный фильтр
- `tags` — точный фильтр
- `status` — фильтр (только PUBLISHED)

### 3.2. Сценарии

- `name` — weight A
- `description` — weight B
- `category` — filter
- `tags` — filter
- `author.name` — weight C
- `isPublished` — filter

### 3.3. Пользователи

- `username` — weight A
- `name` — weight B
- `city` — filter
- `slug` — exact match

### 3.4. Команды

- `name` — weight A
- `description` — weight B
- `city` — filter
- `tags` — filter

### 3.5. Маркетплейс

- `title` — weight A
- `short_description` — weight B
- `category` — filter
- `tags` — filter
- `author.name` — weight C
- `status` — filter (только PUBLISHED)

---

## 4. Фронтенд

### 4.1. Компоненты

- `SearchBar` — строка поиска в шапке
- `SearchResults` — результаты поиска
- `SearchDropdown` — выпадающий список с автодополнением
- `SearchFilters` — панель фильтров

### 4.2. Страницы

| Страница | Путь | Описание |
|----------|------|----------|
| Результаты поиска | `/search?q=...` | Полная страница результатов |
| Поиск игр | `/search?q=...&type=games` | Результаты по играм |
| Поиск сценариев | `/search?q=...&type=scenarios` | Результаты по сценариям |

---

## 5. Архитектурные правила

1. **Единая точка входа.** Все поисковые запросы проходят через `SearchController`.
2. **Параллельный поиск.** При глобальном поиске запросы к разным сущностям выполняются параллельно.
3. **Кэширование.** Результаты поисковых запросов кэшируются на 5 минут.
4. **Безопасность.** Поиском могут пользоваться все, включая неавторизованных.
5. **Релевантность.** Результаты сортируются по релевантности (вес поля + возраст + рейтинг).
6. **Пагинация.** Все результаты пагинируются (limit/offset).

---

**Дата:** 27.06.2026  
**Статус:** Актуален  
**Версия:** 1.0

```markdown
# System Architecture: Физическая архитектура системы

> **Кодовое имя проекта:** Adventure Engine
> **Уровень документа:** Архитектурный
> **Статус:** Утвержден

---

## 1. Принципы

- Модульная архитектура (NestJS Monolith на старте)
- Четкое разделение ответственности
- Горизонтальное масштабирование (при росте)
- Событийно-ориентированная архитектура

---

## 2. Общая архитектура

```
                    ┌─────────────────────────────────────┐
                    │         Frontend (Next.js)          │
                    │    React + Tailwind + WebSocket     │
                    └─────────────────┬───────────────────┘
                                      │
                                      ▼
                    ┌─────────────────────────────────────┐
                    │          VK Bot Service             │
                    │    (VK API Integration)             │
                    └─────────────────┬───────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────┐
│                        API Gateway (NestJS)                    │
│  - Auth (JWT)          - Rate Limiting      - WebSocket       │
│  - RBAC                - CORS               - Logging         │
└────────────────────────────────┬────────────────────────────────┘
                                 │
         ┌───────────────────────┼───────────────────────┐
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐   ┌─────────────────┐   ┌─────────────────┐
│  Game Service   │   │ Scenario Service│   │  User Service   │
│   (Engine)      │   │   (Builder)     │   │ (Auth/Profile)  │
│                 │   │                 │   │                 │
│ • State Machine │   │ • CRUD          │   │ • Registration  │
│ • Event Store   │   │ • Validation    │   │ • Login         │
│ • Plugins       │   │ • Versioning    │   │ • RBAC          │
│ • Time Travel   │   │ • Import/Export │   │ • Onboarding    │
└────────┬────────┘   └────────┬────────┘   └────────┬────────┘
         │                     │                     │
         └─────────────────────┼─────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                     PostgreSQL + Redis + MinIO                 │
│                                                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐            │
│  │  PostgreSQL │  │    Redis    │  │   MinIO/S3  │            │
│  │  (Primary)  │  │   (Cache)   │  │   (Files)   │            │
│  │             │  │   (Locks)   │  │   (Photos)  │            │
│  │ Event Store │  │   (Queue)   │  │   (Media)   │            │
│  └─────────────┘  └─────────────┘  └─────────────┘            │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. Модули (NestJS Monolith)

### 3.1. Core модули

| Модуль | Описание | Ключевые классы |
| :--- | :--- | :--- |
| **Auth** | Аутентификация и авторизация | `AuthController`, `AuthService`, `JwtStrategy` |
| **Users** | Управление пользователями | `UsersController`, `UsersService`, `UsersRepository` |
| **Games** | CRUD игр, публикация | `GamesController`, `GamesService`, `GamesRepository` |
| **Scenarios** | Конструктор, валидация | `ScenariosController`, `ScenariosService`, `ScenarioValidator` |
| **Engine** | Игровой движок | `EngineOrchestrator`, `StateManager`, `EventStore` |
| **Sessions** | Игровые сессии | `SessionsController`, `SessionsService`, `SessionManager` |
| **Marketplace** | Продажа сценариев | `MarketplaceController`, `MarketplaceService`, `LicenseManager` |
| **VK** | Интеграция с VK | `VkController`, `VkService`, `VkBot` |
| **AI** | AI-сервисы | `AiService`, `PhotoAnalyzer`, `NpcGenerator` |
| **Admin** | Администрирование | `AdminController`, `AdminService`, `ModerationService` |
| **Analytics** | Статистика | `AnalyticsController`, `AnalyticsService`, `HeatmapGenerator` |

### 3.2. Структура модуля Engine

```
engine/
├── orchestrator/
│   └── engine-orchestrator.ts
├── state-machine/
│   ├── game-state-machine.ts
│   └── team-state-machine.ts
├── event-store/
│   ├── event-store.ts
│   └── event-repository.ts
├── plugins/
│   ├── plugin-registry.ts
│   ├── plugin-sandbox.ts
│   └── plugins/
│       ├── text-mission.plugin.ts
│       ├── code-mission.plugin.ts
│       ├── photo-mission.plugin.ts
│       ├── gps-mission.plugin.ts
│       └── qr-mission.plugin.ts
├── state-manager/
│   ├── state-manager.ts
│   └── snapshot-manager.ts
├── rules-engine/
│   └── rules-engine.ts
├── transition-resolver/
│   └── transition-resolver.ts
└── time-travel/
    └── time-travel.ts
```

---

## 4. Хранилища

### 4.1. PostgreSQL

| Таблица | Описание |
| :--- | :--- |
| `users` | Пользователи |
| `games` | Игры |
| `scenarios` | Сценарии |
| `nodes` | Узлы сценариев |
| `edges` | Связи между узлами |
| `teams` | Команды |
| `team_members` | Участники команд |
| `events` | Event Store (партиционирована) |
| `session_states` | Снапшоты состояний |
| `reviews` | Отзывы |
| `comments` | Комментарии |
| `purchases` | Покупки |
| `licenses` | Лицензии |

### 4.2. Redis

| Ключ | Описание | TTL |
| :--- | :--- | :--- |
| `session:{teamId}` | Текущее состояние команды | 1 час |
| `lock:{sessionId}` | Блокировка сессии | 30 сек |
| `processed:{eventId}` | Маркер обработанного события | 24 часа |
| `rate:{sessionId}:{action}` | Rate limiting | 60 сек |

### 4.3. MinIO / S3

| Папка | Описание |
| :--- | :--- |
| `/photos` | Фото игроков |
| `/avatars` | Аватары пользователей |
| `/game-covers` | Обложки игр |
| `/media` | Видео, аудио |

---

## 5. Коммуникация

| Тип | Описание | Использование |
| :--- | :--- | :--- |
| **REST (HTTP)** | Синхронные запросы | API Gateway → Модули |
| **WebSocket** | Realtime события | Engine → Frontend |
| **BullMQ (Redis)** | Асинхронные задачи | Уведомления, аналитика |

---

## 6. CI/CD

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: npm install
      - run: npm run build
      - name: Deploy to VPS
        uses: appleboy/ssh-action@v0.1.5
        with:
          host: ${{ secrets.SSH_HOST }}
          username: ${{ secrets.SSH_USERNAME }}
          key: ${{ secrets.SSH_KEY }}
          script: |
            cd /opt/questforge
            git pull
            docker-compose down
            docker-compose up -d --build
```

---

## 7. Масштабирование

| Компонент | Стратегия |
| :--- | :--- |
| **API Gateway** | Горизонтальное (multiple instances) |
| **Game Service** | Горизонтальное (stateful, с блокировками) |
| **PostgreSQL** | Репликация (future) |
| **Redis** | Кластер (future) |

---

## 8. Мониторинг

| Инструмент | Назначение |
| :--- | :--- |
| **Prometheus** | Сбор метрик |
| **Grafana** | Визуализация дашбордов |
| **Loki** | Сбор логов |
| **Jaeger** | Трейсинг |

---

## 9. Итоговый принцип

> **Модульная архитектура с четким разделением.**
>
> **Каждый модуль делает одну вещь.**
>
> **Масштабирование по горизонтали.**

---

**Кодовое имя проекта:** Adventure Engine  
**Главный принцип:** *Четкое разделение ответственности.*
```
```markdown
# Code Architecture: Структура проекта и файлов

> **Кодовое имя проекта:** Adventure Engine
> **Уровень документа:** Инженерный контракт
> **Статус:** Утвержден

---

## 1. Принципы

### 1.1. Монорепозиторий
Весь код в одном репозитории с четким разделением на приложения и пакеты.

### 1.2. Разделение по слоям
- `apps/` — приложения (API, Web, Mobile)
- `packages/` — общие библиотеки
- `services/` — микросервисы (для будущего)
- `infrastructure/` — Docker, Kubernetes, Terraform

### 1.3. Именование файлов
- Модули: `*.module.ts`
- Контроллеры: `*.controller.ts`
- Сервисы: `*.service.ts`
- Классы: `PascalCase`
- Функции и переменные: `camelCase`

### 1.4. Один файл — одна ответственность
Каждый файл делает только одну вещь. Максимальный размер файла — 300 строк.

---

## 2. Структура монорепозитория

```
questforge/
├── apps/
│   ├── api/                    # Backend (NestJS)
│   │   ├── src/
│   │   ├── test/
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── nest-cli.json
│   │   └── Dockerfile
│   │
│   ├── web/                    # Frontend (Next.js)
│   │   ├── src/
│   │   ├── public/
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── next.config.js
│   │   └── Dockerfile
│   │
│   └── mobile/                 # Mobile (React Native) — v2.0+
│       ├── src/
│       ├── android/
│       ├── ios/
│       ├── package.json
│       └── app.json
│
├── packages/
│   ├── shared-types/           # Общие TypeScript типы
│   │   ├── src/
│   │   └── package.json
│   │
│   ├── ui-kit/                 # Общие React компоненты
│   │   ├── src/
│   │   └── package.json
│   │
│   └── sdk/                    # SDK для работы с API
│       ├── src/
│       └── package.json
│
├── services/                   # Микросервисы (v2.0+)
│   ├── notification-service/
│   ├── media-service/
│   └── analytics-service/
│
├── infrastructure/
│   ├── docker/
│   │   ├── docker-compose.yml
│   │   └── .env.example
│   │
│   ├── kubernetes/             # (v2.0+)
│   └── terraform/              # (v2.0+)
│
├── prisma/
│   ├── schema.prisma
│   └── migrations/
│
├── public/                     # Статические файлы
│   └── uploads/                # Загруженные файлы
│
├── docs/                       # Документация
│   ├── 01-vision-and-mission.md
│   ├── 02-ecosystem-growth-strategy.md
│   └── ...
│
├── package.json                # Корневой package.json
├── turbo.json                  # Turborepo конфигурация
├── tsconfig.json               # Корневой tsconfig
├── .gitignore
├── README.md
└── docker-compose.yml
```

---

## 3. Backend структура (apps/api)

### 3.1. Полная структура

```
apps/api/
├── src/
│   ├── main.ts                 # Точка входа
│   ├── app.module.ts           # Главный модуль
│   │
│   ├── modules/
│   │   ├── auth/
│   │   │   ├── auth.module.ts
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── guards/
│   │   │   │   ├── jwt.guard.ts
│   │   │   │   └── roles.guard.ts
│   │   │   ├── strategies/
│   │   │   │   ├── jwt.strategy.ts
│   │   │   │   └── refresh.strategy.ts
│   │   │   └── dto/
│   │   │       ├── register.dto.ts
│   │   │       └── login.dto.ts
│   │   │
│   │   ├── users/
│   │   │   ├── users.module.ts
│   │   │   ├── users.controller.ts
│   │   │   └── users.service.ts
│   │   │
│   │   ├── organizer/
│   │   │   ├── organizer.module.ts
│   │   │   ├── organizer.controller.ts
│   │   │   ├── organizer.service.ts
│   │   │   └── dto/
│   │   │       ├── apply-organizer.dto.ts
│   │   │       └── application-status.dto.ts
│   │   │
│   │   ├── public/
│   │   │   ├── public.module.ts
│   │   │   ├── public.controller.ts
│   │   │   └── public.service.ts
│   │   │
│   │   ├── games/
│   │   │   ├── games.module.ts
│   │   │   ├── games.controller.ts
│   │   │   ├── games.service.ts
│   │   │   └── dto/
│   │   │       ├── create-game.dto.ts
│   │   │       ├── update-game.dto.ts
│   │   │       └── submit-game.dto.ts
│   │   │
│   │   ├── scenarios/
│   │   │   ├── scenarios.module.ts
│   │   │   ├── scenarios.controller.ts
│   │   │   ├── scenarios.service.ts
│   │   │   ├── validators/
│   │   │   │   ├── scenario-validator.ts
│   │   │   │   └── schema-validator.ts
│   │   │   ├── migrations/
│   │   │   │   └── scenario-migrator.ts
│   │   │   └── dto/
│   │   │       ├── create-scenario.dto.ts
│   │   │       └── update-scenario.dto.ts
│   │   │
│   │   ├── sessions/
│   │   │   ├── sessions.module.ts
│   │   │   ├── sessions.controller.ts
│   │   │   ├── sessions.service.ts
│   │   │   └── dto/
│   │   │       ├── create-session.dto.ts
│   │   │       └── answer.dto.ts
│   │   │
│   │   ├── reviews/
│   │   │   ├── reviews.module.ts
│   │   │   ├── reviews.controller.ts
│   │   │   ├── reviews.service.ts
│   │   │   └── dto/
│   │   │       ├── create-review.dto.ts
│   │   │       └── update-review.dto.ts
│   │   │
│   │   ├── comments/
│   │   │   ├── comments.module.ts
│   │   │   ├── comments.controller.ts
│   │   │   ├── comments.service.ts
│   │   │   └── dto/
│   │   │       ├── create-comment.dto.ts
│   │   │       └── update-comment.dto.ts
│   │   │
│   │   ├── marketplace/
│   │   │   ├── marketplace.module.ts
│   │   │   ├── marketplace.controller.ts
│   │   │   ├── marketplace.service.ts
│   │   │   └── dto/
│   │   │       ├── purchase.dto.ts
│   │   │       └── review.dto.ts
│   │   │
│   │   ├── admin/
│   │   │   ├── admin.module.ts
│   │   │   ├── admin.controller.ts
│   │   │   ├── admin.service.ts
│   │   │   └── dto/
│   │   │       ├── approve-game.dto.ts
│   │   │       ├── reject-game.dto.ts
│   │   │       ├── approve-application.dto.ts
│   │   │       └── reject-application.dto.ts
│   │   │
│   │   ├── analytics/
│   │   │   ├── analytics.module.ts
│   │   │   ├── analytics.controller.ts
│   │   │   └── analytics.service.ts
│   │   │
│   │   └── system/
│   │       ├── system.module.ts
│   │       ├── system.controller.ts
│   │       └── system.service.ts
│   │
│   ├── engine/                 # Game Engine (ядро)
│   │   ├── engine.module.ts
│   │   ├── orchestrator/
│   │   │   └── engine-orchestrator.ts
│   │   ├── event-processor/
│   │   │   └── event-processor.ts
│   │   ├── rules-engine/
│   │   │   └── rules-engine.ts
│   │   ├── transition-resolver/
│   │   │   └── transition-resolver.ts
│   │   ├── state-manager/
│   │   │   └── state-manager.ts
│   │   ├── lock-manager/
│   │   │   └── lock-manager.ts
│   │   ├── event-log/
│   │   │   └── event-log.ts
│   │   ├── replay-engine/
│   │   │   └── replay-engine.ts
│   │   ├── types/
│   │   │   ├── scenario.types.ts
│   │   │   ├── state.types.ts
│   │   │   └── event.types.ts
│   │   └── utils/
│   │       ├── seeded-random.ts
│   │       └── distance-calculator.ts
│   │
│   ├── realtime/               # WebSocket
│   │   ├── realtime.module.ts
│   │   ├── realtime.gateway.ts
│   │   ├── rooms.service.ts
│   │   └── events.service.ts
│   │
│   ├── common/                 # Общие компоненты
│   │   ├── guards/
│   │   │   ├── auth.guard.ts
│   │   │   └── roles.guard.ts
│   │   ├── interceptors/
│   │   │   ├── logging.interceptor.ts
│   │   │   └── transform.interceptor.ts
│   │   ├── filters/
│   │   │   ├── http-exception.filter.ts
│   │   │   └── validation.filter.ts
│   │   ├── decorators/
│   │   │   ├── roles.decorator.ts
│   │   │   └── user.decorator.ts
│   │   └── constants/
│   │       ├── error-codes.ts
│   │       └── roles.ts
│   │
│   └── config/                 # Конфигурация
│       ├── configuration.ts
│       └── validation.ts
│
├── test/
│   ├── unit/
│   ├── integration/
│   ├── e2e/
│   ├── jest.config.js
│   └── setup.ts
│
├── package.json
├── tsconfig.json
├── nest-cli.json
└── Dockerfile
```

### 3.2. Новые модули

| Модуль | Файл | Описание |
| :--- | :--- | :--- |
| **Organizer** | `organizer/` | Онбординг организаторов (заявки, статусы) |
| **Public** | `public/` | Публичная часть (каталог, страница игры) |
| **Reviews** | `reviews/` | Отзывы на игры (CRUD) |
| **Comments** | `comments/` | Комментарии/обсуждения (CRUD) |
| **Admin** | `admin/` | Модерация (игры, заявки) |
| **System** | `system/` | Системные эндпоинты (время) |

---

## 4. Engine структура (apps/api/src/engine/)

### 4.1. Модули Engine

| Модуль | Файл | Описание |
| :--- | :--- | :--- |
| **Orchestrator** | `orchestrator/engine-orchestrator.ts` | Единственная точка входа в Engine |
| **Event Processor** | `event-processor/event-processor.ts` | Валидация событий |
| **Rules Engine** | `rules-engine/rules-engine.ts` | Проверка условий (детерминированно) |
| **Transition Resolver** | `transition-resolver/transition-resolver.ts` | Поиск следующего узла |
| **State Manager** | `state-manager/state-manager.ts` | Управление состоянием (L1/L2/L3) |
| **Lock Manager** | `lock-manager/lock-manager.ts` | Блокировки сессий (Redis) |
| **Event Log** | `event-log/event-log.ts` | Event Sourcing (сохранение событий) |
| **Replay Engine** | `replay-engine/replay-engine.ts` | Воспроизведение игр |

### 4.2. Типы Engine

```typescript
// engine/types/scenario.types.ts
export interface Scenario {
  id: string;
  version: string;
  name: string;
  nodes: Node[];
  startNodeId: string;
}

export interface Node {
  id: string;
  type: NodeType;
  question: string;
  answer?: string;
  transitions: Transition[];
  timer?: number;
  penalty?: number;
  hint?: string;
  mediaUrls?: string[];
  options?: string[];
  lat?: number;
  lng?: number;
  radius?: number;
}

export interface Transition {
  when: TransitionType;
  to: string;
  condition?: string;
}

// engine/types/state.types.ts
export interface SessionState {
  sessionId: string;
  teamId: string;
  teamName: string;
  currentNodeId: string;
  score: number;
  penalties: number;
  status: 'active' | 'paused' | 'finished';
  startedAt: number;
  finishedAt?: number;
  history: EventLogEntry[];
}

// engine/types/event.types.ts
export interface PlayerCommand {
  id: string;
  type: CommandType;
  sessionId: string;
  payload: Record<string, unknown>;
  timestamp: number;
}

export interface EngineEvent {
  id: string;
  type: EventType;
  sessionId: string;
  payload: Record<string, unknown>;
  timestamp: number;
}
```

---

## 5. Frontend структура (apps/web)

### 5.1. Полная структура

```
apps/web/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── layout.tsx
│   │   ├── page.tsx            # Главная (публичная)
│   │   │
│   │   ├── games/              # Публичный каталог
│   │   │   ├── page.tsx
│   │   │   └── [id]/
│   │   │       └── page.tsx    # Страница игры
│   │   │
│   │   ├── organizer/          # Для организаторов (публичная)
│   │   │   └── page.tsx
│   │   │
│   │   ├── auth/
│   │   │   ├── login/
│   │   │   │   └── page.tsx
│   │   │   └── register/
│   │   │       └── page.tsx
│   │   │
│   │   ├── dashboard/          # Личный кабинет игрока
│   │   │   ├── page.tsx
│   │   │   ├── profile/
│   │   │   │   └── page.tsx
│   │   │   └── history/
│   │   │       └── page.tsx
│   │   │
│   │   ├── organizer/          # Организаторская панель (защищенная)
│   │   │   ├── dashboard/
│   │   │   │   └── page.tsx
│   │   │   ├── apply/
│   │   │   │   └── page.tsx    # Заявка на организатора
│   │   │   ├── games/
│   │   │   │   ├── create/
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── [id]/
│   │   │   │   │   ├── page.tsx
│   │   │   │   │   └── review/
│   │   │   │   │       └── page.tsx
│   │   │   │   └── page.tsx
│   │   │   └── scenarios/
│   │   │       ├── create/
│   │   │       │   └── page.tsx
│   │   │       ├── [id]/
│   │   │       │   └── page.tsx
│   │   │       └── page.tsx
│   │   │
│   │   ├── admin/              # Админ-панель (только admin/moderator)
│   │   │   ├── dashboard/
│   │   │   │   └── page.tsx
│   │   │   ├── games/
│   │   │   │   └── pending/
│   │   │   │       └── page.tsx
│   │   │   └── organizers/
│   │   │       └── applications/
│   │   │           └── page.tsx
│   │   │
│   │   └── play/               # Вход в игру по ссылке
│   │       └── [shareLink]/
│   │           ├── page.tsx    # Вход в игру (LOBBY)
│   │           └── [sessionId]/
│   │               ├── page.tsx  # Задание (RUNNING)
│   │               └── finish/
│   │                   └── page.tsx
│   │
│   ├── components/
│   │   ├── ui/                 # UI компоненты
│   │   │   ├── Button/
│   │   │   ├── Input/
│   │   │   ├── Card/
│   │   │   ├── Modal/
│   │   │   ├── Toast/
│   │   │   ├── Spinner/
│   │   │   ├── RatingStars/
│   │   │   └── StatusBadge/
│   │   │
│   │   ├── public/             # Публичные компоненты
│   │   │   ├── GameCard/
│   │   │   ├── GameFilters/
│   │   │   ├── GameList/
│   │   │   ├── GameDetails/
│   │   │   ├── ReviewList/
│   │   │   ├── ReviewForm/
│   │   │   ├── CommentList/
│   │   │   └── CommentForm/
│   │   │
│   │   ├── organizer/          # Компоненты организатора
│   │   │   ├── DashboardStats/
│   │   │   ├── GameCard/
│   │   │   ├── ScenarioEditor/
│   │   │   │   ├── Editor.tsx
│   │   │   │   ├── NodeList.tsx
│   │   │   │   ├── NodeForm.tsx
│   │   │   │   └── Preview.tsx
│   │   │   ├── AnswersReview/
│   │   │   │   ├── ReviewList.tsx
│   │   │   │   └── PhotoReview.tsx
│   │   │   └── ApplicationForm/
│   │   │
│   │   ├── player/             # Компоненты игрока
│   │   │   ├── GameLayout/
│   │   │   ├── TaskView/
│   │   │   ├── AnswerForm/
│   │   │   ├── FinishScreen/
│   │   │   ├── TeamList/
│   │   │   └── Lobby/
│   │   │
│   │   └── admin/              # Компоненты админа
│   │       ├── ModerationQueue/
│   │       ├── GameModeration/
│   │       └── OrganizerModeration/
│   │
│   ├── store/                  # Zustand store
│   │   ├── appStore.ts         # Глобальное состояние
│   │   ├── gameStore.ts        # Игровое состояние
│   │   ├── userStore.ts        # Пользовательское состояние
│   │   └── uiStore.ts          # UI состояние
│   │
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useGameEvents.ts
│   │   ├── useWebSocket.ts
│   │   ├── useSession.ts
│   │   ├── useReviews.ts
│   │   └── useComments.ts
│   │
│   ├── lib/
│   │   ├── api/
│   │   │   ├── client.ts
│   │   │   ├── auth.api.ts
│   │   │   ├── public.api.ts
│   │   │   ├── games.api.ts
│   │   │   ├── scenarios.api.ts
│   │   │   ├── sessions.api.ts
│   │   │   ├── reviews.api.ts
│   │   │   ├── comments.api.ts
│   │   │   └── admin.api.ts
│   │   ├── websocket/
│   │   │   └── socket.ts
│   │   └── utils/
│   │       ├── validators.ts
│   │       ├── formatters.ts
│   │       └── timeSync.ts
│   │
│   ├── styles/
│   │   ├── globals.css
│   │   └── variables.css
│   │
│   └── types/
│       └── index.ts
│
├── public/
│   └── assets/
│       ├── images/
│       └── icons/
│
├── package.json
├── tsconfig.json
├── next.config.js
├── tailwind.config.js
└── Dockerfile
```

### 5.2. Страницы по ролям

| Роль | Страницы |
| :--- | :--- |
| **Публичные (без авторизации)** | Главная, каталог игр, страница игры, страница "Для организаторов" |
| **Игрок** | Личный кабинет, история игр, профиль |
| **Организатор** | Организаторская панель, создание игры, редактор сценария, проверка ответов, заявка на организатора |
| **Админ/Модератор** | Админ-панель, модерация игр, модерация заявок |

---

## 6. Общие пакеты (packages/)

### 6.1. shared-types

```
packages/shared-types/
├── src/
│   ├── index.ts
│   ├── scenario.types.ts
│   ├── state.types.ts
│   ├── event.types.ts
│   ├── api.types.ts
│   ├── game.types.ts
│   ├── review.types.ts
│   └── error.types.ts
├── package.json
└── tsconfig.json
```

### 6.2. ui-kit

```
packages/ui-kit/
├── src/
│   ├── index.ts
│   ├── Button/
│   │   ├── Button.tsx
│   │   ├── Button.module.css
│   │   └── index.ts
│   ├── Input/
│   ├── Card/
│   ├── Spinner/
│   ├── RatingStars/
│   └── StatusBadge/
├── package.json
└── tsconfig.json
```

### 6.3. sdk

```
packages/sdk/
├── src/
│   ├── index.ts
│   ├── client.ts
│   ├── auth.ts
│   ├── public.ts
│   ├── games.ts
│   ├── scenarios.ts
│   ├── sessions.ts
│   ├── reviews.ts
│   ├── comments.ts
│   └── admin.ts
├── package.json
└── tsconfig.json
```

---

## 7. Инфраструктура

### 7.1. Docker Compose

```yaml
# infrastructure/docker/docker-compose.yml
version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    container_name: questforge-postgres
    environment:
      POSTGRES_USER: questforge
      POSTGRES_PASSWORD: questforge123
      POSTGRES_DB: questforge
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    container_name: questforge-redis
    ports:
      - "6379:6379"
    restart: unless-stopped

  minio:
    image: minio/minio:latest
    container_name: questforge-minio
    environment:
      MINIO_ROOT_USER: admin
      MINIO_ROOT_PASSWORD: admin123456
    ports:
      - "9000:9000"
      - "9001:9001"
    volumes:
      - minio_data:/data
    command: server /data --console-address ":9001"
    restart: unless-stopped

  api:
    build:
      context: ../..
      dockerfile: apps/api/Dockerfile
    container_name: questforge-api
    ports:
      - "3000:3000"
    depends_on:
      - postgres
      - redis
      - minio
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://questforge:questforge123@postgres:5432/questforge
      - REDIS_URL=redis://redis:6379
    restart: unless-stopped

  web:
    build:
      context: ../..
      dockerfile: apps/web/Dockerfile
    container_name: questforge-web
    ports:
      - "3001:3000"
    depends_on:
      - api
    restart: unless-stopped

volumes:
  postgres_data:
  minio_data:
```

### 7.2. CI/CD (GitHub Actions)

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

## 8. Итоговый контракт

> **Код организован по четкой структуре.**
>
> **Каждый файл делает только одну вещь.**
>
> **Структура соответствует архитектуре.**
>
> **Все изменения проходят через код-ревью.**

---

**Кодовое имя проекта:** Adventure Engine  
**Главный принцип:** *Чистая структура — залог быстрого развития.*
```
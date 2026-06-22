# Adventure Engine Web

Frontend-приложение для платформы городских игр Adventure Engine.

## Стек технологий

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **State Management:** Zustand (опционально), React hooks
- **API Client:** Fetch API с типизацией

## Структура проекта

```
apps/web/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── layout.tsx          # Корневой layout
│   │   ├── page.tsx            # Главная страница (каталог игр)
│   │   ├── games/
│   │   │   ├── page.tsx        # Каталог игр
│   │   │   └── [id]/
│   │   │       └── page.tsx    # Страница игры
│   │   ├── play/
│   │   │   └── [shareLink]/
│   │   │       ├── page.tsx    # Вход в игру (LOBBY)
│   │   │       └── [sessionId]/
│   │   │           ├── page.tsx  # Игровой процесс
│   │   │           └── finish/
│   │   │               └── page.tsx  # Финиш
│   │   ├── organizer/
│   │   │   ├── page.tsx        # Страница для организаторов
│   │   │   ├── dashboard/
│   │   │   │   └── page.tsx    # Панель организатора
│   │   │   ├── games/
│   │   │   │   └── create/
│   │   │   │       └── page.tsx  # Создание игры
│   │   │   └── scenarios/
│   │   │       └── create/
│   │   │           └── page.tsx  # Создание сценария
│   │   └── auth/
│   │       ├── login/
│   │       │   └── page.tsx    # Вход
│   │       └── register/
│   │           └── page.tsx    # Регистрация
│   ├── components/
│   │   └── ui/                 # UI компоненты
│   ├── hooks/
│   │   └── useGame.ts          # Хук для работы с игрой
│   ├── lib/
│   │   └── api/
│   │       └── client.ts       # API клиент
│   └── styles/
│       └── globals.css         # Глобальные стили
├── package.json
├── tsconfig.json
├── next.config.js
└── tailwind.config.js
```

## Запуск

### Установка зависимостей

```bash
npm install
```

### Development

```bash
npm run dev
```

Приложение будет доступно на http://localhost:3001

### Build

```bash
npm run build
```

### Production

```bash
npm start
```

## Переменные окружения

Создайте файл `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:3000/api
```

## Компоненты

### UI Components

- `Header` — навигационная шапка
- `GameCard` — карточка игры для каталога
- `Button` — кнопки (btn-primary, btn-secondary, btn-outline)
- `Card` — карточки контента

### Хуки

- `useGame` — управление игровой сессией (получение состояния, отправка ответов)

## API Интеграция

API клиент находится в `src/lib/api/client.ts`. Он предоставляет:

- Типизированные запросы к бэкенду
- Автоматическую подстановку JWT токена
- Обработку ошибок

Основные методы:
- `getGames()` — список игр
- `getGame(id)` — страница игры
- `startSession(gameId, teamName)` — вход в игру
- `submitAnswer(teamId, gameId, nodeId, answer)` — отправка ответа
- `getSessionState(teamId)` — состояние сессии

## Дизайн

Приложение использует тёмную тему в соответствии с `/docs/09-ux-guidelines.md`:

- Фон: `#0F1117`
- Поверхности: `#1A1D29`, `#252A3A`
- Акцент: `#3B82F6` (синий)
- Текст: `#F8FAFC` (основной), `#94A3B8` (вторичный)

## Требования

- Node.js >= 20.0.0
- npm >= 9.0.0

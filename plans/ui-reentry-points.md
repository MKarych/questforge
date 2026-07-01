# План: UI-точки входа для возврата в лобби/игру

## Проблема
После регистрации пользователь попадает в лобби. Если он выйдет оттуда — нет понятного способа вернуться. Нужно добавить **виджеты и кнопки** в ключевых местах, чтобы пользователь всегда мог вернуться к своей активной игре.

## Решение

### 1. Баннер активной игры в Header (глобально, на всех страницах)

**Файл:** [`apps/web/src/components/ui/Header.tsx`](apps/web/src/components/ui/Header.tsx)

Добавить компонент `ActiveGameBanner`, который:
- При загрузке проверяет `GET /games/:id/my-team-status` для всех игр (или сделать новый эндпоинт `GET /games/my-active-registrations`)
- Если есть активная регистрация — показывает баннер вверху страницы (под хедером)
- Баннер содержит:
  - Название игры
  - Статус (LOBBY / RUNNING)
  - Таймер до старта (если LOBBY)
  - Кнопку "Перейти в лобби" или "Продолжить игру"
  - Возможность закрыть баннер (dismiss)

**Дизайн баннера:**
```
┌──────────────────────────────────────────────────────────────┐
│ 🎮 Городской квест | Старт через 15:30 | [Перейти в лобби] ✕ │
└──────────────────────────────────────────────────────────────┘
```

**Новый эндпоинт:** `GET /games/my-active-registrations`
Возвращает список всех игр, на которые зарегистрирован текущий пользователь, с статусом игры и sessionId.

### 2. Виджет "Мои игры" на главной странице

**Файл:** [`apps/web/src/app/page.tsx`](apps/web/src/app/page.tsx)

Добавить секцию "Мои активные игры" между HeroBlock и остальным контентом (если пользователь авторизован и есть активные регистрации).

**Дизайн:**
```
┌─────────────────────────────────────────────┐
│  🎮 Мои игры                                │
│                                             │
│  ┌─────────────────────────────────────┐    │
│  │ Городской квест                      │    │
│  │ 📍 Екатеринбург | ⏱ 90 мин          │    │
│  │ Статус: 🔄 Ожидание старта           │    │
│  │ Старт через: 15:30                   │    │
│  │ [Перейти в лобби]                    │    │
│  └─────────────────────────────────────┘    │
└─────────────────────────────────────────────┘
```

### 3. Бейдж на карточке игры в каталоге

**Файл:** [`apps/web/src/app/games/page.tsx`](apps/web/src/app/games/page.tsx) и [`apps/web/src/components/ui/GameCard.tsx`](apps/web/src/components/ui/GameCard.tsx)

Если пользователь зарегистрирован на игру — на карточке показывать бейдж "Вы участвуете" и кнопку "Перейти в лобби" вместо "Подробнее".

### 4. Секция "Мои игры" на странице команд

**Файл:** [`apps/web/src/app/teams/page.tsx`](apps/web/src/app/teams/page.tsx)

Добавить секцию с играми, в которых участвуют команды пользователя.

### 5. Страница `/play/[shareLink]` — улучшить сообщение для зарегистрированных

Сейчас при повторном входе происходит авто-редирект. Но если редирект не сработал (например, ошибка API) — нужно показать понятное сообщение и кнопку "Перейти в лобби".

---

## Детальный план изменений

### 5.1. Бэкенд: Новый эндпоинт `GET /games/my-active-registrations`

**Файл:** [`apps/api/src/modules/games/games.service.ts`](apps/api/src/modules/games/games.service.ts)

```typescript
async getMyActiveRegistrations(userId: string) {
  // Найти все teamMemberships пользователя
  // Для каждой команды найти GameRegistration с game.status в [PUBLISHED, REGISTRATION_OPEN, REGISTRATION_CLOSED, LOBBY, RUNNING]
  // Если RUNNING — найти sessionId
  // Вернуть массив с gameId, gameTitle, shareLink, gameStatus, teamId, teamName, sessionId, timer
}
```

**Файл:** [`apps/api/src/modules/games/games.controller.ts`](apps/api/src/modules/games/games.controller.ts)

```typescript
@Get('my-active-registrations')
@UseGuards(JwtAuthGuard)
async getMyActiveRegistrations(@Request() req: any) {
  return this.gamesService.getMyActiveRegistrations(req.user.userId);
}
```

### 5.2. Фронтенд: ApiClient — новый метод

**Файл:** [`apps/web/src/lib/api/client.ts`](apps/web/src/lib/api/client.ts)

```typescript
async getMyActiveRegistrations(): Promise<ApiResponse<Array<{
  gameId: string;
  gameTitle: string;
  shareLink: string;
  gameStatus: string;
  teamId: string;
  teamName: string;
  sessionId: string | null;
  timer: { canStart: boolean; timeUntilStart: number; startTime: string } | null;
}>>>
```

### 5.3. Фронтенд: Компонент ActiveGameBanner

**Новый файл:** [`apps/web/src/components/game/ActiveGameBanner.tsx`](apps/web/src/components/game/ActiveGameBanner.tsx)

- Проверяет `getMyActiveRegistrations()` при монтировании
- Если есть активные регистрации — показывает баннер
- Авто-обновление каждые 10 секунд (для таймера)
- Кнопка закрытия (dismiss) — сохраняет в localStorage что баннер скрыт

### 5.4. Фронтенд: Интеграция в Header

**Файл:** [`apps/web/src/components/ui/Header.tsx`](apps/web/src/components/ui/Header.tsx)

Добавить `<ActiveGameBanner />` после хедера.

### 5.5. Фронтенд: Секция "Мои игры" на главной

**Файл:** [`apps/web/src/app/page.tsx`](apps/web/src/app/page.tsx)

Добавить компонент `MyActiveGames` между HeroBlock и остальным контентом.

### 5.6. Фронтенд: Бейдж на GameCard

**Файл:** [`apps/web/src/components/ui/GameCard.tsx`](apps/web/src/components/ui/GameCard.tsx)

Добавить проп `isRegistered` и `shareLink`. Если `isRegistered` — показывать бейдж и кнопку "Перейти в лобби".

### 5.7. Фронтенд: Страница регистрации — fallback

**Файл:** [`apps/web/src/app/play/[shareLink]/page.tsx`](apps/web/src/app/play/[shareLink]/page.tsx)

Если `my-team-status` вернул `registered: true`, но редирект не сработал — показать сообщение "Вы уже зарегистрированы" и кнопку "Перейти в лобби".

---

## Приоритеты

1. **🔴 Критично:** Баннер в Header (ActiveGameBanner) — пользователь видит его на любой странице
2. **🔴 Критично:** Бэкенд-эндпоинт `GET /games/my-active-registrations`
3. **🟡 Важно:** Секция "Мои игры" на главной
4. **🟡 Важно:** Бейдж на GameCard в каталоге
5. **🟢 Улучшение:** Fallback на странице регистрации

---

## Flow-диаграмма

```mermaid
flowchart TD
    A[Пользователь на любой странице] --> B[Header с ActiveGameBanner]
    B --> C{Есть активная игра?}
    C -->|Нет| D[Ничего не показываем]
    C -->|Да| E[Показываем баннер]
    
    E --> F{Статус игры?}
    F -->|LOBBY| G[Показываем таймер + кнопку Перейти в лобби]
    F -->|RUNNING| H[Показываем кнопку Продолжить игру]
    F -->|REGISTRATION_OPEN| I[Показываем кнопку Перейти в лобби]
    
    G --> J[Клик → /play/shareLink/lobby]
    H --> K[Клик → /play/shareLink/sessionId]
    I --> J
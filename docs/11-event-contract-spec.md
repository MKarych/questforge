```markdown
# Event Contract Spec: Типизированный контракт событий

> **Кодовое имя проекта:** Adventure Engine
> **Уровень документа:** Инженерный контракт (ОБЯЗАТЕЛЕН)
> **Статус:** Утвержден. Изменения только с мажорной версией.

---

## 1. Принципы

### 1.1. Все события типизированы
Нет `any`, нет динамических полей. Каждое событие имеет четкую структуру.

### 1.2. События неизменяемы
После создания событие не меняется. Если нужно что-то исправить — создается новое событие.

### 1.3. События версионируются
Изменение структуры → новая версия. Старые версии поддерживаются.

### 1.4. Engine — единственный источник событий
Frontend отправляет только **команды (Commands)**. Engine генерирует **события (Events)**.

### 1.5. Все события сохраняются
Event Sourcing — основа для Time Travel, аудита и аналитики.

---

## 2. Базовый контракт

```typescript
interface BaseEvent {
  id: string;                    // Уникальный ID события (uuid)
  type: EventType;               // Тип события (см. реестр)
  sessionId: string;             // ID игровой сессии
  timestamp: number;             // Unix timestamp (мс)
  version: number;               // Версия контракта (сейчас 1)
  payload: Record<string, unknown>; // Типизированный payload
}
```

---

## 3. Полный реестр событий

### 3.1. Команды (Client → Engine)

| Тип | Направление | Описание |
| :--- | :--- | :--- |
| `SESSION_CREATE` | Client → Engine | Создать игровую сессию |
| `PLAYER_JOIN` | Client → Engine | Игрок присоединился к сессии |
| `PLAYER_ANSWER` | Client → Engine | Игрок отправил ответ |
| `PLAYER_LEAVE` | Client → Engine | Игрок покинул сессию |
| `HINT_REQUEST` | Client → Engine | Запрос подсказки |
| `SOS_SEND` | Client → Engine | Отправка SOS организатору |

### 3.2. События (Engine → Client)

| Тип | Направление | Описание |
| :--- | :--- | :--- |
| `SESSION_CREATED` | Engine → Client | Сессия создана |
| `GAME_START` | Engine → Client | Игра началась |
| `GAME_FINISH` | Engine → Client | Игра завершена |
| `NODE_ENTER` | Engine → Client | Игрок вошел в узел (задание) |
| `NODE_EXIT` | Engine → Client | Игрок покинул узел |
| `SCORE_UPDATE` | Engine → Client | Обновление счета |
| `PENALTY_APPLIED` | Engine → Client | Штраф начислен |
| `HINT_REVEALED` | Engine → Client | Подсказка открыта |
| `STATE_SYNC` | Engine → Client | Полная синхронизация состояния |
| `TIMER_START` | Engine → Client | Таймер запущен |
| `TIMER_END` | Engine → Client | Таймер завершен |
| `ERROR_OCCURRED` | Engine → Client | Ошибка системы |
| `LEADERBOARD_UPDATE` | Engine → Client | Обновление таблицы лидеров |

---

## 4. Payload контракты (по типам событий)

### 4.1. `SESSION_CREATE` (Client → Engine)

```typescript
interface SessionCreatePayload {
  gameId: string;
  teamName: string;
  playerName: string;
}
```

**Пример:**
```json
{
  "id": "evt-001",
  "type": "SESSION_CREATE",
  "sessionId": "sess-123",
  "timestamp": 1700000000000,
  "version": 1,
  "payload": {
    "gameId": "game-456",
    "teamName": "Команда А",
    "playerName": "Алексей"
  }
}
```

---

### 4.2. `SESSION_CREATED` (Engine → Client)

```typescript
interface SessionCreatedPayload {
  sessionId: string;
  gameId: string;
  teamName: string;
  startNodeId: string;
  startedAt: number;
}
```

---

### 4.3. `PLAYER_JOIN` (Client → Engine)

```typescript
interface PlayerJoinPayload {
  playerId: string;
  teamId: string;
  playerName: string;
  deviceId?: string; // Для аналитики
}
```

---

### 4.4. `PLAYER_ANSWER` (Client → Engine)

```typescript
interface PlayerAnswerPayload {
  playerId: string;
  nodeId: string;
  answer: string | number | boolean;
  answerType: 'text' | 'code' | 'photo' | 'gps' | 'qr' | 'choice';
  metadata?: {
    lat?: number;      // Для GPS
    lng?: number;      // Для GPS
    photoUrl?: string; // Для фото
    accuracy?: number; // Точность GPS в метрах
  };
}
```

**Пример (текстовый ответ):**
```json
{
  "id": "evt-002",
  "type": "PLAYER_ANSWER",
  "sessionId": "sess-123",
  "timestamp": 1700000010000,
  "version": 1,
  "payload": {
    "playerId": "user-456",
    "nodeId": "node-1",
    "answer": "Красная",
    "answerType": "text"
  }
}
```

**Пример (GPS):**
```json
{
  "id": "evt-003",
  "type": "PLAYER_ANSWER",
  "sessionId": "sess-123",
  "timestamp": 1700000020000,
  "version": 1,
  "payload": {
    "playerId": "user-456",
    "nodeId": "node-3",
    "answer": true,
    "answerType": "gps",
    "metadata": {
      "lat": 55.7558,
      "lng": 37.6173,
      "accuracy": 10
    }
  }
}
```

---

### 4.5. `PLAYER_LEAVE` (Client → Engine)

```typescript
interface PlayerLeavePayload {
  playerId: string;
  reason?: 'manual' | 'disconnect' | 'timeout';
}
```

---

### 4.6. `HINT_REQUEST` (Client → Engine)

```typescript
interface HintRequestPayload {
  nodeId: string;
}
```

---

### 4.7. `SOS_SEND` (Client → Engine)

```typescript
interface SOSSendPayload {
  message: string;
  location?: {
    lat: number;
    lng: number;
  };
  batteryLevel?: number; // Уровень заряда телефона
}
```

---

### 4.8. `GAME_START` (Engine → Client)

```typescript
interface GameStartPayload {
  gameId: string;
  gameTitle: string;
  gameDescription?: string;
  totalNodes: number;
  startNodeId: string;
  startedAt: number;
}
```

---

### 4.9. `GAME_FINISH` (Engine → Client)

```typescript
interface GameFinishPayload {
  finalScore: number;
  totalPenalties: number;
  totalTime: number; // Секунд
  finishedAt: number;
  teamRank?: number; // Место в рейтинге (если есть)
  totalTeams?: number; // Всего команд в игре
}
```

---

### 4.10. `NODE_ENTER` (Engine → Client)

```typescript
interface NodeEnterPayload {
  nodeId: string;
  nodeType: string;
  question: string;
  mediaUrls?: string[];
  hint?: string;
  timer?: number; // Если есть таймер (в секундах)
  options?: string[]; // Для choice-узлов
  progress: {
    current: number; // Текущий номер задания
    total: number; // Всего заданий
  };
}
```

---

### 4.11. `NODE_EXIT` (Engine → Client)

```typescript
interface NodeExitPayload {
  nodeId: string;
  result: 'success' | 'fail' | 'timeout' | 'pending';
  score: number;
  penalties: number;
  nextNodeId?: string | null; // null = финиш
}
```

---

### 4.12. `SCORE_UPDATE` (Engine → Client)

```typescript
interface ScoreUpdatePayload {
  score: number;
  delta: number; // Изменение (положительное или отрицательное)
  source: 'answer' | 'bonus' | 'penalty' | 'timeout';
  totalPenalties: number;
}
```

---

### 4.13. `PENALTY_APPLIED` (Engine → Client)

```typescript
interface PenaltyAppliedPayload {
  nodeId: string;
  penalty: number;
  reason: 'wrong_answer' | 'timeout' | 'hint_used' | 'skip';
  totalPenalties: number;
}
```

---

### 4.14. `HINT_REVEALED` (Engine → Client)

```typescript
interface HintRevealedPayload {
  nodeId: string;
  hint: string;
  hintLevel: number; // 1, 2, 3 (если несколько подсказок)
  penaltyApplied?: number; // Штраф за подсказку (если есть)
}
```

---

### 4.15. `STATE_SYNC` (Engine → Client)

```typescript
interface StateSyncPayload {
  sessionId: string;
  currentNodeId: string;
  score: number;
  penalties: number;
  status: 'active' | 'paused' | 'finished';
  history: Array<{
    nodeId: string;
    result: 'success' | 'fail' | 'timeout';
    timestamp: number;
  }>;
  startedAt: number;
  finishedAt?: number;
}
```

---

### 4.16. `TIMER_START` (Engine → Client)

```typescript
interface TimerStartPayload {
  nodeId: string;
  duration: number; // Всего секунд
}
```

---

### 4.17. `TIMER_END` (Engine → Client)

```typescript
interface TimerEndPayload {
  nodeId: string;
  elapsed: number; // Прошло секунд
  remaining: number; // Осталось секунд
}
```

---

### 4.18. `ERROR_OCCURRED` (Engine → Client)

```typescript
interface ErrorOccurredPayload {
  code: string;
  message: string;
  severity: 'warning' | 'error' | 'critical';
  details?: Record<string, unknown>;
}
```

**Коды ошибок:**

| Код | Описание |
| :--- | :--- |
| `SESSION_NOT_FOUND` | Сессия не найдена |
| `SESSION_EXPIRED` | Сессия истекла |
| `SESSION_LOCKED` | Сессия заблокирована |
| `INVALID_ANSWER` | Невалидный ответ |
| `NODE_NOT_FOUND` | Узел не найден |
| `RATE_LIMIT` | Слишком много запросов |
| `INTERNAL_ERROR` | Внутренняя ошибка |
| `VALIDATION_FAILED` | Валидация сценария не пройдена |

---

### 4.19. `LEADERBOARD_UPDATE` (Engine → Client)

```typescript
interface LeaderboardUpdatePayload {
  teams: Array<{
    rank: number;
    teamName: string;
    score: number;
    isCurrentTeam: boolean;
  }>;
  updatedAt: number;
}
```

---

## 5. Команды (Commands) vs События (Events)

### 5.1. Разница

| Команды (Client → Engine) | События (Engine → Client) |
| :--- | :--- |
| `SESSION_CREATE` | `SESSION_CREATED` |
| `PLAYER_JOIN` | `NODE_ENTER` |
| `PLAYER_ANSWER` | `NODE_EXIT` |
| `PLAYER_LEAVE` | `GAME_START` |
| `HINT_REQUEST` | `GAME_FINISH` |
| `SOS_SEND` | `SCORE_UPDATE` |
| | `STATE_SYNC` |
| | `ERROR_OCCURRED` |
| | `TIMER_START` |
| | `TIMER_END` |
| | `HINT_REVEALED` |
| | `PENALTY_APPLIED` |
| | `LEADERBOARD_UPDATE` |

### 5.2. Правило

> **Клиент отправляет команды (Commands). Engine генерирует события (Events) в ответ. Клиент НЕ генерирует события (кроме команд).**

---

## 6. Версионирование

### 6.1. Когда менять версию

| Изменение | Тип версии |
| :--- | :--- |
| Добавление нового поля (опционального) | Мажорная (1.0 → 1.1) |
| Добавление нового обязательного поля | Мажорная (1.0 → 2.0) |
| Удаление поля | Мажорная (1.0 → 2.0) |
| Изменение типа поля | Мажорная (1.0 → 2.0) |
| Добавление нового типа события | Минорная (1.0 → 1.1) |

### 6.2. Пример миграции

```typescript
// Версия 1
interface PlayerAnswerPayload_v1 {
  answer: string;
}

// Версия 2 (добавлен metadata)
interface PlayerAnswerPayload_v2 {
  answer: string;
  metadata?: {
    lat?: number;
    lng?: number;
  };
}
```

### 6.3. Правила поддержки

- Старые версии поддерживаются в течение 6 месяцев.
- Клиенты обновляются постепенно.
- Engine умеет обрабатывать обе версии.

---

## 7. Запреты (Что НЕЛЬЗЯ делать)

| Запрет | Почему |
| :--- | :--- |
| ❌ Использовать `any` в payload | Нарушает контракт |
| ❌ Добавлять новые поля без версии | Ломает обратную совместимость |
| ❌ Менять тип поля | Ломает парсинг |
| ❌ Генерировать события на клиенте | Нарушает принцип "Engine — источник истины" |
| ❌ Использовать нестандартные event types | Нет документации → хаос |
| ❌ Отправлять события без `id` | Невозможно обеспечить идемпотентность |
| ❌ Отправлять события без `timestamp` | Невозможно воспроизвести хронологию |

---

## 8. Пример полного потока событий

### 8.1. Создание сессии и старт игры

```json
→ { "type": "SESSION_CREATE", "payload": { "gameId": "game-1", "teamName": "Команда А" } }
← { "type": "SESSION_CREATED", "payload": { "sessionId": "sess-123", "gameId": "game-1" } }
← { "type": "GAME_START", "payload": { "gameTitle": "Ночной дозор", "totalNodes": 3 } }
← { "type": "NODE_ENTER", "payload": { "nodeId": "node-1", "question": "Код на колонне", "progress": { "current": 1, "total": 3 } } }
```

### 8.2. Игрок отвечает на задание

```json
→ { "type": "PLAYER_ANSWER", "payload": { "nodeId": "node-1", "answer": "12345", "answerType": "code" } }
← { "type": "NODE_EXIT", "payload": { "nodeId": "node-1", "result": "success", "score": 10 } }
← { "type": "SCORE_UPDATE", "payload": { "score": 10, "delta": 10, "source": "answer" } }
← { "type": "NODE_ENTER", "payload": { "nodeId": "node-2", "question": "Фото у фонтана", "progress": { "current": 2, "total": 3 } } }
```

### 8.3. Игрок загружает фото (требует проверки)

```json
→ { "type": "PLAYER_ANSWER", "payload": { "nodeId": "node-2", "answer": "photo-123", "answerType": "photo" } }
← { "type": "NODE_EXIT", "payload": { "nodeId": "node-2", "result": "pending", "score": 10 } }
← { "type": "PENALTY_APPLIED", "payload": { "nodeId": "node-2", "penalty": 0, "reason": "pending" } }
```

### 8.4. Организатор проверяет фото (через API)

```json
→ { "type": "CHECK_PHOTO", "payload": { "answerId": "answer-456", "isCorrect": true } }
← { "type": "SCORE_UPDATE", "payload": { "score": 20, "delta": 10, "source": "answer" } }
← { "type": "NODE_ENTER", "payload": { "nodeId": "node-3", "question": "Финал", "progress": { "current": 3, "total": 3 } } }
```

### 8.5. Завершение игры

```json
→ { "type": "PLAYER_ANSWER", "payload": { "nodeId": "node-3", "answer": "Готово", "answerType": "text" } }
← { "type": "NODE_EXIT", "payload": { "nodeId": "node-3", "result": "success", "score": 30 } }
← { "type": "GAME_FINISH", "payload": { "finalScore": 30, "totalTime": 120, "teamRank": 3, "totalTeams": 8 } }
← { "type": "LEADERBOARD_UPDATE", "payload": { "teams": [...] } }
```

---

## 9. Инструменты для агентов

### 9.1. Генерация типов

Из этого контракта генерируются TypeScript типы:

```bash
npm run generate:event-types
```

### 9.2. Валидация событий

```typescript
// Использование Zod для валидации
import { z } from 'zod';

const PlayerAnswerSchema = z.object({
  id: z.string().uuid(),
  type: z.literal('PLAYER_ANSWER'),
  sessionId: z.string().uuid(),
  timestamp: z.number(),
  version: z.number().default(1),
  payload: z.object({
    playerId: z.string(),
    nodeId: z.string(),
    answer: z.union([z.string(), z.number(), z.boolean()]),
    answerType: z.enum(['text', 'code', 'photo', 'gps', 'qr', 'choice']),
    metadata: z.object({
      lat: z.number().optional(),
      lng: z.number().optional(),
      photoUrl: z.string().optional()
    }).optional()
  })
});
```

### 9.3. Логирование событий

Каждое событие логируется с полным payload:

```typescript
class EventLogger {
  log(event: BaseEvent) {
    console.log({
      id: event.id,
      type: event.type,
      sessionId: event.sessionId,
      timestamp: event.timestamp,
      payload: JSON.stringify(event.payload)
    });
  }
}
```

---

## 10. Итоговый контракт

> **Все события системы строго типизированы, версионированы и задокументированы.**
>
> **Engine генерирует события. Клиент отправляет команды.**
>
> **Изменение контракта → новая версия.**
>
> **Нарушение контракта = нарушение архитектуры.**

---

**Кодовое имя проекта:** Adventure Engine  
**Главный принцип:** *События — язык общения между модулями. Без четкого контракта система превращается в хаос.*
```
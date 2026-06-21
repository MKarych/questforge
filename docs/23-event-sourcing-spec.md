```markdown
# Event Sourcing Specification: Все события системы

> **Кодовое имя проекта:** Adventure Engine
> **Уровень документа:** Инженерный контракт
> **Статус:** Утвержден

---

## 1. Принципы

- Все события сохраняются
- События неизменяемы
- Состояние = последовательность событий
- Time Travel = переигрывание событий

---

## 2. Реестр событий

### 2.1. События игры

| Событие | Описание | Payload |
| :--- | :--- | :--- |
| `GAME_CREATED` | Игра создана | `{ gameId, title, organizerId }` |
| `GAME_PUBLISHED` | Игра опубликована | `{ gameId, publishedAt }` |
| `GAME_STARTED` | Игра началась | `{ gameId, startedAt }` |
| `GAME_PAUSED` | Игра на паузе | `{ gameId, pausedAt }` |
| `GAME_RESUMED` | Игра продолжена | `{ gameId, resumedAt }` |
| `GAME_FINISHED` | Игра завершена | `{ gameId, finishedAt }` |

### 2.2. События команды

| Событие | Описание | Payload |
| :--- | :--- | :--- |
| `TEAM_REGISTERED` | Команда зарегистрирована | `{ teamId, gameId, teamName }` |
| `NODE_ASSIGNED` | Задание назначено | `{ teamId, nodeId, assignedAt }` |
| `ANSWER_SUBMITTED` | Ответ отправлен | `{ teamId, nodeId, answer }` |
| `ANSWER_ACCEPTED` | Ответ принят | `{ teamId, nodeId, score }` |
| `ANSWER_REJECTED` | Ответ отклонен | `{ teamId, nodeId, reason }` |
| `HINT_REQUESTED` | Запрошена подсказка | `{ teamId, nodeId, hintLevel }` |
| `HINT_SENT` | Подсказка отправлена | `{ teamId, nodeId, hintText }` |
| `NODE_COMPLETED` | Задание выполнено | `{ teamId, nodeId, completedAt }` |
| `NODE_FAILED` | Задание провалено | `{ teamId, nodeId, failedAt }` |
| `TEAM_FINISHED` | Команда завершила игру | `{ teamId, finishedAt, score }` |

### 2.3. События организатора

| Событие | Описание | Payload |
| :--- | :--- | :--- |
| `TIME_TRAVEL` | Откат состояния | `{ teamId, targetEventId, rewindedAt }` |
| `NODE_SKIPPED` | Пропуск узла | `{ teamId, nodeId, skippedAt }` |
| `ANSWER_OVERRIDDEN` | Ручная корректировка | `{ teamId, nodeId, newAnswer, overrideAt }` |

---

## 3. Формат события

```typescript
interface Event {
  id: string;                // UUID
  type: EventType;           // Тип события
  gameId: string;            // ID игры
  teamId?: string;           // ID команды (если применимо)
  nodeId?: string;           // ID узла (если применимо)
  payload: Record<string, unknown>;
  timestamp: number;         // Unix timestamp
  sequence: number;          // Порядковый номер в сессии
  version: number;           // Версия контракта
}
```

---

## 4. Event Store

```typescript
interface EventStore {
  // Сохранение события
  append(event: Event): Promise<void>;
  
  // Сохранение нескольких событий (атомарно)
  appendMany(events: Event[]): Promise<void>;
  
  // Получение всех событий игры
  getGameEvents(gameId: string): Promise<Event[]>;
  
  // Получение всех событий команды
  getTeamEvents(teamId: string): Promise<Event[]>;
  
  // Получение событий после указанной временной метки
  getEventsAfter(sessionId: string, timestamp: number): Promise<Event[]>;
  
  // Проверка идемпотентности
  isProcessed(eventId: string): Promise<boolean>;
  
  // Отметить событие как обработанное
  markProcessed(eventId: string): Promise<void>;
}
```

---

## 5. Time Travel реализация

```typescript
class TimeTravel {
  async rewind(teamId: string, targetEventId: string): Promise<void> {
    // 1. Получить последний снапшот до target
    const snapshot = await this.getSnapshotBefore(teamId, targetEventId);
    
    // 2. Получить события после снапшота
    const events = await this.eventStore.getEventsAfter(
      teamId,
      snapshot.timestamp
    );
    
    // 3. Применить события до target
    let state = snapshot.state;
    for (const event of events) {
      if (event.id === targetEventId) break;
      state = this.applyEvent(state, event);
    }
    
    // 4. Сохранить новое состояние
    await this.saveState(teamId, state);
    
    // 5. Записать событие TIME_TRAVEL
    await this.eventStore.append({
      id: uuid(),
      type: 'TIME_TRAVEL',
      gameId: this.getGameId(teamId),
      teamId: teamId,
      payload: { targetEventId, rewindedAt: Date.now() },
      timestamp: Date.now(),
      sequence: this.getNextSequence(teamId),
      version: 1
    });
  }
}
```

---

## 6. Идемпотентность

```typescript
class EventStore {
  async isProcessed(eventId: string): Promise<boolean> {
    const key = `processed:${eventId}`;
    const exists = await this.redis.exists(key);
    return exists === 1;
  }

  async markProcessed(eventId: string): Promise<void> {
    const key = `processed:${eventId}`;
    await this.redis.set(key, '1', 'EX', 86400); // TTL 24 часа
  }

  async append(event: Event): Promise<void> {
    // Проверка идемпотентности
    if (await this.isProcessed(event.id)) {
      throw new DuplicateEventError(event.id);
    }

    // Сохранение в БД
    await this.db.events.create({
      data: {
        id: event.id,
        type: event.type,
        game_id: event.gameId,
        team_id: event.teamId,
        node_id: event.nodeId,
        payload: event.payload,
        timestamp: new Date(event.timestamp),
        sequence: event.sequence,
        version: event.version
      }
    });

    // Отметка как обработанного
    await this.markProcessed(event.id);
  }
}
```

---

## 7. Итоговый контракт

> **Все события сохраняются.**
>
> **События неизменяемы.**
>
> **Состояние = события.**
>
> **Time Travel = переигрывание событий.**

---

**Кодовое имя проекта:** Adventure Engine  
**Главный принцип:** *Event Sourcing — основа всех игровых состояний.*
```
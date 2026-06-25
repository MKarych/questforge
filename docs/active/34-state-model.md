```markdown
# State Model: Полный автомат состояний

> **Кодовое имя проекта:** Adventure Engine
> **Уровень документа:** Инженерный
> **Статус:** Утвержден

---

## 1. Принципы

- Каждое состояние имеет четкие переходы
- Переходы явно определены
- Кто может переводить состояние
- Какие события создаются

---

## 2. Состояния игры

### 2.1. GameStatus

```
CREATED
   │
   ▼
PUBLISHED
   │
   ▼
WAITING_FOR_PLAYERS
   │
   ▼
STARTED
   │
   ▼
IN_PROGRESS
   │
   ├── PAUSED
   │      │
   │      ▼
   │   IN_PROGRESS
   │
   ▼
FINISHED
   │
   ▼
ARCHIVED
```

### 2.2. Переходы игры

| From | To | Триггер | Кто | Событие |
| :--- | :--- | :--- | :--- | :--- |
| CREATED | PUBLISHED | publish() | Organizer | GAME_PUBLISHED |
| PUBLISHED | WAITING_FOR_PLAYERS | openRegistration() | Organizer | REGISTRATION_OPENED |
| WAITING_FOR_PLAYERS | STARTED | start() | Organizer | GAME_STARTED |
| STARTED | IN_PROGRESS | assignFirstNode() | Engine | NODE_ASSIGNED |
| IN_PROGRESS | PAUSED | pause() | Organizer | GAME_PAUSED |
| PAUSED | IN_PROGRESS | resume() | Organizer | GAME_RESUMED |
| IN_PROGRESS | FINISHED | finish() | Engine | GAME_FINISHED |
| FINISHED | ARCHIVED | archive() | Admin | GAME_ARCHIVED |

### 2.3. Запрещенные переходы

| From | To | Почему запрещено |
| :--- | :--- | :--- |
| CREATED | STARTED | Игра должна быть опубликована |
| PUBLISHED | PAUSED | Нельзя поставить на паузу неактивную игру |
| FINISHED | IN_PROGRESS | Нельзя возобновить завершенную игру |

---

## 3. Состояния команды

### 3.1. TeamStatus

```
REGISTERED
   │
   ▼
ACTIVE
   │
   ▼
WAITING_ANSWER
   │
   ├── NODE_COMPLETED
   │      │
   │      ▼
   │   NEXT_NODE
   │      │
   │      ▼
   │   WAITING_ANSWER
   │
   ├── NODE_FAILED
   │      │
   │      ▼
   │   WAITING_ANSWER
   │
   ▼
FINISHED
```

### 3.2. Переходы команды

| From | To | Триггер | Кто | Событие |
| :--- | :--- | :--- | :--- | :--- |
| REGISTERED | ACTIVE | gameStart() | Engine | TEAM_ACTIVATED |
| ACTIVE | WAITING_ANSWER | assignNode() | Engine | NODE_ASSIGNED |
| WAITING_ANSWER | NODE_COMPLETED | answerAccepted() | Engine | ANSWER_ACCEPTED |
| NODE_COMPLETED | NEXT_NODE | transition() | Engine | NODE_COMPLETED |
| NEXT_NODE | WAITING_ANSWER | assignNode() | Engine | NODE_ASSIGNED |
| WAITING_ANSWER | NODE_FAILED | answerRejected() | Engine | ANSWER_REJECTED |
| NODE_FAILED | WAITING_ANSWER | retry() | Engine | NODE_RETRY |
| WAITING_ANSWER | FINISHED | gameFinish() | Engine | TEAM_FINISHED |

---

## 4. Реализация StateMachine

```typescript
class StateMachine<T extends string> {
  private transitions: Map<string, Map<string, Transition>> = new Map();

  addTransition(from: T, to: T, trigger: string, actor: Actor, event: EventType): void {
    if (!this.transitions.has(from)) {
      this.transitions.set(from, new Map());
    }
    this.transitions.get(from)!.set(trigger, {
      from,
      to,
      trigger,
      actor,
      event
    });
  }

  canTransition(from: T, trigger: string): boolean {
    return this.transitions.get(from)?.has(trigger) || false;
  }

  getTransition(from: T, trigger: string): Transition | undefined {
    return this.transitions.get(from)?.get(trigger);
  }

  transition(from: T, trigger: string): T {
    const transition = this.getTransition(from, trigger);
    if (!transition) {
      throw new Error(`Invalid transition: ${from} -> ${trigger}`);
    }
    return transition.to;
  }
}

// Использование
const gameStateMachine = new StateMachine<GameStatus>();

gameStateMachine.addTransition(
  'CREATED', 'PUBLISHED', 'publish', 'organizer', 'GAME_PUBLISHED'
);
gameStateMachine.addTransition(
  'PUBLISHED', 'WAITING_FOR_PLAYERS', 'openRegistration', 'organizer', 'REGISTRATION_OPENED'
);
gameStateMachine.addTransition(
  'WAITING_FOR_PLAYERS', 'STARTED', 'start', 'organizer', 'GAME_STARTED'
);
gameStateMachine.addTransition(
  'STARTED', 'IN_PROGRESS', 'assignFirstNode', 'engine', 'NODE_ASSIGNED'
);
gameStateMachine.addTransition(
  'IN_PROGRESS', 'PAUSED', 'pause', 'organizer', 'GAME_PAUSED'
);
gameStateMachine.addTransition(
  'PAUSED', 'IN_PROGRESS', 'resume', 'organizer', 'GAME_RESUMED'
);
gameStateMachine.addTransition(
  'IN_PROGRESS', 'FINISHED', 'finish', 'engine', 'GAME_FINISHED'
);

// Проверка перехода
if (gameStateMachine.canTransition(game.status, 'start')) {
  const transition = gameStateMachine.getTransition(game.status, 'start');
  game.status = transition.to;
  await eventStore.append(transition.event);
}
```

---

## 5. Хранение состояний

```typescript
// Состояние игры в БД
interface GameStateRecord {
  id: string;
  status: GameStatus;
  statusHistory: {
    from: GameStatus;
    to: GameStatus;
    trigger: string;
    actor: string;
    timestamp: Date;
  }[];
}

// Состояние команды в БД
interface TeamStateRecord {
  id: string;
  status: TeamStatus;
  statusHistory: {
    from: TeamStatus;
    to: TeamStatus;
    trigger: string;
    actor: string;
    timestamp: Date;
  }[];
}
```

---

## 6. Итоговый контракт

> **Каждое состояние имеет четкие переходы.**
>
> **Переходы явно определены.**
>
> **Нельзя перевести в произвольное состояние.**

---

**Кодовое имя проекта:** Adventure Engine  
**Главный принцип:** *Явные переходы — основа предсказуемости.*
```
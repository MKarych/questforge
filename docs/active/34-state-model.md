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
DRAFT
  │
  ▼
PUBLISHED
  │
  ▼
REGISTRATION_OPEN
  │
  ├── REGISTRATION_CLOSED
  │      │
  │      ▼
  │   LOBBY
  │      │
  │      ▼
  │   RUNNING
  │      │
  │      ▼
  │   FINISHED
  │      │
  │      ▼
  │   ARCHIVED
  │
  ├── CANCELLED
  │
  └── RESCHEDULED
        │
        ▼
     PUBLISHED

HIDDEN (может быть установлен из PUBLISHED, REGISTRATION_OPEN, REGISTRATION_CLOSED администратором)
BLOCKED (может быть установлен из любого статуса администратором)
```

### 2.2. Переходы игры

| From | To | Триггер | Кто | Событие |
| :--- | :--- | :--- | :--- | :--- |
| DRAFT | PUBLISHED | publish() | Organizer | GAME_PUBLISHED |
| PUBLISHED | REGISTRATION_OPEN | openRegistration() | Organizer | REGISTRATION_OPENED |
| REGISTRATION_OPEN | REGISTRATION_CLOSED | closeRegistration() | Organizer | REGISTRATION_CLOSED |
| REGISTRATION_CLOSED | LOBBY | moveToLobby() | Organizer | GAME_MOVED_TO_LOBBY |
| LOBBY | RUNNING | start() | Organizer | GAME_STARTED |
| RUNNING | FINISHED | finish() | Engine | GAME_FINISHED |
| FINISHED | ARCHIVED | archive() | Admin | GAME_ARCHIVED |
| PUBLISHED | CANCELLED | cancel() | Organizer | GAME_CANCELLED |
| REGISTRATION_OPEN | CANCELLED | cancel() | Organizer | GAME_CANCELLED |
| REGISTRATION_CLOSED | CANCELLED | cancel() | Organizer | GAME_CANCELLED |
| LOBBY | CANCELLED | cancel() | Organizer | GAME_CANCELLED |
| PUBLISHED | RESCHEDULED | reschedule() | Organizer | GAME_RESCHEDULED |
| RESCHEDULED | PUBLISHED | publish() | Organizer | GAME_PUBLISHED |
| * | HIDDEN | adminHide() | Admin | GAME_HIDDEN |
| HIDDEN | * | adminUnhide() | Admin | GAME_UNHIDDEN |
| * | BLOCKED | adminBlock() | Admin | GAME_BLOCKED |
| BLOCKED | * | adminUnblock() | Admin | GAME_UNBLOCKED |

### 2.3. Запрещенные переходы

| From | To | Почему запрещено |
| :--- | :--- | :--- |
| DRAFT | REGISTRATION_OPEN | Игра должна быть опубликована |
| DRAFT | LOBBY | Игра должна пройти регистрацию |
| PUBLISHED | RUNNING | Игра должна пройти регистрацию и лобби |
| FINISHED | RUNNING | Нельзя возобновить завершенную игру |
| ARCHIVED | * | Архивная игра не может быть изменена |

---

## 3. Состояния команды

### 3.1. TeamStatus

```
ACTIVE
  │
  ├── RECRUITING
  │      │
  │      ▼
  │   ACTIVE
  │
  ├── INACTIVE
  │      │
  │      ▼
  │   ACTIVE
  │
  ├── ARCHIVED
  │
  └── DELETED
```

### 3.2. Переходы команды

| From | To | Триггер | Кто | Событие |
| :--- | :--- | :--- | :--- | :--- |
| ACTIVE | RECRUITING | setRecruiting() | Captain | TEAM_RECRUITING |
| RECRUITING | ACTIVE | closeRecruiting() | Captain | TEAM_CLOSED |
| ACTIVE | INACTIVE | setInactive() | Captain | TEAM_INACTIVE |
| INACTIVE | ACTIVE | setActive() | Captain | TEAM_ACTIVE |
| ACTIVE | ARCHIVED | archive() | Captain/Admin | TEAM_ARCHIVED |
| ACTIVE | DELETED | delete() | Captain/Admin | TEAM_DELETED |
| RECRUITING | DELETED | delete() | Captain/Admin | TEAM_DELETED |
| INACTIVE | DELETED | delete() | Captain/Admin | TEAM_DELETED |

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
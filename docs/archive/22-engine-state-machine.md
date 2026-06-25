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
```

### 1.1. Состояния игры

| Состояние | Описание | Действия организатора |
| :--- | :--- | :--- |
| **CREATED** | Игра создана, черновик | Редактирование, удаление |
| **PUBLISHED** | Игра опубликована, видна в каталоге | Снятие с публикации |
| **WAITING_FOR_PLAYERS** | Ожидание регистрации команд | Старт игры |
| **STARTED** | Игра началась, команды в игре | Пауза, завершение |
| **IN_PROGRESS** | Игра активна | Пауза, завершение |
| **PAUSED** | Игра на паузе | Продолжить |
| **FINISHED** | Игра завершена | Аналитика, просмотр |

---

### 1.2. Переходы игры

| Откуда | Куда | Триггер | Кто | Событие |
| :--- | :--- | :--- | :--- | :--- |
| CREATED | PUBLISHED | `publish()` | Organizer | GAME_PUBLISHED |
| PUBLISHED | WAITING_FOR_PLAYERS | `openRegistration()` | Organizer | REGISTRATION_OPENED |
| WAITING_FOR_PLAYERS | STARTED | `start()` | Organizer | GAME_STARTED |
| STARTED | IN_PROGRESS | `assignFirstNode()` | Engine | NODE_ASSIGNED |
| IN_PROGRESS | PAUSED | `pause()` | Organizer | GAME_PAUSED |
| PAUSED | IN_PROGRESS | `resume()` | Organizer | GAME_RESUMED |
| IN_PROGRESS | FINISHED | `finish()` | Engine | GAME_FINISHED |

---

## 2. Жизненный цикл команды

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

### 2.1. Состояния команды

| Состояние | Описание |
| :--- | :--- |
| **REGISTERED** | Команда зарегистрирована, ждет старта |
| **ACTIVE** | Команда в игре, может получать задания |
| **WAITING_ANSWER** | Команда получила задание, ждет ответа |
| **NODE_COMPLETED** | Задание выполнено успешно |
| **NODE_FAILED** | Задание провалено |
| **NEXT_NODE** | Переход к следующему заданию |
| **FINISHED** | Команда завершила игру |

---

### 2.2. Переходы команды

| Откуда | Куда | Триггер | Кто | Событие |
| :--- | :--- | :--- | :--- | :--- |
| REGISTERED | ACTIVE | `gameStart()` | Engine | TEAM_ACTIVATED |
| ACTIVE | WAITING_ANSWER | `assignNode()` | Engine | NODE_ASSIGNED |
| WAITING_ANSWER | NODE_COMPLETED | `answerAccepted()` | Engine | ANSWER_ACCEPTED |
| NODE_COMPLETED | NEXT_NODE | `transition()` | Engine | NODE_COMPLETED |
| NEXT_NODE | WAITING_ANSWER | `assignNode()` | Engine | NODE_ASSIGNED |
| WAITING_ANSWER | NODE_FAILED | `answerRejected()` | Engine | ANSWER_REJECTED |
| NODE_FAILED | WAITING_ANSWER | `retry()` | Engine | NODE_RETRY |
| WAITING_ANSWER | FINISHED | `gameFinish()` | Engine | TEAM_FINISHED |

---

## 3. Реализация StateMachine

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

## 4. Запрещенные переходы

| Откуда | Куда | Почему запрещено |
| :--- | :--- | :--- |
| CREATED | STARTED | Игра должна быть опубликована |
| PUBLISHED | PAUSED | Нельзя поставить на паузу неактивную игру |
| FINISHED | IN_PROGRESS | Нельзя возобновить завершенную игру |

---

## 5. Итоговый контракт

> **Игра и команда имеют четкие состояния.**
>
> **Переходы строго определены.**
>
> **Нельзя перевести в произвольное состояние.**

---

**Кодовое имя проекта:** Adventure Engine  
**Главный принцип:** *Явные переходы — основа предсказуемости.*
```
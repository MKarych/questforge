```markdown
# 50. Runtime Engine Spec: Архитектурный контракт движка исполнения сценариев

> **Дата:** 24.06.2026  
> **Статус:** Утвержден  
> **Версия:** 2.0  
> **Класс:** Архитектурный контракт (10/10)  
> **Цель:** Описать ядро исполнения сценариев — движок, который делает возможным прохождение любых игр: от городских квестов до квизов, корпоративов и RPG.

---

## 1. Фундаментальные принципы

1. **Движок — единственный источник истины.** Все игровые состояния хранятся и вычисляются только в Engine.
2. **Детерминизм.** Одинаковый вход → одинаковый выход.
3. **Audit Log.** Все события сохраняются для аудита и отладки (Event Sourcing — в v2.0).
4. **Server-Authoritative.** Frontend никогда не доверяется.
5. **Расширяемость.** Новые типы сцен, миссий и механик добавляются без изменения ядра.
6. **Универсальность.** Движок поддерживает любые форматы: городские квесты, квизы, мозгобойни, корпоративы, RPG, конференции, музеи.

---

## 2. Основные сущности (Core Entities)

### 2.1. Scenario (Сценарий)

```typescript
interface Scenario {
  id: string;
  name: string;
  description: string;
  version: number;
  scenes: Scene[];
  startSceneId: string;
  variables: VariableDefinition[];
  metadata: ScenarioMetadata;
  createdAt: Date;
  updatedAt: Date;
}
2.2. Scene (Сцена)
Scene — это игровая сцена. Это может быть локация, раунд квиза, экран диалога, игровое поле или слайд презентации.

typescript
interface Scene {
  id: string;
  type: 'location' | 'quiz' | 'dialogue' | 'game' | 'slide' | 'custom';
  title: string;
  description: string;
  view: View;
  missions: Mission[];
  transitions: Transition[];
  position: { x: number; y: number };
  metadata: {
    gps?: { lat: number; lng: number; radius: number };
    timer?: number;
    requiredRole?: string;
    conditions?: Condition[];
  };
}
Типы сцен:

Тип	Описание	GPS	Применение
location	Физическая локация	✅	Городские квесты
quiz	Раунд викторины	❌	Квизы, мозгобойня
dialogue	Диалог с NPC	❌	RPG, нарративные игры
game	Игровая сцена	❌	Морской бой, крестики-нолики
slide	Слайд презентации	❌	Конференции, обучение
custom	Пользовательский тип	⚠️	Расширения
2.3. Mission (Задание)
Mission — переиспользуемая единица действия. Может использоваться в разных сценах.

typescript
interface Mission {
  id: string;
  type: 'text' | 'code' | 'photo' | 'gps' | 'qr' | 'choice' | 'collect' | 'dialogue';
  title: string;
  description: string;
  config: MissionConfig;
  rewards: Reward[];
  conditions: Condition[];
  hints: Hint[];
}
Типы миссий:

Тип	Описание	Валидация
text	Текстовый ответ	Точное совпадение / Regex
code	Кодовый ответ	Точное совпадение
photo	Загрузка фото	Ручная / AI проверка
gps	Геолокация	Проверка радиуса
qr	QR-код	Точное совпадение
choice	Выбор варианта	Совпадение с правильным
collect	Сбор предмета	Добавление в инвентарь
dialogue	Диалог с NPC	Анализ ответа
2.4. Team (Команда) — основная единица прохождения
typescript
interface Team {
  id: string;
  name: string;
  captainId: string;
  members: Player[];
  inventory: Inventory;
  variables: Record<string, any>;
  score: number;
  reputation: number;
  achievements: Achievement[];
}
2.5. Player (Игрок)
typescript
interface Player {
  id: string;
  name: string;
  role: TeamRole; // 'captain' | 'member' | 'observer'
}
2.6. GameSession (Сессия игры) — главный объект выполнения
typescript
interface GameSession {
  id: string;
  scenarioId: string;
  scenario: Scenario;
  teamId: string;
  team: Team;
  currentSceneId: string;
  variables: Record<string, any>;
  inventory: Inventory;
  score: number;
  achievements: Achievement[];
  status: SessionStatus; // 'created' | 'running' | 'paused' | 'finished' | 'cancelled' | 'failed'
  startedAt: Date;
  finishedAt: Date;
  events: AuditLog[];
  version: number; // Optimistic locking
}
Статусы сессии:

text
created → running → finished
         ↑          ↑
         └── paused ┘
         └── cancelled
         └── failed
3. Execution Engine (Движок выполнения)
3.1. Оркестратор выполнения
typescript
class ExecutionEngine {
  // Запуск сессии
  startSession(sessionId: string): GameSession;

  // Переход к сцене
  transitionToScene(sessionId: string, sceneId: string): GameSession;

  // Выполнение миссии
  executeMission(sessionId: string, missionId: string, answer: any): MissionResult;

  // Завершение сессии
  finishSession(sessionId: string): GameSession;
}
3.2. Порядок выполнения
text
1. Игрок открывает сценарий → создается GameSession
2. Движок загружает первую сцену (START)
3. Игрок выполняет Mission (отвечает, загружает фото и т.д.)
4. Движок проверяет Answer через Condition Engine
5. Движок применяет Reward Engine
6. Движок обновляет State
7. Движок определяет Transition (по условиям)
8. Движок загружает следующую Scene
9. Цикл повторяется до FINISH
10. GameSession завершается
3.3. Переходы (Transitions)
Directed Graph — разрешены циклы, но валидатор проверяет бесконечные циклы.

typescript
interface Transition {
  id: string;
  fromSceneId: string;
  toSceneId: string;
  condition: Condition;
  type: TransitionType; // 'manual' | 'auto' | 'conditional' | 'random'
}
Типы переходов:

Тип	Описание
manual	Игрок выбирает путь (кнопка)
auto	Автоматический переход после выполнения
conditional	Переход по условию (if/else)
random	Случайный переход (рандом)
4. Condition Engine (Движок условий) — AST
4.1. Структура условия (AST)
typescript
interface ConditionGroup {
  operator: 'AND' | 'OR';
  conditions: (SingleCondition | ConditionGroup)[];
}

interface SingleCondition {
  type: 'variable' | 'score' | 'inventory' | 'flag' | 'role' | 'time' | 'random';
  operator: 'eq' | 'ne' | 'gt' | 'lt' | 'gte' | 'lte' | 'contains' | 'has';
  left: string | number | boolean;
  right: string | number | boolean;
}
4.2. Примеры условий
typescript
// coins > 50
{
  type: 'variable',
  operator: 'gt',
  left: 'coins',
  right: 50
}

// coins > 50 AND hasKey == true
{
  operator: 'AND',
  conditions: [
    {
      type: 'variable',
      operator: 'gt',
      left: 'coins',
      right: 50
    },
    {
      type: 'variable',
      operator: 'eq',
      left: 'hasKey',
      right: true
    }
  ]
}

// role == 'captain'
{
  type: 'role',
  operator: 'eq',
  left: 'role',
  right: 'captain'
}
4.3. Вычисление условий
typescript
function evaluateCondition(condition: ConditionGroup, context: ExecutionContext): boolean {
  if (condition.operator === 'AND') {
    return condition.conditions.every(c => evaluateCondition(c, context));
  }
  if (condition.operator === 'OR') {
    return condition.conditions.some(c => evaluateCondition(c, context));
  }
  // SingleCondition
  const leftValue = resolveValue(condition.left, context);
  const rightValue = resolveValue(condition.right, context);
  return compare(leftValue, condition.operator, rightValue);
}
5. Reward Engine (Движок наград)
5.1. Структура награды
typescript
interface Reward {
  type: 'score' | 'money' | 'item' | 'achievement' | 'variable' | 'experience';
  target: 'team' | 'player' | 'all';
  value: any;
  message?: string;
}
5.2. Примеры наград
typescript
// Базовые
{ type: 'score', value: 10, target: 'team' }
{ type: 'money', value: 50, target: 'team' }
{ type: 'item', value: { id: 'key', quantity: 1 }, target: 'team' }

// Сложные
{ type: 'achievement', value: 'first_code', target: 'player' }
{ type: 'variable', value: { name: 'coins', operation: 'add', value: 10 }, target: 'team' }
{ type: 'experience', value: 20, target: 'team' }
5.3. Применение наград
typescript
function applyReward(reward: Reward, context: ExecutionContext): void {
  switch (reward.type) {
    case 'score':
      context.team.score += reward.value;
      break;
    case 'money':
      context.team.money += reward.value;
      break;
    case 'item':
      context.team.inventory.add(reward.value);
      break;
    case 'achievement':
      context.team.achievements.push(reward.value);
      break;
    case 'variable':
      context.variables[reward.value.name] += reward.value.value;
      break;
    case 'experience':
      context.team.experience += reward.value;
      break;
  }
}
6. Trigger System (Система триггеров)
6.1. Структура триггера
typescript
interface Trigger {
  id: string;
  event: string; // 'onTimer' | 'onScore' | 'onSceneEnter' | 'onSceneComplete' | 'onAchievement'
  conditions: ConditionGroup;
  actions: Action[];
}
6.2. Примеры триггеров
typescript
// Когда осталось 10 минут
{
  id: 'timer-10min',
  event: 'onTimer',
  conditions: {
    type: 'time',
    operator: 'lte',
    left: 'remaining',
    right: 600
  },
  actions: [
    { type: 'sendPush', config: { message: 'Осталось 10 минут!' } }
  ]
}

// Когда команда набрала 100 очков
{
  id: 'score-100',
  event: 'onScore',
  conditions: {
    type: 'score',
    operator: 'gte',
    left: 'score',
    right: 100
  },
  actions: [
    { type: 'unlockAchievement', config: { achievement: 'score-master' } },
    { type: 'addScore', config: { value: 20 } }
  ]
}
7. Scheduler (Планировщик)
7.1. Структура
typescript
interface Schedule {
  id: string;
  type: 'absolute' | 'relative' | 'periodic';
  at?: string; // "2026-06-24T20:00:00Z" (absolute)
  delay?: number; // 900 (сек) (relative)
  interval?: number; // 300 (сек) (periodic)
  action: Action;
}
7.2. Примеры
typescript
// Старт раунда в 20:00
{
  id: 'round-start',
  type: 'absolute',
  at: '2026-06-24T20:00:00Z',
  action: { type: 'startRound', config: { roundId: 'round-2' } }
}

// Подсказка через 15 минут
{
  id: 'hint-delay',
  type: 'relative',
  delay: 900,
  action: { type: 'showHint', config: { hint: 'Посмотрите на колонну' } }
}

// Автофиниш через 3 часа
{
  id: 'auto-finish',
  type: 'relative',
  delay: 10800,
  action: { type: 'finishGame', config: {} }
}
8. Audit Log (Аудит)
Для MVP используем Audit Log (храним только факты). Event Sourcing (восстановление состояния из событий) — в v2.0.

8.1. Структура
typescript
interface AuditLog {
  id: string;
  sessionId: string;
  teamId: string;
  type: AuditEventType;
  payload: any;
  timestamp: Date;
  sequence: number;
}

enum AuditEventType {
  SESSION_CREATED = 'session.created',
  SCENE_ENTERED = 'scene.entered',
  SCENE_EXITED = 'scene.exited',
  MISSION_STARTED = 'mission.started',
  MISSION_COMPLETED = 'mission.completed',
  MISSION_FAILED = 'mission.failed',
  ANSWER_SUBMITTED = 'answer.submitted',
  ANSWER_CORRECT = 'answer.correct',
  ANSWER_WRONG = 'answer.wrong',
  HINT_USED = 'hint.used',
  REWARD_APPLIED = 'reward.applied',
  SCORE_CHANGED = 'score.changed',
  ACHIEVEMENT_UNLOCKED = 'achievement.unlocked',
  ITEM_ADDED = 'item.added',
  ITEM_REMOVED = 'item.removed',
  TRANSITION = 'transition',
  SESSION_FINISHED = 'session.finished',
  SESSION_FAILED = 'session.failed',
  SESSION_CANCELLED = 'session.cancelled',
}
8.2. Пример
json
{
  "id": "log-001",
  "sessionId": "sess-123",
  "teamId": "team-456",
  "type": "mission.completed",
  "payload": {
    "sceneId": "scene-1",
    "missionId": "mission-1",
    "answer": "Красная",
    "score": 10
  },
  "timestamp": "2026-06-24T12:00:00Z",
  "sequence": 42
}
9. Anti-Cheat Model
9.1. Принципы
Server-Authoritative. Все проверки на сервере.

Локальная + серверная проверка. GPS проверяется локально (предварительно) и на сервере (финально).

Rate Limiting. Ограничение на количество запросов.

Аномалии. Подозрительные действия логируются.

9.2. GPS Anti-Cheat
text
1. Локальная предварительная проверка (на устройстве)
2. Серверная финальная проверка (при синхронизации)
3. Если проверка не совпадает → ошибка "GPS не подтверждён"
4. Максимальная скорость перемещения между точками (пешком 5 км/ч, авто 60 км/ч)
9.3. Ответы
text
Ограничение на количество попыток (3-5)
Время между ответами (минимум 2 секунды)
Подозрительно быстрые ответы → запрос CAPTCHA
10. State Machine (Машина состояний)
typescript
enum SessionStatus {
  CREATED = 'created',
  RUNNING = 'running',
  PAUSED = 'paused',
  FINISHED = 'finished',
  CANCELLED = 'cancelled',
  FAILED = 'failed',
}
Переходы:

text
CREATED → RUNNING
RUNNING → PAUSED
PAUSED → RUNNING
RUNNING → FINISHED
RUNNING → CANCELLED
RUNNING → FAILED
Запрещенные переходы:

text
CREATED → FINISHED ❌
FINISHED → RUNNING ❌
CANCELLED → RUNNING ❌
FAILED → RUNNING ❌
11. Public API
Метод	URL	Описание
POST	/sessions	Создать сессию
GET	/sessions/:id	Получить состояние сессии
POST	/sessions/:id/start	Начать игру
POST	/sessions/:id/pause	Поставить на паузу
POST	/sessions/:id/resume	Продолжить игру
POST	/sessions/:id/finish	Завершить игру
POST	/sessions/:id/answer	Отправить ответ
GET	/sessions/:id/audit	Получить аудит-лог
GET	/sessions/:id/debug	Получить отладочную информацию
12. Архитектурные правила (Контракт для агентов)
Движок — единственный источник истины.

Все изменения проходят через Execution Engine.

Каждое изменение сохраняется в Audit Log.

Состояние сессии — immutable (только через апдейты).

Условия проверяются через Condition Engine (AST).

Награды начисляются через Reward Engine.

Валидация сценария обязательна перед запуском.

Оптимистическая блокировка (version) обязательна.

Все внешние зависимости передаются через контекст.

Детерминизм обязателен для воспроизводимости.

Дата: 24.06.2026
Статус: Утвержден
Класс: Архитектурный контракт (10/10)
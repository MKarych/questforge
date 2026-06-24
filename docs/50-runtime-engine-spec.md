markdown
# 50. Runtime Engine Spec: Архитектурный контракт движка исполнения сценариев

> **Дата:** 24.06.2026  
> **Статус:** Утвержден  
> **Версия:** 1.0  
> **Класс:** Архитектурный контракт (10/10)  
> **Цель:** Описать ядро исполнения сценариев — движок, который делает возможным прохождение любых игр: от городских квестов до квизов, корпоративов и RPG.

---

## 1. Фундаментальные принципы

1. **Движок — единственный источник истины.** Все игровые состояния хранятся и вычисляются только в Engine.
2. **Детерминизм.** Одинаковый вход → одинаковый выход.
3. **Event Sourcing.** Все события сохраняются.
4. **Server-Authoritative.** Frontend никогда не доверяется.
5. **Расширяемость.** Новые типы узлов, миссий и механик добавляются без изменения ядра.
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
  nodes: Node[];
  startNodeId: string;
  variables: VariableDefinition[];
  metadata: ScenarioMetadata;
  createdAt: Date;
  updatedAt: Date;
}
2.2. Node (Игровая сцена)
Node = Игровая сцена. Это может быть локация, раунд, этап, комната — любая точка в игровом пространстве.

typescript
interface Node {
  id: string;
  type: NodeType; // 'location' | 'quiz' | 'dialogue' | 'conference' | 'rpg' | 'custom'
  title: string;
  description: string;
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
Типы узлов:

Тип	Описание	GPS	Применение
location	Физическая локация	✅	Городские квесты
quiz	Раунд викторины	❌	Квизы, мозгобойня
dialogue	Диалог с NPC	❌	RPG, нарративные игры
conference	Секция конференции	❌	Мероприятия
rpg	RPG-сцена	❌	Ролевые игры
custom	Пользовательский тип	⚠️	Расширения
2.3. Mission (Задание)
Mission — переиспользуемая единица действия. Может использоваться в разных узлах.

typescript
interface Mission {
  id: string;
  type: MissionType; // 'text' | 'code' | 'photo' | 'gps' | 'qr' | 'choice' | 'collect' | 'dialogue'
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
  currentNodeId: string;
  variables: Record<string, any>; // Текущие переменные
  inventory: Inventory; // Текущий инвентарь
  score: number;
  achievements: Achievement[];
  status: SessionStatus; // 'created' | 'running' | 'paused' | 'finished' | 'cancelled'
  startedAt: Date;
  finishedAt: Date;
  events: GameEvent[];
  version: number; // Optimistic locking
}
Статусы сессии:

text
created → running → finished
         ↑          ↑
         └── paused ┘
         └── cancelled
3. Execution Engine (Движок выполнения)
3.1. Оркестратор выполнения
typescript
class ExecutionEngine {
  // Запуск сессии
  startSession(sessionId: string): GameSession;

  // Переход к узлу
  transitionToNode(sessionId: string, nodeId: string): GameSession;

  // Выполнение миссии
  executeMission(sessionId: string, missionId: string, answer: any): MissionResult;

  // Завершение сессии
  finishSession(sessionId: string): GameSession;
}
3.2. Порядок выполнения
text
1. Игрок отправляет ответ (Mission)
   ↓
2. Execution Engine принимает событие
   ↓
3. Проверка: активна ли сессия?
   ↓
4. Проверка: правильный ли узел?
   ↓
5. Проверка: правильная ли миссия?
   ↓
6. Condition Engine проверяет условия
   ↓
7. Выполняется логика миссии
   ↓
8. Reward Engine начисляет награды
   ↓
9. State Engine обновляет состояние
   ↓
10. Event System генерирует события
   ↓
11. Event Log сохраняет все изменения
   ↓
12. Проверка переходов (Transitions)
   ↓
13. Возврат нового состояния игроку
3.3. Переходы (Transitions)
Directed Graph — разрешены циклы, но валидатор проверяет бесконечные циклы.

typescript
interface Transition {
  id: string;
  fromNodeId: string;
  toNodeId: string;
  condition: Condition;
  type: TransitionType; // 'manual' | 'auto' | 'conditional' | 'random'
}
Типы переходов:

Тип	Описание
manual	Игрок выбирает путь (кнопка)
auto	Автоматический переход после выполнения
conditional	Переход по условию (if/else)
random	Случайный переход (рандом)
4. State Engine (Движок состояния)
4.1. Переменные
typescript
interface VariableDefinition {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  defaultValue: any;
  scope: 'local' | 'global';
}

interface VariableState {
  [key: string]: any;
}
Системные переменные:

text
team.name
team.score
team.members
player.name
player.role
game.time
game.elapsed
game.currentNode
game.totalNodes
Пользовательские переменные:

text
coins: number = 0
health: number = 100
reputation: number = 50
has_key: boolean = false
4.2. Операции с переменными
typescript
enum VariableOperation {
  SET = 'set',
  ADD = 'add',
  SUBTRACT = 'subtract',
  MULTIPLY = 'multiply',
  DIVIDE = 'divide',
  INCREMENT = 'increment',
  DECREMENT = 'decrement',
}
Примеры:

text
coins += 10
health -= 20
reputation = 50
has_key = true
4.3. Инвентарь
typescript
interface Inventory {
  items: InventoryItem[];
  capacity: number;
}

interface InventoryItem {
  id: string;
  name: string;
  description: string;
  type: ItemType; // 'key' | 'consumable' | 'currency' | 'quest' | 'weapon' | 'armor'
  quantity: number;
  icon: string;
  effects: ItemEffect[];
}
Операции с инвентарем:

text
addItem('key', 1)
removeItem('key', 1)
hasItem('key')
5. Condition Engine (Движок условий)
5.1. Структура условия
typescript
interface Condition {
  type: ConditionType;
  operator: Operator;
  left: string | number | boolean | VariableReference;
  right: string | number | boolean | VariableReference;
  children?: Condition[];
}

enum ConditionType {
  SINGLE = 'single',
  AND = 'and',
  OR = 'or',
  NOT = 'not',
}

enum Operator {
  EQ = 'eq', // ==
  NE = 'ne', // !=
  GT = 'gt', // >
  LT = 'lt', // <
  GTE = 'gte', // >=
  LTE = 'lte', // <=
  CONTAINS = 'contains',
  STARTS_WITH = 'startsWith',
  ENDS_WITH = 'endsWith',
  MATCHES = 'matches', // regex
  HAS_ITEM = 'hasItem',
  HAS_ACHIEVEMENT = 'hasAchievement',
  HAS_ROLE = 'hasRole',
}
5.2. Примеры условий
text
coins > 50
hasItem('key') == true
player.role == 'captain'
score >= 100 AND hasItem('key')
reputation > 50 OR team.members > 3
NOT hasItem('key')
5.3. Использование в узлах и переходах
typescript
// В узле
if (coins > 50) {
  // Показать секретную комнату
}

// В переходе
{
  from: 'node-1',
  to: 'node-2',
  condition: 'coins > 50'
}
6. Reward Engine (Движок наград)
6.1. Структура награды
typescript
interface Reward {
  type: RewardType;
  target: 'team' | 'player' | 'all';
  value: any;
  message?: string;
}

enum RewardType {
  ADD_SCORE = 'addScore',
  ADD_MONEY = 'addMoney',
  ADD_EXPERIENCE = 'addExperience',
  GIVE_ITEM = 'giveItem',
  UNLOCK_ACHIEVEMENT = 'unlockAchievement',
  SET_VARIABLE = 'setVariable',
  ADD_REPUTATION = 'addReputation',
  TELEPORT = 'teleport',
  UNLOCK_NODE = 'unlockNode',
}
6.2. Примеры наград
typescript
// Базовые
{ type: 'addScore', value: 10, target: 'team' }
{ type: 'addMoney', value: 50, target: 'team' }
{ type: 'giveItem', value: { id: 'key', quantity: 1 }, target: 'team' }

// Сложные
{ type: 'unlockAchievement', value: 'first_code', target: 'player' }
{ type: 'setVariable', value: { name: 'coins', operation: 'add', value: 10 }, target: 'team' }
{ type: 'teleport', value: 'node-5', target: 'team' }
7. Event System (Событийная модель)
7.1. Типы событий
typescript
enum GameEventType {
  // Системные
  SESSION_CREATED = 'session.created',
  SESSION_STARTED = 'session.started',
  SESSION_FINISHED = 'session.finished',
  SESSION_PAUSED = 'session.paused',
  SESSION_RESUMED = 'session.resumed',
  SESSION_CANCELLED = 'session.cancelled',

  // Игроки
  PLAYER_JOINED = 'player.joined',
  PLAYER_LEFT = 'player.left',
  PLAYER_ANSWERED = 'player.answered',

  // Узлы
  NODE_ENTERED = 'node.entered',
  NODE_EXITED = 'node.exited',
  NODE_COMPLETED = 'node.completed',
  NODE_FAILED = 'node.failed',

  // Миссии
  MISSION_STARTED = 'mission.started',
  MISSION_COMPLETED = 'mission.completed',
  MISSION_FAILED = 'mission.failed',

  // Награды
  REWARD_APPLIED = 'reward.applied',
  SCORE_CHANGED = 'score.changed',
  ACHIEVEMENT_UNLOCKED = 'achievement.unlocked',

  // Инвентарь
  ITEM_ADDED = 'item.added',
  ITEM_REMOVED = 'item.removed',

  // Переменные
  VARIABLE_CHANGED = 'variable.changed',

  // Таймеры
  TIMER_STARTED = 'timer.started',
  TIMER_TICK = 'timer.tick',
  TIMER_EXPIRED = 'timer.expired',
}
7.2. События (Action-реакция)
typescript
interface EventAction {
  on: GameEventType;
  actions: Action[];
}

interface Action {
  type: ActionType;
  config: any;
}

enum ActionType {
  SEND_PUSH = 'sendPush',
  GIVE_ITEM = 'giveItem',
  ADD_SCORE = 'addScore',
  TELEPORT = 'teleport',
  UNLOCK_NODE = 'unlockNode',
  PLAY_SOUND = 'playSound',
  SHOW_IMAGE = 'showImage',
  SET_VARIABLE = 'setVariable',
  UNLOCK_ACHIEVEMENT = 'unlockAchievement',
}
7.3. Пример
typescript
// При получении достижения
{
  on: 'achievement.unlocked',
  actions: [
    { type: 'sendPush', config: { message: '🎉 Вы получили достижение!' } },
    { type: 'addScore', config: { value: 50 } },
    { type: 'playSound', config: { sound: 'success.mp3' } }
  ]
}
8. Event Log (Лог событий)
8.1. Структура лога
typescript
interface EventLog {
  id: string;
  sessionId: string;
  teamId: string;
  type: GameEventType;
  payload: any;
  timestamp: Date;
  sequence: number;
  version: number;
}
8.2. Примеры записей
json
{
  "id": "evt-001",
  "sessionId": "sess-123",
  "teamId": "team-456",
  "type": "player.answered",
  "payload": {
    "playerId": "player-789",
    "nodeId": "node-1",
    "missionId": "mission-1",
    "answer": "Красная",
    "correct": true
  },
  "timestamp": "2026-06-24T12:00:00Z",
  "sequence": 42,
  "version": 1
}
8.3. Назначение
Отладка: Понимание, что произошло

Споры: Доказательство действий игроков

Аналитика: Построение тепловых карт

Античит: Обнаружение аномалий

Replay: Воспроизведение игры

9. Validation Engine (Движок валидации)
9.1. Проверки сценария
typescript
interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

interface ValidationError {
  code: string;
  nodeId?: string;
  missionId?: string;
  message: string;
  severity: 'error' | 'warning';
}
9.2. Правила валидации
Правило	Код	Тип	Блокирует публикацию?
Есть START узел	NO_START	error	✅
Есть FINISH узел	NO_FINISH	error	✅
Нет бесконечных циклов	INFINITE_LOOP	error	✅
Все узлы достижимы	ORPHAN_NODE	warning	❌
Все переходы валидны	BROKEN_TRANSITION	error	✅
Все миссии имеют конфиг	MISSION_NO_CONFIG	error	✅
Переменные существуют	UNKNOWN_VARIABLE	error	✅
10. Runtime Debugger (DevTools)
10.1. Панель отладки
typescript
interface DebuggerPanel {
  sessionId: string;
  currentNodeId: string;
  variables: Record<string, any>;
  inventory: Inventory;
  score: number;
  achievements: Achievement[];
  events: EventLog[];
  timers: Timer[];
}
10.2. Функции
text
Просмотр состояния сессии
Просмотр переменных
Просмотр инвентаря
Просмотр лога событий
Временная шкала
Симуляция ответов
Перемотка времени
Экспорт лога
10.3. Доступ
text
Только для разработчиков
Только для авторов сценариев (в тестовом режиме)
Доступен в панели организатора
11. Public API (Доступные эндпоинты)
Метод	URL	Описание
POST	/sessions	Создать сессию
GET	/sessions/:id	Получить состояние сессии
POST	/sessions/:id/start	Начать игру
POST	/sessions/:id/pause	Поставить на паузу
POST	/sessions/:id/resume	Продолжить игру
POST	/sessions/:id/finish	Завершить игру
POST	/sessions/:id/answer	Отправить ответ
GET	/sessions/:id/debug	Получить отладочную информацию
GET	/sessions/:id/events	Получить лог событий
12. Архитектурные правила (Контракт для агентов)
Движок — единственный источник истины.

Все изменения проходят через Execution Engine.

Каждое изменение сохраняется в Event Log.

Состояние сессии — immutable (только через апдейты).

Условия проверяются через Condition Engine.

Награды начисляются через Reward Engine.

Валидация сценария обязательна перед запуском.

Оптимистическая блокировка (version) обязательна.

Все внешние зависимости передаются через контекст.

Детерминизм обязателен для воспроизводимости.

13. Связи с другими документами
Документ	Связь
47-game-module-spec.md	Игровой модуль использует движок для прохождения
49-scenario-editor-ultimate-spec.md	Редактор создаёт сценарии для движка
38-test-contract.md	Тестирование движка через сценарии
10-development-rules.md	Правила разработки движка
14. Итоговый принцип
Движок исполнения сценариев — это ядро платформы. Он не знает о фронтенде, БД, WebSocket. Он только исполняет сценарии и управляет состоянием игры.

Дата: 24.06.2026
Статус: Утвержден
Класс: Архитектурный контракт (10/10)
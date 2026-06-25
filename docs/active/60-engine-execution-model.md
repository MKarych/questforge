> **Дата:** 27.06.2026  
> **Статус:** Утвержден  
> **Версия:** 1.0  
> **Класс:** Архитектурный контракт (10/10)  
> **Цель:** Описать ядро исполнения сценариев — как Engine обрабатывает ответы, управляет состоянием и переводит команду от узла к узлу.

---

## 1. Место Engine в системе
API / WEBSOCKET
↓
ENGINE ORCHESTRATOR

Единственная точка входа

Управляет блокировками

Координирует все модули
↓
┌────┼────┐
↓ ↓ ↓
NODE RULES STATE
RESOLVER ENGINE MANAGER
↓ ↓ ↓
TRANSITION RESOLVER

text

---

## 2. Основные сущности

### 2.1. Node (Узел/Задание)

```typescript
interface Node {
  id: string;
  type: NodeType;
  title: string;
  description: string;
  config: NodeConfig;
  transitions: Transition[];
  timer?: number;
  penalties?: Penalty[];
  rewards?: Reward[];
  hints?: Hint[];
}
2.2. NodeType
typescript
enum NodeType {
  START = 'START',
  FINISH = 'FINISH',
  TEXT = 'TEXT',
  CODE = 'CODE',
  PHOTO = 'PHOTO',
  GPS = 'GPS',
  QR = 'QR',
  CHOICE = 'CHOICE',
  TIMER = 'TIMER',
  BRANCH = 'BRANCH',
  NPC = 'NPC',
  COMPOSITE = 'COMPOSITE',
}
2.3. Transition (Переход)
typescript
interface Transition {
  id: string;
  from: string;
  to: string;
  condition: TransitionCondition;
  label?: string;
}
2.4. TransitionCondition
typescript
enum TransitionCondition {
  ALWAYS = 'ALWAYS',
  SUCCESS = 'SUCCESS',
  FAIL = 'FAIL',
  TIMEOUT = 'TIMEOUT',
  SKIP = 'SKIP',
  CUSTOM = 'CUSTOM',
}
3. Жизненный цикл узла
3.1. Состояния узла для команды
typescript
enum NodeStatus {
  PENDING = 'PENDING',       // Ещё не начали
  IN_PROGRESS = 'IN_PROGRESS', // Игрок видит задание
  COMPLETED = 'COMPLETED',   // Пройдено успешно
  FAILED = 'FAILED',         // Провалено
  SKIPPED = 'SKIPPED',       // Пропущено (со штрафом)
  TIMEOUT = 'TIMEOUT',       // Время вышло
}
3.2. Поток выполнения
text
1. Команда входит в узел (NODE_ENTER)
   ↓
2. Состояние: IN_PROGRESS
   ↓
3. Запускается таймер (если есть)
   ↓
4. Команда отправляет ответ
   ↓
5. Rules Engine проверяет ответ
   ↓
6. Если ответ правильный:
   - Начисляются награды
   - Состояние: COMPLETED
   - Переход: SUCCESS
   ↓
7. Если ответ неправильный:
   - Применяется штраф (если есть)
   - Состояние: FAILED
   - Переход: FAIL (если есть), иначе повтор
   ↓
8. Если таймер истёк:
   - Состояние: TIMEOUT
   - Переход: TIMEOUT
   ↓
9. Transition Resolver находит следующий узел
   ↓
10. Команда переходит в следующий узел (NODE_EXIT → NODE_ENTER)
4. Rules Engine
4.1. Принцип
text
Rules Engine — единственное место, где проверяются ответы.
Детерминированная функция: одинаковый вход → одинаковый выход.
4.2. Проверка по типам узлов
Тип узла	Проверка
TEXT	Точное совпадение (регистронезависимо)
CODE	Точное совпадение
PHOTO	Всегда PENDING (ручная проверка)
GPS	Расстояние до точки < radius
QR	Точное совпадение
CHOICE	Совпадение с правильным вариантом
TIMER	Всегда SUCCESS (просто ждать)
4.3. Анти-читерство
text
1. Ответы проверяются ТОЛЬКО на сервере.
2. Клиент никогда не получает "правильный" ответ.
3. Максимальное количество попыток на узел: 3 (по умолчанию).
4. Минимальное время между ответами: 2 секунды.
5. Подозрительно быстрые ответы блокируются.
5. Награды и штрафы
5.1. Reward (Награда)
typescript
interface Reward {
  type: 'SCORE' | 'ITEM' | 'ACHIEVEMENT' | 'BONUS';
  value: any;
  condition?: string;
}
5.2. Penalty (Штраф)
typescript
interface Penalty {
  type: 'SCORE' | 'TIME' | 'LIFE';
  value: number;
  condition?: string;
}
5.3. Бонусы
typescript
// Бонус за скорость
{
  type: 'SPEED_BONUS',
  condition: 'time < 30s',
  value: 5
}

// Бонус за первое место
{
  type: 'RANK_BONUS',
  condition: 'rank == 1',
  value: 20
}
6. Таймеры
6.1. Типы таймеров
Тип	Описание
NODE_TIMER	Ограничение на узел
GAME_TIMER	Ограничение на всю игру
GLOBAL_TIMER	Общий таймер для всех команд
6.2. Обработка таймаута
text
Если таймер истёк:
1. Состояние узла → TIMEOUT
2. Применяется штраф (если есть)
3. Переход по TIMEOUT (если есть)
4. Иначе переход по FAIL
7. Проверка фото (Manual Review)
7.1. Статусы проверки
typescript
enum PhotoReviewStatus {
  PENDING = 'PENDING',           // Ожидает проверки
  APPROVED = 'APPROVED',         // Принято
  REJECTED = 'REJECTED',         // Отклонено
  RETRY_REQUIRED = 'RETRY_REQUIRED', // Нужно переделать
}
7.2. Поток
text
1. Игрок загружает фото → PENDING
2. Организатор видит в очереди
3. Организатор проверяет:
   - APPROVED → начисляются очки, переход
   - REJECTED → штраф, повтор
   - RETRY_REQUIRED → игрок перезагружает фото
8. Snapshot vs Replay
8.1. Снапшот (Snapshot)
text
Состояние команды сохраняется в PostgreSQL каждые 10 событий.
8.2. Восстановление (Replay)
text
Если Redis умер:
1. Загружается последний снапшот
2. Переигрываются события после снапшота
3. Восстанавливается актуальное состояние
9. Архитектурные правила
text
1. Engine — единственный источник истины.
2. Все изменения состояния проходят через Engine.
3. Rules Engine — детерминированная функция.
4. Клиент никогда не доверяется.
5. Все ответы проверяются на сервере.
6. Фото проверяются вручную (организатором).
7. Таймеры управляются Engine.
8. Награды и штрафы применяются Engine.
9. PostgreSQL — источник истины, Redis — кэш.
10. Каждое изменение логируется.
10. Чек-лист для реализации
Engine Orchestrator

Node Resolver

Rules Engine (TEXT, CODE, PHOTO, GPS, QR, CHOICE, TIMER)

Transition Resolver

State Manager

Награды и штрафы

Таймеры

Проверка фото (Manual Review)

Snapshot/Replay

Event Logging
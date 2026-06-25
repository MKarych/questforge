57. Team Session Model: Командная игра в реальном времени

> **Дата:** 27.06.2026  
> **Статус:** Утвержден  
> **Версия:** 1.0  
> **Класс:** Архитектурный контракт (10/10)  
> **Цель:** Описать модель командной игры, где несколько игроков играют со своих устройств как одна команда.

---

## 1. Фундаментальный принцип

**Игровое состояние принадлежит команде, а не отдельному игроку.**
Игрок А ──┐
Игрок Б ──┼── Команда "Ночные волки" ── TeamSession ── Engine
Игрок В ──┘

Состояние одно на всех.
Действие одного — синхронизируется мгновенно всем.

text

---

## 2. Модель данных

### 2.1. Team (Команда)

```typescript
interface Team {
  id: string;
  name: string;
  gameId: string;
  captainId: string;
  members: TeamMember[];
  createdAt: Date;
  updatedAt: Date;
}
2.2. TeamMember (Участник)
typescript
interface TeamMember {
  id: string;
  teamId: string;
  userId: string;
  role: 'CAPTAIN' | 'MEMBER' | 'OBSERVER';
  ready: boolean;
  readyAt: Date | null;
  joinedAt: Date;
}
2.3. TeamSession (Игровая сессия команды)
typescript
interface TeamSession {
  id: string;
  teamId: string;
  gameId: string;
  scenarioId: string;
  scenarioVersion: number;

  // Текущее состояние
  currentNodeId: string;
  currentNodeStartedAt: Date;
  stateVersion: number; // optimistic locking

  // Кто и когда
  lastAnsweredBy: string | null; // userId
  lastActivityAt: Date;

  // Прогресс
  score: number;
  penalties: number;
  completedNodes: string[];

  // Статус
  status: 'CREATED' | 'RUNNING' | 'PAUSED' | 'FINISHED';

  startedAt: Date;
  finishedAt: Date | null;
}
3. Кто может отправлять ответы
3.1. Режимы ответов
Режим	Кто отвечает	Когда использовать
CAPTAIN_ONLY	Только капитан	Строгие игры, где нужен единый голос
ANY_MEMBER (по умолчанию)	Любой участник	Большинство городских квестов
typescript
enum TeamAnswerMode {
  CAPTAIN_ONLY = 'CAPTAIN_ONLY',
  ANY_MEMBER = 'ANY_MEMBER',
}
3.2. Правило
text
По умолчанию — ANY_MEMBER.
Капитан не должен быть бутылочным горлышком.
4. Обработка одновременных ответов
4.1. Проблема
text
Игрок А отправил: "12345"  →  200 мс
Игрок Б отправил: "54321"  →  200 мс
Оба на тот же узел.

4.2. Решение
text
Первый успешно обработанный ответ становится каноническим.
Все остальные ответы на этот узел игнорируются.
typescript
interface AnswerResult {
  status: 'accepted' | 'ignored';
  reason?: 'NODE_ALREADY_RESOLVED';
  nodeId: string;
}
5. Синхронизация команды
5.1. Принцип
text
Когда кто-то ответил правильно:
  ↓
Узел завершён
  ↓
Команда переходит на следующий узел
  ↓
ВСЕ участники команды получают обновление
5.2. Канал синхронизации
typescript
// ❌ Неправильно — по одному игроку
realtime.broadcastToUser(userId, { ... });

// ✅ Правильно — по команде
realtime.broadcastToTeam(teamId, {
  type: 'NODE_ASSIGNED',
  nodeId: nextNodeId,
  score: newScore,
});
5.3. События для команды
Событие	Когда
NODE_ASSIGNED	Команда перешла на новый узел
SCORE_UPDATED	Изменился счёт команды
ANSWER_ACCEPTED	Ответ принят (кто-то из команды)
TEAM_FINISHED	Команда завершила игру
MEMBER_JOINED	Новый игрок присоединился
MEMBER_LEFT	Игрок покинул команду
6. Аудиторский след
6.1. Кто сделал действие?
typescript
interface TeamEvent {
  id: string;
  type: 'ANSWER_SUBMITTED' | 'ANSWER_ACCEPTED' | 'ANSWER_REJECTED';
  teamId: string;
  actorUserId: string; // ← КТО ИМЕННО
  nodeId: string;
  payload: any;
  timestamp: Date;
}
6.2. Зачем
text
Команда "Ночные волки"
Ответы:
  ✓ Код 12345 отправил: Иван
  ✓ Фото памятника отправила: Мария
  ✓ GPS точка подтвердил: Сергей
7. Общий инвентарь команды
7.1. Принцип
text
Team.Inventory — общий для всех участников.
7.2. Пример
text
Игрок А нашёл ключ
  ↓
Ключ добавлен в Team.Inventory
  ↓
Игрок Б сразу видит ключ
typescript
// ❌ Неправильно
player.inventory.add(key);

// ✅ Правильно
team.inventory.add(key);
8. Присутствие (Presence)
typescript
interface Presence {
  userId: string;
  teamId: string;
  status: 'ONLINE' | 'OFFLINE' | 'IDLE';
  lastSeenAt: Date;
  currentDevice: string;
}
Принцип:

Каждые 30 секунд клиент отправляет PING

Если PING нет 60 секунд — статус IDLE

Если нет 120 секунд — статус OFFLINE

9. Роли внутри команды
typescript
enum TeamRole {
  CAPTAIN = 'CAPTAIN',   // Полное управление
  MEMBER = 'MEMBER',     // Играет
  OBSERVER = 'OBSERVER', // Только смотрит (журналисты, стримеры, родители)
}
10. Голосование команды
typescript
enum DecisionMode {
  CAPTAIN_DECIDES,   // Только капитан
  FIRST_RESPONSE,    // Первый ответ — канонический
  MAJORITY_VOTE,     // Большинство голосов
}
По умолчанию — FIRST_RESPONSE.

11. Восстановление после падения движка
text
Redis является кэшем.
PostgreSQL Event Store является источником истины.
Любая TeamSession может быть восстановлена через replay событий.
12. Версия состояния
text
Любое изменение TeamSession обязательно увеличивает stateVersion на 1.
13. Архитектурные правила
text
1. Игровое состояние принадлежит команде, а не игроку.
2. Любой участник команды может просматривать текущее состояние.
3. Изменение состояния, выполненное одним участником, мгновенно синхронизируется всем.
4. Engine хранит состояние на уровне TeamSession.
5. Первый успешный ответ на узел — канонический.
6. Все ответы на уже завершённый узел игнорируются.
7. Инвентарь — общий на команду.
8. Медиа-файлы синхронизируются на всю команду.
9. Каждое действие логируется с actorUserId.
10. Блокировка сессии — на уровне TeamSession.
14. Чек-лист для реализации
Создать таблицу team_sessions

Добавить actorUserId во все события

Реализовать broadcastToTeam() в Realtime Layer

Добавить TeamAnswerMode в настройки игры

Реализовать логику "первый ответ — канонический"

Сделать инвентарь общим для команды

Синхронизировать медиа на всю команду

Обновить движок для работы с teamId, а не sessionId

Добавить API для получения состояния команды
markdown
# 47. Game Module Spec: Архитектурный контракт

> **Дата:** 24.06.2026  
> **Статус:** Утвержден  
> **Версия:** 3.0  
> **Класс:** Архитектурный контракт (10/10)  
> **Цель:** Описать доменную модель игры как ядра игрового процесса. Охватить все аспекты: создание, публикацию, регистрацию, прохождение, обсуждение и взаимодействие.

---

## 1. Фундаментальный принцип

**Game — это Aggregate Root.**

Игра — это центральная сущность платформы. Она объединяет:
- Сценарий (что проходят)
- Организатора (кто создал)
- Команды (кто участвует)
- Игроков (кто проходит)

Все изменения проходят через **Game Service**.

---

## 2. Разделение сущностей

| Сущность | Что хранит | Владелец |
| :--- | :--- | :--- |
| **Game Identity** | `uuid`, `slug`, `shareLink`, `createdAt` | Game Service |
| **Game Profile** | `title`, `description`, `city`, `address`, `image`, `banner` | Game Service |
| **Game Settings** | `date`, `time`, `duration`, `maxTeams`, `price`, `scenarioId?`, `autoStart`, `autoStartDelay`, `allowEarlyStart`, `startBuffer` | Game Service |
| **Game Status** | `status`, `moderationStatus`, `publishedAt`, `startedAt`, `finishedAt` | Game Service |
| **Game Registration** | `teams`, `players`, `registrations`, `teamReadyStatus` | Registration Service |
| **Game Statistics** | `teamsCount`, `playersCount`, `averageScore`, `completionRate` | Stats Service |
| **Game Reviews** | `reviews`, `rating`, `comments` | Review Service |
| **Game Chat** | `messages`, `questions`, `chatMode` | Chat Service |

---

## 3. Game как Aggregate Root

```typescript
interface Game {
  uuid: string;                    // UUID v7
  slug: string;                    // "tayny-starogo-goroda"
  shareLink: string;               // Уникальная ссылка для входа
  status: GameStatus;              // DRAFT, PENDING, APPROVED, PUBLISHED, REGISTRATION_OPEN, REGISTRATION_CLOSED, LOBBY, RUNNING, FINISHED, ARCHIVED, CANCELLED, RESCHEDULED
  moderationStatus: ModerationStatus; // PENDING, APPROVED, REJECTED
  version: number;                 // Для optimistic locking
  deletedAt: Date;                 // Soft Delete

  organizerId: string;            // ID организатора
  scenarioId: string | null;      // ID сценария (может быть null — привязывается позже)
  teams: TeamRegistration[];      // Зарегистрированные команды с их статусами готовности
  
  profile: GameProfile;
  settings: GameSettings;
  stats: GameStats;
  reputation: GameReputation;
}
4. Game Identity (Неизменяемая часть)
typescript
interface GameIdentity {
  uuid: string;
  slug: string;
  shareLink: string;
  createdAt: Date;
}
5. Game Profile (Изменяемая часть)
typescript
interface GameProfile {
  title: string;                   // Название игры
  description: string;             // Описание (до 2000 символов)
  city: string;                    // Город проведения
  address: string;                 // Точный адрес (необязательно)
  image: string;                   // Обложка (S3/MinIO)
  banner: string;                  // Баннер для страницы игры
  tags: string[];                  // Теги (detective, horror, family)
}
6. Game Settings
typescript
interface GameSettings {
  date: Date;                      // Дата проведения
  time: string;                    // Время начала (HH:mm)
  duration: number;                // Длительность в минутах
  maxTeams: number;                // Максимум команд
  price: number;                   // Цена участия (0 — бесплатно)
  scenarioId: string | null;       // ID сценария (null — не привязан, можно привязать позже)
  
  // Настройки старта
  autoStart: boolean;              // Включить автостарт?
  autoStartDelay: number;          // Задержка в минутах после стартового времени (опционально)
  allowEarlyStart: boolean;        // Разрешить организатору запустить раньше? (по умолчанию true)
  startBuffer: number;            // Минуты ожидания после стартового времени (если все не готовы)
  
  allowLateRegistration: boolean;  // Разрешить регистрацию после старта
}
По умолчанию:

autoStart: false — организатор запускает вручную.

allowEarlyStart: true — организатор может запустить раньше.

startBuffer: 15 — 15 минут после старта можно подождать, потом запускать принудительно.

7. Game Status (Жизненный цикл)
text
DRAFT (черновик)
  ↓
PENDING (на модерации)
  ↓
APPROVED (одобрено)
  ↓
PUBLISHED (опубликовано)
  ↓
REGISTRATION_OPEN (регистрация открыта)
  ↓
REGISTRATION_CLOSED (регистрация закрыта)
  ↓
LOBBY (ожидание старта, чат доступен)
  ↓
RUNNING (игра идет, чат только с организатором)
  ↓
FINISHED (игра завершена, чат снова доступен)
  ↓
ARCHIVED (архив)
Альтернативные пути:

text
PUBLISHED → CANCELLED (отмена)
PUBLISHED → RESCHEDULED (перенос)
7.1. Разрешенные переходы
text
DRAFT -> PENDING
DRAFT -> DELETED

PENDING -> APPROVED
PENDING -> REJECTED
PENDING -> DELETED

APPROVED -> PUBLISHED
APPROVED -> DELETED

PUBLISHED -> REGISTRATION_OPEN
PUBLISHED -> CANCELLED
PUBLISHED -> RESCHEDULED
PUBLISHED -> DELETED

REGISTRATION_OPEN -> REGISTRATION_CLOSED
REGISTRATION_OPEN -> CANCELLED
REGISTRATION_OPEN -> RESCHEDULED

REGISTRATION_CLOSED -> LOBBY
REGISTRATION_CLOSED -> CANCELLED
REGISTRATION_CLOSED -> RESCHEDULED

LOBBY -> RUNNING (автостарт ИЛИ ручной старт)
LOBBY -> CANCELLED
LOBBY -> RESCHEDULED

RUNNING -> FINISHED
RUNNING -> CANCELLED (только если есть команды)

FINISHED -> ARCHIVED

CANCELLED -> ARCHIVED
RESCHEDULED -> PUBLISHED (после переноса)
7.2. Запрещенные переходы
text
RUNNING -> DRAFT ❌
RUNNING -> PUBLISHED ❌
FINISHED -> RUNNING ❌
FINISHED -> PUBLISHED ❌
ARCHIVED -> RUNNING ❌
ARCHIVED -> PUBLISHED ❌
CANCELLED -> RUNNING ❌
RESCHEDULED -> RUNNING ❌
8. Статусы для организатора и игроков
Статус	Для организатора	Для игроков
DRAFT	Редактирование, удаление	Не видна
PENDING	Ожидание модерации	Не видна
APPROVED	Можно опубликовать	Не видна
PUBLISHED	Видна в каталоге	Видна в каталоге
REGISTRATION_OPEN	Управление регистрацией	Можно регистрироваться
REGISTRATION_CLOSED	Управление заявками	Регистрация закрыта
LOBBY	Кнопка "Старт", таймер до старта	Ожидание начала, чат доступен
RUNNING	Управление игрой	Прохождение, чат только с организатором
FINISHED	Результаты, статистика	Результаты, чат доступен
ARCHIVED	Только просмотр	Только просмотр
CANCELLED	Отмена, уведомления	Уведомление об отмене
RESCHEDULED	Новая дата/время	Уведомление о переносе
9. Team Ready Status
typescript
interface TeamRegistration {
  teamId: string;
  status: RegistrationStatus;  // REGISTERED, READY, NOT_READY
  readyAt: Date;
}
Правила:

Команда нажимает "Готов" → статус READY

Организатор видит список команд и их статус

Если не все команды готовы, организатор может запустить вручную (после стартового времени)

10. Запуск игры
10.1. Способы запуска
Способ	Описание
Автоматический	Игра стартует автоматически в назначенное время (если autoStart = true)
Ручной	Организатор нажимает "Старт"
10.2. Правила запуска
text
1. Игра может стартовать только после установленной даты и времени.
2. Организатор может запустить игру раньше, если все команды готовы (нажали "Готов").
3. Организатор может запустить игру в любое время после стартового времени, даже если не все команды готовы.
4. Автостарт — это настройка, которая работает только если включена.
5. При автостарте игра запускается автоматически в назначенное время.
6. Если автостарт выключен — только ручной запуск.
7. Команда может нажать "Готов" только после регистрации.
11. Чат
11.1. Режимы чата
Режим	Кто может писать	Кто видит
До игры (LOBBY)	Все игроки + организатор	Все участники игры
Во время игры (RUNNING)	Только организатор → игроки (личные сообщения)	Получатель
После игры (FINISHED)	Все игроки + организатор	Все участники игры
11.2. Правила чата
text
1. До игры — общий чат (команды общаются между собой).
2. Во время игры — только организатор может писать игрокам (и наоборот).
3. После игры — общий чат снова доступен.
4. Во время игры чат с организатором доступен у каждого игрока.
12. Отмена и перенос игры
12.1. Отмена игры
Правило: Игру можно отменить, но нельзя удалить, если есть хотя бы одна зарегистрированная команда.

text
Игра с командами
  ↓
НЕЛЬЗЯ удалить
  ↓
МОЖНО отменить (статус CANCELLED)
Что происходит при отмене:

Статус игры → CANCELLED

Все зарегистрированные команды получают уведомление

Игра скрывается из каталога

Данные сохраняются (история, состав команд)

12.2. Перенос игры
Правило: Если дата или время меняются после публикации, игра получает статус RESCHEDULED.

text
Игра опубликована (PUBLISHED)
  ↓
Организатор меняет дату/время
  ↓
Статус → RESCHEDULED
  ↓
Команды получают уведомление
Что происходит при переносе:

Статус игры → RESCHEDULED

В историю записывается старая дата и новая

Команды получают уведомление

Регистрация сохраняется (команды остаются)

13. Валидация (Domain Rules)
text
1. Дата игры не может быть в прошлом (при создании/обновлении).
2. Дата игры не может быть меньше текущей даты.
3. Время игры не может быть пустым.
4. Длительность игры > 0.
5. Максимум команд > 0.
6. Цена не может быть отрицательной.
7. Сценарий должен быть опубликован (isPublished = true).
8. Город и описание обязательны.
9. Организатор должен иметь роль ORGANIZER.
10. Нельзя создать игру без сценария.
11. Нельзя опубликовать игру без одобрения модератора.
12. Нельзя изменить дату/время после открытия регистрации.
13. Нельзя удалить игру, если есть зарегистрированные команды (только отменить).
14. Нельзя завершить игру, если есть активные сессии.
15. Игра может стартовать только после установленной даты и времени.
16. Организатор может запустить игру раньше, если все команды готовы.
17. Организатор может запустить игру в любое время после стартового времени.
18. Автостарт работает только если включен в настройках.
14. Aggregate Invariants (инварианты)
text
1. UUID никогда не меняется.
2. Organizer никогда не меняется.
3. Scenario нельзя менять после публикации.
4. Status изменяется только через State Machine.
5. Registration запрещена после REGISTRATION_CLOSED.
6. Finished Game нельзя вернуть в RUNNING.
7. Cancelled Game нельзя вернуть в активный статус.
8. Archived Game нельзя редактировать.
9. Game с командами нельзя удалить (только отменить).
10. Дата игры всегда >= текущей даты (при создании/обновлении).
15. Domain Events
typescript
enum GameDomainEvent {
  GameCreated = 'game.created',
  GameUpdated = 'game.updated',
  GamePublished = 'game.published',
  GameApproved = 'game.approved',
  GameRejected = 'game.rejected',
  GameStarted = 'game.started',
  GameFinished = 'game.finished',
  GameArchived = 'game.archived',
  GameCancelled = 'game.cancelled',
  GameRescheduled = 'game.rescheduled',
  GameDeleted = 'game.deleted',

  RegistrationOpened = 'game.registration.opened',
  RegistrationClosed = 'game.registration.closed',
  TeamRegistered = 'game.team.registered',
  TeamUnregistered = 'game.team.unregistered',
  TeamReady = 'game.team.ready',

  CommentAdded = 'game.comment.added',
  QuestionAsked = 'game.question.asked',
  QuestionAnswered = 'game.question.answered',
}
16. Concurrency + Idempotency
16.1. Concurrency
text
1. Все изменения Game проходят с optimistic locking (version).
2. При регистрации команды проверяется maxTeams в транзакции.
3. Если мест нет — RegistrationRejected.
4. Если два запроса одновременно — второй получает Conflict (409).
16.2. Idempotency
text
1. Повторный Publish — ничего не делает (возвращает текущий статус).
2. Повторный Start — возвращает текущий статус (не перезапускает).
3. Повторный Finish — возвращает текущий статус.
4. Повторная регистрация команды — возвращает уже существующую регистрацию.
5. Все операции идемпотентны по idempotencyKey.
17. Permissions Matrix (RBAC)
Действие	Игрок	Команда	Организатор	Модератор	Админ
Создать игру	❌	❌	✅	✅	✅
Редактировать игру	❌	❌	✅ (свои)	❌	✅
Удалить игру	❌	❌	✅ (свои, без команд)	❌	✅
Отменить игру	❌	❌	✅ (свои)	❌	✅
Перенести игру	❌	❌	✅ (свои)	❌	✅
Опубликовать (на модерацию)	❌	❌	✅	❌	✅
Одобрить модерацию	❌	❌	❌	✅	✅
Отклонить модерацию	❌	❌	❌	✅	✅
Открыть регистрацию	❌	❌	✅	❌	✅
Закрыть регистрацию	❌	❌	✅	❌	✅
Зарегистрировать команду	✅	✅	❌	❌	❌
Нажать "Готов"	❌	✅	❌	❌	❌
Старт игры	❌	❌	✅	❌	✅
Завершить игру	❌	❌	✅	❌	✅
Просмотр черновиков	❌	❌	✅	❌	✅
Просмотр каталога	✅	✅	✅	✅	✅
Архивация	❌	❌	❌	❌	✅
18. Integration Contract (разделение ответственности)
text
Game Service:

НЕ хранит:
- Users (только organizerId)
- Teams (только teamId)
- Reviews (только reviews)
- Chats (только chatId)

ХРАНИТ:
- Game Identity
- Game Profile
- Game Settings
- Game Status
- Game Registrations (только teamId + status)

Ссылки:
- organizerId → Identity Service
- scenarioId → Scenario Service
- teams[] → Team Service
- reviews[] → Review Service
- chatId → Chat Service
19. Error Contract (коды ошибок)
Код	Описание
GAME_ALREADY_STARTED	Игра уже запущена
GAME_ALREADY_FINISHED	Игра уже завершена
GAME_NOT_APPROVED	Игра не одобрена модерацией
GAME_CANCELLED	Игра отменена
GAME_RESCHEDULED	Игра перенесена
GAME_FULL	Все места заняты
REGISTRATION_CLOSED	Регистрация закрыта
TEAM_ALREADY_REGISTERED	Команда уже зарегистрирована
TEAM_NOT_READY	Команда не готова к старту
TEAM_NOT_FOUND	Команда не найдена
NOT_ORGANIZER	Пользователь не организатор
GAME_IN_PAST	Дата игры в прошлом
SCENARIO_NOT_PUBLISHED	Сценарий не опубликован
MAX_TEAMS_EXCEEDED	Превышен лимит команд
CANNOT_DELETE_WITH_TEAMS	Нельзя удалить игру с командами
CANNOT_EDIT_AFTER_REGISTRATION	Нельзя редактировать после открытия регистрации
INVALID_STATUS_TRANSITION	Некорректный переход статуса
VERSION_CONFLICT	Конфликт версий (optimistic locking)
20. Sequence Diagrams
20.1. Регистрация команды
text
Player
  ↓
POST /games/:id/register
  ↓
GameService
  ↓
Проверка: статус == REGISTRATION_OPEN
Проверка: maxTeams не превышен
Проверка: команда не зарегистрирована
  ↓
RegistrationService
  ↓
Создание регистрации
  ↓
Event: TeamRegistered
  ↓
NotificationService → уведомление организатору
StatsService → teamsCount++
20.2. Старт игры
text
Organizer
  ↓
POST /games/:id/start
  ↓
GameService
  ↓
Проверка: статус == LOBBY
Проверка: время >= date + time
Проверка: автостарт ИЛИ ручной старт
  ↓
State Machine: LOBBY → RUNNING
  ↓
SessionService → создать сессии для команд
  ↓
Event: GameStarted
  ↓
NotificationService → уведомление всем командам
ChatService → переключение чата в режим RUNNING
20.3. Автостарт
text
Scheduler (cron)
  ↓
Каждую минуту проверять игры со статусом LOBBY
  ↓
Если date + time <= now и autoStart = true
  ↓
GameService.start()
20.4. Отмена игры
text
Organizer
  ↓
POST /games/:id/cancel
  ↓
GameService
  ↓
Проверка: статус != FINISHED, != ARCHIVED
  ↓
State Machine: * → CANCELLED
  ↓
Event: GameCancelled
  ↓
NotificationService → уведомление всем командам
21. Search Index
text
Что индексируется для поиска:

- title (text search)
- city (filter)
- tags (filter)
- status (filter)
- rating (sort)
- date (sort)
- price (filter, sort)
22. Cache
text
GET /games/public — cache 5 min
GET /games/public/:id — cache 30 sec
POST — invalidate cache
23. Limits
text
Название: до 100 символов
Описание: до 3000 символов
Фото: до 10 МБ
Максимум тегов: 10
Максимум команд: 100
Максимум игроков: 500
Максимум комментариев в минуту: 20
24. SLA / Performance
text
GET Game: < 150 ms
Registration: < 500 ms
Publish: < 1 sec
25. Recovery Rules
text
Если GameService упал:
  ↓
Registration откатывается
  ↓
Domain Event не публикуется
  ↓
Транзакция rollback
26. Security
text
1. Organizer может менять только свои игры.
2. Moderator только модерирует (одобряет/отклоняет).
3. Player не может видеть черновики (только PUBLISHED и выше).
4. Private Game доступна только по приглашению.
5. ShareLink невозможно подобрать (случайная строка).
6. JWT обязателен для всех защищенных операций.
7. Проверка Ownership перед любым изменением.
27. Связи с другими модулями
text
Game
  ├── Scenario (сценарий)
  ├── Organizer (пользователь)
  ├── Teams (зарегистрированные команды)
  ├── Players (игроки)
  ├── Reviews (отзывы)
  ├── Comments (обсуждения)
  ├── Chat (чат с организатором)
  ├── Sessions (игровые сессии)
  └── Notifications (уведомления)
28. Data Ownership (владельцы полей)
Поле	Кто изменяет
title	Organizer
description	Organizer
city	Organizer
address	Organizer
image	Organizer
banner	Organizer
tags	Organizer
date	Organizer
time	Organizer
duration	Organizer
maxTeams	Organizer
price	Organizer
scenarioId	Organizer (до публикации)
status	GameService (через State Machine)
moderationStatus	Moderator / Admin
rating	ReviewService
teamsCount	RegistrationService
playersCount	RegistrationService
averageScore	StatsService
completionRate	StatsService
29. API Эндпоинты
29.1. Публичные (для игроков)
Метод	URL	Описание
GET	/games/public	Список игр (с фильтрами)
GET	/games/public/:id	Детали игры
GET	/games/public/:id/reviews	Отзывы
GET	/games/public/:id/comments	Комментарии
POST	/games/public/:id/comments	Добавить комментарий
GET	/games/public/share/:shareLink	Игра по ссылке
29.2. Приватные (для авторизованных)
Метод	URL	Описание
POST	/games/:id/register	Зарегистрировать команду
POST	/games/:id/unregister	Отменить регистрацию
GET	/games/:id/teams	Список команд
POST	/games/:id/ready	Команда нажала "Готов"
GET	/games/:id/teams-status	Получить статусы команд
POST	/games/:id/questions	Задать вопрос организатору
GET	/games/:id/questions	Получить вопросы и ответы
GET	/games/:id/chat	Получить сообщения чата
POST	/games/:id/chat	Отправить сообщение в чат
GET	/games/:id/chat/organizer	Получить сообщения с организатором (во время игры)
POST	/games/:id/chat/organizer	Отправить сообщение организатору (во время игры)
29.3. Для организатора
Метод	URL	Описание
POST	/games	Создать игру
GET	/games/me	Мои игры
GET	/games/:id	Детали игры (для организатора)
PATCH	/games/:id	Обновить игру
DELETE	/games/:id	Удалить игру
POST	/games/:id/cancel	Отменить игру
POST	/games/:id/reschedule	Перенести игру
POST	/games/:id/publish	Отправить на модерацию
POST	/games/:id/open-registration	Открыть регистрацию
POST	/games/:id/close-registration	Закрыть регистрацию
POST	/games/:id/start	Запустить игру (организатор)
GET	/games/:id/can-start	Проверить, можно ли стартовать
GET	/games/:id/timer	Получить таймер до старта
POST	/games/:id/finish	Завершить игру
29.4. Для админа/модератора
Метод	URL	Описание
GET	/admin/games/pending	Игры на модерации
POST	/admin/games/:id/approve	Одобрить игру
POST	/admin/games/:id/reject	Отклонить игру
30. Чек-лист для Габена
Бэкенд
Обновить Prisma-схему (Game, GameRegistration, GameComment, GameQuestion, GameReview, TeamReadyStatus)

Добавить поля autoStart, autoStartDelay, allowEarlyStart, startBuffer в GameSettings

Добавить статусы CANCELLED, RESCHEDULED

Создать DTO (CreateGameDto, UpdateGameDto, PublicGameDto, PrivateGameDto, AdminGameDto)

Создать GameService (создание, обновление, публикация, регистрация, запуск, завершение, отмена, перенос)

Создать GameController (все эндпоинты)

Добавить валидацию (дата не в прошлом, сценарий опубликован)

Реализовать логику автостарта (если включён)

Реализовать логику ручного старта (с проверками)

Реализовать логику отмены (с уведомлениями)

Реализовать логику переноса (с уведомлениями)

Реализовать State Machine с разрешенными/запрещенными переходами

Реализовать optimistic locking (version)

Реализовать идемпотентность (idempotencyKey)

Реализовать обработку ошибок (Error Contract)

Реализовать Audit Log

Настроить Domain Events

Настроить Soft Delete

Настроить кэширование

Фронтенд
Страница игры (/games/[id]) — все данные, регистрация, обсуждения

Страница создания игры (/organizer/games/create) — с настройками автостарта

Страница редактирования игры (/organizer/games/[id]/edit)

Модалка регистрации команды

Модалка вопросов организатору

Компонент комментариев

Компонент отзывов

Кнопка "Готов" для команд

Кнопка "Старт" для организатора (с проверкой статусов команд)

Кнопка "Отменить" для организатора

Кнопка "Перенести" для организатора

Таймер до старта

Чат (общий до игры, только с организатором во время игры, общий после)

31. Как проверить
Для игрока
Найти игру в каталоге → открыть страницу

Прочитать описание, посмотреть дату, город, цену

Нажать "Участвовать" → выбрать команду → зарегистрироваться

Нажать "Готов" → статус команды изменился

Оставить комментарий под игрой

Задать вопрос организатору

В LOBBY — общий чат доступен

Во время RUNNING — чат только с организатором

После FINISHED — общий чат снова доступен

Для организатора
Создать игру с валидной датой (не в прошлом)

Включить автостарт или выключить

Отправить на модерацию → получить одобрение

Открыть регистрацию → увидеть зарегистрированные команды

Увидеть статусы команд (готовы / не готовы)

Запустить игру (ручной старт) или дождаться автостарта

Завершить игру

Отменить игру (если есть команды)

Перенести игру (если нужно изменить дату/время)

Для админа/модератора
Увидеть игры на модерации

Одобрить игру → появляется в каталоге

Отклонить игру → не появляется

32. Архитектурные правила (Контракт для агентов)
Game — Aggregate Root. Все изменения проходят через Game Service.

Дата игры не может быть в прошлом.

Нельзя опубликовать игру без одобрения модератора.

Нельзя редактировать игру после открытия регистрации.

Нельзя удалить игру с командами (только отменить).

Все удаления — Soft Delete.

Каждое изменение публикует Domain Event.

Все изменения логируются.

Организатор должен иметь роль ORGANIZER.

Сценарий должен быть опубликован.

Игра может стартовать только после установленной даты и времени.

Организатор может запустить игру раньше, если все команды готовы.

Организатор может запустить игру в любое время после стартового времени.

Автостарт работает только если включен в настройках.

Все операции идемпотентны.

Конфликты решаются через optimistic locking.

Дата: 24.06.2026
Статус: Утвержден
Класс: Архитектурный контракт (10/10)
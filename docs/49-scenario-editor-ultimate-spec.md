49-scenario-editor-ultimate-spec.md
markdown
# 49. Scenario Editor Ultimate Spec: Полная спецификация конструктора сценариев

> **Дата:** 24.06.2026  
> **Статус:** Утвержден. **КРИТИЧЕСКИЙ ДОКУМЕНТ**  
> **Версия:** 3.0 (ФИНАЛЬНАЯ)  
> **Класс:** Архитектурный контракт (10/10)  
> **Цель:** Сделать редактор сценариев лучшим в мире. Это наш основной продукт. Всё остальное — обёртка вокруг него.

---

## 1. Философия: "Платформа для любых игр"

Мы не строим "конструктор квестов". Мы строим **Game Runtime Platform** — операционную систему, которая позволяет создавать, запускать и монетизировать любые игры и мероприятия без единой строчки кода.

### 1.1. Это наш основной продукт

- **Организаторы** зарабатывают на билетах.
- **Авторы** зарабатывают на продаже сценариев.
- **Платформа** зарабатывает на комиссии.
- **Игроки** получают лучший игровой опыт.

**Всё начинается с редактора. Если редактор хуёвый — всё остальное не имеет значения.**

### 1.2. Core Runtime Primitives (Ядро платформы)

**Любая игровая механика на платформе должна собираться из шести универсальных сущностей.** Эти примитивы — основа для создания любых игр: от городских квестов до квизов, корпоративов, RPG и музейных маршрутов.

#### 1.2.1. Scene (Сцена)

Сцена — это контейнер для игрового действия. Это может быть локация, раунд квиза, экран диалога, игровое поле или слайд презентации.

```typescript
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
1.2.2. Action (Действие)
Действие — это то, что делает игрок. Ввод текста, клик на карте, выбор варианта, загрузка фото, отметка GPS.

typescript
interface Action {
  id: string;
  type: 'text' | 'click' | 'choice' | 'photo' | 'gps' | 'qr' | 'code' | 'drag' | 'collect' | 'dialogue';
  label: string;
  config: ActionConfig;
  conditions: Condition[];
  rewards: Reward[];
}
1.2.3. State (Состояние)
Состояние — это все данные, которые меняются в процессе игры: счёт, инвентарь, переменные, флаги, роли.

typescript
interface State {
  variables: Record<string, any>;
  inventory: InventoryItem[];
  score: number;
  flags: Record<string, boolean>;
  progress: {
    completedScenes: string[];
    currentSceneId: string;
    totalScenes: number;
  };
}
1.2.4. Condition (Условие)
Условие — это проверка, которая определяет, что произойдёт дальше. Без условий игры становятся линейными.

typescript
interface Condition {
  type: 'variable' | 'score' | 'inventory' | 'flag' | 'role' | 'time' | 'random';
  operator: 'eq' | 'ne' | 'gt' | 'lt' | 'gte' | 'lte' | 'contains' | 'has';
  left: string | number | boolean;
  right: string | number | boolean;
}
Примеры условий:

text
score > 100
hasItem('key') == true
role == 'captain'
visitedScenes >= 5
time > 300
1.2.5. Event (Событие)
Событие — это то, что запускает действия в игре. Игрок нажал на кнопку, таймер истёк, достижение разблокировано.

typescript
interface Event {
  type: 'onClick' | 'onAnswer' | 'onTimer' | 'onComplete' | 'onAchievement' | 'onEnter' | 'onExit';
  actions: Action[];
}
1.2.6. View (Представление)
Представление — это то, как игрок видит сцену. Карта, список, слайд, сетка, временная шкала.

typescript
interface View {
  type: 'map' | 'list' | 'card' | 'grid' | 'slide' | 'timeline' | 'canvas';
  config: {
    background?: string;
    layout?: 'vertical' | 'horizontal' | 'grid' | 'free';
    elements?: ViewElement[];
    interactive?: boolean;
  };
}
1.3. Как собираются игры из примитивов
Игра	Scene	Action	State	Condition	Event	View
Encounter	Location	Text, Code, Photo, GPS	score, inventory	score > 100	onAnswer	Map
Мозгобойня	Quiz	Choice	score, round	score > 50	onAnswer	Slide
Туц Туц	Slide	Choice, Photo	score, vote	score > 30	onAnswer	Slide
Карта сокровищ	Location	Click, GPS	inventory, flags	hasItem('key')	onClick	Map
Морской бой	Game	Click	field, hits	hits == 10	onClick	Grid
Музей	Location	QR, Audio	visited, flags	hasFlag('room1')	onEnter	Map
Корпоратив	Location	Photo, Choice	score, team	role == 'captain'	onAnswer	List
Мафия	Dialogue	Choice	roles, votes	role == 'mafia'	onAnswer	Card
1.4. Почему это работает
Универсальность. Один движок обслуживает все типы игр.

Расширяемость. Новые типы сцен, действий и представлений добавляются без изменения ядра.

Маркетплейс. Авторы могут продавать не только сценарии, но и отдельные примитивы (View Pack, Action Pack).

Простота. Автор не думает о том, "как сделать морской бой". Он просто комбинирует примитивы.

Это и есть Game Runtime Platform.

2. Архитектура редактора
2.1. Три слоя
Слой	Компонент	Ответственность
Презентация	React Flow, UI Kit	Отрисовка холста, блоков, панелей, соединений
Логика	Zustand Store, History Manager	Undo/Redo, состояние сценария, буфер обмена, переменные
Данные	Scenario Service (NestJS)	Сохранение, валидация, версионирование, публикация
2.2. Asset Manager
Все медиа-файлы хранятся централизованно.

text
/assets
  /images
  /audio
  /video
  /maps
  /ar
  /documents
Использование в блоке:

text
asset://images/building.jpg
asset://audio/hint.mp3
3. Сущности редактора
3.1. Сценарий (Scenario)
typescript
interface Scenario {
  id: string;
  name: string;
  description: string;
  version: number;
  scenes: Scene[];
  startSceneId: string;
  variables: VariableDefinition[];
  metadata: ScenarioMetadata;
  status: ScenarioStatus;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}
3.2. Сцена (Scene)
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
3.3. Миссия (Mission) — Переиспользуемая единица
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
4. Палитра блоков
4.1. Категории блоков
Категория	Блоки	Статус
Базовые	Старт, Финиш	✅
Задания	Текст, Код, Фото, GPS, QR, Выбор	✅
Логика	Таймер, Ветвление, Условие	⏳
Персонажи	NPC, Диалог	⏳
Экспериментальные	AR, Сбор предмета, Битва	🔵
4.2. Поведение блоков
text
Перетаскивание → блок появляется на холсте
Клик → блок выделяется
Двойной клик → открывает настройки
Delete → удаляет блок
5. Холст и навигация
5.1. Поведение
text
Зум: колесико мыши + Ctrl (Cmd)
Панорамирование: зажатый пробел + перетаскивание
Выделение: одиночный клик
Множественное выделение: Shift + клик
Выделить всё: Ctrl + A
5.2. Состояния холста
Состояние	Описание	Отображение
Пустой	Нет блоков	"Перетащите блок из палитры"
С блоками	Есть блоки	Нормальный режим
С ошибками	Валидация не пройдена	Красные индикаторы
Выделение	Выбран блок	Синяя рамка
Соединение	Перетаскивание связи	Пунктирная линия
6. Настройки блока (Панель справа)
6.1. Общие поля
text
Заголовок: [текст]
Описание: [текст]
Тип: [выпадающий список]
6.2. Специфические поля
Блок	Поля
Текст	Правильный ответ, Подсказка, Очки, Штраф
Код	Правильный код, Количество попыток, Очки, Штраф
Фото	Требования, Очки, Штраф
GPS	Координаты, Радиус, Очки, Штраф
QR	QR-код, Очки, Штраф
Выбор	Варианты, Правильный вариант, Очки, Штраф
Таймер	Длительность, Очки, Штраф
Ветвление	Условия (массив: метка → переход)
6.3. Переходы
text
Успех → [сцена]
Ошибка → [сцена]
Таймаут → [сцена]
Условие → [сцена]
7. Жизненный цикл сценария и состояние редактора (САМОЕ ВАЖНОЕ)
7.1. Жизненный цикл сценария
text
Черновик (Draft)
   │
   ├── Сохранен (Saved) — черновик сохранен
   │
   ├── Тестирование (Testing) — запущен в тестовом режиме
   │
   ├── Отправлен на модерацию (Pending)
   │
   ├── Опубликован (Published) — доступен для игр
   │
   ├── Обновлен (Updated) — новая версия
   │
   ├── Архивирован (Archived) — скрыт
   │
   └── Удален (Deleted) — Soft Delete
7.2. Состояние редактора (Editor State)
typescript
interface EditorState {
  scenarioId: string;
  version: number;
  lastSavedAt: Date;
  isDirty: boolean;

  viewport: { x: number; y: number; zoom: number };
  selectedNodes: string[];
  selectedEdges: string[];

  history: {
    undoStack: Snapshot[];
    redoStack: Snapshot[];
    maxHistory: 50;
  };

  clipboard: { nodes: Node[]; edges: Edge[] };
  openPanels: { properties: boolean; variables: boolean; validation: boolean; debugger: boolean };
}
7.3. Автосохранение
text
Каждые 30 секунд → сохранение в localStorage
При перезагрузке → восстановление из автосохранения
При ручном сохранении → автосохранение очищается
7.4. Undo / Redo
text
Ctrl+Z → отменить последнее действие
Ctrl+Shift+Z → повторить отменённое
Максимум 50 шагов
7.5. Версионирование
text
Каждое сохранение → новая версия
История версий → список с датами
Восстановление → любой версии
Сравнение → двух версий
8. Валидация в реальном времени
8.1. Проверки
Ошибка	Код	Тип	Блокирует публикацию?
Нет START	NO_START	error	✅
Нет FINISH	NO_FINISH	error	✅
Бесконечный цикл	INFINITE_LOOP	error	✅
Переход в никуда	BROKEN_TRANSITION	error	✅
Недостижимая сцена	ORPHAN_SCENE	warning	❌
Нет ответа (Текст/Код)	MISSING_ANSWER	error	✅
8.2. Отображение
text
Красная рамка → ошибка
Жёлтая рамка → предупреждение
Зелёная рамка → всё ок
Список ошибок → панель снизу
9. Режим превью
text
Показывает сценарий как на телефоне игрока
Можно переключаться между сценами
Можно вводить ответы (но не сохранять)
Закрывается по клику вне модалки
10. Режим тестирования
text
Полное прохождение сценария
Показывает счёт, переменные, инвентарь
Лог всех действий
Кнопка "Заново" → перезапуск
Кнопка "Экспорт лога" → скачать JSON
11. Ключевое отличие: Переменные
Без переменных редактор — это линейный конструктор. С переменными — это полноценный игровой движок.

11.1. Системные переменные
text
team.name
team.score
team.members
player.name
player.role
game.time
game.elapsed
game.currentScene
game.totalScenes
11.2. Пользовательские переменные
text
coins: number = 0
health: number = 100
reputation: number = 50
has_key: boolean = false
11.3. Операции
text
coins += 10
health -= 20
reputation = reputation + 1
has_key = true
11.4. Использование в тексте
text
Привет {{player.name}}! У тебя {{coins}} монет.
11.5. Использование в условиях
text
if coins > 50 → success
if has_key == true → открыть дверь
if reputation < 30 → fail
12. Инвентарь и предметы
12.1. Блок "Получить предмет"
text
Ключ от подвала (1 шт.)
12.2. Блок "Потратить предмет"
text
Ключ от подвала (1 шт.)
12.3. Блок "Проверка предмета"
text
Есть ключ? → Да → открыть дверь
13. Очки и рейтинги
13.1. Типы очков
text
score — основные очки
money — игровая валюта
karma — моральный рейтинг
experience — опыт
rating — общий рейтинг
13.2. Лидерборды
text
Команды (по score)
Игроки (по rating)
Города (по gamesPlayed)
Сезоны (по totalScore)
14. Достижения
14.1. Блок "Получить достижение"
text
🎖️ Первый код
🎖️ Исследователь
🎖️ Ночной охотник
14.2. Условия
text
Если completed_scenes >= 10 → "Исследователь"
15. Маркетплейс сценариев
15.1. Публикация
text
Название
Описание
Цена
Демо
Скриншоты
15.2. Покупка
text
Организатор покупает лицензию
Автор получает роялти (70-80%)
Платформа получает комиссию (20-30%)
15.3. Типы лицензий
text
Одно проведение (5-15 BYN)
Многоразовая (город) (29-49 BYN)
Коммерческая (99-199 BYN)
White Label (299-499 BYN)
16. Горячие клавиши (Кроссплатформенные)
Действие	Windows	Mac
Сохранить	Ctrl+S	Cmd+S
Undo	Ctrl+Z	Cmd+Z
Redo	Ctrl+Shift+Z	Cmd+Shift+Z
Копировать	Ctrl+C	Cmd+C
Вставить	Ctrl+V	Cmd+V
Выделить всё	Ctrl+A	Cmd+A
Удалить	Delete	Delete
Отменить выделение	Esc	Esc
17. UX-состояния редактора
Состояние	Описание	Что видит пользователь
Пустой	Нет блоков	"Перетащите блок из палитры"
С черновиком	Есть изменения, не сохранено	Кнопка "Сохранить" активна
Сохранен	Все изменения сохранены	Кнопка "Сохранить" неактивна
Тестирование	Запущен тест-режим	Кнопка "Остановить тест"
Опубликован	Сценарий опубликован	Кнопка "Опубликовать" неактивна
Есть ошибки	Валидация не пройдена	Красный индикатор, список ошибок
18. Чек-лист для Габена
Бэкенд
Scenario Service (CRUD, версионирование, публикация)

Валидация (START, FINISH, циклы, переходы)

Asset Manager (загрузка, хранение, ссылки)

Переменные (системные + пользовательские)

Инвентарь (добавление, удаление, проверка)

Очки и рейтинги (начисление, лидерборды)

Достижения (условия, выдача)

Маркетплейс (публикация, покупка, лицензии)

Версионирование (история, восстановление)

Фронтенд
Холст (React Flow)

Палитра блоков (11 типов)

Настройки блока (панель справа)

Автосохранение (каждые 30 сек)

Undo/Redo (история 50 шагов)

Валидация в реальном времени

Режим превью (телефон)

Режим тестирования (с логом)

Версионирование (история, восстановление)

19. Архитектурные правила (Контракт для агентов)
Редактор не знает, как игра запускается. Он только генерирует JSON.

Каждое изменение сохраняется. Автосохранение + ручное сохранение.

История (Undo/Redo) обязательна.

Валидация в реальном времени обязательна.

Публикация блокируется при ошибках.

Все медиа хранятся в Asset Manager.

Переменные — основа всех механик.

Маркетплейс — источник дохода авторов.

Кроссплатформенность обязательна.

Тестирование — неотъемлемая часть редактора.

20. Итоговый принцип
Редактор сценариев — это наш главный продукт. Он должен быть лучшим в мире. Всё остальное (игры, команды, профили, админка) — это обёртка вокруг него.

Дата: 24.06.2026
Статус: Утвержден. КРИТИЧЕСКИЙ ДОКУМЕНТ
Класс: Архитектурный контракт (10/10)
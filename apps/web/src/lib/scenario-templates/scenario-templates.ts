'use client';

import {
  Scene,
  Edge,
  SceneType,
  Condition,
  SingleCondition,
  TriggerDefinition,
  TriggerAction,
  TriggerEventType,
  RoleDefinition,
  ParallelScenarioConfig,
  SyncPoint,
  GameSettings,
  VariableDefinition,
  GamePhaseConfig,
  InventoryItem,
  CrossScenarioCommunication,
  MultiplayerMechanicConfig,
  LoopConfig,
} from '@/lib/editor-store/editor.types';

export interface ScenarioTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  difficulty: 'easy' | 'medium' | 'hard';
  estimatedTime: string;
  minPlayers?: string;
  scenes: Scene[];
  edges: Edge[];
  // === NEW FIELDS ===
  triggers?: TriggerDefinition[];
  roles?: RoleDefinition[];
  parallelScenarios?: ParallelScenarioConfig[];
  syncPoints?: SyncPoint[];
  settings?: Partial<GameSettings>;
  variables?: VariableDefinition[];
  phaseConfig?: GamePhaseConfig;
  inventory?: InventoryItem[];
  crossScenarioComm?: CrossScenarioCommunication;
}

let sceneCounter = 0;
let edgeCounter = 0;

function sid(): string {
  sceneCounter++;
  return `template-scene-${sceneCounter}`;
}

function eid(): string {
  edgeCounter++;
  return `template-edge-${edgeCounter}`;
}

function mid(): string {
  return `tm-${Math.random().toString(36).slice(2, 8)}`;
}

function tid(): string {
  return `tr-${Math.random().toString(36).slice(2, 8)}`;
}

function makeScene(type: SceneType, title: string, description: string, missions: any[] = [], metadata?: any): Scene {
  const id = sid();
  const idx = sceneCounter;
  return {
    id,
    type,
    title,
    description,
    missions: missions.map((m: any) => ({
      id: mid(),
      type: m.type,
      title: m.title || '',
      description: m.description || '',
      config: m.config || {},
      rewards: m.rewards || [],
      conditions: m.conditions || [],
      hints: m.hints || [],
    })),
    metadata: metadata || {},
    view: { type: 'list', config: {} },
    position: { x: 100 + idx * 280, y: 150 + (idx % 2) * 60 },
    transitions: [],
  };
}

function makeEdge(source: string, target: string, condition?: Condition): Edge {
  return {
    id: eid(),
    source,
    target,
    type: condition ? 'conditional' : 'auto',
  };
}

function makeTrigger(
  event: TriggerEventType,
  actions: TriggerAction[],
  name: string,
  description: string = '',
  eventFilter?: any,
  cooldown: number = 0,
  maxFires: number = 0,
): TriggerDefinition {
  return {
    id: tid(),
    name,
    description,
    event,
    eventFilter,
    conditions: { operator: 'AND', conditions: [] },
    actions,
    enabled: true,
    cooldown,
    maxFires,
    fireCount: 0,
  };
}

function makeAction(type: TriggerAction['type'], config: Record<string, any>): TriggerAction {
  return { id: `ta-${Math.random().toString(36).slice(2, 8)}`, type, config };
}

// ==================== Template 1: 🏙️ Схватка (Encounter) ====================

function createEncounterSkvatkaTemplate(): ScenarioTemplate {
  sceneCounter = 0;
  edgeCounter = 0;

  const start = makeScene('location', 'Старт', 'Начало схватки! Получите маршрутный лист и отправляйтесь в путь.', [
    { type: 'text', title: 'Миссия', description: 'Напишите "готов" чтобы начать', config: { correctAnswer: 'готов', matchMode: 'case_insensitive', maxAttempts: 99 } },
    { type: 'inventory_get', title: 'Маршрутный лист', description: 'Получен маршрутный лист', config: { itemId: 'route_map', itemName: 'Маршрутный лист', quantity: 1 } },
  ]);

  const point1 = makeScene('location', 'Точка 1', 'Найдите памятник на главной площади. Какая дата на нём указана?', [
    { type: 'gps', title: 'Найти памятник', description: 'Подойдите к памятнику', config: { lat: 55.7558, lng: 37.6173, radius: 50, points: 10 } },
    { type: 'text', title: 'Дата на памятнике', description: 'Введите год, указанный на памятнике', config: { correctAnswer: '1812', matchMode: 'exact', maxAttempts: 3, points: 10 } },
    { type: 'inventory_get', title: 'Код 1', description: 'Получен первый код', config: { itemId: 'code_1', itemName: 'Код 1', quantity: 1 } },
  ], { gps: { lat: 55.7558, lng: 37.6173, radius: 50 } });

  const point2 = makeScene('location', 'Точка 2', 'Найдите QR-код на здании библиотеки и отсканируйте его.', [
    { type: 'gps', title: 'Найти библиотеку', description: 'Подойдите к зданию библиотеки', config: { lat: 55.7580, lng: 37.6200, radius: 40, points: 10 } },
    { type: 'qr', title: 'Отсканировать QR', description: 'Найдите QR-код на входе', config: { data: 'point2_secret', points: 15 } },
    { type: 'inventory_get', title: 'Код 2', description: 'Получен второй код', config: { itemId: 'code_2', itemName: 'Код 2', quantity: 1 } },
  ], { gps: { lat: 55.7580, lng: 37.6200, radius: 40 } });

  const point3 = makeScene('location', 'Точка 3', 'Сфотографируйте фонтан в городском парке.', [
    { type: 'gps', title: 'Найти фонтан', description: 'Подойдите к фонтану в парке', config: { lat: 55.7600, lng: 37.6150, radius: 35, points: 10 } },
    { type: 'photo', title: 'Фото фонтана', description: 'Сделайте фотографию фонтана', config: { requirements: 'Фонтан должен быть виден полностью', validationType: 'manual', points: 20 } },
    { type: 'inventory_get', title: 'Код 3', description: 'Получен третий код', config: { itemId: 'code_3', itemName: 'Код 3', quantity: 1 } },
  ], { gps: { lat: 55.7600, lng: 37.6150, radius: 35 } });

  const point4 = makeScene('location', 'Точка 4', 'Решите головоломку у старого моста.', [
    { type: 'gps', title: 'Найти мост', description: 'Подойдите к старому мосту', config: { lat: 55.7570, lng: 37.6220, radius: 30, points: 10 } },
    { type: 'code', title: 'Головоломка', description: 'Введите код разблокировки', config: { correctCode: 'bridge2024', maxAttempts: 3, points: 25 } },
    { type: 'inventory_get', title: 'Код 4', description: 'Получен четвёртый код', config: { itemId: 'code_4', itemName: 'Код 4', quantity: 1 } },
  ], { gps: { lat: 55.7570, lng: 37.6220, radius: 30 } });

  const point5 = makeScene('location', 'Точка 5', 'Финальная проверка! У вас есть все коды?', [
    { type: 'gps', title: 'Финальная точка', description: 'Подойдите к финальной точке', config: { lat: 55.7620, lng: 37.6100, radius: 25, points: 10 } },
    { type: 'inventory_check', title: 'Проверка кодов', description: 'У вас должны быть все 4 кода', config: { itemId: 'code_4', itemName: 'Код 4', quantity: 1, consumeOnCheck: false } },
  ], { gps: { lat: 55.7620, lng: 37.6100, radius: 25 } });

  const finish = makeScene('location', 'Финиш', 'Поздравляем! Вы прошли схватку!', [
    { type: 'achievement', title: 'Победитель Схватки', description: '', config: { achievementId: 'encounter_winner', achievementName: 'Победитель Схватки', achievementDescription: 'Пройдите все точки и соберите все коды', icon: '🏙️' } },
  ]);

  const scenes = [start, point1, point2, point3, point4, point5, finish];
  const edges = [
    makeEdge(scenes[0].id, scenes[1].id),
    makeEdge(scenes[1].id, scenes[2].id),
    makeEdge(scenes[2].id, scenes[3].id),
    makeEdge(scenes[3].id, scenes[4].id),
    makeEdge(scenes[4].id, scenes[5].id),
    makeEdge(scenes[5].id, scenes[6].id),
  ];

  const triggers: TriggerDefinition[] = [
    makeTrigger('onMissionComplete', [
      makeAction('add_score', { amount: 5 }),
      makeAction('show_notification', { text: 'Бонус за скорость!', icon: '⚡', duration: 3000 }),
    ], 'Бонус за скорость', 'Начисление бонусных очков при завершении миссии'),
    makeTrigger('onItemGet', [
      makeAction('show_notification', { text: 'Получен новый код!', icon: '🔑', duration: 2000 }),
    ], 'Уведомление о коде', 'Уведомление при получении кода', { itemId: 'code_1' }),
  ];

  const inventory: InventoryItem[] = [
    { id: 'route_map', name: 'Маршрутный лист', description: 'Карта с отмеченными точками', type: 'quest', rarity: 'common', quantity: 1, icon: '🗺️', effects: [], stackable: false, maxStack: 1, useable: false, usableInScenario: false, tradeable: false, weight: 0 },
    { id: 'code_1', name: 'Код 1', description: 'Первый код из памятника', type: 'key', rarity: 'common', quantity: 1, icon: '🔑', effects: [], stackable: true, maxStack: 99, useable: false, usableInScenario: false, tradeable: false, weight: 0 },
    { id: 'code_2', name: 'Код 2', description: 'Второй код из QR-кода', type: 'key', rarity: 'common', quantity: 1, icon: '🔑', effects: [], stackable: true, maxStack: 99, useable: false, usableInScenario: false, tradeable: false, weight: 0 },
    { id: 'code_3', name: 'Код 3', description: 'Третий код из фото', type: 'key', rarity: 'common', quantity: 1, icon: '🔑', effects: [], stackable: true, maxStack: 99, useable: false, usableInScenario: false, tradeable: false, weight: 0 },
    { id: 'code_4', name: 'Код 4', description: 'Четвёртый код из головоломки', type: 'key', rarity: 'common', quantity: 1, icon: '🔑', effects: [], stackable: true, maxStack: 99, useable: false, usableInScenario: false, tradeable: false, weight: 0 },
  ];

  return {
    id: 'encounter-skvatka',
    name: '🏙️ Схватка',
    description: 'Городская гонка с перемещением по точкам, поиском памятников, QR-кодами, фото и головоломками. Соберите все коды и доберитесь до финиша!',
    icon: '🏙️',
    color: 'from-orange-500 to-red-500',
    difficulty: 'medium',
    estimatedTime: '45-90 мин',
    minPlayers: '1-4',
    scenes,
    edges,
    triggers,
    inventory,
  };
}

// ==================== Template 2: 🧠 Мозговой штурм ====================

function createBrainstormTemplate(): ScenarioTemplate {
  sceneCounter = 0;
  edgeCounter = 0;

  const start = makeScene('location', 'Старт', 'Добро пожаловать на мозговой штурм! Проверьте свою эрудицию.', [
    { type: 'text', title: 'Начало', description: 'Напишите "готов" чтобы начать', config: { correctAnswer: 'готов', matchMode: 'case_insensitive', maxAttempts: 99 } },
  ]);

  const round1 = makeScene('quiz', 'Раунд 1: Разминка', 'Быстрые вопросы на разогрев. У вас 30 секунд на каждый.', [
    { type: 'choice', title: 'Вопрос 1', description: 'Столица Франции?', config: { options: ['Лондон', 'Париж', 'Берлин', 'Мадрид'], correctIndex: 1, shuffle: true, points: 5 } },
    { type: 'choice', title: 'Вопрос 2', description: 'Сколько планет в Солнечной системе?', config: { options: ['7', '8', '9', '10'], correctIndex: 1, shuffle: true, points: 5 } },
    { type: 'choice', title: 'Вопрос 3', description: 'Какой газ самый распространённый в атмосфере Земли?', config: { options: ['Кислород', 'Азот', 'Углекислый газ', 'Водород'], correctIndex: 1, shuffle: true, points: 5 } },
    { type: 'choice', title: 'Вопрос 4', description: 'Кто написал "Евгения Онегина"?', config: { options: ['Лермонтов', 'Пушкин', 'Толстой', 'Достоевский'], correctIndex: 1, shuffle: true, points: 5 } },
    { type: 'choice', title: 'Вопрос 5', description: 'Какой океан самый большой?', config: { options: ['Атлантический', 'Индийский', 'Тихий', 'Северный Ледовитый'], correctIndex: 2, shuffle: true, points: 5 } },
  ], { timer: 30, loop: { type: 'for', count: 5, counterVariable: 'round' } });

  const round2 = makeScene('quiz', 'Раунд 2: Ребусы', 'Расшифруйте ребусы и введите ответы текстом.', [
    { type: 'text', title: 'Ребус 1', description: '100 + лицо = ?', config: { correctAnswer: 'столица', matchMode: 'case_insensitive', maxAttempts: 2, points: 10 } },
    { type: 'text', title: 'Ребус 2', description: 'Под + нос + ок = ?', config: { correctAnswer: 'подносок', matchMode: 'case_insensitive', maxAttempts: 2, points: 10 } },
    { type: 'text', title: 'Ребус 3', description: 'За + яц + вод + а = ?', config: { correctAnswer: 'заяцвода', matchMode: 'case_insensitive', maxAttempts: 2, points: 10 } },
  ]);

  const round3 = makeScene('slide', 'Раунд 3: Медиа', 'Вопросы по изображениям. Внимательно смотрите и отвечайте.', [
    { type: 'image', title: 'Изображение 1', description: 'Что изображено на фото?', config: { assetId: 'brainstorm_img_1', caption: 'Знаменитое здание', points: 15 } },
    { type: 'image', title: 'Изображение 2', description: 'Узнайте личность', config: { assetId: 'brainstorm_img_2', caption: 'Известный учёный', points: 15 } },
    { type: 'image', title: 'Изображение 3', description: 'Что за животное?', config: { assetId: 'brainstorm_img_3', caption: 'Редкий вид', points: 15 } },
  ]);

  const round4 = makeScene('quiz', 'Раунд 4: Ставки', 'Вопросы с удвоением очков! Рискните и выиграйте больше.', [
    { type: 'choice', title: 'Вопрос с удвоением', description: 'Какая самая длинная река в мире?', config: { options: ['Амазонка', 'Нил', 'Миссисипи', 'Янцзы'], correctIndex: 0, shuffle: true, points: 20 } },
    { type: 'choice', title: 'Вопрос с удвоением', description: 'В каком году человек впервые высадился на Луну?', config: { options: ['1967', '1968', '1969', '1970'], correctIndex: 2, shuffle: true, points: 20 } },
  ]);

  const finish = makeScene('location', 'Финал', 'Мозговой штурм завершён! Посмотрим на турнирную таблицу.', [
    { type: 'achievement', title: 'Эрудит', description: '', config: { achievementId: 'brainstorm_master', achievementName: 'Эрудит', achievementDescription: 'Пройдите все раунды мозгового штурма', icon: '🧠' } },
  ]);

  const scenes = [start, round1, round2, round3, round4, finish];
  const edges = [
    makeEdge(scenes[0].id, scenes[1].id),
    makeEdge(scenes[1].id, scenes[2].id),
    makeEdge(scenes[2].id, scenes[3].id),
    makeEdge(scenes[3].id, scenes[4].id),
    makeEdge(scenes[4].id, scenes[5].id),
  ];

  const triggers: TriggerDefinition[] = [
    makeTrigger('onTimerEnd', [
      makeAction('show_notification', { text: 'Время вышло!', icon: '⏰', duration: 3000 }),
    ], 'Время вышло', 'Уведомление об истечении времени'),
    makeTrigger('onMissionComplete', [
      makeAction('add_score', { amount: 10 }),
    ], 'Бонус за ответ', 'Начисление очков за правильный ответ'),
    makeTrigger('onMissionComplete', [
      makeAction('set_variable', { variableName: 'double_points', value: true, operation: 'set' }),
    ], 'Удвоение очков', 'Активация удвоения очков в раунде ставок', { sceneId: scenes[4].id }),
  ];

  const variables: VariableDefinition[] = [
    { name: 'round', type: 'number', defaultValue: 1, scope: 'local' },
    { name: 'double_points', type: 'boolean', defaultValue: false, scope: 'local' },
    { name: 'total_score', type: 'number', defaultValue: 0, scope: 'global' },
  ];

  const phaseConfig: GamePhaseConfig = {
    phases: [
      { id: 'phase_warmup', name: 'Разминка', type: 'round', description: 'Разминочный раунд', duration: 150, order: 1, dayNightCycle: false, nextPhaseId: 'phase_rebus', allowedActions: ['answer'], allowedScenes: [scenes[1].id], allowedMissions: [], globalModifiers: {}, onPhaseStart: [], onPhaseEnd: [], icon: '🔥', color: '#FF6B35' },
      { id: 'phase_rebus', name: 'Ребусы', type: 'round', description: 'Раунд ребусов', duration: 180, order: 2, dayNightCycle: false, nextPhaseId: 'phase_media', allowedActions: ['answer'], allowedScenes: [scenes[2].id], allowedMissions: [], globalModifiers: {}, onPhaseStart: [], onPhaseEnd: [], icon: '🧩', color: '#4ECDC4' },
      { id: 'phase_media', name: 'Медиа', type: 'round', description: 'Медиа-раунд', duration: 180, order: 3, dayNightCycle: false, nextPhaseId: 'phase_bets', allowedActions: ['answer'], allowedScenes: [scenes[3].id], allowedMissions: [], globalModifiers: {}, onPhaseStart: [], onPhaseEnd: [], icon: '🖼️', color: '#7B68EE' },
      { id: 'phase_bets', name: 'Ставки', type: 'round', description: 'Раунд с удвоением очков', duration: 120, order: 4, dayNightCycle: false, nextPhaseId: 'phase_final', allowedActions: ['answer'], allowedScenes: [scenes[4].id], allowedMissions: [], globalModifiers: { scoreMultiplier: 2 }, onPhaseStart: [], onPhaseEnd: [], icon: '🎲', color: '#FFD700' },
      { id: 'phase_final', name: 'Финал', type: 'round', description: 'Финальный раунд', duration: 60, order: 5, dayNightCycle: false, nextPhaseId: null, allowedActions: ['view'], allowedScenes: [scenes[5].id], allowedMissions: [], globalModifiers: {}, onPhaseStart: [], onPhaseEnd: [], icon: '🏆', color: '#FF4500' },
    ],
    transitions: [
      { id: 't_warmup_rebus', fromPhaseId: 'phase_warmup', toPhaseId: 'phase_rebus', condition: { operator: 'AND', conditions: [] }, autoTransition: true, delay: 0 },
      { id: 't_rebus_media', fromPhaseId: 'phase_rebus', toPhaseId: 'phase_media', condition: { operator: 'AND', conditions: [] }, autoTransition: true, delay: 0 },
      { id: 't_media_bets', fromPhaseId: 'phase_media', toPhaseId: 'phase_bets', condition: { operator: 'AND', conditions: [] }, autoTransition: true, delay: 0 },
      { id: 't_bets_final', fromPhaseId: 'phase_bets', toPhaseId: 'phase_final', condition: { operator: 'AND', conditions: [] }, autoTransition: true, delay: 0 },
    ],
    startPhaseId: 'phase_warmup',
    cycleEnabled: false,
    cycleOrder: 'sequential',
    globalTimeLimit: 900,
    roundSystem: true,
    currentRound: 1,
    maxRounds: 1,
    roundStartPhase: 'phase_warmup',
    roundEndCondition: { operator: 'AND', conditions: [] },
    onGameEnd: [],
  };

  return {
    id: 'brainstorm',
    name: '🧠 Мозговой штурм',
    description: 'Интеллектуальная викторина с несколькими раундами: разминка, ребусы, медиа-вопросы и раунд с удвоением очков. Проверьте свою эрудицию!',
    icon: '🧠',
    color: 'from-purple-500 to-pink-500',
    difficulty: 'medium',
    estimatedTime: '15-30 мин',
    minPlayers: '1-10',
    scenes,
    edges,
    triggers,
    variables,
    phaseConfig,
  };
}

// ==================== Template 3: 📸 Фотоохота ====================

function createPhotohuntTemplate(): ScenarioTemplate {
  sceneCounter = 0;
  edgeCounter = 0;

  const start = makeScene('location', 'Старт', 'Добро пожаловать на фотоохоту! Делайте креативные фото и побеждайте.', [
    { type: 'text', title: 'Начало', description: 'Напишите "готов" чтобы начать', config: { correctAnswer: 'готов', matchMode: 'case_insensitive', maxAttempts: 99 } },
  ]);

  const task1 = makeScene('quiz', 'Задание 1', 'Найдите и сфотографируйте красный объект.', [
    { type: 'photo', title: 'Красный объект', description: 'Сфотографируйте любой красный объект', config: { requirements: 'Объект должен быть красного цвета', validationType: 'manual', points: 15 } },
  ]);

  const task2 = makeScene('quiz', 'Задание 2', 'Найдите необычную вывеску и сфотографируйте её.', [
    { type: 'photo', title: 'Необычная вывеска', description: 'Сфотографируйте самую необычную вывеску', config: { requirements: 'Вывеска должна быть креативной или необычной', validationType: 'manual', points: 15 } },
  ]);

  const task3 = makeScene('quiz', 'Задание 3', 'Сделайте креативное селфи с незнакомцем.', [
    { type: 'photo', title: 'Селфи с незнакомцем', description: 'Попросите незнакомца сделать совместное креативное фото', config: { requirements: 'На фото должны быть вы и незнакомец', validationType: 'manual', points: 20 } },
  ]);

  const task4 = makeScene('quiz', 'Задание 4', 'Найдите отражение и сфотографируйте его.', [
    { type: 'photo', title: 'Отражение', description: 'Сфотографируйте отражение в воде, зеркале или витрине', config: { requirements: 'Отражение должно быть узнаваемым', validationType: 'manual', points: 15 } },
  ]);

  const voting = makeScene('custom', 'Голосование', 'Голосуйте за лучшие фото других участников!', [], {
    multiplayer: {
      type: 'voting',
      duration: 120,
      autoComplete: true,
      voteVisibility: 'after_vote',
      minPlayers: 1,
      maxPlayers: 10,
      resultAction: 'continue',
    } as MultiplayerMechanicConfig,
  });

  const finish = makeScene('location', 'Финиш', 'Фотоохота завершена! Спасибо за участие!', [
    { type: 'achievement', title: 'Фотоохотник', description: '', config: { achievementId: 'photohunt_winner', achievementName: 'Фотоохотник', achievementDescription: 'Пройдите все задания фотоохоты', icon: '📸' } },
  ]);

  const scenes = [start, task1, task2, task3, task4, voting, finish];
  const edges = [
    makeEdge(scenes[0].id, scenes[1].id),
    makeEdge(scenes[1].id, scenes[2].id),
    makeEdge(scenes[2].id, scenes[3].id),
    makeEdge(scenes[3].id, scenes[4].id),
    makeEdge(scenes[4].id, scenes[5].id),
    makeEdge(scenes[5].id, scenes[6].id),
  ];

  const triggers: TriggerDefinition[] = [
    makeTrigger('onMissionComplete', [
      makeAction('show_notification', { text: 'Новое фото добавлено!', icon: '📷', duration: 2000 }),
    ], 'Фото добавлено', 'Уведомление о добавлении нового фото'),
    makeTrigger('onCustomEvent', [
      makeAction('add_score', { amount: 10 }),
      makeAction('show_notification', { text: 'Вы получили бонусные очки за голосование!', icon: '🗳️', duration: 3000 }),
    ], 'Голосование завершено', 'Начисление очков победителю голосования', { sceneId: voting.id }),
  ];

  return {
    id: 'photohunt',
    name: '📸 Фотоохота',
    description: 'Командная фотоохота с креативными заданиями: ищите красные объекты, необычные вывески, делайте селфи с незнакомцами и фотографируйте отражения. В конце — голосование за лучшие фото!',
    icon: '📸',
    color: 'from-pink-500 to-rose-500',
    difficulty: 'easy',
    estimatedTime: '30-60 мин',
    minPlayers: '2-10',
    scenes,
    edges,
    triggers,
  };
}

// ==================== Template 4: 🗺️ Геокешинг (продвинутый) ====================

function createGeocachingAdvancedTemplate(): ScenarioTemplate {
  sceneCounter = 0;
  edgeCounter = 0;

  const start = makeScene('location', 'Старт', 'Добро пожаловать в геокешинг! Найдите все тайники и соберите ключи.', [
    { type: 'text', title: 'Миссия', description: 'Напишите "готов" чтобы начать', config: { correctAnswer: 'готов', matchMode: 'case_insensitive', maxAttempts: 99 } },
    { type: 'inventory_get', title: 'Компас', description: 'Получен компас', config: { itemId: 'compass', itemName: 'Компас', quantity: 1 } },
    { type: 'inventory_get', title: 'Карта', description: 'Получена карта местности', config: { itemId: 'treasure_map', itemName: 'Карта', quantity: 1 } },
  ]);

  const cache1 = makeScene('location', 'Тайник 1', 'Найдите тайник у памятника. Отсканируйте QR-код на дереве.', [
    { type: 'gps', title: 'Найти тайник', description: 'Подойдите к тайнику', config: { lat: 55.7580, lng: 37.6200, radius: 30, points: 10 } },
    { type: 'qr', title: 'QR-код', description: 'Отсканируйте QR на дереве', config: { data: 'cache1_secret', points: 15 } },
    { type: 'collect', title: 'Ключ-1', description: 'Получить ключ-1', config: { itemId: 'key_1', itemName: 'Ключ-1', quantity: 1 } },
  ], { gps: { lat: 55.7580, lng: 37.6200, radius: 30 } });

  const cache2 = makeScene('location', 'Тайник 2', 'Найдите тайник у фонтана в парке.', [
    { type: 'gps', title: 'Найти тайник', description: 'Подойдите к тайнику', config: { lat: 55.7600, lng: 37.6150, radius: 25, points: 10 } },
    { type: 'collect', title: 'Старинная карта', description: 'Получить старинную карту', config: { itemId: 'ancient_map', itemName: 'Старинная карта', quantity: 1 } },
  ], { gps: { lat: 55.7600, lng: 37.6150, radius: 25 } });

  const cache3 = makeScene('location', 'Тайник 3', 'Решите головоломку у старого моста.', [
    { type: 'gps', title: 'Найти тайник', description: 'Подойдите к тайнику', config: { lat: 55.7570, lng: 37.6220, radius: 20, points: 10 } },
    { type: 'code', title: 'Головоломка', description: 'Решите головоломку', config: { correctCode: 'cache3_open', maxAttempts: 3, points: 25 } },
    { type: 'collect', title: 'Ключ-2', description: 'Получить ключ-2', config: { itemId: 'key_2', itemName: 'Ключ-2', quantity: 1 } },
  ], { gps: { lat: 55.7570, lng: 37.6220, radius: 20 } });

  const cache4 = makeScene('location', 'Тайник 4 (финальный)', 'Финальная проверка! У вас есть оба ключа?', [
    { type: 'gps', title: 'Финальный тайник', description: 'Подойдите к финальному тайнику', config: { lat: 55.7560, lng: 37.6190, radius: 15, points: 10 } },
    { type: 'inventory_check', title: 'Проверка ключей', description: 'У вас должны быть оба ключа', config: { itemId: 'key_2', itemName: 'Ключ-2', quantity: 1, consumeOnCheck: true } },
  ], { gps: { lat: 55.7560, lng: 37.6190, radius: 15 } });

  const finish = makeScene('location', 'Финиш', 'Поздравляем! Вы нашли все тайники!', [
    { type: 'achievement', title: 'Кладоискатель', description: '', config: { achievementId: 'geocaching_finder', achievementName: 'Кладоискатель', achievementDescription: 'Найдите все тайники и соберите ключи', icon: '🗺️' } },
  ]);

  const scenes = [start, cache1, cache2, cache3, cache4, finish];
  const edges = [
    makeEdge(scenes[0].id, scenes[1].id),
    makeEdge(scenes[1].id, scenes[2].id),
    makeEdge(scenes[2].id, scenes[3].id),
    makeEdge(scenes[3].id, scenes[4].id),
    makeEdge(scenes[4].id, scenes[5].id),
  ];

  const triggers: TriggerDefinition[] = [
    makeTrigger('onMissionFail', [
      makeAction('show_notification', { text: 'Подсказка: поищите вокруг дерева', icon: '💡', duration: 5000 }),
    ], 'Подсказка при провале', 'Подсказка при неудаче', undefined, 60000),
    makeTrigger('onItemGet', [
      makeAction('show_notification', { text: 'Найден ключ 1/2! Остался ещё один.', icon: '🔑', duration: 3000 }),
    ], 'Найден ключ 1', 'Уведомление о первом ключе', { itemId: 'key_1' }),
    makeTrigger('onItemGet', [
      makeAction('show_notification', { text: 'Оба ключа найдены! Идите к финальному тайнику!', icon: '🗝️', duration: 4000 }),
    ], 'Найден ключ 2', 'Уведомление о втором ключе', { itemId: 'key_2' }),
  ];

  const inventory: InventoryItem[] = [
    { id: 'compass', name: 'Компас', description: 'Помогает ориентироваться на местности', type: 'quest', rarity: 'common', quantity: 1, icon: '🧭', effects: [], stackable: false, maxStack: 1, useable: false, usableInScenario: false, tradeable: false, weight: 0 },
    { id: 'treasure_map', name: 'Карта', description: 'Карта с отмеченными тайниками', type: 'quest', rarity: 'common', quantity: 1, icon: '🗺️', effects: [], stackable: false, maxStack: 1, useable: false, usableInScenario: false, tradeable: false, weight: 0 },
    { id: 'key_1', name: 'Ключ-1', description: 'Первый ключ от тайника', type: 'key', rarity: 'uncommon', quantity: 1, icon: '🔑', effects: [], stackable: true, maxStack: 99, useable: false, usableInScenario: false, tradeable: false, weight: 0 },
    { id: 'key_2', name: 'Ключ-2', description: 'Второй ключ от тайника', type: 'key', rarity: 'uncommon', quantity: 1, icon: '🔑', effects: [], stackable: true, maxStack: 99, useable: false, usableInScenario: false, tradeable: false, weight: 0 },
    { id: 'ancient_map', name: 'Старинная карта', description: 'Древняя карта с подсказками', type: 'quest', rarity: 'uncommon', quantity: 1, icon: '📜', effects: [], stackable: false, maxStack: 1, useable: false, usableInScenario: false, tradeable: false, weight: 0 },
  ];

  return {
    id: 'geocaching-advanced',
    name: '🗺️ Геокешинг (продвинутый)',
    description: 'Продвинутый геокешинг с поиском тайников по GPS, QR-кодами, головоломками и системой ключей. Соберите оба ключа и найдите финальный тайник!',
    icon: '🗺️',
    color: 'from-emerald-500 to-teal-500',
    difficulty: 'hard',
    estimatedTime: '60-120 мин',
    minPlayers: '1-4',
    scenes,
    edges,
    triggers,
    inventory,
  };
}

// ==================== Template 5: 🎯 Квиз-шоу ====================

function createQuizShowTemplate(): ScenarioTemplate {
  sceneCounter = 0;
  edgeCounter = 0;

  const start = makeScene('location', 'Старт', 'Добро пожаловать на Квиз-шоу! Проверьте свои знания.', [
    { type: 'text', title: 'Начало', description: 'Напишите "готов" чтобы начать', config: { correctAnswer: 'готов', matchMode: 'case_insensitive', maxAttempts: 99 } },
  ]);

  const rounds = makeScene('quiz', 'Раунды', 'Отвечайте на вопросы викторины. У вас 5 раундов.', [
    { type: 'choice', title: 'Вопрос', description: 'Столица Франции?', config: { options: ['Лондон', 'Париж', 'Берлин', 'Мадрид'], correctIndex: 1, shuffle: true, points: 10 } },
  ], {
    loop: {
      type: 'for',
      count: 5,
      counterVariable: 'round',
      onCompleteSceneId: '',
    } as LoopConfig,
  });

  const finalRound = makeScene('quiz', 'Финальный раунд', 'Удвоение ставок! Рискнёте?', [
    { type: 'choice', title: 'Финальный вопрос', description: 'Удвоение ставок! Рискнёте?', config: { options: ['Да', 'Нет'], correctIndex: 0, shuffle: false, points: 50 } },
  ]);

  const leaderboard = makeScene('slide', 'Турнирная таблица', 'Результаты игры', []);

  const finish = makeScene('location', 'Финиш', 'Квиз-шоу завершён! Поздравляем чемпиона!', [
    { type: 'achievement', title: 'Чемпион квиза', description: '', config: { achievementId: 'quiz_champion', achievementName: 'Чемпион квиза', achievementDescription: 'Пройдите все раунды квиз-шоу', icon: '🎯' } },
  ]);

  const scenes = [start, rounds, finalRound, leaderboard, finish];
  const edges = [
    makeEdge(scenes[0].id, scenes[1].id),
    makeEdge(scenes[1].id, scenes[2].id),
    makeEdge(scenes[2].id, scenes[3].id),
    makeEdge(scenes[3].id, scenes[4].id),
  ];

  const triggers: TriggerDefinition[] = [
    makeTrigger('onTimerEnd', [
      makeAction('show_notification', { text: 'Время вышло! Ответ не засчитан.', icon: '⏰', duration: 3000 }),
    ], 'Время вышло', 'Уведомление об истечении времени'),
    makeTrigger('onMissionComplete', [
      makeAction('add_score', { amount: 10 }),
      makeAction('show_notification', { text: '+10 очков за правильный ответ!', icon: '✅', duration: 2000 }),
    ], 'Бонус за ответ', 'Начисление очков за правильный ответ'),
    makeTrigger('onMissionComplete', [
      makeAction('set_variable', { variableName: 'double_bonus', value: 50, operation: 'set' }),
    ], 'Бонус финала', 'Бонус за финальный раунд', { sceneId: finalRound.id }),
  ];

  const variables: VariableDefinition[] = [
    { name: 'round', type: 'number', defaultValue: 0, scope: 'local' },
    { name: 'total_score', type: 'number', defaultValue: 0, scope: 'global' },
    { name: 'double_bonus', type: 'number', defaultValue: 0, scope: 'local' },
  ];

  const phaseConfig: GamePhaseConfig = {
    phases: [
      { id: 'warmup', name: 'Разминка', type: 'round', description: '', duration: 150, order: 1, dayNightCycle: false, nextPhaseId: 'final', allowedActions: ['answer'], allowedScenes: [], allowedMissions: [], globalModifiers: {}, onPhaseStart: [], onPhaseEnd: [], icon: '🔥', color: '#f59e0b', lighting: 'day' },
      { id: 'final', name: 'Финальный раунд', type: 'round', description: '', duration: 60, order: 2, dayNightCycle: false, nextPhaseId: null, allowedActions: ['answer'], allowedScenes: [], allowedMissions: [], globalModifiers: {}, onPhaseStart: [], onPhaseEnd: [], icon: '⭐', color: '#ef4444', lighting: 'day' },
    ],
    transitions: [],
    startPhaseId: 'warmup',
    cycleEnabled: false,
    cycleOrder: 'sequential',
    globalTimeLimit: 600,
    roundSystem: true,
    currentRound: 0,
    maxRounds: 5,
    roundStartPhase: 'warmup',
    roundEndCondition: { operator: 'AND', conditions: [] },
    onGameEnd: [],
  };

  return {
    id: 'quiz-show',
    name: '🎯 Квиз-шоу',
    description: 'Динамичная викторина с несколькими раундами, финальным раундом с удвоением ставок и турнирной таблицей. Проверьте свою эрудицию и победите!',
    icon: '🎯',
    color: 'from-yellow-500 to-orange-500',
    difficulty: 'easy',
    estimatedTime: '10-20 мин',
    minPlayers: '1-10',
    scenes,
    edges,
    triggers,
    variables,
    phaseConfig,
  };
}

// ==================== Template 6: 🎭 Мафия ====================

function createMafiaTemplate(): ScenarioTemplate {
  sceneCounter = 0;
  edgeCounter = 0;

  const start = makeScene('location', 'Старт', 'Добро пожаловать в Мафию! Город засыпает...', [
    { type: 'text', title: 'Начало', description: 'Напишите "готов" чтобы начать', config: { correctAnswer: 'готов', matchMode: 'case_insensitive', maxAttempts: 99 } },
    { type: 'achievement', title: 'Участник мафии', description: '', config: { achievementId: 'mafia_participant', achievementName: 'Участник мафии', achievementDescription: 'Начните игру в Мафию', icon: '🎭' } },
  ]);

  const night = makeScene('custom', 'Ночь', 'Город засыпает... Просыпается мафия.', [], {
    multiplayer: {
      type: 'voting',
      duration: 60,
      autoComplete: true,
      voteVisibility: 'hidden',
      minPlayers: 6,
      maxPlayers: 12,
      resultAction: 'trigger_event',
      resultEventName: 'night_end',
    } as MultiplayerMechanicConfig,
  });

  const day = makeScene('custom', 'День', 'Наступило утро. Обсудите, кого подозреваете.', [], {
    multiplayer: {
      type: 'voting',
      duration: 180,
      autoComplete: true,
      voteVisibility: 'after_vote',
      minPlayers: 6,
      maxPlayers: 12,
      resultAction: 'trigger_event',
      resultEventName: 'day_end',
    } as MultiplayerMechanicConfig,
  });

  const loop = makeScene('loop', 'Цикл', 'Цикл дня и ночи', [], {
    loop: {
      type: 'while',
      condition: {
        operator: 'AND',
        conditions: [
          { type: 'variable', operator: 'gt', left: 'alive_count', right: 2 } as SingleCondition,
        ],
      },
      maxIterations: 20,
      onCompleteSceneId: '',
    } as LoopConfig,
  });

  const finish = makeScene('location', 'Финиш', 'Игра окончена! Поздравляем победителей!', [
    { type: 'achievement', title: 'Победа в Мафии', description: '', config: { achievementId: 'mafia_winner', achievementName: 'Победа в Мафии', achievementDescription: 'Завершите игру в Мафию', icon: '🎭' } },
  ]);

  const scenes = [start, night, day, loop, finish];
  const edges = [
    makeEdge(scenes[0].id, scenes[1].id),
    makeEdge(scenes[1].id, scenes[2].id),
    makeEdge(scenes[2].id, scenes[3].id),
    makeEdge(scenes[3].id, scenes[1].id, { type: 'variable', operator: 'gt', left: 'alive_count', right: 2 }),
    makeEdge(scenes[3].id, scenes[4].id, { type: 'variable', operator: 'lte', left: 'alive_count', right: 2 }),
  ];

  const triggers: TriggerDefinition[] = [
    makeTrigger('onRoleAssigned', [
      makeAction('show_notification', { text: 'Ваша роль: {role}. Ночью будьте внимательны!', icon: '🎭', duration: 5000 }),
    ], 'Роль назначена', 'Уведомление о назначении роли'),
    makeTrigger('onSceneEnter', [
      makeAction('emit_event', { eventName: 'night_start', data: {} }),
    ], 'Начало ночи', 'Событие начала ночи', { sceneId: night.id }),
    makeTrigger('onSceneEnter', [
      makeAction('show_notification', { text: 'Наступило утро. Обсудите, кого подозреваете.', icon: '☀️', duration: 5000 }),
    ], 'Начало дня', 'Уведомление о наступлении дня', { sceneId: day.id }),
    makeTrigger('onCustomEvent', [
      makeAction('set_variable', { variableName: 'night_phase', value: 0, operation: 'set' }),
    ], 'Ночь завершена', 'Сброс переменной ночи', { eventName: 'night_end' }),
    makeTrigger('onCustomEvent', [
      makeAction('set_variable', { variableName: 'day_phase', value: 0, operation: 'set' }),
    ], 'День завершён', 'Сброс переменной дня', { eventName: 'day_end' }),
  ];

  const roles: RoleDefinition[] = [
    { id: 'mafia_peaceful', name: 'Мирный', description: 'Мирный житель', team: 'neutral', permissions: ['vote'], icon: '👤', count: 4, winCondition: { operator: 'AND', conditions: [{ type: 'variable', operator: 'eq', left: 'mafia_alive', right: 0 }] }, visibility: 'all' },
    { id: 'mafia_mafia', name: 'Мафия', description: 'Член мафии', team: 'red', permissions: ['vote', 'kill'], icon: '🔪', count: 2, winCondition: { operator: 'AND', conditions: [{ type: 'variable', operator: 'gte', left: 'mafia_count', right: 'alive_count / 2' }] }, visibility: 'role_only' },
    { id: 'mafia_commissioner', name: 'Комиссар', description: 'Комиссар', team: 'neutral', permissions: ['vote', 'investigate'], icon: '🔍', count: 1, winCondition: { operator: 'AND', conditions: [{ type: 'variable', operator: 'eq', left: 'mafia_alive', right: 0 }] }, visibility: 'all' },
    { id: 'mafia_doctor', name: 'Доктор', description: 'Доктор', team: 'neutral', permissions: ['vote', 'heal'], icon: '💊', count: 1, winCondition: { operator: 'AND', conditions: [{ type: 'variable', operator: 'eq', left: 'mafia_alive', right: 0 }] }, visibility: 'all' },
  ];

  const parallelScenarios: ParallelScenarioConfig[] = [
    {
      id: 'mafia-night-actions',
      scenarioId: '',
      name: 'Ночные действия',
      startOn: 'trigger',
      triggerEvent: 'night_start',
      syncPoints: [
        {
          id: 'sp-night',
          type: 'wait_all',
          scenarios: ['mafia-kill', 'commissioner-check', 'doctor-heal'],
          onComplete: { action: 'emit_event', eventData: { eventName: 'night_end' } },
        },
      ],
      variables: { local: ['mafia_target', 'check_target', 'heal_target'], shared: ['night_kill'] },
    },
  ];

  const variables: VariableDefinition[] = [
    { name: 'alive_count', type: 'number', defaultValue: 12, scope: 'global' },
    { name: 'mafia_alive', type: 'number', defaultValue: 2, scope: 'global' },
    { name: 'mafia_count', type: 'number', defaultValue: 2, scope: 'global' },
    { name: 'night_phase', type: 'number', defaultValue: 0, scope: 'local' },
    { name: 'day_phase', type: 'number', defaultValue: 0, scope: 'local' },
  ];

  const phaseConfig: GamePhaseConfig = {
    phases: [
      { id: 'night', name: 'Ночь', type: 'night', description: '', duration: 60, order: 1, dayNightCycle: true, nextPhaseId: 'day', allowedActions: ['vote', 'kill', 'investigate', 'heal'], allowedScenes: [], allowedMissions: [], globalModifiers: {}, onPhaseStart: [], onPhaseEnd: [], icon: '🌙', color: '#1e293b', lighting: 'night' },
      { id: 'day', name: 'День', type: 'day', description: '', duration: 180, order: 2, dayNightCycle: true, nextPhaseId: 'night', allowedActions: ['vote'], allowedScenes: [], allowedMissions: [], globalModifiers: {}, onPhaseStart: [], onPhaseEnd: [], icon: '☀️', color: '#fbbf24', lighting: 'day' },
    ],
    transitions: [],
    startPhaseId: 'night',
    cycleEnabled: true,
    cycleOrder: 'sequential',
    globalTimeLimit: 1800,
    roundSystem: false,
    currentRound: 0,
    maxRounds: 0,
    roundStartPhase: '',
    roundEndCondition: { operator: 'AND', conditions: [] },
    onGameEnd: [],
  };

  return {
    id: 'mafia',
    name: '🎭 Мафия',
    description: 'Классическая игра Мафия с ролями (мирные, мафия, комиссар, доктор), циклами дня и ночи, голосованиями и ночными действиями. Для 6-12 игроков.',
    icon: '🎭',
    color: 'from-slate-800 to-slate-600',
    difficulty: 'medium',
    estimatedTime: '30-60 мин',
    minPlayers: '6-12',
    scenes,
    edges,
    triggers,
    roles,
    parallelScenarios,
    variables,
    phaseConfig,
  };
}

// ==================== Template 7: 🔍 Детектив ====================

function createDetectiveTemplate(): ScenarioTemplate {
  sceneCounter = 0;
  edgeCounter = 0;

  const start = makeScene('location', 'Старт', 'Осмотрите место преступления. Напишите "осмотрел"', [
    { type: 'text', title: 'Осмотр', description: 'Осмотрите место преступления', config: { correctAnswer: 'осмотрел', matchMode: 'case_insensitive', maxAttempts: 99 } },
  ]);

  const clue1 = makeScene('location', 'Улика 1: Отпечатки', 'Найдите отпечатки пальцев', [
    { type: 'gps', title: 'Найти отпечатки', description: 'Подойдите к месту с отпечатками', config: { lat: 55.7558, lng: 37.6173, radius: 50, points: 10 } },
    { type: 'inventory_get', title: 'Отпечатки пальцев', description: 'Получены отпечатки пальцев', config: { itemId: 'fingerprints', itemName: 'Отпечатки пальцев', quantity: 1 } },
  ], { gps: { lat: 55.7558, lng: 37.6173, radius: 50 } });

  const clue2 = makeScene('location', 'Улика 2: Записка', 'Расшифруйте записку', [
    { type: 'gps', title: 'Найти записку', description: 'Подойдите к месту с запиской', config: { lat: 55.7580, lng: 37.6200, radius: 40, points: 10 } },
    { type: 'text', title: 'Расшифровка', description: 'Расшифруйте записку', config: { correctAnswer: 'встреча в полночь', matchMode: 'case_insensitive', maxAttempts: 3 } },
    { type: 'inventory_get', title: 'Записка', description: 'Получена записка', config: { itemId: 'note', itemName: 'Записка', quantity: 1 } },
  ], { gps: { lat: 55.7580, lng: 37.6200, radius: 40 } });

  const clue3 = makeScene('location', 'Улика 3: Оружие', 'Найдите оружие и введите серийный номер', [
    { type: 'gps', title: 'Найти оружие', description: 'Подойдите к месту с оружием', config: { lat: 55.7600, lng: 37.6150, radius: 35, points: 10 } },
    { type: 'code', title: 'Серийный номер', description: 'Введите серийный номер', config: { correctCode: 'SN-4492-X', maxAttempts: 3, points: 25 } },
    { type: 'inventory_get', title: 'Оружие', description: 'Получено оружие', config: { itemId: 'weapon', itemName: 'Оружие', quantity: 1 } },
  ], { gps: { lat: 55.7600, lng: 37.6150, radius: 35 } });

  const interrogation = makeScene('dialogue', 'Допрос', 'Поговорите со следователем', [
    {
      type: 'dialogue',
      title: 'Диалог',
      description: 'Покажите улики следователю',
      config: {
        npcName: 'Следователь',
        npcDescription: 'Суровый мужчина в плаще',
        dialogues: [
          {
            npcText: 'У вас есть улики?',
            options: [
              { text: 'Показать отпечатки', targetSceneId: '' },
              { text: 'Показать записку', targetSceneId: '' },
              { text: 'Показать оружие', targetSceneId: '' },
            ],
          },
        ],
      },
    },
  ]);

  const deduction = makeScene('quiz', 'Дедукция', 'Кто виновен?', [
    { type: 'choice', title: 'Кто виновен?', description: 'Выберите виновного', config: { options: ['Дворецкий', 'Горничная', 'Садовник'], correctIndex: 0, shuffle: false, points: 50 } },
  ]);

  const finalA = makeScene('location', 'Финал А', 'Поздравляем! Вы нашли виновного!', [
    { type: 'achievement', title: 'Идеальный детектив', description: '', config: { achievementId: 'detective_perfect', achievementName: 'Идеальный детектив', achievementDescription: 'Найдите виновного с первой попытки', icon: '🔍' } },
  ]);

  const finalB = makeScene('location', 'Финал Б', 'Вы ошиблись. Преступник скрылся...', []);

  const scenes = [start, clue1, clue2, clue3, interrogation, deduction, finalA, finalB];
  const edges = [
    makeEdge(scenes[0].id, scenes[1].id),
    makeEdge(scenes[1].id, scenes[2].id),
    makeEdge(scenes[2].id, scenes[3].id),
    makeEdge(scenes[3].id, scenes[4].id),
    makeEdge(scenes[4].id, scenes[5].id),
    makeEdge(scenes[5].id, scenes[6].id, { type: 'variable', operator: 'eq', left: 'choice_correct', right: 0 }),
    makeEdge(scenes[5].id, scenes[7].id, { type: 'variable', operator: 'ne', left: 'choice_correct', right: 0 }),
  ];

  const triggers: TriggerDefinition[] = [
    makeTrigger('onItemGet', [
      makeAction('show_notification', { text: 'Улика 1/3: Отпечатки собраны', icon: '🖐️', duration: 3000 }),
    ], 'Улика 1 найдена', 'Уведомление о найденных отпечатках', { itemId: 'fingerprints' }),
    makeTrigger('onItemGet', [
      makeAction('show_notification', { text: 'Улика 2/3: Записка расшифрована', icon: '📝', duration: 3000 }),
    ], 'Улика 2 найдена', 'Уведомление о найденной записке', { itemId: 'note' }),
    makeTrigger('onItemGet', [
      makeAction('show_notification', { text: 'Улика 3/3: Оружие найдено', icon: '🔪', duration: 3000 }),
      makeAction('emit_event', { eventName: 'all_clues_collected', data: {} }),
    ], 'Улика 3 найдена', 'Уведомление о найденном оружии', { itemId: 'weapon' }),
    makeTrigger('onCustomEvent', [
      makeAction('show_notification', { text: 'Все улики собраны! Идите на допрос.', icon: '🔍', duration: 4000 }),
    ], 'Все улики собраны', 'Уведомление о сборе всех улик', { eventName: 'all_clues_collected' }),
  ];

  const inventory: InventoryItem[] = [
    { id: 'fingerprints', name: 'Отпечатки пальцев', description: 'Улика: отпечатки пальцев', type: 'key', rarity: 'uncommon', quantity: 1, icon: '🖐️', effects: [], stackable: true, maxStack: 99, useable: false, usableInScenario: false, tradeable: false, weight: 0 },
    { id: 'note', name: 'Записка', description: 'Улика: записка', type: 'key', rarity: 'uncommon', quantity: 1, icon: '📝', effects: [], stackable: true, maxStack: 99, useable: false, usableInScenario: false, tradeable: false, weight: 0 },
    { id: 'weapon', name: 'Оружие', description: 'Улика: оружие', type: 'key', rarity: 'rare', quantity: 1, icon: '🔪', effects: [], stackable: true, maxStack: 99, useable: false, usableInScenario: false, tradeable: false, weight: 0 },
    { id: 'badge', name: 'Значок детектива', description: 'Значок детектива', type: 'quest', rarity: 'common', quantity: 1, icon: '🛡️', effects: [], stackable: false, maxStack: 1, useable: false, usableInScenario: false, tradeable: false, weight: 0 },
  ];

  return {
    id: 'detective',
    name: '🔍 Детектив',
    description: 'Расследование преступления: осмотрите место, соберите улики, допросите свидетеля и найдите виновного!',
    icon: '🔍',
    color: 'from-amber-700 to-yellow-800',
    difficulty: 'medium',
    estimatedTime: '30-60 мин',
    minPlayers: '1-4',
    scenes,
    edges,
    triggers,
    inventory,
  };
}

// ==================== Template 8: 🏭 Экономическая стратегия ====================

function createEconomicStrategyTemplate(): ScenarioTemplate {
  sceneCounter = 0;
  edgeCounter = 0;

  const start = makeScene('location', 'Старт', 'Выберите фракцию. Напишите "готов"', [
    { type: 'text', title: 'Начало', description: 'Напишите "готов" чтобы начать', config: { correctAnswer: 'готов', matchMode: 'case_insensitive', maxAttempts: 99 } },
    { type: 'inventory_get', title: 'Стартовый капитал', description: 'Получен стартовый капитал', config: { itemId: 'gold_coins', itemName: 'Стартовый капитал', quantity: 100 } },
  ]);

  const harvest = makeScene('location', 'Добыча ресурсов', 'Добывайте ресурсы', [
    { type: 'collect', title: 'Добыть дерево', description: 'Добыть дерево', config: { itemId: 'wood', itemName: 'Древесина', quantity: 1 } },
    { type: 'collect', title: 'Добыть железо', description: 'Добыть железо', config: { itemId: 'iron', itemName: 'Железо', quantity: 1 } },
  ], { loop: { type: 'for', count: 3, counterVariable: 'harvest_round', maxIterations: 10 } as LoopConfig });

  const craft = makeScene('custom', 'Крафт', 'Что скрафтить?', [
    { type: 'choice', title: 'Что скрафтить?', description: 'Выберите предмет для крафта', config: { options: ['Деревянный меч (2 дерева)', 'Железная броня (3 железа + 1 уголь)', 'Зелье (2 травы + 1 вода)'], correctIndex: 0, shuffle: false, points: 20 } },
  ]);

  const trade = makeScene('custom', 'Торговля', 'Обменивайтесь ресурсами с другими игроками', [], {
    multiplayer: {
      type: 'trade',
      duration: 120,
      autoComplete: true,
      allowPartial: true,
      voteVisibility: 'always',
      minPlayers: 2,
      maxPlayers: 6,
      resultAction: 'continue',
    } as MultiplayerMechanicConfig,
  });

  const auction = makeScene('custom', 'Аукцион', 'Участвуйте в аукционе', [], {
    multiplayer: {
      type: 'auction',
      duration: 180,
      autoComplete: true,
      startingBid: 10,
      minBidStep: 5,
      currency: 'gold',
      voteVisibility: 'always',
      minPlayers: 2,
      maxPlayers: 6,
      resultAction: 'trigger_event',
      resultEventName: 'auction_end',
    } as MultiplayerMechanicConfig,
  });

  const finish = makeScene('location', 'Финиш', 'Экономическая стратегия завершена!', [
    { type: 'achievement', title: 'Магнат', description: '', config: { achievementId: 'economy_magnate', achievementName: 'Магнат', achievementDescription: 'Пройдите экономическую стратегию', icon: '🏭' } },
  ]);

  const scenes = [start, harvest, craft, trade, auction, finish];
  const edges = [
    makeEdge(scenes[0].id, scenes[1].id),
    makeEdge(scenes[1].id, scenes[2].id),
    makeEdge(scenes[2].id, scenes[3].id),
    makeEdge(scenes[3].id, scenes[4].id),
    makeEdge(scenes[4].id, scenes[5].id),
  ];

  const triggers: TriggerDefinition[] = [
    makeTrigger('onMissionComplete', [
      makeAction('add_score', { amount: 5 }),
      makeAction('show_notification', { text: 'Ресурсы добыты!', icon: '⛏️', duration: 2000 }),
    ], 'Ресурсы добыты', 'Начисление очков за добычу', { sceneId: harvest.id }),
    makeTrigger('onItemCraft', [
      makeAction('show_notification', { text: 'Предмет скрафчен!', icon: '🔨', duration: 2000 }),
      makeAction('add_score', { amount: 15 }),
    ], 'Предмет скрафчен', 'Начисление очков за крафт'),
    makeTrigger('onItemTrade', [
      makeAction('show_notification', { text: 'Сделка совершена!', icon: '🤝', duration: 2000 }),
      makeAction('set_variable', { variableName: 'trade_count', value: 1, operation: 'add' }),
    ], 'Сделка совершена', 'Уведомление о сделке'),
    makeTrigger('onCustomEvent', [
      makeAction('show_notification', { text: 'Аукцион завершён!', icon: '🔨', duration: 3000 }),
      makeAction('add_score', { amount: 25 }),
    ], 'Аукцион завершён', 'Начисление очков за аукцион', { eventName: 'auction_end' }),
  ];

  const inventory: InventoryItem[] = [
    { id: 'gold_coins', name: 'Золотые монеты', description: 'Валюта', type: 'currency', rarity: 'common', quantity: 100, icon: '🪙', effects: [], stackable: true, maxStack: 9999, useable: false, usableInScenario: false, tradeable: true, weight: 0 },
    { id: 'wood', name: 'Древесина', description: 'Древесина для крафта', type: 'material', rarity: 'common', quantity: 0, icon: '🪵', effects: [], stackable: true, maxStack: 999, useable: false, usableInScenario: false, tradeable: true, weight: 0 },
    { id: 'iron', name: 'Железо', description: 'Железная руда', type: 'material', rarity: 'uncommon', quantity: 0, icon: '⛏️', effects: [], stackable: true, maxStack: 999, useable: false, usableInScenario: false, tradeable: true, weight: 0 },
    { id: 'coal', name: 'Уголь', description: 'Каменный уголь', type: 'material', rarity: 'common', quantity: 0, icon: '⚫', effects: [], stackable: true, maxStack: 999, useable: false, usableInScenario: false, tradeable: true, weight: 0 },
    { id: 'herb', name: 'Трава', description: 'Лечебная трава', type: 'material', rarity: 'common', quantity: 0, icon: '🌿', effects: [], stackable: true, maxStack: 999, useable: false, usableInScenario: false, tradeable: true, weight: 0 },
    { id: 'water', name: 'Вода', description: 'Чистая вода', type: 'material', rarity: 'common', quantity: 0, icon: '💧', effects: [], stackable: true, maxStack: 999, useable: false, usableInScenario: false, tradeable: true, weight: 0 },
    { id: 'wood_sword', name: 'Деревянный меч', description: 'Простой меч из дерева', type: 'weapon', rarity: 'common', quantity: 0, icon: '🗡️', effects: [], stackable: false, maxStack: 1, useable: false, usableInScenario: false, tradeable: true, weight: 0 },
    { id: 'iron_armor', name: 'Железная броня', description: 'Надёжная броня из железа', type: 'armor', rarity: 'uncommon', quantity: 0, icon: '🛡️', effects: [], stackable: false, maxStack: 1, useable: false, usableInScenario: false, tradeable: true, weight: 0 },
    { id: 'health_potion', name: 'Зелье здоровья', description: 'Восстанавливает здоровье', type: 'consumable', rarity: 'common', quantity: 0, icon: '🧪', effects: [], stackable: true, maxStack: 99, useable: true, usableInScenario: true, tradeable: true, weight: 0 },
  ];

  const parallelScenarios: ParallelScenarioConfig[] = [
    {
      id: 'economy-parallel',
      scenarioId: '',
      name: 'Экономические процессы',
      startOn: 'game_start',
      syncPoints: [
        {
          id: 'sp-economy-round',
          type: 'wait_all',
          scenarios: ['economy-harvest', 'economy-craft', 'economy-trade'],
          onComplete: { action: 'emit_event', eventData: { eventName: 'economy_round_end' } },
        },
      ],
      variables: { local: ['harvest_amount', 'craft_items', 'trade_deals'], shared: ['market_prices'] },
    },
  ];

  const variables: VariableDefinition[] = [
    { name: 'gold', type: 'number', defaultValue: 100, scope: 'local' },
    { name: 'wood_count', type: 'number', defaultValue: 0, scope: 'local' },
    { name: 'iron_count', type: 'number', defaultValue: 0, scope: 'local' },
    { name: 'coal_count', type: 'number', defaultValue: 0, scope: 'local' },
    { name: 'herb_count', type: 'number', defaultValue: 0, scope: 'local' },
    { name: 'trade_count', type: 'number', defaultValue: 0, scope: 'local' },
    { name: 'market_price_wood', type: 'number', defaultValue: 5, scope: 'global' },
    { name: 'market_price_iron', type: 'number', defaultValue: 15, scope: 'global' },
  ];

  return {
    id: 'economic-strategy',
    name: '🏭 Экономическая стратегия',
    description: 'Экономическая стратегия с добычей ресурсов, крафтом, торговлей и аукционом. Станьте магнатом!',
    icon: '🏭',
    color: 'from-yellow-600 to-green-700',
    difficulty: 'hard',
    estimatedTime: '45-90 мин',
    minPlayers: '2-6',
    scenes,
    edges,
    triggers,
    inventory,
    variables,
    parallelScenarios,
  };
}

// ==================== Template 9: ⚔️ Battle Royale ====================

function createBattleRoyaleTemplate(): ScenarioTemplate {
  sceneCounter = 0;
  edgeCounter = 0;

  const start = makeScene('location', 'Старт', 'Приготовьтесь! Напишите "готов"', [
    { type: 'text', title: 'Начало', description: 'Напишите "готов" чтобы начать', config: { correctAnswer: 'готов', matchMode: 'case_insensitive', maxAttempts: 99 } },
    { type: 'inventory_get', title: 'Стартовый лут', description: 'Получен стартовый меч', config: { itemId: 'starter_sword', itemName: 'Стартовый меч', quantity: 1 } },
    { type: 'inventory_get', title: 'Щит', description: 'Получен щит', config: { itemId: 'shield', itemName: 'Щит', quantity: 1 } },
  ]);

  const rounds = makeScene('location', 'Раунды', 'Сражайтесь и собирайте лут', [
    { type: 'collect', title: 'Собрать лут', description: 'Собрать лут', config: { itemId: 'loot_box', itemName: 'Лут', quantity: 1 } },
    { type: 'choice', title: 'Атаковать или спрятаться?', description: 'Выберите действие', config: { options: ['Атаковать', 'Спрятаться', 'Искать лут'], correctIndex: 0, shuffle: false, points: 10 } },
  ], { loop: { type: 'while', condition: { operator: 'AND', conditions: [{ type: 'variable', operator: 'gt', left: 'alive_players', right: 1 }] }, maxIterations: 20 } as LoopConfig });

  const zoneShrink = makeScene('slide', 'Сужение зоны', 'Зона сужается!', []);

  const auction = makeScene('custom', 'Аукцион', 'Торги за ресурсы', [], {
    multiplayer: {
      type: 'auction',
      duration: 60,
      autoComplete: true,
      startingBid: 5,
      minBidStep: 2,
      currency: 'gold',
      voteVisibility: 'always',
      minPlayers: 2,
      maxPlayers: 20,
      resultAction: 'continue',
    } as MultiplayerMechanicConfig,
  });

  const craft = makeScene('custom', 'Крафт', 'Улучшить экипировку', [
    { type: 'choice', title: 'Улучшить экипировку', description: 'Выберите улучшение', config: { options: ['Улучшить меч (2 лута)', 'Улучшить броню (3 лута)', 'Создать зелье (1 лут)'], correctIndex: 0, shuffle: false, points: 15 } },
  ]);

  const finish = makeScene('location', 'Финиш', 'Поздравляем! Вы король битвы!', [
    { type: 'achievement', title: 'Король битвы', description: '', config: { achievementId: 'br_winner', achievementName: 'Король битвы', achievementDescription: 'Победите в Battle Royale', icon: '⚔️' } },
  ]);

  const scenes = [start, rounds, zoneShrink, auction, craft, finish];
  const edges = [
    makeEdge(scenes[0].id, scenes[1].id),
    makeEdge(scenes[1].id, scenes[2].id, { type: 'variable', operator: 'eq', left: 'timer_triggered', right: 1 }),
    makeEdge(scenes[2].id, scenes[3].id),
    makeEdge(scenes[3].id, scenes[4].id),
    makeEdge(scenes[4].id, scenes[1].id, { type: 'variable', operator: 'gt', left: 'alive_players', right: 1 }),
    makeEdge(scenes[4].id, scenes[5].id, { type: 'variable', operator: 'lte', left: 'alive_players', right: 1 }),
  ];

  const triggers: TriggerDefinition[] = [
    makeTrigger('onTimerEnd', [
      makeAction('show_notification', { text: 'Зона сужается! Бегите!', icon: '⚡', duration: 3000 }),
      makeAction('set_variable', { variableName: 'zone_radius', value: 10, operation: 'subtract' }),
    ], 'Сужение зоны', 'Уведомление о сужении зоны'),
    makeTrigger('onCustomEvent', [
      makeAction('set_variable', { variableName: 'alive_players', value: 1, operation: 'subtract' }),
    ], 'Игрок устранён', 'Уменьшение количества игроков', { eventName: 'player_eliminated' }),
    makeTrigger('onVariableChange', [
      makeAction('emit_event', { eventName: 'battle_end', data: {} }),
      makeAction('show_notification', { text: 'Последний выживший!', icon: '👑', duration: 5000 }),
    ], 'Последний выживший', 'Событие окончания битвы', { variableName: 'alive_players' }),
    makeTrigger('onMissionComplete', [
      makeAction('add_score', { amount: 10 }),
      makeAction('show_notification', { text: '+10 очков за раунд!', icon: '⭐', duration: 2000 }),
    ], 'Очки за раунд', 'Начисление очков за раунд', { sceneId: rounds.id }),
  ];

  const inventory: InventoryItem[] = [
    { id: 'starter_sword', name: 'Стартовый меч', description: 'Меч для начала битвы', type: 'weapon', rarity: 'common', quantity: 1, icon: '⚔️', effects: [], stackable: false, maxStack: 1, useable: false, usableInScenario: false, tradeable: false, weight: 0 },
    { id: 'shield', name: 'Щит', description: 'Защитный щит', type: 'armor', rarity: 'common', quantity: 1, icon: '🛡️', effects: [], stackable: false, maxStack: 1, useable: false, usableInScenario: false, tradeable: false, weight: 0 },
    { id: 'loot_box', name: 'Лут', description: 'Ящик с лутом', type: 'material', rarity: 'uncommon', quantity: 0, icon: '📦', effects: [], stackable: true, maxStack: 999, useable: false, usableInScenario: false, tradeable: false, weight: 0 },
    { id: 'health_potion', name: 'Зелье здоровья', description: 'Восстанавливает здоровье', type: 'consumable', rarity: 'common', quantity: 0, icon: '🧪', effects: [], stackable: true, maxStack: 99, useable: true, usableInScenario: true, tradeable: false, weight: 0 },
    { id: 'upgraded_sword', name: 'Улучшенный меч', description: 'Мощный улучшенный меч', type: 'weapon', rarity: 'rare', quantity: 0, icon: '⚔️', effects: [], stackable: false, maxStack: 1, useable: false, usableInScenario: false, tradeable: false, weight: 0 },
    { id: 'upgraded_armor', name: 'Улучшенная броня', description: 'Прочная улучшенная броня', type: 'armor', rarity: 'rare', quantity: 0, icon: '🛡️', effects: [], stackable: false, maxStack: 1, useable: false, usableInScenario: false, tradeable: false, weight: 0 },
  ];

  const parallelScenarios: ParallelScenarioConfig[] = [
    {
      id: 'br-zone-manager',
      scenarioId: '',
      name: 'Управление зоной',
      startOn: 'game_start',
      syncPoints: [
        {
          id: 'sp-zone-shrink',
          type: 'sequence',
          scenarios: ['br-zone', 'br-loot', 'br-pvp'],
          onComplete: { action: 'continue_all' },
        },
      ],
      variables: { local: ['zone_status', 'loot_spawns'], shared: ['zone_radius'] },
    },
  ];

  const variables: VariableDefinition[] = [
    { name: 'alive_players', type: 'number', defaultValue: 20, scope: 'global' },
    { name: 'zone_radius', type: 'number', defaultValue: 100, scope: 'global' },
    { name: 'current_round', type: 'number', defaultValue: 1, scope: 'local' },
    { name: 'loot_count', type: 'number', defaultValue: 0, scope: 'local' },
  ];

  return {
    id: 'battle-royale',
    name: '⚔️ Battle Royale',
    description: 'Battle Royale с выживанием, сбором лута, сужением зоны, аукционом и крафтом. Победит сильнейший!',
    icon: '⚔️',
    color: 'from-red-700 to-orange-600',
    difficulty: 'hard',
    estimatedTime: '30-60 мин',
    minPlayers: '4-20',
    scenes,
    edges,
    triggers,
    inventory,
    variables,
    parallelScenarios,
  };
}

// ==================== Resolved Templates ====================

export function getResolvedTemplates(): ScenarioTemplate[] {
  return [
    createEncounterSkvatkaTemplate(),
    createBrainstormTemplate(),
    createPhotohuntTemplate(),
    createGeocachingAdvancedTemplate(),
    createQuizShowTemplate(),
    createMafiaTemplate(),
    createDetectiveTemplate(),
    createEconomicStrategyTemplate(),
    createBattleRoyaleTemplate(),
  ];
}
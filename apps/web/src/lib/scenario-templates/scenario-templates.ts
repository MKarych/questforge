'use client';

import { Scene, Edge, SceneType, Condition } from '@/lib/editor-store/editor.types';

export interface ScenarioTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  difficulty: 'easy' | 'medium' | 'hard';
  estimatedTime: string;
  scenes: Scene[];
  edges: Edge[];
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

function makeScene(type: SceneType, title: string, description: string, missions: any[] = [], metadata?: any): Scene {
  const id = sid();
  const idx = sceneCounter;
  return {
    id,
    type,
    title,
    description,
    missions: missions.map((m: any) => ({
      id: `tm-${Math.random().toString(36).slice(2, 8)}`,
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

// ==================== Template Factories ====================

function createQuestTemplate(): ScenarioTemplate {
  sceneCounter = 0;
  edgeCounter = 0;
  const start = makeScene('location', 'Старт', 'Начало приключения! Прочитайте легенду и получите первое задание.', [
    { type: 'text', title: 'Легенда', description: 'Прочитайте вступительный текст', config: { correctAnswer: 'готов', matchMode: 'case_insensitive', maxAttempts: 99 } },
  ]);
  const task1 = makeScene('quiz', 'Задание 1', 'Найдите памятник на главной площади. Какая дата на нём указана?', [
    { type: 'text', title: 'Найти дату', description: 'Подойдите к памятнику и найдите год', config: { correctAnswer: '1812', matchMode: 'exact', maxAttempts: 3, points: 10 } },
  ]);
  const task2 = makeScene('quiz', 'Задание 2', 'Сфотографируйте самое красивое здание на этой улице', [
    { type: 'photo', title: 'Фото', description: 'Сделайте фото', config: { requirements: 'Здание должно быть видно полностью', validationType: 'manual', points: 15 } },
  ]);
  const task3 = makeScene('location', 'Задание 3', 'Зайдите в кофейню "Уют" и спросите секретный код у бариста', [
    { type: 'code', title: 'Код', description: 'Введите код, который скажет бариста', config: { correctCode: 'coffee2024', maxAttempts: 3, points: 20 } },
  ]);
  const finish = makeScene('location', 'Финиш', 'Поздравляем! Вы прошли квест!', [
    { type: 'text', title: 'Финал', description: 'Спасибо за игру!', config: { correctAnswer: '', matchMode: 'exact', maxAttempts: 1 } },
  ]);
  const scenes = [start, task1, task2, task3, finish];
  const edges = [
    makeEdge(scenes[0].id, scenes[1].id),
    makeEdge(scenes[1].id, scenes[2].id),
    makeEdge(scenes[2].id, scenes[3].id),
    makeEdge(scenes[3].id, scenes[4].id),
  ];
  return { id: 'quest', name: 'Классический квест', description: 'Линейный квест с текстовыми заданиями, перемещением по точкам и финалом.', icon: '🗺️', color: 'from-blue-500 to-cyan-500', difficulty: 'easy', estimatedTime: '30-60 мин', scenes, edges };
}

function createGeocachingTemplate(): ScenarioTemplate {
  sceneCounter = 0;
  edgeCounter = 0;
  const start = makeScene('location', 'Старт', 'Добро пожаловать в геокешинг! Найдите все тайники!', [
    { type: 'text', title: 'Инструктаж', description: 'Напишите "готов" чтобы начать', config: { correctAnswer: 'готов', matchMode: 'case_insensitive', maxAttempts: 99 } },
  ], { gps: { lat: 55.7558, lng: 37.6173, radius: 100 } });
  const cache1 = makeScene('location', 'Тайник №1', 'Первый тайник спрятан в парке.', [
    { type: 'gps', title: 'Найти тайник', description: 'Подойдите к указанной точке', config: { lat: 55.7580, lng: 37.6200, radius: 30, points: 20 } },
    { type: 'collect', title: 'Забрать ключ', description: 'Вы нашли ржавый ключ', config: { itemId: 'rusty_key', itemName: 'Ржавый ключ', quantity: 1 } },
  ], { gps: { lat: 55.7580, lng: 37.6200, radius: 30 } });
  const cache2 = makeScene('location', 'Тайник №2', 'Второй тайник у старого фонтана.', [
    { type: 'gps', title: 'Найти тайник', description: 'Подойдите к фонтану', config: { lat: 55.7600, lng: 37.6150, radius: 25, points: 25 } },
    { type: 'qr', title: 'Отсканировать QR', description: 'На тайнике есть QR-код', config: { data: 'cache2_secret', points: 10 } },
  ], { gps: { lat: 55.7600, lng: 37.6150, radius: 25 } });
  const cache3 = makeScene('location', 'Тайник №3', 'Финальный тайник! Используйте ключ.', [
    { type: 'gps', title: 'Финальная точка', description: 'Здесь спрятан главный приз', config: { lat: 55.7570, lng: 37.6220, radius: 20, points: 50 } },
    { type: 'inventory_check', title: 'Использовать ключ', description: 'У вас есть ржавый ключ?', config: { itemId: 'rusty_key', itemName: 'Ржавый ключ', quantity: 1, consumeOnCheck: true } },
  ], { gps: { lat: 55.7570, lng: 37.6220, radius: 20 } });
  const finish = makeScene('location', 'Финиш', 'Клад найден! Вы великолепны!', []);
  const scenes = [start, cache1, cache2, cache3, finish];
  const edges = [
    makeEdge(scenes[0].id, scenes[1].id),
    makeEdge(scenes[1].id, scenes[2].id),
    makeEdge(scenes[2].id, scenes[3].id),
    makeEdge(scenes[3].id, scenes[4].id),
  ];
  return { id: 'geocaching', name: 'Геокешинг', description: 'Поиск тайников по GPS-координатам. Игроки перемещаются между точками, собирают предметы и находят финальный клад.', icon: '🧭', color: 'from-green-500 to-emerald-500', difficulty: 'medium', estimatedTime: '1-2 часа', scenes, edges };
}

function createQuizTemplate(): ScenarioTemplate {
  sceneCounter = 0;
  edgeCounter = 0;
  const start = makeScene('location', 'Старт', 'Добро пожаловать в викторину!', [
    { type: 'text', title: 'Начать', description: 'Напишите "старт"', config: { correctAnswer: 'старт', matchMode: 'case_insensitive', maxAttempts: 99 } },
  ]);
  const q1 = makeScene('quiz', 'Вопрос 1', 'Какая планета самая большая?', [
    { type: 'choice', title: 'Выберите ответ', description: '', config: { options: ['Венера', 'Юпитер', 'Сатурн', 'Марс'], correctIndex: 1, shuffle: false, points: 10 } },
  ]);
  const q2 = makeScene('quiz', 'Вопрос 2', 'Сколько будет 2 + 2 × 2?', [
    { type: 'choice', title: 'Выберите ответ', description: '', config: { options: ['4', '6', '8', '2'], correctIndex: 1, shuffle: false, points: 15 } },
  ]);
  const q3 = makeScene('quiz', 'Вопрос 3', 'Кто написал "Войну и мир"?', [
    { type: 'choice', title: 'Выберите ответ', description: '', config: { options: ['Достоевский', 'Толстой', 'Пушкин', 'Чехов'], correctIndex: 1, shuffle: false, points: 20 } },
  ]);
  const finish = makeScene('location', 'Финиш', 'Викторина пройдена!', [
    { type: 'achievement', title: 'Знаток!', description: '', config: { achievementId: 'quiz_master', achievementName: 'Знаток', achievementDescription: 'Пройдите викторину', icon: '🧠' } },
  ]);
  const scenes = [start, q1, q2, q3, finish];
  const edges = [
    makeEdge(scenes[0].id, scenes[1].id),
    makeEdge(scenes[1].id, scenes[2].id),
    makeEdge(scenes[2].id, scenes[3].id),
    makeEdge(scenes[3].id, scenes[4].id),
  ];
  return { id: 'quiz', name: 'Викторина', description: 'Интеллектуальная викторина с вопросами и вариантами ответов.', icon: '🧠', color: 'from-purple-500 to-pink-500', difficulty: 'easy', estimatedTime: '15-30 мин', scenes, edges };
}

function createDialogueTemplate(): ScenarioTemplate {
  sceneCounter = 0;
  edgeCounter = 0;
  const start = makeScene('dialogue', 'Старт', 'Вы просыпаетесь в таверне.', [
    { type: 'dialogue', title: 'Разговор с трактирщиком', description: '', config: {
      npcName: 'Трактирщик Боб',
      npcDescription: 'Добродушный толстяк с рыжей бородой',
      dialogues: [
        { npcText: 'Проснулся наконец! Тут письмо для тебя пришло.', options: [{ text: 'Читать письмо', targetSceneId: '' }, { text: 'Заказать эль', targetSceneId: '' }] },
      ],
    } },
  ]);
  const quest = makeScene('location', 'Получить задание', 'В письме сказано, что в старом замке спрятан клад.', [
    { type: 'inventory_get', title: 'Получить карту', description: '', config: { itemId: 'treasure_map', itemName: 'Карта сокровищ', quantity: 1 } },
  ]);
  const battle = makeScene('custom', 'Битва', 'На подходе к замку вы встречаете стражника.', [
    { type: 'choice', title: 'Что делать?', description: '', config: { options: ['Атаковать', 'Убежать', 'Поговорить'], correctIndex: 2, shuffle: false, points: 30 } },
  ]);
  const finish = makeScene('location', 'Финиш', 'Вы нашли клад!', [
    { type: 'achievement', title: 'Герой', description: '', config: { achievementId: 'hero', achievementName: 'Герой', achievementDescription: 'Пройдите диалоговый квест', icon: '⚔️' } },
  ]);
  const scenes = [start, quest, battle, finish];
  const edges = [
    makeEdge(scenes[0].id, scenes[1].id),
    makeEdge(scenes[1].id, scenes[2].id),
    makeEdge(scenes[2].id, scenes[3].id),
  ];
  return { id: 'dialogue_rpg', name: 'Диалоговый квест', description: 'Сюжетный квест с диалогами с NPC, выбором реплик и ветвлением сюжета.', icon: '💬', color: 'from-teal-500 to-cyan-500', difficulty: 'hard', estimatedTime: '1-2 часа', scenes, edges };
}

export function getResolvedTemplates(): ScenarioTemplate[] {
  return [
    createQuestTemplate(),
    createGeocachingTemplate(),
    createQuizTemplate(),
    createDialogueTemplate(),
  ];
}
// ============================================================
// Engine Integration Layer
// Соединяет: Editor (Scenario) → JSON → GameSession → ExecutionEngine
// ============================================================

import {
  Scenario,
  Scene,
  SceneType,
  MissionType,
  TransitionType,
  VariableDefinition,
  Reward,
  RewardType,
  ConditionGroup,
  SingleCondition,
  ConditionType,
  Operator,
  ItemType,
  ViewType,
  ScenarioStatus,
  TextMissionConfig,
  CodeMissionConfig,
  PhotoMissionConfig,
  GpsMissionConfig,
  QrMissionConfig,
  ChoiceMissionConfig,
  CollectMissionConfig,
  DialogueMissionConfig,
} from '@/lib/editor-store/editor.types';
import {
  serializeScenario,
  validateScenarioJson,
} from '@/lib/scenario-json/scenario-json';
import {
  ExecutionEngine,
  GameSession,
  Team,
  MissionResult,
  SessionStatus,
  AuditEventType,
  AuditLogEntry,
  getEngineInstance,
} from '@/lib/runtime-engine/runtime-engine';

// ==================== 1. Editor → Engine Bridge ====================

export interface EngineBridgeResult {
  session: GameSession;
  engine: ExecutionEngine;
  validation: {
    valid: boolean;
    errors: string[];
    warnings: string[];
  };
}

/**
 * Полный пайплайн: Editor Scenario → JSON → GameSession → ExecutionEngine
 * 1. Сериализует Scenario в JSON
 * 2. Валидирует JSON
 * 3. Создаёт GameSession через ExecutionEngine
 * 4. Запускает сессию
 */
export function scenarioToEngine(
  scenario: Scenario,
  teamName: string = 'Test Team',
  captainName: string = 'Captain'
): EngineBridgeResult {
  const engine = getEngineInstance();

  // Шаг 1: Сериализация в JSON
  const jsonDef = serializeScenario(scenario);

  // Шаг 2: Валидация JSON
  const jsonValidation = validateScenarioJson(jsonDef);
  const errors = jsonValidation.errors.map((e) => e.message);
  const warnings = jsonValidation.warnings.map((w) => w.message);

  // Шаг 3: Создание команды
  const team: Team = {
    id: `team-${Date.now()}`,
    name: teamName,
    captainId: 'captain-1',
    members: [
      {
        id: 'player-1',
        name: captainName,
        role: 'captain',
      },
    ],
    inventory: { items: [], capacity: 100 },
    variables: {},
    score: 0,
    reputation: 0,
    achievements: [],
  };

  // Шаг 4: Создание сессии
  const session = engine.createSession(scenario, team);

  return {
    session,
    engine,
    validation: {
      valid: jsonValidation.valid,
      errors,
      warnings,
    },
  };
}

/**
 * Запуск сессии с входом в первую сцену.
 */
export function startEngineSession(bridge: EngineBridgeResult): GameSession {
  return bridge.engine.startSession(bridge.session);
}

// ==================== 2. Test Scenario Factory ====================

/**
 * Создание тестового сценария для проверки всех типов миссий.
 */
export function createTestScenario(): Scenario {
  const now = new Date();

  const scenes: Scene[] = [
    {
      id: 'scene-start',
      type: 'location' as SceneType,
      title: 'Стартовая локация',
      description: 'Добро пожаловать в тестовый сценарий!',
      view: {
        type: 'map' as ViewType,
        config: {
          layout: 'vertical',
          interactive: true,
          elements: [
            { id: 'el-1', type: 'text', content: 'Начните игру', position: { x: 0, y: 0 } },
          ],
        },
      },
      missions: [
        {
          id: 'mission-text-exact',
          type: 'text' as MissionType,
          title: 'Текстовый вопрос (exact)',
          description: 'Введите "QuestForge"',
          config: {
            correctAnswer: 'QuestForge',
            matchMode: 'exact',
            maxAttempts: 3,
            points: 10,
            penalty: 0,
          } as TextMissionConfig,
          conditions: [],
          rewards: [
            { type: 'score' as RewardType, target: 'team', value: 10, message: '+10 очков' },
          ],
          hints: [
            { id: 'hint-1', text: 'Подсказка: это название платформы', penalty: 5, order: 1 },
          ],
        },
        {
          id: 'mission-text-ci',
          type: 'text' as MissionType,
          title: 'Текстовый вопрос (case_insensitive)',
          description: 'Введите "hello" (регистр не важен)',
          config: {
            correctAnswer: 'hello',
            matchMode: 'case_insensitive',
            maxAttempts: 3,
            points: 5,
            penalty: 0,
          } as TextMissionConfig,
          conditions: [],
          rewards: [
            { type: 'score' as RewardType, target: 'team', value: 5, message: '+5 очков' },
          ],
          hints: [],
        },
        {
          id: 'mission-text-regex',
          type: 'text' as MissionType,
          title: 'Текстовый вопрос (regex)',
          description: 'Введите email (regex: .+@.+\\..+)',
          config: {
            correctAnswer: '.+@.+\\..+',
            matchMode: 'regex',
            maxAttempts: 3,
            points: 15,
            penalty: 0,
          } as TextMissionConfig,
          conditions: [],
          rewards: [
            { type: 'score' as RewardType, target: 'team', value: 15, message: '+15 очков' },
          ],
          hints: [],
        },
      ],
      transitions: [
        { id: 'trans-1', fromSceneId: 'scene-start', toSceneId: 'scene-code', type: 'manual' as TransitionType, label: 'К code-миссии', condition: { operator: 'AND' as const, conditions: [] } },
      ],
      position: { x: 100, y: 100 },
      metadata: {},
    },
    {
      id: 'scene-code',
      type: 'quiz' as SceneType,
      title: 'Code Mission',
      description: 'Введите правильный код',
      view: {
        type: 'card' as ViewType,
        config: { layout: 'vertical', interactive: true },
      },
      missions: [
        {
          id: 'mission-code',
          type: 'code' as MissionType,
          title: 'Введите код',
          description: 'Код: 1337',
          config: {
            correctCode: '1337',
            maxAttempts: 3,
            points: 20,
            penalty: 0,
          } as CodeMissionConfig,
          conditions: [],
          rewards: [
            { type: 'score' as RewardType, target: 'team', value: 20, message: '+20 очков' },
            { type: 'experience' as RewardType, target: 'team', value: 50, message: '+50 опыта' },
          ],
          hints: [],
        },
      ],
      transitions: [
        { id: 'trans-2', fromSceneId: 'scene-code', toSceneId: 'scene-choice', type: 'manual' as TransitionType, label: 'К choice', condition: { operator: 'AND' as const, conditions: [] } },
      ],
      position: { x: 400, y: 100 },
      metadata: {},
    },
    {
      id: 'scene-choice',
      type: 'quiz' as SceneType,
      title: 'Choice Mission',
      description: 'Выберите правильный ответ',
      view: {
        type: 'card' as ViewType,
        config: { layout: 'vertical', interactive: true },
      },
      missions: [
        {
          id: 'mission-choice',
          type: 'choice' as MissionType,
          title: 'Сколько будет 2+2?',
          description: 'Выберите вариант',
          config: {
            options: ['3', '4', '5', '6'],
            correctIndex: 1,
            shuffle: false,
            points: 10,
            penalty: 0,
          } as ChoiceMissionConfig,
          conditions: [],
          rewards: [
            { type: 'score' as RewardType, target: 'team', value: 10, message: '+10 очков' },
            { type: 'item' as RewardType, target: 'team', value: { id: 'key-1', name: 'Золотой ключ', description: 'Открывает сундук', quantity: 1 }, message: 'Получен ключ' },
          ],
          hints: [],
        },
      ],
      transitions: [
        { id: 'trans-3', fromSceneId: 'scene-choice', toSceneId: 'scene-gps', type: 'manual' as TransitionType, label: 'К GPS', condition: { operator: 'AND' as const, conditions: [] } },
      ],
      position: { x: 700, y: 100 },
      metadata: {},
    },
    {
      id: 'scene-gps',
      type: 'location' as SceneType,
      title: 'GPS Mission',
      description: 'Найдите точку на карте',
      view: {
        type: 'map' as ViewType,
        config: { layout: 'free', interactive: true },
      },
      missions: [
        {
          id: 'mission-gps',
          type: 'gps' as MissionType,
          title: 'Найдите штаб-квартиру',
          description: 'Прибудьте в указанную точку',
          config: {
            lat: 55.7558,
            lng: 37.6173,
            radius: 100,
            points: 30,
            penalty: 0,
          } as GpsMissionConfig,
          conditions: [],
          rewards: [
            { type: 'score' as RewardType, target: 'team', value: 30, message: '+30 очков' },
            { type: 'achievement' as RewardType, target: 'team', value: 'geo-finder', message: 'Достижение: Геоквестник' },
          ],
          hints: [],
        },
      ],
      transitions: [
        { id: 'trans-4', fromSceneId: 'scene-gps', toSceneId: 'scene-qr', type: 'manual' as TransitionType, label: 'К QR', condition: { operator: 'AND' as const, conditions: [] } },
      ],
      position: { x: 1000, y: 100 },
      metadata: {},
    },
    {
      id: 'scene-qr',
      type: 'quiz' as SceneType,
      title: 'QR Mission',
      description: 'Отсканируйте QR-код',
      view: {
        type: 'card' as ViewType,
        config: { layout: 'vertical', interactive: true },
      },
      missions: [
        {
          id: 'mission-qr',
          type: 'qr' as MissionType,
          title: 'QR-код',
          description: 'QR содержит секретный код',
          config: {
            data: 'SECRET-123',
            points: 25,
            penalty: 0,
          } as QrMissionConfig,
          conditions: [],
          rewards: [
            { type: 'score' as RewardType, target: 'team', value: 25, message: '+25 очков' },
          ],
          hints: [],
        },
      ],
      transitions: [
        { id: 'trans-5', fromSceneId: 'scene-qr', toSceneId: 'scene-photo', type: 'manual' as TransitionType, label: 'К photo', condition: { operator: 'AND' as const, conditions: [] } },
      ],
      position: { x: 1300, y: 100 },
      metadata: {},
    },
    {
      id: 'scene-photo',
      type: 'location' as SceneType,
      title: 'Photo Mission',
      description: 'Сделайте фотографию',
      view: {
        type: 'card' as ViewType,
        config: { layout: 'vertical', interactive: true },
      },
      missions: [
        {
          id: 'mission-photo',
          type: 'photo' as MissionType,
          title: 'Фото задания',
          description: 'Сфотографируйте достопримечательность',
          config: {
            requirements: 'Сфотографируйте фонтан',
            validationType: 'manual',
            points: 20,
            penalty: 0,
          } as PhotoMissionConfig,
          conditions: [],
          rewards: [
            { type: 'score' as RewardType, target: 'team', value: 20, message: '+20 очков' },
          ],
          hints: [],
        },
      ],
      transitions: [
        { id: 'trans-6', fromSceneId: 'scene-photo', toSceneId: 'scene-collect', type: 'manual' as TransitionType, label: 'К collect', condition: { operator: 'AND' as const, conditions: [] } },
      ],
      position: { x: 100, y: 400 },
      metadata: {},
    },
    {
      id: 'scene-collect',
      type: 'location' as SceneType,
      title: 'Collect Mission',
      description: 'Соберите предмет',
      view: {
        type: 'list' as ViewType,
        config: { layout: 'vertical', interactive: true },
      },
      missions: [
        {
          id: 'mission-collect',
          type: 'collect' as MissionType,
          title: 'Соберите предмет',
          description: 'Найдите и соберите магический артефакт',
          config: {
            itemId: 'artifact-1',
            itemName: 'Магический артефакт',
            quantity: 1,
          } as CollectMissionConfig,
          conditions: [],
          rewards: [
            { type: 'score' as RewardType, target: 'team', value: 40, message: '+40 очков' },
            { type: 'variable' as RewardType, target: 'team', value: { name: 'artifactCollected', operation: 'set', value: true }, message: 'Артефакт собран' },
          ],
          hints: [],
        },
      ],
      transitions: [
        { id: 'trans-7', fromSceneId: 'scene-collect', toSceneId: 'scene-dialogue', type: 'manual' as TransitionType, label: 'К dialogue', condition: { operator: 'AND' as const, conditions: [] } },
      ],
      position: { x: 400, y: 400 },
      metadata: {},
    },
    {
      id: 'scene-dialogue',
      type: 'dialogue' as SceneType,
      title: 'Dialogue Mission',
      description: 'Поговорите с NPC',
      view: {
        type: 'card' as ViewType,
        config: { layout: 'vertical', interactive: true },
      },
      missions: [
        {
          id: 'mission-dialogue',
          type: 'dialogue' as MissionType,
          title: 'Диалог с NPC',
          description: 'Поговорите с хранителем',
          config: {
            npcName: 'Хранитель',
            npcDescription: 'Мудрый старец',
            dialogues: [
              {
                npcText: 'Привет, путник! Ты справился со всеми испытаниями!',
                options: [
                  { text: 'Спасибо!', targetSceneId: '' },
                  { text: 'Что дальше?', targetSceneId: '' },
                ],
              },
            ],
          } as DialogueMissionConfig,
          conditions: [],
          rewards: [
            { type: 'score' as RewardType, target: 'team', value: 50, message: '+50 очков' },
            { type: 'achievement' as RewardType, target: 'team', value: 'hero', message: 'Достижение: Герой' },
          ],
          hints: [],
        },
      ],
      transitions: [
        { id: 'trans-8', fromSceneId: 'scene-dialogue', toSceneId: 'scene-finish', type: 'manual' as TransitionType, label: 'Финиш', condition: { operator: 'AND' as const, conditions: [] } },
      ],
      position: { x: 700, y: 400 },
      metadata: {},
    },
    {
      id: 'scene-finish',
      type: 'location' as SceneType,
      title: 'Финиш',
      description: 'Поздравляем! Вы прошли тестовый сценарий!',
      view: {
        type: 'card' as ViewType,
        config: { layout: 'vertical', interactive: false },
      },
      missions: [],
      transitions: [],
      position: { x: 1000, y: 400 },
      metadata: {},
    },
  ];

  const variables: VariableDefinition[] = [
    { name: 'artifactCollected', type: 'boolean', defaultValue: false, scope: 'local' },
    { name: 'totalScore', type: 'number', defaultValue: 0, scope: 'local' },
  ];

  return {
    id: 'test-scenario-1',
    name: 'Тестовый сценарий — все типы миссий',
    description: 'Сценарий для проверки всех 8 типов миссий и интеграции',
    version: 1,
    status: 'draft' as ScenarioStatus,
    startSceneId: 'scene-start',
    scenes,
    variables,
    metadata: {
      settings: {
        totalTime: 3600,
        defaultPoints: 10,
        defaultPenalty: 0,
        hintLimit: 3,
        maxAttempts: 3,
        variables: [],
      },
      tags: ['test', 'integration'],
      authorId: 'author-1',
      difficulty: 'easy',
    },
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
  };
}

// ==================== 3. Test Helpers ====================

/**
 * Выполнение миссии и получение результата.
 */
export function executeTestMission(
  engine: ExecutionEngine,
  session: GameSession,
  missionId: string,
  answer: any
): MissionResult {
  return engine.executeMission(session, missionId, answer);
}

/**
 * Получение текущей сцены сессии.
 */
export function getCurrentScene(session: GameSession): Scene | undefined {
  return session.scenario.scenes.find((s) => s.id === session.currentSceneId);
}

/**
 * Получение всех событий аудит-лога сессии.
 */
export function getAuditLog(session: GameSession): AuditLogEntry[] {
  return session.events;
}

/**
 * Фильтрация аудит-лога по типу события.
 */
export function getAuditEventsByType(session: GameSession, type: AuditEventType): AuditLogEntry[] {
  return session.events.filter((e) => e.type === type);
}

/**
 * Проверка, что сессия находится в ожидаемом статусе.
 */
export function assertSessionStatus(session: GameSession, expectedStatus: SessionStatus): boolean {
  return session.status === expectedStatus;
}

/**
 * Получение итогового счёта сессии.
 */
export function getSessionScore(session: GameSession): number {
  return session.score;
}

/**
 * Получение переменной сессии.
 */
export function getSessionVariable(session: GameSession, name: string): any {
  return session.variables[name];
}

/**
 * Проверка наличия предмета в инвентаре команды.
 */
export function hasInventoryItem(session: GameSession, itemId: string): boolean {
  return session.team.inventory.items.some((i) => i.id === itemId);
}

/**
 * Проверка наличия достижения у команды.
 */
export function hasAchievement(session: GameSession, achievementId: string): boolean {
  return session.team.achievements.some((a) => a.id === achievementId);
}

// ==================== 4. Condition Test Helpers ====================

/**
 * Создание простого условия для тестирования ConditionEngine.
 */
export function createCondition(
  type: ConditionType,
  operator: Operator,
  left: string | number | boolean,
  right: string | number | boolean
): SingleCondition {
  return { type, operator, left, right };
}

/**
 * Создание группы условий AND/OR.
 */
export function createConditionGroup(
  operator: 'AND' | 'OR',
  conditions: (SingleCondition | ConditionGroup)[]
): ConditionGroup {
  return { operator, conditions };
}

// ==================== 5. Reward Test Helpers ====================

/**
 * Создание награды для тестирования RewardEngine.
 */
export function createReward(
  type: RewardType,
  value: any,
  target: 'team' | 'player' | 'all' = 'team',
  message?: string
): Reward {
  return { type, target, value, message: message || '' };
}

// ==================== 6. Full Integration Test ====================

/**
 * Полный интеграционный тест: создание сценария → запуск → выполнение миссий → проверка результатов.
 * Возвращает отчёт о прохождении всех тестов.
 */
export interface IntegrationTestReport {
  total: number;
  passed: number;
  failed: number;
  results: IntegrationTestResult[];
  summary: string;
}

export interface IntegrationTestResult {
  name: string;
  passed: boolean;
  expected: any;
  actual: any;
  error?: string;
}

export function runFullIntegrationTest(): IntegrationTestReport {
  const results: IntegrationTestResult[] = [];
  let passed = 0;
  let failed = 0;

  function check(name: string, expected: any, actual: any): void {
    const ok = expected === actual;
    results.push({ name, passed: ok, expected, actual });
    if (ok) passed++; else failed++;
  }

  try {
    // 1. Создание тестового сценария
    const scenario = createTestScenario();
    check('Сценарий создан', true, !!scenario);
    check('Сцен в сценарии', 9, scenario.scenes.length);

    // 2. Интеграция: Scenario → Engine
    const bridge = scenarioToEngine(scenario, 'Test Team', 'Captain');
    check('Мост создан', true, !!bridge.session);
    check('Сессия создана', 'created', bridge.session.status);
    check('Валидация JSON', true, bridge.validation.valid);

    // 3. Запуск сессии
    const session = startEngineSession(bridge);
    check('Сессия запущена', 'running', session.status);
    check('Стартовая сцена', 'scene-start', session.currentSceneId);
    check('Время старта установлено', true, session.startedAt !== null);

    // 4. Text Mission (exact match)
    const r1 = executeTestMission(bridge.engine, session, 'mission-text-exact', 'QuestForge');
    check('Text exact: success', true, r1.success);
    check('Text exact: score', 10, r1.score);

    // 5. Text Mission (case_insensitive)
    const r2 = executeTestMission(bridge.engine, session, 'mission-text-ci', 'HELLO');
    check('Text CI: success', true, r2.success);
    check('Text CI: score', 5, r2.score);

    // 6. Text Mission (regex)
    const r3 = executeTestMission(bridge.engine, session, 'mission-text-regex', 'test@example.com');
    check('Text regex: success', true, r3.success);
    check('Text regex: score', 15, r3.score);

    // 7. Text Mission (wrong answer)
    const rWrong = executeTestMission(bridge.engine, session, 'mission-text-exact', 'wrong');
    check('Text wrong: fail', false, rWrong.success);
    check('Text wrong: hints exist', true, rWrong.hints && rWrong.hints.length > 0);

    // 8. Code Mission
    bridge.engine.transitionToScene(session, 'scene-code');
    const r4 = executeTestMission(bridge.engine, session, 'mission-code', '1337');
    check('Code: success', true, r4.success);
    check('Code: score', 20, r4.score);

    // 9. Choice Mission
    bridge.engine.transitionToScene(session, 'scene-choice');
    const r5 = executeTestMission(bridge.engine, session, 'mission-choice', 1);
    check('Choice: success', true, r5.success);
    check('Choice: score', 10, r5.score);
    check('Choice: item received', true, hasInventoryItem(session, 'key-1'));

    // 10. GPS Mission (Haversine — внутри радиуса)
    bridge.engine.transitionToScene(session, 'scene-gps');
    const r6 = executeTestMission(bridge.engine, session, 'mission-gps', {
      lat: 55.756,
      lng: 37.618,
    });
    check('GPS: success', true, r6.success);
    check('GPS: score', 30, r6.score);
    check('GPS: achievement', true, hasAchievement(session, 'geo-finder'));

    // 11. GPS Mission (вне радиуса)
    const r6Wrong = executeTestMission(bridge.engine, session, 'mission-gps', {
      lat: 60.0,
      lng: 30.0,
    });
    check('GPS wrong: fail', false, r6Wrong.success);

    // 12. QR Mission
    bridge.engine.transitionToScene(session, 'scene-qr');
    const r7 = executeTestMission(bridge.engine, session, 'mission-qr', 'SECRET-123');
    check('QR: success', true, r7.success);
    check('QR: score', 25, r7.score);

    // 13. Photo Mission (always true for MVP)
    bridge.engine.transitionToScene(session, 'scene-photo');
    const r8 = executeTestMission(bridge.engine, session, 'mission-photo', 'photo-data');
    check('Photo: success', true, r8.success);
    check('Photo: score', 20, r8.score);

    // 14. Collect Mission
    bridge.engine.transitionToScene(session, 'scene-collect');
    // Добавляем предмет в инвентарь для проверки collect
    session.team.inventory.items.push({
      id: 'artifact-1',
      name: 'Магический артефакт',
      description: 'Древний артефакт',
      type: 'quest' as ItemType,
      quantity: 1,
      icon: '🔮',
      effects: [],
    });
    const r9 = executeTestMission(bridge.engine, session, 'mission-collect', '');
    check('Collect: success', true, r9.success);
    check('Collect: score', 40, r9.score);
    check('Collect: variable set', true, getSessionVariable(session, 'artifactCollected'));

    // 15. Dialogue Mission (always true for MVP)
    bridge.engine.transitionToScene(session, 'scene-dialogue');
    const r10 = executeTestMission(bridge.engine, session, 'mission-dialogue', '');
    check('Dialogue: success', true, r10.success);
    check('Dialogue: score', 50, r10.score);
    check('Dialogue: achievement', true, hasAchievement(session, 'hero'));

    // 16. Проверка аудит-лога
    const auditLog = getAuditLog(session);
    check('Audit log has entries', true, auditLog.length > 0);

    const missionEvents = getAuditEventsByType(session, 'mission.completed');
    check('Mission completed events', 8, missionEvents.length);

    const answerEvents = getAuditEventsByType(session, 'answer.submitted');
    check('Answer submitted events', 11, answerEvents.length);

    // 17. Проверка итогового счёта
    const totalScore = getSessionScore(session);
    check('Total score > 0', true, totalScore > 0);

    // 18. Session State Machine
    bridge.engine.finishSession(session);
    check('Session finished', 'finished', session.status);

    // 19. Проверка запрещённых переходов
    try {
      bridge.engine.pauseSession(session);
      check('Pause from finished: blocked', false, true);
    } catch {
      check('Pause from finished: blocked', true, true);
    }

    // 20. Проверка ConditionEngine через условия
    const conditionEngine = bridge.engine.getConditionEngine();
    const ctx = {
      session,
      scene: scenario.scenes[0],
      team: session.team,
      variables: session.variables,
      inventory: session.inventory,
      score: session.score,
      timestamp: new Date(),
    };

    const condEq = createCondition('variable', 'eq', 'artifactCollected', true);
    const condResult = conditionEngine.evaluate(condEq as any, ctx as any);
    check('Condition: variable eq true', true, condResult);

    const condGt = createCondition('score', 'gt', 'score', 100);
    const condGtResult = conditionEngine.evaluate(condGt as any, ctx as any);
    check('Condition: score gt 100', true, condGtResult);

    // AND group
    const andGroup = createConditionGroup('AND', [condEq, condGt]);
    const andResult = conditionEngine.evaluate(andGroup as any, ctx as any);
    check('Condition: AND group', true, andResult);

    // OR group
    const orGroup = createConditionGroup('OR', [
      createCondition('variable', 'eq', 'nonexistent', true),
      createCondition('score', 'gte', 'score', 50),
    ]);
    const orResult = conditionEngine.evaluate(orGroup as any, ctx as any);
    check('Condition: OR group', true, orResult);

    // contains operator
    const condContains = createCondition('inventory', 'contains', 'items', 'key-1');
    const containsResult = conditionEngine.evaluate(condContains as any, ctx as any);
    check('Condition: contains item', true, containsResult);

    // ne operator
    const condNe = createCondition('variable', 'ne', 'artifactCollected', false);
    const neResult = conditionEngine.evaluate(condNe as any, ctx as any);
    check('Condition: ne false', true, neResult);

    // lte operator
    const condLte = createCondition('score', 'lte', 'score', 300);
    const lteResult = conditionEngine.evaluate(condLte as any, ctx as any);
    check('Condition: score lte 300', true, lteResult);

  } catch (err: any) {
    results.push({
      name: 'INTEGRATION TEST CRASH',
      passed: false,
      expected: 'no crash',
      actual: err.message,
      error: err.stack,
    });
    failed++;
  }

  const total = results.length;
  const summary = passed === total
    ? `✅ ВСЁ РАБОТАЕТ: ${passed}/${total} тестов пройдено`
    : `⚠️ ${passed}/${total} тестов пройдено, ${failed} провалено`;

  return {
    total,
    passed,
    failed,
    results,
    summary,
  };
}
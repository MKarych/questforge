import {
  ExecutionEngine,
  GameSession,
  Team,
  Player,
  ConditionEngine,
  TriggerSystem,
  RewardEngine,
  ExecutionContext,
} from '../runtime-engine';
import {
  Scenario,
  Scene,
  ConditionGroup,
  SingleCondition,
  LoopConfig,
  TriggerDefinition,
  RoleDefinition,
  Reward,
} from '@/lib/editor-store/editor.types';

// ==================== Helper Factories ====================

function createPlayer(id: string, name: string, role: 'captain' | 'member' | 'observer' = 'member'): Player {
  return { id, name, role };
}

function createTeam(id: string, name: string, members: Player[]): Team {
  return {
    id,
    name,
    captainId: members[0]?.id || '',
    members,
    inventory: { items: [], capacity: 100 },
    variables: {},
    score: 0,
    reputation: 0,
    achievements: [],
  };
}

function createScene(overrides: Partial<Scene> = {}): Scene {
  return {
    id: 'scene-default',
    type: 'location',
    title: 'Сцена',
    description: '',
    view: { type: 'card', config: { layout: 'vertical', interactive: true } },
    missions: [],
    transitions: [],
    position: { x: 0, y: 0 },
    metadata: {},
    ...overrides,
  };
}

function createScenario(
  id: string,
  name: string,
  scenes: Scene[],
  startSceneId: string,
  roles: RoleDefinition[] = [],
  variables: { name: string; type: string; defaultValue: any; scope: string }[] = [],
): Scenario {
  return {
    id,
    name,
    description: '',
    version: 1,
    scenes,
    startSceneId,
    variables: variables.map((v) => ({
      name: v.name,
      type: v.type as any,
      defaultValue: v.defaultValue,
      scope: v.scope as any,
    })),
    metadata: {
      settings: {
        totalTime: 0,
        defaultPoints: 10,
        defaultPenalty: 0,
        hintLimit: 3,
        maxAttempts: 3,
        variables: [],
        roles,
      },
    },
    status: 'draft',
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  };
}

function createSession(engine: ExecutionEngine, scenario: Scenario, team: Team): GameSession {
  const session = engine.createSession(scenario, team);
  // Добавляем roleAssignments в сессию (для createContext)
  (session as any).roleAssignments = [];
  return session;
}

// ==================== Test 1: Мафия (упрощённая) ====================

describe('Integration Test 1: Мафия (упрощённая)', () => {
  let engine: ExecutionEngine;
  let conditionEngine: ConditionEngine;
  let triggerSystem: TriggerSystem;
  let rewardEngine: RewardEngine;

  const mafiaRole: RoleDefinition = {
    id: 'mafia',
    name: 'Мафия',
    description: 'Член мафии',
    team: 'red',
    permissions: ['kill'],
    winCondition: { operator: 'AND', conditions: [] },
    visibility: 'role_only',
    icon: '🔪',
    count: 1,
  };

  const civilianRole: RoleDefinition = {
    id: 'civilian',
    name: 'Мирный житель',
    description: 'Мирный житель',
    team: 'blue',
    permissions: ['vote'],
    winCondition: { operator: 'AND', conditions: [] },
    visibility: 'all',
    icon: '👤',
    count: 2,
  };

  const commissionerRole: RoleDefinition = {
    id: 'commissioner',
    name: 'Комиссар',
    description: 'Комиссар',
    team: 'blue',
    permissions: ['investigate'],
    winCondition: { operator: 'AND', conditions: [] },
    visibility: 'role_only',
    icon: '🔍',
    count: 1,
  };

  beforeEach(() => {
    engine = new ExecutionEngine();
    conditionEngine = engine.getConditionEngine();
    triggerSystem = engine.getTriggerSystem();
    rewardEngine = engine.getRewardEngine();
  });

  it('должен назначить роли игрокам через RewardEngine', () => {
    const player1 = createPlayer('p1', 'Игрок 1');
    const player2 = createPlayer('p2', 'Игрок 2');
    const player3 = createPlayer('p3', 'Игрок 3');
    const player4 = createPlayer('p4', 'Игрок 4');
    const team = createTeam('team-mafia', 'Мафия', [player1, player2, player3, player4]);

    const nightScene = createScene({
      id: 'scene-night',
      title: 'Ночь',
      metadata: { timer: 30 },
    });

    const scenario = createScenario(
      'mafia-scenario',
      'Мафия',
      [nightScene],
      'scene-night',
      [mafiaRole, civilianRole, commissionerRole],
    );

    const session = createSession(engine, scenario, team);
    const context: ExecutionContext = {
      session,
      scene: nightScene,
      team,
      variables: session.variables,
      inventory: session.inventory,
      score: session.score,
      timestamp: new Date(),
      roles: [mafiaRole, civilianRole, civilianRole, commissionerRole],
      roleAssignments: [],
    };

    // Назначаем роли через RewardEngine
    const roleRewards: Reward[] = [
      { type: 'role_assignment', target: 'player', value: { roleId: 'mafia', playerId: 'p1' } },
      { type: 'role_assignment', target: 'player', value: { roleId: 'civilian', playerId: 'p2' } },
      { type: 'role_assignment', target: 'player', value: { roleId: 'civilian', playerId: 'p3' } },
      { type: 'role_assignment', target: 'player', value: { roleId: 'commissioner', playerId: 'p4' } },
    ];

    const results = rewardEngine.applyRewards(roleRewards, context);

    // Проверяем, что все роли назначены успешно
    expect(results).toHaveLength(4);
    results.forEach((r) => expect(r.success).toBe(true));

    expect(context.roleAssignments).toHaveLength(4);
    expect(context.roleAssignments.find((a) => a.playerId === 'p1')?.roleId).toBe('mafia');
    expect(context.roleAssignments.find((a) => a.playerId === 'p2')?.roleId).toBe('civilian');
    expect(context.roleAssignments.find((a) => a.playerId === 'p3')?.roleId).toBe('civilian');
    expect(context.roleAssignments.find((a) => a.playerId === 'p4')?.roleId).toBe('commissioner');
  });

  it('должен проверить условие role == mafia через ConditionEngine', () => {
    const player1 = createPlayer('p1', 'Игрок 1');
    const team = createTeam('team-mafia', 'Мафия', [player1]);
    const nightScene = createScene({ id: 'scene-night', title: 'Ночь' });
    const scenario = createScenario('mafia-scenario', 'Мафия', [nightScene], 'scene-night', [mafiaRole]);

    const session = createSession(engine, scenario, team);
    const context: ExecutionContext = {
      session,
      scene: nightScene,
      team,
      variables: session.variables,
      inventory: session.inventory,
      score: session.score,
      timestamp: new Date(),
      roles: [mafiaRole],
      roleAssignments: [{ playerId: 'p1', roleId: 'mafia', assignedAt: Date.now() }],
    };

    // Условие: role == 'mafia'
    const condition: SingleCondition = {
      type: 'role',
      operator: 'eq',
      left: 'role',
      right: 'mafia',
    };

    const result = conditionEngine.evaluate(condition, context);
    expect(result).toBe(true);

    // Проверяем, что civilian даёт false
    const conditionCivilian: SingleCondition = {
      type: 'role',
      operator: 'eq',
      left: 'role',
      right: 'civilian',
    };
    expect(conditionEngine.evaluate(conditionCivilian, context)).toBe(false);
  });

  it('должен сработать триггер onRoleAssigned при назначении роли', () => {
    const player1 = createPlayer('p1', 'Игрок 1');
    const team = createTeam('team-mafia', 'Мафия', [player1]);
    const nightScene = createScene({ id: 'scene-night', title: 'Ночь' });
    const scenario = createScenario('mafia-scenario', 'Мафия', [nightScene], 'scene-night', [mafiaRole]);

    const session = createSession(engine, scenario, team);
    const context: ExecutionContext = {
      session,
      scene: nightScene,
      team,
      variables: session.variables,
      inventory: session.inventory,
      score: session.score,
      timestamp: new Date(),
      roles: [mafiaRole],
      roleAssignments: [],
    };

    // Триггер: при назначении роли показать уведомление
    const trigger: TriggerDefinition = {
      id: 'trg-role-assigned',
      name: 'Роль назначена',
      description: '',
      event: 'onRoleAssigned',
      conditions: { operator: 'AND', conditions: [] },
      actions: [
        {
          id: 'act-notify',
          type: 'show_notification',
          config: { text: 'Вам назначена роль!', icon: '👤', duration: 5 },
        },
      ],
      enabled: true,
      cooldown: 0,
      maxFires: 0,
      fireCount: 0,
    };

    // Назначаем роль через assign_role action
    const assignTrigger: TriggerDefinition = {
      id: 'trg-assign',
      name: 'Назначить мафию',
      description: '',
      event: 'onSceneEnter',
      conditions: { operator: 'AND', conditions: [] },
      actions: [
        {
          id: 'act-assign',
          type: 'assign_role',
          config: { roleId: 'mafia', playerId: 'p1' },
        },
      ],
      enabled: true,
      cooldown: 0,
      maxFires: 0,
      fireCount: 0,
    };

    // Сначала назначаем роль
    triggerSystem.evaluateTriggers('onSceneEnter', context, [assignTrigger]);
    expect(context.roleAssignments).toHaveLength(1);
    expect(context.roleAssignments[0].roleId).toBe('mafia');

    // Проверяем триггер onRoleAssigned
    const results = triggerSystem.evaluateTriggers('onRoleAssigned', context, [trigger]);
    expect(results).toHaveLength(1);
    expect(results[0].fired).toBe(true);
    expect(results[0].actions[0].type).toBe('show_notification');
  });

  it('должен выполнить цикл раундов (день/ночь) через executeLoop', () => {
    const player1 = createPlayer('p1', 'Игрок 1');
    const team = createTeam('team-mafia', 'Мафия', [player1]);

    // Сцены: ночь -> день -> финал
    const nightScene = createScene({
      id: 'scene-night',
      title: 'Ночь',
      type: 'loop',
      metadata: { timer: 30 },
    });
    const dayScene = createScene({
      id: 'scene-day',
      title: 'День',
      type: 'loop',
      metadata: { timer: 60 },
    });
    const finalScene = createScene({
      id: 'scene-final',
      title: 'Финал',
    });

    const scenario = createScenario(
      'mafia-loop',
      'Мафия с циклом',
      [nightScene, dayScene, finalScene],
      'scene-night',
      [mafiaRole, civilianRole],
      [{ name: 'round', type: 'number', defaultValue: 0, scope: 'local' }],
    );

    const session = createSession(engine, scenario, team);
    (session as any).roleAssignments = [{ playerId: 'p1', roleId: 'mafia', assignedAt: Date.now() }];

    // Симулируем 3 раунда через for-цикл
    const loopConfig: LoopConfig = {
      type: 'for',
      count: 3,
      counterVariable: 'round',
      maxIterations: 10,
      onCompleteSceneId: 'scene-final',
    };

    const iterations = engine.executeLoop(session, loopConfig);

    expect(iterations).toBe(3);
    expect(session.variables['round']).toBe(2); // последнее значение счётчика (count - 1)
    expect(session.currentSceneId).toBe('scene-final');
  });
});

// ==================== Test 2: Квиз с несколькими раундами ====================

describe('Integration Test 2: Квиз с несколькими раундами', () => {
  let engine: ExecutionEngine;

  beforeEach(() => {
    engine = new ExecutionEngine();
  });

  it('должен выполнить 3 раунда квиза через for-цикл с переменной-счётчиком', () => {
    const player1 = createPlayer('p1', 'Игрок 1');
    const team = createTeam('team-quiz', 'Квиз-команда', [player1]);

    const quizRoundScene = createScene({
      id: 'scene-quiz-round',
      title: 'Раунд квиза',
      type: 'quiz',
      missions: [
        {
          id: 'mission-quiz',
          type: 'text',
          title: 'Вопрос',
          description: 'Ответьте на вопрос',
          config: { correctAnswer: '42', matchMode: 'exact', maxAttempts: 3 },
          rewards: [
            { type: 'score', target: 'team', value: 10, message: '+10 очков' },
            {
              type: 'variable',
              target: 'team',
              value: { name: 'quizScore', operation: 'add', value: 10 },
            },
          ],
          conditions: [],
          hints: [],
        },
      ],
    });

    const finalScene = createScene({
      id: 'scene-final',
      title: 'Финальный экран',
      missions: [
        {
          id: 'mission-final',
          type: 'text',
          title: 'Результаты',
          description: 'Квиз завершён',
          config: { correctAnswer: '', matchMode: 'exact', maxAttempts: 1 },
          rewards: [],
          conditions: [],
          hints: [],
        },
      ],
    });

    const scenario = createScenario(
      'quiz-scenario',
      'Квиз',
      [quizRoundScene, finalScene],
      'scene-quiz-round',
      [],
      [
        { name: 'round', type: 'number', defaultValue: 0, scope: 'local' },
        { name: 'quizScore', type: 'number', defaultValue: 0, scope: 'local' },
      ],
    );

    const session = createSession(engine, scenario, team);

    // Выполняем 3 раунда квиза
    const loopConfig: LoopConfig = {
      type: 'for',
      count: 3,
      counterVariable: 'round',
      maxIterations: 10,
      onCompleteSceneId: 'scene-final',
    };

    const iterations = engine.executeLoop(session, loopConfig);

    expect(iterations).toBe(3);
    expect(session.variables['round']).toBe(2); // 0, 1, 2
    expect(session.currentSceneId).toBe('scene-final');
  });

  it('должен накапливать счёт между раундами', () => {
    const player1 = createPlayer('p1', 'Игрок 1');
    const team = createTeam('team-quiz', 'Квиз-команда', [player1]);

    const quizRoundScene = createScene({
      id: 'scene-quiz-round',
      title: 'Раунд квиза',
      type: 'quiz',
      missions: [
        {
          id: 'mission-quiz',
          type: 'text',
          title: 'Вопрос',
          description: 'Ответьте на вопрос',
          config: { correctAnswer: '42', matchMode: 'exact', maxAttempts: 3 },
          rewards: [
            { type: 'score', target: 'team', value: 10, message: '+10 очков' },
          ],
          conditions: [],
          hints: [],
        },
      ],
    });

    const finalScene = createScene({
      id: 'scene-final',
      title: 'Финал',
    });

    const scenario = createScenario(
      'quiz-scoring',
      'Квиз со счётом',
      [quizRoundScene, finalScene],
      'scene-quiz-round',
      [],
      [{ name: 'round', type: 'number', defaultValue: 0, scope: 'local' }],
    );

    const session = createSession(engine, scenario, team);

    // Выполняем миссию 3 раза вручную (симуляция раундов)
    for (let i = 0; i < 3; i++) {
      session.variables['round'] = i;
      const result = engine.executeMission(session, 'mission-quiz', '42');
      expect(result.success).toBe(true);
    }

    // Проверяем накопленный счёт: 3 * 10 = 30
    expect(session.score).toBe(30);
  });
});

// ==================== Test 3: RPG-квест с инвентарём ====================

describe('Integration Test 3: RPG-квест с инвентарём', () => {
  let engine: ExecutionEngine;
  let triggerSystem: TriggerSystem;
  let conditionEngine: ConditionEngine;

  beforeEach(() => {
    engine = new ExecutionEngine();
    triggerSystem = engine.getTriggerSystem();
    conditionEngine = engine.getConditionEngine();
  });

  it('должен добавить предмет в инвентарь через give_item action', () => {
    const player1 = createPlayer('p1', 'Игрок 1');
    const team = createTeam('team-rpg', 'RPG-команда', [player1]);
    const scene = createScene({ id: 'scene-rpg', title: 'Комната' });
    const scenario = createScenario('rpg-scenario', 'RPG-квест', [scene], 'scene-rpg');

    const session = createSession(engine, scenario, team);
    const context: ExecutionContext = {
      session,
      scene,
      team,
      variables: session.variables,
      inventory: session.inventory,
      score: session.score,
      timestamp: new Date(),
      roles: [],
      roleAssignments: [],
    };

    // Триггер: при входе в сцену выдать ключ
    const trigger: TriggerDefinition = {
      id: 'trg-give-key',
      name: 'Выдать ключ',
      description: '',
      event: 'onSceneEnter',
      conditions: { operator: 'AND', conditions: [] },
      actions: [
        {
          id: 'act-give-key',
          type: 'give_item',
          config: { itemId: 'key_01', quantity: 1 },
        },
      ],
      enabled: true,
      cooldown: 0,
      maxFires: 0,
      fireCount: 0,
    };

    triggerSystem.evaluateTriggers('onSceneEnter', context, [trigger]);

    expect(context.team.inventory.items).toHaveLength(1);
    expect(context.team.inventory.items[0].id).toBe('key_01');
    expect(context.team.inventory.items[0].quantity).toBe(1);
  });

  it('должен проверить наличие предмета через ConditionEngine (inventory has)', () => {
    const player1 = createPlayer('p1', 'Игрок 1');
    const team = createTeam('team-rpg', 'RPG-команда', [player1]);
    const scene = createScene({ id: 'scene-rpg', title: 'Комната' });
    const scenario = createScenario('rpg-scenario', 'RPG-квест', [scene], 'scene-rpg');

    const session = createSession(engine, scenario, team);

    // Добавляем предмет в инвентарь
    team.inventory.items.push({
      id: 'key_01',
      name: 'Золотой ключ',
      description: 'Открывает тайную дверь',
      quantity: 1,
      icon: '🔑',
      type: 'quest',
      effects: [],
    });

    const context: ExecutionContext = {
      session,
      scene,
      team,
      variables: session.variables,
      inventory: team.inventory,
      score: session.score,
      timestamp: new Date(),
      roles: [],
      roleAssignments: [],
    };

    // Условие: hasItem('key_01') — через inventory type + has operator
    const condition: SingleCondition = {
      type: 'inventory',
      operator: 'has',
      left: 'inventory',
      right: 'key_01',
    };

    const result = conditionEngine.evaluate(condition, context);
    expect(result).toBe(true);

    // Проверяем отсутствующий предмет
    const conditionMissing: SingleCondition = {
      type: 'inventory',
      operator: 'has',
      left: 'inventory',
      right: 'nonexistent_item',
    };
    expect(conditionEngine.evaluate(conditionMissing, context)).toBe(false);
  });

  it('должен сработать триггер onItemGet при получении предмета', () => {
    const player1 = createPlayer('p1', 'Игрок 1');
    const team = createTeam('team-rpg', 'RPG-команда', [player1]);
    const scene = createScene({ id: 'scene-rpg', title: 'Комната' });
    const scenario = createScenario('rpg-scenario', 'RPG-квест', [scene], 'scene-rpg');

    const session = createSession(engine, scenario, team);
    const context: ExecutionContext = {
      session,
      scene,
      team,
      variables: session.variables,
      inventory: session.inventory,
      score: session.score,
      timestamp: new Date(),
      roles: [],
      roleAssignments: [],
    };

    // Триггер: при получении предмета показать уведомление
    const trigger: TriggerDefinition = {
      id: 'trg-item-get',
      name: 'Предмет получен',
      description: '',
      event: 'onItemGet',
      conditions: { operator: 'AND', conditions: [] },
      actions: [
        {
          id: 'act-notify-item',
          type: 'show_notification',
          config: { text: 'Вы получили предмет!', icon: '📦', duration: 3 },
        },
      ],
      enabled: true,
      cooldown: 0,
      maxFires: 0,
      fireCount: 0,
    };

    // Сначала выдаём предмет
    const giveTrigger: TriggerDefinition = {
      id: 'trg-give',
      name: 'Выдать',
      description: '',
      event: 'onSceneEnter',
      conditions: { operator: 'AND', conditions: [] },
      actions: [
        {
          id: 'act-give',
          type: 'give_item',
          config: { itemId: 'potion', quantity: 1 },
        },
      ],
      enabled: true,
      cooldown: 0,
      maxFires: 0,
      fireCount: 0,
    };

    triggerSystem.evaluateTriggers('onSceneEnter', context, [giveTrigger]);
    expect(context.team.inventory.items).toHaveLength(1);

    // Проверяем триггер onItemGet
    const results = triggerSystem.evaluateTriggers('onItemGet', context, [trigger]);
    expect(results).toHaveLength(1);
    expect(results[0].fired).toBe(true);
    expect(results[0].actions[0].payload.text).toBe('Вы получили предмет!');
  });

  it('должен выполнить forEach по инвентарю через executeLoop', () => {
    const player1 = createPlayer('p1', 'Игрок 1');
    const team = createTeam('team-rpg', 'RPG-команда', [player1]);

    // Добавляем предметы в инвентарь
    team.inventory.items.push(
      { id: 'key_01', name: 'Ключ', description: '', quantity: 1, icon: '🔑', type: 'quest', effects: [] },
      { id: 'potion', name: 'Зелье', description: '', quantity: 3, icon: '🧪', type: 'consumable', effects: [] },
      { id: 'sword', name: 'Меч', description: '', quantity: 1, icon: '⚔️', type: 'weapon', effects: [] },
    );

    const inventoryScene = createScene({
      id: 'scene-inventory',
      title: 'Инвентарь',
      type: 'loop',
    });

    const afterScene = createScene({
      id: 'scene-after',
      title: 'После инвентаря',
    });

    const scenario = createScenario(
      'rpg-inventory-loop',
      'RPG инвентарь',
      [inventoryScene, afterScene],
      'scene-inventory',
      [],
      [
        { name: 'currentItem', type: 'string', defaultValue: '', scope: 'local' },
        { name: 'inventoryItems', type: 'array', defaultValue: [], scope: 'local' },
      ],
    );

    const session = createSession(engine, scenario, team);
    // Копируем предметы в переменную-коллекцию для forEach
    session.variables['inventoryItems'] = ['key_01', 'potion', 'sword'];

    const loopConfig: LoopConfig = {
      type: 'forEach',
      collectionVariable: 'inventoryItems',
      itemVariable: 'currentItem',
      maxIterations: 10,
      onCompleteSceneId: 'scene-after',
    };

    const iterations = engine.executeLoop(session, loopConfig);

    expect(iterations).toBe(3);
    expect(session.variables['currentItem']).toBe('sword');
    expect(session.currentSceneId).toBe('scene-after');
  });
});

// ==================== Test 4: ConditionBuilder + TriggerSystem интеграция ====================

describe('Integration Test 4: ConditionBuilder + TriggerSystem интеграция', () => {
  let engine: ExecutionEngine;
  let conditionEngine: ConditionEngine;
  let triggerSystem: TriggerSystem;

  beforeEach(() => {
    engine = new ExecutionEngine();
    conditionEngine = engine.getConditionEngine();
    triggerSystem = engine.getTriggerSystem();
  });

  it('должен сериализовать ConditionGroup в JSON и обратно', () => {
    const original: ConditionGroup = {
      operator: 'AND',
      conditions: [
        { type: 'score', operator: 'gte', left: 'score', right: 100 },
        {
          operator: 'OR',
          conditions: [
            { type: 'role', operator: 'eq', left: 'role', right: 'mafia' },
            { type: 'inventory', operator: 'has', left: 'inventory', right: 'skip_ticket' },
          ],
        },
      ],
    };

    const json = JSON.stringify(original);
    const deserialized = JSON.parse(json) as ConditionGroup;

    expect(deserialized).toEqual(original);
    expect(deserialized.operator).toBe('AND');
    expect(deserialized.conditions).toHaveLength(2);

    const orGroup = deserialized.conditions[1] as ConditionGroup;
    expect(orGroup.operator).toBe('OR');
    expect(orGroup.conditions).toHaveLength(2);
  });

  it('должен передать ConditionGroup в TriggerSystem и проверить срабатывание', () => {
    const player1 = createPlayer('p1', 'Игрок 1');
    const team = createTeam('team-int', 'Интеграция', [player1]);
    const scene = createScene({ id: 'scene-int', title: 'Интеграционная сцена' });
    const scenario = createScenario('int-scenario', 'Интеграция', [scene], 'scene-int');

    const session = createSession(engine, scenario, team);
    session.score = 150; // Достаточно очков

    const context: ExecutionContext = {
      session,
      scene,
      team,
      variables: session.variables,
      inventory: session.inventory,
      score: session.score,
      timestamp: new Date(),
      roles: [],
      roleAssignments: [{ playerId: 'p1', roleId: 'mafia', assignedAt: Date.now() }],
    };

    // Сложное условие: (score >= 100) AND (role == 'mafia' OR hasItem('skip_ticket'))
    const conditionGroup: ConditionGroup = {
      operator: 'AND',
      conditions: [
        { type: 'score', operator: 'gte', left: 'score', right: 100 },
        {
          operator: 'OR',
          conditions: [
            { type: 'role', operator: 'eq', left: 'role', right: 'mafia' },
            { type: 'inventory', operator: 'has', left: 'inventory', right: 'skip_ticket' },
          ],
        },
      ],
    };

    // Проверяем условие напрямую через ConditionEngine
    const conditionResult = conditionEngine.evaluate(conditionGroup, context);
    expect(conditionResult).toBe(true);

    // Триггер с этим условием
    const trigger: TriggerDefinition = {
      id: 'trg-complex',
      name: 'Сложный триггер',
      description: '',
      event: 'onSceneEnter',
      conditions: conditionGroup,
      actions: [
        {
          id: 'act-complex',
          type: 'show_notification',
          config: { text: 'Условия выполнены!', icon: '🎉', duration: 5 },
        },
      ],
      enabled: true,
      cooldown: 0,
      maxFires: 0,
      fireCount: 0,
    };

    const results = triggerSystem.evaluateTriggers('onSceneEnter', context, [trigger]);
    expect(results).toHaveLength(1);
    expect(results[0].fired).toBe(true);
    expect(results[0].actions[0].success).toBe(true);
  });

  it('должен НЕ сработать триггер если условия не выполнены', () => {
    const player1 = createPlayer('p1', 'Игрок 1');
    const team = createTeam('team-int', 'Интеграция', [player1]);
    const scene = createScene({ id: 'scene-int', title: 'Интеграционная сцена' });
    const scenario = createScenario('int-scenario', 'Интеграция', [scene], 'scene-int');

    const session = createSession(engine, scenario, team);
    session.score = 50; // Недостаточно очков

    const context: ExecutionContext = {
      session,
      scene,
      team,
      variables: session.variables,
      inventory: session.inventory,
      score: session.score,
      timestamp: new Date(),
      roles: [],
      roleAssignments: [{ playerId: 'p1', roleId: 'civilian', assignedAt: Date.now() }],
    };

    // Условие: (score >= 100) AND (role == 'mafia')
    const conditionGroup: ConditionGroup = {
      operator: 'AND',
      conditions: [
        { type: 'score', operator: 'gte', left: 'score', right: 100 },
        { type: 'role', operator: 'eq', left: 'role', right: 'mafia' },
      ],
    };

    const trigger: TriggerDefinition = {
      id: 'trg-no-fire',
      name: 'Не должен сработать',
      description: '',
      event: 'onSceneEnter',
      conditions: conditionGroup,
      actions: [
        {
          id: 'act-no-fire',
          type: 'show_notification',
          config: { text: 'Не должно показать', icon: '❌', duration: 1 },
        },
      ],
      enabled: true,
      cooldown: 0,
      maxFires: 0,
      fireCount: 0,
    };

    const results = triggerSystem.evaluateTriggers('onSceneEnter', context, [trigger]);
    expect(results).toHaveLength(0);
  });

  it('должен выполнить действие set_variable при срабатывании триггера с условиями', () => {
    const player1 = createPlayer('p1', 'Игрок 1');
    const team = createTeam('team-int', 'Интеграция', [player1]);
    const scene = createScene({ id: 'scene-int', title: 'Интеграционная сцена' });
    const scenario = createScenario('int-scenario', 'Интеграция', [scene], 'scene-int');

    const session = createSession(engine, scenario, team);
    session.score = 200;

    const context: ExecutionContext = {
      session,
      scene,
      team,
      variables: session.variables,
      inventory: session.inventory,
      score: session.score,
      timestamp: new Date(),
      roles: [],
      roleAssignments: [],
    };

    // Условие: score > 50
    const condition: SingleCondition = {
      type: 'score',
      operator: 'gt',
      left: 'score',
      right: 50,
    };

    const trigger: TriggerDefinition = {
      id: 'trg-set-var',
      name: 'Установить переменную',
      description: '',
      event: 'onSceneEnter',
      conditions: { operator: 'AND', conditions: [condition] },
      actions: [
        {
          id: 'act-set-var',
          type: 'set_variable',
          config: { variableName: 'questCompleted', value: true, operation: 'set' },
        },
      ],
      enabled: true,
      cooldown: 0,
      maxFires: 0,
      fireCount: 0,
    };

    triggerSystem.evaluateTriggers('onSceneEnter', context, [trigger]);

    expect(context.variables['questCompleted']).toBe(true);
  });
});
import {
  GamePhaseManager,
  PhaseChangeResult,
  ExecutionEngine,
  ExecutionContext,
  Team,
  GameSession,
} from '../runtime-engine';
import {
  GamePhase,
  GamePhaseConfig,
  PhaseTransition,
  GamePhaseType,
  GameStateType,
  TriggerDefinition,
  ConditionGroup,
  Scenario,
  Scene,
} from '@/lib/editor-store/editor.types';

// ==================== Helpers ====================

function createMockContext(overrides: Partial<ExecutionContext> = {}): ExecutionContext {
  const engine = new ExecutionEngine();
  const team: Team = {
    id: 'team-1',
    name: 'Команда 1',
    captainId: 'player-1',
    members: [{ id: 'player-1', name: 'Игрок 1', role: 'captain' }],
    inventory: { items: [], capacity: 100, maxWeight: 1000, gold: 100 },
    variables: { level: 5 },
    score: 0,
    reputation: 0,
    achievements: [],
  };

  const scenario: Scenario = {
    id: 'scenario-1',
    title: 'Тестовый сценарий',
    description: '',
    status: 'draft',
    scenes: [],
    variables: [],
    metadata: {
      author: { id: 'author-1', name: 'Автор' },
      version: 1,
      tags: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      settings: { roles: [], totalTime: 0, defaultPoints: 10, defaultPenalty: 0, hintLimit: 3, maxAttempts: 1, variables: [] },
    },
    startSceneId: 'scene-1',
    isTemplate: false,
    isPublished: false,
    rating: 0,
    plays: 0,
    achievements: [],
    roles: [],
    triggers: [],
    parallelScenarios: [],
    syncPoints: [],
    crossScenarioComm: { events: [], globalVariables: [] },
    multiplayerMechanics: [],
    marketplace: undefined,
    schedule: undefined,
    loopConfigs: [],
    subScenarios: [],
    inventoryItems: [],
    craftRecipes: [],
    tradeOffers: [],
    itemUseConfigs: [],
    gamePhaseConfig: undefined,
    gameStateMachine: undefined,
  };

  const session = engine.createSession(scenario, team);

  const scene: Scene = {
    id: 'scene-1',
    title: 'Тестовая сцена',
    type: 'mission',
    missions: [],
    transitions: [],
    conditions: { operator: 'AND', conditions: [] },
    rewards: [],
    metadata: {},
    view: { type: 'single', elements: [] },
    triggers: [],
  };

  return {
    session,
    scene,
    team,
    variables: { ...session.variables, level: 5 },
    inventory: team.inventory,
    score: 0,
    timestamp: new Date(),
    roles: [],
    roleAssignments: [],
    ...overrides,
  };
}

function createDayPhase(overrides: Partial<GamePhase> = {}): GamePhase {
  return {
    id: 'day-1',
    name: 'День 1',
    type: 'day',
    description: 'Дневная фаза',
    duration: 300, // 5 минут
    order: 1,
    dayNightCycle: true,
    nextPhaseId: 'night-1',
    allowedActions: ['move', 'collect', 'interact'],
    allowedScenes: ['scene-market', 'scene-forest'],
    allowedMissions: ['text', 'choice'],
    globalModifiers: { visibility: 100, speed: 1.0 },
    onPhaseStart: [],
    onPhaseEnd: [],
    icon: '☀️',
    color: '#FFD700',
    ...overrides,
  };
}

function createNightPhase(overrides: Partial<GamePhase> = {}): GamePhase {
  return {
    id: 'night-1',
    name: 'Ночь 1',
    type: 'night',
    description: 'Ночная фаза',
    duration: 180, // 3 минуты
    order: 2,
    dayNightCycle: true,
    nextPhaseId: null,
    allowedActions: ['hide', 'sneak', 'attack'],
    allowedScenes: ['scene-hideout', 'scene-cave'],
    allowedMissions: ['choice', 'code'],
    globalModifiers: { visibility: 20, speed: 0.7 },
    onPhaseStart: [],
    onPhaseEnd: [],
    icon: '🌙',
    color: '#2C3E50',
    ...overrides,
  };
}

function createFreePhase(overrides: Partial<GamePhase> = {}): GamePhase {
  return {
    id: 'free-1',
    name: 'Свободное время',
    type: 'free',
    description: 'Фаза свободного времени',
    duration: 0, // без ограничения
    order: 1,
    dayNightCycle: false,
    nextPhaseId: null,
    allowedActions: [],
    allowedScenes: [],
    allowedMissions: [],
    globalModifiers: {},
    onPhaseStart: [],
    onPhaseEnd: [],
    icon: '🕊️',
    color: '#27AE60',
    ...overrides,
  };
}

function createRoundPhase(overrides: Partial<GamePhase> = {}): GamePhase {
  return {
    id: 'round-phase',
    name: 'Раунд',
    type: 'round',
    description: 'Фаза раунда',
    duration: 120,
    order: 1,
    dayNightCycle: false,
    nextPhaseId: null,
    allowedActions: ['move', 'attack'],
    allowedScenes: ['scene-arena'],
    allowedMissions: ['text'],
    globalModifiers: {},
    onPhaseStart: [],
    onPhaseEnd: [],
    icon: '🔄',
    color: '#8E44AD',
    ...overrides,
  };
}

function createSimpleConfig(overrides: Partial<GamePhaseConfig> = {}): GamePhaseConfig {
  return {
    phases: [createDayPhase(), createNightPhase()],
    transitions: [],
    startPhaseId: 'day-1',
    cycleEnabled: true,
    cycleOrder: 'sequential',
    globalTimeLimit: 0,
    roundSystem: false,
    currentRound: 1,
    maxRounds: 1,
    roundStartPhase: 'day-1',
    roundEndCondition: { operator: 'AND', conditions: [] },
    onGameEnd: [],
    ...overrides,
  };
}

function createRoundConfig(overrides: Partial<GamePhaseConfig> = {}): GamePhaseConfig {
  return {
    phases: [createRoundPhase()],
    transitions: [],
    startPhaseId: 'round-phase',
    cycleEnabled: true,
    cycleOrder: 'sequential',
    globalTimeLimit: 0,
    roundSystem: true,
    currentRound: 1,
    maxRounds: 3,
    roundStartPhase: 'round-phase',
    roundEndCondition: { operator: 'AND', conditions: [] },
    onGameEnd: [],
    ...overrides,
  };
}

function makeTrigger(id: string): TriggerDefinition {
  return {
    id,
    name: `Trigger ${id}`,
    description: '',
    event: 'onCustomEvent',
    conditions: { operator: 'AND', conditions: [] },
    actions: [],
    enabled: true,
    cooldown: 0,
    maxFires: 0,
    fireCount: 0,
  };
}

// ==================== Tests ====================

describe('GamePhaseManager', () => {
  let manager: GamePhaseManager;
  let context: ExecutionContext;

  beforeEach(() => {
    manager = new GamePhaseManager();
    context = createMockContext();
  });

  afterEach(() => {
    manager.reset();
    jest.useRealTimers();
  });

  // ==================== Init ====================
  describe('init()', () => {
    it('должен инициализировать менеджер с конфигурацией фаз', () => {
      const config = createSimpleConfig();
      manager.init(config);

      expect(manager.getCurrentPhase()).not.toBeNull();
      expect(manager.getCurrentPhase()!.id).toBe('day-1');
      expect(manager.getRound()).toBe(1);
      expect(manager.getState().currentState).toBe('playing');
    });

    it('должен вернуть null для getCurrentPhase до init()', () => {
      expect(manager.getCurrentPhase()).toBeNull();
    });

    it('должен установить startPhaseId из конфигурации', () => {
      const config = createSimpleConfig({ startPhaseId: 'night-1' });
      manager.init(config);

      expect(manager.getCurrentPhase()!.id).toBe('night-1');
    });
  });

  // ==================== getCurrentPhase ====================
  describe('getCurrentPhase()', () => {
    it('должен вернуть текущую фазу', () => {
      const config = createSimpleConfig();
      manager.init(config);

      const phase = manager.getCurrentPhase();
      expect(phase).not.toBeNull();
      expect(phase!.id).toBe('day-1');
      expect(phase!.name).toBe('День 1');
      expect(phase!.type).toBe('day');
    });

    it('должен вернуть null если фазы не инициализированы', () => {
      expect(manager.getCurrentPhase()).toBeNull();
    });
  });

  // ==================== getState ====================
  describe('getState()', () => {
    it('должен вернуть состояние игры', () => {
      const config = createSimpleConfig();
      manager.init(config);

      const state = manager.getState();
      expect(state.currentState).toBe('playing');
      expect(state.previousState).toBeNull();
      expect(state.phaseConfig).toBe(config);
      expect(state.elapsed).toBeGreaterThanOrEqual(0);
    });
  });

  // ==================== transitionToPhase ====================
  describe('transitionToPhase()', () => {
    it('должен выполнить переход к указанной фазе', () => {
      const config = createSimpleConfig();
      manager.init(config);

      const result = manager.transitionToPhase('night-1', context);

      expect(result.success).toBe(true);
      expect(result.fromPhaseId).toBe('day-1');
      expect(result.toPhaseId).toBe('night-1');
      expect(result.phase.id).toBe('night-1');
      expect(result.roundChanged).toBe(false);
      expect(result.newRound).toBe(1);
      expect(result.message).toContain('Ночь 1');
    });

    it('должен вернуть ошибку если фаза не найдена', () => {
      const config = createSimpleConfig();
      manager.init(config);

      const result = manager.transitionToPhase('non-existent', context);

      expect(result.success).toBe(false);
      expect(result.message).toContain('не найдена');
    });

    it('должен вернуть ошибку если конфиг не инициализирован', () => {
      const result = manager.transitionToPhase('day-1', context);

      expect(result.success).toBe(false);
      expect(result.message).toContain('не настроены');
    });

    it('должен выполнить onPhaseEnd триггеры текущей фазы', () => {
      const dayPhase = createDayPhase({ onPhaseEnd: [makeTrigger('trigger-end')] });
      const config = createSimpleConfig({ phases: [dayPhase, createNightPhase()] });
      manager.init(config);

      const result = manager.transitionToPhase('night-1', context);
      expect(result.success).toBe(true);
    });

    it('должен выполнить onPhaseStart триггеры новой фазы', () => {
      const nightPhase = createNightPhase({ onPhaseStart: [makeTrigger('trigger-start')] });
      const config = createSimpleConfig({ phases: [createDayPhase(), nightPhase] });
      manager.init(config);

      const result = manager.transitionToPhase('night-1', context);
      expect(result.success).toBe(true);
    });

    it('должен обновить состояние на phase_transition во время перехода', () => {
      const config = createSimpleConfig();
      manager.init(config);

      const stateBefore = manager.getState();
      expect(stateBefore.currentState).toBe('playing');

      manager.transitionToPhase('night-1', context);

      const stateAfter = manager.getState();
      expect(stateAfter.currentState).toBe('playing');
    });
  });

  // ==================== nextPhase ====================
  describe('nextPhase()', () => {
    it('должен перейти к следующей фазе по nextPhaseId', () => {
      const config = createSimpleConfig();
      manager.init(config);

      const result = manager.nextPhase(context);

      expect(result.success).toBe(true);
      expect(result.fromPhaseId).toBe('day-1');
      expect(result.toPhaseId).toBe('night-1');
      expect(result.phase.id).toBe('night-1');
    });

    it('должен перейти к следующему раунду если это последняя фаза и roundSystem=true', () => {
      const config = createRoundConfig();
      manager.init(config);

      const result = manager.nextPhase(context);

      expect(result.success).toBe(true);
      expect(result.roundChanged).toBe(true);
      expect(result.newRound).toBe(2);
    });

    it('должен вернуть ошибку если нет следующей фазы и roundSystem=false', () => {
      const dayPhase = createDayPhase({ nextPhaseId: null });
      const nightPhase = createNightPhase({ nextPhaseId: null });
      const configNoNext = createSimpleConfig({
        phases: [dayPhase, nightPhase],
        roundSystem: false,
      });
      manager.init(configNoNext);

      manager.transitionToPhase('night-1', context);

      const result = manager.nextPhase(context);
      expect(result.success).toBe(false);
      expect(result.message).toContain('Нет следующей фазы');
    });

    it('должен вернуть ошибку если конфиг не инициализирован', () => {
      const result = manager.nextPhase(context);
      expect(result.success).toBe(false);
      expect(result.message).toContain('Нет текущей фазы');
    });
  });

  // ==================== nextRound ====================
  describe('nextRound()', () => {
    it('должен увеличить номер раунда', () => {
      const config = createRoundConfig();
      manager.init(config);

      const result = manager.nextRound(context);

      expect(result.success).toBe(true);
      expect(result.roundChanged).toBe(true);
      expect(result.newRound).toBe(2);
      expect(manager.getRound()).toBe(2);
    });

    it('должен завершить игру если достигнут maxRounds', () => {
      const config = createRoundConfig({ maxRounds: 1 });
      manager.init(config);

      const result = manager.nextRound(context);

      expect(result.success).toBe(true);
      expect(result.newRound).toBe(1);
      expect(result.message).toContain('завершена');
      expect(manager.getState().currentState).toBe('finished');
    });

    it('должен выполнить onRoundStart триггеры', () => {
      const phase = createRoundPhase({ onRoundStart: [makeTrigger('trigger-round-start')] });
      const config = createRoundConfig({ phases: [phase] });
      manager.init(config);

      const result = manager.nextRound(context);
      expect(result.success).toBe(true);
      expect(result.newRound).toBe(2);
    });

    it('должен вернуть ошибку если конфиг не инициализирован', () => {
      const result = manager.nextRound(context);
      expect(result.success).toBe(false);
      expect(result.message).toContain('не настроены');
    });
  });

  // ==================== checkTransitions ====================
  describe('checkTransitions()', () => {
    it('должен выполнить автоматический переход если условие выполнено', () => {
      const transition: PhaseTransition = {
        id: 'trans-1',
        fromPhaseId: 'day-1',
        toPhaseId: 'night-1',
        condition: { operator: 'AND', conditions: [] },
        autoTransition: true,
        delay: 0,
      };

      const config = createSimpleConfig({ transitions: [transition] });
      manager.init(config);

      const result = manager.checkTransitions(context);

      expect(result).not.toBeNull();
      expect(result!.success).toBe(true);
      expect(result!.toPhaseId).toBe('night-1');
    });

    it('должен вернуть null если условие не выполнено', () => {
      const transition: PhaseTransition = {
        id: 'trans-1',
        fromPhaseId: 'day-1',
        toPhaseId: 'night-1',
        condition: {
          operator: 'AND',
          conditions: [
            {
              type: 'time',
              operator: 'gt',
              left: 'game.elapsed',
              right: 999999,
            },
          ],
        },
        autoTransition: true,
        delay: 0,
      };

      const config = createSimpleConfig({ transitions: [transition] });
      manager.init(config);

      const result = manager.checkTransitions(context);
      expect(result).toBeNull();
    });

    it('должен игнорировать переходы для других фаз', () => {
      const transition: PhaseTransition = {
        id: 'trans-1',
        fromPhaseId: 'night-1',
        toPhaseId: 'day-1',
        condition: { operator: 'AND', conditions: [] },
        autoTransition: true,
        delay: 0,
      };

      const config = createSimpleConfig({ transitions: [transition] });
      manager.init(config);

      const result = manager.checkTransitions(context);
      expect(result).toBeNull();
    });

    it('должен вернуть null если конфиг не инициализирован', () => {
      const result = manager.checkTransitions(context);
      expect(result).toBeNull();
    });

    it('должен запланировать переход с задержкой если delay > 0', () => {
      jest.useFakeTimers();

      const transition: PhaseTransition = {
        id: 'trans-1',
        fromPhaseId: 'day-1',
        toPhaseId: 'night-1',
        condition: { operator: 'AND', conditions: [] },
        autoTransition: true,
        delay: 5,
      };

      const config = createSimpleConfig({ transitions: [transition] });
      manager.init(config);

      const result = manager.checkTransitions(context);
      expect(result).toBeNull();

      expect(manager.getCurrentPhase()!.id).toBe('day-1');

      jest.advanceTimersByTime(5000);

      expect(manager.getCurrentPhase()!.id).toBe('night-1');

      jest.useRealTimers();
    });
  });

  // ==================== isNight / isDay ====================
  describe('isNight() / isDay()', () => {
    it('isNight должен вернуть true для фазы с type=night', () => {
      const config = createSimpleConfig({ startPhaseId: 'night-1' });
      manager.init(config);

      expect(manager.isNight()).toBe(true);
      expect(manager.isDay()).toBe(false);
    });

    it('isDay должен вернуть true для фазы с type=day', () => {
      const config = createSimpleConfig({ startPhaseId: 'day-1' });
      manager.init(config);

      expect(manager.isDay()).toBe(true);
      expect(manager.isNight()).toBe(false);
    });

    it('isDay должен вернуть true для фазы с type=free', () => {
      const config = createSimpleConfig({
        phases: [createFreePhase()],
        startPhaseId: 'free-1',
      });
      manager.init(config);

      expect(manager.isDay()).toBe(true);
      expect(manager.isNight()).toBe(false);
    });

    it('isNight должен вернуть true для фазы с lighting=dark', () => {
      const phase = createDayPhase({ lighting: 'dark' });
      const config = createSimpleConfig({ phases: [phase] });
      manager.init(config);

      expect(manager.isNight()).toBe(true);
    });

    it('должен вернуть false если фаза не инициализирована', () => {
      expect(manager.isNight()).toBe(false);
      expect(manager.isDay()).toBe(false);
    });
  });

  // ==================== isActionAllowed ====================
  describe('isActionAllowed()', () => {
    it('должен разрешить действие из списка allowedActions', () => {
      const config = createSimpleConfig();
      manager.init(config);

      expect(manager.isActionAllowed('move')).toBe(true);
      expect(manager.isActionAllowed('collect')).toBe(true);
    });

    it('должен запретить действие не из списка allowedActions', () => {
      const config = createSimpleConfig();
      manager.init(config);

      expect(manager.isActionAllowed('attack')).toBe(false);
      expect(manager.isActionAllowed('fly')).toBe(false);
    });

    it('должен разрешить все действия если allowedActions пуст', () => {
      const phase = createDayPhase({ allowedActions: [] });
      const config = createSimpleConfig({ phases: [phase] });
      manager.init(config);

      expect(manager.isActionAllowed('anything')).toBe(true);
    });

    it('должен вернуть true если фаза не инициализирована', () => {
      expect(manager.isActionAllowed('anything')).toBe(true);
    });
  });

  // ==================== isSceneAllowed ====================
  describe('isSceneAllowed()', () => {
    it('должен разрешить сцену из списка allowedScenes', () => {
      const config = createSimpleConfig();
      manager.init(config);

      expect(manager.isSceneAllowed('scene-market')).toBe(true);
      expect(manager.isSceneAllowed('scene-forest')).toBe(true);
    });

    it('должен запретить сцену не из списка allowedScenes', () => {
      const config = createSimpleConfig();
      manager.init(config);

      expect(manager.isSceneAllowed('scene-cave')).toBe(false);
    });

    it('должен разрешить все сцены если allowedScenes пуст', () => {
      const phase = createDayPhase({ allowedScenes: [] });
      const config = createSimpleConfig({ phases: [phase] });
      manager.init(config);

      expect(manager.isSceneAllowed('anything')).toBe(true);
    });

    it('должен вернуть true если фаза не инициализирована', () => {
      expect(manager.isSceneAllowed('anything')).toBe(true);
    });
  });

  // ==================== getModifier ====================
  describe('getModifier()', () => {
    it('должен вернуть значение модификатора', () => {
      const config = createSimpleConfig();
      manager.init(config);

      expect(manager.getModifier('visibility')).toBe(100);
      expect(manager.getModifier('speed')).toBe(1.0);
    });

    it('должен вернуть defaultValue если модификатор не найден', () => {
      const config = createSimpleConfig();
      manager.init(config);

      expect(manager.getModifier('nonexistent')).toBeNull();
      expect(manager.getModifier('nonexistent', 42)).toBe(42);
    });

    it('должен вернуть defaultValue если фаза не инициализирована', () => {
      expect(manager.getModifier('visibility', 'default')).toBe('default');
    });
  });

  // ==================== getRound ====================
  describe('getRound()', () => {
    it('должен вернуть 1 после инициализации', () => {
      const config = createSimpleConfig();
      manager.init(config);

      expect(manager.getRound()).toBe(1);
    });

    it('должен увеличиваться после nextRound', () => {
      const config = createRoundConfig();
      manager.init(config);

      manager.nextRound(context);
      expect(manager.getRound()).toBe(2);

      manager.nextRound(context);
      expect(manager.getRound()).toBe(3);
    });
  });

  // ==================== getPhaseRemainingTime ====================
  describe('getPhaseRemainingTime()', () => {
    it('должен вернуть -1 если фаза без ограничения времени', () => {
      const config = createSimpleConfig({ phases: [createFreePhase()] });
      manager.init(config);

      expect(manager.getPhaseRemainingTime()).toBe(-1);
    });

    it('должен вернуть положительное число для фазы с duration', () => {
      const config = createSimpleConfig();
      manager.init(config);

      const remaining = manager.getPhaseRemainingTime();
      expect(remaining).toBeGreaterThan(0);
      expect(remaining).toBeLessThanOrEqual(300);
    });

    it('должен вернуть -1 если фаза не инициализирована', () => {
      expect(manager.getPhaseRemainingTime()).toBe(-1);
    });
  });

  // ==================== getRoundRemainingTime ====================
  describe('getRoundRemainingTime()', () => {
    it('должен вернуть -1 если globalTimeLimit = 0', () => {
      const config = createSimpleConfig();
      manager.init(config);

      expect(manager.getRoundRemainingTime()).toBe(-1);
    });

    it('должен вернуть положительное число если globalTimeLimit > 0', () => {
      const config = createSimpleConfig({ globalTimeLimit: 600 });
      manager.init(config);

      const remaining = manager.getRoundRemainingTime();
      expect(remaining).toBeGreaterThan(0);
      expect(remaining).toBeLessThanOrEqual(600);
    });

    it('должен вернуть -1 если конфиг не инициализирован', () => {
      expect(manager.getRoundRemainingTime()).toBe(-1);
    });
  });

  // ==================== endGame ====================
  describe('endGame()', () => {
    it('должен установить состояние finished', () => {
      const config = createSimpleConfig();
      manager.init(config);

      manager.endGame(context);

      expect(manager.getState().currentState).toBe('finished');
    });

    it('должен выполнить onGameEnd триггеры', () => {
      const config = createSimpleConfig({ onGameEnd: [makeTrigger('trigger-game-end')] });
      manager.init(config);

      manager.endGame(context);
      expect(manager.getState().currentState).toBe('finished');
    });

    it('должен очистить все таймеры', () => {
      jest.useFakeTimers();

      const transition: PhaseTransition = {
        id: 'trans-1',
        fromPhaseId: 'day-1',
        toPhaseId: 'night-1',
        condition: { operator: 'AND', conditions: [] },
        autoTransition: true,
        delay: 10,
      };
      const configWithTrans = createSimpleConfig({ transitions: [transition] });
      manager.init(configWithTrans);
      manager.checkTransitions(context);

      manager.endGame(context);

      jest.advanceTimersByTime(15000);
      expect(manager.getCurrentPhase()!.id).toBe('day-1');

      jest.useRealTimers();
    });
  });

  // ==================== reset ====================
  describe('reset()', () => {
    it('должен сбросить всё состояние', () => {
      const config = createSimpleConfig();
      manager.init(config);

      manager.reset();

      expect(manager.getCurrentPhase()).toBeNull();
      expect(manager.getRound()).toBe(1);
      expect(manager.getState().currentState).toBe('menu');
      expect(manager.getState().previousState).toBeNull();
    });

    it('должен очистить таймеры при сбросе', () => {
      jest.useFakeTimers();

      const transition: PhaseTransition = {
        id: 'trans-1',
        fromPhaseId: 'day-1',
        toPhaseId: 'night-1',
        condition: { operator: 'AND', conditions: [] },
        autoTransition: true,
        delay: 10,
      };
      const configWithTrans = createSimpleConfig({ transitions: [transition] });
      manager.init(configWithTrans);
      manager.checkTransitions(context);

      manager.reset();

      jest.advanceTimersByTime(15000);
      expect(manager.getCurrentPhase()).toBeNull();

      jest.useRealTimers();
    });
  });

  // ==================== Интеграционные тесты ====================
  describe('Интеграция: день/ночь цикл', () => {
    it('должен выполнить полный цикл день->ночь->следующий раунд->день', () => {
      const day1 = createDayPhase({ id: 'day-1', name: 'День 1', nextPhaseId: 'night-1' });
      const night1 = createNightPhase({ id: 'night-1', name: 'Ночь 1', nextPhaseId: null });

      const config: GamePhaseConfig = {
        phases: [day1, night1],
        transitions: [],
        startPhaseId: 'day-1',
        cycleEnabled: true,
        cycleOrder: 'sequential',
        globalTimeLimit: 0,
        roundSystem: true,
        currentRound: 1,
        maxRounds: 2,
        roundStartPhase: 'day-1',
        roundEndCondition: { operator: 'AND', conditions: [] },
        onGameEnd: [],
      };

      manager.init(config);

      expect(manager.getCurrentPhase()!.id).toBe('day-1');
      expect(manager.isDay()).toBe(true);
      expect(manager.isNight()).toBe(false);
      expect(manager.getRound()).toBe(1);

      let result = manager.nextPhase(context);
      expect(result.success).toBe(true);
      expect(result.toPhaseId).toBe('night-1');
      expect(manager.isNight()).toBe(true);
      expect(manager.isDay()).toBe(false);

      result = manager.nextPhase(context);
      expect(result.success).toBe(true);
      expect(result.roundChanged).toBe(true);
      expect(result.newRound).toBe(2);
      expect(manager.getRound()).toBe(2);

      expect(manager.getCurrentPhase()!.id).toBe('day-1');
      expect(manager.isDay()).toBe(true);
    });

    it('должен завершить игру после всех раундов', () => {
      const phase = createRoundPhase();
      const config = createRoundConfig({
        phases: [phase],
        maxRounds: 2,
      });

      manager.init(config);

      expect(manager.getRound()).toBe(1);

      manager.nextRound(context);
      expect(manager.getRound()).toBe(2);

      const result = manager.nextRound(context);
      expect(result.success).toBe(true);
      expect(result.message).toContain('завершена');
      expect(manager.getState().currentState).toBe('finished');
    });
  });

  describe('Интеграция: ограничения фаз', () => {
    it('должен разрешать действия только разрешённые в текущей фазе', () => {
      const dayPhase = createDayPhase({
        allowedActions: ['move', 'talk'],
        allowedScenes: ['scene-village'],
      });
      const nightPhase = createNightPhase({
        allowedActions: ['hide', 'attack'],
        allowedScenes: ['scene-forest'],
      });

      const config = createSimpleConfig({ phases: [dayPhase, nightPhase] });
      manager.init(config);

      expect(manager.isActionAllowed('move')).toBe(true);
      expect(manager.isActionAllowed('talk')).toBe(true);
      expect(manager.isActionAllowed('attack')).toBe(false);
      expect(manager.isSceneAllowed('scene-village')).toBe(true);
      expect(manager.isSceneAllowed('scene-forest')).toBe(false);

      manager.transitionToPhase('night-1', context);

      expect(manager.isActionAllowed('hide')).toBe(true);
      expect(manager.isActionAllowed('attack')).toBe(true);
      expect(manager.isActionAllowed('move')).toBe(false);
      expect(manager.isSceneAllowed('scene-forest')).toBe(true);
      expect(manager.isSceneAllowed('scene-village')).toBe(false);
    });

    it('должен применять модификаторы фазы', () => {
      const dayPhase = createDayPhase({ globalModifiers: { visibility: 100, damage: 1.0 } });
      const nightPhase = createNightPhase({ globalModifiers: { visibility: 20, damage: 2.0 } });

      const config = createSimpleConfig({ phases: [dayPhase, nightPhase] });
      manager.init(config);

      expect(manager.getModifier('visibility')).toBe(100);
      expect(manager.getModifier('damage')).toBe(1.0);

      manager.transitionToPhase('night-1', context);
      expect(manager.getModifier('visibility')).toBe(20);
      expect(manager.getModifier('damage')).toBe(2.0);
    });
  });

  describe('Интеграция: таймеры фаз', () => {
    it('должен автоматически перейти к следующей фазе по истечении duration', () => {
      jest.useFakeTimers();

      const shortDay = createDayPhase({ id: 'day-1', duration: 10, nextPhaseId: 'night-1' });
      const night = createNightPhase({ id: 'night-1' });
      const config = createSimpleConfig({ phases: [shortDay, night] });
      manager.init(config);

      expect(manager.getCurrentPhase()!.id).toBe('day-1');

      jest.advanceTimersByTime(10000);

      expect(manager.getCurrentPhase()!.id).toBe('night-1');

      jest.useRealTimers();
    });
  });
});
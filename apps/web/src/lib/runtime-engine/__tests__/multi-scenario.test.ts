import {
  MultiScenarioOrchestrator,
  ExecutionEngine,
  Team,
  Player,
  GameSession,
} from '../runtime-engine';
import {
  Scenario,
  Scene,
  ParallelScenarioConfig,
  SyncPoint,
  MultiScenarioState,
  ParallelScenarioInstance,
} from '@/lib/editor-store/editor.types';

// ==================== Mock Data ====================

function createMockScene(overrides: Partial<Scene> = {}): Scene {
  return {
    id: 'scene-1',
    type: 'location',
    title: 'Тестовая сцена',
    description: '',
    view: { type: 'card', config: { layout: 'vertical', interactive: true } },
    missions: [],
    transitions: [],
    position: { x: 0, y: 0 },
    metadata: {},
    ...overrides,
  };
}

function createMockScenario(overrides: Partial<Scenario> = {}): Scenario {
  return {
    id: 'scenario-main',
    name: 'Главный сценарий',
    description: '',
    version: 1,
    scenes: [createMockScene()],
    startSceneId: 'scene-1',
    variables: [],
    metadata: {
      settings: {
        totalTime: 0,
        defaultPoints: 10,
        defaultPenalty: 0,
        hintLimit: 3,
        maxAttempts: 3,
        variables: [],
        roles: [],
      },
    },
    status: 'draft',
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    ...overrides,
  };
}

function createMockTeam(overrides: Partial<Team> = {}): Team {
  const player: Player = { id: 'player-1', name: 'Тест', role: 'member' };
  return {
    id: 'team-1',
    name: 'Команда 1',
    captainId: 'player-1',
    members: [player],
    inventory: { items: [], capacity: 100, maxWeight: 1000, gold: 0 },
    variables: { teamName: 'Команда 1' },
    score: 0,
    reputation: 0,
    achievements: [],
    ...overrides,
  };
}

function createParallelConfig(overrides: Partial<ParallelScenarioConfig> = {}): ParallelScenarioConfig {
  return {
    id: 'parallel-1',
    scenarioId: 'scenario-parallel',
    name: 'Параллельный квест',
    startOn: 'game_start',
    syncPoints: [],
    variables: {
      local: ['localVar1'],
      shared: ['sharedVar1'],
    },
    ...overrides,
  };
}

function createSyncPoint(overrides: Partial<SyncPoint> = {}): SyncPoint {
  return {
    id: 'sync-1',
    type: 'wait_all',
    scenarios: ['parallel-1', 'parallel-2'],
    onComplete: {
      action: 'continue_all',
    },
    ...overrides,
  };
}

// ==================== Tests ====================

describe('MultiScenarioOrchestrator', () => {
  let engine: ExecutionEngine;
  let orchestrator: MultiScenarioOrchestrator;
  let mainScenario: Scenario;
  let team: Team;

  beforeEach(() => {
    engine = new ExecutionEngine();
    orchestrator = new MultiScenarioOrchestrator(engine);
    mainScenario = createMockScenario();
    team = createMockTeam();
  });

  describe('createMultiSession', () => {
    it('should create a multi-session with main scenario and parallel instances', () => {
      const parallelConfigs = [
        createParallelConfig({ id: 'p1', name: 'Параллельный 1' }),
        createParallelConfig({ id: 'p2', name: 'Параллельный 2' }),
      ];

      const state = orchestrator.createMultiSession(mainScenario, parallelConfigs, team);

      expect(state.mainScenarioId).toBeDefined();
      expect(state.parallelScenarios).toHaveLength(2);
      expect(state.parallelScenarios[0].configId).toBe('p1');
      expect(state.parallelScenarios[1].configId).toBe('p2');
      expect(state.parallelScenarios[0].status).toBe('idle');
      expect(state.parallelScenarios[1].status).toBe('idle');
      expect(state.globalVariables.teamName).toBe('Команда 1');
    });

    it('should collect sync points from all parallel configs', () => {
      const syncPoint1 = createSyncPoint({ id: 'sp1', scenarios: ['p1'] });
      const syncPoint2 = createSyncPoint({ id: 'sp2', scenarios: ['p2'] });

      const parallelConfigs = [
        createParallelConfig({ id: 'p1', syncPoints: [syncPoint1] }),
        createParallelConfig({ id: 'p2', syncPoints: [syncPoint2] }),
      ];

      const state = orchestrator.createMultiSession(mainScenario, parallelConfigs, team);

      expect(state.syncPoints).toHaveLength(2);
      expect(state.syncPoints[0].id).toBe('sp1');
      expect(state.syncPoints[1].id).toBe('sp2');
    });

    it('should deduplicate sync points with same id', () => {
      const syncPoint = createSyncPoint({ id: 'sp1', scenarios: ['p1', 'p2'] });

      const parallelConfigs = [
        createParallelConfig({ id: 'p1', syncPoints: [syncPoint] }),
        createParallelConfig({ id: 'p2', syncPoints: [syncPoint] }),
      ];

      const state = orchestrator.createMultiSession(mainScenario, parallelConfigs, team);

      expect(state.syncPoints).toHaveLength(1);
    });
  });

  describe('startAll', () => {
    it('should start main session and parallel scenarios with game_start trigger', () => {
      const parallelConfigs = [
        createParallelConfig({ id: 'p1', startOn: 'game_start' }),
        createParallelConfig({ id: 'p2', startOn: 'trigger', triggerEvent: 'onCustomEvent' }),
      ];

      const state = orchestrator.createMultiSession(mainScenario, parallelConfigs, team);
      orchestrator.startAll(state, mainScenario, team);

      // Параллельный сценарий с game_start должен быть запущен
      const p1 = state.parallelScenarios.find((p) => p.configId === 'p1');
      expect(p1?.status).toBe('running');
      expect(p1?.startedAt).not.toBeNull();

      // Параллельный сценарий с trigger не должен быть запущен
      const p2 = state.parallelScenarios.find((p) => p.configId === 'p2');
      expect(p2?.status).toBe('idle');
    });
  });

  describe('startParallel', () => {
    it('should start a specific parallel scenario', () => {
      const parallelConfigs = [createParallelConfig({ id: 'p1', startOn: 'trigger' })];
      const state = orchestrator.createMultiSession(mainScenario, parallelConfigs, team);

      orchestrator.startParallel(state, 'p1');

      const instance = state.parallelScenarios.find((p) => p.configId === 'p1');
      expect(instance?.status).toBe('running');
      expect(instance?.startedAt).not.toBeNull();
    });

    it('should not start an already running scenario', () => {
      const parallelConfigs = [createParallelConfig({ id: 'p1', startOn: 'game_start' })];
      const state = orchestrator.createMultiSession(mainScenario, parallelConfigs, team);

      orchestrator.startAll(state, mainScenario, team);
      orchestrator.startParallel(state, 'p1');

      const instance = state.parallelScenarios.find((p) => p.configId === 'p1');
      expect(instance?.status).toBe('running');
    });
  });

  describe('startOnTrigger', () => {
    it('should start parallel scenarios that match the trigger event', () => {
      const parallelConfigs = [
        createParallelConfig({ id: 'p1', startOn: 'trigger', triggerEvent: 'onBossFight' }),
        createParallelConfig({ id: 'p2', startOn: 'trigger', triggerEvent: 'onSecretFound' }),
        createParallelConfig({ id: 'p3', startOn: 'game_start' }),
      ];

      const state = orchestrator.createMultiSession(mainScenario, parallelConfigs, team);
      orchestrator.startOnTrigger(state, 'onBossFight');

      const p1 = state.parallelScenarios.find((p) => p.configId === 'p1');
      expect(p1?.status).toBe('running');

      const p2 = state.parallelScenarios.find((p) => p.configId === 'p2');
      expect(p2?.status).toBe('idle');

      const p3 = state.parallelScenarios.find((p) => p.configId === 'p3');
      expect(p3?.status).toBe('idle');
    });
  });

  describe('variable isolation', () => {
    it('should isolate local variables between parallel scenarios', () => {
      const parallelConfigs = [
        createParallelConfig({
          id: 'p1',
          variables: { local: ['localVar'], shared: [] },
        }),
        createParallelConfig({
          id: 'p2',
          variables: { local: ['localVar'], shared: [] },
        }),
      ];

      const state = orchestrator.createMultiSession(mainScenario, parallelConfigs, team);

      // Устанавливаем локальные переменные для каждого экземпляра
      orchestrator.setVariable(state, state.parallelScenarios[0].id, 'localVar', 'value1');
      orchestrator.setVariable(state, state.parallelScenarios[1].id, 'localVar', 'value2');

      const val1 = orchestrator.getVariable(state, state.parallelScenarios[0].id, 'localVar');
      const val2 = orchestrator.getVariable(state, state.parallelScenarios[1].id, 'localVar');

      expect(val1).toBe('value1');
      expect(val2).toBe('value2');
      expect(val1).not.toBe(val2);
    });

    it('should share global variables between all scenarios', () => {
      const parallelConfigs = [
        createParallelConfig({
          id: 'p1',
          variables: { local: [], shared: ['sharedVar'] },
        }),
        createParallelConfig({
          id: 'p2',
          variables: { local: [], shared: ['sharedVar'] },
        }),
      ];

      const state = orchestrator.createMultiSession(mainScenario, parallelConfigs, team);

      // Устанавливаем общую переменную через первый экземпляр
      orchestrator.setVariable(state, state.parallelScenarios[0].id, 'sharedVar', 'globalValue');

      // Проверяем, что второй экземпляр видит то же значение
      const val2 = orchestrator.getVariable(state, state.parallelScenarios[1].id, 'sharedVar');
      expect(val2).toBe('globalValue');

      // Проверяем через глобальный доступ
      const globalVal = orchestrator.getGlobalVariable(state, 'sharedVar');
      expect(globalVal).toBe('globalValue');
    });

    it('should fall back to global variables when local not found', () => {
      const parallelConfigs = [
        createParallelConfig({
          id: 'p1',
          variables: { local: [], shared: [] },
        }),
      ];

      const state = orchestrator.createMultiSession(mainScenario, parallelConfigs, team);
      orchestrator.setGlobalVariable(state, 'fallbackVar', 'fallback');

      const val = orchestrator.getVariable(state, state.parallelScenarios[0].id, 'fallbackVar');
      expect(val).toBe('fallback');
    });
  });

  describe('sync points', () => {
    it('should complete wait_all sync point when all scenarios finish', () => {
      const parallelConfigs = [
        createParallelConfig({ id: 'p1' }),
        createParallelConfig({ id: 'p2' }),
      ];

      const state = orchestrator.createMultiSession(mainScenario, parallelConfigs, team);
      state.syncPoints = [
        createSyncPoint({ id: 'sp1', type: 'wait_all', scenarios: ['p1', 'p2'] }),
      ];

      // Запускаем оба
      orchestrator.startParallel(state, 'p1');
      orchestrator.startParallel(state, 'p2');

      // Завершаем первый — точка не должна выполниться
      orchestrator.onParallelFinished(state, state.parallelScenarios[0].id);
      expect(state.parallelScenarios[0].status).toBe('finished');

      // Проверяем точки синхронизации — ещё не все завершены
      let completed = orchestrator.checkSyncPoints(state);
      expect(completed).toHaveLength(0);

      // Завершаем второй — точка должна выполниться
      orchestrator.onParallelFinished(state, state.parallelScenarios[1].id);
      completed = orchestrator.checkSyncPoints(state);
      expect(completed).toHaveLength(1);
      expect(completed[0].id).toBe('sp1');
    });

    it('should complete wait_any sync point when any scenario finishes', () => {
      const parallelConfigs = [
        createParallelConfig({ id: 'p1' }),
        createParallelConfig({ id: 'p2' }),
        createParallelConfig({ id: 'p3' }),
      ];

      const state = orchestrator.createMultiSession(mainScenario, parallelConfigs, team);
      state.syncPoints = [
        createSyncPoint({ id: 'sp1', type: 'wait_any', scenarios: ['p1', 'p2', 'p3'] }),
      ];

      // Запускаем все
      orchestrator.startParallel(state, 'p1');
      orchestrator.startParallel(state, 'p2');
      orchestrator.startParallel(state, 'p3');

      // Завершаем только первый
      orchestrator.onParallelFinished(state, state.parallelScenarios[0].id);

      const completed = orchestrator.checkSyncPoints(state);
      expect(completed).toHaveLength(1);
      expect(completed[0].id).toBe('sp1');
    });

    it('should stop all scenarios on stop_all sync action', () => {
      const parallelConfigs = [
        createParallelConfig({ id: 'p1' }),
        createParallelConfig({ id: 'p2' }),
      ];

      const state = orchestrator.createMultiSession(mainScenario, parallelConfigs, team);
      state.syncPoints = [
        createSyncPoint({
          id: 'sp1',
          type: 'wait_any',
          scenarios: ['p1', 'p2'],
          onComplete: { action: 'stop_all' },
        }),
      ];

      orchestrator.startParallel(state, 'p1');
      orchestrator.startParallel(state, 'p2');

      // Завершаем первый — срабатывает stop_all
      orchestrator.onParallelFinished(state, state.parallelScenarios[0].id);

      expect(state.parallelScenarios[1].status).toBe('finished');
      expect(state.parallelScenarios[1].finishedAt).not.toBeNull();
    });

    it('should handle sequence sync type', () => {
      const parallelConfigs = [
        createParallelConfig({ id: 'p1' }),
        createParallelConfig({ id: 'p2' }),
        createParallelConfig({ id: 'p3' }),
      ];

      const state = orchestrator.createMultiSession(mainScenario, parallelConfigs, team);
      state.syncPoints = [
        createSyncPoint({
          id: 'sp1',
          type: 'sequence',
          scenarios: ['p1', 'p2', 'p3'],
        }),
      ];

      orchestrator.startParallel(state, 'p1');
      orchestrator.startParallel(state, 'p2');
      orchestrator.startParallel(state, 'p3');

      // Завершаем первый
      orchestrator.onParallelFinished(state, state.parallelScenarios[0].id);
      let completed = orchestrator.checkSyncPoints(state);
      expect(completed).toHaveLength(0);

      // Завершаем второй
      orchestrator.onParallelFinished(state, state.parallelScenarios[1].id);
      completed = orchestrator.checkSyncPoints(state);
      expect(completed).toHaveLength(0);

      // Завершаем третий — все завершены по порядку
      orchestrator.onParallelFinished(state, state.parallelScenarios[2].id);
      completed = orchestrator.checkSyncPoints(state);
      expect(completed).toHaveLength(1);
    });
  });

  describe('global variables', () => {
    it('should set and get global variables', () => {
      const parallelConfigs: ParallelScenarioConfig[] = [];
      const state = orchestrator.createMultiSession(mainScenario, parallelConfigs, team);

      orchestrator.setGlobalVariable(state, 'gameScore', 100);
      expect(orchestrator.getGlobalVariable(state, 'gameScore')).toBe(100);

      orchestrator.setGlobalVariable(state, 'gameScore', 200);
      expect(orchestrator.getGlobalVariable(state, 'gameScore')).toBe(200);
    });

    it('should return undefined for non-existent global variables', () => {
      const parallelConfigs: ParallelScenarioConfig[] = [];
      const state = orchestrator.createMultiSession(mainScenario, parallelConfigs, team);

      expect(orchestrator.getGlobalVariable(state, 'nonExistent')).toBeUndefined();
    });
  });
});
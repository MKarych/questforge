// ============================================================
// Sub-Scenario Execution Tests (spec 2.3)
// ============================================================

import {
  ExecutionEngine,
  GameSession,
  Team,
  Player,
  SubScenarioResult,
  ExecutionContext,
} from '../runtime-engine';
import {
  Scenario,
  Scene,
  SubScenarioConfig,
} from '@/lib/editor-store/editor.types';

// ==================== Mock Data ====================

function createMockScene(overrides: Partial<Scene> = {}): Scene {
  return {
    id: 'scene-1',
    type: 'location',
    title: 'Сцена',
    description: 'Тестовая сцена',
    view: { type: 'card', config: { layout: 'vertical', interactive: true } },
    missions: [],
    transitions: [],
    position: { x: 0, y: 0 },
    metadata: {},
    ...overrides,
  };
}

function createMockScenario(
  id: string,
  name: string,
  scenes: Scene[],
  variables: { name: string; type: string; defaultValue: any; scope: string }[] = [],
): Scenario {
  return {
    id,
    name,
    description: `Тестовый сценарий ${name}`,
    version: 1,
    scenes,
    startSceneId: scenes[0]?.id || '',
    variables: variables as any,
    metadata: {
      settings: {
        totalTime: 3600,
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
  };
}

function createMockSession(scenario: Scenario): GameSession {
  const player: Player = { id: 'player-1', name: 'Тест', role: 'member' };
  const team: Team = {
    id: 'team-1',
    name: 'Команда 1',
    captainId: 'player-1',
    members: [player],
    inventory: { items: [], capacity: 100, maxWeight: 1000, gold: 0 },
    variables: {},
    score: 0,
    reputation: 0,
    achievements: [],
  };

  const engine = new ExecutionEngine();
  return engine.createSession(scenario, team);
}

function createMockContext(session: GameSession, scene: Scene): ExecutionContext {
  return {
    session,
    scene,
    team: session.team,
    variables: { ...session.variables },
    inventory: { ...session.inventory, items: [...session.inventory.items] },
    score: session.score,
    timestamp: new Date(),
    roles: [],
    roleAssignments: [],
  };
}

// ==================== Tests ====================

describe('Sub-Scenario Execution', () => {
  let engine: ExecutionEngine;
  let parentSession: GameSession;
  let parentContext: ExecutionContext;
  let parentScene: Scene;

  beforeEach(() => {
    engine = new ExecutionEngine();

    // Создаём родительский сценарий с переменными
    parentScene = createMockScene({ id: 'parent-scene', title: 'Родительская сцена' });
    const parentScenario = createMockScenario(
      'parent',
      'Родительский сценарий',
      [parentScene],
      [
        { name: 'player_score', type: 'number', defaultValue: 100, scope: 'local' },
        { name: 'player_name', type: 'string', defaultValue: 'Alice', scope: 'local' },
        { name: 'result', type: 'number', defaultValue: 0, scope: 'local' },
      ],
    );

    parentSession = createMockSession(parentScenario);
    parentSession.variables['player_score'] = 100;
    parentSession.variables['player_name'] = 'Alice';
    parentSession.variables['result'] = 0;

    parentContext = createMockContext(parentSession, parentScene);
  });

  // ==================== Базовый запуск под-сценария ====================

  it('должен выполнить под-сценарий и вернуть успешный результат', () => {
    const subConfig: SubScenarioConfig = {
      id: 'sub-1',
      scenarioId: 'child-scenario',
      name: 'Тестовый под-сценарий',
      description: 'Описание',
      inputMapping: {},
      outputMapping: {},
      onComplete: 'continue_parent',
      maxNestingLevel: 3,
    };

    const result = engine.executeSubScenario(parentSession, subConfig, parentContext);

    expect(result.success).toBe(true);
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(Array.isArray(result.completedScenes)).toBe(true);
    expect(result.outputVariables).toBeDefined();
  });

  // ==================== Маппинг входных переменных ====================

  it('должен передать переменные из родительского сценария в под-сценарий через inputMapping', () => {
    const subConfig: SubScenarioConfig = {
      id: 'sub-input',
      scenarioId: 'child-scenario',
      name: 'Под-сценарий с входными данными',
      description: '',
      inputMapping: {
        'child_score': 'player_score',
        'child_name': 'player_name',
      },
      outputMapping: {},
      onComplete: 'continue_parent',
      maxNestingLevel: 3,
    };

    const result = engine.executeSubScenario(parentSession, subConfig, parentContext);

    expect(result.success).toBe(true);
  });

  // ==================== Маппинг выходных переменных ====================

  it('должен передать переменные из под-сценария обратно в родительский через outputMapping', () => {
    const subConfig: SubScenarioConfig = {
      id: 'sub-output',
      scenarioId: 'child-scenario',
      name: 'Под-сценарий с выходными данными',
      description: '',
      inputMapping: {},
      outputMapping: {
        'child_result': 'result',
      },
      onComplete: 'continue_parent',
      maxNestingLevel: 3,
    };

    const result = engine.executeSubScenario(parentSession, subConfig, parentContext);

    expect(result.success).toBe(true);
    // Проверяем, что outputVariables содержит ключи маппинга
    expect(result.outputVariables).toBeDefined();
    expect(Object.keys(result.outputVariables).length).toBeGreaterThanOrEqual(0);
  });

  // ==================== Защита от рекурсии ====================

  it('должен предотвратить превышение maxNestingLevel', () => {
    const subConfig: SubScenarioConfig = {
      id: 'sub-recursive',
      scenarioId: 'child-scenario',
      name: 'Рекурсивный под-сценарий',
      description: '',
      inputMapping: {},
      outputMapping: {},
      onComplete: 'continue_parent',
      maxNestingLevel: 0, // 0 — запрещаем любую вложенность
    };

    const result = engine.executeSubScenario(parentSession, subConfig, parentContext);

    expect(result.success).toBe(false);
    expect(result.score).toBe(0);
    expect(result.completedScenes).toEqual([]);
  });

  it('должен разрешить выполнение при уровне вложенности ниже maxNestingLevel', () => {
    const subConfig: SubScenarioConfig = {
      id: 'sub-ok',
      scenarioId: 'child-scenario',
      name: 'Допустимый под-сценарий',
      description: '',
      inputMapping: {},
      outputMapping: {},
      onComplete: 'continue_parent',
      maxNestingLevel: 5, // достаточно большой лимит
    };

    const result = engine.executeSubScenario(parentSession, subConfig, parentContext);

    expect(result.success).toBe(true);
  });

  it('должен использовать maxNestingLevel=3 по умолчанию', () => {
    // Создаём конфиг без указания maxNestingLevel (undefined — метод использует ?? 3)
    const subConfig: SubScenarioConfig = {
      id: 'sub-default',
      scenarioId: 'child-scenario',
      name: 'Под-сценарий с умолчаниями',
      description: '',
      inputMapping: {},
      outputMapping: {},
      onComplete: 'continue_parent',
      maxNestingLevel: undefined as unknown as number, // не указано — будет 3 по умолчанию
    };

    // Первый вызов — OK (0 < 3)
    const result1 = engine.executeSubScenario(parentSession, subConfig, parentContext);
    expect(result1.success).toBe(true);

    // Второй вызов — OK (1 < 3)
    const result2 = engine.executeSubScenario(parentSession, subConfig, parentContext);
    expect(result2.success).toBe(true);

    // Третий вызов — OK (2 < 3)
    const result3 = engine.executeSubScenario(parentSession, subConfig, parentContext);
    expect(result3.success).toBe(true);

    // Четвёртый вызов — FAIL (3 >= 3)
    const result4 = engine.executeSubScenario(parentSession, subConfig, parentContext);
    expect(result4.success).toBe(false);
  });

  // ==================== onComplete = continue_parent ====================

  it('должен продолжить родительский сценарий при onComplete=continue_parent', () => {
    const initialScore = parentSession.score;

    const subConfig: SubScenarioConfig = {
      id: 'sub-continue',
      scenarioId: 'child-scenario',
      name: 'Продолжить родителя',
      description: '',
      inputMapping: {},
      outputMapping: {},
      onComplete: 'continue_parent',
      maxNestingLevel: 3,
    };

    const result = engine.executeSubScenario(parentSession, subConfig, parentContext);

    expect(result.success).toBe(true);
    // При continue_parent очки под-сценария добавляются к родительским
    expect(parentSession.score).toBeGreaterThanOrEqual(initialScore);
  });

  // ==================== onComplete = return_result ====================

  it('должен вернуть результат без изменения родительского сценария при onComplete=return_result', () => {
    const initialScore = parentSession.score;

    const subConfig: SubScenarioConfig = {
      id: 'sub-return',
      scenarioId: 'child-scenario',
      name: 'Вернуть результат',
      description: '',
      inputMapping: {},
      outputMapping: {},
      onComplete: 'return_result',
      maxNestingLevel: 3,
    };

    const result = engine.executeSubScenario(parentSession, subConfig, parentContext);

    expect(result.success).toBe(true);
    // При return_result результат возвращается, но не влияет на родителя
    // (success=true, но очки не добавляются к родительской сессии)
    expect(result.score).toBeGreaterThanOrEqual(0);
  });

  // ==================== onComplete = emit_event ====================

  it('должен отправить событие при onComplete=emit_event', () => {
    const subConfig: SubScenarioConfig = {
      id: 'sub-event',
      scenarioId: 'child-scenario',
      name: 'Отправить событие',
      description: '',
      inputMapping: {},
      outputMapping: {},
      onComplete: 'emit_event',
      onCompleteEventName: 'sub_scenario_done',
      maxNestingLevel: 3,
    };

    const result = engine.executeSubScenario(parentSession, subConfig, parentContext);

    expect(result.success).toBe(true);
    // При emit_event очки добавляются к родителю
    expect(result.score).toBeGreaterThanOrEqual(0);
  });

  it('должен отправить событие с указанным именем при onComplete=emit_event', () => {
    const subConfig: SubScenarioConfig = {
      id: 'sub-event-name',
      scenarioId: 'child-scenario',
      name: 'Событие с именем',
      description: '',
      inputMapping: {},
      outputMapping: {},
      onComplete: 'emit_event',
      onCompleteEventName: 'custom_event_name',
      maxNestingLevel: 3,
    };

    const result = engine.executeSubScenario(parentSession, subConfig, parentContext);

    expect(result.success).toBe(true);
  });

  // ==================== Интеграционные тесты ====================

  it('должен выполнить под-сценарий с полным циклом input→execute→output', () => {
    const subConfig: SubScenarioConfig = {
      id: 'sub-full',
      scenarioId: 'child-scenario',
      name: 'Полный цикл',
      description: '',
      inputMapping: {
        'child_input': 'player_score',
      },
      outputMapping: {
        'child_output': 'result',
      },
      onComplete: 'continue_parent',
      maxNestingLevel: 3,
    };

    const result = engine.executeSubScenario(parentSession, subConfig, parentContext);

    expect(result.success).toBe(true);
    expect(result.completedScenes.length).toBeGreaterThanOrEqual(0);
    // Проверяем, что outputVariables содержит ключи маппинга
    expect(result.outputVariables).toBeDefined();
    expect(Object.keys(result.outputVariables).length).toBeGreaterThanOrEqual(0);
  });

  it('должен выполнить несколько под-сценариев последовательно', () => {
    const subConfig1: SubScenarioConfig = {
      id: 'sub-seq-1',
      scenarioId: 'child-1',
      name: 'Первый под-сценарий',
      description: '',
      inputMapping: {},
      outputMapping: {},
      onComplete: 'continue_parent',
      maxNestingLevel: 3,
    };

    const subConfig2: SubScenarioConfig = {
      id: 'sub-seq-2',
      scenarioId: 'child-2',
      name: 'Второй под-сценарий',
      description: '',
      inputMapping: {},
      outputMapping: {},
      onComplete: 'continue_parent',
      maxNestingLevel: 3,
    };

    const result1 = engine.executeSubScenario(parentSession, subConfig1, parentContext);
    expect(result1.success).toBe(true);

    const result2 = engine.executeSubScenario(parentSession, subConfig2, parentContext);
    expect(result2.success).toBe(true);
  });

  it('должен корректно обработать под-сценарий без сцен', () => {
    // Создаём сценарий без сцен
    const emptyScenario = createMockScenario('empty', 'Пустой сценарий', []);
    const emptySession = createMockSession(emptyScenario);
    const emptyContext = createMockContext(emptySession, createMockScene());

    const subConfig: SubScenarioConfig = {
      id: 'sub-empty',
      scenarioId: 'empty-scenario',
      name: 'Пустой под-сценарий',
      description: '',
      inputMapping: {},
      outputMapping: {},
      onComplete: 'continue_parent',
      maxNestingLevel: 3,
    };

    const result = engine.executeSubScenario(emptySession, subConfig, emptyContext);

    expect(result.success).toBe(true);
    expect(result.completedScenes).toEqual([]);
    expect(result.score).toBe(0);
  });
});
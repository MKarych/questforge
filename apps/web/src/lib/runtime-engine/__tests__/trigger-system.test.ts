import { TriggerSystem, ExecutionContext, GameSession, Team, Player } from '../runtime-engine';
import { TriggerDefinition, TriggerAction, Scene, Mission } from '@/lib/editor-store/editor.types';

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

function createMockMission(overrides: Partial<Mission> = {}): Mission {
  return {
    id: 'mission-1',
    type: 'text',
    title: 'Тестовая миссия',
    description: '',
    config: { correctAnswer: '42', matchMode: 'exact', maxAttempts: 3 },
    rewards: [],
    conditions: [],
    hints: [],
    ...overrides,
  };
}

function createMockContext(overrides: Partial<ExecutionContext> = {}): ExecutionContext {
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
  const session: GameSession = {
    id: 'session-1',
    scenarioId: 'scenario-1',
    scenario: {
      id: 'scenario-1',
      name: 'Тестовый сценарий',
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
    },
    teamId: 'team-1',
    team,
    currentSceneId: 'scene-1',
    variables: {},
    inventory: { items: [], capacity: 100, maxWeight: 1000, gold: 0 },
    score: 0,
    achievements: [],
    status: 'running',
    startedAt: new Date(),
    finishedAt: null,
    events: [],
    version: 1,
  };

  return {
    session,
    scene: createMockScene(),
    mission: createMockMission(),
    team,
    variables: {},
    inventory: { items: [], capacity: 100, maxWeight: 1000, gold: 0 },
    score: 0,
    timestamp: new Date(),
    roles: [],
    roleAssignments: [],
    ...overrides,
  };
}

function createTestTrigger(overrides: Partial<TriggerDefinition> = {}): TriggerDefinition {
  return {
    id: 'trigger-1',
    name: 'Тестовый триггер',
    description: '',
    event: 'onSceneEnter',
    conditions: { operator: 'AND', conditions: [] },
    actions: [],
    enabled: true,
    cooldown: 0,
    maxFires: 0,
    fireCount: 0,
    ...overrides,
  };
}

function createTestAction(type: TriggerAction['type'] = 'set_variable', config: Record<string, any> = {}): TriggerAction {
  return {
    id: `action-${type}`,
    type,
    config,
  };
}

// ==================== Tests ====================

describe('TriggerSystem', () => {
  let triggerSystem: TriggerSystem;
  let context: ExecutionContext;

  beforeEach(() => {
    triggerSystem = new TriggerSystem();
    context = createMockContext();
  });

  describe('evaluateTriggers', () => {
    it('should return empty results when no triggers match', () => {
      const triggers: TriggerDefinition[] = [
        createTestTrigger({ event: 'onMissionComplete' }),
      ];

      const results = triggerSystem.evaluateTriggers('onSceneEnter', context, triggers);
      expect(results).toHaveLength(0);
    });

    it('should fire a trigger when event matches and conditions are met', () => {
      const trigger = createTestTrigger({
        event: 'onSceneEnter',
        actions: [createTestAction('set_variable', { variableName: 'test', value: '42', operation: 'set' })],
      });

      const results = triggerSystem.evaluateTriggers('onSceneEnter', context, [trigger]);
      expect(results).toHaveLength(1);
      expect(results[0].triggerId).toBe('trigger-1');
      expect(results[0].fired).toBe(true);
    });

    it('should not fire a disabled trigger', () => {
      const trigger = createTestTrigger({
        event: 'onSceneEnter',
        enabled: false,
      });

      const results = triggerSystem.evaluateTriggers('onSceneEnter', context, [trigger]);
      expect(results).toHaveLength(0);
    });

    it('should fire multiple triggers for the same event', () => {
      const triggers: TriggerDefinition[] = [
        createTestTrigger({ id: 'trigger-1', event: 'onSceneEnter' }),
        createTestTrigger({ id: 'trigger-2', event: 'onSceneEnter' }),
        createTestTrigger({ id: 'trigger-3', event: 'onMissionComplete' }),
      ];

      const results = triggerSystem.evaluateTriggers('onSceneEnter', context, triggers);
      expect(results).toHaveLength(2);
    });

    it('should respect eventFilter with sceneId', () => {
      const matchingTrigger = createTestTrigger({
        id: 'trigger-match',
        event: 'onSceneEnter',
        eventFilter: { sceneId: 'scene-1' },
      });
      const nonMatchingTrigger = createTestTrigger({
        id: 'trigger-no-match',
        event: 'onSceneEnter',
        eventFilter: { sceneId: 'scene-999' },
      });

      const results = triggerSystem.evaluateTriggers('onSceneEnter', context, [
        matchingTrigger,
        nonMatchingTrigger,
      ]);

      expect(results).toHaveLength(1);
      expect(results[0].triggerId).toBe('trigger-match');
    });

    it('should respect eventFilter with missionId', () => {
      const matchingTrigger = createTestTrigger({
        id: 'trigger-match',
        event: 'onMissionComplete',
        eventFilter: { missionId: 'mission-1' },
      });
      const nonMatchingTrigger = createTestTrigger({
        id: 'trigger-no-match',
        event: 'onMissionComplete',
        eventFilter: { missionId: 'mission-999' },
      });

      const results = triggerSystem.evaluateTriggers('onMissionComplete', context, [
        matchingTrigger,
        nonMatchingTrigger,
      ]);

      expect(results).toHaveLength(1);
      expect(results[0].triggerId).toBe('trigger-match');
    });
  });

  describe('cooldown', () => {
    it('should not fire a trigger on cooldown', () => {
      const trigger = createTestTrigger({
        event: 'onSceneEnter',
        cooldown: 60, // 60 seconds cooldown
      });

      // First fire — should work
      const firstResults = triggerSystem.evaluateTriggers('onSceneEnter', context, [trigger]);
      expect(firstResults).toHaveLength(1);

      // Second fire immediately — should be blocked by cooldown
      const secondResults = triggerSystem.evaluateTriggers('onSceneEnter', context, [trigger]);
      expect(secondResults).toHaveLength(0);
    });

    it('should fire after cooldown expires', () => {
      const trigger = createTestTrigger({
        event: 'onSceneEnter',
        cooldown: 0, // No cooldown
      });

      // First fire
      const firstResults = triggerSystem.evaluateTriggers('onSceneEnter', context, [trigger]);
      expect(firstResults).toHaveLength(1);

      // Second fire — no cooldown, should work
      const secondResults = triggerSystem.evaluateTriggers('onSceneEnter', context, [trigger]);
      expect(secondResults).toHaveLength(1);
    });

    it('should reset cooldown when resetCooldown is called', () => {
      const trigger = createTestTrigger({
        event: 'onSceneEnter',
        cooldown: 60,
      });

      // First fire
      triggerSystem.evaluateTriggers('onSceneEnter', context, [trigger]);

      // Reset cooldown
      triggerSystem.resetCooldown(trigger.id);

      // Should fire again
      const results = triggerSystem.evaluateTriggers('onSceneEnter', context, [trigger]);
      expect(results).toHaveLength(1);
    });
  });

  describe('maxFires', () => {
    it('should not fire a trigger that reached maxFires', () => {
      const trigger = createTestTrigger({
        event: 'onSceneEnter',
        maxFires: 2,
        fireCount: 2, // Already fired twice
      });

      const results = triggerSystem.evaluateTriggers('onSceneEnter', context, [trigger]);
      expect(results).toHaveLength(0);
    });

    it('should fire a trigger that has not reached maxFires', () => {
      const trigger = createTestTrigger({
        event: 'onSceneEnter',
        maxFires: 5,
        fireCount: 2, // Fired 2 times, can fire 3 more
      });

      const results = triggerSystem.evaluateTriggers('onSceneEnter', context, [trigger]);
      expect(results).toHaveLength(1);
    });

    it('should increment fireCount when trigger fires', () => {
      const trigger = createTestTrigger({
        event: 'onSceneEnter',
        maxFires: 3,
        fireCount: 0,
      });

      triggerSystem.evaluateTriggers('onSceneEnter', context, [trigger]);
      expect(trigger.fireCount).toBe(1);

      triggerSystem.evaluateTriggers('onSceneEnter', context, [trigger]);
      expect(trigger.fireCount).toBe(2);
    });
  });

  describe('executeAction', () => {
    it('should execute set_variable action', () => {
      const trigger = createTestTrigger({
        event: 'onSceneEnter',
        actions: [
          createTestAction('set_variable', { variableName: 'test_var', value: 'hello', operation: 'set' }),
        ],
      });

      triggerSystem.evaluateTriggers('onSceneEnter', context, [trigger]);
      expect(context.variables['test_var']).toBe('hello');
    });

    it('should execute add_score action', () => {
      const trigger = createTestTrigger({
        event: 'onSceneEnter',
        actions: [
          createTestAction('add_score', { amount: 50 }),
        ],
      });

      triggerSystem.evaluateTriggers('onSceneEnter', context, [trigger]);
      expect(context.score).toBe(50);
      expect(context.team.score).toBe(50);
    });

    it('should execute show_notification action', () => {
      const trigger = createTestTrigger({
        event: 'onSceneEnter',
        actions: [
          createTestAction('show_notification', { text: 'Hello!', icon: '🎉', duration: 5 }),
        ],
      });

      const results = triggerSystem.evaluateTriggers('onSceneEnter', context, [trigger]);
      expect(results[0].actions[0].payload).toBeDefined();
      expect(results[0].actions[0].payload.text).toBe('Hello!');
    });

    it('should execute give_item action', () => {
      const trigger = createTestTrigger({
        event: 'onSceneEnter',
        actions: [
          createTestAction('give_item', { itemId: 'key_01', quantity: 3 }),
        ],
      });

      triggerSystem.evaluateTriggers('onSceneEnter', context, [trigger]);
      const item = context.team.inventory.items.find((i) => i.id === 'key_01');
      expect(item).toBeDefined();
      expect(item?.quantity).toBe(3);
    });

    it('should execute remove_item action', () => {
      // Add item first
      context.team.inventory.items.push({
        id: 'key_01',
        name: 'Ключ',
        description: '',
        quantity: 5,
        icon: '🔑',
        type: 'quest',
        effects: [],
      });

      const trigger = createTestTrigger({
        event: 'onSceneEnter',
        actions: [
          createTestAction('remove_item', { itemId: 'key_01', quantity: 2 }),
        ],
      });

      triggerSystem.evaluateTriggers('onSceneEnter', context, [trigger]);
      const item = context.team.inventory.items.find((i) => i.id === 'key_01');
      expect(item?.quantity).toBe(3);
    });

    it('should execute teleport action', () => {
      const trigger = createTestTrigger({
        event: 'onSceneEnter',
        actions: [
          createTestAction('teleport', { sceneId: 'scene-final' }),
        ],
      });

      triggerSystem.evaluateTriggers('onSceneEnter', context, [trigger]);
      expect(context.session.currentSceneId).toBe('scene-final');
    });

    it('should execute assign_role action', () => {
      const trigger = createTestTrigger({
        event: 'onSceneEnter',
        actions: [
          createTestAction('assign_role', { roleId: 'admin', playerId: 'player-1' }),
        ],
      });

      triggerSystem.evaluateTriggers('onSceneEnter', context, [trigger]);
      expect(context.roleAssignments).toHaveLength(1);
      expect(context.roleAssignments[0].roleId).toBe('admin');
    });

    it('should execute set_variable with add operation', () => {
      context.variables['counter'] = 10;

      const trigger = createTestTrigger({
        event: 'onSceneEnter',
        actions: [
          createTestAction('set_variable', { variableName: 'counter', value: 5, operation: 'add' }),
        ],
      });

      triggerSystem.evaluateTriggers('onSceneEnter', context, [trigger]);
      expect(context.variables['counter']).toBe(15);
    });

    it('should execute set_variable with subtract operation', () => {
      context.variables['counter'] = 10;

      const trigger = createTestTrigger({
        event: 'onSceneEnter',
        actions: [
          createTestAction('set_variable', { variableName: 'counter', value: 3, operation: 'subtract' }),
        ],
      });

      triggerSystem.evaluateTriggers('onSceneEnter', context, [trigger]);
      expect(context.variables['counter']).toBe(7);
    });
  });

  describe('resetAllCooldowns', () => {
    it('should reset all cooldowns', () => {
      const trigger = createTestTrigger({
        event: 'onSceneEnter',
        cooldown: 60,
      });

      // Fire to set cooldown
      triggerSystem.evaluateTriggers('onSceneEnter', context, [trigger]);

      // Reset all
      triggerSystem.resetAllCooldowns();

      // Should fire again
      const results = triggerSystem.evaluateTriggers('onSceneEnter', context, [trigger]);
      expect(results).toHaveLength(1);
    });
  });
});
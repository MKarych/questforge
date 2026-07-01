// ============================================================
// Cross-Scenario Communication Tests (spec 2.2)
// ============================================================

import {
  MultiScenarioOrchestrator,
  ExecutionEngine,
  Team,
  GameSession,
} from '../runtime-engine';
import {
  Scenario,
  ParallelScenarioConfig,
  MultiScenarioState,
  ParallelScenarioInstance,
  SyncPoint,
} from '@/lib/editor-store/editor.types';

// ==================== Helpers ====================

function createMockTeam(): Team {
  return {
    id: 'team-1',
    name: 'Test Team',
    captainId: 'player-1',
    members: [
      { id: 'player-1', name: 'Alice', role: 'captain' },
      { id: 'player-2', name: 'Bob', role: 'member' },
    ],
    inventory: { items: [], capacity: 100, maxWeight: 1000, gold: 0 },
    variables: {},
    score: 0,
    reputation: 0,
    achievements: [],
  };
}

function createMockScenario(id: string, name: string): Scenario {
  return {
    id,
    name,
    description: `Test scenario ${name}`,
    version: 1,
    scenes: [],
    startSceneId: '',
    variables: [],
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

function createMockParallelConfig(id: string, name: string, sharedVars: string[] = []): ParallelScenarioConfig {
  return {
    id,
    scenarioId: `scenario-${id}`,
    name,
    startOn: 'game_start',
    syncPoints: [],
    variables: {
      local: [],
      shared: sharedVars,
    },
  };
}

function createMultiState(orchestrator: MultiScenarioOrchestrator): MultiScenarioState {
  const mainScenario = createMockScenario('main', 'Main Scenario');
  const team = createMockTeam();
  const configs: ParallelScenarioConfig[] = [
    createMockParallelConfig('parallel-1', 'Parallel 1', ['shared_score']),
    createMockParallelConfig('parallel-2', 'Parallel 2', ['shared_score']),
  ];

  return orchestrator.createMultiSession(mainScenario, configs, team);
}

// ==================== Tests ====================

describe('MultiScenarioOrchestrator - Cross-Scenario Communication', () => {
  let engine: ExecutionEngine;
  let orchestrator: MultiScenarioOrchestrator;
  let state: MultiScenarioState;

  beforeEach(() => {
    engine = new ExecutionEngine();
    orchestrator = new MultiScenarioOrchestrator(engine);
    state = createMultiState(orchestrator);
  });

  // ==================== Event Tests ====================

  describe('emitEvent / onEvent', () => {
    it('should emit and receive an event', () => {
      const callback = jest.fn();
      orchestrator.onEvent('test_event', callback);

      orchestrator.emitEvent(state, 'test_event', { data: 'hello' });

      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith({ data: 'hello' }, undefined);
    });

    it('should pass sourceInstanceId when provided', () => {
      const callback = jest.fn();
      orchestrator.onEvent('test_event', callback);

      orchestrator.emitEvent(state, 'test_event', { data: 'hello' }, 'instance-1');

      expect(callback).toHaveBeenCalledWith({ data: 'hello' }, 'instance-1');
    });

    it('should deliver event to multiple listeners', () => {
      const callback1 = jest.fn();
      const callback2 = jest.fn();

      orchestrator.onEvent('multi_event', callback1);
      orchestrator.onEvent('multi_event', callback2);

      orchestrator.emitEvent(state, 'multi_event', { value: 42 });

      expect(callback1).toHaveBeenCalledTimes(1);
      expect(callback2).toHaveBeenCalledTimes(1);
    });

    it('should not deliver event to listeners of other events', () => {
      const callback = jest.fn();
      orchestrator.onEvent('event_a', callback);

      orchestrator.emitEvent(state, 'event_b', { data: 'test' });

      expect(callback).not.toHaveBeenCalled();
    });

    it('should handle emitEvent when no listeners are registered', () => {
      // Should not throw
      expect(() => {
        orchestrator.emitEvent(state, 'nonexistent_event', {});
      }).not.toThrow();
    });

    it('should handle errors in listeners gracefully', () => {
      const errorCallback = jest.fn().mockImplementation(() => {
        throw new Error('Listener error');
      });
      const normalCallback = jest.fn();

      orchestrator.onEvent('error_event', errorCallback);
      orchestrator.onEvent('error_event', normalCallback);

      // Should not throw despite error in one listener
      expect(() => {
        orchestrator.emitEvent(state, 'error_event', {});
      }).not.toThrow();

      expect(normalCallback).toHaveBeenCalledTimes(1);
    });

    it('should start parallel scenario on trigger event', () => {
      const triggerConfig = createMockParallelConfig('trigger-scenario', 'Trigger Scenario');
      triggerConfig.startOn = 'trigger';
      triggerConfig.triggerEvent = 'custom_trigger';

      // Create state with this config — createMultiSession calls setConfigs internally
      const mainScenario = createMockScenario('main', 'Main');
      const team = createMockTeam();
      const triggerState = orchestrator.createMultiSession(mainScenario, [triggerConfig], team);

      expect(triggerState.parallelScenarios[0].status).toBe('idle');

      // Use startOnTrigger which checks the config map
      orchestrator.startOnTrigger(triggerState, 'custom_trigger');

      expect(triggerState.parallelScenarios[0].status).toBe('running');
    });
  });

  // ==================== Subscription / Unsubscription Tests ====================

  describe('onEvent / offEvent', () => {
    it('should unsubscribe from event', () => {
      const callback = jest.fn();
      const unsubscribe = orchestrator.onEvent('test_event', callback);

      unsubscribe();

      orchestrator.emitEvent(state, 'test_event', {});
      expect(callback).not.toHaveBeenCalled();
    });

    it('should support multiple unsubscribes', () => {
      const callback1 = jest.fn();
      const callback2 = jest.fn();

      const unsub1 = orchestrator.onEvent('test_event', callback1);
      const unsub2 = orchestrator.onEvent('test_event', callback2);

      unsub1();
      unsub2();

      orchestrator.emitEvent(state, 'test_event', {});
      expect(callback1).not.toHaveBeenCalled();
      expect(callback2).not.toHaveBeenCalled();
    });

    it('should clean up listener map when all listeners are removed', () => {
      const callback = jest.fn();
      const unsubscribe = orchestrator.onEvent('cleanup_event', callback);

      unsubscribe();

      // Internal map should not have the event anymore
      orchestrator.emitEvent(state, 'cleanup_event', {});
      expect(callback).not.toHaveBeenCalled();
    });
  });

  // ==================== Global Variables Tests ====================

  describe('getGlobalVariable / setGlobalVariable', () => {
    it('should set and get a global variable', () => {
      orchestrator.setGlobalVariable(state, 'test_var', 'hello');
      const value = orchestrator.getGlobalVariable(state, 'test_var');

      expect(value).toBe('hello');
    });

    it('should update existing global variable', () => {
      orchestrator.setGlobalVariable(state, 'counter', 1);
      orchestrator.setGlobalVariable(state, 'counter', 2);

      expect(orchestrator.getGlobalVariable(state, 'counter')).toBe(2);
    });

    it('should handle different variable types', () => {
      orchestrator.setGlobalVariable(state, 'str', 'text');
      orchestrator.setGlobalVariable(state, 'num', 42);
      orchestrator.setGlobalVariable(state, 'bool', true);
      orchestrator.setGlobalVariable(state, 'arr', [1, 2, 3]);
      orchestrator.setGlobalVariable(state, 'obj', { key: 'value' });

      expect(orchestrator.getGlobalVariable(state, 'str')).toBe('text');
      expect(orchestrator.getGlobalVariable(state, 'num')).toBe(42);
      expect(orchestrator.getGlobalVariable(state, 'bool')).toBe(true);
      expect(orchestrator.getGlobalVariable(state, 'arr')).toEqual([1, 2, 3]);
      expect(orchestrator.getGlobalVariable(state, 'obj')).toEqual({ key: 'value' });
    });

    it('should return undefined for non-existent variable', () => {
      const value = orchestrator.getGlobalVariable(state, 'nonexistent');
      expect(value).toBeUndefined();
    });

    it('should share variables between parallel scenarios via shared list', () => {
      // Set shared variable
      orchestrator.setGlobalVariable(state, 'shared_score', 100);

      // Both parallel scenarios should see it
      const instance1 = state.parallelScenarios[0];
      const instance2 = state.parallelScenarios[1];

      const value1 = orchestrator.getGlobalVariable(state, 'shared_score', instance1.id);
      const value2 = orchestrator.getGlobalVariable(state, 'shared_score', instance2.id);

      expect(value1).toBe(100);
      expect(value2).toBe(100);
    });

    it('should allow writing to shared variables from any scenario', () => {
      const instance1 = state.parallelScenarios[0];

      orchestrator.setGlobalVariable(state, 'shared_score', 50, instance1.id);
      expect(orchestrator.getGlobalVariable(state, 'shared_score')).toBe(50);

      const instance2 = state.parallelScenarios[1];
      orchestrator.setGlobalVariable(state, 'shared_score', 75, instance2.id);
      expect(orchestrator.getGlobalVariable(state, 'shared_score')).toBe(75);
    });

    it('should persist global variables across operations', () => {
      orchestrator.setGlobalVariable(state, 'persistent', 'value1');
      orchestrator.setGlobalVariable(state, 'other', 'value2');

      // Simulate some operations
      orchestrator.emitEvent(state, 'some_event', {});

      expect(orchestrator.getGlobalVariable(state, 'persistent')).toBe('value1');
      expect(orchestrator.getGlobalVariable(state, 'other')).toBe('value2');
    });
  });

  // ==================== Integration Tests ====================

  describe('Integration', () => {
    it('should coordinate scenarios via events and global variables', () => {
      const callback = jest.fn();

      // Scenario A sets a global variable and emits event
      orchestrator.setGlobalVariable(state, 'shared_data', 'from_scenario_a');

      // Scenario B listens for the event
      orchestrator.onEvent('data_ready', (payload) => {
        callback(payload);
      });

      // Scenario A emits event
      orchestrator.emitEvent(state, 'data_ready', { source: 'scenario_a' });

      // Verify Scenario B received the event
      expect(callback).toHaveBeenCalledWith({ source: 'scenario_a' });

      // Verify Scenario B can read the global variable
      const data = orchestrator.getGlobalVariable(state, 'shared_data');
      expect(data).toBe('from_scenario_a');
    });

    it('should handle multiple events in sequence', () => {
      const events: string[] = [];

      orchestrator.onEvent('step_1', () => {
        events.push('step_1_completed');
        orchestrator.setGlobalVariable(state, 'step', 1);
      });

      orchestrator.onEvent('step_2', () => {
        events.push('step_2_completed');
        orchestrator.setGlobalVariable(state, 'step', 2);
      });

      orchestrator.emitEvent(state, 'step_1', {});
      expect(orchestrator.getGlobalVariable(state, 'step')).toBe(1);

      orchestrator.emitEvent(state, 'step_2', {});
      expect(orchestrator.getGlobalVariable(state, 'step')).toBe(2);

      expect(events).toEqual(['step_1_completed', 'step_2_completed']);
    });

    it('should not interfere between different orchestrator instances', () => {
      const engine2 = new ExecutionEngine();
      const orchestrator2 = new MultiScenarioOrchestrator(engine2);
      const state2 = createMultiState(orchestrator2);

      const callback1 = jest.fn();
      const callback2 = jest.fn();

      orchestrator.onEvent('event', callback1);
      orchestrator2.onEvent('event', callback2);

      orchestrator.emitEvent(state, 'event', { from: 'orchestrator_1' });

      expect(callback1).toHaveBeenCalled();
      expect(callback2).not.toHaveBeenCalled();
    });
  });
});
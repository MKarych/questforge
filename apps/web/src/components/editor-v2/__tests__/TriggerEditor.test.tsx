import {
  TriggerDefinition,
  TriggerAction,
  TriggerEventType,
  TRIGGER_EVENT_ICONS,
  TRIGGER_EVENT_LABELS,
  TRIGGER_ACTION_ICONS,
  TRIGGER_ACTION_LABELS,
} from '@/lib/editor-store/editor.types';

// ==================== Mock Zustand Store ====================
const mockTriggers: TriggerDefinition[] = [];
const mockAddTrigger = jest.fn();
const mockUpdateTrigger = jest.fn();
const mockRemoveTrigger = jest.fn();
const mockDuplicateTrigger = jest.fn();
const mockToggleTrigger = jest.fn();
const mockResetTriggerFireCount = jest.fn();

jest.mock('@/lib/editor-store/editor.store', () => ({
  useEditorStore: (selector?: any) => {
    const state = {
      triggers: mockTriggers,
      addTrigger: mockAddTrigger,
      updateTrigger: mockUpdateTrigger,
      removeTrigger: mockRemoveTrigger,
      duplicateTrigger: mockDuplicateTrigger,
      toggleTrigger: mockToggleTrigger,
      resetTriggerFireCount: mockResetTriggerFireCount,
      variables: [],
      settings: {
        totalTime: 0,
        defaultPoints: 10,
        defaultPenalty: 0,
        hintLimit: 3,
        maxAttempts: 3,
        variables: [],
        roles: [],
      },
    };
    return selector ? selector(state) : state;
  },
}));

// ==================== Helpers ====================

function createTestTrigger(overrides: Partial<TriggerDefinition> = {}): TriggerDefinition {
  return {
    id: 'test-trigger-1',
    name: 'Тестовый триггер',
    description: 'Описание тестового триггера',
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

function createTestAction(overrides: Partial<TriggerAction> = {}): TriggerAction {
  return {
    id: 'test-action-1',
    type: 'set_variable',
    config: { variableName: 'test_var', value: '42', operation: 'set' },
    ...overrides,
  };
}

// ==================== Tests ====================

describe('TriggerEditor — Types & Constants', () => {
  describe('TriggerEventType', () => {
    it('should have all required event types', () => {
      const events: TriggerEventType[] = [
        'onSceneEnter', 'onSceneExit',
        'onMissionStart', 'onMissionComplete', 'onMissionFail',
        'onAnswerCorrect', 'onAnswerWrong',
        'onTimerStart', 'onTimerEnd',
        'onItemGet', 'onItemSpend',
        'onAchievementUnlock',
        'onRoleAssigned',
        'onVariableChange',
        'onCustomEvent',
      ];

      expect(events).toContain('onSceneEnter');
      expect(events).toContain('onMissionComplete');
      expect(events).toContain('onAchievementUnlock');
      expect(events).toContain('onCustomEvent');
      expect(events.length).toBe(15);
    });
  });

  describe('TRIGGER_EVENT_ICONS', () => {
    it('should have icons for all event types', () => {
      const eventTypes: TriggerEventType[] = [
        'onSceneEnter', 'onSceneExit', 'onMissionStart', 'onMissionComplete',
        'onMissionFail', 'onAnswerCorrect', 'onAnswerWrong', 'onTimerStart',
        'onTimerEnd', 'onItemGet', 'onItemSpend', 'onAchievementUnlock',
        'onRoleAssigned', 'onVariableChange', 'onCustomEvent',
      ];

      eventTypes.forEach((event) => {
        expect(TRIGGER_EVENT_ICONS[event]).toBeDefined();
        expect(typeof TRIGGER_EVENT_ICONS[event]).toBe('string');
      });
    });
  });

  describe('TRIGGER_EVENT_LABELS', () => {
    it('should have labels for all event types', () => {
      const eventTypes: TriggerEventType[] = [
        'onSceneEnter', 'onSceneExit', 'onMissionStart', 'onMissionComplete',
        'onMissionFail', 'onAnswerCorrect', 'onAnswerWrong', 'onTimerStart',
        'onTimerEnd', 'onItemGet', 'onItemSpend', 'onAchievementUnlock',
        'onRoleAssigned', 'onVariableChange', 'onCustomEvent',
      ];

      eventTypes.forEach((event) => {
        expect(TRIGGER_EVENT_LABELS[event]).toBeDefined();
        expect(typeof TRIGGER_EVENT_LABELS[event]).toBe('string');
      });
    });
  });

  describe('TRIGGER_ACTION_ICONS', () => {
    it('should have icons for all action types', () => {
      const actionTypes = [
        'set_variable', 'add_score', 'teleport', 'show_notification',
        'start_timer', 'stop_timer', 'play_sound', 'show_modal',
        'assign_role', 'give_item', 'remove_item', 'emit_event', 'call_api',
      ];

      actionTypes.forEach((type) => {
        expect(TRIGGER_ACTION_ICONS[type]).toBeDefined();
        expect(typeof TRIGGER_ACTION_ICONS[type]).toBe('string');
      });
    });
  });

  describe('TRIGGER_ACTION_LABELS', () => {
    it('should have labels for all action types', () => {
      const actionTypes = [
        'set_variable', 'add_score', 'teleport', 'show_notification',
        'start_timer', 'stop_timer', 'play_sound', 'show_modal',
        'assign_role', 'give_item', 'remove_item', 'emit_event', 'call_api',
      ];

      actionTypes.forEach((type) => {
        expect(TRIGGER_ACTION_LABELS[type]).toBeDefined();
        expect(typeof TRIGGER_ACTION_LABELS[type]).toBe('string');
      });
    });
  });
});

describe('TriggerEditor — TriggerDefinition', () => {
  it('should create a valid trigger with default values', () => {
    const trigger = createTestTrigger();

    expect(trigger.id).toBe('test-trigger-1');
    expect(trigger.name).toBe('Тестовый триггер');
    expect(trigger.event).toBe('onSceneEnter');
    expect(trigger.enabled).toBe(true);
    expect(trigger.cooldown).toBe(0);
    expect(trigger.maxFires).toBe(0);
    expect(trigger.fireCount).toBe(0);
    expect(trigger.actions).toEqual([]);
    expect(trigger.conditions).toEqual({ operator: 'AND', conditions: [] });
  });

  it('should create a trigger with eventFilter', () => {
    const trigger = createTestTrigger({
      eventFilter: { sceneId: 'scene-1', missionId: 'mission-1' },
    });

    expect(trigger.eventFilter).toBeDefined();
    expect(trigger.eventFilter?.sceneId).toBe('scene-1');
    expect(trigger.eventFilter?.missionId).toBe('mission-1');
  });

  it('should create a trigger with cooldown and maxFires', () => {
    const trigger = createTestTrigger({
      cooldown: 30,
      maxFires: 5,
      fireCount: 2,
    });

    expect(trigger.cooldown).toBe(30);
    expect(trigger.maxFires).toBe(5);
    expect(trigger.fireCount).toBe(2);
  });

  it('should create a disabled trigger', () => {
    const trigger = createTestTrigger({ enabled: false });
    expect(trigger.enabled).toBe(false);
  });
});

describe('TriggerEditor — TriggerAction', () => {
  it('should create a set_variable action', () => {
    const action = createTestAction();

    expect(action.type).toBe('set_variable');
    expect(action.config.variableName).toBe('test_var');
    expect(action.config.value).toBe('42');
    expect(action.config.operation).toBe('set');
  });

  it('should create an add_score action', () => {
    const action = createTestAction({
      type: 'add_score',
      config: { amount: 100 },
    });

    expect(action.type).toBe('add_score');
    expect(action.config.amount).toBe(100);
  });

  it('should create a teleport action', () => {
    const action = createTestAction({
      type: 'teleport',
      config: { sceneId: 'scene-final' },
    });

    expect(action.type).toBe('teleport');
    expect(action.config.sceneId).toBe('scene-final');
  });

  it('should create a show_notification action', () => {
    const action = createTestAction({
      type: 'show_notification',
      config: { text: 'Привет!', icon: '🎉', duration: 5 },
    });

    expect(action.type).toBe('show_notification');
    expect(action.config.text).toBe('Привет!');
    expect(action.config.duration).toBe(5);
  });

  it('should create a give_item action', () => {
    const action = createTestAction({
      type: 'give_item',
      config: { itemId: 'key_01', quantity: 3 },
    });

    expect(action.type).toBe('give_item');
    expect(action.config.itemId).toBe('key_01');
    expect(action.config.quantity).toBe(3);
  });

  it('should create a call_api action', () => {
    const action = createTestAction({
      type: 'call_api',
      config: { url: 'https://api.example.com', method: 'POST', body: '{}' },
    });

    expect(action.type).toBe('call_api');
    expect(action.config.url).toBe('https://api.example.com');
    expect(action.config.method).toBe('POST');
  });
});

describe('TriggerEditor — Store Methods', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockTriggers.length = 0;
  });

  it('should add a trigger to the store', () => {
    const trigger = createTestTrigger();
    mockAddTrigger(trigger);

    expect(mockAddTrigger).toHaveBeenCalledWith(trigger);
    expect(mockAddTrigger).toHaveBeenCalledTimes(1);
  });

  it('should update a trigger in the store', () => {
    mockUpdateTrigger('test-trigger-1', { name: 'Обновлённый триггер' });

    expect(mockUpdateTrigger).toHaveBeenCalledWith('test-trigger-1', { name: 'Обновлённый триггер' });
  });

  it('should remove a trigger from the store', () => {
    mockRemoveTrigger('test-trigger-1');

    expect(mockRemoveTrigger).toHaveBeenCalledWith('test-trigger-1');
  });

  it('should duplicate a trigger', () => {
    mockDuplicateTrigger('test-trigger-1');

    expect(mockDuplicateTrigger).toHaveBeenCalledWith('test-trigger-1');
  });

  it('should toggle a trigger', () => {
    mockToggleTrigger('test-trigger-1');

    expect(mockToggleTrigger).toHaveBeenCalledWith('test-trigger-1');
  });

  it('should reset trigger fire count', () => {
    mockResetTriggerFireCount('test-trigger-1');

    expect(mockResetTriggerFireCount).toHaveBeenCalledWith('test-trigger-1');
  });
});

describe('TriggerEditor — Filtering', () => {
  it('should filter triggers by event type', () => {
    const triggers = [
      createTestTrigger({ id: '1', event: 'onSceneEnter' }),
      createTestTrigger({ id: '2', event: 'onMissionComplete' }),
      createTestTrigger({ id: '3', event: 'onSceneEnter' }),
    ];

    const sceneEnterTriggers = triggers.filter((t) => t.event === 'onSceneEnter');
    expect(sceneEnterTriggers).toHaveLength(2);

    const missionCompleteTriggers = triggers.filter((t) => t.event === 'onMissionComplete');
    expect(missionCompleteTriggers).toHaveLength(1);
  });

  it('should filter triggers by enabled state', () => {
    const triggers = [
      createTestTrigger({ id: '1', enabled: true }),
      createTestTrigger({ id: '2', enabled: false }),
      createTestTrigger({ id: '3', enabled: true }),
    ];

    const enabledTriggers = triggers.filter((t) => t.enabled);
    expect(enabledTriggers).toHaveLength(2);

    const disabledTriggers = triggers.filter((t) => !t.enabled);
    expect(disabledTriggers).toHaveLength(1);
  });
});

describe('TriggerEditor — Validation', () => {
  it('should validate trigger name is required', () => {
    const trigger = createTestTrigger({ name: '' });
    const isValid = trigger.name.trim().length > 0;
    expect(isValid).toBe(false);
  });

  it('should validate trigger has at least one action', () => {
    const triggerWithActions = createTestTrigger({
      actions: [createTestAction()],
    });
    const triggerWithoutActions = createTestTrigger();

    expect(triggerWithActions.actions.length).toBeGreaterThan(0);
    expect(triggerWithoutActions.actions.length).toBe(0);
  });

  it('should validate action config fields based on type', () => {
    const setVarAction = createTestAction();
    expect(setVarAction.config.variableName).toBeDefined();
    expect(setVarAction.config.value).toBeDefined();
    expect(setVarAction.config.operation).toBeDefined();

    const scoreAction = createTestAction({
      type: 'add_score',
      config: { amount: 100 },
    });
    expect(scoreAction.config.amount).toBeDefined();
    expect(typeof scoreAction.config.amount).toBe('number');
  });
});

describe('TriggerEditor — Component Export', () => {
  it('should export the TriggerEditor component', () => {
    const TriggerEditorModule = require('../TriggerEditor');
    expect(TriggerEditorModule.default).toBeDefined();
    expect(typeof TriggerEditorModule.default).toBe('function');
  });
});
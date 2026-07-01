import {
  createEmptyCondition,
  createConditionGroup,
  isConditionGroup,
  isSingleCondition,
  validateCondition,
  getConditionLabel,
  serializeCondition,
  deserializeCondition,
  CONDITION_TYPES,
  OPERATORS,
} from '../ConditionBuilder';
import {
  SingleCondition,
  ConditionGroup,
  Condition,
} from '@/lib/editor-store/editor.types';

// ==================== Mock Zustand Store ====================
// We need to mock the editor store for tests that import ConditionBuilder
jest.mock('@/lib/editor-store/editor.store', () => ({
  useEditorStore: (selector?: any) => {
    const state = {
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

// ==================== Tests ====================

describe('ConditionBuilder — Helpers', () => {
  describe('createEmptyCondition', () => {
    it('should create a valid empty SingleCondition', () => {
      const condition = createEmptyCondition();

      expect(condition).toBeDefined();
      expect(condition.type).toBe('score');
      expect(condition.operator).toBe('gt');
      expect(condition.left).toBe('score');
      expect(condition.right).toBe(0);
      expect(isSingleCondition(condition)).toBe(true);
      expect(isConditionGroup(condition)).toBe(false);
    });
  });

  describe('createConditionGroup', () => {
    it('should create an AND group with one empty condition', () => {
      const group = createConditionGroup('AND');

      expect(group).toBeDefined();
      expect(group.operator).toBe('AND');
      expect(group.conditions).toHaveLength(1);
      expect(isConditionGroup(group)).toBe(true);
      expect(isSingleCondition(group)).toBe(false);
      expect(isSingleCondition(group.conditions[0])).toBe(true);
    });

    it('should create an OR group with one empty condition', () => {
      const group = createConditionGroup('OR');

      expect(group.operator).toBe('OR');
      expect(group.conditions).toHaveLength(1);
    });
  });

  describe('isConditionGroup / isSingleCondition', () => {
    it('should correctly identify SingleCondition', () => {
      const cond: SingleCondition = {
        type: 'score',
        operator: 'gt',
        left: 'score',
        right: 10,
      };

      expect(isSingleCondition(cond)).toBe(true);
      expect(isConditionGroup(cond)).toBe(false);
    });

    it('should correctly identify ConditionGroup', () => {
      const group: ConditionGroup = {
        operator: 'AND',
        conditions: [],
      };

      expect(isConditionGroup(group)).toBe(true);
      expect(isSingleCondition(group)).toBe(false);
    });
  });

  describe('validateCondition', () => {
    it('should validate a correct SingleCondition', () => {
      const cond: SingleCondition = {
        type: 'score',
        operator: 'gt',
        left: 'score',
        right: 100,
      };

      expect(validateCondition(cond)).toBe(true);
    });

    it('should invalidate a SingleCondition with empty left', () => {
      const cond: SingleCondition = {
        type: 'variable',
        operator: 'eq',
        left: '',
        right: 'value',
      };

      expect(validateCondition(cond)).toBe(false);
    });

    it('should invalidate a SingleCondition with empty right', () => {
      const cond: SingleCondition = {
        type: 'score',
        operator: 'gt',
        left: 'score',
        right: '',
      };

      expect(validateCondition(cond)).toBe(false);
    });

    it('should validate a ConditionGroup with valid children', () => {
      const group: ConditionGroup = {
        operator: 'AND',
        conditions: [
          { type: 'score', operator: 'gt', left: 'score', right: 100 },
          { type: 'role', operator: 'eq', left: 'player.role', right: 'mafia' },
        ],
      };

      expect(validateCondition(group)).toBe(true);
    });

    it('should invalidate a ConditionGroup with invalid children', () => {
      const group: ConditionGroup = {
        operator: 'AND',
        conditions: [
          { type: 'score', operator: 'gt', left: 'score', right: 100 },
          { type: 'variable', operator: 'eq', left: '', right: '' },
        ],
      };

      expect(validateCondition(group)).toBe(false);
    });

    it('should invalidate an empty ConditionGroup', () => {
      const group: ConditionGroup = {
        operator: 'AND',
        conditions: [],
      };

      expect(validateCondition(group)).toBe(false);
    });
  });

  describe('getConditionLabel', () => {
    it('should return label for SingleCondition', () => {
      const cond: SingleCondition = {
        type: 'score',
        operator: 'gt',
        left: 'score',
        right: 100,
      };

      const label = getConditionLabel(cond);
      expect(label).toContain('Очки');
      expect(label).toContain('>');
      expect(label).toContain('100');
    });

    it('should return label for AND group', () => {
      const group: ConditionGroup = {
        operator: 'AND',
        conditions: [],
      };

      expect(getConditionLabel(group)).toBe('И (AND)');
    });

    it('should return label for OR group', () => {
      const group: ConditionGroup = {
        operator: 'OR',
        conditions: [],
      };

      expect(getConditionLabel(group)).toBe('ИЛИ (OR)');
    });
  });

  describe('serializeCondition', () => {
    it('should serialize null to empty string', () => {
      expect(serializeCondition(null)).toBe('');
    });

    it('should serialize a SingleCondition', () => {
      const cond: SingleCondition = {
        type: 'score',
        operator: 'gt',
        left: 'score',
        right: 100,
      };

      const result = serializeCondition(cond);
      expect(result).toContain('⭐');
      expect(result).toContain('>');
      expect(result).toContain('100');
    });

    it('should serialize a ConditionGroup', () => {
      const group: ConditionGroup = {
        operator: 'AND',
        conditions: [
          { type: 'score', operator: 'gt', left: 'score', right: 100 },
          { type: 'role', operator: 'eq', left: 'player.role', right: 'mafia' },
        ],
      };

      const result = serializeCondition(group);
      expect(result).toContain('AND');
      expect(result).toContain('⭐');
      expect(result).toContain('👤');
    });
  });

  describe('deserializeCondition', () => {
    it('should deserialize valid JSON', () => {
      const json = JSON.stringify({
        type: 'score',
        operator: 'gt',
        left: 'score',
        right: 100,
      });

      const result = deserializeCondition(json);
      expect(result).not.toBeNull();
      if (result && isSingleCondition(result)) {
        expect(result.type).toBe('score');
        expect(result.operator).toBe('gt');
        expect(result.right).toBe(100);
      }
    });

    it('should return null for invalid JSON', () => {
      expect(deserializeCondition('not json')).toBeNull();
    });
  });

  describe('CONDITION_TYPES', () => {
    it('should have all required condition types', () => {
      const types = CONDITION_TYPES.map(t => t.value);
      expect(types).toContain('variable');
      expect(types).toContain('score');
      expect(types).toContain('inventory');
      expect(types).toContain('flag');
      expect(types).toContain('role');
      expect(types).toContain('time');
      expect(types).toContain('random');
    });
  });

  describe('OPERATORS', () => {
    it('should have all required operators', () => {
      const ops = OPERATORS.map(o => o.value);
      expect(ops).toContain('eq');
      expect(ops).toContain('ne');
      expect(ops).toContain('gt');
      expect(ops).toContain('lt');
      expect(ops).toContain('gte');
      expect(ops).toContain('lte');
      expect(ops).toContain('contains');
      expect(ops).toContain('has');
    });
  });
});

// ==================== Serialization/Deserialization Roundtrip ====================

describe('ConditionBuilder — Serialization Roundtrip', () => {
  it('should serialize and deserialize a SingleCondition', () => {
    const original: SingleCondition = {
      type: 'inventory',
      operator: 'has',
      left: 'inventory',
      right: 'key_01',
    };

    const json = JSON.stringify(original);
    const deserialized = JSON.parse(json) as Condition;

    expect(deserialized).toEqual(original);
    if (isSingleCondition(deserialized)) {
      expect(deserialized.type).toBe('inventory');
      expect(deserialized.operator).toBe('has');
      expect(deserialized.right).toBe('key_01');
    }
  });

  it('should serialize and deserialize a nested ConditionGroup', () => {
    const original: ConditionGroup = {
      operator: 'OR',
      conditions: [
        {
          operator: 'AND',
          conditions: [
            { type: 'score', operator: 'gte', left: 'score', right: 100 },
            { type: 'flag', operator: 'eq', left: 'flag', right: 'intro_done' },
          ],
        },
        { type: 'role', operator: 'eq', left: 'player.role', right: 'admin' },
      ],
    };

    const json = JSON.stringify(original);
    const deserialized = JSON.parse(json) as Condition;

    expect(deserialized).toEqual(original);
    if (isConditionGroup(deserialized)) {
      expect(deserialized.operator).toBe('OR');
      expect(deserialized.conditions).toHaveLength(2);
      if (isConditionGroup(deserialized.conditions[0])) {
        expect(deserialized.conditions[0].operator).toBe('AND');
        expect(deserialized.conditions[0].conditions).toHaveLength(2);
      }
    }
  });

  it('should handle complex nested conditions', () => {
    const complex: ConditionGroup = {
      operator: 'AND',
      conditions: [
        { type: 'score', operator: 'gt', left: 'team.score', right: 500 },
        {
          operator: 'OR',
          conditions: [
            { type: 'time', operator: 'gte', left: 'game.elapsed', right: 300 },
            { type: 'inventory', operator: 'has', left: 'inventory', right: 'skip_ticket' },
          ],
        },
        { type: 'random', operator: 'lte', left: 'random', right: 30 },
      ],
    };

    const json = JSON.stringify(complex);
    const result = JSON.parse(json) as Condition;

    expect(result).toEqual(complex);
    expect(validateCondition(result)).toBe(true);
  });
});

// ==================== ConditionBuilder Component ====================

describe('ConditionBuilder — Component', () => {
  it('should export the component as default', () => {
    // Dynamic import to verify the module exports correctly
    const ConditionBuilderModule = require('../ConditionBuilder');
    expect(ConditionBuilderModule.default).toBeDefined();
    expect(typeof ConditionBuilderModule.default).toBe('function');
  });

  it('should export helper functions', () => {
    const ConditionBuilderModule = require('../ConditionBuilder');
    expect(typeof ConditionBuilderModule.serializeCondition).toBe('function');
    expect(typeof ConditionBuilderModule.deserializeCondition).toBe('function');
    expect(typeof ConditionBuilderModule.createEmptyCondition).toBe('function');
    expect(typeof ConditionBuilderModule.createConditionGroup).toBe('function');
    expect(typeof ConditionBuilderModule.isConditionGroup).toBe('function');
    expect(typeof ConditionBuilderModule.isSingleCondition).toBe('function');
    expect(typeof ConditionBuilderModule.validateCondition).toBe('function');
    expect(typeof ConditionBuilderModule.getConditionLabel).toBe('function');
  });
});
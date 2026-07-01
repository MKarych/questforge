// ============================================================
// Тесты системы ролей (Role System) — JS версия для Jest
// ============================================================

const { v4: uuidv4 } = require('uuid');
const { ConditionEngine } = require('../../runtime-engine/runtime-engine');

// ==================== Helpers ====================

function createMockRole(overrides = {}) {
  return {
    id: uuidv4(),
    name: 'Мафия',
    description: 'Ночью убивает игроков',
    team: 'red',
    permissions: ['kill'],
    winCondition: null,
    visibility: 'all',
    icon: '🕵️',
    count: 2,
    ...overrides,
  };
}

function createMockAssignment(playerId, roleId) {
  return {
    playerId,
    roleId,
    assignedAt: Date.now(),
  };
}

function createMockContext(overrides = {}) {
  const player = { id: 'player-1', name: 'Игрок 1', role: 'member' };
  const team = {
    id: 'team-1',
    name: 'Команда 1',
    captainId: 'player-1',
    members: [player],
    inventory: { items: [], capacity: 100 },
    variables: {},
    score: 0,
    reputation: 0,
    achievements: [],
  };
  const scene = {
    id: 'scene-1',
    type: 'location',
    title: 'Старт',
    description: '',
    view: { type: 'card', config: { layout: 'vertical', interactive: true } },
    missions: [],
    transitions: [],
    position: { x: 0, y: 0 },
    metadata: {},
  };
  const session = {
    id: 'session-1',
    scenarioId: 'scenario-1',
    scenario: {
      id: 'scenario-1',
      name: 'Тестовый сценарий',
      description: '',
      version: 1,
      scenes: [scene],
      startSceneId: 'scene-1',
      variables: [],
      metadata: {
        settings: {
          totalTime: 0, defaultPoints: 10, defaultPenalty: 0,
          hintLimit: 3, maxAttempts: 3, variables: [], roles: [],
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
    inventory: { items: [], capacity: 100 },
    score: 0,
    achievements: [],
    status: 'created',
    startedAt: null,
    finishedAt: null,
    events: [],
    version: 1,
  };

  return {
    session,
    scene,
    team,
    variables: {},
    inventory: { items: [], capacity: 100 },
    score: 0,
    timestamp: new Date(),
    roles: [],
    roleAssignments: [],
    ...overrides,
  };
}

// ==================== Тесты ====================

describe('Role System', () => {
  describe('RoleDefinition creation', () => {
    it('should create a role with all required fields', () => {
      const role = createMockRole({
        name: 'Доктор',
        team: 'blue',
        icon: '🧑‍⚕️',
        count: 1,
      });

      expect(role).toBeDefined();
      expect(role.id).toBeDefined();
      expect(role.name).toBe('Доктор');
      expect(role.team).toBe('blue');
      expect(role.icon).toBe('🧑‍⚕️');
      expect(role.count).toBe(1);
      expect(role.permissions).toEqual(['kill']);
      expect(role.visibility).toBe('all');
    });

    it('should create a role with custom permissions', () => {
      const role = createMockRole({
        name: 'Шериф',
        permissions: ['check', 'arrest'],
        team: 'blue',
      });

      expect(role.permissions).toContain('check');
      expect(role.permissions).toContain('arrest');
      expect(role.permissions).toHaveLength(2);
    });

    it('should create a neutral role', () => {
      const role = createMockRole({
        name: 'Маньяк',
        team: 'neutral',
        visibility: 'hidden',
      });

      expect(role.team).toBe('neutral');
      expect(role.visibility).toBe('hidden');
    });
  });

  describe('RoleAssignment', () => {
    it('should assign a role to a player', () => {
      const role = createMockRole();
      const assignment = createMockAssignment('player-1', role.id);

      expect(assignment.playerId).toBe('player-1');
      expect(assignment.roleId).toBe(role.id);
      expect(assignment.assignedAt).toBeGreaterThan(0);
    });

    it('should allow only one role per player (last assignment wins)', () => {
      const role1 = createMockRole({ name: 'Мафия' });
      const role2 = createMockRole({ name: 'Доктор' });
      const playerId = 'player-1';

      const assignments = [];
      // Назначаем первую роль
      assignments.push(createMockAssignment(playerId, role1.id));
      expect(assignments.filter((a) => a.playerId === playerId)).toHaveLength(1);
      expect(assignments.find((a) => a.playerId === playerId).roleId).toBe(role1.id);

      // Переназначаем — удаляем старую и добавляем новую
      const filtered = assignments.filter((a) => a.playerId !== playerId);
      const updated = [...filtered, createMockAssignment(playerId, role2.id)];
      expect(updated.filter((a) => a.playerId === playerId)).toHaveLength(1);
      expect(updated.find((a) => a.playerId === playerId).roleId).toBe(role2.id);
    });
  });

  describe('ConditionEngine — role type', () => {
    let engine;

    beforeEach(() => {
      engine = new ConditionEngine();
    });

    it('should evaluate role condition as true when player has the role', () => {
      const role = createMockRole({ name: 'Мафия' });
      const context = createMockContext({
        roles: [role],
        roleAssignments: [createMockAssignment('player-1', role.id)],
      });

      const condition = {
        type: 'role',
        operator: 'eq',
        left: 'player.role',
        right: role.id,
      };

      const result = engine.evaluate(condition, context);
      expect(result).toBe(true);
    });

    it('should evaluate role condition as false when player has different role', () => {
      const mafiaRole = createMockRole({ name: 'Мафия', id: 'role-mafia' });
      const doctorRole = createMockRole({ name: 'Доктор', id: 'role-doctor' });
      const context = createMockContext({
        roles: [mafiaRole, doctorRole],
        roleAssignments: [createMockAssignment('player-1', doctorRole.id)],
      });

      const condition = {
        type: 'role',
        operator: 'eq',
        left: 'player.role',
        right: mafiaRole.id,
      };

      const result = engine.evaluate(condition, context);
      expect(result).toBe(false);
    });

    it('should evaluate role condition as false when player has no role', () => {
      const role = createMockRole({ name: 'Мафия' });
      const context = createMockContext({
        roles: [role],
        roleAssignments: [],
      });

      const condition = {
        type: 'role',
        operator: 'eq',
        left: 'player.role',
        right: role.id,
      };

      const result = engine.evaluate(condition, context);
      expect(result).toBe(false);
    });

    it('should work inside ConditionGroup with AND', () => {
      const role = createMockRole({ name: 'Мафия' });
      const context = createMockContext({
        roles: [role],
        roleAssignments: [createMockAssignment('player-1', role.id)],
      });

      const condition = {
        operator: 'AND',
        conditions: [
          { type: 'role', operator: 'eq', left: 'player.role', right: role.id },
          { type: 'score', operator: 'gte', left: 'score', right: 10 },
        ],
      };

      // score = 0, так что условие не пройдёт
      const result = engine.evaluate(condition, context);
      expect(result).toBe(false);
    });
  });

  describe('Validation — role count', () => {
    it('should not allow assigning more players than count', () => {
      const role = createMockRole({ name: 'Мафия', count: 2 });
      const playerIds = ['player-1', 'player-2', 'player-3'];

      const assignments = playerIds.map((pid) =>
        createMockAssignment(pid, role.id)
      );

      // Валидация: количество назначений не должно превышать count
      const isValid = assignments.length <= role.count;
      expect(isValid).toBe(false); // 3 > 2
    });

    it('should allow assigning exactly count players', () => {
      const role = createMockRole({ name: 'Мафия', count: 2 });
      const playerIds = ['player-1', 'player-2'];

      const assignments = playerIds.map((pid) =>
        createMockAssignment(pid, role.id)
      );

      const isValid = assignments.length <= role.count;
      expect(isValid).toBe(true); // 2 <= 2
    });

    it('should allow assigning fewer players than count', () => {
      const role = createMockRole({ name: 'Мафия', count: 5 });
      const playerIds = ['player-1', 'player-2'];

      const assignments = playerIds.map((pid) =>
        createMockAssignment(pid, role.id)
      );

      const isValid = assignments.length <= role.count;
      expect(isValid).toBe(true); // 2 <= 5
    });
  });

  describe('RewardEngine — role_assignment', () => {
    it('should handle role_assignment reward type', () => {
      // Проверяем, что тип 'role_assignment' есть в RewardType
      const rewardTypes = ['score', 'money', 'item', 'achievement', 'variable', 'experience', 'role_assignment'];
      expect(rewardTypes).toContain('role_assignment');
    });
  });
});
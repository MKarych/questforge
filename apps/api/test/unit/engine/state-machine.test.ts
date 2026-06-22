import {
  GameStateMachine,
  TeamStateMachine,
  StateMachine,
} from '../../../src/engine/state-machine/state-machine';
import { GameStatus, TeamStatus } from '../../../src/engine/types/engine.types';

describe('StateMachine', () => {
  let stateMachine: StateMachine<string>;

  beforeEach(() => {
    stateMachine = new StateMachine<string>();
    stateMachine.addTransition('A', 'B', 'trigger1', 'user', 'EVENT1');
    stateMachine.addTransition('B', 'C', 'trigger2', 'user', 'EVENT2');
  });

  describe('canTransition', () => {
    it('should return true for valid transition', () => {
      expect(stateMachine.canTransition('A', 'trigger1')).toBe(true);
    });

    it('should return false for invalid transition', () => {
      expect(stateMachine.canTransition('A', 'trigger2')).toBe(false);
    });

    it('should return false for non-existent state', () => {
      expect(stateMachine.canTransition('Z', 'trigger1')).toBe(false);
    });
  });

  describe('transition', () => {
    it('should transition to correct state', () => {
      const result = stateMachine.transition('A', 'trigger1');
      expect(result).toBe('B');
    });

    it('should throw error on invalid transition', () => {
      expect(() => stateMachine.transition('A', 'trigger2')).toThrow(
        'Invalid transition',
      );
    });
  });

  describe('getAllowedTriggers', () => {
    it('should return all allowed triggers for a state', () => {
      const triggers = stateMachine.getAllowedTriggers('A');
      expect(triggers).toContain('trigger1');
      expect(triggers).not.toContain('trigger2');
    });
  });
});

describe('GameStateMachine', () => {
  let gameStateMachine: GameStateMachine;

  beforeEach(() => {
    gameStateMachine = new GameStateMachine();
  });

  describe('valid transitions', () => {
    it('should allow CREATED -> PUBLISHED', () => {
      expect(gameStateMachine.canTransition(GameStatus.CREATED, 'publish')).toBe(
        true,
      );
      const result = gameStateMachine.transition(GameStatus.CREATED, 'publish');
      expect(result).toBe(GameStatus.PUBLISHED);
    });

    it('should allow PUBLISHED -> WAITING_FOR_PLAYERS', () => {
      const result = gameStateMachine.transition(
        GameStatus.PUBLISHED,
        'openRegistration',
      );
      expect(result).toBe(GameStatus.WAITING_FOR_PLAYERS);
    });

    it('should allow WAITING_FOR_PLAYERS -> STARTED', () => {
      const result = gameStateMachine.transition(
        GameStatus.WAITING_FOR_PLAYERS,
        'start',
      );
      expect(result).toBe(GameStatus.STARTED);
    });

    it('should allow STARTED -> IN_PROGRESS', () => {
      const result = gameStateMachine.transition(
        GameStatus.STARTED,
        'assignFirstNode',
      );
      expect(result).toBe(GameStatus.IN_PROGRESS);
    });

    it('should allow IN_PROGRESS <-> PAUSED', () => {
      const paused = gameStateMachine.transition(
        GameStatus.IN_PROGRESS,
        'pause',
      );
      expect(paused).toBe(GameStatus.PAUSED);

      const resumed = gameStateMachine.transition(GameStatus.PAUSED, 'resume');
      expect(resumed).toBe(GameStatus.IN_PROGRESS);
    });

    it('should allow IN_PROGRESS -> FINISHED', () => {
      const result = gameStateMachine.transition(GameStatus.IN_PROGRESS, 'finish');
      expect(result).toBe(GameStatus.FINISHED);
    });

    it('should allow FINISHED -> ARCHIVED', () => {
      const result = gameStateMachine.transition(GameStatus.FINISHED, 'archive');
      expect(result).toBe(GameStatus.ARCHIVED);
    });
  });

  describe('invalid transitions', () => {
    it('should not allow CREATED -> STARTED', () => {
      expect(gameStateMachine.canTransition(GameStatus.CREATED, 'start')).toBe(
        false,
      );
    });

    it('should not allow FINISHED -> IN_PROGRESS', () => {
      expect(
        gameStateMachine.canTransition(GameStatus.FINISHED, 'resume'),
      ).toBe(false);
    });

    it('should throw error on invalid transition', () => {
      expect(() =>
        gameStateMachine.transition(GameStatus.CREATED, 'start'),
      ).toThrow('Invalid transition');
    });
  });
});

describe('TeamStateMachine', () => {
  let teamStateMachine: TeamStateMachine;

  beforeEach(() => {
    teamStateMachine = new TeamStateMachine();
  });

  describe('valid transitions', () => {
    it('should allow REGISTERED -> ACTIVE', () => {
      const result = teamStateMachine.transition(
        TeamStatus.REGISTERED,
        'gameStart',
      );
      expect(result).toBe(TeamStatus.ACTIVE);
    });

    it('should allow ACTIVE -> WAITING_ANSWER', () => {
      const result = teamStateMachine.transition(
        TeamStatus.ACTIVE,
        'assignNode',
      );
      expect(result).toBe(TeamStatus.WAITING_ANSWER);
    });

    it('should allow WAITING_ANSWER -> NODE_COMPLETED', () => {
      const result = teamStateMachine.transition(
        TeamStatus.WAITING_ANSWER,
        'answerAccepted',
      );
      expect(result).toBe(TeamStatus.NODE_COMPLETED);
    });

    it('should allow NODE_COMPLETED -> NEXT_NODE', () => {
      const result = teamStateMachine.transition(
        TeamStatus.NODE_COMPLETED,
        'transition',
      );
      expect(result).toBe(TeamStatus.NEXT_NODE);
    });

    it('should allow NEXT_NODE -> WAITING_ANSWER', () => {
      const result = teamStateMachine.transition(
        TeamStatus.NEXT_NODE,
        'assignNode',
      );
      expect(result).toBe(TeamStatus.WAITING_ANSWER);
    });

    it('should allow WAITING_ANSWER -> NODE_FAILED', () => {
      const result = teamStateMachine.transition(
        TeamStatus.WAITING_ANSWER,
        'answerRejected',
      );
      expect(result).toBe(TeamStatus.NODE_FAILED);
    });

    it('should allow NODE_FAILED -> WAITING_ANSWER (retry)', () => {
      const result = teamStateMachine.transition(
        TeamStatus.NODE_FAILED,
        'retry',
      );
      expect(result).toBe(TeamStatus.WAITING_ANSWER);
    });

    it('should allow WAITING_ANSWER -> FINISHED', () => {
      const result = teamStateMachine.transition(
        TeamStatus.WAITING_ANSWER,
        'gameFinish',
      );
      expect(result).toBe(TeamStatus.FINISHED);
    });
  });

  describe('invalid transitions', () => {
    it('should not allow invalid transitions', () => {
      expect(
        teamStateMachine.canTransition(TeamStatus.REGISTERED, 'finish'),
      ).toBe(false);
    });

    it('should throw error on invalid transition', () => {
      expect(() =>
        teamStateMachine.transition(TeamStatus.REGISTERED, 'finish'),
      ).toThrow('Invalid transition');
    });
  });
});

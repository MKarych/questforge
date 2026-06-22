import { EngineOrchestrator } from '../../../src/engine/orchestrator/engine-orchestrator';
import { EventStore } from '../../../src/engine/event-store/event-store';
import { GameStateMachine, TeamStateMachine } from '../../../src/engine/state-machine/state-machine';
import { PluginRegistry, PluginSandbox } from '../../../src/engine/plugin-sdk/plugin-sdk';
import { LockManager } from '../../../src/engine/lock-manager/lock-manager';
import { TextMissionPlugin } from '../../../src/engine/plugins/text-mission.plugin';
import { CodeMissionPlugin } from '../../../src/engine/plugins/code-mission.plugin';
import { ChoiceMissionPlugin } from '../../../src/engine/plugins/choice-mission.plugin';
import { QRMissionPlugin } from '../../../src/engine/plugins/qr-mission.plugin';
import { PrismaService } from '../../../src/common/prisma/prisma.service';

describe('EngineOrchestrator', () => {
  let orchestrator: EngineOrchestrator;
  let prisma: any;
  let eventStore: EventStore;
  let gameStateMachine: GameStateMachine;
  let teamStateMachine: TeamStateMachine;
  let pluginRegistry: PluginRegistry;
  let pluginSandbox: PluginSandbox;
  let lockManager: LockManager;

  beforeEach(() => {
    eventStore = {
      append: jest.fn(),
      appendMany: jest.fn(),
      getGameEvents: jest.fn(),
      getTeamEvents: jest.fn(),
      getEventsAfter: jest.fn(),
      isProcessed: jest.fn().mockResolvedValue(false),
      markProcessed: jest.fn(),
    } as any;

    gameStateMachine = new GameStateMachine();
    teamStateMachine = new TeamStateMachine();

    pluginRegistry = new PluginRegistry();
    pluginRegistry.register(new TextMissionPlugin());
    pluginRegistry.register(new CodeMissionPlugin());
    pluginRegistry.register(new ChoiceMissionPlugin());
    pluginRegistry.register(new QRMissionPlugin());

    pluginSandbox = new PluginSandbox();

    lockManager = {
      acquire: jest.fn().mockResolvedValue(true),
      release: jest.fn().mockResolvedValue(undefined),
      isLocked: jest.fn().mockResolvedValue(false),
    } as any;

    prisma = {
      sessionState: {
        findFirst: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockResolvedValue({}),
      },
      game: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'game-1',
          scenario: {
            nodes: [
              {
                id: 'node-1',
                type: 'text',
                question: 'What is the capital of France?',
                answer: 'Paris',
                transitions: [
                  { when: 'success', to: 'node-2' },
                  { when: 'fail', to: 'node-1' },
                ],
              },
              {
                id: 'node-2',
                type: 'text',
                question: 'What is 2+2?',
                answer: '4',
                transitions: [
                  { when: 'success', to: 'node-3' },
                  { when: 'fail', to: 'node-2' },
                ],
              },
              {
                id: 'node-3',
                type: 'text',
                question: 'Final question',
                answer: 'Answer',
                transitions: [],
              },
            ],
            startNodeId: 'node-1',
          },
        }),
      },
    } as any;
  });

  beforeEach(() => {
    orchestrator = new EngineOrchestrator(
      eventStore,
      gameStateMachine,
      teamStateMachine,
      pluginRegistry,
      pluginSandbox,
      lockManager,
      prisma,
    );
  });

  describe('startSession', () => {
    it('should create a new session', async () => {
      const result = await orchestrator.startSession(
        'team-1',
        'game-1',
        'Test Team',
        'node-1',
      );

      expect(result.teamId).toBe('team-1');
      expect(result.teamName).toBe('Test Team');
      expect(result.currentNodeId).toBe('node-1');
      expect(result.score).toBe(0);
      expect(result.status).toBe('WAITING_ANSWER');
    });

    it('should save events to event store', async () => {
      await orchestrator.startSession('team-1', 'game-1', 'Test Team', 'node-1');

      expect(eventStore.appendMany).toHaveBeenCalled();
      const events = (eventStore.appendMany as jest.Mock).mock.calls[0][0];
      expect(events).toHaveLength(2);
      expect(events[0].type).toBe('SESSION_CREATE');
      expect(events[1].type).toBe('NODE_ENTER');
    });

    it('should throw if game not found', async () => {
      (prisma.game.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        orchestrator.startSession('team-1', 'game-1', 'Test Team', 'node-1'),
      ).rejects.toThrow('Game game-1 not found');
    });

    it('should throw if start node not found', async () => {
      (prisma.game.findUnique as jest.Mock).mockResolvedValue({
        id: 'game-1',
        scenario: { nodes: [], startNodeId: 'node-999' },
      });

      await expect(
        orchestrator.startSession('team-1', 'game-1', 'Test Team', 'node-999'),
      ).rejects.toThrow('Start node node-999 not found in scenario');
    });
  });

  describe('processAnswer', () => {
    beforeEach(() => {
      (prisma.sessionState.findFirst as jest.Mock).mockResolvedValue({
        state: {
          sessionId: 'session-1',
          teamId: 'team-1',
          teamName: 'Test Team',
          gameId: 'game-1',
          currentNodeId: 'node-1',
          score: 0,
          penalties: 0,
          status: 'WAITING_ANSWER',
          startedAt: Date.now(),
          history: [],
        },
      });
    });

    it('should process correct text answer', async () => {
      const result = await orchestrator.processAnswer(
        'session-1',
        'team-1',
        'game-1',
        'Paris',
        'node-1',
      );

      expect(result.success).toBe(true);
      expect(result.message).toBe('Answer accepted');
      expect(result.state.score).toBe(10);
      expect(result.state.penalties).toBe(0);
      expect(result.state.history).toHaveLength(1);
      expect(result.state.history[0].result).toBe('success');
    });

    it('should process incorrect text answer', async () => {
      const result = await orchestrator.processAnswer(
        'session-1',
        'team-1',
        'game-1',
        'London',
        'node-1',
      );

      expect(result.success).toBe(false);
      expect(result.message).toBe('Answer rejected');
      expect(result.state.score).toBe(0);
      expect(result.state.penalties).toBe(1);
      expect(result.state.history).toHaveLength(1);
      expect(result.state.history[0].result).toBe('fail');
    });

    it('should save events to event store', async () => {
      await orchestrator.processAnswer(
        'session-1',
        'team-1',
        'game-1',
        'Paris',
        'node-1',
      );

      expect(eventStore.appendMany).toHaveBeenCalled();
    });

    it('should save state snapshot', async () => {
      await orchestrator.processAnswer(
        'session-1',
        'team-1',
        'game-1',
        'Paris',
        'node-1',
      );

      expect(prisma.sessionState.create).toHaveBeenCalled();
    });

    it('should throw if session not found', async () => {
      (prisma.sessionState.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(
        orchestrator.processAnswer(
          'session-1',
          'team-1',
          'game-1',
          'Paris',
          'node-1',
        ),
      ).rejects.toThrow('Session not found');
    });

    it('should throw if node not found', async () => {
      (prisma.game.findUnique as jest.Mock).mockResolvedValue({
        scenario: { nodes: [], startNodeId: 'node-1' },
      });

      await expect(
        orchestrator.processAnswer(
          'session-1',
          'team-1',
          'game-1',
          'Paris',
          'node-1',
        ),
      ).rejects.toThrow('Node node-1 not found in game scenario');
    });

    it('should throw if session is locked', async () => {
      (lockManager.acquire as jest.Mock).mockResolvedValue(false);

      await expect(
        orchestrator.processAnswer(
          'session-1',
          'team-1',
          'game-1',
          'Paris',
          'node-1',
        ),
      ).rejects.toThrow('Session is being processed');
    });

    it('should release lock even on error', async () => {
      (prisma.game.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        orchestrator.processAnswer(
          'session-1',
          'team-1',
          'game-1',
          'Paris',
          'node-1',
        ),
      ).rejects.toThrow();

      expect(lockManager.release).toHaveBeenCalledWith('session-1');
    });

    it('should handle case-insensitive answer matching', async () => {
      const result = await orchestrator.processAnswer(
        'session-1',
        'team-1',
        'game-1',
        'paris',
        'node-1',
      );

      expect(result.success).toBe(true);
    });
  });

  describe('getCurrentNode', () => {
    it('should return current node info', async () => {
      (prisma.sessionState.findFirst as jest.Mock).mockResolvedValue({
        state: {
          sessionId: 'session-1',
          teamId: 'team-1',
          teamName: 'Test Team',
          gameId: 'game-1',
          currentNodeId: 'node-1',
          score: 0,
          penalties: 0,
          status: 'WAITING_ANSWER',
          startedAt: Date.now(),
          history: [],
        },
      });

      const node = await orchestrator.getCurrentNode('session-1', 'team-1');

      expect(node).not.toBeNull();
      expect(node?.id).toBe('node-1');
      expect(node?.type).toBe('text');
      expect(node?.question).toBe('What is the capital of France?');
    });

    it('should return null if session not found', async () => {
      (prisma.sessionState.findFirst as jest.Mock).mockResolvedValue(null);

      const node = await orchestrator.getCurrentNode('session-1', 'team-1');
      expect(node).toBeNull();
    });
  });

  describe('getAvailableTransitions', () => {
    it('should return available transitions for current node', async () => {
      (prisma.sessionState.findFirst as jest.Mock).mockResolvedValue({
        state: {
          sessionId: 'session-1',
          teamId: 'team-1',
          teamName: 'Test Team',
          gameId: 'game-1',
          currentNodeId: 'node-1',
          score: 0,
          penalties: 0,
          status: 'WAITING_ANSWER',
          startedAt: Date.now(),
          history: [],
        },
      });

      const transitions = await orchestrator.getAvailableTransitions('session-1', 'team-1');

      expect(transitions).toContain('success');
      expect(transitions).toContain('fail');
    });
  });
});

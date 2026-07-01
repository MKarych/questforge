import { SessionsService } from '../../../src/modules/sessions/sessions.service';

const mockPrisma = {
  sessionState: {
    findFirst: jest.fn(),
  },
  gameTeam: {
    findUnique: jest.fn(),
  },
  team: {
    findUnique: jest.fn(),
  },
  resource: {
    create: jest.fn(),
  },
  game: {
    findUnique: jest.fn(),
  },
};

const mockEngineOrchestrator = {
  startSession: jest.fn(),
  processAnswer: jest.fn(),
  requestHint: jest.fn(),
  getCurrentNode: jest.fn(),
  getSessionHistory: jest.fn(),
  getAvailableTransitions: jest.fn(),
};

describe('SessionsService — sessionId resolution', () => {
  let service: SessionsService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new SessionsService(
      mockPrisma as any,
      mockEngineOrchestrator as any,
    );
  });

  describe('getSessionByTeamAndGame', () => {
    const teamId = 'team-1';
    const gameId = 'game-1';

    it('should return state.sessionId from JSON state', async () => {
      mockPrisma.gameTeam.findUnique.mockResolvedValue({ teamId, gameId });
      mockPrisma.sessionState.findFirst.mockResolvedValue({
        id: 'prisma-id-123',
        state: {
          sessionId: 'engine-uuid-456',
          status: 'WAITING_ANSWER',
          score: 100,
          currentNodeId: 'node-1',
        },
      });

      const result = await service.getSessionByTeamAndGame(teamId, gameId);

      expect(result.sessionId).toBe('engine-uuid-456');
      expect(result.sessionId).not.toBe('prisma-id-123');
      expect(result.status).toBe('WAITING_ANSWER');
      expect(result.score).toBe(100);
      expect(result.currentNodeId).toBe('node-1');
    });

    it('should fallback to snapshot.id if state.sessionId is missing', async () => {
      mockPrisma.gameTeam.findUnique.mockResolvedValue({ teamId, gameId });
      mockPrisma.sessionState.findFirst.mockResolvedValue({
        id: 'prisma-id-123',
        state: {
          status: 'WAITING_ANSWER',
          score: 0,
        },
      });

      const result = await service.getSessionByTeamAndGame(teamId, gameId);

      expect(result.sessionId).toBe('prisma-id-123');
    });

    it('should return not_started when no snapshot exists', async () => {
      mockPrisma.gameTeam.findUnique.mockResolvedValue({ teamId, gameId });
      mockPrisma.sessionState.findFirst.mockResolvedValue(null);

      const result = await service.getSessionByTeamAndGame(teamId, gameId);

      expect(result.sessionId).toBeNull();
      expect(result.status).toBe('not_started');
    });

    it('should throw NotFoundException when team is not registered', async () => {
      mockPrisma.gameTeam.findUnique.mockResolvedValue(null);

      await expect(
        service.getSessionByTeamAndGame(teamId, gameId),
      ).rejects.toThrow('Team is not registered for this game');
    });
  });
});
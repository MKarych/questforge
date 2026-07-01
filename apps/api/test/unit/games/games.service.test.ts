import { GamesService } from '../../../src/modules/games/games.service';

// Мокаем PrismaService
const mockPrisma = {
  game: {
    findUnique: jest.fn(),
    update: jest.fn(),
    count: jest.fn(),
  },
  gameRegistration: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    count: jest.fn(),
  },
  gameTeam: {
    findUnique: jest.fn(),
    create: jest.fn(),
  },
  teamMember: {
    findMany: jest.fn(),
  },
  sessionState: {
    findFirst: jest.fn(),
  },
  scenario: {
    findUnique: jest.fn(),
  },
  user: {
    findUnique: jest.fn(),
  },
};

const mockActivityService = {
  createEvent: jest.fn(),
};

const mockEngineOrchestrator = {
  startSession: jest.fn(),
};

describe('GamesService — sessionId resolution', () => {
  let service: GamesService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new GamesService(
      mockPrisma as any,
      mockActivityService as any,
      mockEngineOrchestrator as any,
    );
  });

  describe('getMyTeamStatus', () => {
    const gameId = 'game-1';
    const userId = 'user-1';
    const teamId = 'team-1';

    it('should return state.sessionId when game is RUNNING', async () => {
      mockPrisma.game.findUnique.mockResolvedValue({
        id: gameId,
        status: 'RUNNING',
      });
      mockPrisma.teamMember.findMany.mockResolvedValue([
        { teamId, team: { id: teamId, name: 'Test Team' } },
      ]);
      mockPrisma.gameRegistration.findUnique.mockResolvedValue({
        gameId,
        teamId,
        status: 'READY',
      });
      mockPrisma.sessionState.findFirst.mockResolvedValue({
        id: 'prisma-id-123',
        state: {
          sessionId: 'engine-uuid-456',
          status: 'WAITING_ANSWER',
          score: 0,
        },
      });

      const result = await service.getMyTeamStatus(gameId, userId);

      expect(result.registered).toBe(true);
      expect(result.sessionId).toBe('engine-uuid-456');
      expect(result.sessionId).not.toBe('prisma-id-123');
    });

    it('should return null sessionId when no snapshot exists', async () => {
      mockPrisma.game.findUnique.mockResolvedValue({
        id: gameId,
        status: 'RUNNING',
      });
      mockPrisma.teamMember.findMany.mockResolvedValue([
        { teamId, team: { id: teamId, name: 'Test Team' } },
      ]);
      mockPrisma.gameRegistration.findUnique.mockResolvedValue({
        gameId,
        teamId,
        status: 'READY',
      });
      mockPrisma.sessionState.findFirst.mockResolvedValue(null);

      const result = await service.getMyTeamStatus(gameId, userId);

      expect(result.registered).toBe(true);
      expect(result.sessionId).toBeNull();
    });

    it('should return null sessionId when game is not RUNNING', async () => {
      mockPrisma.game.findUnique.mockResolvedValue({
        id: gameId,
        status: 'LOBBY',
      });
      mockPrisma.teamMember.findMany.mockResolvedValue([
        { teamId, team: { id: teamId, name: 'Test Team' } },
      ]);
      mockPrisma.gameRegistration.findUnique.mockResolvedValue({
        gameId,
        teamId,
        status: 'REGISTERED',
      });

      const result = await service.getMyTeamStatus(gameId, userId);

      expect(result.registered).toBe(true);
      expect(result.sessionId).toBeNull();
      expect(mockPrisma.sessionState.findFirst).not.toHaveBeenCalled();
    });

    it('should return registered: false when team is not registered', async () => {
      mockPrisma.game.findUnique.mockResolvedValue({
        id: gameId,
        status: 'REGISTRATION_OPEN',
      });
      mockPrisma.teamMember.findMany.mockResolvedValue([
        { teamId, team: { id: teamId, name: 'Test Team' } },
      ]);
      mockPrisma.gameRegistration.findUnique.mockResolvedValue(null);

      const result = await service.getMyTeamStatus(gameId, userId);

      expect(result.registered).toBe(false);
      expect(result.sessionId).toBeNull();
    });
  });

  describe('getMyActiveRegistrations', () => {
    const userId = 'user-1';
    const teamId = 'team-1';
    const gameId = 'game-1';

    it('should return state.sessionId for RUNNING games', async () => {
      mockPrisma.teamMember.findMany.mockResolvedValue([
        { teamId, team: { id: teamId, name: 'Test Team' } },
      ]);
      mockPrisma.gameRegistration.findMany.mockResolvedValue([
        {
          gameId,
          teamId,
          status: 'READY',
          game: {
            id: gameId,
            title: 'Test Game',
            shareLink: 'test-link',
            status: 'RUNNING',
            date: new Date(),
            time: '12:00',
            duration: 60,
            city: 'Test City',
            allowEarlyStart: false,
          },
          team: { id: teamId, name: 'Test Team' },
        },
      ]);
      mockPrisma.sessionState.findFirst.mockResolvedValue({
        id: 'prisma-id-123',
        state: {
          sessionId: 'engine-uuid-456',
          status: 'WAITING_ANSWER',
          score: 100,
        },
      });

      const result = await service.getMyActiveRegistrations(userId);

      expect(result).toHaveLength(1);
      expect(result[0].sessionId).toBe('engine-uuid-456');
      expect(result[0].sessionId).not.toBe('prisma-id-123');
    });

    it('should return null sessionId when no snapshot for RUNNING game', async () => {
      mockPrisma.teamMember.findMany.mockResolvedValue([
        { teamId, team: { id: teamId, name: 'Test Team' } },
      ]);
      mockPrisma.gameRegistration.findMany.mockResolvedValue([
        {
          gameId,
          teamId,
          status: 'READY',
          game: {
            id: gameId,
            title: 'Test Game',
            shareLink: 'test-link',
            status: 'RUNNING',
            date: new Date(),
            time: '12:00',
            duration: 60,
            city: 'Test City',
            allowEarlyStart: false,
          },
          team: { id: teamId, name: 'Test Team' },
        },
      ]);
      mockPrisma.sessionState.findFirst.mockResolvedValue(null);

      const result = await service.getMyActiveRegistrations(userId);

      expect(result[0].sessionId).toBeNull();
    });

    it('should return empty array when user has no memberships', async () => {
      mockPrisma.teamMember.findMany.mockResolvedValue([]);

      const result = await service.getMyActiveRegistrations(userId);

      expect(result).toEqual([]);
    });
  });

  describe('startGame — session creation', () => {
    const gameId = 'game-1';
    const userId = 'org-1';
    const teamId1 = 'team-1';
    const teamId2 = 'team-2';

    it('should call startSession for each registered team', async () => {
      mockPrisma.game.findUnique
        .mockResolvedValueOnce({
          id: gameId,
          organizerId: userId,
          status: 'LOBBY',
          title: 'Test Game',
          date: new Date(),
          time: '12:00',
          allowEarlyStart: true,
          scenarioId: 'scenario-1',
        });
      mockPrisma.gameRegistration.count.mockResolvedValue(2);
      mockPrisma.gameRegistration.findMany.mockResolvedValue([
        { teamId: teamId1, team: { name: 'Team Alpha' } },
        { teamId: teamId2, team: { name: 'Team Beta' } },
      ]);
      mockPrisma.scenario.findUnique.mockResolvedValue({
        id: 'scenario-1',
        nodes: [{ id: 'start-node' }, { id: 'node-2' }],
      });
      mockPrisma.game.update.mockResolvedValue({
        id: gameId,
        status: 'RUNNING',
        startedAt: new Date(),
      });
      mockPrisma.user.findUnique.mockResolvedValue({
        name: 'Organizer',
        avatarUrl: null,
      });
      mockEngineOrchestrator.startSession.mockResolvedValue({});

      const result = await (service as any).startGame(gameId, userId);

      expect(mockEngineOrchestrator.startSession).toHaveBeenCalledTimes(2);
      expect(mockEngineOrchestrator.startSession).toHaveBeenCalledWith(
        teamId1, gameId, 'Team Alpha', 'start-node',
      );
      expect(mockEngineOrchestrator.startSession).toHaveBeenCalledWith(
        teamId2, gameId, 'Team Beta', 'start-node',
      );
      expect(result.status).toBe('RUNNING');
    });

    it('should not fail if startSession throws for one team', async () => {
      mockPrisma.game.findUnique
        .mockResolvedValueOnce({
          id: gameId,
          organizerId: userId,
          status: 'LOBBY',
          title: 'Test Game',
          date: new Date(),
          time: '12:00',
          allowEarlyStart: true,
          scenarioId: 'scenario-1',
        });
      mockPrisma.gameRegistration.count.mockResolvedValue(2);
      mockPrisma.gameRegistration.findMany.mockResolvedValue([
        { teamId: teamId1, team: { name: 'Team Alpha' } },
        { teamId: teamId2, team: { name: 'Team Beta' } },
      ]);
      mockPrisma.scenario.findUnique.mockResolvedValue({
        id: 'scenario-1',
        nodes: [{ id: 'start-node' }],
      });
      mockPrisma.game.update.mockResolvedValue({
        id: gameId,
        status: 'RUNNING',
        startedAt: new Date(),
      });
      mockPrisma.user.findUnique.mockResolvedValue({
        name: 'Organizer',
        avatarUrl: null,
      });
      mockEngineOrchestrator.startSession
        .mockRejectedValueOnce(new Error('Engine error'))
        .mockResolvedValueOnce({});

      const result = await (service as any).startGame(gameId, userId);

      // Игра должна запуститься, даже если одна сессия не создалась
      expect(mockEngineOrchestrator.startSession).toHaveBeenCalledTimes(2);
      expect(result.status).toBe('RUNNING');
    });
  });
});
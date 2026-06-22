import { EventStore } from '../../../src/engine/event-store/event-store';
import { EventType } from '../../../src/engine/types/engine.types';

describe('EventStore', () => {
  let eventStore: EventStore;
  let prisma: any;

  beforeEach(() => {
    prisma = {
      event: {
        create: jest.fn().mockResolvedValue({}),
        findMany: jest.fn().mockResolvedValue([]),
        findFirst: jest.fn().mockResolvedValue(null),
      },
      $transaction: jest.fn().mockResolvedValue([]),
    };

    eventStore = new EventStore(prisma, { get: () => null } as any);
  });

  describe('append', () => {
    it('should append an event to the database', async () => {
      const event = {
        id: 'event-1',
        type: EventType.PLAYER_ANSWER,
        gameId: 'game-1',
        teamId: 'team-1',
        nodeId: 'node-1',
        payload: { answer: 'Paris' },
        timestamp: Date.now(),
        sequence: 1,
        version: 1,
      };

      await eventStore.append(event);

      expect(prisma.event.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          id: 'event-1',
          type: EventType.PLAYER_ANSWER,
          gameId: 'game-1',
        }),
      });
    });

    it('should throw on duplicate event', async () => {
      const event = {
        id: 'event-1',
        type: EventType.PLAYER_ANSWER,
        gameId: 'game-1',
        teamId: 'team-1',
        nodeId: 'node-1',
        payload: { answer: 'Paris' },
        timestamp: Date.now(),
        sequence: 1,
        version: 1,
      };

      // First append should succeed
      await eventStore.append(event);

      // Second append should throw
      await expect(eventStore.append(event)).rejects.toThrow('Duplicate event');
    });
  });

  describe('appendMany', () => {
    it('should append multiple events atomically', async () => {
      const events = [
        {
          id: 'event-1',
          type: EventType.PLAYER_ANSWER,
          gameId: 'game-1',
          teamId: 'team-1',
          payload: { answer: 'Paris' },
          timestamp: Date.now(),
          sequence: 1,
          version: 1,
        },
        {
          id: 'event-2',
          type: EventType.ANSWER_ACCEPTED,
          gameId: 'game-1',
          teamId: 'team-1',
          payload: { score: 10 },
          timestamp: Date.now(),
          sequence: 2,
          version: 1,
        },
      ];

      await eventStore.appendMany(events);

      expect(prisma.$transaction).toHaveBeenCalled();
    });

    it('should throw on duplicate in batch', async () => {
      const events = [
        {
          id: 'event-1',
          type: EventType.PLAYER_ANSWER,
          gameId: 'game-1',
          teamId: 'team-1',
          payload: { answer: 'Paris' },
          timestamp: Date.now(),
          sequence: 1,
          version: 1,
        },
      ];

      // First append
      await eventStore.appendMany(events);

      // Duplicate
      await expect(eventStore.appendMany(events)).rejects.toThrow('Duplicate event');
    });
  });

  describe('isProcessed', () => {
    it('should return false for new event', async () => {
      const result = await eventStore.isProcessed('new-event-id');
      expect(result).toBe(false);
    });

    it('should return true for existing event', async () => {
      (prisma.event.findFirst as jest.Mock).mockResolvedValue({ id: 'event-1' });
      const result = await eventStore.isProcessed('event-1');
      expect(result).toBe(true);
    });
  });
});

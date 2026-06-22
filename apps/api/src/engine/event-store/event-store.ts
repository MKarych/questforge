import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Event, EventType, IEventStore, SessionState } from '../types/engine.types';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class EventStore implements IEventStore {
  private readonly logger = new Logger(EventStore.name);
  private redisClient: any;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    this.initRedis();
  }

  private async initRedis() {
    try {
      const redis = await import('redis');
      const url = this.configService.get<string>('redis.url');
      if (url) {
        this.redisClient = redis.createClient({ url });
        this.redisClient.on('error', (err: Error) => {
          this.logger.error('Redis error:', err);
        });
        await this.redisClient.connect();
        this.logger.log('Redis connected for EventStore');
      }
    } catch (error) {
      this.logger.warn('Redis not available, idempotency will use database fallback');
    }
  }

  async append(event: Event): Promise<void> {
    // Check idempotency
    if (await this.isProcessed(event.id)) {
      throw new Error(`Duplicate event: ${event.id}`);
    }

    // Save to database
    await this.prisma.event.create({
      data: {
        id: event.id,
        type: event.type,
        gameId: event.gameId,
        teamId: event.teamId || null,
        nodeId: event.nodeId || null,
        payload: JSON.parse(JSON.stringify(event.payload)),
        timestamp: new Date(event.timestamp),
        sequence: event.sequence,
        version: event.version,
      },
    });

    // Mark as processed
    await this.markProcessed(event.id);
  }

  async appendMany(events: Event[]): Promise<void> {
    if (events.length === 0) return;

    // Check all for duplicates first
    for (const event of events) {
      if (await this.isProcessed(event.id)) {
        throw new Error(`Duplicate event in batch: ${event.id}`);
      }
    }

    // Save all events atomically
    await this.prisma.$transaction(
      events.map((event) =>
        this.prisma.event.create({
          data: {
            id: event.id,
            type: event.type,
            gameId: event.gameId,
            teamId: event.teamId || null,
            nodeId: event.nodeId || null,
            payload: JSON.parse(JSON.stringify(event.payload)),
            timestamp: new Date(event.timestamp),
            sequence: event.sequence,
            version: event.version,
          },
        })
      )
    );

    // Mark all as processed
    for (const event of events) {
      await this.markProcessed(event.id);
    }
  }

  async getGameEvents(gameId: string): Promise<Event[]> {
    const events = await this.prisma.event.findMany({
      where: { gameId },
      orderBy: { timestamp: 'asc' },
    });

    return events.map((e: any) => this.toEvent(e));
  }

  async getTeamEvents(teamId: string): Promise<Event[]> {
    const events = await this.prisma.event.findMany({
      where: { teamId },
      orderBy: { timestamp: 'asc' },
    });

    return events.map((e: any) => this.toEvent(e));
  }

  async getEventsAfter(teamId: string, timestamp: number): Promise<Event[]> {
    const events = await this.prisma.event.findMany({
      where: {
        teamId,
        timestamp: {
          gte: new Date(timestamp),
        },
      },
      orderBy: { timestamp: 'asc' },
    });

    return events.map((e: any) => this.toEvent(e));
  }

  async isProcessed(eventId: string): Promise<boolean> {
    // Try Redis first
    if (this.redisClient) {
      try {
        const result = await this.redisClient.exists(`processed:${eventId}`);
        if (result === 1) return true;
      } catch {
        // Fall back to database
      }
    }

    // Database fallback - check last 24 hours
    const cutoff = new Date();
    cutoff.setHours(cutoff.getHours() - 24);

    const event = await this.prisma.event.findFirst({
      where: {
        id: eventId,
        createdAt: { gte: cutoff },
      },
    });

    return !!event;
  }

  async markProcessed(eventId: string): Promise<void> {
    // Mark in Redis with TTL 24 hours
    if (this.redisClient) {
      try {
        await this.redisClient.set(`processed:${eventId}`, '1', { EX: 86400 });
      } catch (error) {
        this.logger.error('Failed to mark event in Redis:', error);
      }
    }
  }

  private toEvent(dbEvent: any): Event {
    return {
      id: dbEvent.id,
      type: dbEvent.type as EventType,
      gameId: dbEvent.gameId,
      teamId: dbEvent.teamId || undefined,
      nodeId: dbEvent.nodeId || undefined,
      payload: dbEvent.payload as Record<string, unknown>,
      timestamp: dbEvent.timestamp.getTime(),
      sequence: dbEvent.sequence,
      version: dbEvent.version,
    };
  }
}

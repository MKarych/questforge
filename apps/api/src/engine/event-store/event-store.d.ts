import { ConfigService } from '@nestjs/config';
import { Event, IEventStore } from '../types/engine.types';
import { PrismaService } from '../../common/prisma/prisma.service';
export declare class EventStore implements IEventStore {
    private readonly prisma;
    private readonly configService;
    private readonly logger;
    private redisClient;
    constructor(prisma: PrismaService, configService: ConfigService);
    private initRedis;
    append(event: Event): Promise<void>;
    appendMany(events: Event[]): Promise<void>;
    getGameEvents(gameId: string): Promise<Event[]>;
    getTeamEvents(teamId: string): Promise<Event[]>;
    getEventsAfter(teamId: string, timestamp: number): Promise<Event[]>;
    isProcessed(eventId: string): Promise<boolean>;
    markProcessed(eventId: string): Promise<void>;
    private toEvent;
}
//# sourceMappingURL=event-store.d.ts.map
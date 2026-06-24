"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var EventStore_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventStore = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const prisma_service_1 = require("../../common/prisma/prisma.service");
let EventStore = EventStore_1 = class EventStore {
    prisma;
    configService;
    logger = new common_1.Logger(EventStore_1.name);
    redisClient;
    constructor(prisma, configService) {
        this.prisma = prisma;
        this.configService = configService;
        this.initRedis();
    }
    async initRedis() {
        try {
            const redis = await Promise.resolve().then(() => __importStar(require('redis')));
            const url = this.configService.get('redis.url');
            if (url) {
                this.redisClient = redis.createClient({ url });
                this.redisClient.on('error', (err) => {
                    this.logger.error('Redis error:', err);
                });
                await this.redisClient.connect();
                this.logger.log('Redis connected for EventStore');
            }
        }
        catch (error) {
            this.logger.warn('Redis not available, idempotency will use database fallback');
        }
    }
    async append(event) {
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
    async appendMany(events) {
        if (events.length === 0)
            return;
        // Check all for duplicates first
        for (const event of events) {
            if (await this.isProcessed(event.id)) {
                throw new Error(`Duplicate event in batch: ${event.id}`);
            }
        }
        // Save all events atomically
        await this.prisma.$transaction(events.map((event) => this.prisma.event.create({
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
        })));
        // Mark all as processed
        for (const event of events) {
            await this.markProcessed(event.id);
        }
    }
    async getGameEvents(gameId) {
        const events = await this.prisma.event.findMany({
            where: { gameId },
            orderBy: { timestamp: 'asc' },
        });
        return events.map((e) => this.toEvent(e));
    }
    async getTeamEvents(teamId) {
        const events = await this.prisma.event.findMany({
            where: { teamId },
            orderBy: { timestamp: 'asc' },
        });
        return events.map((e) => this.toEvent(e));
    }
    async getEventsAfter(teamId, timestamp) {
        const events = await this.prisma.event.findMany({
            where: {
                teamId,
                timestamp: {
                    gte: new Date(timestamp),
                },
            },
            orderBy: { timestamp: 'asc' },
        });
        return events.map((e) => this.toEvent(e));
    }
    async isProcessed(eventId) {
        // Try Redis first
        if (this.redisClient) {
            try {
                const result = await this.redisClient.exists(`processed:${eventId}`);
                if (result === 1)
                    return true;
            }
            catch {
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
    async markProcessed(eventId) {
        // Mark in Redis with TTL 24 hours
        if (this.redisClient) {
            try {
                await this.redisClient.set(`processed:${eventId}`, '1', { EX: 86400 });
            }
            catch (error) {
                this.logger.error('Failed to mark event in Redis:', error);
            }
        }
    }
    toEvent(dbEvent) {
        return {
            id: dbEvent.id,
            type: dbEvent.type,
            gameId: dbEvent.gameId,
            teamId: dbEvent.teamId || undefined,
            nodeId: dbEvent.nodeId || undefined,
            payload: dbEvent.payload,
            timestamp: dbEvent.timestamp.getTime(),
            sequence: dbEvent.sequence,
            version: dbEvent.version,
        };
    }
};
exports.EventStore = EventStore;
exports.EventStore = EventStore = EventStore_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        config_1.ConfigService])
], EventStore);
//# sourceMappingURL=event-store.js.map
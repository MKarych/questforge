import { ConfigService } from '@nestjs/config';
/**
 * Redis-based distributed lock manager.
 * Replaces the in-memory Map with a proper distributed lock.
 */
export declare class LockManager {
    private readonly configService;
    private readonly logger;
    private redisClient;
    private readonly LOCK_TTL_MS;
    private readonly LOCK_RETRY_INTERVAL_MS;
    private readonly LOCK_MAX_RETRIES;
    constructor(configService: ConfigService);
    private initRedis;
    /**
     * Acquire a distributed lock for a session.
     * Uses Redis SET NX with TTL for atomicity.
     * Falls back to in-memory lock if Redis is unavailable.
     */
    acquire(sessionId: string, workerId?: string): Promise<boolean>;
    /**
     * Release a distributed lock for a session.
     * Only releases if the current holder is the same worker.
     */
    release(sessionId: string, workerId?: string): Promise<void>;
    /**
     * Check if a session is locked.
     */
    isLocked(sessionId: string): Promise<boolean>;
    private inMemoryLocks;
    private acquireInMemory;
    private releaseInMemory;
}
//# sourceMappingURL=lock-manager.d.ts.map
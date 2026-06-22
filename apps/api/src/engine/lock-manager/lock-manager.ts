import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface RedisClient {
  set(key: string, value: string, options?: string[]): Promise<string | null>;
  del(key: string): Promise<number>;
  get(key: string): Promise<string | null>;
}

/**
 * Redis-based distributed lock manager.
 * Replaces the in-memory Map with a proper distributed lock.
 */
@Injectable()
export class LockManager {
  private readonly logger = new Logger(LockManager.name);
  private redisClient: RedisClient | null = null;
  private readonly LOCK_TTL_MS = 30_000; // 30 seconds
  private readonly LOCK_RETRY_INTERVAL_MS = 50;
  private readonly LOCK_MAX_RETRIES = 20; // Max 1 second to acquire

  constructor(private readonly configService: ConfigService) {
    this.initRedis();
  }

  private async initRedis(): Promise<void> {
    try {
      const redisModule = await import('redis');
      const url = this.configService.get<string>('redis.url');
      if (url) {
        const client = redisModule.createClient({ url });
        client.on('error', (err: Error) => {
          this.logger.error(`Redis lock client error: ${err.message}`);
        });
        await client.connect();
        this.redisClient = client as unknown as RedisClient;
        this.logger.log('Redis LockManager connected');
      }
    } catch (error) {
      this.logger.warn(
        `Redis not available for LockManager: ${error instanceof Error ? error.message : error}. Falling back to in-memory locks.`,
      );
    }
  }

  /**
   * Acquire a distributed lock for a session.
   * Uses Redis SET NX with TTL for atomicity.
   * Falls back to in-memory lock if Redis is unavailable.
   */
  async acquire(sessionId: string, workerId?: string): Promise<boolean> {
    const lockKey = `lock:${sessionId}`;
    const lockValue = workerId || `worker-${Date.now()}-${Math.random().toString(36).slice(2)}`;

    // Try Redis first
    if (this.redisClient) {
      try {
        // SET lockKey workerId NX EX 30 — atomic set with TTL
        const result = await this.redisClient.set(
          lockKey,
          lockValue,
          ['NX', 'EX', '30'],
        );
        if (result === 'OK') {
          this.logger.debug(`Lock acquired for session ${sessionId}`);
          return true;
        }
        return false; // Already locked
      } catch (error) {
        this.logger.warn(
          `Redis lock failed, falling back to in-memory: ${error instanceof Error ? error.message : error}`,
        );
      }
    }

    // Fallback to in-memory lock
    return this.acquireInMemory(sessionId, lockValue);
  }

  /**
   * Release a distributed lock for a session.
   * Only releases if the current holder is the same worker.
   */
  async release(sessionId: string, workerId?: string): Promise<void> {
    const lockKey = `lock:${sessionId}`;

    if (this.redisClient) {
      try {
        // Verify ownership before releasing
        const currentHolder = await this.redisClient.get(lockKey);
        if (currentHolder === workerId) {
          await this.redisClient.del(lockKey);
          this.logger.debug(`Lock released for session ${sessionId}`);
        }
      } catch (error) {
        this.logger.warn(
          `Redis unlock failed: ${error instanceof Error ? error.message : error}`,
        );
      }
    }

    // Release in-memory lock
    this.releaseInMemory(sessionId);
  }

  /**
   * Check if a session is locked.
   */
  async isLocked(sessionId: string): Promise<boolean> {
    const lockKey = `lock:${sessionId}`;

    if (this.redisClient) {
      try {
        const result = await this.redisClient.get(lockKey);
        return result !== null;
      } catch {
        // Fall back to in-memory
      }
    }

    return this.inMemoryLocks.has(sessionId);
  }

  private inMemoryLocks = new Map<string, string>();

  private async acquireInMemory(
    sessionId: string,
    _lockValue: string,
  ): Promise<boolean> {
    // Try to acquire with retries (in-memory simulation)
    for (let i = 0; i < this.LOCK_MAX_RETRIES; i++) {
      if (!this.inMemoryLocks.has(sessionId)) {
        this.inMemoryLocks.set(sessionId, _lockValue);
        return true;
      }
      await new Promise((resolve) =>
        setTimeout(resolve, this.LOCK_RETRY_INTERVAL_MS),
      );
    }
    return false;
  }

  private releaseInMemory(sessionId: string): void {
    this.inMemoryLocks.delete(sessionId);
  }
}

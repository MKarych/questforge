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
var LockManager_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.LockManager = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
/**
 * Redis-based distributed lock manager.
 * Replaces the in-memory Map with a proper distributed lock.
 */
let LockManager = LockManager_1 = class LockManager {
    configService;
    logger = new common_1.Logger(LockManager_1.name);
    redisClient = null;
    LOCK_TTL_MS = 30_000; // 30 seconds
    LOCK_RETRY_INTERVAL_MS = 50;
    LOCK_MAX_RETRIES = 20; // Max 1 second to acquire
    constructor(configService) {
        this.configService = configService;
        this.initRedis();
    }
    async initRedis() {
        try {
            const redisModule = await Promise.resolve().then(() => __importStar(require('redis')));
            const url = this.configService.get('redis.url');
            if (url) {
                const client = redisModule.createClient({ url });
                client.on('error', (err) => {
                    this.logger.error(`Redis lock client error: ${err.message}`);
                });
                await client.connect();
                this.redisClient = client;
                this.logger.log('Redis LockManager connected');
            }
        }
        catch (error) {
            this.logger.warn(`Redis not available for LockManager: ${error instanceof Error ? error.message : error}. Falling back to in-memory locks.`);
        }
    }
    /**
     * Acquire a distributed lock for a session.
     * Uses Redis SET NX with TTL for atomicity.
     * Falls back to in-memory lock if Redis is unavailable.
     */
    async acquire(sessionId, workerId) {
        const lockKey = `lock:${sessionId}`;
        const lockValue = workerId || `worker-${Date.now()}-${Math.random().toString(36).slice(2)}`;
        // Try Redis first
        if (this.redisClient) {
            try {
                // SET lockKey workerId NX EX 30 — atomic set with TTL
                const result = await this.redisClient.set(lockKey, lockValue, ['NX', 'EX', '30']);
                if (result === 'OK') {
                    this.logger.debug(`Lock acquired for session ${sessionId}`);
                    return true;
                }
                return false; // Already locked
            }
            catch (error) {
                this.logger.warn(`Redis lock failed, falling back to in-memory: ${error instanceof Error ? error.message : error}`);
            }
        }
        // Fallback to in-memory lock
        return this.acquireInMemory(sessionId, lockValue);
    }
    /**
     * Release a distributed lock for a session.
     * Only releases if the current holder is the same worker.
     */
    async release(sessionId, workerId) {
        const lockKey = `lock:${sessionId}`;
        if (this.redisClient) {
            try {
                // Verify ownership before releasing
                const currentHolder = await this.redisClient.get(lockKey);
                if (currentHolder === workerId) {
                    await this.redisClient.del(lockKey);
                    this.logger.debug(`Lock released for session ${sessionId}`);
                }
            }
            catch (error) {
                this.logger.warn(`Redis unlock failed: ${error instanceof Error ? error.message : error}`);
            }
        }
        // Release in-memory lock
        this.releaseInMemory(sessionId);
    }
    /**
     * Check if a session is locked.
     */
    async isLocked(sessionId) {
        const lockKey = `lock:${sessionId}`;
        if (this.redisClient) {
            try {
                const result = await this.redisClient.get(lockKey);
                return result !== null;
            }
            catch {
                // Fall back to in-memory
            }
        }
        return this.inMemoryLocks.has(sessionId);
    }
    inMemoryLocks = new Map();
    async acquireInMemory(sessionId, _lockValue) {
        // Try to acquire with retries (in-memory simulation)
        for (let i = 0; i < this.LOCK_MAX_RETRIES; i++) {
            if (!this.inMemoryLocks.has(sessionId)) {
                this.inMemoryLocks.set(sessionId, _lockValue);
                return true;
            }
            await new Promise((resolve) => setTimeout(resolve, this.LOCK_RETRY_INTERVAL_MS));
        }
        return false;
    }
    releaseInMemory(sessionId) {
        this.inMemoryLocks.delete(sessionId);
    }
};
exports.LockManager = LockManager;
exports.LockManager = LockManager = LockManager_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], LockManager);
//# sourceMappingURL=lock-manager.js.map
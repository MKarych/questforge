import { LockManager } from '../../../../src/engine/lock-manager/lock-manager';

describe('LockManager', () => {
  let lockManager: LockManager;

  beforeEach(() => {
    // Mock config service — Redis not available, falls back to in-memory
    lockManager = new LockManager({
      get: jest.fn().mockReturnValue(null),
    } as any);
  });

  describe('acquire', () => {
    it('should acquire a lock for a session', async () => {
      const result = await lockManager.acquire('session-1');
      expect(result).toBe(true);
    });

    it('should not acquire a lock if already held', async () => {
      await lockManager.acquire('session-1');
      const result = await lockManager.acquire('session-1');
      expect(result).toBe(false);
    });

    it('should allow different sessions to acquire locks independently', async () => {
      const result1 = await lockManager.acquire('session-1');
      const result2 = await lockManager.acquire('session-2');
      expect(result1).toBe(true);
      expect(result2).toBe(true);
    });
  });

  describe('release', () => {
    it('should release a lock', async () => {
      await lockManager.acquire('session-1');
      await lockManager.release('session-1');

      // Should be able to acquire again
      const result = await lockManager.acquire('session-1');
      expect(result).toBe(true);
    });

    it('should not release a lock for wrong worker', async () => {
      await lockManager.acquire('session-1', 'worker-a');
      await lockManager.release('session-1', 'worker-b');

      // Lock should still be held
      const result = await lockManager.acquire('session-1');
      expect(result).toBe(false);
    });
  });

  describe('isLocked', () => {
    it('should return true for locked session', async () => {
      await lockManager.acquire('session-1');
      const result = await lockManager.isLocked('session-1');
      expect(result).toBe(true);
    });

    it('should return false for unlocked session', async () => {
      const result = await lockManager.isLocked('session-1');
      expect(result).toBe(false);
    });
  });
});

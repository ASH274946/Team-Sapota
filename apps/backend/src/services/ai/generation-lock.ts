import { getBullRedisClient } from '../../config/redis';
import { logger } from '../../utils/logger';
import { setTimeout as sleep } from 'timers/promises';

const LOCK_PREFIX = 'generation-lock:';
const DEFAULT_TTL_MS = 180_000;
const HEARTBEAT_INTERVAL_MS = 15_000;
const RETRY_DELAY_MS = 2_000;
const ACQUIRE_TIMEOUT_MS = 120_000;

export interface LockOwner {
  assignmentId: string;
  jobRecordId: string;
  generationSeq: number;
  workerId: string;
  acquiredAt: number;
  expiresAt: number;
}

export class GenerationLock {
  private heartbeatHandle: ReturnType<typeof setInterval> | null = null;
  private _owner: LockOwner | null = null;
  private workerId: string;

  constructor() {
    this.workerId = `worker-${process.pid}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }

  get owner(): LockOwner | null {
    return this._owner;
  }

  private lockKey(assignmentId: string): string {
    return `${LOCK_PREFIX}${assignmentId}`;
  }

  async acquire(
    assignmentId: string,
    jobRecordId: string,
    generationSeq: number,
    ttlMs = DEFAULT_TTL_MS
  ): Promise<boolean> {
    const key = this.lockKey(assignmentId);
    const redis = getBullRedisClient();
    const now = Date.now();
    const expiresAt = now + ttlMs;
    const lockValue = JSON.stringify({
      assignmentId,
      jobRecordId,
      generationSeq,
      workerId: this.workerId,
      acquiredAt: now,
      expiresAt,
    });

    const deadline = Date.now() + ACQUIRE_TIMEOUT_MS;
    while (Date.now() < deadline) {
      const result = await redis.set(key, lockValue, 'PX', ttlMs, 'NX');
      if (result === 'OK') {
        this._owner = {
          assignmentId,
          jobRecordId,
          generationSeq,
          workerId: this.workerId,
          acquiredAt: now,
          expiresAt,
        };
        logger.info(
          `[LOCK] Acquired assignment=${assignmentId} jobRecord=${jobRecordId} worker=${this.workerId}`
        );
        this.startHeartbeat(key, ttlMs);
        return true;
      }

      const existingRaw = await redis.get(key);
      if (existingRaw) {
        try {
          const existing: LockOwner = JSON.parse(existingRaw);
          const isStale = existing.expiresAt < Date.now() - 10_000;
          if (isStale) {
            const value = await redis.getset(key, lockValue);
            if (value === existingRaw) {
              this._owner = {
                assignmentId,
                jobRecordId,
                generationSeq,
                workerId: this.workerId,
                acquiredAt: Date.now(),
                expiresAt: Date.now() + ttlMs,
              };
              logger.warn(
                `[LOCK] Acquired stale lock assignment=${assignmentId} oldWorker=${existing.workerId}`
              );
              this.startHeartbeat(key, ttlMs);
              return true;
            }
          }
        } catch {
          const value = await redis.getset(key, lockValue);
          if (value === existingRaw || !value) {
            this._owner = {
              assignmentId,
              jobRecordId,
              generationSeq,
              workerId: this.workerId,
              acquiredAt: Date.now(),
              expiresAt: Date.now() + ttlMs,
            };
            logger.warn(`[LOCK] Acquired corrupted lock assignment=${assignmentId}`);
            this.startHeartbeat(key, ttlMs);
            return true;
          }
        }
      }

      logger.debug(
        `[LOCK] Waiting for assignment=${assignmentId} jobRecord=${jobRecordId} deadline=${deadline - Date.now()}ms`
      );
      await sleep(RETRY_DELAY_MS);
    }

    logger.warn(
      `[LOCK] Failed to acquire assignment=${assignmentId} jobRecord=${jobRecordId} after ${ACQUIRE_TIMEOUT_MS}ms`
    );
    return false;
  }

  async release(assignmentId: string): Promise<void> {
    this.stopHeartbeat();
    const redis = getBullRedisClient();
    const key = this.lockKey(assignmentId);
    if (this._owner) {
      await redis.eval(
        `if redis.call("get", KEYS[1]) == ARGV[1] then return redis.call("del", KEYS[1]) else return 0 end`,
        1,
        key,
        JSON.stringify(this._owner)
      );
      logger.info(`[LOCK] Released assignment=${assignmentId} worker=${this.workerId}`);
      this._owner = null;
    }
  }

  async checkOwnership(assignmentId: string, jobRecordId: string): Promise<boolean> {
    const redis = getBullRedisClient();
    const key = this.lockKey(assignmentId);
    const raw = await redis.get(key);
    if (!raw) return false;
    try {
      const lock: LockOwner = JSON.parse(raw);
      return lock.jobRecordId === jobRecordId && lock.workerId === this.workerId;
    } catch {
      return false;
    }
  }

  private startHeartbeat(key: string, ttlMs: number): void {
    this.stopHeartbeat();
    this.heartbeatHandle = setInterval(async () => {
      if (!this._owner) return;
      try {
        const redis = getBullRedisClient();
        const lockValue = JSON.stringify(this._owner);
        const result = await redis.eval(
          `if redis.call("get", KEYS[1]) == ARGV[1] then return redis.call("pexpire", KEYS[1], ARGV[2]) else return 0 end`,
          1,
          key,
          lockValue,
          String(ttlMs)
        );
        if (result === 0) {
          logger.warn(`[LOCK] Lost lock assignment=${this._owner.assignmentId}`);
          this._owner = null;
          this.stopHeartbeat();
        }
      } catch (err) {
        logger.error(`[LOCK] Heartbeat error: ${err}`);
      }
    }, HEARTBEAT_INTERVAL_MS);
    this.heartbeatHandle.unref();
  }

  private stopHeartbeat(): void {
    if (this.heartbeatHandle) {
      clearInterval(this.heartbeatHandle);
      this.heartbeatHandle = null;
    }
  }

  destroy(): void {
    if (this._owner) {
      this.release(this._owner.assignmentId).catch(() => {});
    }
    this.stopHeartbeat();
  }
}

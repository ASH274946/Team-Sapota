import type { ProviderName } from './provider-errors';
import { logger } from '../../utils/logger';

export interface ProviderStats {
  requests: number;
  successes: number;
  validationFailures: number;
  parseFailures: number;
  transportFailures: number;
  timeoutFailures: number;
  rateLimitFailures: number;
  totalLatencyMs: number;
}

interface ProviderState {
  canonicalName: string;
  failures: number;
  failureTimestamps: number[]; // 60-second sliding window for 5xx/timeout failures
  openUntil: number;
  cooldownMs: number;
  quarantineUntil: number;
  stats: ProviderStats;
  wasOpen: boolean;
}

const DEFAULT_STATS: ProviderStats = {
  requests: 0,
  successes: 0,
  validationFailures: 0,
  parseFailures: 0,
  transportFailures: 0,
  timeoutFailures: 0,
  rateLimitFailures: 0,
  totalLatencyMs: 0,
};

const BASE_PRIORITY: Record<string, number> = {
  nvidia: 100,
  groq: 95,
  anthropic: 90,
  openai: 85,
  gemini: 80,
};

const SLIDING_WINDOW_MS = 60_000; // 60 seconds
const CONSECUTIVE_FAILURE_THRESHOLD = 3;

export class ProviderHealthManager {
  private readonly states = new Map<string, ProviderState>();

  private normalizeKey(provider: string): string {
    return String(provider || '').trim().toLowerCase();
  }

  private state(provider: ProviderName | string): ProviderState {
    const key = this.normalizeKey(provider);
    const existing = this.states.get(key);
    if (existing) return existing;
    const created: ProviderState = {
      canonicalName: provider,
      failures: 0,
      failureTimestamps: [],
      openUntil: 0,
      cooldownMs: 10_000,
      quarantineUntil: 0,
      stats: { ...DEFAULT_STATS },
      wasOpen: false,
    };
    this.states.set(key, created);
    return created;
  }

  canAttempt(provider: ProviderName | string, now = Date.now()): boolean {
    const s = this.state(provider);
    if (s.quarantineUntil > now) return false;
    return s.openUntil <= now;
  }

  getCircuitState(provider: ProviderName | string, now = Date.now()): 'CLOSED' | 'OPEN' | 'HALF_OPEN' {
    const s = this.state(provider);
    if (s.quarantineUntil > now || s.openUntil > now) return 'OPEN';
    if (s.wasOpen && s.openUntil <= now) return 'HALF_OPEN';
    return 'CLOSED';
  }

  recordSuccess(provider: ProviderName | string, latencyMs: number, now = Date.now()): void {
    const s = this.state(provider);
    s.stats.requests++;
    s.stats.successes++;
    s.stats.totalLatencyMs += Math.max(0, latencyMs);
    s.failures = 0;
    s.failureTimestamps = [];

    if (s.wasOpen && s.openUntil <= now) {
      logger.info({ provider: s.canonicalName }, '[CIRCUIT_BREAKER] Circuit RECOVERED to CLOSED state');
      s.wasOpen = false;
    }

    s.openUntil = 0;
    s.cooldownMs = Math.max(10_000, Math.floor(s.cooldownMs / 2));
  }

  recordValidationFailure(provider: ProviderName | string): void {
    const s = this.state(provider);
    s.stats.requests++;
    s.stats.validationFailures++;
    const totalFailures =
      s.stats.validationFailures + s.stats.parseFailures + s.stats.transportFailures + s.stats.timeoutFailures;
    const failureRate = totalFailures / Math.max(1, s.stats.requests);
    if (s.stats.validationFailures >= 8 && failureRate > 0.45) {
      s.quarantineUntil = Date.now() + 10 * 60_000;
      return;
    }
    // Validation failures indicate the provider responded but sent bad format —
    // these do not increment consecutive 5xx/timeout breaker failures.
  }

  recordParseFailure(provider: ProviderName | string): void {
    const s = this.state(provider);
    s.stats.requests++;
    s.stats.parseFailures++;
    if (s.stats.parseFailures >= 5 && s.stats.successes === 0) {
      s.quarantineUntil = Date.now() + 5 * 60_000;
    }
  }

  recordTransportFailure(provider: ProviderName | string, now = Date.now()): void {
    const s = this.state(provider);
    s.stats.requests++;
    s.stats.transportFailures++;
    this.tripCircuit(s, now);
  }

  recordTimeoutFailure(provider: ProviderName | string, now = Date.now()): void {
    const s = this.state(provider);
    s.stats.requests++;
    s.stats.timeoutFailures++;
    this.tripCircuit(s, now);
  }

  recordRateLimitFailure(provider: ProviderName | string, quotaExceeded: boolean, now = Date.now()): void {
    const s = this.state(provider);
    s.stats.requests++;
    s.stats.rateLimitFailures++;
    if (quotaExceeded) {
      s.quarantineUntil = now + 15 * 60_000;
      return;
    }
    this.tripCircuit(s, now);
  }

  orderedProviders(candidates: (ProviderName | string)[]): string[] {
    return [...candidates].map((c) => String(c)).sort((a, b) => this.score(b) - this.score(a));
  }

  statsSnapshot(): Record<string, ProviderStats & { score: number; circuitOpen: boolean; quarantined: boolean; circuitState: string }> {
    const now = Date.now();
    const result: Record<string, ProviderStats & { score: number; circuitOpen: boolean; quarantined: boolean; circuitState: string }> = {};
    for (const [key, state] of this.states.entries()) {
      result[state.canonicalName] = {
        ...state.stats,
        score: this.score(key),
        circuitOpen: state.openUntil > now,
        quarantined: state.quarantineUntil > now,
        circuitState: this.getCircuitState(state.canonicalName, now),
      };
    }
    return result;
  }

  reset(provider: ProviderName | string): void {
    const key = this.normalizeKey(provider);
    this.states.delete(key);
  }

  resetAll(): void {
    this.states.clear();
  }

  private tripCircuit(state: ProviderState, now = Date.now()): void {
    state.failures++;
    // Maintain sliding window of failure timestamps within SLIDING_WINDOW_MS (60s)
    state.failureTimestamps = state.failureTimestamps.filter((ts) => now - ts <= SLIDING_WINDOW_MS);
    state.failureTimestamps.push(now);

    if (state.failureTimestamps.length >= CONSECUTIVE_FAILURE_THRESHOLD) {
      state.openUntil = now + state.cooldownMs;
      state.cooldownMs = Math.min(state.cooldownMs * 2, 120_000);
      if (!state.wasOpen || state.openUntil > now) {
        logger.warn(
          {
            provider: state.canonicalName,
            openUntil: state.openUntil,
            failuresInWindow: state.failureTimestamps.length,
            windowMs: SLIDING_WINDOW_MS,
            cooldownMs: state.cooldownMs,
          },
          `[CIRCUIT_BREAKER] Circuit TRIPPED to OPEN state for provider '${state.canonicalName}'. Failover active.`
        );
        state.wasOpen = true;
      }
    }
  }

  private score(provider: ProviderName | string): number {
    const key = this.normalizeKey(provider);
    const s = this.state(key);
    const stats = s.stats;
    const avgLatency = stats.successes > 0 ? stats.totalLatencyMs / stats.successes : 60_000;
    const priority = BASE_PRIORITY[key] ?? 70;
    return (
      priority +
      stats.successes * 5 -
      stats.validationFailures * 2 -
      stats.parseFailures * 3 -
      stats.transportFailures * 4 -
      stats.timeoutFailures * 5 -
      stats.rateLimitFailures * 4 -
      Math.floor(avgLatency / 1000)
    );
  }
}


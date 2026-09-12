import { describe, expect, it } from 'vitest';
import { ProviderHealthManager } from '../services/ai/provider-health';

describe('ProviderHealthManager', () => {
  it('does not open circuit on validation-only failures', () => {
    const manager = new ProviderHealthManager();
    manager.recordValidationFailure('NVIDIA');
    manager.recordValidationFailure('NVIDIA');
    manager.recordValidationFailure('NVIDIA');

    expect(manager.canAttempt('NVIDIA')).toBe(true);
    expect(manager.getCircuitState('NVIDIA')).toBe('CLOSED');
  });

  it('opens circuit on 3 consecutive timeout failures within 60 seconds', () => {
    const manager = new ProviderHealthManager();
    const now = Date.now();
    manager.recordTimeoutFailure('NVIDIA', now);
    manager.recordTimeoutFailure('NVIDIA', now + 1000);
    manager.recordTimeoutFailure('NVIDIA', now + 2000);

    expect(manager.canAttempt('NVIDIA', now + 2500)).toBe(false);
    expect(manager.getCircuitState('NVIDIA', now + 2500)).toBe('OPEN');
  });

  it('handles case-insensitive provider names seamlessly', () => {
    const manager = new ProviderHealthManager();
    const now = Date.now();
    manager.recordTimeoutFailure('NVIDIA', now);
    manager.recordTimeoutFailure('nvidia', now + 500);
    manager.recordTimeoutFailure('Nvidia', now + 1000);

    expect(manager.canAttempt('NVIDIA', now + 1500)).toBe(false);
    expect(manager.canAttempt('nvidia', now + 1500)).toBe(false);
    expect(manager.getCircuitState('nvidia', now + 1500)).toBe('OPEN');
  });

  it('clears consecutive failure window upon success', () => {
    const manager = new ProviderHealthManager();
    const now = Date.now();
    manager.recordTimeoutFailure('NVIDIA', now);
    manager.recordTimeoutFailure('NVIDIA', now + 1000);

    // Success resets consecutive failure counter
    manager.recordSuccess('NVIDIA', 150, now + 1500);

    // Third failure after success should not trip breaker since window was reset
    manager.recordTimeoutFailure('NVIDIA', now + 2000);

    expect(manager.canAttempt('NVIDIA', now + 2500)).toBe(true);
    expect(manager.getCircuitState('NVIDIA', now + 2500)).toBe('CLOSED');
  });

  it('prunes failures older than 60 seconds from the sliding window', () => {
    const manager = new ProviderHealthManager();
    const t0 = 1_000_000;
    manager.recordTimeoutFailure('NVIDIA', t0);
    manager.recordTimeoutFailure('NVIDIA', t0 + 1000);

    // 61 seconds later, 1st two failures expired from 60s sliding window
    const t1 = t0 + 61_000;
    manager.recordTimeoutFailure('NVIDIA', t1);

    expect(manager.canAttempt('NVIDIA', t1 + 100)).toBe(true);
    expect(manager.getCircuitState('NVIDIA', t1 + 100)).toBe('CLOSED');
  });
});


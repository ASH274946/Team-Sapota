import { describe, it, expect } from 'vitest';
import { estimateCost } from '../../api/common/ai-cost-tracker';

describe('AI Cost Estimation', () => {
  it('should calculate GPT-4 costs correctly', () => {
    const cost = estimateCost('gpt-4', 1000, 500);
    // 1000 input tokens * $0.03/1K = $0.03 + 500 output * $0.06/1K = $0.03 = $0.06
    expect(cost).toBeCloseTo(0.06, 5);
  });

  it('should use DEFAULT pricing for unknown models', () => {
    const cost = estimateCost('unknown-model', 1000, 1000);
    expect(cost).toBeGreaterThan(0);
  });
});

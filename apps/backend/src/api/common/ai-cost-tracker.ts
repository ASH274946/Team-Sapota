import { getRedisClient } from '../../config/redis';
import { logger } from '../../utils/logger';

interface AiCostRecord {
  provider: string;
  model: string;
  tokensPrompt: number;
  tokensCompletion: number;
  costUsd: number;
  durationMs: number;
  userId?: string;
  organizationId?: string;
  operation: string;
  timestamp: string;
}

// Cost per 1K tokens (approximate, update as pricing changes)
const MODEL_PRICING: Record<string, { input: number; output: number }> = {
  'gpt-4': { input: 0.03, output: 0.06 },
  'gpt-4-turbo': { input: 0.01, output: 0.03 },
  'gpt-3.5-turbo': { input: 0.0015, output: 0.002 },
  'claude-3-opus': { input: 0.015, output: 0.075 },
  'claude-3-sonnet': { input: 0.003, output: 0.015 },
  'claude-3-haiku': { input: 0.00025, output: 0.00125 },
  'nvidia-nim': { input: 0.001, output: 0.002 },
  'mixtral-8x7b': { input: 0.0005, output: 0.001 },
  'llama3-70b': { input: 0.0008, output: 0.0016 },
  DEFAULT: { input: 0.002, output: 0.004 },
};

export function estimateCost(model: string, promptTokens: number, completionTokens: number): number {
  const pricing = MODEL_PRICING[model] || MODEL_PRICING['DEFAULT'];
  return ((promptTokens / 1000) * pricing.input) + ((completionTokens / 1000) * pricing.output);
}

export async function trackAiCost(record: AiCostRecord): Promise<void> {
  try {
    const client = getRedisClient();
    const today = new Date().toISOString().slice(0, 10);
    const key = `ai:costs:${today}`;
    const orgKey = `ai:costs:org:${record.organizationId || 'unknown'}:${today}`;

    // Store individual record (expire in 90 days)
    const recordId = `${Date.now()}:${Math.random().toString(36).slice(2, 8)}`;
    await client.hset(key, recordId, JSON.stringify(record));
    await client.expire(key, 90 * 86400);

    // Aggregate by org
    if (record.organizationId) {
      await client.hincrbyfloat(orgKey, 'totalCost', record.costUsd);
      await client.hincrby(orgKey, 'totalTokens', record.tokensPrompt + record.tokensCompletion);
      await client.hincrby(orgKey, 'totalRequests', 1);
      await client.expire(orgKey, 90 * 86400);
    }

    // Global aggregates
    await client.hincrbyfloat(`${key}:agg`, 'totalCost', record.costUsd);
    await client.hincrby(`${key}:agg`, 'totalTokens', record.tokensPrompt + record.tokensCompletion);
    await client.hincrby(`${key}:agg`, 'totalRequests', 1);
    await client.expire(`${key}:agg`, 90 * 86400);

    // Log if cost exceeds threshold
    if (record.costUsd > 0.05) {
      logger.warn(`[AI-COST] High cost request: $${record.costUsd.toFixed(4)} for ${record.operation} using ${record.model}`);
    }
  } catch (error) {
    // Non-blocking - don't let cost tracking break the app
    logger.error({ error }, '[AI-COST] Failed to track cost');
  }
}

export async function getDailyAiCosts(date?: string): Promise<{ totalCost: number; totalTokens: number; totalRequests: number }> {
  const client = getRedisClient();
  const day = date || new Date().toISOString().slice(0, 10);
  const agg = await client.hgetall(`ai:costs:${day}:agg`);
  return {
    totalCost: parseFloat(agg.totalCost || '0'),
    totalTokens: parseInt(agg.totalTokens || '0', 10),
    totalRequests: parseInt(agg.totalRequests || '0', 10),
  };
}

export async function getOrgAiCostSummary(organizationId: string, date?: string): Promise<{ totalCost: number; totalTokens: number; totalRequests: number }> {
  const client = getRedisClient();
  const day = date || new Date().toISOString().slice(0, 10);
  const agg = await client.hgetall(`ai:costs:org:${organizationId}:${day}`);
  return {
    totalCost: parseFloat(agg.totalCost || '0'),
    totalTokens: parseInt(agg.totalTokens || '0', 10),
    totalRequests: parseInt(agg.totalRequests || '0', 10),
  };
}

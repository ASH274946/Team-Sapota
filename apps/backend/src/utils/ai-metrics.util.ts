/**
 * AIMetricsUtil
 * Centralized utility for counting tokens and estimating LLM inference costs.
 * Resolves technical debt from Phase 29 audit (duplicate logic across services).
 */

export class AIMetricsUtil {
  
  /**
   * Extremely rough heuristic for token counting.
   * In a real production system, you'd use a library like `tiktoken` (OpenAI).
   * 1 token is roughly 4 characters in English.
   */
  public static countTokens(text: string): number {
    if (!text) return 0;
    return Math.ceil(text.length / 4);
  }

  /**
   * Estimates cost based on current standard OpenAI pricing (e.g., GPT-4o-mini).
   * Useful for internal dashboard displays.
   */
  public static estimateCost(inputTokens: number, outputTokens: number): number {
    const COST_PER_1M_INPUT = 0.15;  // $0.15 per 1M input tokens
    const COST_PER_1M_OUTPUT = 0.60; // $0.60 per 1M output tokens

    const inputCost = (inputTokens / 1_000_000) * COST_PER_1M_INPUT;
    const outputCost = (outputTokens / 1_000_000) * COST_PER_1M_OUTPUT;
    
    return inputCost + outputCost;
  }

  /**
   * Converts a token count to our internal "AI Credit" system value.
   * Business Logic: 1000 tokens = 1 Credit.
   */
  public static tokensToCredits(tokens: number): number {
    return Math.ceil(tokens / 1000);
  }
}

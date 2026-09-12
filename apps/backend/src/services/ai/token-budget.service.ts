import { ModelConfig } from './model-registry.service';

export class TokenBudgetService {
  /**
   * Extremely simple token estimator. 
   * In a real app, use tiktoken or similar based on the provider.
   */
  static estimateTokens(text: string): number {
    return Math.ceil(text.length / 4);
  }

  static truncateContextToFitBudget(
    contextString: string, 
    modelConfig: ModelConfig, 
    reservedOutputTokens = 2000
  ): string {
    const maxTokensAllowed = modelConfig.contextWindow - reservedOutputTokens - 1000; // 1000 reserved for prompt template
    const currentTokens = this.estimateTokens(contextString);

    if (currentTokens <= maxTokensAllowed) {
      return contextString; // It fits!
    }

    // Truncate safely (roughly 4 chars per token)
    const allowedChars = maxTokensAllowed * 4;
    return contextString.substring(0, allowedChars) + '\n\n[CONTEXT COMPRESSED DUE TO TOKEN LIMITS]';
  }
}

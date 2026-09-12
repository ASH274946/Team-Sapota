import { ModelRegistryService } from './model-registry.service';
import { TokenBudgetService } from './token-budget.service';
import { PromptBuilderService } from './prompt-builder.service';
import { OpenAIProvider } from './providers/openai.provider';
import { GroqProvider } from './providers/groq.provider';
import { NvidiaProvider } from './providers/nvidia.provider';
import { GeminiProvider } from './providers/gemini.provider';
import { AIProvider } from './providers/provider.interface';
import { ProviderHealthManager } from './provider-health';
import { withTimeout, createTimeoutSignal } from '../../utils/timeout';
import { logger } from '../../utils/logger';
import { env } from '../../config/env';

export interface AIRequestOptions {
  intent: string;
  context: string;
  taskInstructions: string;
  responseFormat?: any; // e.g., JSON Schema
  temperature?: number;
  media?: {
    type: 'image_url';
    url: string; // Base64 or actual URL
  }[];
  signal?: AbortSignal; // Optional upstream cancellation signal
}

const DEFAULT_SECONDARY_TIMEOUT_MS = 30_000;
// Preferred fallback order when the registry-selected provider fails or circuit is open.
const FALLBACK_ORDER: string[] = ['groq', 'openai', 'nvidia', 'gemini'];

export class AIOrchestrator {
  private static providers: Record<string, AIProvider> = {
    openai: new OpenAIProvider(),
    groq: new GroqProvider(),
    nvidia: new NvidiaProvider(),
    gemini: new GeminiProvider(),
  };

  // Circuit breaker manager tracking health and state transitions across providers
  private static health = new ProviderHealthManager();

  static getHealthManager(): ProviderHealthManager {
    return this.health;
  }

  static getHealthSnapshot() {
    return this.health.statsSnapshot();
  }

  static async generate(options: AIRequestOptions): Promise<any> {
    const totalStartMs = Date.now();

    try {
      // 1. Model Selection based on Intent
      const modelConfig = ModelRegistryService.getModelForIntent(options.intent);
      const primaryProvider = modelConfig.provider;

      // 2. Token Budgeting & Context Compression
      const compressedContext = TokenBudgetService.truncateContextToFitBudget(options.context, modelConfig);

      // 3. Prompt Building
      let finalPrompt = PromptBuilderService.buildPrompt(options.intent, compressedContext, options.taskInstructions);

      // Handle JSON Schema fallback since some endpoints reject raw `json_schema`
      let finalResponseFormat = options.responseFormat;
      if (options.responseFormat?.type === 'json_schema') {
        const schemaString = JSON.stringify(options.responseFormat.json_schema.schema, null, 2);
        finalPrompt += `\n\nIMPORTANT: You must return ONLY valid JSON that precisely matches this JSON Schema:\n${schemaString}`;
        finalResponseFormat = { type: 'json_object' };
      }

      // 4. Determine provider evaluation order (filter out unconfigured providers, allow in test environment)
      const isTestEnv = env.NODE_ENV === 'test';
      const configuredProviders = Object.entries(this.providers)
        .filter(([_, p]) => (isTestEnv ? true : (p.isConfigured ? p.isConfigured() : true)))
        .map(([name]) => name);

      const orderedProviders = [
        primaryProvider,
        ...FALLBACK_ORDER.filter((p) => p !== primaryProvider),
      ].filter((p) => (isTestEnv ? true : configuredProviders.includes(p)));

      if (orderedProviders.length === 0) {
        throw new Error('No AI providers configured with valid API keys. Please set NVIDIA_API_KEY, GROQ_API_KEY, or OPENAI_API_KEY in your .env file.');
      }

      let lastError: Error | null = null;
      const primaryTimeoutMs = env.AI_PRIMARY_TIMEOUT_MS || 12_000;

      for (const providerName of orderedProviders) {
        const provider = this.providers[providerName];
        if (!provider) continue;

        const isPrimary = providerName === primaryProvider;
        const circuitState = this.health.getCircuitState(providerName);

        // Circuit breaker check: skip provider if circuit is OPEN / quarantined
        if (!this.health.canAttempt(providerName)) {
          const fallbackTarget = orderedProviders.find((p) => p !== providerName && this.health.canAttempt(p)) || 'none';
          logger.warn(
            {
              primaryProvider,
              skippedProvider: providerName,
              fallbackProvider: fallbackTarget,
              circuitState,
            },
            `[AI_FAILOVER] Skipping provider '${providerName}' (circuit ${circuitState}). Proactively failing over to '${fallbackTarget}'.`
          );
          continue;
        }

        // Configurable 12s timeout for primary provider; 30s timeout for secondary providers
        const currentTimeoutMs = isPrimary ? primaryTimeoutMs : DEFAULT_SECONDARY_TIMEOUT_MS;
        const model = isPrimary ? modelConfig.modelName : undefined;
        const timeoutSignal = createTimeoutSignal(currentTimeoutMs, options.signal);
        const providerStartMs = Date.now();

        try {
          const result = await withTimeout(
            provider.generate(
              finalPrompt,
              {
                model,
                temperature: options.temperature,
                responseFormat: finalResponseFormat,
                media: options.media,
              },
              timeoutSignal
            ),
            currentTimeoutMs,
            `AI generation (${providerName})`,
            timeoutSignal
          );

          const providerDurationMs = Date.now() - providerStartMs;
          this.health.recordSuccess(providerName, providerDurationMs);

          if (!isPrimary) {
            logger.info(
              {
                primaryProvider,
                successfulProvider: providerName,
                totalDurationMs: Date.now() - totalStartMs,
                providerDurationMs,
              },
              `[AI_FAILOVER] Failover execution via '${providerName}' completed successfully in ${providerDurationMs}ms.`
            );
          }

          // 5. Response Parsing & Validation
          if (modelConfig.supportsJSON) {
            try {
              let cleanResult = result;
              if (typeof result === 'string') {
                cleanResult = result.replace(/```json/gi, '').replace(/```/g, '').trim();
                const match = cleanResult.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
                if (match) {
                  cleanResult = match[0];
                }
              }
              let parsed: any;
              try {
                parsed = JSON.parse(cleanResult);
              } catch {
                const { jsonrepair } = await import('jsonrepair');
                const repaired = jsonrepair(cleanResult);
                parsed = JSON.parse(repaired);
              }
              if (parsed && typeof parsed === 'object') {
                if (parsed.paper && typeof parsed.paper === 'object') parsed = parsed.paper;
                else if (parsed.data && typeof parsed.data === 'object' && !parsed.sections) parsed = parsed.data;
                else if (parsed.result && typeof parsed.result === 'object' && !parsed.sections) parsed = parsed.result;
              }
              return parsed;
            } catch (e) {
              logger.error({ result }, `Failed to parse AI response as JSON from ${providerName}`);
              this.health.recordValidationFailure(providerName);
              lastError = new Error(`AI Response Validation Failed (${providerName}): Invalid JSON`);
              continue;
            }
          }

          return result;
        } catch (error) {
          lastError = error as Error;
          const providerDurationMs = Date.now() - providerStartMs;
          const isTimeout =
            (error as Error).message?.includes('timed out') ||
            (error as Error).name === 'AbortError' ||
            timeoutSignal.aborted;

          if (isTimeout) {
            this.health.recordTimeoutFailure(providerName);
          } else {
            this.health.recordTransportFailure(providerName);
          }

          const updatedCircuitState = this.health.getCircuitState(providerName);
          const fallbackTarget = orderedProviders.find((p) => p !== providerName && this.health.canAttempt(p)) || 'none';

          logger.warn(
            {
              primaryProvider,
              failedProvider: providerName,
              fallbackProvider: fallbackTarget,
              durationMs: providerDurationMs,
              timeoutLimitMs: currentTimeoutMs,
              isTimeout,
              error: (error as Error).message,
              circuitState: updatedCircuitState,
            },
            `[AI_FAILOVER] Provider '${providerName}' failed/timed out after ${providerDurationMs}ms (${(error as Error).message}). Failing over to '${fallbackTarget}'.`
          );
        }
      }

      throw new Error(
        `AI generation failed after trying providers [${orderedProviders.join(', ')}]. ` +
          `Last error: ${lastError?.message}`
      );
    } catch (error) {
      logger.error(`AIOrchestrator generation failed: ${(error as Error).message}`);
      throw error;
    }
  }

  /**
   * Streams LLM tokens with the same provider failover semantics as generate().
   */
  static async *stream(options: AIRequestOptions): AsyncGenerator<string> {
    const modelConfig = ModelRegistryService.getModelForIntent(options.intent);
    const primaryProvider = modelConfig.provider;
    const compressedContext = TokenBudgetService.truncateContextToFitBudget(options.context, modelConfig);
    const finalPrompt = PromptBuilderService.buildPrompt(options.intent, compressedContext, options.taskInstructions);

    const isTestEnv = env.NODE_ENV === 'test';
    const configuredProviders = Object.entries(this.providers)
      .filter(([_, p]) => (isTestEnv ? true : (p.isConfigured ? p.isConfigured() : true)))
      .map(([name]) => name);

    const orderedProviders = [
      primaryProvider,
      ...FALLBACK_ORDER.filter((p) => p !== primaryProvider),
    ].filter((p) => (isTestEnv ? true : configuredProviders.includes(p)));

    let lastError: Error | null = null;
    const primaryTimeoutMs = env.AI_PRIMARY_TIMEOUT_MS || 12_000;

    for (const providerName of orderedProviders) {
      const provider = this.providers[providerName];
      if (!provider) continue;

      const isPrimary = providerName === primaryProvider;
      if (!this.health.canAttempt(providerName)) continue;

      const currentTimeoutMs = isPrimary ? primaryTimeoutMs : DEFAULT_SECONDARY_TIMEOUT_MS;
      const model = isPrimary ? modelConfig.modelName : undefined;
      const timeoutSignal = createTimeoutSignal(currentTimeoutMs, options.signal);
      const providerStartMs = Date.now();

      try {
        for await (const token of provider.stream(finalPrompt, {
          model,
          temperature: options.temperature,
          signal: timeoutSignal,
        })) {
          if (timeoutSignal.aborted) {
            throw new Error(`AI streaming (${providerName}) timed out`);
          }
          if (typeof token === 'string' && token.length > 0) {
            yield token;
          }
        }

        this.health.recordSuccess(providerName, Date.now() - providerStartMs);
        return;
      } catch (error) {
        lastError = error as Error;
        const isTimeout =
          (error as Error).message?.includes('timed out') ||
          (error as Error).name === 'AbortError' ||
          timeoutSignal.aborted;

        if (isTimeout) {
          this.health.recordTimeoutFailure(providerName);
        } else {
          this.health.recordTransportFailure(providerName);
        }

        logger.warn(
          { failedProvider: providerName, error: (error as Error).message },
          `[AI_FAILOVER] Streaming provider '${providerName}' failed; trying next provider.`
        );
      }
    }

    throw new Error(
      `AI streaming failed after trying providers [${orderedProviders.join(', ')}]. ` +
        `Last error: ${lastError?.message}`
    );
  }
}


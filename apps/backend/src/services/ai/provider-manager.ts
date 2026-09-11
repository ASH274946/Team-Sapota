import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { env } from '../../config/env';
import { logger } from '../../utils/logger';
import { ProviderHealthManager } from './provider-health';
import prisma from '../../config/prisma';

export interface AIResponse {
  text: string;
  tokensPrompt: number;
  tokensCompletion: number;
  providerName: string;
  modelName: string;
}

export abstract class BaseAIProvider {
  abstract providerName: string;
  abstract modelName: string;
  abstract getCost(tokensPrompt: number, tokensCompletion: number): number;
  abstract generate(systemPrompt: string, userPrompt: string, temperature: number, signal?: AbortSignal): Promise<{ text: string; tokensPrompt: number; tokensCompletion: number }>;
}

/**
 * Anthropic Provider (Claude 3.5 Sonnet)
 */
export class AnthropicProvider extends BaseAIProvider {
  providerName = 'Anthropic';
  modelName = 'claude-3-5-sonnet-20241022';
  private client: Anthropic | null = null;

  constructor() {
    super();
    if (env.ANTHROPIC_API_KEY) {
      this.client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
    }
  }

  getCost(tokensPrompt: number, tokensCompletion: number): number {
    return (tokensPrompt * 3.0 + tokensCompletion * 15.0) / 1_000_000;
  }

  async generate(systemPrompt: string, userPrompt: string, temperature: number, _signal?: AbortSignal): Promise<{ text: string; tokensPrompt: number; tokensCompletion: number }> {
    if (!this.client) throw new Error('Anthropic API Key not configured');

    const response = await this.client.messages.create({
      model: this.modelName,
      max_tokens: 4096,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
      temperature,
    });

    const text = response.content[0]?.type === 'text' ? response.content[0].text : '';
    const tokensPrompt = response.usage?.input_tokens ?? Math.ceil(userPrompt.length / 4);
    const tokensCompletion = response.usage?.output_tokens ?? Math.ceil(text.length / 4);

    return { text, tokensPrompt, tokensCompletion };
  }
}

/**
 * NVIDIA Provider (Llama 3.1 8B Instruct)
 */
export class NvidiaProvider extends BaseAIProvider {
  providerName = 'NVIDIA';
  modelName = 'meta/llama-3.1-8b-instruct';
  private client: OpenAI | null = null;

  constructor() {
    super();
    if (env.NVIDIA_API_KEY) {
      this.client = new OpenAI({
        apiKey: env.NVIDIA_API_KEY,
        baseURL: 'https://integrate.api.nvidia.com/v1',
      });
    }
  }

  getCost(tokensPrompt: number, tokensCompletion: number): number {
    return ((tokensPrompt + tokensCompletion) * 0.07) / 1_000_000;
  }

  async generate(systemPrompt: string, userPrompt: string, temperature: number, _signal?: AbortSignal): Promise<{ text: string; tokensPrompt: number; tokensCompletion: number }> {
    if (!this.client) throw new Error('NVIDIA API Key not configured');

    const response = await this.client.chat.completions.create({
      model: this.modelName,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature,
      max_tokens: 4096,
    });

    const text = response.choices[0]?.message?.content ?? '';
    const tokensPrompt = response.usage?.prompt_tokens ?? Math.ceil(userPrompt.length / 4);
    const tokensCompletion = response.usage?.completion_tokens ?? Math.ceil(text.length / 4);

    return { text, tokensPrompt, tokensCompletion };
  }
}

/**
 * Groq Provider (Llama 3.3 70B)
 */
export class GroqProvider extends BaseAIProvider {
  providerName = 'Groq';
  modelName = 'llama-3.3-70b-versatile';
  private client: OpenAI | null = null;

  constructor() {
    super();
    if (env.GROQ_API_KEY) {
      this.client = new OpenAI({
        apiKey: env.GROQ_API_KEY,
        baseURL: 'https://api.groq.com/openai/v1',
      });
    }
  }

  getCost(tokensPrompt: number, tokensCompletion: number): number {
    return (tokensPrompt * 0.59 + tokensCompletion * 0.79) / 1_000_000;
  }

  async generate(systemPrompt: string, userPrompt: string, temperature: number, _signal?: AbortSignal): Promise<{ text: string; tokensPrompt: number; tokensCompletion: number }> {
    if (!this.client) throw new Error('Groq API Key not configured');

    const response = await this.client.chat.completions.create({
      model: this.modelName,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature,
      max_tokens: 4096,
    });

    const text = response.choices[0]?.message?.content ?? '';
    const tokensPrompt = response.usage?.prompt_tokens ?? Math.ceil(userPrompt.length / 4);
    const tokensCompletion = response.usage?.completion_tokens ?? Math.ceil(text.length / 4);

    return { text, tokensPrompt, tokensCompletion };
  }
}

/**
 * OpenAI Provider (GPT-4o Mini)
 */
export class OpenAIProvider extends BaseAIProvider {
  providerName = 'OpenAI';
  modelName = 'gpt-4o-mini';
  private client: OpenAI | null = null;

  constructor() {
    super();
    if (env.OPENAI_API_KEY) {
      this.client = new OpenAI({ apiKey: env.OPENAI_API_KEY });
    }
  }

  getCost(tokensPrompt: number, tokensCompletion: number): number {
    return (tokensPrompt * 0.15 + tokensCompletion * 0.60) / 1_000_000;
  }

  async generate(systemPrompt: string, userPrompt: string, temperature: number, _signal?: AbortSignal): Promise<{ text: string; tokensPrompt: number; tokensCompletion: number }> {
    if (!this.client) throw new Error('OpenAI API Key not configured');

    const response = await this.client.chat.completions.create({
      model: this.modelName,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature,
      max_tokens: 4096,
    });

    const text = response.choices[0]?.message?.content ?? '';
    const tokensPrompt = response.usage?.prompt_tokens ?? Math.ceil(userPrompt.length / 4);
    const tokensCompletion = response.usage?.completion_tokens ?? Math.ceil(text.length / 4);

    return { text, tokensPrompt, tokensCompletion };
  }
}

/**
 * Google Gemini Provider
 */
export class GeminiProvider extends BaseAIProvider {
  providerName = 'Gemini';
  modelName = 'gemini-2.5-flash';

  getCost(tokensPrompt: number, tokensCompletion: number): number {
    return (tokensPrompt * 0.075 + tokensCompletion * 0.3) / 1_000_000;
  }

  async generate(systemPrompt: string, userPrompt: string, temperature: number, _signal?: AbortSignal): Promise<{ text: string; tokensPrompt: number; tokensCompletion: number }> {
    const key = process.env.GEMINI_API_KEY || '';
    if (!key) throw new Error('Gemini API Key not configured');

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.modelName}:generateContent?key=${key}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
        generationConfig: { temperature, maxOutputTokens: 4096 },
      }),
    });

    if (!response.ok) {
      throw new Error(`Gemini API returned error status: ${response.status}`);
    }

    const json = (await response.json()) as any;
    const text = json.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
    const tokensPrompt = Math.ceil(userPrompt.length / 4);
    const tokensCompletion = Math.ceil(text.length / 4);

    return { text, tokensPrompt, tokensCompletion };
  }
}

export class AIProviderManager {
  private providers: BaseAIProvider[] = [];
  private health = new ProviderHealthManager();

  constructor() {
    this.providers = [
      new NvidiaProvider(),
      new GroqProvider(),
      new AnthropicProvider(),
      new OpenAIProvider(),
      new GeminiProvider(),
    ].filter((p) => {
      if (p.providerName === 'NVIDIA' && !env.NVIDIA_API_KEY) return false;
      if (p.providerName === 'Groq' && !env.GROQ_API_KEY) return false;
      if (p.providerName === 'Anthropic' && !env.ANTHROPIC_API_KEY) return false;
      if (p.providerName === 'OpenAI' && !env.OPENAI_API_KEY) return false;
      if (p.providerName === 'Gemini' && !process.env.GEMINI_API_KEY) return false;
      return true;
    });
  }

  async executeChat(
    userPrompt: string,
    systemPrompt: string,
    options: {
      temperature?: number;
      userId?: string;
      organizationId?: string;
      promptVersionId?: string;
    } = {}
  ): Promise<AIResponse> {
    const temp = options.temperature ?? 0.3;
    const userId = options.userId || 'demo-faculty-id';
    const organizationId = options.organizationId || 'demo-org-id';

    const candidates = this.providers.filter((p) => this.health.canAttempt(p.providerName as any));
    if (candidates.length === 0) {
      throw new Error('All AI providers are currently exhausted or unhealthy');
    }

    let lastError: Error | null = null;

    for (const provider of candidates) {
      const t0 = Date.now();
      try {
        const result = await provider.generate(systemPrompt, userPrompt, temp);
        const duration = Date.now() - t0;
        this.health.recordSuccess(provider.providerName as any, duration);

        const cost = provider.getCost(result.tokensPrompt, result.tokensCompletion);

        if (options.promptVersionId) {
          prisma.promptExecution.create({
            data: {
              promptVersionId: options.promptVersionId,
              providerName: provider.providerName,
              modelName: provider.modelName,
              tokensPrompt: result.tokensPrompt,
              tokensCompletion: result.tokensCompletion,
              costUsd: cost,
              durationMs: duration,
              status: 'SUCCESS',
              userId,
              organizationId,
            },
          }).catch((err) => logger.warn(`[AI_TELEMETRY] Failed to write prompt logs: ${err}`));
        }

        return {
          text: result.text,
          tokensPrompt: result.tokensPrompt,
          tokensCompletion: result.tokensCompletion,
          providerName: provider.providerName,
          modelName: provider.modelName,
        };
      } catch (err: any) {
        lastError = err;
        const duration = Date.now() - t0;
        logger.error(`[AI_FALLBACK] Provider ${provider.providerName} failed: ${err.message}`);
        this.health.recordTransportFailure(provider.providerName as any);

        if (options.promptVersionId) {
          prisma.promptExecution.create({
            data: {
              promptVersionId: options.promptVersionId,
              providerName: provider.providerName,
              modelName: provider.modelName,
              tokensPrompt: 0,
              tokensCompletion: 0,
              costUsd: 0,
              durationMs: duration,
              status: 'FAILED',
              errorMessage: err.message,
              userId,
              organizationId,
            },
          }).catch((dbErr) => logger.warn(`[AI_TELEMETRY] Failed to write failure logs: ${dbErr}`));
        }
      }
    }

    throw new Error(`AI generation failed after exhausting all providers. Last error: ${lastError?.message}`);
  }
}

let providerManagerInstance: AIProviderManager | null = null;
export function getAIProviderManager(): AIProviderManager {
  if (!providerManagerInstance) {
    providerManagerInstance = new AIProviderManager();
  }
  return providerManagerInstance;
}

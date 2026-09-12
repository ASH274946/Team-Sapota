import OpenAI from 'openai';
import { AIProvider } from './provider.interface';
import { env } from '../../../config/env';
import { logger } from '../../../utils/logger';

export class OpenAIProvider implements AIProvider {
  private client: OpenAI;

  constructor() {
    this.client = new OpenAI({ apiKey: env.OPENAI_API_KEY || '' });
  }

  async generate(prompt: string, options?: any, signal?: AbortSignal): Promise<any> {
    const model = options?.model || 'gpt-4o-mini';
    let messages: any[] = [{ role: 'user', content: prompt }];
    
    if (options?.media && options.media.length > 0) {
      messages = [{
        role: 'user',
        content: [
          { type: 'text', text: prompt },
          ...options.media.map((m: any) => ({
            type: 'image_url',
            image_url: { url: m.url }
          }))
        ]
      }];
    }

    const response = await this.client.chat.completions.create({
      model,
      messages,
      temperature: options?.temperature || 0.7,
      response_format: options?.responseFormat,
    }, { signal });
    return response.choices[0].message.content;
  }

  async *stream(prompt: string, options?: any): AsyncIterable<any> {
    const model = options?.model || 'gpt-4o-mini';
    const stream = await this.client.chat.completions.create(
      {
        model,
        messages: [{ role: 'user', content: prompt }],
        stream: true,
        temperature: options?.temperature || 0.7,
      },
      { signal: options?.signal }
    );

    for await (const chunk of stream) {
      yield chunk.choices[0]?.delta?.content || '';
    }
  }

  async countTokens(text: string): Promise<number> {
    // Basic heuristic: 1 token ~= 4 characters in English
    return Math.ceil(text.length / 4);
  }

  supportsVision(): boolean {
    return true;
  }

  supportsJSON(): boolean {
    return true;
  }

  supportsStructuredOutput(): boolean {
    return true; // Supported via response_format schema
  }

  supportsFunctionCalling(): boolean {
    return true;
  }

  isConfigured(): boolean {
    return Boolean(env.OPENAI_API_KEY && env.OPENAI_API_KEY.trim().length > 5);
  }

  async healthCheck(): Promise<boolean> {
    try {
      if (!env.OPENAI_API_KEY) return false;
      await this.client.models.list();
      return true;
    } catch (e) {
      logger.error({ err: e }, 'OpenAI health check failed');
      return false;
    }
  }
}

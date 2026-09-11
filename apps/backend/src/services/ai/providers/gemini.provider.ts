import { AIProvider } from './provider.interface';
import { env } from '../../../config/env';
import { logger } from '../../../utils/logger';

/** Gemini adapter used by the active AI orchestrator for paper/OCR/grading work. */
export class GeminiProvider implements AIProvider {
  private readonly model = 'gemini-2.5-flash';

  async generate(prompt: string, options?: any, signal?: AbortSignal): Promise<string> {
    if (!env.GEMINI_API_KEY) throw new Error('Gemini API Key not configured');

    const parts: any[] = [{ text: prompt }];
    for (const media of options?.media || []) {
      const match = String(media.url || '').match(/^data:([^;]+);base64,(.+)$/s);
      if (match) parts.push({ inlineData: { mimeType: match[1], data: match[2] } });
    }

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${encodeURIComponent(env.GEMINI_API_KEY)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal,
      body: JSON.stringify({
        contents: [{ role: 'user', parts }],
        generationConfig: {
          temperature: options?.temperature ?? 0.3,
          maxOutputTokens: options?.maxTokens ?? 4096,
          ...(options?.responseFormat?.type === 'json_object' ? { responseMimeType: 'application/json' } : {}),
        },
      }),
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => '');
      throw new Error(`Gemini API returned ${response.status}${detail ? `: ${detail.slice(0, 240)}` : ''}`);
    }
    const payload = await response.json() as any;
    return payload.candidates?.[0]?.content?.parts?.map((part: any) => part.text || '').join('') || '';
  }

  async *stream(prompt: string, options?: any): AsyncIterable<string> {
    yield await this.generate(prompt, options);
  }

  async countTokens(text: string): Promise<number> { return Math.ceil(text.length / 4); }
  supportsVision(): boolean { return true; }
  supportsJSON(): boolean { return true; }
  supportsStructuredOutput(): boolean { return false; }
  supportsFunctionCalling(): boolean { return false; }
  isConfigured(): boolean { return Boolean(env.GEMINI_API_KEY); }

  async healthCheck(): Promise<boolean> {
    try {
      if (!env.GEMINI_API_KEY) return false;
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${this.model}?key=${encodeURIComponent(env.GEMINI_API_KEY)}`);
      return response.ok;
    } catch (error) {
      logger.warn({ error }, 'Gemini health check failed');
      return false;
    }
  }
}

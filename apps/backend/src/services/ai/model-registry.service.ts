export interface ModelConfig {
  provider: 'openai' | 'nvidia' | 'groq' | 'gemini';
  modelName: string;
  contextWindow: number;
  maxOutputTokens: number;
  supportsVision: boolean;
  supportsJSON: boolean;
  tier: 'fast' | 'reasoning' | 'low-cost';
}

export const ModelRegistry: Record<string, ModelConfig> = {
  'gemini-2.5-flash': {
    provider: 'gemini',
    modelName: 'gemini-2.5-flash',
    contextWindow: 1000000,
    maxOutputTokens: 8000,
    supportsVision: true,
    supportsJSON: true,
    tier: 'fast',
  },
  'llama-3.1-70b-instruct': {
    provider: 'nvidia',
    modelName: 'meta/llama-3.2-11b-vision-instruct',
    contextWindow: 128000,
    maxOutputTokens: 8000,
    supportsVision: true,
    supportsJSON: true,
    tier: 'reasoning',
  },
  'gpt-oss-120b': {
    provider: 'groq',
    modelName: 'openai/gpt-oss-120b',
    contextWindow: 128000,
    maxOutputTokens: 8000,
    supportsVision: false,
    supportsJSON: true,
    tier: 'fast',
  },
  'llama-3.3-70b-versatile': {
    provider: 'groq',
    modelName: 'openai/gpt-oss-120b',
    contextWindow: 128000,
    maxOutputTokens: 8000,
    supportsVision: false,
    supportsJSON: true,
    tier: 'fast',
  },
};

export class ModelRegistryService {
  static getModelForIntent(intent: string): ModelConfig {
    if (['EvaluateAssignment', 'OCRPostProcessing'].includes(intent)) {
      return ModelRegistry['gemini-2.5-flash'];
    }
    // Lesson plans and test papers go to Groq 120B for top quality, high speed, and native JSON
    if (intent === 'GenerateLessonPlan' || intent === 'GenerateTestPaper') {
      return ModelRegistry['gpt-oss-120b'];
    }
    if (
      intent === 'GenerateQuestionPaper' ||
      intent === 'EvaluateTypedAnswer' ||
      intent === 'GenerateQuestionExplanation'
    ) {
      return ModelRegistry['llama-3.1-70b-instruct'];
    }
    return ModelRegistry['gpt-oss-120b']; // Fast low-latency generation, use Groq (gpt-oss-120b)
  }
}


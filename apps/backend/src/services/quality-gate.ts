import type { FailureCategory } from '../types/generation.types';

export class ProviderQuotaError extends Error {
  constructor(msg: string) { super(msg); this.name = 'ProviderQuotaError'; }
}

export class ProviderTimeoutError extends Error {
  constructor(msg: string) { super(msg); this.name = 'ProviderTimeoutError'; }
}

export class ProviderTruncationError extends Error {
  constructor(msg: string) { super(msg); this.name = 'ProviderTruncationError'; }
}

export class ProviderValidationError extends Error {
  constructor(msg: string) { super(msg); this.name = 'ProviderValidationError'; }
}

export class ProviderTransportError extends Error {
  constructor(msg: string) { super(msg); this.name = 'ProviderTransportError'; }
}

export class PartialGenerationError extends Error {
  public readonly generatedQuestions: number;
  public readonly requestedQuestions: number;
  public readonly generatedMarks: number;
  public readonly requestedMarks: number;
  public readonly partialPaper: object | null;

  constructor(
    msg: string,
    partial: { generatedQuestions: number; requestedQuestions: number; generatedMarks: number; requestedMarks: number; partialPaper: object | null }
  ) {
    super(msg);
    this.name = 'PartialGenerationError';
    this.generatedQuestions = partial.generatedQuestions;
    this.requestedQuestions = partial.requestedQuestions;
    this.generatedMarks = partial.generatedMarks;
    this.requestedMarks = partial.requestedMarks;
    this.partialPaper = partial.partialPaper;
  }
}

const USER_MESSAGES: Record<FailureCategory, string> = {
  timeout: 'Generation timed out before completion. Try again with fewer questions.',
  quota_exceeded: 'AI provider API quota limit exceeded. The service is temporarily unavailable.',
  provider_unavailable: 'AI provider temporarily unavailable. The system will retry automatically.',
  malformed_response: 'AI provider returned an incomplete response. Try again.',
  truncated_output: 'AI provider returned a truncated response. Try reducing the number of questions.',
  auth_error: 'AI provider authentication failed. Check API key configuration.',
  under_generation: 'Only a partial paper could be generated. Review the results below.',
  partial_generation: 'Some questions were generated successfully. View partial results below.',
  unknown: 'An unexpected error occurred during generation. Please try again.',
};

export function classifyError(error: Error): { category: FailureCategory; userMessage: string } {
  const msg = error.message.toLowerCase();

  if (msg.includes('timed out') || msg.includes('timeout') || msg.includes('etimedout')) {
    return { category: 'timeout', userMessage: USER_MESSAGES.timeout };
  }
  if (msg.includes('rate limit') || msg.includes('429') || msg.includes('quota') || msg.includes('too many requests')) {
    return { category: 'quota_exceeded', userMessage: USER_MESSAGES.quota_exceeded };
  }
  if (msg.includes('401') || msg.includes('unauthorized') || msg.includes('api key') || msg.includes('auth')) {
    return { category: 'auth_error', userMessage: USER_MESSAGES.auth_error };
  }
  if (msg.includes('not found') || msg.includes('404') || msg.includes('econnrefused') || msg.includes('econnreset')) {
    return { category: 'provider_unavailable', userMessage: USER_MESSAGES.provider_unavailable };
  }
  if (msg.includes('does not support image') || msg.includes('cannot read') || (msg.includes('image') && (msg.includes('png') || msg.includes('jpg') || msg.includes('jpeg')))) {
    return { category: 'malformed_response', userMessage: 'Uploaded content contained image references which were removed. Generation continuing with text-only content.' };
  }
  if (msg.includes('incomplete') || msg.includes('truncat') || msg.includes('token limit') || msg.includes('max tokens')) {
    return { category: 'truncated_output', userMessage: USER_MESSAGES.truncated_output };
  }
  if (msg.includes('not valid json') || msg.includes('validation') || msg.includes('malformed') || msg.includes('parse')) {
    return { category: 'malformed_response', userMessage: USER_MESSAGES.malformed_response };
  }
  if (error instanceof PartialGenerationError) {
    return { category: 'partial_generation', userMessage: USER_MESSAGES.partial_generation };
  }
  if (msg.includes('all ai providers failed') || msg.includes('no provider')) {
    return { category: 'provider_unavailable', userMessage: USER_MESSAGES.provider_unavailable };
  }

  return { category: 'unknown', userMessage: USER_MESSAGES.unknown };
}

export function getGenerationBadgeText(status: string, generatedQs: number, requestedQs: number): string {
  if (status === 'completed') return 'Completed';
  if (status === 'failed') return 'Generation Failed';
  if (status === 'partially_generated') return 'Partially Generated';
  if (generatedQs > 0 && generatedQs < requestedQs) return 'Partially Generated';
  if (status === 'generating') return 'Generating...';
  if (status === 'queued') return 'Queued';
  return status.charAt(0).toUpperCase() + status.slice(1);
}

export function getDiagnosticSummary(errorMessage: string): string {
  if (errorMessage.includes('All AI providers failed')) {
    const providers = errorMessage.split(':')[1]?.trim() || errorMessage;
    return providers.slice(0, 200);
  }
  return errorMessage.slice(0, 200);
}

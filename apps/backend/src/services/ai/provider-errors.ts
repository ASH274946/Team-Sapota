export type ProviderName = 'Anthropic' | 'NVIDIA' | 'Groq';

export abstract class ProviderError extends Error {
  constructor(
    message: string,
    public readonly provider: ProviderName,
    public readonly retryable: boolean
  ) {
    super(message);
    this.name = new.target.name;
  }
}

export class ProviderUnavailableError extends ProviderError {
  constructor(provider: ProviderName, message: string) {
    super(message, provider, true);
  }
}

export class ProviderTransportError extends ProviderError {
  constructor(provider: ProviderName, message: string) {
    super(message, provider, true);
  }
}

export class ProviderTimeoutError extends ProviderError {
  constructor(provider: ProviderName, message: string) {
    super(message, provider, true);
  }
}

export class ProviderRateLimitError extends ProviderError {
  constructor(provider: ProviderName, message: string, public readonly quotaExceeded = false) {
    super(message, provider, !quotaExceeded);
  }
}

export class ProviderParseError extends ProviderError {
  constructor(provider: ProviderName, message: string) {
    super(message, provider, true);
  }
}

export class ProviderValidationError extends ProviderError {
  constructor(provider: ProviderName, message: string, public readonly diagnostics: string[] = []) {
    super(message, provider, true);
  }
}

export function isProviderError(error: unknown): error is ProviderError {
  return error instanceof ProviderError;
}

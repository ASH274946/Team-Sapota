export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly isOperational: boolean;
  public readonly details?: unknown;

  constructor(message: string, statusCode: number, code: string, isOperational = true, details?: unknown) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = isOperational;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class AuthError extends AppError {
  constructor(message = 'Authentication required', code = 'UNAUTHORIZED') {
    super(message, 401, code);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Access denied', code = 'FORBIDDEN') {
    super(message, 403, code);
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Resource not found', code = 'NOT_FOUND') {
    super(message, 404, code);
  }
}

export class ValidationError extends AppError {
  public readonly fields?: Record<string, string[]>;
  constructor(message = 'Validation failed', fields?: Record<string, string[]>) {
    super(message, 400, 'VALIDATION_ERROR', true, fields);
    this.fields = fields;
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Resource conflict', code = 'CONFLICT') {
    super(message, 409, code);
  }
}

export class RateLimitError extends AppError {
  constructor(message = 'Too many requests') {
    super(message, 429, 'RATE_LIMIT');
  }
}

export class AiProviderError extends AppError {
  public readonly provider: string;
  public readonly retryable: boolean;
  constructor(message: string, provider: string, retryable = true) {
    super(message, 502, 'AI_PROVIDER_ERROR', true);
    this.provider = provider;
    this.retryable = retryable;
  }
}

export class DatabaseError extends AppError {
  constructor(message = 'Database operation failed', details?: unknown) {
    super(message, 500, 'DATABASE_ERROR', false, details);
  }
}

export class QueueError extends AppError {
  constructor(message = 'Queue operation failed', code = 'QUEUE_ERROR') {
    super(message, 503, code);
  }
}

export class TenantIsolationError extends AppError {
  constructor(message = 'Organization data access violation') {
    super(message, 403, 'TENANT_ISOLATION');
  }
}

// Backward-compatible alias for ApiError
export class ApiError extends AppError {
  constructor(statusCode: number, errorCode: string, message: string, details?: unknown) {
    super(message, statusCode, errorCode, true, details);
  }

  static badRequest(message: string, details?: unknown): ApiError {
    return new ApiError(400, 'BAD_REQUEST', message, details);
  }

  static unauthorized(message = 'Authentication required'): ApiError {
    return new ApiError(401, 'UNAUTHORIZED', message);
  }

  static forbidden(message = 'Insufficient permissions'): ApiError {
    return new ApiError(403, 'FORBIDDEN', message);
  }

  static notFound(message = 'Resource not found'): ApiError {
    return new ApiError(404, 'NOT_FOUND', message);
  }

  static conflict(message: string, details?: unknown): ApiError {
    return new ApiError(409, 'CONFLICT', message, details);
  }

  static tooManyRequests(message = 'Rate limit exceeded'): ApiError {
    return new ApiError(429, 'RATE_LIMITED', message);
  }

  static internal(message = 'Internal server error'): ApiError {
    return new ApiError(500, 'INTERNAL_ERROR', message);
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

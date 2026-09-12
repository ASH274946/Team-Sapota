import { Response } from 'express';
import { v4 as uuidv4 } from 'uuid';

interface SuccessOptions {
  message?: string;
  meta?: Record<string, unknown>;
  pagination?: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

interface ErrorOptions {
  errorCode?: string;
  details?: unknown;
  traceId?: string;
}

/**
 * Sends a standardised success response envelope.
 */
export const sendSuccess = (
  res: Response,
  data: unknown,
  options: SuccessOptions = {},
  statusCode = 200
): void => {
  res.status(statusCode).json({
    success: true,
    message: options.message ?? 'OK',
    data,
    meta: options.meta ?? null,
    pagination: options.pagination ?? null,
    requestId: uuidv4(),
    timestamp: new Date().toISOString(),
  });
};

/**
 * Sends a standardised error response envelope.
 */
export const sendError = (
  res: Response,
  statusCode: number,
  message: string,
  options: ErrorOptions = {}
): void => {
  res.status(statusCode).json({
    success: false,
    message,
    errorCode: options.errorCode ?? 'INTERNAL_ERROR',
    details: options.details ?? null,
    traceId: options.traceId ?? uuidv4(),
    timestamp: new Date().toISOString(),
  });
};

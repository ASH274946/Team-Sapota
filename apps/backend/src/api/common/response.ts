import { Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import type { PaginationDto, ApiSuccessResponse, ApiErrorResponse } from './dto';

export interface SuccessPayload<T> {
  data: T;
  message?: string;
  meta?: Record<string, unknown>;
  pagination?: PaginationDto;
  statusCode?: number;
}

export interface ErrorPayload {
  error: string;
  code?: string;
  fields?: Record<string, string[]>;
  statusCode?: number;
  requestId?: string;
}

export function sendSuccess<T>(res: Response, payload: SuccessPayload<T>): void {
  const body: ApiSuccessResponse<T> = {
    success: true,
    message: payload.message ?? 'OK',
    data: payload.data,
    meta: payload.meta ?? undefined,
    pagination: payload.pagination ?? undefined,
    requestId: uuidv4(),
    timestamp: new Date().toISOString(),
  };
  res.status(payload.statusCode ?? 200).json(body);
}

export function sendError(res: Response, payload: ErrorPayload): void {
  const body: ApiErrorResponse = {
    success: false,
    error: payload.error,
    code: payload.code ?? 'INTERNAL_ERROR',
    fields: payload.fields ?? undefined,
    requestId: payload.requestId ?? uuidv4(),
    timestamp: new Date().toISOString(),
  };
  res.status(payload.statusCode ?? 500).json(body);
}

export function sendCreated<T>(res: Response, data: T, message = 'Created successfully'): void {
  sendSuccess(res, { data, message, statusCode: 201 });
}

export function sendAccepted<T>(res: Response, data: T, message = 'Request accepted'): void {
  sendSuccess(res, { data, message, statusCode: 202 });
}

export function sendNoContent(res: Response): void {
  res.status(204).send();
}

export function sendBadRequest(res: Response, error: string, fields?: Record<string, string[]>): void {
  sendError(res, { error, code: 'BAD_REQUEST', fields, statusCode: 400 });
}

export function sendUnauthorized(res: Response, error = 'Authentication required'): void {
  sendError(res, { error, code: 'UNAUTHORIZED', statusCode: 401 });
}

export function sendForbidden(res: Response, error = 'Insufficient permissions'): void {
  sendError(res, { error, code: 'FORBIDDEN', statusCode: 403 });
}

export function sendNotFound(res: Response, error = 'Resource not found'): void {
  sendError(res, { error, code: 'NOT_FOUND', statusCode: 404 });
}

export function sendConflict(res: Response, error: string): void {
  sendError(res, { error, code: 'CONFLICT', statusCode: 409 });
}

export function sendTooManyRequests(res: Response, error = 'Rate limit exceeded'): void {
  sendError(res, { error, code: 'RATE_LIMITED', statusCode: 429 });
}

export function sendInternalError(res: Response, error = 'Internal server error'): void {
  sendError(res, { error, code: 'INTERNAL_ERROR', statusCode: 500 });
}

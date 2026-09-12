import type { Response } from 'express';

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export function sendSuccess<T>(
  res: Response,
  data: T,
  statusCode = 200,
  message?: string
): void {
  const response: ApiResponse<T> = { success: true, data, message };
  res.status(statusCode).json(response);
}

export function sendError(
  res: Response,
  error: string,
  statusCode = 500
): void {
  const response: ApiResponse<never> = { success: false, error };
  res.status(statusCode).json(response);
}

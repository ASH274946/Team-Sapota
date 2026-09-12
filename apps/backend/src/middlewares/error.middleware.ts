import type { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import multer from 'multer';
import { AppError } from '../api/common/errors';
import { logger as baseLogger } from '../utils/logger';

function getRequestLogger(req: Request) {
  const reqLogger = (req as any).logger;
  return reqLogger ?? baseLogger;
}

function getRequestId(req: Request): string | undefined {
  return (req as any).requestId ?? (req.headers['x-request-id'] as string | undefined);
}

export function errorMiddleware(
  error: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  const log = getRequestLogger(req);
  const requestId = getRequestId(req);
  const isProduction = process.env.NODE_ENV === 'production';

  // Operational AppError: safe to expose code/status/message (known, curated copy).
  if (error instanceof AppError) {
    if (!error.isOperational) {
      log.error({ err: error, stack: error.stack }, 'Non-operational application error');
    }
    res.status(error.statusCode).json({
      success: false,
      error: error.isOperational ? error.message : (isProduction ? 'Internal server error' : error.message),
      code: error.code,
      requestId,
    });
    return;
  }

  // Handle Zod Schema validation errors
  if (error instanceof ZodError) {
    res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: error.flatten().fieldErrors,
      requestId,
    });
    return;
  }

  // Handle Multer upload-specific errors
  if (error instanceof multer.MulterError) {
    res.status(400).json({
      success: false,
      error: `File upload failed: ${error.message}`,
      details: error.field ? { [error.field]: [error.message] } : undefined,
      requestId,
    });
    return;
  }

  // Handle request body too large (PayloadTooLargeError)
  if ((error as any).type === 'entity.too.large') {
    res.status(413).json({ success: false, error: 'Request body too large', requestId });
    return;
  }

  // Handle custom upload/filter errors thrown in multer fileFilter callback.
  // These are curated messages (not raw internals), so safe to return as-is.
  if (error.message.includes('not allowed') || error.message.includes('Only PDF')) {
    res.status(400).json({
      success: false,
      error: error.message,
      requestId,
    });
    return;
  }

  // Unknown error: never leak raw message or stack in production.
  log.error({ err: error, stack: error.stack }, 'Unhandled error');
  res.status(500).json({
    success: false,
    error: isProduction ? 'Internal server error' : error.message,
    code: 'INTERNAL_ERROR',
    requestId,
  });
}

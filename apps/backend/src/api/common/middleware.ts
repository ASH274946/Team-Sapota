import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { ZodError } from 'zod';
import multer from 'multer';
import { Prisma } from '@prisma/client';
import { logger } from '../../utils/logger';
import { sendError } from './response';
import { AppError, ValidationError } from './errors';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      requestId: string;
      startTime: number;
    }
  }
}

export function requestIdMiddleware(req: Request, _res: Response, next: NextFunction): void {
  req.requestId = (req.headers['x-request-id'] as string) || uuidv4();
  req.startTime = Date.now();
  next();
}

export function requestTimingMiddleware(req: Request, res: Response, next: NextFunction): void {
  const originalJson = res.json.bind(res);
  res.json = function (body: unknown) {
    const duration = Date.now() - req.startTime;
    res.setHeader('X-Response-Time', `${duration}ms`);
    if (process.env.NODE_ENV !== 'production') {
      logger.debug({ method: req.method, url: req.originalUrl, duration: `${duration}ms` }, 'Request completed');
    }
    return originalJson(body);
  } as typeof res.json;
  next();
}

export function errorHandler(error: Error, req: Request, res: Response, _next: NextFunction): void {
  const requestId = req.requestId || uuidv4();
  const ctx = { requestId, method: req.method, url: req.originalUrl };

  if (error instanceof AppError) {
    if (!error.isOperational) {
      logger.error({ error, ...ctx }, 'Non-operational error');
    }
    sendError(res, {
      error: error.message,
      code: error.code,
      fields: error instanceof ValidationError ? error.fields : undefined,
      statusCode: error.statusCode,
      requestId,
    });
    return;
  }

  if (error instanceof ZodError) {
    const fieldErrors = error.flatten().fieldErrors;
    sendError(res, {
      error: 'Validation failed',
      code: 'VALIDATION_ERROR',
      fields: fieldErrors as Record<string, string[]>,
      statusCode: 400,
      requestId,
    });
    return;
  }

  if (error instanceof multer.MulterError) {
    const code = error.code === 'LIMIT_FILE_SIZE' ? 'FILE_TOO_LARGE' : 'FILE_UPLOAD_FAILED';
    const message = error.code === 'LIMIT_FILE_SIZE'
      ? 'File too large'
      : `File upload failed: ${error.message}`;
    sendError(res, {
      error: message,
      code,
      fields: error.field ? { [error.field]: [error.message] } : undefined,
      statusCode: 400,
      requestId,
    });
    return;
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2002') {
      const target = (error.meta?.target as string[]) || [];
      sendError(res, {
        error: 'Resource already exists',
        code: 'DB_UNIQUE_VIOLATION',
        fields: target.length ? { [target.join(', ')]: ['Already exists'] } : undefined,
        statusCode: 409,
        requestId,
      });
      return;
    }
    if (error.code === 'P2025') {
      sendError(res, {
        error: 'Resource not found',
        code: 'NOT_FOUND',
        statusCode: 404,
        requestId,
      });
      return;
    }
    logger.error({ error, ...ctx }, 'Unhandled Prisma error');
    sendError(res, {
      error: 'Database operation failed',
      code: 'DATABASE_ERROR',
      statusCode: 500,
      requestId,
    });
    return;
  }

  if ((error as any).type === 'entity.too.large') {
    sendError(res, {
      error: 'Request body too large',
      code: 'FILE_TOO_LARGE',
      statusCode: 413,
      requestId,
    });
    return;
  }

  logger.error({ error, ...ctx }, 'Unhandled error');
  const message = process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message;
  sendError(res, {
    error: message,
    code: 'INTERNAL_ERROR',
    statusCode: 500,
    requestId,
  });
}

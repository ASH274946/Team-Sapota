import { Request, Response, NextFunction } from 'express';
import { getCached, setCached } from './cache';

interface CacheMiddlewareOptions {
  ttl?: number;
  keyFn?: (req: Request) => string;
  condition?: (req: Request) => boolean;
}

export function cacheResponse(options: CacheMiddlewareOptions = {}) {
  const {
    ttl = 300,
    keyFn = (req) => `${req.originalUrl}`,
    condition = (req) => req.method === 'GET'
  } = options;

  return async (req: Request, res: Response, next: NextFunction) => {
    if (!condition(req)) return next();

    const key = `http:cache:${keyFn(req)}`;
    const cached = await getCached<{ body: any; statusCode: number }>(key);
    if (cached) {
      return res.status(cached.statusCode).json(cached.body);
    }

    const originalJson = res.json.bind(res);
    res.json = function (body: any) {
      setCached(key, { body, statusCode: res.statusCode }, ttl).catch(() => {});
      return originalJson(body);
    };

    next();
  };
}

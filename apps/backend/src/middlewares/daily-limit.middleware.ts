import { Request, Response, NextFunction } from 'express';
import { getRedisClient } from '../config/redis';
import { DailyLimitService } from '../services/daily-limit.service';
import { logger } from '../utils/logger';

const dailyLimitService = new DailyLimitService(getRedisClient());

/**
 * Middleware to check daily limits for quiz generation
 */
export const checkQuizDailyLimit = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { allowed, remaining, used, limit } = await dailyLimitService.checkAndIncrement(
      req.user!.id,
      req.user!.role,
      'quiz'
    );

    (req as any).dailyLimitStatus = { allowed, remaining, used, limit };

    if (!allowed) {
      logger.warn({
        userId: req.user!.id,
        role: req.user!.role,
        used,
        limit,
      }, '[DailyLimit] Quiz limit exceeded');

      res.status(429).json({
        error: 'Daily quiz limit exceeded',
        message: `You can create ${limit} mock quizzes per day. You have used ${used} today.`,
        limit,
        used,
        remaining: 0,
        resetAt: new Date(Date.now() + 86400000),
      });
      return;
    }

    next();
  } catch (error) {
    logger.error(error, '[DailyLimit] Error checking quiz limit');
    next(error);
  }
};

/**
 * Middleware to check daily limits for paper/assignment generation
 */
export const checkPaperDailyLimit = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { allowed, remaining, used, limit } = await dailyLimitService.checkAndIncrement(
      req.user!.id,
      req.user!.role,
      'paper'
    );

    (req as any).dailyLimitStatus = { allowed, remaining, used, limit };

    if (!allowed) {
      logger.warn({
        userId: req.user!.id,
        role: req.user!.role,
        used,
        limit,
      }, '[DailyLimit] Paper generation limit exceeded');

      res.status(429).json({
        error: 'Daily paper generation limit exceeded',
        message: `You can generate ${limit} question papers per day. You have used ${used} today.`,
        limit,
        used,
        remaining: 0,
        resetAt: new Date(Date.now() + 86400000),
      });
      return;
    }

    next();
  } catch (error) {
    logger.error(error, '[DailyLimit] Error checking paper limit');
    next(error);
  }
};

/**
 * Middleware to check daily limits for assignments (which might have different limits)
 */
export const checkAssignmentDailyLimit = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { allowed, remaining, used, limit } = await dailyLimitService.checkAndIncrement(
      req.user!.id,
      req.user!.role,
      'assignment'
    );

    (req as any).dailyLimitStatus = { allowed, remaining, used, limit };

    if (!allowed) {
      logger.warn({
        userId: req.user!.id,
        role: req.user!.role,
        used,
        limit,
      }, '[DailyLimit] Assignment creation limit exceeded');

      res.status(429).json({
        error: 'Daily assignment creation limit exceeded',
        message: `You can create ${limit} assignments per day. You have created ${used} today.`,
        limit,
        used,
        remaining: 0,
        resetAt: new Date(Date.now() + 86400000),
      });
      return;
    }

    next();
  } catch (error) {
    logger.error(error, '[DailyLimit] Error checking assignment limit');
    next(error);
  }
};

/**
 * Initialize daily limit service with Redis
 */
export function initializeDailyLimitService(): DailyLimitService {
  return dailyLimitService;
}

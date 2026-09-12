import { Request, Response, Router } from 'express';
import { getRedisClient } from '../../config/redis';
import prisma from '../../config/prisma';
import { logger } from '../../utils/logger';
import { getActiveAiJobCount, getStalledAiJobCount } from '../../workers/aiGeneration.worker';

const router = Router();

router.get('/metrics', async (_req: Request, res: Response) => {
  const start = Date.now();
  try {
    const [dbOk, redisOk, activeJobs, stalledJobs] = await Promise.all([
      prisma.$queryRaw`SELECT 1`.then(() => true).catch(() => false),
      getRedisClient().ping().then(() => true).catch(() => false),
      getActiveAiJobCount(),
      getStalledAiJobCount(),
    ]);

    const metrics = {
      timestamp: Date.now(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      cpu: process.cpuUsage(),
      db: { connected: dbOk },
      redis: { connected: redisOk },
      queues: {
        generation: { active: activeJobs, stalled: stalledJobs },
      },
    };

    res.set('Content-Type', 'application/json');
    res.json({
      success: true,
      metrics,
      durationMs: Date.now() - start,
    });
  } catch (error) {
    const reqLogger = (_req as any).logger ?? logger;
    reqLogger.error({ err: error, stack: error instanceof Error ? error.stack : undefined }, '[metrics]');
    const message = process.env.NODE_ENV === 'production' ? 'Metrics collection failed' : (error instanceof Error ? error.message : 'Metrics collection failed');
    res.status(500).json({
      success: false,
      error: message,
      code: 'INTERNAL_ERROR',
      durationMs: Date.now() - start,
    });
  }
});

export default router;

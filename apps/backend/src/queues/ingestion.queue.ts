import { Queue } from 'bullmq';
import { getBullRedisClient } from '../config/redis';

export const INGESTION_QUEUE_NAME = 'document-ingestion';

export const ingestionQueue = new Queue(INGESTION_QUEUE_NAME, {
  connection: getBullRedisClient(),
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000,
    },
    removeOnComplete: true,
    removeOnFail: false,
  },
});

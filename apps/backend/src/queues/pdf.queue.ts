import { Queue } from 'bullmq';
import { getBullRedisClient } from '../config/redis';
import type { PdfJobData } from '../types/queue.types';

let pdfQueue: Queue<PdfJobData> | null = null;

export function getPdfQueue(): Queue<PdfJobData> {
  if (!pdfQueue) {
    pdfQueue = new Queue<PdfJobData>('pdf', {
      connection: getBullRedisClient(),
      skipVersionCheck: true,
      defaultJobOptions: {
        attempts: 2,
        backoff: { type: 'fixed', delay: 3000 },
        removeOnComplete: { count: 50 },
        removeOnFail: { count: 50 },
      },
    });
  }
  return pdfQueue;
}

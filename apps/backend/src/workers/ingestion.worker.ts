import { Worker, Job } from 'bullmq';
import { getBullRedisClient } from '../config/redis';
import { INGESTION_QUEUE_NAME } from '../queues/ingestion.queue';
import { ingestDocument } from '../services/rag.service';
import { logger } from '../utils/logger';

interface IngestionJobData {
  fileUrl: string;
  fileType: string;
  organizationId: string;
  filename: string;
  userId: string;          // The user who uploaded the file
}

export function getIngestionWorker(): Worker<IngestionJobData> | null {
  return ingestionWorker;
}

export const ingestionWorker = new Worker<IngestionJobData>(
  INGESTION_QUEUE_NAME,
  async (job: Job<IngestionJobData>) => {
    const { fileUrl, fileType, organizationId, filename, userId } = job.data;
    logger.info(`Processing ingestion job ${job.id} for file: ${filename}`);

    try {
      await ingestDocument(fileUrl, fileType, organizationId, filename, userId);
      logger.info(`Successfully ingested document: ${filename}`);
    } catch (error) {
      logger.error(`Error ingesting document ${filename}: ${error}`);
      throw error;
    }
  },
  { connection: getBullRedisClient(), concurrency: 5 } // Process up to 5 documents concurrently
);

ingestionWorker.on('failed', (job, err) => {
  logger.error(`Job ${job?.id} failed with error: ${err.message}`);
});

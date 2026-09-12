import type { Request, Response } from 'express';
import { sendSuccess, sendError } from '../utils/api-response';
import { requireRequestOrgId, getRequestUserId } from '../security/request-context';
import { logger } from '../utils/logger';
import { ingestionQueue } from '../queues/ingestion.queue';
import { v4 as uuidv4 } from 'uuid';
export class IngestionController {
  static async uploadSource(req: Request, res: Response): Promise<void> {
    try {
      const organizationId = requireRequestOrgId(req);
      const userId = getRequestUserId(req);
      const files = req.files as Express.Multer.File[];

      if (!files || files.length === 0) {
        sendError(res, 'No files provided for ingestion', 400);
        return;
      }

      // Ensure all uploaded files are bound to the tenant explicitly
      logger.info({ action: 'Source Ingestion', organizationId, userId, files: files.length }, 'Ingesting sources');
      
      const jobIds = [];
      for (const file of files) {
        // In a real app, file would be uploaded to S3 here and we'd get a URL. 
        // For local development with multer, it might be a local path or buffer.
        // Assuming we mock the fileUrl for now or use the file.path
        const fileUrl = file.path || `/temp/${uuidv4()}-${file.originalname}`;
        const fileType = file.mimetype || 'application/pdf';

        const job = await ingestionQueue.add('ingest-document', {
          fileUrl,
          fileType,
          organizationId,
          filename: file.originalname,
          userId
        });
        jobIds.push(job.id);
      }
      
      sendSuccess(res, { message: 'Files queued for ingestion', count: files.length, jobIds }, 202);
    } catch (err: any) {
      logger.error(`[IngestionController:uploadSource] ${err}`);
      sendError(res, err.message, 500);
    }
  }

  static async listSources(req: Request, res: Response): Promise<void> {
    try {
      requireRequestOrgId(req);
      
      // TODO: Fetch ingested sources from DB scoped to organizationId
      const sources: any[] = [];
      
      sendSuccess(res, { sources }, 200);
    } catch (err: any) {
      logger.error(`[IngestionController:listSources] ${err}`);
      sendError(res, err.message, 500);
    }
  }
}

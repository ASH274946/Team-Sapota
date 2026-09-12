import type { DocumentResponseDto, DocumentJobStatusDto } from './dto';

interface PrismaDocument {
  id: string;
  filename: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  status: string;
  organizationId: string;
  uploadedById: string;
  extractedText: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export function serializeDocument(doc: PrismaDocument): DocumentResponseDto {
  return {
    id: doc.id,
    filename: doc.filename,
    fileUrl: doc.fileUrl,
    fileType: doc.fileType,
    fileSize: doc.fileSize,
    status: doc.status,
    organizationId: doc.organizationId,
    uploadedById: doc.uploadedById,
    extractedText: doc.extractedText,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
}

export function serializeJobStatus(job: {
  id: string;
  status: string;
  progress?: number | null;
  result?: string | null;
  error?: string | null;
  createdAt: Date;
}): DocumentJobStatusDto {
  return {
    jobId: job.id,
    status: job.status,
    progress: job.progress ?? null,
    resultUrl: job.result ?? null,
    error: job.error ?? null,
    estimatedCompletion: null,
  };
}

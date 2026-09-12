import type { JobStatusDto, JobLogDto, CancelJobDto } from './dto';

export function serializeJob(job: any): JobStatusDto {
  return {
    id: job.id,
    jobType: job.jobType ?? job.name,
    status: job.status,
    progress: job.progress,
    payload: job.payload,
    result: job.result,
    resultUrl: job.resultUrl,
    error: job.error,
    createdAt: job.createdAt,
    updatedAt: job.updatedAt,
    completedAt: job.completedAt,
  };
}

export function serializeJobLog(log: any): JobLogDto {
  return {
    id: log.id,
    jobId: log.jobId,
    level: log.level ?? 'info',
    message: log.message,
    timestamp: log.timestamp ?? log.createdAt,
  };
}

export function serializeCancelResult(jobId: string, cancelled: boolean): CancelJobDto {
  return { cancelled, jobId };
}

export interface JobStatusDto {
  id: string;
  jobType: string;
  status: string;
  progress?: number;
  payload?: unknown;
  result?: unknown;
  resultUrl?: string;
  error?: string;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

export interface JobLogDto {
  id: string;
  jobId: string;
  level: string;
  message: string;
  timestamp: Date;
}

export interface CancelJobDto {
  cancelled: boolean;
  jobId: string;
}

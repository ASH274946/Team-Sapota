export type GenerationStatus =
  | 'queued'
  | 'extracting_content'
  | 'generating_batches'
  | 'validating'
  | 'partially_generated'
  | 'completed'
  | 'failed'
  | 'failed_transport'
  | 'failed_validation'
  | 'failed_provider'
  | 'failed_quota'
  | 'failed_timeout';

export type FailureCategory =
  | 'timeout'
  | 'quota_exceeded'
  | 'provider_unavailable'
  | 'malformed_response'
  | 'truncated_output'
  | 'auth_error'
  | 'under_generation'
  | 'partial_generation'
  | 'unknown';

export interface GenerationMeta {
  status: GenerationStatus;
  generatedQuestionCount: number;
  requestedQuestionCount: number;
  generatedMarks: number;
  requestedMarks: number;
  completedBatches: number;
  failedBatches: number;
  providerName: string | null;
  failureCategory: FailureCategory | null;
  failureReason: string | null;
  diagnostics: GenerationDiagnostics | null;
  partialPaper: object | null;
  completedAt: Date | null;
}

export interface GenerationDiagnostics {
  providerName: string;
  latencyMs: number;
  promptChars: number;
  responseChars: number;
  attemptCount: number;
}

export interface BatchResult {
  questions: object[];
  marks: number;
  batchIndex: number;
  type: string;
}

export type AssignmentStatusV2 =
  | 'draft'
  | 'queued'
  | 'extracting_content'
  | 'generating'
  | 'validating'
  | 'completed'
  | 'partially_generated'
  | 'failed';

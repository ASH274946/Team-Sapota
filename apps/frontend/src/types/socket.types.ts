export type GenerationStage =
  | 'queued'
  | 'extracting_content'
  | 'topic_preprocessing'
  | 'generation_planning'
  | 'batch_generating'
  | 'provider_retry'
  | 'validation_retry'
  | 'recovering_batches'
  | 'validating'
  | 'answer_key_generating'
  | 'pdf_composing'
  | 'persisting'
  | 'pdf-generating'
  | 'completed'
  | 'failed';

export interface GenerationQueuedPayload {
  assignmentId: string;
  jobId: string;
  jobRecordId: string;
  generationSeq: number;
  position: number;
  version: number;
  ts: number;
}

export interface GenerationProgressPayload {
  assignmentId: string;
  progress: number;
  stage: GenerationStage;
  message?: string;
  jobRecordId: string;
  generationSeq: number;
  version: number;
  ts: number;
}

export interface GenerationCompletedPayload {
  assignmentId: string;
  paperId: string;
  jobRecordId: string;
  generationSeq: number;
  partial?: boolean;
  status?: 'complete' | 'partial_success';
  generatedQuestionCount?: number;
  requestedQuestionCount?: number;
  generatedMarks?: number;
  requestedMarks?: number;
  version: number;
  ts: number;
}

export interface GenerationFailedPayload {
  assignmentId: string;
  error: string;
  retryable: boolean;
  jobRecordId: string;
  generationSeq: number;
  version: number;
  ts: number;
}

export interface GenerationPdfReadyPayload {
  assignmentId: string;
  paperId: string;
  pdfUrl: string;
  ts: number;
}

export interface RagSourceCitation {
  chunkId: string;
  documentId: string;
  filename: string;
  topic?: string;
  subject?: string;
  chunkType?: string;
  excerpt: string;
  score: number;
}

export interface TutorSourcesPayload {
  requestId: string;
  sources: RagSourceCitation[];
}

export interface TutorChunkPayload {
  requestId: string;
  token: string;
  index: number;
}

export interface TutorDonePayload {
  requestId: string;
  messageId: string;
  message: string;
  followUp?: string;
  confidence?: number;
  ragReferences?: unknown;
}

export interface TutorErrorPayload {
  requestId: string;
  error: string;
}

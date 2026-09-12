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

// --- NEW REALTIME TYPES ---
export interface ServerToClientEvents {
  'generation:queued': (payload: GenerationQueuedPayload) => void;
  'generation:processing': (payload: GenerationProgressPayload) => void;
  'generation:progress': (payload: GenerationProgressPayload) => void;
  'generation:completed': (payload: GenerationCompletedPayload) => void;
  'generation:failed': (payload: GenerationFailedPayload) => void;
  'generation:pdf_ready': (payload: GenerationPdfReadyPayload) => void;
  
  // Presence Events
  'presence:online': (payload: { userId: string }) => void;
  'presence:offline': (payload: { userId: string }) => void;
  'presence:sync': (payload: { onlineUserIds: string[] }) => void;
  
  // Chat Events
  'chat:message': (payload: any) => void;
  'chat:typing': (payload: { userId: string; isTyping: boolean }) => void;
  'chat:error': (payload: { tempId?: string; error: string }) => void;

  // Tutor streaming events
  'tutor:sources': (payload: {
    requestId: string;
    sources: Array<{
      chunkId: string;
      documentId: string;
      filename: string;
      topic?: string;
      subject?: string;
      chunkType?: string;
      excerpt: string;
      score: number;
    }>;
  }) => void;
  'tutor:chunk': (payload: { requestId: string; token: string; index: number }) => void;
  'tutor:done': (payload: {
    requestId: string;
    messageId: string;
    message: string;
    followUp?: string;
    confidence?: number;
    ragReferences?: unknown;
  }) => void;
  'tutor:error': (payload: { requestId: string; error: string }) => void;
}

export interface ClientToServerEvents {
  'subscribe:assignment': (data: { assignmentId: string }) => void;
  'unsubscribe:assignment': (data: { assignmentId: string }) => void;
  
  // Connection Events
  'authenticate': (data: { userId: string }) => void;
  
  // Room Events
  'join:group': (data: { groupId: string }) => void;
  'leave:group': (data: { groupId: string }) => void;
  
  // Chat Events
  'chat:send_message': (data: { groupId: string; content: string; tempId?: string }) => void;
  'typing': (data: { groupId: string; isTyping: boolean }) => void;

  // Tutor streaming events
  'tutor:join_session': (data: { sessionId: string }) => void;
  'tutor:leave_session': (data: { sessionId: string }) => void;
  'tutor:stream_query': (data: {
    sessionId: string;
    message: string;
    mode?: string;
    requestId: string;
  }) => void;
}

export interface TutorSession {
  id: string;
  studentId: string;
  subject: string;
  status: string;
  tutorMode: string;
  createdAt: string;
  updatedAt: string;
}

export interface TutorMessage {
  id: string;
  sessionId: string;
  role: string;
  content: string;
  confidence?: number;
  ragReferences?: unknown;
  createdAt: string;
  isStreaming?: boolean;
  sources?: RagSourceCitation[];
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

export interface TutorSessionDetail extends TutorSession {
  messages: TutorMessage[];
}

export interface ChatResponse {
  message: string;
  followUp: string;
  messageId: string;
}

export interface TutorConfig {
  allowDirectAnswers: boolean;
  maxExplanationDepth: number;
}

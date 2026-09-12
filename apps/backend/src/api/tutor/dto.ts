export interface CreateSessionDto {
  subject: string;
  tutorMode?: string;
}

export interface SendMessageDto {
  message: string;
}

export interface UpdateTutorConfigDto {
  allowDirectAnswers?: boolean;
  maxExplanationDepth?: number;
}

export interface TutorSessionDto {
  id: string;
  studentId: string;
  subject: string;
  status: string;
  tutorMode: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TutorMessageDto {
  id: string;
  sessionId: string;
  role: string;
  content: string;
  confidence?: number;
  ragReferences?: unknown;
  createdAt: Date;
}

export interface TutorSessionDetailDto extends TutorSessionDto {
  messages: TutorMessageDto[];
}

export interface ChatResponseDto {
  message: string;
  followUp: string;
  messageId: string;
}

export interface TutorConfigDto {
  allowDirectAnswers: boolean;
  maxExplanationDepth: number;
}

export interface QuizSessionDto {
  id: string;
  userId: string;
  topic: string;
  subject: string;
  difficulty: string;
  organizationId?: string;
  score?: number;
  totalQuestions: number;
  answeredQuestions: number;
  timeSpent?: number;
  attempts?: number;
  masteryLevel: number;
  status: 'IN_PROGRESS' | 'COMPLETED' | 'ABANDONED';
  questions: QuizSessionQuestionDto[];
  createdAt: string;
  updatedAt: string;
}

export interface QuizSessionQuestionDto {
  id: string;
  sessionId: string;
  questionIndex: number;
  questionText: string;
  options: string[];
  answer: string;
  difficulty: string;
  bloomLevel: string;
  learningOutcome?: string;
  aiConfidenceScore: number;
  adaptiveDelta: number;
  explanation?: string;
  suggestedReading?: string;
  userAnswer?: string;
  isCorrect?: boolean;
}

export interface CreateQuizSessionDto {
  topic: string;
  subject: string;
  difficulty: string;
  organizationId?: string;
  totalQuestions?: number;
}

export interface UpdateQuizSessionDto {
  score?: number;
  timeSpent?: number;
  attempts?: number;
  status?: 'IN_PROGRESS' | 'COMPLETED' | 'ABANDONED';
}

export interface GenerateQuizDto {
  topic: string;
  subject: string;
  difficulty: string;
  bloomLevel?: string;
  count: number;
  organizationId?: string;
}

export interface ShareQuizDto {
  sessionId: string;
  recipientEmail?: string;
  expiresInHours?: number;
}

export interface SharedQuizDto {
  id: string;
  sessionId: string;
  shareToken: string;
  expiresAt: string;
  session: QuizSessionDto;
}

export interface AdaptiveQuizStartDto {
  topic: string;
  subject: string;
  initialDifficulty?: string;
  organizationId?: string;
}

export interface AdaptiveQuizNextDto {
  sessionId: string;
  lastQuestionId?: string;
  lastAnswer?: string;
}

export interface AdaptiveQuizCompleteDto {
  sessionId: string;
}

export interface QuizHistoryDto {
  id: string;
  topic: string;
  subject: string;
  difficulty: string;
  score?: number;
  totalQuestions: number;
  masteryLevel: number;
  status: string;
  createdAt: string;
}

export interface QuizSessionQuestion {
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

export interface QuizSession {
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
  questions: QuizSessionQuestion[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateQuizSessionData {
  topic: string;
  subject: string;
  difficulty: string;
  organizationId?: string;
  totalQuestions?: number;
}

export interface UpdateQuizSessionData {
  score?: number;
  timeSpent?: number;
  attempts?: number;
  status?: 'IN_PROGRESS' | 'COMPLETED' | 'ABANDONED';
}

export interface GenerateQuizData {
  topic: string;
  subject: string;
  difficulty: string;
  bloomLevel?: string;
  count: number;
  organizationId?: string;
}

export interface ShareQuizData {
  sessionId: string;
  recipientEmail?: string;
  expiresInHours?: number;
}

export interface SharedQuiz {
  id: string;
  sessionId: string;
  shareToken: string;
  expiresAt: string;
  session: QuizSession;
}

export interface AdaptiveQuizStartData {
  topic: string;
  subject: string;
  initialDifficulty?: string;
  organizationId?: string;
}

export interface AdaptiveQuizNextData {
  sessionId: string;
  lastQuestionId?: string;
  lastAnswer?: string;
}

export interface AdaptiveQuizCompleteData {
  sessionId: string;
}

export interface QuizHistory {
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

import type { QuizSessionDto, QuizSessionQuestionDto, QuizHistoryDto } from './dto';

export function serializeQuizQuestion(question: any): QuizSessionQuestionDto {
  return {
    id: question.id,
    sessionId: question.sessionId,
    questionIndex: question.questionIndex,
    questionText: question.questionText,
    options: question.options ?? [],
    answer: question.answer,
    difficulty: question.difficulty,
    bloomLevel: question.bloomLevel,
    learningOutcome: question.learningOutcome ?? undefined,
    aiConfidenceScore: question.aiConfidenceScore ?? 0.85,
    adaptiveDelta: question.adaptiveDelta ?? 0,
    explanation: question.explanation ?? undefined,
    suggestedReading: question.suggestedReading ?? undefined,
    userAnswer: question.userAnswer ?? undefined,
    isCorrect: question.isCorrect ?? undefined,
  };
}

export function serializeQuizSession(session: any): QuizSessionDto {
  return {
    id: session.id,
    userId: session.userId,
    topic: session.topic,
    subject: session.subject,
    difficulty: session.difficulty,
    organizationId: session.organizationId ?? undefined,
    score: session.score ?? undefined,
    totalQuestions: session.totalQuestions ?? (session.questions?.length ?? 0),
    answeredQuestions: session.answeredQuestions ?? 0,
    timeSpent: session.timeSpent ?? undefined,
    attempts: session.attempts ?? undefined,
    masteryLevel: session.masteryLevel ?? 0,
    status: session.status ?? 'IN_PROGRESS',
    questions: (session.questions ?? []).map(serializeQuizQuestion),
    createdAt: session.createdAt?.toISOString() ?? new Date().toISOString(),
    updatedAt: session.updatedAt?.toISOString() ?? new Date().toISOString(),
  };
}

export function serializeQuizHistory(session: any): QuizHistoryDto {
  return {
    id: session.id,
    topic: session.topic,
    subject: session.subject,
    difficulty: session.difficulty,
    score: session.score ?? undefined,
    totalQuestions: session.totalQuestions ?? (session.questions?.length ?? 0),
    masteryLevel: session.masteryLevel ?? 0,
    status: session.status ?? 'IN_PROGRESS',
    createdAt: session.createdAt?.toISOString() ?? new Date().toISOString(),
  };
}

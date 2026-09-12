import prisma from '../config/prisma';


export class QuizAnalyticsService {
  /**
   * Aggregates analytics for a given quiz session.
   */
  static async getSessionAnalytics(sessionId: string) {
    const session = await prisma.quizSession.findUnique({
      where: { id: sessionId },
      include: { questions: true }
    });

    if (!session) throw new Error('Quiz Session not found');

    const totalQuestions = session.questions.length;
    if (totalQuestions === 0) return null;

    // Basic aggregation
    let totalConfidence = 0;
    let maxDifficultyReached = 'EASY';

    const bloomDistribution: Record<string, number> = {};

    for (const q of session.questions) {
      totalConfidence += q.aiConfidenceScore;
      bloomDistribution[q.bloomLevel] = (bloomDistribution[q.bloomLevel] || 0) + 1;

      // Track peak difficulty
      if (q.difficulty === 'HARD') maxDifficultyReached = 'HARD';
      else if (q.difficulty === 'MEDIUM' && maxDifficultyReached !== 'HARD') maxDifficultyReached = 'MEDIUM';
    }

    const averageConfidence = totalConfidence / totalQuestions;

    // Simulated Mastery Update
    // In a real application, we evaluate right/wrong answers.
    // For this demonstration, we'll increment mastery based on the number of questions answered.
    const newMasteryLevel = Math.min(100, session.masteryLevel + (totalQuestions * 2));

    await prisma.quizSession.update({
      where: { id: sessionId },
      data: {
        masteryLevel: newMasteryLevel
      }
    });

    return {
      totalQuestions,
      averageConfidence,
      maxDifficultyReached,
      bloomDistribution,
      masteryLevel: newMasteryLevel
    };
  }
}

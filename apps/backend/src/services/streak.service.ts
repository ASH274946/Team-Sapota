import prisma from '../config/prisma';
import { logger } from '../utils/logger';

export class StreakService {
  /**
   * Main entry point to record activity for a user and calculate their streak
   * Call this when a user logs in, completes a quiz, chats with AI, etc.
   */
  static async recordActivity(studentId: string): Promise<void> {
    try {
      if (!studentId) return;

      const profile = await prisma.studentLearningProfile.findUnique({
        where: { studentId },
      });

      if (!profile) {
        // Create profile if missing
        await prisma.studentLearningProfile.create({
          data: {
            studentId,
            currentStreak: 1,
            longestStreak: 1,
            lastActiveDate: new Date(),
            totalActiveDays: 1,
            weeklyActivity: this.getInitialWeeklyActivity(),
            monthlyActivity: [],
          },
        });
        return;
      }

      const now = new Date();
      const lastActive = profile.lastActiveDate ? new Date(profile.lastActiveDate) : null;
      let { currentStreak, longestStreak, totalActiveDays } = profile;

      if (!lastActive) {
        currentStreak = 1;
        longestStreak = 1;
        totalActiveDays = 1;
      } else {
        const todayStr = now.toISOString().split('T')[0];
        const lastStr = lastActive.toISOString().split('T')[0];

        if (todayStr === lastStr) {
          // Already active today, do nothing to streak
          return;
        }

        const yesterday = new Date(now);
        yesterday.setDate(now.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];

        if (lastStr === yesterdayStr) {
          // Continuous streak
          currentStreak += 1;
          if (currentStreak > longestStreak) {
            longestStreak = currentStreak;
          }
          totalActiveDays += 1;
        } else {
          // Streak broken (missed at least one day)
          currentStreak = 1;
          totalActiveDays += 1;
        }
      }

      // Update Weekly Activity Map
      const weekAct = (profile.weeklyActivity as any[]) || this.getInitialWeeklyActivity();
      const dayOfWeek = (now.getDay() + 6) % 7; // Monday = 0, Sunday = 6
      weekAct[dayOfWeek] = true;

      await prisma.studentLearningProfile.update({
        where: { studentId },
        data: {
          currentStreak,
          longestStreak,
          totalActiveDays,
          lastActiveDate: now,
          weeklyActivity: weekAct,
        },
      });
      
    } catch (error) {
      logger.error(`[StreakService] Failed to record activity for ${studentId}: ${error instanceof Error ? error.message : error}`);
    }
  }

  static getInitialWeeklyActivity() {
    return [false, false, false, false, false, false, false];
  }
}

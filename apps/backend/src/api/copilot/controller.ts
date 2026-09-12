import { Request, Response } from 'express';
import { sendSuccess } from '../common/response';
import { getRequestUserId, getRequestOrgId } from '../../security/request-context';
import { TeacherCopilotService } from '../../services/teacher-copilot.service';
import { createWorksheet } from '../../services/worksheets.service';
import {
  serializeCopilotResponse,
  serializeLessonPlan,
  serializeActivity,
  serializeWorksheet,
} from './serializers';

export const assist = async (req: Request, res: Response): Promise<void> => {
  const { query } = req.body;

  const response = `Based on your query about "${query}", here are some teaching suggestions...`;

  sendSuccess(res, { data: serializeCopilotResponse({ content: response }) });
};

export const generateLessonPlan = async (req: Request, res: Response): Promise<void> => {
  const userId = getRequestUserId(req);
  const orgId = getRequestOrgId(req);
  const { subject, topic, duration, learningOutcomes } = req.body;

  const plan = await TeacherCopilotService.generateLessonPlan(
    userId,
    orgId!,
    subject,
    topic,
    duration,
    learningOutcomes
  );

  sendSuccess(res, { data: serializeLessonPlan(plan), message: 'Lesson plan generated' });
};

export const generateActivity = async (req: Request, res: Response): Promise<void> => {
  const userId = getRequestUserId(req);
  const { subject, topic, duration, groupSize, objectives } = req.body;

  const activity = {
    id: `activity_${Date.now()}`,
    userId,
    title: `${subject} - ${topic} Activity`,
    description: `Interactive ${subject} activity on ${topic}`,
    duration: duration ?? '30 minutes',
    subject,
    topic,
    groupSize: groupSize ?? 4,
    objectives: objectives ?? [],
    materials: ['Whiteboard', 'Handouts', 'Stationery'],
    instructions: [
      `Divide students into groups of ${groupSize ?? 4}`,
      'Explain the core concepts',
      'Let groups work on the task',
      'Present findings to the class',
    ],
  };

  sendSuccess(res, { data: serializeActivity(activity), message: 'Activity generated' });
};

export const generateWorksheet = async (req: Request, res: Response): Promise<void> => {
  const { title, subject, topic, difficulty } = req.body;

  const worksheet = await createWorksheet({
    title,
    subject,
    topic,
    difficulty,
    userId: getRequestUserId(req),
  });

  sendSuccess(res, { data: serializeWorksheet(worksheet), message: 'Worksheet generated' });
};

export const getHistory = async (_req: Request, res: Response): Promise<void> => {
  sendSuccess(res, { data: [] });
};

export const submitFeedback = async (req: Request, res: Response): Promise<void> => {
  const { historyId, rating, comment } = req.body;

  sendSuccess(res, { data: { historyId, rating, comment }, message: 'Feedback submitted' });
};

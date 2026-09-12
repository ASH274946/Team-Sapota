import { Request, Response } from 'express';
import { sendSuccess, sendCreated, sendNoContent, sendNotFound, sendForbidden } from '../common/response';
import { getRequestUserId, getRequestOrgId } from '../../security/request-context';
import { AITutorService } from '../../services/ai-tutor.service';
import prisma from '../../config/prisma';
import { AIOrchestrator } from '../../services/ai/ai-orchestrator.service';
import {
  serializeSession,
  serializeSessionDetail,
  serializeChatResponse,
  serializeConfig,
} from './serializers';

export const createSession = async (req: Request, res: Response): Promise<void> => {
  const userId = getRequestUserId(req);
  const orgId = getRequestOrgId(req);
  const { subject, tutorMode } = req.body;

  const session = await prisma.tutorSession.create({
    data: {
      studentId: userId,
      subject,
      tutorMode: tutorMode || 'SOCRATIC',
      organizationId: orgId,
      status: 'ACTIVE',
    },
  });

  sendCreated(res, serializeSession(session), 'Tutor session created');
};

export const listSessions = async (req: Request, res: Response): Promise<void> => {
  const userId = getRequestUserId(req);

  const sessions = await prisma.tutorSession.findMany({
    where: { studentId: userId },
    orderBy: { createdAt: 'desc' },
  });

  sendSuccess(res, { data: sessions.map(serializeSession) });
};

export const getSession = async (req: Request, res: Response): Promise<void> => {
  const { sessionId } = req.params;

  const session = await prisma.tutorSession.findUnique({
    where: { id: sessionId },
    include: { messages: { orderBy: { createdAt: 'asc' } } },
  });

  if (!session) {
    sendNotFound(res, 'Tutor session not found');
    return;
  }

  sendSuccess(res, { data: serializeSessionDetail(session) });
};

export const sendMessage = async (req: Request, res: Response): Promise<void> => {
  const { sessionId } = req.params;
  const userId = getRequestUserId(req);
  const orgId = getRequestOrgId(req);
  const { message, mode } = req.body;

  const result = await AITutorService.chat(sessionId, userId, orgId!, message, mode);

  sendSuccess(res, { data: serializeChatResponse(result) });
};

export const closeSession = async (req: Request, res: Response): Promise<void> => {
  const { sessionId } = req.params;

  await prisma.tutorSession.update({
    where: { id: sessionId },
    data: { status: 'CLOSED' },
  });

  sendSuccess(res, { data: { success: true }, message: 'Session closed' });
};

export const restartSession = async (req: Request, res: Response): Promise<void> => {
  const { sessionId } = req.params;

  await prisma.tutorSession.update({
    where: { id: sessionId },
    data: { status: 'ACTIVE' },
  });

  sendSuccess(res, { data: { success: true }, message: 'Session restarted' });
};

export const generateFlashcards = async (req: Request, res: Response): Promise<void> => {
  const { sessionId } = req.params;
  const userId = getRequestUserId(req);

  const session = await prisma.tutorSession.findUnique({
    where: { id: sessionId },
    include: { messages: { orderBy: { createdAt: 'desc' }, take: 10 } },
  });

  if (!session) {
    sendNotFound(res, 'Session not found');
    return;
  }
  if (session.studentId !== userId) {
    sendForbidden(res, 'Not authorized to view this session');
    return;
  }

  if (session.flashcards && Array.isArray(session.flashcards) && session.flashcards.length > 0) {
    sendSuccess(res, { data: session.flashcards });
    return;
  }

  const chatHistory = session.messages.reverse().map(m => `${m.role}: ${m.content}`).join('\n');
  
  const prompt = `
Generate exactly 5 educational flashcards based on the following conversation and the subject: ${session.subject}.
Conversation:
${chatHistory}

Output your response ONLY as a JSON object matching this schema:
{
  "flashcards": [
    { "front": "Question or term", "back": "Answer or definition" }
  ]
}
`;

  const result = await AIOrchestrator.generate({
    intent: 'GenerateQuestionExplanation',
    context: '',
    taskInstructions: prompt,
    responseFormat: { type: "json_object" }
  });

  const flashcards = result.flashcards || [];

  if (flashcards.length > 0) {
    await prisma.tutorSession.update({
      where: { id: sessionId },
      data: { flashcards: flashcards as any }
    });
  }

  sendSuccess(res, { data: flashcards });
};

export const deleteSession = async (req: Request, res: Response): Promise<void> => {
  const { sessionId } = req.params;

  await prisma.tutorMessage.deleteMany({ where: { sessionId } });
  await prisma.tutorSession.delete({ where: { id: sessionId } });

  sendNoContent(res);
};

export const getConfig = async (req: Request, res: Response): Promise<void> => {
  const orgId = getRequestOrgId(req);

  const config = orgId
    ? await prisma.teacherTutorConfig.findUnique({ where: { organizationId: orgId } })
    : null;

  sendSuccess(res, { data: serializeConfig(config) });
};

export const updateConfig = async (req: Request, res: Response): Promise<void> => {
  const orgId = getRequestOrgId(req);
  const { allowDirectAnswers, maxExplanationDepth } = req.body;

  const config = await prisma.teacherTutorConfig.upsert({
    where: { organizationId: orgId! },
    update: { allowDirectAnswers, maxExplanationDepth },
    create: {
      organizationId: orgId!,
      allowDirectAnswers: allowDirectAnswers ?? false,
      maxExplanationDepth: maxExplanationDepth ?? 3,
    },
  });

  sendSuccess(res, { data: serializeConfig(config), message: 'Tutor configuration updated' });
};

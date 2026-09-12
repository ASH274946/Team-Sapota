import { Request, Response } from 'express';
import { AITutorService } from '../services/ai-tutor.service';
import { sendSuccess, sendError } from '../utils/api-response.util';
import { getRequestUserId } from '../security/request-context';
import prisma from '../config/prisma';
import { StreakService } from '../services/streak.service';

/**
 * POST /v1/tutor/sessions
 * Creates a new AI Tutor session for the authenticated student.
 */
export const createSession = async (req: Request, res: Response): Promise<void> => {
  const { subject, tutorMode } = req.body;
  const studentId = getRequestUserId(req);
  const organizationId = req.user?.activeOrganizationId ?? req.user?.organizationId ?? '';

  if (!studentId || !subject) {
    sendError(res, 400, 'studentId and subject are required', { errorCode: 'VALIDATION_ERROR' });
    return;
  }

  const session = await prisma.tutorSession.create({
    data: {
      studentId,
      organizationId: organizationId || null,
      subject,
      title: 'New Chat',
      tutorMode: tutorMode ?? 'SOCRATIC',
      status: 'ACTIVE',
    },
  });

  sendSuccess(res, session, { message: 'Tutor session created' }, 201);
};

/**
 * GET /v1/tutor/sessions
 * Lists all tutor sessions for a given studentId.
 */
export const listSessions = async (req: Request, res: Response): Promise<void> => {
  const studentId = getRequestUserId(req);

  if (!studentId) {
    sendError(res, 400, 'User ID is missing', { errorCode: 'VALIDATION_ERROR' });
    return;
  }

  const sessions = await prisma.tutorSession.findMany({
    where: { studentId },
    orderBy: { updatedAt: 'desc' },
  });

  sendSuccess(res, sessions, { message: 'Sessions retrieved' });
};

/**
 * GET /v1/tutor/sessions/:sessionId
 * Returns a session with its messages.
 */
export const getSession = async (req: Request, res: Response): Promise<void> => {
  const { sessionId } = req.params;

  const session = await prisma.tutorSession.findUnique({
    where: { id: sessionId },
    include: { messages: { orderBy: { createdAt: 'asc' } } },
  });

  if (!session) {
    sendError(res, 404, 'Session not found', { errorCode: 'NOT_FOUND' });
    return;
  }

  sendSuccess(res, session, { message: 'Session retrieved' });
};

/**
 * POST /v1/tutor/sessions/:sessionId/chat
 * Sends a student message and returns an AI tutor reply.
 */
export const chat = async (req: Request, res: Response): Promise<void> => {
  const { sessionId } = req.params;
  const { message, mode } = req.body;
  const studentId = getRequestUserId(req);
  const organizationId = req.user?.activeOrganizationId ?? req.user?.organizationId ?? '';

  if (!studentId || !message) {
    sendError(res, 400, 'studentId and message are required', { errorCode: 'VALIDATION_ERROR' });
    return;
  }

  const reply = await AITutorService.chat(sessionId, studentId, organizationId, message, mode);

  // Update streak!
  if (studentId !== 'demo-faculty-id') {
    await StreakService.recordActivity(studentId);
  }

  // If this was the first user message and title is "New Chat", we should really generate one...
  // but for now, we just rely on rename APIs.
  // We'll update the updatedAt timestamp on the session
  await prisma.tutorSession.update({
    where: { id: sessionId },
    data: { updatedAt: new Date() },
  });

  sendSuccess(res, reply, { message: 'Tutor replied' });
};

/**
 * PATCH /v1/tutor/sessions/:sessionId/close
 * Closes an active tutor session.
 */
export const closeSession = async (req: Request, res: Response): Promise<void> => {
  const { sessionId } = req.params;

  const updated = await prisma.tutorSession.update({
    where: { id: sessionId },
    data: { status: 'CLOSED' },
  });

  sendSuccess(res, updated, { message: 'Session closed' });
};

/**
 * PATCH /v1/tutor/sessions/:sessionId/title
 * Renames a tutor session.
 */
export const renameSession = async (req: Request, res: Response): Promise<void> => {
  const { sessionId } = req.params;
  const { title } = req.body;
  const studentId = getRequestUserId(req);

  if (!title || title.trim().length === 0) {
    sendError(res, 400, 'Title is required', { errorCode: 'VALIDATION_ERROR' });
    return;
  }

  const session = await prisma.tutorSession.findUnique({ where: { id: sessionId } });
  if (!session || session.studentId !== studentId) {
    sendError(res, 404, 'Session not found', { errorCode: 'NOT_FOUND' });
    return;
  }

  const updated = await prisma.tutorSession.update({
    where: { id: sessionId },
    data: { title: title.trim() },
  });

  sendSuccess(res, updated, { message: 'Session renamed' });
};

/**
 * DELETE /v1/tutor/sessions/:sessionId
 * Deletes a tutor session and its messages.
 */
export const deleteSession = async (req: Request, res: Response): Promise<void> => {
  const { sessionId } = req.params;
  const studentId = getRequestUserId(req);

  const session = await prisma.tutorSession.findUnique({ where: { id: sessionId } });
  if (!session || session.studentId !== studentId) {
    sendError(res, 404, 'Session not found', { errorCode: 'NOT_FOUND' });
    return;
  }

  await prisma.tutorSession.delete({
    where: { id: sessionId },
  });

  sendSuccess(res, null, { message: 'Session deleted' });
};

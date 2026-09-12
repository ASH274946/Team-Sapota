import type { Socket } from 'socket.io';
import { AITutorService } from '../services/ai-tutor.service';
import { StreakService } from '../services/streak.service';
import prisma from '../config/prisma';
import { logger } from '../utils/logger';
import type { ClientToServerEvents, ServerToClientEvents } from '../types/socket.types';

const SESSION_ID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const activeStreams = new Map<string, AbortController>();

type TutorSocket = Socket<ClientToServerEvents, ServerToClientEvents>;

function isValidSessionId(value: unknown): value is string {
  return typeof value === 'string' && SESSION_ID_RE.test(value.trim());
}

function sessionRoom(sessionId: string): string {
  return `tutor:${sessionId.trim()}`;
}

async function verifySessionAccess(sessionId: string, userId: string): Promise<boolean> {
  const session = await prisma.tutorSession.findUnique({
    where: { id: sessionId },
    select: { studentId: true, status: true },
  });
  return Boolean(session && session.studentId === userId && session.status === 'ACTIVE');
}

export function registerTutorSocketHandlers(socket: TutorSocket): void {
  socket.on('tutor:join_session', async ({ sessionId }) => {
    if (!isValidSessionId(sessionId)) return;
    const userId = socket.data.userId;
    if (!userId) return;

    const allowed = await verifySessionAccess(sessionId, userId);
    if (!allowed) {
      socket.emit('tutor:error', { requestId: 'join', error: 'Not authorized for this tutor session' });
      return;
    }

    socket.join(sessionRoom(sessionId));
  });

  socket.on('tutor:leave_session', ({ sessionId }) => {
    if (!isValidSessionId(sessionId)) return;
    socket.leave(sessionRoom(sessionId));
  });

  socket.on('tutor:stream_query', async (payload) => {
    const { sessionId, message, mode, requestId } = payload;
    const userId = socket.data.userId;

    if (!userId || !isValidSessionId(sessionId) || !requestId || !message?.trim()) {
      socket.emit('tutor:error', {
        requestId: requestId ?? 'unknown',
        error: 'Invalid tutor stream request',
      });
      return;
    }

    const allowed = await verifySessionAccess(sessionId, userId);
    if (!allowed) {
      socket.emit('tutor:error', { requestId, error: 'Not authorized for this tutor session' });
      return;
    }

    const streamKey = `${socket.id}:${requestId}`;
    activeStreams.get(streamKey)?.abort();
    const abortController = new AbortController();
    activeStreams.set(streamKey, abortController);

    socket.join(sessionRoom(sessionId));

    let chunkIndex = 0;
    try {
      const session = await prisma.tutorSession.findUnique({
        where: { id: sessionId },
        select: { organizationId: true },
      });
      const organizationId = session?.organizationId ?? '';

      for await (const event of AITutorService.streamChat(
        sessionId,
        userId,
        organizationId,
        message.trim(),
        mode,
        abortController.signal
      )) {
        if (abortController.signal.aborted) break;

        if (event.type === 'sources') {
          socket.emit('tutor:sources', { requestId, sources: event.sources });
        } else if (event.type === 'token') {
          socket.emit('tutor:chunk', { requestId, token: event.token, index: chunkIndex++ });
        } else if (event.type === 'done') {
          if (userId !== 'demo-faculty-id') {
            await StreakService.recordActivity(userId);
          }
          socket.emit('tutor:done', {
            requestId,
            messageId: event.result.messageId,
            message: event.result.message,
            followUp: event.result.followUp,
            confidence: event.result.confidenceScore,
            ragReferences: event.result.ragReferences,
          });
        }
      }
    } catch (error) {
      logger.error({ err: error, sessionId, requestId }, 'Tutor stream failed');
      socket.emit('tutor:error', {
        requestId,
        error: (error as Error).message || 'Tutor stream failed',
      });
    } finally {
      activeStreams.delete(streamKey);
    }
  });

  socket.on('disconnect', () => {
    for (const [key, controller] of activeStreams.entries()) {
      if (key.startsWith(`${socket.id}:`)) {
        controller.abort();
        activeStreams.delete(key);
      }
    }
  });
}

export function abortTutorStreamsForSocket(socketId: string): void {
  for (const [key, controller] of activeStreams.entries()) {
    if (key.startsWith(`${socketId}:`)) {
      controller.abort();
      activeStreams.delete(key);
    }
  }
}

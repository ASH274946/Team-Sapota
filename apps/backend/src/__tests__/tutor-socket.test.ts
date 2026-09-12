import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../config/prisma', () => ({
  default: {
    tutorSession: {
      findUnique: vi.fn(),
    },
  },
}));

vi.mock('../services/ai-tutor.service', () => ({
  AITutorService: {
    streamChat: vi.fn(),
  },
}));

vi.mock('../services/streak.service', () => ({
  StreakService: {
    recordActivity: vi.fn().mockResolvedValue(undefined),
  },
}));

import prisma from '../config/prisma';
import { AITutorService } from '../services/ai-tutor.service';
import { registerTutorSocketHandlers } from '../sockets/tutor.socket';

describe('Tutor Socket Event Handlers & Session Authorization', () => {
  let mockSocket: any;
  let eventHandlers: Record<string, (...args: any[]) => any>;

  beforeEach(() => {
    vi.clearAllMocks();
    eventHandlers = {};

    mockSocket = {
      id: 'socket-123',
      data: { userId: 'student-456' },
      on: vi.fn((event: string, handler: (...args: any[]) => any) => {
        eventHandlers[event] = handler;
      }),
      emit: vi.fn(),
      join: vi.fn(),
      leave: vi.fn(),
    };

    registerTutorSocketHandlers(mockSocket);
  });

  it('rejects unauthorized tutor:stream_query when session studentId does not match authenticated user', async () => {
    vi.mocked(prisma.tutorSession.findUnique).mockResolvedValue({
      id: '12345678-1234-1234-1234-123456789012',
      studentId: 'other-student-999',
      status: 'ACTIVE',
    } as any);

    await eventHandlers['tutor:stream_query']({
      sessionId: '12345678-1234-1234-1234-123456789012',
      message: 'What is momentum?',
      requestId: 'req-1',
    });

    expect(mockSocket.emit).toHaveBeenCalledWith('tutor:error', {
      requestId: 'req-1',
      error: 'Not authorized for this tutor session',
    });
  });

  it('streams tutor chunks, sources, and done events for authorized student requests', async () => {
    vi.mocked(prisma.tutorSession.findUnique).mockResolvedValue({
      id: '12345678-1234-1234-1234-123456789012',
      studentId: 'student-456',
      status: 'ACTIVE',
      organizationId: 'org-100',
    } as any);

    async function* mockStreamGenerator() {
      yield {
        type: 'sources' as const,
        sources: [
          {
            chunkId: 'c1',
            documentId: 'd1',
            filename: 'Physics.pdf',
            excerpt: 'Momentum definition',
            score: 0.9,
          },
        ],
      };
      yield { type: 'token' as const, token: 'Momentum ' };
      yield { type: 'token' as const, token: 'is mass times velocity.' };
      yield {
        type: 'done' as const,
        result: {
          message: 'Momentum is mass times velocity.',
          followUp: 'Try a problem?',
          messageId: 'msg-final-1',
          confidenceScore: 0.95,
        },
      };
    }

    vi.mocked(AITutorService.streamChat).mockImplementation(mockStreamGenerator as any);

    await eventHandlers['tutor:stream_query']({
      sessionId: '12345678-1234-1234-1234-123456789012',
      message: 'What is momentum?',
      requestId: 'req-1',
      mode: 'SOCRATIC',
    });

    expect(mockSocket.emit).toHaveBeenCalledWith('tutor:sources', {
      requestId: 'req-1',
      sources: expect.arrayContaining([
        expect.objectContaining({ filename: 'Physics.pdf' }),
      ]),
    });

    expect(mockSocket.emit).toHaveBeenCalledWith('tutor:chunk', {
      requestId: 'req-1',
      token: 'Momentum ',
      index: 0,
    });

    expect(mockSocket.emit).toHaveBeenCalledWith('tutor:chunk', {
      requestId: 'req-1',
      token: 'is mass times velocity.',
      index: 1,
    });

    expect(mockSocket.emit).toHaveBeenCalledWith('tutor:done', expect.objectContaining({
      requestId: 'req-1',
      messageId: 'msg-final-1',
      message: 'Momentum is mass times velocity.',
    }));
  });

  it('aborts active stream on socket disconnect', async () => {
    let abortSignaled = false;

    async function* mockInfiniteStream(
      _s: string,
      _u: string,
      _o: string,
      _m: string,
      _mode: string | undefined,
      signal?: AbortSignal
    ) {
      if (signal) {
        signal.addEventListener('abort', () => {
          abortSignaled = true;
        });
      }
      yield { type: 'token' as const, token: 'Token 1' };
      await new Promise((resolve) => setTimeout(resolve, 50));
      if (signal?.aborted) {
        abortSignaled = true;
      }
    }

    vi.mocked(prisma.tutorSession.findUnique).mockResolvedValue({
      id: '12345678-1234-1234-1234-123456789012',
      studentId: 'student-456',
      status: 'ACTIVE',
    } as any);

    vi.mocked(AITutorService.streamChat).mockImplementation(mockInfiniteStream as any);

    const streamPromise = eventHandlers['tutor:stream_query']({
      sessionId: '12345678-1234-1234-1234-123456789012',
      message: 'Explain inertia',
      requestId: 'req-abort-test',
    });

    await new Promise((resolve) => setTimeout(resolve, 5));
    eventHandlers['disconnect']();

    await streamPromise;
    expect(abortSignaled).toBe(true);
  });
});

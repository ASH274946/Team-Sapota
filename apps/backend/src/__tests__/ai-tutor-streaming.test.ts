import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../config/prisma', () => ({
  default: {
    tutorSession: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    tutorMessage: {
      create: vi.fn(),
    },
    studentLearningProfile: {
      findUnique: vi.fn(),
    },
    teacherTutorConfig: {
      findUnique: vi.fn(),
    },
  },
}));

vi.mock('../services/rag.service', () => ({
  retrieveContext: vi.fn().mockResolvedValue('RAG context'),
  retrieveContextWithSources: vi.fn().mockResolvedValue({
    context: 'RAG context',
    sources: [
      {
        chunkId: 'chunk-1',
        documentId: 'doc-1',
        filename: 'Physics Notes.pdf',
        excerpt: 'Newton laws summary',
        score: 1.2,
      },
    ],
  }),
}));

vi.mock('../services/ai/ai-orchestrator.service', () => ({
  AIOrchestrator: {
    generate: vi.fn(),
    stream: vi.fn(),
  },
}));

import prisma from '../config/prisma';
import { AITutorService } from '../services/ai-tutor.service';
import { AIOrchestrator } from '../services/ai/ai-orchestrator.service';

describe('AITutorService.streamChat', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(prisma.tutorSession.findUnique).mockResolvedValue({
      id: 'session-1',
      studentId: 'student-1',
      subject: 'Physics',
      tutorMode: 'SOCRATIC',
      organizationId: 'org-1',
      messages: [],
    } as any);

    vi.mocked(prisma.studentLearningProfile.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.teacherTutorConfig.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.tutorMessage.create)
      .mockResolvedValueOnce({ id: 'user-msg' } as any)
      .mockResolvedValueOnce({ id: 'assistant-msg' } as any);
    vi.mocked(prisma.tutorSession.update).mockResolvedValue({} as any);

    vi.mocked(AIOrchestrator.stream).mockImplementation(async function* mockStream() {
      yield 'Hello ';
      yield 'student!';
    });
  });

  it('yields sources, tokens, and done events', async () => {
    const events = [];
    for await (const event of AITutorService.streamChat(
      'session-1',
      'student-1',
      'org-1',
      'Explain Newton\'s first law'
    )) {
      events.push(event);
    }

    expect(events[0]).toEqual({
      type: 'sources',
      sources: expect.arrayContaining([
        expect.objectContaining({ chunkId: 'chunk-1', filename: 'Physics Notes.pdf' }),
      ]),
    });
    expect(events.filter((e) => e.type === 'token').map((e: any) => e.token).join('')).toBe('Hello student!');
    expect(events.at(-1)).toMatchObject({
      type: 'done',
      result: expect.objectContaining({
        messageId: 'assistant-msg',
        message: 'Hello student!',
      }),
    });
  });
});

describe('AITutorService.chat', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(prisma.tutorSession.findUnique).mockResolvedValue({
      id: 'session-1',
      studentId: 'student-1',
      subject: 'Physics',
      tutorMode: 'SOCRATIC',
      organizationId: 'org-1',
      messages: [],
    } as any);

    vi.mocked(prisma.studentLearningProfile.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.teacherTutorConfig.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.tutorMessage.create)
      .mockResolvedValueOnce({ id: 'user-msg' } as any)
      .mockResolvedValueOnce({ id: 'assistant-msg' } as any);
    vi.mocked(prisma.tutorSession.update).mockResolvedValue({} as any);

    vi.mocked(AIOrchestrator.generate).mockResolvedValue({
      message: 'HTTP tutor reply',
      suggestedFollowUp: 'Want another hint?',
      confidenceScore: 0.9,
      isDomainViolation: false,
    });
  });

  it('returns HTTP fallback payload', async () => {
    const result = await AITutorService.chat(
      'session-1',
      'student-1',
      'org-1',
      'What is velocity?'
    );

    expect(result).toMatchObject({
      message: 'HTTP tutor reply',
      followUp: 'Want another hint?',
      messageId: 'assistant-msg',
    });
  });
});

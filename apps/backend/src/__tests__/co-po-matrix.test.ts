import { describe, it, expect, vi } from 'vitest';
import { CurriculumGraphService } from '../services/obe/curriculum-graph.service';
import prisma from '../config/prisma';

vi.mock('../config/prisma', () => {
  const mockCourse = {
    id: 'course-123',
    name: 'Advanced Software Engineering',
    code: 'CS401',
    description: 'Core SE concepts and design patterns',
    organizationId: 'org-123',
  };

  const mockCos = [
    {
      id: 'co-1',
      code: 'CO1',
      description: 'Recall and list key software engineering principles.',
      bloomLevel: 'REMEMBER',
      courseId: 'course-123',
      organizationId: 'org-123',
      coMappings: [
        { id: 'm-1', coId: 'co-1', poId: 'po-1', weightage: 3, po: { id: 'po-1', code: 'PO1', description: 'Engineering Knowledge' } },
      ],
    },
    {
      id: 'co-2',
      code: 'CO2',
      description: 'Design a scalable cloud-native microservices backend system.',
      bloomLevel: 'CREATE',
      courseId: 'course-123',
      organizationId: 'org-123',
      coMappings: [
        { id: 'm-2', coId: 'co-2', poId: 'po-2', weightage: 2, po: { id: 'po-2', code: 'PO2', description: 'Problem Analysis' } },
      ],
    },
  ];

  const mockPos = [
    { id: 'po-1', code: 'PO1', description: 'Engineering Knowledge', programId: 'prog-1', organizationId: 'org-123' },
    { id: 'po-2', code: 'PO2', description: 'Problem Analysis', programId: 'prog-1', organizationId: 'org-123' },
    { id: 'po-3', code: 'PO3', description: 'Design/Development of Solutions', programId: 'prog-1', organizationId: 'org-123' },
  ];

  return {
    default: {
      course: {
        findFirst: vi.fn().mockImplementation(({ where }) => {
          if (where.id === 'course-123' && where.organizationId === 'org-123') return Promise.resolve(mockCourse);
          return Promise.resolve(null);
        }),
      },
      courseOutcome: {
        findMany: vi.fn().mockResolvedValue(mockCos),
        findFirst: vi.fn().mockImplementation(({ where }) => {
          const found = mockCos.find((c) => c.id === where.id);
          return Promise.resolve(found || null);
        }),
        update: vi.fn().mockImplementation(({ where, data }) => {
          const found = mockCos.find((c) => c.id === where.id);
          if (found) found.bloomLevel = data.bloomLevel;
          return Promise.resolve(found);
        }),
      },
      programOutcome: {
        findMany: vi.fn().mockResolvedValue(mockPos),
        findFirst: vi.fn().mockImplementation(({ where }) => {
          const found = mockPos.find((p) => p.id === where.id);
          return Promise.resolve(found || null);
        }),
      },
      coPoMapping: {
        findUnique: vi.fn().mockResolvedValue(null),
        findMany: vi.fn().mockResolvedValue([]),
        create: vi.fn().mockImplementation(({ data }) => Promise.resolve({ id: 'm-new', ...data })),
        update: vi.fn().mockImplementation(({ where, data }) => Promise.resolve({ id: where.id, ...data })),
      },
      mappingReview: {
        create: vi.fn().mockResolvedValue({ id: 'rev-1' }),
        createMany: vi.fn().mockResolvedValue({ count: 1 }),
      },
    },
  };
});

describe('CO/PO Matrix & Bloom Overrides API Service', () => {
  it('retrieves CO/PO Matrix with Bloom confidence & cue analysis', async () => {
    const res = await CurriculumGraphService.getCoPoMatrix('course-123', 'org-123');

    expect(res.course.code).toBe('CS401');
    expect(res.cos.length).toBe(2);
    expect(res.pos.length).toBe(3);
    expect(res.matrix.length).toBe(2);
    expect(res.bloomClassifications.length).toBe(2);

    const co1Class = res.bloomClassifications.find((c) => c.coCode === 'CO1');
    expect(co1Class?.predictedLevel).toBe('REMEMBER');
    expect(co1Class?.confidence).toBeGreaterThan(0.5);

    const co2Class = res.bloomClassifications.find((c) => c.coCode === 'CO2');
    expect(co2Class?.predictedLevel).toBe('CREATE');
    expect(co2Class?.confidence).toBeGreaterThan(0.5);
  });

  it('updates matrix weightages and persists faculty Bloom level overrides', async () => {
    const updateRes = await CurriculumGraphService.updateCoPoMatrix('course-123', 'org-123', {
      bloomOverrides: [
        { coId: 'co-1', bloomLevel: 'UNDERSTAND' },
      ],
      mappings: [
        { coId: 'co-1', poId: 'po-2', weightage: 3 },
      ],
      reason: 'Faculty curriculum committee override for Academic Year 2026-27',
    });

    expect(updateRes.course.code).toBe('CS401');
    expect(prisma.courseOutcome.update).toHaveBeenCalled();
  });

  it('throws 404 error if course is not found or organization is invalid', async () => {
    await expect(
      CurriculumGraphService.getCoPoMatrix('invalid-course', 'org-123')
    ).rejects.toThrow('Course not found');
  });
});

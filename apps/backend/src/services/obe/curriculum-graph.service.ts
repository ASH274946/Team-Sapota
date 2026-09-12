import prisma from '../../config/prisma';
import { ApiError } from '../../api/common/errors';
import type { BloomLevel, Prisma } from '@prisma/client';
import { BloomClassifierService } from './bloom.service';

export class CurriculumGraphService {
  static async createCourseOutcome(data: {
    code: string;
    description: string;
    bloomLevel: BloomLevel;
    courseId: string;
    organizationId: string;
  }) {
    const course = await prisma.course.findFirst({
      where: { id: data.courseId, organizationId: data.organizationId },
    });
    if (!course) throw ApiError.notFound('Course not found');

    try {
      return await prisma.courseOutcome.create({
        data: {
          code: data.code,
          description: data.description,
          bloomLevel: data.bloomLevel,
          courseId: data.courseId,
          organizationId: data.organizationId,
        },
      });
    } catch (err: unknown) {
      if (err instanceof Error && 'code' in err && (err as { code: string }).code === 'P2002') {
        throw ApiError.conflict(`Course Outcome "${data.code}" already exists for this course`);
      }
      throw err;
    }
  }

  static async updateCourseOutcome(
    id: string,
    organizationId: string,
    data: { code?: string; description?: string; bloomLevel?: BloomLevel }
  ) {
    const existing = await prisma.courseOutcome.findFirst({
      where: { id, organizationId },
    });
    if (!existing) throw ApiError.notFound('Course Outcome not found');

    return prisma.courseOutcome.update({
      where: { id },
      data: {
        ...(data.code !== undefined && { code: data.code }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.bloomLevel !== undefined && { bloomLevel: data.bloomLevel }),
      },
    });
  }

  static async deleteCourseOutcome(id: string, organizationId: string) {
    const existing = await prisma.courseOutcome.findFirst({
      where: { id, organizationId },
    });
    if (!existing) throw ApiError.notFound('Course Outcome not found');

    return prisma.$transaction([
      prisma.coPoMapping.deleteMany({ where: { coId: id } }),
      prisma.blueprintItem.deleteMany({ where: { coId: id } }),
      prisma.courseOutcome.delete({ where: { id } }),
    ]);
  }

  static async createProgramOutcome(data: {
    code: string;
    description: string;
    programId: string;
    organizationId: string;
  }) {
    const program = await prisma.program.findFirst({
      where: { id: data.programId, organizationId: data.organizationId },
    });
    if (!program) throw ApiError.notFound('Program not found');

    try {
      return await prisma.programOutcome.create({
        data: {
          code: data.code,
          description: data.description,
          programId: data.programId,
          organizationId: data.organizationId,
        },
      });
    } catch (err: unknown) {
      if (err instanceof Error && 'code' in err && (err as { code: string }).code === 'P2002') {
        throw ApiError.conflict(`Program Outcome "${data.code}" already exists for this program`);
      }
      throw err;
    }
  }

  static async updateProgramOutcome(
    id: string,
    organizationId: string,
    data: { code?: string; description?: string }
  ) {
    const existing = await prisma.programOutcome.findFirst({
      where: { id, organizationId },
    });
    if (!existing) throw ApiError.notFound('Program Outcome not found');

    return prisma.programOutcome.update({
      where: { id },
      data: {
        ...(data.code !== undefined && { code: data.code }),
        ...(data.description !== undefined && { description: data.description }),
      },
    });
  }

  static async deleteProgramOutcome(id: string, organizationId: string) {
    const existing = await prisma.programOutcome.findFirst({
      where: { id, organizationId },
    });
    if (!existing) throw ApiError.notFound('Program Outcome not found');

    return prisma.$transaction([
      prisma.coPoMapping.deleteMany({ where: { poId: id } }),
      prisma.programOutcome.delete({ where: { id } }),
    ]);
  }

  static async upsertCoPoMapping(data: {
    coId: string;
    poId: string;
    weightage: number;
    organizationId: string;
    changedById?: string;
    reason?: string;
  }) {
    const co = await prisma.courseOutcome.findFirst({
      where: { id: data.coId, organizationId: data.organizationId },
    });
    if (!co) throw ApiError.notFound('Course Outcome not found');

    const po = await prisma.programOutcome.findFirst({
      where: { id: data.poId, organizationId: data.organizationId },
    });
    if (!po) throw ApiError.notFound('Program Outcome not found');

    const existing = await prisma.coPoMapping.findUnique({
      where: { coId_poId: { coId: data.coId, poId: data.poId } },
    });

    if (existing) {
      if (existing.weightage === data.weightage) return existing;

      const updated = await prisma.coPoMapping.update({
        where: { id: existing.id },
        data: { weightage: data.weightage },
      });

      if (data.reason) {
        await prisma.mappingReview.create({
          data: {
            coPoMappingId: updated.id,
            previousWeightage: existing.weightage,
            newWeightage: data.weightage,
            reason: data.reason,
            changedById: data.changedById ?? null,
          },
        });
      }

      return updated;
    }

    const created = await prisma.coPoMapping.create({
      data: {
        coId: data.coId,
        poId: data.poId,
        weightage: data.weightage,
      },
    });

    if (data.reason) {
      await prisma.mappingReview.create({
        data: {
          coPoMappingId: created.id,
          previousWeightage: null,
          newWeightage: data.weightage,
          reason: data.reason,
          changedById: data.changedById ?? null,
        },
      });
    }

    return created;
  }

  static async bulkUpsertCoPoMappings(data: {
    mappings: Array<{ coId: string; poId: string; weightage: number }>;
    organizationId: string;
    changedById?: string;
    reason?: string;
  }) {
    const coIds = [...new Set(data.mappings.map((m) => m.coId))];
    const poIds = [...new Set(data.mappings.map((m) => m.poId))];

    const [validCos, validPos] = await Promise.all([
      prisma.courseOutcome.findMany({
        where: { id: { in: coIds }, organizationId: data.organizationId },
        select: { id: true },
      }),
      prisma.programOutcome.findMany({
        where: { id: { in: poIds }, organizationId: data.organizationId },
        select: { id: true },
      }),
    ]);

    const validCoIds = new Set(validCos.map((c) => c.id));
    const validPoIds = new Set(validPos.map((p) => p.id));

    const invalid = data.mappings.filter(
      (m) => !validCoIds.has(m.coId) || !validPoIds.has(m.poId)
    );
    if (invalid.length > 0) {
      throw ApiError.badRequest(
        `Invalid mappings: ${invalid.map((m) => `${m.coId}->${m.poId}`).join(', ')}`
      );
    }

    const existingMappings = await prisma.coPoMapping.findMany({
      where: {
        OR: data.mappings.map((m) => ({ coId: m.coId, poId: m.poId })),
      },
    });

    const existingMap = new Map(existingMappings.map((m) => [`${m.coId}:${m.poId}`, m]));

    const results: Array<{ id: string }> = [];
    const reviews: Array<Prisma.MappingReviewCreateManyInput> = [];

    for (const m of data.mappings) {
      const key = `${m.coId}:${m.poId}`;
      const existing = existingMap.get(key);

      if (existing) {
        if (existing.weightage !== m.weightage) {
          const updated = await prisma.coPoMapping.update({
            where: { id: existing.id },
            data: { weightage: m.weightage },
          });
          results.push(updated);

          if (data.reason) {
            reviews.push({
              coPoMappingId: existing.id,
              previousWeightage: existing.weightage,
              newWeightage: m.weightage,
              reason: data.reason,
              changedById: data.changedById ?? null,
            });
          }
        } else {
          results.push(existing);
        }
      } else {
        const created = await prisma.coPoMapping.create({
          data: { coId: m.coId, poId: m.poId, weightage: m.weightage },
        });
        results.push(created);

        if (data.reason) {
          reviews.push({
            coPoMappingId: created.id,
            previousWeightage: null,
            newWeightage: m.weightage,
            reason: data.reason,
            changedById: data.changedById ?? null,
          });
        }
      }
    }

    if (reviews.length > 0) {
      await prisma.mappingReview.createMany({ data: reviews });
    }

    return results;
  }

  static async getCurriculumGraph(courseId: string, organizationId: string) {
    const course = await prisma.course.findFirst({
      where: { id: courseId, organizationId },
    });
    if (!course) throw ApiError.notFound('Course not found');

    const outcomes = await prisma.courseOutcome.findMany({
      where: { courseId, organizationId },
      include: {
        coMappings: {
          include: {
            po: true,
            reviews: {
              orderBy: { createdAt: 'desc' },
              take: 5,
            },
          },
        },
      },
      orderBy: { code: 'asc' },
    });

    const programOutcomes = await prisma.programOutcome.findMany({
      where: { organizationId },
      orderBy: { code: 'asc' },
    });

    return {
      course,
      courseOutcomes: outcomes,
      programOutcomes,
      mappingMatrix: outcomes.map((co) => ({
        coId: co.id,
        coCode: co.code,
        bloomLevel: co.bloomLevel,
        mappings: co.coMappings.map((m) => ({
          poId: m.poId,
          poCode: m.po.code,
          weightage: m.weightage,
        })),
      })),
    };
  }

  static async validateMappingIntegrity(courseId: string, organizationId: string) {
    const [outcomes, programOutcomes] = await Promise.all([
      prisma.courseOutcome.findMany({
        where: { courseId, organizationId },
        include: { coMappings: true },
      }),
      prisma.programOutcome.findMany({
        where: { organizationId },
        include: { poMappings: true },
      }),
    ]);

    const issues: Array<{ type: string; coId?: string; coCode?: string; message: string }> = [];

    for (const co of outcomes) {
      if (co.coMappings.length === 0) {
        issues.push({
          type: 'UNMAPPED_CO',
          coId: co.id,
          coCode: co.code,
          message: `Course Outcome "${co.code}" has no program outcome mappings`,
        });
      }
    }

    for (const po of programOutcomes) {
      if (po.poMappings.length === 0) {
        issues.push({
          type: 'UNMAPPED_PO',
          message: `Program Outcome "${po.code}" is not mapped to any course outcomes`,
        });
      }
    }

    return {
      valid: issues.length === 0,
      issues,
      totalCOs: outcomes.length,
      mappedCOs: outcomes.filter((co) => co.coMappings.length > 0).length,
      totalPOs: programOutcomes.length,
      mappedPOs: programOutcomes.filter((po) => po.poMappings.length > 0).length,
    };
  }

  static async listCourses(organizationId: string, departmentId?: string) {
    return prisma.course.findMany({
      where: {
        organizationId,
        ...(departmentId && { departmentId }),
      },
      include: {
        _count: { select: { outcomes: true, blueprints: true } },
      },
      orderBy: { code: 'asc' },
    });
  }

  static async listPrograms(organizationId: string) {
    return prisma.program.findMany({
      where: { organizationId },
      include: {
        _count: { select: { outcomes: true } },
      },
      orderBy: { code: 'asc' },
    });
  }

  static async listProgramOutcomes(programId: string, organizationId: string) {
    const program = await prisma.program.findFirst({
      where: { id: programId, organizationId },
    });
    if (!program) throw ApiError.notFound('Program not found');
    return prisma.programOutcome.findMany({
      where: { programId, organizationId },
      orderBy: { code: 'asc' },
    });
  }

  static async createCourse(data: {
    name: string;
    code: string;
    description?: string;
    departmentId?: string;
    organizationId: string;
  }) {
    try {
      return await prisma.course.create({
        data: {
          name: data.name,
          code: data.code,
          description: data.description ?? null,
          departmentId: data.departmentId ?? null,
          organizationId: data.organizationId,
        },
      });
    } catch (err: unknown) {
      if (err instanceof Error && 'code' in err && (err as { code: string }).code === 'P2002') {
        throw ApiError.conflict(`Course "${data.code}" already exists`);
      }
      throw err;
    }
  }

  static async createProgram(data: {
    name: string;
    code: string;
    description?: string;
    organizationId: string;
  }) {
    try {
      return await prisma.program.create({
        data: {
          name: data.name,
          code: data.code,
          description: data.description ?? null,
          organizationId: data.organizationId,
        },
      });
    } catch (err: unknown) {
      if (err instanceof Error && 'code' in err && (err as { code: string }).code === 'P2002') {
        throw ApiError.conflict(`Program "${data.code}" already exists`);
      }
      throw err;
    }
  }

  static async getMappingHistory(coId: string, poId: string, organizationId: string) {
    const mapping = await prisma.coPoMapping.findFirst({
      where: {
        coId,
        poId,
        co: { organizationId },
      },
    });
    if (!mapping) throw ApiError.notFound('Mapping not found');

    return prisma.mappingReview.findMany({
      where: { coPoMappingId: mapping.id },
      orderBy: { createdAt: 'desc' },
    });
  }

  static async getCoPoMatrix(courseId: string, organizationId: string) {
    const course = await prisma.course.findFirst({
      where: { id: courseId, organizationId },
    });
    if (!course) throw ApiError.notFound('Course not found');

    const cos = await prisma.courseOutcome.findMany({
      where: { courseId, organizationId },
      include: {
        coMappings: {
          include: { po: true },
        },
      },
      orderBy: { code: 'asc' },
    });

    const pos = await prisma.programOutcome.findMany({
      where: { organizationId },
      orderBy: { code: 'asc' },
    });

    // Compute Bloom classifications & confidence scores for each CO
    const bloomClassifications = cos.map((co) => {
      const classification = BloomClassifierService.classify(co.description);
      return {
        coId: co.id,
        coCode: co.code,
        predictedLevel: classification.level,
        effectiveLevel: co.bloomLevel,
        confidence: classification.confidence,
        cues: classification.cues,
        explanation: classification.explanation,
      };
    });

    const matrix = cos.map((co) => ({
      coId: co.id,
      coCode: co.code,
      bloomLevel: co.bloomLevel,
      mappings: pos.map((po) => {
        const found = co.coMappings.find((m) => m.poId === po.id);
        return {
          poId: po.id,
          poCode: po.code,
          weightage: found ? found.weightage : 0,
        };
      }),
    }));

    return {
      course: {
        id: course.id,
        name: course.name,
        code: course.code,
        description: course.description,
      },
      cos: cos.map((c) => ({
        id: c.id,
        code: c.code,
        description: c.description,
        bloomLevel: c.bloomLevel,
      })),
      pos: pos.map((p) => ({
        id: p.id,
        code: p.code,
        description: p.description,
      })),
      matrix,
      bloomClassifications,
      version: 1,
    };
  }

  static async updateCoPoMatrix(
    courseId: string,
    organizationId: string,
    data: {
      mappings?: Array<{ coId: string; poId: string; weightage: number }>;
      bloomOverrides?: Array<{ coId: string; bloomLevel: BloomLevel }>;
      changedById?: string;
      reason?: string;
    }
  ) {
    const course = await prisma.course.findFirst({
      where: { id: courseId, organizationId },
    });
    if (!course) throw ApiError.notFound('Course not found');

    // 1. Process bloomOverrides
    if (data.bloomOverrides && data.bloomOverrides.length > 0) {
      for (const override of data.bloomOverrides) {
        const co = await prisma.courseOutcome.findFirst({
          where: { id: override.coId, courseId, organizationId },
        });
        if (co) {
          await prisma.courseOutcome.update({
            where: { id: co.id },
            data: { bloomLevel: override.bloomLevel },
          });
        }
      }
    }

    // 2. Process matrix mappings
    if (data.mappings && data.mappings.length > 0) {
      await this.bulkUpsertCoPoMappings({
        mappings: data.mappings,
        organizationId,
        changedById: data.changedById,
        reason: data.reason,
      });
    }

    return this.getCoPoMatrix(courseId, organizationId);
  }
}

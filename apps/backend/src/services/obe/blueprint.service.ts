import prisma from '../../config/prisma';
import { ApiError } from '../../api/common/errors';
import type { BloomLevel, BlueprintItemType } from '@prisma/client';

export class BlueprintService {
  static async createBlueprint(data: {
    title: string;
    description?: string;
    courseId: string;
    totalMarks: number;
    organizationId: string;
    createdBy: string;
    items?: Array<{
      coId: string;
      title: string;
      marks: number;
      count?: number;
      bloomLevel: BloomLevel;
      itemType?: BlueprintItemType;
      topic?: string;
    }>;
  }) {
    const course = await prisma.course.findFirst({
      where: { id: data.courseId, organizationId: data.organizationId },
    });
    if (!course) throw ApiError.notFound('Course not found');

    if (data.items && data.items.length > 0) {
      const coIds = [...new Set(data.items.map((i) => i.coId))];
      const validCos = await prisma.courseOutcome.findMany({
        where: { id: { in: coIds }, organizationId: data.organizationId },
        select: { id: true },
      });
      const validCoIds = new Set(validCos.map((c) => c.id));
      const invalid = coIds.filter((id) => !validCoIds.has(id));
      if (invalid.length > 0) {
        throw ApiError.badRequest(`Invalid Course Outcome IDs: ${invalid.join(', ')}`);
      }
    }

    return prisma.blueprint.create({
      data: {
        title: data.title,
        description: data.description ?? null,
        courseId: data.courseId,
        organizationId: data.organizationId,
        totalMarks: data.totalMarks,
        createdBy: data.createdBy,
        items: data.items
          ? {
              create: data.items.map((item) => ({
                coId: item.coId,
                title: item.title,
                marks: item.marks,
                count: item.count ?? 1,
                bloomLevel: item.bloomLevel,
                itemType: item.itemType ?? 'MCQ',
                topic: item.topic ?? null,
              })),
            }
          : undefined,
      },
      include: {
        items: { include: { co: true } },
        course: true,
      },
    });
  }

  static async getBlueprint(id: string, organizationId: string) {
    const blueprint = await prisma.blueprint.findFirst({
      where: { id, organizationId },
      include: {
        items: { include: { co: true }, orderBy: { createdAt: 'asc' } },
        course: true,
      },
    });
    if (!blueprint) throw ApiError.notFound('Blueprint not found');
    return blueprint;
  }

  static async listBlueprints(courseId: string, organizationId: string) {
    return prisma.blueprint.findMany({
      where: { courseId, organizationId },
      include: {
        _count: { select: { items: true } },
        course: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  static async listPendingBlueprints(organizationId: string) {
    return prisma.blueprint.findMany({
      where: {
        organizationId,
        status: 'PENDING_REVIEW',
      },
      include: {
        _count: { select: { items: true } },
        course: { select: { id: true, code: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  static async addItem(blueprintId: string, organizationId: string, data: {
    coId: string;
    title: string;
    marks: number;
    count?: number;
    bloomLevel: BloomLevel;
    itemType?: BlueprintItemType;
    topic?: string;
  }) {
    const blueprint = await prisma.blueprint.findFirst({
      where: { id: blueprintId, organizationId },
    });
    if (!blueprint) throw ApiError.notFound('Blueprint not found');
    if (blueprint.status === 'APPROVED') throw ApiError.badRequest('Cannot modify an approved blueprint');

    const co = await prisma.courseOutcome.findFirst({
      where: { id: data.coId, organizationId },
    });
    if (!co) throw ApiError.notFound('Course Outcome not found');

    return prisma.blueprintItem.create({
      data: {
        blueprintId,
        coId: data.coId,
        title: data.title,
        marks: data.marks,
        count: data.count ?? 1,
        bloomLevel: data.bloomLevel,
        itemType: data.itemType ?? 'MCQ',
        topic: data.topic ?? null,
      },
      include: { co: true },
    });
  }

  static async removeItem(itemId: string, blueprintId: string, organizationId: string) {
    const blueprint = await prisma.blueprint.findFirst({
      where: { id: blueprintId, organizationId },
    });
    if (!blueprint) throw ApiError.notFound('Blueprint not found');
    if (blueprint.status === 'APPROVED') throw ApiError.badRequest('Cannot modify an approved blueprint');

    const item = await prisma.blueprintItem.findFirst({
      where: { id: itemId, blueprintId },
    });
    if (!item) throw ApiError.notFound('Blueprint item not found');

    return prisma.blueprintItem.delete({ where: { id: itemId } });
  }

  static async updateItem(itemId: string, blueprintId: string, organizationId: string, data: {
    title?: string;
    marks?: number;
    count?: number;
    bloomLevel?: BloomLevel;
    itemType?: BlueprintItemType;
    topic?: string;
  }) {
    const blueprint = await prisma.blueprint.findFirst({
      where: { id: blueprintId, organizationId },
    });
    if (!blueprint) throw ApiError.notFound('Blueprint not found');
    if (blueprint.status === 'APPROVED') throw ApiError.badRequest('Cannot modify an approved blueprint');

    const item = await prisma.blueprintItem.findFirst({
      where: { id: itemId, blueprintId },
    });
    if (!item) throw ApiError.notFound('Blueprint item not found');

    return prisma.blueprintItem.update({
      where: { id: itemId },
      data: {
        ...(data.title !== undefined && { title: data.title }),
        ...(data.marks !== undefined && { marks: data.marks }),
        ...(data.count !== undefined && { count: data.count }),
        ...(data.bloomLevel !== undefined && { bloomLevel: data.bloomLevel }),
        ...(data.itemType !== undefined && { itemType: data.itemType }),
        ...(data.topic !== undefined && { topic: data.topic }),
      },
      include: { co: true },
    });
  }

  static validateBlueprint(blueprint: {
    totalMarks: number;
    items: Array<{ marks: number; count: number; coId: string; bloomLevel: string }>;
  }) {
    const issues: Array<{ type: string; message: string; severity: 'error' | 'warning' }> = [];

    const totalItemMarks = blueprint.items.reduce(
      (sum, item) => sum + item.marks * item.count,
      0
    );

    if (totalItemMarks !== blueprint.totalMarks) {
      issues.push({
        type: 'TOTAL_MISMATCH',
        message: `Blueprint item marks (${totalItemMarks}) do not match total marks (${blueprint.totalMarks})`,
        severity: 'error',
      });
    }

    if (blueprint.items.length === 0) {
      issues.push({
        type: 'NO_ITEMS',
        message: 'Blueprint has no items',
        severity: 'error',
      });
      return { valid: false, issues, totalItemMarks, coCoverage: 0, bloomDistribution: {} };
    }

    const coMarksMap = new Map<string, number>();
    const bloomMap = new Map<string, number>();

    for (const item of blueprint.items) {
      const itemTotal = item.marks * item.count;
      coMarksMap.set(item.coId, (coMarksMap.get(item.coId) ?? 0) + itemTotal);
      bloomMap.set(item.bloomLevel, (bloomMap.get(item.bloomLevel) ?? 0) + itemTotal);
    }

    const maxCoMarks = Math.max(...Array.from(coMarksMap.values()));
    const coMarksRatio = maxCoMarks / blueprint.totalMarks;
    if (coMarksRatio > 0.4) {
      issues.push({
        type: 'CO_CONCENTRATION',
        message: `A single CO accounts for ${Math.round(coMarksRatio * 100)}% of total marks (max 40%)`,
        severity: 'warning',
      });
    }

    if (bloomMap.size === 1 && blueprint.items.length > 1) {
      issues.push({
        type: 'SINGLE_BLOOM',
        message: 'All items target the same Bloom level — consider diversifying',
        severity: 'warning',
      });
    }

    return {
      valid: !issues.some((i) => i.severity === 'error'),
      issues,
      totalItemMarks,
      coCoverage: coMarksMap.size,
      bloomDistribution: Object.fromEntries(bloomMap),
    };
  }

  static async validateBlueprintById(blueprintId: string, organizationId: string) {
    const blueprint = await this.getBlueprint(blueprintId, organizationId);
    return this.validateBlueprint(blueprint);
  }

  static async approveBlueprint(blueprintId: string, organizationId: string, approverId: string, comments?: string) {
    const updated = await prisma.blueprint.updateMany({
      where: {
        id: blueprintId,
        organizationId,
        status: { not: 'APPROVED' },
      },
      data: {
        status: 'APPROVED',
        approvedById: approverId,
        approvedAt: new Date(),
      },
    });

    if (updated.count === 0) {
      const existing = await prisma.blueprint.findFirst({ where: { id: blueprintId, organizationId } });
      if (!existing) throw ApiError.notFound('Blueprint not found');
      throw ApiError.badRequest('Blueprint is already approved');
    }

    await prisma.approvalRecord.create({
      data: {
        entityType: 'BLUEPRINT',
        entityId: blueprintId,
        organizationId,
        status: 'APPROVED',
        comments: comments ?? null,
        decidedById: approverId,
        decidedAt: new Date(),
      },
    });

    return this.getBlueprint(blueprintId, organizationId);
  }

  static async rejectBlueprint(blueprintId: string, organizationId: string, rejectorId: string, reason: string) {
    const updated = await prisma.blueprint.updateMany({
      where: {
        id: blueprintId,
        organizationId,
        status: { notIn: ['REJECTED', 'APPROVED'] },
      },
      data: {
        status: 'REJECTED',
        rejectedById: rejectorId,
        rejectedAt: new Date(),
        rejectionReason: reason,
      },
    });

    if (updated.count === 0) {
      const existing = await prisma.blueprint.findFirst({ where: { id: blueprintId, organizationId } });
      if (!existing) throw ApiError.notFound('Blueprint not found');
      throw ApiError.badRequest('Blueprint cannot be rejected in its current state');
    }

    await prisma.approvalRecord.create({
      data: {
        entityType: 'BLUEPRINT',
        entityId: blueprintId,
        organizationId,
        status: 'REJECTED',
        comments: reason,
        decidedById: rejectorId,
        decidedAt: new Date(),
      },
    });

    return this.getBlueprint(blueprintId, organizationId);
  }

  static async submitForReview(blueprintId: string, organizationId: string) {
    const updated = await prisma.blueprint.updateMany({
      where: {
        id: blueprintId,
        organizationId,
        status: 'DRAFT',
      },
      data: { status: 'PENDING_REVIEW' },
    });

    if (updated.count === 0) {
      const existing = await prisma.blueprint.findFirst({ where: { id: blueprintId, organizationId } });
      if (!existing) throw ApiError.notFound('Blueprint not found');
      throw ApiError.badRequest('Blueprint can only be submitted from DRAFT status');
    }

    return this.getBlueprint(blueprintId, organizationId);
  }
}

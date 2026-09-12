import prisma from '../../config/prisma';
import { ApiError } from '../../api/common/errors';

export class MappingReviewService {
  static async getChangeHistory(coPoMappingId: string, organizationId: string) {
    const mapping = await prisma.coPoMapping.findFirst({
      where: {
        id: coPoMappingId,
        co: { organizationId },
      },
    });
    if (!mapping) throw ApiError.notFound('Mapping not found');

    return prisma.mappingReview.findMany({
      where: { coPoMappingId: mapping.id },
      orderBy: { createdAt: 'desc' },
    });
  }

  static async getRecentChanges(organizationId: string, dateRange?: { from?: Date; to?: Date }) {
    const where: {
      coPoMapping: { co: { organizationId: string } };
      createdAt?: { gte?: Date; lte?: Date };
    } = {
      coPoMapping: { co: { organizationId } },
    };

    if (dateRange?.from || dateRange?.to) {
      where.createdAt = {};
      if (dateRange.from) where.createdAt.gte = dateRange.from;
      if (dateRange.to) where.createdAt.lte = dateRange.to;
    }

    return prisma.mappingReview.findMany({
      where,
      include: {
        coPoMapping: {
          include: {
            co: { select: { code: true, description: true } },
            po: { select: { code: true, description: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  static async getChangeStats(organizationId: string) {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentChanges = await prisma.mappingReview.findMany({
      where: {
        coPoMapping: { co: { organizationId } },
        createdAt: { gte: thirtyDaysAgo },
      },
      select: { changedById: true },
    });

    const contributorMap = new Map<string, number>();
    for (const change of recentChanges) {
      if (change.changedById) {
        contributorMap.set(change.changedById, (contributorMap.get(change.changedById) ?? 0) + 1);
      }
    }

    return {
      totalChangesLast30Days: recentChanges.length,
      topContributors: Array.from(contributorMap.entries())
        .map(([userId, count]) => ({ userId, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5),
    };
  }
}

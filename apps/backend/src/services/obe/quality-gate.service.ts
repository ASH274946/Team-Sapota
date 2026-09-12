import prisma from '../../config/prisma';
import { ApiError } from '../../api/common/errors';

export interface QualityGateResult {
  passed: boolean;
  checks: Array<{
    name: string;
    passed: boolean;
    message: string;
    severity: 'error' | 'warning';
  }>;
}

export class QualityGateService {
  static async validateBlueprintForGeneration(blueprintId: string, organizationId: string): Promise<QualityGateResult> {
    const blueprint = await prisma.blueprint.findFirst({
      where: { id: blueprintId, organizationId },
      include: {
        items: {
          include: {
            co: { select: { id: true, code: true, bloomLevel: true } },
          },
        },
        course: {
          include: {
            outcomes: { select: { id: true, code: true } },
          },
        },
      },
    });

    if (!blueprint) throw ApiError.notFound('Blueprint not found');

    const checks: QualityGateResult['checks'] = [];

    if (blueprint.status !== 'APPROVED') {
      checks.push({
        name: 'approval_status',
        passed: false,
        message: `Blueprint must be APPROVED (current: ${blueprint.status})`,
        severity: 'error',
      });
    } else {
      checks.push({ name: 'approval_status', passed: true, message: 'Blueprint is approved', severity: 'error' });
    }

    if (blueprint.items.length === 0) {
      checks.push({
        name: 'has_items',
        passed: false,
        message: 'Blueprint has no items — add questions before generating',
        severity: 'error',
      });
    } else {
      checks.push({ name: 'has_items', passed: true, message: `${blueprint.items.length} items defined`, severity: 'error' });
    }

    const totalItemMarks = blueprint.items.reduce((s, i) => s + i.marks, 0);
    if (totalItemMarks !== blueprint.totalMarks) {
      checks.push({
        name: 'marks_consistency',
        passed: false,
        message: `Item marks total (${totalItemMarks}) does not equal blueprint total (${blueprint.totalMarks})`,
        severity: 'warning',
      });
    } else {
      checks.push({ name: 'marks_consistency', passed: true, message: 'Marks are consistent', severity: 'warning' });
    }

    const outcomeIds = blueprint.course.outcomes.map((o) => o.id);
    const mappedCOIds = new Set(outcomeIds);
    const unmappedItems = blueprint.items.filter((item) => !mappedCOIds.has(item.coId));
    if (unmappedItems.length > 0) {
      checks.push({
        name: 'co_coverage',
        passed: false,
        message: `${unmappedItems.length} item(s) reference COs not in the course`,
        severity: 'error',
      });
    } else {
      checks.push({ name: 'co_coverage', passed: true, message: 'All items reference valid COs', severity: 'error' });
    }

    const coDistribution = new Map<string, number>();
    for (const item of blueprint.items) {
      coDistribution.set(item.coId, (coDistribution.get(item.coId) ?? 0) + item.marks);
    }
    const totalMarks = blueprint.totalMarks || 1;
    const imbalancedCOs = Array.from(coDistribution.entries()).filter(([, marks]) => (marks / totalMarks) > 0.5);
    if (imbalancedCOs.length > 0) {
      checks.push({
        name: 'co_balance',
        passed: false,
        message: `Some COs hold >50% of total marks — consider rebalancing`,
        severity: 'warning',
      });
    } else {
      checks.push({ name: 'co_balance', passed: true, message: 'CO marks distribution is balanced', severity: 'warning' });
    }

    const bloomDistribution = new Map<string, number>();
    for (const item of blueprint.items) {
      bloomDistribution.set(item.bloomLevel, (bloomDistribution.get(item.bloomLevel) ?? 0) + item.marks);
    }
    if (bloomDistribution.size === 1 && blueprint.items.length > 2) {
      checks.push({
        name: 'bloom_diversity',
        passed: false,
        message: 'All items target the same Bloom level — consider adding diversity',
        severity: 'warning',
      });
    } else {
      checks.push({ name: 'bloom_diversity', passed: true, message: `${bloomDistribution.size} Bloom levels covered`, severity: 'warning' });
    }

    const hasErrors = checks.some((c) => !c.passed && c.severity === 'error');
    return { passed: !hasErrors, checks };
  }
}

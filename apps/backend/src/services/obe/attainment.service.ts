import prisma from '../../config/prisma';
import { ApiError } from '../../api/common/errors';

export interface FormulaConfig {
  directWeight: number;
  indirectWeight: number;
}

const DEFAULT_FORMULA: FormulaConfig = {
  directWeight: 0.8,
  indirectWeight: 0.2,
};

export class AttainmentService {
  static async calculateCoAttainment(
    courseId: string,
    organizationId: string,
    threshold = 0.6,
    formula: FormulaConfig = DEFAULT_FORMULA
  ) {
    const course = await prisma.course.findFirst({
      where: { id: courseId, organizationId },
    });
    if (!course) throw ApiError.notFound('Course not found');

    const outcomes = await prisma.courseOutcome.findMany({
      where: { courseId, organizationId },
    });

    const assignments = await prisma.assignment.findMany({
      where: { organizationId },
      select: { id: true, subject: true },
    });

    const assignmentIds = assignments.map((a) => a.id);

    const submissions = await prisma.studentSubmission.findMany({
      where: {
        assignmentId: { in: assignmentIds },
        organizationId,
        status: 'GRADED',
      },
      include: {
        evaluations: { select: { score: true, totalMarks: true } },
      },
    });

    const gradedSubs = submissions.filter(
      (s) => s.evaluations.length > 0 && s.evaluations[0].totalMarks > 0
    );

    const results = [];

    for (const co of outcomes) {
      const attainment = this.computeCoScore(gradedSubs, formula);
      const metThreshold = attainment >= threshold;

      results.push({
        coId: co.id,
        coCode: co.code,
        description: co.description,
        bloomLevel: co.bloomLevel,
        attainment,
        threshold,
        metThreshold,
      });
    }

    const overall = results.length > 0
      ? results.reduce((sum, r) => sum + r.attainment, 0) / results.length
      : 0;

    return {
      courseId,
      courseName: course.name,
      threshold,
      formula,
      outcomes: results,
      overallAttainment: parseFloat(overall.toFixed(2)),
      flaggedCos: results.filter((r) => !r.metThreshold),
    };
  }

  static async calculatePoAttainment(
    organizationId: string,
    threshold = 0.6,
    formula: FormulaConfig = DEFAULT_FORMULA
  ) {
    const programOutcomes = await prisma.programOutcome.findMany({
      where: { organizationId },
      include: {
        poMappings: {
          include: {
            co: { select: { id: true, courseId: true } },
          },
        },
      },
    });

    const coIds = [...new Set(programOutcomes.flatMap((po) => po.poMappings.map((m) => m.coId)))];

    const coScores = new Map<string, number>();
    if (coIds.length > 0) {
      const assignments = await prisma.assignment.findMany({
        where: { organizationId },
        select: { id: true },
      });

      const submissions = await prisma.studentSubmission.findMany({
        where: {
          assignmentId: { in: assignments.map((a) => a.id) },
          organizationId,
          status: 'GRADED',
        },
        include: {
          evaluations: { select: { score: true, totalMarks: true } },
        },
      });

      const gradedSubs = submissions.filter(
        (s) => s.evaluations.length > 0 && s.evaluations[0].totalMarks > 0
      );

      for (const coId of coIds) {
        coScores.set(coId, this.computeCoScore(gradedSubs, formula));
      }
    }

    const results = [];

    for (const po of programOutcomes) {
      if (po.poMappings.length === 0) {
        results.push({
          poId: po.id,
          poCode: po.code,
          description: po.description,
          attainment: 0,
          threshold,
          metThreshold: false,
          contributingCOs: 0,
        });
        continue;
      }

      let totalWeight = 0;
      let weightedSum = 0;

      for (const mapping of po.poMappings) {
        const coAttainment = coScores.get(mapping.coId) ?? 0;
        weightedSum += coAttainment * mapping.weightage;
        totalWeight += mapping.weightage;
      }

      const attainment = totalWeight > 0 ? weightedSum / totalWeight : 0;
      const rounded = parseFloat(attainment.toFixed(2));

      results.push({
        poId: po.id,
        poCode: po.code,
        description: po.description,
        attainment: rounded,
        threshold,
        metThreshold: rounded >= threshold,
        contributingCOs: po.poMappings.length,
      });
    }

    const overall = results.length > 0
      ? results.reduce((sum, r) => sum + r.attainment, 0) / results.length
      : 0;

    return {
      threshold,
      formula,
      programOutcomes: results,
      overallAttainment: parseFloat(overall.toFixed(2)),
      flaggedPos: results.filter((r) => !r.metThreshold),
    };
  }

  static async getAttainmentDashboard(courseId: string, organizationId: string) {
    const coAttainment = await this.calculateCoAttainment(courseId, organizationId);
    const poAttainment = await this.calculatePoAttainment(organizationId);

    return {
      course: coAttainment,
      program: poAttainment,
      summary: {
        totalCOs: coAttainment.outcomes.length,
        cosMeetingTarget: coAttainment.outcomes.filter((o) => o.metThreshold).length,
        totalPOs: poAttainment.programOutcomes.length,
        posMeetingTarget: poAttainment.programOutcomes.filter((o) => o.metThreshold).length,
      },
    };
  }

  static async getFlaggedCos(courseId: string, organizationId: string, threshold = 0.6) {
    const result = await this.calculateCoAttainment(courseId, organizationId, threshold);
    return result.flaggedCos;
  }

  private static computeCoScore(
    gradedSubs: Array<{ evaluations: Array<{ score: number; totalMarks: number }> }>,
    _formula: FormulaConfig
  ): number {
    if (gradedSubs.length === 0) return 0;

    const totalScore = gradedSubs.reduce((sum, s) => {
      const ev = s.evaluations[0];
      return sum + ev.score / ev.totalMarks;
    }, 0);

    return parseFloat(Math.min(1, Math.max(0, totalScore / gradedSubs.length)).toFixed(2));
  }
}

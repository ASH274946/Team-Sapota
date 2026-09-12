import type { IAssignment } from '../../types/models.types';
import { generatedPaperSchema, type ValidatedPaper } from '../../validators/paper.validator';
export interface QualityGateResult {
  status: 'complete' | 'partial_success' | 'failed';
  ok: boolean;
  partialSuccess: boolean;
  completionRate: number;
  diagnostics: string[];
  generatedQuestionCount: number;
  requestedQuestionCount: number;
  generatedMarks: number;
  requestedMarks: number;
}

function normalizeText(value: string): string {
  return value.toLowerCase().replace(/\s+/g, ' ').trim();
}

function isLowInformationQuestion(text: string): boolean {
  const normalized = normalizeText(text);
  if (normalized.length < 4) return true;
  if (/^generated question/i.test(normalized)) return true;
  if (/^question\s*\d+$/i.test(normalized)) return true;
  return false;
}

export function evaluatePaperQuality(
  assignment: IAssignment,
  paper: ValidatedPaper,
  _typeBreakdown?: Array<{ type: string; count: number; marksPerQuestion: number }>
): QualityGateResult {
  const hardErrors: string[] = [];
  const softWarnings: string[] = [];

  const schemaResult = generatedPaperSchema.safeParse(paper);
  if (!schemaResult.success) {
    return {
      status: 'failed',
      ok: false,
      partialSuccess: false,
      completionRate: 0,
      diagnostics: [`Invalid generated paper schema: ${schemaResult.error.message}`],
      generatedQuestionCount: 0,
      requestedQuestionCount: assignment.questionConfig.count,
      generatedMarks: 0,
      requestedMarks: assignment.totalMarks,
    };
  }

  const questions = paper.sections.flatMap((s) => s.questions);
  const generatedQuestionCount = questions.length;
  const requestedQuestionCount = assignment.questionConfig.count;

  const generatedMarks = questions.reduce((sum, q) => sum + q.marks, 0);
  const requestedMarks = assignment.totalMarks;
  const completionRate = requestedQuestionCount > 0 ? generatedQuestionCount / requestedQuestionCount : 0;

  if (generatedQuestionCount !== requestedQuestionCount) {
    if (completionRate < 0.7) {
      hardErrors.push(
        `Question count mismatch: generated=${generatedQuestionCount}, requested=${requestedQuestionCount}`
      );
    } else {
      softWarnings.push(`Question count mismatch: generated=${generatedQuestionCount}, requested=${requestedQuestionCount}`);
    }
  }

  if (generatedMarks !== requestedMarks) {
    if (completionRate < 0.7) {
      hardErrors.push(`Marks mismatch: generated=${generatedMarks}, requested=${requestedMarks}`);
    } else {
      softWarnings.push(`Marks mismatch: generated=${generatedMarks}, requested=${requestedMarks}`);
    }
  }

  // Type coverage is a hard error only if a configured type has ZERO questions
  const requestedTypes = new Set(assignment.questionConfig.types);
  const typeCounts = new Map<string, number>();
  const typeMarks = new Map<string, number>();

  for (const q of questions) {
    typeCounts.set(q.type, (typeCounts.get(q.type) ?? 0) + 1);
    typeMarks.set(q.type, (typeMarks.get(q.type) ?? 0) + q.marks);
  }

  for (const type of requestedTypes) {
    if ((typeCounts.get(type) ?? 0) === 0) {
      softWarnings.push(`Configured type missing in output: ${type}`);
    }
  }

  // Per-question quality checks (soft warnings only)
  const seenQuestions = new Set<string>();
  const seenAnswers = new Set<string>();
  const seenIds = new Set<string>();

  for (const q of questions) {
    if (seenIds.has(q.id)) {
      hardErrors.push(`Duplicate question id: ${q.id}`);
    }
    seenIds.add(q.id);

    const normalizedQuestion = normalizeText(q.question);
    if (isLowInformationQuestion(q.question)) {
      softWarnings.push(`Low-information question: "${q.question.slice(0, 48)}"`);
    }
    if (seenQuestions.has(normalizedQuestion)) {
      hardErrors.push(`Duplicate question text: "${q.question.slice(0, 48)}"`);
    }
    seenQuestions.add(normalizedQuestion);

    if (q.type === 'mcq') {
      const options = q.options ?? [];
      if (options.length < 2) {
        hardErrors.push(`MCQ has only ${options.length} option(s) for question id=${q.id}, need at least 2`);
      } else if (options.length < 4) {
        hardErrors.push(`MCQ has ${options.length} options instead of 4 for question id=${q.id}`);
      }
      const seenOptions = new Set<string>();
      for (const opt of options) {
        const txt = normalizeText(opt.text);
        if (!txt) {
          hardErrors.push(`MCQ has empty option text for question id=${q.id}`);
        } else if (seenOptions.has(txt)) {
          hardErrors.push(`MCQ has duplicate option text for question id=${q.id}`);
        }
        seenOptions.add(txt);
      }
    }

    if (q.answer?.text) {
      const normalizedAnswer = normalizeText(q.answer.text);
      if (normalizedAnswer.length < 2) {
        softWarnings.push(`Low-information answer for question id=${q.id}`);
      }
      if (seenAnswers.has(normalizedAnswer)) {
        softWarnings.push(`Duplicate answer for question id=${q.id}`);
      }
      seenAnswers.add(normalizedAnswer);

      if ('explanation' in q.answer && (q.answer.explanation ?? '').trim().length === 0) {
        softWarnings.push(`Empty explanation for question id=${q.id}`);
      }
    }
  }

  const allDiagnostics = [...hardErrors, ...softWarnings];
  if (hardErrors.length > 0) {
    return {
      status: 'failed',
      ok: false,
      partialSuccess: false,
      completionRate,
      diagnostics: allDiagnostics,
      generatedQuestionCount,
      requestedQuestionCount,
      generatedMarks,
      requestedMarks,
    };
  }

  if (generatedQuestionCount > 0 && generatedQuestionCount < requestedQuestionCount) {
    return {
      status: 'partial_success',
      ok: true,
      partialSuccess: true,
      completionRate,
      diagnostics: allDiagnostics,
      generatedQuestionCount,
      requestedQuestionCount,
      generatedMarks,
      requestedMarks,
    };
  }

  return {
    status: 'complete',
    ok: true,
    partialSuccess: false,
    completionRate,
    diagnostics: softWarnings,
    generatedQuestionCount,
    requestedQuestionCount,
    generatedMarks,
    requestedMarks,
  };
}

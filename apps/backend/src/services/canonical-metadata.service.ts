import type { CanonicalGenerationState, CanonicalPaperMetadata } from '../types/canonical.types';
import type { ValidatedPaper } from '../validators/paper.validator';

function computeRequestedFromAssignment(assignment: any): {
  requestedMarks: number;
  requestedQuestionCount: number;
} {
  const requestedMarks = assignment.totalMarks ?? 0;
  const requestedQuestionCount = assignment.questionConfig?.count ?? 0;
  return { requestedMarks, requestedQuestionCount };
}

type PaperLike = { sections: any[]; pdfUrl?: string; duration?: number } | Pick<ValidatedPaper, 'sections'>;

function computeGeneratedFromPaper(paper: PaperLike | null): {
  generatedMarks: number;
  generatedQuestionCount: number;
  answerKeyReady: boolean;
  sections: CanonicalPaperMetadata['sections'];
} {
  if (!paper) {
    return {
      generatedMarks: 0,
      generatedQuestionCount: 0,
      answerKeyReady: false,
      sections: [],
    };
  }

  const sections = (paper.sections ?? []).map((section: any) => {
    const sectionMarks = (section.questions ?? []).reduce((sum: number, q: any) => sum + (q.marks ?? 0), 0);
    return {
      title: section.title,
      questionCount: section.questions.length,
      marks: sectionMarks,
    };
  });

  const questions = (paper.sections ?? []).flatMap((s: any) => s.questions ?? []);
  const generatedQuestionCount = questions.length;
  const generatedMarks = questions.reduce((sum: number, q: any) => sum + (q.marks ?? 0), 0);
  const answerKeyReady = generatedQuestionCount > 0 && questions.every((q) => Boolean(q.answer?.text?.trim()));

  return { generatedMarks, generatedQuestionCount, answerKeyReady, sections };
}

function clampProgress(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function buildCanonicalPaperMetadata(
  assignment: any,
  paper: any | null
): CanonicalPaperMetadata {
  const { requestedMarks, requestedQuestionCount } = computeRequestedFromAssignment(assignment);
  const generated = computeGeneratedFromPaper(paper);

  return {
    title: assignment.title,
    subject: assignment.subject,
    className: assignment.className ?? 'Not Specified',
    durationMinutes: assignment.duration ?? paper?.duration ?? 45,
    requestedMarks,
    generatedMarks: generated.generatedMarks,
    requestedQuestionCount,
    generatedQuestionCount: generated.generatedQuestionCount,
    schoolName: assignment.schoolName ?? 'School',
    sections: generated.sections,
    answerKeyReady: generated.answerKeyReady,
    pdfReady: Boolean(paper?.pdfUrl),
  };
}

export function buildCanonicalGenerationState(input: {
  assignment: any;
  paper: any | null;
  job: any | null;
}): CanonicalGenerationState {
  const { assignment, paper, job } = input;
  const canonicalMetadata = buildCanonicalPaperMetadata(assignment, paper);

  const stage = (job?.status ?? (assignment.status === 'draft' ? 'queued' : 'extracting_content')) as CanonicalGenerationState['stage'];
  const progress = assignment.status === 'completed'
    ? 100
    : assignment.status === 'failed'
    ? clampProgress(job?.progress ?? 0)
    : clampProgress(job?.progress ?? 0);

  const completionPercentage =
    canonicalMetadata.requestedQuestionCount > 0
      ? clampProgress((canonicalMetadata.generatedQuestionCount / canonicalMetadata.requestedQuestionCount) * 100)
      : 0;

  const generationStatus =
    assignment.status === 'draft'
      ? 'draft'
      : assignment.status === 'queued' || assignment.status === 'generating'
      ? 'generating'
      : (assignment.status as CanonicalGenerationState['generationStatus']);

  return {
    canonicalMetadata,
    progress,
    stage,
    generatedQuestions: canonicalMetadata.generatedQuestionCount,
    requestedQuestions: canonicalMetadata.requestedQuestionCount,
    generatedMarks: canonicalMetadata.generatedMarks,
    requestedMarks: canonicalMetadata.requestedMarks,
    completionPercentage,
    answerKeyReady: canonicalMetadata.answerKeyReady,
    pdfReady: canonicalMetadata.pdfReady,
    generationStatus,
  };
}

import type { IAssignment } from '../../types/models.types';
import type { ValidatedPaper } from '../../validators/paper.validator';
import type { BatchQuestion } from './batch-validator';
import type { PlannedBatch } from './generation-planner';
import type { QuestionType } from '../../types/assignment.types';
import { randomUUID } from 'crypto';

export interface AssembledBatchSection {
  title: string;
  instruction: string;
  questions: BatchQuestion[];
}

const TYPE_ORDER: QuestionType[] = ['mcq', 'true-false', 'fill-blank', 'short-answer', 'long-answer'];
const DIFFICULTY_ORDER: Record<string, number> = { easy: 1, medium: 2, hard: 3 };

const SECTION_LABELS: Record<QuestionType, string> = {
  mcq: 'Multiple Choice Questions',
  'true-false': 'True / False Questions',
  'fill-blank': 'Fill in the Blanks',
  'short-answer': 'Short Answer Questions',
  'long-answer': 'Long Answer Questions',
};

function sectionLetter(index: number): string {
  return String.fromCharCode(65 + index);
}

function instructionFor(type: QuestionType, questions: BatchQuestion[]): string {
  const marks = questions[0]?.marks ?? 1;
  const markLabel = `${marks} ${marks === 1 ? 'mark' : 'marks'}`;
  if (type === 'mcq') return `Attempt all questions. Each question carries ${markLabel}.`;
  if (type === 'true-false') return `Write True or False. Each question carries ${markLabel}.`;
  if (type === 'fill-blank') return `Fill in the blanks. Each question carries ${markLabel}.`;
  if (type === 'long-answer') return `Answer in detail. Each question carries ${markLabel}.`;
  return `Attempt all questions. Each question carries ${markLabel}.`;
}

function normalizeQuestionText(value: string): string {
  const compact = value.replace(/\s+/g, ' ').trim();
  if (!compact) return compact;
  const withCapital = compact.charAt(0).toUpperCase() + compact.slice(1);
  if (/[?.!]$/.test(withCapital)) return withCapital;
  return `${withCapital}?`;
}

function normalizeQuestion(question: BatchQuestion): BatchQuestion {
  const normalized: BatchQuestion = {
    ...question,
    id: randomUUID(),
    question: normalizeQuestionText(question.question),
    marks: Math.max(1, Math.round(Number(question.marks) || 1)),
    difficulty: question.difficulty,
  };

  if (normalized.type === 'mcq' && normalized.options) {
    const keys = ['A', 'B', 'C', 'D'] as const;
    const seen = new Set<string>();
    normalized.options = normalized.options
      .map((option, index) => ({
        key: keys[index] ?? option.key,
        text: option.text.replace(/\s+/g, ' ').trim(),
      }))
      .filter((option) => {
        const key = option.text.toLowerCase();
        if (!option.text || seen.has(key)) return false;
        seen.add(key);
        return true;
      });
  }

  return normalized;
}

function normalizeAggregationKey(question: BatchQuestion): string {
  const text = question.question.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
  return `${question.type}:${question.marks}:${question.difficulty}:${text}`;
}

function sortQuestions(questions: BatchQuestion[]): BatchQuestion[] {
  return [...questions].sort((a, b) => {
    const diff = (DIFFICULTY_ORDER[a.difficulty] ?? 2) - (DIFFICULTY_ORDER[b.difficulty] ?? 2);
    if (diff !== 0) return diff;
    return a.question.localeCompare(b.question);
  });
}

export function assemblePaperFromBatches(
  assignment: IAssignment,
  batches: Array<{ plan: PlannedBatch; questions: BatchQuestion[] }>
): ValidatedPaper {
  const grouped = new Map<QuestionType, BatchQuestion[]>();
  const seenQuestions = new Set<string>();

  for (const { questions } of batches) {
    for (const rawQuestion of questions) {
      const question = normalizeQuestion(rawQuestion);
      const key = normalizeAggregationKey(question);
      if (seenQuestions.has(key)) {
        continue;
      }
      seenQuestions.add(key);
      const group = grouped.get(question.type) ?? [];
      group.push(question);
      grouped.set(question.type, group);
    }
  }

  const sections: ValidatedPaper['sections'] = TYPE_ORDER
    .filter((type) => (grouped.get(type)?.length ?? 0) > 0)
    .map((type, index) => {
      const questions = sortQuestions(grouped.get(type) ?? []).map(
        (question) => question as ValidatedPaper['sections'][number]['questions'][number]
      );
      return {
        title: `Section ${sectionLetter(index)} - ${SECTION_LABELS[type]}`,
        instruction: instructionFor(type, questions),
        questions,
      } as ValidatedPaper['sections'][number];
    });

  const totalMarks = sections.reduce(
    (sum, section) => sum + section.questions.reduce((questionSum, question) => questionSum + question.marks, 0),
    0
  );

  return {
    title: assignment.title,
    totalMarks,
    sections,
  };
}

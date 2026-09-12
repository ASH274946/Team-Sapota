import { randomUUID } from 'crypto';
import { jsonrepair } from 'jsonrepair';
import { generatedPaperSchema, type ValidatedPaper } from '../validators/paper.validator';
import { validateSingleQuestion } from '../validators/per-question-validator';

export interface ValidationDiagnostic {
  level: 'warning' | 'error';
  path: string;
  code: string;
  message: string;
}

export class PaperParseError extends Error {
  constructor(
    message: string,
    public readonly rawOutput: string,
    public readonly retryable: boolean = true,
    public readonly diagnostics: ValidationDiagnostic[] = [],
    public readonly partialQuestions: Record<string, unknown>[] = []
  ) {
    super(message);
    this.name = 'PaperParseError';
  }
}

export interface PaperParseResult {
  paper: ValidatedPaper;
  diagnostics: ValidationDiagnostic[];
  recoveredCount: number;
  totalDetected: number;
  discardedCount: number;
}

function sanitize(raw: string): string {
  return raw
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();
}

function parseStrictJson(raw: string): unknown {
  const cleaned = sanitize(raw);
  if (!cleaned) {
    throw new PaperParseError('AI output is empty', raw, true);
  }

  const repaired = jsonrepair(cleaned);
  return JSON.parse(repaired) as unknown;
}

function unwrapEnvelope(parsed: unknown): Record<string, unknown> {
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    throw new PaperParseError('Parsed JSON is not an object', JSON.stringify(parsed), true);
  }

  const record = parsed as Record<string, unknown>;
  if (record.paper && typeof record.paper === 'object' && record.paper !== null && !Array.isArray(record.paper)) {
    return record.paper as Record<string, unknown>;
  }

  if (record.data && typeof record.data === 'object' && record.data !== null && !Array.isArray(record.data)) {
    return record.data as Record<string, unknown>;
  }

  return record;
}

function normalizeQuestion(question: Record<string, unknown>, sectionIndex: number, questionIndex: number): Record<string, unknown> {
  const normalized: Record<string, unknown> = {
    ...question,
    id: randomUUID(),
    question: typeof question.question === 'string' ? question.question.trim() : question.question,
  };

  if (normalized.type === 'mcq' && Array.isArray(normalized.options)) {
    normalized.options = (normalized.options as Array<Record<string, unknown>>).slice(0, 4).map((option, index) => ({
      key: ['A', 'B', 'C', 'D'][index] ?? option.key,
      text: typeof option.text === 'string' ? option.text.trim() : option.text,
    }));
  }

  if (normalized.type !== 'fill-blank') {
    delete normalized.blanks;
  }

  if (normalized.type !== 'mcq') {
    delete normalized.options;
  }

  const validation = validateSingleQuestion(normalized, questionIndex);
  if (!validation.valid) {
    throw new PaperParseError(
      `Invalid question at sections[${sectionIndex}].questions[${questionIndex}]: ${validation.errors.join('; ')}`,
      JSON.stringify(question),
      true
    );
  }

  return normalized;
}

function extractQuestionsFromSections(sections: unknown[]): {
  questions: Record<string, unknown>[];
  diagnostics: ValidationDiagnostic[];
  totalDetected: number;
  discardedCount: number;
} {
  const questions: Record<string, unknown>[] = [];
  const diagnostics: ValidationDiagnostic[] = [];
  let totalDetected = 0;
  let discardedCount = 0;

  for (let sectionIndex = 0; sectionIndex < sections.length; sectionIndex++) {
    const section = sections[sectionIndex];
    if (typeof section !== 'object' || section === null || Array.isArray(section)) {
      continue;
    }

    const sectionRecord = section as Record<string, unknown>;
    const rawQuestions = Array.isArray(sectionRecord.questions) ? sectionRecord.questions : [];

    for (let questionIndex = 0; questionIndex < rawQuestions.length; questionIndex++) {
      totalDetected += 1;
      const rawQuestion = rawQuestions[questionIndex];
      if (typeof rawQuestion !== 'object' || rawQuestion === null || Array.isArray(rawQuestion)) {
        discardedCount += 1;
        diagnostics.push({
          level: 'error',
          path: `sections[${sectionIndex}].questions[${questionIndex}]`,
          code: 'not_an_object',
          message: 'Question is not an object',
        });
        continue;
      }

      try {
        questions.push(normalizeQuestion(rawQuestion as Record<string, unknown>, sectionIndex, questionIndex));
      } catch (error) {
        discardedCount += 1;
        diagnostics.push({
          level: 'error',
          path: `sections[${sectionIndex}].questions[${questionIndex}]`,
          code: 'invalid_question',
          message: error instanceof Error ? error.message : String(error),
        });
      }
    }
  }

  return { questions, diagnostics, totalDetected, discardedCount };
}

function buildPaperInput(raw: Record<string, unknown>, questions: Record<string, unknown>[]): Record<string, unknown> {
  const totalMarks = questions.reduce((sum, question) => sum + (Number(question.marks) || 1), 0);

  return {
    title: String(raw.title || 'Generated Paper').trim() || 'Generated Paper',
    totalMarks: Math.max(1, Number(raw.totalMarks) || totalMarks),
    sections: [
      {
        title: 'Generated Section',
        instruction: '',
        questions,
      },
    ],
  };
}

export function parsePaperJson(rawOutput: string): ValidatedPaper {
  const parsed = unwrapEnvelope(parseStrictJson(rawOutput));

  const sections = Array.isArray(parsed.sections) ? parsed.sections : [];
  const questionsSource = sections.length > 0 ? extractQuestionsFromSections(sections) : Array.isArray(parsed.questions) ? extractQuestionsFromSections([{ questions: parsed.questions }]) : null;

  if (!questionsSource || questionsSource.questions.length === 0) {
    throw new PaperParseError('No valid questions found in AI output', rawOutput, true);
  }

  const paperInput = buildPaperInput(parsed, questionsSource.questions);
  const result = generatedPaperSchema.safeParse(paperInput);
  if (!result.success) {
    throw new PaperParseError(`Paper assembly failed: ${result.error.message.slice(0, 200)}`, rawOutput, true, questionsSource.diagnostics, questionsSource.questions);
  }

  return result.data;
}

export function parsePaperJsonTolerant(rawOutput: string): PaperParseResult {
  const parsed = unwrapEnvelope(parseStrictJson(rawOutput));
  const sections = Array.isArray(parsed.sections) ? parsed.sections : [];
  const source = sections.length > 0 ? extractQuestionsFromSections(sections) : Array.isArray(parsed.questions) ? extractQuestionsFromSections([{ questions: parsed.questions }]) : { questions: [], diagnostics: [], totalDetected: 0, discardedCount: 0 };

  if (source.questions.length === 0) {
    throw new PaperParseError('No valid questions found in AI output', rawOutput, true, source.diagnostics);
  }

  const paperInput = buildPaperInput(parsed, source.questions);
  const result = generatedPaperSchema.safeParse(paperInput);
  if (!result.success) {
    throw new PaperParseError(`Paper assembly failed: ${result.error.message.slice(0, 200)}`, rawOutput, true, source.diagnostics, source.questions);
  }

  return {
    paper: result.data,
    diagnostics: source.diagnostics,
    recoveredCount: source.questions.length,
    totalDetected: source.totalDetected,
    discardedCount: source.discardedCount,
  };
}

import type { IAssignment } from '../types/models.types';
import type { QuestionType } from '../types/assignment.types';

const MAX_UPLOAD_CHARS = 2500;

export const SYSTEM_PROMPT = `You generate academic assessments. Output ONLY valid JSON. No markdown, no explanations, no code fences. Raw JSON only.`;

export interface QuestionTypeBreakdown {
  type: string;
  displayType?: string;
  count: number;
  marksPerQuestion: number;
}

export interface BatchPromptInput {
  batchId: string;
  type: QuestionType;
  displayType?: string;
  count: number;
  marksPerQuestion: number;
  allowedMarks: number[];
  totalMarks: number;
  allowedTypes: QuestionType[];
  sectionTitle: string;
  difficultyHint: 'easy' | 'medium' | 'hard';
}

function extractKeyConcepts(text: string): string {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  const seen = new Set<string>();
  const unique: string[] = [];
  for (const line of lines) {
    const normalized = line.toLowerCase().replace(/\s+/g, ' ');
    if (seen.has(normalized)) continue;
    if (normalized.length < 5) continue;
    seen.add(normalized);
    unique.push(line);
  }
  return unique.join('\n');
}

function stripControlChars(input: string): string {
  let out = '';
  for (let i = 0; i < input.length; i++) {
    const code = input.charCodeAt(i);
    const isAllowedWhitespace = code === 9 || code === 10 || code === 13;
    const isControl = code < 32 && !isAllowedWhitespace;
    if (!isControl) out += input[i];
  }
  return out;
}

function summarizeContent(text: string): string {
  let clean = stripControlChars(text).trim();
  clean = extractKeyConcepts(clean);
  if (clean.length <= MAX_UPLOAD_CHARS) return clean;
  const keepFront = Math.floor(MAX_UPLOAD_CHARS * 0.7);
  const keepBack = MAX_UPLOAD_CHARS - keepFront;
  const front = clean.slice(0, keepFront);
  const back = clean.slice(-keepBack);
  return front + '\n[...]\n' + back;
}

export function buildGenerationPrompt(
  assignment: IAssignment,
  uploadedContent?: string,
  typeBreakdown?: QuestionTypeBreakdown[]
): string {
  const { title, subject, totalMarks, questionConfig } = assignment;
  const source = uploadedContent ? `\nSource excerpt: ${summarizeContent(uploadedContent)}` : '';
  const breakdown = typeBreakdown?.length ? `\nType breakdown: ${typeBreakdown.map((t) => `${t.type}:${t.count}`).join(' ')}` : '';

  return `Legacy full-paper generation is disabled. Use the batch generation pipeline instead.
Assignment: ${title} | Subject: ${subject} | Questions: ${questionConfig.count} | Marks: ${totalMarks}${breakdown}${source}`;
}

export function buildBatchGenerationPrompt(
  assignment: IAssignment,
  batch: BatchPromptInput,
  syllabusContext: string
): string {
  const typeLabel = batch.displayType || batch.type;
  const typeList = batch.allowedTypes.join(', ');
  const allowedMarks = batch.allowedMarks.join(', ');
  const instructions = assignment.additionalInstructions?.trim() || 'None';

  return `Generate EXACTLY ${batch.count} ${typeLabel} questions for one internal generation request.

Topic context:
${syllabusContext}

Requirements:
- Allowed types: ${typeList}
- Allowed marks per question: ${allowedMarks}
- Marks per question: ${batch.marksPerQuestion}
- Total marks: ${batch.totalMarks}
- Difficulty target: ${batch.difficultyHint}
- Use concise, distinct questions.
- MCQ must use 4 distinct options.
- Return ONLY JSON.
- No markdown, no prose, no extra keys.
- Validation failure if count or marks mismatch.
- Every question must use one of the allowed marks exactly.
- Do NOT include an id field. The server assigns question IDs internally.
- Do NOT include options on short-answer, long-answer, or true-false questions.
- Do NOT include blanks on short-answer or long-answer questions.
- Treat assignment instructions as hard constraints (grade level, exam duration, style, and scope).
- Questions must be age-appropriate and depth-appropriate to the learner level in instructions.
- Keep expected solving time consistent with the requested exam duration.

Assignment context:
Subject: ${assignment.subject}
Title: ${assignment.title}
Instructions: ${instructions}

Schema:
  {"questions":[{"question":"","type":"${batch.type}","difficulty":"easy|medium|hard","marks":${batch.marksPerQuestion},"options":[{"key":"A","text":""}],"blanks":1}]}
`;
}

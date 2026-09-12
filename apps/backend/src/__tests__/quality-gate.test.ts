import { describe, expect, it } from 'vitest';
import type { IAssignment } from '../types/models.types';
import type { QuestionTypeBreakdown } from '../prompts/generation.prompt';
import { evaluatePaperQuality } from '../services/ai/quality-gate';
import type { ValidatedPaper } from '../validators/paper.validator';

function makeAssignment(overrides?: Partial<IAssignment>): IAssignment {
  return {
    _id: 'a1',
    title: 'Unit Test Assignment',
    subject: 'Science',
    description: 'Test',
    dueDate: new Date(),
    duration: 60,
    totalMarks: 20,
    questionConfig: {
      types: ['short-answer', 'mcq'],
      count: 4,
      difficulty: { easy: 50, medium: 25, hard: 25 },
    },
    uploadedFiles: [],
    additionalInstructions: '',
    typeBreakdown: JSON.stringify([
      { type: 'short-answer', count: 2, marksPerQuestion: 5 },
      { type: 'mcq', count: 2, marksPerQuestion: 5 },
    ]),
    status: 'draft',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  } as unknown as IAssignment;
}

function makePaper(questions: ValidatedPaper['sections'][number]['questions']): ValidatedPaper {
  return {
    title: 'Generated Paper',
    totalMarks: 20,
    sections: [
      {
        title: 'Section A',
        instruction: 'Answer all questions',
        questions,
      },
    ],
  } as ValidatedPaper;
}

const breakdown: QuestionTypeBreakdown[] = [
  { type: 'short-answer', count: 2, marksPerQuestion: 5 },
  { type: 'mcq', count: 2, marksPerQuestion: 5 },
];

describe('evaluatePaperQuality', () => {
  it('accepts a complete paper that matches requested count and marks', () => {
    const assignment = makeAssignment();
    const paper = makePaper([
      { id: '123e4567-e89b-12d3-a456-426614174000', question: 'Explain osmosis in plants.', type: 'short-answer', difficulty: 'easy', marks: 5 },
      { id: '123e4567-e89b-12d3-a456-426614174001', question: 'Explain diffusion with one practical example.', type: 'short-answer', difficulty: 'medium', marks: 5 },
      {
        id: '123e4567-e89b-12d3-a456-426614174002',
        question: 'Which organelle is called powerhouse of the cell?',
        type: 'mcq',
        difficulty: 'easy',
        marks: 5,
        options: [
          { key: 'A', text: 'Nucleus' },
          { key: 'B', text: 'Ribosome' },
          { key: 'C', text: 'Mitochondria' },
          { key: 'D', text: 'Golgi body' },
        ],
      },
      {
        id: '123e4567-e89b-12d3-a456-426614174003',
        question: 'Which gas is released during photosynthesis?',
        type: 'mcq',
        difficulty: 'hard',
        marks: 5,
        options: [
          { key: 'A', text: 'Oxygen' },
          { key: 'B', text: 'Nitrogen' },
          { key: 'C', text: 'Helium' },
          { key: 'D', text: 'Hydrogen' },
        ],
      },
    ]);

    const result = evaluatePaperQuality(assignment, paper, breakdown);
    expect(result.ok).toBe(true);
    expect(result.diagnostics).toHaveLength(0);
  });

  it('rejects under-generation and incorrect marks totals', () => {
    const assignment = makeAssignment();
    const paper = makePaper([
      { id: '123e4567-e89b-12d3-a456-426614174000', question: 'Explain osmosis in plants.', type: 'short-answer', difficulty: 'easy', marks: 5 },
      { id: '123e4567-e89b-12d3-a456-426614174001', question: 'Explain diffusion with one practical example.', type: 'short-answer', difficulty: 'medium', marks: 5 },
    ]);

    const result = evaluatePaperQuality(assignment, paper, breakdown);
    expect(result.ok).toBe(false);
    expect(result.partialSuccess).toBe(false);
    expect(result.diagnostics.join(' | ')).toContain('Question count mismatch');
    expect(result.diagnostics.join(' | ')).toContain('Marks mismatch');
  });

  it('flags duplicate questions and duplicate mcq options as warnings', () => {
    const assignment = makeAssignment();
    const paper = makePaper([
      { id: '123e4567-e89b-12d3-a456-426614174000', question: 'Define inertia with one example.', type: 'short-answer', difficulty: 'easy', marks: 5 },
      { id: '123e4567-e89b-12d3-a456-426614174001', question: 'Define inertia with one example.', type: 'short-answer', difficulty: 'medium', marks: 5 },
      {
        id: '123e4567-e89b-12d3-a456-426614174002',
        question: 'What is SI unit of force?',
        type: 'mcq',
        difficulty: 'easy',
        marks: 5,
        options: [
          { key: 'A', text: 'Newton' },
          { key: 'B', text: 'Newton' },
          { key: 'C', text: 'Joule' },
          { key: 'D', text: 'Pascal' },
        ],
      },
      {
        id: '123e4567-e89b-12d3-a456-426614174003',
        question: 'Which is a scalar quantity?',
        type: 'mcq',
        difficulty: 'hard',
        marks: 5,
        options: [
          { key: 'A', text: 'Force' },
          { key: 'B', text: 'Velocity' },
          { key: 'C', text: 'Speed' },
          { key: 'D', text: 'Acceleration' },
        ],
      },
    ]);

    const result = evaluatePaperQuality(assignment, paper, breakdown);
    expect(result.ok).toBe(false);
    expect(result.partialSuccess).toBe(false);
    expect(result.diagnostics.join(' | ')).toContain('Duplicate question text');
    expect(result.diagnostics.join(' | ')).toContain('duplicate option text');
  });
});

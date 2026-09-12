import { describe, expect, it } from 'vitest';
import type { IAssignment } from '../types/models.types';
import { createGenerationPlan } from '../services/ai/generation-planner';
import { validateBatchResponse } from '../services/ai/batch-validator';
import { assemblePaperFromBatches } from '../services/ai/paper-assembler';

function makeAssignment(overrides?: Partial<IAssignment>): IAssignment {
  return {
    _id: 'assignment-1',
    title: 'Batch Test Assignment',
    subject: 'Science',
    description: 'Testing batch generation',
    dueDate: new Date(),
    duration: 60,
    totalMarks: 20,
    questionConfig: {
      types: ['mcq', 'short-answer'],
      count: 6,
      difficulty: { easy: 50, medium: 25, hard: 25 },
    },
    uploadedFiles: [],
    additionalInstructions: '',
    status: 'draft',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  } as unknown as IAssignment;
}

describe('createGenerationPlan', () => {
  it('splits requested questions into batches of at most four', () => {
    const assignment = makeAssignment();
    const plan = createGenerationPlan(assignment, [
      { type: 'mcq', count: 4, marksPerQuestion: 2 },
      { type: 'short-answer', count: 2, marksPerQuestion: 4 },
    ]);

    expect(plan.batches).toHaveLength(2);
    expect(plan.batches[0]?.count).toBe(4);
    expect(plan.batches[1]?.count).toBe(2);
    expect(plan.totalQuestions).toBe(6);
  });
});

describe('validateBatchResponse', () => {
  it('accepts a valid small batch', () => {
    const result = validateBatchResponse(
      JSON.stringify({
        questions: [
          {
            id: '123e4567-e89b-12d3-a456-426614174000',
            question: 'What is a variable in JavaScript?',
            type: 'mcq',
            difficulty: 'easy',
            marks: 2,
            options: [
              { key: 'A', text: 'A named storage' },
              { key: 'B', text: 'A loop' },
              { key: 'C', text: 'A condition' },
              { key: 'D', text: 'A function parameter' },
            ],
          },
          {
            id: '123e4567-e89b-12d3-a456-426614174001',
            question: 'Explain let and const.',
            type: 'short-answer',
            difficulty: 'medium',
            marks: 2,
          },
        ],
      }),
      {
        batchId: 'mcq-1',
        expectedCount: 2,
        expectedMarks: 4,
        allowedTypes: ['mcq', 'short-answer'],
      }
    );

    expect(result.ok).toBe(true);
    expect(result.generatedCount).toBe(2);
    expect(result.generatedMarks).toBe(4);
  });

  it('rejects truncated JSON and duplicate questions', () => {
    const truncated = validateBatchResponse(
      '{"questions":[{"id":"123e4567-e89b-12d3-a456-426614174000","question":"Explain arrays","type":"short-answer","difficulty":"easy","marks":2},',
      {
        batchId: 'short-1',
        expectedCount: 2,
        expectedMarks: 4,
        allowedTypes: ['short-answer'],
      }
    );

    expect(truncated.ok).toBe(false);
    expect(truncated.generatedCount).toBe(0);
    expect(truncated.diagnostics.join(' | ')).toContain('truncated');

    const duplicates = validateBatchResponse(
      JSON.stringify({
        questions: [
          {
            id: '123e4567-e89b-12d3-a456-426614174000',
            question: 'Explain arrays.',
            type: 'short-answer',
            difficulty: 'easy',
            marks: 2,
          },
          {
            id: '123e4567-e89b-12d3-a456-426614174001',
            question: 'Explain arrays.',
            type: 'short-answer',
            difficulty: 'easy',
            marks: 2,
          },
        ],
      }),
      {
        batchId: 'short-2',
        expectedCount: 2,
        expectedMarks: 4,
        allowedTypes: ['short-answer'],
      }
    );

    expect(duplicates.ok).toBe(false);
    expect(duplicates.generatedCount).toBe(1);
    expect(duplicates.discardCount).toBe(1);
    expect(duplicates.diagnostics.join(' | ')).toContain('duplicate question text');
  });

  it('rejects batches with corrupted question objects', () => {
    const raw = `{
      "questions": [
        {"id":"123e4567-e89b-12d3-a456-426614174010","question":"What does var declare in JavaScript?","type":"mcq","difficulty":"beginner","marks":1,
          "options":[{"key":"A","text":"A variable"},{"key":"B","text":"A style rule"},{"key":"C","text":"A database"},{"key":"D","text":"A network"}]},
        {"id":"broken","type":"mcq","difficulty":"medium","marks":1,"options":[
        {"id":"123e4567-e89b-12d3-a456-426614174012","question":"Which keyword creates a block scoped variable?","type":"multiple-choice","difficulty":"moderate","marks":1,
          "options":[[{"label":"A","value":"let"}],{"key":"B","text":"script"},{"key":"C","text":"html"},{"key":"D","text":"css"}]},
        {"id":"123e4567-e89b-12d3-a456-426614174013","question":"What is const used for in JavaScript?","type":"mcq","difficulty":"advanced","marks":1,
          "options":[{"key":"A","text":"A reassignment friendly binding"},{"key":"B","text":"A constant binding"},{"key":"C","text":"A CSS selector"},{"key":"D","text":"A package manager"}]}
      ]
    }`;

    const result = validateBatchResponse(raw, {
      batchId: 'mcq-chaos',
      expectedCount: 4,
      expectedMarks: 4,
      allowedTypes: ['mcq'],
      expectedType: 'mcq',
    });

    expect(result.ok).toBe(false);
    expect(result.generatedCount).toBe(0);
    expect(result.questions).toHaveLength(0);
    expect(result.diagnostics.length).toBeGreaterThan(0);
  });

  it('assigns internal ids even when the model repeats or omits ids', () => {
    const duplicateId = '123e4567-e89b-12d3-a456-426614174020';
    const result = validateBatchResponse(
      JSON.stringify({
        questions: [
          { id: duplicateId, question: 'Explain a JavaScript variable.', type: 'short-answer', difficulty: 'easy', marks: 2 },
          { id: duplicateId, question: 'Explain JavaScript assignment.', type: 'short-answer', difficulty: 'medium', marks: 2 },
          { id: 'not-a-uuid', question: 'Explain JavaScript scope.', type: 'short-answer', difficulty: 'hard', marks: 2 },
        ],
      }),
      {
        batchId: 'uuid-repair',
        expectedCount: 3,
        expectedMarks: 6,
        allowedTypes: ['short-answer'],
        expectedType: 'short-answer',
      }
    );

    const ids = result.questions.map((q) => q.id);
    expect(result.ok).toBe(true);
    expect(result.generatedCount).toBe(3);
    expect(new Set(ids).size).toBe(3);
    expect(ids.every((id) => /^[0-9a-f-]{36}$/i.test(id))).toBe(true);
    expect(result.repairTypes).toEqual([]);
  });
});

describe('assemblePaperFromBatches', () => {
  it('merges internal same-type batches into clean user-facing sections', () => {
    const assignment = makeAssignment({ title: 'Unit Test', totalMarks: 6 });
    const plan = createGenerationPlan(assignment, [
      { type: 'short-answer', count: 4, marksPerQuestion: 1 },
      { type: 'long-answer', count: 1, marksPerQuestion: 2 },
    ], { maxBatchQuestions: 2 });

    const paper = assemblePaperFromBatches(assignment, [
      {
        plan: plan.batches[0]!,
        questions: [
          { id: '123e4567-e89b-12d3-a456-426614174100', question: 'define scope', type: 'short-answer', difficulty: 'easy', marks: 1 },
          { id: '123e4567-e89b-12d3-a456-426614174101', question: 'explain variables', type: 'short-answer', difficulty: 'medium', marks: 1 },
        ],
      },
      {
        plan: plan.batches[1]!,
        questions: [
          { id: '123e4567-e89b-12d3-a456-426614174102', question: 'describe hoisting', type: 'short-answer', difficulty: 'hard', marks: 1 },
          { id: '123e4567-e89b-12d3-a456-426614174103', question: 'what is let', type: 'short-answer', difficulty: 'easy', marks: 1 },
        ],
      },
      {
        plan: plan.batches[2]!,
        questions: [
          { id: '123e4567-e89b-12d3-a456-426614174104', question: 'Explain the difference between let const and var', type: 'long-answer', difficulty: 'hard', marks: 2 },
        ],
      },
    ]);

    expect(paper.sections).toHaveLength(2);
    expect(paper.sections[0]?.title).toBe('Section A - Short Answer Questions');
    expect(paper.sections[1]?.title).toBe('Section B - Long Answer Questions');
    expect(paper.sections.flatMap((s) => s.questions)).toHaveLength(5);
    expect(JSON.stringify(paper)).not.toMatch(/batch/i);
  });

  it('deduplicates repeated questions during semantic assembly', () => {
    const assignment = makeAssignment({ title: 'Duplicate Test' });
    const plan = createGenerationPlan(assignment, [{ type: 'mcq', count: 2, marksPerQuestion: 1 }], { maxBatchQuestions: 2 });

    const paper = assemblePaperFromBatches(assignment, [
      {
        plan: plan.batches[0]!,
        questions: [
          {
            id: '123e4567-e89b-12d3-a456-426614174110',
            question: 'What is a variable?',
            type: 'mcq',
            difficulty: 'easy',
            marks: 1,
            options: [
              { key: 'A', text: 'Named storage' },
              { key: 'B', text: 'Loop' },
            ],
          },
          {
            id: '123e4567-e89b-12d3-a456-426614174111',
            question: 'What is a variable',
            type: 'mcq',
            difficulty: 'easy',
            marks: 1,
            options: [
              { key: 'A', text: 'Named storage' },
              { key: 'B', text: 'Loop' },
            ],
          },
        ],
      },
    ]);

    expect(paper.sections[0]?.questions).toHaveLength(1);
    expect(paper.sections[0]?.questions[0]?.question).toBe('What is a variable?');
  });
});

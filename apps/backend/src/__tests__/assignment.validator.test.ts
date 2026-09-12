import { describe, it, expect } from 'vitest';
import { createAssignmentSchema } from '../validators/assignment.validator';

describe('createAssignmentSchema', () => {
  const validInput = {
    title: 'Computer Networks',
    subject: 'Computer Science',
    description: 'Chapter 1-5',
    dueDate: '2025-12-31',
    duration: 90,
    totalMarks: 100,
    questionConfig: {
      types: ['mcq', 'short-answer'],
      count: 10,
      difficulty: { easy: 34, medium: 33, hard: 33 },
    },
    additionalInstructions: '',
  };

  it('should accept valid input', () => {
    const result = createAssignmentSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  it('should reject title shorter than 3 chars', () => {
    const result = createAssignmentSchema.safeParse({ ...validInput, title: 'AB' });
    expect(result.success).toBe(false);
  });

  it('should reject negative duration', () => {
    const result = createAssignmentSchema.safeParse({ ...validInput, duration: -1 });
    expect(result.success).toBe(false);
  });

  it('should reject invalid date', () => {
    const result = createAssignmentSchema.safeParse({ ...validInput, dueDate: 'not-a-date' });
    expect(result.success).toBe(false);
  });

  it('should reject difficulty not summing to 100', () => {
    const result = createAssignmentSchema.safeParse({
      ...validInput,
      questionConfig: {
        ...validInput.questionConfig,
        difficulty: { easy: 50, medium: 50, hard: 50 },
      },
    });
    expect(result.success).toBe(false);
  });

  it('should reject empty question types array', () => {
    const result = createAssignmentSchema.safeParse({
      ...validInput,
      questionConfig: { ...validInput.questionConfig, types: [] },
    });
    expect(result.success).toBe(false);
  });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateSingleQuestion, generateMultipleQuestions } from '../services/question-generation.service';
import { AIOrchestrator } from '../services/ai/ai-orchestrator.service';

vi.mock('../services/rag.service', () => ({
  retrieveContext: vi.fn().mockResolvedValue('RAG Context'),
}));

vi.mock('../services/ai/ai-orchestrator.service', () => ({
  AIOrchestrator: {
    generate: vi.fn(),
  },
}));

describe('generateSingleQuestion', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should generate a single question successfully', async () => {
    vi.mocked(AIOrchestrator.generate).mockResolvedValue({
      question_text: 'What is Python lists syntax?',
      options: ['A. [1, 2]', 'B. (1, 2)', 'C. {1, 2}', 'D. <1, 2>'],
      answer: 'A',
      hint: 'Square brackets',
      ai_confidence_score: 0.98,
    });

    const result = await generateSingleQuestion({
      topic: 'Lists',
      subject: 'Python',
      difficulty: 'EASY',
      bloomLevel: 'REMEMBER',
    });

    expect(result.question_text).toBe('What is Python lists syntax?');
    expect(result.options).toHaveLength(4);
    expect(result.answer).toBe('A');
  });

  it('throws an error when AI generation fails for single question', async () => {
    vi.mocked(AIOrchestrator.generate).mockRejectedValue(new Error('AI failure'));

    await expect(
      generateSingleQuestion({
        topic: 'Lists',
        subject: 'Python',
        difficulty: 'EASY',
        bloomLevel: 'REMEMBER',
      })
    ).rejects.toThrow('AI question generation failed');
  });
});

describe('generateMultipleQuestions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should request exactly 5 questions and parse valid non-mock responses', async () => {
    const mock5Questions = Array.from({ length: 5 }).map((_, i) => ({
      question_text: `What is SQL concept #${i + 1}?`,
      options: ['A. Indexing', 'B. Joins', 'C. Normalization', 'D. Transactions'],
      answer: 'B',
      explanation: 'Joins combine rows from two or more tables.',
      hint: 'Think about combining tables',
      ai_confidence_score: 0.95,
    }));

    vi.mocked(AIOrchestrator.generate).mockResolvedValue({
      questions: mock5Questions,
    });

    const result = await generateMultipleQuestions({
      topic: 'SQL Joins',
      subject: 'DBMS',
      difficulty: 'MEDIUM',
      bloomLevel: 'APPLY',
      count: 5,
    });

    expect(result).toHaveLength(5);
    expect(result[0]?.question_text).toBe('What is SQL concept #1?');
    expect(result[4]?.question_text).toBe('What is SQL concept #5?');
    expect(result.every((q) => !q.question_text.includes('[Mock]'))).toBe(true);
    expect(result.every((q) => q.options.length === 4)).toBe(true);
  });

  it('filters out mock and invalid placeholder questions from raw AI output', async () => {
    vi.mocked(AIOrchestrator.generate).mockResolvedValue({
      questions: [
        {
          question_text: 'What is a primary key in SQL?',
          options: ['A. Unique identifier', 'B. Foreign reference', 'C. Index key', 'D. Null value'],
          answer: 'A',
          hint: 'Uniquely identifies a row',
        },
        {
          question_text: '[Mock] What is a key concept in SQL? (1)',
          options: ['A. It is fundamental', 'B. It is irrelevant', 'C. It is deprecated', 'D. None of the above'],
          answer: 'A',
        },
        {
          question_text: 'What does ACID stand for in databases?',
          options: ['A. Atomicity Consistency Isolation Durability', 'B. Access Control Interface Data', 'C. Array Calculation Index Division', 'D. Automated System Data'],
          answer: 'A',
          hint: 'Database transaction properties',
        },
      ],
    });

    const result = await generateMultipleQuestions({
      topic: 'SQL',
      subject: 'DBMS',
      difficulty: 'MEDIUM',
      bloomLevel: 'APPLY',
      count: 3,
    });

    expect(result).toHaveLength(2);
    expect(result.some((q) => q.question_text.includes('[Mock]'))).toBe(false);
    expect(result[0]?.question_text).toBe('What is a primary key in SQL?');
    expect(result[1]?.question_text).toBe('What does ACID stand for in databases?');
  });

  it('throws an error instead of returning hardcoded mock questions when AI generation fails', async () => {
    vi.mocked(AIOrchestrator.generate).mockRejectedValue(new Error('AI provider connection timeout'));

    await expect(
      generateMultipleQuestions({
        topic: 'SQL',
        subject: 'DBMS',
        difficulty: 'MEDIUM',
        bloomLevel: 'APPLY',
        count: 5,
      })
    ).rejects.toThrow('AI question generation failed');
  });
});

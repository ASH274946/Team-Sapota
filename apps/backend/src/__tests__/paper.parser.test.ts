import { describe, it, expect } from 'vitest';
import { parsePaperJson, PaperParseError } from '../parsers/paper.parser';

const validPaper = {
  title: 'Test Exam',
  totalMarks: 10,
  sections: [
    {
      title: 'Section A',
      instruction: 'Answer all questions',
      questions: [
        {
          id: '123e4567-e89b-12d3-a456-426614174000',
          question: 'What is photosynthesis?',
          type: 'short-answer',
          difficulty: 'easy',
          marks: 5,
        },
        {
          id: '123e4567-e89b-12d3-a456-426614174001',
          question: 'Describe the carbon cycle in detail.',
          type: 'long-answer',
          difficulty: 'hard',
          marks: 5,
        },
      ],
    },
  ],
};

describe('parsePaperJson', () => {
  it('should parse valid JSON correctly', () => {
    const result = parsePaperJson(JSON.stringify(validPaper));
    expect(result.title).toBe('Test Exam');
    expect(result.totalMarks).toBe(10);
    expect(result.sections).toHaveLength(1);
    expect(result.sections[0]!.questions).toHaveLength(2);
  });

  it('should strip markdown code fences', () => {
    const fenced = '```json\n' + JSON.stringify(validPaper) + '\n```';
    const result = parsePaperJson(fenced);
    expect(result.title).toBe('Test Exam');
  });

  it('should throw PaperParseError for invalid JSON', () => {
    expect(() => parsePaperJson('not json')).toThrow(PaperParseError);
  });

  it('should throw PaperParseError for JSON missing required fields', () => {
    const invalid = JSON.stringify({ title: 'Test', sections: [] });
    expect(() => parsePaperJson(invalid)).toThrow(PaperParseError);
  });

  it('should repair invalid question uuid', () => {
    const bad = { ...validPaper };
    const cloned = JSON.parse(JSON.stringify(bad));
    cloned.sections[0].questions[0].id = 'not-a-uuid';
    const repaired = parsePaperJson(JSON.stringify(cloned));
    expect(repaired.sections[0]?.questions[0]?.id).toMatch(/^[0-9a-f-]{36}$/i);
  });
});

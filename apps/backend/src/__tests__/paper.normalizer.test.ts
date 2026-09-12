import { describe, expect, it } from 'vitest';
import { parsePaperJson } from '../parsers/paper.parser';

describe('paper normalization pipeline', () => {
  it('rejects malformed AI output that does not match the paper schema', () => {
    const raw = JSON.stringify({
      title: '',
      sections: [
        {
          title: '',
          questions: [
            {
              id: 'not-a-uuid',
              question: 'x',
              type: 'multiple_choice',
              difficulty: 'advanced',
              marks: 0,
              options: [
                { key: 'a', text: 'Option A' },
                { key: 'b', text: 'Option B' },
                { key: 'c', text: 'Option C' },
                { key: 'd', text: 'Option D' },
              ],
            },
          ],
        },
      ],
    });

    expect(() => parsePaperJson(raw)).toThrow();
  });
});

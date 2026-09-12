import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { AIOrchestrator } from '../services/ai/ai-orchestrator.service';
import { NvidiaProvider } from '../services/ai/providers/nvidia.provider';
import { GroqProvider } from '../services/ai/providers/groq.provider';

describe('NVIDIA to Groq Circuit Breaker & Timeout Failover', () => {
  beforeEach(() => {
    AIOrchestrator.getHealthManager().resetAll();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('fails over to Groq within 12 seconds when primary NVIDIA endpoint times out', async () => {
    // Mock NVIDIA to simulate hang / timeout (>12s)
    vi.spyOn(NvidiaProvider.prototype, 'generate').mockImplementation(
      (_prompt: string, _options?: any, signal?: AbortSignal) => {
        return new Promise((_resolve, reject) => {
          const timer = setTimeout(() => resolveValidResponse('NVIDIA'), 15_000);
          if (signal) {
            signal.addEventListener('abort', () => {
              clearTimeout(timer);
              const err = new Error('AI generation (nvidia) timed out after 12000ms');
              err.name = 'AbortError';
              reject(err);
            });
          }
        });
      }
    );

    // Mock Groq to respond successfully in 200ms
    const validGroqPaper = {
      title: 'Midterm Examination',
      totalMarks: 100,
      sections: [
        {
          title: 'Section A',
          marks: 100,
          instructions: 'Answer all questions',
          questions: [
            {
              id: 'q1',
              type: 'MCQ',
              question: 'What is 2+2?',
              marks: 100,
              difficulty: 'easy',
              bloomLevel: 'REMEMBER',
            },
          ],
        },
      ],
    };

    vi.spyOn(GroqProvider.prototype, 'generate').mockResolvedValue(JSON.stringify(validGroqPaper));

    const startTime = Date.now();
    const result = await AIOrchestrator.generate({
      intent: 'GenerateQuestionPaper',
      context: 'Sample Syllabus',
      taskInstructions: 'Generate questions',
      responseFormat: { type: 'json_object' },
    });

    const duration = Date.now() - startTime;

    expect(result).toEqual(validGroqPaper);
    // Verified failover completed within 12 seconds (plus small test tolerance e.g. < 13500ms)
    expect(duration).toBeGreaterThanOrEqual(11_900);
    expect(duration).toBeLessThan(13_500);

    // Groq was invoked as fallback
    expect(GroqProvider.prototype.generate).toHaveBeenCalledTimes(1);
  }, 20_000);

  it('trips circuit to OPEN state on 3 consecutive timeouts within 60 seconds', async () => {
    const healthManager = AIOrchestrator.getHealthManager();

    // Mock NVIDIA to reject immediately with timeout error
    vi.spyOn(NvidiaProvider.prototype, 'generate').mockRejectedValue(
      new Error('AI generation (nvidia) timed out after 12000ms')
    );

    const validGroqPaper = { title: 'Test Paper', totalMarks: 10, sections: [] };
    vi.spyOn(GroqProvider.prototype, 'generate').mockResolvedValue(JSON.stringify(validGroqPaper));

    // Request 1: 1st timeout failure
    await AIOrchestrator.generate({
      intent: 'GenerateQuestionPaper',
      context: 'Context 1',
      taskInstructions: 'Instructions',
    });
    expect(healthManager.getCircuitState('nvidia')).toBe('CLOSED');

    // Request 2: 2nd timeout failure
    await AIOrchestrator.generate({
      intent: 'GenerateQuestionPaper',
      context: 'Context 2',
      taskInstructions: 'Instructions',
    });
    expect(healthManager.getCircuitState('nvidia')).toBe('CLOSED');

    // Request 3: 3rd timeout failure -> TRIPS CIRCUIT TO OPEN
    await AIOrchestrator.generate({
      intent: 'GenerateQuestionPaper',
      context: 'Context 3',
      taskInstructions: 'Instructions',
    });
    expect(healthManager.getCircuitState('nvidia')).toBe('OPEN');
    expect(healthManager.canAttempt('nvidia')).toBe(false);

    // Request 4: Proactively skips NVIDIA without waiting 12s, directly calling Groq
    const req4Start = Date.now();
    const req4Result = await AIOrchestrator.generate({
      intent: 'GenerateQuestionPaper',
      context: 'Context 4',
      taskInstructions: 'Instructions',
    });
    const req4Duration = Date.now() - req4Start;

    expect(req4Result).toEqual(validGroqPaper);
    // Fast proactive failover (< 1000ms)
    expect(req4Duration).toBeLessThan(1000);
  }, 30_000);

  it('handles 5xx HTTP server errors from primary provider and trips circuit', async () => {
    vi.spyOn(NvidiaProvider.prototype, 'generate').mockRejectedValue(
      new Error('NVIDIA NIM API HTTP 503 Service Unavailable')
    );

    const validGroqPaper = { title: 'Test Paper 5xx', totalMarks: 50, sections: [] };
    vi.spyOn(GroqProvider.prototype, 'generate').mockResolvedValue(JSON.stringify(validGroqPaper));

    for (let i = 0; i < 3; i++) {
      await AIOrchestrator.generate({
        intent: 'GenerateQuestionPaper',
        context: 'Context 5xx',
        taskInstructions: 'Instructions',
      });
    }

    expect(AIOrchestrator.getHealthManager().getCircuitState('nvidia')).toBe('OPEN');
  });
});

function resolveValidResponse(_provider: string) {
  return JSON.stringify({ title: 'Paper', totalMarks: 10, sections: [] });
}

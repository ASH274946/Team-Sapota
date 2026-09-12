import type { Job } from 'bullmq';
import { logger } from '../utils/logger';
import { AIOrchestrator } from './ai/ai-orchestrator.service';
import { retrieveContext } from './rag.service';
import { validatePaperOrThrow, type ValidatedPaper } from '../validators/paper.validator';
import type { IAssignment } from '../types/models.types';
import type { GenerationJobData } from '../types/queue.types';
import type { GenerationStage } from '../types/socket.types';
import type { QuestionTypeBreakdown } from '../prompts/generation.prompt';

export interface GenerationOutcome {
  paper: ValidatedPaper;
  warnings?: string[];
  metrics?: Record<string, any>;
  retries?: number;
}

export async function generatePaper(
  assignment: IAssignment,
  uploadedContent?: string,
  typeBreakdown?: QuestionTypeBreakdown[],
  job?: Job<GenerationJobData>,
  onStage?: (stage: GenerationStage, progress: number, message: string) => Promise<void>,
  signal?: AbortSignal
): Promise<GenerationOutcome> {
  if (signal?.aborted) throw new Error('Generation cancelled');

  const reportProgress = async (stage: GenerationStage, progress: number, msg: string) => {
    if (signal?.aborted) throw new Error('Generation cancelled');
    if (onStage) await onStage(stage, progress, msg);
    if (job) await job.updateProgress(progress).catch(() => {});
  };

  await reportProgress('extracting_content', 10, 'Retrieving institutional context...');

  // 1. Hybrid RAG Context Retrieval
  let ragContext = '';
  try {
    // If organizationId isn't on IAssignment, we pass '' for now
    ragContext = await retrieveContext(assignment.title || 'General Examination', '', 10);
  } catch (e) {
    logger.warn(`Failed to retrieve RAG context for paper generation: ${e}`);
  }

  const combinedContext = [uploadedContent, ragContext].filter(Boolean).join('\n\n');

  await reportProgress('generation_planning', 30, 'Planning paper generation via AI Orchestrator...');

  // 2. Strict JSON Schema for Paper Generation
  const responseFormat = {
    type: "json_schema",
    json_schema: {
      name: "generated_paper",
      schema: {
        type: "object",
        properties: {
          title: { type: "string" },
          totalMarks: { type: "number" },
          sections: {
            type: "array",
            items: {
              type: "object",
              properties: {
                title: { type: "string" },
                marks: { type: "number" },
                instructions: { type: "string" },
                questions: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      id: { type: "string" },
                      type: { type: "string" },
                      question: { type: "string" },
                      marks: { type: "number" },
                      difficulty: { type: "string", enum: ["easy", "medium", "hard"] },
                      bloomLevel: { type: "string", enum: ["REMEMBER", "UNDERSTAND", "APPLY", "ANALYZE", "EVALUATE", "CREATE"] },
                      options: { type: "array", items: { type: "string" } },
                      hint: { type: "string" }
                    },
                    required: ["id", "type", "question", "marks", "difficulty", "bloomLevel"]
                  }
                }
              },
              required: ["title", "marks", "instructions", "questions"]
            }
          }
        },
        required: ["title", "totalMarks", "sections"]
      }
    }
  };

  let breakdownInstructions = '';
  if (typeBreakdown && Array.isArray(typeBreakdown) && typeBreakdown.length > 0) {
    const totalQCount = typeBreakdown.reduce((sum, item) => sum + (Number(item.count) || 0), 0);
    const breakdownLines = typeBreakdown.map((item, idx) => {
      const sectionName = `Section ${String.fromCharCode(65 + idx)}`;
      const displayName = item.displayType || item.type;
      const count = item.count;
      const marksPerQ = item.marksPerQuestion || 1;
      const totalSectionMarks = count * marksPerQ;
      return `- ${sectionName}: "${displayName}" -> Generate EXACTLY ${count} question(s) of type '${item.type}' worth ${marksPerQ} mark(s) each (Section total: ${totalSectionMarks} marks).`;
    });
    breakdownInstructions = `
REQUIRED PAPER STRUCTURE & BREAKDOWN:
Total questions to generate: ${totalQCount}
${breakdownLines.join('\n')}
`;
  }

  const taskInstructions = `
You are an Expert Question Paper Setter. Generate a complete examination paper.
Assignment Title: ${assignment.title}
Subject: ${assignment.subject || 'General'}
Total Marks: ${assignment.totalMarks}

CRITICAL RULES:
1. Return EXACTLY the JSON schema requested with valid JSON only.
2. Distribute questions into sections (Section A, Section B, etc.) adhering to the requested breakdown.
3. The sum of all question marks across all sections must equal exactly ${assignment.totalMarks}.
4. Map EVERY question to an appropriate Bloom's Taxonomy level ("REMEMBER", "UNDERSTAND", "APPLY", "ANALYZE", "EVALUATE", "CREATE") and Difficulty ("easy", "medium", "hard").
5. For all multiple choice questions ('mcq'), provide exactly 4 distinct, plausible options.
6. Ensure questions are high-quality, academically rigorous, and relevant to "${assignment.title}".
7. Avoid duplicate or vague placeholder questions.
${breakdownInstructions}
`;

  await reportProgress('batch_generating', 50, 'Generating paper sections and validating constraints...');

  // 3. Execution via AI Orchestrator (Provider Agnostic with proactive failover)
  const generatedData = await AIOrchestrator.generate({
    intent: 'GenerateQuestionPaper',
    context: combinedContext,
    taskInstructions,
    responseFormat,
    signal,
  });

  await reportProgress('validating', 80, 'Validating generated paper format...');

  // Normalize LLM output before validation to ensure UUIDs, type enums, and MCQ options conform to schema
  const normalizedData = normalizeRawPaper(generatedData, assignment.totalMarks || 100);

  // Validate the resulting JSON against our internal Zod validator
  const validatedPaper = validatePaperOrThrow(normalizedData);

  await reportProgress('completed', 100, 'Paper generation successful.');

  return {
    paper: validatedPaper,
    warnings: [],
    metrics: { method: 'AIOrchestrator', length: combinedContext.length }
  };
}

function normalizeRawPaper(rawInput: any, totalMarksRequired: number): any {
  if (!rawInput || typeof rawInput !== 'object') {
    throw new Error('AI generation returned empty or invalid response.');
  }

  // Unwrap potential nested object wrappers
  const raw = rawInput.paper || rawInput.data || rawInput.result || rawInput;

  let rawSections: any[] = [];
  if (Array.isArray(raw.sections) && raw.sections.length > 0) {
    rawSections = raw.sections;
  } else if (Array.isArray(raw.questions) && raw.questions.length > 0) {
    // If model returned flat questions array, wrap into Section A
    rawSections = [{
      title: 'Section A',
      instruction: 'Attempt all questions.',
      questions: raw.questions
    }];
  }

  const validBlooms = ['REMEMBER', 'UNDERSTAND', 'APPLY', 'ANALYZE', 'EVALUATE', 'CREATE'];

  const normalizedSections = rawSections.map((sec: any, sIdx: number) => {
    const rawQuestions = Array.isArray(sec.questions) ? sec.questions : [];
    const questions = rawQuestions.map((q: any) => {
      let type = String(q.type || 'short-answer').toLowerCase().replace(/_/g, '-');
      if (type === 'multiple-choice' || type === 'multiple_choice' || type === 'mcqs') type = 'mcq';
      if (type === 'true_false' || type === 'tf') type = 'true-false';
      if (type === 'fill_in_the_blank' || type === 'fill-in-the-blanks' || type === 'fill_blank') type = 'fill-blank';
      if (type === 'short_answer' || type === 'short') type = 'short-answer';
      if (type === 'long_answer' || type === 'long') type = 'long-answer';
      if (!['mcq', 'true-false', 'fill-blank', 'short-answer', 'long-answer'].includes(type)) {
        type = 'short-answer';
      }

      let difficulty = String(q.difficulty || 'medium').toLowerCase();
      if (!['easy', 'medium', 'hard'].includes(difficulty)) difficulty = 'medium';

      let bloomLevel = String(q.bloomLevel || 'UNDERSTAND').toUpperCase();
      if (!validBlooms.includes(bloomLevel)) {
        bloomLevel = 'UNDERSTAND';
      }

      const marks = Math.max(1, Math.round(Number(q.marks) || 1));

      const id = (q.id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(q.id))
        ? q.id
        : crypto.randomUUID();

      const normalizedQ: any = {
        id,
        question: String(q.question || q.question_text || 'Question text').trim(),
        type,
        difficulty,
        bloomLevel,
        marks,
      };

      if (q.hint) normalizedQ.hint = String(q.hint).trim();

      if (type === 'mcq') {
        const rawOptions = Array.isArray(q.options) ? q.options : [];
        const keys = ['A', 'B', 'C', 'D'] as const;
        normalizedQ.options = keys.map((key, idx) => {
          const opt = rawOptions[idx];
          if (typeof opt === 'string') return { key, text: opt.replace(/^[A-D][.)]\s*/i, '').trim() || `Option ${key}` };
          if (opt && typeof opt === 'object') return { key, text: String(opt.text || opt.value || `Option ${key}`).replace(/^[A-D][.)]\s*/i, '').trim() };
          return { key, text: `Option ${key}` };
        });
      } else if (type === 'fill-blank') {
        normalizedQ.blanks = Math.max(1, Math.round(Number(q.blanks) || 1));
      }

      if (q.answer) {
        normalizedQ.answer = {
          text: typeof q.answer === 'string' ? q.answer : String(q.answer.text || ''),
          ...(q.answer.explanation ? { explanation: String(q.answer.explanation) } : {}),
          ...(Array.isArray(q.answer.expectedConcepts) ? { expectedConcepts: q.answer.expectedConcepts } : {}),
          ...(Array.isArray(q.answer.rubricCriteria) ? { rubricCriteria: q.answer.rubricCriteria } : {})
        };
      }

      return normalizedQ;
    }).filter((q: any) => q.question && q.question !== 'Question text');

    return {
      title: String(sec.title || `Section ${String.fromCharCode(65 + sIdx)}`),
      instruction: String(sec.instruction || sec.instructions || 'Attempt all questions.'),
      questions,
    };
  }).filter((sec: any) => sec.questions.length > 0);

  if (normalizedSections.length === 0) {
    throw new Error('AI generation produced no valid sections or questions.');
  }

  return {
    title: String(raw.title || 'Examination Question Paper'),
    totalMarks: Math.max(1, Math.round(Number(raw.totalMarks) || totalMarksRequired)),
    sections: normalizedSections,
  };
}


export async function generateAnswersForPaper(paper: ValidatedPaper, signal?: AbortSignal): Promise<ValidatedPaper> {
  if (signal?.aborted) throw new Error('Answer generation cancelled');
  const responseFormat = {
    type: "json_schema",
    json_schema: {
      name: "generated_answers_and_rubric",
      schema: {
        type: "object",
        properties: {
          answers: {
            type: "array",
            items: {
              type: "object",
              properties: {
                questionId: { type: "string" },
                answer: {
                  type: "object",
                  properties: {
                    text: { type: "string" },
                    explanation: { type: "string" },
                    expectedConcepts: { type: "array", items: { type: "string" } },
                    rubricCriteria: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          name: { type: "string" },
                          marks: { type: "number" },
                          description: { type: "string" }
                        },
                        required: ["name", "marks", "description"]
                      }
                    }
                  },
                  required: ["text", "expectedConcepts", "rubricCriteria"]
                }
              },
              required: ["questionId", "answer"]
            }
          }
        },
        required: ["answers"]
      }
    }
  };

  const questionsJson = JSON.stringify(paper.sections.map(s => s.questions).flat().map(q => ({ id: q.id, question: q.question, marks: q.marks })));

  const taskInstructions = `
Generate comprehensive answer keys, expected concepts, and grading rubrics for the following questions:
${questionsJson}

CRITICAL RULES:
1. Provide a detailed answer for each question.
2. Provide 'expectedConcepts' indicating exactly what concepts must be present for full marks.
3. Provide 'rubricCriteria' breaking down the question's total marks into specific actionable criteria for the AI Grader.
`;

  const generatedData = await AIOrchestrator.generate({
    intent: 'GenerateQuestionPaper',
    context: '',
    taskInstructions,
    responseFormat,
    signal,
  });

  // Merge the generated answers back into the paper
  const answerMap = new Map();
  if (generatedData.answers) {
    for (const ans of generatedData.answers) {
      answerMap.set(ans.questionId, ans.answer);
    }
  }

  const updatedPaper = { ...paper, sections: [...paper.sections] };
  for (const section of updatedPaper.sections) {
    for (const question of section.questions) {
      if (answerMap.has(question.id)) {
        question.answer = answerMap.get(question.id);
      }
    }
  }

  return updatedPaper;
}

export function getProviderHealthSnapshot() {
  return AIOrchestrator.getHealthSnapshot();
}

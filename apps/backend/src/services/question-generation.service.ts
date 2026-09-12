import { retrieveContext } from './rag.service';
import { logger } from '../utils/logger';
import { AIOrchestrator } from './ai/ai-orchestrator.service';

export interface GeneratedQuestion {
  id: string;
  question_text: string;
  options: string[];
  answer: string;
  difficulty: string;
  bloomLevel: string;
  ai_confidence_score: number;
  hint?: string;
}

export class ImageRefError extends Error {
  constructor() { super('Uploaded content contained image references which were removed. Please use text-only content.'); }
}

export async function generateSingleQuestion(params: {
  topic: string;
  subject: string;
  difficulty: string;
  bloomLevel: string;
  context?: string;
  organizationId?: string;
}): Promise<GeneratedQuestion> {

  let ragContext = '';
  if (params.organizationId) {
    try {
      // The retriever automatically handles Hybrid Search & Context Expansion
      ragContext = await retrieveContext(params.topic, params.organizationId, 5);
    } catch (e) {
      logger.warn(`Failed to retrieve RAG context for question gen: ${e}`);
    }
  }

  // Define structured JSON schema for the AI output
  const responseFormat = { type: "json_object" };

  const taskInstructions = [
    `Topic: ${params.topic}`,
    `Subject: ${params.subject}`,
    `Difficulty: ${params.difficulty}`,
    `Bloom's Taxonomy Level: ${params.bloomLevel}`,
    'Task: Generate one high-quality, unique multiple-choice question.',
    'Rules:',
    '- Include exactly 4 plausible options (A, B, C, D)',
    '- Mark the correct answer clearly as exactly "A", "B", "C", or "D"',
    '- Include a helpful, subtle hint (max 1 sentence)',
    '- Return ONLY valid JSON matching this exact structure: { "question_text": "...", "options": ["A. ...", "B. ...", "C. ...", "D. ..."], "answer": "A", "explanation": "...", "hint": "...", "ai_confidence_score": 0.95 }'
  ].join('\n');

  let parsed: any = null;
  try {
    const aiPromise = AIOrchestrator.generate({
      intent: 'GenerateQuestionPaper', // Routes to deeper reasoning models
      context: [params.context, ragContext].filter(Boolean).join('\n\n'),
      taskInstructions,
      responseFormat
    });
    const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error("AI generation timed out")), 60000));
    parsed = await Promise.race([aiPromise, timeoutPromise]);
  } catch (err) {
    logger.error({ err }, `AI Generation failed for single question on topic "${params.topic}"`);
    throw new Error(`AI question generation failed: ${err instanceof Error ? err.message : String(err)}`);
  }

  if (!parsed || !parsed.question_text) {
    throw new Error('AI generation returned empty response.');
  }

  const rawOptions = (parsed.options as string[]) ?? [];
  const options = rawOptions.map((opt, idx) => {
    const letter = String.fromCharCode(65 + idx);
    const cleaned = opt.replace(/^([A-D])[.)]\s*/i, '').trim();
    return `${letter}. ${cleaned}`;
  });

  if (options.length !== 4) {
    throw new Error('AI generation returned invalid options format.');
  }

  const answer = (parsed.answer as string) ?? 'A';

  return {
    id: `q-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    question_text: String(parsed.question_text).trim(),
    options,
    answer,
    difficulty: params.difficulty,
    bloomLevel: params.bloomLevel,
    ai_confidence_score: Number(parsed.ai_confidence_score) || 0.85,
    hint: parsed.hint ? String(parsed.hint).trim() : undefined,
  };
}

export interface BlueprintSlot {
  id: string;
  coId: string;
  title: string;
  marks: number;
  bloomLevel: string;
  topic?: string;
  itemType: string;
}

export interface BlueprintGenerationResult {
  slotId: string;
  questions: GeneratedQuestion[];
  coId: string;
  bloomLevel: string;
  marks: number;
}

export async function generateFromBlueprint(params: {
  blueprintId: string;
  slots: BlueprintSlot[];
  subject: string;
  difficulty: string;
  context?: string;
  organizationId?: string;
  excludeQuestionIds?: string[];
}): Promise<BlueprintGenerationResult[]> {
  const results: BlueprintGenerationResult[] = [];

  for (const slot of params.slots) {
    const slotQuestions = await generateMultipleQuestions({
      topic: slot.topic || slot.title,
      subject: params.subject,
      difficulty: params.difficulty,
      bloomLevel: slot.bloomLevel,
      context: params.context,
      organizationId: params.organizationId,
      count: Math.max(1, Math.ceil(slot.marks / 5)),
    });

    results.push({
      slotId: slot.id,
      questions: slotQuestions,
      coId: slot.coId,
      bloomLevel: slot.bloomLevel,
      marks: slot.marks,
    });
  }

  return results;
}

export async function generateMultipleQuestions(params: {
  topic: string;
  subject: string;
  difficulty: string;
  bloomLevel: string;
  context?: string;
  organizationId?: string;
  count: number;
}): Promise<GeneratedQuestion[]> {

  let ragContext = '';
  if (params.organizationId) {
    try {
      ragContext = await retrieveContext(params.topic, params.organizationId, 5);
    } catch (e) {
      logger.warn(`Failed to retrieve RAG context for question gen: ${e}`);
    }
  }

  const responseFormat = { type: "json_object" };

  const taskInstructions = [
    `Topic: ${params.topic}`,
    `Subject: ${params.subject}`,
    `Difficulty Level: ${params.difficulty}`,
    `Bloom's Taxonomy Level: ${params.bloomLevel}`,
    `Task: Generate exactly ${params.count} high-quality, completely distinct multiple-choice questions.`,
    'Rules:',
    `- Topic must strictly be "${params.topic}" in "${params.subject}". Do NOT generate generic or placeholder questions.`,
    `- Generate EXACTLY ${params.count} distinct questions.`,
    '- No two questions should test the exact same concept or have similar phrasing.',
    '- Include exactly 4 plausible, domain-specific options per question labeled "A. ...", "B. ...", "C. ...", "D. ...".',
    '- Mark the correct answer clearly as exactly "A", "B", "C", or "D".',
    '- Do NOT use generic placeholder options like "Option A", "It is fundamental", or "None of the above".',
    '- Include a helpful, subtle hint (max 1 sentence) per question.',
    '- Return ONLY valid JSON matching this exact structure: { "questions": [ { "question_text": "...", "options": ["A. ...", "B. ...", "C. ...", "D. ..."], "answer": "A", "explanation": "...", "hint": "...", "ai_confidence_score": 0.95 } ] }'
  ].join('\n');

  let parsed: any = null;
  try {
    const aiPromise = AIOrchestrator.generate({
      intent: 'GenerateQuestionPaper', 
      context: [params.context, ragContext].filter(Boolean).join('\n\n'),
      taskInstructions,
      responseFormat
    });
    const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error("AI generation timed out")), 60000));
    parsed = await Promise.race([aiPromise, timeoutPromise]);
  } catch (err) {
    logger.error({ err }, `AI Generation failed for topic "${params.topic}" count=${params.count}`);
    throw new Error(`AI question generation failed: ${err instanceof Error ? err.message : String(err)}`);
  }

  if (!parsed) {
    throw new Error('AI generation returned empty response.');
  }

  let questionsList: any[] = [];
  if (Array.isArray(parsed.questions)) {
    questionsList = parsed.questions;
  } else if (Array.isArray(parsed)) {
    questionsList = parsed;
  } else if (parsed.question_text) {
    questionsList = [parsed];
  }

  const validQuestions: GeneratedQuestion[] = [];

  for (let i = 0; i < questionsList.length; i++) {
    const item = questionsList[i];
    if (!item || typeof item !== 'object') continue;

    const questionText = String(item.question_text || item.questionText || item.question || '').trim();
    
    // Reject mock or empty questions
    if (!questionText || questionText.includes('[Mock]') || questionText.toLowerCase().includes('placeholder')) {
      continue;
    }

    let options: string[] = Array.isArray(item.options) ? item.options.map(String) : [];
    if (options.length !== 4 || options.some(opt => opt.includes('It is fundamental') || opt.includes('Option A'))) {
      continue;
    }

    // Ensure options are prefixed with A., B., C., D.
    options = options.map((opt, idx) => {
      const letter = String.fromCharCode(65 + idx);
      const cleaned = opt.replace(/^([A-D])[.)]\s*/i, '').trim();
      return `${letter}. ${cleaned}`;
    });

    let answer = String(item.answer || 'A').trim().toUpperCase();
    if (!['A', 'B', 'C', 'D'].includes(answer)) {
      answer = 'A';
    }

    validQuestions.push({
      id: `q-${Date.now()}-${i}-${Math.random().toString(36).slice(2, 8)}`,
      question_text: questionText,
      options,
      answer,
      difficulty: params.difficulty,
      bloomLevel: params.bloomLevel,
      ai_confidence_score: Number(item.ai_confidence_score) || 0.90,
      hint: item.hint ? String(item.hint).trim() : undefined,
    });
  }

  return validQuestions;
}

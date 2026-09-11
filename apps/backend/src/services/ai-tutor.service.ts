import { Prisma } from '@prisma/client';
import prisma from '../config/prisma';
import { AIOrchestrator } from './ai/ai-orchestrator.service';
import { retrieveContext, retrieveContextWithSources, type RagSourceCitation } from './rag.service';
import fs from 'fs';
import path from 'path';

export interface TutorChatResult {
  message: string;
  followUp: string;
  messageId: string;
  confidenceScore?: number;
  ragReferences?: Prisma.InputJsonValue;
  sources?: RagSourceCitation[];
}

export type TutorStreamEvent =
  | { type: 'sources'; sources: RagSourceCitation[] }
  | { type: 'token'; token: string }
  | { type: 'done'; result: TutorChatResult };

interface PreparedChatContext {
  sessionId: string;
  studentId: string;
  organizationId: string;
  userMessage: string;
  activeMode: string;
  ragContext: string;
  sources: RagSourceCitation[];
  jsonPrompt: string;
  streamPrompt: string;
}

function readMasterPrompt(): string {
  const promptPath = path.join(process.cwd(), 'tutor_master_prompt.txt');
  try {
    return fs.readFileSync(promptPath, 'utf8');
  } catch {
    return 'You are a Socratic AI tutor. Guide students with questions and clear explanations grounded in provided context.';
  }
}

export class AITutorService {
  private static async prepareChatContext(
    sessionId: string,
    studentId: string,
    organizationId: string,
    userMessage: string,
    modeOverride?: string,
    includeSources = false
  ): Promise<PreparedChatContext> {
    const session = await prisma.tutorSession.findUnique({
      where: { id: sessionId },
      include: { messages: { take: 10, orderBy: { createdAt: 'desc' } } },
    });

    if (!session) throw new Error('Tutor session not found');
    if (session.studentId !== studentId) throw new Error('Not authorized for this tutor session');

    const profile = await prisma.studentLearningProfile.findUnique({
      where: { studentId },
    });

    const weaknesses = profile?.weakConcepts ? JSON.stringify(profile.weakConcepts) : 'None specifically identified.';

    let allowDirectAnswers = false;
    let maxDepth = 3;

    if (organizationId) {
      const config = await prisma.teacherTutorConfig.findUnique({
        where: { organizationId },
      });
      if (config) {
        allowDirectAnswers = config.allowDirectAnswers;
        maxDepth = config.maxExplanationDepth;
      }
    }

    let ragContext = '';
    let sources: RagSourceCitation[] = [];
    if (includeSources) {
      const retrieval = await retrieveContextWithSources(userMessage, organizationId, 5);
      ragContext = retrieval.context;
      sources = retrieval.sources;
    } else {
      ragContext = await retrieveContext(userMessage, organizationId, 5);
    }

    const activeMode = modeOverride?.toUpperCase() || session.tutorMode;
    let modeInstructions = '';
    if (activeMode === 'HINT') {
      modeInstructions =
        'You MUST NOT provide the direct answer. Provide a subtle hint to help the student figure it out on their own. Be brief and encouraging.';
    } else if (activeMode === 'SOCRATIC') {
      modeInstructions =
        'You MUST use the Socratic method. Do not answer directly. Ask a leading question that guides the student to discover the answer themselves.';
    } else {
      modeInstructions =
        'You may explain the concept clearly and directly, but still follow up with a question to check understanding.';
    }

    const dynamicContext = `
--- DYNAMIC CONTEXT ---
Mode: ${activeMode}
Student Weaknesses: ${weaknesses}
Topic: ${session.subject}

PEDAGOGICAL GUIDELINES:
1. Mode Rules:
   - Direct Answers Allowed: ${allowDirectAnswers} (If false and mode is SOCRATIC or HINT, guide through questions and clues instead of giving final solutions immediately).
   - ${modeInstructions}
2. Tone & Quality:
   - Be an engaging, patient, and highly expert AI academic tutor.
   - Use clear GitHub Flavored Markdown (headings, bold text, bullet points, tables, and formatted code blocks with language tags where applicable).
   - If the student asks for technical examples (e.g., TypeScript, Python, math formulas), provide accurate, well-commented code snippets.
3. Multi-Concept / Multi-Question Queries:
   - If the student asks about multiple aspects or concepts, address each one logically with clear markdown headings or numbered sections.
   - Do NOT output robotic intros like "I found X questions in your message". Speak naturally and authoritatively.
4. Grounding:
   - Ground your explanation in the provided syllabus and RAG context when available.
   - Keep explanation depth within ${maxDepth} levels of conceptual breakdown.

Student Message: "${userMessage}"
`;

    const jsonPrompt = `
${readMasterPrompt()}

${dynamicContext}
5. Output your response ONLY as a JSON object matching this schema:
{
  "message": "string (The formatted markdown response)",
  "suggestedFollowUp": "string",
  "confidenceScore": "number",
  "isDomainViolation": "boolean"
}
`;

    const streamPrompt = `
${readMasterPrompt()}

${dynamicContext}
5. Output ONLY the markdown tutor response. Do NOT wrap the answer in JSON or code fences.
`;

    return {
      sessionId,
      studentId,
      organizationId,
      userMessage,
      activeMode,
      ragContext,
      sources,
      jsonPrompt,
      streamPrompt,
    };
  }

  private static async persistExchange(
    sessionId: string,
    userMessage: string,
    assistantMessage: string,
    ragReferences: Prisma.InputJsonValue | undefined,
    confidence?: number
  ): Promise<string> {
    await prisma.tutorMessage.create({
      data: {
        sessionId,
        role: 'USER',
        content: userMessage,
      },
    });

    const assistantMsg = await prisma.tutorMessage.create({
      data: {
        sessionId,
        role: 'ASSISTANT',
        content: assistantMessage,
        ragReferences: ragReferences ?? Prisma.JsonNull,
        confidence,
      },
    });

    await prisma.tutorSession.update({
      where: { id: sessionId },
      data: { updatedAt: new Date() },
    });

    return assistantMsg.id;
  }

  /**
   * Processes a student's message within a Socratic tutoring session (HTTP fallback).
   */
  static async chat(
    sessionId: string,
    studentId: string,
    organizationId: string,
    userMessage: string,
    modeOverride?: string
  ): Promise<TutorChatResult> {
    const ctx = await this.prepareChatContext(sessionId, studentId, organizationId, userMessage, modeOverride);

    const tutorReply = await AIOrchestrator.generate({
      intent: 'GenerateQuestionExplanation',
      context: ctx.ragContext,
      taskInstructions: ctx.jsonPrompt,
      responseFormat: { type: 'json_object' },
    });

    if (tutorReply.isDomainViolation) {
      tutorReply.message =
        "I'm sorry, but I can only assist with educational and academic topics related to your coursework.";
      tutorReply.suggestedFollowUp = "Is there a concept from your syllabus you'd like to review?";
    }

    const ragReferences: Prisma.InputJsonValue = ctx.sources.length
      ? { source: 'rag_engine', contextRetrieved: true, citations: ctx.sources as unknown as Prisma.InputJsonValue }
      : { source: 'rag_engine', contextRetrieved: Boolean(ctx.ragContext) };

    const messageId = await this.persistExchange(
      sessionId,
      userMessage,
      tutorReply.message,
      ragReferences,
      tutorReply.confidenceScore
    );

    return {
      message: tutorReply.message,
      followUp: tutorReply.suggestedFollowUp,
      messageId,
      confidenceScore: tutorReply.confidenceScore,
      ragReferences,
    };
  }

  /**
   * Streams tutor tokens for WebSocket delivery while preserving RAG grounding.
   */
  static async *streamChat(
    sessionId: string,
    studentId: string,
    organizationId: string,
    userMessage: string,
    modeOverride?: string,
    signal?: AbortSignal
  ): AsyncGenerator<TutorStreamEvent> {
    const ctx = await this.prepareChatContext(
      sessionId,
      studentId,
      organizationId,
      userMessage,
      modeOverride,
      true
    );

    if (ctx.sources.length > 0) {
      yield { type: 'sources', sources: ctx.sources };
    }

    let fullText = '';
    try {
      for await (const token of AIOrchestrator.stream({
        intent: 'GenerateQuestionExplanation',
        context: ctx.ragContext,
        taskInstructions: ctx.streamPrompt,
        signal,
      })) {
        fullText += token;
        yield { type: 'token', token };
      }
    } catch (streamErr) {
      if (!fullText) {
        try {
          const genResult = await AIOrchestrator.generate({
            intent: 'GenerateQuestionExplanation',
            context: ctx.ragContext,
            taskInstructions: ctx.jsonPrompt,
            responseFormat: { type: 'json_object' },
            signal,
          });
          const text = genResult?.message || (typeof genResult === 'string' ? genResult : '');
          if (text) {
            fullText = text;
            yield { type: 'token', token: text };
          }
        } catch {
          // If all AI fails, provide a sensible academic prompt
          const fallback = `I am ready to help you learn **${ctx.activeMode}** style. Please tell me which specific aspect of this topic you would like to explore or solve!`;
          fullText = fallback;
          yield { type: 'token', token: fallback };
        }
      }
    }

    let message = fullText.trim();
    if (!message) {
      message = `I'm here to help you master this concept. Could you share what questions you have about this topic?`;
      yield { type: 'token', token: message };
    }

    const ragReferences: Prisma.InputJsonValue = ctx.sources.length
      ? { source: 'rag_engine', contextRetrieved: true, citations: ctx.sources as unknown as Prisma.InputJsonValue }
      : { source: 'rag_engine', contextRetrieved: Boolean(ctx.ragContext) };

    const messageId = await this.persistExchange(
      sessionId,
      userMessage,
      message,
      ragReferences,
      0.85
    );

    yield {
      type: 'done',
      result: {
        message,
        followUp: 'Would you like to explore this topic further or try a related practice question?',
        messageId,
        confidenceScore: 0.85,
        ragReferences,
        sources: ctx.sources,
      },
    };
  }
}

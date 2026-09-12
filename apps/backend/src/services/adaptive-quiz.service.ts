import { AIOrchestrator } from './ai/ai-orchestrator.service';
import { retrieveContext } from './rag.service';
import prisma from '../config/prisma';


export class AdaptiveQuizService {
  /**
   * Generates the next question adaptively based on previous session performance.
   */
  static async generateAdaptiveQuestion(sessionId: string) {
    const session = await prisma.quizSession.findUnique({
      where: { id: sessionId },
      include: { questions: true }
    });

    if (!session) throw new Error('Quiz Session not found');

    const previousQuestions = session.questions;
    
    // Determine the next difficulty level based on the last question's result
    // In a real system, we'd also check if the student actually answered correctly.
    // For this demonstration, we'll assume a basic adaptive rule.
    const nextDifficulty = session.difficulty;
    const adaptiveDelta = 0;

    // We can pull RAG context to ground the question
    const ragContext = await retrieveContext(session.topic, session.organizationId || '', 5);

    const prompt = `
Generate the NEXT adaptive quiz question for the topic: ${session.topic}.
Subject: ${session.subject}
Target Difficulty: ${nextDifficulty}

CRITICAL RULES:
1. Ensure the question is entirely unique. DO NOT duplicate concepts from previous questions.
2. Provide exactly 4 options.
3. Map it to a valid Bloom's Taxonomy level.
4. Output strict JSON.
`;

    const responseFormat = {
      type: "json_schema",
      json_schema: {
        name: "adaptive_question",
        schema: {
          type: "object",
          properties: {
            questionText: { type: "string" },
            options: { type: "array", items: { type: "string" } },
            answer: { type: "string" },
            difficulty: { type: "string" },
            bloomLevel: { type: "string" },
            learningOutcome: { type: "string" },
            aiConfidenceScore: { type: "number" }
          },
          required: ["questionText", "options", "answer", "difficulty", "bloomLevel"]
        }
      }
    };

    const questionData = await AIOrchestrator.generate({
      intent: 'GenerateQuestionPaper',
      context: ragContext,
      taskInstructions: prompt,
      responseFormat
    });

    // Save the new question
    const newQuestion = await prisma.quizSessionQuestion.create({
      data: {
        sessionId: session.id,
        questionIndex: previousQuestions.length + 1,
        questionText: questionData.questionText,
        options: questionData.options,
        answer: questionData.answer,
        difficulty: questionData.difficulty,
        bloomLevel: questionData.bloomLevel,
        learningOutcome: questionData.learningOutcome,
        aiConfidenceScore: questionData.aiConfidenceScore || 0.85,
        adaptiveDelta: adaptiveDelta
      }
    });

    return newQuestion;
  }

  /**
   * Generates a detailed explanation for a question after a student answers it.
   */
  static async generateQuestionExplanation(questionId: string) {
    const question = await prisma.quizSessionQuestion.findUnique({
      where: { id: questionId },
      include: { session: true }
    });

    if (!question) throw new Error('Question not found');

    const ragContext = await retrieveContext(question.session.topic, question.session.organizationId || '', 5);

    const prompt = `
Provide a comprehensive explanation for the following question:
Question: ${question.questionText}
Correct Answer: ${question.answer}

CRITICAL RULES:
1. Provide a Step-by-Step explanation of why the answer is correct.
2. Provide suggested reading based on the context.
3. Output strict JSON.
`;

    const responseFormat = {
      type: "json_schema",
      json_schema: {
        name: "question_explanation",
        schema: {
          type: "object",
          properties: {
            explanation: { type: "string" },
            suggestedReading: { type: "string" }
          },
          required: ["explanation", "suggestedReading"]
        }
      }
    };

    const explanationData = await AIOrchestrator.generate({
      intent: 'GenerateQuestionPaper',
      context: ragContext,
      taskInstructions: prompt,
      responseFormat
    });

    // Update the question with the explanation
    await prisma.quizSessionQuestion.update({
      where: { id: question.id },
      data: {
        explanation: explanationData.explanation,
        suggestedReading: explanationData.suggestedReading,
        // In a full implementation, referenceChunks would map directly to RAG citations.
      }
    });

    return explanationData;
  }
}

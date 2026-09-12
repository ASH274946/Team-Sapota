import { AIOrchestrator } from './ai/ai-orchestrator.service';
import { logger } from '../utils/logger';

export class RubricParserService {
  /**
   * Parses raw rubric text into a structured JSON hierarchy using the AI Orchestrator.
   */
  static async parseUnstructuredRubric(rawText: string) {
    logger.info('Parsing unstructured rubric via AI Orchestrator');

    const prompt = `
Extract the rubric criteria and their details from the provided text.
Structure the output exactly according to the schema provided.
Each top-level criterion can optionally have subCriteria.
Ensure that marks, minimum marks, expected concepts, and bloom levels are extracted logically.
Do NOT hallucinate criteria. Only extract what is present.

Raw Rubric Content:
${rawText}
`;

    // The AI Orchestrator handles token budgeting and uses the correct model for Parsing
    const parsedData = await AIOrchestrator.generate({
      intent: 'ParseRubric',
      context: '', // No external RAG context needed for direct parsing
      taskInstructions: prompt,
      responseFormat: { type: 'json_object' }
    });

    return parsedData;
  }
}

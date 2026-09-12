import prisma from '../config/prisma';
import { AIOrchestrator } from './ai/ai-orchestrator.service';


export class KnowledgeQualityService {
  /**
   * Evaluates a single chunk and generates ChunkQualityMetrics.
   * This should typically run in a background worker.
   */
  static async evaluateChunkQuality(chunkId: string) {
    const chunk = await prisma.knowledgeChunk.findUnique({
      where: { id: chunkId }
    });

    if (!chunk) throw new Error('Chunk not found');

    const prompt = `
Analyze the following knowledge chunk for quality.
Text: ${chunk.content}

CRITICAL RULES:
1. Provide a semantic completeness score from 0 to 1.
2. Provide an information density score from 0 to 1.
3. Identify if it is tiny (meaningless snippet), oversized (too broad), or an orphan.
4. Recommend an action: "KEEP", "MERGE", "SPLIT", "DELETE".
`;

    const responseFormat = {
      type: "json_schema",
      json_schema: {
        name: "chunk_quality",
        schema: {
          type: "object",
          properties: {
            semanticCompleteness: { type: "number" },
            informationDensity: { type: "number" },
            isTiny: { type: "boolean" },
            isOversized: { type: "boolean" },
            isOrphan: { type: "boolean" },
            recommendation: { type: "string" },
            overallScore: { type: "number" }
          },
          required: ["semanticCompleteness", "informationDensity", "isTiny", "isOversized", "isOrphan", "recommendation", "overallScore"]
        }
      }
    };

    const qualityData = await AIOrchestrator.generate({
      intent: 'GenerateQuestionPaper', // Re-using general complex reasoning intent
      context: '',
      taskInstructions: prompt,
      responseFormat
    });

    await prisma.chunkQualityMetrics.upsert({
      where: { chunkId },
      update: {
        overallScore: qualityData.overallScore,
        chunkLength: chunk.content.length,
        semanticCompleteness: qualityData.semanticCompleteness,
        informationDensity: qualityData.informationDensity,
        duplicateRisk: 0, // Calculated separately
        isOrphan: qualityData.isOrphan,
        isOversized: qualityData.isOversized,
        isTiny: qualityData.isTiny,
        recommendation: qualityData.recommendation
      },
      create: {
        chunkId,
        overallScore: qualityData.overallScore,
        chunkLength: chunk.content.length,
        semanticCompleteness: qualityData.semanticCompleteness,
        informationDensity: qualityData.informationDensity,
        duplicateRisk: 0,
        isOrphan: qualityData.isOrphan,
        isOversized: qualityData.isOversized,
        isTiny: qualityData.isTiny,
        recommendation: qualityData.recommendation
      }
    });

    return qualityData;
  }
}

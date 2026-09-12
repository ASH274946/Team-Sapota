import prisma from '../config/prisma';
import OpenAI from 'openai';
import { env } from '../config/env';
import { extractTextFromFile } from './grader.service';
import { logger } from '../utils/logger';
import { invalidateByPattern } from '../api/common/cache';
import { randomUUID } from 'crypto';
const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY || '' });

import { parseDocumentIntoSemanticChunks } from './document-parser.service';

export async function ingestDocument(fileUrl: string, fileType: string, organizationId: string, filename: string, _userId: string = 'system'): Promise<string> {
  if (!env.OPENAI_API_KEY) {
    logger.warn('No OPENAI_API_KEY found, RAG embeddings will be skipped.');
    return '';
  }

  const text = await extractTextFromFile(fileUrl, fileType);
  if (!text) return '';

  const semanticChunks = await parseDocumentIntoSemanticChunks(text);
  
  // ── AUTO-CLASSIFICATION ──
  let category = 'HANDOUT';
  let status = 'ACTIVE';

  if (semanticChunks.length > 0) {
    const sampleIndices = [
      0, 
      Math.floor(semanticChunks.length / 2), 
      semanticChunks.length - 1
    ];
    const uniqueIndices = [...new Set(sampleIndices)];
    const sampleText = uniqueIndices.map(i => semanticChunks[i].content).join('\n\n---\n\n');

    const prompt = `System: You are an academic classifier. Analyze the following document excerpts.
Classify this document strictly as one of the following categories: 'HANDOUT', 'SYLLABUS', 'ASSESSMENT', 'LAB_MANUAL'.
Respond with the exact word and nothing else.

Excerpts:
${sampleText}`;

    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.0,
      });

      const verdict = completion.choices[0].message.content?.trim();
      
      if (['HANDOUT', 'SYLLABUS', 'ASSESSMENT', 'LAB_MANUAL'].includes(verdict || '')) {
        category = verdict as string;
      }

      if (category === 'ASSESSMENT') {
        status = 'PENDING_APPROVAL';
        
        // Notify Admins
        const admins = await prisma.user.findMany({
          where: { organizationId, role: { in: ['ADMIN', 'SUPER_ADMIN'] } },
          select: { id: true }
        });

        if (admins.length > 0) {
          await prisma.notification.createMany({
            data: admins.map(admin => ({
              userId: admin.id,
              organizationId,
              title: '📝 Assessment Requires Approval',
              message: `An Assessment (${filename}) was automatically routed to your queue for review.`,
              type: 'INFO',
            }))
          });
        }
      }
    } catch (llmErr) {
      logger.error(`[AUTO-CLASSIFICATION] Failed to run classification, defaulting to HANDOUT: ${llmErr}`);
    }
  }

  const doc = await prisma.knowledgeDocument.create({
    data: {
      filename,
      fileUrl,
      organizationId,
      category,
      status: status as any
    }
  });

  let previousChunkId: string | null = null;
  
  for (let i = 0; i < semanticChunks.length; i++) {
    const chunkObj = semanticChunks[i];
    
    // Generate embedding
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: chunkObj.content,
    });

    const embedding = response.data[0].embedding;

    // Set up metadata with hierarchical graph links
    const extendedMetadata: Record<string, unknown> = {
      ...chunkObj.metadata,
      chunkType: chunkObj.chunkType,
      prevChunkId: previousChunkId,
      // We will leave nextChunkId null for now, or we can update the previous one.
      // To keep it simple, we just store prevChunkId.
    };
    
    const dbChunkId = randomUUID();
    
    // Convert embedding array to string format expected by pgvector: "[1.2, 0.5, ...]"
    const vectorString = `[${embedding.join(',')}]`;

    await prisma.$executeRaw`
      INSERT INTO "KnowledgeChunk" ("id", "documentId", "content", "vector", "metadata", "createdAt")
      VALUES (${dbChunkId}, ${doc.id}, ${chunkObj.content}, ${vectorString}::vector, ${extendedMetadata}::jsonb, NOW())
    `;
    // Update previous chunk's nextChunkId to establish the bidirectional graph
    if (previousChunkId) {
      await prisma.$executeRaw`
        UPDATE "KnowledgeChunk" 
        SET metadata = jsonb_set(COALESCE(metadata, '{}'::jsonb), '{nextChunkId}', ${dbChunkId}::jsonb) 
        WHERE id = ${previousChunkId}
      `;
    }

    previousChunkId = dbChunkId;
  }

  // Invalidate cached RAG results for this organization so new embeddings are picked up
  await invalidateByPattern(`rag:${organizationId}:*`).catch(() => {});

  return doc.id;
}



export { advancedRetrieveContext as retrieveContext, retrieveContextWithSources } from './rag/retriever.service';
export type { RagSourceCitation } from './rag/retriever.service';

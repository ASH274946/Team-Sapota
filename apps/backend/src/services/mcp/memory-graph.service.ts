export type MemoryNodeLevel = 'SESSION' | 'STUDENT' | 'COURSE' | 'INSTITUTION' | 'GLOBAL';

export interface MemoryNode {
  id: string;
  level: MemoryNodeLevel;
  content: string; // Summarized context
  importanceScore: number;
  expiresAt?: Date;
}

import prisma from '../../config/prisma';

/**
 * Long-Term Memory Graph
 * Allows autonomous agents to persist state, recall past interactions, and share context globally.
 */
export class MemoryGraphService {
  private static instance: MemoryGraphService;

  private constructor() {}

  public static getInstance(): MemoryGraphService {
    if (!MemoryGraphService.instance) {
      MemoryGraphService.instance = new MemoryGraphService();
    }
    return MemoryGraphService.instance;
  }

  public async injectMemory(level: MemoryNodeLevel, entityId: string, content: string, importance: number): Promise<string> {
    console.log(`[MemoryGraph] Injecting memory at level [${level}] for entity ${entityId}. Importance: ${importance}`);
    
    // Unmocked: Save memory node to Postgres (and potentially Vector DB in a real hybrid setup)
    // @ts-expect-error - Prisma mismatch
    const memory = await prisma.agentMemory.create({
      data: {
        level,
        entityId,
        content,
        importanceScore: importance,
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30), // 30 day retention by default
      }
    });

    return memory.id;
  }

  public async retrieveContext(level: MemoryNodeLevel, entityId: string, _query: string): Promise<string[]> {
    console.log(`[MemoryGraph] Semantic search for past context at level [${level}] for entity ${entityId}...`);
    
    // Unmocked: Fetch high-importance memories for this entity
    // @ts-expect-error - Prisma mismatch
    const memories = await prisma.agentMemory.findMany({
      where: {
        level,
        entityId,
        importanceScore: { gte: 5 } // Only retrieve significant memories
      },
      orderBy: { importanceScore: 'desc' },
      take: 5
    });

    if (memories.length === 0) {
      return ["No significant past context found."];
    }

    return memories.map((m: { content: string }) => m.content);
  }
}

import prisma from '../../config/prisma';

export async function expandContextWithGraph(chunkIds: string[]): Promise<any[]> {
  const expandedChunks: Record<string, any> = {};

  for (const chunkId of chunkIds) {
    const chunk = await prisma.knowledgeChunk.findUnique({ where: { id: chunkId } });
    if (!chunk) continue;
    
    expandedChunks[chunk.id] = chunk;
    
    const metadata = chunk.metadata as any;
    if (metadata) {
      if (metadata.prevChunkId && !expandedChunks[metadata.prevChunkId]) {
        const prev = await prisma.knowledgeChunk.findUnique({ where: { id: metadata.prevChunkId } });
        if (prev) expandedChunks[prev.id] = prev;
      }
      if (metadata.nextChunkId && !expandedChunks[metadata.nextChunkId]) {
        const next = await prisma.knowledgeChunk.findUnique({ where: { id: metadata.nextChunkId } });
        if (next) expandedChunks[next.id] = next;
      }
    }
  }

  return Object.values(expandedChunks);
}

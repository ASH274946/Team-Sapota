export function buildContextString(chunks: any[]): string {
  // Deduplicate just in case
  const uniqueChunks = Array.from(new Map(chunks.map(c => [c.id, c])).values());

  // Optionally sort by created date or metadata logical order if possible
  uniqueChunks.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

  let contextString = '';
  for (let i = 0; i < uniqueChunks.length; i++) {
    const chunk = uniqueChunks[i];
    const metadata = chunk.metadata as any;
    
    contextString += `--- CHUNK ${i + 1} ---\n`;
    if (metadata) {
      if (metadata.chunkType) contextString += `Type: ${metadata.chunkType}\n`;
      if (metadata.subject) contextString += `Subject: ${metadata.subject}\n`;
      if (metadata.topic) contextString += `Topic: ${metadata.topic}\n`;
    }
    contextString += `Content:\n${chunk.content}\n\n`;
  }

  // To respect token limits, we could truncate the final string
  // For safety, let's limit context to roughly 12000 chars (approx 3000 tokens)
  if (contextString.length > 15000) {
    contextString = contextString.substring(0, 15000) + '\n...[Context Truncated]';
  }

  return contextString;
}

import OpenAI from 'openai';
import { env } from '../config/env';
import { logger } from '../utils/logger';

const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY || '' });

export interface SemanticChunk {
  content: string;
  chunkType: 'Definition' | 'Formula' | 'Example' | 'Topic' | 'Question' | 'Answer' | 'Table' | 'Code' | 'Other';
  metadata: {
    subject?: string;
    chapter?: string;
    topic?: string;
    bloomLevel?: string;
    difficulty?: string;
    keywords?: string[];
  };
}

const PARSING_SYSTEM_PROMPT = `
You are a Principal Educational NLP Parser. Your task is to process educational documents and split them into semantic chunks.
RULES:
1. Never cut a concept in half (e.g. a Definition, a Formula, or an Example must remain whole).
2. For each chunk, determine the 'chunkType'.
3. Extract relevant educational metadata like 'subject', 'chapter', 'topic', 'bloomLevel' (Remembering, Understanding, Applying, Analyzing, Evaluating, Creating), 'difficulty', and 'keywords'.
4. Respond ONLY with a valid JSON object matching the requested schema. Do not add markdown formatting to the JSON itself.
5. The JSON must contain a single top-level key "chunks" which is an array of chunk objects.
`;

export async function parseDocumentIntoSemanticChunks(text: string): Promise<SemanticChunk[]> {
  if (!env.OPENAI_API_KEY) {
    logger.warn('No OPENAI_API_KEY found, skipping semantic chunking (returning single raw chunk).');
    return [{
      content: text.substring(0, 3000), // simplistic fallback
      chunkType: 'Other',
      metadata: {}
    }];
  }

  // To prevent token limits, we should ideally batch this, but for now we'll process 
  // up to a reasonable limit (e.g. 100k tokens which GPT-4o-mini can handle).
  // We will ask for a JSON response.
  
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini', // using mini for cost/speed, can be gpt-4o
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: PARSING_SYSTEM_PROMPT },
        { role: 'user', content: `Parse the following document text into semantic chunks:\n\n${text}` }
      ]
    });

    const responseText = response.choices[0].message.content || '{"chunks": []}';
    const parsedData = JSON.parse(responseText);
    
    if (parsedData && Array.isArray(parsedData.chunks)) {
      return parsedData.chunks as SemanticChunk[];
    }
    
    return [];
  } catch (error) {
    logger.error(`Error during semantic chunking: ${error}`);
    // Fallback to simplistic chunking if API fails
    return fallbackChunking(text);
  }
}

function fallbackChunking(text: string): SemanticChunk[] {
  const words = text.split(/\\s+/);
  const chunks: SemanticChunk[] = [];
  const maxWords = 300;
  for (let i = 0; i < words.length; i += maxWords) {
    chunks.push({
      content: words.slice(i, i + maxWords).join(' '),
      chunkType: 'Other',
      metadata: {}
    });
  }
  return chunks;
}

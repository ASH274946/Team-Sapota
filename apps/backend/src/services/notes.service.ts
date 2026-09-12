import prisma from '../config/prisma';
import { env } from '../config/env';
import OpenAI from 'openai';

let nvidiaClient: OpenAI | null = null;
function getNvidia(): OpenAI {
  if (!nvidiaClient) {
    nvidiaClient = new OpenAI({
      apiKey: env.NVIDIA_API_KEY || 'dummy-key',
      baseURL: 'https://integrate.api.nvidia.com/v1',
    });
  }
  return nvidiaClient;
}

export interface NotesCreateInput {
  title: string;
  subject: string;
  topic: string;
  type: 'SUMMARY' | 'REVISION' | 'FLASHCARDS';
  userId: string;
}

export const createGeneratedNotes = async (input: NotesCreateInput) => {
  const prompt = `You are a professional educational study advisor. Generate detailed student revision notes for:
- Subject: ${input.subject}
- Topic: ${input.topic}
- Note Format: ${input.type} (SUMMARY = comprehensive notes; REVISION = bullet outlines and key formulas; FLASHCARDS = list of Question/Answer flashcards).

Generate high-quality markdown content. Make it clear and structured.

Output JSON format exactly like:
{
  "content": "Detailed generated markdown notes here"
}`;

  let contentVal = '';

  try {
    const response = await getNvidia().chat.completions.create({
      model: 'meta/llama-3.1-8b-instruct',
      messages: [
        { role: 'system', content: 'You are an educational study planner. Always output valid JSON.' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.3,
      max_tokens: 2200,
    });

    const text = response.choices[0]?.message?.content || '{}';
    const parsed = JSON.parse(text.replace(/```json|```/gi, '').trim());
    contentVal = parsed.content || 'Failed to generate notes.';
  } catch (err) {
    // Fallback notes content
    contentVal = `## Revision Guide: ${input.topic}
* Key Concept 1: Always verify assumptions.
* Key Concept 2: Space repetition yields better retention.`;
  }

  const note = await prisma.generatedNotes.create({
    data: {
      title: input.title,
      subject: input.subject,
      topic: input.topic,
      type: input.type,
      content: contentVal,
      userId: input.userId,
    },
  });

  return note;
};

export const listUserNotes = async (userId: string) => {
  return prisma.generatedNotes.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });
};

export const getNoteDetails = async (id: string) => {
  return prisma.generatedNotes.findUnique({
    where: { id },
  });
};

export const deleteNote = async (id: string) => {
  return prisma.generatedNotes.delete({
    where: { id },
  });
};

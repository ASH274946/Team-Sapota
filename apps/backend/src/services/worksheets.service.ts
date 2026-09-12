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

export interface WorksheetCreateInput {
  title: string;
  subject: string;
  topic: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  userId: string;
}

export const createWorksheet = async (input: WorksheetCreateInput) => {
  const prompt = `You are a professional teacher assistant. Generate a student Worksheet and a separate Answer Key for the following parameters:
- Subject: ${input.subject}
- Topic: ${input.topic}
- Difficulty Level: ${input.difficulty}

Generate:
1. Worksheet Questions: Provide 5 clear questions of various types (MCQ, short answer, fill-in-the-blank) matching the difficulty level.
2. Answer Key: Provide step-by-step solutions, explanations, and ideal answers for each question.

Output JSON format exactly like:
{
  "content": "Detailed markdown format of the student worksheet (without answers)",
  "answerKey": "Detailed markdown format of the teacher answer key & solutions"
}`;

  let contentVal = '';
  let answerKeyVal = '';

  try {
    const response = await getNvidia().chat.completions.create({
      model: 'meta/llama-3.1-8b-instruct',
      messages: [
        { role: 'system', content: 'You are an educational assistant. Always output valid JSON.' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.3,
      max_tokens: 2000,
    });

    const text = response.choices[0]?.message?.content || '{}';
    const parsed = JSON.parse(text.replace(/```json|```/gi, '').trim());

    contentVal = parsed.content || 'Failed to generate worksheet.';
    answerKeyVal = parsed.answerKey || 'Failed to generate answers.';
  } catch (err) {
    contentVal = `## ${input.title} Practice Sheet\nSolve the following questions:\n1. Describe core principles of ${input.topic}.\n2. Solve a basic practice problem on ${input.topic}.`;
    answerKeyVal = `## ${input.title} Solutions\n1. Ideal answer: Topic refers to core principles.\n2. Solution: Step 1, apply formulas.`;
  }

  const worksheet = await prisma.worksheet.create({
    data: {
      title: input.title,
      subject: input.subject,
      topic: input.topic,
      difficulty: input.difficulty,
      content: contentVal,
      answerKey: answerKeyVal,
      userId: input.userId,
    },
  });

  return worksheet;
};

export const listWorksheets = async (userId: string) => {
  return prisma.worksheet.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });
};

export const getWorksheetDetails = async (id: string) => {
  return prisma.worksheet.findUnique({
    where: { id },
  });
};

export const deleteWorksheet = async (id: string) => {
  return prisma.worksheet.delete({
    where: { id },
  });
};

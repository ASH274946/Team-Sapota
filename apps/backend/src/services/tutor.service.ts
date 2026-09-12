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

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export const getTutorResponse = async (history: ChatMessage[]) => {
  const systemPrompt = `You are VidyaAI Tutor, an encouraging, friendly, and expert AI tutor. 
Your goal is to guide students to understand academic concepts clearly.
Follow these guidelines:
- Keep explanations clear, engaging, and age-appropriate.
- Use analogies and real-world examples to explain complex topics.
- Do not just output raw code or direct answers immediately; ask guiding questions to foster active learning.
- Format all text in clean, beautifully styled Markdown.
- If asked, provide a simple, interactive practice question related to the topic.`;

  const messages = [
    { role: 'system', content: systemPrompt },
    ...history,
  ];

  try {
    const response = await getNvidia().chat.completions.create({
      model: 'meta/llama-3.1-8b-instruct',
      messages: messages as any,
      temperature: 0.5,
      max_tokens: 1200,
    });

    return response.choices[0]?.message?.content || 'I am sorry, I am having trouble thinking right now. Let us try again!';
  } catch (err) {
    return 'I am sorry, I am currently offline. Let us try again in a moment!';
  }
};

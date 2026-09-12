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

export interface LessonCreateInput {
  title: string;
  subject: string;
  grade: string;
  duration: 'DAILY' | 'WEEKLY' | 'MONTHLY';
  objectives: string;
  userId: string;
}

export const createLessonPlan = async (input: LessonCreateInput) => {
  const prompt = `You are a professional educational curriculum designer. Create a highly detailed ${input.duration} Lesson Plan for the following parameters:
- Subject: ${input.subject}
- Grade Level: ${input.grade}
- Topic Title: ${input.title}
- Specific Objectives: ${input.objectives}

Generate a comprehensive lesson structure containing:
1. Learning Objectives (aligned with Bloom Taxonomy)
2. Day-by-Day / Stage schedule and timelines
3. Creative Classroom Activities (individual and group)
4. Comprehensive Assessments and quizzes
5. Homework and additional study material.

Output JSON format exactly like:
{
  "objectives": "string description",
  "activities": ["list", "of", "activities"],
  "assessments": ["list", "of", "assessments"],
  "content": "Full detailed lesson plan body in beautifully styled markdown format"
}`;

  let objectivesVal = input.objectives;
  let activitiesVal: string[] = [];
  let assessmentsVal: string[] = [];
  let contentVal = '';

  try {
    const response = await getNvidia().chat.completions.create({
      model: 'meta/llama-3.1-8b-instruct',
      messages: [
        { role: 'system', content: 'You are an educational curriculum planner. Always output valid JSON.' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.3,
      max_tokens: 2500,
    });

    const text = response.choices[0]?.message?.content || '{}';
    const parsed = JSON.parse(text.replace(/```json|```/gi, '').trim());

    objectivesVal = parsed.objectives || objectivesVal;
    activitiesVal = parsed.activities || [];
    assessmentsVal = parsed.assessments || [];
    contentVal = parsed.content || 'Failed to generate curriculum body content.';
  } catch (err) {
    // Fallback static plan
    contentVal = `## ${input.title} Lesson Plan
### Topic Objectives:
${input.objectives}

### Activities
- Group discussion on core concepts.
- Practice worksheets.

### Evaluation
- Individual short quiz at the end of class.`;
    activitiesVal = ['Group Discussion', 'Practice Worksheet'];
    assessmentsVal = ['Short quiz'];
  }

  const lessonPlan = await prisma.lessonPlan.create({
    data: {
      title: input.title,
      subject: input.subject,
      grade: input.grade,
      duration: input.duration,
      objectives: objectivesVal,
      activities: activitiesVal,
      assessments: assessmentsVal,
      content: contentVal,
      userId: input.userId,
    },
  });

  return lessonPlan;
};

export const listUserLessonPlans = async (userId: string) => {
  return prisma.lessonPlan.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });
};

export const getLessonPlanDetails = async (id: string) => {
  return prisma.lessonPlan.findUnique({
    where: { id },
  });
};

export const deleteLessonPlan = async (id: string) => {
  return prisma.lessonPlan.delete({
    where: { id },
  });
};

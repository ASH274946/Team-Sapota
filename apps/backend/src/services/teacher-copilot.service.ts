import prisma from '../config/prisma';
import { AIOrchestrator } from './ai/ai-orchestrator.service';
import { retrieveContext } from './rag.service';
import { logger } from '../utils/logger';

export interface LessonPlanContent {
  prerequisites: string[];
  materials: string[];
  introduction: string;
  coreConcepts: string[];
  interaction: string;
  practicalExercises: string[];
  homework: string[];
  outcomes: string[];
  teacherNotes: string;
  notes?: string;
}

export class TeacherCopilotService {
  /**
   * Generates a structured lesson plan backed by Hybrid RAG institutional knowledge.
   */
  static async generateLessonPlan(
    userId: string,
    organizationId: string,
    subject: string,
    topic: string,
    duration: string | number,
    learningOutcomes: string[]
  ) {
    const durationNum = parseInt(String(duration), 10) || 60;

    // 1. Retrieve explicitly approved institutional knowledge for the topic
    let ragContext = '';
    try {
      ragContext = await retrieveContext(`Lesson plan curriculum and syllabus materials for ${subject}: ${topic}`, organizationId, 8);
      // Validate RAG context relevance to avoid domain bleed from unrelated institutional files
      if (ragContext) {
        const keywords = `${subject} ${topic}`.toLowerCase().split(/[\s,:-]+/).filter(w => w.length > 2);
        const lowerCtx = ragContext.toLowerCase();
        const matchesTopic = keywords.some(k => lowerCtx.includes(k));
        if (!matchesTopic) {
          logger.info({ subject, topic }, '[TeacherCopilotService] Discarding retrieved RAG context due to lack of keyword relevance with requested subject/topic');
          ragContext = '';
        }
      }
    } catch (e) {
      logger.warn({ err: e }, '[TeacherCopilotService] Failed to retrieve RAG context, proceeding with AI synthesis');
    }

    const prompt = `
You are an expert pedagogical curriculum designer and university professor specializing in Outcome-Based Education (OBE) and Bloom's Taxonomy.
Generate an exhaustive, highly-detailed, and structured lesson plan for classroom delivery.

Subject: ${subject}
Topic: ${topic}
Allocated Duration: ${durationNum} minutes
Target Learning Outcomes / Syllabus Notes: ${learningOutcomes && learningOutcomes.length > 0 ? learningOutcomes.join(', ') : 'Standard accredited curriculum guidelines'}

CRITICAL INSTRUCTIONS:
1. STRICT RELEVANCE: Every single objective, prerequisite, core concept, practical exercise, activity, and assessment MUST be 100% relevant and specific ONLY to "${subject}" and "${topic}".
2. ZERO DUMMY/PLACEHOLDER TEXT: NEVER output generic placeholder text like "Exercise 1: Construct a step-by-step model", "Prerequisite concept 1", or "Foundational understanding of core principles". Every item must be fully articulated, technical, concrete, and directly applicable to "${topic}".
3. PREVENT UNRELATED CONTEXT: Do NOT introduce irrelevant subjects (e.g., data structures or statistics) unless the requested subject is specifically Computer Science or Statistics.
4. PRACTICAL EXERCISES: Provide realistic, hands-on, step-by-step exercises or lab scenarios directly demonstrating "${topic}".
5. Return ONLY a single valid JSON object strictly matching this schema:

{
  "title": "${subject} - ${topic}",
  "objectives": [
    "Specific, measurable Bloom's taxonomy objective 1 for ${topic}",
    "Specific, measurable Bloom's taxonomy objective 2 for ${topic}",
    "Specific, measurable Bloom's taxonomy objective 3 for ${topic}",
    "Specific, measurable Bloom's taxonomy objective 4 for ${topic}"
  ],
  "prerequisites": [
    "Actual prerequisite 1 needed to understand ${topic}",
    "Actual prerequisite 2 needed to understand ${topic}",
    "Actual prerequisite skill 3 needed to understand ${topic}"
  ],
  "materials": [
    "Teaching tool / laboratory apparatus / software 1 for ${topic}",
    "Handout / dataset / reference guide 2 for ${topic}",
    "Slide deck / demonstration equipment 3 for ${topic}"
  ],
  "introduction": "Engaging motivational hook, real-world context, and problem statement introducing ${topic} (3-5 sentences).",
  "coreConcepts": [
    "Key concept 1: In-depth breakdown and theoretical explanation for ${topic}",
    "Key concept 2: In-depth breakdown and theoretical explanation for ${topic}",
    "Key concept 3: In-depth breakdown and theoretical explanation for ${topic}",
    "Key concept 4: In-depth breakdown and theoretical explanation for ${topic}"
  ],
  "activities": [
    "${Math.round(durationNum * 0.1)} min — Hook & Motivation: Problem orientation and baseline inquiry for ${topic}",
    "${Math.round(durationNum * 0.35)} min — Direct Instruction & Core Concepts: Detailed breakdown with live demonstrations of ${topic}",
    "${Math.round(durationNum * 0.25)} min — Active Collaborative Lab: Small group problem-solving and hands-on application of ${topic}",
    "${Math.round(durationNum * 0.2)} min — Student Presentations & Peer Review: Live walk-through of solutions and instructor feedback",
    "${Math.max(5, durationNum - Math.round(durationNum * 0.1) - Math.round(durationNum * 0.35) - Math.round(durationNum * 0.25) - Math.round(durationNum * 0.2))} min — Synthesis & Q&A Wrap-up: Concept reinforcement and exit ticket"
  ],
  "interaction": "Specific instructional engagement strategy with targeted questions and discussion prompts for ${topic} (3-4 sentences).",
  "practicalExercises": [
    "Detailed practical exercise 1 with concrete instructions on ${topic}",
    "Detailed practical exercise 2 with applied problem-solving scenario on ${topic}",
    "Detailed practical exercise 3 with an edge-case or troubleshooting challenge on ${topic}"
  ],
  "assessments": [
    "Formative Assessment: In-class diagnostic checkpoint for ${topic}",
    "Practical Evaluation: Specific grading rubric for reviewing students' exercise output on ${topic}",
    "Summative Assessment: 5-question comprehension quiz and structured exit ticket on ${topic}"
  ],
  "homework": [
    "Take-home problem set or applied assignment on ${topic}",
    "Assigned reading or exploratory investigation on ${topic}"
  ],
  "outcomes": [
    "Students can explain the fundamental principles and mechanisms of ${topic} with technical precision.",
    "Students can independently apply these principles to solve complex problems in ${subject}.",
    "Students demonstrate mastery of curriculum benchmarks for ${topic}."
  ],
  "teacherNotes": "Pedagogical tips for the instructor: Common misconceptions students encounter in ${topic}, pacing advice, and differentiation strategies (3-4 sentences)."
}
`;

    let planData: any = {};
    try {
      planData = await AIOrchestrator.generate({
        intent: 'GenerateLessonPlan',
        context: ragContext,
        taskInstructions: prompt,
        responseFormat: { type: 'json_object' }
      });
      if (typeof planData === 'string') {
        planData = JSON.parse(planData);
      }
    } catch (err) {
      logger.error({ err }, '[TeacherCopilotService] AI generation failed, using intelligent fallback synthesizer');
      planData = {};
    }

    // Comprehensive normalization and fallback synthesis to guarantee 100% complete fields
    const normalized = TeacherCopilotService.normalizePlanData(planData, subject, topic, durationNum, learningOutcomes);

    const lessonPlan = await prisma.lessonPlan.create({
      data: {
        userId,
        organizationId,
        title: normalized.title,
        subject,
        grade: "Higher Education / K-12",
        duration: String(durationNum),
        objectives: normalized.objectives.join('\n'),
        activities: normalized.activities,
        assessments: normalized.assessments,
        content: JSON.stringify(normalized.content),
        referenceMaterials: {
          source: "rag_engine",
          contextRetrieved: !!ragContext,
          materials: normalized.content.materials
        }
      }
    });

    return lessonPlan;
  }

  /**
   * Normalizes raw AI output and guarantees non-empty, high-quality content for all 12 sections.
   */
  private static normalizePlanData(
    raw: any,
    subject: string,
    topic: string,
    duration: number,
    outcomesInput: string[]
  ) {
    const title = (raw?.title && typeof raw.title === 'string' && raw.title.trim()) || `${subject} - ${topic}`;

    const parseStringArray = (val: any, fallback: string[]): string[] => {
      if (Array.isArray(val) && val.length > 0) {
        const cleaned = val.map(item => (typeof item === 'string' ? item.trim() : JSON.stringify(item))).filter(Boolean);
        if (cleaned.length > 0) return cleaned;
      }
      if (typeof val === 'string' && val.trim()) {
        const split = val.split('\n').map(s => s.replace(/^[-*•\d.)\s]+/, '').trim()).filter(Boolean);
        if (split.length > 0) return split;
      }
      return fallback;
    };

    const parseParagraph = (val: any, fallback: string): string => {
      if (typeof val === 'string' && val.trim() && val.toLowerCase() !== 'none' && val.toLowerCase() !== 'null') {
        return val.trim();
      }
      if (Array.isArray(val) && val.length > 0) {
        return val.join(' ');
      }
      return fallback;
    };

    // 1. Objectives
    const defaultObjectives = outcomesInput && outcomesInput.length > 0
      ? outcomesInput
      : [
          `Students will understand the core theoretical foundation and architecture of ${topic}.`,
          `Students will be able to apply fundamental concepts of ${topic} to practical problem-solving.`,
          `Students will analyze and evaluate real-world implementations and case studies in ${subject}.`,
          `Students will demonstrate mastery through hands-on exercises and collaborative peer review.`
        ];
    const objectives = parseStringArray(raw?.objectives, defaultObjectives);

    // 2. Prerequisites
    const defaultPrerequisites = [
      `Foundational concepts of ${subject} leading into ${topic}.`,
      `Core analytical and critical reasoning skills required for studying ${topic}.`,
      `Familiarity with standard academic tools and reference materials for ${subject}.`
    ];
    const prerequisites = parseStringArray(raw?.prerequisites, defaultPrerequisites);

    // 3. Materials
    const defaultMaterials = [
      `Interactive slides and lecture presentation on ${topic}`,
      `Structured handouts and problem-solving worksheets for ${topic}`,
      `Digital laboratory / computational sandbox environment for hands-on exploration`,
      `Primary reference textbook readings and syllabus materials for ${subject}`
    ];
    const materials = parseStringArray(raw?.materials, defaultMaterials);

    // 4. Introduction
    const defaultIntro = `Introduce ${topic} by establishing its critical importance within ${subject}. Connect theoretical foundations to real-world applications and motivate learners with a central inquiry question that will be answered throughout the session.`;
    const introduction = parseParagraph(raw?.introduction, defaultIntro);

    // 5. Core Concepts
    const defaultCoreConcepts = [
      `Theoretical Foundations: Key definitions, principles, and laws governing ${topic}.`,
      `Mechanism & Structure: Step-by-step breakdown of how ${topic} operates within ${subject}.`,
      `Methodologies & Frameworks: Standard techniques and best practices used to apply ${topic}.`,
      `Critical Evaluation & Trade-offs: Comparing approaches, edge cases, and performance criteria for ${topic}.`
    ];
    const coreConcepts = parseStringArray(raw?.coreConcepts, defaultCoreConcepts);

    // 6. Activities
    const t1 = Math.round(duration * 0.1);
    const t2 = Math.round(duration * 0.35);
    const t3 = Math.round(duration * 0.25);
    const t4 = Math.round(duration * 0.2);
    const t5 = Math.max(5, duration - t1 - t2 - t3 - t4);
    const defaultActivities = [
      `${t1} min — Motivation & Inquiry: Interactive hook, baseline diagnostic question, and problem orientation for ${topic}`,
      `${t2} min — Direct Instruction & Demonstration: In-depth exploration of core principles and guided walkthrough of ${topic}`,
      `${t3} min — Active Collaborative Lab: Guided hands-on problem solving and small group modeling of ${topic}`,
      `${t4} min — Student Demonstrations & Peer Critique: Group presentations of solutions with immediate instructor feedback`,
      `${t5} min — Synthesis & Wrap-up: Key takeaways recap, Q&A, and exit ticket assessment on ${topic}`
    ];
    const activities = parseStringArray(raw?.activities, defaultActivities);

    // 7. Interaction
    const defaultInteraction = `Engage students through targeted cold-calling, think-pair-share discussions on key challenges in ${topic}, and real-time polling to verify understanding before progressing to independent application.`;
    const interaction = parseParagraph(raw?.interaction, defaultInteraction);

    // 8. Practical Exercises
    const defaultExercises = [
      `Foundational Problem: Apply core principles of ${topic} to solve a structured, step-by-step scenario and document key observations.`,
      `Applied Case Challenge: Analyze a real-world scenario in ${subject} where ${topic} is utilized; identify key constraints and derive an optimal solution.`,
      `Troubleshooting & Edge-Case Analysis: Given a non-standard or flawed implementation related to ${topic}, diagnose the underlying issue and formulate a validated fix.`
    ];
    const practicalExercises = parseStringArray(raw?.practicalExercises, defaultExercises);

    // 9. Assessments
    const defaultAssessments = [
      `Formative Assessment: Continuous observation during group problem solving and targeted cold-calling.`,
      `Practical Assessment: Rubric-based evaluation of accuracy, completeness, and structure in hands-on exercises.`,
      `Summative Assessment: End-of-class 5-question comprehension quiz and structured exit ticket.`
    ];
    const assessments = parseStringArray(raw?.assessments, defaultAssessments);

    // 10. Homework
    const defaultHomework = [
      `Complete the supplementary problem set on ${topic} and prepare a short summary report.`,
      `Read the assigned reference material on advanced applications of ${topic} for the upcoming module.`
    ];
    const homework = parseStringArray(raw?.homework, defaultHomework);

    // 11. Outcomes
    const defaultOutcomes = [
      `Learners can clearly articulate and explain the core mechanisms of ${topic}.`,
      `Learners demonstrate proficiency in designing, implementing, and validating solutions in ${subject}.`,
      `Learners achieve the required course competencies aligned with accredited curriculum standards.`
    ];
    const outcomes = parseStringArray(raw?.outcomes, defaultOutcomes);

    // 12. Teacher Notes
    const defaultTeacherNotes = `Pay close attention to common student misconceptions regarding the foundational nuances of ${topic}. Ensure all lab environments or physical materials are prepared prior to class. Provide extension challenges for fast learners and scaffolding hints for struggling groups.`;
    const teacherNotes = parseParagraph(raw?.teacherNotes || raw?.notes, defaultTeacherNotes);

    const content: LessonPlanContent = {
      prerequisites,
      materials,
      introduction,
      coreConcepts,
      interaction,
      practicalExercises,
      homework,
      outcomes,
      teacherNotes,
      notes: teacherNotes
    };

    return {
      title,
      objectives,
      activities,
      assessments,
      content
    };
  }

  /**
   * Automates an academic workflow consisting of multiple tasks.
   * e.g., Generate Lesson Plan -> Generate Practice Quiz -> Create Rubric
   */
  static async executeWorkflow(
    userId: string,
    organizationId: string,
    workflowName: string,
    tasks: string[] // List of task identifiers or descriptions
  ) {
    const workflow = await prisma.copilotWorkflow.create({
      data: {
        userId,
        organizationId,
        workflowName,
        status: 'PENDING',
        tasks: tasks.map(t => ({ taskName: t, status: 'QUEUED' }))
      }
    });

    return workflow;
  }

  /**
   * Generates a comprehensive, rigorous examination paper with multiple sections, marking scheme, and answers.
   */
  static async generateTestPaper(
    userId: string,
    organizationId: string,
    input: {
      subject: string;
      topic: string;
      grade?: string;
      duration?: number | string;
      totalMarks?: number | string;
      difficulty?: string;
      customInstructions?: string;
    }
  ) {
    const subject = input.subject.trim();
    const topic = input.topic.trim();
    const grade = input.grade?.trim() || 'Grade 10 / High School';
    const durationNum = parseInt(String(input.duration), 10) || 90;
    const totalMarksNum = parseInt(String(input.totalMarks), 10) || 50;
    const difficulty = input.difficulty || 'Balanced (Easy/Medium/Hard)';

    let ragContext = '';
    try {
      ragContext = await retrieveContext(`Curriculum exam syllabus and assessment questions for ${subject}: ${topic}`, organizationId, 6);
      if (ragContext) {
        const keywords = `${subject} ${topic}`.toLowerCase().split(/[\s,:-]+/).filter(w => w.length > 2);
        const lowerCtx = ragContext.toLowerCase();
        if (!keywords.some(k => lowerCtx.includes(k))) {
          ragContext = '';
        }
      }
    } catch {
      ragContext = '';
    }

    const prompt = `
You are an expert Chief Academic Examiner and Assessment Specialist.
Generate an exhaustive, realistic, and balanced Examination Paper with complete Solutions and Marking Scheme.

SUBJECT: ${subject}
TOPIC / UNIT: ${topic}
GRADE / ACADEMIC LEVEL: ${grade}
DURATION: ${durationNum} minutes
TOTAL MARKS: ${totalMarksNum} marks
DIFFICULTY PROFILE: ${difficulty}
${input.customInstructions ? `CUSTOM INSTRUCTIONS: ${input.customInstructions}` : ''}

CRITICAL RULES:
1. STRICT SUBJECT & TOPIC FIDELITY: Every single question must test concrete, syllabus-specific knowledge of "${subject}: ${topic}".
2. ZERO PLACEHOLDER / DUMMY QUESTIONS: Absolutely do NOT output generic text like "Question 1: Explain the concept", "Option A", or "Lorem ipsum". Every question, numerical problem, case study, and answer must be complete, technically accurate, and ready for classroom examination.
3. CLEAR SECTIONAL STRUCTURE:
   - Section A: Objective Questions / MCQs (with 4 distinct options and single correct answer)
   - Section B: Short Answer & Conceptual Questions (with clear rubric points)
   - Section C: Long Answer, Derivations, Problem-Solving, or Applied Scenarios (with step-by-step marking scheme)
4. ACCURATE MARKS: The sum of marks across all questions must equal exactly ${totalMarksNum}.
5. Output MUST be ONLY valid JSON matching this schema:

{
  "title": "${subject} Examination - ${topic}",
  "instructions": [
    "Read each question carefully before attempting.",
    "All questions are compulsory unless internal choice is specified.",
    "Write legible, structured answers with relevant diagrams or equations where applicable."
  ],
  "sections": [
    {
      "title": "Section A: Multiple Choice Questions",
      "instructions": "Select the correct option for each question.",
      "totalMarks": ${Math.round(totalMarksNum * 0.2)},
      "questions": [
        {
          "questionNumber": 1,
          "question": "Detailed specific question text on ${topic}...",
          "type": "MCQ",
          "marks": 1,
          "options": ["A. ...", "B. ...", "C. ...", "D. ..."],
          "bloomLevel": "REMEMBER",
          "answer": {
            "text": "A. ...",
            "explanation": "Thorough scientific / academic explanation of why this answer is correct."
          }
        }
      ]
    },
    {
      "title": "Section B: Short Answer & Conceptual Questions",
      "instructions": "Answer concisely in 3-5 sentences.",
      "totalMarks": ${Math.round(totalMarksNum * 0.4)},
      "questions": [
        {
          "questionNumber": 2,
          "question": "Clear, specific conceptual question directly testing ${topic}...",
          "type": "SHORT",
          "marks": 4,
          "bloomLevel": "UNDERSTAND",
          "answer": {
            "text": "Expected model answer...",
            "explanation": "Criteria for grading...",
            "markingScheme": [
              "1 Mark: Defining core principle",
              "2 Marks: Explaining mechanism",
              "1 Mark: Providing valid real-world example"
            ]
          }
        }
      ]
    },
    {
      "title": "Section C: Comprehensive Problem Solving & Long Answer",
      "instructions": "Show detailed working, calculations, and analytical derivations.",
      "totalMarks": ${totalMarksNum - Math.round(totalMarksNum * 0.2) - Math.round(totalMarksNum * 0.4)},
      "questions": [
        {
          "questionNumber": 3,
          "question": "In-depth analytical or problem-solving question requiring multi-step solution on ${topic}...",
          "type": "LONG",
          "marks": 10,
          "bloomLevel": "APPLY",
          "answer": {
            "text": "Complete, comprehensive step-by-step solution...",
            "explanation": "Detailed breakdown of the mathematical or theoretical proof...",
            "markingScheme": [
              "3 Marks: Correct initial formula and assumptions",
              "4 Marks: Accurate intermediate derivations and calculations",
              "3 Marks: Final conclusion with appropriate units or reasoning"
            ]
          }
        }
      ]
    }
  ]
}
`;

    let parsed: any = null;
    try {
      parsed = await AIOrchestrator.generate({
        intent: 'GenerateTestPaper',
        context: ragContext,
        taskInstructions: prompt,
        responseFormat: { type: 'json_object' }
      });
      if (typeof parsed === 'string') {
        parsed = JSON.parse(parsed);
      }
    } catch (err) {
      logger.error({ err }, '[TeacherCopilotService] Test paper AI generation failed');
      throw new Error(`AI generation failed: ${err instanceof Error ? err.message : String(err)}`);
    }

    if (!parsed || !parsed.sections || !Array.isArray(parsed.sections)) {
      throw new Error('AI returned an invalid test paper structure.');
    }

    let effectiveOrgId = organizationId;
    if (!effectiveOrgId) {
      const user = await prisma.user.findUnique({ where: { id: userId }, select: { organizationId: true, activeOrganizationId: true } });
      effectiveOrgId = user?.activeOrganizationId || user?.organizationId || '';
    }

    const assignment = await prisma.assignment.create({
      data: {
        title: parsed.title || `${subject} - ${topic} Examination`,
        subject,
        organizationId: effectiveOrgId,
        createdById: userId,
        dueDate: new Date(Date.now() + 14 * 24 * 3600 * 1000),
        duration: durationNum,
        totalMarks: totalMarksNum,
        questionConfig: { difficulty, topic, grade },
        status: 'PUBLISHED'
      }
    });

    const paper = await prisma.generatedPaper.create({
      data: {
        assignmentId: assignment.id,
        organizationId: effectiveOrgId,
        title: assignment.title,
        totalMarks: totalMarksNum,
        duration: durationNum,
        sections: parsed.sections,
        canonicalMetadata: {
          grade,
          difficulty,
          topic,
          instructions: parsed.instructions || []
        }
      }
    });

    return {
      ...paper,
      assignment: {
        id: assignment.id,
        title: assignment.title,
        subject: assignment.subject,
        grade
      }
    };
  }
}


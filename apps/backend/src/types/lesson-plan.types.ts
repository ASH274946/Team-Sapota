/**
 * ILessonPlanData — data contract for Puppeteer Lesson Plan PDF rendering.
 * All optional fields must render gracefully (no "undefined"/"null" output).
 */
export interface ILessonPlanActivity {
  /** Activity title or name */
  title: string;
  /** Duration in minutes */
  durationMinutes?: number;
  /** Description or instructions */
  description?: string;
}

export interface ILessonPlanData {
  // ── Identity ──
  id: string;

  // ── School branding ──
  schoolName?: string;
  schoolLogoUrl?: string;

  // ── Lesson metadata ──
  title: string;
  subject: string;
  /** Class/Grade level, e.g. "Grade 10", "Class XII" */
  grade: string;
  /** Section, e.g. "Section A" */
  section?: string;
  /** Teacher display name */
  teacherName?: string;
  /** Lesson date (formatted string) */
  date?: string;
  /** Duration label, e.g. "60 min" or "WEEKLY" */
  duration: string;

  // ── Content ──
  /** Comma-separated or multi-line string of learning objectives */
  objectives: string;
  /** Structured timeline / activity sequence */
  activities: ILessonPlanActivity[] | string[];
  /** Assessment or evaluation strategies */
  assessments: string[];
  /** Full markdown/text content body */
  content?: string;
  /** Teaching materials / resources */
  materials?: string[];
  /** Prerequisites / prior knowledge */
  prerequisites?: string[];
  /** Teacher notes / additional instructions */
  notes?: string;
  /** RAG-retrieved reference materials */
  referenceMaterials?: string[];

  // ── Generation metadata ──
  generatedAt?: string;
  organizationId?: string;
}

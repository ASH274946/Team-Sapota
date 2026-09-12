import type { LucideIcon } from 'lucide-react';
import {
  BookOpen,
  FileSearch,
  BrainCircuit,
  Sparkles,
  CircleCheckBig,
} from 'lucide-react';
import type { GenerationStage } from '@/types/socket.types';

export interface GenerationPhase {
  id: string;
  label: string;
  description: string;
  icon: LucideIcon;
  /** Backend stages mapped to this user-facing phase */
  stages: GenerationStage[];
}

/** Five clear stages shown during generate / regenerate */
export const GENERATION_PHASES: GenerationPhase[] = [
  {
    id: 'reading',
    label: 'Reading documents',
    description: 'Loading and extracting text from your uploaded files',
    icon: BookOpen,
    stages: ['queued', 'extracting_content'],
  },
  {
    id: 'parsing',
    label: 'Parsing content',
    description: 'Breaking down syllabus structure and key topics',
    icon: FileSearch,
    stages: ['topic_preprocessing'],
  },
  {
    id: 'analyzing',
    label: 'Analyzing topics',
    description: 'Planning sections, marks, and question distribution',
    icon: BrainCircuit,
    stages: ['generation_planning', 'validating', 'validation_retry'],
  },
  {
    id: 'generating',
    label: 'Generating questions',
    description: 'AI is writing and refining your exam questions',
    icon: Sparkles,
    stages: [
      'batch_generating',
      'provider_retry',
      'recovering_batches',
    ],
  },
  {
    id: 'finalizing',
    label: 'Answer key & saving',
    description: 'Building the answer key and saving your assignment',
    icon: CircleCheckBig,
    stages: [
      'answer_key_generating',
      'pdf_composing',
      'pdf-generating',
      'persisting',
      'completed',
    ],
  },
];

export function resolvePhaseIndex(stage: GenerationStage | null, status: string | null): number {
  if (status === 'failed' || stage === 'failed') return 0;
  if (!stage) return 0;
  if (status === 'completed' || status === 'partial_success' || stage === 'completed') {
    return GENERATION_PHASES.length - 1;
  }

  for (let i = GENERATION_PHASES.length - 1; i >= 0; i--) {
    if (GENERATION_PHASES[i]!.stages.includes(stage)) {
      return i;
    }
  }
  return 0;
}

export function getPhaseProgressPercent(phaseIndex: number, backendProgress: number): number {
  const phaseCount = GENERATION_PHASES.length;
  const slice = 100 / phaseCount;
  const base = phaseIndex * slice;
  const within = Math.min(slice, Math.max(0, (backendProgress / 100) * slice));
  return Math.min(100, Math.round(base + within * 0.85));
}

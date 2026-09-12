import type { GenerationStage } from '@/types/socket.types';

export interface PipelineStep {
  stage: GenerationStage;
  label: string;
  description: string;
}

export const PIPELINE_STEPS: PipelineStep[] = [
  { stage: 'queued', label: 'Queued for Processing', description: 'Preparing your request' },
  { stage: 'extracting_content', label: 'Reading Uploaded PDFs', description: 'Extracting text from your files' },
  { stage: 'topic_preprocessing', label: 'Understanding Concepts', description: 'Analyzing topics and content' },
  { stage: 'generation_planning', label: 'Planning Assessment', description: 'Structuring the assessment' },
  { stage: 'batch_generating', label: 'Generating Questions', description: 'Crafting questions with AI' },
  { stage: 'validating', label: 'Validating Content', description: 'Running quality checks' },
  { stage: 'pdf_composing', label: 'Composing Document', description: 'Assembling final document' },
  { stage: 'pdf-generating', label: 'Generating PDF', description: 'Creating the PDF file' },
  { stage: 'persisting', label: 'Saving Assignment', description: 'Saving to your account' },
  { stage: 'completed', label: 'Complete', description: 'Assignment is ready' },
];


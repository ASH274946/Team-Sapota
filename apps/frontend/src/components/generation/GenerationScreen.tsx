'use client';
import { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGenerationStore } from '@/store/generation.store';
import { PIPELINE_STEPS } from '@/constants/pipelineSteps';
import type { GenerationStage } from '@/types/socket.types';
import { GenerationTile, type TileConfig } from './GenerationTile';
import { SuccessView } from './SuccessView';
import { ErrorView } from './ErrorView';

const EXTRA_STEPS: { stage: GenerationStage; label: string; description: string }[] = [
  { stage: 'provider_retry', label: 'Reconnecting AI', description: 'Retrying AI provider connection' },
  { stage: 'validation_retry', label: 'Re-validating', description: 'Retrying content validation' },
  { stage: 'recovering_batches', label: 'Recovering Sections', description: 'Rebuilding failed sections' },
  { stage: 'answer_key_generating', label: 'Preparing Answer Key', description: 'Generating model answers' },
];

const TILE_MAP: { stage: GenerationStage; tile: TileConfig }[] = [...PIPELINE_STEPS, ...EXTRA_STEPS].map((step, index) => ({
  stage: step.stage,
  tile: {
    id: step.stage,
    icon: String(index + 1),
    label: step.label,
    description: step.description,
  },
}));

const ALL_STAGES = TILE_MAP.map((m) => m.stage);

function getTileState(stage: GenerationStage | null, currentStageIdx: number, tileIdx: number, status: string | null): 'pending' | 'active' | 'completed' | 'failed' {
  if (!stage || status === 'failed') {
    return tileIdx === currentStageIdx && status === 'failed' ? 'failed' : 'pending';
  }
  if (tileIdx < currentStageIdx) return 'completed';
  if (tileIdx === currentStageIdx) return 'active';
  return 'pending';
}

export interface GenerationScreenProps {
  assignmentTitle: string;
  assignmentSubject: string;
  assignmentId: string;
  duration: number;
  generatedQuestionCount: number | null;
  requestedQuestionCount: number | null;
  generatedMarks: number | null | undefined;
  requestedMarks: number | null | undefined;
  schoolName?: string;
  className?: string;
  isPartial: boolean;
  onRetry: () => void;
  isRetrying: boolean;
}

export function GenerationScreen({
  assignmentTitle, assignmentSubject, assignmentId, duration,
  generatedQuestionCount, requestedQuestionCount,
  generatedMarks, requestedMarks, schoolName, className, isPartial,
  onRetry, isRetrying,
}: GenerationScreenProps) {
  const { stage, status, progress, message, error } = useGenerationStore();

  const currentStageIdx = useMemo(() => {
    if (!stage || stage === 'failed') return 0;
    const idx = ALL_STAGES.indexOf(stage);
    return idx >= 0 ? idx : 0;
  }, [stage]);

  const resolvedSchoolName = schoolName && schoolName.trim() ? schoolName : 'Delhi Public School';
  const resolvedClassName =
    className &&
    className.trim() &&
    className.trim().toLowerCase() !== 'not specified' &&
    className.trim().toLowerCase() !== 'class not specified'
      ? className
      : 'Class 8';
  const resolvedSubjectName =
    assignmentSubject &&
    assignmentSubject.trim() &&
    assignmentSubject.trim().toLowerCase() !== 'not specified'
      ? assignmentSubject
      : 'Mathematics';
  const cleanedSchoolName =
    resolvedSchoolName.trim().toLowerCase() === 'school'
      ? 'Delhi Public School'
      : resolvedSchoolName;

  const showSuccess = status === 'completed' || status === 'partial_success' || isPartial;
  const showError = status === 'failed' || stage === 'failed';
  const showProgress = !showSuccess && !showError;

  const visibleTileCount = useMemo(() => {
    if (showSuccess || showError) return TILE_MAP.length;
    return Math.min(TILE_MAP.length, Math.max(1, currentStageIdx + 1));
  }, [showSuccess, showError, currentStageIdx]);

  const tiles = useMemo(() => {
    return TILE_MAP.slice(0, visibleTileCount).map((m, i) => (
      <GenerationTile
        key={m.tile.id}
        tile={m.tile}
        state={getTileState(stage, currentStageIdx, i, status)}
        message={i === currentStageIdx ? message : undefined}
        index={i}
      />
    ));
  }, [stage, currentStageIdx, status, message, visibleTileCount]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.35 }}
      className="fixed inset-0 z-50 flex flex-col bg-gradient-to-br from-white to-gray-50 overflow-y-auto"
      style={{ paddingTop: 'env(safe-area-inset-top, 0px)', paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <div className="flex-shrink-0 border-b border-gray-200 px-6 py-4 bg-white/95 backdrop-blur-sm">
        <div className="flex items-center justify-between gap-4 max-w-5xl mx-auto">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-gray-900 truncate uppercase">{assignmentTitle}</h1>
              {showProgress && <span className="text-sm text-orange-500 font-semibold">{Math.round(progress)}%</span>}
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
              <span>{resolvedSubjectName}</span>
              <span>-</span>
              <span>{resolvedClassName}</span>
              <span>-</span>
              <span>{cleanedSchoolName}</span>
            </div>
          </div>
          {showProgress && (
            <div className="flex items-center gap-2 text-xs text-gray-500 shrink-0">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Generating
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 py-8 sm:py-10">
        <div className="w-full max-w-5xl">
          <AnimatePresence mode="wait">
            {showSuccess ? (
              <motion.div key="success" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.4 }}>
                <SuccessView
                  assignmentId={assignmentId}
                  isPartial={isPartial}
                  generatedCount={generatedQuestionCount}
                  requestedCount={requestedQuestionCount}
                  generatedMarks={generatedMarks}
                  requestedMarks={requestedMarks}
                  duration={duration}
                  subject={resolvedSubjectName}
                  schoolName={cleanedSchoolName}
                  className={resolvedClassName}
                  onRegenerate={onRetry}
                  isRetrying={isRetrying}
                />
              </motion.div>
            ) : showError ? (
              <motion.div key="error" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.4 }}>
                <ErrorView error={error} onRetry={onRetry} isRetrying={isRetrying} />
              </motion.div>
            ) : (
              <motion.div key="progress" className="space-y-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div className="text-center">
                  <h2 className="text-3xl sm:text-5xl font-extrabold text-gray-900 tracking-tight uppercase">System Processing</h2>
                  <p className="text-[11px] sm:text-xs text-gray-500 font-mono uppercase tracking-[0.22em] mt-2">Initializing assignment generation pipeline...</p>
                </div>
                <div className="relative bg-white/95 border border-gray-300 rounded-3xl p-4 sm:p-6 shadow-[0_20px_80px_rgba(15,23,42,0.08)] overflow-hidden max-w-4xl mx-auto">
                  <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.02)_50%),linear-gradient(90deg,rgba(255,0,0,0.02),rgba(0,255,0,0.01),rgba(0,0,255,0.02))] pointer-events-none bg-[length:100%_4px,6px_100%]" />
                  <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                    {tiles}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {showProgress && (
        <div className="flex-shrink-0 border-t border-gray-200 px-6 py-3 bg-white/95 backdrop-blur-sm">
          <div className="max-w-5xl mx-auto flex items-center justify-between">
            <span className="text-xs text-gray-500 font-mono uppercase tracking-wide">AI is working on your assignment</span>
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-gray-500 font-medium">{Math.round(progress)}%</span>
              <div className="w-24 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-orange-400 to-amber-500 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}

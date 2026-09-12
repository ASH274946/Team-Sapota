'use client';

import { useMemo } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Check } from 'lucide-react';
import {
  GENERATION_PHASES,
  resolvePhaseIndex,
  getPhaseProgressPercent,
  type GenerationPhase,
} from '@/constants/generationPhases';
import type { GenerationStage } from '@/types/socket.types';

type StepState = 'pending' | 'active' | 'done';

interface GenerationPipelineProps {
  stage: GenerationStage | null;
  status: string | null;
  progress: number;
  message?: string;
}

const spring = { type: 'spring' as const, stiffness: 380, damping: 32 };

function PhaseIcon({
  state,
  Icon,
  reduceMotion,
}: {
  state: StepState;
  Icon: GenerationPhase['icon'];
  reduceMotion: boolean | null;
}) {
  if (state === 'done') {
    return (
      <motion.div
        layout
        className="gen-step-icon gen-step-icon--done"
        initial={reduceMotion ? false : { scale: 0.85 }}
        animate={{ scale: 1 }}
        transition={spring}
      >
        <Check size={20} strokeWidth={2.5} aria-hidden />
      </motion.div>
    );
  }

  if (state === 'active') {
    return (
      <div className="gen-step-icon gen-step-icon--active" style={{ position: 'relative' }}>
        {!reduceMotion && (
          <>
            <motion.span
              style={{
                position: 'absolute',
                inset: 0,
                borderRadius: '50%',
                background: 'rgba(232, 83, 29, 0.2)',
              }}
              animate={{ scale: [1, 1.35, 1], opacity: [0.5, 0, 0.5] }}
              transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
            />
            <motion.span
              style={{
                position: 'absolute',
                inset: -3,
                borderRadius: '50%',
                border: '2px solid rgba(232, 83, 29, 0.35)',
              }}
              animate={{ rotate: 360 }}
              transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
            />
          </>
        )}
        <Icon size={20} strokeWidth={2} aria-hidden style={{ position: 'relative', zIndex: 1 }} />
      </div>
    );
  }

  return (
    <div className="gen-step-icon gen-step-icon--pending">
      <Icon size={20} strokeWidth={1.75} aria-hidden style={{ opacity: 0.55 }} />
    </div>
  );
}

export function GenerationPipeline({ stage, status, progress, message }: GenerationPipelineProps) {
  const reduceMotion = useReducedMotion();
  const activeIndex = resolvePhaseIndex(stage, status);

  const displayProgress = useMemo(
    () => getPhaseProgressPercent(activeIndex, progress),
    [activeIndex, progress],
  );

  const activePhase = GENERATION_PHASES[activeIndex]!;

  return (
    <div className="gen-pipeline">
      <div className="gen-pipeline-hero">
        <div className="gen-pipeline-ring">
          <svg viewBox="0 0 120 120" aria-hidden>
            <circle cx="60" cy="60" r="52" fill="none" stroke="var(--border)" strokeWidth="8" />
            <motion.circle
              cx="60"
              cy="60"
              r="52"
              fill="none"
              stroke="var(--brand)"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={326.7}
              initial={false}
              animate={{
                strokeDashoffset: 326.7 - (326.7 * displayProgress) / 100,
              }}
              transition={{ duration: reduceMotion ? 0 : 0.6, ease: [0.4, 0, 0.2, 1] }}
            />
          </svg>
          <div className="gen-pipeline-ring-label">
            <span className="gen-pipeline-percent" suppressHydrationWarning>
              {displayProgress}%
            </span>
            <span className="gen-pipeline-percent-sub">Complete</span>
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={activePhase.id}
            initial={reduceMotion ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduceMotion ? undefined : { opacity: 0, y: -8 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
          >
            <h3 className="gen-pipeline-phase-title">{activePhase.label}</h3>
            <p className="gen-pipeline-phase-desc">
              {message?.trim() || activePhase.description}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>

      <ol className="gen-pipeline-steps" aria-label="Generation progress">
        {GENERATION_PHASES.map((phase, index) => {
          const stepState: StepState =
            index < activeIndex ? 'done' : index === activeIndex ? 'active' : 'pending';
          const Icon = phase.icon;
          const isLast = index === GENERATION_PHASES.length - 1;

          const labelClass =
            stepState === 'active'
              ? 'gen-step-label gen-step-label--active'
              : stepState === 'done'
                ? 'gen-step-label gen-step-label--done'
                : 'gen-step-label gen-step-label--pending';

          return (
            <li key={phase.id} className="gen-pipeline-step">
              {!isLast && (
                <div className="gen-pipeline-step-line" aria-hidden>
                  <motion.div
                    className="gen-pipeline-step-line-fill"
                    initial={{ height: '0%' }}
                    animate={{
                      height:
                        index < activeIndex ? '100%' : index === activeIndex ? '35%' : '0%',
                    }}
                    transition={{ duration: reduceMotion ? 0 : 0.55, ease: [0.4, 0, 0.2, 1] }}
                  />
                </div>
              )}

              <PhaseIcon state={stepState} Icon={Icon} reduceMotion={reduceMotion} />

              <div className="gen-step-body">
                <p className={labelClass}>{phase.label}</p>
                <p
                  className="gen-step-desc"
                  style={{
                    color:
                      stepState === 'active' ? 'var(--text-secondary)' : 'rgba(156, 163, 175, 0.85)',
                  }}
                >
                  {phase.description}
                </p>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

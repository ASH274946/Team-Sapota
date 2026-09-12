import { create } from 'zustand';
import type { GenerationStage } from '../types/socket.types';

interface GenerationState {
  status: 'queued' | 'generating' | 'partial_success' | 'completed' | 'failed' | 'recovering_batches' | 'provider_retry' | 'validation_retry' | null;
  stage: GenerationStage | null;
  progress: number;
  message: string;
  paperId: string | null;
  error: string | null;
  warning: string | null;
  isActive: boolean;
  activeJobRecordId: string | null;
  generationSeq: number | null;
  lastVersion: number;
  lastEventTs: number;
  setQueued: (jobRecordId: string, generationSeq: number, version: number, ts?: number) => void;
  setProgress: (jobRecordId: string, generationSeq: number, version: number, ts: number, progress: number, stage: GenerationStage, message?: string) => void;
  setCompleted: (jobRecordId: string, generationSeq: number, version: number, ts: number, paperId: string, partial?: boolean) => void;
  setFailed: (jobRecordId: string, generationSeq: number, version: number, ts: number, error: string) => void;
  setWarning: (warning: string) => void;
  reset: () => void;
}

export const useGenerationStore = create<GenerationState>((set) => ({
  stage: null,
  status: null,
  progress: 0,
  message: '',
  paperId: null,
  error: null,
  warning: null,
  isActive: false,
  activeJobRecordId: null,
  generationSeq: null,
  lastVersion: 0,
  lastEventTs: 0,

  setQueued: (jobRecordId, generationSeq, version, ts) =>
    set((s) => {
      if (s.activeJobRecordId && s.activeJobRecordId !== jobRecordId) return s;
      if (s.generationSeq !== null && s.generationSeq !== generationSeq) return s;
      if (version > 0 && version <= (s.lastVersion ?? 0)) return s;
      if (s.stage === 'completed' || s.stage === 'failed') return s;
      // Don't regress if already past queued state
      if (s.stage && s.stage !== 'queued') return s;
      return {
        status: 'queued',
        stage: 'queued',
        progress: 0,
        message: 'Queued for processing...',
        isActive: true,
        error: null,
        activeJobRecordId: jobRecordId,
        generationSeq,
        lastVersion: Math.max(s.lastVersion ?? 0, version),
        lastEventTs: Math.max(s.lastEventTs ?? 0, ts ?? Date.now()),
      };
    }),

  setProgress: (jobRecordId, generationSeq, version, ts, progress, stage, message) =>
    set((s) => {
      // Ignore stale/out-of-order events.
      if (s.activeJobRecordId && s.activeJobRecordId !== jobRecordId) return s;
      if (s.generationSeq !== null && s.generationSeq !== generationSeq) return s;
      // Allow same-version progress updates (e.g. polling catch-up when version stays 0)
      if (version < (s.lastVersion ?? 0)) return s;
      // Never regress terminal states for the active job.
      if (s.stage === 'completed' || s.stage === 'failed') return s;
      if (progress < (s.progress ?? 0)) return s;
      return {
        ...s,
        status: stage === 'recovering_batches' || stage === 'provider_retry' || stage === 'validation_retry' ? stage : 'generating',
        progress,
        stage,
        message: message !== undefined ? message : s.message,
        isActive: true,
        activeJobRecordId: s.activeJobRecordId ?? jobRecordId,
        generationSeq: s.generationSeq ?? generationSeq,
        lastVersion: version,
        lastEventTs: ts,
      };
    }),

  setCompleted: (jobRecordId, generationSeq, version, ts, paperId, partial) =>
    set((s) => {
      if (s.activeJobRecordId && s.activeJobRecordId !== jobRecordId) return s;
      if (s.generationSeq !== null && s.generationSeq !== generationSeq) return s;
      if (version < (s.lastVersion ?? 0)) return s;
      return {
        ...s,
        status: partial ? 'partial_success' : 'completed',
        stage: 'completed',
        progress: 100,
        paperId,
        isActive: false,
        error: null,
        activeJobRecordId: s.activeJobRecordId ?? jobRecordId,
        generationSeq: s.generationSeq ?? generationSeq,
        lastVersion: version,
        lastEventTs: ts,
      };
    }),

  setFailed: (jobRecordId, generationSeq, version, ts, error) =>
    set((s) => {
      if (s.activeJobRecordId && s.activeJobRecordId !== jobRecordId) return s;
      if (s.generationSeq !== null && s.generationSeq !== generationSeq) return s;
      if (version < (s.lastVersion ?? 0)) return s;
      // Don't allow a late failure to overwrite completion for the active job.
      if (s.stage === 'completed') return s;
      return {
        ...s,
        status: 'failed',
        stage: 'failed',
        error,
        isActive: false,
        activeJobRecordId: s.activeJobRecordId ?? jobRecordId,
        generationSeq: s.generationSeq ?? generationSeq,
        lastVersion: version,
        lastEventTs: ts,
      };
    }),

  setWarning: (warning) => set({ warning }),
  reset: () =>
    set({
      status: null,
      stage: null,
      progress: 0,
      message: '',
      paperId: null,
      error: null,
      warning: null,
      isActive: false,
      activeJobRecordId: null,
      generationSeq: null,
      lastVersion: 0,
      lastEventTs: 0,
    }),
}));

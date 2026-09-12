'use client';

type AssignmentPhase = 'idle' | 'error' | 'processing' | 'complete';

interface UseAssignmentPhaseInput {
  isLoading: boolean;
  error: string | null;
  isProcessing: boolean;
  isComplete: boolean;
}

export function useAssignmentPhase(input: UseAssignmentPhaseInput): AssignmentPhase {
  if (input.isLoading) return 'idle';
  if (input.error) return 'error';
  if (input.isProcessing) return 'processing';
  if (input.isComplete) return 'complete';
  return 'idle';
}


'use client';
import { useEffect, useCallback } from 'react';
import { useAssignmentStore } from '../store/assignment.store';
import { fetchAssignments } from '../services/assignment.service';
import { useAssignmentPhase } from './useAssignmentPhase';

export function useAssignments(page = 1, status?: string) {
  const { assignments, totalCount, isLoading, error, setAssignments, setLoading, setError } =
    useAssignmentStore();

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchAssignments(page, 10, status);
      setAssignments(result.data, result.pagination.total);
    } catch (e) {
      setAssignments([], 0);
      setError(e instanceof Error ? e.message : 'Failed to load assignments');
    } finally {
      setLoading(false);
    }
  }, [page, status, setAssignments, setLoading, setError]);

  useEffect(() => {
    void load();
  }, [load]);

  const phase = useAssignmentPhase({
    isLoading,
    error,
    isProcessing: false,
    isComplete: !isLoading && !error,
  });

  return { assignments, totalCount, isLoading, error, phase, reload: load };
}

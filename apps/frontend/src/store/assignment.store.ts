import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { Assignment } from '../types/assignment.types';

interface AssignmentState {
  assignments: Assignment[];
  selectedAssignment: Assignment | null;
  totalCount: number;
  currentPage: number;
  isLoading: boolean;
  error: string | null;
  setAssignments: (assignments: Assignment[], total: number) => void;
  addAssignment: (assignment: Assignment) => void;
  removeAssignment: (id: string) => void;
  updateAssignmentStatus: (id: string, status: Assignment['status']) => void;
  setSelectedAssignment: (assignment: Assignment | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setPage: (page: number) => void;
}

export const useAssignmentStore = create<AssignmentState>()(
  immer((set) => ({
    assignments: [],
    selectedAssignment: null,
    totalCount: 0,
    currentPage: 1,
    isLoading: false,
    error: null,

    setAssignments: (assignments, total) =>
      set((state) => {
        state.assignments = assignments;
        state.totalCount = total;
      }),

    addAssignment: (assignment) =>
      set((state) => {
        state.assignments.unshift(assignment);
        state.totalCount += 1;
      }),

    removeAssignment: (id) =>
      set((state) => {
        state.assignments = state.assignments.filter((a) => a.id !== id);
        state.totalCount -= 1;
      }),

    updateAssignmentStatus: (id, status) =>
      set((state) => {
        const found = state.assignments.find((a) => a.id === id);
        if (found) found.status = status;
      }),

    setSelectedAssignment: (assignment) =>
      set((state) => {
        state.selectedAssignment = assignment;
      }),

    setLoading: (loading) => set((state) => { state.isLoading = loading; }),
    setError: (error) => set((state) => { state.error = error; }),
    setPage: (page) => set((state) => { state.currentPage = page; }),
  }))
);

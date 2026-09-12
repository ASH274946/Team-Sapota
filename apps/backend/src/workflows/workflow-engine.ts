import { WorkflowStatus } from '@prisma/client';

export class InvalidWorkflowTransitionError extends Error {
  constructor(public fromStatus: string, public toStatus: string) {
    super(`INVALID_WORKFLOW_TRANSITION: Cannot transition from ${fromStatus} to ${toStatus}`);
    this.name = 'InvalidWorkflowTransitionError';
  }
}

/**
 * Defines the strict, deterministic allowed state transitions for an Assignment workflow.
 */
const ALLOWED_TRANSITIONS: Record<WorkflowStatus, WorkflowStatus[]> = {
  [WorkflowStatus.DRAFT]: [WorkflowStatus.GENERATING],
  [WorkflowStatus.GENERATING]: [WorkflowStatus.GENERATED, WorkflowStatus.FAILED, WorkflowStatus.PARTIALLY_GENERATED],
  [WorkflowStatus.PARTIALLY_GENERATED]: [WorkflowStatus.PENDING_APPROVAL],
  [WorkflowStatus.GENERATED]: [WorkflowStatus.PENDING_APPROVAL],
  [WorkflowStatus.FAILED]: [WorkflowStatus.DRAFT, WorkflowStatus.GENERATING],
  [WorkflowStatus.PENDING_APPROVAL]: [WorkflowStatus.APPROVED, WorkflowStatus.REJECTED],
  [WorkflowStatus.REJECTED]: [WorkflowStatus.DRAFT],
  [WorkflowStatus.APPROVED]: [WorkflowStatus.PUBLISHED],
  [WorkflowStatus.PUBLISHED]: [WorkflowStatus.ACTIVE],
  [WorkflowStatus.ACTIVE]: [WorkflowStatus.COMPLETED],
  [WorkflowStatus.COMPLETED]: [WorkflowStatus.ARCHIVED, WorkflowStatus.PENDING_APPROVAL],
  [WorkflowStatus.ARCHIVED]: [],
};

/**
 * Validates whether a state transition is legal according to the workflow rules.
 * Throws InvalidWorkflowTransitionError if the transition is illegal.
 */
export const validateTransition = (currentStatus: WorkflowStatus, newStatus: WorkflowStatus): void => {
  if (currentStatus === newStatus) return; // No transition

  const allowedNextStates = ALLOWED_TRANSITIONS[currentStatus];
  
  if (!allowedNextStates || !allowedNextStates.includes(newStatus)) {
    throw new InvalidWorkflowTransitionError(currentStatus, newStatus);
  }
};

/**
 * Attempts to safely transition a state. Returns a boolean instead of throwing.
 */
export const canTransition = (currentStatus: WorkflowStatus, newStatus: WorkflowStatus): boolean => {
  try {
    validateTransition(currentStatus, newStatus);
    return true;
  } catch {
    return false;
  }
};

export const workflowEngine = {
  canTransition,
  transition: (currentStatus: WorkflowStatus, newStatus: WorkflowStatus): void => {
    validateTransition(currentStatus, newStatus);
  }
};

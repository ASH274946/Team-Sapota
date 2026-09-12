import { logger } from '../../utils/logger';

export interface AbortContext {
  assignmentId: string;
  jobRecordId: string;
  generationSeq: number;
  attempt: number;
}

export class AbortManager {
  private readonly controllers = new Map<string, AbortController>();
  private readonly contexts = new Map<string, AbortContext>();

  private key(assignmentId: string, jobRecordId: string): string {
    return `${assignmentId}:${jobRecordId}`;
  }

  register(assignmentId: string, jobRecordId: string, generationSeq: number, attempt: number): AbortSignal {
    const k = this.key(assignmentId, jobRecordId);
    const existing = this.controllers.get(k);
    if (existing && !existing.signal.aborted) {
      return existing.signal;
    }
    const controller = new AbortController();
    this.controllers.set(k, controller);
    this.contexts.set(k, { assignmentId, jobRecordId, generationSeq, attempt });
    logger.info(`[ABORT] Registered controller assignment=${assignmentId} jobRecord=${jobRecordId} seq=${generationSeq} attempt=${attempt}`);
    return controller.signal;
  }

  abort(assignmentId: string, jobRecordId: string, reason: string): void {
    const k = this.key(assignmentId, jobRecordId);
    const controller = this.controllers.get(k);
    if (!controller || controller.signal.aborted) return;
    const ctx = this.contexts.get(k);
    controller.abort(new Error(reason));
    logger.warn(`[ABORT] Aborted assignment=${assignmentId} jobRecord=${jobRecordId} reason="${reason}" attempt=${ctx?.attempt} seq=${ctx?.generationSeq}`);
  }

  release(assignmentId: string, jobRecordId: string): void {
    const k = this.key(assignmentId, jobRecordId);
    this.controllers.delete(k);
    this.contexts.delete(k);
    logger.debug(`[ABORT] Released assignment=${assignmentId} jobRecord=${jobRecordId}`);
  }

  isAborted(assignmentId: string, jobRecordId: string): boolean {
    const k = this.key(assignmentId, jobRecordId);
    const controller = this.controllers.get(k);
    return controller?.signal.aborted ?? false;
  }

  getSignal(assignmentId: string, jobRecordId: string): AbortSignal | null {
    const k = this.key(assignmentId, jobRecordId);
    return this.controllers.get(k)?.signal ?? null;
  }

  cleanup(): void {
    for (const [, controller] of this.controllers.entries()) {
      if (!controller.signal.aborted) {
        controller.abort(new Error('AbortManager global cleanup'));
      }
    }
    this.controllers.clear();
    this.contexts.clear();
    logger.info('[ABORT] Cleanup complete');
  }
}

export const abortManager = new AbortManager();

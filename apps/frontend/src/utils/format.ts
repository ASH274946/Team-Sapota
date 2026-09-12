import type { AssignmentStatus } from '@/types/assignment.types';

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}min`;
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function getStatusColor(status: AssignmentStatus): string {
  const map: Record<AssignmentStatus, string> = {
    DRAFT: 'badge-draft',
    QUEUED: 'badge-queued',
    GENERATING: 'badge-generating',
    COMPLETED: 'badge-completed',
    FAILED: 'badge-failed',
    PARTIALLY_GENERATED: 'badge-partial',
    PENDING_APPROVAL: 'badge-queued',
    APPROVED: 'badge-completed',
    REJECTED: 'badge-failed',
    PUBLISHED: 'badge-completed'
  };
  return map[status];
}

export function truncate(str: string, max: number): string {
  return str.length > max ? `${str.slice(0, max)}…` : str;
}

/**
 * Format date consistently with fixed locale to prevent hydration mismatches
 * between server and client rendering.
 */
export function formatDate(
  date: string | Date,
  options?: Intl.DateTimeFormatOptions
): string {
  try {
    const d = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(d.getTime())) return '-';
    // Always use 'en-US' locale for consistent server/client rendering
    return d.toLocaleDateString('en-US', options || { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return '-';
  }
}

/**
 * Format date with time consistently with fixed locale.
 */
export function formatDateTime(
  date: string | Date,
  options?: Intl.DateTimeFormatOptions
): string {
  try {
    const d = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(d.getTime())) return '-';
    return d.toLocaleString('en-US', options || {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '-';
  }
}

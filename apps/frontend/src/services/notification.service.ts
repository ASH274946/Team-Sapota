import { api } from '@/lib/api';

export interface RealNotificationItem {
  id: string;
  userId?: string;
  title?: string;
  message: string;
  type?: string;
  isRead: boolean;
  metadata?: any;
  createdAt: string;
}

const STORAGE_KEY = 'vidya_notifications_v2';

const defaultVidyaNotifications: RealNotificationItem[] = [
  {
    id: 'notif-1',
    title: 'Attendance Alert',
    message: 'Attendance submission required for Data Structures (Sec A).',
    type: 'alert',
    isRead: false,
    createdAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
  },
  {
    id: 'notif-2',
    title: 'Assessment Generated',
    message: 'Mid-Term Question Paper successfully generated.',
    type: 'assignment',
    isRead: false,
    createdAt: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
  },
  {
    id: 'notif-3',
    title: 'Resource Center',
    message: 'New curriculum textbook indexed into PGVector database.',
    type: 'doc',
    isRead: false,
    createdAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'notif-4',
    title: 'Outcome Mapping',
    message: 'CO-PO Weightages approved by Academic Committee.',
    type: 'team',
    isRead: true,
    createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'notif-5',
    title: 'System Update',
    message: 'VidyaAI Automated Grader & AI Copilot updated to v2.4.',
    type: 'deploy',
    isRead: true,
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
  },
];

function getStoredNotifications(): RealNotificationItem[] | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function setStoredNotifications(items: RealNotificationItem[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // Ignore storage quota errors
  }
}

export async function fetchNotifications(): Promise<RealNotificationItem[]> {
  try {
    const res = await api.get('/notifications');
    const data = res.data?.data || res.data;
    if (Array.isArray(data) && data.length > 0) {
      setStoredNotifications(data);
      return data;
    }
  } catch (error) {
    // Ignore network error and use local storage fallback below
  }

  // 1. Fall back to persistent localStorage
  const cached = getStoredNotifications();
  if (cached && cached.length > 0) {
    return cached;
  }

  // 2. Initialize default notifications if storage is empty
  setStoredNotifications(defaultVidyaNotifications);
  return defaultVidyaNotifications;
}

export async function markNotificationAsRead(id: string): Promise<void> {
  // Update localStorage immediately for instant persistence on refresh
  const current = getStoredNotifications() || defaultVidyaNotifications;
  const updated = current.map((item) =>
    item.id === id ? { ...item, isRead: true } : item
  );
  setStoredNotifications(updated);

  // Sync to PostgreSQL backend
  try {
    await api.put(`/notifications/${id}/read`);
  } catch (error) {
    // Backend fallback handled by local persistence
  }
}

export async function markAllNotificationsAsRead(): Promise<void> {
  // Update localStorage immediately for instant persistence on refresh
  const current = getStoredNotifications() || defaultVidyaNotifications;
  const updated = current.map((item) => ({ ...item, isRead: true }));
  setStoredNotifications(updated);

  // Sync to PostgreSQL backend
  try {
    await api.put('/notifications/read-all');
  } catch (error) {
    // Backend fallback handled by local persistence
  }
}

import { create } from 'zustand';
import { api } from '@/lib/api';

export type NotificationType = 'pull_request' | 'alert' | 'team' | 'deploy' | 'doc' | 'assignment' | 'assessment';
export type NotificationPriority = 'urgent' | 'normal' | 'low';
export type NotificationTab = 'all' | 'unread' | 'mentions';

export interface NotificationAuthor {
  name: string;
  initials: string;
  avatar?: string;
}

export interface NotificationItem {
  id: string;
  type: NotificationType;
  priority: NotificationPriority;
  author: NotificationAuthor;
  project: string;
  message: string;
  detail?: string;
  timestamp: string;
  isUnread: boolean;
  isMention: boolean;
  createdAt?: string;
}

export interface RawApiNotification {
  id: string;
  userId?: string;
  title?: string;
  message: string;
  type?: string;
  isRead: boolean;
  metadata?: any;
  createdAt: string;
}

const STORAGE_KEY = 'vidyaai_notifications_cache_v3';

export const defaultSeedNotifications: NotificationItem[] = [
  {
    id: 'seed-1',
    type: 'alert',
    priority: 'urgent',
    author: {
      name: 'System Monitor',
      initials: 'SM',
    },
    project: 'Academic Portal',
    message: 'Attendance submission pending for Computer Networks (Section A)',
    detail: "Today's lecture attendance must be submitted by 5:00 PM for accreditation sync.",
    timestamp: '5m ago',
    isUnread: true,
    isMention: false,
    createdAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
  },
  {
    id: 'seed-2',
    type: 'assignment',
    priority: 'normal',
    author: {
      name: 'Dr. Arul Thalan',
      initials: 'AT',
    },
    project: 'Question Bank',
    message: 'Generated Mid-Term Assessment Paper for Data Structures',
    timestamp: '25m ago',
    isUnread: true,
    isMention: true,
    createdAt: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
  },
  {
    id: 'seed-3',
    type: 'doc',
    priority: 'normal',
    author: {
      name: 'Library Admin',
      initials: 'LA',
    },
    project: 'Resource Center',
    message: 'New curriculum textbook PDF indexed & embedded into RAG Knowledge Base',
    detail: '1,240 document chunks processed with PGVector hybrid search GIN index.',
    timestamp: '1h ago',
    isUnread: true,
    isMention: false,
    createdAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'seed-4',
    type: 'team',
    priority: 'low',
    author: {
      name: 'Priya Sharma',
      initials: 'PS',
    },
    project: 'Course Committee',
    message: 'Approved CO-PO Outcome Mapping weightages for Semester 4',
    timestamp: '3h ago',
    isUnread: false,
    isMention: false,
    createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'seed-5',
    type: 'deploy',
    priority: 'low',
    author: {
      name: 'VidyaAI Platform',
      initials: 'VA',
    },
    project: 'Platform Update',
    message: 'AI Tutor & Automated Grader v2.4 successfully updated',
    timestamp: 'Yesterday',
    isUnread: false,
    isMention: true,
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
  },
];

function loadFromStorage(): NotificationItem[] {
  if (typeof window === 'undefined') return defaultSeedNotifications;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultSeedNotifications;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
  } catch {
    // Ignore storage parse errors
  }
  return defaultSeedNotifications;
}

function saveToStorage(items: NotificationItem[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // Ignore quota errors
  }
}

function formatRelativeTime(dateStr?: string): string {
  if (!dateStr) return 'Recently';
  try {
    const date = new Date(dateStr);
    const now = Date.now();
    const diffMs = now - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return 'Just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  } catch {
    return 'Recently';
  }
}

function mapRawToItem(n: RawApiNotification, index: number): NotificationItem {
  const typeMap: Record<string, NotificationType> = {
    alert: 'alert',
    urgent: 'alert',
    assignment: 'assignment',
    doc: 'doc',
    document: 'doc',
    team: 'team',
    academic: 'team',
    deploy: 'deploy',
    system: 'deploy',
    assessment: 'assessment',
    info: 'team',
  };

  const rawType = (n.type || 'info').toLowerCase();
  const mappedType: NotificationType = typeMap[rawType] || 'alert';
  const isUrgent = rawType === 'urgent' || rawType === 'alert';

  return {
    id: n.id || `notif-${index + 1}`,
    type: mappedType,
    priority: isUrgent ? 'urgent' : n.isRead ? 'low' : 'normal',
    author: {
      name: n.title || 'VidyaAI Academic System',
      initials: (n.title || 'VA').substring(0, 2).toUpperCase(),
    },
    project: n.metadata?.project || 'VidyaAI Portal',
    message: n.message,
    detail: n.metadata?.detail,
    timestamp: formatRelativeTime(n.createdAt),
    isUnread: !n.isRead,
    isMention: Boolean(n.metadata?.isMention),
    createdAt: n.createdAt,
  };
}

interface NotificationStore {
  items: NotificationItem[];
  isLoaded: boolean;
  isRefreshing: boolean;
  activeTab: NotificationTab;
  setActiveTab: (tab: NotificationTab) => void;
  fetchNotifications: (force?: boolean) => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  unreadCount: () => number;
}

export const useNotificationStore = create<NotificationStore>((set, get) => ({
  items: typeof window !== 'undefined' ? loadFromStorage() : defaultSeedNotifications,
  isLoaded: false,
  isRefreshing: false,
  activeTab: 'all',

  setActiveTab: (tab) => set({ activeTab: tab }),

  unreadCount: () => {
    return get().items.filter((i) => i.isUnread).length;
  },

  fetchNotifications: async (force = false) => {
    // If already loaded and not forced, only do a silent background sync
    const currentItems = get().items;
    if (get().isRefreshing) return;

    set({ isRefreshing: true });

    try {
      const res = await api.get('/notifications');
      const rawData = res.data?.data || res.data;

      if (Array.isArray(rawData) && rawData.length > 0) {
        const mapped = rawData.map(mapRawToItem);
        saveToStorage(mapped);
        set({ items: mapped, isLoaded: true, isRefreshing: false });
        return;
      }
    } catch {
      // Backend not available or returned error - gracefully retain pre-cached/seed items
    }

    // Ensure we keep existing cached or seed items
    if (currentItems.length === 0) {
      const fallback = loadFromStorage();
      set({ items: fallback, isLoaded: true, isRefreshing: false });
    } else {
      set({ isLoaded: true, isRefreshing: false });
    }
  },

  markAsRead: async (id: string) => {
    const updated = get().items.map((item) =>
      item.id === id ? { ...item, isRead: true, isUnread: false } : item
    );
    set({ items: updated });
    saveToStorage(updated);

    try {
      await api.put(`/notifications/${id}/read`);
    } catch {
      // Offline fallback already updated in memory & localStorage
    }
  },

  markAllAsRead: async () => {
    const updated = get().items.map((item) => ({ ...item, isRead: true, isUnread: false }));
    set({ items: updated });
    saveToStorage(updated);

    try {
      await api.put('/notifications/read-all');
    } catch {
      // Offline fallback already updated in memory & localStorage
    }
  },
}));

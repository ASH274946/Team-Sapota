'use client';

import React, { useEffect } from 'react';
import {
  RiBellFill,
  RiCheckDoubleFill,
  RiCircleFill,
} from 'react-icons/ri';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  useNotificationStore,
  NotificationItem,
  NotificationPriority,
  NotificationTab,
} from '@/store/notification.store';

export type UpdateType = NotificationItem['type'];
export type UpdatePriority = NotificationPriority;
export type UpdateTab = NotificationTab;
export type TeamUpdate = NotificationItem;

export interface Notification2Props {
  heading?: string;
  className?: string;
  onMarkAllRead?: () => void;
  onClose?: () => void;
}

const TypeLabelMap: Record<string, string> = {
  pull_request: 'Assignment',
  alert: 'Urgent',
  team: 'Academic',
  deploy: 'System',
  doc: 'Resource',
  assignment: 'Assignment',
  assessment: 'Evaluation',
};

// High contrast priority badges on white background
const PriorityBadgeMap: Record<UpdatePriority, string> = {
  urgent: 'bg-red-50 text-red-700 border border-red-200',
  normal: 'bg-orange-50 text-orange-800 border border-orange-200',
  low: 'bg-slate-100 text-slate-700 border border-slate-200',
};

// Helper Avatar component with dark text fallback on solid white background
function SimpleAvatar({ author }: { author: NotificationItem['author'] }) {
  const [hasError, setHasError] = React.useState(false);

  return (
    <div className="relative flex h-9 w-9 shrink-0 overflow-hidden rounded-full border border-slate-200 bg-slate-100 items-center justify-center text-slate-800 font-bold shadow-2xs">
      {author.avatar && !hasError ? (
        <img
          src={author.avatar}
          alt={author.name}
          className="aspect-square h-full w-full object-cover"
          onError={() => setHasError(true)}
        />
      ) : (
        <span className="text-xs font-black text-slate-700 tracking-tight">
          {author.initials}
        </span>
      )}
    </div>
  );
}

export function Notification2({
  heading = 'Notifications',
  className,
  onMarkAllRead,
}: Notification2Props) {
  const {
    items,
    activeTab,
    setActiveTab,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
  } = useNotificationStore();

  // Trigger silent background sync on mount
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleMarkAllRead = async () => {
    await markAllAsRead();
    if (onMarkAllRead) onMarkAllRead();
  };

  const handleItemClick = async (id: string) => {
    await markAsRead(id);
  };

  const unreadCount = items.filter((u) => u.isUnread).length;
  const mentionCount = items.filter((u) => u.isMention).length;

  const filteredUpdates = items.filter((u) => {
    if (activeTab === 'unread') return u.isUnread;
    if (activeTab === 'mentions') return u.isMention;
    return true;
  });

  return (
    <section className={cn('bg-white text-slate-900 rounded-2xl shadow-2xl flex flex-col p-1 border border-slate-200/90 animate-in fade-in zoom-in-95 duration-150', className)}>
      <Card className="w-full max-w-sm overflow-hidden rounded-2xl p-2 bg-white text-slate-900 border-none shadow-none">
        <CardHeader className="p-2 pb-3 bg-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-orange-100 text-orange-600 flex h-9 w-9 items-center justify-center rounded-xl font-bold shadow-2xs">
                <RiBellFill className="h-4.5 w-4.5 text-orange-600" />
              </div>
              <div>
                <h2 className="text-slate-900 text-sm font-black tracking-tight">
                  {heading}
                </h2>
                <p className="text-slate-500 text-[11px] font-semibold">
                  {unreadCount} unread · {items.length} total
                </p>
              </div>
            </div>

            <div className="flex items-center">
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleMarkAllRead}
                  className="text-orange-600 hover:bg-orange-50 hover:text-orange-700 gap-1 rounded-lg text-xs font-bold h-7 px-2 cursor-pointer"
                >
                  <RiCheckDoubleFill className="h-3.5 w-3.5" />
                  Mark all read
                </Button>
              )}
            </div>
          </div>
        </CardHeader>

        <div className="w-full bg-white">
          <div className="px-1 mb-2.5">
            <div className="bg-slate-100 flex h-8.5 items-center gap-1 rounded-xl p-1 border border-slate-200/70">
              <button
                type="button"
                onClick={() => setActiveTab('all')}
                className={cn(
                  'flex-1 flex items-center justify-center gap-1 rounded-lg px-2.5 py-1 text-xs transition-all cursor-pointer',
                  activeTab === 'all'
                    ? 'bg-white text-slate-900 font-extrabold shadow-2xs border border-slate-200'
                    : 'text-slate-600 hover:text-slate-900 font-semibold'
                )}
              >
                All
                <span className="ml-1 rounded-full bg-slate-200 text-slate-800 px-1.5 py-0.2 text-[10px] font-bold tabular-nums">
                  {items.length}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('unread')}
                className={cn(
                  'flex-1 flex items-center justify-center gap-1 rounded-lg px-2.5 py-1 text-xs transition-all cursor-pointer',
                  activeTab === 'unread'
                    ? 'bg-white text-slate-900 font-extrabold shadow-2xs border border-slate-200'
                    : 'text-slate-600 hover:text-slate-900 font-semibold'
                )}
              >
                Unread
                {unreadCount > 0 && (
                  <span className="ml-1 rounded-full bg-orange-500 text-white px-1.5 py-0.2 text-[10px] font-bold tabular-nums">
                    {unreadCount}
                  </span>
                )}
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('mentions')}
                className={cn(
                  'flex-1 flex items-center justify-center gap-1 rounded-lg px-2.5 py-1 text-xs transition-all cursor-pointer',
                  activeTab === 'mentions'
                    ? 'bg-white text-slate-900 font-extrabold shadow-2xs border border-slate-200'
                    : 'text-slate-600 hover:text-slate-900 font-semibold'
                )}
              >
                Mentions
                {mentionCount > 0 && (
                  <span className="ml-1 rounded-full bg-slate-200 text-slate-800 px-1.5 py-0.2 text-[10px] font-bold tabular-nums">
                    {mentionCount}
                  </span>
                )}
              </button>
            </div>
          </div>

          <CardContent className="p-0 bg-white">
            <div className="max-h-[340px] overflow-y-auto w-full divide-y divide-slate-100 bg-white rounded-xl">
              <UpdateList updates={filteredUpdates} onItemClick={handleItemClick} />
            </div>
          </CardContent>
        </div>
      </Card>
    </section>
  );
}

function UpdateList({ updates, onItemClick }: { updates: NotificationItem[]; onItemClick: (id: string) => void }) {
  if (updates.length === 0) {
    return (
      <div className="flex h-44 flex-col items-center justify-center gap-2 p-4 text-center bg-white">
        <div className="bg-slate-100 flex h-10 w-10 items-center justify-center rounded-full border border-slate-200">
          <RiBellFill className="text-slate-400 h-4.5 w-4.5" />
        </div>
        <p className="text-slate-600 text-xs font-bold">
          No notifications found
        </p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-slate-100 bg-white">
      {updates.map((update) => (
        <UpdateRow key={update.id} update={update} onClick={() => onItemClick(update.id)} />
      ))}
    </div>
  );
}

function UpdateRow({ update, onClick }: { update: NotificationItem; onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'group relative flex gap-3 px-3.5 py-3 transition-colors duration-150 cursor-pointer bg-white',
        update.isUnread ? 'bg-orange-50/40 hover:bg-orange-50/80' : 'hover:bg-slate-50',
      )}
    >
      <div className="relative flex-shrink-0 pt-0.5">
        <SimpleAvatar author={update.author} />
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-0.5 text-left">
        <div className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-1.5">
            <span className="text-slate-900 truncate text-xs font-bold">
              {update.author.name}
            </span>
            <Badge
              variant="outline"
              className={cn(
                'h-4 shrink-0 rounded-full px-1.5 text-[9px] font-bold',
                PriorityBadgeMap[update.priority],
              )}
            >
              {TypeLabelMap[update.type] || update.type}
            </Badge>
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            <span className="text-slate-400 text-[10px] font-semibold tabular-nums">
              {update.timestamp}
            </span>
            {update.isUnread && (
              <RiCircleFill className="text-orange-500 h-2 w-2" />
            )}
          </div>
        </div>

        <span className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">
          {update.project}
        </span>

        <p className="text-slate-800 text-xs leading-snug font-medium">
          {update.message}
        </p>
        {update.detail && (
          <div className="border border-slate-200/80 bg-slate-50 group-hover:bg-slate-100 mt-1 rounded-lg p-2 transition-colors">
            <p className="text-slate-600 text-[11px] leading-relaxed font-normal">
              {update.detail}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Notification2;


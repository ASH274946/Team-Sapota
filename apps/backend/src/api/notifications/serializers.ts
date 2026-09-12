import type {
  NotificationDto,
  UnreadCountDto,
  NotificationPreferencesDto,
} from './dto';

export function serializeNotification(n: any): NotificationDto {
  return {
    id: n.id,
    userId: n.userId,
    title: n.title,
    message: n.message,
    type: n.type,
    isRead: n.isRead ?? false,
    metadata: n.metadata,
    createdAt: n.createdAt,
  };
}

export function serializeUnreadCount(count: number): UnreadCountDto {
  return { count };
}

export function serializePreferences(prefs: any): NotificationPreferencesDto {
  return {
    emailNotifications: prefs?.emailNotifications ?? true,
    pushNotifications: prefs?.pushNotifications ?? true,
    digestFrequency: prefs?.digestFrequency ?? 'daily',
    types: prefs?.types ?? [],
  };
}

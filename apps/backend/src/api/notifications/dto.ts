export interface NotificationDto {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

export interface UnreadCountDto {
  count: number;
}

export interface SaveNotificationPreferencesDto {
  emailNotifications?: boolean;
  pushNotifications?: boolean;
  digestFrequency?: 'daily' | 'weekly' | 'never';
  types?: string[];
}

export interface NotificationPreferencesDto {
  emailNotifications: boolean;
  pushNotifications: boolean;
  digestFrequency: string;
  types: string[];
}

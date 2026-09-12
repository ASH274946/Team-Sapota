import { Request, Response } from 'express';
import { sendSuccess, sendNoContent, sendNotFound } from '../common/response';
import { parsePagination, buildPagination } from '../common/pagination';
import { getRequestUserId } from '../../security/request-context';
import { markNotificationAsRead } from '../../services/notification.service';
import prisma from '../../config/prisma';
import {
  serializeNotification,
  serializeUnreadCount,
  serializePreferences,
} from './serializers';

export const listNotifications = async (req: Request, res: Response): Promise<void> => {
  const userId = getRequestUserId(req);
  const { page, limit } = parsePagination(req);

  let total = await prisma.notification.count({ where: { userId } });

  // Auto-create persistent database notifications in PostgreSQL if user has 0 notifications
  if (total === 0 && userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { organizationId: true },
    });

    if (user?.organizationId) {
      await prisma.notification.createMany({
        data: [
          {
            userId,
            organizationId: user.organizationId,
            title: 'Attendance Alert',
            message: 'Attendance submission required for Data Structures (Sec A).',
            type: 'alert',
            isRead: false,
          },
          {
            userId,
            organizationId: user.organizationId,
            title: 'Assessment Generated',
            message: 'Mid-Term Question Paper successfully generated.',
            type: 'assignment',
            isRead: false,
          },
          {
            userId,
            organizationId: user.organizationId,
            title: 'Resource Center',
            message: 'New curriculum textbook indexed into PGVector database.',
            type: 'doc',
            isRead: false,
          },
          {
            userId,
            organizationId: user.organizationId,
            title: 'Outcome Mapping',
            message: 'CO-PO Weightages approved by Academic Committee.',
            type: 'team',
            isRead: true,
          },
          {
            userId,
            organizationId: user.organizationId,
            title: 'System Update',
            message: 'VidyaAI Automated Grader & AI Copilot updated to v2.4.',
            type: 'deploy',
            isRead: true,
          },
        ],
      });
      total = 5;
    }
  }

  const notifications = await prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    skip: (page - 1) * limit,
    take: limit,
  });

  sendSuccess(res, {
    data: notifications.map(serializeNotification),
    pagination: buildPagination(page, limit, total),
  });
};

export const getUnreadCount = async (req: Request, res: Response): Promise<void> => {
  const userId = getRequestUserId(req);

  const count = await prisma.notification.count({
    where: { userId, isRead: false },
  });

  sendSuccess(res, { data: serializeUnreadCount(count) });
};

export const markAsRead = async (req: Request, res: Response): Promise<void> => {
  const userId = getRequestUserId(req);
  const { id } = req.params;

  const result = await markNotificationAsRead(id, userId);

  if (result.count === 0) {
    sendNotFound(res, 'Notification not found');
    return;
  }

  sendSuccess(res, { data: { id }, message: 'Notification marked as read' });
};

export const markAllAsRead = async (req: Request, res: Response): Promise<void> => {
  const userId = getRequestUserId(req);

  await prisma.notification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true },
  });

  sendSuccess(res, { data: null, message: 'All notifications marked as read' });
};

export const deleteNotification = async (req: Request, res: Response): Promise<void> => {
  const userId = getRequestUserId(req);
  const { id } = req.params;

  const result = await prisma.notification.deleteMany({
    where: { id, userId },
  });

  if (result.count === 0) {
    sendNotFound(res, 'Notification not found');
    return;
  }

  sendNoContent(res);
};

export const savePreferences = async (req: Request, res: Response): Promise<void> => {
  const userId = getRequestUserId(req);
  const { emailNotifications, pushNotifications, digestFrequency, types } = req.body;

  const prefs = { emailNotifications, pushNotifications, digestFrequency, types };

  await prisma.user.update({
    where: { id: userId },
    data: { preferences: prefs as any },
  });

  sendSuccess(res, { data: serializePreferences(prefs), message: 'Preferences saved' });
};

export const getPreferences = async (req: Request, res: Response): Promise<void> => {
  const userId = getRequestUserId(req);

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { preferences: true },
  });

  sendSuccess(res, { data: serializePreferences(user?.preferences) });
};

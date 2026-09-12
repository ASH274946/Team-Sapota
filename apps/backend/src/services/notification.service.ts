import prisma from '../config/prisma';
import { logger } from '../utils/logger';
import { v4 as uuidv4 } from 'uuid';
// If a Socket.io server was configured we could emit events here
// import { getIO } from '../sockets/socket.server';

export interface SendNotificationPayload {
  userId: string;
  title: string;
  message: string;
  type: string;
  metadata?: Record<string, any>;
  organizationId?: string;
}

export async function sendNotification(payload: SendNotificationPayload) {
  try {
    const notification = await prisma.notification.create({
      data: {
        id: uuidv4(),
        userId: payload.userId,
        title: payload.title,
        message: payload.message,
        type: payload.type,
        organizationId: payload.organizationId || 'no-organization'
      }
    });

    // Optionally emit via WebSockets
    // const io = getIO();
    // io.to(`user_${payload.userId}`).emit('notification', notification);

    logger.info(`Notification sent to user ${payload.userId}: ${payload.title}`);
    return notification;
  } catch (error) {
    logger.error(`Failed to send notification: ${error instanceof Error ? error.message : String(error)}`);
    throw error;
  }
}

export async function getUserNotifications(userId: string, limit = 20) {
  return prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: limit
  });
}

export async function markNotificationAsRead(id: string, userId: string) {
  return prisma.notification.updateMany({
    where: { id, userId },
    data: { isRead: true }
  });
}

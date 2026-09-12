import prisma from '../config/prisma';
import { logger } from '../utils/logger';

export interface AuditLogPayload {
  userId?: string;
  organizationId?: string;
  action: string;
  entity?: string;
  entityId?: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, any>;
}

export class AuditService {
  static async logAuditEvent(payload: AuditLogPayload): Promise<void> {
    try {
      await prisma.auditLog.create({
        data: {
          userId: payload.userId || null,
          organizationId: payload.organizationId || null,
          action: payload.action,
          entity: payload.entity || null,
          entityId: payload.entityId || null,
          ipAddress: payload.ipAddress || 'unknown',
          userAgent: payload.userAgent || 'unknown',
          metadata: payload.metadata ? payload.metadata : undefined,
        },
      });
    } catch (error) {
      logger.error(`[AuditService] Failed to log event: ${error}`);
    }
  }

  static async pruneOldLogs(daysRetained: number = 15): Promise<void> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysRetained);
      const result = await prisma.auditLog.deleteMany({
        where: {
          createdAt: {
            lt: cutoffDate
          }
        }
      });
      if (result.count > 0) {
        logger.info(`[AuditService] Pruned ${result.count} audit logs older than ${daysRetained} days.`);
      }
    } catch (error) {
      logger.error(`[AuditService] Failed to prune logs: ${error}`);
    }
  }

  static async logAction(data: {
    userId?: string;
    action: string;
    ipAddress?: string;
    userAgent?: string;
    metadata?: any;
  }) {
    try {
      return await prisma.auditLog.create({
        data: {
          userId: data.userId || null,
          action: data.action,
          ipAddress: data.ipAddress || '127.0.0.1',
          userAgent: data.userAgent || 'unknown',
          metadata: data.metadata || {},
        },
      });
    } catch (error) {
      logger.error(`[AuditService] Failed to log action: ${error}`);
      throw error;
    }
  }

  static async getLogs(filters?: {
    userId?: string;
    action?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
    skip?: number;
  }) {
    const limit = filters?.limit || 50;
    const skip = filters?.skip || 0;

    const where: any = {};
    if (filters?.userId) where.userId = filters.userId;
    if (filters?.action) where.action = filters.action;
    if (filters?.startDate || filters?.endDate) {
      where.createdAt = {};
      if (filters.startDate) where.createdAt.gte = new Date(filters.startDate);
      if (filters.endDate) where.createdAt.lte = new Date(filters.endDate);
    }

    return prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip,
    });
  }
}

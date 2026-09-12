import { AccessToken } from 'livekit-server-sdk';
import prisma from '../config/prisma';
import { logger } from '../utils/logger';

export class VoiceService {
  static async createVoiceRoom(name: string, type: string, createdById: string, organizationId?: string) {
    try {
      return prisma.voiceRoom.create({
        data: { name, type, createdById, organizationId },
        include: {
          createdBy: { select: { id: true, firstName: true, lastName: true } },
          _count: { select: { participants: { where: { leftAt: null } } } },
        },
      });
    } catch (err: any) {
      if (err.code === 'P2002') {
        throw new Error('A voice room with this name already exists');
      }
      throw err;
    }
  }

  static async getActiveRooms(organizationId?: string) {
    try {
      const rooms = await prisma.voiceRoom.findMany({
        where: {
          isActive: true,
          ...(organizationId && { organizationId }),
        },
        include: {
          createdBy: { select: { id: true, firstName: true, lastName: true } },
          participants: {
            where: { leftAt: null },
            include: { user: { select: { id: true, firstName: true, lastName: true } } },
          },
          _count: { select: { participants: { where: { leftAt: null } } } },
        },
        orderBy: { createdAt: 'desc' },
      });

      return rooms.map(room => ({
        id: room.id,
        name: room.name,
        type: room.type,
        isActive: room.isActive,
        createdAt: room.createdAt,
        createdBy: room.createdBy,
        organizationId: room.organizationId,
        participantCount: room._count.participants,
        participants: room.participants.map(p => ({
          userId: p.userId,
          name: `${p.user.firstName} ${p.user.lastName}`,
          joinedAt: p.joinedAt,
        })),
      }));
    } catch (err) {
      logger.error(err, '[VoiceService] Error fetching active rooms');
      throw new Error('Failed to fetch active rooms');
    }
  }

  static async joinRoom(roomId: string, userId: string) {
    try {
      // Verify room exists and is active
      const room = await prisma.voiceRoom.findUnique({ where: { id: roomId } });
      if (!room) throw new Error('Room not found');
      if (!room.isActive) throw new Error('Room is no longer active');

      // Upsert: re-join if they left before
      return prisma.voiceRoomParticipant.upsert({
        where: { roomId_userId: { roomId, userId } },
        update: { leftAt: null, joinedAt: new Date() },
        create: { roomId, userId },
      });
    } catch (err: any) {
      logger.error(err, '[VoiceService] Error joining room');
      throw err;
    }
  }

  static async leaveRoom(roomId: string, userId: string) {
    try {
      return prisma.voiceRoomParticipant.updateMany({
        where: { roomId, userId, leftAt: null },
        data: { leftAt: new Date() },
      });
    } catch (err: any) {
      logger.error(err, '[VoiceService] Error leaving room');
      throw err;
    }
  }

  static async closeRoom(roomId: string, userId: string) {
    try {
      // Mark room inactive — only the creator can close
      const room = await prisma.voiceRoom.findUnique({ where: { id: roomId } });
      if (!room) throw new Error('Room not found');
      if (room.createdById !== userId) throw new Error('Only the creator can close a room');
      return prisma.voiceRoom.update({
        where: { id: roomId },
        data: { isActive: false },
      });
    } catch (err: any) {
      logger.error(err, '[VoiceService] Error closing room');
      throw err;
    }
  }

  static generateToken(roomName: string, participantName: string, participantIdentity: string): Promise<string> {
    try {
      const apiKey = process.env.LIVEKIT_API_KEY || 'devkey';
      const apiSecret = process.env.LIVEKIT_API_SECRET || 'secret';

      const at = new AccessToken(apiKey, apiSecret, {
        identity: participantIdentity,
        name: participantName,
      });
      at.addGrant({ roomJoin: true, room: roomName, canPublish: true, canSubscribe: true });
      return Promise.resolve(at.toJwt());
    } catch (err: any) {
      logger.error(err, '[VoiceService] Error generating token');
      throw new Error('Failed to generate voice room token');
    }
  }

  static getLiveKitUrl(): string {
    return process.env.LIVEKIT_URL || 'wss://vidyaai-2i2x11ot.livekit.cloud';
  }
}

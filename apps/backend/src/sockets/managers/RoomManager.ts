import { Server as SocketIOServer, Socket } from 'socket.io';
import { logger } from '../../utils/logger';

export class RoomManager {
  private io: SocketIOServer;

  constructor(io: SocketIOServer) {
    this.io = io;
  }

  joinRoom(socket: Socket, roomId: string) {
    // Basic validation
    if (!roomId || typeof roomId !== 'string') return;
    
    const formattedRoomId = `group:${roomId}`;
    socket.join(formattedRoomId);
    logger.debug(`[RoomManager] Socket ${socket.id} (User: ${socket.data.userId}) joined room ${formattedRoomId}`);
  }

  leaveRoom(socket: Socket, roomId: string) {
    if (!roomId) return;
    const formattedRoomId = `group:${roomId}`;
    socket.leave(formattedRoomId);
    logger.debug(`[RoomManager] Socket ${socket.id} (User: ${socket.data.userId}) left room ${formattedRoomId}`);
  }

  getUsersInRoom(roomId: string): string[] {
    const formattedRoomId = `group:${roomId}`;
    const sockets = this.io.sockets.adapter.rooms.get(formattedRoomId);
    if (!sockets) return [];

    const userIds = new Set<string>();
    for (const socketId of sockets) {
      const socket = this.io.sockets.sockets.get(socketId);
      if (socket && socket.data.userId) {
        userIds.add(socket.data.userId);
      }
    }
    return Array.from(userIds);
  }
}

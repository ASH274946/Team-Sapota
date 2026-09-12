import { Server as SocketIOServer } from 'socket.io';
import { logger } from '../../utils/logger';

export class PresenceManager {
  private io: SocketIOServer;

  // We rely on the ConnectionManager to ensure uniqueness.
  // This manager simply broadcasts presence states.
  constructor(io: SocketIOServer) {
    this.io = io;
  }

  markOnline(userId: string) {
    logger.debug(`[PresenceManager] Broadcasting USER_ONLINE for ${userId}`);
    this.io.emit('presence:online', { userId });
  }

  markOffline(userId: string) {
    // Add a slight debounce to prevent UI flickering on temporary network drops
    setTimeout(() => {
      // In a real clustered environment, we'd check Redis to see if they reconnected on another node.
      // For now, we trust the ConnectionManager state (if we check it here, but we'll just emit).
      logger.debug(`[PresenceManager] Broadcasting USER_OFFLINE for ${userId}`);
      this.io.emit('presence:offline', { userId });
    }, 2000);
  }

  syncRoomPresence(roomId: string, onlineUserIds: string[]) {
    // Allows sending the full state to a room (e.g. when someone joins)
    this.io.to(`group:${roomId}`).emit('presence:sync', { onlineUserIds });
  }
}

import { Server as SocketIOServer, Socket } from 'socket.io';
import { CommunityService } from '../../services/community.service';
import { logger } from '../../utils/logger';

export class MessageManager {
  private io: SocketIOServer;
  
  // Track typing timeouts to auto-clear stuck indicators
  private typingTimeouts = new Map<string, NodeJS.Timeout>();

  constructor(io: SocketIOServer) {
    this.io = io;
  }

  async handleSendMessage(socket: Socket, payload: { groupId: string; content: string; tempId?: string }) {
    const userId = socket.data.userId;
    if (!userId || !payload.groupId || !payload.content) return;

    try {
      // 1. Persist to database (handles validation)
      const message = await CommunityService.sendGroupMessage(
        payload.groupId,
        userId,
        payload.content,
        []
      );

      // 2. Broadcast to the room (NEW_MESSAGE)
      // Note: In a fully optimistic UI, we might include the tempId so the sender knows which one to replace,
      // but typically the client can just rely on the REST API response for their own sent message,
      // or we can attach tempId to the broadcast. We will attach it.
      const broadcastPayload = {
        ...message,
        tempId: payload.tempId // Pass it back so the sender can reconcile
      };

      this.io.to(`group:${payload.groupId}`).emit('chat:message', broadcastPayload);

      // Stop typing automatically when a message is sent
      this.handleTyping(socket, { groupId: payload.groupId, isTyping: false });
    } catch (error) {
      logger.error(`[MessageManager] Failed to send message: ${error}`);
      // Optional: Emit an error event back to the sender
      socket.emit('chat:error', { tempId: payload.tempId, error: 'Failed to send message' });
    }
  }

  handleTyping(socket: Socket, payload: { groupId: string; isTyping: boolean }) {
    const userId = socket.data.userId;
    if (!userId || !payload.groupId) return;

    const timeoutKey = `${payload.groupId}:${userId}`;

    // Clear any existing timeout
    if (this.typingTimeouts.has(timeoutKey)) {
      clearTimeout(this.typingTimeouts.get(timeoutKey)!);
      this.typingTimeouts.delete(timeoutKey);
    }

    // Broadcast state
    socket.to(`group:${payload.groupId}`).emit('chat:typing', {
      userId,
      isTyping: payload.isTyping,
    });

    // If they are typing, set a timeout to auto-clear after 3 seconds
    if (payload.isTyping) {
      const timeout = setTimeout(() => {
        socket.to(`group:${payload.groupId}`).emit('chat:typing', {
          userId,
          isTyping: false,
        });
        this.typingTimeouts.delete(timeoutKey);
      }, 3000);
      this.typingTimeouts.set(timeoutKey, timeout);
    }
  }
}

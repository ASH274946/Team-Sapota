import { Server as SocketIOServer, Socket } from 'socket.io';


export class ConnectionManager {
  private io: SocketIOServer;
  // Maps userId to a Set of active socketIds
  private activeUsers = new Map<string, Set<string>>();

  constructor(io: SocketIOServer) {
    this.io = io;
  }

  handleConnection(socket: Socket, userId: string) {
    const userSockets = this.activeUsers.get(userId) || new Set<string>();
    userSockets.add(socket.id);
    this.activeUsers.set(userId, userSockets);
    socket.data.userId = userId;
  }

  handleDisconnect(socket: Socket) {
    const userId = socket.data.userId;
    if (userId) {
      const userSockets = this.activeUsers.get(userId);
      if (userSockets) {
        userSockets.delete(socket.id);
        if (userSockets.size === 0) {
          this.activeUsers.delete(userId);
        }
      }
    }
  }

  isUserConnected(userId: string): boolean {
    return this.activeUsers.has(userId) && this.activeUsers.get(userId)!.size > 0;
  }

  getActiveSocketId(userId: string): string | undefined {
    // Just return the first one if needed, or undefined if none
    const userSockets = this.activeUsers.get(userId);
    if (userSockets && userSockets.size > 0) {
      return Array.from(userSockets)[0];
    }
    return undefined;
  }
}

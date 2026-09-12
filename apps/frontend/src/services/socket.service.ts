import { io, Socket } from 'socket.io-client';
import { useSocketStore } from '../store/socket.store';

class SocketService {
  private socket: Socket | null = null;
  private currentUserId: string | null = null;

  public connect(userId: string) {
    if (this.socket?.connected && this.currentUserId === userId) {
      return; // Already connected with the correct user
    }

    if (this.socket) {
      this.disconnect();
    }

    this.currentUserId = userId;
    
    const url = process.env.NEXT_PUBLIC_SOCKET_URL || process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') || 'http://localhost:3001';
    
    this.socket = io(url, {
      withCredentials: true,
      transports: ['websocket', 'polling'], // Fallback safely
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
    });

    this.setupListeners();
  }

  private setupListeners() {
    if (!this.socket) return;
    const store = useSocketStore.getState();

    this.socket.on('connect', () => {
      store.setConnected(true);
      // Automatically authenticate upon connection or reconnection
      if (this.currentUserId) {
        this.socket!.emit('authenticate', { userId: this.currentUserId });
      }
      
      // If we were in a room, immediately rejoin to resume the stream
      const activeRoom = store.activeRoom;
      if (activeRoom) {
        this.socket!.emit('join:group', { groupId: activeRoom });
      }
    });

    this.socket.on('disconnect', () => {
      store.setConnected(false);
    });

    // Presence Listeners
    this.socket.on('presence:online', ({ userId }: { userId: string }) => {
      useSocketStore.getState().setUserPresence(userId, 'ONLINE');
    });

    this.socket.on('presence:offline', ({ userId }: { userId: string }) => {
      useSocketStore.getState().setUserPresence(userId, 'OFFLINE');
    });

    this.socket.on('presence:sync', ({ onlineUserIds }: { onlineUserIds: string[] }) => {
      useSocketStore.getState().syncPresence(onlineUserIds);
    });

    // Chat Listeners
    this.socket.on('chat:message', (message: any) => {
      useSocketStore.getState().receiveMessage(message);
    });

    this.socket.on('chat:typing', ({ userId, isTyping }: { userId: string, isTyping: boolean }) => {
      useSocketStore.getState().setTyping(userId, isTyping);
    });
    
    this.socket.on('chat:error', ({ tempId, error }: { tempId?: string, error: string }) => {
      if (tempId) {
        useSocketStore.getState().markMessageFailed(tempId);
      }
    });
  }

  public disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.currentUserId = null;
    useSocketStore.getState().setConnected(false);
  }

  public joinRoom(groupId: string) {
    useSocketStore.getState().setActiveRoom(groupId);
    this.socket?.emit('join:group', { groupId });
  }

  public leaveRoom(groupId: string) {
    useSocketStore.getState().setActiveRoom(null);
    this.socket?.emit('leave:group', { groupId });
  }

  public sendMessage(groupId: string, content: string, tempId: string) {
    this.socket?.emit('chat:send_message', { groupId, content, tempId });
  }

  public sendTyping(groupId: string, isTyping: boolean) {
    this.socket?.emit('typing', { groupId, isTyping });
  }
}

export const socketService = new SocketService();

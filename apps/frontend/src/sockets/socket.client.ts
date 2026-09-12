import { io, type Socket } from 'socket.io-client';
import { resolveSocketUrl } from '@/utils/url';

const isSocketDebugEnabled =
  process.env.NODE_ENV !== 'production' || process.env.NEXT_PUBLIC_API_DEBUG === 'true';

let socket: Socket | null = null;
let reconnectCount = 0;
const subscriptions = new Set<string>();

export function getSocket(): Socket {
  if (!socket) {
    const socketURL = resolveSocketUrl();

    if (isSocketDebugEnabled) {
      console.log('[SOCKET CONNECT]', { socketURL });
    }

    socket = io(socketURL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 20,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 15000,
      randomizationFactor: 0.5,
      timeout: 20000,
      autoConnect: false,
      withCredentials: true,
    });

    socket.on('connect', () => {
      reconnectCount = 0;
      for (const id of subscriptions) {
        socket?.emit('subscribe:assignment', { assignmentId: id });
      }
    });

    socket.on('disconnect', (reason) => {
      if (reason === 'io server disconnect') {
        socket?.connect();
      }
    });

    socket.io.on('reconnect_attempt', () => {
      reconnectCount++;
    });

    socket.io.on('reconnect_error', () => {
      if (reconnectCount >= 20) {
        socket?.close();
      }
    });

    socket.on('connect_error', () => {
      const s = socket;
      if (s && reconnectCount >= 3 && s.io.opts.transports?.[0] !== 'polling') {
        s.io.opts.transports = ['polling', 'websocket'];
      }
    });

    socket.connect();
  }
  return socket;
}

export function subscribeToAssignment(assignmentId: string): void {
  subscriptions.add(assignmentId);
  const s = getSocket();
  if (s.connected) {
    s.emit('subscribe:assignment', { assignmentId });
  }
}

export function unsubscribeFromAssignment(assignmentId: string): void {
  subscriptions.delete(assignmentId);
  const s = getSocket();
  if (s.connected) {
    s.emit('unsubscribe:assignment', { assignmentId });
  }
}

export function disconnectSocket(): void {
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket.close();
    socket = null;
    reconnectCount = 0;
    subscriptions.clear();
  }
}

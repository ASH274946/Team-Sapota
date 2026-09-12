import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

const isDev = process.env.NODE_ENV !== 'production';

export const initSocket = (token?: string) => {
  if (socket) return socket;

  const serverUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  
  socket = io(serverUrl, {
    auth: { token },
    transports: ['websocket', 'polling'],
  });

  if (isDev) {
    socket.on('connect', () => {
      console.log('[Socket] Connected');
    });
    socket.on('disconnect', () => {
      console.log('[Socket] Disconnected');
    });
  }

  return socket;
};

export const getSocket = () => socket;

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

import { Server as SocketIOServer } from 'socket.io';
import type { Server as HTTPServer } from 'http';
import type { ServerToClientEvents, ClientToServerEvents } from '../types/socket.types';
import { env } from '../config/env';
import { logger } from '../utils/logger';

// Managers
import { ConnectionManager } from './managers/ConnectionManager';
import { RoomManager } from './managers/RoomManager';
import { PresenceManager } from './managers/PresenceManager';
import { MessageManager } from './managers/MessageManager';
import { registerTutorSocketHandlers } from './tutor.socket';

let io: SocketIOServer<ClientToServerEvents, ServerToClientEvents> | null = null;
let connectionManager: ConnectionManager | null = null;
let roomManager: RoomManager | null = null;
let presenceManager: PresenceManager | null = null;
let messageManager: MessageManager | null = null;

const ASSIGNMENT_ID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const SUBSCRIBE_WINDOW_MS = 10_000;
const MAX_SUBSCRIBES_PER_WINDOW = 30;
const MAX_ROOMS_PER_SOCKET = 50;

function isValidAssignmentId(value: unknown): value is string {
  return typeof value === 'string' && ASSIGNMENT_ID_RE.test(value.trim());
}

function parseOrigins(raw: string): string[] {
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => s.replace(/\/+$/, ''));
}

function isAllowedVercelPreview(hostname: string): boolean {
  // Only the specific production preview domain — no wildcard subdomains (CSWSH risk).
  return hostname === 'vedaai-ed.vercel.app';
}

function isAllowedSocketOrigin(origin: string, allowedOrigins: string[]): boolean {
  const normalized = origin.replace(/\/+$/, '');
  if (allowedOrigins.includes(normalized)) return true;
  try {
    return isAllowedVercelPreview(new URL(normalized).hostname);
  } catch {
    return false;
  }
}

export function initializeSocketServer(
  httpServer: HTTPServer
): SocketIOServer<ClientToServerEvents, ServerToClientEvents> {
  if (io) {
    logger.warn('Socket.IO already initialized — returning existing instance');
    return io;
  }

  const corsOrigins = [
    'http://localhost:3000',
    'http://localhost:5173',
    ...(env.SOCKET_CORS_ORIGIN ? parseOrigins(env.SOCKET_CORS_ORIGIN) : parseOrigins(env.FRONTEND_URL)),
  ];

  io = new SocketIOServer<ClientToServerEvents, ServerToClientEvents>(httpServer, {
    cors: {
      origin: (origin, callback) => {
        // Browsers always send Origin on CORS requests. A missing Origin means a
        // non-browser client. With credentials enabled, reject in production to avoid
        // cross-site WebSocket hijacking; allow only in development.
        if (!origin) return callback(null, env.NODE_ENV !== 'production');
        callback(null, isAllowedSocketOrigin(origin, corsOrigins));
      },
      methods: ['GET', 'POST'],
      credentials: true,
    },
    transports: ['websocket', 'polling'],
    pingTimeout: 30000,
    pingInterval: 12000,
    maxHttpBufferSize: 1e6,
    allowUpgrades: true,
    cookie: {
      name: 'vidyaai-socket',
      httpOnly: true,
      sameSite: 'lax',
      secure: env.NODE_ENV === 'production',
    },
  });

  // Initialize Managers
  connectionManager = new ConnectionManager(io);
  roomManager = new RoomManager(io);
  presenceManager = new PresenceManager(io);
  messageManager = new MessageManager(io);

  io.on('connection', (socket) => {
    logger.debug(`Socket connected: ${socket.id} (transport: ${socket.conn.transport.name})`);
    
    // Rate Limiting Logic for assignments
    let subscribeCount = 0;
    let windowStart = Date.now();

    const canSubscribe = (): boolean => {
      const now = Date.now();
      if (now - windowStart > SUBSCRIBE_WINDOW_MS) {
        windowStart = now;
        subscribeCount = 0;
      }
      subscribeCount += 1;
      return subscribeCount <= MAX_SUBSCRIBES_PER_WINDOW;
    };

    socket.on('subscribe:assignment', ({ assignmentId }) => {
      if (!canSubscribe()) {
        logger.warn(`Socket ${socket.id} exceeded subscribe rate limit and was disconnected`);
        socket.disconnect(true);
        return;
      }
      if (!isValidAssignmentId(assignmentId)) {
        logger.warn(`Socket ${socket.id} attempted invalid assignment subscription: ${String(assignmentId)}`);
        return;
      }
      if (socket.rooms.size > MAX_ROOMS_PER_SOCKET) {
        logger.warn(`Socket ${socket.id} exceeded room cap and was disconnected`);
        socket.disconnect(true);
        return;
      }
      socket.join(`assignment:${assignmentId.trim()}`);
    });

    socket.on('unsubscribe:assignment', ({ assignmentId }) => {
      if (!isValidAssignmentId(assignmentId)) return;
      socket.leave(`assignment:${assignmentId.trim()}`);
    });

    // --- Real-time Group Chat & Presence ---
    
    socket.on('authenticate', ({ userId }) => {
      if (!userId) return;
      const wasAlreadyConnected = connectionManager!.isUserConnected(userId);
      
      connectionManager!.handleConnection(socket, userId);
      
      // If it's a completely new connection for this user across all tabs
      if (!wasAlreadyConnected) {
        presenceManager!.markOnline(userId);
      }
    });

    socket.on('join:group', ({ groupId }) => {
      roomManager!.joinRoom(socket, groupId);
      // Let the newly joined socket know who else is online in this room right now
      // (Optimization: In a massive scale app, we'd query Redis. Here, we just query RoomManager + ConnectionManager)
      const userIdsInRoom = roomManager!.getUsersInRoom(groupId);
      const onlineUserIds = userIdsInRoom.filter(id => connectionManager!.isUserConnected(id));
      
      socket.emit('presence:sync', { onlineUserIds });
    });

    socket.on('leave:group', ({ groupId }) => {
      roomManager!.leaveRoom(socket, groupId);
    });

    socket.on('chat:send_message', (payload) => {
      messageManager!.handleSendMessage(socket, payload);
    });

    socket.on('typing', (payload) => {
      messageManager!.handleTyping(socket, payload);
    });

    registerTutorSocketHandlers(socket);

    socket.on('disconnect', (reason) => {
      const userId = socket.data.userId;
      if (userId) {
        connectionManager!.handleDisconnect(socket);
        
        // If this was the last active socket for this user, they are truly offline
        if (!connectionManager!.isUserConnected(userId)) {
          presenceManager!.markOffline(userId);
        }
      }
      logger.debug(`Socket disconnected: ${socket.id} (${reason})`);
    });
  });

  return io;
}

export function getSocketServer(): SocketIOServer<ClientToServerEvents, ServerToClientEvents> {
  if (!io) throw new Error('Socket server not initialized');
  return io;
}

export function emitToAssignment<E extends keyof ServerToClientEvents>(
  assignmentId: string,
  event: E,
  payload: Parameters<ServerToClientEvents[E]>[0]
): void {
  if (!io) return;
  (io.to(`assignment:${assignmentId}`) as { emit: (ev: string, data: unknown) => void }).emit(event as any, payload);
}

export function emitToConversation(
  conversationId: string,
  event: string,
  payload: any
): void {
  if (!io) return;
  io.to(`conversation:${conversationId}`).emit(event as any, payload);
}

export function emitToGroup(groupId: string, event: string, payload: any) {
  if (!io) return;
  io.to(`group:${groupId}`).emit(event as any, payload);
}

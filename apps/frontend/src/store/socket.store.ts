import { create } from 'zustand';

export interface ChatMessage {
  id: string;
  conversationId?: string; // Group ID
  senderId: string;
  sender?: {
    id: string;
    firstName: string;
    lastName: string;
    avatar?: string;
  };
  message?: string;
  content?: string;
  attachments?: any;
  createdAt: string;
  // Meta state for optimistic UI
  status?: 'sending' | 'delivered' | 'failed';
  tempId?: string; 
}

interface SocketState {
  connected: boolean;
  activeRoom: string | null;
  presence: Record<string, 'ONLINE' | 'OFFLINE' | 'AWAY'>;
  typingUsers: Set<string>;
  messages: ChatMessage[];
  
  // Actions
  setConnected: (connected: boolean) => void;
  setActiveRoom: (roomId: string | null) => void;
  
  // Presence
  setUserPresence: (userId: string, status: 'ONLINE' | 'OFFLINE' | 'AWAY') => void;
  syncPresence: (userIds: string[]) => void;
  
  // Typing
  setTyping: (userId: string, isTyping: boolean) => void;
  
  // Messages
  setInitialMessages: (messages: ChatMessage[]) => void;
  addOptimisticMessage: (msg: ChatMessage) => void;
  receiveMessage: (msg: ChatMessage) => void;
  markMessageFailed: (tempId: string) => void;
}

export const useSocketStore = create<SocketState>((set) => ({
  connected: false,
  activeRoom: null,
  presence: {},
  typingUsers: new Set(),
  messages: [],
  
  setConnected: (connected) => set({ connected }),
  
  setActiveRoom: (activeRoom) => set({ activeRoom }),
  
  setUserPresence: (userId, status) => set((state) => ({
    presence: { ...state.presence, [userId]: status }
  })),
  
  syncPresence: (userIds) => set((state) => {
    const newPresence = { ...state.presence };
    // Set all to offline first (basic reconcile)
    Object.keys(newPresence).forEach(id => newPresence[id] = 'OFFLINE');
    // Set active ones online
    userIds.forEach(id => newPresence[id] = 'ONLINE');
    return { presence: newPresence };
  }),
  
  setTyping: (userId, isTyping) => set((state) => {
    const newTyping = new Set(state.typingUsers);
    if (isTyping) {
      newTyping.add(userId);
    } else {
      newTyping.delete(userId);
    }
    return { typingUsers: newTyping };
  }),
  
  setInitialMessages: (messages) => set({ messages }),
  
  addOptimisticMessage: (msg) => set((state) => ({
    messages: [...state.messages, msg]
  })),
  
  receiveMessage: (msg) => set((state) => {
    // If the message has a tempId, it means it's an ACK for an optimistic message
    if (msg.tempId) {
      const idx = state.messages.findIndex(m => m.tempId === msg.tempId || m.id === msg.tempId);
      if (idx !== -1) {
        const newMessages = [...state.messages];
        newMessages[idx] = { ...msg, status: 'delivered' as const };
        // Sort explicitly by createdAt to ensure ordering
        newMessages.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        return { messages: newMessages };
      }
    }
    // Otherwise it's a new message from someone else, or a normal append
    // Avoid exact duplicate IDs just in case
    if (state.messages.some(m => m.id === msg.id)) {
      return state;
    }
    const newMessages = [...state.messages, { ...msg, status: 'delivered' as const }];
    newMessages.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    return { messages: newMessages };
  }),
  
  markMessageFailed: (tempId) => set((state) => {
    const idx = state.messages.findIndex(m => m.tempId === tempId || m.id === tempId);
    if (idx !== -1) {
      const newMessages = [...state.messages];
      newMessages[idx] = { ...newMessages[idx], status: 'failed' };
      return { messages: newMessages };
    }
    return state;
  })
}));

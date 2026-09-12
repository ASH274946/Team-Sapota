import { useEffect } from 'react';
import { socketService } from '../services/socket.service';

export function useGroupSocket(userId: string | undefined, groupId: string | undefined) {
  useEffect(() => {
    if (!userId || !groupId) return;

    // Connect to the socket server (Service handles deduplication)
    socketService.connect(userId);
    
    // Join the specific room
    socketService.joinRoom(groupId);

    return () => {
      // Leave room on unmount to clean up presence and broadcast
      socketService.leaveRoom(groupId);
      // Note: We don't necessarily call disconnect() here if we want to keep the socket alive
      // across navigation, but if we want strictly 1 socket per page, we could.
      // Leaving it alive is usually better for UX (instant reconnects across tabs).
    };
  }, [userId, groupId]);

  return {
    sendMessage: (content: string, tempId: string) => {
      if (groupId) {
        socketService.sendMessage(groupId, content, tempId);
      }
    },
    sendTyping: (isTyping: boolean) => {
      if (groupId) {
        socketService.sendTyping(groupId, isTyping);
      }
    }
  };
}

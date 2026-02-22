/**
 * Socket.io Client Wrapper
 * Manages WebSocket connection to chat server
 */

import { io, Socket } from 'socket.io-client';
import { CLIENT_EVENTS, SERVER_EVENTS } from '../../server/socket/events';

// Singleton socket instance
let socket: Socket | null = null;

/**
 * Get Socket.io server URL from environment
 */
function getSocketUrl(): string {
  // In production, this should be wss://chat.primewear.lk
  // In development, it's http://localhost:3001
  return process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001';
}

/**
 * Get access token from cookies
 */
function getAccessToken(): string | null {
  if (typeof document === 'undefined') return null;

  const match = document.cookie.match(/accessToken=([^;]+)/);
  return match ? match[1] : null;
}

/**
 * Connect to Socket.io server
 * @param token - Optional JWT token (will use cookie if not provided)
 * @returns Socket instance
 */
export function connectSocket(token?: string): Socket {
  // If already connected, return existing socket
  if (socket?.connected) {
    console.log('[Socket.io Client] Already connected');
    return socket;
  }

  // Get token
  const authToken = token || getAccessToken();

  if (!authToken) {
    console.error('[Socket.io Client] No access token found');
    throw new Error('Authentication token required to connect to chat');
  }

  const socketUrl = getSocketUrl();

  console.log('[Socket.io Client] Connecting to:', socketUrl);

  // Create socket connection
  socket = io(socketUrl, {
    auth: {
      token: authToken,
    },
    transports: ['websocket', 'polling'], // WebSocket preferred, polling fallback
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    timeout: 20000,
  });

  // Connection events
  socket.on('connect', () => {
    console.log('[Socket.io Client] Connected to chat server');
  });

  socket.on('disconnect', (reason) => {
    console.log('[Socket.io Client] Disconnected:', reason);

    if (reason === 'io server disconnect') {
      // Server kicked us out, try to reconnect
      socket?.connect();
    }
  });

  socket.on('connect_error', (error) => {
    console.error('[Socket.io Client] Connection error:', error.message);
  });

  socket.on('reconnect', (attemptNumber) => {
    console.log(`[Socket.io Client] Reconnected after ${attemptNumber} attempt(s)`);
  });

  socket.on('reconnect_failed', () => {
    console.error('[Socket.io Client] Failed to reconnect after all attempts');
  });

  socket.on('reconnect_error', (error) => {
    console.error('[Socket.io Client] Reconnection error:', error.message);
  });

  return socket;
}

/**
 * Disconnect from Socket.io server
 */
export function disconnectSocket(): void {
  if (socket) {
    console.log('[Socket.io Client] Disconnecting from chat server');
    socket.disconnect();
    socket = null;
  }
}

/**
 * Get current socket instance
 * @returns Socket instance or null if not connected
 */
export function getSocket(): Socket | null {
  return socket;
}

/**
 * Check if socket is connected
 */
export function isSocketConnected(): boolean {
  return socket?.connected || false;
}

/**
 * Emit an event to the server
 * @param event - Event name
 * @param data - Event data
 */
export function emit(event: string, data?: any): void {
  if (!socket) {
    // Socket not initialized - this is normal if Socket.io server isn't running
    // Just log as debug, not error
    if (process.env.NODE_ENV === 'development') {
      console.debug('[Socket.io Client] Socket not initialized, skipping emit:', event);
    }
    return;
  }

  if (!socket.connected) {
    // Socket not connected - this is normal if Socket.io server isn't running
    if (process.env.NODE_ENV === 'development') {
      console.debug('[Socket.io Client] Socket not connected, skipping emit:', event);
    }
    return;
  }

  socket.emit(event, data);
}

/**
 * Listen to an event from the server
 * @param event - Event name
 * @param callback - Event handler
 * @returns Cleanup function
 */
export function on(event: string, callback: (...args: any[]) => void): () => void {
  if (!socket) {
    // Socket not initialized - return no-op cleanup
    if (process.env.NODE_ENV === 'development') {
      console.debug('[Socket.io Client] Socket not initialized, skipping listener:', event);
    }
    return () => {};
  }

  socket.on(event, callback);

  // Return cleanup function
  return () => {
    socket?.off(event, callback);
  };
}

/**
 * Remove event listener
 * @param event - Event name
 * @param callback - Optional specific callback to remove
 */
export function off(event: string, callback?: (...args: any[]) => void): void {
  if (!socket) return;

  if (callback) {
    socket.off(event, callback);
  } else {
    socket.off(event);
  }
}

/**
 * Send a message to a chat room
 * @param roomId - Chat room ID
 * @param content - Message content
 * @param tempId - Temporary ID for optimistic updates
 */
export function sendMessage(roomId: string, content: string, tempId?: string): void {
  emit(CLIENT_EVENTS.SEND_MESSAGE, { roomId, content, tempId });
}

/**
 * Join a chat room
 * @param roomId - Chat room ID
 */
export function joinRoom(roomId: string): void {
  emit(CLIENT_EVENTS.JOIN_ROOM, { roomId });
}

/**
 * Leave a chat room
 * @param roomId - Chat room ID
 */
export function leaveRoom(roomId: string): void {
  emit(CLIENT_EVENTS.LEAVE_ROOM, { roomId });
}

/**
 * Send typing start indicator
 * @param roomId - Chat room ID
 */
export function sendTypingStart(roomId: string): void {
  emit(CLIENT_EVENTS.TYPING_START, { roomId });
}

/**
 * Send typing stop indicator
 * @param roomId - Chat room ID
 */
export function sendTypingStop(roomId: string): void {
  emit(CLIENT_EVENTS.TYPING_STOP, { roomId });
}

/**
 * Mark messages as read in a room
 * @param roomId - Chat room ID
 */
export function markMessagesAsRead(roomId: string): void {
  emit(CLIENT_EVENTS.MARK_AS_READ, { roomId });
}

// ==================== NOTIFICATION HELPERS ====================

/**
 * Subscribe to notification events (request current unread count)
 */
export function subscribeToNotifications(): void {
  emit(CLIENT_EVENTS.NOTIFICATIONS_SUBSCRIBE);
}

/**
 * Mark notification as read
 * @param notificationId - Notification ID
 */
export function markNotificationAsRead(notificationId: string): void {
  emit(CLIENT_EVENTS.NOTIFICATION_READ, notificationId);
}

/**
 * Listen for new notifications
 * @param callback - Handler for new notifications
 * @returns Cleanup function
 */
export function onNewNotification(callback: (notification: any) => void): () => void {
  return on(SERVER_EVENTS.NOTIFICATION_NEW, callback);
}

/**
 * Listen for notification updates (e.g., marked as read)
 * @param callback - Handler for notification updates
 * @returns Cleanup function
 */
export function onNotificationUpdated(callback: (update: any) => void): () => void {
  return on(SERVER_EVENTS.NOTIFICATION_UPDATED, callback);
}

/**
 * Listen for unread count updates
 * @param callback - Handler for unread count updates
 * @returns Cleanup function
 */
export function onUnreadCountUpdate(callback: (count: number) => void): () => void {
  return on(SERVER_EVENTS.UNREAD_COUNT_UPDATED, callback);
}

// Re-export event constants for convenience
export { CLIENT_EVENTS, SERVER_EVENTS };

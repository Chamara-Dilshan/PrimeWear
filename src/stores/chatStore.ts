/**
 * Chat Store
 * Zustand store for managing chat state with optimistic updates
 */

import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { toast } from 'sonner';
import {
  connectSocket,
  getSocket,
  sendMessage as socketSendMessage,
  joinRoom as socketJoinRoom,
  markMessagesAsRead as socketMarkMessagesAsRead,
  on,
  off,
  isSocketConnected,
  SERVER_EVENTS,
} from '@/lib/socket';

// Types
export interface ChatMessage {
  id: string;
  tempId?: string; // Client-generated ID before server ACK
  chatRoomId: string;
  senderId: string;
  content: string;
  hasBlockedContent: boolean;
  isRead: boolean;
  createdAt: Date | string;
  sender: {
    firstName: string;
    lastName: string;
    role: string;
  };
}

export interface ChatRoom {
  id: string;
  orderItemId: string;
  customerId: string;
  vendorId: string;
  isActive: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
  unreadCount: number;
  lastMessage?: {
    content: string;
    createdAt: Date | string;
    senderId: string;
  } | null;
  customer: {
    firstName: string;
    lastName: string;
  };
  vendor: {
    businessName: string;
  };
  orderItem: {
    productSnapshot: any;
    variantSnapshot: any;
    order: {
      orderNumber: string;
      status: string;
    };
  };
}

interface ChatState {
  // UI state
  isOpen: boolean;
  selectedRoomId: string | null;
  isConnected: boolean;

  // Data
  rooms: ChatRoom[];
  messages: Record<string, ChatMessage[]>; // roomId → messages
  isTyping: Record<string, boolean>; // roomId → typing status

  // Loading states
  isLoadingRooms: boolean;
  isLoadingMessages: Record<string, boolean>;
  error: string | null;

  // Actions
  openChat: (roomId?: string) => void;
  closeChat: () => void;
  selectRoom: (roomId: string) => void;
  loadRooms: () => Promise<void>;
  loadMessages: (roomId: string, offset?: number) => Promise<void>;
  sendMessage: (roomId: string, content: string) => Promise<void>;
  receiveMessage: (message: ChatMessage) => void;
  acknowledgeSentMessage: (tempId: string, message: ChatMessage) => void;
  removeTempMessage: (roomId: string, tempId: string) => void;
  setTyping: (roomId: string, isTyping: boolean) => void;
  markAsRead: (roomId: string) => void;
  setConnected: (connected: boolean) => void;
  initializeSocketListeners: () => void;
  cleanupSocketListeners: () => void;
}

export const useChatStore = create<ChatState>()(
  immer((set, get) => ({
    // Initial state
    isOpen: false,
    selectedRoomId: null,
    isConnected: false,
    rooms: [],
    messages: {},
    isTyping: {},
    isLoadingRooms: false,
    isLoadingMessages: {},
    error: null,

    // Open chat dialog
    openChat: (roomId) => {
      set((state) => {
        state.isOpen = true;
        if (roomId) {
          state.selectedRoomId = roomId;
        }
      });

      // Connect socket if not connected
      if (!isSocketConnected()) {
        try {
          connectSocket();
          get().setConnected(true);
          get().initializeSocketListeners();
        } catch (error) {
          console.error('Failed to connect socket:', error);
          toast.error('Failed to connect to chat server');
        }
      }

      // Load rooms if not loaded
      if (get().rooms.length === 0) {
        get().loadRooms();
      }

      // Load messages if room is selected
      if (roomId && !get().messages[roomId]) {
        get().loadMessages(roomId);
      }
    },

    // Close chat dialog
    closeChat: () => {
      set((state) => {
        state.isOpen = false;
        state.selectedRoomId = null;
      });
    },

    // Select a room
    selectRoom: (roomId) => {
      set((state) => {
        state.selectedRoomId = roomId;
      });

      // Load messages if not loaded
      if (!get().messages[roomId]) {
        get().loadMessages(roomId);
      }

      // Join room via socket
      socketJoinRoom(roomId);

      // Mark messages as read
      get().markAsRead(roomId);
    },

    // Load user's chat rooms
    loadRooms: async () => {
      set((state) => {
        state.isLoadingRooms = true;
        state.error = null;
      });

      try {
        const response = await fetch('/api/chat/rooms', {
          credentials: 'include',
        });

        const data = await response.json();

        if (!data.success) {
          throw new Error(data.error || 'Failed to load chat rooms');
        }

        set((state) => {
          state.rooms = data.rooms;
          state.isLoadingRooms = false;
        });
      } catch (error: any) {
        console.error('Failed to load chat rooms:', error);
        set((state) => {
          state.error = error.message;
          state.isLoadingRooms = false;
        });
        toast.error('Failed to load chat rooms');
      }
    },

    // Load messages for a room
    loadMessages: async (roomId, offset = 0) => {
      set((state) => {
        state.isLoadingMessages[roomId] = true;
        state.error = null;
      });

      try {
        const response = await fetch(
          `/api/chat/rooms/${roomId}/messages?offset=${offset}&limit=50`,
          {
            credentials: 'include',
          }
        );

        const data = await response.json();

        if (!data.success) {
          throw new Error(data.error || 'Failed to load messages');
        }

        set((state) => {
          if (offset === 0) {
            // Initial load
            state.messages[roomId] = data.messages;
          } else {
            // Load more (prepend older messages)
            state.messages[roomId] = [...data.messages, ...(state.messages[roomId] || [])];
          }
          state.isLoadingMessages[roomId] = false;
        });
      } catch (error: any) {
        console.error('Failed to load messages:', error);
        set((state) => {
          state.error = error.message;
          state.isLoadingMessages[roomId] = false;
        });
        toast.error('Failed to load messages');
      }
    },

    // Send a message
    sendMessage: async (roomId, content) => {
      const trimmedContent = content.trim();

      if (!trimmedContent) {
        return;
      }

      // Generate temporary ID for optimistic update
      const tempId = `temp_${Date.now()}_${Math.random()}`;

      // Get current user ID (from rooms data)
      const room = get().rooms.find((r) => r.id === roomId);
      if (!room) {
        toast.error('Chat room not found');
        return;
      }

      // Create temporary message for optimistic update
      const tempMessage: ChatMessage = {
        id: tempId,
        tempId,
        chatRoomId: roomId,
        senderId: 'current-user', // Will be replaced by server
        content: trimmedContent,
        hasBlockedContent: false,
        isRead: false,
        createdAt: new Date(),
        sender: {
          firstName: 'You',
          lastName: '',
          role: 'CUSTOMER',
        },
      };

      // Add to store (optimistic update)
      set((state) => {
        if (!state.messages[roomId]) {
          state.messages[roomId] = [];
        }
        state.messages[roomId].push(tempMessage);
      });

      // Try socket first
      if (isSocketConnected()) {
        try {
          socketSendMessage(roomId, trimmedContent, tempId);
          // Server will send ACK to replace temp message
          return;
        } catch (error) {
          console.error('Socket send failed, falling back to REST:', error);
        }
      }

      // Fallback to REST API
      try {
        const response = await fetch(`/api/chat/rooms/${roomId}/messages`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({ content: trimmedContent }),
        });

        const data = await response.json();

        if (!data.success) {
          throw new Error(data.error || 'Failed to send message');
        }

        // Replace temp message with real one
        get().acknowledgeSentMessage(tempId, data.message);

        // Show warning if contact info was blocked
        if (data.contactBlocked) {
          toast.warning('Your message contained blocked content and was filtered');
        }
      } catch (error: any) {
        console.error('Failed to send message:', error);

        // Remove temp message
        get().removeTempMessage(roomId, tempId);

        toast.error('Failed to send message. Please try again.');
      }
    },

    // Receive message from socket
    receiveMessage: (message) => {
      set((state) => {
        const roomId = message.chatRoomId;

        // Initialize messages array if needed
        if (!state.messages[roomId]) {
          state.messages[roomId] = [];
        }

        // Check if message already exists (prevent duplicates)
        const exists = state.messages[roomId].some(
          (m) => m.id === message.id || (message.tempId && m.tempId === message.tempId)
        );

        if (!exists) {
          state.messages[roomId].push(message);
        }

        // Update room's last message and unread count
        const room = state.rooms.find((r) => r.id === roomId);
        if (room) {
          room.lastMessage = {
            content: message.content,
            createdAt: message.createdAt,
            senderId: message.senderId,
          };
          room.updatedAt = new Date();

          // Increment unread count if not the current room or not sender
          if (state.selectedRoomId !== roomId) {
            room.unreadCount = (room.unreadCount || 0) + 1;
          }
        }
      });
    },

    // Acknowledge sent message (replace temp with real)
    acknowledgeSentMessage: (tempId, message) => {
      set((state) => {
        const roomId = message.chatRoomId;
        const roomMessages = state.messages[roomId] || [];

        // Find temp message by tempId
        const tempIndex = roomMessages.findIndex((m) => m.tempId === tempId);

        if (tempIndex !== -1) {
          // Replace temp message with real one
          state.messages[roomId][tempIndex] = message;
        } else {
          // If temp not found, just add the message
          if (!state.messages[roomId]) {
            state.messages[roomId] = [];
          }
          state.messages[roomId].push(message);
        }
      });
    },

    // Remove temp message (on error)
    removeTempMessage: (roomId, tempId) => {
      set((state) => {
        if (!state.messages[roomId]) return;

        state.messages[roomId] = state.messages[roomId].filter(
          (m) => m.tempId !== tempId
        );
      });
    },

    // Set typing indicator
    setTyping: (roomId, isTyping) => {
      set((state) => {
        state.isTyping[roomId] = isTyping;
      });

      // Auto-hide after 3 seconds
      if (isTyping) {
        setTimeout(() => {
          set((state) => {
            state.isTyping[roomId] = false;
          });
        }, 3000);
      }
    },

    // Mark messages as read
    markAsRead: async (roomId) => {
      try {
        // Call API
        await fetch(`/api/chat/rooms/${roomId}/read`, {
          method: 'PATCH',
          credentials: 'include',
        });

        // Also emit via socket if connected
        if (isSocketConnected()) {
          socketMarkMessagesAsRead(roomId);
        }

        // Update local state
        set((state) => {
          // Mark messages as read
          const messages = state.messages[roomId] || [];
          messages.forEach((m) => {
            m.isRead = true;
          });

          // Reset unread count
          const room = state.rooms.find((r) => r.id === roomId);
          if (room) {
            room.unreadCount = 0;
          }
        });
      } catch (error) {
        console.error('Failed to mark messages as read:', error);
      }
    },

    // Set connection status
    setConnected: (connected) => {
      set((state) => {
        state.isConnected = connected;
      });

      if (connected) {
        toast.success('Connected to chat server');
      } else {
        toast.error('Disconnected from chat server');
      }
    },

    // Initialize socket event listeners
    initializeSocketListeners: () => {
      const socket = getSocket();
      if (!socket) return;

      // Message received
      on(SERVER_EVENTS.MESSAGE_RECEIVED, (data) => {
        get().receiveMessage(data.message);
      });

      // Message sent acknowledgment
      on(SERVER_EVENTS.MESSAGE_SENT_ACK, (data) => {
        get().acknowledgeSentMessage(data.tempId, data.message);
      });

      // Message error
      on(SERVER_EVENTS.MESSAGE_ERROR, (data) => {
        if (data.tempId) {
          // Remove temp message
          const roomId = get().selectedRoomId;
          if (roomId) {
            get().removeTempMessage(roomId, data.tempId);
          }
        }
        toast.error(data.message || 'Failed to send message');
      });

      // Contact blocked warning
      on(SERVER_EVENTS.CONTACT_BLOCKED, (data) => {
        toast.warning(data.message || 'Your message contained blocked content');
      });

      // Typing indicators
      on(SERVER_EVENTS.USER_TYPING, (data) => {
        get().setTyping(data.roomId, true);
      });

      on(SERVER_EVENTS.USER_STOPPED_TYPING, (data) => {
        get().setTyping(data.roomId, false);
      });

      // Connection events
      socket.on('connect', () => {
        get().setConnected(true);
      });

      socket.on('disconnect', () => {
        get().setConnected(false);
      });
    },

    // Cleanup socket listeners
    cleanupSocketListeners: () => {
      off(SERVER_EVENTS.MESSAGE_RECEIVED);
      off(SERVER_EVENTS.MESSAGE_SENT_ACK);
      off(SERVER_EVENTS.MESSAGE_ERROR);
      off(SERVER_EVENTS.CONTACT_BLOCKED);
      off(SERVER_EVENTS.USER_TYPING);
      off(SERVER_EVENTS.USER_STOPPED_TYPING);
    },
  }))
);

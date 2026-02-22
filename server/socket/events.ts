/**
 * Socket.io Event Constants
 * Defines all event names for client-server communication
 */

// Client → Server Events
export const CLIENT_EVENTS = {
  // Room management
  JOIN_ROOM: 'chat:join_room',
  LEAVE_ROOM: 'chat:leave_room',

  // Messaging
  SEND_MESSAGE: 'chat:send_message',
  MARK_AS_READ: 'chat:mark_as_read',

  // Typing indicators
  TYPING_START: 'chat:typing_start',
  TYPING_STOP: 'chat:typing_stop',

  // Admin events
  ADMIN_VIEW_ROOM: 'chat:admin_view_room',

  // Notification events
  NOTIFICATIONS_SUBSCRIBE: 'notifications:subscribe',
  NOTIFICATION_READ: 'notification:read',
} as const;

// Server → Client Events
export const SERVER_EVENTS = {
  // Message events
  MESSAGE_RECEIVED: 'chat:message_received',
  MESSAGE_SENT_ACK: 'chat:message_sent_ack',
  MESSAGE_ERROR: 'chat:message_error',

  // Room events
  ROOM_JOINED: 'chat:room_joined',
  ROOM_LEFT: 'chat:room_left',
  USER_ONLINE: 'chat:user_online',
  USER_OFFLINE: 'chat:user_offline',

  // Typing events
  USER_TYPING: 'chat:user_typing',
  USER_STOPPED_TYPING: 'chat:user_stopped_typing',

  // System events
  CONTACT_BLOCKED: 'chat:contact_blocked',
  ERROR: 'chat:error',

  // Notification events
  NOTIFICATION_NEW: 'notification:new',
  NOTIFICATION_UPDATED: 'notification:updated',
  UNREAD_COUNT_UPDATED: 'unread_count:updated',
} as const;

// Type exports for TypeScript
export type ClientEvent = keyof typeof CLIENT_EVENTS;
export type ServerEvent = keyof typeof SERVER_EVENTS;

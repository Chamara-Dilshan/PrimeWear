/**
 * Typing Indicator Handler
 * Broadcasts typing status to other room participants
 */

import { Server, Socket } from 'socket.io';
import { CLIENT_EVENTS, SERVER_EVENTS } from '../events';
import { verifyRoomAccess } from '../../../src/lib/chat/accessControl';
import { UserRole } from '@prisma/client';

/**
 * Handle typing start event
 */
async function handleTypingStart(io: Server, socket: Socket, data: { roomId: string }) {
  try {
    const { roomId } = data;
    const { userId, role, email } = socket.data;

    if (!roomId) {
      console.warn('[Typing] Missing roomId');
      return;
    }

    // Verify user has access to this room
    try {
      await verifyRoomAccess(roomId, userId, role as UserRole);
    } catch (error) {
      console.warn(`[Typing] Access denied for user ${userId} to room ${roomId}`);
      return;
    }

    // Broadcast to other participants in the room (not to sender)
    socket.to(roomId).emit(SERVER_EVENTS.USER_TYPING, {
      roomId,
      userId,
      role,
    });

    console.log(`[Typing] User ${email} started typing in room ${roomId}`);
  } catch (error) {
    console.error('[Typing] Error handling typing start:', error);
  }
}

/**
 * Handle typing stop event
 */
async function handleTypingStop(io: Server, socket: Socket, data: { roomId: string }) {
  try {
    const { roomId } = data;
    const { userId, role } = socket.data;

    if (!roomId) {
      console.warn('[Typing] Missing roomId');
      return;
    }

    // Broadcast to other participants in the room (not to sender)
    socket.to(roomId).emit(SERVER_EVENTS.USER_STOPPED_TYPING, {
      roomId,
      userId,
      role,
    });

    console.log(`[Typing] User ${userId} stopped typing in room ${roomId}`);
  } catch (error) {
    console.error('[Typing] Error handling typing stop:', error);
  }
}

/**
 * Register typing event handlers
 */
export function registerTypingHandlers(io: Server, socket: Socket) {
  socket.on(CLIENT_EVENTS.TYPING_START, (data) => handleTypingStart(io, socket, data));
  socket.on(CLIENT_EVENTS.TYPING_STOP, (data) => handleTypingStop(io, socket, data));
}

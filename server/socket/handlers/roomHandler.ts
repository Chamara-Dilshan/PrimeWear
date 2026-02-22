/**
 * Chat Room Handler
 * Manages joining/leaving rooms and online status
 */

import { Server, Socket } from 'socket.io';
import { CLIENT_EVENTS, SERVER_EVENTS } from '../events';
import { verifyRoomAccess, getUserChatRooms } from '../../../src/lib/chat/accessControl';
import { UserRole } from '@prisma/client';

/**
 * Handle join room event
 */
async function handleJoinRoom(io: Server, socket: Socket, data: { roomId: string }) {
  try {
    const { roomId } = data;
    const { userId, role, email } = socket.data;

    if (!roomId) {
      socket.emit(SERVER_EVENTS.ERROR, { message: 'Room ID is required' });
      return;
    }

    // Verify user has access to this room
    let room;
    try {
      room = await verifyRoomAccess(roomId, userId, role as UserRole);
    } catch (error) {
      console.warn(`[Room] Access denied for user ${userId} to room ${roomId}`);
      socket.emit(SERVER_EVENTS.ERROR, {
        message: 'Access denied to this chat room',
      });
      return;
    }

    // Join the Socket.io room
    socket.join(roomId);

    // Emit success to user
    socket.emit(SERVER_EVENTS.ROOM_JOINED, {
      roomId,
      room: {
        id: room.id,
        customerId: room.customerId,
        vendorId: room.vendorId,
        orderItem: room.orderItem,
        customer: room.customer,
        vendor: room.vendor,
      },
    });

    // Broadcast to other participants that user is online
    socket.to(roomId).emit(SERVER_EVENTS.USER_ONLINE, {
      roomId,
      userId,
      role,
    });

    console.log(`[Room] User ${email} joined room ${roomId}`);
  } catch (error) {
    console.error('[Room] Error joining room:', error);
    socket.emit(SERVER_EVENTS.ERROR, {
      message: 'Failed to join room',
    });
  }
}

/**
 * Handle leave room event
 */
async function handleLeaveRoom(io: Server, socket: Socket, data: { roomId: string }) {
  try {
    const { roomId } = data;
    const { userId, role } = socket.data;

    if (!roomId) {
      return;
    }

    // Leave the Socket.io room
    socket.leave(roomId);

    // Emit success to user
    socket.emit(SERVER_EVENTS.ROOM_LEFT, { roomId });

    // Broadcast to other participants that user is offline
    socket.to(roomId).emit(SERVER_EVENTS.USER_OFFLINE, {
      roomId,
      userId,
      role,
    });

    console.log(`[Room] User ${userId} left room ${roomId}`);
  } catch (error) {
    console.error('[Room] Error leaving room:', error);
  }
}

/**
 * Auto-join user's chat rooms on connection
 * This allows users to receive messages in all their rooms
 */
export async function autoJoinUserRooms(io: Server, socket: Socket) {
  try {
    const { userId, role, email } = socket.data;

    // Get all rooms for this user
    const rooms = await getUserChatRooms(userId, role as UserRole);

    console.log(`[Room] Auto-joining ${rooms.length} room(s) for user ${email}`);

    // Join all rooms
    for (const room of rooms) {
      socket.join(room.id);

      // Broadcast online status to each room
      socket.to(room.id).emit(SERVER_EVENTS.USER_ONLINE, {
        roomId: room.id,
        userId,
        role,
      });
    }

    console.log(`[Room] Successfully auto-joined rooms for user ${email}`);

    return rooms;
  } catch (error) {
    console.error('[Room] Error auto-joining rooms:', error);
    return [];
  }
}

/**
 * Handle user disconnect - broadcast offline status to all rooms
 */
export function handleUserDisconnect(io: Server, socket: Socket) {
  const { userId, role } = socket.data;

  // Get all rooms the socket was in
  const rooms = Array.from(socket.rooms).filter((room) => room !== socket.id);

  // Broadcast offline status to all rooms
  rooms.forEach((roomId) => {
    socket.to(roomId).emit(SERVER_EVENTS.USER_OFFLINE, {
      roomId,
      userId,
      role,
    });
  });

  console.log(`[Room] User ${userId} disconnected, notified ${rooms.length} room(s)`);
}

/**
 * Register room event handlers
 */
export function registerRoomHandlers(io: Server, socket: Socket) {
  socket.on(CLIENT_EVENTS.JOIN_ROOM, (data) => handleJoinRoom(io, socket, data));
  socket.on(CLIENT_EVENTS.LEAVE_ROOM, (data) => handleLeaveRoom(io, socket, data));
}

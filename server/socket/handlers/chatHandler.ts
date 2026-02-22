/**
 * Chat Message Handler
 * Handles sending, receiving, and marking messages as read
 */

import { Server, Socket } from 'socket.io';
import { CLIENT_EVENTS, SERVER_EVENTS } from '../events';
import { verifyRoomAccess, canSendMessage } from '../../../src/lib/chat/accessControl';
import { filterContactInfo } from '../../../src/lib/utils/contactFilter';
import { prisma } from '../../../src/lib/prisma';
import { UserRole } from '@prisma/client';
import { rateLimitMiddleware } from '../middleware/rateLimitMiddleware';
import { createNotification } from '../../../src/lib/notifications/notificationService';
import { NotificationType } from '../../../src/types/notification';

/**
 * Save message to database
 */
async function saveMessage(
  roomId: string,
  senderId: string,
  content: string
) {
  // Filter contact information
  const filterResult = filterContactInfo(content);

  // Save message to database
  const message = await prisma.chatMessage.create({
    data: {
      chatRoomId: roomId,
      senderId,
      content: filterResult.filteredContent,
      contentFiltered: filterResult.hasBlockedContent ? filterResult.filteredContent : null,
      hasBlockedContent: filterResult.hasBlockedContent,
      isRead: false,
    },
    include: {
      sender: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          role: true,
        },
      },
    },
  });

  // Update room's last activity and unread count
  await prisma.chatRoom.update({
    where: { id: roomId },
    data: {
      updatedAt: new Date(),
    },
  });

  return { message, filterResult };
}

/**
 * Check if a user is actively in a room (connected via Socket.io)
 */
async function isUserActiveInRoom(io: Server, roomId: string, userId: string): Promise<boolean> {
  const socketsInRoom = await io.in(roomId).fetchSockets();
  return socketsInRoom.some(s => s.data.userId === userId);
}

/**
 * Handle send message event
 */
async function handleSendMessage(
  io: Server,
  socket: Socket,
  data: { roomId: string; content: string; tempId?: string }
) {
  try {
    const { roomId, content, tempId } = data;
    const { userId, role, email } = socket.data;

    // Validation
    if (!roomId || !content) {
      socket.emit(SERVER_EVENTS.MESSAGE_ERROR, {
        tempId,
        message: 'Room ID and content are required',
      });
      return;
    }

    // Trim content and check length
    const trimmedContent = content.trim();

    if (trimmedContent.length === 0) {
      socket.emit(SERVER_EVENTS.MESSAGE_ERROR, {
        tempId,
        message: 'Message cannot be empty',
      });
      return;
    }

    if (trimmedContent.length > 2000) {
      socket.emit(SERVER_EVENTS.MESSAGE_ERROR, {
        tempId,
        message: 'Message is too long (max 2000 characters)',
      });
      return;
    }

    // Check if user can send messages (admin cannot send)
    const canSend = await canSendMessage(roomId, userId, role as UserRole);

    if (!canSend) {
      socket.emit(SERVER_EVENTS.MESSAGE_ERROR, {
        tempId,
        message: 'You do not have permission to send messages in this room',
      });
      return;
    }

    // Verify room access
    try {
      await verifyRoomAccess(roomId, userId, role as UserRole);
    } catch (error) {
      socket.emit(SERVER_EVENTS.MESSAGE_ERROR, {
        tempId,
        message: 'Access denied to this chat room',
      });
      return;
    }

    // Save message to database
    const { message, filterResult } = await saveMessage(roomId, userId, trimmedContent);

    console.log(`[Chat] Message saved: ${message.id} from ${email} in room ${roomId}`);

    // Send acknowledgment to sender
    socket.emit(SERVER_EVENTS.MESSAGE_SENT_ACK, {
      tempId,
      message: {
        id: message.id,
        chatRoomId: message.chatRoomId,
        senderId: message.senderId,
        content: message.content,
        hasBlockedContent: message.hasBlockedContent,
        isRead: message.isRead,
        createdAt: message.createdAt,
        sender: {
          firstName: message.sender.firstName,
          lastName: message.sender.lastName,
          role: message.sender.role,
        },
      },
    });

    // Broadcast message to other participants in the room
    socket.to(roomId).emit(SERVER_EVENTS.MESSAGE_RECEIVED, {
      message: {
        id: message.id,
        chatRoomId: message.chatRoomId,
        senderId: message.senderId,
        content: message.content,
        hasBlockedContent: message.hasBlockedContent,
        isRead: false,
        createdAt: message.createdAt,
        sender: {
          firstName: message.sender.firstName,
          lastName: message.sender.lastName,
          role: message.sender.role,
        },
      },
    });

    // Send notification to participants not actively viewing chat
    try {
      // Get room participants (exclude sender)
      const room = await prisma.chatRoom.findUnique({
        where: { id: roomId },
        include: {
          orderItem: {
            include: {
              order: {
                select: { userId: true },
              },
              product: {
                include: {
                  vendor: {
                    select: { userId: true },
                  },
                },
              },
            },
          },
        },
      });

      if (room) {
        const participants: string[] = [];

        // Add customer
        if (room.orderItem.order.userId !== userId) {
          participants.push(room.orderItem.order.userId);
        }

        // Add vendor
        if (room.orderItem.product.vendor.userId !== userId) {
          participants.push(room.orderItem.product.vendor.userId);
        }

        // Check each participant and send notification if not active
        const senderName = `${message.sender.firstName} ${message.sender.lastName}`.trim() || message.sender.email;
        const messagePreview = message.content.length > 50
          ? message.content.substring(0, 50) + '...'
          : message.content;

        for (const participantId of participants) {
          const isActive = await isUserActiveInRoom(io, roomId, participantId);

          if (!isActive) {
            await createNotification({
              userId: participantId,
              type: NotificationType.CHAT_NEW_MESSAGE,
              title: 'New Chat Message',
              message: `${senderName}: ${messagePreview}`,
              link: `/chat?roomId=${roomId}`,
              metadata: {
                roomId,
                messageId: message.id,
                senderId: userId,
                senderName,
              },
            });
          }
        }
      }
    } catch (notifError) {
      console.error('[Chat] Failed to send notification:', notifError);
    }

    // If content was filtered, notify sender
    if (filterResult.hasBlockedContent) {
      socket.emit(SERVER_EVENTS.CONTACT_BLOCKED, {
        messageId: message.id,
        originalContent: content,
        filteredContent: message.content,
        violations: filterResult.violations,
        message: 'Your message contained blocked content (phone number, email, or social media link). It has been filtered.',
      });

      console.warn(`[Chat] Blocked content detected in message ${message.id}:`, {
        violations: filterResult.violations.length,
        types: filterResult.violations.map((v) => v.type),
      });
    }
  } catch (error) {
    console.error('[Chat] Error sending message:', error);
    socket.emit(SERVER_EVENTS.MESSAGE_ERROR, {
      tempId: data.tempId,
      message: 'Failed to send message. Please try again.',
    });
  }
}

/**
 * Handle mark as read event
 */
async function handleMarkAsRead(
  socket: Socket,
  data: { roomId: string }
) {
  try {
    const { roomId } = data;
    const { userId, role } = socket.data;

    if (!roomId) {
      return;
    }

    // Verify room access
    try {
      await verifyRoomAccess(roomId, userId, role as UserRole);
    } catch (error) {
      console.warn(`[Chat] Access denied for marking messages as read in room ${roomId}`);
      return;
    }

    // Mark all messages from other users as read
    const updated = await prisma.chatMessage.updateMany({
      where: {
        chatRoomId: roomId,
        senderId: { not: userId },
        isRead: false,
      },
      data: {
        isRead: true,
      },
    });

    console.log(`[Chat] Marked ${updated.count} message(s) as read in room ${roomId}`);
  } catch (error) {
    console.error('[Chat] Error marking messages as read:', error);
  }
}

/**
 * Register chat event handlers
 */
export function registerChatHandlers(io: Server, socket: Socket) {
  // Apply rate limiting to send message handler
  socket.on(
    CLIENT_EVENTS.SEND_MESSAGE,
    rateLimitMiddleware(async (socket, data) => {
      await handleSendMessage(io, socket, data);
    })
  );

  socket.on(CLIENT_EVENTS.MARK_AS_READ, (data) => handleMarkAsRead(socket, data));
}

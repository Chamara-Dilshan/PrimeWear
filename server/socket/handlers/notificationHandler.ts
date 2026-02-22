/**
 * Notification Handler
 * Handles notification-related Socket.io events
 */

import { Server, Socket } from "socket.io";
import { CLIENT_EVENTS, SERVER_EVENTS } from "../events";

/**
 * Register notification handlers for a socket connection
 */
export function registerNotificationHandlers(io: Server, socket: Socket) {
  const userId = socket.data.userId;

  // Auto-join user's notification room on connect
  const notificationRoom = `user:${userId}`;
  socket.join(notificationRoom);
  console.log(`[Notifications] User ${userId} joined notification room`);

  // Send current unread count on subscribe
  socket.on(CLIENT_EVENTS.NOTIFICATIONS_SUBSCRIBE, async () => {
    try {
      // Dynamic import to avoid circular dependency
      const { getUnreadCount } = await import(
        "../../../src/lib/notifications/notificationService"
      );
      const count = await getUnreadCount(userId);

      socket.emit(SERVER_EVENTS.UNREAD_COUNT_UPDATED, count);
      console.log(`[Notifications] Sent unread count (${count}) to user ${userId}`);
    } catch (error) {
      console.error("[Notifications] Failed to get unread count:", error);
      socket.emit(SERVER_EVENTS.ERROR, {
        message: "Failed to fetch unread count",
      });
    }
  });

  // Handle mark as read
  socket.on(CLIENT_EVENTS.NOTIFICATION_READ, async (notificationId: string) => {
    try {
      // Validate input
      if (!notificationId || typeof notificationId !== "string") {
        socket.emit(SERVER_EVENTS.ERROR, {
          message: "Invalid notification ID",
        });
        return;
      }

      // Dynamic import to avoid circular dependency
      const { markAsRead, getUnreadCount } = await import(
        "../../../src/lib/notifications/notificationService"
      );

      // Mark as read (verifies ownership)
      const updated = await markAsRead(notificationId, userId);

      if (!updated) {
        // Already read or not found
        return;
      }

      // Broadcast to all user's tabs (including this one)
      io.to(notificationRoom).emit(SERVER_EVENTS.NOTIFICATION_UPDATED, {
        id: notificationId,
        isRead: true,
      });

      // Send updated unread count
      const unreadCount = await getUnreadCount(userId);
      io.to(notificationRoom).emit(
        SERVER_EVENTS.UNREAD_COUNT_UPDATED,
        unreadCount
      );

      console.log(`[Notifications] Marked ${notificationId} as read for user ${userId}`);
    } catch (error) {
      console.error("[Notifications] Failed to mark as read:", error);
      socket.emit(SERVER_EVENTS.ERROR, {
        message: "Failed to mark notification as read",
      });
    }
  });

  // Handle disconnect
  socket.on("disconnect", () => {
    console.log(`[Notifications] User ${userId} disconnected from notifications`);
  });
}

/**
 * Broadcast new notification to user (called from notification service)
 * Uses io.to() to send to all user's connected tabs
 */
export async function broadcastNotification(
  io: Server,
  userId: string,
  notification: any
): Promise<void> {
  try {
    const notificationRoom = `user:${userId}`;

    // Broadcast to all user's tabs
    io.to(notificationRoom).emit(
      SERVER_EVENTS.NOTIFICATION_NEW,
      notification
    );

    console.log(`[Notifications] Broadcasted notification ${notification.id} to user ${userId}`);
  } catch (error) {
    console.error("[Notifications] Broadcast failed:", error);
  }
}

/**
 * Broadcast unread count update to user
 */
export async function broadcastUnreadCount(
  io: Server,
  userId: string,
  count: number
): Promise<void> {
  try {
    const notificationRoom = `user:${userId}`;

    io.to(notificationRoom).emit(SERVER_EVENTS.UNREAD_COUNT_UPDATED, count);

    console.log(`[Notifications] Broadcasted unread count (${count}) to user ${userId}`);
  } catch (error) {
    console.error("[Notifications] Broadcast unread count failed:", error);
  }
}

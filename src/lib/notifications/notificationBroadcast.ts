// Notification Broadcast
// Socket.io broadcast helpers for real-time notification delivery

import type { Notification } from "@prisma/client";

// Store Socket.io server instance (set during server initialization)
let ioInstance: any = null;

/**
 * Set Socket.io server instance (called from server/index.ts)
 */
export function setSocketIoInstance(io: any): void {
  ioInstance = io;
  console.log("[Notifications] Socket.io instance registered");
}

/**
 * Broadcast new notification to user via Socket.io
 * Sends to all user's connected tabs via user room
 */
export async function broadcastNotification(
  userId: string,
  notification: Notification
): Promise<void> {
  if (!ioInstance) {
    console.warn("[Notifications] Socket.io not initialized, skipping broadcast");
    return;
  }

  try {
    // Import handler to avoid circular dependency
    const { broadcastNotification: broadcast } = await import(
      "../../../server/socket/handlers/notificationHandler"
    );
    await broadcast(ioInstance, userId, notification);
  } catch (error) {
    console.error("[Notifications] Broadcast failed:", error);
  }
}

/**
 * Broadcast unread count update to user via Socket.io
 */
export async function broadcastUnreadCount(
  userId: string,
  count: number
): Promise<void> {
  if (!ioInstance) {
    console.warn("[Notifications] Socket.io not initialized, skipping broadcast");
    return;
  }

  try {
    // Import handler to avoid circular dependency
    const { broadcastUnreadCount: broadcast } = await import(
      "../../../server/socket/handlers/notificationHandler"
    );
    await broadcast(ioInstance, userId, count);
  } catch (error) {
    console.error("[Notifications] Broadcast unread count failed:", error);
  }
}

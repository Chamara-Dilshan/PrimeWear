/**
 * Mark All Notifications as Read API
 * PATCH - Mark all unread notifications as read
 */

import { NextRequest, NextResponse } from "next/server";
import { markAllAsRead } from "@/lib/notifications";

/**
 * PATCH /api/notifications/read-all
 * Mark all unread notifications as read for authenticated user
 */
export async function PATCH(request: NextRequest) {
  try {
    // Get user ID from headers (set by middleware)
    const userId = request.headers.get("X-User-Id");

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Mark all as read (broadcasts unread count = 0 to Socket.io)
    const count = await markAllAsRead(userId);

    return NextResponse.json({
      success: true,
      data: {
        markedCount: count,
        message: `Marked ${count} notification(s) as read`,
      },
    });
  } catch (error) {
    console.error("[API] Failed to mark all as read:", error);
    return NextResponse.json(
      { success: false, error: "Failed to mark all notifications as read" },
      { status: 500 }
    );
  }
}

/**
 * Mark Notification as Read API
 * PATCH - Mark single notification as read
 */

import { NextRequest, NextResponse } from "next/server";
import { markAsRead } from "@/lib/notifications";

/**
 * PATCH /api/notifications/[id]/read
 * Mark notification as read for authenticated user
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get user ID from headers (set by middleware)
    const userId = request.headers.get("X-User-Id");

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const notificationId = params.id;

    if (!notificationId) {
      return NextResponse.json(
        { success: false, error: "Notification ID required" },
        { status: 400 }
      );
    }

    // Mark as read (verifies ownership, broadcasts to Socket.io)
    const notification = await markAsRead(notificationId, userId);

    if (!notification) {
      return NextResponse.json(
        {
          success: false,
          error: "Notification not found or already read",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: notification,
    });
  } catch (error) {
    console.error("[API] Failed to mark notification as read:", error);
    return NextResponse.json(
      { success: false, error: "Failed to mark notification as read" },
      { status: 500 }
    );
  }
}

/**
 * Unread Count API
 * GET - Get unread notification count for badge
 */

import { NextRequest, NextResponse } from "next/server";
import { getUnreadCount } from "@/lib/notifications";

/**
 * GET /api/notifications/unread-count
 * Get unread notification count for authenticated user
 */
export async function GET(request: NextRequest) {
  try {
    // Get user ID from headers (set by middleware)
    const userId = request.headers.get("X-User-Id");

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get unread count
    const count = await getUnreadCount(userId);

    return NextResponse.json({
      success: true,
      data: {
        count,
      },
    });
  } catch (error) {
    console.error("[API] Failed to get unread count:", error);
    return NextResponse.json(
      { success: false, error: "Failed to get unread count" },
      { status: 500 }
    );
  }
}

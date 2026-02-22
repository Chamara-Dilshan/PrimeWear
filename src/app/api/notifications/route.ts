/**
 * Notifications API
 * GET - List notifications with pagination and filters
 */

import { NextRequest, NextResponse } from "next/server";
import { getNotifications } from "@/lib/notifications";
import { listNotificationsSchema } from "@/lib/validations/notification";

/**
 * GET /api/notifications
 * List notifications for authenticated user
 * Query params: page, limit, category, isRead
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

    // Parse and validate query parameters
    const searchParams = request.nextUrl.searchParams;
    const params = {
      page: searchParams.get("page") || "1",
      limit: searchParams.get("limit") || "20",
      category: searchParams.get("category") || undefined,
      isRead: searchParams.get("isRead") || undefined,
    };

    const validation = listNotificationsSchema.safeParse(params);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid parameters",
          details: validation.error.errors,
        },
        { status: 400 }
      );
    }

    const { page, limit, category, isRead } = validation.data;

    // Fetch notifications
    const result = await getNotifications({
      userId,
      page,
      limit,
      category,
      isRead,
    });

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("[API] Failed to fetch notifications:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch notifications" },
      { status: 500 }
    );
  }
}

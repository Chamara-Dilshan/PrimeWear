/**
 * Notification Preferences API
 * GET - Get user preferences
 * PUT - Update user preferences
 */

import { NextRequest, NextResponse } from "next/server";
import {
  getUserPreferences,
  updateUserPreferences,
} from "@/lib/notifications";
import { updatePreferencesSchema } from "@/lib/validations/notification";

/**
 * GET /api/notifications/preferences
 * Get notification preferences for authenticated user
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

    // Get preferences (creates default if not exists)
    const preferences = await getUserPreferences(userId);

    return NextResponse.json({
      success: true,
      data: preferences,
    });
  } catch (error) {
    console.error("[API] Failed to get preferences:", error);
    return NextResponse.json(
      { success: false, error: "Failed to get preferences" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/notifications/preferences
 * Update notification preferences for authenticated user
 */
export async function PUT(request: NextRequest) {
  try {
    // Get user ID from headers (set by middleware)
    const userId = request.headers.get("X-User-Id");

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();

    // Validate input
    const validation = updatePreferencesSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid preferences",
          details: validation.error.errors,
        },
        { status: 400 }
      );
    }

    // Update preferences
    const preferences = await updateUserPreferences(userId, validation.data);

    return NextResponse.json({
      success: true,
      data: preferences,
    });
  } catch (error) {
    console.error("[API] Failed to update preferences:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update preferences" },
      { status: 500 }
    );
  }
}

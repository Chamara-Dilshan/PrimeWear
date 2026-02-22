/**
 * Vendor Order Distribution Report API
 * GET /api/vendor/reports/order-distribution - Order status breakdown for vendor
 */

import { NextRequest, NextResponse } from "next/server";
import { requireVendor, handleAuthError } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { orderDistributionFiltersSchema } from "@/lib/validations/report";

/**
 * GET /api/vendor/reports/order-distribution
 * Get order item count by status for vendor
 */
export async function GET(request: NextRequest) {
  try {
    // Auth check
    const user = requireVendor(request);

    // Parse and validate query parameters
    const searchParams = request.nextUrl.searchParams;
    const queryParams = {
      dateFrom: searchParams.get("dateFrom") || undefined,
      dateTo: searchParams.get("dateTo") || undefined,
    };

    const validation = orderDistributionFiltersSchema.safeParse(queryParams);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const { dateFrom, dateTo } = validation.data;

    // Build where clause
    const whereClause: any = {
      vendorId: vendorId,
    };

    if (dateFrom) {
      whereClause.order = { createdAt: { gte: new Date(dateFrom) } };
    }

    if (dateTo) {
      whereClause.order = {
        ...whereClause.order,
        createdAt: {
          ...whereClause.order?.createdAt,
          lte: new Date(dateTo),
        },
      };
    }

    // Group order items by status
    const itemsByStatus = await prisma.orderItem.groupBy({
      by: ["status"],
      where: whereClause,
      _count: {
        id: true,
      },
    });

    // Convert to object format { STATUS: count }
    const distribution: Record<string, number> = {};

    itemsByStatus.forEach((item) => {
      distribution[item.status] = item._count.id;
    });

    // Ensure all statuses are present (even with 0 count)
    const allStatuses = [
      "PENDING",
      "PROCESSING",
      "SHIPPED",
      "DELIVERED",
      "CANCELLED",
      "RETURNED",
    ];

    allStatuses.forEach((status) => {
      if (!(status in distribution)) {
        distribution[status] = 0;
      }
    });

    return NextResponse.json({
      success: true,
      data: distribution,
    });
  } catch (error) {
    console.error("Failed to fetch vendor order distribution:", error);

    // Handle auth errors
    const authError = handleAuthError(error);
    if (authError) return authError;

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch order distribution",
      },
      { status: 500 }
    );
  }
}

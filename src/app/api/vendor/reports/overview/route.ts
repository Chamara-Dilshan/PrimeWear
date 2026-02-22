/**
 * Vendor Overview Report API
 * GET /api/vendor/reports/overview - Vendor dashboard statistics
 */

import { NextRequest, NextResponse } from "next/server";
import { requireVendor, handleAuthError } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { adminOverviewFiltersSchema } from "@/lib/validations/report";
import { startOfMonth } from "date-fns";

/**
 * GET /api/vendor/reports/overview
 * Get dashboard statistics for vendor
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

    const validation = adminOverviewFiltersSchema.safeParse(queryParams);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const { dateFrom, dateTo } = validation.data;

    // Build where clause for order items
    const whereClause: any = {
      vendorId: user.vendorId,
      order: {
        status: {
          in: [
            "PAYMENT_CONFIRMED",
            "PROCESSING",
            "SHIPPED",
            "DELIVERY_CONFIRMED",
            "DELIVERED",
          ],
        },
      },
    };

    if (dateFrom) {
      whereClause.order.createdAt = { gte: new Date(dateFrom) };
    }

    if (dateTo) {
      whereClause.order.createdAt = {
        ...whereClause.order.createdAt,
        lte: new Date(dateTo),
      };
    }

    // Calculate total sales
    const salesResult = await prisma.orderItem.aggregate({
      where: whereClause,
      _sum: {
        totalPrice: true,
      },
      _count: true,
      _avg: {
        totalPrice: true,
      },
    });

    const totalSales = salesResult._sum.totalPrice?.toNumber() || 0;
    const totalOrders = salesResult._count || 0;
    const averageOrderValue = salesResult._avg.totalPrice?.toNumber() || 0;

    // Calculate this month's sales
    const thisMonthStart = startOfMonth(new Date());
    const thisMonthWhere = {
      ...whereClause,
      order: {
        ...whereClause.order,
        createdAt: {
          gte: thisMonthStart,
          ...(dateTo && new Date(dateTo) < new Date()
            ? { lte: new Date(dateTo) }
            : {}),
        },
      },
    };

    const thisMonthResult = await prisma.orderItem.aggregate({
      where: thisMonthWhere,
      _sum: {
        totalPrice: true,
      },
    });

    const thisMonthSales = thisMonthResult._sum.totalPrice?.toNumber() || 0;

    // Get wallet balance
    const wallet = await prisma.wallet.findUnique({
      where: {
        vendorId: vendorId,
      },
      select: {
        pendingBalance: true,
        availableBalance: true,
      },
    });

    const pendingBalance = wallet?.pendingBalance.toNumber() || 0;
    const availableBalance = wallet?.availableBalance.toNumber() || 0;

    // Return statistics
    return NextResponse.json({
      success: true,
      data: {
        totalSales,
        thisMonthSales,
        pendingBalance,
        availableBalance,
        totalOrders,
        averageOrderValue,
      },
    });
  } catch (error) {
    console.error("Failed to fetch vendor overview stats:", error);

    // Handle auth errors
    const authError = handleAuthError(error);
    if (authError) return authError;

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch overview statistics",
      },
      { status: 500 }
    );
  }
}

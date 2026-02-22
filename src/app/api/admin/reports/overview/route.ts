/**
 * Admin Overview Report API
 * GET /api/admin/reports/overview - Dashboard statistics
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { adminOverviewFiltersSchema } from "@/lib/validations/report";
import { startOfMonth } from "date-fns";
import { requireAdmin, handleAuthError } from "@/lib/auth-helpers";

/**
 * GET /api/admin/reports/overview
 * Get dashboard statistics for admin
 */
export async function GET(request: NextRequest) {
  try {
    // Auth check
    requireAdmin(request);

    // Parse and validate query parameters
    const searchParams = request.nextUrl.searchParams;
    const queryParams = {
      dateFrom: searchParams.get("dateFrom") || undefined,
      dateTo: searchParams.get("dateTo") || undefined,
      vendorId: searchParams.get("vendorId") || undefined,
    };

    const validation = adminOverviewFiltersSchema.safeParse(queryParams);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const { dateFrom, dateTo, vendorId } = validation.data;

    // Build where clause for orders
    const whereClause: any = {
      status: {
        in: [
          "PAYMENT_CONFIRMED",
          "PROCESSING",
          "SHIPPED",
          "DELIVERY_CONFIRMED",
          "DELIVERED",
        ],
      },
    };

    if (dateFrom) {
      whereClause.createdAt = {
        ...(whereClause.createdAt || {}),
        gte: new Date(dateFrom)
      };
    }

    if (dateTo) {
      whereClause.createdAt = {
        ...(whereClause.createdAt || {}),
        lte: new Date(dateTo)
      };
    }

    // If vendorId is specified, filter orders that have items from this vendor
    if (vendorId) {
      whereClause.items = {
        some: {
          vendorId: vendorId,
        },
      };
    }

    // Calculate total revenue
    const revenueResult = await prisma.order.aggregate({
      where: whereClause,
      _sum: {
        totalAmount: true,
      },
      _count: true,
      _avg: {
        totalAmount: true,
      },
    });

    const totalRevenue = revenueResult._sum.totalAmount?.toNumber() || 0;
    const totalOrders = revenueResult._count || 0;
    const averageOrderValue = revenueResult._avg.totalAmount?.toNumber() || 0;

    // Calculate this month's revenue
    const thisMonthStart = startOfMonth(new Date());
    const thisMonthWhere = {
      ...whereClause,
      createdAt: {
        gte: thisMonthStart,
        ...(dateTo && new Date(dateTo) < new Date()
          ? { lte: new Date(dateTo) }
          : {}),
      },
    };

    const thisMonthResult = await prisma.order.aggregate({
      where: thisMonthWhere,
      _sum: {
        totalAmount: true,
      },
    });

    const thisMonthRevenue = thisMonthResult._sum.totalAmount?.toNumber() || 0;

    // Calculate total commission
    const commissionWhere: any = {
      type: "COMMISSION",
    };

    if (dateFrom) {
      commissionWhere.createdAt = { gte: new Date(dateFrom) };
    }

    if (dateTo) {
      commissionWhere.createdAt = {
        ...commissionWhere.createdAt,
        lte: new Date(dateTo),
      };
    }

    if (vendorId) {
      commissionWhere.wallet = {
        vendorId: vendorId,
      };
    }

    const commissionResult = await prisma.walletTransaction.aggregate({
      where: commissionWhere,
      _sum: {
        amount: true,
      },
    });

    const totalCommission = Math.abs(
      commissionResult._sum.amount?.toNumber() || 0
    );

    // Count active vendors (approved vendors with active user accounts)
    const activeVendorsWhere: any = {
      isApproved: true,
      user: {
        isActive: true,
      },
    };

    if (vendorId) {
      activeVendorsWhere.id = vendorId;
    }

    const activeVendors = await prisma.vendor.count({
      where: activeVendorsWhere,
    });

    // Return statistics
    return NextResponse.json({
      success: true,
      data: {
        totalRevenue,
        thisMonthRevenue,
        totalCommission,
        activeVendors,
        totalOrders,
        averageOrderValue,
      },
    });
  } catch (error) {
    console.error("[Admin Overview API] Failed to fetch overview stats:", error);
    console.error("[Admin Overview API] Error details:", error instanceof Error ? error.message : String(error));
    console.error("[Admin Overview API] Error stack:", error instanceof Error ? error.stack : "No stack trace");

    // Handle auth errors
    const authError = handleAuthError(error);
    if (authError) return authError;

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch overview statistics",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

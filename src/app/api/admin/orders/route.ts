/**
 * Admin orders API
 * GET /api/admin/orders - List all orders with advanced filtering
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { orderFiltersSchema } from "@/lib/validations/order";
import { requireAdmin, handleAuthError } from "@/lib/auth-helpers";

/**
 * GET /api/admin/orders
 * List all orders with advanced filtering (admin only)
 */
export async function GET(request: NextRequest) {
  try {
    const admin = requireAdmin(request);

    // Parse and validate query parameters
    const searchParams = request.nextUrl.searchParams;
    const queryParams = {
      page: searchParams.get("page") || "1",
      pageSize: searchParams.get("pageSize") || "20",
      status: searchParams.get("status") || undefined,
      search: searchParams.get("search") || undefined,
      dateFrom: searchParams.get("dateFrom") || undefined,
      dateTo: searchParams.get("dateTo") || undefined,
      // Admin-specific filters
      vendorId: searchParams.get("vendorId") || undefined,
      minAmount: searchParams.get("minAmount") || undefined,
      maxAmount: searchParams.get("maxAmount") || undefined,
    };

    const validation = orderFiltersSchema.safeParse(queryParams);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const {
      page,
      pageSize,
      status,
      search,
      dateFrom,
      dateTo,
      vendorId,
      minAmount,
      maxAmount,
    } = validation.data;

    // Build where clause
    const where: any = {};

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        {
          orderNumber: {
            contains: search,
            mode: "insensitive",
          },
        },
        {
          customer: {
            user: {
              email: {
                contains: search,
                mode: "insensitive",
              },
            },
          },
        },
      ];
    }

    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) {
        where.createdAt.gte = dateFrom;
      }
      if (dateTo) {
        where.createdAt.lte = dateTo;
      }
    }

    if (vendorId) {
      where.items = {
        some: {
          vendorId,
        },
      };
    }

    if (minAmount !== undefined || maxAmount !== undefined) {
      where.totalAmount = {};
      if (minAmount !== undefined) {
        where.totalAmount.gte = minAmount;
      }
      if (maxAmount !== undefined) {
        where.totalAmount.lte = maxAmount;
      }
    }

    // Get total count for pagination
    const totalCount = await prisma.order.count({ where });

    // Calculate pagination
    const totalPages = Math.ceil(totalCount / pageSize);
    const skip = (page - 1) * pageSize;

    // Fetch orders with all related data
    const orders = await prisma.order.findMany({
      where,
      include: {
        customer: {
          include: {
            user: {
              select: { email: true },
            },
          },
        },
        items: {
          include: {
            vendor: {
              select: {
                id: true,
                businessName: true,
                commissionRate: true,
              },
            },
          },
        },
        payment: {
          select: {
            id: true,
            status: true,
            paymentMethod: true,
            paidAt: true,
          },
        },
        _count: {
          select: { items: true },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      skip,
      take: pageSize,
    });

    // Calculate stats
    const statusCounts = await prisma.order.groupBy({
      by: ["status"],
      _count: {
        status: true,
      },
    });

    const stats = {
      total: totalCount,
      pendingPayment: 0,
      paymentConfirmed: 0,
      processing: 0,
      shipped: 0,
      delivered: 0,
      deliveryConfirmed: 0,
      cancelled: 0,
      returnRequested: 0,
    };

    for (const stat of statusCounts) {
      const count = stat._count.status;
      stats[stat.status.toLowerCase() as keyof typeof stats] = count;
    }

    // Calculate total revenue and commission
    const revenueStats = await prisma.order.aggregate({
      where: {
        status: {
          in: ["PAYMENT_CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED", "DELIVERY_CONFIRMED"],
        },
      },
      _sum: {
        totalAmount: true,
      },
    });

    const totalRevenue = revenueStats._sum.totalAmount?.toNumber() || 0;

    // Format orders for response
    const formattedOrders = orders.map((order) => {
      // Calculate commission earned from this order
      const commissionEarned = order.items.reduce((sum, item) => {
        const itemTotal = item.totalPrice.toNumber();
        const commission = (itemTotal * item.vendor.commissionRate.toNumber()) / 100;
        return sum + commission;
      }, 0);

      // Get unique vendors in this order
      const vendors = [...new Set(order.items.map((item) => item.vendor.businessName))];

      return {
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        subtotal: order.subtotal.toNumber(),
        discountAmount: order.discountAmount.toNumber(),
        totalAmount: order.totalAmount.toNumber(),
        commissionEarned,
        createdAt: order.createdAt.toISOString(),
        customer: {
          email: order.customer.user.email,
        },
        vendors,
        itemCount: order._count.items,
        payment: order.payment
          ? {
              status: order.payment.status,
              method: order.payment.paymentMethod,
              paidAt: order.payment.paidAt?.toISOString() || null,
            }
          : null,
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        orders: formattedOrders,
        pagination: {
          page,
          pageSize,
          totalCount,
          totalPages,
        },
        stats: {
          ...stats,
          totalRevenue,
        },
      },
    });
  } catch (error) {
    console.error("[Admin Orders API] Error fetching orders:", error);

    // Handle auth errors
    const authError = handleAuthError(error);
    if (authError) return authError;

    return NextResponse.json(
      { success: false, error: "Failed to fetch orders" },
      { status: 500 }
    );
  }
}

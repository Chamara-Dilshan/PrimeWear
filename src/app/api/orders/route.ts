/**
 * Customer orders API
 * GET /api/orders - List customer's orders with pagination and filtering
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client";
import { orderFiltersSchema } from "@/lib/validations/order";

async function requireCustomer(request: NextRequest): Promise<string | null> {
  const userId = request.headers.get("X-User-Id");
  const userRole = request.headers.get("X-User-Role");

  if (!userId || userRole !== UserRole.CUSTOMER) {
    return null;
  }

  const customer = await prisma.customer.findUnique({
    where: { userId },
  });

  return customer?.id || null;
}

/**
 * GET /api/orders
 * List customer's orders with pagination, filtering, and stats
 */
export async function GET(request: NextRequest) {
  try {
    const customerId = await requireCustomer(request);

    if (!customerId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Parse and validate query parameters
    const searchParams = request.nextUrl.searchParams;
    const queryParams = {
      page: searchParams.get("page") || "1",
      pageSize: searchParams.get("pageSize") || "20",
      status: searchParams.get("status") || undefined,
      search: searchParams.get("search") || undefined,
      dateFrom: searchParams.get("dateFrom") || undefined,
      dateTo: searchParams.get("dateTo") || undefined,
    };

    const validation = orderFiltersSchema.safeParse(queryParams);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const { page, pageSize, status, search, dateFrom, dateTo } = validation.data;

    // Build where clause
    const where: any = {
      customerId,
    };

    if (status) {
      where.status = status;
    }

    if (search) {
      where.orderNumber = {
        contains: search,
        mode: "insensitive",
      };
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

    // Get total count for pagination
    const totalCount = await prisma.order.count({ where });

    // Calculate pagination
    const totalPages = Math.ceil(totalCount / pageSize);
    const skip = (page - 1) * pageSize;

    // Fetch orders with items (for display)
    const orders = await prisma.order.findMany({
      where,
      include: {
        items: {
          select: {
            id: true,
            productSnapshot: true,
            variantSnapshot: true,
            quantity: true,
            unitPrice: true,
            totalPrice: true,
          },
          take: 3, // Only include first 3 items for list view
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

    // Calculate stats (counts by status)
    const statusCounts = await prisma.order.groupBy({
      by: ["status"],
      where: {
        customerId,
      },
      _count: {
        status: true,
      },
    });

    const stats = {
      total: totalCount,
      pending: 0,
      processing: 0,
      completed: 0,
      cancelled: 0,
    };

    for (const stat of statusCounts) {
      const count = stat._count.status;
      if (["PENDING_PAYMENT", "PAYMENT_CONFIRMED"].includes(stat.status)) {
        stats.pending += count;
      } else if (["PROCESSING", "SHIPPED", "DELIVERED"].includes(stat.status)) {
        stats.processing += count;
      } else if (["DELIVERY_CONFIRMED"].includes(stat.status)) {
        stats.completed += count;
      } else if (["CANCELLED", "RETURNED"].includes(stat.status)) {
        stats.cancelled += count;
      }
    }

    // Format orders for response
    const formattedOrders = orders.map((order) => ({
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      subtotal: order.subtotal.toNumber(),
      discountAmount: order.discountAmount.toNumber(),
      shippingAmount: order.shippingAmount.toNumber(),
      totalAmount: order.totalAmount.toNumber(),
      itemCount: order._count.items,
      previewItems: order.items.map((item) => ({
        id: item.id,
        productSnapshot: item.productSnapshot,
        variantSnapshot: item.variantSnapshot,
        quantity: item.quantity,
        unitPrice: item.unitPrice.toNumber(),
        totalPrice: item.totalPrice.toNumber(),
      })),
      createdAt: order.createdAt.toISOString(),
    }));

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
        stats,
      },
    });
  } catch (error) {
    console.error("[Orders API] Error fetching orders:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch orders" },
      { status: 500 }
    );
  }
}

/**
 * Vendor orders API
 * GET /api/vendor/orders - List orders containing vendor's items
 */

import { NextRequest, NextResponse } from "next/server";
import { requireVendor, handleAuthError } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { orderFiltersSchema } from "@/lib/validations/order";

/**
 * GET /api/vendor/orders
 * List orders containing vendor's items with pagination and filtering
 */
export async function GET(request: NextRequest) {
  try {
    // Auth check
    const user = requireVendor(request);

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
    // We need to find orders that have at least one item from this vendor
    const where: any = {
      items: {
        some: {
          vendorId,
        },
      },
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

    // Fetch orders with vendor's items only
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
          where: {
            vendorId, // Only include this vendor's items
          },
          select: {
            id: true,
            productSnapshot: true,
            variantSnapshot: true,
            quantity: true,
            unitPrice: true,
            totalPrice: true,
            status: true,
            trackingNumber: true,
            trackingUrl: true,
            shippedAt: true,
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

    // Calculate stats (counts by status)
    const statusCounts = await prisma.order.groupBy({
      by: ["status"],
      where: {
        items: {
          some: {
            vendorId,
          },
        },
      },
      _count: {
        status: true,
      },
    });

    const stats = {
      total: totalCount,
      paymentConfirmed: 0,
      processing: 0,
      shipped: 0,
      delivered: 0,
    };

    for (const stat of statusCounts) {
      const count = stat._count.status;
      if (stat.status === "PAYMENT_CONFIRMED") {
        stats.paymentConfirmed += count;
      } else if (stat.status === "PROCESSING") {
        stats.processing += count;
      } else if (stat.status === "SHIPPED") {
        stats.shipped += count;
      } else if (["DELIVERED", "DELIVERY_CONFIRMED"].includes(stat.status)) {
        stats.delivered += count;
      }
    }

    // Format orders for response
    const formattedOrders = orders.map((order) => {
      // Calculate vendor's total for this order
      const vendorTotal = order.items.reduce((sum, item) => {
        return sum + item.totalPrice.toNumber();
      }, 0);

      return {
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        totalAmount: order.totalAmount.toNumber(), // Total order amount
        vendorTotal, // This vendor's portion
        createdAt: order.createdAt.toISOString(),
        customer: {
          email: order.customer.user.email,
        },
        vendorItems: order.items.map((item) => ({
          id: item.id,
          productSnapshot: item.productSnapshot,
          variantSnapshot: item.variantSnapshot,
          quantity: item.quantity,
          unitPrice: item.unitPrice.toNumber(),
          totalPrice: item.totalPrice.toNumber(),
          status: item.status,
          trackingNumber: item.trackingNumber,
          trackingUrl: item.trackingUrl,
          shippedAt: item.shippedAt?.toISOString() || null,
        })),
        shippingAddress: order.shippingAddressJson, // Vendor needs this to ship
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
        stats,
      },
    });
  } catch (error) {
    console.error("[Vendor Orders API] Error fetching orders:", error);

    // Handle auth errors
    const authError = handleAuthError(error);
    if (authError) return authError;

    return NextResponse.json(
      { success: false, error: "Failed to fetch orders" },
      { status: 500 }
    );
  }
}

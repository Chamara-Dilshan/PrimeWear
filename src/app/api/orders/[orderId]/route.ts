/**
 * Order details API
 * GET /api/orders/[orderId] - Fetch order details with status history and actions
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client";
import { calculateOrderActions } from "@/lib/utils/order";

/**
 * Helper to get authenticated user info
 */
async function getAuthenticatedUser(request: NextRequest): Promise<{
  userId: string;
  role: UserRole;
  customerId?: string;
  vendorId?: string;
} | null> {
  const userId = request.headers.get("X-User-Id");
  const userRole = request.headers.get("X-User-Role");

  if (!userId || !userRole) {
    return null;
  }

  const role = userRole as UserRole;

  // Get customer or vendor ID based on role
  if (role === UserRole.CUSTOMER) {
    const customer = await prisma.customer.findUnique({
      where: { userId },
    });
    return customer ? { userId, role, customerId: customer.id } : null;
  }

  if (role === UserRole.VENDOR) {
    const vendor = await prisma.vendor.findUnique({
      where: { userId },
    });
    return vendor ? { userId, role, vendorId: vendor.id } : null;
  }

  // Admin
  return { userId, role };
}

/**
 * GET /api/orders/[orderId]
 * Fetch order details with payment info
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const auth = await getAuthenticatedUser(request);

    if (!auth) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { orderId } = await params;

    // Fetch order with all related data
    const order = await prisma.order.findUnique({
      where: { id: orderId },
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
              },
            },
          },
          orderBy: {
            createdAt: "asc",
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
        statusHistory: {
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json(
        { success: false, error: "Order not found" },
        { status: 404 }
      );
    }

    // Authorization check
    if (auth.role === UserRole.CUSTOMER) {
      // Customer can only view their own orders
      if (order.customerId !== auth.customerId) {
        return NextResponse.json(
          { success: false, error: "Order does not belong to you" },
          { status: 403 }
        );
      }
    } else if (auth.role === UserRole.VENDOR) {
      // Vendor can only view orders containing their items
      const hasVendorItems = order.items.some(
        (item) => item.vendorId === auth.vendorId
      );

      if (!hasVendorItems) {
        return NextResponse.json(
          { success: false, error: "Order does not contain your items" },
          { status: 403 }
        );
      }
    }
    // Admin can view all orders (no check needed)

    // Calculate available actions for customer
    const actions = calculateOrderActions({
      status: order.status,
      createdAt: order.createdAt,
      deliveryConfirmedAt: order.deliveryConfirmedAt,
    });

    // Group items by vendor
    const itemsByVendor = order.items.reduce((acc, item) => {
      const vendorId = item.vendorId;
      if (!acc[vendorId]) {
        acc[vendorId] = {
          vendorId: item.vendor.id,
          vendorName: item.vendor.businessName,
          items: [],
          // Get overall status of vendor items (all items have same vendor-level status)
          status: item.status,
          trackingNumber: item.trackingNumber,
          trackingUrl: item.trackingUrl,
          shippedAt: item.shippedAt?.toISOString() || null,
        };
      }
      acc[vendorId].items.push({
        id: item.id,
        productSnapshot: item.productSnapshot,
        variantSnapshot: item.variantSnapshot,
        unitPrice: item.unitPrice.toNumber(),
        quantity: item.quantity,
        totalPrice: item.totalPrice.toNumber(),
        status: item.status,
      });
      return acc;
    }, {} as Record<string, any>);

    // Return order details with enhanced data
    return NextResponse.json({
      success: true,
      data: {
        order: {
          id: order.id,
          orderNumber: order.orderNumber,
          status: order.status,
          subtotal: order.subtotal.toNumber(),
          discountAmount: order.discountAmount.toNumber(),
          shippingAmount: order.shippingAmount.toNumber(),
          totalAmount: order.totalAmount.toNumber(),
          shippingAddress: order.shippingAddressJson,
          notes: order.notes,
          cancelReason: order.cancelReason,
          cancelledAt: order.cancelledAt?.toISOString() || null,
          deliveryConfirmedAt: order.deliveryConfirmedAt?.toISOString() || null,
          createdAt: order.createdAt.toISOString(),
          customer: {
            email: order.customer.user.email,
          },
          items: order.items.map((item) => ({
            id: item.id,
            productSnapshot: item.productSnapshot,
            variantSnapshot: item.variantSnapshot,
            unitPrice: item.unitPrice.toNumber(),
            quantity: item.quantity,
            totalPrice: item.totalPrice.toNumber(),
            status: item.status,
            trackingNumber: item.trackingNumber,
            trackingUrl: item.trackingUrl,
            shippedAt: item.shippedAt?.toISOString() || null,
            vendor: {
              id: item.vendor.id,
              businessName: item.vendor.businessName,
            },
          })),
          itemsByVendor: Object.values(itemsByVendor),
          payment: order.payment
            ? {
                id: order.payment.id,
                status: order.payment.status,
                method: order.payment.paymentMethod,
                paidAt: order.payment.paidAt?.toISOString() || null,
              }
            : null,
          statusHistory: order.statusHistory.map((history) => ({
            id: history.id,
            status: history.status,
            note: history.note,
            createdAt: history.createdAt.toISOString(),
            createdBy: history.createdBy || null,
          })),
          // Action flags for UI (only meaningful for customers)
          actions: auth.role === UserRole.CUSTOMER ? actions : undefined,
        },
      },
    });
  } catch (error) {
    console.error("Order details error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch order details" },
      { status: 500 }
    );
  }
}

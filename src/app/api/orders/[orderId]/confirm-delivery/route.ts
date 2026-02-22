/**
 * Confirm delivery API
 * POST /api/orders/[orderId]/confirm-delivery - Customer confirms delivery
 * CRITICAL: This endpoint releases funds from pendingBalance to availableBalance
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client";
import { validateStatusTransition } from "@/lib/utils/order";
import { releaseVendorFunds } from "@/lib/utils/wallet";
import { createNotification } from "@/lib/notifications/notificationService";
import { NotificationType } from "@/types/notification";

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
 * POST /api/orders/[orderId]/confirm-delivery
 * Customer confirms delivery of order
 * Releases funds from vendor pendingBalance to availableBalance
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { orderId: string } }
) {
  try {
    const customerId = await requireCustomer(request);

    if (!customerId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { orderId } = params;

    // Fetch order
    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      return NextResponse.json(
        { success: false, error: "Order not found" },
        { status: 404 }
      );
    }

    // Verify order belongs to customer
    if (order.customerId !== customerId) {
      return NextResponse.json(
        { success: false, error: "Order does not belong to you" },
        { status: 403 }
      );
    }

    // Check if already confirmed (idempotency)
    if (order.deliveryConfirmedAt !== null) {
      return NextResponse.json({
        success: true,
        data: {
          message: "Delivery already confirmed",
          order: {
            id: order.id,
            orderNumber: order.orderNumber,
            status: order.status,
            deliveryConfirmedAt: order.deliveryConfirmedAt.toISOString(),
          },
        },
      });
    }

    // Validate status transition
    const transitionValidation = validateStatusTransition(
      order.status,
      "DELIVERY_CONFIRMED",
      "CUSTOMER",
      order.createdAt,
      order.deliveryConfirmedAt
    );

    if (!transitionValidation.isValid) {
      return NextResponse.json(
        { success: false, error: transitionValidation.error },
        { status: 400 }
      );
    }

    // Confirm delivery and release funds in atomic transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Update order status and set confirmation timestamp
      const updatedOrder = await tx.order.update({
        where: { id: orderId },
        data: {
          status: "DELIVERY_CONFIRMED",
          deliveryConfirmedAt: new Date(),
        },
      });

      // 2. Create status history
      await tx.orderStatusHistory.create({
        data: {
          orderId,
          status: "DELIVERY_CONFIRMED",
          note: "Customer confirmed delivery",
          createdBy: null, // Customer action
        },
      });

      // 3. CRITICAL: Release vendor funds
      // Moves funds from pendingBalance to availableBalance
      await releaseVendorFunds(orderId, order.orderNumber, tx);

      return updatedOrder;
    });

    console.log(`[Order] Delivery confirmed for order ${order.orderNumber}:`, {
      orderId,
      customerId,
      confirmedAt: result.deliveryConfirmedAt?.toISOString(),
    });

    // Send notification to customer
    try {
      await createNotification({
        userId: order.userId,
        type: NotificationType.ORDER_DELIVERY_CONFIRMED,
        title: "Delivery Confirmed",
        message: `Thank you for confirming delivery of order ${order.orderNumber}. Your order is now complete.`,
        link: `/orders/${orderId}`,
        metadata: {
          orderId,
          orderNumber: order.orderNumber,
        },
      });
    } catch (notifError) {
      console.error("[Order Confirm Delivery] Failed to send notification:", notifError);
    }

    return NextResponse.json({
      success: true,
      data: {
        order: {
          id: result.id,
          orderNumber: result.orderNumber,
          status: result.status,
          deliveryConfirmedAt: result.deliveryConfirmedAt?.toISOString() || null,
        },
      },
    });
  } catch (error) {
    console.error("[Order Confirm Delivery] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to confirm delivery",
      },
      { status: 500 }
    );
  }
}

/**
 * Request return API
 * POST /api/orders/[orderId]/request-return - Customer requests return (within 24h of delivery confirmation)
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client";
import { requestReturnSchema } from "@/lib/validations/order";
import { validateStatusTransition } from "@/lib/utils/order";
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
 * POST /api/orders/[orderId]/request-return
 * Request return within 24 hours of delivery confirmation
 * Return processing (approval/refund) will be handled by Admin in Phase 14 (Dispute System)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const customerId = await requireCustomer(request);

    if (!customerId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { orderId } = await params;

    // Validate request body
    const body = await request.json();
    const validation = requestReturnSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const { reason, description } = validation.data;

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

    // Validate status transition (checks 24h window from delivery confirmation)
    const transitionValidation = validateStatusTransition(
      order.status,
      "RETURN_REQUESTED",
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

    // Request return in atomic transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Update order status
      const updatedOrder = await tx.order.update({
        where: { id: orderId },
        data: {
          status: "RETURN_REQUESTED",
        },
      });

      // 2. Create status history with return reason
      await tx.orderStatusHistory.create({
        data: {
          orderId,
          status: "RETURN_REQUESTED",
          note: `Return requested by customer: ${reason}${
            description ? `\n${description}` : ""
          }`,
          createdBy: null, // Customer action
        },
      });

      // TODO: In Phase 15 (Notification System), notify:
      // - Admin: Review return request
      // - Vendor(s): Return request for their items
      console.log(
        `[Order] Return requested for order ${order.orderNumber}. Admin notification pending (Phase 15).`
      );

      return updatedOrder;
    });

    console.log(`[Order] Return requested for order ${order.orderNumber}:`, {
      orderId,
      customerId,
      reason,
    });

    // Send notification to customer
    try {
      await createNotification({
        userId: order.userId,
        type: NotificationType.ORDER_RETURN_REQUESTED,
        title: "Return Request Submitted",
        message: `Your return request for order ${order.orderNumber} has been submitted. An admin will review it shortly.`,
        link: `/orders/${orderId}`,
        metadata: {
          orderId,
          orderNumber: order.orderNumber,
          reason,
        },
      });
    } catch (notifError) {
      console.error("[Order Request Return] Failed to send notification:", notifError);
    }

    return NextResponse.json({
      success: true,
      data: {
        order: {
          id: result.id,
          orderNumber: result.orderNumber,
          status: result.status,
        },
        message:
          "Return request submitted. An admin will review your request shortly.",
      },
    });
  } catch (error) {
    console.error("[Order Request Return] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to request return",
      },
      { status: 500 }
    );
  }
}

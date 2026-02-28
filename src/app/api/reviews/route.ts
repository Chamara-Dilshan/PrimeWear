/**
 * Reviews API
 * POST /api/reviews — Customer submits a product review
 * GET  /api/reviews — Check if customer has reviewed a specific order item
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createReviewSchema = z.object({
  orderItemId: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(1000).optional().nullable(),
});

export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get("X-User-Id");
    const userRole = request.headers.get("X-User-Role");

    if (!userId || userRole !== "CUSTOMER") {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get customer record
    const customer = await prisma.customer.findUnique({
      where: { userId },
    });
    if (!customer) {
      return NextResponse.json(
        { success: false, error: "Customer not found" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const validation = createReviewSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const { orderItemId, rating, comment } = validation.data;

    // Fetch the order item and verify ownership + order status
    const orderItem = await prisma.orderItem.findUnique({
      where: { id: orderItemId },
      include: {
        order: {
          select: { status: true, customerId: true },
        },
        review: true,
      },
    });

    if (!orderItem) {
      return NextResponse.json(
        { success: false, error: "Order item not found" },
        { status: 404 }
      );
    }

    // Verify this order belongs to the customer
    if (orderItem.order.customerId !== customer.id) {
      return NextResponse.json(
        { success: false, error: "You did not purchase this item" },
        { status: 403 }
      );
    }

    // Only allow reviews after delivery is confirmed
    if (
      !["DELIVERY_CONFIRMED", "RETURN_REQUESTED", "RETURNED", "DISPUTED", "REFUNDED"].includes(
        orderItem.order.status
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "You can only review items after confirming delivery",
        },
        { status: 400 }
      );
    }

    // Upsert: create or update the review for this order item
    const review = await prisma.productReview.upsert({
      where: { orderItemId },
      create: {
        productId: orderItem.productId,
        customerId: customer.id,
        orderItemId,
        rating,
        comment: comment || null,
      },
      update: {
        rating,
        comment: comment || null,
      },
    });

    return NextResponse.json({
      success: true,
      data: { review },
    });
  } catch (error) {
    console.error("Create review error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to submit review" },
      { status: 500 }
    );
  }
}

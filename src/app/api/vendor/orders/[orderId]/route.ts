/**
 * Vendor order details API
 * GET /api/vendor/orders/[orderId] - Get single order details for vendor
 */

import { NextRequest, NextResponse } from "next/server";
import { requireVendor, handleAuthError } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/vendor/orders/[orderId]
 * Returns order details scoped to this vendor's items
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const user = requireVendor(request);

    // Look up vendor record (TokenPayload has no vendorId field)
    const vendorRecord = await prisma.vendor.findUnique({
      where: { userId: user.userId },
    });
    if (!vendorRecord) {
      return NextResponse.json(
        { success: false, error: "Vendor not found" },
        { status: 404 }
      );
    }
    const vendorId = vendorRecord.id;

    const { orderId } = await params;

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        customer: {
          include: {
            user: { select: { email: true } },
          },
        },
        items: {
          where: { vendorId },
          include: {
            chatRoom: { select: { id: true } },
          },
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!order) {
      return NextResponse.json(
        { success: false, error: "Order not found" },
        { status: 404 }
      );
    }

    // Ensure this order actually contains vendor's items
    if (order.items.length === 0) {
      return NextResponse.json(
        { success: false, error: "Order does not contain your items" },
        { status: 403 }
      );
    }

    const vendorItems = order.items.map((item) => ({
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
      chatRoomId: item.chatRoom?.id || null,
    }));

    return NextResponse.json({
      success: true,
      data: {
        order: {
          id: order.id,
          orderNumber: order.orderNumber,
          status: order.status,
          customerEmail: order.customer.user.email,
          notes: order.notes,
          createdAt: order.createdAt.toISOString(),
        },
        vendorItems,
        shippingAddress: order.shippingAddressJson,
      },
    });
  } catch (error) {
    console.error("[Vendor Order Detail] Error:", error);

    const authError = handleAuthError(error);
    if (authError) return authError;

    return NextResponse.json(
      { success: false, error: "Failed to fetch order details" },
      { status: 500 }
    );
  }
}

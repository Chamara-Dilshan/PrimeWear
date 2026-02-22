import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client";

/**
 * Helper function to require customer authentication
 */
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
 * DELETE /api/cart/clear
 * Clear all items from cart
 */
export async function DELETE(request: NextRequest) {
  try {
    const customerId = await requireCustomer(request);

    if (!customerId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get customer's cart
    const cart = await prisma.cart.findUnique({
      where: { customerId },
    });

    if (!cart) {
      // No cart exists, return empty cart response
      return NextResponse.json({
        success: true,
        data: {
          cart: {
            items: [],
          },
          itemCount: 0,
          subtotal: 0,
        },
      });
    }

    // Delete all cart items
    await prisma.cartItem.deleteMany({
      where: { cartId: cart.id },
    });

    return NextResponse.json({
      success: true,
      data: {
        cart: {
          id: cart.id,
          items: [],
        },
        itemCount: 0,
        subtotal: 0,
      },
    });
  } catch (error) {
    console.error("Error clearing cart:", error);
    return NextResponse.json(
      { success: false, error: "Failed to clear cart" },
      { status: 500 }
    );
  }
}

/**
 * Coupon validation API
 * POST /api/coupons/validate - Validate coupon and calculate discount
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client";
import { validateCouponSchema } from "@/lib/validations/checkout";
import { calculateDiscount } from "@/lib/utils/order";

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
 * POST /api/coupons/validate
 * Validate coupon code and calculate discount
 */
export async function POST(request: NextRequest) {
  try {
    const customerId = await requireCustomer(request);

    if (!customerId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validation = validateCouponSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const { code, subtotal, cartItems } = validation.data;

    // Find coupon
    const coupon = await prisma.coupon.findUnique({
      where: { code },
    });

    if (!coupon) {
      return NextResponse.json({
        success: true,
        data: {
          isValid: false,
          error: "Invalid coupon code",
        },
      });
    }

    // Check if active
    if (!coupon.isActive) {
      return NextResponse.json({
        success: true,
        data: {
          isValid: false,
          error: "This coupon is no longer active",
        },
      });
    }

    // Check date validity
    const now = new Date();
    if (now < coupon.validFrom) {
      return NextResponse.json({
        success: true,
        data: {
          isValid: false,
          error: "This coupon is not yet valid",
        },
      });
    }

    if (coupon.validUntil && now > coupon.validUntil) {
      return NextResponse.json({
        success: true,
        data: {
          isValid: false,
          error: "This coupon has expired",
        },
      });
    }

    // Check usage limit
    if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
      return NextResponse.json({
        success: true,
        data: {
          isValid: false,
          error: "This coupon has reached its usage limit",
        },
      });
    }

    // Check per-user limit
    const userUsageCount = await prisma.couponUsage.count({
      where: {
        couponId: coupon.id,
        customerId,
      },
    });

    if (userUsageCount >= coupon.perUserLimit) {
      return NextResponse.json({
        success: true,
        data: {
          isValid: false,
          error: "You have already used this coupon",
        },
      });
    }

    // Check minimum order amount
    if (
      coupon.minOrderAmount &&
      subtotal < coupon.minOrderAmount.toNumber()
    ) {
      return NextResponse.json({
        success: true,
        data: {
          isValid: false,
          error: `Minimum order amount is Rs. ${coupon.minOrderAmount.toNumber()}`,
        },
      });
    }

    // Check vendor-specific coupon
    if (coupon.vendorId) {
      const hasVendorProducts = cartItems.some(
        (item) => item.vendorId === coupon.vendorId
      );

      if (!hasVendorProducts) {
        return NextResponse.json({
          success: true,
          data: {
            isValid: false,
            error: "This coupon is only valid for specific vendor products",
          },
        });
      }
    }

    // Calculate discount
    const discountAmount = calculateDiscount(
      subtotal,
      coupon.type,
      coupon.value,
      coupon.maxDiscount
    );

    return NextResponse.json({
      success: true,
      data: {
        isValid: true,
        coupon: {
          id: coupon.id,
          code: coupon.code,
          type: coupon.type,
          value: coupon.value.toNumber(),
          minOrderAmount: coupon.minOrderAmount?.toNumber() || null,
          maxDiscount: coupon.maxDiscount?.toNumber() || null,
          vendorId: coupon.vendorId,
        },
        discount: {
          amount: discountAmount,
          type: coupon.type,
          originalSubtotal: subtotal,
          finalSubtotal: subtotal - discountAmount,
        },
      },
    });
  } catch (error) {
    console.error("Error validating coupon:", error);
    return NextResponse.json(
      { success: false, error: "Failed to validate coupon" },
      { status: 500 }
    );
  }
}

/**
 * Vendor wallet API
 * GET /api/vendor/wallet - Get wallet balance and stats
 */

import { NextRequest, NextResponse } from "next/server";
import { requireVendor, handleAuthError } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { startOfMonth } from "date-fns";

/**
 * GET /api/vendor/wallet
 * Get vendor wallet balance and statistics
 */
export async function GET(request: NextRequest) {
  try {
    // Auth check
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

    // Fetch wallet with balances
    const wallet = await prisma.wallet.findUnique({
      where: { vendorId },
    });

    if (!wallet) {
      return NextResponse.json(
        { success: false, error: "Wallet not found" },
        { status: 404 }
      );
    }

    // Calculate this month's earnings (sum of RELEASE transactions)
    const monthStart = startOfMonth(new Date());
    const thisMonthTransactions = await prisma.walletTransaction.aggregate({
      where: {
        walletId: wallet.id,
        type: "RELEASE",
        createdAt: {
          gte: monthStart,
        },
      },
      _sum: {
        amount: true,
      },
    });

    const thisMonthEarnings = thisMonthTransactions._sum.amount?.toNumber() || 0;

    // Count pending payouts
    const pendingPayouts = await prisma.payout.count({
      where: {
        walletId: wallet.id,
        status: "PENDING",
      },
    });

    // Count completed payouts
    const completedPayouts = await prisma.payout.count({
      where: {
        walletId: wallet.id,
        status: "COMPLETED",
      },
    });

    // Format response
    return NextResponse.json({
      success: true,
      data: {
        vendor: {
          businessName: vendorRecord.businessName,
          isShopOpen: vendorRecord.isShopOpen,
        },
        balance: {
          pendingBalance: wallet.pendingBalance.toNumber(),
          availableBalance: wallet.availableBalance.toNumber(),
          totalEarnings: wallet.totalEarnings.toNumber(),
          totalWithdrawn: wallet.totalWithdrawn.toNumber(),
        },
        stats: {
          thisMonthEarnings,
          pendingPayouts,
          completedPayouts,
        },
      },
    });
  } catch (error) {
    console.error("[Vendor Wallet API] Error fetching wallet:", error);

    // Handle auth errors
    const authError = handleAuthError(error);
    if (authError) return authError;

    return NextResponse.json(
      { success: false, error: "Failed to fetch wallet" },
      { status: 500 }
    );
  }
}

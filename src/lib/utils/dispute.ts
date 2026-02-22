import { prisma } from '@/lib/prisma';
import {
  DisputeStatus,
  ResolutionType,
  DisputeEligibilityResult,
  DisputeRefundCalculation,
  DISPUTE_ELIGIBLE_ORDER_STATUSES,
  DISPUTE_WINDOW_DAYS,
} from '@/types/dispute';
import { Decimal } from '@prisma/client/runtime/library';

/**
 * Check if an order is eligible for dispute creation
 */
export async function checkDisputeEligibility(
  orderId: string,
  customerId: string
): Promise<DisputeEligibilityResult> {
  // Fetch order with necessary details
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      disputes: {
        where: {
          status: {
            notIn: [DisputeStatus.CLOSED],
          },
        },
        select: { id: true, status: true },
      },
      statusHistory: {
        where: {
          status: {
            in: ['DELIVERED', 'DELIVERY_CONFIRMED'],
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
    },
  });

  // Check if order exists
  if (!order) {
    return {
      eligible: false,
      reason: 'Order not found',
    };
  }

  // Check if order belongs to customer
  if (order.customerId !== customerId) {
    return {
      eligible: false,
      reason: 'You do not have permission to dispute this order',
    };
  }

  // Check if order status allows disputes
  if (!DISPUTE_ELIGIBLE_ORDER_STATUSES.includes(order.status as any)) {
    return {
      eligible: false,
      reason: `Disputes can only be opened for delivered or returned orders. Current status: ${order.status}`,
    };
  }

  // Check if there's already an active dispute
  const activeDispute = order.disputes.find(
    (d) =>
      d.status === DisputeStatus.OPEN || d.status === DisputeStatus.IN_REVIEW
  );
  if (activeDispute) {
    return {
      eligible: false,
      reason: 'An active dispute already exists for this order',
      existingDisputeId: activeDispute.id,
    };
  }

  // Check time window (7 days after delivery)
  const deliveryDate = order.statusHistory[0]?.createdAt;
  if (deliveryDate) {
    const daysSinceDelivery = Math.floor(
      (Date.now() - deliveryDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    if (daysSinceDelivery > DISPUTE_WINDOW_DAYS) {
      return {
        eligible: false,
        reason: `Disputes must be opened within ${DISPUTE_WINDOW_DAYS} days of delivery`,
      };
    }
  }

  return { eligible: true };
}

/**
 * Calculate refund amount for dispute resolution
 */
export async function calculateDisputeRefund(
  orderId: string,
  customRefundAmount?: number
): Promise<DisputeRefundCalculation> {
  // Fetch order with all necessary data
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: {
        include: {
          product: {
            include: {
              vendor: {
                select: {
                  id: true,
                  businessName: true,
                  commissionRate: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!order) {
    throw new Error('Order not found');
  }

  const orderTotal = order.totalAmount.toNumber();
  const refundAmount = customRefundAmount ?? orderTotal;

  // Calculate vendor refunds
  const vendorRefunds: Array<{
    vendorId: string;
    vendorName: string;
    amount: number;
    commissionReversed: number;
  }> = [];

  // Group items by vendor
  const itemsByVendor = new Map<string, typeof order.items>();
  for (const item of order.items) {
    const vendorId = item.vendorId;
    if (!itemsByVendor.has(vendorId)) {
      itemsByVendor.set(vendorId, []);
    }
    itemsByVendor.get(vendorId)!.push(item);
  }

  // Calculate refund per vendor
  let totalCommission = 0;
  for (const [vendorId, items] of itemsByVendor) {
    const vendorTotal = items.reduce(
      (sum, item) => sum + item.unitPrice.toNumber() * item.quantity,
      0
    );

    // Proportional refund
    const vendorRefundAmount = (vendorTotal / orderTotal) * refundAmount;

    // Get commission rate
    const commissionRate = items[0].product.vendor.commissionRate.toNumber();
    const commissionReversed = vendorRefundAmount * (commissionRate / 100);

    vendorRefunds.push({
      vendorId,
      vendorName: items[0].product.vendor.businessName,
      amount: vendorRefundAmount,
      commissionReversed,
    });

    totalCommission += commissionReversed;
  }

  return {
    orderTotal,
    refundAmount,
    platformCommission: totalCommission,
    vendorRefunds,
  };
}

/**
 * Process dispute refund (reverse wallet transactions)
 * This is called when a dispute is resolved in customer's favor
 */
export async function processDisputeRefund(
  orderId: string,
  disputeId: string,
  customRefundAmount?: number
): Promise<void> {
  const refundCalc = await calculateDisputeRefund(orderId, customRefundAmount);

  await prisma.$transaction(async (tx) => {
    // Process refund for each vendor
    for (const vendorRefund of refundCalc.vendorRefunds) {
      const wallet = await tx.wallet.findUnique({
        where: { vendorId: vendorRefund.vendorId },
      });

      if (!wallet) {
        throw new Error(`Wallet not found for vendor ${vendorRefund.vendorId}`);
      }

      // Reverse the HOLD transaction (subtract from available balance)
      // Note: If funds were already released, they'll be in availableBalance
      // If not yet released, they'll be in pendingBalance
      const vendorAmount = new Decimal(vendorRefund.amount);
      const commissionAmount = new Decimal(vendorRefund.commissionReversed);

      // Calculate net amount vendor received (amount - commission)
      const vendorNetAmount = vendorAmount.minus(commissionAmount);

      // Deduct from available balance (if released) or pending balance (if not)
      await tx.wallet.update({
        where: { vendorId: vendorRefund.vendorId },
        data: {
          availableBalance: {
            decrement: vendorNetAmount,
          },
          totalEarnings: {
            decrement: vendorAmount,
          },
        },
      });

      // Create REFUND transaction for the vendor
      await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          type: 'REFUND',
          amount: vendorAmount.negated(), // Negative amount to indicate refund
          description: `Refund for dispute #${disputeId.slice(0, 8)} - Order ${orderId.slice(0, 8)}`,
          referenceId: disputeId,
          referenceType: 'DISPUTE',
        },
      });

      // Reverse commission (create COMMISSION_REVERSAL transaction)
      await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          type: 'COMMISSION',
          amount: commissionAmount, // Positive amount (commission returned to vendor)
          description: `Commission reversal for dispute #${disputeId.slice(0, 8)}`,
          referenceId: disputeId,
          referenceType: 'DISPUTE',
        },
      });
    }

    // Update order status to indicate refund processed
    await tx.order.update({
      where: { id: orderId },
      data: {
        status: 'REFUNDED',
      },
    });

    // Create order status history
    await tx.orderStatusHistory.create({
      data: {
        orderId,
        status: 'REFUNDED',
        notes: `Order refunded due to dispute resolution (Dispute #${disputeId.slice(0, 8)})`,
      },
    });
  });
}

/**
 * Validate status transition for disputes
 */
export function validateDisputeStatusTransition(
  currentStatus: DisputeStatus,
  newStatus: DisputeStatus
): { valid: boolean; error?: string } {
  const validTransitions: Record<DisputeStatus, DisputeStatus[]> = {
    [DisputeStatus.OPEN]: [DisputeStatus.IN_REVIEW, DisputeStatus.CLOSED],
    [DisputeStatus.IN_REVIEW]: [
      DisputeStatus.RESOLVED_CUSTOMER_FAVOR,
      DisputeStatus.RESOLVED_VENDOR_FAVOR,
      DisputeStatus.CLOSED,
    ],
    [DisputeStatus.RESOLVED_CUSTOMER_FAVOR]: [], // Final state
    [DisputeStatus.RESOLVED_VENDOR_FAVOR]: [], // Final state
    [DisputeStatus.CLOSED]: [], // Final state
  };

  if (!validTransitions[currentStatus].includes(newStatus)) {
    return {
      valid: false,
      error: `Invalid status transition from ${currentStatus} to ${newStatus}`,
    };
  }

  return { valid: true };
}

/**
 * Map resolution type to dispute status
 */
export function getDisputeStatusFromResolution(
  resolutionType: ResolutionType
): DisputeStatus {
  switch (resolutionType) {
    case ResolutionType.CUSTOMER_FAVOR:
      return DisputeStatus.RESOLVED_CUSTOMER_FAVOR;
    case ResolutionType.VENDOR_FAVOR:
      return DisputeStatus.RESOLVED_VENDOR_FAVOR;
    case ResolutionType.CLOSED_NO_ACTION:
      return DisputeStatus.CLOSED;
  }
}

/**
 * Check if a user can view a dispute
 */
export async function canViewDispute(
  disputeId: string,
  userId: string,
  userRole: 'ADMIN' | 'CUSTOMER' | 'VENDOR'
): Promise<boolean> {
  const dispute = await prisma.dispute.findUnique({
    where: { id: disputeId },
    include: {
      customer: {
        select: { userId: true },
      },
      order: {
        include: {
          items: {
            select: { vendorId: true },
          },
        },
      },
    },
  });

  if (!dispute) return false;

  // Admin can view all disputes
  if (userRole === 'ADMIN') return true;

  // Customer can view their own disputes
  if (userRole === 'CUSTOMER' && dispute.customer.userId === userId) {
    return true;
  }

  // Vendor can view disputes related to their orders
  if (userRole === 'VENDOR') {
    const vendor = await prisma.vendor.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (vendor) {
      const hasVendorItems = dispute.order.items.some(
        (item) => item.vendorId === vendor.id
      );
      return hasVendorItems;
    }
  }

  return false;
}

/**
 * Check if a user can add comments to a dispute
 */
export function canAddDisputeComment(
  userRole: 'ADMIN' | 'CUSTOMER' | 'VENDOR',
  disputeStatus: DisputeStatus
): boolean {
  // Cannot add comments to resolved disputes
  if (
    disputeStatus === DisputeStatus.RESOLVED_CUSTOMER_FAVOR ||
    disputeStatus === DisputeStatus.RESOLVED_VENDOR_FAVOR ||
    disputeStatus === DisputeStatus.CLOSED
  ) {
    return false;
  }

  // Admin and customer can add comments
  return userRole === 'ADMIN' || userRole === 'CUSTOMER';
}

/**
 * Format dispute evidence for display
 */
export function formatDisputeEvidence(evidence: string[]): Array<{
  url: string;
  thumbnail: string;
  publicId: string;
}> {
  return evidence.map((url) => {
    // Extract Cloudinary public ID from URL
    const matches = url.match(/\/v\d+\/(.+)\.\w+$/);
    const publicId = matches ? matches[1] : '';

    return {
      url,
      thumbnail: url.replace('/upload/', '/upload/w_200,h_200,c_fill/'),
      publicId,
    };
  });
}

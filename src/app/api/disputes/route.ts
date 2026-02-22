import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireCustomer, handleAuthError } from '@/lib/auth-helpers';
import {
  createDisputeSchema,
  disputeFiltersSchema,
} from '@/lib/validations/dispute';
import {
  checkDisputeEligibility,
} from '@/lib/utils/dispute';
import { DisputeStatus } from '@/types/dispute';
import { createNotification } from '@/lib/notifications/notificationService';
import { NotificationType } from '@/types/notification';

/**
 * POST /api/disputes
 * Create a new dispute for an order
 * @access Customer only
 */
export async function POST(req: NextRequest) {
  try {
    // Auth check - customers only
    const user = requireCustomer(req);

    // Get customer ID
    const customer = await prisma.customer.findUnique({
      where: { userId: user.userId },
      select: { id: true },
    });

    if (!customer) {
      return NextResponse.json(
        { success: false, error: 'Customer not found' },
        { status: 404 }
      );
    }

    // Parse and validate request body
    const body = await req.json();
    const validation = createDisputeSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          details: validation.error.errors,
        },
        { status: 400 }
      );
    }

    const { orderId, reason, description, evidence } = validation.data;

    // Check if dispute is eligible
    const eligibility = await checkDisputeEligibility(orderId, customer.id);
    if (!eligibility.eligible) {
      return NextResponse.json(
        {
          success: false,
          error: eligibility.reason,
          existingDisputeId: eligibility.existingDisputeId,
        },
        { status: 400 }
      );
    }

    // Create dispute
    const dispute = await prisma.dispute.create({
      data: {
        orderId,
        customerId: customer.id,
        reason,
        description,
        evidence: evidence || [],
        status: DisputeStatus.OPEN,
      },
      include: {
        order: {
          select: {
            orderNumber: true,
            totalAmount: true,
            status: true,
          },
        },
        customer: {
          include: {
            user: {
              select: {
                email: true,
              },
            },
          },
        },
      },
    });

    // Update order status to DISPUTED
    await prisma.order.update({
      where: { id: orderId },
      data: { status: 'DISPUTED' },
    });

    // Create order status history
    await prisma.orderStatusHistory.create({
      data: {
        orderId,
        status: 'DISPUTED',
        notes: `Dispute opened: ${reason}`,
      },
    });

    // Send notification to all admins about new dispute
    try {
      const admins = await prisma.user.findMany({
        where: { role: 'ADMIN' },
        select: { id: true },
      });

      for (const admin of admins) {
        await createNotification({
          userId: admin.id,
          type: NotificationType.DISPUTE_CREATED,
          title: 'New Dispute Filed',
          message: `A dispute has been filed for order ${order.orderNumber}. Reason: ${reason}`,
          link: `/admin/disputes/${dispute.id}`,
          metadata: {
            disputeId: dispute.id,
            orderId,
            orderNumber: order.orderNumber,
            reason,
          },
        });
      }
    } catch (notifError) {
      console.error('Failed to send dispute notification to admin:', notifError);
    }

    return NextResponse.json({
      success: true,
      data: dispute,
      message: 'Dispute created successfully',
    });
  } catch (error) {
    console.error('Error creating dispute:', error);

    const authError = handleAuthError(error);
    if (authError) return authError;

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create dispute',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/disputes
 * List customer's disputes with filters and pagination
 * @access Customer only
 */
export async function GET(req: NextRequest) {
  try {
    // Auth check - customers only
    const user = requireCustomer(req);

    // Get customer ID
    const customer = await prisma.customer.findUnique({
      where: { userId: user.userId },
      select: { id: true },
    });

    if (!customer) {
      return NextResponse.json(
        { success: false, error: 'Customer not found' },
        { status: 404 }
      );
    }

    // Parse query parameters
    const { searchParams } = new URL(req.url);
    const queryParams: any = {
      status: searchParams.get('status') || undefined,
      reason: searchParams.get('reason') || undefined,
      search: searchParams.get('search') || undefined,
      page: searchParams.get('page') || '1',
      limit: searchParams.get('limit') || '10',
      sortBy: searchParams.get('sortBy') || 'createdAt',
      sortOrder: searchParams.get('sortOrder') || 'desc',
    };

    // Validate filters
    const validation = disputeFiltersSchema.safeParse(queryParams);
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid query parameters',
          details: validation.error.errors,
        },
        { status: 400 }
      );
    }

    const { status, reason, search, page, limit, sortBy, sortOrder } =
      validation.data;

    // Build where clause
    const where: any = {
      customerId: customer.id,
    };

    if (status) {
      where.status = Array.isArray(status) ? { in: status } : status;
    }

    if (reason) {
      where.reason = Array.isArray(reason) ? { in: reason } : reason;
    }

    if (search) {
      where.OR = [
        { description: { contains: search, mode: 'insensitive' } },
        {
          order: {
            orderNumber: { contains: search, mode: 'insensitive' },
          },
        },
      ];
    }

    // Count total disputes
    const total = await prisma.dispute.count({ where });

    // Fetch disputes with pagination
    const disputes = await prisma.dispute.findMany({
      where,
      include: {
        order: {
          select: {
            orderNumber: true,
            totalAmount: true,
            status: true,
          },
        },
        _count: {
          select: {
            comments: true,
          },
        },
      },
      orderBy: {
        [sortBy]: sortOrder,
      },
      skip: (page - 1) * limit,
      take: limit,
    });

    // Calculate stats
    const stats = await prisma.dispute.groupBy({
      by: ['status'],
      where: { customerId: customer.id },
      _count: true,
    });

    const statusCounts = {
      total,
      open: 0,
      inReview: 0,
      resolvedCustomerFavor: 0,
      resolvedVendorFavor: 0,
      closed: 0,
    };

    stats.forEach((stat) => {
      const count = stat._count;
      switch (stat.status) {
        case DisputeStatus.OPEN:
          statusCounts.open = count;
          break;
        case DisputeStatus.IN_REVIEW:
          statusCounts.inReview = count;
          break;
        case DisputeStatus.RESOLVED_CUSTOMER_FAVOR:
          statusCounts.resolvedCustomerFavor = count;
          break;
        case DisputeStatus.RESOLVED_VENDOR_FAVOR:
          statusCounts.resolvedVendorFavor = count;
          break;
        case DisputeStatus.CLOSED:
          statusCounts.closed = count;
          break;
      }
    });

    return NextResponse.json({
      success: true,
      data: disputes,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      stats: statusCounts,
    });
  } catch (error) {
    console.error('Error fetching disputes:', error);

    const authError = handleAuthError(error);
    if (authError) return authError;

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch disputes',
      },
      { status: 500 }
    );
  }
}

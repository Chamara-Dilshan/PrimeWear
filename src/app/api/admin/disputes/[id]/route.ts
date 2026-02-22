import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin, handleAuthError } from '@/lib/auth-helpers';
import { calculateDisputeRefund } from '@/lib/utils/dispute';

/**
 * GET /api/admin/disputes/[id]
 * Get dispute details with full order context and chat history
 * @access Admin only
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const disputeId = params.id;

    // Verify authentication - Admin only
    requireAdmin(req);

    // Fetch dispute with comprehensive details
    const dispute = await prisma.dispute.findUnique({
      where: { id: disputeId },
      include: {
        order: {
          include: {
            items: {
              include: {
                product: {
                  select: {
                    id: true,
                    name: true,
                    images: true,
                  },
                },
                variant: {
                  select: {
                    id: true,
                    name: true,
                    values: true,
                  },
                },
              },
            },
            shippingAddress: true,
            payment: {
              select: {
                amount: true,
                method: true,
                paidAt: true,
                status: true,
              },
            },
            statusHistory: {
              orderBy: {
                createdAt: 'asc',
              },
            },
          },
        },
        customer: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                phone: true,
                firstName: true,
                lastName: true,
                createdAt: true,
              },
            },
          },
        },
        comments: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                role: true,
                firstName: true,
                lastName: true,
              },
            },
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
    });

    if (!dispute) {
      return NextResponse.json(
        { success: false, error: 'Dispute not found' },
        { status: 404 }
      );
    }

    // Fetch chat history for context (all chat rooms related to order items)
    const chatRooms = await prisma.chatRoom.findMany({
      where: {
        orderItem: {
          orderId: dispute.orderId,
        },
      },
      include: {
        orderItem: {
          include: {
            product: {
              select: {
                name: true,
              },
            },
            vendor: {
              select: {
                id: true,
                businessName: true,
              },
            },
          },
        },
        messages: {
          orderBy: {
            createdAt: 'asc',
          },
          take: 50, // Last 50 messages per room
          include: {
            sender: {
              select: {
                id: true,
                email: true,
                role: true,
              },
            },
          },
        },
      },
    });

    // Calculate refund information
    let refundCalculation = null;
    try {
      refundCalculation = await calculateDisputeRefund(dispute.orderId);
    } catch (error) {
      console.error('Error calculating refund:', error);
    }

    // Fetch customer's order history (for context)
    const customerOrderStats = await prisma.order.aggregate({
      where: {
        customerId: dispute.customerId,
        status: 'DELIVERY_CONFIRMED',
      },
      _count: true,
      _sum: {
        totalAmount: true,
      },
    });

    // Check if customer has other disputes
    const customerDisputeCount = await prisma.dispute.count({
      where: {
        customerId: dispute.customerId,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        dispute,
        chatHistory: chatRooms,
        refundCalculation,
        customerContext: {
          totalOrders: customerOrderStats._count,
          totalSpent: customerOrderStats._sum.totalAmount?.toNumber() || 0,
          totalDisputes: customerDisputeCount,
        },
      },
    });
  } catch (error) {
    const authError = handleAuthError(error);
    if (authError) return authError;

    console.error('Error fetching admin dispute details:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch dispute details',
      },
      { status: 500 }
    );
  }
}

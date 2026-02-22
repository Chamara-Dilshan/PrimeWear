import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    const vendor = await prisma.vendor.findUnique({
      where: {
        slug,
        isApproved: true,
      },
      include: {
        user: {
          select: {
            id: true,
            isActive: true,
          },
        },
        _count: {
          select: {
            products: {
              where: {
                isActive: true,
                isDisabledByAdmin: false,
              },
            },
          },
        },
      },
    });

    if (!vendor) {
      return NextResponse.json(
        { success: false, error: "Vendor not found" },
        { status: 404 }
      );
    }

    if (!vendor.user.isActive) {
      return NextResponse.json(
        { success: false, error: "Vendor is not available" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        vendor: {
          id: vendor.id,
          businessName: vendor.businessName,
          slug: vendor.slug,
          description: vendor.description,
          logo: vendor.logo,
          banner: vendor.banner,
          shopOpen: vendor.isShopOpen,
          productCount: vendor._count.products,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching vendor:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch vendor" },
      { status: 500 }
    );
  }
}

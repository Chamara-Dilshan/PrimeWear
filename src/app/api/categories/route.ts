import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/categories
 * Public endpoint - Get active categories (for storefront)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const parentId = searchParams.get("parentId");
    const includeInactive = searchParams.get("includeInactive") === "true";

    // Build where clause
    const where: any = {
      ...(includeInactive ? {} : { isActive: true }),
    };

    // If parentId is specified (including null for root categories)
    if (searchParams.has("parentId")) {
      where.parentId = parentId === "null" || parentId === null ? null : parentId;
    }

    // Get categories
    const categories = await prisma.category.findMany({
      where,
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        image: true,
        parentId: true,
        sortOrder: true,
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

    return NextResponse.json({
      success: true,
      data: { categories },
    });
  } catch (error) {
    console.error("Error fetching public categories:", error);
    return NextResponse.json(
      {
        success: false,
        error: "An error occurred while fetching categories",
      },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Pagination
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "12");
    const skip = (page - 1) * limit;

    // Filters
    const search = searchParams.get("search") || "";
    const categoryId = searchParams.get("categoryId") || "";
    const vendorId = searchParams.get("vendorId") || "";
    const minPrice = searchParams.get("minPrice");
    const maxPrice = searchParams.get("maxPrice");
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = searchParams.get("sortOrder") || "desc";
    const inStock = searchParams.get("inStock") === "true";

    // Build where clause
    const where: Prisma.ProductWhereInput = {
      isActive: true,
      isDisabledByAdmin: false,
      vendor: {
        isApproved: true,
        user: {
          isActive: true,
        },
      },
    };

    // Search in name and description
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    // Filter by category (including subcategories)
    if (categoryId) {
      where.OR = [
        { categoryId },
        { category: { parentId: categoryId } },
      ];
    }

    // Filter by vendor
    if (vendorId) {
      where.vendorId = vendorId;
    }

    // Filter by price range
    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) {
        where.price.gte = parseFloat(minPrice);
      }
      if (maxPrice) {
        where.price.lte = parseFloat(maxPrice);
      }
    }

    // Filter by stock availability
    if (inStock) {
      where.stock = { gt: 0 };
    }

    // Build orderBy clause
    const orderBy: Prisma.ProductOrderByWithRelationInput = {};
    if (sortBy === "price") {
      orderBy.price = sortOrder as "asc" | "desc";
    } else if (sortBy === "name") {
      orderBy.name = sortOrder as "asc" | "desc";
    } else {
      orderBy.createdAt = sortOrder as "asc" | "desc";
    }

    // Fetch products with pagination
    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          images: {
            select: { url: true },
            orderBy: { position: "asc" },
          },
          category: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
          vendor: {
            select: {
              id: true,
              businessName: true,
              slug: true,
              user: {
                select: {
                  id: true,
                },
              },
            },
          },
          variants: {
            select: { priceAdjustment: true, stock: true },
          },
        },
        orderBy,
        skip,
        take: limit,
      }),
      prisma.product.count({ where }),
    ]);

    // Flatten images, compute display price and total stock for variant products
    const productsWithRatings = products.map((product) => {
      const basePrice = product.price.toNumber();
      const hasVariants = product.variants.length > 0;
      // Minimum absolute price across all variants
      const displayPrice = hasVariants
        ? Math.min(...product.variants.map((v) => basePrice + (v.priceAdjustment ? v.priceAdjustment.toNumber() : 0)))
        : basePrice;
      // Total stock across all variants (or base stock for simple products)
      const totalStock = hasVariants
        ? product.variants.reduce((sum, v) => sum + v.stock, 0)
        : product.stock;
      return {
        ...product,
        price: basePrice,
        displayPrice,
        totalStock,
        images: product.images.map((img) => img.url),
        variants: undefined, // don't expose raw variants to card
        averageRating: 0,
        reviewCount: 0,
      };
    });

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      success: true,
      data: {
        products: productsWithRatings,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasMore: page < totalPages,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching products:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch products" },
      { status: 500 }
    );
  }
}

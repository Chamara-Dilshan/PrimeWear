import { NextRequest, NextResponse } from "next/server";
import { requireVendor, handleAuthError } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { generateSlug, generateUniqueSlug } from "@/lib/utils/slug";
import {
  createProductSchema,
  productListQuerySchema,
} from "@/lib/validations/product";
import { Prisma } from "@prisma/client";

/**
 * POST /api/vendor/products
 * Create a new product with images and variants
 */
export async function POST(request: NextRequest) {
  try {
    // Auth check
    const user = requireVendor(request);

    // Get vendor record
    const vendorRecord = await prisma.vendor.findUnique({
      where: { userId: user.userId },
    });
    if (!vendorRecord) {
      return NextResponse.json({ success: false, error: "Vendor not found" }, { status: 404 });
    }
    const vendorId = vendorRecord.id;

    // Parse and validate request body
    const body = await request.json();
    const validation = createProductSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: validation.error.issues[0].message,
        },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Verify category exists
    const category = await prisma.category.findUnique({
      where: { id: data.categoryId },
    });

    if (!category) {
      return NextResponse.json(
        {
          success: false,
          error: "Category not found",
        },
        { status: 404 }
      );
    }

    // Generate unique slug
    const baseSlug = data.slug || generateSlug(data.name);
    const slug = await generateUniqueSlug(baseSlug, async (slug) => {
      const existing = await prisma.product.findUnique({ where: { slug } });
      return !!existing;
    });

    // Create product with images and variants in transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create product
      const product = await tx.product.create({
        data: {
          vendorId,
          categoryId: data.categoryId,
          name: data.name,
          slug,
          description: data.description,
          price: data.price,
          compareAtPrice: data.compareAtPrice,
          sku: data.sku,
          stock: data.stock,
          lowStockThreshold: data.lowStockThreshold,
          isActive: true,
        },
      });

      // 2. Create images
      if (data.images && data.images.length > 0) {
        await tx.productImage.createMany({
          data: data.images.map((img) => ({
            productId: product.id,
            url: img.url,
            altText: img.altText,
            position: img.position,
          })),
        });
      }

      // 3. Create variants
      if (data.variants && data.variants.length > 0) {
        await tx.productVariant.createMany({
          data: data.variants.map((v) => ({
            productId: product.id,
            name: v.name,
            value: v.value,
            priceAdjustment: v.priceAdjustment,
            stock: v.stock,
            sku: v.sku,
          })),
        });
      }

      // Fetch complete product with relations
      return tx.product.findUnique({
        where: { id: product.id },
        include: {
          category: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
          images: {
            orderBy: { position: "asc" },
          },
          variants: true,
        },
      });
    });

    return NextResponse.json({
      success: true,
      data: { product: result },
    });
  } catch (error) {
    console.error("Error creating product:", error);

    // Handle auth errors
    const authError = handleAuthError(error);
    if (authError) return authError;

    return NextResponse.json(
      {
        success: false,
        error: "An error occurred while creating the product",
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/vendor/products
 * List vendor's own products with pagination and filters
 */
export async function GET(request: NextRequest) {
  try {
    // Auth check
    const user = requireVendor(request);

    // Get vendor record
    const vendorRecord = await prisma.vendor.findUnique({
      where: { userId: user.userId },
    });
    if (!vendorRecord) {
      return NextResponse.json({ success: false, error: "Vendor not found" }, { status: 404 });
    }
    const vendorId = vendorRecord.id;

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const queryValidation = productListQuerySchema.safeParse(
      Object.fromEntries(searchParams)
    );

    if (!queryValidation.success) {
      return NextResponse.json(
        {
          success: false,
          error: queryValidation.error.issues[0].message,
        },
        { status: 400 }
      );
    }

    const query = queryValidation.data;

    // Build where clause - ALWAYS filter by vendorId
    const where: Prisma.ProductWhereInput = {
      vendorId, // Critical: only vendor's own products
      ...(query.search && {
        OR: [
          { name: { contains: query.search, mode: "insensitive" } },
          { description: { contains: query.search, mode: "insensitive" } },
          { sku: { contains: query.search, mode: "insensitive" } },
        ],
      }),
      ...(query.categoryId && { categoryId: query.categoryId }),
      ...(query.isActive !== undefined && {
        isActive: query.isActive === "true",
      }),
    };

    // Build orderBy clause
    const orderBy: Prisma.ProductOrderByWithRelationInput = {
      [query.sortBy]: query.sortOrder,
    };

    // Get total count
    const totalCount = await prisma.product.count({ where });

    // Get products with pagination
    const products = await prisma.product.findMany({
      where,
      orderBy,
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
      include: {
        category: {
          select: {
            id: true,
            name: true,
          },
        },
        images: {
          select: {
            url: true,
            altText: true,
          },
          orderBy: { position: "asc" },
          take: 1, // Only first image for list view
        },
        _count: {
          select: {
            variants: true,
          },
        },
      },
    });

    // Add low stock alert flag
    const productsWithAlerts = products.map((product) => ({
      ...product,
      lowStockAlert: product.stock <= product.lowStockThreshold,
    }));

    return NextResponse.json({
      success: true,
      data: {
        products: productsWithAlerts,
        pagination: {
          page: query.page,
          pageSize: query.pageSize,
          totalCount,
          totalPages: Math.ceil(totalCount / query.pageSize),
        },
      },
    });
  } catch (error) {
    console.error("Error listing products:", error);

    // Handle auth errors
    const authError = handleAuthError(error);
    if (authError) return authError;

    return NextResponse.json(
      {
        success: false,
        error: "An error occurred while fetching products",
      },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    const product = await prisma.product.findUnique({
      where: {
        slug,
        isActive: true,
        isDisabledByAdmin: false,
      },
      include: {
        images: {
          select: { url: true, altText: true },
          orderBy: { position: "asc" },
        },
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
            parent: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
        },
        vendor: {
          select: {
            id: true,
            businessName: true,
            slug: true,
            description: true,
            logo: true,
            user: {
              select: {
                id: true,
                isActive: true,
              },
            },
          },
        },
        variants: {
          orderBy: {
            createdAt: "asc",
          },
        },
      },
    });

    if (!product) {
      return NextResponse.json(
        { success: false, error: "Product not found" },
        { status: 404 }
      );
    }

    // Check if vendor is active
    if (!product.vendor.user.isActive) {
      return NextResponse.json(
        { success: false, error: "Product not available" },
        { status: 404 }
      );
    }

    // Get related products (same category, different product)
    const relatedProducts = await prisma.product.findMany({
      where: {
        categoryId: product.categoryId,
        id: { not: product.id },
        isActive: true,
        isDisabledByAdmin: false,
        vendor: {
          isApproved: true,
          user: {
            isActive: true,
          },
        },
      },
      include: {
        images: {
          select: { url: true },
          orderBy: { position: "asc" },
          take: 1,
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
          },
        },
      },
      take: 6,
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        product: {
          ...product,
          price: product.price.toNumber(),
          images: product.images.map((img) => img.url),
          variants: product.variants.map((v) => ({
            ...v,
            priceAdjustment: v.priceAdjustment ? v.priceAdjustment.toNumber() : null,
          })),
          averageRating: 0,
          reviewCount: 0,
        },
        relatedProducts: relatedProducts.map((p) => ({
          ...p,
          price: p.price.toNumber(),
          images: p.images.map((img) => img.url),
          averageRating: 0,
          reviewCount: 0,
        })),
      },
    });
  } catch (error) {
    console.error("Error fetching product:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch product" },
      { status: 500 }
    );
  }
}

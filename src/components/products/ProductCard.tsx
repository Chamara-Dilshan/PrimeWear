"use client";

import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Star } from "lucide-react";

interface ProductCardProps {
  product: {
    id: string;
    name: string;
    slug: string;
    price: number;
    displayPrice?: number;  // min absolute variant price (from API)
    totalStock?: number;    // summed variant stock (from API)
    images: string[];
    stock: number;
    averageRating?: number;
    reviewCount?: number;
    category?: {
      name: string;
      slug: string;
    };
    vendor?: {
      businessName: string;
      slug: string;
    };
  };
}

export function ProductCard({ product }: ProductCardProps) {
  const shownPrice = product.displayPrice ?? product.price;
  const effectiveStock = product.totalStock ?? product.stock;
  const isOutOfStock = effectiveStock === 0;
  const isLowStock = effectiveStock > 0 && effectiveStock <= 5;

  return (
    <Link href={`/products/${product.slug}`}>
      <Card className="group h-full overflow-hidden hover:shadow-lg transition-shadow">
        <div className="relative aspect-square overflow-hidden bg-gray-100">
          {product.images?.[0] ? (
            <Image
              src={product.images[0]}
              alt={product.name}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              No Image
            </div>
          )}

          {/* Stock Badge */}
          {isOutOfStock && (
            <Badge
              variant="destructive"
              className="absolute top-2 right-2"
            >
              Out of Stock
            </Badge>
          )}
          {isLowStock && (
            <Badge
              variant="secondary"
              className="absolute top-2 right-2 bg-orange-500 text-white"
            >
              Low Stock
            </Badge>
          )}
        </div>

        <CardContent className="p-4">
          {/* Category */}
          {product.category && (
            <p className="text-xs text-muted-foreground mb-1">
              {product.category.name}
            </p>
          )}

          {/* Product Name */}
          <h3 className="font-semibold text-sm mb-2 line-clamp-2 group-hover:text-primary transition-colors">
            {product.name}
          </h3>

          {/* Rating */}
          {product.averageRating !== undefined && product.reviewCount !== undefined && (
            <div className="flex items-center gap-1 mb-2">
              <div className="flex items-center">
                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                <span className="text-sm font-medium ml-1">
                  {product.averageRating.toFixed(1)}
                </span>
              </div>
              <span className="text-xs text-muted-foreground">
                ({product.reviewCount})
              </span>
            </div>
          )}

          {/* Price */}
          <div className="flex items-center justify-between">
            <p className="text-lg font-bold">
              Rs. {shownPrice.toLocaleString("en-LK")}
            </p>
          </div>

          {/* Vendor */}
          {product.vendor && (
            <p className="text-xs text-muted-foreground mt-2">
              by {product.vendor.businessName}
            </p>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}

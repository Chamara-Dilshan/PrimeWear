/**
 * Order Item Card Component
 * Displays individual order item with product details, variant, and pricing
 */

import Image from "next/image";
import Link from "next/link";
import { OrderStatusBadge } from "./OrderStatusBadge";
import { OrderStatus } from "@prisma/client";

interface ProductSnapshot {
  productId: string;
  name: string;
  slug: string;
  image: string;
  basePrice: number;
  vendorId: string;
  vendorName: string;
}

interface VariantSnapshot {
  variantId: string;
  name: string;
  value: string;
  priceAdjustment: number;
}

interface OrderItemCardProps {
  productSnapshot: ProductSnapshot;
  variantSnapshot?: VariantSnapshot | null;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  status?: OrderStatus;
  showStatus?: boolean;
}

export function OrderItemCard({
  productSnapshot,
  variantSnapshot,
  quantity,
  unitPrice,
  totalPrice,
  status,
  showStatus = false,
}: OrderItemCardProps) {
  return (
    <div className="flex gap-4 p-4 border rounded-lg bg-card">
      {/* Product Image */}
      <div className="relative w-20 h-20 flex-shrink-0 rounded overflow-hidden bg-muted">
        {productSnapshot.image ? (
          <Image
            src={productSnapshot.image}
            alt={productSnapshot.name}
            fill
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">
            No image
          </div>
        )}
      </div>

      {/* Product Details */}
      <div className="flex-1 min-w-0">
        <Link
          href={`/products/${productSnapshot.slug}`}
          className="font-medium hover:underline line-clamp-1"
        >
          {productSnapshot.name}
        </Link>

        {/* Variant */}
        {variantSnapshot && (
          <p className="text-sm text-muted-foreground mt-1">
            {variantSnapshot.name}: {variantSnapshot.value}
          </p>
        )}

        {/* Vendor */}
        <p className="text-sm text-muted-foreground mt-1">
          Sold by: {productSnapshot.vendorName}
        </p>

        {/* Quantity & Price */}
        <div className="flex items-center gap-4 mt-2">
          <span className="text-sm text-muted-foreground">
            Qty: {quantity}
          </span>
          <span className="text-sm text-muted-foreground">×</span>
          <span className="text-sm">
            Rs. {unitPrice.toLocaleString("en-LK", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </span>
        </div>

        {/* Status Badge */}
        {showStatus && status && (
          <div className="mt-2">
            <OrderStatusBadge status={status} />
          </div>
        )}
      </div>

      {/* Total Price */}
      <div className="flex-shrink-0 text-right">
        <p className="font-semibold">
          Rs. {totalPrice.toLocaleString("en-LK", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </p>
      </div>
    </div>
  );
}

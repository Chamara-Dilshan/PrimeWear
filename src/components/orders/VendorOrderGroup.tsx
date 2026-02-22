/**
 * Vendor Order Group Component
 * Groups order items by vendor and displays tracking information
 */

import { OrderItemCard } from "./OrderItemCard";
import { OrderStatus } from "@prisma/client";
import { Package, Truck, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

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

interface OrderItem {
  id: string;
  productSnapshot: ProductSnapshot;
  variantSnapshot?: VariantSnapshot | null;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  status: OrderStatus;
  trackingNumber?: string | null;
  trackingUrl?: string | null;
}

interface VendorOrderGroupProps {
  vendorName: string;
  items: OrderItem[];
}

export function VendorOrderGroup({ vendorName, items }: VendorOrderGroupProps) {
  // Check if any item has tracking info
  const trackingItem = items.find((item) => item.trackingNumber);

  return (
    <div className="border rounded-lg overflow-hidden">
      {/* Vendor Header */}
      <div className="bg-muted px-4 py-3 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-muted-foreground" />
            <h3 className="font-semibold">Sold by: {vendorName}</h3>
          </div>
          {trackingItem && (
            <div className="flex items-center gap-2">
              <Truck className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                Tracking: {trackingItem.trackingNumber}
              </span>
              {trackingItem.trackingUrl && (
                <Button
                  variant="ghost"
                  size="sm"
                  asChild
                  className="h-auto p-0"
                >
                  <a
                    href={trackingItem.trackingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Items */}
      <div className="p-4 space-y-4">
        {items.map((item) => (
          <OrderItemCard
            key={item.id}
            productSnapshot={item.productSnapshot}
            variantSnapshot={item.variantSnapshot}
            quantity={item.quantity}
            unitPrice={item.unitPrice}
            totalPrice={item.totalPrice}
            status={item.status}
            showStatus={items.length > 1} // Only show status if multiple items from same vendor
          />
        ))}
      </div>
    </div>
  );
}

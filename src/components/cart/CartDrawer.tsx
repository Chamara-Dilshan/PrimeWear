"use client";

import { useCartStore } from "@/stores/cartStore";
import { formatPrice } from "@/lib/utils/cart";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ShoppingBag, X } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useAuthStore } from "@/stores/authStore";

interface CartDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CartDrawer({ open, onOpenChange }: CartDrawerProps) {
  const { isAuthenticated } = useAuthStore();
  const {
    items,
    itemCount,
    subtotal,
    removeGuestCartItem,
    removeCartItem,
  } = useCartStore();

  const handleRemoveItem = async (itemId: string) => {
    if (isAuthenticated) {
      await removeCartItem(itemId);
    } else {
      removeGuestCartItem(itemId);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex flex-col w-full sm:max-w-lg">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5" />
            Shopping Cart ({itemCount})
          </SheetTitle>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center py-12">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <ShoppingBag className="w-10 h-10 text-gray-400" />
            </div>
            <p className="text-muted-foreground text-center mb-4">
              Your cart is empty
            </p>
            <Button onClick={() => onOpenChange(false)} asChild>
              <Link href="/products">Browse Products</Link>
            </Button>
          </div>
        ) : (
          <>
            {/* Cart Items */}
            <ScrollArea className="flex-1 -mx-6 px-6">
              <div className="space-y-4 py-4">
                {items.map((item) => (
                  <div key={item.id} className="flex gap-4">
                    {/* Image */}
                    <Link
                      href={`/products/${item.productSlug}`}
                      onClick={() => onOpenChange(false)}
                      className="flex-shrink-0 relative w-20 h-20 bg-gray-100 rounded-md overflow-hidden"
                    >
                      <Image
                        src={item.productImage}
                        alt={item.productName}
                        fill
                        className="object-cover"
                      />
                    </Link>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <Link
                        href={`/products/${item.productSlug}`}
                        onClick={() => onOpenChange(false)}
                        className="font-medium text-sm hover:underline line-clamp-2"
                      >
                        {item.productName}
                      </Link>

                      {item.variantName && item.variantValue && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {item.variantName}: {item.variantValue}
                        </p>
                      )}

                      <div className="flex items-center justify-between mt-2">
                        <p className="text-sm font-medium">
                          {formatPrice(item.finalPrice)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Qty: {item.quantity}
                        </p>
                      </div>

                      {item.stock === 0 && (
                        <p className="text-xs text-red-600 mt-1">Out of stock</p>
                      )}
                    </div>

                    {/* Remove Button */}
                    <button
                      onClick={() => handleRemoveItem(item.id)}
                      className="flex-shrink-0 text-muted-foreground hover:text-destructive"
                      aria-label="Remove item"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </ScrollArea>

            <Separator />

            {/* Footer */}
            <SheetFooter className="flex-col space-y-4">
              {/* Subtotal */}
              <div className="flex justify-between text-base font-semibold">
                <span>Subtotal</span>
                <span>{formatPrice(subtotal)}</span>
              </div>

              {/* Buttons */}
              <div className="space-y-2 w-full">
                <Button
                  size="lg"
                  className="w-full"
                  onClick={() => onOpenChange(false)}
                  asChild
                >
                  <Link href="/cart">View Full Cart</Link>
                </Button>

                <Button
                  size="lg"
                  variant="outline"
                  className="w-full"
                  onClick={() => onOpenChange(false)}
                  asChild
                >
                  <Link href="/products">Continue Shopping</Link>
                </Button>
              </div>

              <p className="text-xs text-center text-muted-foreground">
                Shipping and taxes calculated at checkout
              </p>
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

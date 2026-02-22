"use client";

import { useState } from "react";
import { useCartStore } from "@/stores/cartStore";
import { useAuthStore } from "@/stores/authStore";
import { Button } from "@/components/ui/button";
import { QuantitySelector } from "./QuantitySelector";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ShoppingCart, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { CartItem } from "@/types/cart";
import { calculateFinalPrice, generateCartItemId } from "@/lib/utils/cart";

interface ProductVariant {
  id: string;
  name: string;
  value: string;
  priceAdjustment: number | null;
  stock: number;
}

interface AddToCartButtonProps {
  product: {
    id: string;
    name: string;
    slug: string;
    price: number;
    stock: number;
    images: { url: string }[];
    vendor: {
      id: string;
      businessName: string;
    };
  };
  variants?: ProductVariant[];
  size?: "sm" | "md" | "lg";
  showQuantitySelector?: boolean;
}

export function AddToCartButton({
  product,
  variants = [],
  size = "lg",
  showQuantitySelector = true,
}: AddToCartButtonProps) {
  const { isAuthenticated } = useAuthStore();
  const { addToGuestCart, addToCart, getItemQuantity } = useCartStore();
  const { toast } = useToast();

  const hasVariants = variants.length > 0;

  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(
    hasVariants ? null : null
  );
  const [quantity, setQuantity] = useState(1);
  const [isAdding, setIsAdding] = useState(false);
  const [justAdded, setJustAdded] = useState(false);

  const selectedVariant = hasVariants
    ? variants.find((v) => v.id === selectedVariantId)
    : null;

  const availableStock = selectedVariant
    ? selectedVariant.stock
    : product.stock;

  const currentQuantityInCart = getItemQuantity(
    product.id,
    selectedVariantId
  );

  const finalPrice = calculateFinalPrice(
    product.price,
    selectedVariant?.priceAdjustment
  );

  const canAdd =
    availableStock > 0 &&
    quantity + currentQuantityInCart <= availableStock &&
    (!hasVariants || selectedVariantId !== null);

  const handleAddToCart = async () => {
    if (!canAdd || isAdding) return;

    setIsAdding(true);

    try {
      if (isAuthenticated) {
        // Add to database cart via API
        const success = await addToCart(product.id, quantity, selectedVariantId);

        if (success) {
          setJustAdded(true);
          toast({
            title: "Added to cart",
            description: `${product.name} has been added to your cart.`,
          });

          setTimeout(() => setJustAdded(false), 2000);
          setQuantity(1);
        } else {
          toast({
            title: "Error",
            description: "Failed to add item to cart. Please try again.",
            variant: "destructive",
          });
        }
      } else {
        // Add to guest cart (localStorage)
        const cartItem: CartItem = {
          id: generateCartItemId(product.id, selectedVariantId),
          productId: product.id,
          productName: product.name,
          productSlug: product.slug,
          productImage: product.images[0]?.url || "",
          basePrice: product.price,
          quantity,
          variantId: selectedVariantId,
          variantName: selectedVariant?.name,
          variantValue: selectedVariant?.value,
          priceAdjustment: selectedVariant?.priceAdjustment || 0,
          finalPrice,
          stock: availableStock,
          vendorId: product.vendor.id,
          vendorName: product.vendor.businessName,
        };

        addToGuestCart(cartItem);

        setJustAdded(true);
        toast({
          title: "Added to cart",
          description: `${product.name} has been added to your cart.`,
        });

        setTimeout(() => setJustAdded(false), 2000);
        setQuantity(1);
      }
    } catch (error) {
      console.error("Error adding to cart:", error);
      toast({
        title: "Error",
        description: "Failed to add item to cart. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsAdding(false);
    }
  };

  const buttonText = justAdded
    ? "Added!"
    : currentQuantityInCart > 0
    ? `In Cart (${currentQuantityInCart})`
    : "Add to Cart";

  return (
    <div className="space-y-4">
      {/* Variant Selector */}
      {hasVariants && (
        <div className="space-y-2">
          <label className="text-sm font-medium">
            Select {variants[0]?.name || "Variant"}
          </label>
          <Select
            value={selectedVariantId || ""}
            onValueChange={(value) => setSelectedVariantId(value)}
          >
            <SelectTrigger>
              <SelectValue placeholder={`Choose ${variants[0]?.name || "variant"}`} />
            </SelectTrigger>
            <SelectContent>
              {variants.map((variant) => (
                <SelectItem
                  key={variant.id}
                  value={variant.id}
                  disabled={variant.stock === 0}
                >
                  {variant.value}
                  {variant.priceAdjustment && variant.priceAdjustment !== 0 && (
                    <span className="text-muted-foreground ml-2">
                      ({variant.priceAdjustment > 0 ? "+" : ""}
                      Rs. {variant.priceAdjustment})
                    </span>
                  )}
                  {variant.stock === 0 && (
                    <span className="text-red-500 ml-2">(Out of stock)</span>
                  )}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Stock Info */}
      {availableStock === 0 && (
        <div className="text-sm text-red-600 font-medium">Out of stock</div>
      )}

      {availableStock > 0 && availableStock <= 5 && (
        <div className="text-sm text-orange-600">
          Only {availableStock} left in stock
        </div>
      )}

      {/* Quantity Selector */}
      {showQuantitySelector && availableStock > 0 && (
        <div className="space-y-2">
          <label className="text-sm font-medium">Quantity</label>
          <QuantitySelector
            quantity={quantity}
            min={1}
            max={Math.max(1, availableStock - currentQuantityInCart)}
            onChange={setQuantity}
            size={size === "lg" ? "md" : "sm"}
          />
        </div>
      )}

      {/* Add to Cart Button */}
      <Button
        size={size}
        onClick={handleAddToCart}
        disabled={!canAdd || isAdding}
        className="w-full"
      >
        {justAdded ? (
          <>
            <Check className="mr-2 h-4 w-4" />
            {buttonText}
          </>
        ) : (
          <>
            <ShoppingCart className="mr-2 h-4 w-4" />
            {buttonText}
          </>
        )}
      </Button>

      {/* Validation Messages */}
      {hasVariants && !selectedVariantId && (
        <p className="text-sm text-muted-foreground text-center">
          Please select a variant
        </p>
      )}

      {currentQuantityInCart > 0 && availableStock > 0 && (
        <p className="text-sm text-muted-foreground text-center">
          {currentQuantityInCart} already in cart
        </p>
      )}
    </div>
  );
}

"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export interface ProductVariant {
  id?: string;
  name: string;
  value: string;
  priceAdjustment?: number;
  stock: number;
  sku?: string;
}

interface VariantManagerProps {
  variants: ProductVariant[];
  onChange: (variants: ProductVariant[]) => void;
}

export function VariantManager({ variants, onChange }: VariantManagerProps) {
  const [showVariants, setShowVariants] = useState(variants.length > 0);

  const addVariant = () => {
    const newVariant: ProductVariant = {
      name: "",
      value: "",
      priceAdjustment: 0,
      stock: 0,
      sku: "",
    };
    onChange([...variants, newVariant]);
    setShowVariants(true);
  };

  const removeVariant = (index: number) => {
    const newVariants = variants.filter((_, i) => i !== index);
    onChange(newVariants);
    if (newVariants.length === 0) {
      setShowVariants(false);
    }
  };

  const updateVariant = (
    index: number,
    field: keyof ProductVariant,
    value: any
  ) => {
    const newVariants = variants.map((variant, i) =>
      i === index ? { ...variant, [field]: value } : variant
    );
    onChange(newVariants);
  };

  if (!showVariants) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Product Variants</CardTitle>
          <CardDescription>
            Add variants like size, color, or other options (optional)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button type="button" variant="outline" onClick={addVariant}>
            <Plus className="mr-2 h-4 w-4" />
            Add Variant
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Product Variants</CardTitle>
        <CardDescription>
          Configure product variations with different pricing and stock
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {variants.map((variant, index) => (
          <div
            key={index}
            className="grid grid-cols-1 md:grid-cols-5 gap-4 p-4 border rounded-lg relative"
          >
            {/* Remove Button */}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute top-2 right-2"
              onClick={() => removeVariant(index)}
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>

            {/* Variant Name (e.g., "Size", "Color") */}
            <div className="space-y-2">
              <Label htmlFor={`variant-${index}-name`}>
                Name *
              </Label>
              <Input
                id={`variant-${index}-name`}
                placeholder="Size, Color, etc."
                value={variant.name}
                onChange={(e) =>
                  updateVariant(index, "name", e.target.value)
                }
                maxLength={50}
              />
            </div>

            {/* Variant Value (e.g., "XL", "Red") */}
            <div className="space-y-2">
              <Label htmlFor={`variant-${index}-value`}>
                Value *
              </Label>
              <Input
                id={`variant-${index}-value`}
                placeholder="XL, Red, etc."
                value={variant.value}
                onChange={(e) =>
                  updateVariant(index, "value", e.target.value)
                }
                maxLength={100}
              />
            </div>

            {/* Price Adjustment */}
            <div className="space-y-2">
              <Label htmlFor={`variant-${index}-price`}>
                Price Adjustment (Rs.)
              </Label>
              <Input
                id={`variant-${index}-price`}
                type="number"
                step="0.01"
                placeholder="0.00"
                value={variant.priceAdjustment || 0}
                onChange={(e) =>
                  updateVariant(
                    index,
                    "priceAdjustment",
                    parseFloat(e.target.value) || 0
                  )
                }
              />
              <p className="text-xs text-muted-foreground">
                +/- from base price
              </p>
            </div>

            {/* Stock */}
            <div className="space-y-2">
              <Label htmlFor={`variant-${index}-stock`}>
                Stock *
              </Label>
              <Input
                id={`variant-${index}-stock`}
                type="number"
                min="0"
                placeholder="0"
                value={variant.stock}
                onChange={(e) =>
                  updateVariant(
                    index,
                    "stock",
                    parseInt(e.target.value) || 0
                  )
                }
              />
            </div>

            {/* SKU */}
            <div className="space-y-2">
              <Label htmlFor={`variant-${index}-sku`}>SKU</Label>
              <Input
                id={`variant-${index}-sku`}
                placeholder="Optional"
                value={variant.sku || ""}
                onChange={(e) =>
                  updateVariant(index, "sku", e.target.value)
                }
                maxLength={100}
              />
            </div>
          </div>
        ))}

        <Button
          type="button"
          variant="outline"
          onClick={addVariant}
          className="w-full"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Another Variant
        </Button>

        {variants.length > 0 && (
          <p className="text-sm text-muted-foreground">
            {variants.length} variant{variants.length > 1 ? "s" : ""} added.
            Each variant tracks stock independently.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

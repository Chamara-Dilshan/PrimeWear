"use client";

import { useState } from "react";
import { MoreHorizontal, Shield, ShieldOff } from "lucide-react";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { DisableProductDialog } from "./DisableProductDialog";
import type { AdminProductListItem } from "@/types/product";

interface ProductTableProps {
  products: AdminProductListItem[];
  onProductUpdated: () => void;
}

export function ProductTable({
  products,
  onProductUpdated,
}: ProductTableProps) {
  const [disablingProduct, setDisablingProduct] =
    useState<AdminProductListItem | null>(null);

  const formatPrice = (price: number | string) => {
    return `Rs. ${Number(price).toLocaleString("en-LK", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  if (products.length === 0) {
    return (
      <div className="rounded-lg border bg-card">
        <div className="flex flex-col items-center justify-center py-12">
          <p className="text-muted-foreground">No products found</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[80px]">Image</TableHead>
              <TableHead>Product</TableHead>
              <TableHead>Vendor</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Stock</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[80px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map((product) => (
              <TableRow key={product.id}>
                <TableCell>
                  {product.images[0] ? (
                    <div className="relative w-12 h-12 rounded overflow-hidden">
                      <Image
                        src={product.images[0].url}
                        alt={product.images[0].altText || product.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-12 h-12 bg-muted rounded flex items-center justify-center">
                      <span className="text-xs text-muted-foreground">
                        No image
                      </span>
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  <div>
                    <p className="font-medium">{product.name}</p>
                    {product.sku && (
                      <p className="text-xs text-muted-foreground">
                        SKU: {product.sku}
                      </p>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <span className="text-sm">{product.vendor.businessName}</span>
                </TableCell>
                <TableCell>
                  <span className="text-sm">{product.category.name}</span>
                </TableCell>
                <TableCell>
                  <p className="font-medium">{formatPrice(Number(product.price))}</p>
                </TableCell>
                <TableCell>
                  <span className="text-sm">{product.stock}</span>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col gap-1">
                    {product.isDisabledByAdmin ? (
                      <Badge variant="destructive">Disabled by Admin</Badge>
                    ) : product.isActive ? (
                      <Badge variant="default">Active</Badge>
                    ) : (
                      <Badge variant="secondary">Inactive</Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {product.isDisabledByAdmin ? (
                        <DropdownMenuItem
                          onClick={() => setDisablingProduct(product)}
                        >
                          <Shield className="mr-2 h-4 w-4" />
                          Enable Product
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem
                          onClick={() => setDisablingProduct(product)}
                          className="text-destructive"
                        >
                          <ShieldOff className="mr-2 h-4 w-4" />
                          Disable Product
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Disable/Enable Dialog */}
      {disablingProduct && (
        <DisableProductDialog
          product={disablingProduct}
          open={!!disablingProduct}
          onOpenChange={(open) => !open && setDisablingProduct(null)}
          onSuccess={onProductUpdated}
        />
      )}
    </>
  );
}

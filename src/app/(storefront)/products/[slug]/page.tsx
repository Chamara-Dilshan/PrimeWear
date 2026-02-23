"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ProductImageGallery } from "@/components/products/ProductImageGallery";
import { ProductGrid } from "@/components/products/ProductGrid";
import { AddToCartButton } from "@/components/cart/AddToCartButton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Star, Store, ChevronRight, Package } from "lucide-react";
import { toast } from "sonner";

interface Variant {
  id: string;
  name: string;
  values: string[];
}

interface ProductVariant {
  id: string;
  sku: string;
  price: number;
  stock: number;
  options: Record<string, string>;
}

interface Review {
  id: string;
  rating: number;
  comment: string;
  createdAt: string;
  customer: {
    user: {
      name: string | null;
    };
  };
}

interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  images: string[];
  stock: number;
  tags: string[];
  averageRating: number;
  reviewCount: number;
  category: {
    id: string;
    name: string;
    slug: string;
    parent?: {
      id: string;
      name: string;
      slug: string;
    };
  };
  vendor: {
    id: string;
    businessName: string;
    slug: string;
    description: string | null;
    logo: string | null;
  };
  variants: ProductVariant[];
  reviews: Review[];
}

export default function ProductDetailPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/products/${slug}`);
        const data = await response.json();

        if (data.success) {
          setProduct(data.data.product);
          setRelatedProducts(data.data.relatedProducts);
        } else {
          toast.error("Product not found");
        }
      } catch (error) {
        console.error("Error fetching product:", error);
        toast.error("Failed to load product");
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [slug]);

  // Extract variant options
  const variantOptions: Record<string, string[]> = {};
  if (product?.variants && product.variants.length > 0) {
    product.variants.forEach((variant) => {
      Object.entries(variant.options).forEach(([key, value]) => {
        if (!variantOptions[key]) {
          variantOptions[key] = [];
        }
        if (!variantOptions[key].includes(value)) {
          variantOptions[key].push(value);
        }
      });
    });
  }

  // Find matching variant based on selected options
  useEffect(() => {
    if (product?.variants && Object.keys(selectedOptions).length > 0) {
      const matchingVariant = product.variants.find((variant) => {
        return Object.entries(selectedOptions).every(
          ([key, value]) => variant.options[key] === value
        );
      });
      setSelectedVariant(matchingVariant || null);
    }
  }, [selectedOptions, product]);

  const handleOptionChange = (optionName: string, value: string) => {
    setSelectedOptions((prev) => ({
      ...prev,
      [optionName]: value,
    }));
  };

  const handleAddToCart = () => {
    // This will be implemented in Phase 7
    toast.info("Cart functionality coming soon!");
  };

  const currentPrice = selectedVariant?.price || product?.price || 0;
  const currentStock = selectedVariant?.stock || product?.stock || 0;
  const isOutOfStock = currentStock === 0;
  const isLowStock = currentStock > 0 && currentStock <= 5;

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="grid md:grid-cols-2 gap-8">
          <Skeleton className="aspect-square w-full" />
          <div className="space-y-4">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Product not found</h1>
          <Link href="/products" className="text-primary hover:underline">
            Browse all products
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
        <Link href="/" className="hover:text-foreground">
          Home
        </Link>
        <ChevronRight className="h-4 w-4" />
        <Link href="/products" className="hover:text-foreground">
          Products
        </Link>
        {product.category.parent && (
          <>
            <ChevronRight className="h-4 w-4" />
            <Link
              href={`/categories/${product.category.parent.slug}`}
              className="hover:text-foreground"
            >
              {product.category.parent.name}
            </Link>
          </>
        )}
        <ChevronRight className="h-4 w-4" />
        <Link
          href={`/categories/${product.category.slug}`}
          className="hover:text-foreground"
        >
          {product.category.name}
        </Link>
        <ChevronRight className="h-4 w-4" />
        <span className="text-foreground">{product.name}</span>
      </nav>

      {/* Product Details */}
      <div className="grid md:grid-cols-2 gap-8 mb-12">
        {/* Image Gallery */}
        <ProductImageGallery images={product.images} productName={product.name} />

        {/* Product Info */}
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold mb-2">{product.name}</h1>

            {/* Rating */}
            <div className="flex items-center gap-2 mb-4">
              <div className="flex items-center">
                <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                <span className="ml-1 font-semibold">
                  {product.averageRating.toFixed(1)}
                </span>
              </div>
              <span className="text-sm text-muted-foreground">
                ({product.reviewCount} reviews)
              </span>
            </div>

            {/* Price */}
            <div className="flex items-baseline gap-2 mb-4">
              <span className="text-3xl font-bold">
                Rs. {currentPrice.toLocaleString("en-LK")}
              </span>
              {selectedVariant && selectedVariant.price !== product.price && (
                <span className="text-lg text-muted-foreground line-through">
                  Rs. {product.price.toLocaleString("en-LK")}
                </span>
              )}
            </div>

            {/* Stock Status */}
            {isOutOfStock ? (
              <Badge variant="destructive">Out of Stock</Badge>
            ) : isLowStock ? (
              <Badge variant="secondary" className="bg-orange-500 text-white">
                Only {currentStock} left!
              </Badge>
            ) : (
              <Badge variant="secondary" className="bg-green-500 text-white">
                <Package className="w-3 h-3 mr-1" />
                In Stock
              </Badge>
            )}
          </div>

          <Separator />

          {/* Vendor Info */}
          <Link
            href={`/vendors/${product.vendor.slug}`}
            className="flex items-center gap-3 p-4 rounded-lg border hover:border-primary transition-colors"
          >
            <Store className="w-5 h-5 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">Sold by</p>
              <p className="font-semibold">{product.vendor.businessName}</p>
            </div>
          </Link>

          <Separator />

          {/* Variant Selection */}
          {Object.keys(variantOptions).length > 0 && (
            <div className="space-y-4">
              {Object.entries(variantOptions).map(([optionName, values]) => (
                <div key={optionName}>
                  <Label className="mb-2 block capitalize">{optionName}</Label>
                  <Select
                    value={selectedOptions[optionName] || ""}
                    onValueChange={(value) => handleOptionChange(optionName, value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={`Select ${optionName}`} />
                    </SelectTrigger>
                    <SelectContent>
                      {values.map((value) => (
                        <SelectItem key={value} value={value}>
                          {value}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>
          )}

          {/* Add to Cart */}
          <AddToCartButton
            product={{
              id: product.id,
              name: product.name,
              slug: product.slug,
              price: product.price,
              stock: product.stock,
              images: product.images.map((url) => ({ url })),
              vendor: {
                id: product.vendor.id,
                businessName: product.vendor.businessName,
              },
            }}
            variants={product.variants.map((v: any) => ({
              id: v.id,
              name: v.name,
              value: v.value,
              priceAdjustment: v.priceAdjustment,
              stock: v.stock,
            }))}
            size="lg"
            showQuantitySelector={true}
          />

          <Separator />

          {/* Description */}
          <div>
            <h3 className="font-semibold mb-2">Description</h3>
            <p className="text-muted-foreground whitespace-pre-wrap">
              {product.description}
            </p>
          </div>

          {/* Tags */}
          {product.tags && product.tags.length > 0 && (
            <div>
              <h3 className="font-semibold mb-2">Tags</h3>
              <div className="flex flex-wrap gap-2">
                {product.tags.map((tag) => (
                  <Badge key={tag} variant="outline">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Reviews Section */}
      {product.reviews && product.reviews.length > 0 && (
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-6">Customer Reviews</h2>
          <div className="space-y-4">
            {product.reviews.map((review) => (
              <div key={review.id} className="border rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${
                          i < review.rating
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-gray-300"
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-sm font-semibold">
                    {review.customer.user.name || "Anonymous"}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {new Date(review.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-sm">{review.comment}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Related Products */}
      {relatedProducts && relatedProducts.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold mb-6">Related Products</h2>
          <ProductGrid products={relatedProducts} />
        </div>
      )}
    </div>
  );
}

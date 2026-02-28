"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ProductImageGallery } from "@/components/products/ProductImageGallery";
import { ProductGrid } from "@/components/products/ProductGrid";
import { AddToCartButton } from "@/components/cart/AddToCartButton";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Star, Store, ChevronRight, Package } from "lucide-react";
import { toast } from "sonner";
interface ProductVariant {
  id: string;
  sku: string | null;
  priceAdjustment: number | null;
  stock: number;
  name: string;
  value: string;
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
  const [activeVariant, setActiveVariant] = useState<ProductVariant | null>(null);

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

  const hasVariants = (product?.variants?.length ?? 0) > 0;

  // When a variant is selected show its absolute price; otherwise show the lowest variant price
  const minVariantPrice = hasVariants && product
    ? Math.min(...product.variants.map((v) => product.price + (v.priceAdjustment ?? 0)))
    : product?.price ?? 0;
  const displayPrice = activeVariant
    ? (product?.price ?? 0) + (activeVariant.priceAdjustment ?? 0)
    : minVariantPrice;

  // For variant products: total stock across all variants; for simple products: base stock
  const totalVariantStock = hasVariants
    ? (product?.variants ?? []).reduce((sum, v) => sum + v.stock, 0)
    : 0;
  const isOutOfStock = hasVariants ? totalVariantStock === 0 : (product?.stock ?? 0) === 0;
  const isLowStock = !isOutOfStock && (hasVariants
    ? totalVariantStock <= 5
    : (product?.stock ?? 0) <= 5);

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
              {hasVariants && !activeVariant && (
                <span className="text-lg text-muted-foreground">From</span>
              )}
              <span className="text-3xl font-bold">
                Rs. {displayPrice.toLocaleString("en-LK")}
              </span>
            </div>

            {/* Stock Status */}
            {isOutOfStock ? (
              <Badge variant="destructive">Out of Stock</Badge>
            ) : isLowStock ? (
              <Badge variant="secondary" className="bg-orange-500 text-white">
                Low Stock
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

          {/* Add to Cart (includes variant selector internally) */}
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
            onVariantChange={setActiveVariant}
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

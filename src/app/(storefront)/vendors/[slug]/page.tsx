"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ProductGrid } from "@/components/products/ProductGrid";
import { ProductFilters, FilterValues } from "@/components/products/ProductFilters";
import { Pagination } from "@/components/common/Pagination";
import { SearchBar } from "@/components/common/SearchBar";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { ChevronRight, Store, Package } from "lucide-react";
import { toast } from "sonner";

interface Vendor {
  id: string;
  businessName: string;
  slug: string;
  description: string | null;
  logo: string | null;
  banner: string | null;
  shopOpen: boolean;
  productCount: number;
}

interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
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
}

export default function VendorStorePage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const slug = params.slug as string;

  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [allCategories, setAllCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 0,
  });

  const page = parseInt(searchParams.get("page") || "1");
  const search = searchParams.get("search") || "";
  const categoryId = searchParams.get("categoryId") || "";
  const minPrice = searchParams.get("minPrice") || "";
  const maxPrice = searchParams.get("maxPrice") || "";
  const sortBy = searchParams.get("sortBy") || "createdAt";
  const inStock = searchParams.get("inStock") === "true";

  // Fetch vendor details
  useEffect(() => {
    const fetchVendor = async () => {
      try {
        const response = await fetch(`/api/vendors/${slug}`);
        const data = await response.json();

        if (data.success) {
          setVendor(data.data.vendor);
        } else {
          toast.error("Vendor not found");
        }
      } catch (error) {
        console.error("Error fetching vendor:", error);
        toast.error("Failed to load vendor");
      }
    };

    fetchVendor();
  }, [slug]);

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch("/api/categories");
        const data = await response.json();
        if (data.success && Array.isArray(data.data?.categories)) {
          const allCategories: any[] = [];
          data.data.categories.forEach((cat: any) => {
            allCategories.push(cat);
            if (cat.children) {
              cat.children.forEach((child: any) => {
                allCategories.push({
                  ...child,
                  name: `${cat.name} > ${child.name}`,
                });
              });
            }
          });
          setAllCategories(allCategories);
        }
      } catch (error) {
        console.error("Error fetching categories:", error);
      }
    };
    fetchCategories();
  }, []);

  // Fetch vendor products
  useEffect(() => {
    if (!vendor) return;

    const fetchProducts = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          page: page.toString(),
          limit: "12",
          vendorId: vendor.id,
          ...(search && { search }),
          ...(categoryId && { categoryId }),
          ...(minPrice && { minPrice }),
          ...(maxPrice && { maxPrice }),
          ...(sortBy && { sortBy }),
          ...(inStock && { inStock: "true" }),
        });

        const response = await fetch(`/api/products?${params}`);
        const data = await response.json();

        if (data.success) {
          setProducts(data.data.products);
          setPagination(data.data.pagination);
        }
      } catch (error) {
        console.error("Error fetching products:", error);
        toast.error("Failed to load products");
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [vendor, page, search, categoryId, minPrice, maxPrice, sortBy, inStock]);

  const updateURL = (newParams: Record<string, string>) => {
    const params = new URLSearchParams(searchParams.toString());

    Object.entries(newParams).forEach(([key, value]) => {
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    });

    if (!newParams.page) {
      params.set("page", "1");
    }

    router.push(`/vendors/${slug}?${params.toString()}`);
  };

  const handleSearch = (query: string) => {
    updateURL({ search: query });
  };

  const handleFilterChange = (filters: FilterValues) => {
    updateURL({
      categoryId: filters.categoryId || "",
      minPrice: filters.minPrice || "",
      maxPrice: filters.maxPrice || "",
      sortBy: filters.sortBy || "",
      inStock: filters.inStock ? "true" : "",
    });
  };

  const handlePageChange = (newPage: number) => {
    updateURL({ page: newPage.toString() });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (!vendor && !loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Vendor not found</h1>
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
      {vendor && (
        <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <Link href="/" className="hover:text-foreground">
            Home
          </Link>
          <ChevronRight className="h-4 w-4" />
          <Link href="/products" className="hover:text-foreground">
            Products
          </Link>
          <ChevronRight className="h-4 w-4" />
          <span className="text-foreground">{vendor.businessName}</span>
        </nav>
      )}

      {/* Vendor Header */}
      {vendor && (
        <div className="mb-8">
          {/* Banner */}
          {vendor.banner && (
            <div className="relative w-full h-48 sm:h-64 mb-6 rounded-lg overflow-hidden">
              <Image
                src={vendor.banner}
                alt={vendor.businessName}
                fill
                className="object-cover"
                priority
              />
            </div>
          )}

          {/* Vendor Info */}
          <div className="flex items-start gap-6">
            {/* Logo */}
            {vendor.logo && (
              <div className="relative w-24 h-24 rounded-lg overflow-hidden border-4 border-background shadow-lg flex-shrink-0">
                <Image
                  src={vendor.logo}
                  alt={vendor.businessName}
                  fill
                  className="object-cover"
                />
              </div>
            )}

            {/* Details */}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <Store className="w-6 h-6 text-muted-foreground" />
                <h1 className="text-3xl font-bold">{vendor.businessName}</h1>
              </div>

              {/* Status */}
              <div className="flex items-center gap-2 mb-4">
                <Badge
                  variant={vendor.shopOpen ? "default" : "secondary"}
                  className={vendor.shopOpen ? "bg-green-500" : ""}
                >
                  {vendor.shopOpen ? "Shop Open" : "Shop Closed"}
                </Badge>
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Package className="w-4 h-4" />
                  <span>{vendor.productCount} products</span>
                </div>
              </div>

              {/* Description */}
              {vendor.description && (
                <p className="text-muted-foreground">{vendor.description}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Search Bar */}
      <div className="mb-6">
        <SearchBar
          onSearch={handleSearch}
          defaultValue={search}
          placeholder={`Search in ${vendor?.businessName || "store"}...`}
        />
      </div>

      {/* Filters */}
      <div className="flex items-center justify-between mb-6">
        <div className="text-sm text-muted-foreground">
          {loading ? (
            <Skeleton className="h-5 w-32" />
          ) : (
            `${pagination.total} products found`
          )}
        </div>
        <ProductFilters
          categories={allCategories}
          onFilterChange={handleFilterChange}
          initialFilters={{
            categoryId,
            minPrice,
            maxPrice,
            sortBy,
            inStock,
          }}
        />
      </div>

      {/* Products Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="aspect-square w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ))}
        </div>
      ) : (
        <ProductGrid products={products} />
      )}

      {/* Pagination */}
      {!loading && pagination.totalPages > 1 && (
        <Pagination
          currentPage={pagination.page}
          totalPages={pagination.totalPages}
          onPageChange={handlePageChange}
        />
      )}
    </div>
  );
}

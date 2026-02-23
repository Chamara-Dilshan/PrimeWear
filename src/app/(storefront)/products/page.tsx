"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { ProductGrid } from "@/components/products/ProductGrid";
import { ProductFilters, FilterValues } from "@/components/products/ProductFilters";
import { Pagination } from "@/components/common/Pagination";
import { SearchBar } from "@/components/common/SearchBar";
import { Skeleton } from "@/components/ui/skeleton";

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

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface Vendor {
  id: string;
  businessName: string;
  slug: string;
}

function ProductsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 0,
  });

  // Read filters from URL
  const page = parseInt(searchParams.get("page") || "1");
  const search = searchParams.get("search") || "";
  const categoryId = searchParams.get("categoryId") || "";
  const minPrice = searchParams.get("minPrice") || "";
  const maxPrice = searchParams.get("maxPrice") || "";
  const sortBy = searchParams.get("sortBy") || "createdAt";
  const inStock = searchParams.get("inStock") === "true";
  const vendorId = searchParams.get("vendorId") || "";

  // Fetch categories and vendors
  useEffect(() => {
    const fetchFiltersData = async () => {
      try {
        const [categoriesRes, vendorsRes] = await Promise.all([
          fetch("/api/categories"),
          fetch("/api/vendors"),
        ]);
        const categoriesData = await categoriesRes.json();
        const vendorsData = await vendorsRes.json();

        if (categoriesData.success && Array.isArray(categoriesData.data?.categories)) {
          // Flatten parent and children categories
          const allCategories: Category[] = [];
          categoriesData.data.categories.forEach((cat: any) => {
            allCategories.push({
              id: cat.id,
              name: cat.name,
              slug: cat.slug,
            });
            if (cat.children) {
              cat.children.forEach((child: any) => {
                allCategories.push({
                  id: child.id,
                  name: `${cat.name} > ${child.name}`,
                  slug: child.slug,
                });
              });
            }
          });
          setCategories(allCategories);
        }

        if (vendorsData.success && Array.isArray(vendorsData.data)) {
          setVendors(
            vendorsData.data.map((v: any) => ({
              id: v.id,
              businessName: v.businessName,
              slug: v.slug,
            }))
          );
        }
      } catch (error) {
        console.error("Error fetching filter data:", error);
      }
    };
    fetchFiltersData();
  }, []);

  // Fetch products
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          page: page.toString(),
          limit: "12",
          ...(search && { search }),
          ...(categoryId && { categoryId }),
          ...(minPrice && { minPrice }),
          ...(maxPrice && { maxPrice }),
          ...(sortBy && { sortBy }),
          ...(inStock && { inStock: "true" }),
          ...(vendorId && { vendorId }),
        });

        const response = await fetch(`/api/products?${params}`);
        const data = await response.json();

        if (data.success) {
          setProducts(data.data.products);
          setPagination(data.data.pagination);
        }
      } catch (error) {
        console.error("Error fetching products:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [page, search, categoryId, minPrice, maxPrice, sortBy, inStock, vendorId]);

  const updateURL = (newParams: Record<string, string>) => {
    const params = new URLSearchParams(searchParams.toString());

    Object.entries(newParams).forEach(([key, value]) => {
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    });

    // Reset to page 1 when filters change
    if (!newParams.page) {
      params.set("page", "1");
    }

    router.push(`/products?${params.toString()}`);
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
      vendorId: filters.vendorId || "",
    });
  };

  const handlePageChange = (newPage: number) => {
    updateURL({ page: newPage.toString() });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">All Products</h1>
        <p className="text-muted-foreground">
          Browse our complete collection of products
        </p>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <SearchBar onSearch={handleSearch} defaultValue={search} />
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
          categories={categories}
          vendors={vendors}
          onFilterChange={handleFilterChange}
          initialFilters={{
            categoryId,
            minPrice,
            maxPrice,
            sortBy,
            inStock,
            vendorId,
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

function ProductsPageSkeleton() {
  return (
    <div className="container mx-auto px-4 py-8">
      <Skeleton className="h-10 w-full mb-6" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="space-y-3">
            <Skeleton className="aspect-square w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={<ProductsPageSkeleton />}>
      <ProductsPageContent />
    </Suspense>
  );
}

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
import { ChevronRight } from "lucide-react";
import { toast } from "sonner";

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image: string | null;
  parent?: {
    id: string;
    name: string;
    slug: string;
  };
  children?: {
    id: string;
    name: string;
    slug: string;
    image: string | null;
  }[];
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

export default function CategoryPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const slug = params.slug as string;

  const [category, setCategory] = useState<Category | null>(null);
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
  const minPrice = searchParams.get("minPrice") || "";
  const maxPrice = searchParams.get("maxPrice") || "";
  const sortBy = searchParams.get("sortBy") || "createdAt";
  const inStock = searchParams.get("inStock") === "true";

  // Fetch category details
  useEffect(() => {
    const fetchCategory = async () => {
      try {
        const response = await fetch("/api/categories");
        const data = await response.json();

        if (data.success && Array.isArray(data.data?.categories)) {
          const cats = data.data.categories;
          setAllCategories(cats);

          // Find current category
          let foundCategory = null;
          for (const cat of cats) {
            if (cat.slug === slug) {
              foundCategory = cat;
              break;
            }
            if (cat.children) {
              const child = cat.children.find((c: any) => c.slug === slug);
              if (child) {
                foundCategory = { ...child, parent: { id: cat.id, name: cat.name, slug: cat.slug } };
                break;
              }
            }
          }

          if (foundCategory) {
            setCategory(foundCategory);
          } else {
            toast.error("Category not found");
          }
        }
      } catch (error) {
        console.error("Error fetching category:", error);
        toast.error("Failed to load category");
      }
    };

    fetchCategory();
  }, [slug]);

  // Fetch products in this category
  useEffect(() => {
    if (!category) return;

    const fetchProducts = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          page: page.toString(),
          limit: "12",
          categoryId: category.id,
          ...(search && { search }),
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
  }, [category, page, search, minPrice, maxPrice, sortBy, inStock]);

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

    router.push(`/categories/${slug}?${params.toString()}`);
  };

  const handleSearch = (query: string) => {
    updateURL({ search: query });
  };

  const handleFilterChange = (filters: FilterValues) => {
    updateURL({
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

  if (!category && !loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Category not found</h1>
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
      {category && (
        <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <Link href="/" className="hover:text-foreground">
            Home
          </Link>
          <ChevronRight className="h-4 w-4" />
          <Link href="/products" className="hover:text-foreground">
            Products
          </Link>
          {category.parent && (
            <>
              <ChevronRight className="h-4 w-4" />
              <Link
                href={`/categories/${category.parent.slug}`}
                className="hover:text-foreground"
              >
                {category.parent.name}
              </Link>
            </>
          )}
          <ChevronRight className="h-4 w-4" />
          <span className="text-foreground">{category.name}</span>
        </nav>
      )}

      {/* Category Header */}
      {category && (
        <div className="mb-8">
          {category.image && (
            <div className="relative w-full h-48 mb-4 rounded-lg overflow-hidden">
              <Image
                src={category.image}
                alt={category.name}
                fill
                className="object-cover"
                priority
              />
            </div>
          )}
          <h1 className="text-3xl font-bold mb-2">{category.name}</h1>
          {category.description && (
            <p className="text-muted-foreground">{category.description}</p>
          )}
        </div>
      )}

      {/* Subcategories */}
      {category?.children && category.children.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Subcategories</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {category.children.map((child) => (
              <Link
                key={child.id}
                href={`/categories/${child.slug}`}
                className="group"
              >
                <div className="relative aspect-square rounded-lg overflow-hidden bg-gray-100 mb-2">
                  {child.image ? (
                    <Image
                      src={child.image}
                      alt={child.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      No Image
                    </div>
                  )}
                </div>
                <p className="text-sm font-medium text-center group-hover:text-primary transition-colors">
                  {child.name}
                </p>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Search Bar */}
      <div className="mb-6">
        <SearchBar
          onSearch={handleSearch}
          defaultValue={search}
          placeholder={`Search in ${category?.name || "category"}...`}
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

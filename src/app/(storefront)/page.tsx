"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { ProductGrid } from "@/components/products/ProductGrid";
import { ArrowRight, Shield, Truck, CreditCard } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface Category {
  id: string;
  name: string;
  slug: string;
  image: string | null;
}

export default function Home() {
  const [featuredProducts, setFeaturedProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch featured products (latest 8 products)
        const productsResponse = await fetch("/api/products?limit=8&sortBy=createdAt&sortOrder=desc");
        const productsData = await productsResponse.json();
        if (productsData.success) {
          setFeaturedProducts(productsData.data.products);
        }

        // Fetch categories
        const categoriesResponse = await fetch("/api/categories");
        const categoriesData = await categoriesResponse.json();
        if (categoriesData.success && categoriesData.data.categories) {
          setCategories(categoriesData.data.categories.slice(0, 6)); // Show first 6 active categories
        }
      } catch (error) {
        console.error("Error fetching homepage data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-primary/10 to-background py-12 md:py-20 px-4">
        <div className="container mx-auto text-center">
          <h1 className="text-3xl md:text-6xl font-bold mb-4 md:mb-6">
            Welcome to PrimeWear
          </h1>
          <p className="text-base md:text-xl text-muted-foreground mb-6 md:mb-8 max-w-2xl mx-auto">
            Sri Lanka&apos;s premier multi-vendor e-commerce platform. Shop from
            trusted vendors with secure escrow payments.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild>
              <Link href="/products">
                Browse Products
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-10 md:py-16 px-4">
        <div className="container mx-auto">
          <div className="flex items-center justify-between gap-2 mb-6 md:mb-8">
            <h2 className="text-2xl md:text-3xl font-bold">Shop by Category</h2>
            <Button variant="ghost" asChild>
              <Link href="/categories">
                View All
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="aspect-square w-full" />
                  <Skeleton className="h-4 w-3/4 mx-auto" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {categories.map((category) => (
                <Link
                  key={category.id}
                  href={`/categories/${category.slug}`}
                  className="group"
                >
                  <div className="relative aspect-square rounded-lg overflow-hidden bg-gray-100 mb-2">
                    {category.image ? (
                      <Image
                        src={category.image}
                        alt={category.name}
                        fill
                        sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 17vw"
                        className="object-cover group-hover:scale-105 transition-transform"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        {category.name}
                      </div>
                    )}
                  </div>
                  <p className="text-sm font-medium text-center group-hover:text-primary transition-colors">
                    {category.name}
                  </p>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Featured Products Section */}
      <section className="py-10 md:py-16 px-4 bg-muted/50">
        <div className="container mx-auto">
          <div className="flex items-center justify-between gap-2 mb-6 md:mb-8">
            <h2 className="text-2xl md:text-3xl font-bold">Latest Products</h2>
            <Button variant="ghost" asChild>
              <Link href="/products">
                View All
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="space-y-3">
                  <Skeleton className="aspect-square w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              ))}
            </div>
          ) : (
            <ProductGrid products={featuredProducts} />
          )}
        </div>
      </section>

      {/* Features Section */}
      <section className="py-10 md:py-16 px-4">
        <div className="container mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-8 md:mb-12">
            Why Shop With Us?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <FeatureCard
              icon={Shield}
              title="Secure Payments"
              description="All payments processed through secure escrow system with PayHere integration."
            />
            <FeatureCard
              icon={Truck}
              title="Fast Delivery"
              description="Quick shipping from trusted vendors across Sri Lanka."
            />
            <FeatureCard
              icon={CreditCard}
              title="Easy Returns"
              description="24-hour return policy for your peace of mind."
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-muted py-10 md:py-16 px-4">
        <div className="container mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">Ready to Start Shopping?</h2>
          <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join thousands of satisfied customers shopping on PrimeWear. Create
            an account today and get started.
          </p>
          <Button size="lg" asChild>
            <Link href="/login">Get Started</Link>
          </Button>
        </div>
      </section>

      {/* Portal Links (for development) */}
      <section className="py-12 px-4 border-t">
        <div className="container mx-auto">
          <h3 className="text-xl font-semibold mb-6 text-center">Quick Access</h3>
          <div className="flex flex-wrap gap-4 justify-center">
            <Button variant="outline" asChild>
              <Link href="/login">Customer Login</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/vendor/login">Vendor Portal</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/admin/login">Admin Portal</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}

function FeatureCard({
  icon: Icon,
  title,
  description,
}: {
  icon: any;
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col items-center text-center p-6 rounded-lg border bg-card">
      <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
        <Icon className="w-6 h-6 text-primary" />
      </div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </div>
  );
}

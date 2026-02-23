"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Menu, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Logo } from "../shared/Logo";
import { ThemeToggle } from "../shared/ThemeToggle";
import { CartButton } from "./CartButton";
import { UserMenu } from "./UserMenu";
import { NotificationDropdown } from "@/components/notifications/NotificationDropdown";
import { useAuthStore } from "@/stores/authStore";

interface StorefrontHeaderProps {
  onMobileMenuToggle: () => void;
}

export function StorefrontHeader({ onMobileMenuToggle }: StorefrontHeaderProps) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchQuery.trim();
    if (q) {
      router.push(`/products?search=${encodeURIComponent(q)}`);
      setMobileSearchOpen(false);
      setSearchQuery("");
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center gap-2 md:gap-4 px-4 md:px-6">
        {/* Mobile Menu Button */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden shrink-0"
          onClick={onMobileMenuToggle}
          aria-label="Toggle menu"
        >
          <Menu className="h-5 w-5" />
        </Button>

        {/* Logo */}
        <Logo variant="full" href="/" className="shrink-0 mr-2 md:mr-4" />

        {/* Search Bar — desktop only, fills available space */}
        <form
          onSubmit={handleSearch}
          className="hidden md:flex flex-1 relative"
        >
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            type="text"
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-4 h-9 w-full"
          />
        </form>

        {/* Actions */}
        <div className="flex items-center gap-1 md:gap-2 ml-auto">
          {/* Mobile search toggle button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden shrink-0"
            onClick={() => setMobileSearchOpen((o) => !o)}
            aria-label={mobileSearchOpen ? "Close search" : "Search"}
          >
            {mobileSearchOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Search className="h-5 w-5" />
            )}
          </Button>

          <ThemeToggle />
          {/* Notification only on desktop and only for authenticated users */}
          {isAuthenticated && (
            <div className="hidden md:flex">
              <NotificationDropdown />
            </div>
          )}
          <CartButton />
          <UserMenu />
        </div>
      </div>

      {/* Mobile Search Bar — expands below header */}
      {mobileSearchOpen && (
        <div className="md:hidden border-t bg-background px-4 py-2">
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9 w-full"
                autoFocus
              />
            </div>
            <Button type="submit" size="sm" className="h-9 shrink-0">
              Search
            </Button>
          </form>
        </div>
      )}
    </header>
  );
}

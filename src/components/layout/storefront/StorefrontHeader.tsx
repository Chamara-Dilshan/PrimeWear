"use client";

import { Menu, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Logo } from "../shared/Logo";
import { ThemeToggle } from "../shared/ThemeToggle";
import { CartButton } from "./CartButton";
import { UserMenu } from "./UserMenu";
import { NotificationDropdown } from "@/components/notifications/NotificationDropdown";

interface StorefrontHeaderProps {
  onMobileMenuToggle: () => void;
}

export function StorefrontHeader({ onMobileMenuToggle }: StorefrontHeaderProps) {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center gap-4 px-4 md:px-6">
        {/* Mobile Menu Button */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={onMobileMenuToggle}
          aria-label="Toggle menu"
        >
          <Menu className="h-5 w-5" />
        </Button>

        {/* Logo */}
        <Logo variant="full" href="/" className="mr-4" />

        {/* Search Bar (Desktop) */}
        <div className="hidden md:flex flex-1 max-w-md">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search products..."
              className="pl-10 pr-4"
              disabled
              title="Search functionality coming in Phase 6"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 ml-auto">
          {/* Search Button (Mobile) */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            disabled
            title="Search functionality coming in Phase 6"
          >
            <Search className="h-5 w-5" />
          </Button>

          <ThemeToggle />
          <NotificationDropdown />
          <CartButton />
          <UserMenu />
        </div>
      </div>
    </header>
  );
}

"use client";

import Link from "next/link";
import { storefrontNavItems, customerNavItems } from "@/lib/navigation";
import { useActiveRoute } from "@/hooks/useActiveRoute";
import { useAuthStore } from "@/stores/authStore";
import { cn } from "@/lib/utils";

export function StorefrontNav() {
  const { isActive } = useActiveRoute();
  const { isAuthenticated, user } = useAuthStore();

  // Show customer nav items only if logged in as customer
  const showCustomerNav = isAuthenticated && user?.role === "CUSTOMER";
  const navItems = showCustomerNav
    ? [...storefrontNavItems, ...customerNavItems]
    : storefrontNavItems;

  return (
    <nav className="hidden md:block border-b bg-background">
      <div className="container flex items-center space-x-6 h-12 px-4 md:px-6">
        {navItems.map((item) => {
          const isItemActive = isActive(item.href, item.href === "/");

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "text-sm font-medium transition-colors hover:text-primary relative pb-3",
                isItemActive
                  ? "text-primary after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-primary"
                  : "text-muted-foreground"
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

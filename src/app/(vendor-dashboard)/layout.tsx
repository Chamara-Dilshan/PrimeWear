"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import { useLayoutStore } from "@/stores/layoutStore";
import { useIsMobile } from "@/hooks/useMediaQuery";
import { VendorSidebar } from "@/components/layout/vendor/VendorSidebar";
import { VendorHeader } from "@/components/layout/vendor/VendorHeader";
import { VendorMobileNav } from "@/components/layout/vendor/VendorMobileNav";

export default function VendorDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user, isAuthenticated, _hasHydrated } = useAuthStore();
  const {
    isSidebarCollapsed,
    toggleSidebar,
    isMobileMenuOpen,
    setMobileMenuOpen,
  } = useLayoutStore();
  const isMobile = useIsMobile();

  // Auth check - wait for hydration before redirecting
  useEffect(() => {
    if (!_hasHydrated) return;

    if (!isAuthenticated || user?.role !== "VENDOR") {
      router.push("/vendor/login");
    }
  }, [_hasHydrated, isAuthenticated, user, router]);

  // Show nothing while hydrating or checking auth
  if (!_hasHydrated || !isAuthenticated || user?.role !== "VENDOR") {
    return null;
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Desktop Sidebar */}
      {!isMobile && (
        <VendorSidebar
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={toggleSidebar}
        />
      )}

      {/* Mobile Navigation */}
      {isMobile && (
        <VendorMobileNav
          isOpen={isMobileMenuOpen}
          onClose={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className="flex flex-col flex-1 overflow-hidden">
        <VendorHeader
          onMobileMenuToggle={() => setMobileMenuOpen(!isMobileMenuOpen)}
        />
        <main className="flex-1 overflow-y-auto bg-muted/40 p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}

import { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Users,
  FolderTree,
  Package,
  ShoppingCart,
  Tag,
  Wallet,
  AlertTriangle,
  BarChart3,
  Settings,
  Star,
  Home,
  Store,
  Bell,
} from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  badge?: string | number;
  children?: NavItem[];
}

export const adminNavItems: NavItem[] = [
  {
    label: "Dashboard",
    href: "/admin",
    icon: LayoutDashboard,
  },
  {
    label: "Vendors",
    href: "/admin/vendors",
    icon: Users,
  },
  {
    label: "Categories",
    href: "/admin/categories",
    icon: FolderTree,
  },
  {
    label: "Products",
    href: "/admin/products",
    icon: Package,
  },
  {
    label: "Orders",
    href: "/admin/orders",
    icon: ShoppingCart,
  },
  {
    label: "Coupons",
    href: "/admin/coupons",
    icon: Tag,
  },
  {
    label: "Payouts",
    href: "/admin/payouts",
    icon: Wallet,
  },
  {
    label: "Disputes",
    href: "/admin/disputes",
    icon: AlertTriangle,
  },
  {
    label: "Notifications",
    href: "/admin/notifications",
    icon: Bell,
  },
  {
    label: "Reports",
    href: "/admin/reports",
    icon: BarChart3,
  },
  {
    label: "Settings",
    href: "/admin/settings",
    icon: Settings,
  },
];

export const vendorNavItems: NavItem[] = [
  {
    label: "Dashboard",
    href: "/vendor",
    icon: LayoutDashboard,
  },
  {
    label: "Products",
    href: "/vendor/products",
    icon: Package,
  },
  {
    label: "Orders",
    href: "/vendor/orders",
    icon: ShoppingCart,
  },
  {
    label: "Coupons",
    href: "/vendor/coupons",
    icon: Tag,
  },
  {
    label: "Wallet",
    href: "/vendor/wallet",
    icon: Wallet,
  },
  {
    label: "Reviews",
    href: "/vendor/reviews",
    icon: Star,
  },
  {
    label: "Settings",
    href: "/vendor/settings",
    icon: Settings,
  },
];

export const storefrontNavItems: NavItem[] = [
  {
    label: "Home",
    href: "/",
    icon: Home,
  },
  {
    label: "Categories",
    href: "/categories",
    icon: FolderTree,
  },
  {
    label: "Vendors",
    href: "/vendors",
    icon: Store,
  },
];

// Authenticated customer nav items (shown when logged in)
export const customerNavItems: NavItem[] = [
  {
    label: "My Orders",
    href: "/orders",
    icon: ShoppingCart,
  },
  {
    label: "My Disputes",
    href: "/orders/disputes",
    icon: AlertTriangle,
  },
  {
    label: "Notifications",
    href: "/notifications",
    icon: Bell,
  },
];

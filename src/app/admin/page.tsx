"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import { Shield, Users, Package, DollarSign, ShoppingCart } from "lucide-react";

export default function AdminDashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated || user?.role !== "ADMIN") {
      router.push("/admin/login");
    }
  }, [isAuthenticated, user, router]);

  if (!isAuthenticated || user?.role !== "ADMIN") {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Admin Dashboard
                </h1>
                <p className="text-sm text-gray-600">
                  Welcome back, {user.firstName || user.email}
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                logout();
                router.push("/admin/login");
              }}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            icon={Users}
            label="Total Vendors"
            value="0"
            color="purple"
          />
          <StatCard
            icon={Package}
            label="Total Products"
            value="0"
            color="blue"
          />
          <StatCard
            icon={ShoppingCart}
            label="Total Orders"
            value="0"
            color="green"
          />
          <StatCard
            icon={DollarSign}
            label="Platform Revenue"
            value="Rs. 0"
            color="orange"
          />
        </div>

        {/* Welcome Message */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            🎉 Phase 2: Authentication System Complete!
          </h2>
          <div className="space-y-4 text-gray-600">
            <p>
              Your authentication system is now fully operational. Here's what
              you can do:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Manage vendors and their permissions</li>
              <li>View and manage all orders</li>
              <li>Monitor platform revenue and commissions</li>
              <li>Handle customer disputes</li>
              <li>Configure system settings</li>
            </ul>
            <div className="mt-6 pt-6 border-t border-gray-200">
              <p className="text-sm font-medium text-gray-700 mb-2">
                Next Phase: Dashboard Layouts
              </p>
              <p className="text-sm text-gray-600">
                The full admin dashboard with sidebar navigation and all
                features will be implemented in Phase 3.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: any;
  label: string;
  value: string;
  color: "purple" | "blue" | "green" | "orange";
}) {
  const colorClasses = {
    purple: "from-purple-500 to-purple-600",
    blue: "from-blue-500 to-blue-600",
    green: "from-green-500 to-green-600",
    orange: "from-orange-500 to-orange-600",
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div
          className={`w-12 h-12 bg-gradient-to-br ${colorClasses[color]} rounded-lg flex items-center justify-center`}
        >
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-sm text-gray-600 mt-1">{label}</p>
    </div>
  );
}

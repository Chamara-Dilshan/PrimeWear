import { Suspense } from "react";
import Link from "next/link";
import { Metadata } from "next";
import { LoginForm } from "@/components/auth/LoginForm";
import { Shield } from "lucide-react";

export const metadata: Metadata = {
  title: "Admin Login - PrimeWear",
  description: "Sign in to your admin account",
};

function AdminLoginContent() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-white to-blue-50 px-4 py-8">
      <div className="w-full max-w-md">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-600 to-blue-600 rounded-2xl mb-4">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Admin Portal
          </h1>
          <p className="text-gray-600">Sign in to manage your platform</p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          <LoginForm userType="admin" />

          {/* Footer Links */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="text-center space-y-2">
              <p className="text-sm text-gray-600">
                Not an admin?{" "}
                <Link
                  href="/vendor/login"
                  className="text-blue-600 hover:text-blue-700 font-medium hover:underline"
                >
                  Vendor Login
                </Link>
              </p>
              <p className="text-sm text-gray-600">
                <Link
                  href="/login"
                  className="text-blue-600 hover:text-blue-700 font-medium hover:underline"
                >
                  Customer Login
                </Link>
              </p>
            </div>
          </div>
        </div>

        {/* Additional Info */}
        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            Secure admin access · Protected by encryption
          </p>
        </div>
      </div>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AdminLoginContent />
    </Suspense>
  );
}

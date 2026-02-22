import { Suspense } from "react";
import Link from "next/link";
import { Metadata } from "next";
import { OTPForm } from "@/components/auth/OTPForm";
import { ShoppingBag } from "lucide-react";

export const metadata: Metadata = {
  title: "Customer Login - PrimeWear",
  description: "Sign in to your account with email OTP",
};

function CustomerLoginContent() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 via-white to-orange-50 px-4 py-8">
      <div className="w-full max-w-md">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-pink-600 to-orange-600 rounded-2xl mb-4">
            <ShoppingBag className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome to PrimeWear
          </h1>
          <p className="text-gray-600">Sign in with your email</p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          <OTPForm />

          {/* How it works */}
          <div className="mt-6 bg-gray-50 border border-gray-200 rounded-lg p-4">
            <p className="text-xs font-medium text-gray-700 mb-2">
              How it works:
            </p>
            <ol className="text-xs text-gray-600 space-y-1 list-decimal list-inside">
              <li>Enter your email address</li>
              <li>We&apos;ll send you a 6-digit code</li>
              <li>Enter the code to sign in</li>
            </ol>
            <p className="text-xs text-gray-500 mt-2">
              No password required! 🎉
            </p>
          </div>

          {/* Footer Links */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="text-center space-y-2">
              <p className="text-sm text-gray-600">
                Are you a vendor?{" "}
                <Link
                  href="/vendor/login"
                  className="text-blue-600 hover:text-blue-700 font-medium hover:underline"
                >
                  Vendor Login
                </Link>
              </p>
              <p className="text-sm text-gray-600">
                <Link
                  href="/admin/login"
                  className="text-blue-600 hover:text-blue-700 font-medium hover:underline"
                >
                  Admin Login
                </Link>
              </p>
            </div>
          </div>
        </div>

        {/* Additional Info */}
        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            Secure login · No password needed · Email verification
          </p>
        </div>
      </div>
    </div>
  );
}

export default function CustomerLoginPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <CustomerLoginContent />
    </Suspense>
  );
}

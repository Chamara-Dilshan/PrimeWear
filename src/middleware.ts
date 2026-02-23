import { NextRequest, NextResponse } from "next/server";
import { tokenUtils } from "./lib/auth";
import { UserRole } from "@prisma/client";

// Define route patterns and their required roles
const protectedRoutes = {
  "/admin": [UserRole.ADMIN],
  "/vendor": [UserRole.VENDOR],
  "/orders": [UserRole.CUSTOMER, UserRole.ADMIN, UserRole.VENDOR],
  "/cart": [UserRole.CUSTOMER],
  "/checkout": [UserRole.CUSTOMER],
  "/payment": [UserRole.CUSTOMER],
  "/profile": [UserRole.CUSTOMER, UserRole.ADMIN, UserRole.VENDOR],
  "/notifications": [UserRole.CUSTOMER, UserRole.ADMIN, UserRole.VENDOR],
  "/api/notifications": [UserRole.CUSTOMER, UserRole.ADMIN, UserRole.VENDOR],
  "/api/admin": [UserRole.ADMIN],
  "/api/vendor": [UserRole.VENDOR],
};

// Public routes that don't require authentication
const publicRoutes = [
  "/",
  "/login",
  "/admin/login",
  "/vendor/login",
  "/products",
  "/categories",
  "/vendors",
  "/deals",
  "/api/deals",
  "/api/auth/login",
  "/api/auth/logout",
  "/api/auth/refresh",
  "/api/auth/otp",
  "/api/payments/webhook", // PayHere webhook must be public
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for static files and api routes (except protected ones)
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/static") ||
    pathname.match(/\.(jpg|jpeg|png|gif|svg|ico|css|js|woff|woff2|ttf|eot)$/i)
  ) {
    return NextResponse.next();
  }

  // Check if route is public
  const isPublicRoute = publicRoutes.some(
    (route) => pathname === route || pathname.startsWith(route)
  );

  if (isPublicRoute) {
    return NextResponse.next();
  }

  // Check if route is protected
  const protectedRoute = Object.keys(protectedRoutes).find((route) =>
    pathname.startsWith(route)
  );

  if (!protectedRoute) {
    // Route not in protected list, allow access
    return NextResponse.next();
  }

  // Get token from cookie or header
  const tokenFromCookie = request.cookies.get("accessToken")?.value;
  const authHeader = request.headers.get("Authorization");
  const tokenFromHeader = authHeader?.startsWith("Bearer ")
    ? authHeader.substring(7)
    : null;

  const token = tokenFromCookie || tokenFromHeader;

  // No token, redirect to appropriate login page
  if (!token) {
    const url = request.nextUrl.clone();

    if (pathname.startsWith("/admin")) {
      url.pathname = "/admin/login";
    } else if (pathname.startsWith("/vendor")) {
      url.pathname = "/vendor/login";
    } else {
      url.pathname = "/login";
    }

    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  // Verify token
  const payload = tokenUtils.verifyAccessToken(token);

  if (!payload) {
    // Invalid token, redirect to login
    const url = request.nextUrl.clone();

    if (pathname.startsWith("/admin")) {
      url.pathname = "/admin/login";
    } else if (pathname.startsWith("/vendor")) {
      url.pathname = "/vendor/login";
    } else {
      url.pathname = "/login";
    }

    url.searchParams.set("redirect", pathname);
    const response = NextResponse.redirect(url);
    response.cookies.delete("accessToken");
    return response;
  }

  // Check if user has required role
  const requiredRoles = protectedRoutes[protectedRoute as keyof typeof protectedRoutes] as UserRole[];
  if (!requiredRoles.includes(payload.role)) {
    // User doesn't have required role, return 403
    const url = request.nextUrl.clone();
    url.pathname = "/403";
    return NextResponse.redirect(url);
  }

  // User is authenticated and authorized
  // Pass user info via request headers so API route handlers can read them
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("X-User-Id", payload.userId);
  requestHeaders.set("X-User-Role", payload.role);
  requestHeaders.set("X-User-Email", payload.email);

  return NextResponse.next({
    request: { headers: requestHeaders },
  });
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (auth endpoints are public)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api/auth|_next/static|_next/image|favicon.ico).*)",
  ],
};

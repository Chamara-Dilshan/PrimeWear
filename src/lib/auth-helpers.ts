import { NextRequest, NextResponse } from "next/server";
import { tokenUtils, TokenPayload } from "./auth";
import { UserRole } from "@prisma/client";

/**
 * Auth error response
 */
export class AuthError extends Error {
  constructor(
    message: string,
    public statusCode: number
  ) {
    super(message);
    this.name = "AuthError";
  }
}

/**
 * Get authenticated user from request cookies
 * Checks both cookie and Authorization header
 */
export function getAuthUser(request: NextRequest): TokenPayload | null {
  // Try to get token from cookie first
  const tokenFromCookie = request.cookies.get("accessToken")?.value;

  // Fallback to Authorization header
  const authHeader = request.headers.get("Authorization");
  const tokenFromHeader = authHeader?.startsWith("Bearer ")
    ? authHeader.substring(7)
    : null;

  const token = tokenFromCookie || tokenFromHeader;

  if (!token) {
    return null;
  }

  // Verify and return payload
  return tokenUtils.verifyAccessToken(token);
}

/**
 * Require authentication - returns user or throws 401
 */
export function requireAuth(request: NextRequest): TokenPayload {
  const user = getAuthUser(request);

  if (!user) {
    throw new AuthError("Unauthorized", 401);
  }

  return user;
}

/**
 * Require admin role - returns admin user or throws 403
 */
export function requireAdmin(request: NextRequest): TokenPayload {
  const user = requireAuth(request);

  if (user.role !== UserRole.ADMIN) {
    throw new AuthError("Forbidden: Admin access required", 403);
  }

  return user;
}

/**
 * Require vendor role - returns vendor user or throws 403
 */
export function requireVendor(request: NextRequest): TokenPayload {
  const user = requireAuth(request);

  if (user.role !== UserRole.VENDOR) {
    throw new AuthError("Forbidden: Vendor access required", 403);
  }

  return user;
}

/**
 * Require customer role - returns customer user or throws 403
 */
export function requireCustomer(request: NextRequest): TokenPayload {
  const user = requireAuth(request);

  if (user.role !== UserRole.CUSTOMER) {
    throw new AuthError("Forbidden: Customer access required", 403);
  }

  return user;
}

/**
 * Check if user has any of the specified roles
 */
export function requireAnyRole(
  request: NextRequest,
  roles: UserRole[]
): TokenPayload {
  const user = requireAuth(request);

  if (!roles.includes(user.role)) {
    throw new AuthError(
      `Forbidden: Required roles: ${roles.join(", ")}`,
      403
    );
  }

  return user;
}

/**
 * Handle auth errors in catch blocks
 * Returns appropriate NextResponse for auth errors, or null for other errors
 */
export function handleAuthError(error: unknown): NextResponse | null {
  if (error instanceof AuthError) {
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: error.statusCode }
    );
  }
  return null;
}

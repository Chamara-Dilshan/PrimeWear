import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { passwordUtils, tokenUtils } from "@/lib/auth";
import { UserRole } from "@prisma/client";

// Validation schema
const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const validation = loginSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: validation.error.issues[0].message,
        },
        { status: 400 }
      );
    }

    const { email, password } = validation.data;

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        vendor: true,
      },
    });

    // Check if user exists
    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid email or password",
        },
        { status: 401 }
      );
    }

    // Check if user is Admin or Vendor
    if (user.role !== UserRole.ADMIN && user.role !== UserRole.VENDOR) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid login method for this account type",
        },
        { status: 403 }
      );
    }

    // Check if account is active
    if (!user.isActive) {
      return NextResponse.json(
        {
          success: false,
          error: "Your account has been deactivated. Please contact support.",
        },
        { status: 403 }
      );
    }

    // Verify password
    if (!user.passwordHash) {
      return NextResponse.json(
        {
          success: false,
          error: "Password not set for this account",
        },
        { status: 500 }
      );
    }

    const isPasswordValid = await passwordUtils.compare(
      password,
      user.passwordHash
    );

    if (!isPasswordValid) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid email or password",
        },
        { status: 401 }
      );
    }

    // For vendors, check if shop is approved
    if (user.role === UserRole.VENDOR && user.vendor) {
      if (!user.vendor.isApproved) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Your vendor account is pending approval. Please contact support.",
          },
          { status: 403 }
        );
      }
    }

    // Generate tokens
    const tokens = tokenUtils.generateTokenPair({
      userId: user.id,
      email: user.email!,
      role: user.role,
    });

    // Create response with user data and tokens
    const response = NextResponse.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          firstName: user.firstName,
          lastName: user.lastName,
          mustChangePassword: user.mustChangePassword,
        },
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      },
    });

    // Set cookies for middleware authentication
    // accessToken - httpOnly for security, 1 hour expiry
    response.cookies.set("accessToken", tokens.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60, // 1 hour (matches JWT_ACCESS_EXPIRY)
      path: "/",
    });

    // refreshToken - httpOnly for security, 7 days expiry
    response.cookies.set("refreshToken", tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60, // 7 days (matches JWT_REFRESH_EXPIRY)
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "An error occurred during login",
      },
      { status: 500 }
    );
  }
}

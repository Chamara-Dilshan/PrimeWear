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
          error: validation.error.errors[0].message,
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

    // Return user data and tokens
    return NextResponse.json({
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

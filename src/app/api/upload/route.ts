import { NextRequest, NextResponse } from "next/server";
import { uploadImage } from "@/lib/cloudinary";
import { IMAGE_CONFIG } from "@/lib/utils/image";

/**
 * POST /api/upload
 * Upload image to Cloudinary with validation
 */
export async function POST(request: NextRequest) {
  try {
    // Get form data
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const folder = (formData.get("folder") as string) || "products";

    if (!file) {
      return NextResponse.json(
        { success: false, error: "No file provided" },
        { status: 400 }
      );
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { success: false, error: "File must be an image" },
        { status: 400 }
      );
    }

    // Validate file format
    if (!IMAGE_CONFIG.allowedFormats.includes(file.type)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid file format. Only JPG, PNG, and WEBP are allowed.",
        },
        { status: 400 }
      );
    }

    // Validate file size (5MB)
    if (file.size > IMAGE_CONFIG.maxSize) {
      const maxSizeMB = IMAGE_CONFIG.maxSize / 1024 / 1024;
      return NextResponse.json(
        {
          success: false,
          error: `File size must be less than ${maxSizeMB}MB`,
        },
        { status: 400 }
      );
    }

    // Convert to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Upload to Cloudinary
    const result = await uploadImage(buffer, folder);

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to upload image. Please try again.",
      },
      { status: 500 }
    );
  }
}

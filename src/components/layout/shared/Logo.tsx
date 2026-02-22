"use client";

import Link from "next/link";
import { Store } from "lucide-react";
import { cn } from "@/lib/utils";

interface LogoProps {
  variant?: "full" | "icon" | "text";
  size?: "sm" | "md" | "lg";
  className?: string;
  href?: string;
}

export function Logo({
  variant = "full",
  size = "md",
  className,
  href = "/",
}: LogoProps) {
  const sizeClasses = {
    sm: {
      icon: "w-5 h-5",
      text: "text-base",
      container: "gap-1.5",
    },
    md: {
      icon: "w-6 h-6",
      text: "text-lg",
      container: "gap-2",
    },
    lg: {
      icon: "w-8 h-8",
      text: "text-2xl",
      container: "gap-3",
    },
  };

  const classes = sizeClasses[size];

  return (
    <Link
      href={href}
      className={cn("flex items-center", classes.container, className)}
    >
      {variant !== "text" && (
        <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center shadow-lg">
          <Store className={cn("text-white", classes.icon)} />
        </div>
      )}
      {variant !== "icon" && (
        <span
          className={cn(
            "font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent",
            classes.text
          )}
        >
          PrimeWear
        </span>
      )}
    </Link>
  );
}

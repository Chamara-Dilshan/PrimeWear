import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { NotificationToast } from "@/components/notifications/NotificationToast";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "PrimeWear - Multi-Vendor Marketplace",
  description: "Sri Lanka's premier multi-vendor e-commerce platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {children}
        <NotificationToast />
      </body>
    </html>
  );
}

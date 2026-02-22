/**
 * Vendor Orders Page
 * Lists all orders containing vendor's items
 */

import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { tokenUtils } from "@/lib/auth";
import { VendorOrdersTable } from "@/components/vendor/orders/VendorOrdersTable";
import { Package } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { OrderStatus } from "@prisma/client";

interface SearchParams {
  page?: string;
  status?: OrderStatus;
}

async function getVendorOrders(searchParams: SearchParams) {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("accessToken")?.value;

  if (!accessToken) {
    return null;
  }

  // Verify token
  const payload = tokenUtils.verifyAccessToken(accessToken);
  if (!payload) {
    return null;
  }

  const page = searchParams.page ? parseInt(searchParams.page) : 1;
  const status = searchParams.status;

  // Build query params
  const params = new URLSearchParams({
    page: page.toString(),
    pageSize: "20",
  });

  if (status) {
    params.append("status", status);
  }

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_APP_URL}/api/vendor/orders?${params.toString()}`,
    {
      headers: {
        Cookie: `accessToken=${accessToken}`,
      },
      cache: "no-store",
    }
  );

  if (!response.ok) {
    return null;
  }

  const data = await response.json();
  return data.success ? data.data : null;
}

export default async function VendorOrdersPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const data = await getVendorOrders(searchParams);

  if (!data) {
    redirect("/vendor/login");
  }

  const { orders, pagination, stats } = data;
  const currentStatus = searchParams.status;

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Orders</h1>
        <p className="text-muted-foreground">
          Manage orders containing your products
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="border rounded-lg p-4 bg-card">
          <p className="text-sm text-muted-foreground mb-1">Total Orders</p>
          <p className="text-2xl font-bold">{stats.total}</p>
        </div>
        <div className="border rounded-lg p-4 bg-card">
          <p className="text-sm text-muted-foreground mb-1">
            Payment Confirmed
          </p>
          <p className="text-2xl font-bold">{stats.paymentConfirmed}</p>
        </div>
        <div className="border rounded-lg p-4 bg-card">
          <p className="text-sm text-muted-foreground mb-1">Processing</p>
          <p className="text-2xl font-bold">{stats.processing}</p>
        </div>
        <div className="border rounded-lg p-4 bg-card">
          <p className="text-sm text-muted-foreground mb-1">Shipped</p>
          <p className="text-2xl font-bold">{stats.shipped}</p>
        </div>
      </div>

      {/* Status Filters */}
      <div className="flex flex-wrap gap-2 mb-6">
        <Link href="/vendor/orders">
          <Button variant={!currentStatus ? "default" : "outline"} size="sm">
            All Orders
          </Button>
        </Link>
        <Link href="/vendor/orders?status=PAYMENT_CONFIRMED">
          <Button
            variant={
              currentStatus === "PAYMENT_CONFIRMED" ? "default" : "outline"
            }
            size="sm"
          >
            Payment Confirmed
          </Button>
        </Link>
        <Link href="/vendor/orders?status=PROCESSING">
          <Button
            variant={currentStatus === "PROCESSING" ? "default" : "outline"}
            size="sm"
          >
            Processing
          </Button>
        </Link>
        <Link href="/vendor/orders?status=SHIPPED">
          <Button
            variant={currentStatus === "SHIPPED" ? "default" : "outline"}
            size="sm"
          >
            Shipped
          </Button>
        </Link>
        <Link href="/vendor/orders?status=DELIVERED">
          <Button
            variant={currentStatus === "DELIVERED" ? "default" : "outline"}
            size="sm"
          >
            Delivered
          </Button>
        </Link>
      </div>

      {/* Orders Table */}
      {orders.length === 0 ? (
        <div className="text-center py-16 border rounded-lg bg-muted/10">
          <Package className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-xl font-semibold mb-2">No orders found</h3>
          <p className="text-muted-foreground">
            {currentStatus
              ? `No ${currentStatus.toLowerCase().replace("_", " ")} orders.`
              : "No orders containing your products yet."}
          </p>
        </div>
      ) : (
        <>
          <VendorOrdersTable orders={orders} />

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-8">
              {pagination.page > 1 && (
                <Link
                  href={`/vendor/orders?page=${pagination.page - 1}${currentStatus ? `&status=${currentStatus}` : ""}`}
                >
                  <Button variant="outline">Previous</Button>
                </Link>
              )}
              <span className="flex items-center px-4 text-sm text-muted-foreground">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              {pagination.page < pagination.totalPages && (
                <Link
                  href={`/vendor/orders?page=${pagination.page + 1}${currentStatus ? `&status=${currentStatus}` : ""}`}
                >
                  <Button variant="outline">Next</Button>
                </Link>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

/**
 * Customer Orders Page
 * Lists all customer orders with filtering and pagination
 */

import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { tokenUtils } from "@/lib/auth";
import { OrderCard } from "@/components/orders/OrderCard";
import { OrderStatusBadge } from "@/components/orders/OrderStatusBadge";
import { OrderStatus } from "@prisma/client";
import { Package } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface SearchParams {
  page?: string;
  status?: OrderStatus;
}

async function getOrders(searchParams: SearchParams) {
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
    pageSize: "10",
  });

  if (status) {
    params.append("status", status);
  }

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_APP_URL}/api/orders?${params.toString()}`,
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

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const data = await getOrders(searchParams);

  if (!data) {
    redirect("/login");
  }

  const { orders, pagination, stats } = data;
  const currentStatus = searchParams.status;

  return (
    <div className="container max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">My Orders</h1>
        <p className="text-muted-foreground">
          View and manage your order history
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="border rounded-lg p-4 bg-card">
          <p className="text-sm text-muted-foreground mb-1">Total Orders</p>
          <p className="text-2xl font-bold">{stats.total}</p>
        </div>
        <div className="border rounded-lg p-4 bg-card">
          <p className="text-sm text-muted-foreground mb-1">Processing</p>
          <p className="text-2xl font-bold">{stats.processing}</p>
        </div>
        <div className="border rounded-lg p-4 bg-card">
          <p className="text-sm text-muted-foreground mb-1">Shipped</p>
          <p className="text-2xl font-bold">{stats.shipped}</p>
        </div>
        <div className="border rounded-lg p-4 bg-card">
          <p className="text-sm text-muted-foreground mb-1">Delivered</p>
          <p className="text-2xl font-bold">
            {stats.delivered + stats.deliveryConfirmed}
          </p>
        </div>
      </div>

      {/* Status Filters */}
      <div className="flex flex-wrap gap-2 mb-6">
        <Link href="/orders">
          <Button variant={!currentStatus ? "default" : "outline"} size="sm">
            All Orders
          </Button>
        </Link>
        <Link href="/orders?status=PAYMENT_CONFIRMED">
          <Button
            variant={
              currentStatus === "PAYMENT_CONFIRMED" ? "default" : "outline"
            }
            size="sm"
          >
            Payment Confirmed
          </Button>
        </Link>
        <Link href="/orders?status=PROCESSING">
          <Button
            variant={currentStatus === "PROCESSING" ? "default" : "outline"}
            size="sm"
          >
            Processing
          </Button>
        </Link>
        <Link href="/orders?status=SHIPPED">
          <Button
            variant={currentStatus === "SHIPPED" ? "default" : "outline"}
            size="sm"
          >
            Shipped
          </Button>
        </Link>
        <Link href="/orders?status=DELIVERED">
          <Button
            variant={currentStatus === "DELIVERED" ? "default" : "outline"}
            size="sm"
          >
            Delivered
          </Button>
        </Link>
        <Link href="/orders?status=DELIVERY_CONFIRMED">
          <Button
            variant={
              currentStatus === "DELIVERY_CONFIRMED" ? "default" : "outline"
            }
            size="sm"
          >
            Completed
          </Button>
        </Link>
        <Link href="/orders?status=CANCELLED">
          <Button
            variant={currentStatus === "CANCELLED" ? "default" : "outline"}
            size="sm"
          >
            Cancelled
          </Button>
        </Link>
      </div>

      {/* Orders List */}
      {orders.length === 0 ? (
        <div className="text-center py-16 border rounded-lg bg-muted/10">
          <Package className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-xl font-semibold mb-2">No orders found</h3>
          <p className="text-muted-foreground mb-4">
            {currentStatus
              ? `You don't have any ${currentStatus.toLowerCase().replace("_", " ")} orders.`
              : "You haven't placed any orders yet."}
          </p>
          <Link href="/products">
            <Button>Start Shopping</Button>
          </Link>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {orders.map((order: any) => (
              <OrderCard key={order.id} order={order} />
            ))}
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-8">
              {pagination.page > 1 && (
                <Link
                  href={`/orders?page=${pagination.page - 1}${currentStatus ? `&status=${currentStatus}` : ""}`}
                >
                  <Button variant="outline">Previous</Button>
                </Link>
              )}
              <span className="flex items-center px-4 text-sm text-muted-foreground">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              {pagination.page < pagination.totalPages && (
                <Link
                  href={`/orders?page=${pagination.page + 1}${currentStatus ? `&status=${currentStatus}` : ""}`}
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

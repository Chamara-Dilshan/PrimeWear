/**
 * Order Status Badge Component
 * Displays order status with appropriate color coding
 */

import { Badge } from "@/components/ui/badge";
import { OrderStatus } from "@prisma/client";

interface OrderStatusBadgeProps {
  status: OrderStatus;
  className?: string;
}

const STATUS_CONFIG: Record<
  OrderStatus,
  {
    label: string;
    variant: "default" | "secondary" | "destructive" | "outline";
    className?: string;
  }
> = {
  PENDING_PAYMENT: {
    label: "Pending Payment",
    variant: "outline",
    className: "border-yellow-500 text-yellow-700 bg-yellow-50",
  },
  PAYMENT_CONFIRMED: {
    label: "Payment Confirmed",
    variant: "default",
    className: "bg-blue-500 text-white",
  },
  PROCESSING: {
    label: "Processing",
    variant: "default",
    className: "bg-purple-500 text-white",
  },
  SHIPPED: {
    label: "Shipped",
    variant: "default",
    className: "bg-indigo-500 text-white",
  },
  DELIVERED: {
    label: "Delivered",
    variant: "default",
    className: "bg-teal-500 text-white",
  },
  DELIVERY_CONFIRMED: {
    label: "Delivery Confirmed",
    variant: "default",
    className: "bg-green-600 text-white",
  },
  CANCELLED: {
    label: "Cancelled",
    variant: "destructive",
  },
  RETURN_REQUESTED: {
    label: "Return Requested",
    variant: "outline",
    className: "border-orange-500 text-orange-700 bg-orange-50",
  },
  RETURNED: {
    label: "Returned",
    variant: "secondary",
  },
  DISPUTED: {
    label: "Disputed",
    variant: "destructive",
    className: "bg-red-600 text-white",
  },
};

export function OrderStatusBadge({ status, className }: OrderStatusBadgeProps) {
  const config = STATUS_CONFIG[status];

  return (
    <Badge
      variant={config.variant}
      className={`${config.className || ""} ${className || ""}`}
    >
      {config.label}
    </Badge>
  );
}

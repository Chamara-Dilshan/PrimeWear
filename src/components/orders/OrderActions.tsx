/**
 * Order Actions Component
 * Renders action buttons based on available actions for the order
 */

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CancelOrderDialog } from "./CancelOrderDialog";
import { ConfirmDeliveryDialog } from "./ConfirmDeliveryDialog";
import { RequestReturnDialog } from "./RequestReturnDialog";
import { XCircle, CheckCircle, PackageX } from "lucide-react";

interface OrderActionsProps {
  orderId: string;
  orderNumber: string;
  actions: {
    canCancel: boolean;
    canConfirmDelivery: boolean;
    canRequestReturn: boolean;
    cancelReason?: string;
    returnReason?: string;
  };
  onSuccess?: () => void;
}

export function OrderActions({
  orderId,
  orderNumber,
  actions,
  onSuccess,
}: OrderActionsProps) {
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [confirmDeliveryDialogOpen, setConfirmDeliveryDialogOpen] =
    useState(false);
  const [returnDialogOpen, setReturnDialogOpen] = useState(false);

  // If no actions available, don't render anything
  if (
    !actions.canCancel &&
    !actions.canConfirmDelivery &&
    !actions.canRequestReturn
  ) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {/* Cancel Order */}
      {actions.canCancel && (
        <>
          <Button
            variant="destructive"
            onClick={() => setCancelDialogOpen(true)}
          >
            <XCircle className="w-4 h-4 mr-2" />
            Cancel Order
          </Button>
          <CancelOrderDialog
            orderId={orderId}
            orderNumber={orderNumber}
            open={cancelDialogOpen}
            onOpenChange={setCancelDialogOpen}
            onSuccess={onSuccess}
          />
        </>
      )}

      {/* Confirm Delivery */}
      {actions.canConfirmDelivery && (
        <>
          <Button
            variant="default"
            onClick={() => setConfirmDeliveryDialogOpen(true)}
          >
            <CheckCircle className="w-4 h-4 mr-2" />
            Confirm Delivery
          </Button>
          <ConfirmDeliveryDialog
            orderId={orderId}
            orderNumber={orderNumber}
            open={confirmDeliveryDialogOpen}
            onOpenChange={setConfirmDeliveryDialogOpen}
            onSuccess={onSuccess}
          />
        </>
      )}

      {/* Request Return */}
      {actions.canRequestReturn && (
        <>
          <Button
            variant="outline"
            onClick={() => setReturnDialogOpen(true)}
          >
            <PackageX className="w-4 h-4 mr-2" />
            Request Return
          </Button>
          <RequestReturnDialog
            orderId={orderId}
            orderNumber={orderNumber}
            open={returnDialogOpen}
            onOpenChange={setReturnDialogOpen}
            onSuccess={onSuccess}
          />
        </>
      )}

      {/* Disabled action messages */}
      {!actions.canCancel && actions.cancelReason && (
        <p className="text-sm text-muted-foreground w-full">
          Cannot cancel: {actions.cancelReason}
        </p>
      )}
      {!actions.canRequestReturn && actions.returnReason && (
        <p className="text-sm text-muted-foreground w-full">
          Cannot return: {actions.returnReason}
        </p>
      )}
    </div>
  );
}

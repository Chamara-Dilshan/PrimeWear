"use client";

/**
 * Payment page
 * Initiates PayHere payment and auto-redirects to payment gateway
 */

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, CreditCard, AlertCircle } from "lucide-react";

interface PaymentPageProps {
  params: { orderId: string };
}

export default function PaymentPage({ params }: PaymentPageProps) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [orderDetails, setOrderDetails] = useState<any>(null);
  const [paymentData, setPaymentData] = useState<{
    payhereUrl: string;
    paymentData: Record<string, string>;
  } | null>(null);

  // Fetch order details
  useEffect(() => {
    async function fetchOrder() {
      try {
        const response = await fetch(`/api/orders/${params.orderId}`);
        const result = await response.json();

        if (!result.success) {
          setError(result.error || "Failed to fetch order");
          setLoading(false);
          return;
        }

        const order = result.data.order;

        // Check if order already paid
        if (order.status !== "PENDING_PAYMENT") {
          router.push(`/orders/${params.orderId}`);
          return;
        }

        setOrderDetails(order);
      } catch (err) {
        setError("Failed to load order details");
        setLoading(false);
      }
    }

    fetchOrder();
  }, [params.orderId, router]);

  // Initiate payment once order details are loaded
  useEffect(() => {
    if (!orderDetails) return;

    async function initiatePayment() {
      try {
        const response = await fetch("/api/payments/initiate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderId: params.orderId }),
        });

        const result = await response.json();

        if (!result.success) {
          setError(result.error || "Failed to initiate payment");
          setLoading(false);
          return;
        }

        setPaymentData({
          payhereUrl: result.data.payhereUrl,
          paymentData: result.data.paymentData,
        });
        setLoading(false);
      } catch (err) {
        setError("Failed to initiate payment. Please try again.");
        setLoading(false);
      }
    }

    initiatePayment();
  }, [orderDetails, params.orderId]);

  // Auto-submit form once payment data is ready
  useEffect(() => {
    if (paymentData && formRef.current) {
      console.log("Redirecting to PayHere...");
      formRef.current.submit();
    }
  }, [paymentData]);

  // Retry payment
  const handleRetry = () => {
    setError(null);
    setLoading(true);
    window.location.reload();
  };

  if (error) {
    return (
      <div className="container mx-auto max-w-2xl px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              Payment Error
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
            <div className="flex gap-3">
              <Button onClick={handleRetry} className="flex-1">
                Try Again
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push("/cart")}
                className="flex-1"
              >
                Return to Cart
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-3xl px-4 py-8">
      {/* Order Summary */}
      {orderDetails && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Order Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Order Number:</span>
              <span className="font-medium">{orderDetails.orderNumber}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Items:</span>
              <span className="font-medium">{orderDetails.items.length}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal:</span>
              <span className="font-medium">
                Rs. {orderDetails.subtotal.toLocaleString()}
              </span>
            </div>
            {orderDetails.discountAmount > 0 && (
              <div className="flex justify-between text-sm text-green-600">
                <span>Discount:</span>
                <span>-Rs. {orderDetails.discountAmount.toLocaleString()}</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Shipping:</span>
              <span className="font-medium">
                Rs. {orderDetails.shippingAmount.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between border-t pt-3 text-lg font-bold">
              <span>Total:</span>
              <span>Rs. {orderDetails.totalAmount.toLocaleString()}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Payment Gateway Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Redirecting to Payment Gateway
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
          </div>
          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              Please wait while we redirect you to PayHere...
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              You will be redirected to a secure payment page to complete your
              order.
            </p>
          </div>

          {/* Payment Method Logos */}
          <div className="flex items-center justify-center gap-4 border-t pt-6">
            <div className="text-xs text-muted-foreground">Supported by:</div>
            <div className="flex gap-2 text-xs font-medium text-muted-foreground">
              <span className="rounded border px-2 py-1">VISA</span>
              <span className="rounded border px-2 py-1">MasterCard</span>
              <span className="rounded border px-2 py-1">Frimi</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Hidden form for PayHere redirect */}
      {paymentData && (
        <form
          ref={formRef}
          action={paymentData.payhereUrl}
          method="POST"
          style={{ display: "none" }}
        >
          {Object.entries(paymentData.paymentData).map(([key, value]) => (
            <input key={key} name={key} value={value} readOnly />
          ))}
        </form>
      )}
    </div>
  );
}

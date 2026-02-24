import { Star } from "lucide-react";

export default function VendorReviewsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">Reviews</h1>
        <p className="text-muted-foreground mt-1">
          Customer reviews for your products
        </p>
      </div>

      <div className="flex flex-col items-center justify-center py-24 border rounded-lg bg-muted/10 text-center space-y-4">
        <div className="p-4 rounded-full bg-muted">
          <Star className="h-10 w-10 text-muted-foreground" />
        </div>
        <div className="space-y-1">
          <h2 className="text-xl font-semibold">Reviews Coming Soon</h2>
          <p className="text-sm text-muted-foreground max-w-sm">
            Customer product reviews will be available here in a future update.
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * Auto-tracking polling service
 *
 * Periodically checks carrier tracking numbers via AfterShip API.
 * When a carrier marks a package as "Delivered", the order is automatically
 * set to DELIVERED status and vendor funds are released from escrow.
 *
 * Configuration (env):
 *   AFTERSHIP_API_KEY          - AfterShip API key (required to enable polling)
 *   TRACKING_POLL_INTERVAL_MS  - Poll interval in milliseconds (default: 6 hours)
 *
 * AfterShip free tier: 100 trackings/month — suitable for small platforms.
 * To get an API key: https://www.aftership.com/
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const AFTERSHIP_API_URL = "https://api.aftership.com/v4";
const AFTERSHIP_API_KEY = process.env.AFTERSHIP_API_KEY;
const POLL_INTERVAL_MS = parseInt(
  process.env.TRACKING_POLL_INTERVAL_MS ?? "21600000",
  10
); // 6 hours default

// AfterShip tag values for delivered state
const DELIVERED_TAGS = ["Delivered"];

interface AfterShipTracking {
  tag: string;
  slug: string;
  tracking_number: string;
}

interface AfterShipResponse {
  meta: { code: number; message: string };
  data?: { tracking?: AfterShipTracking };
}

/**
 * Create or retrieve a tracking in AfterShip.
 * POST is idempotent: returns 201 (new) or 4012 (existing),
 * both responses include the tracking object with current tag.
 */
async function getTrackingTag(
  trackingNumber: string
): Promise<string | null> {
  try {
    const response = await fetch(`${AFTERSHIP_API_URL}/trackings`, {
      method: "POST",
      headers: {
        "aftership-api-key": AFTERSHIP_API_KEY!,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        tracking: { tracking_number: trackingNumber },
      }),
    });

    const data = (await response.json()) as AfterShipResponse;

    // 201 = new tracking created; 4012 = already exists — both return tracking data
    if (data.data?.tracking?.tag) {
      return data.data.tracking.tag;
    }

    // If the response doesn't include tracking data (rare), try GET by slug
    if (data.data?.tracking?.slug) {
      const slug = data.data.tracking.slug;
      const getResponse = await fetch(
        `${AFTERSHIP_API_URL}/trackings/${slug}/${encodeURIComponent(trackingNumber)}`,
        {
          headers: { "aftership-api-key": AFTERSHIP_API_KEY! },
        }
      );
      const getData = (await getResponse.json()) as AfterShipResponse;
      return getData.data?.tracking?.tag ?? null;
    }

    return null;
  } catch (err) {
    console.error(
      `[TrackingPoller] Error checking tracking ${trackingNumber}:`,
      err
    );
    return null;
  }
}

/**
 * One poll cycle: check all SHIPPED orders with tracking numbers.
 */
async function pollTrackings(): Promise<void> {
  console.log("[TrackingPoller] Starting poll cycle...");

  // Find all SHIPPED order items with a tracking number where the parent
  // order is still SHIPPED and funds have not been released yet.
  const shippedItems = await prisma.orderItem.findMany({
    where: {
      status: "SHIPPED",
      trackingNumber: { not: null },
      order: {
        status: "SHIPPED",
        deliveryConfirmedAt: null,
      },
    },
    select: {
      id: true,
      orderId: true,
      trackingNumber: true,
      order: {
        select: {
          id: true,
          orderNumber: true,
        },
      },
    },
  });

  if (shippedItems.length === 0) {
    console.log(
      "[TrackingPoller] No SHIPPED orders with tracking numbers — nothing to do."
    );
    return;
  }

  console.log(
    `[TrackingPoller] Checking ${shippedItems.length} item(s) across ${
      new Set(shippedItems.map((i) => i.orderId)).size
    } order(s)...`
  );

  // Deduplicate by orderId — we only need to check one item per order
  // (all items in a SHIPPED order share the same parent status)
  const seenOrders = new Set<string>();
  const itemsToCheck = shippedItems.filter((item) => {
    if (seenOrders.has(item.orderId)) return false;
    seenOrders.add(item.orderId);
    return true;
  });

  // Track orders we've already processed this cycle to avoid race conditions
  const processedOrderIds = new Set<string>();

  for (const item of itemsToCheck) {
    if (processedOrderIds.has(item.orderId)) continue;

    const tag = await getTrackingTag(item.trackingNumber!);

    if (tag !== null) {
      console.log(
        `[TrackingPoller] ${item.order.orderNumber} | tracking ${item.trackingNumber} → ${tag}`
      );
    }

    if (tag !== null && DELIVERED_TAGS.includes(tag)) {
      console.log(
        `[TrackingPoller] Auto-marking order ${item.order.orderNumber} as DELIVERED...`
      );

      try {
        // Dynamic import avoids circular reference issues and keeps path resolution clean
        const { markOrderDelivered } = await import(
          "../../src/lib/utils/markOrderDelivered"
        );
        const result = await markOrderDelivered(item.orderId, "tracking");

        if (result.success) {
          console.log(
            `[TrackingPoller] ✓ Order ${item.order.orderNumber} auto-marked as DELIVERED`
          );
          processedOrderIds.add(item.orderId);
        } else {
          console.warn(
            `[TrackingPoller] ✗ Could not mark ${item.order.orderNumber}: ${result.message}`
          );
        }
      } catch (err) {
        console.error(
          `[TrackingPoller] Error marking order ${item.orderId}:`,
          err
        );
      }
    }

    // Brief pause between AfterShip requests to avoid rate-limiting
    await new Promise<void>((resolve) => setTimeout(resolve, 300));
  }

  console.log("[TrackingPoller] Poll cycle complete.");
}

/**
 * Start the tracking polling service.
 * Call this after the Socket.io server is initialized.
 *
 * Does nothing if AFTERSHIP_API_KEY is not configured.
 */
export function startTrackingPoller(): void {
  if (!AFTERSHIP_API_KEY) {
    console.log(
      "[TrackingPoller] AFTERSHIP_API_KEY not set — auto-tracking polling disabled.\n" +
        "                 To enable: add AFTERSHIP_API_KEY to your .env file."
    );
    return;
  }

  const intervalMinutes = Math.round(POLL_INTERVAL_MS / 1000 / 60);
  console.log(
    `[TrackingPoller] Enabled — polling every ${intervalMinutes} minutes.`
  );

  // Run once immediately on start (e.g. to catch deliveries during downtime)
  pollTrackings().catch((err) =>
    console.error("[TrackingPoller] Initial poll error:", err)
  );

  // Then poll at the configured interval
  setInterval(() => {
    pollTrackings().catch((err) =>
      console.error("[TrackingPoller] Poll error:", err)
    );
  }, POLL_INTERVAL_MS);
}

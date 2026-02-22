/**
 * NotificationItem Component
 * Single notification display with click-to-read and navigation
 */

"use client";

import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import type { Notification } from "@/types/notification";
import { NotificationIcon } from "./NotificationIcon";
import { cn } from "@/lib/utils";

interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead?: (id: string) => void;
  onClick?: () => void;
}

export function NotificationItem({
  notification,
  onMarkAsRead,
  onClick,
}: NotificationItemProps) {
  const router = useRouter();

  const handleClick = () => {
    // Mark as read if unread
    if (!notification.isRead && onMarkAsRead) {
      onMarkAsRead(notification.id);
    }

    // Call custom onClick if provided
    if (onClick) {
      onClick();
    }

    // Navigate to link if provided
    if (notification.link) {
      router.push(notification.link);
    }
  };

  return (
    <div
      onClick={handleClick}
      className={cn(
        "flex items-start gap-3 p-4 cursor-pointer transition-colors",
        "hover:bg-gray-50 border-b border-gray-100 last:border-0",
        !notification.isRead && "bg-blue-50/50"
      )}
    >
      {/* Icon */}
      <div className="flex-shrink-0 mt-0.5">
        <NotificationIcon type={notification.type} className="w-5 h-5" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h4
            className={cn(
              "text-sm font-medium text-gray-900 truncate",
              !notification.isRead && "font-semibold"
            )}
          >
            {notification.title}
          </h4>
          {!notification.isRead && (
            <span className="flex-shrink-0 w-2 h-2 bg-blue-600 rounded-full mt-1.5" />
          )}
        </div>

        <p className="text-sm text-gray-600 line-clamp-2 mb-1">
          {notification.message}
        </p>

        <span className="text-xs text-gray-500">
          {formatDistanceToNow(new Date(notification.createdAt), {
            addSuffix: true,
          })}
        </span>
      </div>
    </div>
  );
}

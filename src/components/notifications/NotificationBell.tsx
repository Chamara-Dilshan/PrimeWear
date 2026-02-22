/**
 * NotificationBell Component
 * Bell icon with unread count badge
 */

"use client";

import { Bell } from "lucide-react";
import { useNotificationStore } from "@/stores/notificationStore";
import { cn } from "@/lib/utils";

interface NotificationBellProps {
  onClick?: () => void;
  className?: string;
}

export function NotificationBell({
  onClick,
  className,
}: NotificationBellProps) {
  const unreadCount = useNotificationStore((state) => state.unreadCount);

  return (
    <button
      onClick={onClick}
      className={cn(
        "relative p-2 rounded-lg hover:bg-gray-100 transition-colors",
        className
      )}
      aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ""}`}
    >
      <Bell className="w-5 h-5 text-gray-700" />

      {/* Unread badge */}
      {unreadCount > 0 && (
        <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center bg-red-600 text-white text-xs font-semibold rounded-full px-1 animate-in fade-in zoom-in duration-200">
          {unreadCount > 99 ? "99+" : unreadCount}
        </span>
      )}
    </button>
  );
}

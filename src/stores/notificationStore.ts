/**
 * Notification Store
 * Zustand store for client-side notification management
 * with optimistic updates, Socket.io integration, and toast notifications
 */

import { create } from "zustand";
import { devtools } from "zustand/middleware";
import type { Notification, NotificationCategory } from "@/types/notification";
import {
  subscribeToNotifications,
  markNotificationAsRead as socketMarkAsRead,
  onNewNotification,
  onNotificationUpdated,
  onUnreadCountUpdate,
} from "@/lib/socket";

interface NotificationFilters {
  category?: NotificationCategory;
  isRead?: boolean;
}

interface NotificationState {
  // State
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
  page: number;
  pageSize: number;
  total: number;
  hasMore: boolean;

  // Actions
  fetchNotifications: (filters?: NotificationFilters) => Promise<void>;
  fetchMore: () => Promise<void>;
  addNotification: (notification: Notification) => void;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  setUnreadCount: (count: number) => void;
  reset: () => void;
  initializeSocketListeners: () => () => void;
}

// Initial state
const initialState = {
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  error: null,
  page: 1,
  pageSize: 20,
  total: 0,
  hasMore: false,
};

export const useNotificationStore = create<NotificationState>()(
  devtools(
    (set, get) => ({
      ...initialState,

      /**
       * Fetch notifications from API
       */
      fetchNotifications: async (filters?: NotificationFilters) => {
        set({ isLoading: true, error: null });

        try {
          const params = new URLSearchParams({
            page: "1",
            pageSize: get().pageSize.toString(),
            ...(filters?.category && { category: filters.category }),
            ...(filters?.isRead !== undefined && {
              isRead: filters.isRead.toString(),
            }),
          });

          const response = await fetch(`/api/notifications?${params}`);

          if (!response.ok) {
            throw new Error("Failed to fetch notifications");
          }

          const data = await response.json();

          if (data.success) {
            set({
              notifications: data.data.notifications,
              unreadCount: data.data.unreadCount,
              total: data.data.total,
              page: 1,
              hasMore: data.data.notifications.length < data.data.total,
              isLoading: false,
            });
          } else {
            throw new Error(data.error || "Failed to fetch notifications");
          }
        } catch (error) {
          console.error("Error fetching notifications:", error);
          set({
            error:
              error instanceof Error
                ? error.message
                : "Failed to fetch notifications",
            isLoading: false,
          });
        }
      },

      /**
       * Fetch next page of notifications
       */
      fetchMore: async () => {
        const { page, pageSize, isLoading, hasMore } = get();

        if (isLoading || !hasMore) return;

        set({ isLoading: true });

        try {
          const nextPage = page + 1;
          const params = new URLSearchParams({
            page: nextPage.toString(),
            pageSize: pageSize.toString(),
          });

          const response = await fetch(`/api/notifications?${params}`);

          if (!response.ok) {
            throw new Error("Failed to fetch more notifications");
          }

          const data = await response.json();

          if (data.success) {
            set((state) => ({
              notifications: [
                ...state.notifications,
                ...data.data.notifications,
              ],
              page: nextPage,
              hasMore:
                state.notifications.length + data.data.notifications.length <
                data.data.total,
              isLoading: false,
            }));
          } else {
            throw new Error(data.error || "Failed to fetch more notifications");
          }
        } catch (error) {
          console.error("Error fetching more notifications:", error);
          set({
            error:
              error instanceof Error
                ? error.message
                : "Failed to fetch more notifications",
            isLoading: false,
          });
        }
      },

      /**
       * Add new notification (from Socket.io or manual)
       * Automatically shows toast for HIGH/CRITICAL priority
       */
      addNotification: (notification: Notification) => {
        set((state) => {
          // Check if notification already exists (deduplicate)
          const exists = state.notifications.some(
            (n) => n.id === notification.id
          );

          if (exists) {
            return state;
          }

          return {
            notifications: [notification, ...state.notifications],
            unreadCount: notification.isRead
              ? state.unreadCount
              : state.unreadCount + 1,
            total: state.total + 1,
          };
        });

        // Auto-show toast for HIGH/CRITICAL priority
        if (
          notification.priority === "HIGH" ||
          notification.priority === "CRITICAL"
        ) {
          // Toast will be handled by NotificationToast component via custom event
          window.dispatchEvent(
            new CustomEvent("show-notification-toast", {
              detail: notification,
            })
          );
        }
      },

      /**
       * Mark notification as read (optimistic update)
       */
      markAsRead: async (id: string) => {
        const { notifications, unreadCount } = get();

        // Find the notification
        const notification = notifications.find((n) => n.id === id);
        if (!notification || notification.isRead) return;

        // Optimistic update
        const previousNotifications = [...notifications];
        const previousUnreadCount = unreadCount;

        set((state) => ({
          notifications: state.notifications.map((n) =>
            n.id === id ? { ...n, isRead: true, readAt: new Date() } : n
          ),
          unreadCount: Math.max(0, state.unreadCount - 1),
        }));

        try {
          // Update via API
          const response = await fetch(`/api/notifications/${id}/read`, {
            method: "PATCH",
          });

          if (!response.ok) {
            throw new Error("Failed to mark notification as read");
          }

          const data = await response.json();

          if (!data.success) {
            throw new Error(data.error || "Failed to mark notification as read");
          }

          // Broadcast to other tabs via Socket.io
          socketMarkAsRead(id);
        } catch (error) {
          console.error("Error marking notification as read:", error);

          // Rollback on error
          set({
            notifications: previousNotifications,
            unreadCount: previousUnreadCount,
            error:
              error instanceof Error
                ? error.message
                : "Failed to mark notification as read",
          });
        }
      },

      /**
       * Mark all notifications as read (optimistic update)
       */
      markAllAsRead: async () => {
        const { notifications, unreadCount } = get();

        if (unreadCount === 0) return;

        // Optimistic update
        const previousNotifications = [...notifications];
        const previousUnreadCount = unreadCount;

        set((state) => ({
          notifications: state.notifications.map((n) => ({
            ...n,
            isRead: true,
            readAt: n.readAt || new Date(),
          })),
          unreadCount: 0,
        }));

        try {
          // Update via API
          const response = await fetch("/api/notifications/read-all", {
            method: "PATCH",
          });

          if (!response.ok) {
            throw new Error("Failed to mark all notifications as read");
          }

          const data = await response.json();

          if (!data.success) {
            throw new Error(
              data.error || "Failed to mark all notifications as read"
            );
          }

          // Socket.io broadcast handled by server
        } catch (error) {
          console.error("Error marking all notifications as read:", error);

          // Rollback on error
          set({
            notifications: previousNotifications,
            unreadCount: previousUnreadCount,
            error:
              error instanceof Error
                ? error.message
                : "Failed to mark all notifications as read",
          });
        }
      },

      /**
       * Set unread count (from Socket.io or API)
       */
      setUnreadCount: (count: number) => {
        set({ unreadCount: Math.max(0, count) });
      },

      /**
       * Reset store to initial state
       */
      reset: () => {
        set(initialState);
      },

      /**
       * Initialize Socket.io event listeners
       * Returns cleanup function
       */
      initializeSocketListeners: () => {
        // Subscribe to notifications
        subscribeToNotifications();

        // Listen for new notifications
        const unsubscribeNew = onNewNotification((notification) => {
          get().addNotification(notification);
        });

        // Listen for notification updates (mark as read from other tabs)
        const unsubscribeUpdated = onNotificationUpdated((update) => {
          if (update.isRead) {
            set((state) => ({
              notifications: state.notifications.map((n) =>
                n.id === update.id
                  ? { ...n, isRead: true, readAt: new Date(update.readAt) }
                  : n
              ),
            }));
          }
        });

        // Listen for unread count updates
        const unsubscribeCount = onUnreadCountUpdate((count) => {
          get().setUnreadCount(count);
        });

        // Return cleanup function
        return () => {
          unsubscribeNew();
          unsubscribeUpdated();
          unsubscribeCount();
        };
      },
    }),
    { name: "NotificationStore" }
  )
);

/**
 * Hook to initialize Socket.io listeners on mount
 * Usage: useNotificationSocketListeners() in a component
 */
export function useNotificationSocketListeners() {
  const initializeSocketListeners = useNotificationStore(
    (state) => state.initializeSocketListeners
  );

  // Initialize on mount, cleanup on unmount
  if (typeof window !== "undefined") {
    return initializeSocketListeners;
  }

  return () => () => {};
}

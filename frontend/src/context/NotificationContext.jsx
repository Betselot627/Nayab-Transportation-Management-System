import { createContext, useContext, useState, useEffect, useRef, useCallback } from "react";
import { notificationService } from "../services/notificationService";
import { useAuth } from "../hooks/useAuth";

const NotificationContext = createContext();

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotifications must be used within a NotificationProvider");
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const lastFetchTimeRef = useRef(0);
  const isFetchingRef = useRef(false);

  const formatTime = (dateStr) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);

    if (isNaN(date.getTime())) return dateStr || "Recent";
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString();
  };

  const fetchNotifications = useCallback(async (force = false) => {
    const token = localStorage.getItem("token");
    if (!token || !user) return;

    // Rate-limit consecutive fetches unless forced
    const now = Date.now();
    if (!force && isFetchingRef.current) return;
    if (!force && now - lastFetchTimeRef.current < 10000) return;

    try {
      isFetchingRef.current = true;
      const response = await notificationService.getMyNotifications({}, { force });
      if (response && response.data) {
        const mapped = response.data.map((n) => ({
          id: n._id,
          title: n.title,
          message: n.message,
          type: n.type,
          priority: n.priority,
          time: formatTime(n.createdAt),
          read: n.read,
          actionUrl: n.actionUrl,
          relatedEntity: n.relatedEntity,
        }));
        setNotifications(mapped);
        lastFetchTimeRef.current = Date.now();
      }
    } catch (err) {
      console.warn("Notification sync failed:", err.message);
    } finally {
      isFetchingRef.current = false;
      setLoading(false);
    }
  }, [user]);

  // Single centralized timer and visibility-aware polling
  useEffect(() => {
    if (!user) {
      setNotifications([]);
      return;
    }

    fetchNotifications(true);

    const interval = setInterval(() => {
      if (!document.hidden) {
        fetchNotifications(false);
      }
    }, 25000); // 25s polling interval when tab is active

    const handleVisibilityChange = () => {
      if (!document.hidden && Date.now() - lastFetchTimeRef.current >= 20000) {
        fetchNotifications(true);
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [user, fetchNotifications]);

  // Optimistic Mark as Read
  const markAsRead = async (id) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
    try {
      await notificationService.markAsRead(id);
    } catch (err) {
      console.warn("Failed to mark notification read:", err);
    }
  };

  // Optimistic Mark All as Read
  const markAllAsRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    try {
      await notificationService.markAllAsRead();
    } catch (err) {
      console.warn("Failed to mark all read:", err);
    }
  };

  // Optimistic Delete
  const deleteNotification = async (id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    try {
      await notificationService.deleteNotification(id);
    } catch (err) {
      console.warn("Failed to delete notification:", err);
    }
  };

  // Clear All Read
  const clearAllRead = async () => {
    setNotifications((prev) => prev.filter((n) => !n.read));
    try {
      await notificationService.clearAllRead();
    } catch (err) {
      console.warn("Failed to clear read notifications:", err);
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        loading,
        fetchNotifications,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        clearAllRead,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

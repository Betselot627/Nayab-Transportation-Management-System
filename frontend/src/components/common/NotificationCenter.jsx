import React, { useState, useEffect, useRef } from "react";
import {
  Bell,
  Check,
  X,
  ShieldAlert,
  Wrench,
  CalendarPlus,
  Trash2,
  RotateCcw,
  Package,
  CreditCard,
  Truck,
  User,
  ArrowRight,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { notificationService } from "../../services/notificationService";
import { useAuth } from "../../hooks/useAuth";

const NotificationCenter = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);

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

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const response = await notificationService.getMyNotifications();
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
      }
    } catch (err) {
      console.warn("Failed to fetch notifications:", err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(() => {
      fetchNotifications();
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
    } catch (err) {
      console.error(err);
    }
    setNotifications(notifications.map((n) => ({ ...n, read: true })));
  };

  const markAsRead = async (id) => {
    try {
      await notificationService.markAsRead(id);
    } catch (err) {
      console.error(err);
    }
    setNotifications(
      notifications.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const handleNotificationClick = async (n) => {
    try {
      await markAsRead(n.id);
    } catch (e) {}

    setIsOpen(false);

    // If explicit actionUrl is attached, navigate directly
    if (n.actionUrl) {
      navigate(n.actionUrl);
      return;
    }

    const userRole = user?.role || "customer";
    const type = (n.type || "").toLowerCase();
    const title = (n.title || "").toLowerCase();
    const message = (n.message || "").toLowerCase();
    const entityType = (n.relatedEntity?.entityType || "").toLowerCase();
    const entityId = n.relatedEntity?.entityId || "";

    // 1. Shipment / Booking Notifications
    if (
      entityType === "shipment" ||
      type === "shipment" ||
      title.includes("shipment") ||
      title.includes("booking") ||
      message.includes("shipment") ||
      message.includes("booking")
    ) {
      if (userRole === "admin") {
        navigate("/admin/shipments");
      } else if (userRole === "driver") {
        if (entityId) {
          navigate(`/driver/trip-details/${entityId}`);
        } else {
          navigate("/driver/my-trips");
        }
      } else if (userRole === "dispatcher") {
        navigate("/dispatcher/bookings");
      } else {
        // Customer
        if (entityId) {
          navigate(`/customer/shipment-details/${entityId}`);
        } else {
          navigate("/customer/my-bookings");
        }
      }
      return;
    }

    // 2. Trip Notifications
    if (
      entityType === "trip" ||
      type === "trip" ||
      title.includes("trip") ||
      message.includes("trip")
    ) {
      if (userRole === "driver") {
        if (entityId) {
          navigate(`/driver/trip-details/${entityId}`);
        } else {
          navigate("/driver/my-trips");
        }
      } else if (userRole === "admin") {
        navigate("/admin/shipments");
      } else if (userRole === "dispatcher") {
        navigate("/dispatcher/track-trips");
      } else {
        navigate("/customer/my-bookings");
      }
      return;
    }

    // 3. Payment Notifications
    if (
      entityType === "payment" ||
      type === "payment" ||
      title.includes("payment") ||
      title.includes("paid") ||
      title.includes("receipt") ||
      message.includes("payment") ||
      message.includes("receipt")
    ) {
      if (userRole === "customer") {
        if (entityId) {
          navigate(`/customer/shipment-details/${entityId}`);
        } else {
          navigate("/customer/payments");
        }
      } else if (userRole === "admin") {
        navigate("/admin/payments");
      } else if (userRole === "driver") {
        navigate("/driver/dashboard");
      }
      return;
    }

    // 4. Vehicle / Maintenance Notifications
    if (
      entityType === "vehicle" ||
      type === "vehicle" ||
      type === "vehicle_registration" ||
      type === "maintenance_due" ||
      title.includes("vehicle") ||
      title.includes("maintenance") ||
      message.includes("vehicle")
    ) {
      if (userRole === "admin") {
        navigate("/admin/vehicles");
      } else if (userRole === "driver") {
        navigate("/driver/my-vehicles");
      } else if (userRole === "dispatcher") {
        navigate("/dispatcher/assign-vehicle");
      }
      return;
    }

    // 5. Driver or Customer Profiles
    if (title.includes("customer") || message.includes("customer")) {
      if (userRole === "admin") navigate("/admin/customers");
      return;
    }

    if (
      title.includes("driver") ||
      title.includes("license") ||
      message.includes("driver") ||
      type === "driver_expiry"
    ) {
      if (userRole === "admin") navigate("/admin/drivers");
      else if (userRole === "driver") navigate("/driver/profile");
      return;
    }

    // Default Fallback based on Role
    if (userRole === "admin") navigate("/admin/dashboard");
    else if (userRole === "driver") navigate("/driver/dashboard");
    else if (userRole === "dispatcher") navigate("/dispatcher/dashboard");
    else navigate("/customer/dashboard");
  };

  const deleteNotification = async (id, e) => {
    e.stopPropagation();
    try {
      await notificationService.deleteNotification(id);
    } catch (err) {
      console.error(err);
    }
    setNotifications(notifications.filter((n) => n.id !== id));
  };

  const getIcon = (type, title = "") => {
    const t = (type || "").toLowerCase();
    const head = (title || "").toLowerCase();

    if (t === "payment" || head.includes("payment") || head.includes("paid")) {
      return <CreditCard className="w-4 h-4 text-emerald-500 shrink-0" />;
    }
    if (t === "shipment" || head.includes("shipment") || head.includes("booking")) {
      return <Package className="w-4 h-4 text-purple-500 shrink-0" />;
    }
    if (t === "trip" || head.includes("trip")) {
      return <Truck className="w-4 h-4 text-sky-500 shrink-0" />;
    }
    if (t === "maintenance_due" || head.includes("maintenance")) {
      return <Wrench className="w-4 h-4 text-amber-500 shrink-0" />;
    }
    if (t === "driver_expiry" || head.includes("license") || head.includes("driver")) {
      return <ShieldAlert className="w-4 h-4 text-rose-500 shrink-0" />;
    }
    return <Bell className="w-4 h-4 text-blue-500 shrink-0" />;
  };

  return (
    <div ref={dropdownRef} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full focus:outline-none transition-colors duration-200 cursor-pointer"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 bg-red-500 text-white text-[10px] font-extrabold h-4 w-4 rounded-full flex items-center justify-center shadow-md animate-pulse">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-3 w-84 sm:w-96 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-150">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Notifications
              </h3>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-400 text-[10px] font-bold rounded-full">
                  {unreadCount} new
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-[11px] text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 font-bold flex items-center gap-1 cursor-pointer transition"
              >
                <Check className="w-3.5 h-3.5" />
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-84 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
            {notifications.length > 0 ? (
              notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => handleNotificationClick(n)}
                  className={`flex items-start gap-3 p-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer transition-colors duration-150 relative group ${
                    !n.read ? "bg-purple-50/40 dark:bg-purple-950/20" : ""
                  }`}
                >
                  <div className="mt-1 p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 shrink-0">
                    {getIcon(n.type, n.title)}
                  </div>
                  <div className="flex-1 min-w-0 pr-5">
                    <div className="flex items-center justify-between gap-1">
                      <p
                        className={`text-xs text-slate-900 dark:text-white truncate ${
                          !n.read ? "font-extrabold" : "font-semibold"
                        }`}
                      >
                        {n.title}
                      </p>
                      {!n.read && (
                        <span className="w-1.5 h-1.5 rounded-full bg-purple-600 shrink-0" />
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2 leading-relaxed">
                      {n.message}
                    </p>
                    <div className="flex items-center justify-between mt-1.5">
                      <span className="text-[10px] text-slate-400 font-mono">
                        {n.time}
                      </span>
                      <span className="text-[10px] text-purple-600 dark:text-purple-400 font-bold flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        View <ArrowRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={(e) => deleteNotification(n.id, e)}
                    className="absolute right-3 top-3 p-1 text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                    title="Dismiss notification"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            ) : (
              <div className="p-8 text-center space-y-2">
                <Bell className="w-8 h-8 text-slate-300 dark:text-slate-700 mx-auto" />
                <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
                  No notifications
                </p>
                <p className="text-[11px] text-slate-400">
                  You're all caught up with your transportation alerts!
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationCenter;
export { NotificationCenter };

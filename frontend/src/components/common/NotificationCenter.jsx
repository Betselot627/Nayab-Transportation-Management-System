import React, { useState, useEffect, useRef } from "react";
import { Bell, Check, X, ShieldAlert, Wrench, CalendarPlus, Trash2, RotateCcw } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { notificationService } from "../../services/notificationService";

const NotificationCenter = () => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const [notifications, setNotifications] = useState([]);

  const getMockFallbackNotifications = () => [
    {
      id: "n1",
      title: "Driver License Expiry",
      message: "Driver Abebe Kebede's license DL-908123 expires in 5 days.",
      type: "driver_expiry",
      time: "2 hours ago",
      read: false,
    },
    {
      id: "n2",
      title: "Vehicle Maintenance Due",
      message: "Toyota Hiace (AA-12345-ET) is due for service this week.",
      type: "maintenance_due",
      time: "5 hours ago",
      read: false,
    },
    {
      id: "n3",
      title: "Booking Created",
      message: "Trip B001 (Addis Ababa → Adama) booked successfully.",
      type: "booking_created",
      time: "1 day ago",
      read: true,
    },
    {
      id: "n4",
      title: "Booking Cancelled",
      message: "Trip B004 (Mekelle → Addis Ababa) has been cancelled.",
      type: "booking_cancelled",
      time: "2 days ago",
      read: false,
    },
    {
      id: "n5",
      title: "Vehicle Returned",
      message: "Isuzu Truck (AA-67890-ET) returned to Adama Hub.",
      type: "vehicle_returned",
      time: "3 days ago",
      read: true,
    },
  ];

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
      if (!token || token.startsWith("mock-")) {
        const saved = localStorage.getItem("ntms_notifications");
        if (saved) {
          setNotifications(JSON.parse(saved));
        } else {
          setNotifications(getMockFallbackNotifications());
        }
        return;
      }
      const response = await notificationService.getMyNotifications();
      if (response && response.data) {
        const mapped = response.data.map((n) => ({
          id: n._id,
          title: n.title,
          message: n.message,
          type: n.type,
          time: formatTime(n.createdAt),
          read: n.read,
        }));
        setNotifications(mapped);
      }
    } catch (err) {
      console.warn("Notification API failed, using fallback:", err);
      const saved = localStorage.getItem("ntms_notifications");
      if (saved) setNotifications(JSON.parse(saved));
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token || token.startsWith("mock-")) {
      localStorage.setItem("ntms_notifications", JSON.stringify(notifications));
    }
  }, [notifications]);

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
      const token = localStorage.getItem("token");
      if (token && !token.startsWith("mock-")) {
        await notificationService.markAllAsRead();
      }
    } catch (err) {
      console.error(err);
    }
    setNotifications(notifications.map((n) => ({ ...n, read: true })));
  };

  const markAsRead = async (id) => {
    try {
      const token = localStorage.getItem("token");
      if (token && !token.startsWith("mock-")) {
        await notificationService.markAsRead(id);
      }
    } catch (err) {
      console.error(err);
    }
    setNotifications(
      notifications.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const handleNotificationClick = async (n) => {
    await markAsRead(n.id);
    setIsOpen(false);
    
    const type = n.type?.toLowerCase();
    const title = n.title?.toLowerCase();
    
    if (type === "vehicle_registration") {
      navigate("/admin/vehicles");
    } else if (type === "shipment") {
      navigate("/admin/shipments");
    } else {
      if (title.includes("customer")) {
        navigate("/admin/customers");
      } else if (title.includes("driver")) {
        navigate("/admin/drivers");
      }
    }
  };

  const deleteNotification = async (id, e) => {
    e.stopPropagation();
    try {
      const token = localStorage.getItem("token");
      if (token && !token.startsWith("mock-")) {
        await notificationService.deleteNotification(id);
      }
    } catch (err) {
      console.error(err);
    }
    setNotifications(notifications.filter((n) => n.id !== id));
  };

  const getIcon = (type) => {
    switch (type) {
      case "driver_expiry":
        return <ShieldAlert className="w-5 h-5 text-red-500" />;
      case "maintenance_due":
        return <Wrench className="w-5 h-5 text-amber-500" />;
      case "booking_created":
        return <CalendarPlus className="w-5 h-5 text-green-500" />;
      case "booking_cancelled":
        return <Trash2 className="w-5 h-5 text-red-400" />;
      default:
        return <RotateCcw className="w-5 h-5 text-blue-500" />;
    }
  };

  return (
    <div ref={dropdownRef} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full focus:outline-none transition-colors duration-200"
      >
        <Bell className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 bg-red-500 text-white text-[10px] font-bold h-4 w-4 rounded-full flex items-center justify-center animate-bounce shadow-md">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-3 w-80 bg-white dark:bg-gray-950 border border-gray-150 dark:border-gray-800 rounded-xl shadow-2xl overflow-hidden z-50 animate-slide-down">
          <div className="flex items-center justify-between px-4 py-3 bg-gray-55 dark:bg-gray-900 border-b border-gray-150 dark:border-gray-800">
            <h3 className="text-sm font-semibold text-gray-800 dark:text-white">
              Notifications
            </h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium flex items-center gap-1"
              >
                <Check className="w-3.5 h-3.5" />
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-850">
            {notifications.length > 0 ? (
              notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => handleNotificationClick(n)}
                  className={`flex gap-3 p-4 hover:bg-gray-50 dark:hover:bg-gray-900 cursor-pointer transition-colors duration-150 relative group ${
                    !n.read ? "bg-blue-50/20 dark:bg-blue-950/5" : ""
                  }`}
                >
                  <div className="mt-0.5">{getIcon(n.type)}</div>
                  <div className="flex-1 min-w-0 pr-4">
                    <p className={`text-xs font-semibold text-gray-900 dark:text-white ${!n.read ? "font-bold" : ""}`}>
                      {n.title}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                      {n.message}
                    </p>
                    <span className="text-[10px] text-gray-400 mt-1.5 block">
                      {n.time}
                    </span>
                  </div>
                  <button
                    onClick={(e) => deleteNotification(n.id, e)}
                    className="absolute right-3 top-4 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity duration-150"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            ) : (
              <div className="p-6 text-center text-sm text-gray-400">
                All caught up! No notifications.
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

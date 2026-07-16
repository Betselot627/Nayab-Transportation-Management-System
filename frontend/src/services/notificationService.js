import api from "./api";

export const notificationService = {
  // Get user's notifications
  getMyNotifications: async (params = {}) => {
    const response = await api.get("/notifications", { params });
    return response.data;
  },

  // Get unread count
  getUnreadCount: async () => {
    const response = await api.get("/notifications/unread-count");
    return response.data;
  },

  // Mark as read
  markAsRead: async (id) => {
    const response = await api.put(`/notifications/${id}/read`);
    return response.data;
  },

  // Mark all as read
  markAllAsRead: async () => {
    const response = await api.put("/notifications/mark-all-read");
    return response.data;
  },

  // Delete notification
  deleteNotification: async (id) => {
    const response = await api.delete(`/notifications/${id}`);
    return response.data;
  },

  // Clear all read notifications
  clearAllRead: async () => {
    const response = await api.delete("/notifications/clear-all");
    return response.data;
  },
};

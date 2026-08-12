import api from "./api";

export const notificationService = {
  // Get user's notifications
  getMyNotifications: async (params = {}, options = {}) => {
    const { force = false, ttl = 20000 } = options;
    const response = await api.cachedGet("/notifications", { params, force, ttl });
    return response.data;
  },

  // Get unread count
  getUnreadCount: async (options = {}) => {
    const { force = false, ttl = 20000 } = options;
    const response = await api.cachedGet("/notifications/unread-count", { force, ttl });
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

import api from "./api";

export const reportService = {
  // Get dashboard statistics with caching
  getDashboardStats: async (options = {}) => {
    const { force = false, ttl = 60000 } = options;
    const response = await api.cachedGet("/reports/dashboard", { force, ttl });
    return response.data;
  },

  // Get financial report
  getFinancialReport: async (params = {}, options = {}) => {
    const { force = false, ttl = 60000 } = options;
    const response = await api.cachedGet("/reports/financial", { params, force, ttl });
    return response.data;
  },

  // Get driver performance
  getDriverPerformance: async (options = {}) => {
    const { force = false, ttl = 60000 } = options;
    const response = await api.cachedGet("/reports/driver-performance", { force, ttl });
    return response.data;
  },

  // Get vehicle utilization
  getVehicleUtilization: async (options = {}) => {
    const { force = false, ttl = 60000 } = options;
    const response = await api.cachedGet("/reports/vehicle-utilization", { force, ttl });
    return response.data;
  },

  // Get monthly report
  getMonthlyReport: async (year, month, options = {}) => {
    const { force = false, ttl = 60000 } = options;
    const response = await api.cachedGet("/reports/monthly", {
      params: { year, month },
      force,
      ttl,
    });
    return response.data;
  },
};

import api from "./api";

export const reportService = {
  // Get dashboard statistics
  getDashboardStats: async () => {
    const response = await api.get("/reports/dashboard");
    return response.data;
  },

  // Get financial report
  getFinancialReport: async (params = {}) => {
    const response = await api.get("/reports/financial", { params });
    return response.data;
  },

  // Get driver performance
  getDriverPerformance: async () => {
    const response = await api.get("/reports/driver-performance");
    return response.data;
  },

  // Get vehicle utilization
  getVehicleUtilization: async () => {
    const response = await api.get("/reports/vehicle-utilization");
    return response.data;
  },

  // Get monthly report
  getMonthlyReport: async (year, month) => {
    const response = await api.get("/reports/monthly", {
      params: { year, month },
    });
    return response.data;
  },
};

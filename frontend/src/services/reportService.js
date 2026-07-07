import api from "./api";

export const reportService = {
  getShipmentReports: async (filters) => {
    const response = await api.get("/reports/shipments", { params: filters });
    return response.data;
  },

  getVehicleReports: async (filters) => {
    const response = await api.get("/reports/vehicles", { params: filters });
    return response.data;
  },

  getDriverReports: async (filters) => {
    const response = await api.get("/reports/drivers", { params: filters });
    return response.data;
  },

  getFinancialReports: async (filters) => {
    const response = await api.get("/reports/financial", { params: filters });
    return response.data;
  },
};

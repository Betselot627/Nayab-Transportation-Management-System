import api from "./api";

export const driverService = {
  // Get all drivers
  getAllDrivers: async (params = {}) => {
    const response = await api.get("/drivers", { params });
    return response.data;
  },

  // Get available drivers
  getAvailableDrivers: async () => {
    const response = await api.get("/drivers/available");
    return response.data;
  },

  // Get single driver
  getDriverById: async (id) => {
    const response = await api.get(`/drivers/${id}`);
    return response.data;
  },

  // Create driver
  createDriver: async (driverData) => {
    const response = await api.post("/drivers", driverData);
    return response.data;
  },

  // Update driver
  updateDriver: async (id, driverData) => {
    const response = await api.put(`/drivers/${id}`, driverData);
    return response.data;
  },

  // Delete driver
  deleteDriver: async (id) => {
    const response = await api.delete(`/drivers/${id}`);
    return response.data;
  },

  // Update driver status
  updateDriverStatus: async (id, status) => {
    const response = await api.put(`/drivers/${id}/status`, { status });
    return response.data;
  },
};

import api from "./api";

export const driverService = {
  // Get all drivers
  getAllDrivers: async (params = {}, options = {}) => {
    const { force = false, ttl = 35000 } = options;
    const response = await api.cachedGet("/drivers", { params, force, ttl });
    return response.data;
  },

  // Get available drivers
  getAvailableDrivers: async (options = {}) => {
    const { force = false, ttl = 20000 } = options;
    const response = await api.cachedGet("/drivers/available", { force, ttl });
    return response.data;
  },

  // Get single driver
  getDriverById: async (id, options = {}) => {
    const { force = false, ttl = 30000 } = options;
    const response = await api.cachedGet(`/drivers/${id}`, { force, ttl });
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

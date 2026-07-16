import api from "./api";

export const vehicleService = {
  // Get all vehicles
  getAllVehicles: async (params = {}) => {
    const response = await api.get("/vehicles", { params });
    return response.data;
  },

  // Get single vehicle
  getVehicleById: async (id) => {
    const response = await api.get(`/vehicles/${id}`);
    return response.data;
  },

  // Create vehicle (Admin)
  createVehicle: async (vehicleData) => {
    const response = await api.post("/vehicles", vehicleData);
    return response.data;
  },

  // Update vehicle
  updateVehicle: async (id, vehicleData) => {
    const response = await api.put(`/vehicles/${id}`, vehicleData);
    return response.data;
  },

  // Delete vehicle
  deleteVehicle: async (id) => {
    const response = await api.delete(`/vehicles/${id}`);
    return response.data;
  },

  // Update vehicle status
  updateVehicleStatus: async (id, status) => {
    const response = await api.put(`/vehicles/${id}/status`, { status });
    return response.data;
  },

  // Get vehicle statistics
  getVehicleStats: async () => {
    const response = await api.get("/vehicles/stats");
    return response.data;
  },
};

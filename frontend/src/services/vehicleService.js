import api from "./api";

export const vehicleService = {
  // Get all vehicles (role-based)
  getAllVehicles: async (params = {}) => {
    const response = await api.get("/vehicles", { params });
    return response.data;
  },

  // Get single vehicle
  getVehicleById: async (id) => {
    const response = await api.get(`/vehicles/${id}`);
    return response.data;
  },

  // Register vehicle (Driver)
  registerVehicle: async (vehicleData) => {
    const response = await api.post("/vehicles", vehicleData);
    return response.data;
  },

  // Get pending vehicles (Admin)
  getPendingVehicles: async () => {
    const response = await api.get("/vehicles/pending");
    return response.data;
  },

  // Approve vehicle (Admin)
  approveVehicle: async (id) => {
    const response = await api.put(`/vehicles/${id}/approve`);
    return response.data;
  },

  // Reject vehicle (Admin)
  rejectVehicle: async (id, reason) => {
    const response = await api.put(`/vehicles/${id}/reject`, { reason });
    return response.data;
  },

  // Assign vehicle to customer (Admin)
  assignVehicleToCustomer: async (id, assignmentData) => {
    const response = await api.put(
      `/vehicles/${id}/assign-customer`,
      assignmentData,
    );
    return response.data;
  },

  // Unassign vehicle (Admin)
  unassignVehicle: async (id) => {
    const response = await api.put(`/vehicles/${id}/unassign`);
    return response.data;
  },

  // Get vehicle recommendations (Admin)
  getVehicleRecommendations: async (itemType, weight, weightUnit) => {
    const response = await api.get("/vehicles/recommendations", {
      params: { itemType, weight, weightUnit },
    });
    return response.data;
  },

  // Update vehicle (Admin)
  updateVehicle: async (id, vehicleData) => {
    const response = await api.put(`/vehicles/${id}`, vehicleData);
    return response.data;
  },

  // Update vehicle status (Admin)
  updateVehicleStatus: async (id, status) => {
    const response = await api.put(`/vehicles/${id}/status`, { status });
    return response.data;
  },

  // Delete vehicle (Admin)
  deleteVehicle: async (id) => {
    const response = await api.delete(`/vehicles/${id}`);
    return response.data;
  },

  // Get vehicle stats (Admin)
  getVehicleStats: async () => {
    const response = await api.get("/vehicles/stats");
    return response.data;
  },
};

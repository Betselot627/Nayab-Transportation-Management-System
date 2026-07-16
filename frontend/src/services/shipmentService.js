import api from "./api";

export const shipmentService = {
  // Get all shipments
  getAllShipments: async (params = {}) => {
    const response = await api.get("/shipments", { params });
    return response.data;
  },

  // Get single shipment
  getShipmentById: async (id) => {
    const response = await api.get(`/shipments/${id}`);
    return response.data;
  },

  // Create shipment (Customer)
  createShipment: async (shipmentData) => {
    const response = await api.post("/shipments", shipmentData);
    return response.data;
  },

  // Assign driver and vehicle (Dispatcher/Admin)
  assignShipment: async (id, assignmentData) => {
    const response = await api.put(`/shipments/${id}/assign`, assignmentData);
    return response.data;
  },

  // Update shipment status
  updateShipmentStatus: async (id, statusData) => {
    const response = await api.patch(`/shipments/${id}/status`, statusData);
    return response.data;
  },

  // Cancel shipment
  cancelShipment: async (id) => {
    const response = await api.delete(`/shipments/${id}`);
    return response.data;
  },

  // Get shipment statistics
  getShipmentStats: async () => {
    const response = await api.get("/shipments/stats");
    return response.data;
  },
};

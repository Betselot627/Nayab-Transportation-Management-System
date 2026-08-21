import api from "./api";

export const shipmentService = {
  // Get all shipments with caching & pagination
  getAllShipments: async (params = {}, options = {}) => {
    const { force = false, ttl = 30000 } = options;
    const response = await api.cachedGet("/shipments", {
      params,
      force,
      ttl,
    });
    return response.data;
  },

  // Get single shipment
  getShipmentById: async (id, options = {}) => {
    const { force = false, ttl = 20000 } = options;
    const response = await api.cachedGet(`/shipments/${id}`, {
      force,
      ttl,
    });
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
  getShipmentStats: async (options = {}) => {
    const { force = false, ttl = 60000 } = options;
    const response = await api.cachedGet("/shipments/stats", {
      force,
      ttl,
    });
    return response.data;
  },

  // Approve shipment (Admin auto-assign)
  approveShipment: async (id) => {
    const response = await api.put(`/shipments/${id}/approve`);
    return response.data;
  },

  // Get live price quote from server (cargo weight + distance based)
  getQuote: async ({ pickupCity, deliveryCity, weight, unit }) => {
    const response = await api.post("/shipments/quote", {
      pickupCity,
      deliveryCity,
      weight,
      unit,
    });
    return response.data;
  },

  // Ranked driver + vehicle suggestions for a shipment (with driver payment)
  getSuggestions: async (id, options = {}) => {
    const { force = false, ttl = 15000 } = options;
    const response = await api.cachedGet(`/shipments/${id}/suggestions`, {
      force,
      ttl,
    });
    return response.data;
  },
};

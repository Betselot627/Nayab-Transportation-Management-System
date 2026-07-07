import api from "./api";

export const shipmentService = {
  getAll: async () => {
    const response = await api.get("/shipments");
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/shipments/${id}`);
    return response.data;
  },

  create: async (shipmentData) => {
    const response = await api.post("/shipments", shipmentData);
    return response.data;
  },

  update: async (id, shipmentData) => {
    const response = await api.put(`/shipments/${id}`, shipmentData);
    return response.data;
  },

  trackShipment: async (id) => {
    const response = await api.get(`/shipments/${id}/track`);
    return response.data;
  },
};

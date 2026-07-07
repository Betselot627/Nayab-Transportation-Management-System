import api from "./api";

export const vehicleService = {
  getAll: async () => {
    const response = await api.get("/vehicles");
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/vehicles/${id}`);
    return response.data;
  },

  create: async (data) => {
    const response = await api.post("/vehicles", data);
    return response.data;
  },

  update: async (id, data) => {
    const response = await api.put(`/vehicles/${id}`, data);
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/vehicles/${id}`);
    return response.data;
  },
};

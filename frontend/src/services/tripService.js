import api from "./api";

export const tripService = {
  // Get all trips
  getAllTrips: async (params = {}) => {
    const response = await api.get("/trips", { params });
    return response.data;
  },

  // Get driver's trips
  getMyTrips: async () => {
    const response = await api.get("/trips/my-trips");
    return response.data;
  },

  // Get single trip
  getTripById: async (id) => {
    const response = await api.get(`/trips/${id}`);
    return response.data;
  },

  // Update trip status
  updateTripStatus: async (id, statusData) => {
    const response = await api.patch(`/trips/${id}/status`, statusData);
    return response.data;
  },

  // Update location
  updateLocation: async (id, locationData) => {
    const response = await api.patch(`/trips/${id}/location`, locationData);
    return response.data;
  },

  // Add checkpoint
  addCheckpoint: async (id, checkpointData) => {
    const response = await api.post(`/trips/${id}/checkpoint`, checkpointData);
    return response.data;
  },

  // Report incident
  reportIncident: async (id, incidentData) => {
    const response = await api.post(`/trips/${id}/incident`, incidentData);
    return response.data;
  },

  // Update expenses
  updateExpenses: async (id, expensesData) => {
    const response = await api.put(`/trips/${id}/expenses`, expensesData);
    return response.data;
  },
};

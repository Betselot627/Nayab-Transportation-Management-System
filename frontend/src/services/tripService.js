import api from "./api";

export const tripService = {
  // Get all trips (Dispatcher/Admin)
  getAllTrips: async (params = {}, options = {}) => {
    const { force = false, ttl = 30000 } = options;
    const response = await api.cachedGet("/trips", { params, force, ttl });
    return response.data;
  },

  // Get driver's trips
  getMyTrips: async (options = {}) => {
    const { force = false, ttl = 20000 } = options;
    const response = await api.cachedGet("/trips/my-trips", { force, ttl });
    return response.data;
  },

  // Get single trip
  getTripById: async (id, options = {}) => {
    const { force = false, ttl = 15000 } = options;
    const response = await api.cachedGet(`/trips/${id}`, { force, ttl });
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

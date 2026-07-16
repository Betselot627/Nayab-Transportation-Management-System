import api from "./api";

export const paymentService = {
  // Get all payments
  getAllPayments: async (params = {}) => {
    const response = await api.get("/payments", { params });
    return response.data;
  },

  // Get single payment
  getPaymentById: async (id) => {
    const response = await api.get(`/payments/${id}`);
    return response.data;
  },

  // Create payment
  createPayment: async (paymentData) => {
    const response = await api.post("/payments", paymentData);
    return response.data;
  },

  // Update payment status
  updatePaymentStatus: async (id, status) => {
    const response = await api.put(`/payments/${id}/status`, { status });
    return response.data;
  },

  // Get shipment payments
  getShipmentPayments: async (shipmentId) => {
    const response = await api.get(`/payments/shipment/${shipmentId}`);
    return response.data;
  },

  // Get payment statistics
  getPaymentStats: async () => {
    const response = await api.get("/payments/stats");
    return response.data;
  },
};

import api from "./api";

/**
 * Payment Service - NTMS Frontend Client
 * Handles Chapa checkout initialization, backend verification, receipts, and admin financial reports.
 */
export const paymentService = {
  // Initialize Chapa payment
  initializePayment: async (shipmentId) => {
    const response = await api.post("/payments/initialize", { shipmentId });
    return response.data;
  },

  // Verify payment transaction with backend & Chapa
  verifyPayment: async (txRef) => {
    const response = await api.get(`/payments/verify/${encodeURIComponent(txRef)}`);
    return response.data;
  },

  // Get authenticated customer's payment history with caching
  getMyPayments: async (options = {}) => {
    const { force = false, ttl = 30000 } = options;
    const response = await api.cachedGet("/payments/my-payments", { force, ttl });
    return response.data;
  },

  // Get single printable receipt
  getReceipt: async (txRef, options = {}) => {
    const { force = false, ttl = 60000 } = options;
    const response = await api.cachedGet(`/payments/receipt/${encodeURIComponent(txRef)}`, { force, ttl });
    return response.data;
  },

  // Get all payments (Admin with search/filters)
  getAllPayments: async (params = {}, options = {}) => {
    const { force = false, ttl = 30000 } = options;
    const response = await api.cachedGet("/payments", { params, force, ttl });
    return response.data;
  },

  // Get single payment details
  getPaymentById: async (id, options = {}) => {
    const { force = false, ttl = 30000 } = options;
    const response = await api.cachedGet(`/payments/${id}`, { force, ttl });
    return response.data;
  },

  // Get payment statistics (Admin financial summary)
  getPaymentStats: async (options = {}) => {
    const { force = false, ttl = 60000 } = options;
    const response = await api.cachedGet("/payments/stats", { force, ttl });
    return response.data;
  },

  // Admin / Dispatcher confirms final transportation price in ETB
  confirmFinalPrice: async (shipmentId, finalPrice) => {
    const response = await api.put(`/shipments/${shipmentId}/confirm-price`, { finalPrice });
    return response.data;
  },
};

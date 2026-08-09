import api from "./api";

/**
 * Payment Service - NTMS Frontend Client
 * Handles Chapa checkout initialization, backend verification, receipts, and admin financial reports.
 */
export const paymentService = {
  // Initialize Chapa payment (Security: backend retrieves final price from DB)
  initializePayment: async (shipmentId) => {
    const response = await api.post("/payments/initialize", { shipmentId });
    return response.data;
  },

  // Verify payment transaction with backend & Chapa
  verifyPayment: async (txRef) => {
    const response = await api.get(`/payments/verify/${encodeURIComponent(txRef)}`);
    return response.data;
  },

  // Get authenticated customer's payment history
  getMyPayments: async () => {
    const response = await api.get("/payments/my-payments");
    return response.data;
  },

  // Get single printable receipt
  getReceipt: async (txRef) => {
    const response = await api.get(`/payments/receipt/${encodeURIComponent(txRef)}`);
    return response.data;
  },

  // Get all payments (Admin with search/filters)
  getAllPayments: async (params = {}) => {
    const response = await api.get("/payments", { params });
    return response.data;
  },

  // Get single payment details
  getPaymentById: async (id) => {
    const response = await api.get(`/payments/${id}`);
    return response.data;
  },

  // Get payment statistics (Admin financial summary)
  getPaymentStats: async () => {
    const response = await api.get("/payments/stats");
    return response.data;
  },

  // Admin / Dispatcher confirms final transportation price in ETB
  confirmFinalPrice: async (shipmentId, finalPrice) => {
    const response = await api.put(`/shipments/${shipmentId}/confirm-price`, { finalPrice });
    return response.data;
  },
};

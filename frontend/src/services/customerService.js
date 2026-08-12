import api from "./api";

export const customerService = {
  // Get all customers with caching
  getAllCustomers: async (params = {}, options = {}) => {
    const { force = false, ttl = 45000 } = options;
    const response = await api.cachedGet("/customers", { params, force, ttl });
    return response.data;
  },

  // Get single customer details
  getCustomerById: async (id, options = {}) => {
    const { force = false, ttl = 30000 } = options;
    const response = await api.cachedGet(`/customers/${id}`, { force, ttl });
    return response.data;
  },

  // Create customer
  createCustomer: async (customerData) => {
    const response = await api.post("/auth/register", {
      name: customerData.fullName,
      email: customerData.email,
      phone: customerData.mobileNumber,
      companyName: customerData.companyName || customerData.fullName,
      password: customerData.password || "customer123",
      role: "customer",
    });
    return response.data;
  },

  // Update customer profile
  updateCustomer: async (id, customerData) => {
    const response = await api.put(`/customers/${id}`, customerData);
    return response.data;
  },

  // Delete customer profile
  deleteCustomer: async (id) => {
    const response = await api.delete(`/customers/${id}`);
    return response.data;
  },
};

export default customerService;

import api from "./api";

export const customerService = {
  // Get all customers
  getAllCustomers: async (params = {}) => {
    const response = await api.get("/customers", { params });
    return response.data;
  },

  // Get single customer details
  getCustomerById: async (id) => {
    const response = await api.get(`/customers/${id}`);
    return response.data;
  },

  // Create customer (simulates registering customer)
  createCustomer: async (customerData) => {
    // Falls back to backend register auth route since customer accounts need authentication records
    const response = await api.post("/auth/register", {
      name: customerData.fullName,
      email: customerData.email,
      phone: customerData.mobileNumber,
      password: "customer123", // default temporary password
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

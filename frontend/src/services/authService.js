import api, { cacheManager } from "./api";

export const authService = {
  login: async (credentials) => {
    const response = await api.post("/auth/login", credentials);
    if (response.data?.data?.token) {
      localStorage.setItem("token", response.data.data.token);
      localStorage.setItem("user", JSON.stringify(response.data.data));
      localStorage.setItem("role", response.data.data.role);
    }
    return response.data;
  },

  register: async (userData) => {
    const response = await api.post("/auth/register", userData);
    if (response.data?.data?.token) {
      localStorage.setItem("token", response.data.data.token);
      localStorage.setItem("user", JSON.stringify(response.data.data));
      localStorage.setItem("role", response.data.data.role);
    }
    return response.data;
  },

  logout: () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("role");
    cacheManager.clear();
  },

  getCurrentUser: async () => {
    const response = await api.get("/auth/me");
    if (response.data?.data) {
      localStorage.setItem("user", JSON.stringify(response.data.data));
      localStorage.setItem("role", response.data.data.role);
    }
    return response.data;
  },

  getPublicStats: async () => {
    const response = await api.cachedGet("/auth/public-stats", { ttl: 60000 });
    return response.data;
  },
};

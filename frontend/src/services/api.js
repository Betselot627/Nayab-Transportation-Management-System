import axios from "axios";

// Dynamically determine backend API URL so phone and local browsers both work seamlessly
const getBaseUrl = () => {
  if (typeof window !== "undefined" && window.location && window.location.hostname) {
    const host = window.location.hostname;
    // If not localhost or 127.0.0.1, use the current machine's network IP on port 5002
    if (host !== "localhost" && host !== "127.0.0.1") {
      return `http://${host}:5002/api`;
    }
  }
  return import.meta.env.VITE_API_URL || "http://localhost:5002/api";
};

const api = axios.create({
  baseURL: getBaseUrl(),
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(
  (config) => {
    // Dynamically ensure baseURL matches current host
    if (!config.baseURL || config.baseURL.includes("localhost")) {
      config.baseURL = getBaseUrl();
    }
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Response Interceptor to automatically clear stale/invalid tokens on 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      const currentPath = window.location.pathname;
      const isAuthPage =
        currentPath.includes("/login") ||
        currentPath.includes("/register") ||
        currentPath.includes("/forgot-password");

      if (!isAuthPage) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        localStorage.removeItem("role");
        // Redirect to login page
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export default api;

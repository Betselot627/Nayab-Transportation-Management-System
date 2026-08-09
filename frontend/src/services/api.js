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

export default api;

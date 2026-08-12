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

// =========================================================================
// High-Performance In-Memory Cache & In-Flight Request Deduplication Layer
// =========================================================================

const cacheStore = new Map();
const inFlightRequests = new Map();

// Helper to generate unique deterministic cache key from URL and params
const generateCacheKey = (url, params = {}) => {
  const sortedParams = Object.keys(params || {})
    .sort()
    .reduce((acc, key) => {
      acc[key] = params[key];
      return acc;
    }, {});
  return `${url}?${JSON.stringify(sortedParams)}`;
};

export const cacheManager = {
  // Retrieve cached response if still within TTL
  get: (key) => {
    const entry = cacheStore.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiry) {
      cacheStore.delete(key);
      return null;
    }
    return entry.data;
  },

  // Save response to cache with specified TTL in milliseconds (default: 45s)
  set: (key, data, ttlMs = 45000) => {
    cacheStore.set(key, {
      data,
      expiry: Date.now() + ttlMs,
    });
  },

  // Invalidate cache keys matching pattern or prefix
  invalidate: (pattern) => {
    if (!pattern) {
      cacheStore.clear();
      return;
    }
    const regex = pattern instanceof RegExp ? pattern : new RegExp(pattern, "i");
    for (const key of cacheStore.keys()) {
      if (regex.test(key)) {
        cacheStore.delete(key);
      }
    }
  },

  // Clear all cache
  clear: () => {
    cacheStore.clear();
    inFlightRequests.clear();
  },

  // Get active cache size
  size: () => cacheStore.size,
};

// =========================================================================
// Axios Interceptors
// =========================================================================

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
  (response) => {
    // Invalidate caches when mutations occur
    const method = (response.config.method || "").toLowerCase();
    if (["post", "put", "patch", "delete"].includes(method)) {
      const url = response.config.url || "";
      if (url.includes("/shipments") || url.includes("/bookings")) {
        cacheManager.invalidate("/shipments");
        cacheManager.invalidate("/reports");
      } else if (url.includes("/vehicles")) {
        cacheManager.invalidate("/vehicles");
        cacheManager.invalidate("/reports");
      } else if (url.includes("/drivers")) {
        cacheManager.invalidate("/drivers");
        cacheManager.invalidate("/reports");
      } else if (url.includes("/trips")) {
        cacheManager.invalidate("/trips");
        cacheManager.invalidate("/shipments");
        cacheManager.invalidate("/reports");
      } else if (url.includes("/payments")) {
        cacheManager.invalidate("/payments");
        cacheManager.invalidate("/shipments");
        cacheManager.invalidate("/reports");
      } else if (url.includes("/customers")) {
        cacheManager.invalidate("/customers");
        cacheManager.invalidate("/reports");
      } else if (url.includes("/notifications")) {
        cacheManager.invalidate("/notifications");
      }
    }
    return response;
  },
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
        cacheManager.clear();
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

// =========================================================================
// Cached GET Helper with Request Deduplication & SWR
// =========================================================================

const originalGet = api.get.bind(api);

api.cachedGet = async (url, config = {}) => {
  const { cache = true, ttl = 45000, force = false, params = {} } = config;
  const cacheKey = generateCacheKey(url, params);

  // 1. Return fresh cached data if available and not forced
  if (cache && !force) {
    const cachedData = cacheManager.get(cacheKey);
    if (cachedData !== null && cachedData !== undefined) {
      return { data: cachedData, fromCache: true };
    }
  }

  // 2. Deduplicate in-flight requests (prevent duplicate parallel network calls)
  if (inFlightRequests.has(cacheKey)) {
    return inFlightRequests.get(cacheKey);
  }

  // 3. Dispatch fresh network request
  const requestPromise = (async () => {
    try {
      const response = await originalGet(url, config);
      if (cache && response.data) {
        cacheManager.set(cacheKey, response.data, ttl);
      }
      return response;
    } finally {
      inFlightRequests.delete(cacheKey);
    }
  })();

  inFlightRequests.set(cacheKey, requestPromise);
  return requestPromise;
};

export default api;

import { createContext, useState, useEffect, useCallback } from "react";
import { authService } from "../services/authService";
import { cacheManager } from "../services/api";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  // Synchronously initialize user from localStorage for instant 0ms app start & route transitions
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem("user");
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });

  const [loading, setLoading] = useState(() => {
    const token = localStorage.getItem("token");
    const savedUser = localStorage.getItem("user");
    // If we have token but no cached user profile, we must wait for first load
    return !!token && !savedUser;
  });

  const [error, setError] = useState(null);

  // Background auth revalidation without blocking page rendering
  const checkAuth = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    // Session preservation for local simulation
    if (token === "mock-jwt-token-ntms-admin") {
      // Legacy mock token: force re-authentication instead of trusting it
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      localStorage.removeItem("role");
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const response = await authService.getCurrentUser();
      if (response && response.data) {
        setUser(response.data);
        localStorage.setItem("user", JSON.stringify(response.data));
        localStorage.setItem("role", response.data.role);
      }
    } catch (err) {
      console.warn("Silent auth check failed:", err.message);
      // Only clear if server explicitly rejected token (401)
      if (err.response?.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        localStorage.removeItem("role");
        setUser(null);
        cacheManager.clear();
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const login = async (credentials) => {
    try {
      setError(null);
      const response = await authService.login(credentials);
      if (response && response.data) {
        const userData = response.data;
        setUser(userData);
        localStorage.setItem("token", userData.token);
        localStorage.setItem("user", JSON.stringify(userData));
        localStorage.setItem("role", userData.role);
        return { success: true, data: userData };
      }
      throw new Error("Invalid response format");
    } catch (err) {
      const errorMessage =
        err.response?.data?.message ||
        "Login failed - Make sure credentials are correct";
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  const register = async (userData) => {
    try {
      setError(null);
      const response = await authService.register(userData);
      if (response.data && response.data.token) {
        const userObj = response.data;
        setUser(userObj);
        localStorage.setItem("token", userObj.token);
        localStorage.setItem("user", JSON.stringify(userObj));
        localStorage.setItem("role", userObj.role);
      }
      return { success: true, data: response.data };
    } catch (err) {
      const errorMessage = err.response?.data?.message || "Registration failed";
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  const logout = () => {
    authService.logout();
    setUser(null);
    setError(null);
    cacheManager.clear();
  };

  const updateUser = (updatedData) => {
    setUser((prevUser) => {
      const updated = {
        ...prevUser,
        ...updatedData,
      };
      localStorage.setItem("user", JSON.stringify(updated));
      return updated;
    });
  };

  const value = {
    user,
    setUser,
    loading,
    error,
    login,
    register,
    logout,
    updateUser,
    isAuthenticated: !!user,
    isAdmin: user?.role === "admin",
    isDispatcher: user?.role === "dispatcher",
    isDriver: user?.role === "driver",
    isCustomer: user?.role === "customer",
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

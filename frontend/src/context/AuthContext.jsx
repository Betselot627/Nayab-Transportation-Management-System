import { createContext, useState, useEffect } from "react";
import { authService } from "../services/authService";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check if user is logged in on mount
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem("token");
    if (token) {
      // Session preservation for local simulation
      if (token === "mock-jwt-token-ntms-admin") {
        setUser({
          _id: "mock-admin-999",
          name: "Admin User",
          email: "admin@ntms.com",
          phone: "+251911223344",
          role: "admin",
          status: "active",
          token: "mock-jwt-token-ntms-admin",
        });
        setLoading(false);
        return;
      }

      try {
        const response = await authService.getCurrentUser();
        setUser(response.data);
      } catch (err) {
        console.error("Auth check failed:", err);
        localStorage.removeItem("token");
      }
    }
    setLoading(false);
  };

  const login = async (credentials) => {
    try {
      setError(null);
      const response = await authService.login(credentials);
      // If login succeeds, check if response has data
      if (response && response.data) {
        setUser(response.data);
        localStorage.setItem("token", response.data.token);
        return { success: true, data: response.data };
      }
      throw new Error("Invalid response format");
    } catch (err) {
      console.warn(
        "Backend login failed or server offline. Trying local admin simulation...",
        err,
      );

      // Fallback: Check for default admin credentials to allow testing of pages
      if (
        credentials.email === "admin@ntms.com" &&
        credentials.password === "admin123"
      ) {
        if (credentials.role && credentials.role !== "admin") {
          const errMsg = `Access Denied: Your account role is 'admin' but you selected the role '${credentials.role}'.`;
          setError(errMsg);
          return { success: false, error: errMsg };
        }
        const mockAdminUser = {
          _id: "mock-admin-999",
          name: "Admin User",
          email: "admin@ntms.com",
          phone: "+251911223344",
          role: "admin",
          status: "active",
          token: "mock-jwt-token-ntms-admin",
        };
        setUser(mockAdminUser);
        localStorage.setItem("token", mockAdminUser.token);
        return { success: true, data: mockAdminUser };
      }

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
      if (response.data.token) {
        setUser(response.data);
        localStorage.setItem("token", response.data.token);
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
  };

  const updateUser = (updatedData) => {
    setUser((prevUser) => ({
      ...prevUser,
      ...updatedData,
    }));
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

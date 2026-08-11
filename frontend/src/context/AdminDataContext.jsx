import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
} from "react";
import { vehicleService } from "../services/vehicleService";
import { driverService } from "../services/driverService";
import { shipmentService } from "../services/shipmentService";
import api from "../services/api";

const AdminDataContext = createContext();

export const useAdminData = () => {
  const context = useContext(AdminDataContext);
  if (!context) {
    throw new Error("useAdminData must be used within AdminDataProvider");
  }
  return context;
};

export const AdminDataProvider = ({ children }) => {
  // Cache state
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [shipments, setShipments] = useState([]);
  const [stats, setStats] = useState({
    totalVehicles: 0,
    totalDrivers: 0,
    totalCustomers: 0,
    totalTrips: 0,
  });

  // Loading states
  const [loading, setLoading] = useState({
    vehicles: false,
    drivers: false,
    customers: false,
    shipments: false,
    stats: false,
  });

  // Cache timestamps
  const cacheTimestamps = useRef({
    vehicles: null,
    drivers: null,
    customers: null,
    shipments: null,
    stats: null,
  });

  // Cache duration (5 minutes)
  const CACHE_DURATION = 5 * 60 * 1000;

  // Auto-update stats whenever data changes
  useEffect(() => {
    setStats({
      totalVehicles: vehicles.length,
      totalDrivers: drivers.length,
      totalCustomers: customers.length,
      totalTrips: shipments.length,
    });
  }, [vehicles.length, drivers.length, customers.length, shipments.length]);

  // Check if cache is still valid
  const isCacheValid = (key) => {
    const timestamp = cacheTimestamps.current[key];
    if (!timestamp) return false;
    return Date.now() - timestamp < CACHE_DURATION;
  };

  // Fetch vehicles with caching
  const fetchVehicles = useCallback(async (force = false) => {
    if (!force && isCacheValid("vehicles") && vehicles.length > 0) {
      return vehicles;
    }

    setLoading((prev) => ({ ...prev, vehicles: true }));
    try {
      const response = await vehicleService.getAllVehicles();
      const data = response.data || [];
      setVehicles(data);
      cacheTimestamps.current.vehicles = Date.now();
      return data;
    } catch (error) {
      console.error("Error fetching vehicles:", error);
      return [];
    } finally {
      setLoading((prev) => ({ ...prev, vehicles: false }));
    }
  }, []);

  // Fetch drivers with caching
  const fetchDrivers = useCallback(async (force = false) => {
    if (!force && isCacheValid("drivers") && drivers.length > 0) {
      return drivers;
    }

    setLoading((prev) => ({ ...prev, drivers: true }));
    try {
      const response = await driverService.getAllDrivers();
      const data = response.data || [];
      setDrivers(data);
      cacheTimestamps.current.drivers = Date.now();
      return data;
    } catch (error) {
      console.error("Error fetching drivers:", error);
      return [];
    } finally {
      setLoading((prev) => ({ ...prev, drivers: false }));
    }
  }, []);

  // Fetch customers with caching
  const fetchCustomers = useCallback(async (force = false) => {
    if (!force && isCacheValid("customers") && customers.length > 0) {
      return customers;
    }

    setLoading((prev) => ({ ...prev, customers: true }));
    try {
      const response = await api.get("/customers");
      const data = response.data?.data || [];
      setCustomers(data);
      cacheTimestamps.current.customers = Date.now();
      return data;
    } catch (error) {
      console.error("Error fetching customers:", error);
      return [];
    } finally {
      setLoading((prev) => ({ ...prev, customers: false }));
    }
  }, []);

  // Fetch shipments with caching
  const fetchShipments = useCallback(async (force = false) => {
    if (!force && isCacheValid("shipments") && shipments.length > 0) {
      return shipments;
    }

    setLoading((prev) => ({ ...prev, shipments: true }));
    try {
      const response = await shipmentService.getAllShipments();
      const data = response.data || [];
      setShipments(data);
      cacheTimestamps.current.shipments = Date.now();
      return data;
    } catch (error) {
      console.error("Error fetching shipments:", error);
      return [];
    } finally {
      setLoading((prev) => ({ ...prev, shipments: false }));
    }
  }, []);

  // Fetch stats with caching
  const fetchStats = useCallback(
    async (force = false) => {
      if (!force && isCacheValid("stats")) {
        return stats;
      }

      setLoading((prev) => ({ ...prev, stats: true }));
      try {
        // Fetch all data in parallel
        const results = await Promise.all([
          fetchVehicles(force),
          fetchDrivers(force),
          fetchCustomers(force),
          fetchShipments(force),
        ]);

        const statsData = {
          totalVehicles: results[0].length,
          totalDrivers: results[1].length,
          totalCustomers: results[2].length,
          totalTrips: results[3].length,
        };

        setStats(statsData);
        cacheTimestamps.current.stats = Date.now();
        return statsData;
      } catch (error) {
        console.error("Error fetching stats:", error);
        return stats;
      } finally {
        setLoading((prev) => ({ ...prev, stats: false }));
      }
    },
    [stats],
  );

  // Fetch all admin data
  const fetchAllData = useCallback(async (force = false) => {
    await Promise.all([
      fetchVehicles(force),
      fetchDrivers(force),
      fetchCustomers(force),
      fetchShipments(force),
    ]);
    // Stats will be calculated automatically when data changes
  }, []);

  // Invalidate cache for specific resource
  const invalidateCache = useCallback((resource) => {
    if (resource) {
      cacheTimestamps.current[resource] = null;
    } else {
      // Invalidate all caches
      Object.keys(cacheTimestamps.current).forEach((key) => {
        cacheTimestamps.current[key] = null;
      });
    }
  }, []);

  // Update single vehicle in cache
  const updateVehicleInCache = useCallback((vehicleId, updatedData) => {
    setVehicles((prev) =>
      prev.map((v) => (v._id === vehicleId ? { ...v, ...updatedData } : v)),
    );
  }, []);

  // Remove vehicle from cache
  const removeVehicleFromCache = useCallback((vehicleId) => {
    setVehicles((prev) => prev.filter((v) => v._id !== vehicleId));
    setStats((prev) => ({ ...prev, totalVehicles: prev.totalVehicles - 1 }));
  }, []);

  // Add vehicle to cache
  const addVehicleToCache = useCallback((newVehicle) => {
    setVehicles((prev) => [newVehicle, ...prev]);
    setStats((prev) => ({ ...prev, totalVehicles: prev.totalVehicles + 1 }));
  }, []);

  // Similar functions for drivers
  const updateDriverInCache = useCallback((driverId, updatedData) => {
    setDrivers((prev) =>
      prev.map((d) => (d._id === driverId ? { ...d, ...updatedData } : d)),
    );
  }, []);

  const removeDriverFromCache = useCallback((driverId) => {
    setDrivers((prev) => prev.filter((d) => d._id !== driverId));
    setStats((prev) => ({ ...prev, totalDrivers: prev.totalDrivers - 1 }));
  }, []);

  const addDriverToCache = useCallback((newDriver) => {
    setDrivers((prev) => [newDriver, ...prev]);
    setStats((prev) => ({ ...prev, totalDrivers: prev.totalDrivers + 1 }));
  }, []);

  // Similar functions for customers
  const updateCustomerInCache = useCallback((customerId, updatedData) => {
    setCustomers((prev) =>
      prev.map((c) => (c._id === customerId ? { ...c, ...updatedData } : c)),
    );
  }, []);

  const removeCustomerFromCache = useCallback((customerId) => {
    setCustomers((prev) => prev.filter((c) => c._id !== customerId));
    setStats((prev) => ({ ...prev, totalCustomers: prev.totalCustomers - 1 }));
  }, []);

  const addCustomerToCache = useCallback((newCustomer) => {
    setCustomers((prev) => [newCustomer, ...prev]);
    setStats((prev) => ({ ...prev, totalCustomers: prev.totalCustomers + 1 }));
  }, []);

  const value = {
    // Data
    vehicles,
    drivers,
    customers,
    shipments,
    stats,

    // Loading states
    loading,

    // Fetch functions
    fetchVehicles,
    fetchDrivers,
    fetchCustomers,
    fetchShipments,
    fetchStats,
    fetchAllData,

    // Cache management
    invalidateCache,
    isCacheValid: (key) => isCacheValid(key),

    // Cache update functions
    updateVehicleInCache,
    removeVehicleFromCache,
    addVehicleToCache,
    updateDriverInCache,
    removeDriverFromCache,
    addDriverToCache,
    updateCustomerInCache,
    removeCustomerFromCache,
    addCustomerToCache,
  };

  return (
    <AdminDataContext.Provider value={value}>
      {children}
    </AdminDataContext.Provider>
  );
};

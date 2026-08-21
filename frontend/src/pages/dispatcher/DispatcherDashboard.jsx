import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Package,
  Truck,
  Users,
  TrendingUp,
  MapPin,
  Clock,
  ArrowRight,
  ShieldCheck,
  CircleCheck as CheckCircle,
  RefreshCw,
} from "lucide-react";
import { shipmentService } from "../../services/shipmentService";
import { driverService } from "../../services/driverService";
import { vehicleService } from "../../services/vehicleService";
import { tripService } from "../../services/tripService";
import toast from "react-hot-toast";

const DispatcherDashboard = () => {
  const [stats, setStats] = useState({
    pendingBookings: 0,
    availableDrivers: 0,
    availableVehicles: 0,
    activeTrips: 0,
  });
  const [pendingShipments, setPendingShipments] = useState([]);
  const [activeTrips, setActiveTrips] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDispatcherData(false);
  }, []);

  const fetchDispatcherData = async (force = false) => {
    try {
      if (pendingShipments.length === 0) setLoading(true);

      const [pendingRes, driversRes, vehiclesRes, tripsRes] = await Promise.all([
        shipmentService.getAllShipments({ status: "pending", limit: 10 }, { force, ttl: 30000 }).catch(() => ({ data: [], total: 0 })),
        driverService.getAvailableDrivers({ force, ttl: 20000 }).catch(() => ({ data: [], count: 0 })),
        vehicleService.getAllVehicles({ available: "true", limit: 20 }, { force, ttl: 20000 }).catch(() => ({ data: [] })),
        tripService.getAllTrips({ status: "in_transit", limit: 10 }, { force, ttl: 20000 }).catch(() => ({ data: [] })),
      ]);

      const pending = pendingRes.data || [];
      const drivers = driversRes.data || [];
      const vehicles = vehiclesRes.data || [];
      const trips = tripsRes.data || [];

      setPendingShipments(pending.slice(0, 5));
      setActiveTrips(trips.slice(0, 5));

      setStats({
        pendingBookings: pendingRes.total || pending.length,
        availableDrivers: driversRes.count || drivers.length,
        availableVehicles: vehicles.length,
        activeTrips: trips.length,
      });
    } catch (err) {
      console.warn("Failed to load dispatcher dashboard data:", err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    toast.promise(fetchDispatcherData(true), {
      loading: "Refreshing fleet data...",
      success: "Dispatcher data updated!",
      error: "Failed to update data",
    });
  };

  return (
    <div className="space-y-8 p-1">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Dispatch Center
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium">
            Monitor real-time fleet capacity, assign drivers, and manage shipment routes.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-slate-700 dark:text-gray-300 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition shadow-sm"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
          <Link
            to="/dispatcher/bookings"
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-500/20 text-sm transition"
          >
            Manage Bookings
          </Link>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-900 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase text-slate-400 dark:text-slate-500 tracking-wider">
                Pending Bookings
              </p>
              <h3 className="text-3xl font-extrabold text-amber-600 dark:text-amber-400 mt-1">
                {stats.pendingBookings}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
                Awaiting vehicle/driver assignment
              </p>
            </div>
            <div className="p-3.5 bg-amber-50 dark:bg-amber-950/50 rounded-xl text-amber-600">
              <Package className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-900 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase text-slate-400 dark:text-slate-500 tracking-wider">
                Available Drivers
              </p>
              <h3 className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
                {stats.availableDrivers}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
                Ready for dispatch
              </p>
            </div>
            <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/50 rounded-xl text-emerald-600">
              <Users className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-900 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase text-slate-400 dark:text-slate-500 tracking-wider">
                Available Vehicles
              </p>
              <h3 className="text-3xl font-extrabold text-blue-600 dark:text-blue-400 mt-1">
                {stats.availableVehicles}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
                Approved & road-ready
              </p>
            </div>
            <div className="p-3.5 bg-blue-50 dark:bg-blue-950/50 rounded-xl text-blue-600">
              <Truck className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-900 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase text-slate-400 dark:text-slate-500 tracking-wider">
                Active Trips
              </p>
              <h3 className="text-3xl font-extrabold text-indigo-600 dark:text-indigo-400 mt-1">
                {stats.activeTrips}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
                Currently on transit
              </p>
            </div>
            <div className="p-3.5 bg-indigo-50 dark:bg-indigo-950/50 rounded-xl text-indigo-600">
              <TrendingUp className="w-6 h-6" />
            </div>
          </div>
        </div>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Pending Shipments Section */}
        <div className="bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-900 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Package className="w-5 h-5 text-amber-500" />
              Pending Shipments Awaiting Dispatch
            </h2>
            <Link
              to="/dispatcher/bookings"
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              View All <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {pendingShipments.length === 0 ? (
            <div className="text-center py-8 text-slate-400 dark:text-slate-500 text-sm">
              No pending shipments requiring assignment.
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-900">
              {pendingShipments.map((s) => (
                <div key={s._id} className="py-3.5 flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-slate-900 dark:text-white">
                        #{s.shipmentNumber}
                      </span>
                      <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-amber-500/10 text-amber-600 border border-amber-500/20">
                        {s.status}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span>{s.pickupLocation?.city || "Origin"}</span>
                      <span>â†’</span>
                      <span>{s.destination?.city || "Destination"}</span>
                    </div>
                  </div>
                  <Link
                    to={`/dispatcher/assign-driver?shipmentId=${s._id}`}
                    className="px-3 py-1.5 text-xs font-semibold bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 transition"
                  >
                    Assign
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Active Trips Section */}
        <div className="bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-900 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-indigo-500" />
              Live Active Trips
            </h2>
            <Link
              to="/dispatcher/track-trips"
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
            >
              View All <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {activeTrips.length === 0 ? (
            <div className="text-center py-8 text-slate-400 dark:text-slate-500 text-sm">
              No active trips currently in transit.
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-900">
              {activeTrips.map((t) => (
                <div key={t._id} className="py-3.5 flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-slate-900 dark:text-white">
                        Trip #{t.tripNumber || t._id.slice(-6).toUpperCase()}
                      </span>
                      <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-sky-500/10 text-sky-600 border border-sky-500/20">
                        {t.status?.replace(/_/g, " ")}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 flex items-center gap-2">
                      <span>Driver: {t.driverId?.fullName || "Assigned Driver"}</span>
                      <span>â€¢</span>
                      <span>Vehicle: {t.vehicleId?.plateNumber || "Assigned"}</span>
                    </div>
                  </div>
                  <Link
                    to={`/dispatcher/track-trips`}
                    className="px-3 py-1.5 text-xs font-semibold bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 transition"
                  >
                    Track
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DispatcherDashboard;

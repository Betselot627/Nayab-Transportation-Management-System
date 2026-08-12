import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  TrendingUp,
  MapPin,
  Truck,
  User,
  Clock,
  ArrowRight,
  RefreshCw,
  Search,
  CheckCircle,
} from "lucide-react";
import { tripService } from "../../services/tripService";
import toast from "react-hot-toast";

const TrackTrips = () => {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  useEffect(() => {
    fetchTrips(false);
  }, [filterStatus]);

  const fetchTrips = async (force = false) => {
    try {
      if (trips.length === 0) setLoading(true);
      const params = { limit: 50 };
      if (filterStatus !== "all") params.status = filterStatus;

      const res = await tripService.getAllTrips(params, { force, ttl: 20000 });
      setTrips(res.data || []);
    } catch (err) {
      console.warn("Failed to load trips:", err.message);
      toast.error("Failed to load active trips");
    } finally {
      setLoading(false);
    }
  };

  const filteredTrips = trips.filter((t) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      t.tripNumber?.toLowerCase().includes(term) ||
      t.driverId?.fullName?.toLowerCase().includes(term) ||
      t.vehicleId?.plateNumber?.toLowerCase().includes(term) ||
      t.status?.toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-6 p-1">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Live Trip Tracking
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium text-sm">
            Monitor real-time transit status, assigned drivers, and location checkpoints.
          </p>
        </div>
        <button
          onClick={() => fetchTrips(true)}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-slate-700 dark:text-gray-300 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition shadow-sm"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-900 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row gap-4 justify-between items-center">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search trip #, driver, vehicle plate..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {["all", "pending", "in_transit", "picked_up", "arrived", "completed"].map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition ${
                filterStatus === st
                  ? "bg-indigo-600 text-white"
                  : "bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-200"
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Trips Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading && trips.length === 0 ? (
          <div className="col-span-full text-center py-12 text-slate-400">Loading trips...</div>
        ) : filteredTrips.length === 0 ? (
          <div className="col-span-full text-center py-12 text-slate-400">No active trips found.</div>
        ) : (
          filteredTrips.map((t) => (
            <div
              key={t._id}
              className="bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-900 rounded-2xl p-6 shadow-sm hover:shadow-md transition space-y-4"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-base font-extrabold text-slate-900 dark:text-white">
                  Trip #{t.tripNumber || t._id.slice(-6).toUpperCase()}
                </span>
                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-sky-500/10 text-sky-600 border border-sky-500/20 capitalize">
                  {t.status?.replace(/_/g, " ")}
                </span>
              </div>

              <div className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-slate-400" />
                  <span>Driver: <span className="font-semibold text-slate-900 dark:text-white">{t.driverId?.fullName || "Assigned"}</span></span>
                </div>
                <div className="flex items-center gap-2">
                  <Truck className="w-4 h-4 text-slate-400" />
                  <span>Vehicle: <span className="font-semibold text-slate-900 dark:text-white">{t.vehicleId?.plateNumber || "Assigned"}</span></span>
                </div>
                {t.currentLocation?.address && (
                  <div className="flex items-center gap-2 text-slate-500">
                    <MapPin className="w-4 h-4 text-emerald-500" />
                    <span>Location: {t.currentLocation.address}</span>
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-900 flex justify-between items-center text-xs">
                <span className="text-slate-400">
                  {t.startTime ? new Date(t.startTime).toLocaleDateString() : "Active"}
                </span>
                <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                  {t.checkpoints?.length || 0} Checkpoints
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default TrackTrips;

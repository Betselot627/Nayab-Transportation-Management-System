import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  MapPin,
  Calendar,
  Clock,
  Package,
  Eye,
  CheckCircle,
  Truck,
  TrendingUp,
  User,
  ArrowRight,
} from "lucide-react";
import { tripService } from "../../services/tripService";
import toast, { Toaster } from "react-hot-toast";

const MyTrips = () => {
  const navigate = useNavigate();
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    fetchTrips(true);
    const interval = setInterval(() => {
      if (!document.hidden) {
        fetchTrips(false);
      }
    }, 20000);

    return () => clearInterval(interval);
  }, []);

  const fetchTrips = async (showLoader = false) => {
    try {
      if (showLoader && trips.length === 0) setLoading(true);
      const response = await tripService.getMyTrips({ force: showLoader, ttl: 20000 });
      setTrips(response.data || []);
    } catch (error) {
      console.warn("Failed to load trips:", error.message);
      if (showLoader && trips.length === 0) toast.error("Failed to load trips");
    } finally {
      if (showLoader) setLoading(false);
    }
  };

  const getStatusConfig = (status) => {
    const configs = {
      pending: {
        label: "Booked / Assigned",
        badgeStyle: "bg-yellow-500/15 text-yellow-600 dark:text-yellow-400 border-yellow-500/20",
        borderStyle: "border-l-4 border-l-yellow-500",
      },
      assigned: {
        label: "Assigned",
        badgeStyle: "bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border-indigo-500/20",
        borderStyle: "border-l-4 border-l-indigo-500",
      },
      on_the_way: {
        label: "In Transit",
        badgeStyle: "bg-sky-500/15 text-sky-600 dark:text-sky-400 border-sky-500/20",
        borderStyle: "border-l-4 border-l-sky-500",
      },
      picked_up: {
        label: "Picked Up ✓",
        badgeStyle: "bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/20",
        borderStyle: "border-l-4 border-l-purple-500",
      },
      in_transit: {
        label: "In Transit ✓",
        badgeStyle: "bg-sky-500/15 text-sky-600 dark:text-sky-400 border-sky-500/20",
        borderStyle: "border-l-4 border-l-sky-500",
      },
      arrived: {
        label: "Arrived ✓",
        badgeStyle: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/20",
        borderStyle: "border-l-4 border-l-amber-500",
      },
      arrived_at_destination: {
        label: "Arrived ✓",
        badgeStyle: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/20",
        borderStyle: "border-l-4 border-l-amber-500",
      },
      completed: {
        label: "Delivered ✓",
        badgeStyle: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
        borderStyle: "border-l-4 border-l-emerald-600",
      },
      delivered: {
        label: "Delivered ✓",
        badgeStyle: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
        borderStyle: "border-l-4 border-l-emerald-600",
      },
      cancelled: {
        label: "Cancelled",
        badgeStyle: "bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/20",
        borderStyle: "border-l-4 border-l-rose-500",
      },
    };
    return configs[status] || {
      label: (status || "Pending").replace(/_/g, " "),
      badgeStyle: "bg-yellow-500/15 text-yellow-600 dark:text-yellow-400 border-yellow-500/20",
      borderStyle: "border-l-4 border-l-yellow-500",
    };
  };

  const filteredTrips = trips.filter((trip) => {
    if (filter === "all") return true;
    if (filter === "pending") return trip.status === "pending" || trip.status === "assigned";
    if (filter === "active") return ["picked_up", "in_transit", "on_the_way", "arrived", "arrived_at_destination"].includes(trip.status);
    if (filter === "completed") return trip.status === "completed" || trip.status === "delivered";
    if (filter === "cancelled") return trip.status === "cancelled";
    return true;
  });

  if (loading && trips.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-2 border-t-transparent border-green-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-1">
      <Toaster position="top-right" />

      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">My Trips</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium text-sm">
          Track, filter, and manage all your assigned delivery runs.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<Truck className="w-5 h-5 text-blue-600 dark:text-blue-400" />}
          label="Total Trips"
          value={trips.length}
          color="bg-blue-500/10 border-blue-500/20"
        />
        <StatCard
          icon={<Clock className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />}
          label="Pending Starts"
          value={trips.filter((t) => t.status === "pending").length}
          color="bg-yellow-500/10 border-yellow-500/20"
        />
        <StatCard
          icon={<TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />}
          label="In Progress"
          value={trips.filter((t) => ["on_the_way", "arrived_at_pickup", "picked_up", "in_transit", "arrived_at_destination"].includes(t.status)).length}
          color="bg-green-500/10 border-green-500/20"
        />
        <StatCard
          icon={<CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />}
          label="Completed"
          value={trips.filter((t) => t.status === "completed").length}
          color="bg-emerald-500/10 border-emerald-500/20"
        />
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
        {[
          { label: "All Trips", value: "all" },
          { label: "Pending", value: "pending" },
          { label: "Active Runs", value: "active" },
          { label: "Completed", value: "completed" },
          { label: "Cancelled", value: "cancelled" },
        ].map((item) => (
          <button
            key={item.value}
            onClick={() => setFilter(item.value)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition shrink-0 border cursor-pointer ${
              filter === item.value
                ? "bg-green-600 border-green-600 text-white shadow-sm"
                : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-green-600"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* Trips List */}
      {filteredTrips.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-12 text-center space-y-3">
          <Truck className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto" />
          <h3 className="text-base font-bold text-slate-900 dark:text-white">No Trips Found</h3>
          <p className="text-slate-500 dark:text-slate-400 text-xs max-w-sm mx-auto">
            There are no trips matching your selected filter criteria.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredTrips.map((trip) => {
            const config = getStatusConfig(trip.status);
            return (
              <motion.div
                key={trip._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-sm hover:shadow-md transition-all ${config.borderStyle}`}
              >
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="space-y-3 flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                        {trip.tripNumber}
                      </h3>
                      <span
                        className={`inline-flex px-2.5 py-0.5 text-xs font-bold rounded-full border ${config.badgeStyle}`}
                      >
                        {config.label}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                      <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                        <MapPin className="w-4 h-4 text-slate-400" />
                        <span>
                          {trip.shipmentId?.pickupLocation?.city || "N/A"} → {trip.shipmentId?.destination?.city || "N/A"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                        <Package className="w-4 h-4 text-slate-400" />
                        <span>Cargo: {trip.shipmentId?.cargoDetails?.type || "Standard"}</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                        <Calendar className="w-4 h-4 text-slate-400" />
                        <span>Date: {new Date(trip.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <button
                      onClick={() => navigate(`/driver/trip-details/${trip._id}`)}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      Details
                    </button>
                    <button
                      onClick={() => navigate(`/driver/update-status/${trip._id}`)}
                      className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-xs font-bold rounded-xl shadow-sm transition flex items-center gap-1.5 cursor-pointer"
                    >
                      Update Status
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};

const StatCard = ({ icon, label, value, color }) => (
  <div className={`bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm`}>
    <div className="flex items-center justify-between">
      <div className="space-y-1">
        <p className="text-slate-400 dark:text-slate-500 text-xs font-bold uppercase tracking-wider">{label}</p>
        <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white">{value}</h3>
      </div>
      <div className={`p-3 rounded-xl border ${color}`}>{icon}</div>
    </div>
  </div>
);

export default MyTrips;

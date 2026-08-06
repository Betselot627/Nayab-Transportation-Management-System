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

  // Set up 5-second polling interval
  useEffect(() => {
    fetchTrips(true);
    const interval = setInterval(() => {
      fetchTrips(false);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const fetchTrips = async (showLoader = false) => {
    try {
      if (showLoader) setLoading(true);
      const response = await tripService.getMyTrips();
      setTrips(response.data || []);
    } catch (error) {
      console.error(error);
      if (showLoader) toast.error("Failed to load trips");
    } finally {
      if (showLoader) setLoading(false);
    }
  };

  const getStatusConfig = (status) => {
    const configs = {
      pending: {
        label: "Pending",
        badgeStyle: "bg-yellow-100 text-yellow-800 border-yellow-200",
        borderStyle: "border-l-4 border-l-yellow-500",
        bgStyle: "bg-yellow-50/30",
      },
      on_the_way: {
        label: "Assigned",
        badgeStyle: "bg-blue-105 text-blue-800 border-blue-200",
        borderStyle: "border-l-4 border-l-blue-500",
        bgStyle: "bg-blue-50/30",
      },
      arrived_at_pickup: {
        label: "Assigned",
        badgeStyle: "bg-teal-100 text-teal-800 border-teal-200",
        borderStyle: "border-l-4 border-l-teal-500",
        bgStyle: "bg-teal-50/30",
      },
      picked_up: {
        label: "In Transit",
        badgeStyle: "bg-purple-100 text-purple-800 border-purple-200",
        borderStyle: "border-l-4 border-l-purple-500",
        bgStyle: "bg-purple-50/30",
      },
      in_transit: {
        label: "In Transit",
        badgeStyle: "bg-sky-100 text-sky-800 border-sky-200",
        borderStyle: "border-l-4 border-l-sky-500",
        bgStyle: "bg-sky-50/30",
      },
      arrived_at_destination: {
        label: "Delivered",
        badgeStyle: "bg-orange-100 text-orange-850 border-orange-200",
        borderStyle: "border-l-4 border-l-orange-500",
        bgStyle: "bg-orange-50/30",
      },
      completed: {
        label: "Completed",
        badgeStyle: "bg-green-100 text-green-800 border-green-200",
        borderStyle: "border-l-4 border-l-green-600",
        bgStyle: "bg-green-50/30",
      },
      cancelled: {
        label: "Cancelled",
        badgeStyle: "bg-red-100 text-red-800 border-red-200",
        borderStyle: "border-l-4 border-l-red-500",
        bgStyle: "bg-red-50/30",
      },
    };
    return configs[status] || {
      label: status.replace(/_/g, " "),
      badgeStyle: "bg-yellow-100 text-yellow-800 border-yellow-200",
      borderStyle: "border-l-4 border-l-yellow-500",
      bgStyle: "bg-yellow-50/30",
    };
  };

  const filteredTrips = trips.filter((trip) => {
    if (filter === "all") return true;
    if (filter === "pending") return trip.status === "pending";
    if (filter === "active") return ["on_the_way", "arrived_at_pickup", "picked_up", "in_transit", "arrived_at_destination"].includes(trip.status);
    if (filter === "completed") return trip.status === "completed";
    if (filter === "cancelled") return trip.status === "cancelled";
    return true;
  });

  if (loading && trips.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="w-10 h-10 border-2 border-t-transparent border-green-700 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto min-h-screen bg-slate-50">
      <Toaster position="top-right" />

      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">My Trips</h1>
        <p className="text-slate-550 mt-1 font-semibold text-sm">
          Track, filter, and manage all your assigned delivery runs.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<Truck className="w-5 h-5 text-blue-600" />}
          label="Total Trips"
          value={trips.length}
          color="bg-blue-50 border-blue-100"
        />
        <StatCard
          icon={<Clock className="w-5 h-5 text-yellow-600" />}
          label="Pending Starts"
          value={trips.filter((t) => t.status === "pending").length}
          color="bg-yellow-50 border-yellow-100"
        />
        <StatCard
          icon={<TrendingUp className="w-5 h-5 text-green-700" />}
          label="In Progress"
          value={trips.filter((t) => ["on_the_way", "arrived_at_pickup", "picked_up", "in_transit", "arrived_at_destination"].includes(t.status)).length}
          color="bg-green-50 border-green-100"
        />
        <StatCard
          icon={<CheckCircle className="w-5 h-5 text-green-800" />}
          label="Completed"
          value={trips.filter((t) => t.status === "completed").length}
          color="bg-green-100 border-green-200"
        />
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
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
            className={`px-4 py-2 rounded-xl text-xs font-bold transition shrink-0 border ${
              filter === item.value
                ? "bg-green-700 border-green-700 text-white shadow-xs"
                : "bg-white text-slate-700 border-slate-200 hover:border-green-700"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* Trips List */}
      {filteredTrips.length === 0 ? (
        <div className="text-center py-16 bg-white border rounded-2xl shadow-sm">
          <Truck className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 text-sm font-semibold">No runs match the selected filter.</p>
        </div>
      ) : (
        <div className="grid gap-6">
          {filteredTrips.map((trip, index) => {
            const config = getStatusConfig(trip.status);
            return (
              <motion.div
                key={trip._id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`bg-white rounded-2xl shadow-xs border hover:shadow-md transition-all duration-200 overflow-hidden ${config.borderStyle}`}
              >
                {/* Status-colored Card Header */}
                <div className={`px-6 py-4 flex justify-between items-center border-b ${config.bgStyle}`}>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono font-bold text-slate-650">
                      {trip.tripNumber || `Trip #${trip._id.slice(-6)}`}
                    </span>
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold border capitalize ${config.badgeStyle}`}
                    >
                      {config.label}
                    </span>
                  </div>

                  {trip.shipmentId?.customerId?.userId && (
                    <div className="flex items-center gap-2 bg-white border px-3 py-1 rounded-full text-xs shadow-xs">
                      <User className="w-3.5 h-3.5 text-green-700" />
                      <span className="text-slate-400 font-bold uppercase text-[9px]">Client:</span>
                      <span className="text-slate-800 font-extrabold text-[11px]">
                        {trip.shipmentId.customerId.userId.name}
                      </span>
                    </div>
                  )}
                </div>

                {/* Card Body */}
                <div className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="space-y-4 flex-1">
                    {/* Route Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-start gap-2.5">
                        <MapPin className="w-4 h-4 text-green-600 mt-1 flex-shrink-0" />
                        <div>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Pickup Location</p>
                          <p className="text-xs font-bold text-slate-800">
                            {trip.shipmentId?.pickupLocation?.city}
                          </p>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            {trip.shipmentId?.pickupLocation?.address}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2.5">
                        <MapPin className="w-4 h-4 text-red-500 mt-1 flex-shrink-0" />
                        <div>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Destination Location</p>
                          <p className="text-xs font-bold text-slate-800">
                            {trip.shipmentId?.destination?.city}
                          </p>
                          <p className="text-[11px] text-slate-550 mt-0.5">
                            {trip.shipmentId?.destination?.address}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Metadata strip */}
                    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs font-bold text-slate-500 pt-3 border-t border-slate-100">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-4 h-4 text-green-700" />
                        <span>
                          {trip.shipmentId?.scheduledPickupDate
                            ? new Date(trip.shipmentId.scheduledPickupDate).toLocaleDateString()
                            : "N/A"}
                        </span>
                      </div>
                      {trip.vehicleId && (
                        <div className="flex items-center gap-1.5">
                          <Truck className="w-4 h-4 text-green-700" />
                          <span>{trip.vehicleId.plateNumber} ({trip.vehicleId.model})</span>
                        </div>
                      )}
                      {trip.shipmentId?.cargoDetails && (
                        <div className="flex items-center gap-1.5">
                          <Package className="w-4 h-4 text-green-700" />
                          <span className="capitalize">{trip.shipmentId.cargoDetails.type} ({trip.shipmentId.cargoDetails.weight} {trip.shipmentId.cargoDetails.unit})</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <button
                    onClick={() => navigate(`/driver/trip-details/${trip._id}`)}
                    className="px-5 py-3 bg-green-700 hover:bg-green-800 text-white rounded-xl font-bold transition flex items-center justify-center gap-2 text-xs shadow-md shrink-0 self-start md:self-center"
                  >
                    <Eye className="w-4 h-4" />
                    View Details
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};

const StatCard = ({ icon, label, value, color }) => {
  return (
    <div className={`bg-white border p-5 rounded-2xl flex items-center justify-between shadow-xs`}>
      <div className="space-y-1">
        <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">{label}</p>
        <p className="text-2xl font-extrabold text-slate-900">{value}</p>
      </div>
      <div className={`p-3.5 rounded-xl border ${color}`}>
        {icon}
      </div>
    </div>
  );
};

export default MyTrips;
export { MyTrips };

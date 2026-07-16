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
} from "lucide-react";
import { tripService } from "../../services/tripService";
import toast from "react-hot-toast";

const MyTrips = () => {
  const navigate = useNavigate();
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    fetchTrips();
  }, []);

  const fetchTrips = async () => {
    try {
      const data = await tripService.getMyTrips();
      setTrips(data);
    } catch (error) {
      toast.error("Failed to load trips");
    } finally {
      setLoading(false);
    }
  };

  const filteredTrips = trips.filter((trip) => {
    if (filter === "all") return true;
    return trip.status === filter;
  });

  const getStatusColor = (status) => {
    const colors = {
      pending: "bg-yellow-100 text-yellow-700 border-yellow-200",
      "in-progress": "bg-blue-100 text-blue-700 border-blue-200",
      completed: "bg-green-100 text-green-700 border-green-200",
      cancelled: "bg-red-100 text-red-700 border-red-200",
    };
    return colors[status] || colors.pending;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-16 h-16 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">My Trips</h1>
          <p className="text-slate-600 mt-1">
            View and manage your assigned trips
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid md:grid-cols-4 gap-6">
        <StatCard
          icon={<Truck />}
          label="Total Trips"
          value={trips.length}
          color="blue"
        />
        <StatCard
          icon={<Clock />}
          label="In Progress"
          value={trips.filter((t) => t.status === "in-progress").length}
          color="amber"
        />
        <StatCard
          icon={<CheckCircle />}
          label="Completed"
          value={trips.filter((t) => t.status === "completed").length}
          color="green"
        />
        <StatCard
          icon={<Package />}
          label="Pending"
          value={trips.filter((t) => t.status === "pending").length}
          color="yellow"
        />
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {[
          { label: "All Trips", value: "all" },
          { label: "Pending", value: "pending" },
          { label: "In Progress", value: "in-progress" },
          { label: "Completed", value: "completed" },
          { label: "Cancelled", value: "cancelled" },
        ].map((item) => (
          <button
            key={item.value}
            onClick={() => setFilter(item.value)}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              filter === item.value
                ? "bg-amber-500 text-white"
                : "bg-white text-slate-700 border border-slate-300 hover:border-amber-500"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* Trips List */}
      {filteredTrips.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl">
          <Truck className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500 text-lg">No trips found</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredTrips.map((trip, index) => (
            <motion.div
              key={trip._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 hover:shadow-md transition"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-3 flex-1">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-mono text-slate-500">
                      Trip #{trip._id.slice(-6)}
                    </span>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                        trip.status,
                      )}`}
                    >
                      {trip.status}
                    </span>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-green-500 mt-1 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-slate-500">Start Location</p>
                        <p className="text-sm font-medium text-slate-900">
                          {trip.startLocation || "N/A"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-red-500 mt-1 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-slate-500">End Location</p>
                        <p className="text-sm font-medium text-slate-900">
                          {trip.endLocation || "N/A"}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-sm text-slate-600">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      <span>
                        {trip.startTime
                          ? new Date(trip.startTime).toLocaleDateString()
                          : "Not started"}
                      </span>
                    </div>
                    {trip.vehicle && (
                      <div className="flex items-center gap-1">
                        <Truck className="w-4 h-4" />
                        <span>{trip.vehicle.registrationNumber || "N/A"}</span>
                      </div>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => navigate(`/driver/trip-details/${trip._id}`)}
                  className="px-6 py-2 bg-amber-500 text-white rounded-lg font-medium hover:bg-amber-600 transition flex items-center justify-center gap-2"
                >
                  <Eye className="w-4 h-4" />
                  View Details
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

const StatCard = ({ icon, label, value, color }) => {
  const colorClasses = {
    blue: "from-blue-500 to-blue-600",
    amber: "from-amber-500 to-amber-600",
    green: "from-green-500 to-green-600",
    yellow: "from-yellow-500 to-yellow-600",
  };

  return (
    <div
      className={`bg-gradient-to-br ${colorClasses[color]} p-6 rounded-xl text-white shadow-lg`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-white/80 text-sm">{label}</p>
          <p className="text-3xl font-bold mt-2">{value}</p>
        </div>
        <div className="opacity-80">
          {React.cloneElement(icon, { className: "w-10 h-10" })}
        </div>
      </div>
    </div>
  );
};

export default MyTrips;

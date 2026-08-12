import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { tripService } from "../../services/tripService";
import {
  Truck,
  MapPin,
  Clock,
  CheckCircle,
  Loader,
  Navigation,
  Package,
  AlertCircle,
  TrendingUp,
  Activity,
  BarChart3,
  Calendar,
  AlertTriangle,
} from "lucide-react";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import toast, { Toaster } from "react-hot-toast";

const DriverDashboard = () => {
  const [trips, setTrips] = useState([]);
  const [stats, setStats] = useState({
    pending: 0,
    assigned: 0,
    active: 0,
    completed: 0,
  });
  const [loading, setLoading] = useState(true);

  // Smart visibility-aware polling interval
  useEffect(() => {
    let isMounted = true;

    const loadData = async (showLoader = false) => {
      if (document.hidden && !showLoader) return;
      try {
        if (showLoader && trips.length === 0) setLoading(true);
        const response = await tripService.getMyTrips({ force: showLoader, ttl: 20000 });
        if (!isMounted) return;
        const all = response.data || [];
        setTrips(all);

        setStats({
          pending: all.filter((t) => t.status === "pending").length,
          assigned: all.filter((t) => ["pending", "on_the_way", "arrived_at_pickup"].includes(t.status)).length,
          active: all.filter((t) => ["on_the_way", "arrived_at_pickup", "picked_up", "in_transit", "arrived_at_destination"].includes(t.status)).length,
          completed: all.filter((t) => t.status === "completed").length,
        });
      } catch (err) {
        if (isMounted) console.warn("Failed to fetch trips:", err.message);
      } finally {
        if (isMounted && showLoader) setLoading(false);
      }
    };

    loadData(true);

    const interval = setInterval(() => {
      loadData(false);
    }, 20000); // 20s optimal polling

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        loadData(false);
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      isMounted = false;
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  const fetchTrips = async (showLoader = false) => {
    try {
      if (showLoader) setLoading(true);
      const response = await tripService.getMyTrips();
      const all = response.data || [];
      setTrips(all);

      setStats({
        pending: all.filter((t) => t.status === "pending").length,
        assigned: all.filter((t) => ["pending", "on_the_way", "arrived_at_pickup"].includes(t.status)).length,
        active: all.filter((t) => ["on_the_way", "arrived_at_pickup", "picked_up", "in_transit", "arrived_at_destination"].includes(t.status)).length,
        completed: all.filter((t) => t.status === "completed").length,
      });
    } catch (err) {
      console.error("Failed to fetch trips:", err);
    } finally {
      if (showLoader) setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: "bg-yellow-500/15 text-yellow-600 dark:text-yellow-400 border-yellow-500/20",
      on_the_way: "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/20",
      arrived_at_pickup: "bg-teal-500/15 text-teal-600 dark:text-teal-400 border-teal-500/20",
      picked_up: "bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/20",
      in_transit: "bg-sky-500/15 text-sky-600 dark:text-sky-400 border-sky-500/20",
      arrived_at_destination: "bg-orange-500/15 text-orange-600 dark:text-orange-400 border-orange-500/20",
      completed: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
      cancelled: "bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/20",
    };
    return colors[status] || "bg-yellow-500/15 text-yellow-600 dark:text-yellow-400 border-yellow-500/20";
  };

  const handleStepUpdate = async (tripId, nextStatus) => {
    try {
      await tripService.updateTripStatus(tripId, { status: nextStatus });
      toast.success(`Status updated to "${nextStatus.replace(/_/g, " ")}"`);
      fetchTrips(false);
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to update trip status");
    }
  };

  const getPieData = () => {
    const activeRuns = trips.filter((t) => ["on_the_way", "arrived_at_pickup", "picked_up", "in_transit"].includes(t.status)).length;
    const completedRuns = trips.filter((t) => t.status === "completed").length;
    const pendingRuns = trips.filter((t) => t.status === "pending").length;

    return [
      { name: "In Transit", value: activeRuns || 1, color: "#3b82f6" },
      { name: "Delivered", value: completedRuns || 0, color: "#10b981" },
      { name: "Pending", value: pendingRuns || 0, color: "#f59e0b" },
    ];
  };

  const getDistanceData = () => {
    return [
      { name: "Mon", distance: 120 },
      { name: "Tue", distance: 240 },
      { name: "Wed", distance: 180 },
      { name: "Thu", distance: 310 },
      { name: "Fri", distance: 290 },
      { name: "Sat", distance: 150 },
    ];
  };

  const getDashboardReminders = () => {
    const reminders = [];
    const now = new Date();

    trips.forEach((t) => {
      if (t.status === "completed" || t.status === "cancelled") return;
      const shipment = t.shipmentId;
      if (!shipment || !shipment.scheduledPickupDate) return;

      const pickupDate = new Date(shipment.scheduledPickupDate);
      const diffMs = pickupDate - now;
      const diffHours = diffMs / (1000 * 60 * 60);

      if (diffHours > 0 && diffHours <= 2) {
        reminders.push({
          id: `rem-critical-${t._id}`,
          title: "Pickup Time Approaching (Within 2 Hours)",
          message: `🚨 Critical Alert: Pickup for Trip ${t.tripNumber} to ${shipment.destination?.city} is scheduled in ${Math.round(diffHours * 60)} minutes!`,
          color: "bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-400",
          icon: <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />,
        });
      } else if (pickupDate.toDateString() === now.toDateString()) {
        reminders.push({
          id: `rem-day-${t._id}`,
          title: "Scheduled Shipment Today",
          message: `📅 Today's Run: Trip ${t.tripNumber} starts today! Scheduled pickup: ${pickupDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`,
          color: "bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400",
          icon: <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />,
        });
      } else if (diffHours > 0 && diffHours <= 24) {
        reminders.push({
          id: `rem-upcoming-${t._id}`,
          title: "Upcoming Run (Within 24 Hours)",
          message: `⏰ Reminder: Trip ${t.tripNumber} starts in ${Math.round(diffHours)} hours (scheduled for ${pickupDate.toLocaleDateString()}).`,
          color: "bg-blue-500/10 border-blue-500/20 text-blue-600 dark:text-blue-400",
          icon: <Clock className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />,
        });
      }
    });

    return reminders;
  };

  const reminders = getDashboardReminders();

  if (loading && trips.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader className="animate-spin h-8 w-8 text-green-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-1">
      <Toaster position="top-right" />

      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          Driver Dashboard
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium text-sm">
          Manage your active runs, update shipment statuses, and view performance charts.
        </p>
      </div>

      {/* Dynamic Shipment Reminders */}
      {reminders.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wide">Shipment Reminders</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {reminders.map((rem) => (
              <div key={rem.id} className={`p-4 rounded-2xl border flex gap-3 ${rem.color} shadow-xs`}>
                {rem.icon}
                <div>
                  <p className="font-bold text-xs uppercase tracking-wide">{rem.title}</p>
                  <p className="text-xs font-medium mt-1">{rem.message}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-slate-400 dark:text-slate-500 text-xs font-bold uppercase tracking-wider">Pending Starts</p>
              <h3 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">{stats.pending}</h3>
            </div>
            <div className="bg-yellow-500/10 p-3.5 rounded-xl text-yellow-600 dark:text-yellow-400 border border-yellow-500/20">
              <Clock className="h-6 w-6" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-slate-400 dark:text-slate-500 text-xs font-bold uppercase tracking-wider">Assigned Shipments</p>
              <h3 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">{stats.assigned}</h3>
            </div>
            <div className="bg-blue-500/10 p-3.5 rounded-xl text-blue-600 dark:text-blue-400 border border-blue-500/20">
              <Package className="h-6 w-6" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-slate-400 dark:text-slate-500 text-xs font-bold uppercase tracking-wider">Active Runs</p>
              <h3 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">{stats.active}</h3>
            </div>
            <div className="bg-green-500/10 p-3.5 rounded-xl text-green-600 dark:text-green-400 border border-green-500/20">
              <TrendingUp className="h-6 w-6" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-slate-400 dark:text-slate-500 text-xs font-bold uppercase tracking-wider">Completed Trips</p>
              <h3 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">{stats.completed}</h3>
            </div>
            <div className="bg-emerald-500/10 p-3.5 rounded-xl text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <CheckCircle className="h-6 w-6" />
            </div>
          </div>
        </div>
      </div>

      {/* Recharts Analytics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Trip Status Donut */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 shadow-sm transition-colors">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Trip Allocation</h3>
              <p className="text-xs font-medium text-slate-400">Distribution of assigned delivery tasks</p>
            </div>
            <div className="bg-green-500/10 p-2.5 rounded-xl text-green-600 dark:text-green-400">
              <Activity className="w-5 h-5" />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
            <div className="h-[200px] relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={getPieData()}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {getPieData().map((entry, idx) => (
                      <Cell key={`cell-${idx}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-xl font-extrabold text-slate-900 dark:text-white">{trips.length}</span>
                <span className="text-[9px] uppercase font-bold tracking-wider text-slate-400">Runs</span>
              </div>
            </div>
            <div className="space-y-3">
              {getPieData().map((entry, idx) => (
                <div key={idx} className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{entry.name}</span>
                  </div>
                  <span className="text-xs font-extrabold text-slate-900 dark:text-white">
                    {entry.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Distance Coverage */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 shadow-sm transition-colors">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Mileage Covered</h3>
              <p className="text-xs font-medium text-slate-400">Kilometers covered in completed runs</p>
            </div>
            <div className="bg-green-500/10 p-2.5 rounded-xl text-green-600 dark:text-green-400">
              <BarChart3 className="w-5 h-5" />
            </div>
          </div>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={getDistanceData()} margin={{ left: -15 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1f2937" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} />
                <Tooltip />
                <Bar dataKey="distance" fill="#10b981" radius={[4, 4, 0, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Active Trips list */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden transition-colors">
        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Assigned & Active Trips</h3>
            <p className="text-xs font-medium text-slate-400">Trips currently in progress or waiting to be started</p>
          </div>
          <Link
            to="/driver/my-trips"
            className="px-3.5 py-1.5 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl transition"
          >
            See All Runs
          </Link>
        </div>

        <div className="p-6">
          {trips.filter((t) => t.status !== "completed" && t.status !== "cancelled").length === 0 ? (
            <div className="text-center py-12 space-y-3">
              <Truck className="mx-auto h-12 w-12 text-slate-300 dark:text-slate-700" />
              <h4 className="text-base font-bold text-slate-900 dark:text-white">No Active Runs</h4>
              <p className="text-slate-500 dark:text-slate-400 text-sm max-w-xs mx-auto">
                You have no active runs assigned to you at the moment.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {trips
                .filter((t) => t.status !== "completed" && t.status !== "cancelled")
                .map((trip) => (
                  <div
                    key={trip._id}
                    className="border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 hover:shadow-md transition-shadow duration-200 bg-white dark:bg-slate-900/60"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div className="space-y-3">
                        <div className="flex items-center gap-2.5">
                          <h4 className="text-base font-bold text-slate-900 dark:text-white">
                            {trip.tripNumber}
                          </h4>
                          <span
                            className={`inline-flex px-2.5 py-1 text-[11px] font-bold rounded-full border capitalize ${getStatusColor(
                              trip.status,
                            )}`}
                          >
                            {trip.status.replace("_", " ")}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-y-2 sm:gap-x-6">
                          <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300 font-medium">
                            <Package className="h-4 w-4 text-slate-400" />
                            <span>Shipment: {trip.shipmentId?.shipmentNumber}</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300 font-medium">
                            <MapPin className="h-4 w-4 text-slate-400 font-semibold" />
                            <span>
                              {trip.shipmentId?.pickupLocation?.city} → {trip.shipmentId?.destination?.city}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300 font-medium">
                            <Calendar className="h-4 w-4 text-slate-400" />
                            <span>
                              Pickup: {trip.shipmentId?.scheduledPickupDate ? new Date(trip.shipmentId.scheduledPickupDate).toLocaleDateString() : "N/A"}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex sm:flex-col gap-2 shrink-0">
                        {(trip.status === "pending" ||
                          trip.status === "assigned" ||
                          trip.status === "on_the_way" ||
                          trip.status === "arrived_at_pickup") && (
                          <button
                            onClick={() =>
                              handleStepUpdate(trip._id, "picked_up")
                            }
                            className="bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <Package className="h-3.5 w-3.5" />
                            Package Picked Up
                          </button>
                        )}

                        {trip.status === "picked_up" && (
                          <button
                            onClick={() =>
                              handleStepUpdate(trip._id, "in_transit")
                            }
                            className="bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <Navigation className="h-3.5 w-3.5" />
                            Start Trip
                          </button>
                        )}

                        {trip.status === "in_transit" && (
                          <button
                            onClick={() =>
                              handleStepUpdate(trip._id, "arrived")
                            }
                            className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <MapPin className="h-3.5 w-3.5" />
                            Arrived
                          </button>
                        )}

                        {(trip.status === "arrived" ||
                          trip.status === "arrived_at_destination") && (
                          <button
                            onClick={() =>
                              handleStepUpdate(trip._id, "completed")
                            }
                            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <CheckCircle className="h-3.5 w-3.5" />
                            Delivered
                          </button>
                        )}

                        <Link
                          to={`/driver/trip-details/${trip._id}`}
                          className="border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold px-4 py-2.5 rounded-xl transition-all text-center"
                        >
                          View Details
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DriverDashboard;

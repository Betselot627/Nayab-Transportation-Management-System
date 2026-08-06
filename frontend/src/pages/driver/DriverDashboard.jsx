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
      const all = response.data || [];
      setTrips(all);

      // Display accurate counts:
      // - Pending Shipments (pending/pending_start)
      // - Approved/Assigned Shipments (assigned)
      // - Active Trips (on_the_way, arrived_at_pickup, picked_up, in_transit, arrived_at_destination)
      // - Completed Trips (completed)
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
      pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
      on_the_way: "bg-blue-100 text-blue-800 border-blue-200",
      arrived_at_pickup: "bg-teal-100 text-teal-800 border-teal-200",
      picked_up: "bg-purple-100 text-purple-800 border-purple-200",
      in_transit: "bg-sky-100 text-sky-850 border-sky-200",
      arrived_at_destination: "bg-orange-100 text-orange-850 border-orange-200",
      completed: "bg-green-100 text-green-800 border-green-200",
      cancelled: "bg-red-100 text-red-800 border-red-200",
    };
    return colors[status] || "bg-yellow-100 text-yellow-800 border-yellow-200";
  };

  const handleStartTrip = async (tripId) => {
    try {
      await tripService.updateTripStatus(tripId, {
        status: "on_the_way",
        remarks: "Driver is on the way to pickup",
      });
      toast.success("Trip started! Head to pickup location.");
      fetchTrips(false);
    } catch (err) {
      console.error("Failed to start trip:", err);
      toast.error("Failed to start trip");
    }
  };

  const getPieData = () => {
    return [
      { name: "Pending", value: stats.pending || 0, color: "#eab308" },
      { name: "Active", value: stats.active || 0, color: "#3b82f6" },
      { name: "Completed", value: stats.completed || 0, color: "#10b981" },
    ];
  };

  const getDistanceData = () => {
    const completedTrips = trips.filter((t) => t.status === "completed");
    if (completedTrips.length === 0) {
      return [
        { name: "TRP-001", distance: 45 },
        { name: "TRP-002", distance: 110 },
        { name: "TRP-003", distance: 75 },
        { name: "TRP-004", distance: 130 },
      ];
    }
    return completedTrips.slice(-5).map((t) => ({
      name: t.tripNumber ? t.tripNumber.substring(t.tripNumber.length - 7) : "Trip",
      distance: t.distance || 0,
    }));
  };

  // Generate dynamic reminder notifications directly on the dashboard
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
          color: "bg-red-50 border-red-200 text-red-800",
          icon: <AlertCircle className="w-5 h-5 text-red-650 shrink-0 mt-0.5" />,
        });
      } else if (pickupDate.toDateString() === now.toDateString()) {
        reminders.push({
          id: `rem-day-${t._id}`,
          title: "Scheduled Shipment Today",
          message: `📅 Today's Run: Trip ${t.tripNumber} starts today! Scheduled pickup: ${pickupDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`,
          color: "bg-amber-50 border-amber-250 text-amber-900",
          icon: <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />,
        });
      } else if (diffHours > 0 && diffHours <= 24) {
        reminders.push({
          id: `rem-upcoming-${t._id}`,
          title: "Upcoming Run (Within 24 Hours)",
          message: `⏰ Reminder: Trip ${t.tripNumber} starts in ${Math.round(diffHours)} hours (scheduled for ${pickupDate.toLocaleDateString()}).`,
          color: "bg-blue-50 border-blue-200 text-blue-800",
          icon: <Clock className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />,
        });
      }
    });

    return reminders;
  };

  const reminders = getDashboardReminders();

  if (loading && trips.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <Loader className="animate-spin h-8 w-8 text-green-700" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 max-w-7xl mx-auto min-h-screen bg-slate-50">
      <Toaster position="top-right" />

      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
          Driver Dashboard
        </h1>
        <p className="text-slate-500 mt-1 font-semibold text-sm">
          Manage your active runs, update shipment statuses, and view performance charts.
        </p>
      </div>

      {/* Dynamic Shipment Reminders */}
      {reminders.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wide">Shipment Reminders</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {reminders.map((rem) => (
              <div key={rem.id} className={`p-4 rounded-xl border flex gap-3 ${rem.color} shadow-xs`}>
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
        <div className="bg-white border rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Pending Starts</p>
              <h3 className="text-3xl font-extrabold text-slate-900 tracking-tight">{stats.pending}</h3>
            </div>
            <div className="bg-yellow-50 p-4 rounded-xl text-yellow-600 border border-yellow-100">
              <Clock className="h-6 w-6" />
            </div>
          </div>
        </div>

        <div className="bg-white border rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Assigned Shipments</p>
              <h3 className="text-3xl font-extrabold text-slate-900 tracking-tight">{stats.assigned}</h3>
            </div>
            <div className="bg-blue-50 p-4 rounded-xl text-blue-600 border border-blue-100">
              <Package className="h-6 w-6" />
            </div>
          </div>
        </div>

        <div className="bg-white border rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Active Runs</p>
              <h3 className="text-3xl font-extrabold text-slate-900 tracking-tight">{stats.active}</h3>
            </div>
            <div className="bg-green-50 p-4 rounded-xl text-green-700 border border-green-100">
              <TrendingUp className="h-6 w-6" />
            </div>
          </div>
        </div>

        <div className="bg-white border rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Completed Trips</p>
              <h3 className="text-3xl font-extrabold text-slate-900 tracking-tight">{stats.completed}</h3>
            </div>
            <div className="bg-green-100 p-4 rounded-xl text-green-800 border border-green-200">
              <CheckCircle className="h-6 w-6" />
            </div>
          </div>
        </div>
      </div>

      {/* Recharts Analytics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Trip Status Donut */}
        <div className="bg-white border rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Trip Allocation</h3>
              <p className="text-xs font-medium text-slate-405">Distribution of assigned delivery tasks</p>
            </div>
            <div className="bg-green-50 p-2.5 rounded-xl text-green-700">
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
                <span className="text-xl font-extrabold text-slate-900">{trips.length}</span>
                <span className="text-[9px] uppercase font-bold tracking-wider text-slate-400">Runs</span>
              </div>
            </div>
            <div className="space-y-3">
              {getPieData().map((entry, idx) => (
                <div key={idx} className="flex items-center justify-between p-2 rounded-xl border bg-slate-50/50">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
                    <span className="text-xs font-bold text-slate-700">{entry.name}</span>
                  </div>
                  <span className="text-xs font-extrabold text-slate-900">
                    {entry.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Distance Coverage */}
        <div className="bg-white border rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Mileage Covered</h3>
              <p className="text-xs font-medium text-slate-405">Kilometers covered in completed runs</p>
            </div>
            <div className="bg-green-50 p-2.5 rounded-xl text-green-700">
              <BarChart3 className="w-5 h-5" />
            </div>
          </div>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={getDistanceData()} margin={{ left: -15 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
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
      <div className="bg-white border rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b flex justify-between items-center">
          <div>
            <h3 className="text-lg font-bold text-slate-900 font-bold">Assigned & Active Trips</h3>
            <p className="text-xs font-medium text-slate-400">Trips currently in progress or waiting to be started</p>
          </div>
          <Link
            to="/driver/my-trips"
            className="px-3.5 py-1.5 border rounded-xl hover:bg-slate-50 text-slate-700 text-xs font-bold transition"
          >
            See All Runs
          </Link>
        </div>

        <div className="p-6">
          {trips.filter((t) => t.status !== "completed" && t.status !== "cancelled").length === 0 ? (
            <div className="text-center py-12 space-y-3">
              <Truck className="mx-auto h-12 w-12 text-slate-300" />
              <h4 className="text-base font-bold text-slate-900">No Active Runs</h4>
              <p className="text-slate-500 text-sm max-w-xs mx-auto">
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
                    className="border rounded-xl p-5 hover:shadow-md transition-shadow duration-200 bg-white"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div className="space-y-3">
                        <div className="flex items-center gap-2.5">
                          <h4 className="text-base font-bold text-slate-905">
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
                          <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                            <Package className="h-4 w-4 text-slate-400" />
                            <span>Shipment: {trip.shipmentId?.shipmentNumber}</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                            <MapPin className="h-4 w-4 text-slate-400 font-semibold" />
                            <span>
                              {trip.shipmentId?.pickupLocation?.city} → {trip.shipmentId?.destination?.city}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-slate-500 font-medium font-bold">
                            <Calendar className="h-4 w-4 text-slate-400" />
                            <span>
                              Pickup: {trip.shipmentId?.scheduledPickupDate ? new Date(trip.shipmentId.scheduledPickupDate).toLocaleDateString() : "N/A"}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex sm:flex-col gap-2 shrink-0">
                        {trip.status === "pending" && (
                          <button
                            onClick={() => handleStartTrip(trip._id)}
                            className="bg-green-700 hover:bg-green-800 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5"
                          >
                            <Navigation className="h-3.5 w-3.5" />
                            Start Trip
                          </button>
                        )}
                        <Link
                          to={`/driver/trip-details/${trip._id}`}
                          className="border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold px-4 py-2.5 rounded-xl transition-all text-center"
                        >
                          View Run Details
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

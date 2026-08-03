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

const DriverDashboard = () => {
  const [trips, setTrips] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    inProgress: 0,
    completed: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTrips();
  }, []);

  const fetchTrips = async () => {
    try {
      setLoading(true);
      const response = await tripService.getMyTrips();
      setTrips(response.data || []);

      // Calculate stats
      const all = response.data || [];
      setStats({
        total: all.length,
        pending: all.filter((t) => t.status === "pending").length,
        inProgress: all.filter((t) => t.status === "in_progress").length,
        completed: all.filter((t) => t.status === "completed").length,
      });
    } catch (err) {
      console.error("Failed to fetch trips:", err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: "bg-amber-500/10 text-amber-500 border-amber-500/20",
      in_progress: "bg-blue-500/10 text-blue-500 border-blue-500/20",
      completed: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
      cancelled: "bg-rose-500/10 text-rose-500 border-rose-500/20",
    };
    return colors[status] || "bg-slate-500/10 text-slate-500 border-slate-500/20";
  };

  const handleStartTrip = async (tripId) => {
    try {
      await tripService.updateTripStatus(tripId, {
        status: "in_progress",
        remarks: "Trip started by driver",
      });
      fetchTrips();
    } catch (err) {
      console.error("Failed to start trip:", err);
    }
  };

  const getPieData = () => {
    return [
      { name: "Pending", value: stats.pending || (stats.total ? 0 : 1), color: "#f59e0b" },
      { name: "In Progress", value: stats.inProgress || 0, color: "#3b82f6" },
      { name: "Completed", value: stats.completed || (stats.total ? 0 : 2), color: "#10b981" },
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader className="animate-spin h-8 w-8 text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-8 p-1">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          Driver Dashboard
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium">
          Manage your active runs, update shipment statuses, and view performance charts.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-900 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <p className="text-slate-455 text-xs font-bold uppercase tracking-wider">Total Assignments</p>
              <h3 className="text-3xl font-extrabold text-slate-955 dark:text-white tracking-tight">{stats.total}</h3>
            </div>
            <div className="bg-blue-50 dark:bg-blue-950/50 p-4 rounded-xl text-blue-600">
              <Truck className="h-6 w-6" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-900 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <p className="text-slate-455 text-xs font-bold uppercase tracking-wider">Pending Start</p>
              <h3 className="text-3xl font-extrabold text-slate-955 dark:text-white tracking-tight">{stats.pending}</h3>
            </div>
            <div className="bg-amber-50 dark:bg-amber-950/50 p-4 rounded-xl text-amber-600">
              <Clock className="h-6 w-6" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-900 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <p className="text-slate-455 text-xs font-bold uppercase tracking-wider">Active Run</p>
              <h3 className="text-3xl font-extrabold text-slate-955 dark:text-white tracking-tight">{stats.inProgress}</h3>
            </div>
            <div className="bg-indigo-50 dark:bg-indigo-950/50 p-4 rounded-xl text-indigo-600">
              <TrendingUp className="h-6 w-6" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-900 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <p className="text-slate-455 text-xs font-bold uppercase tracking-wider">Completed Trips</p>
              <h3 className="text-3xl font-extrabold text-slate-955 dark:text-white tracking-tight">{stats.completed}</h3>
            </div>
            <div className="bg-emerald-50 dark:bg-emerald-950/50 p-4 rounded-xl text-emerald-600">
              <CheckCircle className="h-6 w-6" />
            </div>
          </div>
        </div>
      </div>

      {/* Recharts Analytics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Trip Status Donut */}
        <div className="bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-900 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Trip Allocation</h3>
              <p className="text-xs font-medium text-slate-400">Distribution of assigned delivery tasks</p>
            </div>
            <div className="bg-indigo-50 dark:bg-indigo-950/40 p-2.5 rounded-xl text-indigo-655">
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
                <span className="text-xl font-extrabold text-slate-900 dark:text-white">{stats.total}</span>
                <span className="text-[9px] uppercase font-bold tracking-wider text-slate-450">Runs</span>
              </div>
            </div>
            <div className="space-y-3">
              {getPieData().map((entry, idx) => (
                <div key={idx} className="flex items-center justify-between p-2 rounded-xl border border-slate-50 dark:border-slate-900 bg-slate-50/50 dark:bg-slate-950/50">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-350">{entry.name}</span>
                  </div>
                  <span className="text-xs font-extrabold text-slate-900 dark:text-white">
                    {stats.total ? entry.value : 0}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Distance Coverage */}
        <div className="bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-900 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Mileage Covered</h3>
              <p className="text-xs font-medium text-slate-400">Kilometers covered in completed runs</p>
            </div>
            <div className="bg-blue-50 dark:bg-blue-950/40 p-2.5 rounded-xl text-blue-655">
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
                <Bar dataKey="distance" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Active Trips list */}
      <div className="bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-900 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-900">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Assigned & Active Trips</h3>
          <p className="text-xs font-medium text-slate-400">Trips currently in progress or waiting to be started</p>
        </div>

        <div className="p-6">
          {trips.filter((t) => t.status !== "completed" && t.status !== "cancelled").length === 0 ? (
            <div className="text-center py-12 space-y-3">
              <Truck className="mx-auto h-12 w-12 text-slate-350" />
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
                    className="border border-slate-150 dark:border-slate-850 rounded-xl p-5 hover:shadow-md transition-shadow duration-200"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div className="space-y-3">
                        <div className="flex items-center gap-2.5">
                          <h4 className="text-lg font-bold text-slate-900 dark:text-white">
                            {trip.tripNumber}
                          </h4>
                          <span
                            className={`inline-flex px-3 py-1 text-xs font-bold rounded-full border capitalize ${getStatusColor(
                              trip.status,
                            )}`}
                          >
                            {trip.status.replace("_", " ")}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-y-2 sm:gap-x-6">
                          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 font-medium">
                            <Package className="h-4 w-4 text-slate-400" />
                            <span>Shipment: {trip.shipmentId?.shipmentNumber}</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 font-medium">
                            <MapPin className="h-4 w-4 text-slate-400" />
                            <span>
                              {trip.shipmentId?.pickupLocation?.city} → {trip.shipmentId?.destination?.city}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 font-medium">
                            <Truck className="h-4 w-4 text-slate-400" />
                            <span>
                              Vehicle: {trip.vehicleId?.plateNumber} ({trip.vehicleId?.model})
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex sm:flex-col gap-2 shrink-0">
                        {trip.status === "pending" && (
                          <button
                            onClick={() => handleStartTrip(trip._id)}
                            className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-sm flex items-center gap-1.5"
                          >
                            <Navigation className="h-3.5 w-3.5" />
                            Start Trip
                          </button>
                        )}
                        <Link
                          to={`/driver/trip-details/${trip._id}`}
                          className="border border-slate-300 dark:border-slate-700 hover:bg-slate-55/10 text-slate-700 dark:text-slate-350 text-xs font-bold px-4 py-2.5 rounded-xl transition-all text-center"
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

      {/* Recent Completed Trips */}
      <div className="bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-900 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-900">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Recent Completed Runs</h3>
          <p className="text-xs font-medium text-slate-400">History of your successfully delivered orders</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-900 text-xs font-bold text-slate-450 uppercase tracking-wider">
                <th className="py-3 px-6">Trip #</th>
                <th className="py-3 px-6">Route Location</th>
                <th className="py-3 px-6">Vehicle Used</th>
                <th className="py-3 px-6">Distance Covered</th>
                <th className="py-3 px-6">Completion Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-900 text-sm">
              {trips
                .filter((t) => t.status === "completed")
                .slice(0, 5)
                .map((trip) => (
                  <tr key={trip._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors">
                    <td className="py-4 px-6 font-bold text-slate-900 dark:text-white">
                      {trip.tripNumber}
                    </td>
                    <td className="py-4 px-6 font-medium text-slate-700 dark:text-slate-350">
                      {trip.shipmentId?.pickupLocation?.city} → {trip.shipmentId?.destination?.city}
                    </td>
                    <td className="py-4 px-6 font-medium text-slate-600 dark:text-slate-400 font-mono text-xs">
                      {trip.vehicleId?.plateNumber}
                    </td>
                    <td className="py-4 px-6 font-bold text-slate-900 dark:text-white">
                      {trip.distance || 0} km
                    </td>
                    <td className="py-4 px-6 text-slate-500 font-mono text-xs">
                      {trip.endTime ? new Date(trip.endTime).toLocaleDateString() : "N/A"}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DriverDashboard;

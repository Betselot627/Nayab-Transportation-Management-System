import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Truck,
  Users,
  UserCheck,
  MapPin,
  TrendingUp,
  Activity,
  DollarSign,
  Briefcase,
  ChevronRight,
} from "lucide-react";
import {
  AreaChart,
  Area,
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
import { vehicleService } from "../../services/vehicleService";
import { driverService } from "../../services/driverService";
import { shipmentService } from "../../services/shipmentService";
import api from "../../services/api";
import Loading from "../../components/common/Loading";
import toast from "react-hot-toast";

const AdminDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalVehicles: 0,
    totalDrivers: 0,
    totalCustomers: 0,
    totalTrips: 0,
  });

  const [vehicles, setVehicles] = useState([]);
  const [vehicleStats, setVehicleStats] = useState(null);
  const [shipmentStats, setShipmentStats] = useState(null);

  const monthlyTripsData = [
    { month: "Jan", trips: 65 },
    { month: "Feb", trips: 78 },
    { month: "Mar", trips: 85 },
    { month: "Apr", trips: 92 },
    { month: "May", trips: 88 },
    { month: "Jun", trips: 95 },
  ];

  const revenueData = [
    { month: "Jan", revenue: 45000 },
    { month: "Feb", revenue: 52000 },
    { month: "Mar", revenue: 48000 },
    { month: "Apr", revenue: 61000 },
    { month: "May", revenue: 55000 },
    { month: "Jun", revenue: 67000 },
  ];

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch all stats in parallel
      const [vehiclesRes, driversRes, customersRes, shipmentsRes] =
        await Promise.all([
          vehicleService
            .getAllVehicles({ limit: 5, approvalStatus: "approved" })
            .catch(() => ({ data: [], total: 0 })),
          driverService
            .getAllDrivers({ limit: 1 })
            .catch(() => ({ data: [], total: 0 })),
          api.get("/customers").catch(() => ({ data: { total: 0 } })),
          shipmentService
            .getAllShipments({ limit: 1 })
            .catch(() => ({ data: [], total: 0 })),
        ]);

      // Fetch vehicle and shipment stats
      const [vehicleStatsRes, shipmentStatsRes] = await Promise.all([
        vehicleService.getVehicleStats().catch(() => ({ data: {} })),
        shipmentService.getShipmentStats().catch(() => ({ data: {} })),
      ]);

      // Update stats
      setStats({
        totalVehicles: vehiclesRes.total || vehiclesRes.data?.length || 0,
        totalDrivers: driversRes.total || driversRes.data?.length || 0,
        totalCustomers:
          customersRes.data?.total || customersRes.data?.data?.length || 0,
        totalTrips: shipmentsRes.total || shipmentsRes.data?.length || 0,
      });

      // Update vehicles list
      setVehicles(vehiclesRes.data || []);
      setVehicleStats(vehicleStatsRes.data);
      setShipmentStats(shipmentStatsRes.data);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const getVehicleUsageData = () => {
    if (!vehicleStats) {
      return [
        { name: "In Use", value: 28, color: "#6366f1" },
        { name: "Idle", value: 12, color: "#f59e0b" },
        { name: "Maintenance", value: 5, color: "#ef4444" },
      ];
    }

    return [
      { name: "In Use", value: vehicleStats.inUse || 0, color: "#6366f1" },
      {
        name: "Available",
        value: vehicleStats.available || 0,
        color: "#10b981",
      },
      {
        name: "Maintenance",
        value: vehicleStats.maintenance || 0,
        color: "#ef4444",
      },
    ];
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "running":
      case "in_use":
      case "available":
        return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
      case "idle":
        return "bg-amber-500/10 text-amber-500 border-amber-500/20";
      case "maintenance":
        return "bg-rose-500/10 text-rose-500 border-rose-500/20";
      default:
        return "bg-slate-500/10 text-slate-500 border-slate-500/20";
    }
  };

  if (loading) {
    return <Loading />;
  }

  return (
    <div className="space-y-8 p-1">
      {/* Header section with modern greeting */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            System Operations
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium">
            Welcome back! Here is a summary of today's fleet activity.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchDashboardData}
            className="px-4 py-2 text-sm font-semibold text-slate-700 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 active:scale-95 transition-all shadow-sm"
          >
            Refresh Data
          </button>
        </div>
      </div>

      {/* Stats Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Vehicles Card */}
        <div className="relative group overflow-hidden bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-900 hover:border-blue-500/20 rounded-2xl p-6 shadow-sm hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-bl-full pointer-events-none group-hover:scale-110 transition-transform duration-300" />
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <p className="text-slate-400 dark:text-slate-500 text-xs font-bold uppercase tracking-wider">
                Total Vehicles
              </p>
              <h3 className="text-3xl font-extrabold text-slate-950 dark:text-white tracking-tight">
                {stats.totalVehicles}
              </h3>
              <p className="text-blue-600 dark:text-blue-400 text-xs font-semibold">
                Approved Fleet Capacity
              </p>
            </div>
            <div className="bg-blue-50 dark:bg-blue-950/50 p-4 rounded-xl text-blue-600 dark:text-blue-400">
              <Truck className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Total Drivers Card */}
        <div className="relative group overflow-hidden bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-900 hover:border-emerald-500/20 rounded-2xl p-6 shadow-sm hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-bl-full pointer-events-none group-hover:scale-110 transition-transform duration-300" />
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <p className="text-slate-400 dark:text-slate-500 text-xs font-bold uppercase tracking-wider">
                Total Drivers
              </p>
              <h3 className="text-3xl font-extrabold text-slate-950 dark:text-white tracking-tight">
                {stats.totalDrivers}
              </h3>
              <p className="text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
                On Duty & Available
              </p>
            </div>
            <div className="bg-emerald-50 dark:bg-emerald-950/50 p-4 rounded-xl text-emerald-600 dark:text-emerald-400">
              <UserCheck className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Total Customers Card */}
        <div className="relative group overflow-hidden bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-900 hover:border-violet-500/20 rounded-2xl p-6 shadow-sm hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300">
          <div className="absolute top-0 right-0 w-24 h-24 bg-violet-500/5 rounded-bl-full pointer-events-none group-hover:scale-110 transition-transform duration-300" />
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <p className="text-slate-400 dark:text-slate-500 text-xs font-bold uppercase tracking-wider">
                Total Customers
              </p>
              <h3 className="text-3xl font-extrabold text-slate-950 dark:text-white tracking-tight">
                {stats.totalCustomers}
              </h3>
              <p className="text-violet-600 dark:text-violet-400 text-xs font-semibold">
                Registered Clients
              </p>
            </div>
            <div className="bg-violet-50 dark:bg-violet-950/50 p-4 rounded-xl text-violet-600 dark:text-violet-400">
              <Users className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Total Trips Card */}
        <div className="relative group overflow-hidden bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-900 hover:border-amber-500/20 rounded-2xl p-6 shadow-sm hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-bl-full pointer-events-none group-hover:scale-110 transition-transform duration-300" />
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <p className="text-slate-400 dark:text-slate-500 text-xs font-bold uppercase tracking-wider">
                Total Shipments
              </p>
              <h3 className="text-3xl font-extrabold text-slate-950 dark:text-white tracking-tight">
                {stats.totalTrips}
              </h3>
              <p className="text-amber-600 dark:text-amber-400 text-xs font-semibold">
                Completed & Ongoing
              </p>
            </div>
            <div className="bg-amber-50 dark:bg-amber-950/50 p-4 rounded-xl text-amber-600 dark:text-amber-400">
              <Briefcase className="w-6 h-6" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Trips Chart */}
        <div className="bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-900 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Trip Operations
              </h3>
              <p className="text-xs font-medium text-slate-400">
                Number of deliveries executed monthly
              </p>
            </div>
            <div className="bg-blue-50 dark:bg-blue-950/40 p-2.5 rounded-xl text-blue-600">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyTripsData} margin={{ left: -15, right: 10 }}>
                <defs>
                  <linearGradient id="colorTrips" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0f172a",
                    border: "none",
                    borderRadius: "12px",
                    color: "#fff",
                    fontSize: "13px",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="trips"
                  stroke="#3b82f6"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#colorTrips)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Vehicle Usage Pie/Donut Chart */}
        <div className="bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-900 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Vehicle Status Distribution
              </h3>
              <p className="text-xs font-medium text-slate-400">
                Real-time active fleet utilization status
              </p>
            </div>
            <div className="bg-violet-50 dark:bg-violet-950/40 p-2.5 rounded-xl text-violet-600">
              <Activity className="w-5 h-5" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
            <div className="h-[250px] relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={getVehicleUsageData()}
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={85}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {getVehicleUsageData().map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#0f172a",
                      border: "none",
                      borderRadius: "12px",
                      color: "#fff",
                      fontSize: "13px",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-2xl font-extrabold text-slate-900 dark:text-white">
                  {stats.totalVehicles}
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-450">
                  Vehicles
                </span>
              </div>
            </div>
            {/* Custom Pie Legend */}
            <div className="space-y-4">
              {getVehicleUsageData().map((entry, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 rounded-xl border border-slate-50 dark:border-slate-900 bg-slate-50/50 dark:bg-slate-950/50">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-3.5 h-3.5 rounded-full"
                      style={{ backgroundColor: entry.color }}
                    />
                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-350">
                      {entry.name}
                    </span>
                  </div>
                  <span className="text-sm font-bold text-slate-900 dark:text-white">
                    {entry.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Secondary Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-900 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Revenue Growth
              </h3>
              <p className="text-xs font-medium text-slate-400">
                Monthly revenue overview in PKR
              </p>
            </div>
            <div className="bg-emerald-50 dark:bg-emerald-950/40 p-2.5 rounded-xl text-emerald-600">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueData} margin={{ left: -10 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0f172a",
                    border: "none",
                    borderRadius: "12px",
                    color: "#fff",
                    fontSize: "13px",
                  }}
                />
                <Bar dataKey="revenue" fill="#10b981" radius={[6, 6, 0, 0]} barSize={36} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Driver Activity / Operations */}
        <div className="bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-900 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
              Driver Operations
            </h3>
            <p className="text-xs font-medium text-slate-400 mb-6">
              Activity breakdown of registered drivers
            </p>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-50 dark:border-slate-900 hover:border-emerald-500/10 hover:bg-slate-50/50 dark:hover:bg-slate-950/50 transition-all">
                <div className="space-y-0.5">
                  <p className="text-sm font-bold text-slate-900 dark:text-white">Active on Trip</p>
                  <p className="text-xs text-slate-400">Currently delivering cargo</p>
                </div>
                <span className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400">
                  {vehicleStats?.inUse || 0}
                </span>
              </div>
              <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-50 dark:border-slate-900 hover:border-blue-500/10 hover:bg-slate-50/50 dark:hover:bg-slate-950/50 transition-all">
                <div className="space-y-0.5">
                  <p className="text-sm font-bold text-slate-900 dark:text-white">Available Duty</p>
                  <p className="text-xs text-slate-400">Waiting for assignment</p>
                </div>
                <span className="text-xl font-extrabold text-blue-600 dark:text-blue-400">
                  {vehicleStats?.available || 0}
                </span>
              </div>
              <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-50 dark:border-slate-900 hover:border-rose-500/10 hover:bg-slate-50/50 dark:hover:bg-slate-950/50 transition-all">
                <div className="space-y-0.5">
                  <p className="text-sm font-bold text-slate-900 dark:text-white">On Leave / Maintenance</p>
                  <p className="text-xs text-slate-400">Inactive temporarily</p>
                </div>
                <span className="text-xl font-extrabold text-slate-550 dark:text-slate-400">
                  {vehicleStats?.maintenance || 0}
                </span>
              </div>
            </div>
          </div>
          <Link
            to="/admin/drivers"
            className="mt-6 flex items-center justify-center gap-2 w-full py-3 bg-slate-50 hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-350 text-sm font-bold rounded-xl transition-all"
          >
            Manage Fleet Drivers
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Live Vehicle Status Table */}
      <div className="bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-900 rounded-2xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Fleet Overview
            </h3>
            <p className="text-xs font-medium text-slate-400">
              Live status and specifications of registered fleet vehicles
            </p>
          </div>
          <Link
            to="/admin/vehicles"
            className="text-blue-600 hover:text-blue-700 text-sm font-bold flex items-center gap-1 hover:underline"
          >
            View Fleet Registry →
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-900 text-xs font-bold text-slate-450 uppercase tracking-wider">
                <th className="py-3 px-4">Vehicle Model</th>
                <th className="py-3 px-4">Plate Number</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-900 text-sm">
              {vehicles.length > 0 ? (
                vehicles.slice(0, 5).map((vehicle) => (
                  <tr
                    key={vehicle._id}
                    className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors"
                  >
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-50 dark:bg-blue-950/40 rounded-xl flex items-center justify-center text-blue-600">
                          <Truck className="w-5 h-5" />
                        </div>
                        <span className="font-bold text-slate-900 dark:text-white">
                          {vehicle.manufacturer} {vehicle.model}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-slate-500 font-mono font-medium">
                      {vehicle.plateNumber}
                    </td>
                    <td className="py-4 px-4 text-slate-600 dark:text-slate-400 capitalize font-medium">
                      {vehicle.type}
                    </td>
                    <td className="py-4 px-4">
                      <span
                        className={`px-3 py-1.5 rounded-full border text-xs font-bold capitalize ${getStatusColor(
                          vehicle.status,
                        )}`}
                      >
                        {vehicle.status.replace("_", " ")}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="py-10 text-center font-medium text-slate-400">
                    No vehicles registered yet in the database.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;

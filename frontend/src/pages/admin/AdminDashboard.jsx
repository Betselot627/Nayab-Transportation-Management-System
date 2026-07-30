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
        { name: "In Use", value: 28, color: "#10b981" },
        { name: "Idle", value: 12, color: "#f59e0b" },
        { name: "Maintenance", value: 5, color: "#ef4444" },
      ];
    }

    return [
      { name: "In Use", value: vehicleStats.inUse || 0, color: "#10b981" },
      {
        name: "Available",
        value: vehicleStats.available || 0,
        color: "#3b82f6",
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
        return "bg-green-100 text-green-800";
      case "idle":
        return "bg-yellow-100 text-yellow-800";
      case "maintenance":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return <Loading />;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">
          Welcome back! Here's what's happening today.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium">
                Total Vehicles
              </p>
              <h3 className="text-3xl font-bold mt-2">{stats.totalVehicles}</h3>
              <p className="text-blue-100 text-xs mt-2">Registered in fleet</p>
            </div>
            <div className="bg-white/20 p-3 rounded-lg">
              <Truck className="w-8 h-8" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm font-medium">
                Total Drivers
              </p>
              <h3 className="text-3xl font-bold mt-2">{stats.totalDrivers}</h3>
              <p className="text-green-100 text-xs mt-2">Active drivers</p>
            </div>
            <div className="bg-white/20 p-3 rounded-lg">
              <UserCheck className="w-8 h-8" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm font-medium">
                Total Customers
              </p>
              <h3 className="text-3xl font-bold mt-2">
                {stats.totalCustomers}
              </h3>
              <p className="text-purple-100 text-xs mt-2">
                Registered customers
              </p>
            </div>
            <div className="bg-white/20 p-3 rounded-lg">
              <Users className="w-8 h-8" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm font-medium">Total Trips</p>
              <h3 className="text-3xl font-bold mt-2">{stats.totalTrips}</h3>
              <p className="text-orange-100 text-xs mt-2">
                Completed & ongoing
              </p>
            </div>
            <div className="bg-white/20 p-3 rounded-lg">
              <Activity className="w-8 h-8" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Monthly Trips */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">
              Monthly Trips
            </h3>
            <TrendingUp className="w-5 h-5 text-green-500" />
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={monthlyTripsData}>
              <defs>
                <linearGradient id="colorTrips" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip />
              <Area
                type="monotone"
                dataKey="trips"
                stroke="#3b82f6"
                fillOpacity={1}
                fill="url(#colorTrips)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Vehicle Usage */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">
              Vehicle Usage
            </h3>
            <Activity className="w-5 h-5 text-blue-500" />
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={getVehicleUsageData()}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) =>
                  `${name} ${(percent * 100).toFixed(0)}%`
                }
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {getVehicleUsageData().map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Revenue Chart */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">
              Revenue Overview
            </h3>
            <DollarSign className="w-5 h-5 text-green-500" />
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip />
              <Bar dataKey="revenue" fill="#10b981" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Driver Activity */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">
              Driver Activity
            </h3>
            <UserCheck className="w-5 h-5 text-purple-500" />
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b">
              <div>
                <p className="font-medium text-gray-900">Active Drivers</p>
                <p className="text-sm text-gray-500">Currently on trips</p>
              </div>
              <span className="text-2xl font-bold text-green-600">
                {vehicleStats?.inUse || 0}
              </span>
            </div>
            <div className="flex items-center justify-between py-3 border-b">
              <div>
                <p className="font-medium text-gray-900">Available Drivers</p>
                <p className="text-sm text-gray-500">Ready for assignment</p>
              </div>
              <span className="text-2xl font-bold text-blue-600">
                {vehicleStats?.available || 0}
              </span>
            </div>
            <div className="flex items-center justify-between py-3">
              <div>
                <p className="font-medium text-gray-900">Maintenance</p>
                <p className="text-sm text-gray-500">Under service</p>
              </div>
              <span className="text-2xl font-bold text-gray-600">
                {vehicleStats?.maintenance || 0}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Vehicle Status Table */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">
            Live Vehicle Status
          </h3>
          <Link
            to="/admin/vehicles"
            className="text-blue-600 hover:text-blue-700 text-sm font-medium"
          >
            View All →
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-semibold text-gray-700">
                  Vehicle Name
                </th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">
                  Plate Number
                </th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">
                  Type
                </th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {vehicles.length > 0 ? (
                vehicles.slice(0, 5).map((vehicle) => (
                  <tr
                    key={vehicle._id}
                    className="border-b border-gray-100 hover:bg-gray-50"
                  >
                    <td className="py-4 px-4">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                          <Truck className="w-5 h-5 text-blue-600" />
                        </div>
                        <span className="font-medium text-gray-900">
                          {vehicle.model} {vehicle.manufacturer}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-gray-600">
                      {vehicle.plateNumber}
                    </td>
                    <td className="py-4 px-4 text-gray-600 capitalize">
                      {vehicle.type}
                    </td>
                    <td className="py-4 px-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(
                          vehicle.status,
                        )}`}
                      >
                        {vehicle.status}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="py-8 text-center text-gray-500">
                    No vehicles registered yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {vehicles.length > 5 && (
          <div className="flex items-center justify-between mt-6">
            <p className="text-sm text-gray-600">
              Showing 5 of {vehicles.length} vehicles
            </p>
            <Link
              to="/admin/vehicles"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
            >
              View All
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;

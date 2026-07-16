import { useState, useEffect } from "react";
import { reportService } from "../../services/reportService";
import { Link } from "react-router-dom";
import {
  Truck,
  Users,
  Package,
  DollarSign,
  TrendingUp,
  AlertCircle,
  Loader,
  ArrowUp,
  ArrowDown,
  Activity,
  CheckCircle,
  Clock,
  XCircle,
} from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts";

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeRange, setTimeRange] = useState("week");

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      const response = await reportService.getDashboardStats();
      setStats(response.data);
    } catch (err) {
      setError("Failed to load dashboard data");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <Loader className="animate-spin h-12 w-12 text-blue-600 mx-auto" />
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg flex items-center gap-2">
          <AlertCircle className="h-5 w-5" />
          <span>{error}</span>
        </div>
      </div>
    );
  }

  const statCards = [
    {
      title: "Total Vehicles",
      value: stats?.overview?.totalVehicles || 0,
      subtitle: `${stats?.overview?.availableVehicles || 0} available`,
      icon: Truck,
      color: "blue",
      bgColor: "bg-blue-50",
      iconColor: "text-blue-600",
      trend: "+12%",
      trendUp: true,
    },
    {
      title: "Total Drivers",
      value: stats?.overview?.totalDrivers || 0,
      subtitle: `${stats?.overview?.availableDrivers || 0} available`,
      icon: Users,
      color: "green",
      bgColor: "bg-green-50",
      iconColor: "text-green-600",
      trend: "+8%",
      trendUp: true,
    },
    {
      title: "Active Shipments",
      value: stats?.overview?.activeShipments || 0,
      subtitle: `${stats?.overview?.totalShipments || 0} total`,
      icon: Package,
      color: "orange",
      bgColor: "bg-orange-50",
      iconColor: "text-orange-600",
      trend: "+23%",
      trendUp: true,
    },
    {
      title: "Total Revenue",
      value: `PKR ${(stats?.overview?.totalRevenue || 0).toLocaleString()}`,
      subtitle: `${stats?.overview?.pendingPayments || 0} pending`,
      icon: DollarSign,
      color: "purple",
      bgColor: "bg-purple-50",
      iconColor: "text-purple-600",
      trend: "+15%",
      trendUp: true,
    },
  ];

  // Prepare chart data
  const revenueData =
    stats?.monthlyRevenue?.map((item) => ({
      month: `${item._id.month}/${item._id.year}`,
      revenue: item.revenue,
      count: item.count,
    })) || [];

  const shipmentStatusData =
    stats?.shipmentsByStatus?.map((item) => ({
      name: item._id,
      value: item.count,
    })) || [];

  const COLORS = [
    "#3B82F6",
    "#10B981",
    "#F59E0B",
    "#EF4444",
    "#8B5CF6",
    "#EC4899",
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Activity className="h-8 w-8 text-blue-600" />
              Admin Dashboard
            </h1>
            <p className="mt-2 text-gray-600">
              Comprehensive overview of your transportation system
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setTimeRange("week")}
              className={`px-4 py-2 rounded-lg transition-colors ${
                timeRange === "week"
                  ? "bg-blue-600 text-white"
                  : "bg-white text-gray-600 hover:bg-gray-50"
              }`}
            >
              Week
            </button>
            <button
              onClick={() => setTimeRange("month")}
              className={`px-4 py-2 rounded-lg transition-colors ${
                timeRange === "month"
                  ? "bg-blue-600 text-white"
                  : "bg-white text-gray-600 hover:bg-gray-50"
              }`}
            >
              Month
            </button>
            <button
              onClick={() => setTimeRange("year")}
              className={`px-4 py-2 rounded-lg transition-colors ${
                timeRange === "year"
                  ? "bg-blue-600 text-white"
                  : "bg-white text-gray-600 hover:bg-gray-50"
              }`}
            >
              Year
            </button>
          </div>
        </div>

        {/* Stats Grid with Animation */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statCards.map((stat, index) => (
            <div
              key={index}
              className="bg-white rounded-xl shadow-sm p-6 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 animate-fadeIn"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`${stat.bgColor} p-3 rounded-lg`}>
                  <stat.icon className={`h-6 w-6 ${stat.iconColor}`} />
                </div>
                <div
                  className={`flex items-center gap-1 text-sm font-semibold ${stat.trendUp ? "text-green-600" : "text-red-600"}`}
                >
                  {stat.trendUp ? (
                    <ArrowUp className="h-4 w-4" />
                  ) : (
                    <ArrowDown className="h-4 w-4" />
                  )}
                  {stat.trend}
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">
                  {stat.title}
                </p>
                <p className="mt-2 text-3xl font-bold text-gray-900">
                  {stat.value}
                </p>
                <p className="mt-2 text-sm text-gray-500">{stat.subtitle}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Revenue Chart */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Revenue Trend (Last 6 Months)
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" stroke="#888" />
                <YAxis stroke="#888" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#fff",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                  }}
                  formatter={(value) => [
                    `PKR ${value.toLocaleString()}`,
                    "Revenue",
                  ]}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#3B82F6"
                  fillOpacity={1}
                  fill="url(#colorRevenue)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Shipment Status Distribution */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Shipment Status Distribution
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={shipmentStatusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) =>
                    `${name}: ${(percent * 100).toFixed(0)}%`
                  }
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {shipmentStatusData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Activity & Shipments */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Shipments */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Recent Shipments
              </h3>
              <Link
                to="/admin/shipments"
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                View all →
              </Link>
            </div>
            <div className="space-y-4">
              {stats?.recentShipments?.slice(0, 5).map((shipment) => (
                <div
                  key={shipment._id}
                  className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0 hover:bg-gray-50 px-2 rounded transition-colors"
                >
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">
                      {shipment.shipmentNumber}
                    </p>
                    <p className="text-sm text-gray-500">
                      {shipment.pickupLocation?.city} →{" "}
                      {shipment.destination?.city}
                    </p>
                  </div>
                  <div>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        shipment.status === "delivered"
                          ? "bg-green-100 text-green-800"
                          : shipment.status === "in_transit"
                            ? "bg-blue-100 text-blue-800"
                            : shipment.status === "pending"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {shipment.status === "delivered" && (
                        <CheckCircle className="h-3 w-3 mr-1" />
                      )}
                      {shipment.status === "in_transit" && (
                        <TrendingUp className="h-3 w-3 mr-1" />
                      )}
                      {shipment.status === "pending" && (
                        <Clock className="h-3 w-3 mr-1" />
                      )}
                      {shipment.status}
                    </span>
                  </div>
                </div>
              ))}
              {(!stats?.recentShipments ||
                stats.recentShipments.length === 0) && (
                <p className="text-gray-500 text-center py-8">
                  No recent shipments
                </p>
              )}
            </div>
          </div>

          {/* Active Trips */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Active Trips
              </h3>
              <Link
                to="/admin/shipments"
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                View all →
              </Link>
            </div>
            <div className="space-y-4">
              {stats?.activeTrips?.slice(0, 5).map((trip) => (
                <div
                  key={trip._id}
                  className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0 hover:bg-gray-50 px-2 rounded transition-colors"
                >
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">
                      {trip.tripNumber}
                    </p>
                    <p className="text-sm text-gray-500">
                      Driver: {trip.driverId?.fullName}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">
                      {trip.vehicleId?.plateNumber}
                    </p>
                    <p className="text-xs text-gray-500">
                      {trip.vehicleId?.model}
                    </p>
                  </div>
                </div>
              ))}
              {(!stats?.activeTrips || stats.activeTrips.length === 0) && (
                <p className="text-gray-500 text-center py-8">
                  No active trips
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4">
          <Link
            to="/admin/vehicles"
            className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl p-6 hover:shadow-lg transition-all transform hover:-translate-y-1"
          >
            <Truck className="h-8 w-8 mb-3" />
            <h4 className="font-semibold text-lg">Manage Vehicles</h4>
            <p className="text-sm text-blue-100 mt-1">View and manage fleet</p>
          </Link>

          <Link
            to="/admin/drivers"
            className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-xl p-6 hover:shadow-lg transition-all transform hover:-translate-y-1"
          >
            <Users className="h-8 w-8 mb-3" />
            <h4 className="font-semibold text-lg">Manage Drivers</h4>
            <p className="text-sm text-green-100 mt-1">
              View and assign drivers
            </p>
          </Link>

          <Link
            to="/admin/shipments"
            className="bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-xl p-6 hover:shadow-lg transition-all transform hover:-translate-y-1"
          >
            <Package className="h-8 w-8 mb-3" />
            <h4 className="font-semibold text-lg">Shipments</h4>
            <p className="text-sm text-orange-100 mt-1">Track all shipments</p>
          </Link>

          <Link
            to="/admin/reports"
            className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-xl p-6 hover:shadow-lg transition-all transform hover:-translate-y-1"
          >
            <DollarSign className="h-8 w-8 mb-3" />
            <h4 className="font-semibold text-lg">Reports</h4>
            <p className="text-sm text-purple-100 mt-1">View analytics</p>
          </Link>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out forwards;
          opacity: 0;
        }
      `}</style>
    </div>
  );
};

export default AdminDashboard;

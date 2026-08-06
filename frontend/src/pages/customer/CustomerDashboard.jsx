import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { shipmentService } from "../../services/shipmentService";
import {
  Package,
  TrendingUp,
  Clock,
  CheckCircle,
  Loader,
  Plus,
  MapPin,
  ArrowRight,
} from "lucide-react";
import { motion } from "framer-motion";

const CustomerDashboard = () => {
  const [shipments, setShipments] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    inTransit: 0,
    delivered: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchShipments();
  }, []);

  const fetchShipments = async () => {
    try {
      setLoading(true);
      const response = await shipmentService.getAllShipments({ limit: 10 });
      setShipments(response.data || []);

      // Calculate stats
      const all = response.data || [];
      setStats({
        total: all.length,
        pending: all.filter((s) => s.status === "pending").length,
        inTransit: all.filter((s) => s.status === "in_transit" || s.status === "assigned" || s.status === "picked_up").length,
        delivered: all.filter((s) => s.status === "delivered" || s.status === "completed").length,
      });
    } catch (err) {
      console.error("Failed to fetch shipments:", err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
      approved: "bg-purple-500/10 text-purple-600 border-purple-500/20",
      assigned: "bg-indigo-500/10 text-indigo-600 border-indigo-500/20",
      picked_up: "bg-violet-500/10 text-violet-600 border-violet-500/20",
      in_transit: "bg-sky-500/10 text-sky-605 border-sky-500/20",
      delivered: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
      completed: "bg-slate-500/10 text-slate-600 border-slate-500/20",
      cancelled: "bg-rose-500/10 text-rose-600 border-rose-500/20",
    };
    return colors[status] || "bg-slate-500/10 text-slate-600 border-slate-500/20";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader className="animate-spin h-8 w-8 text-purple-600" />
      </div>
    );
  }

  return (
    <div className="space-y-8 p-1">
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Customer Shipments
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium">
            Manage your shipment bookings and track live delivery routes.
          </p>
        </div>
        <Link
          to="/customer/book-shipment"
          className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl shadow-lg shadow-purple-500/20 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 shrink-0 text-sm"
        >
          <Plus className="h-5 w-5" />
          Book New Shipment
        </Link>
      </div>

      {/* Stats Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Shipments */}
        <div className="relative group overflow-hidden bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-900 rounded-2xl p-6 shadow-sm hover:shadow-lg transition-all duration-300">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <p className="text-slate-400 dark:text-slate-500 text-xs font-bold uppercase tracking-wider">
                Total Bookings
              </p>
              <h3 className="text-3xl font-extrabold text-slate-950 dark:text-white tracking-tight">
                {stats.total}
              </h3>
              <p className="text-slate-450 text-xs font-medium">All registered orders</p>
            </div>
            <div className="bg-purple-50 dark:bg-purple-950/50 p-4 rounded-xl text-purple-600">
              <Package className="h-6 w-6" />
            </div>
          </div>
        </div>

        {/* Pending Approval */}
        <div className="relative group overflow-hidden bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-900 rounded-2xl p-6 shadow-sm hover:shadow-lg transition-all duration-300">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <p className="text-slate-400 dark:text-slate-500 text-xs font-bold uppercase tracking-wider">
                Pending Approval
              </p>
              <h3 className="text-3xl font-extrabold text-slate-950 dark:text-white tracking-tight">
                {stats.pending}
              </h3>
              <p className="text-yellow-600 text-xs font-semibold">Awaiting admin review</p>
            </div>
            <div className="bg-yellow-50 dark:bg-yellow-950/50 p-4 rounded-xl text-yellow-600">
              <Clock className="h-6 w-6" />
            </div>
          </div>
        </div>

        {/* In Transit */}
        <div className="relative group overflow-hidden bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-900 rounded-2xl p-6 shadow-sm hover:shadow-lg transition-all duration-300">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <p className="text-slate-400 dark:text-slate-500 text-xs font-bold uppercase tracking-wider">
                In Transit
              </p>
              <h3 className="text-3xl font-extrabold text-slate-950 dark:text-white tracking-tight">
                {stats.inTransit}
              </h3>
              <p className="text-indigo-600 text-xs font-semibold">Dispatched & on trip</p>
            </div>
            <div className="bg-indigo-50 dark:bg-indigo-950/50 p-4 rounded-xl text-indigo-600">
              <TrendingUp className="h-6 w-6" />
            </div>
          </div>
        </div>

        {/* Delivered Orders */}
        <div className="relative group overflow-hidden bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-900 rounded-2xl p-6 shadow-sm hover:shadow-lg transition-all duration-300">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <p className="text-slate-400 dark:text-slate-500 text-xs font-bold uppercase tracking-wider">
                Delivered
              </p>
              <h3 className="text-3xl font-extrabold text-slate-950 dark:text-white tracking-tight">
                {stats.delivered}
              </h3>
              <p className="text-emerald-600 text-xs font-semibold">Arrived successfully</p>
            </div>
            <div className="bg-emerald-50 dark:bg-emerald-950/50 p-4 rounded-xl text-emerald-600">
              <CheckCircle className="h-6 w-6" />
            </div>
          </div>
        </div>
      </div>

      {/* Recent Shipments List */}
      <div className="bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-900 rounded-2xl shadow-sm p-6 overflow-hidden">
        <div className="mb-6">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
            Recent Shipment Orders
          </h3>
          <p className="text-xs font-medium text-slate-400">
            Recent cargo shipments you booked through NTMS
          </p>
        </div>

        {shipments.length === 0 ? (
          <div className="text-center py-16 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl space-y-4">
            <Package className="mx-auto h-12 w-12 text-slate-350" />
            <h4 className="text-base font-bold text-slate-900 dark:text-white">
              No Shipments Found
            </h4>
            <p className="text-slate-500 dark:text-slate-400 text-sm max-w-sm mx-auto">
              Get started by booking your very first shipment delivery order.
            </p>
            <Link
              to="/customer/book-shipment"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-sm rounded-xl transition-all shadow-sm"
            >
              <Plus className="h-4 w-4" />
              Book Shipment
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-900 text-xs font-bold text-slate-450 uppercase tracking-wider">
                  <th className="py-3 px-4">Shipment #</th>
                  <th className="py-3 px-4">Route Location</th>
                  <th className="py-3 px-4">Cargo Specifications</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Booking Date</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-900 text-sm">
                {shipments.map((shipment) => (
                  <tr key={shipment._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors">
                    <td className="py-4 px-4 font-bold text-slate-900 dark:text-white">
                      {shipment.shipmentNumber}
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 font-medium">
                        <MapPin className="h-4 w-4 text-slate-400" />
                        <span>
                          {shipment.pickupLocation?.city} → {shipment.destination?.city}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-4 space-y-0.5">
                      <div className="text-slate-900 dark:text-white font-semibold">
                        {shipment.cargoDetails?.type}
                      </div>
                      <div className="text-xs text-slate-400 font-medium">
                        {shipment.cargoDetails?.weight} {shipment.cargoDetails?.unit}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span
                        className={`inline-flex px-3 py-1 text-xs font-bold rounded-full border capitalize ${getStatusColor(shipment.status)}`}
                      >
                        {shipment.status.replace("_", " ")}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-slate-500 font-mono text-xs">
                      {new Date(shipment.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-4 px-4 text-right">
                      <Link
                        to={`/customer/track-shipment?id=${shipment._id}`}
                        className="inline-flex items-center gap-1.5 text-purple-600 hover:text-purple-755 font-bold text-sm"
                      >
                        Track Shipment
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerDashboard;

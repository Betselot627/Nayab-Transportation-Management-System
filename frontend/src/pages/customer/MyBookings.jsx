import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { shipmentService } from "../../services/shipmentService";
import { paymentService } from "../../services/paymentService";
import {
  Package,
  Search,
  Loader,
  MapPin,
  Calendar,
  Eye,
  ArrowRight,
  CreditCard,
  FileText,
  CheckCircle,
  ArrowUpRight,
} from "lucide-react";
import { motion } from "framer-motion";
import ReceiptModal from "../../components/payment/ReceiptModal";
import toast, { Toaster } from "react-hot-toast";

const MyBookings = () => {
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [initializingId, setInitializingId] = useState(null);
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);

  useEffect(() => {
    fetchShipments();
  }, []);

  const fetchShipments = async () => {
    try {
      setLoading(true);
      const response = await shipmentService.getAllShipments();
      setShipments(response.data || []);
    } catch (err) {
      console.error("Failed to fetch shipments:", err);
      toast.error("Failed to load bookings");
    } finally {
      setLoading(false);
    }
  };

  const handlePayNow = async (shipmentId) => {
    try {
      setInitializingId(shipmentId);
      const res = await paymentService.initializePayment(shipmentId);
      if (res && res.checkoutUrl) {
        toast.success("Redirecting to Chapa checkout...");
        window.location.href = res.checkoutUrl;
      } else {
        toast.error("Failed to retrieve checkout URL");
      }
    } catch (err) {
      console.error("Payment initialization error:", err);
      toast.error(err?.response?.data?.message || "Failed to initialize payment");
    } finally {
      setInitializingId(null);
    }
  };

  const handleOpenReceipt = async (shipment) => {
    try {
      // Find receipt by shipment ID
      const res = await paymentService.getReceipt(shipment._id);
      if (res && res.data) {
        setSelectedReceipt(res.data);
        setIsReceiptOpen(true);
      } else {
        toast.error("Receipt data not found");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load receipt");
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: "bg-yellow-500/15 text-yellow-600 dark:text-yellow-400 border-yellow-500/20",
      approved: "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/20",
      assigned: "bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border-indigo-500/20",
      picked_up: "bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/20",
      in_transit: "bg-sky-500/15 text-sky-600 dark:text-sky-400 border-sky-500/20",
      delivered: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
      completed: "bg-slate-500/15 text-slate-600 dark:text-slate-400 border-slate-500/20",
      cancelled: "bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/20",
    };
    return colors[status] || "bg-gray-500/15 text-gray-600 dark:text-gray-400 border-gray-500/20";
  };

  const getPaymentStatusBadge = (status) => {
    const s = (status || "UNPAID").toUpperCase();
    if (s === "PAID") {
      return "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/20";
    }
    if (s === "PENDING") {
      return "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/20";
    }
    if (s === "FAILED") {
      return "bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/20";
    }
    return "bg-slate-500/15 text-slate-500 dark:text-slate-400 border-slate-500/20";
  };

  const filteredShipments = shipments.filter((shipment) => {
    const matchesSearch = (shipment.shipmentNumber || "")
      .toLowerCase()
      .includes(searchTerm.toLowerCase());

    const matchesFilter =
      filterStatus === "all" ||
      shipment.status === filterStatus;

    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-6 p-1 max-w-6xl mx-auto">
      <Toaster position="top-right" />
      <ReceiptModal
        isOpen={isReceiptOpen}
        onClose={() => setIsReceiptOpen(false)}
        receipt={selectedReceipt}
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            My Bookings
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm font-medium mt-0.5">
            View, track, and pay for all your transportation bookings.
          </p>
        </div>
        <Link
          to="/customer/book-shipment"
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-md shadow-purple-500/20 transition self-start sm:self-auto"
        >
          Book New Shipment
        </Link>
      </div>

      {/* Search & Filter */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 shadow-sm border border-slate-200/80 dark:border-slate-800 flex flex-col md:flex-row gap-4 items-stretch justify-between transition-colors">
        <div className="flex-1 relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search by tracking number (SHP-...)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all text-slate-900 dark:text-white placeholder-slate-400"
          />
        </div>

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all text-slate-900 dark:text-white font-medium cursor-pointer"
        >
          <option value="all">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="assigned">Assigned</option>
          <option value="in_transit">In Transit</option>
          <option value="delivered">Delivered</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {/* Bookings List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader className="animate-spin h-8 w-8 text-purple-600" />
        </div>
      ) : filteredShipments.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-12 text-center space-y-4">
          <Package className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto" />
          <h3 className="text-base font-bold text-slate-900 dark:text-white">No Bookings Found</h3>
          <p className="text-slate-500 dark:text-slate-400 text-xs max-w-sm mx-auto">
            You haven't placed any shipment bookings matching the search criteria.
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden transition-colors">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-200/80 dark:border-slate-800">
                <tr>
                  <th className="py-3.5 px-5">Shipment #</th>
                  <th className="py-3.5 px-5">Route</th>
                  <th className="py-3.5 px-5">Pricing (ETB)</th>
                  <th className="py-3.5 px-5">Payment</th>
                  <th className="py-3.5 px-5">Shipment Status</th>
                  <th className="py-3.5 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredShipments.map((shipment) => {
                  const finalPrice = shipment.finalPrice || shipment.pricing?.totalAmount || 0;
                  const estimatedPrice = shipment.pricing?.baseAmount || 0;
                  const isPaid = (shipment.paymentStatus || "").toUpperCase() === "PAID";
                  const canPay = !isPaid && finalPrice > 0;

                  return (
                    <tr key={shipment._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition">
                      <td className="py-4 px-5">
                        <Link
                          to={`/customer/shipment-details/${shipment._id}`}
                          className="font-bold font-mono text-purple-600 dark:text-purple-400 hover:underline block"
                        >
                          {shipment.shipmentNumber}
                        </Link>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {new Date(shipment.createdAt).toLocaleDateString()}
                        </span>
                      </td>

                      <td className="py-4 px-5">
                        <div className="flex items-center gap-1 font-semibold text-slate-800 dark:text-slate-200">
                          <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                          <span>
                            {shipment.pickupLocation?.city} → {shipment.destination?.city}
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-400">
                          {shipment.cargoDetails?.type} ({shipment.cargoDetails?.weight} {shipment.cargoDetails?.unit})
                        </span>
                      </td>

                      <td className="py-4 px-5">
                        {finalPrice > 0 ? (
                          <div>
                            <div className="font-extrabold text-slate-900 dark:text-white font-mono text-sm">
                              {Number(finalPrice).toLocaleString()} ETB
                            </div>
                            {estimatedPrice > 0 && estimatedPrice !== finalPrice && (
                              <div className="text-[10px] text-slate-400 line-through">
                                Est: {Number(estimatedPrice).toLocaleString()} ETB
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="text-slate-400 italic">
                            Est: {Number(estimatedPrice).toLocaleString()} ETB (Pending Admin Review)
                          </div>
                        )}
                      </td>

                      <td className="py-4 px-5">
                        <span
                          className={`inline-flex px-2.5 py-1 text-[11px] font-extrabold rounded-full border capitalize ${getPaymentStatusBadge(
                            shipment.paymentStatus
                          )}`}
                        >
                          {shipment.paymentStatus || "UNPAID"}
                        </span>
                      </td>

                      <td className="py-4 px-5">
                        <span
                          className={`inline-flex px-2.5 py-1 text-[11px] font-bold rounded-full border capitalize ${getStatusColor(
                            shipment.status
                          )}`}
                        >
                          {shipment.status.replace("_", " ")}
                        </span>
                      </td>

                      <td className="py-4 px-5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {canPay && (
                            <button
                              onClick={() => handlePayNow(shipment._id)}
                              disabled={initializingId === shipment._id}
                              className="px-3.5 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl font-bold flex items-center gap-1 shadow-xs transition cursor-pointer text-xs disabled:opacity-50"
                            >
                              {initializingId === shipment._id ? (
                                <Loader className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <>
                                  <CreditCard className="w-3.5 h-3.5" />
                                  <span>PAY NOW</span>
                                </>
                              )}
                            </button>
                          )}

                          {isPaid && (
                            <button
                              onClick={() => handleOpenReceipt(shipment)}
                              className="px-3 py-1.5 bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-900/40 rounded-xl font-bold flex items-center gap-1 border border-purple-200 dark:border-purple-800/40 transition cursor-pointer text-xs"
                            >
                              <FileText className="w-3.5 h-3.5" />
                              Receipt
                            </button>
                          )}

                          <Link
                            to={`/customer/track-shipment?id=${shipment._id}`}
                            className="p-1.5 text-purple-600 dark:text-purple-400 hover:text-purple-700 font-bold text-xs inline-flex items-center"
                            title="Track Live"
                          >
                            <ArrowRight className="w-4 h-4" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyBookings;
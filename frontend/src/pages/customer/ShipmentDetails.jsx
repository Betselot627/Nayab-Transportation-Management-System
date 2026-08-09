import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { shipmentService } from "../../services/shipmentService";
import { paymentService } from "../../services/paymentService";
import {
  MapPin,
  Calendar,
  Clock,
  Truck,
  Package,
  ArrowLeft,
  User,
  Phone,
  Eye,
  TrendingUp,
  Mail,
  ShieldCheck,
  Navigation,
  CreditCard,
  FileText,
  Loader,
  CheckCircle,
} from "lucide-react";
import { motion } from "framer-motion";
import ReceiptModal from "../../components/payment/ReceiptModal";
import toast, { Toaster } from "react-hot-toast";

const ShipmentDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [shipment, setShipment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [initializingPayment, setInitializingPayment] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);

  // Set up 5-second polling interval
  useEffect(() => {
    fetchShipmentDetails(true);
    const interval = setInterval(() => {
      fetchShipmentDetails(false);
    }, 5000);

    return () => clearInterval(interval);
  }, [id]);

  const fetchShipmentDetails = async (showLoader = false) => {
    try {
      if (showLoader) setLoading(true);
      const res = await shipmentService.getShipmentById(id);
      if (res && res.data) {
        setShipment(res.data);
      }
    } catch (error) {
      console.error(error);
      if (showLoader) toast.error("Failed to load shipment details");
    } finally {
      if (showLoader) setLoading(false);
    }
  };

  const handlePayNow = async () => {
    try {
      setInitializingPayment(true);
      const res = await paymentService.initializePayment(shipment._id);
      if (res && res.checkoutUrl) {
        toast.success("Redirecting to Chapa checkout...");
        window.location.href = res.checkoutUrl;
      } else {
        toast.error("Failed to retrieve checkout URL");
      }
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.message || "Failed to initialize payment");
    } finally {
      setInitializingPayment(false);
    }
  };

  const handleOpenReceipt = async () => {
    try {
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

  const getStatusBadge = (status) => {
    const colors = {
      pending: "bg-yellow-500/15 text-yellow-600 dark:text-yellow-400 border-yellow-500/20",
      approved: "bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/20",
      assigned: "bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border-indigo-500/20",
      picked_up: "bg-violet-500/15 text-violet-600 dark:text-violet-400 border-violet-500/20",
      in_transit: "bg-sky-500/15 text-sky-600 dark:text-sky-400 border-sky-500/20",
      delivered: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
      completed: "bg-slate-500/15 text-slate-600 dark:text-slate-400 border-slate-500/20",
      cancelled: "bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/20",
    };
    return colors[status] || "bg-slate-500/15 text-slate-600 dark:text-slate-400 border-slate-500/20";
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

  if (loading && !shipment) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-2 border-t-transparent border-purple-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (!shipment) {
    return (
      <div className="text-center py-16 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6">
        <Package className="mx-auto h-12 w-12 text-slate-400 mb-3" />
        <h3 className="text-base font-bold text-slate-900 dark:text-white">Shipment Not Found</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Unable to locate the specified shipment.</p>
        <button
          onClick={() => navigate("/customer/my-bookings")}
          className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-xl text-xs font-bold"
        >
          Back to Bookings
        </button>
      </div>
    );
  }

  const finalPrice = shipment.finalPrice || shipment.pricing?.totalAmount || 0;
  const estimatedPrice = shipment.pricing?.baseAmount || 0;
  const isPaid = (shipment.paymentStatus || "").toUpperCase() === "PAID";
  const canPay = !isPaid && finalPrice > 0;

  return (
    <div className="space-y-6 p-1 max-w-4xl mx-auto">
      <Toaster position="top-right" />
      <ReceiptModal
        isOpen={isReceiptOpen}
        onClose={() => setIsReceiptOpen(false)}
        receipt={selectedReceipt}
      />

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white font-mono">
              {shipment.shipmentNumber}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">Detailed Booking Overview</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className={`px-3 py-1 rounded-full text-xs font-bold border capitalize ${getStatusBadge(shipment.status)}`}>
            {shipment.status.replace("_", " ")}
          </span>
          <Link
            to={`/customer/track-shipment?id=${shipment._id}`}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl transition shadow-sm"
          >
            Live Tracking
          </Link>
        </div>
      </div>

      {/* Main Details Grid */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 sm:p-8 shadow-sm space-y-6 transition-colors">
        {/* Route Card */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800">
            <div className="flex items-center gap-2 mb-1.5">
              <div className="p-1.5 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 rounded-lg">
                <MapPin className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold uppercase text-slate-400">Pickup Details</span>
            </div>
            <p className="font-bold text-slate-900 dark:text-white text-sm">{shipment.pickupLocation?.city}</p>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">{shipment.pickupLocation?.address}</p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800">
            <div className="flex items-center gap-2 mb-1.5">
              <div className="p-1.5 bg-purple-500/15 text-purple-600 dark:text-purple-400 rounded-lg">
                <MapPin className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold uppercase text-slate-400">Destination</span>
            </div>
            <p className="font-bold text-slate-900 dark:text-white text-sm">{shipment.destination?.city}</p>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">{shipment.destination?.address}</p>
          </div>
        </div>

        {/* Financial & Payment Card */}
        <div className="border-t border-slate-100 dark:border-slate-800 pt-6">
          <h3 className="text-base font-bold text-slate-900 dark:text-white mb-3">
            Payment & Pricing Summary
          </h3>
          <div className="bg-gradient-to-br from-purple-950/20 via-slate-900 to-slate-950 border border-purple-900/40 rounded-2xl p-5 sm:p-6 text-white space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400">Estimated Price</span>
                <p className="text-sm font-semibold font-mono text-slate-300 mt-0.5">
                  {estimatedPrice > 0 ? `${Number(estimatedPrice).toLocaleString()} ETB` : "N/A"}
                </p>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-purple-400">Confirmed Final Price</span>
                <p className="text-xl font-extrabold font-mono text-white mt-0.5">
                  {finalPrice > 0 ? `${Number(finalPrice).toLocaleString()} ETB` : "Pending Confirmation"}
                </p>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400">Payment Status</span>
                <div className="mt-1">
                  <span
                    className={`inline-flex px-3 py-1 text-xs font-extrabold rounded-full border capitalize ${getPaymentStatusBadge(
                      shipment.paymentStatus
                    )}`}
                  >
                    {shipment.paymentStatus || "UNPAID"}
                  </span>
                </div>
              </div>
            </div>

            {/* Action Bar inside Payment Box */}
            <div className="border-t border-slate-800 pt-4 flex flex-col sm:flex-row items-center justify-between gap-3">
              <p className="text-xs text-slate-400">
                {isPaid
                  ? "This shipment has been paid in full via Chapa."
                  : canPay
                  ? "Final price confirmed. Click Pay Now to proceed to Chapa secure checkout."
                  : "Awaiting final transportation price approval from Dispatcher/Admin."}
              </p>

              {canPay && (
                <button
                  onClick={handlePayNow}
                  disabled={initializingPayment}
                  className="w-full sm:w-auto px-7 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-lg shadow-purple-500/25 cursor-pointer disabled:opacity-50"
                >
                  {initializingPayment ? (
                    <Loader className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <CreditCard className="w-4 h-4" />
                      <span>PAY NOW ({Number(finalPrice).toLocaleString()} ETB)</span>
                    </>
                  )}
                </button>
              )}

              {isPaid && (
                <button
                  onClick={handleOpenReceipt}
                  className="w-full sm:w-auto px-5 py-2.5 bg-purple-900/60 hover:bg-purple-800 text-purple-300 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 border border-purple-700/50 cursor-pointer"
                >
                  <FileText className="w-4 h-4" />
                  View Payment Receipt
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Cargo Details */}
        <div className="border-t border-slate-100 dark:border-slate-800 pt-6">
          <h3 className="text-base font-bold text-slate-900 dark:text-white mb-3">Cargo Information</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 dark:bg-slate-800/30 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Type</p>
              <p className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white mt-0.5">{shipment.cargoDetails?.type}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Weight</p>
              <p className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white mt-0.5">
                {shipment.cargoDetails?.weight} {shipment.cargoDetails?.unit}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Quantity</p>
              <p className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white mt-0.5">{shipment.cargoDetails?.quantity || 1} units</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Total Amount</p>
              <p className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white mt-0.5">
                {Number(finalPrice || estimatedPrice || 0).toLocaleString()} ETB
              </p>
            </div>
          </div>
        </div>

        {/* Assigned Crew */}
        {shipment.driverId && (
          <div className="border-t border-slate-100 dark:border-slate-800 pt-6">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-3">Assigned Crew</h3>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900 dark:text-white">{shipment.driverId.fullName}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{shipment.driverId.userId?.phone || shipment.driverId.phone || "No phone"}</p>
                </div>
              </div>

              {shipment.vehicleId && (
                <div className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                  Vehicle: <span className="font-bold text-slate-900 dark:text-white">{shipment.vehicleId.plateNumber}</span> ({shipment.vehicleId.manufacturer} {shipment.vehicleId.model})
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ShipmentDetails;

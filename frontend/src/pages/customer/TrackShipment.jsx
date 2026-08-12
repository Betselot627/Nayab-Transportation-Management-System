import React, { useState, useEffect } from "react";
import { useSearchParams, useParams, useNavigate } from "react-router-dom";
import { shipmentService } from "../../services/shipmentService";
import {
  MapPin,
  Search,
  Loader,
  Package,
  CheckCircle,
  Clock,
  TrendingUp,
  User,
  Phone,
  Truck,
  Mail,
  Navigation,
  RefreshCw,
  ArrowLeft,
} from "lucide-react";
import { motion } from "framer-motion";
import ShipmentTimeline from "../../components/common/ShipmentTimeline";
import toast, { Toaster } from "react-hot-toast";

const TrackShipment = () => {
  const [searchParams] = useSearchParams();
  const { id: paramId } = useParams();
  const navigate = useNavigate();
  const [trackingNumber, setTrackingNumber] = useState("");
  const [shipment, setShipment] = useState(null);
  const [loading, setLoading] = useState(false);

  // Auto-track if URL query parameter 'id' or route param ':id' is set
  useEffect(() => {
    const idToTrack = searchParams.get("id") || paramId;
    if (idToTrack) {
      autoTrack(idToTrack, true);
    }
  }, [searchParams, paramId]);

  // Set up visibility-aware 15-second polling interval if an active shipment is loaded
  useEffect(() => {
    if (!shipment?._id) return;
    // If completed or cancelled, no need for active live polling
    if (["delivered", "completed", "cancelled"].includes(shipment.status)) return;

    const interval = setInterval(() => {
      if (!document.hidden) {
        autoTrack(shipment._id, false);
      }
    }, 15000);

    return () => clearInterval(interval);
  }, [shipment?._id, shipment?.status]);

  const autoTrack = async (id, showLoader = false) => {
    try {
      if (showLoader) setLoading(true);
      const res = await shipmentService.getShipmentById(id, { force: showLoader, ttl: 15000 });
      if (res && res.data) {
        setShipment(res.data);
        setTrackingNumber(res.data.shipmentNumber || "");
      }
    } catch (err) {
      console.error(err);
      if (showLoader) toast.error("Failed to fetch tracking details");
    } finally {
      if (showLoader) setLoading(false);
    }
  };

  const handleTrack = async (e) => {
    e.preventDefault();
    if (!trackingNumber.trim()) {
      toast.error("Please enter a tracking number");
      return;
    }

    try {
      setLoading(true);
      const trimmed = trackingNumber.trim();
      const response = await shipmentService.getAllShipments({ search: trimmed, limit: 10 }, { force: true });
      const found = response.data?.find(
        (s) =>
          s.shipmentNumber?.toLowerCase() === trimmed.toLowerCase() ||
          String(s._id) === trimmed
      ) || response.data?.[0];

      if (found) {
        await autoTrack(found._id, true);
        toast.success("Shipment found!");
      } else {
        toast.error("Shipment not found with given tracking ID");
        setShipment(null);
      }
    } catch (err) {
      toast.error("Failed to track shipment");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const colors = {
      pending: "bg-yellow-500/15 text-yellow-600 dark:text-yellow-400 border-yellow-500/20",
      approved: "bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/20",
      assigned: "bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border-indigo-500/20",
      picked_up: "bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/20",
      in_transit: "bg-sky-500/15 text-sky-600 dark:text-sky-400 border-sky-500/20",
      arrived: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/20",
      delivered: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
      completed: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
      cancelled: "bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/20",
    };
    return colors[status] || "bg-slate-500/15 text-slate-600 dark:text-slate-400 border-slate-500/20";
  };

  return (
    <div className="space-y-6 p-2 sm:p-4 max-w-5xl mx-auto min-h-screen text-slate-900 dark:text-white transition-colors">
      <Toaster position="top-right" />

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-tr from-purple-600 to-indigo-600 rounded-2xl mb-3 shadow-lg shadow-purple-500/25 text-white">
          <MapPin className="h-7 w-7" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
          Track Your Shipment
        </h1>
        <p className="mt-1 text-slate-500 dark:text-slate-400 text-sm font-medium">
          Monitor real-time status updates, driver location, and delivery milestone timeline.
        </p>
      </motion.div>

      {/* Search Bar Form */}
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 sm:p-6 shadow-sm transition-colors"
      >
        <form onSubmit={handleTrack} className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={trackingNumber}
              onChange={(e) => setTrackingNumber(e.target.value)}
              placeholder="Enter tracking number (e.g., SHP-...)"
              className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none text-sm transition-all placeholder-slate-400"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full sm:w-auto px-7 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl font-bold transition-all shadow-md shadow-purple-500/20 disabled:opacity-50 flex items-center justify-center text-sm cursor-pointer shrink-0"
          >
            {loading ? <Loader className="animate-spin h-4 w-4" /> : "Track Live"}
          </button>
        </form>
      </motion.div>

      {/* Tracking Result View */}
      {shipment && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Top Banner Card */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Tracking Number
              </span>
              <h2 className="text-xl sm:text-2xl font-extrabold font-mono text-slate-900 dark:text-white">
                {shipment.shipmentNumber}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Booked on {new Date(shipment.createdAt).toLocaleDateString()}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => autoTrack(shipment._id, true)}
                title="Refresh Live Status"
                className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition"
              >
                <RefreshCw className="w-4 h-4" />
              </button>

              <span
                className={`inline-flex px-4 py-1.5 rounded-full text-xs font-bold capitalize border ${getStatusBadge(
                  shipment.status
                )}`}
              >
                {shipment.status.replace("_", " ")}
              </span>
            </div>
          </div>

          {/* 5-Stage Live Timeline (Strict Booked -> Picked Up -> In Transit -> Arrived -> Delivered) */}
          <ShipmentTimeline
            shipment={shipment}
            currentStatus={shipment.status}
            isDriver={false}
            showDetailsCard={true}
          />

          {/* Cargo Details & Route Specifications */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 dark:border-slate-800 pb-3">
              Cargo & Financial Specifications
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase">Cargo Type</p>
                <p className="font-extrabold text-sm mt-0.5">{shipment.cargoDetails?.type || "General"}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase">Weight</p>
                <p className="font-extrabold text-sm mt-0.5">
                  {shipment.cargoDetails?.weight} {shipment.cargoDetails?.unit || "kg"}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase">Quantity</p>
                <p className="font-extrabold text-sm mt-0.5">
                  {shipment.cargoDetails?.quantity || 1} units
                </p>
              </div>
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase">Total Amount</p>
                <p className="font-extrabold text-sm mt-0.5 font-mono text-purple-600 dark:text-purple-400">
                  {(shipment.finalPrice || shipment.pricing?.totalAmount || 0).toLocaleString()} ETB
                </p>
              </div>
            </div>

            {shipment.notes && (
              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200/60 dark:border-slate-800 text-xs italic text-slate-600 dark:text-slate-400 mt-2">
                Special Instructions: "{shipment.notes}"
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Empty State */}
      {!shipment && !loading && (
        <div className="text-center py-16 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 transition-colors">
          <Package className="mx-auto h-12 w-12 text-slate-300 dark:text-slate-700 mb-3" />
          <h3 className="text-base font-bold text-slate-900 dark:text-white">Ready to Track</h3>
          <p className="text-slate-500 dark:text-slate-400 text-xs max-w-sm mx-auto mt-1">
            Enter your shipment booking tracking number in the search bar above to view real-time location and timeline progress.
          </p>
        </div>
      )}
    </div>
  );
};

export default TrackShipment;

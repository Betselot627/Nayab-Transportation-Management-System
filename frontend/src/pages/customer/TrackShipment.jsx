import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
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
} from "lucide-react";
import { motion } from "framer-motion";
import toast, { Toaster } from "react-hot-toast";

const TrackShipment = () => {
  const [searchParams] = useSearchParams();
  const [trackingNumber, setTrackingNumber] = useState("");
  const [shipment, setShipment] = useState(null);
  const [loading, setLoading] = useState(false);

  // Auto-track if URL query parameter 'id' is set
  useEffect(() => {
    const idParam = searchParams.get("id");
    if (idParam) {
      autoTrack(idParam, true);
    }
  }, [searchParams]);

  // Set up 5-second polling interval if a shipment is loaded
  useEffect(() => {
    if (!shipment) return;

    const interval = setInterval(() => {
      autoTrack(shipment._id, false);
    }, 5000);

    return () => clearInterval(interval);
  }, [shipment?._id]);

  const autoTrack = async (id, showLoader = false) => {
    try {
      if (showLoader) setLoading(true);
      const res = await shipmentService.getShipmentById(id);
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
      const response = await shipmentService.getAllShipments();
      const found = response.data?.find(
        (s) => s.shipmentNumber?.toLowerCase() === trackingNumber.trim().toLowerCase()
      );

      if (found) {
        await autoTrack(found._id, true);
        toast.success("Shipment found!");
      } else {
        toast.error("Shipment not found");
        setShipment(null);
      }
    } catch (err) {
      toast.error("Failed to track shipment");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    if (status === "delivered" || status === "completed")
      return <CheckCircle className="h-5 w-5 text-white" />;
    if (status === "in_transit") return <TrendingUp className="h-5 w-5 text-white" />;
    return <Clock className="h-5 w-5 text-white" />;
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

  const getSimulatedLocation = () => {
    if (!shipment) return "N/A";
    const status = shipment.status;
    if (status === "pending" || status === "approved") {
      return "Warehouse: Pending Driver Pickup";
    }
    if (status === "assigned") {
      return `Awaiting dispatch at ${shipment.pickupLocation?.city || "Origin"} Hub`;
    }
    if (status === "picked_up") {
      return `Loaded cargo at ${shipment.pickupLocation?.city || "Origin"} - Awaiting departure`;
    }
    if (status === "in_transit") {
      return `En route between ${shipment.pickupLocation?.city || "Origin"} and ${shipment.destination?.city || "Destination"}`;
    }
    if (status === "delivered" || status === "completed") {
      return `Delivered at Destination: ${shipment.destination?.address || shipment.destination?.city}`;
    }
    return "Status: Processing Hub";
  };

  const getProgressPercentage = () => {
    if (!shipment) return 0;
    const status = shipment.status;
    if (status === "pending" || status === "approved") return 5;
    if (status === "assigned") return 25;
    if (status === "picked_up") return 50;
    if (status === "in_transit") return 75;
    if (status === "delivered" || status === "completed") return 100;
    return 10;
  };

  return (
    <div className="space-y-6 p-1 max-w-4xl mx-auto">
      <Toaster position="top-right" />

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <div className="inline-flex items-center justify-center w-14 h-14 bg-purple-600 dark:bg-purple-700 rounded-2xl mb-3 shadow-lg shadow-purple-500/20 text-white">
          <MapPin className="h-7 w-7" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Track Your Shipment
        </h1>
        <p className="mt-1 text-slate-500 dark:text-slate-400 text-sm font-medium">
          Enter your tracking number to monitor live delivery status and route progress.
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
            className="w-full sm:w-auto px-7 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold transition-all shadow-md shadow-purple-500/20 disabled:opacity-50 flex items-center justify-center text-sm cursor-pointer shrink-0"
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
          className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 sm:p-8 shadow-sm space-y-6 sm:space-y-8 transition-colors"
        >
          {/* Top Title & Status */}
          <div className="border-b border-slate-100 dark:border-slate-800 pb-5 sm:pb-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Shipment Number</span>
                <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white font-mono tracking-tight">
                  {shipment.shipmentNumber}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Booked on {new Date(shipment.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div>
                <span
                  className={`inline-flex px-3.5 py-1.5 rounded-full text-xs font-bold capitalize border ${getStatusBadge(
                    shipment.status
                  )}`}
                >
                  {shipment.status.replace("_", " ")}
                </span>
              </div>
            </div>
          </div>

          {/* Live GPS Tracker Panel */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 sm:p-6 text-white space-y-4 shadow-inner">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Navigation className="w-4 h-4 text-purple-400 animate-pulse shrink-0" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Live Dispatch Status
                </span>
              </div>
              <span className="text-[11px] font-mono text-purple-400 bg-purple-950/60 px-2 py-0.5 rounded border border-purple-800/40">
                {getProgressPercentage()}% Completed
              </span>
            </div>

            <div className="space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 text-xs">
                <span className="text-slate-400">Current Position:</span>
                <span className="text-white font-semibold">{getSimulatedLocation()}</span>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                <motion.div
                  className="bg-gradient-to-r from-purple-500 via-indigo-500 to-purple-600 h-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${getProgressPercentage()}%` }}
                  transition={{ duration: 0.8 }}
                />
              </div>

              <div className="flex justify-between text-[10px] text-slate-400 font-bold uppercase pt-1">
                <span>Pickup ({shipment.pickupLocation?.city || "Origin"})</span>
                <span className="hidden sm:inline">En Route</span>
                <span>Destination ({shipment.destination?.city || "Destination"})</span>
              </div>
            </div>
          </div>

          {/* Assigned Driver & Vehicle Section */}
          {shipment.driverId && (
            <div className="border-t border-slate-100 dark:border-slate-800 pt-6">
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mb-4">
                Assigned Delivery Crew
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 p-4 sm:p-5 rounded-2xl">
                {/* Driver Card */}
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl overflow-hidden bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold text-base shrink-0 border border-purple-500/20">
                    {shipment.driverId.userId?.profileImage ? (
                      <img
                        src={shipment.driverId.userId.profileImage}
                        alt={shipment.driverId.fullName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="w-6 h-6" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">
                      Driver
                    </p>
                    <p className="font-bold text-slate-900 dark:text-white text-sm truncate">
                      {shipment.driverId.fullName || shipment.driverId.user?.name}
                    </p>
                    <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400 text-xs mt-0.5">
                      <Phone className="w-3.5 h-3.5 shrink-0 text-purple-500" />
                      <span className="truncate">{shipment.driverId.userId?.phone || shipment.driverId.phone || "No phone"}</span>
                    </div>
                  </div>
                </div>

                {/* Vehicle Card */}
                {shipment.vehicleId ? (
                  <div className="flex items-center gap-3.5 border-t md:border-t-0 md:border-l border-slate-200/80 dark:border-slate-800 pt-3 md:pt-0 md:pl-4">
                    <div className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 border border-blue-500/20">
                      <Truck className="w-6 h-6" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">
                        Assigned Vehicle
                      </p>
                      <p className="font-bold text-slate-900 dark:text-white text-sm truncate">
                        {shipment.vehicleId.manufacturer} {shipment.vehicleId.model}
                      </p>
                      <p className="text-xs text-slate-600 dark:text-slate-400 font-mono mt-0.5">
                        Plate: {shipment.vehicleId.plateNumber} ({shipment.vehicleId.type})
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center border-t md:border-t-0 md:border-l border-slate-200/80 dark:border-slate-800 pt-3 md:pt-0 md:pl-4">
                    <p className="text-xs text-slate-400 italic">Vehicle details pending assignment.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Route Locations */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-slate-100 dark:border-slate-800 pt-6">
            <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800">
              <div className="flex items-center gap-2 mb-2">
                <div className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 p-1.5 rounded-lg">
                  <MapPin className="h-4 w-4" />
                </div>
                <span className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400">
                  Pickup Location
                </span>
              </div>
              <p className="font-bold text-slate-900 dark:text-white text-sm">
                {shipment.pickupLocation?.city}
              </p>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                {shipment.pickupLocation?.address || "Address details on record"}
              </p>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800">
              <div className="flex items-center gap-2 mb-2">
                <div className="bg-purple-500/15 text-purple-600 dark:text-purple-400 p-1.5 rounded-lg">
                  <MapPin className="h-4 w-4" />
                </div>
                <span className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400">
                  Delivery Destination
                </span>
              </div>
              <p className="font-bold text-slate-900 dark:text-white text-sm">
                {shipment.destination?.city}
              </p>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                {shipment.destination?.address || "Address details on record"}
              </p>
            </div>
          </div>

          {/* Cargo Specifications */}
          <div className="border-t border-slate-100 dark:border-slate-800 pt-6">
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mb-4">
              Cargo Specifications
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 border border-slate-200/80 dark:border-slate-800 p-4 rounded-2xl bg-slate-50/60 dark:bg-slate-800/30">
              <div>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase">Cargo Type</p>
                <p className="font-semibold text-slate-900 dark:text-white text-xs sm:text-sm mt-0.5">
                  {shipment.cargoDetails?.type}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase">Weight</p>
                <p className="font-semibold text-slate-900 dark:text-white text-xs sm:text-sm mt-0.5">
                  {shipment.cargoDetails?.weight} {shipment.cargoDetails?.unit}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase">Quantity</p>
                <p className="font-semibold text-slate-900 dark:text-white text-xs sm:text-sm mt-0.5">
                  {shipment.cargoDetails?.quantity || 1} units
                </p>
              </div>
              <div>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase">Price</p>
                <p className="font-semibold text-slate-900 dark:text-white text-xs sm:text-sm mt-0.5">
                  PKR {shipment.pricing?.totalAmount?.toLocaleString() || 0}
                </p>
              </div>
            </div>
          </div>

          {/* Status History Timeline */}
          {shipment.statusHistory && shipment.statusHistory.length > 0 && (
            <div className="border-t border-slate-100 dark:border-slate-800 pt-6">
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mb-5">
                Status Timeline
              </h3>
              <div className="space-y-4">
                {shipment.statusHistory.map((history, index) => (
                  <div key={index} className="flex gap-3 sm:gap-4">
                    <div className="flex flex-col items-center">
                      <div
                        className={`flex items-center justify-center w-8 h-8 rounded-full shadow-sm text-xs font-bold ${
                          index === 0
                            ? "bg-purple-600 text-white"
                            : "bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                        }`}
                      >
                        {getStatusIcon(history.status)}
                      </div>
                      {index < shipment.statusHistory.length - 1 && (
                        <div className="w-0.5 h-10 bg-slate-200 dark:bg-slate-800" />
                      )}
                    </div>
                    <div className="flex-1 pb-4">
                      <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3.5 border border-slate-200/80 dark:border-slate-800">
                        <p className="font-bold text-slate-900 dark:text-white capitalize text-xs sm:text-sm">
                          {history.status.replace("_", " ")}
                        </p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                          {new Date(history.timestamp).toLocaleString()}
                        </p>
                        {history.remarks && (
                          <p className="text-xs text-slate-600 dark:text-slate-300 mt-1.5 bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-100 dark:border-slate-800 italic">
                            {history.remarks}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* Empty State */}
      {!shipment && !loading && (
        <div className="text-center py-16 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 transition-colors">
          <Package className="mx-auto h-12 w-12 text-slate-300 dark:text-slate-700 mb-3" />
          <h3 className="text-base font-bold text-slate-900 dark:text-white">Ready to Track</h3>
          <p className="text-slate-500 dark:text-slate-400 text-xs max-w-sm mx-auto mt-1">
            Enter your shipment booking tracking number in the search bar above to view real-time location.
          </p>
        </div>
      )}
    </div>
  );
};

export default TrackShipment;

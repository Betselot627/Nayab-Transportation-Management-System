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
        // Fetch detailed record to load fully populated users
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

  // Helper to simulate live location text based on shipment status
  const getSimulatedLocation = () => {
    if (!shipment) return "N/A";
    const status = shipment.status;
    if (status === "pending" || status === "approved") {
      return "Warehouse: Pending Driver Pickup";
    }
    if (status === "assigned") {
      return `Awaiting dispatch at ${shipment.pickupLocation?.city} Hub`;
    }
    if (status === "picked_up") {
      return `Loaded cargo at ${shipment.pickupLocation?.city} - Awaiting departure`;
    }
    if (status === "in_transit") {
      return `En route between ${shipment.pickupLocation?.city} and ${shipment.destination?.city}`;
    }
    if (status === "delivered" || status === "completed") {
      return `Delivered at Destination: ${shipment.destination?.address}`;
    }
    return "Unknown Hub Location";
  };

  // Helper to simulate live coordinates progress bar
  const getProgressPercentage = () => {
    if (!shipment) return 0;
    const status = shipment.status;
    if (status === "pending" || status === "approved") return 0;
    if (status === "assigned") return 15;
    if (status === "picked_up") return 35;
    if (status === "in_transit") return 70;
    if (status === "delivered" || status === "completed") return 100;
    return 0;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-purple-50 py-8">
      <Toaster position="top-right" />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-700 rounded-full mb-4 shadow">
            <MapPin className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">
            Track Your Shipment
          </h1>
          <p className="mt-2 text-gray-600 text-sm">
            Enter your tracking number to see real-time status history
          </p>
        </motion.div>

        {/* Search Form */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-2xl border border-gray-250 p-6 mb-8 shadow-sm"
        >
          <form onSubmit={handleTrack} className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                placeholder="Enter tracking number (e.g., SHP-202608-...)"
                className="w-full pl-12 pr-4 py-3.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none text-sm transition-all"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="px-8 py-3.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold transition-all disabled:opacity-50 flex items-center justify-center text-sm"
            >
              {loading ? <Loader className="animate-spin h-5 w-5" /> : "Track"}
            </button>
          </form>
        </motion.div>

        {/* Tracking Result */}
        {shipment && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl border border-gray-250 p-8 shadow-sm space-y-8"
          >
            <div className="border-b border-gray-200 pb-6">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 font-mono">
                    {shipment.shipmentNumber}
                  </h2>
                  <p className="text-xs text-gray-500 mt-1">Live Tracking Information (Updates Automatically)</p>
                </div>
                <div
                  className={`px-4 py-1.5 rounded-full text-xs font-bold capitalize border ${
                    shipment.status === "delivered" || shipment.status === "completed"
                      ? "bg-green-100 text-green-800 border-green-200"
                      : shipment.status === "in_transit"
                        ? "bg-purple-100 text-purple-800 border-purple-200"
                        : "bg-yellow-100 text-yellow-800 border-yellow-200"
                  }`}
                >
                  {shipment.status.replace("_", " ")}
                </div>
              </div>
            </div>

            {/* Simulated Live GPS Map Panel */}
            <div className="bg-slate-900 rounded-2xl overflow-hidden p-6 text-white relative shadow-inner space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-700 pb-3">
                <Navigation className="w-5 h-5 text-purple-400 animate-pulse shrink-0" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-350">Live GPS Location Simulator</span>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-xs text-slate-350 font-semibold">
                  <span>Current location coordinates:</span>
                  <span className="text-white font-bold">{getSimulatedLocation()}</span>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-slate-800 h-3 rounded-full overflow-hidden">
                  <motion.div
                    className="bg-gradient-to-r from-purple-500 to-purple-700 h-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${getProgressPercentage()}%` }}
                    transition={{ duration: 0.8 }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-slate-400 font-bold uppercase">
                  <span>Pickup</span>
                  <span>Transit Route</span>
                  <span>Destination</span>
                </div>
              </div>
            </div>

            {/* Assigned Driver & Vehicle specs */}
            {shipment.driverId && (
              <div className="border-t border-gray-250 pt-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Assigned Delivery Crew</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 border p-4 rounded-xl">
                  {/* Driver Card */}
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full overflow-hidden border bg-purple-100 flex items-center justify-center shrink-0">
                      {shipment.driverId.userId?.profileImage ? (
                        <img src={shipment.driverId.userId.profileImage} alt={shipment.driverId.fullName} className="w-full h-full object-cover" />
                      ) : (
                        <User className="w-6 h-6 text-purple-700" />
                      )}
                    </div>
                    <div className="text-xs">
                      <p className="text-[10px] text-gray-400 font-bold uppercase">Assigned Driver</p>
                      <p className="font-bold text-gray-900 text-sm mt-0.5">{shipment.driverId.fullName}</p>
                      <div className="flex items-center gap-1.5 text-slate-550 mt-1">
                        <Phone className="w-3.5 h-3.5 shrink-0 text-purple-600" />
                        <span>{shipment.driverId.userId?.phone || shipment.driverId.phone || "No phone"}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-550 mt-0.5">
                        <Mail className="w-3.5 h-3.5 shrink-0 text-purple-600" />
                        <span>{shipment.driverId.userId?.email || "No email"}</span>
                      </div>
                    </div>
                  </div>

                  {/* Vehicle Card */}
                  {shipment.vehicleId ? (
                    <div className="flex gap-3 border-l md:pl-6 text-xs text-slate-600">
                      <Truck className="w-8 h-8 text-purple-600 shrink-0 mt-1" />
                      <div>
                        <p className="text-[10px] text-gray-400 font-bold uppercase">Assigned Vehicle</p>
                        <p className="font-bold text-gray-900 text-sm mt-0.5">
                          {shipment.vehicleId.manufacturer} {shipment.vehicleId.model}
                        </p>
                        <p className="mt-1">Plate: <span className="font-semibold text-slate-900">{shipment.vehicleId.plateNumber}</span></p>
                        <p className="capitalize">Color: {shipment.vehicleId.color || "N/A"}</p>
                        <p>Capacity: {shipment.vehicleId.capacity?.weight} {shipment.vehicleId.capacity?.unit}</p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-gray-400 italic">Vehicle details unavailable.</p>
                  )}
                </div>
              </div>
            )}

            {/* Route Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t border-gray-250 pt-6">
              <div>
                <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">
                  Pickup Location
                </h3>
                <div className="flex items-start gap-3">
                  <div className="bg-green-100 p-2 rounded-lg">
                    <MapPin className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">
                      {shipment.pickupLocation?.city}
                    </p>
                    <p className="text-xs text-gray-650 mt-1">
                      {shipment.pickupLocation?.address}
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">
                  Delivery Location
                </h3>
                <div className="flex items-start gap-3">
                  <div className="bg-red-100 p-2 rounded-lg">
                    <MapPin className="h-5 w-5 text-red-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">
                      {shipment.destination?.city}
                    </p>
                    <p className="text-xs text-gray-600 mt-1">
                      {shipment.destination?.address}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Timeline */}
            <div className="border-t border-gray-250 pt-6">
              <h3 className="text-lg font-bold text-gray-900 mb-6">
                Shipment Timeline
              </h3>
              <div className="space-y-4">
                {shipment.statusHistory?.map((history, index) => (
                  <div key={index} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div
                        className={`flex items-center justify-center w-10 h-10 rounded-full shadow ${
                          index === 0 ? "bg-purple-600 text-white font-bold" : "bg-gray-200 text-gray-600"
                        }`}
                      >
                        {getStatusIcon(history.status)}
                      </div>
                      {index < (shipment.statusHistory?.length || 0) - 1 && (
                        <div className="w-0.5 h-12 bg-gray-200" />
                      )}
                    </div>
                    <div className="flex-1 pb-8">
                      <div className="bg-gray-50 rounded-xl p-4 border">
                        <p className="font-bold text-gray-900 capitalize text-sm">
                          {history.status.replace("_", " ")}
                        </p>
                        <p className="text-[11px] text-gray-500 mt-1">
                          {new Date(history.timestamp).toLocaleString()}
                        </p>
                        {history.remarks && (
                          <p className="text-xs text-gray-600 mt-2 bg-white p-2 rounded border italic">
                            {history.remarks}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Cargo Details */}
            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">
                Cargo Specifications
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 border p-4 rounded-xl bg-gray-50/50">
                <div>
                  <p className="text-xs text-gray-500 font-bold uppercase">Type</p>
                  <p className="font-semibold text-gray-900 text-sm mt-0.5">
                    {shipment.cargoDetails?.type}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-bold uppercase">Weight</p>
                  <p className="font-semibold text-gray-900 text-sm mt-0.5">
                    {shipment.cargoDetails?.weight}{" "}
                    {shipment.cargoDetails?.unit}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-bold uppercase">Quantity</p>
                  <p className="font-semibold text-gray-900 text-sm mt-0.5">
                    {shipment.cargoDetails?.quantity || 1}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-bold uppercase">Price</p>
                  <p className="font-semibold text-gray-900 text-sm mt-0.5">
                    PKR {shipment.pricing?.totalAmount?.toLocaleString() || 0}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {!shipment && !loading && (
          <div className="text-center py-16 bg-white border rounded-2xl">
            <Package className="mx-auto h-16 w-16 text-gray-300 mb-4" />
            <p className="text-slate-500 text-sm font-medium">Enter a tracking number above to track your booking.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TrackShipment;

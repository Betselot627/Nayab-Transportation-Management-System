import { useState } from "react";
import { shipmentService } from "../../services/shipmentService";
import {
  MapPin,
  Search,
  Loader,
  Package,
  CheckCircle,
  Clock,
  TrendingUp,
} from "lucide-react";
import { motion } from "framer-motion";
import toast, { Toaster } from "react-hot-toast";

const TrackShipment = () => {
  const [trackingNumber, setTrackingNumber] = useState("");
  const [shipment, setShipment] = useState(null);
  const [loading, setLoading] = useState(false);

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
        (s) => s.shipmentNumber === trackingNumber,
      );

      if (found) {
        setShipment(found);
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
      return <CheckCircle className="h-5 w-5" />;
    if (status === "in_transit") return <TrendingUp className="h-5 w-5" />;
    return <Clock className="h-5 w-5" />;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 py-8">
      <Toaster position="top-right" />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mb-4">
            <MapPin className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">
            Track Your Shipment
          </h1>
          <p className="mt-2 text-gray-600">
            Enter your tracking number to see real-time status
          </p>
        </motion.div>

        {/* Search Form */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-2xl shadow-xl p-8 mb-8"
        >
          <form onSubmit={handleTrack} className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                placeholder="Enter tracking number (e.g., SHP-202401-00001)"
                className="w-full pl-12 pr-4 py-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="px-8 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 font-semibold"
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
            className="bg-white rounded-2xl shadow-xl p-8"
          >
            <div className="border-b border-gray-200 pb-6 mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    {shipment.shipmentNumber}
                  </h2>
                  <p className="text-gray-600 mt-1">Tracking Information</p>
                </div>
                <div
                  className={`px-4 py-2 rounded-full font-semibold ${
                    shipment.status === "delivered"
                      ? "bg-green-100 text-green-800"
                      : shipment.status === "in_transit"
                        ? "bg-blue-100 text-blue-800"
                        : "bg-yellow-100 text-yellow-800"
                  }`}
                >
                  {shipment.status.replace("_", " ").toUpperCase()}
                </div>
              </div>
            </div>

            {/* Route Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div>
                <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">
                  Pickup Location
                </h3>
                <div className="flex items-start gap-3">
                  <div className="bg-green-100 p-2 rounded-lg">
                    <MapPin className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">
                      {shipment.pickupLocation?.city}
                    </p>
                    <p className="text-sm text-gray-600">
                      {shipment.pickupLocation?.address}
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">
                  Delivery Location
                </h3>
                <div className="flex items-start gap-3">
                  <div className="bg-red-100 p-2 rounded-lg">
                    <MapPin className="h-5 w-5 text-red-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">
                      {shipment.destination?.city}
                    </p>
                    <p className="text-sm text-gray-600">
                      {shipment.destination?.address}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Timeline */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-6">
                Shipment Timeline
              </h3>
              <div className="space-y-4">
                {shipment.statusHistory?.map((history, index) => (
                  <div key={index} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div
                        className={`flex items-center justify-center w-10 h-10 rounded-full ${
                          index === 0 ? "bg-blue-600" : "bg-gray-200"
                        }`}
                      >
                        {getStatusIcon(history.status)}
                      </div>
                      {index < (shipment.statusHistory?.length || 0) - 1 && (
                        <div className="w-0.5 h-12 bg-gray-200" />
                      )}
                    </div>
                    <div className="flex-1 pb-8">
                      <div className="bg-gray-50 rounded-lg p-4">
                        <p className="font-semibold text-gray-900 capitalize">
                          {history.status.replace("_", " ")}
                        </p>
                        <p className="text-sm text-gray-600 mt-1">
                          {new Date(history.timestamp).toLocaleString()}
                        </p>
                        {history.remarks && (
                          <p className="text-sm text-gray-500 mt-2">
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
            <div className="mt-8 border-t border-gray-200 pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Cargo Details
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Type</p>
                  <p className="font-semibold text-gray-900">
                    {shipment.cargoDetails?.type}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Weight</p>
                  <p className="font-semibold text-gray-900">
                    {shipment.cargoDetails?.weight}{" "}
                    {shipment.cargoDetails?.unit}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Quantity</p>
                  <p className="font-semibold text-gray-900">
                    {shipment.cargoDetails?.quantity || 1}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Price</p>
                  <p className="font-semibold text-gray-900">
                    PKR {shipment.pricing?.totalAmount?.toLocaleString() || 0}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {!shipment && !loading && (
          <div className="text-center py-12 text-gray-500">
            <Package className="mx-auto h-16 w-16 text-gray-300 mb-4" />
            <p>Enter a tracking number to see shipment details</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TrackShipment;

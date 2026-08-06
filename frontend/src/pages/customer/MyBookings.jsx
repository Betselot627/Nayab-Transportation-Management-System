import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { shipmentService } from "../../services/shipmentService";
import {
  Package,
  Search,
  Loader,
  MapPin,
  Calendar,
  Eye,
  X,
} from "lucide-react";
import { motion } from "framer-motion";
import toast, { Toaster } from "react-hot-toast";

const MyBookings = () => {
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedShipment, setSelectedShipment] = useState(null);

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

  const getStatusColor = (status) => {
    const colors = {
      pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
      approved: "bg-blue-100 text-blue-800 border-blue-200",
      assigned: "bg-indigo-100 text-indigo-850 border-indigo-200",
      picked_up: "bg-purple-100 text-purple-800 border-purple-200",
      in_transit: "bg-cyan-105 text-cyan-800 border-cyan-200",
      delivered: "bg-green-100 text-green-800 border-green-200",
      cancelled: "bg-red-105 text-red-800 border-red-200",
    };

    return colors[status] || "bg-slate-100 text-slate-800 border-slate-200";
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
    <div className="min-h-screen bg-slate-50 p-6 space-y-6">
      <Toaster position="top-right" />

      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900 mb-2">My Bookings</h1>
        <p className="text-slate-600 text-sm">View and track all your booked cargo shipments.</p>
      </div>

      {/* Search & Filter */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-250 flex flex-col md:flex-row gap-4 items-stretch">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search by tracking number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl text-sm bg-transparent focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all text-gray-900"
          />
        </div>

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all text-gray-800"
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="assigned">Assigned</option>
          <option value="in_transit">In Transit</option>
          <option value="delivered">Delivered</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {/* Loading & Content */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Loader className="w-8 h-8 text-purple-600 animate-spin" />
        </div>
      ) : filteredShipments.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-250">
          <Package className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500 text-lg">No bookings found</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredShipments.map((s, i) => (
            <motion.div
              key={s._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-white rounded-2xl p-6 border border-gray-250 hover:shadow-md transition duration-200"
            >
              <div className="flex flex-col md:flex-row justify-between gap-4">
                <div className="space-y-3 flex-1">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold font-mono text-slate-500">
                      {s.shipmentNumber || "UNASSIGNED"}
                    </span>
                    <span className={`${getStatusColor(s.status)} px-3 py-1 rounded-full text-xs font-semibold border capitalize`}>
                      {s.status}
                    </span>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <LocationItem
                      iconColor="text-green-500"
                      title="Pickup Address"
                      value={s.pickupLocation?.address || s.pickupLocation?.city || "N/A"}
                    />
                    <LocationItem
                      iconColor="text-red-500"
                      title="Delivery Destination"
                      value={s.destination?.address || s.destination?.city || "N/A"}
                    />
                  </div>

                  <div className="flex items-center gap-4 text-xs text-slate-500">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      <span>{new Date(s.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Package className="w-4 h-4" />
                      <span>{s.cargoDetails?.weight || "N/A"} {s.cargoDetails?.unit || "kg"}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end">
                  <Link
                    to={`/customer/shipment-details/${s._id}`}
                    className="px-5 py-2.5 bg-purple-700 hover:bg-purple-700 text-white rounded-xl text-xs font-semibold transition flex items-center gap-2 shadow-sm"
                  >
                    <Eye className="w-4 h-4" />
                    View Details
                  </Link>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Modal */}
      {selectedShipment && (
        <div className="fixed inset-0 bg-black/55 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-2xl p-6 max-w-2xl w-full border shadow-xl flex flex-col max-h-[90vh]"
          >
            <div className="flex justify-between items-start mb-6 border-b pb-4 border-gray-250">
              <div>
                <h2 className="text-xl font-bold">Shipment Details</h2>
                <p className="text-xs font-mono text-slate-500 mt-1">
                  Tracking #: {selectedShipment.shipmentNumber || "Pending Generation"}
                </p>
              </div>
              <button
                onClick={() => setSelectedShipment(null)}
                className="text-slate-400 p-1 hover:bg-gray-100 rounded-lg transition"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-6 pr-1">
              <div className="grid grid-cols-2 gap-4">
                <DetailItem
                  label="Status"
                  value={
                    <span className={`${getStatusColor(selectedShipment.status)} px-2.5 py-0.5 rounded-full text-xs font-bold border capitalize`}>
                      {selectedShipment.status}
                    </span>
                  }
                />
                <DetailItem
                  label="Booked Date"
                  value={new Date(selectedShipment.createdAt).toLocaleDateString()}
                />
                <DetailItem
                  label="Pickup Address"
                  value={selectedShipment.pickupLocation?.address || "N/A"}
                />
                <DetailItem
                  label="Pickup City"
                  value={selectedShipment.pickupLocation?.city || "N/A"}
                />
                <DetailItem
                  label="Delivery Address"
                  value={selectedShipment.destination?.address || "N/A"}
                />
                <DetailItem
                  label="Delivery City"
                  value={selectedShipment.destination?.city || "N/A"}
                />
                <DetailItem
                  label="Weight / Capacity"
                  value={`${selectedShipment.cargoDetails?.weight || "N/A"} ${selectedShipment.cargoDetails?.unit || "kg"}`}
                />
                <DetailItem
                  label="Cargo Type"
                  value={selectedShipment.cargoDetails?.type || "N/A"}
                />
              </div>

              {selectedShipment.notes && (
                <div className="border-t pt-4">
                  <p className="text-xs font-bold text-slate-400 uppercase">Special Instructions</p>
                  <p className="text-sm italic mt-1 bg-gray-50 p-3 rounded-xl border">{selectedShipment.notes}</p>
                </div>
              )}
            </div>

            <div className="border-t pt-4 mt-6 flex justify-end">
              <button
                onClick={() => setSelectedShipment(null)}
                className="px-5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold rounded-xl transition"
              >
                Close View
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

const LocationItem = ({ title, value, iconColor }) => (
  <div className="flex items-start gap-2">
    <MapPin className={`w-4 h-4 ${iconColor} mt-1`} />
    <div>
      <p className="text-xs text-slate-500">{title}</p>
      <p className="text-sm font-medium text-slate-800">{value}</p>
    </div>
  </div>
);

const DetailItem = ({ label, value }) => (
  <div>
    <p className="text-xs text-slate-450 font-bold uppercase mb-1">{label}</p>
    <div className="font-semibold text-slate-800 text-sm">{value}</div>
  </div>
);

export default MyBookings;
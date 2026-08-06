import { useState, useEffect } from "react";
import { shipmentService } from "../../services/shipmentService";
import { driverService } from "../../services/driverService";
import { vehicleService } from "../../services/vehicleService";
import {
  Package,
  Search,
  Loader,
  MapPin,
  Calendar,
  Truck,
  User,
  X,
  Check,
} from "lucide-react";
import { motion } from "framer-motion";
import toast, { Toaster } from "react-hot-toast";

const Shipments = () => {
  const [shipments, setShipments] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedShipment, setSelectedShipment] = useState(null);
  const [assignData, setAssignData] = useState({ driverId: "", vehicleId: "" });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [shipmentsRes, driversRes, vehiclesRes] = await Promise.all([
        shipmentService.getAllShipments(),
        driverService.getAvailableDrivers(),
        vehicleService.getAllVehicles({ available: true }),
      ]);

      setShipments(shipmentsRes.data || []);
      setDrivers(driversRes.data || []);
      setVehicles(vehiclesRes.data || []);
      toast.success("Data loaded successfully");
    } catch (err) {
      console.error("Failed to fetch data:", err);
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const handleAssign = async () => {
    if (!assignData.driverId || !assignData.vehicleId) {
      toast.error("Please select both driver and vehicle");
      return;
    }

    try {
      await shipmentService.assignShipment(selectedShipment._id, assignData);
      toast.success("Shipment assigned successfully");
      setShowAssignModal(false);
      setSelectedShipment(null);
      setAssignData({ driverId: "", vehicleId: "" });
      fetchData();
    } catch (err) {
      toast.error("Failed to assign shipment");
      console.error(err);
    }
  };

  const handleStatusUpdate = async (id, status) => {
    try {
      await shipmentService.updateShipmentStatus(id, { status });
      toast.success("Status updated successfully");
      fetchData();
    } catch (err) {
      toast.error("Failed to update status");
      console.error(err);
    }
  };

  const handleApprove = async (id) => {
    try {
      setLoading(true);
      await shipmentService.approveShipment(id);
      toast.success("Shipment approved & driver/vehicle auto-assigned!");
      await fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to approve shipment");
      console.error(err);
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: "bg-yellow-100 text-yellow-800",
      approved: "bg-blue-100 text-blue-800",
      assigned: "bg-indigo-100 text-indigo-800",
      picked_up: "bg-purple-100 text-purple-800",
      in_transit: "bg-blue-100 text-blue-800",
      delivered: "bg-green-100 text-green-800",
      completed: "bg-gray-100 text-gray-800",
      cancelled: "bg-red-100 text-red-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  const filteredShipments = shipments.filter((shipment) => {
    const matchesSearch = (shipment.shipmentNumber || "")
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesFilter =
      filterStatus === "all" || shipment.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader className="animate-spin h-8 w-8 text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster position="top-right" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Package className="h-8 w-8 text-blue-600" />
            Shipment Management
          </h1>
          <p className="mt-2 text-gray-600">Manage and track all shipments</p>
        </motion.div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by shipment number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex gap-2 overflow-x-auto">
              {["all", "pending", "assigned", "in_transit", "delivered"].map(
                (status) => (
                  <button
                    key={status}
                    onClick={() => setFilterStatus(status)}
                    className={`px-4 py-2 rounded-lg capitalize whitespace-nowrap ${
                      filterStatus === status
                        ? "bg-blue-600 text-white"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {status.replace("_", " ")}
                  </button>
                ),
              )}
            </div>
          </div>
        </div>

        {/* Shipments Table */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Shipment #
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Route
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Cargo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredShipments.map((shipment) => (
                  <tr key={shipment._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">
                        {shipment.shipmentNumber}
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(shipment.createdAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin className="h-4 w-4 text-gray-400" />
                        <span>
                          {shipment.pickupLocation?.city} →{" "}
                          {shipment.destination?.city}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {shipment.cargoDetails?.type}
                      </div>
                      <div className="text-xs text-gray-500">
                        {shipment.cargoDetails?.weight}{" "}
                        {shipment.cargoDetails?.unit}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(shipment.status)}`}
                      >
                        {shipment.status.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {shipment.status === "pending" && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleApprove(shipment._id)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 shadow-sm"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => {
                              setSelectedShipment(shipment);
                              setShowAssignModal(true);
                            }}
                            className="border border-slate-350 hover:bg-slate-50 text-slate-700 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
                          >
                            Assign Manual
                          </button>
                        </div>
                      )}
                      {shipment.status === "delivered" && (
                        <button
                          onClick={() =>
                            handleStatusUpdate(shipment._id, "completed")
                          }
                          className="text-green-600 hover:text-green-900 text-sm font-medium"
                        >
                          Complete
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Assign Modal */}
        {showAssignModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white rounded-xl max-w-md w-full p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">
                  Assign Shipment
                </h2>
                <button onClick={() => setShowAssignModal(false)}>
                  <X className="h-6 w-6 text-gray-400 hover:text-gray-600" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Driver
                  </label>
                  <select
                    value={assignData.driverId}
                    onChange={(e) =>
                      setAssignData({ ...assignData, driverId: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Choose driver...</option>
                    {drivers.map((driver) => (
                      <option key={driver._id} value={driver._id}>
                        {driver.fullName} - {driver.licenseNumber}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Vehicle
                  </label>
                  <select
                    value={assignData.vehicleId}
                    onChange={(e) =>
                      setAssignData({
                        ...assignData,
                        vehicleId: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Choose vehicle...</option>
                    {vehicles.map((vehicle) => (
                      <option key={vehicle._id} value={vehicle._id}>
                        {vehicle.plateNumber} - {vehicle.model}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  onClick={handleAssign}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <Check className="h-5 w-5" />
                  Assign Shipment
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Shipments;

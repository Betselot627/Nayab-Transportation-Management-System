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
        shipmentService.getAllShipments({ limit: 1000 }),
        driverService.getAvailableDrivers(),
        vehicleService.getAllVehicles({ available: "true", limit: 1000 }),
      ]);

      setShipments(shipmentsRes.data || []);
      setDrivers(driversRes.data || []);
      setVehicles(vehiclesRes.data || []);
    } catch (err) {
      console.error("Failed to fetch data:", err);
      toast.error("Failed to load shipment data");
    } finally {
      setLoading(false);
    }
  };

  const handleAssign = async () => {
    if (!assignData.driverId || !assignData.vehicleId) {
      toast.error("Please select both driver and vehicle");
      return;
    }

    const selectedVehicle = vehicles.find(v => String(v._id) === String(assignData.vehicleId));
    const selectedDriver = drivers.find(d => String(d._id) === String(assignData.driverId));

    if (!selectedVehicle || !selectedDriver) {
      toast.error("Invalid driver or vehicle selection");
      return;
    }

    // Verify capacity requirements
    const cargoWeight = selectedShipment.cargoDetails?.weight || 0;
    const cargoUnit = selectedShipment.cargoDetails?.unit || "kg";
    const cargoWeightKg = cargoUnit === "ton" ? cargoWeight * 1000 : cargoWeight;

    const vehicleCap = selectedVehicle.capacity?.weight || 0;
    const vehicleUnit = selectedVehicle.capacity?.unit || "kg";
    const vehicleCapKg = vehicleUnit === "ton" ? vehicleCap * 1000 : vehicleCap;

    if (vehicleCapKg < cargoWeightKg) {
      toast.error(`Vehicle capacity (${vehicleCap} ${vehicleUnit}) is insufficient for cargo size (${cargoWeight} ${cargoUnit})`);
      return;
    }

    // Verify driver association (must match or be a company fleet vehicle with no driver)
    const vehicleOwnerId = selectedVehicle.registeredBy?._id || selectedVehicle.registeredBy;
    if (vehicleOwnerId && String(vehicleOwnerId) !== String(assignData.driverId)) {
      toast.error("The selected vehicle is not registered to the chosen driver.");
      return;
    }

    try {
      setLoading(true);
      await shipmentService.assignShipment(selectedShipment._id, assignData);
      toast.success("Shipment manually assigned successfully");
      setShowAssignModal(false);
      setSelectedShipment(null);
      setAssignData({ driverId: "", vehicleId: "" });
      await fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to assign shipment");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (id, status) => {
    try {
      setLoading(true);
      await shipmentService.updateShipmentStatus(id, { status });
      toast.success(`Shipment status updated to "${status}"`);
      await fetchData();
    } catch (err) {
      toast.error("Failed to update status");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
      approved: "bg-blue-100 text-blue-800 border-blue-200",
      assigned: "bg-indigo-100 text-indigo-800 border-indigo-200",
      picked_up: "bg-purple-100 text-purple-800 border-purple-200",
      in_transit: "bg-sky-100 text-sky-800 border-sky-200",
      delivered: "bg-emerald-100 text-emerald-800 border-emerald-200",
      completed: "bg-slate-100 text-slate-800 border-slate-200",
      cancelled: "bg-rose-100 text-rose-800 border-rose-200",
    };
    return colors[status] || "bg-gray-105 text-gray-800 border-gray-200";
  };

  const filteredShipments = shipments.filter((shipment) => {
    const matchesSearch = (shipment.shipmentNumber || "")
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesFilter =
      filterStatus === "all" || shipment.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  // Dynamically filter suitable vehicles based on selectedShipment cargo weight & selected driver association
  const getFilteredVehicles = () => {
    if (!selectedShipment) return [];

    const cargoWeight = selectedShipment.cargoDetails?.weight || 0;
    const cargoUnit = selectedShipment.cargoDetails?.unit || "kg";
    const cargoWeightKg = cargoUnit === "ton" ? cargoWeight * 1000 : cargoWeight;

    return vehicles.filter((vehicle) => {
      // 1. Availability check (must be available and approved)
      if (vehicle.status !== "available" || vehicle.approvalStatus !== "approved") {
        return false;
      }

      // 2. Capacity requirement check
      const vehicleCap = vehicle.capacity?.weight || 0;
      const vehicleUnit = vehicle.capacity?.unit || "kg";
      const vehicleCapKg = vehicleUnit === "ton" ? vehicleCap * 1000 : vehicleCap;
      if (vehicleCapKg < cargoWeightKg) {
        return false;
      }

      // 3. Driver association check (only show driver's own vehicles OR fleet vehicles with no owner)
      if (assignData.driverId) {
        const vehicleOwnerId = vehicle.registeredBy?._id || vehicle.registeredBy;
        if (vehicleOwnerId && String(vehicleOwnerId) !== String(assignData.driverId)) {
          return false;
        }
      }

      return true;
    });
  };

  const formatWaitingSince = (driver) => {
    if (!driver.lastAssignedAt) {
      return "Never assigned (High Priority)";
    }
    const date = new Date(driver.lastAssignedAt);
    return `Waiting since: ${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  };

  if (loading && shipments.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <Loader className="animate-spin h-8 w-8 text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6 space-y-6">
      <Toaster position="top-right" />

      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <Package className="h-8 w-8 text-blue-600" />
          Shipment Management
        </h1>
        <p className="mt-2 text-gray-600 text-sm">Assign crew and track status history of shipment bookings.</p>
      </div>

      {/* Search & Status Filters */}
      <div className="bg-white rounded-2xl shadow-sm border p-5 flex flex-col md:flex-row gap-4 items-stretch justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by shipment number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-blue-500 text-sm"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto">
          {["all", "pending", "approved", "assigned", "in_transit", "delivered"].map(
            (status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-4 py-2 rounded-xl text-xs font-bold capitalize whitespace-nowrap border transition-all ${
                  filterStatus === status
                    ? "bg-blue-600 border-blue-600 text-white shadow"
                    : "bg-gray-50 border-gray-300 text-gray-600 hover:bg-gray-100"
                }`}
              >
                {status.replace("_", " ")}
              </button>
            ),
          )}
        </div>
      </div>

      {/* Shipments Table */}
      <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-left">
            <thead className="bg-gray-50 text-xs font-bold text-gray-500 uppercase">
              <tr>
                <th className="px-6 py-4">Shipment Details</th>
                <th className="px-6 py-4">Route</th>
                <th className="px-6 py-4">Cargo Info</th>
                <th className="px-6 py-4">Assigned Crew</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 text-sm">
              {filteredShipments.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-16 text-gray-500">
                    <Package className="mx-auto h-12 w-12 text-gray-400 mb-3" />
                    No shipments found matching the criteria.
                  </td>
                </tr>
              ) : (
                filteredShipments.map((shipment) => (
                  <tr key={shipment._id} className="hover:bg-gray-50/50 transition">
                    <td className="px-6 py-4">
                      <div className="font-bold text-gray-900 font-mono text-sm">
                        {shipment.shipmentNumber || "UNASSIGNED"}
                      </div>
                      <div className="text-xs text-gray-400 mt-0.5">
                        {new Date(shipment.createdAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 font-semibold text-gray-700">
                        <MapPin className="h-4 w-4 text-gray-400 shrink-0" />
                        <span>
                          {shipment.pickupLocation?.city} → {shipment.destination?.city}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500 ml-5 truncate max-w-xs" title={shipment.pickupLocation?.address}>
                        {shipment.pickupLocation?.address}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-gray-800 text-xs">
                        {shipment.cargoDetails?.type}
                      </div>
                      <div className="text-xs text-gray-400 font-semibold mt-0.5">
                        {shipment.cargoDetails?.weight} {shipment.cargoDetails?.unit}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {shipment.driverId ? (
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1 font-semibold text-gray-800 text-xs">
                            <User className="w-3.5 h-3.5 text-gray-400" />
                            <span>{shipment.driverId.fullName || "Assigned Driver"}</span>
                          </div>
                          <div className="flex items-center gap-1 text-xs text-gray-400">
                            <Truck className="w-3.5 h-3.5 text-gray-500" />
                            <span>{shipment.vehicleId?.plateNumber || "No Vehicle"}</span>
                          </div>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400 italic">Not Assigned</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-block px-2.5 py-1 text-xs font-bold rounded-full border capitalize ${getStatusColor(shipment.status)}`}
                      >
                        {shipment.status.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex gap-2 justify-end">
                        {(shipment.status === "pending" || shipment.status === "approved") && (
                          <button
                            onClick={() => {
                              setSelectedShipment(shipment);
                              setAssignData({ driverId: "", vehicleId: "" });
                              setShowAssignModal(true);
                            }}
                            className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-xs"
                          >
                            Assign Shipment
                          </button>
                        )}
                        {shipment.status === "delivered" && (
                          <button
                            onClick={() =>
                              handleStatusUpdate(shipment._id, "completed")
                            }
                            className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-3.5 py-1.5 rounded-xl transition shadow-xs"
                          >
                            Complete Route
                          </button>
                        )}
                        {shipment.status !== "pending" && shipment.status !== "approved" && shipment.status !== "delivered" && (
                          <span className="text-xs font-semibold text-gray-400">In Progress</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Manual Assignment Modal */}
      {showAssignModal && selectedShipment && (
        <div className="fixed inset-0 bg-black/55 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-gray-250"
          >
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-250">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  Assign Shipment
                </h2>
                <p className="text-xs text-gray-500 font-semibold mt-0.5">
                  Tracking #: {selectedShipment.shipmentNumber}
                </p>
              </div>
              <button 
                onClick={() => setShowAssignModal(false)}
                className="p-1 hover:bg-gray-100 rounded-lg transition"
              >
                <X className="h-6 w-6 text-gray-400" />
              </button>
            </div>

            {/* Shipment details reminder */}
            <div className="bg-blue-50/50 border border-blue-150 p-3.5 rounded-xl text-xs space-y-1.5 mb-5 text-blue-900">
              <div className="flex justify-between">
                <span className="font-bold">Cargo Type:</span>
                <span>{selectedShipment.cargoDetails?.type}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-bold">Required Capacity:</span>
                <span className="font-semibold text-blue-950">
                  {selectedShipment.cargoDetails?.weight} {selectedShipment.cargoDetails?.unit}
                </span>
              </div>
            </div>

            <div className="space-y-4">
              {/* Driver Selection */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wide">
                  Step 1: Select Driver (Fair Queue Sorted)
                </label>
                <select
                  value={assignData.driverId}
                  onChange={(e) =>
                    setAssignData({ driverId: e.target.value, vehicleId: "" })
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-gray-800 transition"
                >
                  <option value="">-- Choose Longest Waiting Driver --</option>
                  {drivers.length === 0 ? (
                    <option disabled>No drivers available</option>
                  ) : (
                    drivers.map((driver, idx) => (
                      <option key={driver._id} value={driver._id}>
                        {idx + 1}. {driver.fullName} ({formatWaitingSince(driver)})
                      </option>
                    ))
                  )}
                </select>
              </div>

              {/* Vehicle Selection */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wide">
                  Step 2: Choose Eligible Vehicle
                </label>
                <select
                  value={assignData.vehicleId}
                  disabled={!assignData.driverId}
                  onChange={(e) =>
                    setAssignData({ ...assignData, vehicleId: e.target.value })
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-gray-800 disabled:bg-gray-50 disabled:cursor-not-allowed transition"
                >
                  <option value="">-- Choose Suitable Vehicle --</option>
                  {getFilteredVehicles().map((vehicle) => {
                    const ownerName = vehicle.registeredBy?.fullName || "Company Fleet Vehicle";
                    return (
                      <option key={vehicle._id} value={vehicle._id}>
                        {vehicle.plateNumber} - {vehicle.manufacturer} {vehicle.model} ({vehicle.capacity?.weight} {vehicle.capacity?.unit} cap) - {ownerName}
                      </option>
                    );
                  })}
                </select>
                {assignData.driverId && getFilteredVehicles().length === 0 && (
                  <p className="text-[11px] font-bold text-red-500 mt-2">
                    ⚠ No suitable approved available vehicles meet the cargo capacity or belong to this driver.
                  </p>
                )}
              </div>

              <div className="pt-4 border-t border-gray-250 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowAssignModal(false)}
                  className="flex-1 px-5 py-3 border text-gray-700 text-xs font-bold rounded-xl hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAssign}
                  disabled={!assignData.driverId || !assignData.vehicleId}
                  className="flex-1 flex items-center justify-center gap-2 px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition disabled:opacity-50 text-xs"
                >
                  <Check className="h-4 w-4" />
                  Assign Shipment
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default Shipments;

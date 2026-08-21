import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Package,
  Search,
  Funnel as Filter,
  MapPin,
  Calendar,
  Truck,
  User,
  CircleCheck as CheckCircle,
  Clock,
  ArrowRight,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import { shipmentService } from "../../services/shipmentService";
import { driverService } from "../../services/driverService";
import { vehicleService } from "../../services/vehicleService";
import toast from "react-hot-toast";

const Bookings = () => {
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  // Assignment Modal
  const [selectedShipment, setSelectedShipment] = useState(null);
  const [availableDrivers, setAvailableDrivers] = useState([]);
  const [availableVehicles, setAvailableVehicles] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [selectedDriverId, setSelectedDriverId] = useState("");
  const [selectedVehicleId, setSelectedVehicleId] = useState("");
  const [assigning, setAssigning] = useState(false);

  useEffect(() => {
    fetchBookings(false);
  }, [filterStatus]);

  const fetchBookings = async (force = false) => {
    try {
      if (shipments.length === 0) setLoading(true);
      const params = { limit: 50 };
      if (filterStatus !== "all") params.status = filterStatus;

      const res = await shipmentService.getAllShipments(params, { force, ttl: 30000 });
      setShipments(res.data || []);
    } catch (err) {
      console.warn("Failed to load dispatcher bookings:", err.message);
      toast.error("Failed to load bookings");
    } finally {
      setLoading(false);
    }
  };

  const openAssignModal = async (shipment) => {
    setSelectedShipment(shipment);
    setSelectedDriverId("");
    setSelectedVehicleId("");
    setSuggestions([]);
    try {
      const [driversRes, vehiclesRes, suggestionsRes] = await Promise.all([
        driverService.getAvailableDrivers({ force: true }),
        vehicleService.getAllVehicles({ available: "true" }, { force: true }),
        shipmentService.getSuggestions(shipment._id, { force: true }).catch(() => null),
      ]);
      setAvailableDrivers(driversRes.data || []);
      setAvailableVehicles(vehiclesRes.data || []);
      if (suggestionsRes?.success) {
        setSuggestions(suggestionsRes.data?.suggestions || []);
      }
    } catch (err) {
      toast.error("Failed to load available fleet assets");
    }
  };

  const applySuggestion = (s) => {
    setSelectedDriverId(s.driver._id);
    setSelectedVehicleId(s.vehicle._id);
  };

  const handleAssignSubmit = async (e) => {
    e.preventDefault();
    if (!selectedDriverId || !selectedVehicleId) {
      toast.error("Please select both a driver and a vehicle");
      return;
    }

    try {
      setAssigning(true);
      await shipmentService.assignShipment(selectedShipment._id, {
        driverId: selectedDriverId,
        vehicleId: selectedVehicleId,
      });
      toast.success("Shipment successfully assigned to driver & vehicle!");
      setSelectedShipment(null);
      fetchBookings(true);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to assign shipment");
    } finally {
      setAssigning(false);
    }
  };

  const filteredShipments = shipments.filter((s) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      s.shipmentNumber?.toLowerCase().includes(term) ||
      s.pickupLocation?.city?.toLowerCase().includes(term) ||
      s.destination?.city?.toLowerCase().includes(term) ||
      s.customerId?.companyName?.toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-6 p-1">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Booking & Shipment Dispatch
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium text-sm">
            Review customer bookings and assign available drivers & vehicles.
          </p>
        </div>
        <button
          onClick={() => fetchBookings(true)}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-slate-700 dark:text-gray-300 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition shadow-sm"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-900 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row gap-4 justify-between items-center">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search booking #, city, customer..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {["all", "pending", "approved", "assigned", "in_transit", "completed"].map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition ${
                filterStatus === st
                  ? "bg-blue-600 text-white"
                  : "bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-200"
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Shipments Table */}
      <div className="bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-900 rounded-2xl shadow-sm overflow-hidden">
        {loading && shipments.length === 0 ? (
          <div className="p-8 text-center text-slate-400">Loading bookings...</div>
        ) : filteredShipments.length === 0 ? (
          <div className="p-8 text-center text-slate-400">No bookings match the selected criteria.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
              <thead className="bg-slate-50 dark:bg-slate-900 text-xs font-bold uppercase text-slate-400 tracking-wider">
                <tr>
                  <th className="px-6 py-4">Booking #</th>
                  <th className="px-6 py-4">Customer</th>
                  <th className="px-6 py-4">Route</th>
                  <th className="px-6 py-4">Cargo Details</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Assigned To</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-900">
                {filteredShipments.map((s) => (
                  <tr key={s._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50 transition">
                    <td className="px-6 py-4 font-mono font-bold text-slate-900 dark:text-white">
                      #{s.shipmentNumber}
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">
                      {s.customerId?.companyName || s.customerId?.contactPerson?.name || "Customer"}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-xs">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{s.pickupLocation?.city || "Origin"}</span>
                        <span>â†’</span>
                        <span>{s.destination?.city || "Destination"}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs">
                      {s.cargoDetails?.type || "General"} ({s.cargoDetails?.weight || 0} {s.cargoDetails?.unit || "kg"})
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-500/10 text-blue-600 border border-blue-500/20 capitalize">
                        {s.status?.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs">
                      {s.driverId?.fullName ? (
                        <div>
                          <div className="font-semibold text-slate-900 dark:text-white">{s.driverId.fullName}</div>
                          <div className="text-slate-400">{s.vehicleId?.plateNumber || "Vehicle"}</div>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">Unassigned</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {["pending", "approved"].includes(s.status) && (
                        <button
                          onClick={() => openAssignModal(s)}
                          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg shadow transition"
                        >
                          Assign Fleet
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Assignment Modal */}
      {selectedShipment && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-6">
            <div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                Assign Fleet to Shipment #{selectedShipment.shipmentNumber}
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Route: {selectedShipment.pickupLocation?.city} â†’ {selectedShipment.destination?.city} | Cargo:{" "}
                {selectedShipment.cargoDetails?.weight} {selectedShipment.cargoDetails?.unit}
              </p>
            </div>

            <form onSubmit={handleAssignSubmit} className="space-y-4">
              {suggestions.length > 0 && (
                <div className="rounded-xl border border-indigo-100 dark:border-indigo-900/50 bg-indigo-50/70 dark:bg-indigo-950/30 p-3 space-y-2">
                  <div className="text-[11px] font-bold uppercase tracking-wide text-indigo-700 dark:text-indigo-300 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    Recommended (ranked by rating &amp; cargo match)
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {suggestions.slice(0, 4).map((s, idx) => (
                      <button
                        key={s.driver._id}
                        type="button"
                        onClick={() => applySuggestion(s)}
                        className={`px-2.5 py-1.5 rounded-lg text-left text-[11px] border transition ${
                          selectedDriverId === s.driver._id &&
                          selectedVehicleId === s.vehicle._id
                            ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                            : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-blue-400"
                        }`}
                      >
                        <span className="font-bold">
                          #{idx + 1} {s.driver.fullName}
                        </span>
                        {" Â· "}
                        {s.vehicle.plateNumber}
                        {" Â· "}
                        <span className="font-mono">
                          {s.estimatedDriverPayment?.toLocaleString()} ETB
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">
                  Select Available Driver
                </label>
                <select
                  value={selectedDriverId}
                  onChange={(e) => setSelectedDriverId(e.target.value)}
                  required
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">-- Choose Available Driver --</option>
                  {availableDrivers.map((d) => (
                    <option key={d._id} value={d._id}>
                      {d.fullName} ({d.licenseNumber}) - Status: {d.status}
                    </option>
                  ))}
                </select>
                {availableDrivers.length === 0 && (
                  <p className="text-xs text-amber-500 mt-1">No available drivers currently on duty.</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">
                  Select Available Vehicle
                </label>
                <select
                  value={selectedVehicleId}
                  onChange={(e) => setSelectedVehicleId(e.target.value)}
                  required
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">-- Choose Available Vehicle --</option>
                  {availableVehicles.map((v) => (
                    <option key={v._id} value={v._id}>
                      {v.plateNumber} ({v.manufacturer} {v.model}) - Cap: {v.capacity?.weight} {v.capacity?.unit}
                    </option>
                  ))}
                </select>
                {availableVehicles.length === 0 && (
                  <p className="text-xs text-amber-500 mt-1">No available vehicles currently in fleet.</p>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-900">
                <button
                  type="button"
                  onClick={() => setSelectedShipment(null)}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={assigning}
                  className="px-5 py-2 text-sm font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow transition disabled:opacity-50"
                >
                  {assigning ? "Assigning..." : "Confirm Assignment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Bookings;

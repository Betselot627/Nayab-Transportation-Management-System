import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import {
  UserCheck,
  MapPin,
  Package,
  RefreshCw,
  Sparkles,
  Star,
  Wallet,
  Truck,
} from "lucide-react";
import { shipmentService } from "../../services/shipmentService";
import { driverService } from "../../services/driverService";
import { vehicleService } from "../../services/vehicleService";
import toast from "react-hot-toast";

const AssignDriver = () => {
  const [searchParams] = useSearchParams();
  const preselectedShipmentId = searchParams.get("shipmentId");

  const [pendingShipments, setPendingShipments] = useState([]);
  const [availableDrivers, setAvailableDrivers] = useState([]);
  const [availableVehicles, setAvailableVehicles] = useState([]);
  const [selectedShipmentId, setSelectedShipmentId] = useState(preselectedShipmentId || "");
  const [selectedDriverId, setSelectedDriverId] = useState("");
  const [selectedVehicleId, setSelectedVehicleId] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [suggestionsMeta, setSuggestionsMeta] = useState(null);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [assigningSuggestion, setAssigningSuggestion] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchData(false);
  }, []);

  // Fetch smart suggestions whenever the selected shipment changes
  useEffect(() => {
    if (!selectedShipmentId) return;
    let cancelled = false;
    setSuggestionsLoading(true);
    shipmentService
      .getSuggestions(selectedShipmentId)
      .then((res) => {
        if (cancelled) return;
        setSuggestions(res?.data?.suggestions || []);
        setSuggestionsMeta(res?.data || null);
      })
      .catch(() => {
        if (!cancelled) setSuggestions([]);
      })
      .finally(() => {
        if (!cancelled) setSuggestionsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedShipmentId]);

  const fetchData = async (force = false) => {
    try {
      if (pendingShipments.length === 0) setLoading(true);
      const [shipmentsRes, driversRes, vehiclesRes] = await Promise.all([
        shipmentService.getAllShipments({ status: "pending", limit: 50 }, { force, ttl: 20000 }),
        driverService.getAvailableDrivers({ force, ttl: 20000 }),
        vehicleService.getAllVehicles({ available: "true", limit: 50 }, { force, ttl: 20000 }),
      ]);

      const shipments = shipmentsRes.data || [];
      setPendingShipments(shipments);
      setAvailableDrivers(driversRes.data || []);
      setAvailableVehicles(vehiclesRes.data || []);

      if (preselectedShipmentId && shipments.some((s) => s._id === preselectedShipmentId)) {
        setSelectedShipmentId(preselectedShipmentId);
      } else if (shipments.length > 0 && !selectedShipmentId) {
        setSelectedShipmentId(shipments[0]._id);
      }
    } catch (err) {
      console.warn("Failed to load dispatch assignment data:", err.message);
      toast.error("Failed to load available fleet data");
    } finally {
      setLoading(false);
    }
  };

  const assignSuggestion = async (s) => {
    try {
      setAssigningSuggestion(s.driver._id);
      await shipmentService.assignShipment(selectedShipmentId, {
        driverId: s.driver._id,
        vehicleId: s.vehicle._id,
      });
      toast.success(
        `Assigned ${s.driver.fullName} with vehicle ${s.vehicle.plateNumber}!`,
      );
      setSelectedDriverId("");
      setSelectedVehicleId("");
      fetchData(true);
    } catch (err) {
      toast.error(err.response?.data?.message || "Assignment failed");
    } finally {
      setAssigningSuggestion("");
    }
  };

  const handleAssign = async (e) => {
    e.preventDefault();
    if (!selectedShipmentId || !selectedDriverId || !selectedVehicleId) {
      toast.error("Please select a shipment, driver, and vehicle");
      return;
    }

    try {
      setSubmitting(true);
      await shipmentService.assignShipment(selectedShipmentId, {
        driverId: selectedDriverId,
        vehicleId: selectedVehicleId,
      });
      toast.success("Driver and vehicle assigned successfully!");
      setSelectedDriverId("");
      setSelectedVehicleId("");
      fetchData(true);
    } catch (err) {
      toast.error(err.response?.data?.message || "Assignment failed");
    } finally {
      setSubmitting(false);
    }
  };

  const currentShipment = pendingShipments.find((s) => s._id === selectedShipmentId);

  return (
    <div className="space-y-6 p-1">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Assign Driver to Shipment
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium text-sm">
            Dispatch available drivers to unassigned bookings.
          </p>
        </div>
        <button
          onClick={() => fetchData(true)}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-slate-700 dark:text-gray-300 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition shadow-sm"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh Fleet
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Shipment Selection */}
        <div className="lg:col-span-1 bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-900 rounded-2xl p-6 shadow-sm space-y-4">
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Package className="w-5 h-5 text-blue-600" />
            Select Pending Shipment ({pendingShipments.length})
          </h2>

          {loading && pendingShipments.length === 0 ? (
            <div className="text-center py-6 text-slate-400 text-sm">Loading shipments...</div>
          ) : pendingShipments.length === 0 ? (
            <div className="text-center py-6 text-slate-400 text-sm">No pending shipments.</div>
          ) : (
            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
              {pendingShipments.map((s) => (
                <div
                  key={s._id}
                  onClick={() => setSelectedShipmentId(s._id)}
                  className={`p-3.5 rounded-xl border cursor-pointer transition ${
                    selectedShipmentId === s._id
                      ? "bg-blue-50/50 dark:bg-blue-950/40 border-blue-500 shadow-sm"
                      : "bg-slate-50/50 dark:bg-slate-900/40 border-slate-200/60 dark:border-slate-800 hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-slate-900 dark:text-white">
                      #{s.shipmentNumber}
                    </span>
                    <span className="text-[11px] font-semibold text-slate-500">
                      {s.cargoDetails?.weight} {s.cargoDetails?.unit}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                    <span>{s.pickupLocation?.city}</span>
                    <span>→</span>
                    <span>{s.destination?.city}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Driver & Vehicle Assignment Form */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-900 rounded-2xl p-6 shadow-sm space-y-6">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-emerald-600" />
              Dispatch Details
            </h2>
            {currentShipment ? (
              <div className="mt-3 p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-xs space-y-1">
                <div className="font-semibold text-slate-900 dark:text-white">
                  Shipment #{currentShipment.shipmentNumber} ({currentShipment.cargoDetails?.type || "Cargo"})
                </div>
                <div className="text-slate-500">
                  Route: {currentShipment.pickupLocation?.city} to {currentShipment.destination?.city}
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-400 mt-1">Please select a shipment to assign.</p>
            )}
          </div>

          {/* Smart Suggestions */}
          {currentShipment && (
            <div className="rounded-2xl border border-indigo-100 dark:border-indigo-900/50 bg-gradient-to-br from-indigo-50/80 to-purple-50/50 dark:from-indigo-950/30 dark:to-purple-950/20 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  Smart Suggestions
                  <span className="text-[10px] font-semibold text-slate-400 font-normal">
                    (ranked by rating &amp; cargo match)
                  </span>
                </h3>
                {suggestionsMeta?.finalPrice > 0 && (
                  <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                    Shipment value:{" "}
                    <span className="font-mono text-slate-900 dark:text-white">
                      {suggestionsMeta.finalPrice.toLocaleString()} ETB
                    </span>
                  </span>
                )}
              </div>

              {suggestionsLoading ? (
                <div className="py-3 text-center text-xs text-slate-400 animate-pulse">
                  Analyzing available drivers &amp; vehicles...
                </div>
              ) : suggestions.length === 0 ? (
                <div className="py-3 text-center text-xs text-slate-400">
                  No suitable driver + vehicle combination currently available.
                  Use manual assignment below.
                </div>
              ) : (
                <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
                  {suggestions.map((s, idx) => (
                    <div
                      key={s.driver._id}
                      className={`p-3 rounded-xl border bg-white dark:bg-slate-900 transition ${
                        idx === 0
                          ? "border-emerald-400 shadow-sm ring-1 ring-emerald-300/40"
                          : "border-slate-200 dark:border-slate-800"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            {idx === 0 && (
                              <span className="px-1.5 py-0.5 rounded-md bg-emerald-500 text-white text-[9px] font-extrabold uppercase tracking-wide">
                                Best Match
                              </span>
                            )}
                            <span className="text-sm font-bold text-slate-900 dark:text-white truncate">
                              {s.driver.fullName}
                            </span>
                            <span className="text-[11px] text-amber-500 font-semibold flex items-center gap-0.5">
                              <Star className="w-3 h-3 fill-current" />
                              {(s.driver.rating || 0).toFixed(1)}
                            </span>
                            <span className="text-[11px] text-slate-400">
                              {s.driver.completedTrips || 0} trips ·{" "}
                              {s.driver.experience || 0}y exp
                            </span>
                          </div>
                          <div className="mt-1 flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 flex-wrap">
                            <Truck className="w-3 h-3 shrink-0" />
                            <span className="font-semibold text-slate-700 dark:text-slate-300">
                              {s.vehicle.plateNumber}
                            </span>
                            <span>
                              ({s.vehicle.manufacturer} {s.vehicle.model},{" "}
                              {s.vehicle.capacityWeight} {s.vehicle.capacityUnit})
                            </span>
                            {!s.match.typeMatched && (
                              <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[9px] font-semibold uppercase">
                                type fallback
                              </span>
                            )}
                            {!s.match.capacitySufficient && (
                              <span className="px-1.5 py-0.5 rounded bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 text-[9px] font-semibold uppercase">
                                over capacity
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="shrink-0 text-right space-y-1.5">
                          <div className="flex items-center gap-1 justify-end text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                            <Wallet className="w-3.5 h-3.5" />
                            Driver pays out{" "}
                            <span className="font-mono">
                              {s.estimatedDriverPayment?.toLocaleString()} ETB
                            </span>
                          </div>
                          <button
                            onClick={() => assignSuggestion(s)}
                            disabled={assigningSuggestion === s.driver._id}
                            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-[11px] font-bold rounded-lg transition shadow-sm"
                          >
                            {assigningSuggestion === s.driver._id
                              ? "Assigning..."
                              : "Assign"}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <form onSubmit={handleAssign} className="space-y-5">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 mb-2">
                Available Drivers ({availableDrivers.length})
              </label>
              <select
                value={selectedDriverId}
                onChange={(e) => setSelectedDriverId(e.target.value)}
                required
                className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              >
                <option value="">-- Choose Available Driver --</option>
                {availableDrivers.map((d) => (
                  <option key={d._id} value={d._id}>
                    {d.fullName} ({d.licenseNumber}) - Exp: {d.experience} yrs
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 mb-2">
                Available Approved Vehicles ({availableVehicles.length})
              </label>
              <select
                value={selectedVehicleId}
                onChange={(e) => setSelectedVehicleId(e.target.value)}
                required
                className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              >
                <option value="">-- Choose Available Vehicle --</option>
                {availableVehicles.map((v) => (
                  <option key={v._id} value={v._id}>
                    {v.plateNumber} ({v.manufacturer} {v.model}) - Cap: {v.capacity?.weight} {v.capacity?.unit}
                  </option>
                ))}
              </select>
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-900">
              <button
                type="submit"
                disabled={submitting || !selectedShipmentId || !selectedDriverId || !selectedVehicleId}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl shadow-lg shadow-blue-500/20 transition disabled:opacity-50"
              >
                {submitting ? "Confirming Dispatch..." : "Confirm & Dispatch Shipment"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AssignDriver;

import { useState, useEffect } from "react";
import { shipmentService } from "../../services/shipmentService";
import { driverService } from "../../services/driverService";
import { vehicleService } from "../../services/vehicleService";
import { paymentService } from "../../services/paymentService";
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
  DollarSign,
  CreditCard,
  Eye,
} from "lucide-react";
import { motion } from "framer-motion";
import ShipmentTimeline from "../../components/common/ShipmentTimeline";
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

  // Tracking Modal State
  const [showTimelineModal, setShowTimelineModal] = useState(false);
  const [timelineShipment, setTimelineShipment] = useState(null);

  // Price Confirmation Modal State
  const [showPriceModal, setShowPriceModal] = useState(false);
  const [priceShipment, setPriceShipment] = useState(null);
  const [priceInput, setPriceInput] = useState("");
  const [savingPrice, setSavingPrice] = useState(false);

  useEffect(() => {
    fetchData(false);
  }, []);

  const fetchData = async (force = false) => {
    try {
      if (shipments.length === 0) setLoading(true);
      const [shipmentsRes, driversRes, vehiclesRes] = await Promise.all([
        shipmentService.getAllShipments({ limit: 100 }, { force, ttl: 30000 }),
        driverService.getAvailableDrivers({ force, ttl: 20000 }),
        vehicleService.getAllVehicles({ available: "true", limit: 100 }, { force, ttl: 30000 }),
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

    // Verify driver association (must match or be an available company fleet vehicle)
    const vehicleOwnerId = String(selectedVehicle.registeredBy?._id || selectedVehicle.registeredBy || "");
    const driverIdStr = String(selectedDriver._id || "");
    const driverUserIdStr = String(selectedDriver.userId?._id || selectedDriver.userId || "");

    if (vehicleOwnerId && vehicleOwnerId !== driverIdStr && vehicleOwnerId !== driverUserIdStr) {
      toast.error(`Vehicle ${selectedVehicle.plateNumber} is registered to another driver.`);
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

  const handleConfirmPrice = async () => {
    const numericPrice = parseFloat(priceInput);
    if (!numericPrice || numericPrice <= 0) {
      toast.error("Please enter a valid positive price amount in ETB");
      return;
    }

    try {
      setSavingPrice(true);
      await paymentService.confirmFinalPrice(priceShipment._id, numericPrice);
      toast.success("Final price confirmed! Customer has been notified to pay.");
      setShowPriceModal(false);
      setPriceShipment(null);
      setPriceInput("");
      await fetchData();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to confirm price");
    } finally {
      setSavingPrice(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: "bg-yellow-500/15 text-yellow-600 dark:text-yellow-400 border-yellow-500/20",
      approved: "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/20",
      assigned: "bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border-indigo-500/20",
      picked_up: "bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/20",
      in_transit: "bg-sky-500/15 text-sky-600 dark:text-sky-400 border-sky-500/20",
      delivered: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
      completed: "bg-slate-500/15 text-slate-600 dark:text-slate-400 border-slate-500/20",
      cancelled: "bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/20",
    };
    return colors[status] || "bg-gray-500/15 text-gray-600 dark:text-gray-400 border-gray-500/20";
  };

  const getPaymentStatusBadge = (status) => {
    const s = (status || "UNPAID").toUpperCase();
    if (s === "PAID") return "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/20";
    if (s === "PENDING") return "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/20";
    if (s === "FAILED") return "bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/20";
    return "bg-slate-500/15 text-slate-500 dark:text-slate-400 border-slate-500/20";
  };

  const handleApproveBooking = async (shipment) => {
    try {
      setLoading(true);
      await shipmentService.approveShipment(shipment._id);
      toast.success(`Booking ${shipment.shipmentNumber} approved successfully! Customer notified to pay.`);
      await fetchData();
    } catch (err) {
      console.error("Approve error:", err);
      toast.error(err.response?.data?.message || "Failed to approve booking");
    } finally {
      setLoading(false);
    }
  };

  const filteredShipments = shipments.filter((shipment) => {
    const custName = shipment.customerId?.companyName || shipment.customerId?.userId?.name || shipment.customerId?.contactPerson?.name || "";
    const custPhone = shipment.customerId?.userId?.phone || shipment.customerId?.contactPerson?.phone || "";

    const matchesSearch =
      (shipment.shipmentNumber || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (shipment.pickupLocation?.city || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (shipment.destination?.city || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      custName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      custPhone.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter = filterStatus === "all" || shipment.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const getCompatibleVehicles = () => {
    if (!selectedShipment) return vehicles;
    const cargoWeight = selectedShipment.cargoDetails?.weight || 0;
    const cargoUnit = selectedShipment.cargoDetails?.unit || "kg";
    const cargoWeightKg = cargoUnit === "ton" ? cargoWeight * 1000 : cargoWeight;

    return vehicles.filter((v) => {
      const cap = v.capacity?.weight || 0;
      const unit = v.capacity?.unit || "kg";
      const capKg = unit === "ton" ? cap * 1000 : cap;
      const isApproved = (v.approvalStatus || "approved") === "approved";
      const isAvailable = v.status === "available";
      return capKg >= cargoWeightKg && isApproved && isAvailable;
    });
  };

  return (
    <div className="space-y-6 p-1 max-w-7xl mx-auto">
      <Toaster position="top-right" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Shipment Management
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm font-medium mt-0.5">
            Review customer bookings, approve & confirm final transportation pricing, and dispatch fleet crews.
          </p>
        </div>
      </div>

      {/* Search & Status Filters */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 shadow-sm border border-slate-200/80 dark:border-slate-800 flex flex-col md:flex-row gap-4 items-stretch justify-between transition-colors">
        <div className="flex-1 relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search by tracking #, customer name, phone, origin, or destination..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all text-slate-900 dark:text-white placeholder-slate-400"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          {["all", "pending", "approved", "assigned", "in_transit", "delivered", "completed"].map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition capitalize cursor-pointer shrink-0 ${
                filterStatus === status
                  ? "bg-purple-600 text-white shadow-sm shadow-purple-500/20"
                  : "bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/60 border border-slate-200 dark:border-slate-700"
              }`}
            >
              {status === "all" ? "All Shipments" : status.replace("_", " ")}
            </button>
          ))}
        </div>
      </div>

      {/* Shipments Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden transition-colors">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-200/80 dark:border-slate-800">
              <tr>
                <th className="py-3.5 px-5">Shipment #</th>
                <th className="py-3.5 px-5">Customer</th>
                <th className="py-3.5 px-5">Route</th>
                <th className="py-3.5 px-5">Cargo</th>
                <th className="py-3.5 px-5">Pricing (ETB)</th>
                <th className="py-3.5 px-5">Payment</th>
                <th className="py-3.5 px-5">Delivery Crew</th>
                <th className="py-3.5 px-5">Status</th>
                <th className="py-3.5 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredShipments.length === 0 ? (
                <tr>
                  <td colSpan="9" className="text-center py-16 text-slate-500 dark:text-slate-400">
                    <Package className="mx-auto h-12 w-12 text-slate-300 dark:text-slate-700 mb-3" />
                    No shipments found matching the criteria.
                  </td>
                </tr>
              ) : (
                filteredShipments.map((shipment) => {
                  const finalPrice = shipment.finalPrice || shipment.pricing?.totalAmount || 0;
                  const estPrice = shipment.pricing?.baseAmount || 0;
                  const customerName = shipment.customerId?.companyName || shipment.customerId?.userId?.name || shipment.customerId?.contactPerson?.name || "Customer";
                  const customerContact = shipment.customerId?.userId?.phone || shipment.customerId?.contactPerson?.phone || shipment.customerId?.userId?.email || "";

                  return (
                    <tr key={shipment._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition">
                      <td className="px-5 py-4">
                        <div className="font-bold text-slate-900 dark:text-white font-mono">
                          {shipment.shipmentNumber || "UNASSIGNED"}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          {new Date(shipment.createdAt).toLocaleDateString()}
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <div className="font-bold text-slate-900 dark:text-white">
                          {customerName}
                        </div>
                        {customerContact && (
                          <div className="text-slate-400 text-[11px] font-mono">
                            {customerContact}
                          </div>
                        )}
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1 font-semibold text-slate-800 dark:text-slate-200">
                          <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                          <span>
                            {shipment.pickupLocation?.city} → {shipment.destination?.city}
                          </span>
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <div className="font-semibold text-slate-800 dark:text-slate-200">
                          {shipment.cargoDetails?.type}
                        </div>
                        <div className="text-slate-400 text-[11px]">
                          {shipment.cargoDetails?.weight} {shipment.cargoDetails?.unit}
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        {finalPrice > 0 ? (
                          <div>
                            <span className="font-extrabold text-slate-900 dark:text-white font-mono text-sm">
                              {Number(finalPrice).toLocaleString()} ETB
                            </span>
                            <span className="block text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                              Confirmed
                            </span>
                          </div>
                        ) : (
                          <div>
                            <span className="text-slate-400 font-mono">
                              Est: {Number(estPrice).toLocaleString()} ETB
                            </span>
                            <span className="block text-[10px] text-amber-600 dark:text-amber-400 font-semibold">
                              Unconfirmed
                            </span>
                          </div>
                        )}
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex px-2.5 py-1 text-[11px] font-extrabold rounded-full border capitalize ${getPaymentStatusBadge(
                            shipment.paymentStatus
                          )}`}
                        >
                          {shipment.paymentStatus || "UNPAID"}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        {shipment.driverId ? (
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1 font-semibold text-slate-800 dark:text-slate-200">
                              <User className="w-3.5 h-3.5 text-slate-400" />
                              <span>{shipment.driverId.fullName || "Driver"}</span>
                            </div>
                            <div className="flex items-center gap-1 text-[11px] text-slate-400">
                              <Truck className="w-3.5 h-3.5 text-slate-500" />
                              <span>{shipment.vehicleId?.plateNumber || "Vehicle"}</span>
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs text-amber-600 dark:text-amber-400 font-semibold bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                            Unassigned
                          </span>
                        )}
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex px-2.5 py-1 text-[11px] font-bold rounded-full border capitalize ${getStatusColor(
                            shipment.status
                          )}`}
                        >
                          {shipment.status.replace("_", " ")}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Approve Booking Action if Pending */}
                          {shipment.status === "pending" && (
                            <button
                              onClick={() => handleApproveBooking(shipment)}
                              className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-xs transition cursor-pointer flex items-center gap-1"
                              title="Approve Booking & Confirm Price"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Approve</span>
                            </button>
                          )}

                          {/* Confirm Price Action */}
                          <button
                            onClick={() => {
                              setPriceShipment(shipment);
                              setPriceInput(String(finalPrice || estPrice || ""));
                              setShowPriceModal(true);
                            }}
                            className="px-2.5 py-1.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 rounded-xl font-bold border border-emerald-200 dark:border-emerald-800/40 transition cursor-pointer text-xs flex items-center gap-1"
                            title="Set / Confirm Final Price (ETB)"
                          >
                            <DollarSign className="w-3.5 h-3.5" />
                            <span>{finalPrice > 0 ? "Price" : "Set Price"}</span>
                          </button>

                          {/* Track Live Timeline Action */}
                          <button
                            onClick={() => {
                              setTimelineShipment(shipment);
                              setShowTimelineModal(true);
                            }}
                            className="px-2.5 py-1.5 bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-900/40 rounded-xl font-bold border border-purple-200 dark:border-purple-800/40 transition cursor-pointer text-xs flex items-center gap-1"
                            title="Inspect 5-Stage Live Timeline"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Track</span>
                          </button>

                          {/* Assign Driver Action */}
                          {(!shipment.driverId || shipment.status === "pending" || shipment.status === "approved") && (
                            <button
                              onClick={() => {
                                setSelectedShipment(shipment);
                                setAssignData({ driverId: "", vehicleId: "" });
                                setShowAssignModal(true);
                              }}
                              className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer"
                            >
                              Assign
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Set / Confirm Final Price Modal */}
      {showPriceModal && priceShipment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                  Confirm Transportation Price
                </h3>
                <p className="text-xs text-slate-400 font-mono mt-0.5">
                  Shipment: {priceShipment.shipmentNumber}
                </p>
              </div>
              <button
                onClick={() => setShowPriceModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-400">Route:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {priceShipment.pickupLocation?.city} → {priceShipment.destination?.city}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Cargo:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {priceShipment.cargoDetails?.type} ({priceShipment.cargoDetails?.weight} {priceShipment.cargoDetails?.unit})
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Estimated Price:</span>
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                    {Number(priceShipment.pricing?.baseAmount || 0).toLocaleString()} ETB
                  </span>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-900 dark:text-white flex items-center justify-between">
                  <span>Confirmed Final Price (ETB)</span>
                  <span className="text-[10px] text-purple-600 dark:text-purple-400">Chapa Checkout Amount</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-slate-400 text-xs">
                    ETB
                  </span>
                  <input
                    type="number"
                    min="1"
                    step="any"
                    value={priceInput}
                    onChange={(e) => setPriceInput(e.target.value)}
                    placeholder="Enter final price in ETB (e.g. 50000)"
                    className="w-full pl-14 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-mono font-extrabold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                    autoFocus
                  />
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Setting this price will notify the customer with a <strong>PAY NOW</strong> button for Chapa payment.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setShowPriceModal(false)}
                className="px-4 py-2.5 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold rounded-xl transition"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmPrice}
                disabled={savingPrice}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md shadow-emerald-500/20 transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {savingPrice ? (
                  <Loader className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Confirm Price & Notify Customer</span>
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Manual Crew Assignment Modal */}
      {showAssignModal && selectedShipment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Assign Driver & Vehicle</h3>
                <p className="text-xs text-slate-400 font-mono">Shipment: {selectedShipment.shipmentNumber}</p>
              </div>
              <button
                onClick={() => setShowAssignModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Driver Select */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Select Available Driver
                </label>
                <select
                  value={assignData.driverId}
                  onChange={(e) => {
                    const dId = e.target.value;
                    const matchedVehicle = vehicles.find(
                      (v) =>
                        (String(v.registeredBy?._id || v.registeredBy) === String(dId)) &&
                        v.status === "available" &&
                        (v.approvalStatus || "approved") === "approved"
                    );
                    setAssignData((prev) => ({
                      ...prev,
                      driverId: dId,
                      vehicleId: matchedVehicle ? matchedVehicle._id : prev.vehicleId,
                    }));
                  }}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-purple-500/20 focus:outline-none"
                >
                  <option value="">-- Choose Available Driver --</option>
                  {drivers
                    .filter((d) => d.status === "available")
                    .map((d) => (
                      <option key={d._id} value={d._id}>
                        {d.fullName || d.user?.name} (Status: Available)
                      </option>
                    ))}
                </select>
              </div>

              {/* Vehicle Select */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Select Approved Vehicle
                </label>
                <select
                  value={assignData.vehicleId}
                  onChange={(e) => {
                    const vId = e.target.value;
                    const v = vehicles.find((veh) => String(veh._id) === String(vId));
                    const ownerId = v?.registeredBy?._id || v?.registeredBy;
                    setAssignData((prev) => ({
                      ...prev,
                      vehicleId: vId,
                      driverId: ownerId ? String(ownerId) : prev.driverId,
                    }));
                  }}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-purple-500/20 focus:outline-none"
                >
                  <option value="">-- Choose Compatible Vehicle --</option>
                  {getCompatibleVehicles().map((v) => (
                    <option key={v._id} value={v._id}>
                      {v.plateNumber} ({v.type}) - Cap: {v.capacity?.weight} {v.capacity?.unit} {v.registeredBy ? "(Driver Owned)" : "(Fleet)"}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setShowAssignModal(false)}
                className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold rounded-xl transition"
              >
                Cancel
              </button>
              <button
                onClick={handleAssign}
                className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl shadow transition"
              >
                Confirm Assignment
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Live Timeline Modal for Admin Inspection */}
      {showTimelineModal && timelineShipment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-4xl w-full p-6 shadow-2xl space-y-5 my-8"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Live Tracking Inspector
                </span>
                <h3 className="text-xl font-extrabold text-slate-900 dark:text-white font-mono">
                  {timelineShipment.shipmentNumber}
                </h3>
              </div>
              <button
                onClick={() => setShowTimelineModal(false)}
                className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 5-Stage Timeline */}
            <ShipmentTimeline
              shipment={timelineShipment}
              currentStatus={timelineShipment.status}
              isDriver={false}
              showDetailsCard={true}
            />

            <div className="flex justify-end pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setShowTimelineModal(false)}
                className="px-5 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-white text-xs font-bold rounded-xl transition"
              >
                Close Inspector
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default Shipments;

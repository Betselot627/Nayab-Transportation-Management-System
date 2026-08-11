import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { vehicleService } from "../../services/vehicleService";
import Loading from "../../components/common/Loading";
import {
  Plus,
  Truck,
  FileText,
  AlertCircle,
  Clock,
  CheckCircle2,
  XCircle,
  User,
  Eye,
  Calendar,
  X,
  ShieldAlert,
  Search,
  Filter,
  Sparkles,
  ExternalLink,
  Fuel,
  Weight,
  Layers,
  Check,
  RefreshCw,
} from "lucide-react";
import toast from "react-hot-toast";

const MyVehicles = () => {
  const navigate = useNavigate();
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchVehicles(true);
    const interval = setInterval(() => {
      fetchVehicles(false);
    }, 6000);

    return () => clearInterval(interval);
  }, []);

  const fetchVehicles = async (showLoader = false) => {
    try {
      if (showLoader) setLoading(true);
      const response = await vehicleService.getAllVehicles();
      setVehicles(response.data || []);
    } catch (error) {
      console.error("Error fetching driver vehicles:", error);
      if (showLoader) toast.error("Failed to load vehicle fleet");
    } finally {
      if (showLoader) setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "available":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Available
          </span>
        );
      case "in_use":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
            On Trip
          </span>
        );
      case "maintenance":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            Maintenance
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
            Inactive
          </span>
        );
    }
  };

  const getApprovalBadge = (approvalStatus) => {
    switch (approvalStatus) {
      case "approved":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            Approved
          </span>
        );
      case "pending":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 animate-pulse">
            <Clock className="w-3.5 h-3.5 text-amber-500" />
            Pending Approval
          </span>
        );
      case "rejected":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
            <XCircle className="w-3.5 h-3.5 text-rose-500" />
            Rejected
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
            {approvalStatus || "Pending"}
          </span>
        );
    }
  };

  const approvedCount = vehicles.filter(
    (v) => (v.approvalStatus || "pending") === "approved"
  ).length;
  const pendingCount = vehicles.filter(
    (v) => (v.approvalStatus || "pending") === "pending"
  ).length;
  const rejectedCount = vehicles.filter(
    (v) => v.approvalStatus === "rejected"
  ).length;

  const filteredVehicles = vehicles.filter((v) => {
    const matchesTab =
      activeTab === "all"
        ? true
        : activeTab === "approved"
        ? (v.approvalStatus || "pending") === "approved"
        : activeTab === "pending"
        ? (v.approvalStatus || "pending") === "pending"
        : v.approvalStatus === "rejected";

    const term = searchQuery.toLowerCase();
    const matchesSearch =
      !searchQuery ||
      v.plateNumber?.toLowerCase().includes(term) ||
      v.manufacturer?.toLowerCase().includes(term) ||
      v.model?.toLowerCase().includes(term) ||
      v.type?.toLowerCase().includes(term);

    return matchesTab && matchesSearch;
  });

  if (loading && vehicles.length === 0) {
    return <Loading />;
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8 max-w-7xl mx-auto min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200">
      {/* Top Banner & Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              My Vehicles
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
              Driver Fleet
            </span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium">
            Manage your registered transport vehicles, check admin approval
            milestones, and inspect active trip assignments.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchVehicles(true)}
            title="Refresh Fleet"
            className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-900 text-slate-600 dark:text-slate-400 transition"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => navigate("/driver/register-vehicle")}
            className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl font-bold text-sm shadow-lg shadow-purple-500/20 hover:shadow-purple-500/30 transition-all flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Register New Vehicle</span>
          </button>
        </div>
      </div>

      {/* Fleet Overview Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<Truck className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />}
          label="Total Vehicles"
          value={vehicles.length}
          color="bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800/60"
        />
        <StatCard
          icon={<CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />}
          label="Approved Fleet"
          value={approvedCount}
          color="bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/60"
        />
        <StatCard
          icon={<Clock className="w-5 h-5 text-amber-600 dark:text-amber-400" />}
          label="Pending Review"
          value={pendingCount}
          color="bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/60"
        />
        <StatCard
          icon={<XCircle className="w-5 h-5 text-rose-600 dark:text-rose-400" />}
          label="Rejected Requests"
          value={rejectedCount}
          color="bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800/60"
        />
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-200/80 dark:bg-slate-900 rounded-2xl border border-slate-300/60 dark:border-slate-800 overflow-x-auto no-scrollbar">
          {[
            { id: "all", label: "All Vehicles", count: vehicles.length },
            { id: "approved", label: "Approved", count: approvedCount },
            { id: "pending", label: "Pending Approval", count: pendingCount },
            { id: "rejected", label: "Rejected", count: rejectedCount },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === tab.id
                  ? "bg-white dark:bg-slate-800 text-purple-600 dark:text-purple-400 shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                  activeTab === tab.id
                    ? "bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300"
                    : "bg-slate-300/60 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search plate, model, type..."
            className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Main Vehicle Cards Grid */}
      {filteredVehicles.length === 0 ? (
        <div className="text-center py-16 px-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-purple-50 dark:bg-purple-950/50 border border-purple-200 dark:border-purple-800/50 flex items-center justify-center mx-auto text-purple-600 dark:text-purple-400">
            <Truck className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              No vehicles found
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
              {searchQuery
                ? `No vehicles matching "${searchQuery}". Try a different filter or search term.`
                : activeTab !== "all"
                ? `You have no vehicles under the "${activeTab}" status.`
                : "You haven't registered any vehicles yet. Submit your first vehicle for admin review."}
            </p>
          </div>
          {!searchQuery && activeTab === "all" && (
            <button
              onClick={() => navigate("/driver/register-vehicle")}
              className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition shadow-md inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Register Vehicle Now
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredVehicles.map((vehicle) => {
            const isApproved = (vehicle.approvalStatus || "pending") === "approved";
            const isPending = (vehicle.approvalStatus || "pending") === "pending";
            const isRejected = vehicle.approvalStatus === "rejected";

            return (
              <div
                key={vehicle._id}
                className="group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-xs hover:shadow-xl hover:border-purple-300 dark:hover:border-purple-800/80 transition-all duration-300 flex flex-col justify-between"
              >
                {/* Top Image & Header */}
                <div className="relative h-48 bg-slate-100 dark:bg-slate-800/50 overflow-hidden border-b border-slate-200 dark:border-slate-800 flex items-center justify-center">
                  {vehicle.images && vehicle.images.length > 0 ? (
                    <img
                      src={vehicle.images[0]}
                      alt={`${vehicle.manufacturer} ${vehicle.model}`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="text-slate-400 dark:text-slate-600 flex flex-col items-center gap-2">
                      <Truck className="w-12 h-12" />
                      <span className="text-[10px] font-bold uppercase tracking-wider">
                        Fleet Vehicle
                      </span>
                    </div>
                  )}

                  {/* Badges Overlays */}
                  <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                    <span className="px-2.5 py-1 rounded-xl text-[10px] font-extrabold uppercase tracking-wider bg-slate-900/80 backdrop-blur-md text-white border border-white/10">
                      {vehicle.type}
                    </span>
                  </div>

                  <div className="absolute top-3 right-3 flex flex-col items-end gap-1.5">
                    {getApprovalBadge(vehicle.approvalStatus)}
                    {isApproved && getStatusBadge(vehicle.status)}
                  </div>
                </div>

                {/* Details Body */}
                <div className="p-5 flex-1 space-y-4">
                  {/* Title & Plate */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-extrabold text-slate-900 dark:text-white text-base leading-snug group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                        {vehicle.manufacturer} {vehicle.model}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="font-mono text-xs font-bold px-2.5 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
                          {vehicle.plateNumber}
                        </span>
                        <span className="text-xs text-slate-400 font-medium">
                          {vehicle.year}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Specifications Grid */}
                  <div className="grid grid-cols-2 gap-2.5 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/80 text-xs">
                    <div className="flex items-center gap-2">
                      <Weight className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-[9px] font-bold text-slate-400 uppercase">
                          Capacity
                        </p>
                        <p className="font-bold text-slate-800 dark:text-slate-200 truncate">
                          {vehicle.capacity?.weight} {vehicle.capacity?.unit}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Fuel className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-[9px] font-bold text-slate-400 uppercase">
                          Fuel
                        </p>
                        <p className="font-bold text-slate-800 dark:text-slate-200 capitalize truncate">
                          {vehicle.fuelType || "Diesel"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Workflow Status Banners */}
                  {isPending && (
                    <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 flex items-start gap-2.5">
                      <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5 animate-spin" />
                      <div>
                        <p className="text-xs font-bold text-amber-900 dark:text-amber-200">
                          Awaiting Admin Approval
                        </p>
                        <p className="text-[11px] text-amber-700 dark:text-amber-300 mt-0.5 leading-relaxed">
                          Your vehicle documents are under review by fleet
                          administrators. You cannot accept trips until approved.
                        </p>
                      </div>
                    </div>
                  )}

                  {isRejected && (
                    <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/60 flex items-start gap-2.5">
                      <ShieldAlert className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-bold text-rose-900 dark:text-rose-200">
                          Registration Rejected
                        </p>
                        <p className="text-[11px] text-rose-700 dark:text-rose-300 mt-0.5 font-medium leading-relaxed">
                          {vehicle.rejectionReason ||
                            "Vehicle documentation did not meet fleet requirements."}
                        </p>
                      </div>
                    </div>
                  )}

                  {isApproved && (
                    <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 flex items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-1.5 text-emerald-800 dark:text-emerald-300 font-bold">
                        <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        <span>Active Fleet Member</span>
                      </div>
                      <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-mono">
                        Ready for Trips
                      </span>
                    </div>
                  )}

                  {/* Active Customer Assignment (if assigned) */}
                  {vehicle.assignedCustomer && (
                    <div className="p-3.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800/60 text-xs space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-indigo-700 dark:text-indigo-300 uppercase tracking-wide">
                          Current Assignment
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-200/60 dark:bg-indigo-900/60 text-indigo-800 dark:text-indigo-200">
                          {vehicle.assignedItemType || "Cargo"}
                        </span>
                      </div>
                      {vehicle.assignedCustomer.userId && (
                        <div className="flex items-center gap-2 pt-1 border-t border-indigo-200/50 dark:border-indigo-800/40">
                          <User className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                          <p className="font-bold text-slate-800 dark:text-slate-200 text-xs truncate">
                            {vehicle.assignedCustomer.userId.name}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Card Action Footer */}
                <div className="p-4 bg-slate-50 dark:bg-slate-800/30 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                  <span className="text-[10px] text-slate-400 font-mono">
                    Added {new Date(vehicle.createdAt).toLocaleDateString()}
                  </span>
                  <button
                    onClick={() => setSelectedVehicle(vehicle)}
                    className="px-3.5 py-1.5 bg-slate-900 dark:bg-slate-800 hover:bg-purple-600 dark:hover:bg-purple-600 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Specifications</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Specifications & Document Inspection Modal */}
      {selectedVehicle && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full border border-slate-200 dark:border-slate-800 overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
              <div>
                <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
                  {selectedVehicle.manufacturer} {selectedVehicle.model}
                </h3>
                <p className="text-xs font-mono text-slate-500 dark:text-slate-400 mt-0.5">
                  Plate: {selectedVehicle.plateNumber} • {selectedVehicle.year}
                </p>
              </div>
              <button
                onClick={() => setSelectedVehicle(null)}
                className="p-1.5 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              {/* Photo Gallery */}
              {selectedVehicle.images && selectedVehicle.images.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Vehicle Photos
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {selectedVehicle.images.map((img, index) => (
                      <div
                        key={index}
                        className="h-28 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-slate-100 dark:bg-slate-800"
                      >
                        <img
                          src={img}
                          alt={`Vehicle photo ${index + 1}`}
                          className="w-full h-full object-cover hover:scale-105 transition-transform"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Status Banner */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">
                    Approval Status
                  </p>
                  <div className="mt-1">
                    {getApprovalBadge(selectedVehicle.approvalStatus)}
                  </div>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">
                    Operational Status
                  </p>
                  <div className="mt-1">
                    {getStatusBadge(selectedVehicle.status)}
                  </div>
                </div>
              </div>

              {/* Technical Specifications */}
              <div className="space-y-2">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Technical Specifications
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/80 text-xs">
                  <div>
                    <p className="text-slate-400 text-[10px]">Type</p>
                    <p className="font-bold text-slate-900 dark:text-white capitalize mt-0.5">
                      {selectedVehicle.type}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-[10px]">Weight Limit</p>
                    <p className="font-bold text-slate-900 dark:text-white mt-0.5">
                      {selectedVehicle.capacity?.weight}{" "}
                      {selectedVehicle.capacity?.unit}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-[10px]">Fuel</p>
                    <p className="font-bold text-slate-900 dark:text-white capitalize mt-0.5">
                      {selectedVehicle.fuelType || "Diesel"}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-[10px]">Color</p>
                    <p className="font-bold text-slate-900 dark:text-white capitalize mt-0.5">
                      {selectedVehicle.color || "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-[10px]">Submitted Date</p>
                    <p className="font-bold text-slate-900 dark:text-white mt-0.5">
                      {new Date(selectedVehicle.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-[10px]">Approval Date</p>
                    <p className="font-bold text-slate-900 dark:text-white mt-0.5">
                      {selectedVehicle.approvalDate
                        ? new Date(
                            selectedVehicle.approvalDate
                          ).toLocaleDateString()
                        : "Pending"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Uploaded Documents */}
              <div className="space-y-2">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Verification Documents & Certificates
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  {selectedVehicle.registration?.document && (
                    <a
                      href={selectedVehicle.registration.document}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700/80 font-bold text-slate-800 dark:text-slate-200 flex items-center justify-between transition group"
                    >
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                        <span>Registration Certificate</span>
                      </div>
                      <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-purple-500" />
                    </a>
                  )}

                  {selectedVehicle.insurance?.document && (
                    <a
                      href={selectedVehicle.insurance.document}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700/80 font-bold text-slate-800 dark:text-slate-200 flex items-center justify-between transition group"
                    >
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        <span>Insurance Policy Document</span>
                      </div>
                      <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-500" />
                    </a>
                  )}

                  {selectedVehicle.inspectionDocument && (
                    <a
                      href={selectedVehicle.inspectionDocument}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700/80 font-bold text-slate-800 dark:text-slate-200 flex items-center justify-between transition group"
                    >
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                        <span>Inspection Fitness Certificate</span>
                      </div>
                      <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-amber-500" />
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-200 dark:border-slate-800 flex justify-end shrink-0">
              <button
                onClick={() => setSelectedVehicle(null)}
                className="px-5 py-2 rounded-xl bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white font-bold text-xs transition cursor-pointer"
              >
                Close View
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const StatCard = ({ icon, label, value, color }) => {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 sm:p-5 rounded-3xl flex items-center justify-between shadow-xs">
      <div className="space-y-1">
        <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">
          {label}
        </p>
        <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
          {value}
        </p>
      </div>
      <div className={`p-3 rounded-2xl border ${color}`}>{icon}</div>
    </div>
  );
};

export default MyVehicles;
export { MyVehicles };

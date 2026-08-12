import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { vehicleService } from "../../services/vehicleService";
import {
  Search,
  Plus,
  Trash2,
  X,
  Download,
  Filter,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  FileText,
  Truck,
  User,
  Calendar,
  ExternalLink,
  Loader,
  CheckCircle2,
  Clock,
  XCircle,
  ShieldAlert,
  Eye,
  Check,
  AlertTriangle,
  RefreshCw,
  Phone,
  Mail,
  ShieldCheck,
  Fuel,
  Weight,
} from "lucide-react";
import Badge from "../../components/common/Badge";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import toast from "react-hot-toast";

const Vehicles = () => {
  const navigate = useNavigate();
  const [vehicles, setVehicles] = useState([]);
  const [pendingVehicles, setPendingVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(8);
  const [filterGroup, setFilterGroup] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [activeTab, setActiveTab] = useState("all"); // 'all' | 'pending' | 'approved' | 'rejected'

  // Sorting States
  const [sortField, setSortField] = useState("createdAt");
  const [sortDirection, setSortDirection] = useState("desc");

  // Deletion Dialog State
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  // Detail Modal State
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Reject Modal State
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectVehicleId, setRejectVehicleId] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [submittingAction, setSubmittingAction] = useState(false);

  // Load vehicles
  useEffect(() => {
    fetchVehicles(false);
  }, []);

  const fetchVehicles = async (force = false) => {
    try {
      if (vehicles.length === 0) setLoading(true);
      const [allRes, pendingRes] = await Promise.all([
        vehicleService.getAllVehicles({ limit: 100 }, { force, ttl: 35000 }).catch(() => ({ data: [] })),
        vehicleService.getPendingVehicles({ force, ttl: 20000 }).catch(() => ({ data: [] })),
      ]);

      setVehicles(allRes.data || []);
      setPendingVehicles(pendingRes.data || []);
    } catch (err) {
      console.error("Failed to load fleet vehicles:", err);
      toast.error("Failed to load vehicle data");
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (field) => {
    const isAsc = sortField === field && sortDirection === "asc";
    setSortDirection(isAsc ? "desc" : "asc");
    setSortField(field);
  };

  const triggerDelete = (id, e) => {
    if (e) e.stopPropagation();
    setDeleteId(id);
    setConfirmDeleteOpen(true);
  };

  const executeDelete = async () => {
    try {
      await vehicleService.deleteVehicle(deleteId);
      toast.success("Vehicle deleted successfully");
      fetchVehicles();
      if (selectedVehicle && selectedVehicle._id === deleteId) {
        setSelectedVehicle(null);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete vehicle");
    }
  };

  const handleApproveVehicle = async (id, e) => {
    if (e) e.stopPropagation();
    try {
      setSubmittingAction(true);
      await vehicleService.approveVehicle(id);
      toast.success("Vehicle approved successfully! Driver has been notified.");
      fetchVehicles();
      if (selectedVehicle && selectedVehicle._id === id) {
        setSelectedVehicle((prev) => ({
          ...prev,
          approvalStatus: "approved",
          status: "available",
        }));
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to approve vehicle");
    } finally {
      setSubmittingAction(false);
    }
  };

  const openRejectModal = (id, e) => {
    if (e) e.stopPropagation();
    setRejectVehicleId(id);
    setRejectReason("");
    setRejectModalOpen(true);
  };

  const executeRejectVehicle = async () => {
    try {
      setSubmittingAction(true);
      await vehicleService.rejectVehicle(rejectVehicleId, rejectReason);
      toast.success("Vehicle rejected and driver notified.");
      setRejectModalOpen(false);
      fetchVehicles();
      if (selectedVehicle && selectedVehicle._id === rejectVehicleId) {
        setSelectedVehicle((prev) => ({
          ...prev,
          approvalStatus: "rejected",
          status: "inactive",
          rejectionReason: rejectReason,
        }));
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to reject vehicle");
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleVehicleClick = async (vehicle) => {
    try {
      setLoadingDetails(true);
      const res = await vehicleService.getVehicleById(vehicle._id);
      if (res && res.data) {
        setSelectedVehicle(res.data);
      } else {
        setSelectedVehicle(vehicle);
      }
    } catch (err) {
      setSelectedVehicle(vehicle);
    } finally {
      setLoadingDetails(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "available":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Available
          </span>
        );
      case "in_use":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-sky-100 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
            In Use
          </span>
        );
      case "maintenance":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            Maintenance
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
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
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Approved
          </span>
        );
      case "pending":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/30 animate-pulse">
            <Clock className="w-3.5 h-3.5" />
            Pending Approval
          </span>
        );
      case "rejected":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
            <XCircle className="w-3.5 h-3.5" />
            Rejected
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20">
            {approvalStatus || "Pending"}
          </span>
        );
    }
  };

  // Searching & Filtering
  const filteredVehicles = vehicles
    .filter((v) => {
      const term = searchTerm.toLowerCase();
      const matchesSearch =
        !searchTerm ||
        v.plateNumber?.toLowerCase().includes(term) ||
        v.manufacturer?.toLowerCase().includes(term) ||
        v.model?.toLowerCase().includes(term) ||
        v.type?.toLowerCase().includes(term) ||
        v.registeredBy?.fullName?.toLowerCase().includes(term);

      const matchesTab =
        activeTab === "all"
          ? true
          : activeTab === "pending"
          ? (v.approvalStatus || "pending") === "pending"
          : activeTab === "approved"
          ? (v.approvalStatus || "pending") === "approved"
          : v.approvalStatus === "rejected";

      const matchesGroup = filterGroup === "all" || v.type === filterGroup;
      const matchesStatus = filterStatus === "all" || v.status === filterStatus;

      return matchesSearch && matchesTab && matchesGroup && matchesStatus;
    })
    .sort((a, b) => {
      let valA = a[sortField] || "";
      let valB = b[sortField] || "";

      if (sortField === "year") {
        valA = Number(valA);
        valB = Number(valB);
      }

      if (valA < valB) return sortDirection === "asc" ? -1 : 1;
      if (valA > valB) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentVehicles = filteredVehicles.slice(
    indexOfFirstItem,
    indexOfLastItem
  );
  const totalPages = Math.ceil(filteredVehicles.length / itemsPerPage) || 1;

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8 max-w-7xl mx-auto min-h-screen text-slate-900 dark:text-slate-100 transition-colors">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Vehicle Management
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
              Fleet Admin
            </span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium">
            Review driver registrations, approve/reject fleet additions, and
            manage vehicle assignments.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchVehicles}
            title="Refresh"
            className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-900 text-slate-600 dark:text-slate-400 transition"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <Link
            to="/admin/vehicles/add"
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm shadow-md shadow-blue-500/20 hover:shadow-blue-500/30 transition-all flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Add Fleet Vehicle</span>
          </Link>
        </div>
      </div>

      {/* Pending Approvals Spotlight Section (If any pending vehicles exist) */}
      {pendingVehicles.length > 0 && (
        <div className="p-6 rounded-3xl bg-amber-500/10 border border-amber-500/30 dark:bg-amber-950/20 dark:border-amber-800/60 space-y-4 animate-in fade-in">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-amber-500/20 text-amber-700 dark:text-amber-400">
                <Clock className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <h2 className="text-sm font-extrabold text-amber-950 dark:text-amber-200 uppercase tracking-wide">
                  Pending Vehicle Registrations ({pendingVehicles.length})
                </h2>
                <p className="text-xs text-amber-800 dark:text-amber-400 mt-0.5">
                  The following driver vehicles require review and authorization
                  before being assigned trips.
                </p>
              </div>
            </div>
            <button
              onClick={() => setActiveTab("pending")}
              className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-xs transition shadow-sm"
            >
              View All Pending ({pendingVehicles.length})
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pendingVehicles.slice(0, 3).map((pv) => (
              <div
                key={pv._id}
                onClick={() => handleVehicleClick(pv)}
                className="p-4.5 rounded-2xl bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-800/60 hover:border-amber-400 transition shadow-sm space-y-3 cursor-pointer"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                      {pv.manufacturer} {pv.model}
                    </h3>
                    <span className="font-mono text-xs font-bold text-amber-800 dark:text-amber-400">
                      {pv.plateNumber}
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                    {pv.type}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 text-xs space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 text-[10px]">Driver</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200 truncate">
                      {pv.registeredBy?.fullName || "Driver"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 text-[10px]">Capacity</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {pv.capacity?.weight} {pv.capacity?.unit}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 text-[10px]">Submitted</span>
                    <span className="text-slate-600 dark:text-slate-400">
                      {new Date(pv.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={(e) => handleApproveVehicle(pv._id, e)}
                    disabled={submittingAction}
                    className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Approve</span>
                  </button>
                  <button
                    onClick={(e) => openRejectModal(pv._id, e)}
                    disabled={submittingAction}
                    className="flex-1 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs transition flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Reject</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filter Tabs & Search Controls */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
          {/* Navigation Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-x-auto no-scrollbar">
            {[
              { id: "all", label: "All Vehicles", count: vehicles.length },
              {
                id: "approved",
                label: "Approved",
                count: vehicles.filter(
                  (v) => (v.approvalStatus || "pending") === "approved"
                ).length,
              },
              {
                id: "pending",
                label: "Pending",
                count: pendingVehicles.length,
              },
              {
                id: "rejected",
                label: "Rejected",
                count: vehicles.filter((v) => v.approvalStatus === "rejected")
                  .length,
              },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setCurrentPage(1);
                }}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap flex items-center gap-1.5 ${
                  activeTab === tab.id
                    ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                    activeTab === tab.id
                      ? "bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300"
                      : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400"
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Search & Filters */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Search plate, model, driver..."
                className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
              />
            </div>

            <select
              value={filterGroup}
              onChange={(e) => {
                setFilterGroup(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-700 dark:text-slate-300 focus:outline-none"
            >
              <option value="all">All Types</option>
              <option value="truck">Trucks</option>
              <option value="van">Vans</option>
              <option value="pickup">Pickups</option>
              <option value="trailer">Trailers</option>
            </select>

            <select
              value={filterStatus}
              onChange={(e) => {
                setFilterStatus(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-700 dark:text-slate-300 focus:outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="available">Available</option>
              <option value="in_use">In Use</option>
              <option value="maintenance">Maintenance</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>

        {/* Vehicles Table */}
        <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th
                  onClick={() => handleSort("plateNumber")}
                  className="px-4 py-3.5 cursor-pointer hover:text-slate-900 dark:hover:text-white"
                >
                  <div className="flex items-center gap-1">
                    <span>Plate / Model</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="px-4 py-3.5">Type & Year</th>
                <th className="px-4 py-3.5">Driver / Owner</th>
                <th className="px-4 py-3.5">Capacity</th>
                <th className="px-4 py-3.5">Approval</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-4 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {currentVehicles.length > 0 ? (
                currentVehicles.map((vehicle) => {
                  const isPending =
                    (vehicle.approvalStatus || "pending") === "pending";
                  const isApproved =
                    (vehicle.approvalStatus || "pending") === "approved";

                  return (
                    <tr
                      key={vehicle._id}
                      onClick={() => handleVehicleClick(vehicle)}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 cursor-pointer transition"
                    >
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0">
                            {vehicle.images && vehicle.images.length > 0 ? (
                              <img
                                src={vehicle.images[0]}
                                alt=""
                                className="w-full h-full object-cover rounded-xl"
                              />
                            ) : (
                              <Truck className="w-4 h-4 text-slate-400" />
                            )}
                          </div>
                          <div>
                            <p className="font-extrabold text-slate-900 dark:text-white font-mono">
                              {vehicle.plateNumber}
                            </p>
                            <p className="text-slate-500 dark:text-slate-400 text-[11px]">
                              {vehicle.manufacturer} {vehicle.model}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3.5">
                        <span className="capitalize font-bold text-slate-800 dark:text-slate-200">
                          {vehicle.type}
                        </span>
                        <span className="text-slate-400 text-[10px] block">
                          Model {vehicle.year}
                        </span>
                      </td>

                      <td className="px-4 py-3.5">
                        {vehicle.registeredBy ? (
                          <div>
                            <p className="font-bold text-slate-900 dark:text-white">
                              {vehicle.registeredBy.fullName}
                            </p>
                            <p className="text-slate-400 text-[10px]">
                              {vehicle.registeredBy.phone ||
                                vehicle.registeredBy.licenseNumber ||
                                "Driver"}
                            </p>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">
                            Fleet Direct
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3.5">
                        <span className="font-bold text-slate-800 dark:text-slate-200">
                          {vehicle.capacity?.weight} {vehicle.capacity?.unit}
                        </span>
                        <span className="text-slate-400 text-[10px] block capitalize">
                          {vehicle.fuelType || "Diesel"}
                        </span>
                      </td>

                      <td className="px-4 py-3.5">
                        {getApprovalBadge(vehicle.approvalStatus)}
                      </td>

                      <td className="px-4 py-3.5">
                        {getStatusBadge(vehicle.status)}
                      </td>

                      <td className="px-4 py-3.5 text-right">
                        <div
                          className="flex items-center justify-end gap-1.5"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {isPending && (
                            <>
                              <button
                                onClick={(e) =>
                                  handleApproveVehicle(vehicle._id, e)
                                }
                                title="Approve"
                                className="p-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500 text-emerald-600 hover:text-white transition"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={(e) =>
                                  openRejectModal(vehicle._id, e)
                                }
                                title="Reject"
                                className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500 text-rose-600 hover:text-white transition"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => handleVehicleClick(vehicle)}
                            title="Inspect Details"
                            className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={(e) => triggerDelete(vehicle._id, e)}
                            title="Delete"
                            className="p-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-500 text-rose-600 hover:text-white transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td
                    colSpan={7}
                    className="p-12 text-center text-slate-400 space-y-2"
                  >
                    <Truck className="w-8 h-8 text-slate-300 dark:text-slate-700 mx-auto" />
                    <p className="text-xs font-bold">No vehicles found</p>
                    <p className="text-[11px] text-slate-500">
                      No vehicles matching the selected filters or search terms.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-2">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Showing {indexOfFirstItem + 1} to{" "}
              {Math.min(indexOfLastItem, filteredVehicles.length)} of{" "}
              {filteredVehicles.length} vehicles
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 transition"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <span className="px-3 text-xs font-bold">
                {currentPage} / {totalPages}
              </span>
              <button
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                disabled={currentPage === totalPages}
                className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 transition"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Rejection Reason Modal */}
      {rejectModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full border border-slate-200 dark:border-slate-800 p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-600">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Reject Vehicle Registration
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Provide an optional reason to notify the driver.
                </p>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase">
                Rejection Reason
              </label>
              <textarea
                rows="3"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="e.g. Expired insurance policy, invalid inspection certificate, or blurry photo documentation..."
                className="w-full p-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-rose-500 transition"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRejectModalOpen(false)}
                className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={executeRejectVehicle}
                disabled={submittingAction}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs transition shadow-md"
              >
                {submittingAction ? "Rejecting..." : "Confirm Rejection"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detailed Inspection Drawer/Modal */}
      {selectedVehicle && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full border border-slate-200 dark:border-slate-800 overflow-hidden shadow-2xl max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
              <div>
                <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
                  {selectedVehicle.manufacturer} {selectedVehicle.model}
                </h3>
                <p className="text-xs font-mono text-slate-500 dark:text-slate-400 mt-0.5">
                  Plate: {selectedVehicle.plateNumber} • Year:{" "}
                  {selectedVehicle.year}
                </p>
              </div>
              <button
                onClick={() => setSelectedVehicle(null)}
                className="p-1.5 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
              {/* Photo Gallery */}
              {selectedVehicle.images && selectedVehicle.images.length > 0 && (
                <div className="space-y-2">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Vehicle Photos
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {selectedVehicle.images.map((img, idx) => (
                      <div
                        key={idx}
                        className="h-28 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-slate-100 dark:bg-slate-800 relative group"
                      >
                        <img
                          src={img}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                        <a
                          href={img}
                          target="_blank"
                          rel="noreferrer"
                          className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <ExternalLink className="w-4 h-4 text-white" />
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Status Chips */}
              <div className="grid grid-cols-2 gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                    Approval Status
                  </span>
                  {getApprovalBadge(selectedVehicle.approvalStatus)}
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                    Fleet Status
                  </span>
                  {getStatusBadge(selectedVehicle.status)}
                </div>
              </div>

              {/* Technical Specifications */}
              <div className="space-y-2">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Specifications & Capacity
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                  <div>
                    <span className="text-slate-400 text-[10px] block">
                      Type
                    </span>
                    <span className="font-bold text-slate-900 dark:text-white capitalize">
                      {selectedVehicle.type}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block">
                      Weight Limit
                    </span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {selectedVehicle.capacity?.weight}{" "}
                      {selectedVehicle.capacity?.unit}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block">
                      Fuel Type
                    </span>
                    <span className="font-bold text-slate-900 dark:text-white capitalize">
                      {selectedVehicle.fuelType || "Diesel"}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block">
                      Color
                    </span>
                    <span className="font-bold text-slate-900 dark:text-white capitalize">
                      {selectedVehicle.color || "N/A"}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block">
                      Submitted Date
                    </span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {new Date(selectedVehicle.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block">
                      Approval Date
                    </span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {selectedVehicle.approvalDate
                        ? new Date(
                            selectedVehicle.approvalDate
                          ).toLocaleDateString()
                        : "N/A"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Driver / Owner Profile */}
              {selectedVehicle.registeredBy && (
                <div className="space-y-2">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Driver / Owner Information
                  </p>
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 text-[10px]">
                        Driver Name
                      </span>
                      <span className="font-bold text-slate-900 dark:text-white">
                        {selectedVehicle.registeredBy.fullName}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 text-[10px]">
                        Driver License
                      </span>
                      <span className="font-mono font-bold text-slate-900 dark:text-white">
                        {selectedVehicle.registeredBy.licenseNumber}
                      </span>
                    </div>
                    {selectedVehicle.registeredBy.userId?.phone && (
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 text-[10px]">Phone</span>
                        <span className="text-slate-800 dark:text-slate-200">
                          {selectedVehicle.registeredBy.userId.phone}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Documents & Files */}
              <div className="space-y-2">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Registration & Insurance Certificates
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {selectedVehicle.registration?.document && (
                    <a
                      href={selectedVehicle.registration.document}
                      target="_blank"
                      rel="noreferrer"
                      className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-between font-bold"
                    >
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-blue-500" />
                        <span>Registration Certificate</span>
                      </div>
                      <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                    </a>
                  )}

                  {selectedVehicle.insurance?.document && (
                    <a
                      href={selectedVehicle.insurance.document}
                      target="_blank"
                      rel="noreferrer"
                      className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-between font-bold"
                    >
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-emerald-500" />
                        <span>Insurance Policy File</span>
                      </div>
                      <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                    </a>
                  )}

                  {selectedVehicle.inspectionDocument && (
                    <a
                      href={selectedVehicle.inspectionDocument}
                      target="_blank"
                      rel="noreferrer"
                      className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-between font-bold"
                    >
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-amber-500" />
                        <span>Inspection Fitness Certificate</span>
                      </div>
                      <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Footer Actions */}
            <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-2">
                {(selectedVehicle.approvalStatus || "pending") ===
                  "pending" && (
                  <>
                    <button
                      onClick={(e) =>
                        handleApproveVehicle(selectedVehicle._id, e)
                      }
                      disabled={submittingAction}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition shadow-sm flex items-center gap-1.5 cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Approve Vehicle</span>
                    </button>
                    <button
                      onClick={(e) =>
                        openRejectModal(selectedVehicle._id, e)
                      }
                      disabled={submittingAction}
                      className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs transition shadow-sm flex items-center gap-1.5 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>Reject Vehicle</span>
                    </button>
                  </>
                )}
              </div>

              <button
                onClick={() => setSelectedVehicle(null)}
                className="px-5 py-2 bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition cursor-pointer"
              >
                Close View
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={confirmDeleteOpen}
        onClose={() => setConfirmDeleteOpen(false)}
        onConfirm={executeDelete}
        title="Delete Fleet Vehicle"
        message="Are you sure you want to remove this vehicle from fleet records?"
      />
    </div>
  );
};

export default Vehicles;

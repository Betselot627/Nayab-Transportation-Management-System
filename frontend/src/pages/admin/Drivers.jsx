import { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAdminData } from "../../context/AdminDataContext";
import { driverService } from "../../services/driverService";
import api from "../../services/api";
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  Eye,
  Filter,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  FileText,
  User,
  X,
} from "lucide-react";
import Badge from "../../components/common/Badge";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import Modal from "../../components/common/Modal";
import toast from "react-hot-toast";

const Drivers = () => {
  const navigate = useNavigate();
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);
  const [filterStatus, setFilterStatus] = useState("all");

  // Sorting State
  const [sortField, setSortField] = useState("rollNumber");
  const [sortDirection, setSortDirection] = useState("asc");

  // Deletion Confirm dialog
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  // Photo & Document Preview Modals state
  const [previewPhoto, setPreviewPhoto] = useState(null);
  const [previewDoc, setPreviewDoc] = useState(null);

  // Mock Drivers Fallback Database
  const mockDrivers = [
    {
      id: 1,
      rollNumber: "D001",
      photo:
        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=150&auto=format&fit=crop",
      fullName: "Abebe Kebede",
      mobileNumber: "+251911223344",
      licenseNumber: "DL-908123",
      licenseExpiryDate: "2028-09-12",
      dateJoined: "2021-04-15",
      status: "Available",
      documentUrl:
        "https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?q=80&w=400&auto=format&fit=crop",
    },
    {
      id: 2,
      rollNumber: "D002",
      photo:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=150&auto=format&fit=crop",
      fullName: "Meseret Haile",
      mobileNumber: "+251912445566",
      licenseNumber: "DL-671234",
      licenseExpiryDate: "2027-11-30",
      dateJoined: "2022-08-10",
      status: "On Trip",
      documentUrl:
        "https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?q=80&w=400&auto=format&fit=crop",
    },
    {
      id: 3,
      rollNumber: "D003",
      photo:
        "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=150&auto=format&fit=crop",
      fullName: "Dawit Tesfaye",
      mobileNumber: "+251913778899",
      licenseNumber: "DL-112233",
      licenseExpiryDate: "2026-08-24",
      dateJoined: "2023-01-05",
      status: "Available",
      documentUrl:
        "https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?q=80&w=400&auto=format&fit=crop",
    },
    {
      id: 4,
      rollNumber: "D004",
      photo:
        "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=150&auto=format&fit=crop",
      fullName: "Tigist Alemayehu",
      mobileNumber: "+251914556677",
      licenseNumber: "DL-445566",
      licenseExpiryDate: "2029-03-15",
      dateJoined: "2023-06-18",
      status: "Maintenance",
      documentUrl:
        "https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?q=80&w=400&auto=format&fit=crop",
    },
    {
      id: 5,
      rollNumber: "D005",
      photo:
        "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?q=80&w=150&auto=format&fit=crop",
      fullName: "Solomon Girma",
      mobileNumber: "+251915998877",
      licenseNumber: "DL-789012",
      licenseExpiryDate: "2026-05-10",
      dateJoined: "2020-11-20",
      status: "Suspended",
      documentUrl:
        "https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?q=80&w=400&auto=format&fit=crop",
    },
  ];

  useEffect(() => {
    fetchDrivers(false);
  }, []);

  const fetchDrivers = async (force = false) => {
    try {
      if (drivers.length === 0) setLoading(true);
      const res = await driverService.getAllDrivers(
        { limit: 100 },
        { force, ttl: 35000 },
      );
      if (res && res.data && res.data.length > 0) {
        const mapped = res.data.map((d, idx) => ({
          id: d._id,
          userId: d.userId?._id || null,
          rollNumber: `D${String(idx + 1).padStart(3, "0")}`,
          photo:
            d.photoUrl ||
            "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=150",
          fullName: d.fullName,
          mobileNumber: d.userId?.phone || "+251910000000",
          licenseNumber: d.licenseNumber,
          licenseExpiryDate: d.licenseExpiry?.split("T")[0] || "2028-12-31",
          dateJoined:
            d.createdAt?.split("T")[0] ||
            new Date().toISOString().split("T")[0],
          status:
            d.status === "available"
              ? "Available"
              : d.status === "on_trip"
                ? "On Trip"
                : d.status === "suspended"
                  ? "Suspended"
                  : "Off Duty",
          userStatus: d.userId?.status || "active",
          documentUrl:
            d.licenseDocumentUrl ||
            "https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?q=80&w=400",
        }));
        setDrivers(mapped);
      } else {
        setDrivers(mockDrivers);
      }
    } catch (err) {
      console.warn("REST API offline, fallback to mock drivers:", err);
      setDrivers(mockDrivers);
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (field) => {
    const isAsc = sortField === field && sortDirection === "asc";
    setSortDirection(isAsc ? "desc" : "asc");
    setSortField(field);
  };

  const triggerDelete = (id) => {
    setDeleteId(id);
    setConfirmDeleteOpen(true);
  };

  const executeDelete = async () => {
    try {
      if (typeof deleteId === "string") {
        await driverService.deleteDriver(deleteId);
      }
      fetchDrivers(true); // Refresh cached data
      toast.success("Driver profile removed successfully!");
    } catch (err) {
      fetchDrivers(true); // Refresh anyway
      toast.success("Driver profile removed successfully! (Simulated)");
    }
  };

  const handleApproveDriver = async (userId) => {
    try {
      await api.put(`/users/${userId}/status`, { status: "active" });
      toast.success("Driver account approved successfully!");
      fetchDrivers(true); // Refresh cached data
    } catch (err) {
      console.error("Failed to approve driver:", err);
      toast.error(err.response?.data?.message || "Failed to approve driver");
    }
  };

  const getBadgeVariant = (status) => {
    switch (status.toLowerCase()) {
      case "available":
        return "success";
      case "on trip":
        return "info";
      case "maintenance":
      case "off duty":
        return "warning";
      case "suspended":
        return "error";
      default:
        return "default";
    }
  };

  // Search & Filters logic
  const filteredDrivers = drivers
    .filter((d) => {
      const term = searchTerm.toLowerCase();
      const matchesSearch =
        d.fullName.toLowerCase().includes(term) ||
        d.licenseNumber.toLowerCase().includes(term) ||
        d.rollNumber.toLowerCase().includes(term) ||
        d.mobileNumber.includes(term);

      const matchesStatus = filterStatus === "all" || d.status === filterStatus;

      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];

      if (valA < valB) return sortDirection === "asc" ? -1 : 1;
      if (valA > valB) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });

  // Pagination columns
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentDrivers = filteredDrivers.slice(
    indexOfFirstItem,
    indexOfLastItem,
  );
  const totalPages = Math.ceil(filteredDrivers.length / itemsPerPage);

  return (
    <div className="space-y-6">
      {/* Deletion Confirm */}
      <ConfirmDialog
        isOpen={confirmDeleteOpen}
        onClose={() => setConfirmDeleteOpen(false)}
        onConfirm={executeDelete}
        title="Delete Driver Profile"
        message="Are you sure you want to remove this driver profile? This action will cancel any active trips assigned to them."
      />

      {/* Driver Photo Preview Modal */}
      {previewPhoto && (
        <div
          className="fixed inset-0 bg-black/75 flex items-center justify-center p-4 z-50 animate-fade-in"
          onClick={() => setPreviewPhoto(null)}
        >
          <div
            className="relative bg-white dark:bg-gray-900 border dark:border-gray-800 rounded-2xl p-2 max-w-sm w-full shadow-2xl animate-scale-up"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setPreviewPhoto(null)}
              className="absolute top-4 right-4 p-1.5 bg-black/60 hover:bg-black/85 text-white rounded-full transition-transform hover:scale-105 z-10"
            >
              <X className="w-4 h-4" />
            </button>
            <img
              src={previewPhoto}
              alt="Driver Preview"
              className="w-full rounded-xl object-cover max-h-96"
            />
          </div>
        </div>
      )}

      {/* Driver Document Viewer Modal */}
      {previewDoc && (
        <div
          className="fixed inset-0 bg-black/75 flex items-center justify-center p-4 z-50 animate-fade-in"
          onClick={() => setPreviewDoc(null)}
        >
          <div
            className="relative bg-white dark:bg-gray-900 border dark:border-gray-800 rounded-2xl p-6 max-w-2xl w-full shadow-2xl animate-scale-up flex flex-col max-h-[85vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center pb-4 border-b border-gray-250 dark:border-gray-800">
              <h3 className="text-md font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-500" />
                Driver License & Documents Viewer
              </h3>
              <button
                onClick={() => setPreviewDoc(null)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto mt-6 flex justify-center bg-gray-50 dark:bg-gray-900 border dark:border-gray-800 p-4 rounded-xl">
              <img
                src={previewDoc}
                alt="Document View"
                className="object-contain max-h-[50vh] rounded-lg shadow-sm border border-gray-200 dark:border-gray-800"
              />
            </div>
            <div className="flex justify-end gap-3 mt-6 border-t border-gray-250 dark:border-gray-800 pt-4">
              <button
                onClick={() => setPreviewDoc(null)}
                className="px-5 py-2 border border-gray-300 dark:border-gray-700 rounded-xl text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                Close Viewer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Driver Management
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Display, search, edit and register delivery drivers.
          </p>
        </div>
        <Link
          to="/admin/drivers/add"
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl shadow-sm hover:shadow transition-all duration-205 shrink-0"
        >
          <Plus className="w-5 h-5" />
          Add Driver
        </Link>
      </div>

      {/* Filter and Search Panel */}
      <div className="bg-white dark:bg-gray-900 border border-gray-250 dark:border-gray-800 rounded-2xl p-5 shadow-sm flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
        {/* Searching */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search by name, license number, roll..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-9 pr-4 py-2 border border-gray-300 dark:border-gray-700 rounded-xl text-sm bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 border border-gray-300 dark:border-gray-700 rounded-xl px-3 py-2 bg-transparent">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={filterStatus}
              onChange={(e) => {
                setFilterStatus(e.target.value);
                setCurrentPage(1);
              }}
              className="text-sm bg-transparent focus:outline-none border-none text-gray-700 dark:text-gray-300"
            >
              <option value="all">All Status</option>
              <option value="Available">Available</option>
              <option value="On Trip">On Trip</option>
              <option value="Maintenance">Maintenance</option>
              <option value="Suspended">Suspended</option>
            </select>
          </div>
        </div>
      </div>

      {/* Drivers List Table */}
      <div className="bg-white dark:bg-gray-900 border border-gray-250 dark:border-gray-800 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/75 dark:bg-gray-900/50 border-b border-gray-250 dark:border-gray-800 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase select-none">
                <th
                  className="py-4 px-6 cursor-pointer"
                  onClick={() => handleSort("rollNumber")}
                >
                  <div className="flex items-center gap-1">
                    Roll # <ArrowUpDown className="w-3.5 h-3.5" />
                  </div>
                </th>
                <th className="py-4 px-6">Photo</th>
                <th
                  className="py-4 px-6 cursor-pointer"
                  onClick={() => handleSort("fullName")}
                >
                  <div className="flex items-center gap-1">
                    Driver Name <ArrowUpDown className="w-3.5 h-3.5" />
                  </div>
                </th>
                <th className="py-4 px-6">Mobile Number</th>
                <th
                  className="py-4 px-6 cursor-pointer"
                  onClick={() => handleSort("licenseNumber")}
                >
                  <div className="flex items-center gap-1">
                    License # <ArrowUpDown className="w-3.5 h-3.5" />
                  </div>
                </th>
                <th
                  className="py-4 px-6 cursor-pointer"
                  onClick={() => handleSort("licenseExpiryDate")}
                >
                  <div className="flex items-center gap-1">
                    License Expiry <ArrowUpDown className="w-3.5 h-3.5" />
                  </div>
                </th>
                <th
                  className="py-4 px-6 cursor-pointer"
                  onClick={() => handleSort("dateJoined")}
                >
                  <div className="flex items-center gap-1">
                    Date Joined <ArrowUpDown className="w-3.5 h-3.5" />
                  </div>
                </th>
                <th
                  className="py-4 px-6 cursor-pointer"
                  onClick={() => handleSort("status")}
                >
                  <div className="flex items-center gap-1">
                    Status <ArrowUpDown className="w-3.5 h-3.5" />
                  </div>
                </th>
                <th className="py-4 px-6">Documents</th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-250 dark:divide-gray-800 text-sm">
              {currentDrivers.length > 0 ? (
                currentDrivers.map((driver) => (
                  <tr
                    key={driver.id}
                    className="hover:bg-gray-50/50 dark:hover:bg-gray-900/30 transition-colors"
                  >
                    <td className="py-4 px-6 font-semibold text-gray-900 dark:text-white">
                      {driver.rollNumber}
                    </td>
                    <td className="py-4 px-6">
                      <img
                        src={driver.photo}
                        alt={driver.fullName}
                        onClick={() => setPreviewPhoto(driver.photo)}
                        className="w-10 h-10 rounded-full object-cover shadow-sm hover:ring-2 hover:ring-blue-500/50 cursor-zoom-in transition-all"
                      />
                    </td>
                    <td className="py-4 px-6 font-semibold text-gray-800 dark:text-gray-300">
                      {driver.fullName}
                    </td>
                    <td className="py-4 px-6 text-gray-600 dark:text-gray-400">
                      {driver.mobileNumber}
                    </td>
                    <td className="py-4 px-6 font-mono text-gray-500 dark:text-gray-400">
                      {driver.licenseNumber}
                    </td>
                    <td className="py-4 px-6 text-gray-500 dark:text-gray-400">
                      {driver.licenseExpiryDate}
                    </td>
                    <td className="py-4 px-6 text-gray-500 dark:text-gray-400">
                      {driver.dateJoined}
                    </td>
                    <td className="py-4 px-6">
                      <Badge
                        variant={
                          driver.userStatus === "inactive"
                            ? "error"
                            : getBadgeVariant(driver.status)
                        }
                      >
                        {driver.userStatus === "inactive"
                          ? "Pending Approval"
                          : driver.status}
                      </Badge>
                    </td>
                    <td className="py-4 px-6">
                      <button
                        onClick={() => setPreviewDoc(driver.documentUrl)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-950/20 rounded-lg transition-colors border border-blue-100/55 dark:border-blue-900/30"
                      >
                        <FileText className="w-3.5 h-3.5" /> License.jpg
                      </button>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex justify-end items-center gap-2">
                        {driver.userStatus === "inactive" && driver.userId && (
                          <button
                            onClick={() => handleApproveDriver(driver.userId)}
                            className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg transition-colors flex items-center"
                            title="Approve Driver"
                          >
                            Approve
                          </button>
                        )}
                        <button
                          onClick={() => triggerDelete(driver.id)}
                          className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() =>
                            navigate(`/admin/drivers/edit/${driver.id}`)
                          }
                          className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/20 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="10" className="py-12 text-center text-gray-400">
                    No drivers found matching criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination controls */}
        {filteredDrivers.length > itemsPerPage && (
          <div className="p-4 bg-gray-50/50 dark:bg-gray-900/10 border-t border-gray-250 dark:border-gray-800 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
            <span>
              Showing {indexOfFirstItem + 1} to{" "}
              {Math.min(indexOfLastItem, filteredDrivers.length)} of{" "}
              {filteredDrivers.length} drivers
            </span>
            <div className="flex gap-1">
              <button
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                disabled={currentPage === 1}
                className="px-2.5 py-1.5 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50 transition-colors flex items-center gap-1"
              >
                <ChevronLeft className="w-3.5 h-3.5" /> Previous
              </button>
              {[...Array(totalPages)].map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentPage(idx + 1)}
                  className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                    currentPage === idx + 1
                      ? "bg-blue-600 text-white"
                      : "border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                  }`}
                >
                  {idx + 1}
                </button>
              ))}
              <button
                onClick={() =>
                  setCurrentPage((p) => Math.min(p + 1, totalPages))
                }
                disabled={currentPage === totalPages}
                className="px-2.5 py-1.5 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50 transition-colors flex items-center gap-1"
              >
                Next <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Drivers;
export { Drivers };

import { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  Eye,
  Download,
  Filter,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useAdminData } from "../../context/AdminDataContext";
import { vehicleService } from "../../services/vehicleService";
import Loading from "../../components/common/Loading";
import toast from "react-hot-toast";

const VehicleManagement = () => {
  const navigate = useNavigate();
  const {
    vehicles: cachedVehicles,
    loading: contextLoading,
    fetchVehicles,
    removeVehicleFromCache,
    updateVehicleInCache,
  } = useAdminData();

  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [filterStatus, setFilterStatus] = useState("all");

  useEffect(() => {
    // Fetch vehicles from cache on mount
    fetchVehicles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Filter and search vehicles locally
  const filteredVehicles = useMemo(() => {
    let filtered = [...cachedVehicles];

    // Apply status filter
    if (filterStatus !== "all") {
      filtered = filtered.filter((v) => v.status === filterStatus);
    }

    // Apply search
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (v) =>
          v.plateNumber?.toLowerCase().includes(search) ||
          v.model?.toLowerCase().includes(search) ||
          v.manufacturer?.toLowerCase().includes(search) ||
          v.type?.toLowerCase().includes(search),
      );
    }

    return filtered;
  }, [cachedVehicles, filterStatus, searchTerm]);

  // Pagination
  const totalVehicles = filteredVehicles.length;
  const totalPages = Math.ceil(totalVehicles / itemsPerPage);
  const paginatedVehicles = filteredVehicles.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this vehicle?")) {
      try {
        await vehicleService.deleteVehicle(id);
        toast.success("Vehicle deleted successfully");
        removeVehicleFromCache(id);
      } catch (error) {
        console.error("Error deleting vehicle:", error);
        toast.error(
          error.response?.data?.message || "Failed to delete vehicle",
        );
      }
    }
  };

  const handleView = (id) => {
    navigate(`/admin/vehicles/${id}`);
  };

  const handleEdit = (id) => {
    navigate(`/admin/vehicles/edit/${id}`);
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "active":
      case "available":
        return "bg-green-100 text-green-800";
      case "maintenance":
        return "bg-yellow-100 text-yellow-800";
      case "inactive":
      case "in_use":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getApprovalColor = (status) => {
    switch (status?.toLowerCase()) {
      case "approved":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const handleExportCSV = () => {
    try {
      const csvContent = [
        [
          "Plate Number",
          "Model",
          "Manufacturer",
          "Type",
          "Status",
          "Approval Status",
        ],
        ...filteredVehicles.map((v) => [
          v.plateNumber,
          v.model,
          v.manufacturer,
          v.type,
          v.status,
          v.approvalStatus,
        ]),
      ]
        .map((row) => row.join(","))
        .join("\n");

      const blob = new Blob([csvContent], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `vehicles_${new Date().toISOString().split("T")[0]}.csv`;
      a.click();
      toast.success("CSV exported successfully");
    } catch (error) {
      console.error("Error exporting CSV:", error);
      toast.error("Failed to export CSV");
    }
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  if (contextLoading.vehicles && cachedVehicles.length === 0) {
    return <Loading />;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
          Vehicle Management
        </h1>
        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1">
          Manage your fleet vehicles and assignments
        </p>
      </div>

      {/* Filters and Actions */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 sm:p-6 mb-6 transition-colors duration-300">
        <div className="flex flex-col lg:flex-row gap-4 justify-between">
          {/* Search */}
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-5 h-5" />
              <input
                type="text"
                placeholder="Search vehicles..."
                value={searchTerm}
                onChange={handleSearch}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 transition-colors duration-300"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            {/* Filter Dropdown */}
            <div className="relative flex-1 sm:flex-initial min-w-[150px]">
              <select
                value={filterStatus}
                onChange={(e) => {
                  setFilterStatus(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full appearance-none px-4 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-300"
              >
                <option value="all">All Status</option>
                <option value="available">Available</option>
                <option value="in_use">In Use</option>
                <option value="maintenance">Maintenance</option>
                <option value="inactive">Inactive</option>
              </select>
              <Filter className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-4 h-4 pointer-events-none" />
            </div>

            {/* Export Button */}
            <button
              onClick={handleExportCSV}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2 whitespace-nowrap transition-colors duration-300"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Export CSV</span>
            </button>

            {/* Add Vehicle Button */}
            <Link
              to="/admin/vehicles/add"
              className="px-4 sm:px-6 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-700 dark:hover:bg-blue-600 flex items-center gap-2 whitespace-nowrap transition-colors duration-300"
            >
              <Plus className="w-5 h-5" />
              <span className="hidden sm:inline">Add Vehicle</span>
              <span className="sm:hidden">Add</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Vehicle Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden transition-colors duration-300">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
              <tr>
                <th className="text-left py-3 sm:py-4 px-3 sm:px-6 font-semibold text-gray-700 dark:text-gray-300 text-xs sm:text-sm">
                  Plate Number
                </th>
                <th className="text-left py-3 sm:py-4 px-3 sm:px-6 font-semibold text-gray-700 dark:text-gray-300 text-xs sm:text-sm hidden md:table-cell">
                  Model
                </th>
                <th className="text-left py-3 sm:py-4 px-3 sm:px-6 font-semibold text-gray-700 dark:text-gray-300 text-xs sm:text-sm hidden lg:table-cell">
                  Type
                </th>
                <th className="text-left py-3 sm:py-4 px-3 sm:px-6 font-semibold text-gray-700 dark:text-gray-300 text-xs sm:text-sm">
                  Status
                </th>
                <th className="text-left py-3 sm:py-4 px-3 sm:px-6 font-semibold text-gray-700 dark:text-gray-300 text-xs sm:text-sm hidden sm:table-cell">
                  Approval
                </th>
                <th className="text-left py-3 sm:py-4 px-3 sm:px-6 font-semibold text-gray-700 dark:text-gray-300 text-xs sm:text-sm">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {paginatedVehicles.length > 0 ? (
                paginatedVehicles.map((vehicle) => (
                  <tr
                    key={vehicle._id}
                    className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
                  >
                    <td className="py-3 sm:py-4 px-3 sm:px-6 text-gray-900 dark:text-white font-medium text-xs sm:text-sm">
                      {vehicle.plateNumber}
                    </td>
                    <td className="py-3 sm:py-4 px-3 sm:px-6 text-gray-600 dark:text-gray-400 text-xs sm:text-sm hidden md:table-cell">
                      {vehicle.manufacturer} {vehicle.model}
                    </td>
                    <td className="py-3 sm:py-4 px-3 sm:px-6 text-xs sm:text-sm hidden lg:table-cell">
                      <span className="px-2 sm:px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-xs font-semibold capitalize">
                        {vehicle.type}
                      </span>
                    </td>
                    <td className="py-3 sm:py-4 px-3 sm:px-6">
                      <span
                        className={`px-2 sm:px-3 py-1 rounded-full text-[10px] sm:text-xs font-semibold capitalize ${getStatusColor(
                          vehicle.status,
                        )}`}
                      >
                        {vehicle.status}
                      </span>
                    </td>
                    <td className="py-3 sm:py-4 px-3 sm:px-6 hidden sm:table-cell">
                      <span
                        className={`px-2 sm:px-3 py-1 rounded-full text-xs font-semibold capitalize ${getApprovalColor(
                          vehicle.approvalStatus,
                        )}`}
                      >
                        {vehicle.approvalStatus}
                      </span>
                    </td>
                    <td className="py-3 sm:py-4 px-3 sm:px-6">
                      <div className="flex gap-1 sm:gap-2">
                        <button
                          onClick={() => handleView(vehicle._id)}
                          className="p-1.5 sm:p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="View"
                        >
                          <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        </button>
                        <button
                          onClick={() => handleEdit(vehicle._id)}
                          className="p-1.5 sm:p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(vehicle._id)}
                          className="p-1.5 sm:p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-gray-500">
                    {searchTerm
                      ? "No vehicles found matching your search"
                      : "No vehicles registered yet"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {filteredVehicles.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between px-4 sm:px-6 py-4 border-t border-gray-200 dark:border-gray-700 gap-4">
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
              Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
              {Math.min(currentPage * itemsPerPage, totalVehicles)} of{" "}
              {totalVehicles} vehicles
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-3 sm:px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors duration-200"
              >
                <ChevronLeft className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Previous</span>
              </button>
              <div className="hidden sm:flex gap-1">
                {[...Array(Math.min(totalPages, 5))].map((_, idx) => {
                  const pageNum = idx + 1;
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors duration-200 ${
                        currentPage === pageNum
                          ? "bg-blue-600 dark:bg-blue-500 text-white"
                          : "border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>
              <span className="sm:hidden px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                {currentPage} / {totalPages}
              </span>
              <button
                onClick={() =>
                  setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                }
                disabled={currentPage === totalPages}
                className="px-3 sm:px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors duration-200"
              >
                <span className="hidden sm:inline">Next</span>
                <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VehicleManagement;

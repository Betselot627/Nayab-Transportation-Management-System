import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  Filter,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  Wrench,
  DollarSign,
  AlertTriangle,
} from "lucide-react";
import Badge from "../../components/common/Badge";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import toast from "react-hot-toast";

const MaintenanceManagement = () => {
  const navigate = useNavigate();
  const [maintenance, setMaintenance] = useState([]);
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

  // Mock Maintenance Database
  const mockMaintenance = [
    { id: 1, rollNumber: "M001", vehicle: "Toyota Hiace (AA-12345)", maintenanceType: "Oil & Filter Change", garage: "Sheger Auto Care", cost: 4500, serviceDate: "2026-07-28", nextServiceDate: "2026-10-28", status: "Completed" },
    { id: 2, rollNumber: "M002", vehicle: "Isuzu Truck (AA-67890)", maintenanceType: "Tire Rotation", garage: "Bole Garage", cost: 12000, serviceDate: "2026-07-30", nextServiceDate: "2026-08-15", status: "In Progress" },
    { id: 3, rollNumber: "M003", vehicle: "Mercedes Sprinter (AA-44556)", maintenanceType: "Engine Diagnostics", garage: "Bole Garage", cost: 8500, serviceDate: "2026-07-31", nextServiceDate: "2026-08-01", status: "Pending" }, // Due tomorrow!
    { id: 4, rollNumber: "M004", vehicle: "Hino 500 (AA-11223)", maintenanceType: "Brake Pad Change", garage: "Adama Express Repair", cost: 9800, serviceDate: "2026-07-25", nextServiceDate: "2026-08-02", status: "Completed" }, // Due soon!
    { id: 5, rollNumber: "M005", vehicle: "Mitsubishi Canter (AA-78901)", maintenanceType: "Gearbox Service", garage: "Tana Mechanical", cost: 15500, serviceDate: "2026-07-20", nextServiceDate: "2026-11-20", status: "Completed" },
  ];

  useEffect(() => {
    fetchMaintenance();
  }, []);

  const fetchMaintenance = async () => {
    // Setting up mock data as standard
    setLoading(true);
    setTimeout(() => {
      setMaintenance(mockMaintenance);
      setLoading(false);
    }, 300);
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

  const executeDelete = () => {
    setMaintenance(maintenance.filter((m) => m.id !== deleteId));
    toast.success("Maintenance log removed successfully");
  };

  const getBadgeVariant = (status) => {
    switch (status.toLowerCase()) {
      case "completed":
        return "success";
      case "in progress":
        return "info";
      case "pending":
        return "warning";
      default:
        return "default";
    }
  };

  // Maintenance Due notification checker
  const isMaintenanceDue = (nextDate) => {
    const today = new Date();
    const serviceDate = new Date(nextDate);
    const diffTime = serviceDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays >= 0 && diffDays <= 3; // Due within 3 days
  };

  // Searching & Filtering
  const filteredMaintenance = maintenance
    .filter((m) => {
      const term = searchTerm.toLowerCase();
      const matchesSearch =
        m.vehicle.toLowerCase().includes(term) ||
        m.maintenanceType.toLowerCase().includes(term) ||
        m.rollNumber.toLowerCase().includes(term) ||
        m.garage.toLowerCase().includes(term);

      const matchesStatus = filterStatus === "all" || m.status === filterStatus;

      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];

      if (sortField === "cost") {
        valA = parseFloat(valA);
        valB = parseFloat(valB);
      }

      if (valA < valB) return sortDirection === "asc" ? -1 : 1;
      if (valA > valB) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });

  // Pagination columns
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentLogs = filteredMaintenance.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredMaintenance.length / itemsPerPage);

  return (
    <div className="space-y-6">
      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={confirmDeleteOpen}
        onClose={() => setConfirmDeleteOpen(false)}
        onConfirm={executeDelete}
        title="Remove Maintenance Log"
        message="Are you sure you want to delete this maintenance record?"
      />

      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Maintenance Management</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Display, search, record garage visits and fleet maintenance logs.
          </p>
        </div>
        <Link
          to="/admin/maintenance/add"
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl shadow-sm hover:shadow transition-all duration-205 shrink-0"
        >
          <Plus className="w-5 h-5" />
          Add Maintenance
        </Link>
      </div>

      {/* Search and Filters */}
      <div className="bg-white dark:bg-gray-950 border border-gray-150 dark:border-gray-800 rounded-2xl p-5 shadow-sm flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
        
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search vehicle, type or garage..."
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
              <option value="Pending">Pending</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table grid */}
      <div className="bg-white dark:bg-gray-950 border border-gray-150 dark:border-gray-800 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/75 dark:bg-gray-900/50 border-b border-gray-150 dark:border-gray-800 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase select-none">
                <th className="py-4 px-6 cursor-pointer" onClick={() => handleSort("rollNumber")}>
                  <div className="flex items-center gap-1">
                    Roll # <ArrowUpDown className="w-3.5 h-3.5" />
                  </div>
                </th>
                <th className="py-4 px-6 cursor-pointer" onClick={() => handleSort("vehicle")}>
                  <div className="flex items-center gap-1">
                    Vehicle <ArrowUpDown className="w-3.5 h-3.5" />
                  </div>
                </th>
                <th className="py-4 px-6 cursor-pointer" onClick={() => handleSort("maintenanceType")}>
                  <div className="flex items-center gap-1">
                    Maintenance Type <ArrowUpDown className="w-3.5 h-3.5" />
                  </div>
                </th>
                <th className="py-4 px-6">Garage</th>
                <th className="py-4 px-6 cursor-pointer" onClick={() => handleSort("cost")}>
                  <div className="flex items-center gap-1">
                    Cost (ETB) <ArrowUpDown className="w-3.5 h-3.5" />
                  </div>
                </th>
                <th className="py-4 px-6 cursor-pointer" onClick={() => handleSort("serviceDate")}>
                  <div className="flex items-center gap-1">
                    Service Date <ArrowUpDown className="w-3.5 h-3.5" />
                  </div>
                </th>
                <th className="py-4 px-6 cursor-pointer" onClick={() => handleSort("nextServiceDate")}>
                  <div className="flex items-center gap-1">
                    Next Service <ArrowUpDown className="w-3.5 h-3.5" />
                  </div>
                </th>
                <th className="py-4 px-6 cursor-pointer" onClick={() => handleSort("status")}>
                  <div className="flex items-center gap-1">
                    Status <ArrowUpDown className="w-3.5 h-3.5" />
                  </div>
                </th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-150 dark:divide-gray-800 text-sm">
              {currentLogs.length > 0 ? (
                currentLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-900/30 transition-colors">
                    <td className="py-4 px-6 font-semibold text-gray-900 dark:text-white">
                      {log.rollNumber}
                    </td>
                    <td className="py-4 px-6 font-semibold text-gray-850 dark:text-gray-250">
                      {log.vehicle}
                    </td>
                    <td className="py-4 px-6 text-gray-650 dark:text-gray-300">
                      {log.maintenanceType}
                    </td>
                    <td className="py-4 px-6 text-gray-600 dark:text-gray-350">
                      {log.garage}
                    </td>
                    <td className="py-4 px-6 text-gray-900 dark:text-white font-semibold">
                      {log.cost.toLocaleString()}
                    </td>
                    <td className="py-4 px-6 text-gray-500 dark:text-gray-400 font-mono text-xs">
                      {log.serviceDate}
                    </td>
                    <td className="py-4 px-6 text-gray-500 dark:text-gray-400 font-mono text-xs">
                      <div className="flex items-center gap-1.5">
                        {log.nextServiceDate}
                        {isMaintenanceDue(log.nextServiceDate) && (
                          <span className="p-0.5 bg-red-150 text-red-700 rounded-full animate-bounce" title="Service Due Soon!">
                            <AlertTriangle className="w-3 h-3 text-red-600" />
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <Badge variant={getBadgeVariant(log.status)}>
                        {log.status}
                      </Badge>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => triggerDelete(log.id)}
                          className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => navigate(`/admin/maintenance/edit/${log.id}`)}
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
                  <td colSpan="9" className="py-12 text-center text-gray-400">
                    No maintenance records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination controls */}
        {filteredMaintenance.length > itemsPerPage && (
          <div className="p-4 bg-gray-50/50 dark:bg-gray-900/10 border-t border-gray-150 dark:border-gray-800 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
            <span>
              Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredMaintenance.length)} of {filteredMaintenance.length} records
            </span>
            <div className="flex gap-1">
              <button
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                disabled={currentPage === 1}
                className="px-2.5 py-1.5 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-850 disabled:opacity-50 transition-colors flex items-center gap-1"
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
                      : "border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-850"
                  }`}
                >
                  {idx + 1}
                </button>
              ))}
              <button
                onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-2.5 py-1.5 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-850 disabled:opacity-50 transition-colors flex items-center gap-1"
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

export default MaintenanceManagement;
export { MaintenanceManagement };

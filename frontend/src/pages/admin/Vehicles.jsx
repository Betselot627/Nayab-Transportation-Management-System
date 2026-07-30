import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { vehicleService } from "../../services/vehicleService";
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
  ArrowUpDown,
  FileText,
} from "lucide-react";
import Badge from "../../components/common/Badge";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import toast from "react-hot-toast";

const Vehicles = () => {
  const navigate = useNavigate();
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);
  const [filterGroup, setFilterGroup] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  
  // Sorting States
  const [sortField, setSortField] = useState("rollNumber");
  const [sortDirection, setSortDirection] = useState("asc");

  // Deletion Dialog State
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  // Mock Vehicles Fallback Database
  const mockVehicles = [
    { id: 1, rollNumber: "V001", name: "Toyota Hiace", registrationNumber: "AA-12345-ET", model: "2022", vehicleGroup: "Van", activeStatus: "Running" },
    { id: 2, rollNumber: "V002", name: "Isuzu Truck", registrationNumber: "AA-67890-ET", model: "2021", vehicleGroup: "Truck", activeStatus: "Idle" },
    { id: 3, rollNumber: "V003", name: "Hino 500", registrationNumber: "AA-11223-ET", model: "2023", vehicleGroup: "Truck", activeStatus: "Running" },
    { id: 4, rollNumber: "V004", name: "Mercedes Sprinter", registrationNumber: "AA-44556-ET", model: "2022", vehicleGroup: "Van", activeStatus: "Maintenance" },
    { id: 5, rollNumber: "V005", name: "Mitsubishi Canter", registrationNumber: "AA-78901-ET", model: "2020", vehicleGroup: "Pickup", activeStatus: "Running" },
    { id: 6, rollNumber: "V006", name: "Ford Transit", registrationNumber: "AA-33445-ET", model: "2023", vehicleGroup: "Van", activeStatus: "Idle" },
    { id: 7, rollNumber: "V007", name: "Hyundai HD72", registrationNumber: "AA-55667-ET", model: "2021", vehicleGroup: "Truck", activeStatus: "Inactive" },
    { id: 8, rollNumber: "V008", name: "Nissan Urvan", registrationNumber: "AA-88990-ET", model: "2022", vehicleGroup: "Van", activeStatus: "Running" },
  ];

  // Initialize and load vehicles
  useEffect(() => {
    fetchVehicles();
  }, []);

  const fetchVehicles = async () => {
    try {
      setLoading(true);
      const res = await vehicleService.getAllVehicles();
      if (res && res.data && res.data.length > 0) {
        // Map backend schema to list view columns
        const mapped = res.data.map((v, index) => ({
          id: v._id,
          rollNumber: `V${String(index + 1).padStart(3, "0")}`,
          name: `${v.manufacturer} ${v.model}`,
          registrationNumber: v.plateNumber,
          model: String(v.year),
          vehicleGroup: v.type.charAt(0).toUpperCase() + v.type.slice(1),
          activeStatus: v.status === "available" ? "Running" : v.status === "maintenance" ? "Maintenance" : "Idle",
        }));
        setVehicles(mapped);
      } else {
        // Use Mock data fallback
        setVehicles(mockVehicles);
      }
    } catch (err) {
      console.warn("REST API offline, initializing with mock data:", err);
      setVehicles(mockVehicles);
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
        await vehicleService.deleteVehicle(deleteId);
      }
      setVehicles(vehicles.filter((v) => v.id !== deleteId));
      toast.success("Vehicle deleted successfully");
    } catch (err) {
      setVehicles(vehicles.filter((v) => v.id !== deleteId));
      toast.success("Vehicle deleted successfully (Simulated)");
    }
  };

  const getBadgeVariant = (status) => {
    switch (status.toLowerCase()) {
      case "running":
      case "active":
        return "success";
      case "idle":
        return "warning";
      case "maintenance":
        return "error";
      default:
        return "default";
    }
  };

  // Searching & Filtering
  const filteredVehicles = vehicles
    .filter((v) => {
      const term = searchTerm.toLowerCase();
      const matchesSearch =
        v.name.toLowerCase().includes(term) ||
        v.registrationNumber.toLowerCase().includes(term) ||
        v.rollNumber.toLowerCase().includes(term) ||
        v.model.includes(term);

      const matchesGroup = filterGroup === "all" || v.vehicleGroup === filterGroup;
      const matchesStatus = filterStatus === "all" || v.activeStatus === filterStatus;

      return matchesSearch && matchesGroup && matchesStatus;
    })
    .sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];

      // Safe numeric conversion if needed
      if (sortField === "model") {
        valA = parseInt(valA);
        valB = parseInt(valB);
      }

      if (valA < valB) return sortDirection === "asc" ? -1 : 1;
      if (valA > valB) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });

  // Pagination Columns
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentVehicles = filteredVehicles.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredVehicles.length / itemsPerPage);

  // CSV Exporter
  const exportToCSV = () => {
    const headers = ["Roll Number", "Vehicle Name", "Registration Number", "Model", "Vehicle Group", "Active Status"];
    const rows = filteredVehicles.map((v) => [
      v.rollNumber,
      v.name,
      v.registrationNumber,
      v.model,
      v.vehicleGroup,
      v.activeStatus,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `fleet_vehicles_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("CSV file downloaded successfully!");
  };

  // PDF Exporter (Structured Print Preview)
  const exportToPDF = () => {
    const printWindow = window.open("", "_blank");
    printWindow.document.write(`
      <html>
        <head>
          <title>NTMS Fleet Vehicles Report</title>
          <style>
            body { font-family: sans-serif; padding: 24px; color: #333; }
            h2 { color: #1e3a8a; }
            table { width: 100%; border-collapse: collapse; margin-top: 16px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 13px; }
            th { bg-color: #f3f4f6; font-weight: bold; }
          </style>
        </head>
        <body onload="window.print();window.close();">
          <h2>Nayab Fleet Vehicles Directory</h2>
          <p>Export Date: ${new Date().toLocaleDateString()}</p>
          <table>
            <thead>
              <tr>
                <th>Roll Number</th>
                <th>Vehicle Name</th>
                <th>Registration Number</th>
                <th>Model</th>
                <th>Vehicle Group</th>
                <th>Active Status</th>
              </tr>
            </thead>
            <tbody>
              ${filteredVehicles
                .map(
                  (v) => `
                <tr>
                  <td>${v.rollNumber}</td>
                  <td>${v.name}</td>
                  <td>${v.registrationNumber}</td>
                  <td>${v.model}</td>
                  <td>${v.vehicleGroup}</td>
                  <td>${v.activeStatus}</td>
                </tr>
              `
                )
                .join("")}
            </tbody>
          </table>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="space-y-6">
      {/* Confirm Deletion */}
      <ConfirmDialog
        isOpen={confirmDeleteOpen}
        onClose={() => setConfirmDeleteOpen(false)}
        onConfirm={executeDelete}
        title="Delete Vehicle"
        message="Are you sure you want to remove this vehicle from NTMS fleet records?"
      />

      {/* Header and Add Trigger */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Vehicle Management</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Display, search, and export fleet vehicles.
          </p>
        </div>
        <Link
          to="/admin/vehicles/add"
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl shadow-sm hover:shadow transition-all duration-205 shrink-0"
        >
          <Plus className="w-5 h-5" />
          Add Vehicle
        </Link>
      </div>

      {/* Searching & Filter Dropdowns */}
      <div className="bg-white dark:bg-gray-950 border border-gray-150 dark:border-gray-800 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
          
          {/* Searching */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search by name, plate, model or roll..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-4 py-2 border border-gray-300 dark:border-gray-700 rounded-xl text-sm bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
          </div>

          {/* Filters & Actions */}
          <div className="flex flex-wrap items-center gap-3">
            
            {/* Filter by Group */}
            <div className="flex items-center gap-1.5 border border-gray-300 dark:border-gray-700 rounded-xl px-3 py-2 bg-transparent">
              <Filter className="w-4 h-4 text-gray-400" />
              <select
                value={filterGroup}
                onChange={(e) => {
                  setFilterGroup(e.target.value);
                  setCurrentPage(1);
                }}
                className="text-sm bg-transparent focus:outline-none border-none text-gray-700 dark:text-gray-300"
              >
                <option value="all">All Groups</option>
                <option value="Van">Van</option>
                <option value="Truck">Truck</option>
                <option value="Pickup">Pickup</option>
                <option value="Trailer">Trailer</option>
              </select>
            </div>

            {/* Filter by Status */}
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
                <option value="Running">Running</option>
                <option value="Idle">Idle</option>
                <option value="Maintenance">Maintenance</option>
              </select>
            </div>

            {/* Exporters */}
            <button
              onClick={exportToCSV}
              className="p-2 border border-gray-300 dark:border-gray-700 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400 transition-colors"
              title="Export CSV"
            >
              <Download className="w-4.5 h-4.5" />
            </button>
            <button
              onClick={exportToPDF}
              className="p-2 border border-gray-300 dark:border-gray-700 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400 transition-colors"
              title="Export PDF"
            >
              <FileText className="w-4.5 h-4.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Vehicle Data Table */}
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
                <th className="py-4 px-6 cursor-pointer" onClick={() => handleSort("name")}>
                  <div className="flex items-center gap-1">
                    Vehicle Name <ArrowUpDown className="w-3.5 h-3.5" />
                  </div>
                </th>
                <th className="py-4 px-6 cursor-pointer" onClick={() => handleSort("registrationNumber")}>
                  <div className="flex items-center gap-1">
                    Registration # <ArrowUpDown className="w-3.5 h-3.5" />
                  </div>
                </th>
                <th className="py-4 px-6 cursor-pointer" onClick={() => handleSort("model")}>
                  <div className="flex items-center gap-1">
                    Model <ArrowUpDown className="w-3.5 h-3.5" />
                  </div>
                </th>
                <th className="py-4 px-6 cursor-pointer" onClick={() => handleSort("vehicleGroup")}>
                  <div className="flex items-center gap-1">
                    Vehicle Group <ArrowUpDown className="w-3.5 h-3.5" />
                  </div>
                </th>
                <th className="py-4 px-6 cursor-pointer" onClick={() => handleSort("activeStatus")}>
                  <div className="flex items-center gap-1">
                    Active Status <ArrowUpDown className="w-3.5 h-3.5" />
                  </div>
                </th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-150 dark:divide-gray-800 text-sm">
              {currentVehicles.length > 0 ? (
                currentVehicles.map((vehicle) => (
                  <tr key={vehicle.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-900/30 transition-colors">
                    <td className="py-4 px-6 font-semibold text-gray-900 dark:text-white">
                      {vehicle.rollNumber}
                    </td>
                    <td className="py-4 px-6 text-gray-800 dark:text-gray-250">
                      {vehicle.name}
                    </td>
                    <td className="py-4 px-6 font-mono text-gray-500 dark:text-gray-400">
                      {vehicle.registrationNumber}
                    </td>
                    <td className="py-4 px-6 text-gray-600 dark:text-gray-350">
                      {vehicle.model}
                    </td>
                    <td className="py-4 px-6 text-gray-600 dark:text-gray-300">
                      <Badge variant="purple">{vehicle.vehicleGroup}</Badge>
                    </td>
                    <td className="py-4 px-6">
                      <Badge variant={getBadgeVariant(vehicle.activeStatus)}>
                        {vehicle.activeStatus}
                      </Badge>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => triggerDelete(vehicle.id)}
                          className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => navigate(`/admin/vehicles/edit/${vehicle.id}`)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/20 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <Link
                          to={`/admin/vehicles/edit/${vehicle.id}`}
                          className="p-1.5 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                          title="View"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-gray-400">
                    No vehicles found matching search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination bar */}
        {filteredVehicles.length > itemsPerPage && (
          <div className="p-4 bg-gray-50/50 dark:bg-gray-900/10 border-t border-gray-150 dark:border-gray-800 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
            <span>
              Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredVehicles.length)} of {filteredVehicles.length} vehicles
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

export default Vehicles;
export { Vehicles };

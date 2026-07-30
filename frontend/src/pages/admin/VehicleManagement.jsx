import { useState } from "react";
import { Link } from "react-router-dom";
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

const VehicleManagement = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [filterStatus, setFilterStatus] = useState("all");

  const [vehicles] = useState([
    {
      id: 1,
      rollNumber: "V001",
      name: "Toyota Hiace",
      registrationNumber: "AA-12345-ET",
      model: "2022",
      vehicleGroup: "Van",
      activeStatus: "Active",
    },
    {
      id: 2,
      rollNumber: "V002",
      name: "Isuzu Truck",
      registrationNumber: "AA-67890-ET",
      model: "2021",
      vehicleGroup: "Truck",
      activeStatus: "Active",
    },
    {
      id: 3,
      rollNumber: "V003",
      name: "Hino 500",
      registrationNumber: "AA-11223-ET",
      model: "2023",
      vehicleGroup: "Truck",
      activeStatus: "Active",
    },
    {
      id: 4,
      rollNumber: "V004",
      name: "Mercedes Sprinter",
      registrationNumber: "AA-44556-ET",
      model: "2022",
      vehicleGroup: "Van",
      activeStatus: "Maintenance",
    },
    {
      id: 5,
      rollNumber: "V005",
      name: "Mitsubishi Canter",
      registrationNumber: "AA-78901-ET",
      model: "2020",
      vehicleGroup: "Pickup",
      activeStatus: "Active",
    },
    {
      id: 6,
      rollNumber: "V006",
      name: "Ford Transit",
      registrationNumber: "AA-33445-ET",
      model: "2023",
      vehicleGroup: "Van",
      activeStatus: "Active",
    },
    {
      id: 7,
      rollNumber: "V007",
      name: "Hyundai HD72",
      registrationNumber: "AA-55667-ET",
      model: "2021",
      vehicleGroup: "Truck",
      activeStatus: "Inactive",
    },
    {
      id: 8,
      rollNumber: "V008",
      name: "Nissan Urvan",
      registrationNumber: "AA-88990-ET",
      model: "2022",
      vehicleGroup: "Van",
      activeStatus: "Active",
    },
  ]);

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case "active":
        return "bg-green-100 text-green-800";
      case "maintenance":
        return "bg-yellow-100 text-yellow-800";
      case "inactive":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const filteredVehicles = vehicles.filter((vehicle) => {
    const matchesSearch =
      vehicle.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vehicle.registrationNumber
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      vehicle.rollNumber.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter =
      filterStatus === "all" ||
      vehicle.activeStatus.toLowerCase() === filterStatus.toLowerCase();

    return matchesSearch && matchesFilter;
  });

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredVehicles.slice(
    indexOfFirstItem,
    indexOfLastItem,
  );
  const totalPages = Math.ceil(filteredVehicles.length / itemsPerPage);

  const handleExportCSV = () => {
    const csvContent = [
      [
        "Roll Number",
        "Vehicle Name",
        "Registration Number",
        "Model",
        "Vehicle Group",
        "Status",
      ],
      ...vehicles.map((v) => [
        v.rollNumber,
        v.name,
        v.registrationNumber,
        v.model,
        v.vehicleGroup,
        v.activeStatus,
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "vehicles.csv";
    a.click();
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Vehicle Management</h1>
        <p className="text-gray-600 mt-1">
          Manage your fleet vehicles and assignments
        </p>
      </div>

      {/* Filters and Actions */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
        <div className="flex flex-col lg:flex-row gap-4 justify-between">
          {/* Search */}
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search vehicles..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div className="flex gap-3">
            {/* Filter Dropdown */}
            <div className="relative">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="appearance-none px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="maintenance">Maintenance</option>
                <option value="inactive">Inactive</option>
              </select>
              <Filter className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
            </div>

            {/* Export Buttons */}
            <button
              onClick={handleExportCSV}
              className="px-4 py-2 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </button>

            {/* Add Vehicle Button */}
            <Link
              to="/admin/vehicles/add"
              className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Add Vehicle
            </Link>
          </div>
        </div>
      </div>

      {/* Vehicle Table */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left py-4 px-6 font-semibold text-gray-700">
                  Roll Number
                </th>
                <th className="text-left py-4 px-6 font-semibold text-gray-700">
                  Vehicle Name
                </th>
                <th className="text-left py-4 px-6 font-semibold text-gray-700">
                  Registration Number
                </th>
                <th className="text-left py-4 px-6 font-semibold text-gray-700">
                  Model
                </th>
                <th className="text-left py-4 px-6 font-semibold text-gray-700">
                  Vehicle Group
                </th>
                <th className="text-left py-4 px-6 font-semibold text-gray-700">
                  Active Status
                </th>
                <th className="text-left py-4 px-6 font-semibold text-gray-700">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {currentItems.length > 0 ? (
                currentItems.map((vehicle) => (
                  <tr
                    key={vehicle.id}
                    className="border-b border-gray-100 hover:bg-gray-50"
                  >
                    <td className="py-4 px-6 text-gray-900 font-medium">
                      {vehicle.rollNumber}
                    </td>
                    <td className="py-4 px-6 text-gray-900">{vehicle.name}</td>
                    <td className="py-4 px-6 text-gray-600">
                      {vehicle.registrationNumber}
                    </td>
                    <td className="py-4 px-6 text-gray-600">{vehicle.model}</td>
                    <td className="py-4 px-6">
                      <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold">
                        {vehicle.vehicleGroup}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(
                          vehicle.activeStatus,
                        )}`}
                      >
                        {vehicle.activeStatus}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex gap-2">
                        <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-gray-500">
                    No vehicles found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {filteredVehicles.length > 0 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
            <p className="text-sm text-gray-600">
              Showing {indexOfFirstItem + 1} to{" "}
              {Math.min(indexOfLastItem, filteredVehicles.length)} of{" "}
              {filteredVehicles.length} vehicles
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </button>
              <div className="flex gap-1">
                {[...Array(totalPages)].map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentPage(idx + 1)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium ${
                      currentPage === idx + 1
                        ? "bg-blue-600 text-white"
                        : "border border-gray-300 text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    {idx + 1}
                  </button>
                ))}
              </div>
              <button
                onClick={() =>
                  setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                }
                disabled={currentPage === totalPages}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VehicleManagement;

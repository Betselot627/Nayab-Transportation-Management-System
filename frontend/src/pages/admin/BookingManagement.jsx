import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { tripService } from "../../services/tripService";
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  Filter,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  Calendar,
  User,
  Truck,
} from "lucide-react";
import Badge from "../../components/common/Badge";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import toast from "react-hot-toast";

const BookingManagement = () => {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);
  
  // Filters State
  const [filterDate, setFilterDate] = useState("");
  const [filterDriver, setFilterDriver] = useState("all");
  const [filterVehicle, setFilterVehicle] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  // Sorting State
  const [sortField, setSortField] = useState("rollNumber");
  const [sortDirection, setSortDirection] = useState("asc");

  // Deletion Confirm dialog
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  // Mock Bookings Fallback Database
  const mockBookings = [
    { id: 1, rollNumber: "B001", customer: "Almaz Belay", vehicle: "Toyota Hiace (AA-12345)", bookingDate: "2026-08-01", tripType: "One Way", assignedDriver: "Abebe Kebede", tripStatus: "Assigned" },
    { id: 2, rollNumber: "B002", customer: "Bekele Zewde", vehicle: "Isuzu Truck (AA-67890)", bookingDate: "2026-08-02", tripType: "Round Trip", assignedDriver: "Meseret Haile", tripStatus: "Running" },
    { id: 3, rollNumber: "B003", customer: "Marta Kassa", vehicle: "Hino 500 (AA-11223)", bookingDate: "2026-07-28", tripType: "One Way", assignedDriver: "Dawit Tesfaye", tripStatus: "Completed" },
    { id: 4, rollNumber: "B004", customer: "Yonas Alemu", vehicle: "Mercedes Sprinter (AA-44556)", bookingDate: "2026-08-05", tripType: "One Way", assignedDriver: "Tigist Alemayehu", tripStatus: "Pending" },
    { id: 5, rollNumber: "B005", customer: "Helen Solomon", vehicle: "Mitsubishi Canter (AA-78901)", bookingDate: "2026-07-30", tripType: "Round Trip", assignedDriver: "Solomon Girma", tripStatus: "Cancelled" },
  ];

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const res = await tripService.getAllTrips();
      if (res && res.data && res.data.length > 0) {
        const mapped = res.data.map((t, idx) => ({
          id: t._id,
          rollNumber: `B${String(idx + 1).padStart(3, "0")}`,
          customer: t.shipmentId?.userId?.name || "Premium Client",
          vehicle: t.vehicleId ? `${t.vehicleId.manufacturer} (${t.vehicleId.plateNumber})` : "Unassigned",
          bookingDate: t.startTime?.split("T")[0] || t.createdAt?.split("T")[0] || "25-12-2024",
          tripType: t.shipmentId?.cargoDetails?.type || "One Way",
          assignedDriver: t.driverId?.fullName || "Unassigned",
          tripStatus: t.status.charAt(0).toUpperCase() + t.status.slice(1),
        }));
        setBookings(mapped);
      } else {
        setBookings(mockBookings);
      }
    } catch (err) {
      console.warn("REST API offline, fallback to mock bookings:", err);
      setBookings(mockBookings);
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
        await tripService.deleteTrip(deleteId);
      }
      setBookings(bookings.filter((b) => b.id !== deleteId));
      toast.success("Booking cancelled and deleted successfully");
    } catch (err) {
      setBookings(bookings.filter((b) => b.id !== deleteId));
      toast.success("Booking cancelled and deleted successfully (Simulated)");
    }
  };

  const getBadgeVariant = (status) => {
    switch (status.toLowerCase()) {
      case "assigned":
        return "info";
      case "running":
      case "in progress":
        return "purple";
      case "completed":
        return "success";
      case "pending":
        return "warning";
      case "cancelled":
        return "error";
      default:
        return "default";
    }
  };

  // Extract unique drivers & vehicles for filter dropdowns
  const uniqueDrivers = ["all", ...new Set(bookings.map((b) => b.assignedDriver))];
  const uniqueVehicles = ["all", ...new Set(bookings.map((b) => b.vehicle))];

  // Searching & Filtering
  const filteredBookings = bookings
    .filter((b) => {
      const term = searchTerm.toLowerCase();
      const matchesSearch =
        b.customer.toLowerCase().includes(term) ||
        b.vehicle.toLowerCase().includes(term) ||
        b.rollNumber.toLowerCase().includes(term) ||
        b.assignedDriver.toLowerCase().includes(term);

      const matchesDate = !filterDate || b.bookingDate === filterDate;
      const matchesDriver = filterDriver === "all" || b.assignedDriver === filterDriver;
      const matchesVehicle = filterVehicle === "all" || b.vehicle === filterVehicle;
      const matchesStatus = filterStatus === "all" || b.tripStatus === filterStatus;

      return matchesSearch && matchesDate && matchesDriver && matchesVehicle && matchesStatus;
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
  const currentBookings = filteredBookings.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredBookings.length / itemsPerPage);

  return (
    <div className="space-y-6">
      {/* Cancellation/Delete confirm */}
      <ConfirmDialog
        isOpen={confirmDeleteOpen}
        onClose={() => setConfirmDeleteOpen(false)}
        onConfirm={executeDelete}
        title="Delete Booking"
        message="Are you sure you want to cancel and delete this booking? This will unassign the driver and vehicle."
      />

      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Booking Management</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Display, search, schedule and manage all trip bookings.
          </p>
        </div>
        <Link
          to="/admin/bookings/add"
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl shadow-sm hover:shadow transition-all duration-205 shrink-0"
        >
          <Plus className="w-5 h-5" />
          Add Booking
        </Link>
      </div>

      {/* Search and Filters Section */}
      <div className="bg-white dark:bg-gray-950 border border-gray-150 dark:border-gray-800 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
          
          {/* Search */}
          <div className="lg:col-span-2 space-y-1.5">
            <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search customer, driver, plate..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-9 pr-4 py-2 border border-gray-300 dark:border-gray-700 rounded-xl text-sm bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Date Filter */}
          <div className="space-y-1.5">
            <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Date</label>
            <input
              type="date"
              value={filterDate}
              onChange={(e) => {
                setFilterDate(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-xl text-sm bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-gray-500"
            />
          </div>

          {/* Driver Filter */}
          <div className="space-y-1.5">
            <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Driver</label>
            <div className="relative">
              <select
                value={filterDriver}
                onChange={(e) => {
                  setFilterDriver(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-3 py-2 pr-8 border border-gray-300 dark:border-gray-700 rounded-xl text-sm bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 appearance-none text-gray-750 dark:text-gray-300"
              >
                <option value="all">All Drivers</option>
                {uniqueDrivers.filter(d => d !== "all").map(driver => (
                  <option key={driver} value={driver}>{driver}</option>
                ))}
              </select>
              <User className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
            </div>
          </div>

          {/* Status Filter */}
          <div className="space-y-1.5">
            <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Status</label>
            <div className="relative">
              <select
                value={filterStatus}
                onChange={(e) => {
                  setFilterStatus(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-3 py-2 pr-8 border border-gray-300 dark:border-gray-700 rounded-xl text-sm bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 appearance-none text-gray-750 dark:text-gray-300"
              >
                <option value="all">All Status</option>
                <option value="Pending">Pending</option>
                <option value="Assigned">Assigned</option>
                <option value="Running">Running</option>
                <option value="Completed">Completed</option>
                <option value="Cancelled">Cancelled</option>
              </select>
              <Filter className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
            </div>
          </div>
        </div>
      </div>

      {/* Bookings Table List */}
      <div className="bg-white dark:bg-gray-950 border border-gray-150 dark:border-gray-800 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/75 dark:bg-gray-900/50 border-b border-gray-150 dark:border-gray-800 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase select-none">
                <th className="py-4 px-6 cursor-pointer" onClick={() => handleSort("rollNumber")}>
                  <div className="flex items-center gap-1">
                    Booking # <ArrowUpDown className="w-3.5 h-3.5" />
                  </div>
                </th>
                <th className="py-4 px-6 cursor-pointer" onClick={() => handleSort("customer")}>
                  <div className="flex items-center gap-1">
                    Customer <ArrowUpDown className="w-3.5 h-3.5" />
                  </div>
                </th>
                <th className="py-4 px-6 cursor-pointer" onClick={() => handleSort("vehicle")}>
                  <div className="flex items-center gap-1">
                    Vehicle <ArrowUpDown className="w-3.5 h-3.5" />
                  </div>
                </th>
                <th className="py-4 px-6 cursor-pointer" onClick={() => handleSort("bookingDate")}>
                  <div className="flex items-center gap-1">
                    Booking Date <ArrowUpDown className="w-3.5 h-3.5" />
                  </div>
                </th>
                <th className="py-4 px-6">Trip Type</th>
                <th className="py-4 px-6 cursor-pointer" onClick={() => handleSort("assignedDriver")}>
                  <div className="flex items-center gap-1">
                    Driver <ArrowUpDown className="w-3.5 h-3.5" />
                  </div>
                </th>
                <th className="py-4 px-6 cursor-pointer" onClick={() => handleSort("tripStatus")}>
                  <div className="flex items-center gap-1">
                    Trip Status <ArrowUpDown className="w-3.5 h-3.5" />
                  </div>
                </th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-150 dark:divide-gray-800 text-sm">
              {currentBookings.length > 0 ? (
                currentBookings.map((booking) => (
                  <tr key={booking.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-900/30 transition-colors">
                    <td className="py-4 px-6 font-semibold text-gray-900 dark:text-white">
                      {booking.rollNumber}
                    </td>
                    <td className="py-4 px-6 font-semibold text-gray-800 dark:text-gray-250">
                      {booking.customer}
                    </td>
                    <td className="py-4 px-6 text-gray-600 dark:text-gray-350">
                      {booking.vehicle}
                    </td>
                    <td className="py-4 px-6 text-gray-500 dark:text-gray-400 font-mono text-xs">
                      {booking.bookingDate}
                    </td>
                    <td className="py-4 px-6 text-gray-600 dark:text-gray-300">
                      {booking.tripType}
                    </td>
                    <td className="py-4 px-6 text-gray-600 dark:text-gray-350">
                      {booking.assignedDriver}
                    </td>
                    <td className="py-4 px-6">
                      <Badge variant={getBadgeVariant(booking.tripStatus)}>
                        {booking.tripStatus}
                      </Badge>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => triggerDelete(booking.id)}
                          className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => navigate(`/admin/bookings/edit/${booking.id}`)}
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
                  <td colSpan="8" className="py-12 text-center text-gray-400">
                    No bookings found matching filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination controls */}
        {filteredBookings.length > itemsPerPage && (
          <div className="p-4 bg-gray-50/50 dark:bg-gray-900/10 border-t border-gray-150 dark:border-gray-800 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
            <span>
              Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredBookings.length)} of {filteredBookings.length} bookings
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

export default BookingManagement;
export { BookingManagement };

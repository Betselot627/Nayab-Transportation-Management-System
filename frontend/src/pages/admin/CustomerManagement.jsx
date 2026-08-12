import { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAdminData } from "../../context/AdminDataContext";
import { customerService } from "../../services/customerService";
import api from "../../services/api";
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  Filter,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  User,
} from "lucide-react";
import Badge from "../../components/common/Badge";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import toast from "react-hot-toast";

const CustomerManagement = () => {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState([]);
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

  useEffect(() => {
    fetchCustomers(false);
  }, []);

  const fetchCustomers = async (force = false) => {
    try {
      if (customers.length === 0) setLoading(true);
      const res = await customerService.getAllCustomers(
        { limit: 100 },
        { force, ttl: 45000 },
      );
      if (res && res.data) {
        const mapped = res.data.map((c, idx) => ({
          id: c._id,
          userId: c.userId?._id || null,
          rollNumber: `C${String(idx + 1).padStart(3, "0")}`,
          name:
            c.companyName ||
            c.userId?.name ||
            c.contactPerson?.name ||
            "Customer",
          mobile: c.userId?.phone || c.contactPerson?.phone || "N/A",
          email: c.userId?.email || c.contactPerson?.email || "N/A",
          address:
            c.address && typeof c.address === "object"
              ? [c.address.street, c.address.city, c.address.country]
                  .filter(Boolean)
                  .join(", ")
              : c.address || "Addis Ababa, Ethiopia",
          totalShipments: c.totalShipments || 0,
          status: c.userId?.status === "active" ? "Active" : "Inactive",
        }));
        setCustomers(mapped);
      } else {
        setCustomers([]);
      }
    } catch (err) {
      console.error("Failed to fetch customers:", err);
      setCustomers([]);
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
        await customerService.deleteCustomer(deleteId);
      }
      setCustomers((prev) => prev.filter((c) => c.id !== deleteId));
      toast.success("Customer profile deleted successfully");
      fetchCustomers(true);
    } catch (err) {
      setCustomers((prev) => prev.filter((c) => c.id !== deleteId));
      toast.success("Customer profile removed");
    } finally {
      setConfirmDeleteOpen(false);
      setDeleteId(null);
    }
  };

  const handleApproveCustomer = async (userId) => {
    try {
      await api.put(`/users/${userId}/status`, { status: "active" });
      toast.success("Customer account approved successfully!");
      fetchCustomers(true);
    } catch (err) {
      console.error("Failed to approve customer:", err);
      toast.error(err.response?.data?.message || "Failed to approve customer");
    }
  };

  const getBadgeVariant = (status) => {
    switch (status.toLowerCase()) {
      case "active":
        return "success";
      case "inactive":
        return "error";
      default:
        return "default";
    }
  };

  // Searching & Filtering
  const filteredCustomers = customers
    .filter((c) => {
      const term = searchTerm.toLowerCase();
      const matchesSearch =
        c.name.toLowerCase().includes(term) ||
        c.mobile.includes(term) ||
        c.email.toLowerCase().includes(term) ||
        c.rollNumber.toLowerCase().includes(term);

      const matchesStatus = filterStatus === "all" || c.status === filterStatus;

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
  const currentCustomers = filteredCustomers.slice(
    indexOfFirstItem,
    indexOfLastItem,
  );
  const totalPages = Math.ceil(filteredCustomers.length / itemsPerPage);

  return (
    <div className="space-y-6">
      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={confirmDeleteOpen}
        onClose={() => setConfirmDeleteOpen(false)}
        onConfirm={executeDelete}
        title="Delete Customer Profile"
        message="Are you sure you want to delete this customer? This will clear all booking statistics associated with them."
      />

      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Customer Management
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Display, search, edit, and record customer details.
          </p>
        </div>
        <Link
          to="/admin/customers/add"
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl shadow-sm hover:shadow transition-all duration-205 shrink-0"
        >
          <Plus className="w-5 h-5" />
          Add Customer
        </Link>
      </div>

      {/* Search and Filters */}
      <div className="bg-white dark:bg-gray-900 border border-gray-250 dark:border-gray-800 rounded-2xl p-5 shadow-sm flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search customers..."
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
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      {/* Customers List Table */}
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
                <th
                  className="py-4 px-6 cursor-pointer"
                  onClick={() => handleSort("name")}
                >
                  <div className="flex items-center gap-1">
                    Customer Name <ArrowUpDown className="w-3.5 h-3.5" />
                  </div>
                </th>
                <th className="py-4 px-6">Mobile Number</th>
                <th
                  className="py-4 px-6 cursor-pointer"
                  onClick={() => handleSort("email")}
                >
                  <div className="flex items-center gap-1">
                    Email <ArrowUpDown className="w-3.5 h-3.5" />
                  </div>
                </th>
                <th className="py-4 px-6">Address</th>
                <th
                  className="py-4 px-6 cursor-pointer"
                  onClick={() => handleSort("status")}
                >
                  <div className="flex items-center gap-1">
                    Status <ArrowUpDown className="w-3.5 h-3.5" />
                  </div>
                </th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-250 dark:divide-gray-800 text-sm">
              {currentCustomers.length > 0 ? (
                currentCustomers.map((customer) => (
                  <tr
                    key={customer.id}
                    className="hover:bg-gray-50/50 dark:hover:bg-gray-900/30 transition-colors"
                  >
                    <td className="py-4 px-6 font-semibold text-gray-900 dark:text-white">
                      {customer.rollNumber}
                    </td>
                    <td className="py-4 px-6 font-semibold text-gray-800 dark:text-gray-300">
                      {customer.name}
                    </td>
                    <td className="py-4 px-6 text-gray-600 dark:text-gray-400">
                      {customer.mobile}
                    </td>
                    <td className="py-4 px-6 text-gray-650 dark:text-gray-400 font-mono text-xs">
                      {customer.email}
                    </td>
                    <td className="py-4 px-6 text-gray-600 dark:text-gray-400">
                      {customer.address}
                    </td>
                    <td className="py-4 px-6">
                      <Badge variant={getBadgeVariant(customer.status)}>
                        {customer.status}
                      </Badge>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex justify-end items-center gap-2">
                        {customer.status === "Inactive" && customer.userId && (
                          <button
                            onClick={() =>
                              handleApproveCustomer(customer.userId)
                            }
                            className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg transition-colors flex items-center"
                            title="Approve Customer"
                          >
                            Approve
                          </button>
                        )}
                        <button
                          onClick={() => triggerDelete(customer.id)}
                          className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() =>
                            navigate(`/admin/customers/edit/${customer.id}`)
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
                  <td colSpan="7" className="py-12 text-center text-gray-400">
                    No customers found matching filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination controls */}
        {filteredCustomers.length > itemsPerPage && (
          <div className="p-4 bg-gray-50/50 dark:bg-gray-900/10 border-t border-gray-250 dark:border-gray-800 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
            <span>
              Showing {indexOfFirstItem + 1} to{" "}
              {Math.min(indexOfLastItem, filteredCustomers.length)} of{" "}
              {filteredCustomers.length} customers
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

export default CustomerManagement;
export { CustomerManagement };

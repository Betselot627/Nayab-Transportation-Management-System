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

  // Detail Modal State
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

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
          approvalStatus: v.approvalStatus || "approved",
        }));
        setVehicles(mapped);
      } else {
        // Use Mock data fallback
        setVehicles(mockVehicles.map(v => ({ ...v, approvalStatus: "approved" })));
      }
    } catch (err) {
      console.warn("REST API offline, initializing with mock data:", err);
      setVehicles(mockVehicles.map(v => ({ ...v, approvalStatus: "approved" })));
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
      toast.success("Vehicle removed from records");
    } catch (err) {
      setVehicles(vehicles.filter((v) => v.id !== deleteId));
      toast.success("Vehicle removed successfully (Simulated)");
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

  const getApprovalBadgeVariant = (status) => {
    switch (status?.toLowerCase()) {
      case "approved":
        return "success";
      case "pending":
        return "warning";
      case "rejected":
        return "error";
      default:
        return "default";
    }
  };

  const handleApproveVehicle = async (id, e) => {
    if (e) e.stopPropagation();
    try {
      await vehicleService.approveVehicle(id);
      toast.success("Vehicle approved successfully");
      fetchVehicles();
      if (selectedVehicle && selectedVehicle._id === id) {
        setSelectedVehicle(prev => ({ ...prev, approvalStatus: "approved" }));
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to approve vehicle");
    }
  };

  const handleRejectVehicle = async (id, e) => {
    if (e) e.stopPropagation();
    const reason = window.prompt("Please enter the reason for rejecting this vehicle:");
    if (reason === null) return; // cancelled
    try {
      await vehicleService.rejectVehicle(id, reason);
      toast.success("Vehicle registration rejected");
      fetchVehicles();
      if (selectedVehicle && selectedVehicle._id === id) {
        setSelectedVehicle(prev => ({ ...prev, approvalStatus: "rejected" }));
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to reject vehicle");
    }
  };

  // Clicking on vehicle name loads full details
  const handleVehicleClick = async (id) => {
    if (typeof id === "number" || String(id).length < 10) {
      const mock = mockVehicles.find(v => v.id === id);
      setSelectedVehicle({
        _id: id,
        plateNumber: mock.registrationNumber,
        manufacturer: mock.name.split(" ")[0],
        model: mock.name.split(" ").slice(1).join(" "),
        type: mock.vehicleGroup.toLowerCase(),
        year: parseInt(mock.model),
        color: "White",
        status: mock.activeStatus === "Running" ? "available" : "maintenance",
        approvalStatus: "approved",
        createdAt: new Date(),
        capacity: { weight: 5, unit: "ton" },
        insurance: { company: "EFU General", policyNumber: "POL-7712", expiryDate: new Date() },
        registration: { number: "REG-9912", expiryDate: new Date() }
      });
      return;
    }

    try {
      setLoadingDetails(true);
      const res = await vehicleService.getVehicleById(id);
      if (res && res.data) {
        setSelectedVehicle(res.data);
      } else {
        toast.error("Failed to load vehicle details");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch vehicle information");
    } finally {
      setLoadingDetails(false);
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
    <div className="space-y-6 relative">
      {/* Loading Overlay */}
      {loadingDetails && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center backdrop-blur-xs">
          <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-xl flex items-center gap-3">
            <Loader className="w-6 h-6 text-blue-600 animate-spin" />
            <span className="text-sm font-semibold">Retrieving vehicle folder...</span>
          </div>
        </div>
      )}

      {/* Confirm Deletion */}
      <ConfirmDialog
        isOpen={confirmDeleteOpen}
        onClose={() => setConfirmDeleteOpen(false)}
        onConfirm={executeDelete}
        title="Delete Vehicle"
        message="Are you sure you want to remove this vehicle from NTMS fleet records?"
      />

      {/* Detail Overlay Modal */}
      {selectedVehicle && (
        <div className="fixed inset-0 bg-black/55 backdrop-blur-xs z-40 flex justify-end transition-opacity duration-300">
          <div className="w-full max-w-2xl bg-white dark:bg-gray-900 h-full shadow-2xl flex flex-col p-6 overflow-y-auto animate-slide-in relative">
            
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b pb-4 border-gray-250 dark:border-gray-800">
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {selectedVehicle.manufacturer} {selectedVehicle.model}
                  </h2>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-400">
                    {selectedVehicle.type}
                  </span>
                </div>
                <p className="text-sm font-mono text-gray-500 dark:text-gray-400">
                  Plate: {selectedVehicle.plateNumber} | Color: {selectedVehicle.color || "N/A"}
                </p>
              </div>
              <button 
                onClick={() => setSelectedVehicle(null)}
                className="p-1.5 hover:bg-gray-105 dark:hover:bg-gray-900 rounded-xl transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 py-6 space-y-8">
              
              {/* Badges Panel */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 dark:bg-gray-900/50 p-3 rounded-xl flex items-center justify-between border border-gray-250 dark:border-gray-800">
                  <span className="text-xs font-bold text-gray-500">Fleet Status</span>
                  <Badge variant={selectedVehicle.status === "available" ? "success" : selectedVehicle.status === "maintenance" ? "error" : "warning"}>
                    {selectedVehicle.status}
                  </Badge>
                </div>
                <div className="bg-gray-50 dark:bg-gray-900/50 p-3 rounded-xl flex items-center justify-between border border-gray-250 dark:border-gray-800">
                  <span className="text-xs font-bold text-gray-500">Registry Status</span>
                  <Badge variant={getApprovalBadgeVariant(selectedVehicle.approvalStatus)}>
                    {selectedVehicle.approvalStatus}
                  </Badge>
                </div>
              </div>

              {/* Photos Gallery */}
              <div className="space-y-3">
                <h3 className="text-sm font-extrabold text-gray-900 dark:text-white flex items-center gap-1.5">
                  <Truck className="w-4.5 h-4.5 text-blue-500" /> Vehicle Photos
                </h3>
                {selectedVehicle.images && selectedVehicle.images.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {selectedVehicle.images.map((img, idx) => (
                      <div key={idx} className="h-28 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-800 bg-gray-50 flex items-center justify-center group relative">
                        <img src={img} alt="Vehicle photo" className="w-full h-full object-cover" />
                        <a 
                          href={img} 
                          target="_blank" 
                          rel="noreferrer" 
                          className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <ExternalLink className="w-5 h-5 text-white" />
                        </a>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-400 dark:text-gray-500 italic">No photos uploaded for this vehicle.</p>
                )}
              </div>

              {/* Complete Specifications */}
              <div className="space-y-3">
                <h3 className="text-sm font-extrabold text-gray-900 dark:text-white">Technical Details</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 border border-gray-250 dark:border-gray-800 rounded-2xl p-4 bg-gray-50/20 dark:bg-gray-900/10">
                  <div>
                    <span className="text-[10px] font-bold text-gray-400 uppercase">Year</span>
                    <p className="text-sm font-semibold">{selectedVehicle.year}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-gray-400 uppercase">Fuel Type</span>
                    <p className="text-sm font-semibold capitalize">{selectedVehicle.fuelType || "N/A"}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-gray-400 uppercase">Capacity</span>
                    <p className="text-sm font-semibold">{selectedVehicle.capacity?.weight} {selectedVehicle.capacity?.unit}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-gray-400 uppercase">Insurance Company</span>
                    <p className="text-xs font-semibold">{selectedVehicle.insurance?.company || "N/A"}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-gray-400 uppercase">Policy Number</span>
                    <p className="text-xs font-semibold font-mono">{selectedVehicle.insurance?.policyNumber || "N/A"}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-gray-400 uppercase">Insurance Expiry</span>
                    <p className="text-xs font-semibold">
                      {selectedVehicle.insurance?.expiryDate ? new Date(selectedVehicle.insurance.expiryDate).toLocaleDateString() : "N/A"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Owner / Driver Info */}
              <div className="space-y-3">
                <h3 className="text-sm font-extrabold text-gray-900 dark:text-white flex items-center gap-1.5">
                  <User className="w-4.5 h-4.5 text-blue-500" /> Owner / Assigned Driver
                </h3>
                {selectedVehicle.currentDriver || selectedVehicle.registeredBy ? (
                  <div className="border border-gray-250 dark:border-gray-800 rounded-2xl p-4 space-y-3 bg-gray-50/20 dark:bg-gray-900/10">
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="font-bold text-gray-400">Driver Name:</span>
                        <p className="font-semibold text-gray-800 dark:text-gray-200">
                          {selectedVehicle.currentDriver?.fullName || selectedVehicle.registeredBy?.fullName}
                        </p>
                      </div>
                      <div>
                        <span className="font-bold text-gray-400">License Number:</span>
                        <p className="font-semibold font-mono">
                          {selectedVehicle.currentDriver?.licenseNumber || selectedVehicle.registeredBy?.licenseNumber}
                        </p>
                      </div>
                      <div>
                        <span className="font-bold text-gray-400">Experience:</span>
                        <p className="font-semibold">
                          {selectedVehicle.currentDriver?.experience !== undefined ? `${selectedVehicle.currentDriver.experience} years` : "N/A"}
                        </p>
                      </div>
                      <div>
                        <span className="font-bold text-gray-400">Contact Phone:</span>
                        <p className="font-semibold">
                          {selectedVehicle.currentDriver?.userId?.phone || selectedVehicle.registeredBy?.userId?.phone || "N/A"}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-gray-400 dark:text-gray-500 italic">No owner or driver associated (Fleet Vehicle).</p>
                )}
              </div>

              {/* Uploaded Documents */}
              <div className="space-y-3">
                <h3 className="text-sm font-extrabold text-gray-900 dark:text-white flex items-center gap-1.5">
                  <FileText className="w-4.5 h-4.5 text-blue-500" /> Uploaded Documents
                </h3>
                
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {/* Registration Document */}
                  {selectedVehicle.registration?.document && (
                    <div className="border border-gray-200 dark:border-gray-800 rounded-xl p-3 flex flex-col items-center justify-between text-center bg-gray-50/50">
                      <div className="w-full h-16 rounded overflow-hidden mb-2 bg-gray-100 flex items-center justify-center">
                        <img src={selectedVehicle.registration.document} className="w-full h-full object-cover" />
                      </div>
                      <span className="text-[10px] font-bold block mb-1">Registration Card</span>
                      <a href={selectedVehicle.registration.document} target="_blank" rel="noreferrer" className="text-[10px] text-blue-600 hover:underline flex items-center gap-0.5">
                        Open File <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    </div>
                  )}

                  {/* Insurance Document */}
                  {selectedVehicle.insurance?.document && (
                    <div className="border border-gray-200 dark:border-gray-800 rounded-xl p-3 flex flex-col items-center justify-between text-center bg-gray-50/50">
                      <div className="w-full h-16 rounded overflow-hidden mb-2 bg-gray-100 flex items-center justify-center">
                        <img src={selectedVehicle.insurance.document} className="w-full h-full object-cover" />
                      </div>
                      <span className="text-[10px] font-bold block mb-1">Insurance Policy</span>
                      <a href={selectedVehicle.insurance.document} target="_blank" rel="noreferrer" className="text-[10px] text-blue-600 hover:underline flex items-center gap-0.5">
                        Open File <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    </div>
                  )}

                  {/* Inspection Document */}
                  {selectedVehicle.inspectionDocument && (
                    <div className="border border-gray-200 dark:border-gray-800 rounded-xl p-3 flex flex-col items-center justify-between text-center bg-gray-50/50">
                      <div className="w-full h-16 rounded overflow-hidden mb-2 bg-gray-100 flex items-center justify-center">
                        <img src={selectedVehicle.inspectionDocument} className="w-full h-full object-cover" />
                      </div>
                      <span className="text-[10px] font-bold block mb-1">Fitness Certificate</span>
                      <a href={selectedVehicle.inspectionDocument} target="_blank" rel="noreferrer" className="text-[10px] text-blue-600 hover:underline flex items-center gap-0.5">
                        Open File <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    </div>
                  )}

                  {/* Supporting Document */}
                  {selectedVehicle.supportingDocuments && selectedVehicle.supportingDocuments.length > 0 && selectedVehicle.supportingDocuments[0] && (
                    <div className="border border-gray-200 dark:border-gray-800 rounded-xl p-3 flex flex-col items-center justify-between text-center bg-gray-50/50">
                      <div className="w-full h-16 rounded overflow-hidden mb-2 bg-gray-100 flex items-center justify-center">
                        <img src={selectedVehicle.supportingDocuments[0]} className="w-full h-full object-cover" />
                      </div>
                      <span className="text-[10px] font-bold block mb-1">Supporting Doc</span>
                      <a href={selectedVehicle.supportingDocuments[0]} target="_blank" rel="noreferrer" className="text-[10px] text-blue-600 hover:underline flex items-center gap-0.5">
                        Open File <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    </div>
                  )}
                </div>

                {!selectedVehicle.registration?.document && !selectedVehicle.insurance?.document && !selectedVehicle.inspectionDocument && (
                  <p className="text-xs text-gray-400 dark:text-gray-500 italic">No formal verification papers uploaded.</p>
                )}
              </div>

              {/* Additional details */}
              <div className="space-y-2 border-t pt-4 border-gray-250 dark:border-gray-800 text-xs text-gray-500">
                <div className="flex justify-between">
                  <span>Registered date:</span>
                  <span className="font-semibold text-gray-800 dark:text-gray-200">
                    {selectedVehicle.createdAt ? new Date(selectedVehicle.createdAt).toLocaleDateString() : "N/A"}
                  </span>
                </div>
                {selectedVehicle.notes && (
                  <div className="space-y-1.5 mt-2">
                    <span className="font-bold">Additional comments:</span>
                    <p className="p-3 bg-gray-50 dark:bg-gray-900 border rounded-xl text-xs italic">{selectedVehicle.notes}</p>
                  </div>
                )}
              </div>

            </div>

            {/* Modal Actions */}
            <div className="border-t pt-4 border-gray-250 dark:border-gray-800 flex justify-end items-center gap-3">
              {selectedVehicle.approvalStatus === "pending" && (
                <>
                  <button
                    onClick={() => handleApproveVehicle(selectedVehicle._id)}
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition-colors shadow-sm"
                  >
                    Approve Vehicle
                  </button>
                  <button
                    onClick={() => handleRejectVehicle(selectedVehicle._id)}
                    className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs transition-colors shadow-sm"
                  >
                    Reject Vehicle
                  </button>
                </>
              )}
              <button
                onClick={() => setSelectedVehicle(null)}
                className="px-5 py-2.5 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-900 font-semibold rounded-xl text-xs transition-all"
              >
                Close View
              </button>
            </div>

          </div>
        </div>
      )}

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
      <div className="bg-white dark:bg-gray-900 border border-gray-250 dark:border-gray-800 rounded-2xl p-5 shadow-sm space-y-4">
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
      <div className="bg-white dark:bg-gray-900 border border-gray-250 dark:border-gray-800 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/75 dark:bg-gray-900/50 border-b border-gray-250 dark:border-gray-800 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase select-none">
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
                <th className="py-4 px-6 cursor-pointer" onClick={() => handleSort("approvalStatus")}>
                  <div className="flex items-center gap-1">
                    Approval Status <ArrowUpDown className="w-3.5 h-3.5" />
                  </div>
                </th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-250 dark:divide-gray-800 text-sm">
              {currentVehicles.length > 0 ? (
                currentVehicles.map((vehicle) => (
                  <tr key={vehicle.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-900/30 transition-colors">
                    <td className="py-4 px-6 font-semibold text-gray-900 dark:text-white">
                      {vehicle.rollNumber}
                    </td>
                    <td className="py-4 px-6 text-gray-800 dark:text-gray-300">
                      <button
                        onClick={() => handleVehicleClick(vehicle.id)}
                        className="text-blue-600 dark:text-blue-400 hover:underline font-semibold text-left transition-colors"
                      >
                        {vehicle.name}
                      </button>
                    </td>
                    <td className="py-4 px-6 font-mono text-gray-500 dark:text-gray-400">
                      {vehicle.registrationNumber}
                    </td>
                    <td className="py-4 px-6 text-gray-600 dark:text-gray-400">
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
                    <td className="py-4 px-6">
                      <Badge variant={getApprovalBadgeVariant(vehicle.approvalStatus)}>
                        {vehicle.approvalStatus}
                      </Badge>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex justify-end items-center gap-2">
                        {vehicle.approvalStatus === "pending" && (
                          <div className="flex gap-1.5 mr-2">
                            <button
                              onClick={(e) => handleApproveVehicle(vehicle.id, e)}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-colors shadow-sm"
                            >
                              Approve
                            </button>
                            <button
                              onClick={(e) => handleRejectVehicle(vehicle.id, e)}
                              className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg transition-colors shadow-sm"
                            >
                              Reject
                            </button>
                          </div>
                        )}
                        <button
                          onClick={() => triggerDelete(vehicle.id)}
                          className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-gray-400">
                    No vehicles found matching search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination bar */}
        {filteredVehicles.length > itemsPerPage && (
          <div className="p-4 bg-gray-50/50 dark:bg-gray-900/10 border-t border-gray-250 dark:border-gray-800 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
            <span>
              Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredVehicles.length)} of {filteredVehicles.length} vehicles
            </span>
            <div className="flex gap-1">
              <button
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                disabled={currentPage === 1}
                className="px-2.5 py-1.5 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-855 disabled:opacity-50 transition-colors flex items-center gap-1"
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
                      : "border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-855"
                  }`}
                >
                  {idx + 1}
                </button>
              ))}
              <button
                onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-2.5 py-1.5 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-855 disabled:opacity-50 transition-colors flex items-center gap-1"
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

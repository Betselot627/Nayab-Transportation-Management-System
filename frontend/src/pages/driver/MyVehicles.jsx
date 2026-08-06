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
  CheckCircle,
  XCircle,
  User,
  Eye,
  Calendar,
  X,
  ShieldAlert,
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";

const MyVehicles = () => {
  const navigate = useNavigate();
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedVehicle, setSelectedVehicle] = useState(null);

  // Set up 5-second polling interval
  useEffect(() => {
    fetchVehicles(true);
    const interval = setInterval(() => {
      fetchVehicles(false);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const fetchVehicles = async (showLoader = false) => {
    try {
      if (showLoader) setLoading(true);
      const response = await vehicleService.getAllVehicles();
      setVehicles(response.data || []);
    } catch (error) {
      console.error(error);
      if (showLoader) toast.error("Failed to load vehicles");
    } finally {
      if (showLoader) setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      available: "bg-green-100 text-green-800 border-green-200",
      in_use: "bg-blue-100 text-blue-800 border-blue-200",
      maintenance: "bg-amber-100 text-amber-800 border-amber-200",
      inactive: "bg-gray-100 text-gray-800 border-gray-200",
    };
    return (
      <span
        className={`px-3 py-1 rounded-full text-[10px] font-bold border capitalize ${
          badges[status] || badges.inactive
        }`}
      >
        {status?.replace("_", " ")}
      </span>
    );
  };

  const getApprovalBadge = (status) => {
    const badges = {
      approved: "bg-green-100 text-green-800 border-green-200",
      pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
      rejected: "bg-red-100 text-red-800 border-red-200",
    };
    return (
      <span
        className={`px-3 py-1 rounded-full text-[10px] font-bold border capitalize ${
          badges[status] || badges.pending
        }`}
      >
        {status}
      </span>
    );
  };

  if (loading && vehicles.length === 0) {
    return <Loading />;
  }

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto min-h-screen bg-slate-50">
      <Toaster position="top-right" />

      {/* Page Header */}
      <div className="flex justify-between items-center flex-wrap gap-4 border-b pb-5">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">My Vehicles</h1>
          <p className="text-slate-500 mt-1 font-semibold text-sm">
            Manage your registered fleet vehicles and view active cargo assignments.
          </p>
        </div>
        <button
          onClick={() => navigate("/driver/register-vehicle")}
          className="px-5 py-3 bg-green-700 hover:bg-green-800 text-white rounded-xl font-bold transition text-xs shadow-md flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          Register New Vehicle
        </button>
      </div>

      {/* Fleet Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon={<Truck className="w-5 h-5 text-blue-700" />}
          label="Total Registered"
          value={vehicles.length}
          color="bg-blue-50 border-blue-100"
        />
        <StatCard
          icon={<CheckCircle className="w-5 h-5 text-green-700" />}
          label="Approved Fleet"
          value={vehicles.filter(v => v.approvalStatus === "approved").length}
          color="bg-green-50 border-green-100"
        />
        <StatCard
          icon={<Clock className="w-5 h-5 text-yellow-605" />}
          label="Pending Review"
          value={vehicles.filter(v => v.approvalStatus === "pending").length}
          color="bg-yellow-50 border-yellow-100"
        />
        <StatCard
          icon={<XCircle className="w-5 h-5 text-red-600" />}
          label="Rejected Requests"
          value={vehicles.filter(v => v.approvalStatus === "rejected").length}
          color="bg-red-50 border-red-100"
        />
      </div>

      {vehicles.length === 0 ? (
        <div className="text-center py-16 bg-white border rounded-2xl shadow-sm space-y-3">
          <Truck className="w-14 h-14 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-900">No Vehicles Registered</h3>
          <p className="text-slate-500 text-xs max-w-xs mx-auto">
            You haven't registered any vehicles yet. Click Register New Vehicle above to register.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {vehicles.map((vehicle) => {
            const isApproved = vehicle.approvalStatus === "approved";
            return (
              <div
                key={vehicle._id}
                className={`bg-white border rounded-2xl overflow-hidden shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between ${
                  vehicle.status === "available"
                    ? "border-t-4 border-t-green-500"
                    : vehicle.status === "in_use"
                      ? "border-t-4 border-t-blue-500"
                      : "border-t-4 border-t-slate-300"
                }`}
              >
                {/* Image Section */}
                <div className="h-48 bg-slate-100 relative overflow-hidden border-b flex items-center justify-center">
                  {vehicle.images && vehicle.images.length > 0 ? (
                    <img
                      src={vehicle.images[0]}
                      alt="Vehicle"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-slate-400 flex flex-col items-center">
                      <Truck className="w-12 h-12 mb-1" />
                      <span className="text-[10px] font-bold uppercase tracking-wider">No Photo Uploaded</span>
                    </div>
                  )}
                  <div className="absolute top-3 right-3 flex flex-col gap-1.5 items-end">
                    {getStatusBadge(vehicle.status)}
                    {getApprovalBadge(vehicle.approvalStatus)}
                  </div>
                </div>

                {/* Details Section */}
                <div className="p-5 flex-1 space-y-4">
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-base leading-tight">
                      {vehicle.manufacturer} {vehicle.model}
                    </h3>
                    <div className="flex gap-2 items-center mt-1.5 text-xs font-semibold text-slate-500">
                      <span className="font-mono bg-slate-100 text-slate-800 px-2 py-0.5 rounded border">
                        {vehicle.plateNumber}
                      </span>
                      <span>•</span>
                      <span className="capitalize">{vehicle.type}</span>
                    </div>
                  </div>

                  {/* Attributes Grid */}
                  <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50/50 p-3.5 rounded-xl border border-slate-100">
                    <div>
                      <p className="text-[9px] font-bold text-slate-400 uppercase">Year</p>
                      <p className="font-bold text-slate-800 mt-0.5">{vehicle.year}</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-bold text-slate-400 uppercase">Weight Capacity</p>
                      <p className="font-bold text-slate-800 mt-0.5">{vehicle.capacity?.weight} {vehicle.capacity?.unit}</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-bold text-slate-400 uppercase">Fuel Type</p>
                      <p className="font-bold text-slate-800 mt-0.5 capitalize">{vehicle.fuelType || "Diesel"}</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-bold text-slate-400 uppercase">Color</p>
                      <p className="font-bold text-slate-800 mt-0.5 capitalize">{vehicle.color || "N/A"}</p>
                    </div>
                  </div>

                  {/* Rejection alert */}
                  {vehicle.approvalStatus === "rejected" && vehicle.rejectionReason && (
                    <div className="bg-red-50 border border-red-200 p-3.5 rounded-xl flex gap-2">
                      <ShieldAlert className="w-4.5 h-4.5 text-red-650 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-[10px] font-bold text-red-800 uppercase tracking-wide">Registration Rejected</p>
                        <p className="text-xs text-red-700 mt-0.5 font-medium">{vehicle.rejectionReason}</p>
                      </div>
                    </div>
                  )}

                  {/* Active Shipment assignment widget */}
                  {vehicle.assignedCustomer && (
                    <div className="bg-green-50 border border-green-200 p-4 rounded-xl text-xs space-y-3 shadow-inner">
                      <div>
                        <p className="text-[10px] font-bold text-green-800 uppercase tracking-wider mb-1">
                          Current Assignment:
                        </p>
                        <p className="font-extrabold text-slate-850 text-sm">
                          Delivering: {vehicle.assignedItemType || "Electronics"}
                        </p>
                      </div>

                      {vehicle.assignedCustomer.userId && (
                        <div className="pt-2 border-t border-green-250/30 space-y-2">
                          <p className="text-[9px] font-bold text-slate-400 uppercase">Customer Details</p>
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full overflow-hidden border bg-white flex items-center justify-center shrink-0">
                              {vehicle.assignedCustomer.userId.profileImage ? (
                                <img src={vehicle.assignedCustomer.userId.profileImage} alt={vehicle.assignedCustomer.userId.name} className="w-full h-full object-cover" />
                              ) : (
                                <User className="w-3.5 h-3.5 text-green-700" />
                              )}
                            </div>
                            <div>
                              <p className="font-bold text-slate-800 leading-tight">{vehicle.assignedCustomer.userId.name}</p>
                              <p className="text-[9px] text-slate-400">{vehicle.assignedCustomer.companyName || "Private Client"}</p>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-600 pt-1 font-semibold">
                            <div>
                              <p className="text-[8px] font-bold text-slate-400 uppercase">Phone</p>
                              <p className="text-slate-700">{vehicle.assignedCustomer.userId.phone || "N/A"}</p>
                            </div>
                            <div>
                              <p className="text-[8px] font-bold text-slate-400 uppercase">Email</p>
                              <p className="text-slate-700 truncate">{vehicle.assignedCustomer.userId.email || "N/A"}</p>
                            </div>
                          </div>
                        </div>
                      )}

                      {vehicle.assignedAt && (
                        <div className="pt-2 border-t border-green-200/50 flex justify-between text-[10px] text-slate-500 font-semibold">
                          <span>Assigned Date:</span>
                          <span className="text-slate-800 font-bold">
                            {new Date(vehicle.assignedAt).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Footer specs details trigger */}
                <div className="p-5 bg-slate-50 border-t flex justify-between items-center">
                  <div className="text-[10px] text-slate-400 font-semibold">
                    Added: {new Date(vehicle.createdAt).toLocaleDateString()}
                  </div>
                  <button
                    onClick={() => setSelectedVehicle(vehicle)}
                    className="px-4 py-2 bg-green-700 hover:bg-green-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md"
                  >
                    <Eye className="w-4 h-4" />
                    View Specifications
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Vehicle Specification Details Modal Overlay */}
      {selectedVehicle && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full border overflow-hidden shadow-2xl animate-scale-up max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-slate-50 border-b flex justify-between items-center">
              <div>
                <h3 className="text-lg font-extrabold text-slate-900">
                  {selectedVehicle.manufacturer} {selectedVehicle.model} Specifications
                </h3>
                <p className="text-xs font-mono text-slate-500 mt-1">Plate Number: {selectedVehicle.plateNumber}</p>
              </div>
              <button
                onClick={() => setSelectedVehicle(null)}
                className="p-1.5 rounded-full hover:bg-slate-200 text-slate-500 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6">
              {/* Images Gallery */}
              {selectedVehicle.images && selectedVehicle.images.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Vehicle Photos</p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {selectedVehicle.images.map((img, index) => (
                      <div key={index} className="h-24 rounded-xl border overflow-hidden bg-slate-100">
                        <img src={img} alt={`Vehicle doc ${index}`} className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Complete Specifications Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 border-t pt-4 text-xs">
                <div>
                  <p className="font-bold text-slate-400 uppercase">Manufacturer</p>
                  <p className="font-semibold text-slate-800 mt-1">{selectedVehicle.manufacturer}</p>
                </div>
                <div>
                  <p className="font-bold text-slate-400 uppercase">Model & Year</p>
                  <p className="font-semibold text-slate-800 mt-1">{selectedVehicle.model} ({selectedVehicle.year})</p>
                </div>
                <div>
                  <p className="font-bold text-slate-400 uppercase">Vehicle Type</p>
                  <p className="font-semibold text-slate-800 mt-1 capitalize">{selectedVehicle.type}</p>
                </div>
                <div>
                  <p className="font-bold text-slate-400 uppercase">Cargo Weight Limit</p>
                  <p className="font-semibold text-slate-800 mt-1">
                    {selectedVehicle.capacity?.weight} {selectedVehicle.capacity?.unit}
                  </p>
                </div>
                <div>
                  <p className="font-bold text-slate-400 uppercase">Fuel Type</p>
                  <p className="font-semibold text-slate-805 mt-1 capitalize">{selectedVehicle.fuelType || "Diesel"}</p>
                </div>
                <div>
                  <p className="font-bold text-slate-400 uppercase">Approval Date</p>
                  <p className="font-semibold text-slate-805 mt-1">
                    {selectedVehicle.approvalDate ? new Date(selectedVehicle.approvalDate).toLocaleDateString() : "N/A"}
                  </p>
                </div>
              </div>

              {/* Uploaded Documents List */}
              <div className="border-t pt-4 space-y-3">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Verification Papers & Documents</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  {selectedVehicle.registration?.document && (
                    <a
                      href={selectedVehicle.registration.document}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 p-3 bg-slate-50 hover:bg-slate-100 border rounded-xl font-bold text-slate-700 transition"
                    >
                      <FileText className="w-4 h-4 text-green-700 shrink-0" />
                      <span>Registration Certificate</span>
                    </a>
                  )}

                  {selectedVehicle.insurance?.document && (
                    <a
                      href={selectedVehicle.insurance.document}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 p-3 bg-slate-50 hover:bg-slate-100 border rounded-xl font-bold text-slate-700 transition"
                    >
                      <FileText className="w-4 h-4 text-green-700 shrink-0" />
                      <span>Insurance Policy Paper</span>
                    </a>
                  )}

                  {selectedVehicle.inspectionDocument && (
                    <a
                      href={selectedVehicle.inspectionDocument}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 p-3 bg-slate-50 hover:bg-slate-100 border rounded-xl font-bold text-slate-700 transition"
                    >
                      <FileText className="w-4 h-4 text-green-700 shrink-0" />
                      <span>Inspection Document Certificate</span>
                    </a>
                  )}
                </div>
              </div>

              {/* Dates and Meta Details */}
              <div className="border-t pt-4 text-xs font-medium text-slate-500 space-y-1 bg-slate-50/50 p-3 rounded-xl border">
                <div className="flex justify-between">
                  <span>Registered on day:</span>
                  <span className="font-bold text-slate-800">
                    {new Date(selectedVehicle.createdAt).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Insurance Expiry:</span>
                  <span className="font-bold text-slate-800">
                    {selectedVehicle.insurance?.expiryDate ? new Date(selectedVehicle.insurance.expiryDate).toLocaleDateString() : "N/A"}
                  </span>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-slate-50 border-t flex justify-end">
              <button
                onClick={() => setSelectedVehicle(null)}
                className="px-5 py-2.5 border rounded-xl font-bold text-slate-700 hover:bg-slate-200 transition text-xs"
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
    <div className={`bg-white border p-5 rounded-2xl flex items-center justify-between shadow-xs`}>
      <div className="space-y-1">
        <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">{label}</p>
        <p className="text-2xl font-extrabold text-slate-905">{value}</p>
      </div>
      <div className={`p-3.5 rounded-xl border ${color}`}>
        {icon}
      </div>
    </div>
  );
};

export default MyVehicles;
export { MyVehicles };

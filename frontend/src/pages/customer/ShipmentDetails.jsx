import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { shipmentService } from "../../services/shipmentService";
import {
  MapPin,
  Calendar,
  Clock,
  Truck,
  Package,
  ArrowLeft,
  User,
  Phone,
  Eye,
  TrendingUp,
  Mail,
  ShieldCheck,
} from "lucide-react";
import { motion } from "framer-motion";
import toast, { Toaster } from "react-hot-toast";

const ShipmentDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [shipment, setShipment] = useState(null);
  const [loading, setLoading] = useState(true);

  // Set up 5-second polling interval
  useEffect(() => {
    fetchShipmentDetails(true);
    const interval = setInterval(() => {
      fetchShipmentDetails(false);
    }, 5000);

    return () => clearInterval(interval);
  }, [id]);

  const fetchShipmentDetails = async (showLoader = false) => {
    try {
      if (showLoader) setLoading(true);
      const res = await shipmentService.getShipmentById(id);
      if (res && res.data) {
        setShipment(res.data);
      }
    } catch (error) {
      console.error(error);
      if (showLoader) toast.error("Failed to load shipment details");
    } finally {
      if (showLoader) setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: "bg-yellow-100 text-yellow-800 border-yellow-255",
      approved: "bg-blue-100 text-blue-800 border-blue-255",
      assigned: "bg-indigo-100 text-indigo-800 border-indigo-255",
      picked_up: "bg-purple-100 text-purple-800 border-purple-200",
      in_transit: "bg-sky-100 text-sky-800 border-sky-255",
      delivered: "bg-green-100 text-green-800 border-green-255",
      completed: "bg-slate-100 text-slate-800 border-slate-255",
      cancelled: "bg-red-105 text-red-800 border-red-255",
    };
    return colors[status] || "bg-slate-100 text-slate-800 border-slate-255";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="w-10 h-10 border-2 border-t-transparent border-purple-700 rounded-full animate-spin" />
      </div>
    );
  }

  if (!shipment) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 space-y-4">
        <p className="text-slate-500 text-lg">Shipment details could not be found.</p>
        <button
          onClick={() => navigate("/customer/my-bookings")}
          className="px-5 py-2.5 bg-purple-700 hover:bg-purple-700 text-white rounded-xl font-bold transition text-xs shadow-md"
        >
          Go Back to Bookings
        </button>
      </div>
    );
  }

  const driver = shipment.driverId;
  const vehicle = shipment.vehicleId;

  return (
    <div className="min-h-screen bg-slate-50 p-6 space-y-6 max-w-5xl mx-auto">
      <Toaster position="top-right" />

      {/* Back navigation */}
      <button
        onClick={() => navigate("/customer/my-bookings")}
        className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-purple-600 transition"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Bookings
      </button>

      {/* Title block */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Shipment Details</h1>
          <p className="text-slate-500 mt-1 font-mono text-xs">Tracking #: {shipment.shipmentNumber || "Pending generation"}</p>
        </div>

        <div className="flex items-center gap-3">
          <span className={`px-4 py-1.5 rounded-full text-xs font-bold border capitalize ${getStatusColor(shipment.status)}`}>
            {shipment.status.replace(/_/g, " ")}
          </span>
          {(shipment.status === "assigned" || shipment.status === "picked_up" || shipment.status === "in_transit") && (
            <Link
              to={`/customer/track-shipment?id=${shipment._id}`}
              className="flex items-center gap-1.5 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl shadow-md transition-all shadow-purple-550/20"
            >
              <TrendingUp className="w-4 h-4" />
              Track Live Map
            </Link>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Side details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Route Section */}
          <div className="bg-white rounded-2xl border border-gray-250 p-6 shadow-sm space-y-5">
            <h3 className="text-sm font-bold text-slate-900 border-b pb-3">Route & Location Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Pickup Point</p>
                <div className="flex gap-2.5">
                  <MapPin className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-slate-800 text-sm">{shipment.pickupLocation?.city}</p>
                    <p className="text-xs text-slate-550 mt-1">{shipment.pickupLocation?.address}</p>
                    {shipment.pickupLocation?.contactPerson && (
                      <div className="mt-2 text-xs bg-slate-50 p-2 rounded-lg border text-slate-600 space-y-0.5">
                        <p className="font-semibold text-slate-700">Contact: {shipment.pickupLocation.contactPerson.name}</p>
                        <p>{shipment.pickupLocation.contactPerson.phone}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Destination Point</p>
                <div className="flex gap-2.5">
                  <MapPin className="w-5 h-5 text-red-550 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-slate-800 text-sm">{shipment.destination?.city}</p>
                    <p className="text-xs text-slate-555 mt-1">{shipment.destination?.address}</p>
                    {shipment.destination?.contactPerson && (
                      <div className="mt-2 text-xs bg-slate-50 p-2 rounded-lg border text-slate-600 space-y-0.5">
                        <p className="font-semibold text-slate-700">Contact: {shipment.destination.contactPerson.name}</p>
                        <p>{shipment.destination.contactPerson.phone}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Cargo Section */}
          <div className="bg-white rounded-2xl border border-gray-250 p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 border-b pb-3">Cargo Specifications</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-slate-400 font-bold uppercase">Cargo Type</p>
                <p className="font-bold text-slate-800 text-sm mt-0.5">{shipment.cargoDetails?.type || "N/A"}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 font-bold uppercase">Weight</p>
                <p className="font-bold text-slate-800 text-sm mt-0.5">
                  {shipment.cargoDetails?.weight} {shipment.cargoDetails?.unit}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-400 font-bold uppercase">Quantity</p>
                <p className="font-bold text-slate-800 text-sm mt-0.5">{shipment.cargoDetails?.quantity || 1}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 font-bold uppercase">Total Bill</p>
                <p className="font-extrabold text-purple-700 text-sm mt-0.5">
                  {shipment.pricing?.totalAmount?.toLocaleString()} {shipment.pricing?.currency || "PKR"}
                </p>
              </div>
            </div>

            {shipment.notes && (
              <div className="bg-slate-50 p-4 border rounded-xl mt-4">
                <p className="text-xs font-bold text-slate-400 uppercase">Special Instructions</p>
                <p className="text-xs italic text-slate-600 mt-1">{shipment.notes}</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Side details: Assigned Crew */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-gray-250 p-6 shadow-sm space-y-6">
            <h3 className="text-sm font-bold text-slate-900 border-b pb-3">Assigned Delivery Crew</h3>

            {driver ? (
              <div className="space-y-5">
                {/* Driver card */}
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full overflow-hidden border bg-purple-100 flex items-center justify-center shrink-0">
                    {driver.userId?.profileImage ? (
                      <img src={driver.userId.profileImage} alt={driver.fullName} className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-6 h-6 text-purple-700" />
                    )}
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 font-bold uppercase">Assigned Driver</p>
                    <p className="font-bold text-slate-900 text-sm mt-0.5">{driver.fullName}</p>
                    <div className="flex items-center gap-1.5 text-slate-550 text-xs mt-1">
                      <Phone className="w-3.5 h-3.5 shrink-0 text-purple-700" />
                      <span>{driver.userId?.phone || driver.phone || "No phone registered"}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-550 text-xs mt-1">
                      <Mail className="w-3.5 h-3.5 shrink-0 text-purple-700" />
                      <span>{driver.userId?.email || "No email registered"}</span>
                    </div>
                  </div>
                </div>

                {/* License Details */}
                {driver.licenseNumber && (
                  <div className="flex items-center gap-1.5 bg-slate-50 border p-2 rounded-lg text-xs text-slate-600">
                    <ShieldCheck className="w-4 h-4 text-purple-600" />
                    <span>DL: {driver.licenseNumber}</span>
                  </div>
                )}

                {/* Vehicle card */}
                {vehicle ? (
                  <div className="border-t pt-4 space-y-3">
                    <p className="text-xs text-slate-400 font-bold uppercase">Assigned Vehicle</p>
                    <div className="flex gap-3 bg-slate-50 p-3 rounded-xl border">
                      <Truck className="w-5 h-5 text-purple-600 shrink-0 mt-0.5" />
                      <div className="text-xs space-y-1 text-slate-600">
                        <p className="font-bold text-slate-800">{vehicle.manufacturer} {vehicle.model}</p>
                        <p>Plate #: <span className="font-semibold text-slate-800">{vehicle.plateNumber}</span></p>
                        <p className="capitalize">Type: {vehicle.type}</p>
                        <p className="capitalize">Color: {vehicle.color || "N/A"}</p>
                        <p>Capacity: {vehicle.capacity?.weight} {vehicle.capacity?.unit}</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic border-t pt-4">No vehicle details loaded.</p>
                )}

                {/* Estimated Delivery Dates */}
                <div className="border-t pt-4 space-y-3">
                  <p className="text-xs text-slate-400 font-bold uppercase">Estimated Timing</p>
                  <div className="text-xs space-y-2 text-slate-600 font-medium">
                    <div className="flex justify-between">
                      <span>Scheduled Pickup:</span>
                      <span className="font-semibold text-slate-800">
                        {new Date(shipment.scheduledPickupDate).toLocaleDateString()}
                      </span>
                    </div>
                    {shipment.estimatedDeliveryDate && (
                      <div className="flex justify-between">
                        <span>Estimated Delivery:</span>
                        <span className="font-semibold text-slate-800">
                          {new Date(shipment.estimatedDeliveryDate).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-10 text-gray-400">
                <Truck className="mx-auto w-10 h-10 text-gray-300 mb-2" />
                <p className="text-xs font-semibold">Your shipment is pending approval and crew assignment.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShipmentDetails;

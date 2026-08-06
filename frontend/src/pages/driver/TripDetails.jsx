import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  MapPin,
  Calendar,
  Clock,
  Truck,
  Package,
  ArrowLeft,
  Navigation,
  User,
  Phone,
  CheckCircle,
  FileText,
  Mail,
  Shield,
  TrendingUp,
} from "lucide-react";
import { tripService } from "../../services/tripService";
import toast, { Toaster } from "react-hot-toast";

const TripDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [trip, setTrip] = useState(null);
  const [loading, setLoading] = useState(true);

  // Set up 5-second polling interval
  useEffect(() => {
    fetchTripDetails(true);
    const interval = setInterval(() => {
      fetchTripDetails(false);
    }, 5000);

    return () => clearInterval(interval);
  }, [id]);

  const fetchTripDetails = async (showLoader = false) => {
    try {
      if (showLoader) setLoading(true);
      const res = await tripService.getTripById(id);
      if (res && res.data) {
        setTrip(res.data);
      }
    } catch (error) {
      console.error(error);
      if (showLoader) toast.error("Failed to load trip details");
    } finally {
      if (showLoader) setLoading(false);
    }
  };

  const handleUpdateStatus = async (newStatus) => {
    try {
      await tripService.updateTripStatus(id, { status: newStatus });
      toast.success(`Trip status updated to "${newStatus.replace(/_/g, " ")}"!`);
      fetchTripDetails(false);
    } catch (error) {
      toast.error("Failed to update status");
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
      on_the_way: "bg-blue-100 text-blue-800 border-blue-200",
      arrived_at_pickup: "bg-teal-100 text-teal-800 border-teal-200",
      picked_up: "bg-purple-100 text-purple-800 border-purple-200",
      in_transit: "bg-sky-100 text-sky-850 border-sky-200",
      arrived_at_destination: "bg-orange-100 text-orange-850 border-orange-200",
      completed: "bg-green-100 text-green-800 border-green-200",
      cancelled: "bg-red-100 text-red-800 border-red-200",
    };
    return colors[status] || "bg-yellow-100 text-yellow-800 border-yellow-200";
  };

  if (loading && !trip) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="w-10 h-10 border-2 border-t-transparent border-green-700 rounded-full animate-spin" />
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 space-y-4">
        <p className="text-slate-500 text-lg">Trip details could not be found.</p>
        <button
          onClick={() => navigate("/driver/my-trips")}
          className="px-5 py-2.5 bg-green-700 hover:bg-green-800 text-white rounded-xl font-bold transition text-xs shadow-md"
        >
          Back to My Trips
        </button>
      </div>
    );
  }

  const shipment = trip.shipmentId;
  const customer = shipment?.customerId;
  const customerUser = customer?.userId;

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto min-h-screen bg-slate-50">
      <Toaster position="top-right" />

      <button
        onClick={() => navigate("/driver/my-trips")}
        className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-green-700 transition"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to My Trips
      </button>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Trip Details</h1>
          <p className="text-xs font-mono text-slate-500 mt-1">Trip ID: #{trip.tripNumber || trip._id}</p>
        </div>
        <span
          className={`px-4 py-1.5 rounded-full text-xs font-bold border capitalize ${getStatusColor(trip.status)}`}
        >
          {trip.status.replace(/_/g, " ")}
        </span>
      </div>

      {/* Interactive Status Progression Card */}
      <div className="bg-white rounded-2xl border p-6 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-slate-900">Trip Stage Controller</h3>
        <p className="text-xs text-slate-550">Progress the shipment status sequentially through the stages below:</p>
        
        <div className="flex flex-wrap gap-3 pt-2">
          {trip.status === "pending" && (
            <button
              onClick={() => handleUpdateStatus("on_the_way")}
              className="px-5 py-3 bg-green-700 hover:bg-green-800 text-white font-bold rounded-xl transition text-xs shadow-md"
            >
              Start Trip: On the Way to Pickup
            </button>
          )}

          {trip.status === "on_the_way" && (
            <button
              onClick={() => handleUpdateStatus("arrived_at_pickup")}
              className="px-5 py-3 bg-green-700 hover:bg-green-800 text-white font-bold rounded-xl transition text-xs shadow-md"
            >
              Mark: Arrived at Pickup
            </button>
          )}

          {trip.status === "arrived_at_pickup" && (
            <button
              onClick={() => handleUpdateStatus("picked_up")}
              className="px-5 py-3 bg-green-700 hover:bg-green-800 text-white font-bold rounded-xl transition text-xs shadow-md"
            >
              Confirm: Cargo Picked Up
            </button>
          )}

          {trip.status === "picked_up" && (
            <button
              onClick={() => handleUpdateStatus("in_transit")}
              className="px-5 py-3 bg-green-700 hover:bg-green-800 text-white font-bold rounded-xl transition text-xs shadow-md"
            >
              Start: In Transit Route
            </button>
          )}

          {trip.status === "in_transit" && (
            <div className="flex gap-3 w-full sm:w-auto">
              <button
                onClick={() => handleUpdateStatus("arrived_at_destination")}
                className="px-5 py-3 bg-green-700 hover:bg-green-800 text-white font-bold rounded-xl transition text-xs shadow-md"
              >
                Mark: Arrived at Destination
              </button>
              <button
                onClick={() => navigate(`/driver/update-status/${trip._id}`)}
                className="px-5 py-3 bg-blue-700 hover:bg-blue-800 text-white font-bold rounded-xl transition text-xs shadow-md"
              >
                Update GPS Coordinates
              </button>
            </div>
          )}

          {trip.status === "arrived_at_destination" && (
            <button
              onClick={() => handleUpdateStatus("completed")}
              className="px-5 py-3 bg-green-700 hover:bg-green-800 text-white font-bold rounded-xl transition text-xs shadow-md"
            >
              Confirm: Delivered & Completed
            </button>
          )}

          {trip.status === "completed" && (
            <div className="flex items-center gap-2 bg-green-50 text-green-800 border border-green-200 px-4 py-3 rounded-xl text-xs font-semibold">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span>This trip is successfully completed and delivered!</span>
            </div>
          )}
        </div>
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Primary Details Panel */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Complete Customer details - Presented in clean card layout as requested */}
          <div className="bg-white rounded-2xl border p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 border-b pb-3">Client Contact Information</h3>
            {customerUser ? (
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-green-100 bg-green-50 flex items-center justify-center shrink-0">
                    {customerUser.profileImage ? (
                      <img src={customerUser.profileImage} alt={customerUser.name} className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-7 h-7 text-green-700" />
                    )}
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Customer Owner</p>
                    <p className="font-extrabold text-slate-900 text-base">{customerUser.name}</p>
                    <p className="text-xs text-slate-500 font-medium">{customer.companyName || "Private Customer"}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t text-xs">
                  <div className="flex items-center gap-2.5">
                    <Phone className="w-4 h-4 text-green-700 shrink-0" />
                    <div>
                      <p className="text-[9px] font-bold text-slate-400 uppercase">Phone Number</p>
                      <p className="font-bold text-slate-700">{customerUser.phone || "No phone registered"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Mail className="w-4 h-4 text-green-700 shrink-0" />
                    <div>
                      <p className="text-[9px] font-bold text-slate-400 uppercase">Email Address</p>
                      <p className="font-bold text-slate-700">{customerUser.email || "No email registered"}</p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-6 text-gray-400">
                <User className="mx-auto w-8 h-8 text-gray-300 mb-1" />
                <p className="text-xs font-semibold">Customer info unavailable.</p>
              </div>
            )}
          </div>

          {/* Cargo Details Card */}
          {shipment && (
            <div className="bg-white rounded-2xl p-6 border shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-900 border-b pb-3">Cargo Details</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <InfoItem
                  icon={<Package className="w-5 h-5 text-green-700 shrink-0" />}
                  label="Cargo Type"
                  value={shipment.cargoDetails?.type || "General Goods"}
                />
                <InfoItem
                  icon={<FileText className="w-5 h-5 text-green-700 shrink-0" />}
                  label="Weight & Capacity"
                  value={`${shipment.cargoDetails?.weight} ${shipment.cargoDetails?.unit}`}
                />
                <InfoItem
                  icon={<Package className="w-5 h-5 text-green-700 shrink-0" />}
                  label="Quantity"
                  value={shipment.cargoDetails?.quantity || 1}
                />
              </div>

              {shipment.notes && (
                <div className="p-4 bg-slate-50 border rounded-xl mt-2">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Special Instructions</p>
                  <p className="text-xs italic mt-1 text-slate-700 font-medium">"{shipment.notes}"</p>
                </div>
              )}
            </div>
          )}

          {/* Route Card */}
          <div className="bg-white rounded-2xl p-6 border shadow-sm space-y-5">
            <h3 className="text-sm font-bold text-slate-900 border-b pb-3">Route Addresses</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <InfoItem
                icon={<MapPin className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />}
                label="Pickup Address"
                value={
                  <div>
                    <p className="font-bold text-slate-800 text-sm">{shipment?.pickupLocation?.city}</p>
                    <p className="text-xs text-slate-550 mt-1 font-medium">{shipment?.pickupLocation?.address}</p>
                  </div>
                }
              />
              <InfoItem
                icon={<MapPin className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />}
                label="Delivery Address"
                value={
                  <div>
                    <p className="font-bold text-slate-800 text-sm">{shipment?.destination?.city}</p>
                    <p className="text-xs text-slate-550 mt-1 font-medium">{shipment?.destination?.address}</p>
                  </div>
                }
              />
            </div>
          </div>

        </div>

        {/* Right Sidebar Details */}
        <div className="space-y-6">
          
          {/* Scheduling Dates */}
          <div className="bg-white rounded-2xl p-6 border shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 border-b pb-3">Scheduled Dates</h3>
            <div className="space-y-4 text-xs font-semibold text-slate-600">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-green-700" />
                <div className="flex-1">
                  <p className="text-[9px] font-bold text-slate-400 uppercase">Pickup Date</p>
                  <p className="text-slate-800 mt-0.5">
                    {shipment?.scheduledPickupDate ? new Date(shipment.scheduledPickupDate).toLocaleString() : "Pending"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-green-700" />
                <div className="flex-1">
                  <p className="text-[9px] font-bold text-slate-400 uppercase">Delivery Date</p>
                  <p className="text-slate-800 mt-0.5">
                    {shipment?.estimatedDeliveryDate ? new Date(shipment.estimatedDeliveryDate).toLocaleString() : "Pending"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Vehicle specs */}
          {trip.vehicleId && (
            <div className="bg-white rounded-2xl p-6 border shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-900 border-b pb-3">Vehicle Details</h3>
              <div className="flex items-start gap-3 bg-slate-50 p-3.5 border rounded-xl">
                <Truck className="w-5 h-5 text-green-700 shrink-0 mt-0.5" />
                <div className="text-xs space-y-1.5 text-slate-600">
                  <p className="font-bold text-slate-900">{trip.vehicleId.manufacturer} {trip.vehicleId.model}</p>
                  <p>Plate #: <span className="font-semibold text-slate-805">{trip.vehicleId.plateNumber}</span></p>
                  <p className="capitalize">Type: {trip.vehicleId.type}</p>
                </div>
              </div>
            </div>
          )}

          {/* Timeline details */}
          <div className="bg-white rounded-2xl p-6 border shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 border-b pb-3">Trip Progress</h3>
            <div className="space-y-3 text-xs font-semibold text-slate-600">
              <div className="flex justify-between">
                <span>Start Time:</span>
                <span className="font-bold text-slate-800">
                  {trip.startTime ? new Date(trip.startTime).toLocaleString() : "Not started"}
                </span>
              </div>
              <div className="flex justify-between">
                <span>End Time:</span>
                <span className="font-bold text-slate-800">
                  {trip.endTime ? new Date(trip.endTime).toLocaleString() : "Not completed"}
                </span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

const InfoItem = ({ icon, label, value }) => (
  <div className="flex items-start gap-3">
    <div className="mt-1 flex-shrink-0">{icon}</div>
    <div>
      <p className="text-xs text-slate-400 font-bold uppercase">{label}</p>
      <div className="font-bold text-slate-800 mt-1">{value}</div>
    </div>
  </div>
);

export default TripDetails;

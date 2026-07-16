import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  MapPin,
  Calendar,
  Clock,
  Truck,
  Package,
  ArrowLeft,
  Navigation,
} from "lucide-react";
import { tripService } from "../../services/tripService";
import toast from "react-hot-toast";

const TripDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [trip, setTrip] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTripDetails();
  }, [id]);

  const fetchTripDetails = async () => {
    try {
      const data = await tripService.getTripById(id);
      setTrip(data);
    } catch (error) {
      toast.error("Failed to load trip details");
    } finally {
      setLoading(false);
    }
  };

  const handleStartTrip = async () => {
    try {
      await tripService.updateTripStatus(id, { status: "in-progress" });
      toast.success("Trip started successfully");
      fetchTripDetails();
    } catch (error) {
      toast.error("Failed to start trip");
    }
  };

  const handleCompleteTrip = async () => {
    try {
      await tripService.updateTripStatus(id, { status: "completed" });
      toast.success("Trip completed successfully");
      fetchTripDetails();
    } catch (error) {
      toast.error("Failed to complete trip");
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: "bg-yellow-100 text-yellow-700 border-yellow-200",
      "in-progress": "bg-blue-100 text-blue-700 border-blue-200",
      completed: "bg-green-100 text-green-700 border-green-200",
      cancelled: "bg-red-100 text-red-700 border-red-200",
    };
    return colors[status] || colors.pending;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-16 h-16 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-slate-500 text-lg">Trip not found</p>
          <button
            onClick={() => navigate("/driver/my-trips")}
            className="mt-4 text-amber-600"
          >
            Go back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <button
        onClick={() => navigate("/driver/my-trips")}
        className="flex items-center gap-2 text-slate-600 hover:text-slate-900"
      >
        <ArrowLeft className="w-5 h-5" />
        Back to My Trips
      </button>

      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Trip Details</h1>
          <p className="text-slate-600 mt-1">Trip ID: #{trip._id.slice(-8)}</p>
        </div>
        <span
          className={`px-4 py-2 rounded-full text-sm font-semibold border ${getStatusColor(trip.status)}`}
        >
          {trip.status}
        </span>
      </div>

      {trip.status === "pending" && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
          <p className="text-amber-900 mb-4 font-medium">
            Ready to start this trip?
          </p>
          <button
            onClick={handleStartTrip}
            className="px-6 py-3 bg-amber-500 text-white rounded-lg font-semibold hover:bg-amber-600 flex items-center gap-2"
          >
            <Navigation className="w-5 h-5" />
            Start Trip
          </button>
        </div>
      )}

      {trip.status === "in-progress" && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
          <p className="text-blue-900 mb-4 font-medium">Trip in progress</p>
          <div className="flex gap-3">
            <button
              onClick={handleCompleteTrip}
              className="px-6 py-3 bg-green-500 text-white rounded-lg font-semibold hover:bg-green-600"
            >
              Complete Trip
            </button>
            <button
              onClick={() => navigate(`/driver/update-status/${trip._id}`)}
              className="px-6 py-3 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600"
            >
              Update Status
            </button>
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
          <h3 className="text-xl font-bold text-slate-900 mb-4">
            Route Information
          </h3>
          <div className="space-y-4">
            <InfoItem
              icon={<MapPin className="w-5 h-5 text-green-500" />}
              label="Start Location"
              value={trip.startLocation || "N/A"}
            />
            <InfoItem
              icon={<MapPin className="w-5 h-5 text-red-500" />}
              label="End Location"
              value={trip.endLocation || "N/A"}
            />
            <InfoItem
              icon={<Clock className="w-5 h-5 text-blue-500" />}
              label="Distance"
              value={`${trip.distance || "N/A"} km`}
            />
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
          <h3 className="text-xl font-bold text-slate-900 mb-4">
            Trip Timeline
          </h3>
          <div className="space-y-4">
            <InfoItem
              icon={<Calendar className="w-5 h-5 text-blue-500" />}
              label="Start Time"
              value={
                trip.startTime
                  ? new Date(trip.startTime).toLocaleString()
                  : "Not started"
              }
            />
            <InfoItem
              icon={<Calendar className="w-5 h-5 text-green-500" />}
              label="End Time"
              value={
                trip.endTime
                  ? new Date(trip.endTime).toLocaleString()
                  : "Not completed"
              }
            />
            <InfoItem
              icon={<Clock className="w-5 h-5 text-amber-500" />}
              label="Duration"
              value={trip.duration ? `${trip.duration} hours` : "N/A"}
            />
          </div>
        </div>

        {trip.vehicle && (
          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
            <h3 className="text-xl font-bold text-slate-900 mb-4">
              Vehicle Information
            </h3>
            <div className="space-y-4">
              <InfoItem
                icon={<Truck className="w-5 h-5 text-blue-500" />}
                label="Registration Number"
                value={trip.vehicle.registrationNumber}
              />
              <InfoItem
                icon={<Package className="w-5 h-5 text-amber-500" />}
                label="Type"
                value={trip.vehicle.type}
              />
            </div>
          </div>
        )}

        {trip.shipment && (
          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
            <h3 className="text-xl font-bold text-slate-900 mb-4">
              Shipment Information
            </h3>
            <div className="space-y-4">
              <InfoItem
                icon={<Package className="w-5 h-5 text-blue-500" />}
                label="Tracking Number"
                value={trip.shipment.trackingNumber}
              />
              <InfoItem
                icon={<Package className="w-5 h-5 text-amber-500" />}
                label="Weight"
                value={`${trip.shipment.cargoWeight || "N/A"} kg`}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const InfoItem = ({ icon, label, value }) => (
  <div className="flex items-start gap-3">
    <div className="mt-1 flex-shrink-0">{icon}</div>
    <div>
      <p className="text-sm text-slate-500">{label}</p>
      <p className="font-medium text-slate-900">{value}</p>
    </div>
  </div>
);

export default TripDetails;

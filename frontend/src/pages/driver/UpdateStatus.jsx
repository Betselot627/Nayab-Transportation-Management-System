import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { MapPin, Clock, AlertCircle, Save, ArrowLeft } from "lucide-react";
import { tripService } from "../../services/tripService";
import toast from "react-hot-toast";

const UpdateStatus = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [trip, setTrip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [updateData, setUpdateData] = useState({
    currentLocation: "",
    latitude: "",
    longitude: "",
    notes: "",
    estimatedArrival: "",
  });

  useEffect(() => {
    fetchTripDetails();
  }, [id]);

  const fetchTripDetails = async () => {
    try {
      const data = await tripService.getTripById(id);
      setTrip(data);
      if (data.currentLocation) {
        setUpdateData((prev) => ({
          ...prev,
          currentLocation: data.currentLocation,
          latitude: data.latitude || "",
          longitude: data.longitude || "",
        }));
      }
    } catch (error) {
      toast.error("Failed to load trip details");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setUpdateData({ ...updateData, [e.target.name]: e.target.value });
  };

  const handleUpdateLocation = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await tripService.updateLocation(id, {
        currentLocation: updateData.currentLocation,
        latitude: updateData.latitude,
        longitude: updateData.longitude,
        notes: updateData.notes,
        estimatedArrival: updateData.estimatedArrival,
      });
      toast.success("Location updated successfully");
      navigate(`/driver/trip-details/${id}`);
    } catch (error) {
      toast.error("Failed to update location");
    } finally {
      setSubmitting(false);
    }
  };

  const handleGetCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUpdateData((prev) => ({
            ...prev,
            latitude: position.coords.latitude.toString(),
            longitude: position.coords.longitude.toString(),
          }));
          toast.success("Location captured");
        },
        (error) => {
          toast.error("Failed to get location");
        },
      );
    } else {
      toast.error("Geolocation not supported");
    }
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
        onClick={() => navigate(`/driver/trip-details/${id}`)}
        className="flex items-center gap-2 text-slate-600 hover:text-slate-900"
      >
        <ArrowLeft className="w-5 h-5" />
        Back to Trip Details
      </button>

      <div>
        <h1 className="text-3xl font-bold text-slate-900">
          Update Trip Status
        </h1>
        <p className="text-slate-600 mt-1">Trip ID: #{trip._id.slice(-8)}</p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-blue-500 to-blue-600 p-6 rounded-xl text-white shadow-lg"
        >
          <MapPin className="w-8 h-8 mb-3" />
          <p className="text-blue-100 text-sm">Start Location</p>
          <p className="text-xl font-bold mt-1">
            {trip.startLocation || "N/A"}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-amber-500 to-amber-600 p-6 rounded-xl text-white shadow-lg"
        >
          <Clock className="w-8 h-8 mb-3" />
          <p className="text-amber-100 text-sm">Current Status</p>
          <p className="text-xl font-bold mt-1">{trip.status}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-green-500 to-green-600 p-6 rounded-xl text-white shadow-lg"
        >
          <MapPin className="w-8 h-8 mb-3" />
          <p className="text-green-100 text-sm">End Location</p>
          <p className="text-xl font-bold mt-1">{trip.endLocation || "N/A"}</p>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white rounded-xl p-8 shadow-sm border border-slate-200"
      >
        <h2 className="text-2xl font-bold text-slate-900 mb-6">
          Update Location
        </h2>
        <form onSubmit={handleUpdateLocation} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Current Location
            </label>
            <input
              type="text"
              name="currentLocation"
              value={updateData.currentLocation}
              onChange={handleChange}
              required
              placeholder="Enter current location"
              className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
            />
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Latitude
              </label>
              <input
                type="text"
                name="latitude"
                value={updateData.latitude}
                onChange={handleChange}
                placeholder="e.g., 40.7128"
                className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Longitude
              </label>
              <input
                type="text"
                name="longitude"
                value={updateData.longitude}
                onChange={handleChange}
                placeholder="e.g., -74.0060"
                className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
              />
            </div>
          </div>

          <button
            type="button"
            onClick={handleGetCurrentLocation}
            className="px-6 py-2 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition"
          >
            Use Current GPS Location
          </button>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Estimated Arrival Time
            </label>
            <input
              type="datetime-local"
              name="estimatedArrival"
              value={updateData.estimatedArrival}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Additional Notes
            </label>
            <textarea
              name="notes"
              value={updateData.notes}
              onChange={handleChange}
              rows={4}
              placeholder="Add any relevant information about the trip status..."
              className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none resize-none"
            />
          </div>

          <div className="flex gap-4">
            <button
              type="submit"
              disabled={submitting}
              className="px-8 py-3 bg-amber-500 text-white rounded-lg font-semibold hover:bg-amber-600 transition flex items-center gap-2 disabled:opacity-50"
            >
              <Save className="w-5 h-5" />
              {submitting ? "Saving..." : "Save Update"}
            </button>
            <button
              type="button"
              onClick={() => navigate(`/driver/trip-details/${id}`)}
              className="px-8 py-3 bg-slate-200 text-slate-700 rounded-lg font-semibold hover:bg-slate-300 transition"
            >
              Cancel
            </button>
          </div>
        </form>
      </motion.div>

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 flex items-start gap-4">
        <AlertCircle className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
        <div>
          <h4 className="font-semibold text-blue-900 mb-1">
            Update Guidelines
          </h4>
          <ul className="text-blue-800 text-sm space-y-1">
            <li>• Update your location regularly to keep customers informed</li>
            <li>• Provide accurate GPS coordinates for precise tracking</li>
            <li>• Add notes for any delays or important information</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default UpdateStatus;

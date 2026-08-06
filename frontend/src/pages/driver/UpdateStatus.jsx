import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { MapPin, Clock, AlertCircle, Save, ArrowLeft, Navigation } from "lucide-react";
import { tripService } from "../../services/tripService";
import toast, { Toaster } from "react-hot-toast";

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
      const res = await tripService.getTripById(id);
      if (res && res.data) {
        const data = res.data;
        setTrip(data);
        if (data.currentLocation) {
          setUpdateData((prev) => ({
            ...prev,
            currentLocation: data.currentLocation.address || "",
            latitude: data.currentLocation.coordinates?.[1] || "",
            longitude: data.currentLocation.coordinates?.[0] || "",
          }));
        }
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
        latitude: parseFloat(updateData.latitude) || 0,
        longitude: parseFloat(updateData.longitude) || 0,
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
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="w-10 h-10 border-2 border-t-transparent border-green-700 rounded-full animate-spin" />
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="text-center space-y-4">
          <p className="text-slate-500 text-lg">Trip not found</p>
          <button
            onClick={() => navigate("/driver/my-trips")}
            className="px-5 py-2.5 bg-green-700 hover:bg-green-800 text-white rounded-xl font-bold transition text-xs shadow-md"
          >
            Go back
          </button>
        </div>
      </div>
    );
  }

  const shipment = trip.shipmentId;

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto min-h-screen bg-slate-50">
      <Toaster position="top-right" />

      <button
        onClick={() => navigate(`/driver/trip-details/${id}`)}
        className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-green-700 transition"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Trip Details
      </button>

      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          Update Trip Status
        </h1>
        <p className="text-xs font-mono text-slate-550 mt-1">Trip ID: #{trip.tripNumber || trip._id}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border p-5 rounded-2xl flex items-center justify-between shadow-xs">
          <div>
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Pickup city</p>
            <p className="font-extrabold text-slate-900 mt-1">{shipment?.pickupLocation?.city || "N/A"}</p>
          </div>
          <div className="p-3 rounded-xl bg-green-50 text-green-700 border">
            <MapPin className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border p-5 rounded-2xl flex items-center justify-between shadow-xs">
          <div>
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Current Status</p>
            <p className="font-extrabold text-slate-900 mt-1 capitalize">{trip.status.replace(/_/g, " ")}</p>
          </div>
          <div className="p-3 rounded-xl bg-green-50 text-green-700 border">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border p-5 rounded-2xl flex items-center justify-between shadow-xs">
          <div>
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Destination city</p>
            <p className="font-extrabold text-slate-900 mt-1">{shipment?.destination?.city || "N/A"}</p>
          </div>
          <div className="p-3 rounded-xl bg-green-50 text-green-700 border">
            <MapPin className="w-5 h-5 text-red-500" />
          </div>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl p-8 shadow-sm border"
      >
        <h2 className="text-lg font-bold text-slate-900 border-b pb-4 mb-6">
          Update Location Coordinates
        </h2>
        <form onSubmit={handleUpdateLocation} className="space-y-6">
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">
              Current Location Address
            </label>
            <input
              type="text"
              name="currentLocation"
              value={updateData.currentLocation}
              onChange={handleChange}
              required
              placeholder="e.g. Highway 4, near Debre Zeit"
              className="w-full px-4 py-3 rounded-xl border border-slate-250 focus:ring-2 focus:ring-green-700/20 focus:border-green-700 focus:outline-none transition text-sm"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">
                Latitude
              </label>
              <input
                type="text"
                name="latitude"
                value={updateData.latitude}
                onChange={handleChange}
                placeholder="e.g., 8.9806"
                className="w-full px-4 py-3 rounded-xl border border-slate-250 focus:ring-2 focus:ring-green-700/20 focus:border-green-700 focus:outline-none transition text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">
                Longitude
              </label>
              <input
                type="text"
                name="longitude"
                value={updateData.longitude}
                onChange={handleChange}
                placeholder="e.g., 38.7578"
                className="w-full px-4 py-3 rounded-xl border border-slate-250 focus:ring-2 focus:ring-green-700/20 focus:border-green-700 focus:outline-none transition text-sm"
              />
            </div>
          </div>

          <button
            type="button"
            onClick={handleGetCurrentLocation}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-xs font-bold transition shadow-md"
          >
            <Navigation className="w-4 h-4" />
            Capture Browser Geolocation
          </button>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">
              Estimated Arrival Time
            </label>
            <input
              type="datetime-local"
              name="estimatedArrival"
              value={updateData.estimatedArrival}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-xl border border-slate-250 focus:ring-2 focus:ring-green-700/20 focus:border-green-700 focus:outline-none transition text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">
              Additional Notes / Status Remarks
            </label>
            <textarea
              name="notes"
              value={updateData.notes}
              onChange={handleChange}
              rows={4}
              placeholder="Add any relevant information about the run status..."
              className="w-full px-4 py-3 rounded-xl border border-slate-250 focus:ring-2 focus:ring-green-700/20 focus:border-green-700 focus:outline-none transition text-sm resize-none"
            />
          </div>

          <div className="flex gap-3 pt-4 border-t">
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-3 bg-green-700 hover:bg-green-800 text-white rounded-xl font-bold transition flex items-center gap-2 disabled:opacity-50 text-xs shadow-md"
            >
              <Save className="w-4 h-4" />
              {submitting ? "Saving..." : "Save Route Update"}
            </button>
            <button
              type="button"
              onClick={() => navigate(`/driver/trip-details/${id}`)}
              className="px-6 py-3 border rounded-xl font-bold text-slate-700 hover:bg-slate-50 transition text-xs"
            >
              Cancel
            </button>
          </div>
        </form>
      </motion.div>

      <div className="bg-green-50 border border-green-200 rounded-2xl p-5 flex items-start gap-4">
        <AlertCircle className="w-5 h-5 text-green-700 shrink-0 mt-0.5" />
        <div>
          <h4 className="font-bold text-green-805 text-sm mb-1">
            Update Guidelines
          </h4>
          <ul className="text-green-800 text-xs space-y-1 font-medium">
            <li>• Update your current status address regularly so customers can track you.</li>
            <li>• Use capturing geolocation to populate browser latitude and longitude points.</li>
            <li>• Add notes if you experience delays or checkpoints.</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default UpdateStatus;
export { UpdateStatus };

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Wrench,
  Plus,
  Calendar,
  CheckCircle,
  AlertCircle,
  X,
} from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";

const Maintenance = () => {
  const [maintenanceRecords, setMaintenanceRecords] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    vehicle: "",
    type: "routine",
    description: "",
    cost: "",
    scheduledDate: "",
    status: "scheduled",
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem("token");
      const [maintenanceRes, vehiclesRes] = await Promise.all([
        axios.get(`${import.meta.env.VITE_API_URL}/maintenance`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(`${import.meta.env.VITE_API_URL}/vehicles`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);
      setMaintenanceRecords(maintenanceRes.data);
      setVehicles(vehiclesRes.data);
    } catch (error) {
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      await axios.post(
        `${import.meta.env.VITE_API_URL}/maintenance`,
        formData,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      toast.success("Maintenance scheduled");
      setShowModal(false);
      setFormData({
        vehicle: "",
        type: "routine",
        description: "",
        cost: "",
        scheduledDate: "",
        status: "scheduled",
      });
      fetchData();
    } catch (error) {
      toast.error("Failed to schedule maintenance");
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      scheduled: "bg-blue-100 text-blue-700",
      "in-progress": "bg-yellow-100 text-yellow-700",
      completed: "bg-green-100 text-green-700",
      cancelled: "bg-red-100 text-red-700",
    };
    return colors[status] || colors.scheduled;
  };

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-16 h-16 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">
            Maintenance Management
          </h1>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="px-6 py-3 bg-amber-500 text-white rounded-lg font-semibold hover:bg-amber-600 flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Schedule Maintenance
        </button>
      </div>

      <div className="grid md:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-6 rounded-xl text-white">
          <Wrench className="w-8 h-8 mb-2" />
          <p className="text-sm">Total</p>
          <p className="text-3xl font-bold">{maintenanceRecords.length}</p>
        </div>
        <div className="bg-gradient-to-br from-amber-500 to-amber-600 p-6 rounded-xl text-white">
          <Calendar className="w-8 h-8 mb-2" />
          <p className="text-sm">Scheduled</p>
          <p className="text-3xl font-bold">
            {maintenanceRecords.filter((m) => m.status === "scheduled").length}
          </p>
        </div>
        <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 p-6 rounded-xl text-white">
          <AlertCircle className="w-8 h-8 mb-2" />
          <p className="text-sm">In Progress</p>
          <p className="text-3xl font-bold">
            {
              maintenanceRecords.filter((m) => m.status === "in-progress")
                .length
            }
          </p>
        </div>
        <div className="bg-gradient-to-br from-green-500 to-green-600 p-6 rounded-xl text-white">
          <CheckCircle className="w-8 h-8 mb-2" />
          <p className="text-sm">Completed</p>
          <p className="text-3xl font-bold">
            {maintenanceRecords.filter((m) => m.status === "completed").length}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                Vehicle
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                Cost
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {maintenanceRecords.map((record) => (
              <tr key={record._id} className="hover:bg-slate-50">
                <td className="px-6 py-4 text-sm text-slate-900">
                  {record.vehicle?.registrationNumber || "N/A"}
                </td>
                <td className="px-6 py-4 text-sm text-slate-900">
                  {record.type}
                </td>
                <td className="px-6 py-4 text-sm text-slate-600">
                  {new Date(record.scheduledDate).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 text-sm text-slate-900">
                  ${record.cost || 0}
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(record.status)}`}
                  >
                    {record.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-2xl p-8 max-w-2xl w-full"
          >
            <div className="flex justify-between items-start mb-6">
              <h2 className="text-2xl font-bold text-slate-900">
                Schedule Maintenance
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Vehicle
                  </label>
                  <select
                    name="vehicle"
                    value={formData.vehicle}
                    onChange={(e) =>
                      setFormData({ ...formData, vehicle: e.target.value })
                    }
                    required
                    className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-amber-500 outline-none"
                  >
                    <option value="">Select Vehicle</option>
                    {vehicles.map((v) => (
                      <option key={v._id} value={v._id}>
                        {v.registrationNumber}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Type
                  </label>
                  <select
                    name="type"
                    value={formData.type}
                    onChange={(e) =>
                      setFormData({ ...formData, type: e.target.value })
                    }
                    className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-amber-500 outline-none"
                  >
                    <option value="routine">Routine</option>
                    <option value="repair">Repair</option>
                    <option value="inspection">Inspection</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Scheduled Date
                  </label>
                  <input
                    type="date"
                    name="scheduledDate"
                    value={formData.scheduledDate}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        scheduledDate: e.target.value,
                      })
                    }
                    required
                    className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-amber-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Estimated Cost
                  </label>
                  <input
                    type="number"
                    name="cost"
                    value={formData.cost}
                    onChange={(e) =>
                      setFormData({ ...formData, cost: e.target.value })
                    }
                    placeholder="0.00"
                    className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-amber-500 outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  rows={3}
                  className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-amber-500 outline-none resize-none"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-amber-500 text-white py-3 rounded-lg font-semibold hover:bg-amber-600"
              >
                Schedule Maintenance
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default Maintenance;

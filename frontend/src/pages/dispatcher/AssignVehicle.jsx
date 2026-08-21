import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Truck, ShieldCheck, MapPin, RefreshCw, CircleCheckBig as CheckCircle2 } from "lucide-react";
import { vehicleService } from "../../services/vehicleService";
import { shipmentService } from "../../services/shipmentService";
import toast from "react-hot-toast";

const AssignVehicle = () => {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAvailableVehicles(false);
  }, []);

  const fetchAvailableVehicles = async (force = false) => {
    try {
      if (vehicles.length === 0) setLoading(true);
      const res = await vehicleService.getAllVehicles({ available: "true", limit: 50 }, { force, ttl: 20000 });
      setVehicles(res.data || []);
    } catch (err) {
      console.warn("Failed to load vehicles:", err.message);
      toast.error("Failed to load available vehicles");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 p-1">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Available Vehicle Fleet
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium text-sm">
            Inspect approved road-ready vehicles ready for shipment assignment.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchAvailableVehicles(true)}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-slate-700 dark:text-gray-300 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition shadow-sm"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
          <Link
            to="/dispatcher/assign-driver"
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow text-sm transition"
          >
            Dispatch Shipment
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading && vehicles.length === 0 ? (
          <div className="col-span-full text-center py-12 text-slate-400">Loading available vehicles...</div>
        ) : vehicles.length === 0 ? (
          <div className="col-span-full text-center py-12 text-slate-400">No available vehicles currently in fleet.</div>
        ) : (
          vehicles.map((v) => (
            <div
              key={v._id}
              className="bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-900 rounded-2xl p-6 shadow-sm hover:shadow-md transition space-y-4"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-base font-extrabold text-slate-900 dark:text-white">
                  {v.plateNumber}
                </span>
                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                  {v.status}
                </span>
              </div>

              <div className="space-y-1 text-xs text-slate-500 dark:text-slate-400">
                <div>Model: <span className="font-semibold text-slate-800 dark:text-slate-200">{v.manufacturer} {v.model} ({v.year || "N/A"})</span></div>
                <div>Capacity: <span className="font-semibold text-slate-800 dark:text-slate-200">{v.capacity?.weight} {v.capacity?.unit}</span></div>
                <div>Type: <span className="font-semibold text-slate-800 dark:text-slate-200 capitalize">{v.type || "Truck"}</span></div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-900 flex justify-end">
                <Link
                  to={`/dispatcher/assign-driver`}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-900 hover:bg-blue-600 hover:text-white text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl transition"
                >
                  Assign to Shipment
                </Link>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AssignVehicle;

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { vehicleService } from "../../services/vehicleService";
import Loading from "../../components/common/Loading";

const MyVehicles = () => {
  const navigate = useNavigate();
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchVehicles();
  }, []);

  const fetchVehicles = async () => {
    try {
      setLoading(true);
      const response = await vehicleService.getAllVehicles();
      setVehicles(response.data || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load vehicles");
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (approvalStatus) => {
    const statusConfig = {
      pending: {
        bg: "bg-yellow-100",
        text: "text-yellow-800",
        label: "Pending Approval",
      },
      approved: {
        bg: "bg-green-100",
        text: "text-green-800",
        label: "Approved",
      },
      rejected: { bg: "bg-red-100", text: "text-red-800", label: "Rejected" },
    };

    const config = statusConfig[approvalStatus] || statusConfig.pending;

    return (
      <span
        className={`px-3 py-1 rounded-full text-xs font-semibold ${config.bg} ${config.text}`}
      >
        {config.label}
      </span>
    );
  };

  const getAvailabilityBadge = (status) => {
    const statusConfig = {
      available: {
        bg: "bg-blue-100",
        text: "text-blue-800",
        label: "Available",
      },
      in_use: { bg: "bg-purple-100", text: "text-purple-800", label: "In Use" },
      maintenance: {
        bg: "bg-orange-100",
        text: "text-orange-800",
        label: "Maintenance",
      },
      inactive: { bg: "bg-gray-100", text: "text-gray-800", label: "Inactive" },
    };

    const config = statusConfig[status] || statusConfig.available;

    return (
      <span
        className={`px-3 py-1 rounded-full text-xs font-semibold ${config.bg} ${config.text}`}
      >
        {config.label}
      </span>
    );
  };

  if (loading) return <Loading />;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">My Vehicles</h1>
        <button
          onClick={() => navigate("/driver/register-vehicle")}
          className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 font-semibold transition-colors"
        >
          + Register New Vehicle
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      {vehicles.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <svg
            className="mx-auto h-16 w-16 text-gray-400 mb-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">
            No Vehicles Registered
          </h3>
          <p className="text-gray-500 mb-6">
            Register your first vehicle to start receiving assignments
          </p>
          <button
            onClick={() => navigate("/driver/register-vehicle")}
            className="bg-blue-600 text-white px-8 py-3 rounded-md hover:bg-blue-700 font-semibold transition-colors"
          >
            Register Vehicle
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {vehicles.map((vehicle) => (
            <div
              key={vehicle._id}
              className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
            >
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xl font-bold text-gray-800">
                    {vehicle.plateNumber}
                  </h3>
                  {getStatusBadge(vehicle.approvalStatus)}
                </div>

                <div className="space-y-2 mb-4">
                  <p className="text-gray-600">
                    <span className="font-semibold">Model:</span>{" "}
                    {vehicle.manufacturer} {vehicle.model}
                  </p>
                  <p className="text-gray-600">
                    <span className="font-semibold">Type:</span>{" "}
                    <span className="capitalize">{vehicle.type}</span>
                  </p>
                  <p className="text-gray-600">
                    <span className="font-semibold">Year:</span> {vehicle.year}
                  </p>
                  <p className="text-gray-600">
                    <span className="font-semibold">Color:</span>{" "}
                    {vehicle.color}
                  </p>
                  <p className="text-gray-600">
                    <span className="font-semibold">Capacity:</span>{" "}
                    {vehicle.capacity?.weight} {vehicle.capacity?.unit}
                  </p>
                  <p className="text-gray-600">
                    <span className="font-semibold">Fuel:</span>{" "}
                    <span className="capitalize">{vehicle.fuelType}</span>
                  </p>
                </div>

                <div className="mb-4">
                  {getAvailabilityBadge(vehicle.status)}
                </div>

                {vehicle.approvalStatus === "rejected" &&
                  vehicle.rejectionReason && (
                    <div className="bg-red-50 border border-red-200 p-3 rounded mb-4">
                      <p className="text-xs font-semibold text-red-800 mb-1">
                        Rejection Reason:
                      </p>
                      <p className="text-sm text-red-700">
                        {vehicle.rejectionReason}
                      </p>
                    </div>
                  )}

                {vehicle.assignedCustomer && (
                  <div className="bg-blue-50 border border-blue-200 p-3 rounded mb-4">
                    <p className="text-xs font-semibold text-blue-800 mb-1">
                      Current Assignment:
                    </p>
                    <p className="text-sm text-blue-700">
                      Delivering: {vehicle.assignedItemType}
                    </p>
                    {vehicle.assignedAt && (
                      <p className="text-xs text-blue-600 mt-1">
                        Assigned:{" "}
                        {new Date(vehicle.assignedAt).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                )}

                <div className="border-t pt-4">
                  <p className="text-xs text-gray-500">
                    Insurance Expires:{" "}
                    {new Date(
                      vehicle.insurance?.expiryDate,
                    ).toLocaleDateString()}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Registered:{" "}
                    {new Date(vehicle.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyVehicles;

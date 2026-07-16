import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { shipmentService } from "../../services/shipmentService";
import {
  Package,
  MapPin,
  User,
  Phone,
  Calendar,
  Weight,
  FileText,
  ArrowRight,
  Loader,
} from "lucide-react";
import { motion } from "framer-motion";
import toast, { Toaster } from "react-hot-toast";

const BookShipment = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm();

  const onSubmit = async (data) => {
    try {
      setLoading(true);

      const shipmentData = {
        pickupLocation: {
          address: data.pickupAddress,
          city: data.pickupCity,
          contactPerson: {
            name: data.pickupContactName,
            phone: data.pickupContactPhone,
          },
        },
        destination: {
          address: data.deliveryAddress,
          city: data.deliveryCity,
          contactPerson: {
            name: data.deliveryContactName,
            phone: data.deliveryContactPhone,
          },
        },
        cargoDetails: {
          type: data.cargoType,
          weight: parseFloat(data.weight),
          unit: data.weightUnit,
          description: data.description,
          quantity: parseInt(data.quantity) || 1,
        },
        scheduledPickupDate: data.pickupDate,
        pricing: {
          baseAmount: parseFloat(data.estimatedPrice) || 0,
          totalAmount: parseFloat(data.estimatedPrice) || 0,
        },
      };

      const response = await shipmentService.createShipment(shipmentData);
      toast.success("Shipment created successfully!");
      setTimeout(() => {
        navigate("/customer/my-bookings");
      }, 1500);
    } catch (err) {
      console.error("Failed to create shipment:", err);
      toast.error(err.response?.data?.message || "Failed to create shipment");
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => setStep(step + 1);
  const prevStep = () => setStep(step - 1);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 py-8">
      <Toaster position="top-right" />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mb-4">
            <Package className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">
            Book New Shipment
          </h1>
          <p className="mt-2 text-gray-600">
            Fill in the details to create your shipment
          </p>
        </motion.div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-center">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center">
                <div
                  className={`flex items-center justify-center w-10 h-10 rounded-full ${
                    step >= s
                      ? "bg-blue-600 text-white"
                      : "bg-gray-200 text-gray-600"
                  } font-semibold transition-colors`}
                >
                  {s}
                </div>
                {s < 3 && (
                  <div
                    className={`w-24 h-1 mx-2 ${
                      step > s ? "bg-blue-600" : "bg-gray-200"
                    } transition-colors`}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-center mt-2 text-sm text-gray-600">
            <span className="w-32 text-center">Pickup Details</span>
            <span className="w-32 text-center">Delivery Details</span>
            <span className="w-32 text-center">Cargo Details</span>
          </div>
        </div>

        {/* Form */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-2xl shadow-xl p-8"
        >
          <form onSubmit={handleSubmit(onSubmit)}>
            {/* Step 1: Pickup Details */}
            {step === 1 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
              >
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <MapPin className="h-6 w-6 text-blue-600" />
                  Pickup Details
                </h2>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Pickup Address *
                  </label>
                  <input
                    {...register("pickupAddress", {
                      required: "Pickup address is required",
                    })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter pickup address"
                  />
                  {errors.pickupAddress && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.pickupAddress.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Pickup City *
                  </label>
                  <input
                    {...register("pickupCity", {
                      required: "Pickup city is required",
                    })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter city"
                  />
                  {errors.pickupCity && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.pickupCity.message}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Contact Person *
                    </label>
                    <input
                      {...register("pickupContactName", {
                        required: "Contact name is required",
                      })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Contact name"
                    />
                    {errors.pickupContactName && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.pickupContactName.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Contact Phone *
                    </label>
                    <input
                      {...register("pickupContactPhone", {
                        required: "Phone is required",
                        pattern: {
                          value: /^[0-9]{10,15}$/,
                          message: "Invalid phone number",
                        },
                      })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="03001234567"
                    />
                    {errors.pickupContactPhone && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.pickupContactPhone.message}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Pickup Date *
                  </label>
                  <input
                    type="date"
                    {...register("pickupDate", {
                      required: "Pickup date is required",
                    })}
                    min={new Date().toISOString().split("T")[0]}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  {errors.pickupDate && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.pickupDate.message}
                    </p>
                  )}
                </div>

                <button
                  type="button"
                  onClick={nextStep}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Next: Delivery Details
                  <ArrowRight className="h-5 w-5" />
                </button>
              </motion.div>
            )}

            {/* Step 2: Delivery Details */}
            {step === 2 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
              >
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <MapPin className="h-6 w-6 text-green-600" />
                  Delivery Details
                </h2>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Delivery Address *
                  </label>
                  <input
                    {...register("deliveryAddress", {
                      required: "Delivery address is required",
                    })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter delivery address"
                  />
                  {errors.deliveryAddress && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.deliveryAddress.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Delivery City *
                  </label>
                  <input
                    {...register("deliveryCity", {
                      required: "Delivery city is required",
                    })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter city"
                  />
                  {errors.deliveryCity && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.deliveryCity.message}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Contact Person *
                    </label>
                    <input
                      {...register("deliveryContactName", {
                        required: "Contact name is required",
                      })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Contact name"
                    />
                    {errors.deliveryContactName && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.deliveryContactName.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Contact Phone *
                    </label>
                    <input
                      {...register("deliveryContactPhone", {
                        required: "Phone is required",
                        pattern: {
                          value: /^[0-9]{10,15}$/,
                          message: "Invalid phone number",
                        },
                      })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="03001234567"
                    />
                    {errors.deliveryContactPhone && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.deliveryContactPhone.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={prevStep}
                    className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={nextStep}
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Next: Cargo Details
                    <ArrowRight className="h-5 w-5" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* Step 3: Cargo Details */}
            {step === 3 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
              >
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <Package className="h-6 w-6 text-orange-600" />
                  Cargo Details
                </h2>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cargo Type *
                  </label>
                  <input
                    {...register("cargoType", {
                      required: "Cargo type is required",
                    })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., Electronics, Furniture, Documents"
                  />
                  {errors.cargoType && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.cargoType.message}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Weight *
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      {...register("weight", {
                        required: "Weight is required",
                        min: {
                          value: 0.1,
                          message: "Weight must be greater than 0",
                        },
                      })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter weight"
                    />
                    {errors.weight && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.weight.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Unit *
                    </label>
                    <select
                      {...register("weightUnit")}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="kg">KG</option>
                      <option value="ton">Ton</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Quantity
                  </label>
                  <input
                    type="number"
                    {...register("quantity")}
                    defaultValue={1}
                    min="1"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    {...register("description")}
                    rows="3"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Additional details about the cargo..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Estimated Price (PKR)
                  </label>
                  <input
                    type="number"
                    {...register("estimatedPrice")}
                    defaultValue={0}
                    min="0"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter estimated price"
                  />
                </div>

                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={prevStep}
                    className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <>
                        <Loader className="animate-spin h-5 w-5" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Package className="h-5 w-5" />
                        Create Shipment
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            )}
          </form>
        </motion.div>
      </div>
    </div>
  );
};

export default BookShipment;

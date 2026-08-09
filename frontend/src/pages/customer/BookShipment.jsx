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
        status: "pending",
      };

      await shipmentService.createShipment(shipmentData);
      toast.success("Shipment booking submitted! Awaiting admin approval.");
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
    <div className="space-y-6 p-1">
      <Toaster position="top-right" />

      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center justify-center w-14 h-14 bg-purple-600 dark:bg-purple-700 rounded-2xl mb-3 shadow-lg shadow-purple-500/20">
            <Package className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Book New Shipment
          </h1>
          <p className="mt-1 text-slate-500 dark:text-slate-400 text-sm font-medium">
            Fill in details to request a new cargo delivery order.
          </p>
        </motion.div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-center">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center">
                <div
                  className={`flex items-center justify-center w-9 h-9 rounded-xl text-xs font-bold transition-all ${
                    step >= s
                      ? "bg-purple-600 text-white shadow-md shadow-purple-500/20"
                      : "bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
                  }`}
                >
                  {s}
                </div>
                {s < 3 && (
                  <div
                    className={`w-16 sm:w-24 h-1 mx-2 rounded-full ${
                      step > s ? "bg-purple-600" : "bg-slate-200 dark:bg-slate-800"
                    } transition-colors`}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-center mt-2.5 text-xs text-slate-500 dark:text-slate-400 font-semibold gap-14 sm:gap-20">
            <span>Pickup</span>
            <span>Delivery</span>
            <span>Cargo Info</span>
          </div>
        </div>

        {/* Form */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 sm:p-8 shadow-sm transition-colors"
        >
          <form onSubmit={handleSubmit(onSubmit)}>
            {/* Step 1: Pickup Details */}
            {step === 1 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-5"
              >
                <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  Pickup Details
                </h2>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Pickup Address *
                  </label>
                  <input
                    {...register("pickupAddress", {
                      required: "Pickup address is required",
                    })}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 focus:outline-none transition-all placeholder-slate-400"
                    placeholder="Enter pickup street address"
                  />
                  {errors.pickupAddress && (
                    <p className="mt-1 text-xs text-rose-500 font-semibold">
                      {errors.pickupAddress.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Pickup City *
                  </label>
                  <input
                    {...register("pickupCity", {
                      required: "Pickup city is required",
                    })}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 focus:outline-none transition-all placeholder-slate-400"
                    placeholder="Enter city"
                  />
                  {errors.pickupCity && (
                    <p className="mt-1 text-xs text-rose-500 font-semibold">
                      {errors.pickupCity.message}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      Contact Person *
                    </label>
                    <input
                      {...register("pickupContactName", {
                        required: "Contact name is required",
                      })}
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 focus:outline-none transition-all placeholder-slate-400"
                      placeholder="Contact name"
                    />
                    {errors.pickupContactName && (
                      <p className="mt-1 text-xs text-rose-500 font-semibold">
                        {errors.pickupContactName.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      Contact Phone *
                    </label>
                    <input
                      {...register("pickupContactPhone", {
                        required: "Contact phone is required",
                      })}
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 focus:outline-none transition-all placeholder-slate-400"
                      placeholder="Phone number"
                    />
                    {errors.pickupContactPhone && (
                      <p className="mt-1 text-xs text-rose-500 font-semibold">
                        {errors.pickupContactPhone.message}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Pickup Date & Time *
                  </label>
                  <input
                    type="datetime-local"
                    {...register("pickupDate", {
                      required: "Pickup date is required",
                    })}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 focus:outline-none transition-all"
                  />
                  {errors.pickupDate && (
                    <p className="mt-1 text-xs text-rose-500 font-semibold">
                      {errors.pickupDate.message}
                    </p>
                  )}
                </div>

                <button
                  type="button"
                  onClick={nextStep}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl transition-all shadow-md shadow-purple-500/20 cursor-pointer text-sm"
                >
                  Next: Delivery Details
                  <ArrowRight className="h-4 w-4" />
                </button>
              </motion.div>
            )}

            {/* Step 2: Delivery Details */}
            {step === 2 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-5"
              >
                <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  Delivery Details
                </h2>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Delivery Address *
                  </label>
                  <input
                    {...register("deliveryAddress", {
                      required: "Delivery address is required",
                    })}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 focus:outline-none transition-all placeholder-slate-400"
                    placeholder="Enter delivery address"
                  />
                  {errors.deliveryAddress && (
                    <p className="mt-1 text-xs text-rose-500 font-semibold">
                      {errors.deliveryAddress.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Delivery City *
                  </label>
                  <input
                    {...register("deliveryCity", {
                      required: "Delivery city is required",
                    })}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 focus:outline-none transition-all placeholder-slate-400"
                    placeholder="Enter destination city"
                  />
                  {errors.deliveryCity && (
                    <p className="mt-1 text-xs text-rose-500 font-semibold">
                      {errors.deliveryCity.message}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      Receiver Name *
                    </label>
                    <input
                      {...register("deliveryContactName", {
                        required: "Receiver name is required",
                      })}
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 focus:outline-none transition-all placeholder-slate-400"
                      placeholder="Receiver contact person"
                    />
                    {errors.deliveryContactName && (
                      <p className="mt-1 text-xs text-rose-500 font-semibold">
                        {errors.deliveryContactName.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      Receiver Phone *
                    </label>
                    <input
                      {...register("deliveryContactPhone", {
                        required: "Receiver phone is required",
                      })}
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 focus:outline-none transition-all placeholder-slate-400"
                      placeholder="Phone number"
                    />
                    {errors.deliveryContactPhone && (
                      <p className="mt-1 text-xs text-rose-500 font-semibold">
                        {errors.deliveryContactPhone.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex gap-4 pt-2">
                  <button
                    type="button"
                    onClick={prevStep}
                    className="flex-1 px-6 py-3 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 font-bold transition-all text-sm cursor-pointer"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={nextStep}
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl transition-all shadow-md shadow-purple-500/20 text-sm cursor-pointer"
                  >
                    Next: Cargo Details
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* Step 3: Cargo Details */}
            {step === 3 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-5"
              >
                <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Package className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  Cargo Details
                </h2>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Cargo Type *
                  </label>
                  <input
                    {...register("cargoType", {
                      required: "Cargo type is required",
                    })}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 focus:outline-none transition-all placeholder-slate-400"
                    placeholder="e.g., Electronics, Agricultural goods, Construction"
                  />
                  {errors.cargoType && (
                    <p className="mt-1 text-xs text-rose-500 font-semibold">
                      {errors.cargoType.message}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
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
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 focus:outline-none transition-all placeholder-slate-400"
                      placeholder="Enter cargo weight"
                    />
                    {errors.weight && (
                      <p className="mt-1 text-xs text-rose-500 font-semibold">
                        {errors.weight.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      Unit *
                    </label>
                    <select
                      {...register("weightUnit")}
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 focus:outline-none transition-all text-slate-900 dark:text-white"
                    >
                      <option value="kg">KG</option>
                      <option value="ton">Ton</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Quantity
                  </label>
                  <input
                    type="number"
                    {...register("quantity")}
                    defaultValue={1}
                    min="1"
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 focus:outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Description
                  </label>
                  <textarea
                    {...register("description")}
                    rows="3"
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 focus:outline-none transition-all placeholder-slate-400 resize-none"
                    placeholder="Additional details or handling instructions..."
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Estimated Price (PKR)
                  </label>
                  <input
                    type="number"
                    {...register("estimatedPrice")}
                    defaultValue={0}
                    min="0"
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 focus:outline-none transition-all"
                    placeholder="Enter price"
                  />
                </div>

                <div className="flex gap-4 pt-2">
                  <button
                    type="button"
                    onClick={prevStep}
                    className="flex-1 px-6 py-3 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 font-bold transition-all text-sm cursor-pointer"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl transition-all shadow-md shadow-purple-500/20 disabled:opacity-50 text-sm cursor-pointer"
                  >
                    {loading ? (
                      <>
                        <Loader className="animate-spin h-4 w-4" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Package className="h-4 w-4" />
                        Book Shipment
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

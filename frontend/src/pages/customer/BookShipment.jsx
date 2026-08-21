import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { shipmentService } from "../../services/shipmentService";
import {
  Package,
  MapPin,
  Calendar,
  Weight,
  ArrowRight,
  ArrowLeft,
  Loader,
  CheckCircle2,
  Truck,
  Route as RouteIcon,
} from "lucide-react";
import { motion } from "framer-motion";
import toast, { Toaster } from "react-hot-toast";

const BookShipment = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState(null);
  const [quote, setQuote] = useState(null);
  const [quoting, setQuoting] = useState(false);
  const [created, setCreated] = useState(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm();

  // Quote inputs (subscribed for live updates)
  const pickupCity = watch("pickupCity");
  const deliveryCity = watch("deliveryCity");
  const weightVal = watch("weight");
  const unitVal = watch("weightUnit");

  // Live server-driven price quote (debounced)
  useEffect(() => {
    if (step < 3) return undefined;
    const w = parseFloat(weightVal);
    if (!pickupCity || !deliveryCity || !w || w <= 0) {
      setQuote(null);
      return undefined;
    }
    let cancelled = false;
    setQuoting(true);
    const timer = setTimeout(async () => {
      try {
        const res = await shipmentService.getQuote({
          pickupCity,
          deliveryCity,
          weight: w,
          unit: unitVal || "kg",
        });
        if (!cancelled) setQuote(res?.data || null);
      } catch {
        if (!cancelled) setQuote(null);
      } finally {
        if (!cancelled) setQuoting(false);
      }
    }, 500);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [step, pickupCity, deliveryCity, weightVal, unitVal]);

  const buildPayload = (data) => ({
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
  });

  // Step 3 -> 4: validate the whole form, store data, show review
  const handleReview = (data) => {
    setFormData(data);
    setStep(4);
  };

  // Step 4: explicit confirmation -> submit to API
  const confirmBooking = async () => {
    if (!formData) return;
    try {
      setLoading(true);
      const res = await shipmentService.createShipment(buildPayload(formData));
      setCreated(res?.data || null);
      toast.success("Booking confirmed! Admins have been notified.");
    } catch (err) {
      console.error("Failed to create shipment:", err);
      toast.error(err.response?.data?.message || "Failed to create shipment");
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => setStep(step + 1);
  const prevStep = () => setStep(step - 1);

  // ---------- Success summary screen ----------
  if (created) {
    const price =
      created.pricing?.totalAmount || created.finalPrice || quote?.totalAmount || 0;
    return (
      <div className="space-y-6 p-1">
        <Toaster position="top-right" />
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-xl mx-auto mt-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-8 shadow-sm text-center transition-colors"
        >
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <CheckCircle2 className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Booking Confirmed!
          </h1>
          <p className="mt-1 text-slate-500 dark:text-slate-400 text-sm font-medium">
            Shipment{" "}
            <span className="font-mono font-bold text-slate-900 dark:text-white">
              #{created.shipmentNumber}
            </span>{" "}
            · {created.pickupLocation?.city} → {created.destination?.city}
          </p>

          <div className="grid grid-cols-3 gap-3 my-6">
            <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-3">
              <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wide">
                Estimated Price
              </div>
              <div className="text-sm sm:text-base font-extrabold font-mono text-purple-700 dark:text-purple-400 mt-1">
                {price.toLocaleString()} ETB
              </div>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-3">
              <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wide">
                Distance
              </div>
              <div className="text-sm sm:text-base font-extrabold font-mono text-slate-900 dark:text-white mt-1">
                ~{created.distance || quote?.distanceKm || "?"} km
              </div>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-3">
              <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wide">
                Status
              </div>
              <div className="text-sm sm:text-base font-extrabold text-amber-600 dark:text-amber-400 mt-1">
                Pending Approval
              </div>
            </div>
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400 bg-purple-50 dark:bg-purple-950/30 border border-purple-200/60 dark:border-purple-800/30 rounded-xl p-3 text-left">
            Admins have been automatically notified of your booking and will
            assign the most suitable driver &amp; vehicle. You&apos;ll receive a
            notification once the final price is confirmed — then you can pay
            securely via Chapa (Telebirr / CBE Birr).
          </p>

          <div className="flex gap-3 mt-6">
            <button
              onClick={() =>
                navigate(`/customer/track-shipment/${created._id}`)
              }
              className="flex-1 px-5 py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl transition-all shadow-md shadow-purple-500/20 text-sm cursor-pointer"
            >
              Track Shipment
            </button>
            <button
              onClick={() => navigate("/customer/my-bookings")}
              className="flex-1 px-5 py-3 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 font-bold transition-all text-sm cursor-pointer"
            >
              View My Bookings
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

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
            {[1, 2, 3, 4].map((s) => (
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
                {s < 4 && (
                  <div
                    className={`w-10 sm:w-14 h-1 mx-2 rounded-full ${
                      step > s ? "bg-purple-600" : "bg-slate-200 dark:bg-slate-800"
                    } transition-colors`}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-center mt-2.5 text-xs text-slate-500 dark:text-slate-400 font-semibold gap-8 sm:gap-12">
            <span>Pickup</span>
            <span>Delivery</span>
            <span>Cargo Info</span>
            <span>Review</span>
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

                {/* Live Server Price Estimation Box */}
                <div className="bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800/40 p-4 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-purple-900 dark:text-purple-300">
                      Automated Price Estimate:
                    </span>
                    {quoting ? (
                      <span className="text-base font-extrabold font-mono text-purple-700/60 dark:text-purple-400/60 flex items-center gap-1.5">
                        <Loader className="h-4 w-4 animate-spin" />
                        Calculating...
                      </span>
                    ) : quote ? (
                      <span className="text-base font-extrabold font-mono text-purple-700 dark:text-purple-400">
                        {(quote.totalAmount || 0).toLocaleString()} ETB
                      </span>
                    ) : (
                      <span className="text-xs font-semibold text-slate-400">
                        Enter cities &amp; weight
                      </span>
                    )}
                  </div>
                  {quote && (
                    <div className="space-y-0.5 text-[11px] text-purple-600 dark:text-purple-400/80">
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1">
                          <RouteIcon className="h-3 w-3" />
                          Est. Distance: ~{quote.distanceKm} km
                        </span>
                        <span>
                          Base Fee: {quote.baseFee?.toLocaleString()} ETB
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1">
                          <Truck className="h-3 w-3" />
                          Suggested: {quote.vehicleType} ({quote.ratePerKm}{" "}
                          ETB/km)
                        </span>
                        <span>
                          Distance Fare: {quote.distanceCost?.toLocaleString()}{" "}
                          ETB
                        </span>
                      </div>
                      {quote.weightSurcharge > 0 && (
                        <div className="flex items-center justify-between">
                          <span>Heavy-load surcharge</span>
                          <span>
                            +{quote.weightSurcharge.toLocaleString()} ETB
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 border-t border-purple-200/60 dark:border-purple-800/30 pt-1.5 mt-1">
                    ℹ️ <strong>Workflow:</strong> Confirming your booking will
                    notify admins instantly. Once they approve and confirm the
                    final price, you can pay securely with Chapa (Telebirr / CBE
                    Birr).
                  </p>
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
                    onClick={handleSubmit(handleReview)}
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl transition-all shadow-md shadow-purple-500/20 text-sm cursor-pointer"
                  >
                    Review Booking
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* Step 4: Review & Confirm */}
            {step === 4 && formData && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-5"
              >
                <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  Review &amp; Confirm Booking
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-4 space-y-1.5 text-xs">
                    <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white mb-1">
                      <MapPin className="h-3.5 w-3.5 text-purple-600" />
                      Pickup
                    </div>
                    <div className="text-slate-600 dark:text-slate-300">
                      {formData.pickupAddress}, {formData.pickupCity}
                    </div>
                    <div className="text-slate-500">
                      Contact: {formData.pickupContactName} ·{" "}
                      {formData.pickupContactPhone}
                    </div>
                    <div className="text-slate-500 flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {formData.pickupDate
                        ? new Date(formData.pickupDate).toLocaleString()
                        : "Not set"}
                    </div>
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-4 space-y-1.5 text-xs">
                    <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white mb-1">
                      <MapPin className="h-3.5 w-3.5 text-purple-600" />
                      Delivery
                    </div>
                    <div className="text-slate-600 dark:text-slate-300">
                      {formData.deliveryAddress}, {formData.deliveryCity}
                    </div>
                    <div className="text-slate-500">
                      Receiver: {formData.deliveryContactName} ·{" "}
                      {formData.deliveryContactPhone}
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-4 space-y-1.5 text-xs">
                  <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white mb-1">
                    <Weight className="h-3.5 w-3.5 text-purple-600" />
                    Cargo
                  </div>
                  <div className="text-slate-600 dark:text-slate-300">
                    {formData.cargoType} ·{" "}
                    <span className="font-semibold">
                      {formData.weight} {(formData.weightUnit || "kg").toUpperCase()}
                    </span>{" "}
                    · Qty: {parseInt(formData.quantity) || 1}
                  </div>
                  {formData.description && (
                    <div className="text-slate-500">{formData.description}</div>
                  )}
                </div>

                {/* Final estimated price from server */}
                <div className="bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800/40 rounded-2xl p-4 flex items-center justify-between">
                  <div className="text-xs font-bold text-purple-900 dark:text-purple-300">
                    Estimated Price{" "}
                    <span className="font-normal text-slate-500 dark:text-slate-400">
                      (final price confirmed by admin)
                    </span>
                  </div>
                  <div className="text-lg font-extrabold font-mono text-purple-700 dark:text-purple-400">
                    {quote
                      ? `${quote.totalAmount.toLocaleString()} ETB`
                      : "—"}
                  </div>
                </div>

                <div className="flex gap-4 pt-2">
                  <button
                    type="button"
                    onClick={prevStep}
                    className="flex-1 px-6 py-3 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 font-bold transition-all text-sm cursor-pointer"
                  >
                    <span className="inline-flex items-center gap-1.5">
                      <ArrowLeft className="h-4 w-4" />
                      Back to Edit
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={confirmBooking}
                    disabled={loading}
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl transition-all shadow-md shadow-purple-500/20 disabled:opacity-50 text-sm cursor-pointer"
                  >
                    {loading ? (
                      <>
                        <Loader className="animate-spin h-4 w-4" />
                        Confirming...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-4 w-4" />
                        Confirm Booking
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

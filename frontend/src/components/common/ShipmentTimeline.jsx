import React from "react";
import {
  CheckCircle2,
  Clock,
  Truck,
  Package,
  MapPin,
  Check,
  Navigation,
  User,
  Phone,
  Calendar,
  Layers,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";

/**
 * 5-Stage Sequence:
 * 1. Booked (or Assigned)
 * 2. Picked Up
 * 3. In Transit
 * 4. Arrived
 * 5. Delivered
 */
const TIMELINE_STEPS = [
  {
    key: "booked",
    title: "Booked",
    subtitle: "Booking Confirmed & Assigned",
    icon: CheckCircle2,
    aliases: ["pending", "approved", "assigned", "booked"],
  },
  {
    key: "picked_up",
    title: "Picked Up",
    subtitle: "Cargo Loaded & Received",
    icon: Package,
    aliases: ["picked_up"],
  },
  {
    key: "in_transit",
    title: "In Transit",
    subtitle: "On Route to Destination",
    icon: Truck,
    aliases: ["in_transit", "on_the_way"],
  },
  {
    key: "arrived",
    title: "Arrived",
    subtitle: "Reached Destination Hub",
    icon: MapPin,
    aliases: ["arrived", "arrived_at_destination"],
  },
  {
    key: "delivered",
    title: "Delivered",
    subtitle: "Completed & Handed Over",
    icon: CheckCircle2,
    aliases: ["delivered", "completed"],
  },
];

export const getStepIndex = (status) => {
  if (!status) return 0;
  const s = status.toLowerCase();
  for (let i = TIMELINE_STEPS.length - 1; i >= 0; i--) {
    if (TIMELINE_STEPS[i].aliases.includes(s)) {
      return i;
    }
  }
  return 0;
};

const ShipmentTimeline = ({
  shipment,
  trip,
  currentStatus,
  onUpdateStatus,
  isDriver = false,
  updating = false,
  showDetailsCard = true,
  className = "",
}) => {
  const effectiveStatus =
    currentStatus ||
    trip?.status ||
    shipment?.status ||
    "booked";

  const currentIndex = getStepIndex(effectiveStatus);

  // Extract timestamp for each step from statusHistory if available
  const getStepTimestamp = (stepKey, stepIdx) => {
    if (!shipment?.statusHistory || shipment.statusHistory.length === 0) {
      if (stepIdx === 0 && shipment?.createdAt) {
        return new Date(shipment.createdAt).toLocaleString([], {
          dateStyle: "short",
          timeStyle: "short",
        });
      }
      if (stepKey === "picked_up" && shipment?.actualPickupDate) {
        return new Date(shipment.actualPickupDate).toLocaleString([], {
          dateStyle: "short",
          timeStyle: "short",
        });
      }
      if (stepKey === "delivered" && shipment?.actualDeliveryDate) {
        return new Date(shipment.actualDeliveryDate).toLocaleString([], {
          dateStyle: "short",
          timeStyle: "short",
        });
      }
      return null;
    }

    const aliases = TIMELINE_STEPS[stepIdx].aliases;
    const historyItem = shipment.statusHistory
      .slice()
      .reverse()
      .find((h) => aliases.includes(h.status?.toLowerCase()));

    if (historyItem && historyItem.timestamp) {
      return new Date(historyItem.timestamp).toLocaleString([], {
        dateStyle: "short",
        timeStyle: "short",
      });
    }

    if (stepIdx <= currentIndex) {
      if (stepIdx === 0 && shipment?.createdAt) {
        return new Date(shipment.createdAt).toLocaleString([], {
          dateStyle: "short",
          timeStyle: "short",
        });
      }
    }

    return null;
  };

  const driver =
    shipment?.driverId ||
    trip?.driverId ||
    null;

  const vehicle =
    shipment?.vehicleId ||
    trip?.vehicleId ||
    null;

  // Next step calculation for Driver action button
  const nextStep =
    currentIndex < TIMELINE_STEPS.length - 1
      ? TIMELINE_STEPS[currentIndex + 1]
      : null;

  const nextActionLabels = {
    picked_up: "Mark as Picked Up ✓",
    in_transit: "Start Transit / In Transit ✓",
    arrived: "Mark as Arrived ✓",
    delivered: "Confirm Delivered ✓",
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* 5-Step Timeline Bar (Horizontal on desktop, Vertical on mobile) */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 sm:p-7 shadow-sm transition-colors">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-600 animate-ping" />
              <h3 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white tracking-tight">
                Live Shipment Tracking Timeline
              </h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Sequential shipment lifecycle progress
            </p>
          </div>

          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 font-mono">
            Status: {TIMELINE_STEPS[currentIndex]?.title || effectiveStatus}
          </span>
        </div>

        {/* Progress Bar / Nodes Grid */}
        <div className="relative">
          {/* Desktop connecting progress line */}
          <div className="hidden md:block absolute top-6 left-8 right-8 h-1 bg-slate-200 dark:bg-slate-800 -z-0 rounded-full">
            <div
              className="h-full bg-gradient-to-r from-purple-600 via-indigo-600 to-emerald-600 rounded-full transition-all duration-700 ease-out"
              style={{
                width: `${(currentIndex / (TIMELINE_STEPS.length - 1)) * 100}%`,
              }}
            />
          </div>

          {/* Steps List */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 md:gap-2 relative z-10">
            {TIMELINE_STEPS.map((step, idx) => {
              const isCompleted = idx < currentIndex;
              const isCurrent = idx === currentIndex;
              const isPending = idx > currentIndex;
              const timestamp = getStepTimestamp(step.key, idx);
              const StepIcon = step.icon;

              return (
                <div
                  key={step.key}
                  className={`flex md:flex-col items-center md:items-center text-left md:text-center gap-3.5 md:gap-2 p-2 rounded-xl transition-all ${
                    isCurrent
                      ? "bg-purple-50/70 dark:bg-purple-950/30 md:bg-transparent border border-purple-200/60 dark:border-purple-800/40 md:border-none"
                      : ""
                  }`}
                >
                  {/* Step Circle / Badge */}
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-sm transition-all shrink-0 ${
                      isCompleted
                        ? "bg-emerald-600 text-white shadow-md shadow-emerald-500/25 ring-4 ring-emerald-100 dark:ring-emerald-950"
                        : isCurrent
                        ? "bg-gradient-to-br from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-500/30 ring-4 ring-purple-200 dark:ring-purple-900 animate-pulse"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-slate-700"
                    }`}
                  >
                    {isCompleted ? (
                      <Check className="w-6 h-6 stroke-[3]" />
                    ) : (
                      <StepIcon className="w-5 h-5" />
                    )}
                  </div>

                  {/* Step Labels & Time */}
                  <div className="min-w-0 flex-1 md:flex-initial">
                    <div className="flex items-center gap-1.5 md:justify-center">
                      <p
                        className={`text-xs sm:text-sm font-bold tracking-tight ${
                          isCompleted
                            ? "text-emerald-700 dark:text-emerald-400"
                            : isCurrent
                            ? "text-purple-600 dark:text-purple-400 font-extrabold"
                            : "text-slate-400 dark:text-slate-500"
                        }`}
                      >
                        {step.title} {isCompleted && "✓"}
                      </p>
                    </div>

                    <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">
                      {step.subtitle}
                    </p>

                    {timestamp ? (
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 font-mono mt-0.5 flex items-center gap-1 md:justify-center">
                        <Clock className="w-3 h-3 shrink-0" />
                        <span>{timestamp}</span>
                      </p>
                    ) : isCurrent ? (
                      <span className="inline-block mt-0.5 px-2 py-0.2 rounded-full text-[9px] font-bold bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 animate-pulse">
                        Active Step
                      </span>
                    ) : (
                      <p className="text-[10px] text-slate-400 dark:text-slate-600 font-mono mt-0.5">
                        Pending
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Driver Interactive Next-Step Button (Prevent Skipping Steps) */}
        {isDriver && nextStep && onUpdateStatus && (
          <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl">
            <div className="text-xs text-slate-600 dark:text-slate-300">
              <span className="font-bold text-slate-900 dark:text-white">
                Next Required Stage:
              </span>{" "}
              <span>{nextStep.title} ({nextStep.subtitle})</span>
            </div>

            <button
              onClick={() => onUpdateStatus(nextStep.key)}
              disabled={updating}
              className="w-full sm:w-auto px-6 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-purple-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {updating ? (
                <div className="w-4 h-4 border-2 border-t-transparent border-white rounded-full animate-spin" />
              ) : (
                <Check className="w-4 h-4 stroke-[3]" />
              )}
              <span>{nextActionLabels[nextStep.key] || `Proceed to ${nextStep.title}`}</span>
            </button>
          </div>
        )}
      </div>

      {/* Details Card (Driver, Vehicle, Route) */}
      {showDetailsCard && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Driver Information */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-sm space-y-3">
            <div className="flex items-center gap-2 text-slate-400 dark:text-slate-500 text-xs font-bold uppercase tracking-wider">
              <User className="w-4 h-4 text-purple-600" />
              <span>Assigned Driver</span>
            </div>

            {driver ? (
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl overflow-hidden bg-purple-100 dark:bg-purple-950 text-purple-600 flex items-center justify-center font-bold text-base shrink-0 border border-purple-200 dark:border-purple-800">
                  {driver.userId?.profileImage ? (
                    <img
                      src={driver.userId.profileImage}
                      alt={driver.fullName || "Driver"}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-6 h-6" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="font-extrabold text-slate-900 dark:text-white text-sm truncate">
                    {driver.fullName || driver.name || "Assigned Driver"}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                    <Phone className="w-3 h-3 text-emerald-600 shrink-0" />
                    <span className="truncate">
                      {driver.userId?.phone || driver.phone || "Contact via NTMS"}
                    </span>
                  </p>
                  {driver.experience !== undefined && (
                    <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                      Exp: {driver.experience} years
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic py-2">
                Awaiting driver assignment
              </p>
            )}
          </div>

          {/* Vehicle Information */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-sm space-y-3">
            <div className="flex items-center gap-2 text-slate-400 dark:text-slate-500 text-xs font-bold uppercase tracking-wider">
              <Truck className="w-4 h-4 text-indigo-600" />
              <span>Assigned Vehicle</span>
            </div>

            {vehicle ? (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <p className="font-extrabold text-slate-900 dark:text-white text-sm">
                    {vehicle.manufacturer} {vehicle.model}
                  </p>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 uppercase">
                    {vehicle.type || "Truck"}
                  </span>
                </div>
                <p className="text-xs font-mono font-bold text-purple-600 dark:text-purple-400">
                  Plate: {vehicle.plateNumber}
                </p>
                {vehicle.capacity && (
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Capacity: {vehicle.capacity.weight} {vehicle.capacity.unit || "kg"}
                  </p>
                )}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic py-2">
                Awaiting vehicle assignment
              </p>
            )}
          </div>

          {/* Route Locations */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-sm space-y-3">
            <div className="flex items-center gap-2 text-slate-400 dark:text-slate-500 text-xs font-bold uppercase tracking-wider">
              <MapPin className="w-4 h-4 text-emerald-600" />
              <span>Transit Route</span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-start gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 mt-1 shrink-0" />
                <div className="min-w-0">
                  <p className="font-bold text-slate-900 dark:text-white">
                    {shipment?.pickupLocation?.city || "Origin City"}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                    {shipment?.pickupLocation?.address || "Pickup address"}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <span className="w-2 h-2 rounded-full bg-purple-500 mt-1 shrink-0" />
                <div className="min-w-0">
                  <p className="font-bold text-slate-900 dark:text-white">
                    {shipment?.destination?.city || "Destination City"}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                    {shipment?.destination?.address || "Destination address"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShipmentTimeline;

const mongoose = require("mongoose");

/**
 * Trip Model
 *
 * Purpose: Tracks active deliveries and driver assignments
 * - Created when shipment is assigned to driver
 * - Real-time tracking of cargo location
 * - Driver updates trip status
 *
 * Status Flow:
 * - pending: Trip assigned but not started
 * - in_progress: Driver started the trip
 * - completed: Trip finished successfully
 * - cancelled: Trip cancelled
 */
const tripSchema = new mongoose.Schema(
  {
    tripNumber: {
      type: String,
      unique: true,
      required: true,
    },
    shipmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Shipment",
      required: [true, "Shipment ID is required"],
    },
    driverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Driver",
      required: [true, "Driver ID is required"],
    },
    vehicleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vehicle",
      required: [true, "Vehicle ID is required"],
    },
    startTime: {
      type: Date,
    },
    endTime: {
      type: Date,
    },
    estimatedDuration: {
      type: Number, // in hours
      default: 0,
    },
    actualDuration: {
      type: Number, // in hours
      default: 0,
    },
    currentLocation: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        default: [0, 0],
      },
      address: String,
      lastUpdated: {
        type: Date,
        default: Date.now,
      },
    },
    route: [
      {
        location: {
          type: {
            type: String,
            enum: ["Point"],
            default: "Point",
          },
          coordinates: [Number],
        },
        timestamp: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    distance: {
      type: Number, // in kilometers
      default: 0,
    },
    status: {
      type: String,
      enum: [
        "pending",
        "on_the_way",
        "arrived_at_pickup",
        "picked_up",
        "in_transit",
        "arrived_at_destination",
        "completed",
        "cancelled"
      ],
      default: "pending",
    },
    checkpoints: [
      {
        location: String,
        timestamp: Date,
        status: String,
        remarks: String,
      },
    ],
    incidents: [
      {
        type: {
          type: String,
          enum: ["delay", "accident", "breakdown", "other"],
        },
        description: String,
        timestamp: {
          type: Date,
          default: Date.now,
        },
        resolved: {
          type: Boolean,
          default: false,
        },
      },
    ],
    fuelConsumption: {
      start: Number, // Fuel level at start
      end: Number, // Fuel level at end
      total: Number, // Total consumed
    },
    expenses: {
      fuel: {
        type: Number,
        default: 0,
      },
      toll: {
        type: Number,
        default: 0,
      },
      maintenance: {
        type: Number,
        default: 0,
      },
      other: {
        type: Number,
        default: 0,
      },
      total: {
        type: Number,
        default: 0,
      },
    },
    driverNotes: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  },
);

// Pre-save middleware to generate trip number
tripSchema.pre("save", async function (next) {
  if (!this.tripNumber) {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const count = await mongoose.model("Trip").countDocuments();
    this.tripNumber = `TRP-${year}${month}-${String(count + 1).padStart(5, "0")}`;
  }
  next();
});

// Geospatial index
tripSchema.index({ currentLocation: "2dsphere" });
tripSchema.index({ driverId: 1 });
tripSchema.index({ status: 1 });
tripSchema.index({ createdAt: -1 });

module.exports = mongoose.model("Trip", tripSchema);

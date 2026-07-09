const mongoose = require("mongoose");

/**
 * Vehicle Model
 *
 * Purpose: Fleet management and vehicle tracking
 * - Stores vehicle specifications
 * - Tracks insurance and maintenance
 * - Manages vehicle availability
 *
 * Types:
 * - truck: Large cargo vehicles
 * - van: Medium capacity
 * - pickup: Light cargo
 * - trailer: Heavy duty
 */
const vehicleSchema = new mongoose.Schema(
  {
    plateNumber: {
      type: String,
      required: [true, "Plate number is required"],
      unique: true,
      trim: true,
      uppercase: true,
    },
    model: {
      type: String,
      required: [true, "Vehicle model is required"],
      trim: true,
    },
    manufacturer: {
      type: String,
      trim: true,
    },
    type: {
      type: String,
      required: [true, "Vehicle type is required"],
      enum: {
        values: ["truck", "van", "pickup", "trailer", "other"],
        message: "{VALUE} is not a valid vehicle type",
      },
    },
    capacity: {
      weight: {
        type: Number,
        required: [true, "Weight capacity is required"],
        min: [0, "Capacity cannot be negative"],
      },
      unit: {
        type: String,
        enum: ["kg", "ton"],
        default: "kg",
      },
    },
    year: {
      type: Number,
      required: [true, "Manufacturing year is required"],
      min: [1990, "Year must be 1990 or later"],
      max: [new Date().getFullYear() + 1, "Invalid year"],
    },
    color: {
      type: String,
      trim: true,
    },
    insurance: {
      company: String,
      policyNumber: String,
      expiryDate: {
        type: Date,
        required: [true, "Insurance expiry date is required"],
      },
      document: String, // Cloudinary URL
    },
    registration: {
      number: String,
      expiryDate: Date,
      document: String,
    },
    status: {
      type: String,
      enum: ["available", "in_use", "maintenance", "inactive"],
      default: "available",
    },
    currentDriver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Driver",
      default: null,
    },
    fuelType: {
      type: String,
      enum: ["petrol", "diesel", "cng", "electric", "hybrid"],
      default: "diesel",
    },
    mileage: {
      type: Number,
      default: 0,
      min: 0,
    },
    lastMaintenanceDate: {
      type: Date,
    },
    nextMaintenanceDate: {
      type: Date,
    },
    images: [String], // Array of Cloudinary URLs
    notes: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  },
);

// Indexes for efficient queries
vehicleSchema.index({ plateNumber: 1 });
vehicleSchema.index({ status: 1 });
vehicleSchema.index({ type: 1 });

module.exports = mongoose.model("Vehicle", vehicleSchema);

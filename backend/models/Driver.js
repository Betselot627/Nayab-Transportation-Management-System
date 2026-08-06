const mongoose = require("mongoose");

/**
 * Driver Model
 *
 * Purpose: Extended profile for driver users
 * - Links to User model
 * - Stores license and certification data
 * - Tracks driver availability and status
 *
 * Status Values:
 * - available: Ready for new assignments
 * - on_trip: Currently on delivery
 * - off_duty: Not available for assignments
 * - suspended: Temporarily deactivated
 */
const driverSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    fullName: {
      type: String,
      required: [true, "Full name is required"],
      trim: true,
    },
    licenseNumber: {
      type: String,
      required: [true, "License number is required"],
      unique: true,
      trim: true,
      uppercase: true,
    },
    licenseExpiry: {
      type: Date,
      required: [true, "License expiry date is required"],
    },
    licenseImage: {
      type: String, // Cloudinary URL
      default: null,
    },
    experience: {
      type: Number,
      required: [true, "Experience in years is required"],
      min: [0, "Experience cannot be negative"],
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
    },
    status: {
      type: String,
      enum: ["available", "on_trip", "off_duty", "suspended"],
      default: "available",
    },
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    totalTrips: {
      type: Number,
      default: 0,
    },
    completedTrips: {
      type: Number,
      default: 0,
    },
    vehicles: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Vehicle",
      },
    ],
    emergencyContact: {
      name: String,
      phone: String,
      relationship: String,
    },
    documents: {
      cnic: String, // Cloudinary URL
      medicalCertificate: String,
      other: [String],
    },
    lastAssignedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

// Geospatial index for location-based queries
driverSchema.index({ currentLocation: "2dsphere" });
driverSchema.index({ userId: 1 });
driverSchema.index({ status: 1 });

module.exports = mongoose.model("Driver", driverSchema);

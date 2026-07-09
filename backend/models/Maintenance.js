const mongoose = require("mongoose");

/**
 * Maintenance Model
 *
 * Purpose: Track vehicle maintenance and service history
 * - Preventive maintenance scheduling
 * - Repair history tracking
 * - Cost management
 *
 * Service Types:
 * - routine: Regular scheduled maintenance
 * - repair: Breakdown repairs
 * - inspection: Safety and compliance checks
 * - upgrade: Vehicle improvements
 */
const maintenanceSchema = new mongoose.Schema(
  {
    vehicleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vehicle",
      required: [true, "Vehicle ID is required"],
    },
    maintenanceNumber: {
      type: String,
      unique: true,
    },
    serviceType: {
      type: String,
      required: [true, "Service type is required"],
      enum: ["routine", "repair", "inspection", "upgrade", "other"],
    },
    category: {
      type: String,
      enum: [
        "engine",
        "transmission",
        "brakes",
        "tires",
        "electrical",
        "body",
        "oil_change",
        "general",
        "other",
      ],
      default: "general",
    },
    description: {
      type: String,
      required: [true, "Maintenance description is required"],
      trim: true,
    },
    serviceProvider: {
      name: String,
      contact: String,
      address: String,
    },
    cost: {
      labor: {
        type: Number,
        default: 0,
      },
      parts: {
        type: Number,
        default: 0,
      },
      other: {
        type: Number,
        default: 0,
      },
      total: {
        type: Number,
        required: [true, "Total cost is required"],
        min: [0, "Cost cannot be negative"],
      },
    },
    serviceDate: {
      type: Date,
      required: [true, "Service date is required"],
      default: Date.now,
    },
    nextServiceDate: {
      type: Date,
    },
    nextServiceMileage: {
      type: Number,
    },
    currentMileage: {
      type: Number,
      required: [true, "Current mileage is required"],
    },
    status: {
      type: String,
      enum: ["scheduled", "in_progress", "completed", "cancelled"],
      default: "scheduled",
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
    },
    partsReplaced: [
      {
        partName: String,
        partNumber: String,
        quantity: Number,
        cost: Number,
      },
    ],
    performedBy: {
      type: String,
      trim: true,
    },
    documents: [String], // Cloudinary URLs for invoices, receipts
    notes: {
      type: String,
      trim: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  },
);

// Pre-save middleware to generate maintenance number
maintenanceSchema.pre("save", async function (next) {
  if (!this.maintenanceNumber) {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const count = await mongoose.model("Maintenance").countDocuments();
    this.maintenanceNumber = `MNT-${year}${month}-${String(count + 1).padStart(5, "0")}`;
  }

  // Calculate total cost
  this.cost.total = this.cost.labor + this.cost.parts + this.cost.other;

  next();
});

// Indexes
maintenanceSchema.index({ vehicleId: 1 });
maintenanceSchema.index({ serviceDate: -1 });
maintenanceSchema.index({ status: 1 });

module.exports = mongoose.model("Maintenance", maintenanceSchema);

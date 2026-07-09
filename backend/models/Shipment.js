const mongoose = require("mongoose");

/**
 * Shipment Model
 *
 * Purpose: Core business model for cargo shipments
 * - Created by customers
 * - Managed by dispatchers
 * - Executed by drivers
 *
 * Workflow:
 * 1. pending - Customer creates shipment
 * 2. approved - Admin/Dispatcher approves
 * 3. assigned - Driver and vehicle assigned
 * 4. picked_up - Driver picks up cargo
 * 5. in_transit - Cargo being delivered
 * 6. delivered - Cargo delivered to destination
 * 7. completed - Payment and documentation complete
 * 8. cancelled - Shipment cancelled
 */
const shipmentSchema = new mongoose.Schema(
  {
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: [true, "Customer ID is required"],
    },
    shipmentNumber: {
      type: String,
      unique: true,
      required: true,
    },
    pickupLocation: {
      address: {
        type: String,
        required: [true, "Pickup address is required"],
      },
      city: {
        type: String,
        required: [true, "Pickup city is required"],
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        default: [0, 0],
      },
      contactPerson: {
        name: String,
        phone: String,
      },
    },
    destination: {
      address: {
        type: String,
        required: [true, "Destination address is required"],
      },
      city: {
        type: String,
        required: [true, "Destination city is required"],
      },
      coordinates: {
        type: [Number],
        default: [0, 0],
      },
      contactPerson: {
        name: String,
        phone: String,
      },
    },
    cargoDetails: {
      type: {
        type: String,
        required: [true, "Cargo type is required"],
        trim: true,
      },
      weight: {
        type: Number,
        required: [true, "Cargo weight is required"],
        min: [0, "Weight cannot be negative"],
      },
      unit: {
        type: String,
        enum: ["kg", "ton"],
        default: "kg",
      },
      description: {
        type: String,
        trim: true,
      },
      quantity: {
        type: Number,
        default: 1,
      },
      specialInstructions: String,
    },
    vehicleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vehicle",
      default: null,
    },
    driverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Driver",
      default: null,
    },
    status: {
      type: String,
      enum: [
        "pending",
        "approved",
        "assigned",
        "picked_up",
        "in_transit",
        "delivered",
        "completed",
        "cancelled",
      ],
      default: "pending",
    },
    pricing: {
      baseAmount: {
        type: Number,
        default: 0,
      },
      additionalCharges: {
        type: Number,
        default: 0,
      },
      totalAmount: {
        type: Number,
        default: 0,
      },
      currency: {
        type: String,
        default: "PKR",
      },
    },
    scheduledPickupDate: {
      type: Date,
      required: [true, "Scheduled pickup date is required"],
    },
    estimatedDeliveryDate: {
      type: Date,
    },
    actualPickupDate: {
      type: Date,
    },
    actualDeliveryDate: {
      type: Date,
    },
    distance: {
      type: Number, // in kilometers
      default: 0,
    },
    documents: {
      invoices: [String],
      receipts: [String],
      proofOfDelivery: String,
      other: [String],
    },
    statusHistory: [
      {
        status: String,
        timestamp: {
          type: Date,
          default: Date.now,
        },
        updatedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        remarks: String,
      },
    ],
    notes: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  },
);

// Pre-save middleware to generate shipment number
shipmentSchema.pre("save", async function (next) {
  if (!this.shipmentNumber) {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const count = await mongoose.model("Shipment").countDocuments();
    this.shipmentNumber = `SHP-${year}${month}-${String(count + 1).padStart(5, "0")}`;
  }
  next();
});

// Indexes
shipmentSchema.index({ customerId: 1 });
shipmentSchema.index({ status: 1 });
shipmentSchema.index({ shipmentNumber: 1 });
shipmentSchema.index({ createdAt: -1 });

module.exports = mongoose.model("Shipment", shipmentSchema);

const mongoose = require("mongoose");

/**
 * Shipment Model
 *
 * Purpose: Core business model for cargo shipments
 * - Created by customers
 * - Managed by dispatchers
 * - Executed by drivers
 * - Paid via Chapa Payment Gateway
 *
 * Workflow:
 * 1. pending - Customer creates shipment
 * 2. approved - Admin/Dispatcher approves & confirms final price
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
      sparse: true,
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
    paymentStatus: {
      type: String,
      enum: ["UNPAID", "PENDING", "PAID", "FAILED"],
      default: "UNPAID",
      index: true,
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
        default: "ETB",
      },
    },
    finalPrice: {
      type: Number,
      default: 0,
    },
    priceConfirmedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    priceConfirmedAt: {
      type: Date,
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

// Pre-save middleware to generate shipment number and sync finalPrice
shipmentSchema.pre("save", async function () {
  if (!this.shipmentNumber) {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, "0");
    this.shipmentNumber = `SHP-${year}${month}-${timestamp}${random}`;
  }

  // Ensure finalPrice is initialized from totalAmount if totalAmount > 0 and finalPrice was 0
  if (!this.finalPrice && this.pricing?.totalAmount) {
    this.finalPrice = this.pricing.totalAmount;
  }
  if (!this.pricing.totalAmount && this.finalPrice) {
    this.pricing.totalAmount = this.finalPrice;
  }
  this.pricing.currency = "ETB";
});

// Indexes
shipmentSchema.index({ customerId: 1 });
shipmentSchema.index({ status: 1 });
shipmentSchema.index({ paymentStatus: 1 });
shipmentSchema.index({ shipmentNumber: 1 });
shipmentSchema.index({ createdAt: -1 });

module.exports = mongoose.model("Shipment", shipmentSchema);

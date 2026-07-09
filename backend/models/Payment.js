const mongoose = require("mongoose");

/**
 * Payment Model
 *
 * Purpose: Financial transaction management
 * - Track shipment payments
 * - Multiple payment methods
 * - Payment status tracking
 *
 * Methods:
 * - cash: Cash on delivery/pickup
 * - bank_transfer: Direct bank transfer
 * - cheque: Cheque payment
 * - online: Online payment gateway
 * - credit: Credit account
 */
const paymentSchema = new mongoose.Schema(
  {
    paymentNumber: {
      type: String,
      unique: true,
    },
    shipmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Shipment",
      required: [true, "Shipment ID is required"],
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: [true, "Customer ID is required"],
    },
    amount: {
      type: Number,
      required: [true, "Payment amount is required"],
      min: [0, "Amount cannot be negative"],
    },
    currency: {
      type: String,
      default: "PKR",
    },
    paymentMethod: {
      type: String,
      required: [true, "Payment method is required"],
      enum: ["cash", "bank_transfer", "cheque", "online", "credit"],
    },
    paymentStatus: {
      type: String,
      enum: [
        "pending",
        "processing",
        "paid",
        "failed",
        "refunded",
        "cancelled",
      ],
      default: "pending",
    },
    paymentDate: {
      type: Date,
    },
    dueDate: {
      type: Date,
    },
    transactionDetails: {
      transactionId: String,
      bankName: String,
      accountNumber: String,
      chequeNumber: String,
      paymentGateway: String,
      reference: String,
    },
    invoice: {
      invoiceNumber: String,
      invoiceDate: Date,
      dueDate: Date,
      document: String, // Cloudinary URL
    },
    receipt: {
      receiptNumber: String,
      receiptDate: Date,
      document: String, // Cloudinary URL
    },
    breakdown: {
      baseAmount: {
        type: Number,
        default: 0,
      },
      tax: {
        type: Number,
        default: 0,
      },
      discount: {
        type: Number,
        default: 0,
      },
      additionalCharges: {
        type: Number,
        default: 0,
      },
    },
    paidBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    processedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    notes: {
      type: String,
      trim: true,
    },
    refundDetails: {
      refundAmount: Number,
      refundDate: Date,
      refundReason: String,
      refundMethod: String,
    },
  },
  {
    timestamps: true,
  },
);

// Pre-save middleware to generate payment number
paymentSchema.pre("save", async function (next) {
  if (!this.paymentNumber) {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const count = await mongoose.model("Payment").countDocuments();
    this.paymentNumber = `PAY-${year}${month}-${String(count + 1).padStart(5, "0")}`;
  }
  next();
});

// Indexes
paymentSchema.index({ shipmentId: 1 });
paymentSchema.index({ customerId: 1 });
paymentSchema.index({ paymentStatus: 1 });
paymentSchema.index({ paymentDate: -1 });

module.exports = mongoose.model("Payment", paymentSchema);

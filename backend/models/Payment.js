const mongoose = require("mongoose");

/**
 * Payment Model - NTMS
 *
 * Purpose: Financial transaction management with Chapa Payment Gateway
 * - Track shipment payments
 * - Unique transaction reference (txRef)
 * - Chapa checkout and verification state
 * - Automatic Receipt generation
 */
const paymentSchema = new mongoose.Schema(
  {
    paymentNumber: {
      type: String,
      unique: true,
      sparse: true,
    },
    txRef: {
      type: String,
      required: [true, "Transaction reference is required"],
      unique: true,
      index: true,
    },
    shipmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Shipment",
      required: [true, "Shipment ID is required"],
      index: true,
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: [true, "Customer ID is required"],
      index: true,
    },
    amount: {
      type: Number,
      required: [true, "Payment amount is required"],
      min: [0, "Amount cannot be negative"],
    },
    currency: {
      type: String,
      default: "ETB",
      uppercase: true,
    },
    status: {
      type: String,
      enum: ["PENDING", "PAID", "FAILED", "CANCELLED"],
      default: "PENDING",
      index: true,
    },
    paymentStatus: {
      // Legacy compatibility alias
      type: String,
      enum: ["pending", "processing", "paid", "failed", "cancelled"],
      default: "pending",
    },
    paymentMethod: {
      type: String,
      default: "Chapa",
    },
    checkoutUrl: {
      type: String,
    },
    chapaTransactionId: {
      type: String,
    },
    receiptNumber: {
      type: String,
      unique: true,
      sparse: true,
    },
    receiptDate: {
      type: Date,
    },
    paidAt: {
      type: Date,
    },
    failedAt: {
      type: Date,
    },
    paidBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    processedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    customerDetails: {
      name: String,
      email: String,
      phone: String,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Pre-save middleware to auto-generate payment and receipt numbers
paymentSchema.pre("save", async function () {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");

  if (!this.paymentNumber) {
    const timestamp = Date.now().toString().slice(-6);
    this.paymentNumber = `PAY-${year}${month}-${timestamp}`;
  }

  if (this.status === "PAID" && !this.receiptNumber) {
    const random = Math.floor(1000 + Math.random() * 9000);
    this.receiptNumber = `RCPT-${year}-${random}`;
    this.receiptDate = this.receiptDate || new Date();
  }

  // Synchronize legacy paymentStatus field
  if (this.status === "PAID") this.paymentStatus = "paid";
  else if (this.status === "FAILED") this.paymentStatus = "failed";
  else if (this.status === "CANCELLED") this.paymentStatus = "cancelled";
  else this.paymentStatus = "pending";
});

// Indexes
paymentSchema.index({ createdAt: -1 });
paymentSchema.index({ status: 1, createdAt: -1 });
paymentSchema.index({ paymentStatus: 1, paymentDate: -1 });
paymentSchema.index({ customerId: 1, createdAt: -1 });

module.exports = mongoose.model("Payment", paymentSchema);

const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    shipment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Shipment",
      required: true,
    },
    amount: { type: Number, required: true },
    method: {
      type: String,
      enum: ["cash", "card", "bank-transfer"],
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "completed", "failed"],
      default: "pending",
    },
    date: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Payment", paymentSchema);

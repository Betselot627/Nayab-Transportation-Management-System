const mongoose = require("mongoose");

const shipmentSchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
    },
    origin: { type: String, required: true },
    destination: { type: String, required: true },
    weight: { type: Number, required: true },
    status: {
      type: String,
      enum: ["pending", "in-transit", "delivered"],
      default: "pending",
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Shipment", shipmentSchema);

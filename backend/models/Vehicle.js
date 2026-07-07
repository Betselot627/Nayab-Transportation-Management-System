const mongoose = require("mongoose");

const vehicleSchema = new mongoose.Schema(
  {
    plateNumber: { type: String, required: true, unique: true },
    type: { type: String, required: true },
    capacity: { type: Number, required: true },
    status: {
      type: String,
      enum: ["active", "maintenance", "inactive"],
      default: "active",
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Vehicle", vehicleSchema);

const mongoose = require("mongoose");

const driverSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    licenseNumber: { type: String, required: true, unique: true },
    phone: { type: String, required: true },
    status: {
      type: String,
      enum: ["available", "busy", "off-duty"],
      default: "available",
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Driver", driverSchema);

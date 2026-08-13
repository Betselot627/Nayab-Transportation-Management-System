const mongoose = require("mongoose");
require("dotenv").config({ path: "backend/.env" });

const Shipment = require("../models/Shipment");
const Driver = require("../models/Driver");
const Vehicle = require("../models/Vehicle");
const Customer = require("../models/Customer");
const User = require("../models/User");

async function testFetch() {
  console.log("Connecting to MongoDB:", process.env.MONGO_URI);
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected successfully!");

  // Test 1: Get available drivers
  try {
    console.log("Fetching available drivers...");
    const drivers = await Driver.find({ status: "available" })
      .populate("userId", "name phone")
      .sort({ lastAssignedAt: 1, createdAt: 1 });
    console.log("Drivers count:", drivers.length);
  } catch (err) {
    console.error("❌ Error fetching drivers:", err);
  }

  // Test 2: Get vehicles
  try {
    console.log("Fetching vehicles...");
    const vehicles = await Vehicle.find({ status: "available" });
    console.log("Vehicles count:", vehicles.length);
  } catch (err) {
    console.error("❌ Error fetching vehicles:", err);
  }

  // Test 3: Get shipments
  try {
    console.log("Fetching shipments...");
    const query = {};
    const shipments = await Shipment.find(query)
      .populate({
        path: "customerId",
        select: "companyName contactPerson address userId",
        populate: {
          path: "userId",
          select: "name email phone profileImage status",
        },
      })
      .populate("vehicleId", "plateNumber model manufacturer type capacity status")
      .populate({
        path: "driverId",
        select: "fullName licenseNumber experience status userId",
        populate: {
          path: "userId",
          select: "name email phone profileImage",
        },
      })
      .limit(100)
      .sort({ createdAt: -1 })
      .lean();
    console.log("Shipments count:", shipments.length);
  } catch (err) {
    console.error("❌ Error fetching shipments:", err);
  }

  await mongoose.disconnect();
  console.log("Disconnected.");
}

testFetch().catch(console.error);

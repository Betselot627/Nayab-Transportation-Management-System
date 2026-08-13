const mongoose = require("mongoose");
require("dotenv").config({ path: "backend/.env" });

async function testPopulate() {
  console.log("Connecting to MongoDB...");
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected.");

  const Vehicle = require("../models/Vehicle");
  const Driver = require("../models/Driver");
  const User = require("../models/User");
  const Customer = require("../models/Customer");
  const Shipment = require("../models/Shipment");

  // Test 1: Vehicle query with full populate
  console.log("\n--- Testing Vehicle.find with full populate ---");
  try {
    const query = { status: "available", approvalStatus: "approved" };
    const vehicles = await Vehicle.find(query)
      .populate("currentDriver", "fullName phone")
      .populate("registeredBy", "fullName licenseNumber")
      .populate("approvedBy", "name email")
      .populate({
        path: "assignedCustomer",
        select: "companyName contactPerson userId",
        populate: {
          path: "userId",
          select: "name email phone profileImage",
        },
      })
      .lean();
    console.log("Vehicles fetched:", vehicles.length);
  } catch (err) {
    console.error("❌ Vehicle populate failed:", err);
  }

  // Test 2: Driver query with full populate
  console.log("\n--- Testing Driver.find with full populate ---");
  try {
    const drivers = await Driver.find({ status: "available" })
      .populate("userId", "name phone")
      .sort({ lastAssignedAt: 1, createdAt: 1 })
      .lean();
    console.log("Drivers fetched:", drivers.length);
  } catch (err) {
    console.error("❌ Driver populate failed:", err);
  }

  // Test 3: Shipment query with full populate
  console.log("\n--- Testing Shipment.find with full populate ---");
  try {
    const shipments = await Shipment.find({})
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
      .lean();
    console.log("Shipments fetched:", shipments.length);
  } catch (err) {
    console.error("❌ Shipment populate failed:", err);
  }

  await mongoose.disconnect();
  console.log("Disconnected.");
}

testPopulate().catch(console.error);

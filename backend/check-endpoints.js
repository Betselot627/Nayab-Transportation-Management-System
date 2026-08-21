const prisma = require("./config/prisma");
require("dotenv").config();

const Shipment = require("./models/Shipment");
const Driver = require("./models/Driver");
const Vehicle = require("./models/Vehicle");

const run = async () => {
  try {
    console.log("Connecting to DB...");
    await prisma.$connect();
    console.log("Connected!");

    console.log("\n--- Testing Shipment.find() ---");
    const shipments = await Shipment.find({})
      .populate("customerId")
      .populate("vehicleId")
      .populate("driverId");
    console.log(`Successfully fetched ${shipments.length} shipments.`);

    console.log("\n--- Testing Driver.find({ status: 'available' }) ---");
    const drivers = await Driver.find({ status: "available" })
      .populate("userId");
    console.log(`Successfully fetched ${drivers.length} available drivers.`);

    console.log("\n--- Testing Vehicle.find({ status: 'available', approvalStatus: 'approved' }) ---");
    const vehicles = await Vehicle.find({ status: "available", approvalStatus: "approved" })
      .populate("currentDriver")
      .populate("registeredBy")
      .populate("approvedBy");
    console.log(`Successfully fetched ${vehicles.length} available approved vehicles.`);

    console.log("\nDone!");
    process.exit(0);
  } catch (err) {
    console.error("ERROR running models check:", err);
    process.exit(1);
  }
};

run();

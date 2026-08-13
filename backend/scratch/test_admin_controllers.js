const mongoose = require("mongoose");
require("dotenv").config({ path: "backend/.env" });

const { getAllShipments } = require("../controllers/shipmentController");
const { getAvailableDrivers } = require("../controllers/driverController");
const { getAllVehicles } = require("../controllers/vehicleController");
const User = require("../models/User");

async function testControllers() {
  console.log("Connecting to MongoDB...");
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected.");

  const adminUser = await User.findOne({ role: "admin" });
  if (!adminUser) {
    console.error("No admin user found in database!");
    await mongoose.disconnect();
    return;
  }
  console.log(`Testing with admin user: ${adminUser.email} (ID: ${adminUser._id})`);

  const mockRes = {
    status: (code) => {
      return {
        json: (data) => {
          console.log(`Response Code: ${code}`);
          console.log(`Success: ${data.success}`);
          if (!data.success) {
            console.log(`Error Message:`, data.message);
          } else {
            console.log(`Data count/type:`, Array.isArray(data.data) ? data.data.length : typeof data.data);
          }
        }
      };
    }
  };

  // 1. Test getAllShipments
  console.log("\n--- Testing getAllShipments ---");
  try {
    await getAllShipments(
      { user: adminUser, query: { limit: 100 } },
      mockRes
    );
  } catch (err) {
    console.error("❌ Exception in getAllShipments:", err);
  }

  // 2. Test getAvailableDrivers
  console.log("\n--- Testing getAvailableDrivers ---");
  try {
    await getAvailableDrivers(
      { user: adminUser },
      mockRes
    );
  } catch (err) {
    console.error("❌ Exception in getAvailableDrivers:", err);
  }

  // 3. Test getAllVehicles
  console.log("\n--- Testing getAllVehicles ---");
  try {
    await getAllVehicles(
      { user: adminUser, query: { available: "true", limit: 100 } },
      mockRes
    );
  } catch (err) {
    console.error("❌ Exception in getAllVehicles:", err);
  }

  await mongoose.disconnect();
  console.log("\nDisconnected.");
}

testControllers().catch(console.error);

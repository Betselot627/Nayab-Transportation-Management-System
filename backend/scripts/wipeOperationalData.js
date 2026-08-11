const mongoose = require("mongoose");
require("dotenv").config({ path: require("path").join(__dirname, "../.env") });

const wipeAllOperationalData = async () => {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected.");

    const User = require("../models/User");
    const Customer = require("../models/Customer");
    const Driver = require("../models/Driver");
    const Vehicle = require("../models/Vehicle");
    const Shipment = require("../models/Shipment");
    const Trip = require("../models/Trip");
    const Payment = require("../models/Payment");
    const Notification = require("../models/Notification");
    const Maintenance = require("../models/Maintenance");

    // 1. Delete all shipments, trips, payments, notifications, and maintenance records
    const shipmentsDel = await Shipment.deleteMany({});
    const tripsDel = await Trip.deleteMany({});
    const paymentsDel = await Payment.deleteMany({});
    const notifsDel = await Notification.deleteMany({});
    let maintsDel = { deletedCount: 0 };
    try {
      maintsDel = await Maintenance.deleteMany({});
    } catch (e) {}

    console.log(`Deleted ${shipmentsDel.deletedCount} shipments`);
    console.log(`Deleted ${tripsDel.deletedCount} trips`);
    console.log(`Deleted ${paymentsDel.deletedCount} payments`);
    console.log(`Deleted ${notifsDel.deletedCount} notifications`);
    console.log(`Deleted ${maintsDel.deletedCount} maintenance records`);

    // 2. Reset Driver stats and status to 'available'
    const drivers = await Driver.find();
    for (const d of drivers) {
      d.status = "available";
      d.totalTrips = 0;
      d.completedTrips = 0;
      d.totalEarnings = 0;
      d.pendingPayout = 0;
      d.currentLocation = {
        type: "Point",
        coordinates: [38.7578, 8.9806], // Addis Ababa
        address: "Addis Ababa, Ethiopia",
      };
      d.lastAssignedAt = null;
      await d.save();
    }
    console.log(`Reset ${drivers.length} drivers to available status with 0 trips and 0 earnings.`);

    // 3. Reset Customer stats to 0
    const customers = await Customer.find();
    for (const c of customers) {
      c.totalShipments = 0;
      c.totalSpent = 0;
      await c.save();
    }
    console.log(`Reset ${customers.length} customers to 0 shipments and 0 spent.`);

    // 4. Reset Vehicles status to 'available', approvalStatus to 'approved', and clear assigned customers/item types
    const vehicles = await Vehicle.find();
    for (const v of vehicles) {
      v.status = "available";
      v.approvalStatus = "approved";
      v.assignedCustomer = null;
      v.assignedItemType = null;
      v.assignedAt = null;
      v.currentLocation = {
        type: "Point",
        coordinates: [38.7578, 8.9806],
        address: "Addis Ababa, Ethiopia",
      };
      await v.save();
    }
    console.log(`Reset ${vehicles.length} vehicles to available & approved with no active assignments.`);

    // 5. Display clean user roster
    const users = await User.find().select("name email role status");
    console.log("\n--- CLEAN REMAINING USERS ---");
    users.forEach((u) => {
      console.log(`• [${u.role.toUpperCase()}] ${u.name} (${u.email}) - Status: ${u.status}`);
    });

    console.log("\n=======================================================");
    console.log("✓ ALL DASHBOARD DATA WIPED & RESET TO A PRISTINE CLEAN STATE!");
    console.log("=======================================================");
    process.exit(0);
  } catch (error) {
    console.error("Wipe error:", error);
    process.exit(1);
  }
};

wipeAllOperationalData();

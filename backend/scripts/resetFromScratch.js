const prisma = require("../config/prisma");
const bcrypt = require("bcryptjs");
require("dotenv").config({ path: require("path").join(__dirname, "../.env") });

const resetFromScratch = async () => {
  try {
    console.log("Connecting to PostgreSQL...");
    await prisma.$connect();
    console.log("Connected successfully.");

    const User = require("../models/User");
    const Customer = require("../models/Customer");
    const Driver = require("../models/Driver");
    const Vehicle = require("../models/Vehicle");
    const Shipment = require("../models/Shipment");
    const Trip = require("../models/Trip");
    const Payment = require("../models/Payment");
    const Notification = require("../models/Notification");
    const Maintenance = require("../models/Maintenance");

    // 1. Wipe all operational collections
    const [vDel, dDel, cDel, sDel, tDel, pDel, nDel] = await Promise.all([
      Vehicle.deleteMany({}),
      Driver.deleteMany({}),
      Customer.deleteMany({}),
      Shipment.deleteMany({}),
      Trip.deleteMany({}),
      Payment.deleteMany({}),
      Notification.deleteMany({}),
    ]);

    try {
      await Maintenance.deleteMany({});
    } catch (e) {}

    console.log(`Deleted Vehicles: ${vDel.deletedCount}`);
    console.log(`Deleted Drivers: ${dDel.deletedCount}`);
    console.log(`Deleted Customers: ${cDel.deletedCount}`);
    console.log(`Deleted Shipments: ${sDel.deletedCount}`);
    console.log(`Deleted Trips: ${tDel.deletedCount}`);
    console.log(`Deleted Payments: ${pDel.deletedCount}`);
    console.log(`Deleted Notifications: ${nDel.deletedCount}`);

    // 2. Delete all non-admin users
    const uDel = await User.deleteMany({ role: { $ne: "admin" } });
    console.log(`Deleted Non-Admin Users: ${uDel.deletedCount}`);

    // 3. Ensure at least one clean Administrator exists
    let admin = await User.findOne({ role: "admin" });
    if (!admin) {
      const hashedPassword = await bcrypt.hash("Admin@123456", 10);
      admin = await User.create({
        name: "Administrator",
        email: "admin@ntms.com",
        password: hashedPassword,
        role: "admin",
        status: "active",
        phone: "+251911000000",
      });
      console.log("Created fresh default Administrator (admin@ntms.com / Admin@123456)");
    } else {
      admin.status = "active";
      await admin.save();
      console.log(`Preserved Administrator account: ${admin.name} (${admin.email})`);
    }

    // 4. Final verification counts
    console.log("\n--- VERIFICATION OF PRISTINE SCRATCH RESTART ---");
    console.log("Total Vehicles:", await Vehicle.countDocuments());
    console.log("Total Drivers:", await Driver.countDocuments());
    console.log("Total Customers:", await Customer.countDocuments());
    console.log("Total Shipments:", await Shipment.countDocuments());
    console.log("Total Trips:", await Trip.countDocuments());
    console.log("Total Payments:", await Payment.countDocuments());
    console.log("Total Non-Admin Users:", await User.countDocuments({ role: { $ne: "admin" } }));
    console.log("Active Admin Count:", await User.countDocuments({ role: "admin" }));

    console.log("\n=======================================================");
    console.log("✓ SYSTEM HAS BEEN COMPLETELY RESET FROM SCRATCH!");
    console.log("=======================================================");
    process.exit(0);
  } catch (error) {
    console.error("Reset error:", error);
    process.exit(1);
  }
};

resetFromScratch();

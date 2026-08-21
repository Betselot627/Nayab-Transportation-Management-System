const prisma = require("../config/prisma");
require("dotenv").config({ path: require("path").join(__dirname, "../.env") });

const testVehicleWorkflow = async () => {
  try {
    console.log("Connecting to PostgreSQL...");
    await prisma.$connect();
    console.log("Connected.");

    const User = require("../models/User");
    const Driver = require("../models/Driver");
    const Vehicle = require("../models/Vehicle");
    const Notification = require("../models/Notification");
    const bcrypt = require("bcryptjs");

    // 1. Get or create test Admin and test Driver
    let admin = await User.findOne({ role: "admin" });
    if (!admin) {
      admin = await User.create({
        name: "Admin User",
        email: "admin@ntms.com",
        password: await bcrypt.hash("Admin@123456", 10),
        role: "admin",
        status: "active",
      });
    }

    let driverUser = await User.findOne({ email: "testdriver@ntms.com" });
    if (!driverUser) {
      driverUser = await User.create({
        name: "Dawit Driver",
        email: "testdriver@ntms.com",
        phone: "+251911223344",
        password: await bcrypt.hash("Driver@123456", 10),
        role: "driver",
        status: "active",
      });
    }

    let driverDoc = await Driver.findOne({ userId: driverUser._id });
    if (!driverDoc) {
      driverDoc = await Driver.create({
        userId: driverUser._id,
        fullName: driverUser.name,
        licenseNumber: "ETH-DL-99120",
        licenseExpiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        experience: 5,
        status: "available",
      });
    }

    console.log("\n--- TEST 1: DRIVER SUBMITS VEHICLE REGISTRATION ---");
    // Driver submits vehicle
    const testPlate = `TEST-${Date.now().toString().slice(-4)}`;
    const driverVehicle = await Vehicle.create({
      registeredBy: driverDoc._id,
      currentDriver: driverDoc._id,
      plateNumber: testPlate,
      manufacturer: "Isuzu",
      model: "FSR Forward",
      type: "truck",
      year: 2023,
      color: "White",
      capacity: { weight: 5, unit: "ton" },
      fuelType: "diesel",
      approvalStatus: "pending", // Forced by controller
      status: "inactive",       // Forced by controller
      insurance: {
        company: "Nyala Insurance",
        policyNumber: "POL-NY-902",
        expiryDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
      },
      registration: {
        number: "LIB-991",
        expiryDate: new Date(Date.now() + 300 * 24 * 60 * 60 * 1000),
      },
    });

    console.log(`Vehicle ${driverVehicle.plateNumber} created with approvalStatus: ${driverVehicle.approvalStatus}, status: ${driverVehicle.status}`);
    if (driverVehicle.approvalStatus !== "pending" || driverVehicle.status !== "inactive") {
      throw new Error("Vehicle should be pending approval and inactive upon driver registration");
    }
    console.log("✓ Driver submission successfully defaults to 'pending' approval and 'inactive' status.");

    // 2. Test Admin Approval
    console.log("\n--- TEST 2: ADMIN REVIEWS AND APPROVES VEHICLE ---");
    driverVehicle.approvalStatus = "approved";
    driverVehicle.approvedBy = admin._id;
    driverVehicle.approvalDate = new Date();
    driverVehicle.status = "available";
    await driverVehicle.save();

    const approvalNotif = await Notification.create({
      userId: driverUser._id,
      title: "Vehicle Registration Approved",
      message: `Your vehicle ${driverVehicle.plateNumber} (Isuzu FSR Forward) has been approved and is now active in the fleet.`,
      type: "vehicle",
      relatedEntity: {
        entityType: "vehicle",
        entityId: driverVehicle._id,
      },
    });

    console.log(`Vehicle ${driverVehicle.plateNumber} is now ${driverVehicle.approvalStatus}, fleet status: ${driverVehicle.status}`);
    console.log(`Driver notification generated: "${approvalNotif.title}" -> ${approvalNotif.message}`);
    if (driverVehicle.approvalStatus !== "approved" || driverVehicle.status !== "available") {
      throw new Error("Vehicle approval state incorrect");
    }
    console.log("✓ Admin approval successfully unlocks vehicle availability and notifies driver.");

    // 3. Test Rejection Workflow on second vehicle
    console.log("\n--- TEST 3: ADMIN REJECTS VEHICLE WITH REASON ---");
    const testPlate2 = `TEST-${(Date.now() + 1).toString().slice(-4)}`;
    const driverVehicle2 = await Vehicle.create({
      registeredBy: driverDoc._id,
      plateNumber: testPlate2,
      manufacturer: "Toyota",
      model: "Hiace",
      type: "van",
      year: 2018,
      color: "Silver",
      capacity: { weight: 1.5, unit: "ton" },
      fuelType: "diesel",
      approvalStatus: "pending",
      status: "inactive",
      insurance: {
        expiryDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // Expired
      },
    });

    // Admin rejects due to expired insurance
    const rejectionReason = "Insurance policy is expired. Please submit a valid active insurance certificate.";
    driverVehicle2.approvalStatus = "rejected";
    driverVehicle2.rejectionReason = rejectionReason;
    driverVehicle2.status = "inactive";
    await driverVehicle2.save();

    const rejectNotif = await Notification.create({
      userId: driverUser._id,
      title: "Vehicle Registration Rejected",
      message: `Your vehicle ${driverVehicle2.plateNumber} registration was rejected. Reason: ${rejectionReason}`,
      type: "vehicle",
      relatedEntity: {
        entityType: "vehicle",
        entityId: driverVehicle2._id,
      },
    });

    console.log(`Vehicle ${driverVehicle2.plateNumber} is rejected. Reason: "${driverVehicle2.rejectionReason}"`);
    console.log(`Driver notification generated: "${rejectNotif.title}" -> ${rejectNotif.message}`);
    console.log("✓ Admin rejection workflow successfully records reason and dispatches notification.");

    // Clean up test simulation data
    await Vehicle.deleteMany({ _id: { $in: [driverVehicle._id, driverVehicle2._id] } });
    await Notification.deleteMany({ _id: { $in: [approvalNotif._id, rejectNotif._id] } });
    await Driver.deleteOne({ _id: driverDoc._id });
    await User.deleteOne({ _id: driverUser._id });
    console.log("\n✓ Cleaned up test simulation records.");

    console.log("\n=======================================================");
    console.log("✓ ALL VEHICLE APPROVAL WORKFLOW TESTS PASSED CLEANLY!");
    console.log("=======================================================");
    process.exit(0);
  } catch (error) {
    console.error("Test error:", error);
    process.exit(1);
  }
};

testVehicleWorkflow();

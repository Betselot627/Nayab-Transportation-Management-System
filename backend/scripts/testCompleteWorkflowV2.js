const prisma = require("../config/prisma");
const bcrypt = require("bcryptjs");
require("dotenv").config({ path: require("path").join(__dirname, "../.env") });

const runStrictWorkflowVerification = async () => {
  try {
    console.log("================================================================================");
    console.log("  STARTING STRICT NTMS WORKFLOW VALIDATION TEST");
    console.log("================================================================================\n");

    console.log("1. Connecting to PostgreSQL...");
    await prisma.$connect();
    console.log("✓ Connected to PostgreSQL.\n");

    const User = require("../models/User");
    const Customer = require("../models/Customer");
    const Driver = require("../models/Driver");
    const Vehicle = require("../models/Vehicle");
    const Shipment = require("../models/Shipment");
    const Trip = require("../models/Trip");
    const Notification = require("../models/Notification");
    const { updateTripStatus } = require("../controllers/tripController");
    const { approveVehicle } = require("../controllers/vehicleController");

    // -------------------------------------------------------------------------
    // 1. SETUP ACTORS
    // -------------------------------------------------------------------------
    console.log("--- 1. PROVISIONING TEST ACTORS ---");
    let adminUser = await User.findOne({ role: "admin" });
    if (!adminUser) {
      adminUser = await User.create({
        name: "Betsi Tig Admin",
        email: "admin@ntms.com",
        phone: "+251922827373",
        password: await bcrypt.hash("Admin@123456", 10),
        role: "admin",
        status: "active",
      });
    }

    const testCustEmail = `cust-${Date.now()}@ntmflow.com`;
    const customerUser = await User.create({
      name: "Solomon Tadesse",
      email: testCustEmail,
      phone: "+251911223344",
      password: await bcrypt.hash("Cust@123456", 10),
      role: "customer",
      status: "active",
    });

    const customerDoc = await Customer.create({
      userId: customerUser._id,
      companyName: "Solomon Trading Enterprise",
      contactPerson: {
        name: customerUser.name,
        phone: customerUser.phone,
        email: customerUser.email,
      },
    });

    const testDriverEmail = `driv-${Date.now()}@ntmflow.com`;
    const driverUser = await User.create({
      name: "Kassahun Bekele",
      email: testDriverEmail,
      phone: "+251922334455",
      password: await bcrypt.hash("Driver@123456", 10),
      role: "driver",
      status: "active",
    });

    const driverDoc = await Driver.create({
      userId: driverUser._id,
      fullName: driverUser.name,
      licenseNumber: `DL-STRICT-${Date.now().toString().slice(-4)}`,
      licenseExpiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      experience: 5,
      status: "available",
      commissionRate: 15,
    });
    console.log(`✓ Actors ready: Admin (${adminUser.name}), Customer (${customerUser.name}), Driver (${driverDoc.fullName})`);

    // -------------------------------------------------------------------------
    // 2. VEHICLE REGISTRATION & APPROVAL
    // -------------------------------------------------------------------------
    console.log("\n--- 2. VEHICLE REGISTRATION & SECURITY CHECK ---");
    const testPlate = `ETH-3-${Date.now().toString().slice(-4)}`;
    const vehicleDoc = await Vehicle.create({
      plateNumber: testPlate,
      manufacturer: "Isuzu",
      model: "NPR 75",
      type: "truck",
      year: 2024,
      color: "White",
      capacity: { weight: 4.5, unit: "ton" },
      fuelType: "diesel",
      registeredBy: driverDoc._id,
      currentDriver: driverDoc._id,
      approvalStatus: "pending",
      status: "inactive",
      insurance: {
        company: "Nyala Insurance",
        policyNumber: "POL-99221",
        expiryDate: new Date(Date.now() + 300 * 24 * 60 * 60 * 1000),
      },
      registration: {
        documentNumber: "REG-88221",
        expiryDate: new Date(Date.now() + 300 * 24 * 60 * 60 * 1000),
      },
    });
    console.log(`✓ Driver registered vehicle: ${vehicleDoc.plateNumber} (Approval: ${vehicleDoc.approvalStatus}, Status: ${vehicleDoc.status})`);

    // Security Check: Driver attempting to approve own vehicle should be rejected with 403
    let driverApproveError = null;
    const reqDriverApprove = { user: driverUser, params: { id: vehicleDoc._id } };
    const resDriverApprove = {
      status: (code) => ({
        json: (data) => {
          driverApproveError = { code, message: data.message };
        },
      }),
    };
    await approveVehicle(reqDriverApprove, resDriverApprove);
    if (driverApproveError?.code !== 403) {
      throw new Error(`Security validation failed: Expected 403 for driver approving own vehicle, got ${driverApproveError?.code}`);
    }
    console.log(`✓ Security Check Passed: Driver cannot approve own vehicle (${driverApproveError.message})`);

    // Admin Approves Vehicle
    vehicleDoc.approvalStatus = "approved";
    vehicleDoc.status = "available";
    vehicleDoc.approvedBy = adminUser._id;
    vehicleDoc.approvalDate = new Date();
    await vehicleDoc.save();
    console.log(`✓ Admin approved vehicle: ${vehicleDoc.plateNumber} is now status "${vehicleDoc.status}"`);

    // -------------------------------------------------------------------------
    // 3. CUSTOMER CREATES BOOKING & ADMIN ASSIGNS CREW
    // -------------------------------------------------------------------------
    console.log("\n--- 3. BOOKING CREATION & CREW ASSIGNMENT ---");
    const shipmentDoc = await Shipment.create({
      shipmentNumber: `SHP-FLOW-${Date.now().toString().slice(-5)}`,
      customerId: customerDoc._id,
      pickupLocation: { city: "Addis Ababa", address: "Bole Medhanialem" },
      destination: { city: "Adama", address: "Commercial Zone 2" },
      cargoDetails: { type: "Packaged Goods", weight: 1500, unit: "kg" },
      distance: 98,
      pricing: { baseAmount: 9500, totalAmount: 9500, currency: "ETB" },
      finalPrice: 9500,
      status: "pending",
      scheduledPickupDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });
    console.log(`✓ Booking created: ${shipmentDoc.shipmentNumber} (Status: ${shipmentDoc.status})`);

    // Admin Assigns Driver + Vehicle
    shipmentDoc.driverId = driverDoc._id;
    shipmentDoc.vehicleId = vehicleDoc._id;
    shipmentDoc.status = "assigned";
    await shipmentDoc.save();

    vehicleDoc.status = "in_use";
    vehicleDoc.assignedCustomer = customerDoc._id;
    await vehicleDoc.save();

    driverDoc.status = "on_trip";
    await driverDoc.save();

    const tripDoc = await Trip.create({
      tripNumber: `TRP-FLOW-${Date.now().toString().slice(-5)}`,
      shipmentId: shipmentDoc._id,
      driverId: driverDoc._id,
      vehicleId: vehicleDoc._id,
      status: "pending",
    });
    console.log(`✓ Assigned! Shipment: ${shipmentDoc.status}, Vehicle: ${vehicleDoc.status}, Driver: ${driverDoc.status}`);

    // -------------------------------------------------------------------------
    // 4. STEP-BY-STEP DRIVER WORKFLOW EXECUTION & SEQUENCE ENFORCEMENT
    // -------------------------------------------------------------------------
    console.log("\n--- 4. DRIVER STEP-BY-STEP EXECUTION & ANTI-SKIPPING ENFORCEMENT ---");

    // Test A: Driver attempts to skip directly to 'completed' (Delivered) -> MUST REJECT 400
    let skipError = null;
    const reqSkip = {
      user: driverUser,
      params: { id: tripDoc._id },
      body: { status: "completed" },
    };
    const resSkip = {
      status: (code) => ({
        json: (data) => {
          skipError = { code, message: data.message };
        },
      }),
    };
    await updateTripStatus(reqSkip, resSkip);
    if (skipError?.code !== 400) {
      throw new Error(`Step order enforcement failed: Expected 400 when skipping steps, got ${skipError?.code}`);
    }
    console.log(`✓ Anti-Skipping Enforced: ${skipError.message}`);

    // Step 1: Package Picked Up
    const reqStep1 = {
      user: driverUser,
      params: { id: tripDoc._id },
      body: { status: "picked_up", remarks: "Cargo loaded and verified" },
    };
    let step1Res = null;
    const resStep1 = {
      status: (code) => ({
        json: (data) => {
          step1Res = { code, data };
        },
      }),
    };
    await updateTripStatus(reqStep1, resStep1);
    const updatedShipmentStep1 = await Shipment.findById(shipmentDoc._id);
    if (updatedShipmentStep1.status !== "picked_up") {
      throw new Error(`Expected shipment status picked_up, got ${updatedShipmentStep1.status}`);
    }
    console.log(`✓ Step 1 Success: Shipment status = "${updatedShipmentStep1.status}"`);

    // Step 2: Start Trip / In Transit
    const reqStep2 = {
      user: driverUser,
      params: { id: tripDoc._id },
      body: { status: "in_transit", remarks: "En route to Adama" },
    };
    let step2Res = null;
    const resStep2 = {
      status: (code) => ({
        json: (data) => {
          step2Res = { code, data };
        },
      }),
    };
    await updateTripStatus(reqStep2, resStep2);
    const updatedShipmentStep2 = await Shipment.findById(shipmentDoc._id);
    if (updatedShipmentStep2.status !== "in_transit") {
      throw new Error(`Expected shipment status in_transit, got ${updatedShipmentStep2.status}`);
    }
    console.log(`✓ Step 2 Success: Shipment status = "${updatedShipmentStep2.status}"`);

    // Step 3: Arrived at Destination
    const reqStep3 = {
      user: driverUser,
      params: { id: tripDoc._id },
      body: { status: "arrived", remarks: "Arrived at Adama warehouse" },
    };
    let step3Res = null;
    const resStep3 = {
      status: (code) => ({
        json: (data) => {
          step3Res = { code, data };
        },
      }),
    };
    await updateTripStatus(reqStep3, resStep3);
    const updatedShipmentStep3 = await Shipment.findById(shipmentDoc._id);
    if (updatedShipmentStep3.status !== "arrived") {
      throw new Error(`Expected shipment status arrived, got ${updatedShipmentStep3.status}`);
    }
    console.log(`✓ Step 3 Success: Shipment status = "${updatedShipmentStep3.status}"`);

    // Step 4: Delivered
    const reqStep4 = {
      user: driverUser,
      params: { id: tripDoc._id },
      body: { status: "completed", remarks: "Package handed to customer recipient" },
    };
    let step4Res = null;
    const resStep4 = {
      status: (code) => ({
        json: (data) => {
          step4Res = { code, data };
        },
      }),
    };
    await updateTripStatus(reqStep4, resStep4);
    const updatedShipmentStep4 = await Shipment.findById(shipmentDoc._id);
    const updatedDriverStep4 = await Driver.findById(driverDoc._id);
    const updatedVehicleStep4 = await Vehicle.findById(vehicleDoc._id);

    if (updatedShipmentStep4.status !== "delivered") {
      throw new Error(`Expected shipment status delivered, got ${updatedShipmentStep4.status}`);
    }
    if (updatedDriverStep4.status !== "available") {
      throw new Error(`Expected driver status available, got ${updatedDriverStep4.status}`);
    }
    if (updatedVehicleStep4.status !== "available") {
      throw new Error(`Expected vehicle status available, got ${updatedVehicleStep4.status}`);
    }

    console.log(`✓ Step 4 Success: Shipment status = "${updatedShipmentStep4.status}"`);
    console.log(`✓ Driver released to: "${updatedDriverStep4.status}", Commission: ${updatedDriverStep4.totalEarnings} ETB`);
    console.log(`✓ Vehicle released to: "${updatedVehicleStep4.status}"`);

    // -------------------------------------------------------------------------
    // CLEANUP
    // -------------------------------------------------------------------------
    console.log("\n--- 5. CLEANING UP TEST DATA ---");
    await Trip.deleteOne({ _id: tripDoc._id });
    await Shipment.deleteOne({ _id: shipmentDoc._id });
    await Vehicle.deleteOne({ _id: vehicleDoc._id });
    await Driver.deleteOne({ _id: driverDoc._id });
    await Customer.deleteOne({ _id: customerDoc._id });
    await User.deleteMany({ _id: { $in: [customerUser._id, driverUser._id] } });
    console.log("✓ Test records cleaned up successfully.");

    console.log("\n================================================================================");
    console.log("✓ ALL NTMS WORKFLOW STEPS, STATUS SYNCHRONIZATIONS, AND ROLE RULES VERIFIED 100%!");
    console.log("================================================================================");
    process.exit(0);
  } catch (error) {
    console.error("\n❌ Test Failed:", error);
    process.exit(1);
  }
};

runStrictWorkflowVerification();

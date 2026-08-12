const mongoose = require("mongoose");
require("dotenv").config();

const User = require("../models/User");
const Customer = require("../models/Customer");
const Driver = require("../models/Driver");
const Vehicle = require("../models/Vehicle");
const Shipment = require("../models/Shipment");
const Payment = require("../models/Payment");

async function testAll() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected to MongoDB for Verification");

  try {
    // 1. Check Admin
    let admin = await User.findOne({ role: "admin" });
    if (!admin) {
      admin = await User.create({
        name: "Admin User",
        email: `admin_${Date.now()}@ntms.com`,
        password: "password123",
        phone: "+251911001122",
        role: "admin",
        status: "active",
      });
    }

    // 2. Test Customer Management
    console.log("\n--- Testing Customer Management ---");
    const testEmail = `testcust_${Date.now()}@ntms.com`;
    const custUser = await User.create({
      name: "Test Customer",
      email: testEmail,
      password: "password123",
      phone: "+251911998877",
      role: "customer",
      status: "inactive",
    });

    const custProfile = await Customer.create({
      userId: custUser._id,
      companyName: "Test Trading Plc",
    });

    console.log("✔ Customer Created with Inactive Status");

    // Admin approves customer
    custUser.status = "active";
    await custUser.save();
    console.log("✔ Admin Approved Customer -> Status: active");

    // 3. Test Driver & Vehicle Setup
    console.log("\n--- Testing Driver & Vehicle Association ---");
    let driverUser = await User.findOne({ role: "driver" });
    if (!driverUser) {
      driverUser = await User.create({
        name: "Test Driver",
        email: `driver_${Date.now()}@ntms.com`,
        password: "password123",
        phone: "+251911334455",
        role: "driver",
        status: "active",
      });
    }

    let driver = await Driver.findOne({ userId: driverUser._id });
    if (!driver) {
      driver = await Driver.create({
        userId: driverUser._id,
        fullName: driverUser.name,
        licenseNumber: `DL-${Date.now()}`,
        licenseExpiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        status: "available",
      });
    } else {
      driver.status = "available";
      await driver.save();
    }

    let vehicle = await Vehicle.findOne({ plateNumber: "AA-999-TEST" });
    if (!vehicle) {
      vehicle = await Vehicle.create({
        plateNumber: "AA-999-TEST",
        model: "Volvo FH16",
        manufacturer: "Volvo",
        type: "truck",
        year: 2023,
        fuelType: "diesel",
        color: "White",
        insurance: {
          expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
          policyNumber: "POL-999",
          provider: "Nyala Insurance",
        },
        capacity: { weight: 20000, volume: 50, unit: "kg" },
        status: "available",
        approvalStatus: "approved",
        registeredBy: driver._id,
      });
    } else {
      vehicle.status = "available";
      vehicle.approvalStatus = "approved";
      vehicle.registeredBy = driver._id;
      await vehicle.save();
    }

    console.log(`✔ Driver (${driver.fullName}) & Approved Vehicle (${vehicle.plateNumber}) ready`);

    // 4. Test Shipment Creation, Price Confirmation, and Assignment
    console.log("\n--- Testing Shipment Workflow ---");
    const shipment = await Shipment.create({
      customerId: custProfile._id,
      pickupLocation: { address: "Bole Hub", city: "Addis Ababa" },
      destination: { address: "Adama Port", city: "Adama" },
      cargoDetails: { type: "General Goods", weight: 500, unit: "kg" },
      scheduledPickupDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
      status: "pending",
      pricing: { totalAmount: 4500, currency: "ETB" },
      finalPrice: 4500,
    });

    console.log(`✔ Shipment Created: #${shipment.shipmentNumber}, Status: ${shipment.status}`);

    // Admin Assigns Shipment
    shipment.driverId = driver._id;
    shipment.vehicleId = vehicle._id;
    shipment.status = "assigned";
    await shipment.save();
    console.log(`✔ Shipment #${shipment.shipmentNumber} Assigned to Driver & Vehicle`);

    // 5. Test Payment System
    console.log("\n--- Testing Payment System & Receipts ---");
    const txRef = `NTMS-TX-${Date.now()}-1234`;
    const payment = await Payment.create({
      txRef,
      shipmentId: shipment._id,
      customerId: custProfile._id,
      amount: 4500,
      currency: "ETB",
      status: "PAID",
      paymentMethod: "Chapa",
      paidBy: custUser._id,
      paidAt: new Date(),
      customerDetails: {
        name: custUser.name,
        email: custUser.email,
        phone: custUser.phone,
      },
    });

    shipment.paymentStatus = "PAID";
    await shipment.save();

    console.log(`✔ Payment Created & Marked PAID: TxRef=${payment.txRef}, Receipt=${payment.receiptNumber}`);

    // Test receipt lookup by shipmentId and by txRef
    const isObjectId = Boolean(shipment._id && String(shipment._id).match(/^[0-9a-fA-F]{24}$/));
    const receiptByShipment = await Payment.findOne({
      $or: [
        { txRef: String(shipment._id) },
        { receiptNumber: String(shipment._id) },
        ...(isObjectId ? [{ _id: shipment._id }, { shipmentId: shipment._id }] : []),
      ],
    });

    if (receiptByShipment && receiptByShipment.receiptNumber === payment.receiptNumber) {
      console.log(`✔ Receipt Lookup by Shipment ID PASSED (Receipt: ${receiptByShipment.receiptNumber})`);
    } else {
      throw new Error("Receipt lookup by Shipment ID failed");
    }

    // Clean up test shipment and customer
    await Payment.findByIdAndDelete(payment._id);
    await Shipment.findByIdAndDelete(shipment._id);
    await Customer.findByIdAndDelete(custProfile._id);
    await User.findByIdAndDelete(custUser._id);
    console.log("✔ Test artifacts cleaned up successfully");

    console.log("\n==========================================");
    console.log("All Shipments, Customers, and Payment Tests PASSED!");
    console.log("==========================================");
  } catch (err) {
    console.error("Test Failed:", err);
  } finally {
    await mongoose.disconnect();
  }
}

testAll();

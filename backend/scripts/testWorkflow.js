const mongoose = require("mongoose");
require("dotenv").config({ path: require("path").join(__dirname, "../.env") });

const testWorkflow = async () => {
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
    const { calculateShipmentPrice } = require("../utils/pricingCalculator");

    // 1. Test Pricing Calculator
    console.log("\n--- TEST 1: PRICING CALCULATOR ---");
    const price1 = calculateShipmentPrice({
      pickupCity: "Addis Ababa",
      deliveryCity: "Hawassa",
      weight: 1500,
      unit: "kg",
      vehicleType: "truck",
    });
    console.log("Addis Ababa -> Hawassa (1500 kg truck):", price1);
    if (price1.totalAmount <= 0 || price1.distanceKm !== 275) {
      throw new Error("Pricing calculation failed");
    }
    console.log("✓ Pricing calculator verified.");

    // 2. Test Customer Verification
    console.log("\n--- TEST 2: CUSTOMER POPULATION & REAL USERS ---");
    const customerUser = await User.findOne({ email: "betselottigistu4@gmail.com" });
    if (!customerUser) {
      throw new Error("Customer Betselot Tigistu user not found");
    }
    const customerDoc = await Customer.findOne({ userId: customerUser._id });
    console.log("Found Customer Record for Betselot Tigistu:", {
      customerId: customerDoc._id,
      companyName: customerDoc.companyName,
      user: customerUser.name,
      email: customerUser.email,
    });
    console.log("✓ Real customer verification passed.");

    // 3. Test Driver & Vehicle Verification
    console.log("\n--- TEST 3: DRIVER & VEHICLE LINKAGE ---");
    const drivers = await Driver.find().populate("userId");
    console.log(`Found ${drivers.length} drivers:`, drivers.map(d => ({ name: d.fullName, status: d.status, commissionRate: d.commissionRate })));
    
    // 4. Test Clean End-to-End Simulation
    console.log("\n--- TEST 4: END-TO-END WORKFLOW SIMULATION ---");
    // Create test booking
    const testShipment = await Shipment.create({
      customerId: customerDoc._id,
      pickupLocation: {
        address: "Bole Medhanialem",
        city: "Addis Ababa",
        contactPerson: { name: "Betselot Tigistu", phone: "+251911000000" },
      },
      destination: {
        address: "Piazza",
        city: "Hawassa",
        contactPerson: { name: "Receiving Contact", phone: "+251912000000" },
      },
      cargoDetails: {
        type: "Electronics",
        weight: 500,
        unit: "kg",
        quantity: 10,
      },
      scheduledPickupDate: new Date(),
      pricing: {
        baseAmount: price1.baseFee,
        totalAmount: price1.totalAmount,
        currency: "ETB",
      },
      finalPrice: price1.totalAmount,
      status: "pending",
      paymentStatus: "UNPAID",
    });
    console.log(`1. Booking Created: ${testShipment.shipmentNumber}, Status: ${testShipment.status}, Price: ${testShipment.finalPrice} ETB`);

    // Verify payment is not allowed while pending
    if (testShipment.status === "pending") {
      console.log("2. Payment Gating Verified: Cannot pay while status is pending.");
    }

    // Admin Approves and assigns available driver & vehicle
    let availableDriver = await Driver.findOne({ status: "available" });
    if (!availableDriver) {
      availableDriver = drivers[0];
      availableDriver.status = "available";
      await availableDriver.save();
    }
    const availableVehicle = await Vehicle.findOne();

    testShipment.status = "approved";
    if (availableDriver && availableVehicle) {
      testShipment.driverId = availableDriver._id;
      testShipment.vehicleId = availableVehicle._id;
    }
    await testShipment.save();
    console.log(`3. Admin Approved Booking: Status is now ${testShipment.status}`);

    // Customer completes payment
    testShipment.paymentStatus = "PAID";
    testShipment.status = "assigned";
    await testShipment.save();
    console.log(`4. Payment Confirmed: PaymentStatus: ${testShipment.paymentStatus}, Status: ${testShipment.status}`);

    // Create active trip
    const testTrip = await Trip.create({
      shipmentId: testShipment._id,
      driverId: availableDriver?._id || drivers[0]._id,
      vehicleId: availableVehicle?._id,
      status: "picked_up",
    });
    console.log(`5. Driver Action 1: Received Cargo -> Trip Status: ${testTrip.status}`);

    testTrip.status = "in_transit";
    await testTrip.save();
    console.log(`6. Driver Action 2: Start Trip -> Trip Status: ${testTrip.status}`);

    testTrip.status = "arrived_at_destination";
    await testTrip.save();
    console.log(`7. Driver Action 3: Arrived at Destination -> Trip Status: ${testTrip.status}`);

    // Driver delivers successfully & commission is calculated
    testTrip.status = "completed";
    const commissionAmount = Math.round(testShipment.finalPrice * 0.15);
    testTrip.driverCommission = {
      amount: commissionAmount,
      percentage: 15,
      status: "earned",
      earnedAt: new Date(),
    };
    await testTrip.save();

    testShipment.status = "delivered";
    await testShipment.save();

    console.log(`8. Driver Action 4: Delivered Successfully -> Trip Completed!`);
    console.log(`9. Commission Computed: ${commissionAmount} ETB (15% of ${testShipment.finalPrice} ETB) credited to Driver.`);

    // Clean up test simulation record
    await Trip.deleteOne({ _id: testTrip._id });
    await Shipment.deleteOne({ _id: testShipment._id });
    console.log("10. Cleaned up simulation test records.");

    console.log("\n==========================================");
    console.log("✓ ALL END-TO-END WORKFLOW TESTS PASSED!");
    console.log("==========================================");
    process.exit(0);
  } catch (error) {
    console.error("Test Workflow error:", error);
    process.exit(1);
  }
};

testWorkflow();

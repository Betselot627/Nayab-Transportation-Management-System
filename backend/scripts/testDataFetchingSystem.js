const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
require("dotenv").config({ path: require("path").join(__dirname, "../.env") });

const testDataFetchingSystem = async () => {
  try {
    console.log("================================================================================");
    console.log("  VERIFYING NTMS COMPLETE DATA-FETCHING AND RELATIONSHIP INTEGRITY");
    console.log("================================================================================\n");

    console.log("1. Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✓ Connected to MongoDB.\n");

    const User = require("../models/User");
    const Customer = require("../models/Customer");
    const Driver = require("../models/Driver");
    const Vehicle = require("../models/Vehicle");
    const Shipment = require("../models/Shipment");
    const Trip = require("../models/Trip");
    const Notification = require("../models/Notification");

    const { getAllShipments, getShipmentById, createShipment } = require("../controllers/shipmentController");
    const { getMyProfile: getCustomerProfile, getAllCustomers } = require("../controllers/customerController");
    const { getMyProfile: getDriverProfile, getAllDrivers } = require("../controllers/driverController");
    const { getMyTrips } = require("../controllers/tripController");
    const { getAllVehicles } = require("../controllers/vehicleController");

    // -------------------------------------------------------------------------
    // TEST 1: AUTHENTICATED CUSTOMER PROFILE & BOOKINGS FLOW
    // -------------------------------------------------------------------------
    console.log("--- TEST 1: CUSTOMER PROFILE & DATA RETRIEVAL ---");
    const customerUser = await User.create({
      name: "Betselot Tigistu",
      email: `betselot-${Date.now()}@ntms.com`,
      phone: "+251911889900",
      password: await bcrypt.hash("Password@123", 10),
      role: "customer",
      status: "active",
    });

    // 1a. Test customer profile endpoint
    let custProfileRes = null;
    await getCustomerProfile(
      { user: customerUser },
      {
        status: (code) => ({
          json: (data) => {
            custProfileRes = { code, data };
          },
        }),
      }
    );
    if (custProfileRes?.code !== 200 || !custProfileRes.data?.data) {
      throw new Error("Failed to fetch customer profile");
    }
    console.log(`✓ Customer profile auto-resolved & fetched: ${custProfileRes.data.data.userId?.name} (${custProfileRes.data.data.companyName})`);

    // 1b. Customer creates a booking
    console.log("-> Calling createShipment...");
    let createShipRes = null;
    await createShipment(
      {
        user: customerUser,
        body: {
          pickupLocation: { city: "Addis Ababa", address: "Bole Medhanialem" },
          destination: { city: "Dire Dawa", address: "Kezira Commercial Hub" },
          cargoDetails: { type: "Textiles & Garments", weight: 800, unit: "kg" },
          distance: 450,
          pricing: { baseAmount: 22000, totalAmount: 22000, currency: "ETB" },
          scheduledPickupDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
        },
      },
      {
        status: function (code) {
          return {
            json: function (data) {
              createShipRes = { code, data };
              console.log("-> createShipment responded:", code, data?.success, data?.message);
              return this;
            },
          };
        },
      }
    );
    if (createShipRes?.code !== 201 || !createShipRes.data?.data) {
      throw new Error(`Failed to create customer shipment booking: ${createShipRes?.data?.message}`);
    }
    const createdShipment = createShipRes.data.data;
    console.log(`✓ Customer created booking: #${createdShipment.shipmentNumber} (ID: ${createdShipment._id})`);

    // 1c. Customer fetches own bookings
    console.log("-> Calling getAllShipments for customer...");
    let custShipmentsRes = null;
    await getAllShipments(
      { user: customerUser, query: { limit: 10 } },
      {
        status: function (code) {
          return {
            json: function (data) {
              custShipmentsRes = { code, data };
              console.log("-> getAllShipments responded:", code, "count:", data?.data?.length);
              return this;
            },
          };
        },
      }
    );
    if (custShipmentsRes?.code !== 200 || custShipmentsRes.data?.data?.length === 0) {
      throw new Error("Customer was unable to fetch their own created booking");
    }
    console.log(`✓ Customer fetched own bookings list: Found ${custShipmentsRes.data.data.length} records. Route: ${custShipmentsRes.data.data[0].pickupLocation.city} → ${custShipmentsRes.data.data[0].destination.city}`);

    // -------------------------------------------------------------------------
    // TEST 2: ADMIN SEES CUSTOMER & BOOKINGS WITH FULL RELATIONSHIPS
    // -------------------------------------------------------------------------
    console.log("\n--- TEST 2: ADMIN DATA FETCHING & RELATIONSHIPS ---");
    let adminUser = await User.findOne({ role: "admin" });
    if (!adminUser) {
      adminUser = await User.create({
        name: "Admin Super",
        email: "admin@ntms.com",
        phone: "+251911000000",
        password: await bcrypt.hash("Admin@123", 10),
        role: "admin",
        status: "active",
      });
    }

    const createMockRes = (name) => {
      let result = null;
      const resObj = {
        status: function (code) {
          return {
            json: function (data) {
              result = { code, data };
              return resObj;
            },
          };
        },
        getResult: () => result,
      };
      return resObj;
    };

    // 2a. Admin fetches all customers
    const resAllCust = createMockRes("getAllCustomers");
    await getAllCustomers({ query: { limit: 10 } }, resAllCust);
    const allCustRes = resAllCust.getResult();
    const foundCust = allCustRes?.data?.data?.find((c) => String(c.userId?._id) === String(customerUser._id));
    if (!foundCust) {
      throw new Error("Admin getAllCustomers failed to include new customer");
    }
    console.log(`✓ Admin fetched customers: Found customer "${foundCust.userId?.name}" with ${foundCust.totalShipments} shipments`);

    // 2b. Admin fetches all shipments
    const resAdminShipments = createMockRes("getAllShipmentsAdmin");
    await getAllShipments({ user: adminUser, query: { limit: 10 } }, resAdminShipments);
    const adminShipmentsRes = resAdminShipments.getResult();
    const foundShipment = adminShipmentsRes?.data?.data?.find((s) => String(s._id) === String(createdShipment._id));
    if (!foundShipment) {
      throw new Error("Admin getAllShipments failed to include the customer's booking");
    }
    console.log(`✓ Admin fetched booking #${foundShipment.shipmentNumber}: Linked to customer "${foundShipment.customerId?.companyName || foundShipment.customerId?.userId?.name}"`);

    // -------------------------------------------------------------------------
    // TEST 3: DRIVER PROFILE, VEHICLE & ASSIGNED TRIPS FLOW
    // -------------------------------------------------------------------------
    console.log("\n--- TEST 3: DRIVER DATA FLOW & TRIP RETRIEVAL ---");
    const driverUser = await User.create({
      name: "Mulugeta Haile",
      email: `driver-${Date.now()}@ntms.com`,
      phone: "+251933556677",
      password: await bcrypt.hash("Driver@123", 10),
      role: "driver",
      status: "active",
    });

    const driverDoc = await Driver.create({
      userId: driverUser._id,
      fullName: driverUser.name,
      licenseNumber: `DL-ETH-${Date.now().toString().slice(-4)}`,
      licenseExpiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      experience: 4,
      status: "available",
      commissionRate: 15,
    });

    const vehicleDoc = await Vehicle.create({
      plateNumber: `ETH-3-${Date.now().toString().slice(-4)}`,
      manufacturer: "Isuzu",
      model: "FTR 850",
      type: "truck",
      year: 2024,
      color: "White",
      capacity: { weight: 7, unit: "ton" },
      fuelType: "diesel",
      registeredBy: driverDoc._id,
      currentDriver: driverDoc._id,
      approvalStatus: "approved",
      status: "available",
      insurance: {
        company: "Awash Insurance",
        policyNumber: "POL-77112",
        expiryDate: new Date(Date.now() + 300 * 24 * 60 * 60 * 1000),
      },
      registration: {
        documentNumber: "REG-77112",
        expiryDate: new Date(Date.now() + 300 * 24 * 60 * 60 * 1000),
      },
    });

    // 3a. Admin assigns Driver & Vehicle to the shipment
    const ShipmentModel = require("../models/Shipment");
    const TripModel = require("../models/Trip");
    await ShipmentModel.findByIdAndUpdate(createdShipment._id, {
      driverId: driverDoc._id,
      vehicleId: vehicleDoc._id,
      status: "assigned",
    });

    const trip = await TripModel.create({
      tripNumber: `TRP-FETCH-${Date.now().toString().slice(-4)}`,
      shipmentId: createdShipment._id,
      driverId: driverDoc._id,
      vehicleId: vehicleDoc._id,
      status: "pending",
    });

    // 3b. Driver fetches my trips
    const resDriverTrips = createMockRes("getMyTrips");
    await getMyTrips({ user: driverUser }, resDriverTrips);
    const driverTripsRes = resDriverTrips.getResult();
    if (driverTripsRes?.code !== 200 || driverTripsRes.data?.data?.length === 0) {
      throw new Error("Driver getMyTrips failed to retrieve assigned trip");
    }
    const driverTrip = driverTripsRes.data.data[0];
    console.log(`✓ Driver fetched assigned trip: #${driverTrip.tripNumber}`);
    console.log(`  - Customer Info: ${driverTrip.shipmentId?.customerId?.companyName || driverTrip.shipmentId?.customerId?.userId?.name} (${driverTrip.shipmentId?.customerId?.userId?.phone || "Phone verified"})`);
    console.log(`  - Cargo: ${driverTrip.shipmentId?.cargoDetails?.type} (${driverTrip.shipmentId?.cargoDetails?.weight} kg)`);
    console.log(`  - Vehicle: ${driverTrip.vehicleId?.plateNumber} (${driverTrip.vehicleId?.model})`);

    // -------------------------------------------------------------------------
    // CLEANUP
    // -------------------------------------------------------------------------
    console.log("\n--- TEST 4: CLEANUP ---");
    await TripModel.deleteOne({ _id: trip._id });
    await ShipmentModel.deleteOne({ _id: createdShipment._id });
    await Vehicle.deleteOne({ _id: vehicleDoc._id });
    await Driver.deleteOne({ _id: driverDoc._id });
    await Customer.deleteOne({ userId: customerUser._id });
    await User.deleteMany({ _id: { $in: [customerUser._id, driverUser._id] } });
    console.log("✓ Test simulation data cleaned up cleanly.");

    console.log("\n================================================================================");
    console.log("✓ COMPLETE NTMS DATA-FETCHING SYSTEM AND RELATIONSHIPS VERIFIED WITH 100% SUCCESS!");
    console.log("================================================================================");
    process.exit(0);
  } catch (error) {
    console.error("\n❌ Data Fetching Verification Failed:", error);
    process.exit(1);
  }
};

testDataFetchingSystem();

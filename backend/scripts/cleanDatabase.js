const prisma = require("../config/prisma");
require("dotenv").config({ path: require("path").join(__dirname, "../.env") });

const cleanDatabase = async () => {
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

    // 1. Find and delete fake/dummy test users
    const deleteQuery = {
      $or: [
        { email: { $in: ["test@example.com", "customer@ntms.com", "driver@ntms.com"] } },
        { email: { $regex: "^api_test_", $options: "i" } },
        { name: { $regex: "^API Test", $options: "i" } },
        { name: { $regex: "^Test User", $options: "i" } },
        { name: { $regex: "^Test Customer", $options: "i" } },
        { name: { $regex: "^Test Driver", $options: "i" } },
      ],
    };

    const usersToDelete = await User.find(deleteQuery);
    const userIdsToDelete = usersToDelete.map((u) => u._id);
    console.log(`Found ${usersToDelete.length} test users to delete.`);

    if (userIdsToDelete.length > 0) {
      await Customer.deleteMany({ userId: { $in: userIdsToDelete } });
      await Driver.deleteMany({ userId: { $in: userIdsToDelete } });
      await User.deleteMany({ _id: { $in: userIdsToDelete } });
      console.log("Deleted test users and their profiles.");
    }

    // 2. Remove orphaned customer and driver profiles with no valid userId
    const allUsers = await User.find().select("_id");
    const validUserIds = allUsers.map((u) => u._id.toString());

    const orphanedCustomers = await Customer.find();
    for (const cust of orphanedCustomers) {
      if (!cust.userId || !validUserIds.includes(cust.userId.toString())) {
        console.log(`Removing orphaned customer profile ${cust._id}`);
        await Customer.deleteOne({ _id: cust._id });
      }
    }

    const orphanedDrivers = await Driver.find();
    for (const d of orphanedDrivers) {
      if (!d.userId || !validUserIds.includes(d.userId.toString())) {
        console.log(`Removing orphaned driver profile ${d._id}`);
        await Driver.deleteOne({ _id: d._id });
      }
    }

    // 3. Ensure all real customer users have a valid Customer document with complete name
    const customerUsers = await User.find({ role: "customer" });
    for (const user of customerUsers) {
      let cust = await Customer.findOne({ userId: user._id });
      if (!cust) {
        cust = await Customer.create({
          userId: user._id,
          companyName: user.name,
          contactPerson: {
            name: user.name,
            phone: user.phone || "+251911000000",
            email: user.email,
          },
          address: {
            city: "Addis Ababa",
            country: "Ethiopia",
          },
        });
        console.log(`Created missing Customer profile for ${user.name} (${user.email})`);
      } else {
        if (!cust.companyName) {
          cust.companyName = user.name;
        }
        if (!cust.contactPerson?.name) {
          cust.contactPerson = {
            name: user.name,
            phone: user.phone || "+251911000000",
            email: user.email,
          };
        }
        await cust.save();
        console.log(`Updated Customer profile for ${user.name} (${user.email})`);
      }
    }

    // 4. Ensure all real driver users have a valid Driver document
    const driverUsers = await User.find({ role: "driver" });
    for (const user of driverUsers) {
      let driver = await Driver.findOne({ userId: user._id });
      if (!driver) {
        driver = await Driver.create({
          userId: user._id,
          fullName: user.name,
          licenseNumber: `DL-${user._id.toString().substring(18).toUpperCase()}`,
          licenseExpiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
          experience: 3,
          status: "available",
          commissionRate: 15,
          totalEarnings: 0,
        });
        console.log(`Created missing Driver profile for ${user.name} (${user.email})`);
      } else {
        driver.fullName = user.name;
        if (!driver.commissionRate) driver.commissionRate = 15;
        await driver.save();
        console.log(`Updated Driver profile for ${user.name} (${user.email})`);
      }
    }

    console.log("Database cleanup & synchronization complete!");
    process.exit(0);
  } catch (error) {
    console.error("Cleanup error:", error);
    process.exit(1);
  }
};

cleanDatabase();

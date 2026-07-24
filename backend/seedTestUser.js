const mongoose = require("mongoose");
const User = require("./models/User");
require("dotenv").config();

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ MongoDB Connected");
  } catch (error) {
    console.error("❌ MongoDB Connection Failed:", error.message);
    process.exit(1);
  }
};

// Create test users
const seedUsers = async () => {
  try {
    await connectDB();

    // Check if users already exist
    const existingAdmin = await User.findOne({ email: "admin@ntms.com" });
    const existingCustomer = await User.findOne({ email: "customer@ntms.com" });
    const existingDriver = await User.findOne({ email: "driver@ntms.com" });

    // Create Admin if doesn't exist
    if (!existingAdmin) {
      const admin = await User.create({
        name: "Admin User",
        email: "admin@ntms.com",
        password: "admin123",
        phone: "03001234567",
        role: "admin",
        status: "active",
      });
      console.log("✅ Admin created:", admin.email);
    } else {
      console.log("ℹ️  Admin already exists:", existingAdmin.email);
    }

    // Create Customer if doesn't exist
    if (!existingCustomer) {
      const customer = await User.create({
        name: "Customer User",
        email: "customer@ntms.com",
        password: "customer123",
        phone: "03009876543",
        role: "customer",
        status: "active",
      });
      console.log("✅ Customer created:", customer.email);
    } else {
      console.log("ℹ️  Customer already exists:", existingCustomer.email);
    }

    // Create Driver if doesn't exist
    if (!existingDriver) {
      const driver = await User.create({
        name: "Driver User",
        email: "driver@ntms.com",
        password: "driver123",
        phone: "03005555555",
        role: "driver",
        status: "active",
      });
      console.log("✅ Driver created:", driver.email);
    } else {
      console.log("ℹ️  Driver already exists:", existingDriver.email);
    }

    console.log("\n📝 Test Credentials:");
    console.log("Admin: admin@ntms.com / admin123");
    console.log("Customer: customer@ntms.com / customer123");
    console.log("Driver: driver@ntms.com / driver123");
    console.log("\n✅ Seeding complete!");

    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding users:", error.message);
    process.exit(1);
  }
};

seedUsers();

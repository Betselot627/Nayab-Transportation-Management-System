const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
require("dotenv").config({ path: "backend/.env" });

async function checkAdmin() {
  console.log("Connecting to MongoDB...");
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected.");

  const User = require("../models/User");

  const admins = await User.find({ role: "admin" }).select("+password");
  console.log("Admins found:", admins.length);

  for (const admin of admins) {
    console.log(`- Email: ${admin.email}`);
    console.log(`  Name: ${admin.name}`);
    console.log(`  Status: ${admin.status}`);
    console.log(`  Has password: ${!!admin.password}`);

    const isMatch123456 = bcrypt.compareSync("Admin@123456", admin.password);
    console.log(`  Password matches "Admin@123456": ${isMatch123456}`);

    const isMatch123 = bcrypt.compareSync("Admin@123", admin.password);
    console.log(`  Password matches "Admin@123": ${isMatch123}`);
  }

  await mongoose.disconnect();
  console.log("Disconnected.");
}

checkAdmin().catch(console.error);

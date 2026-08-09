const mongoose = require("mongoose");

/**
 * Database Connection Configuration
 *
 * Purpose: Establishes connection to MongoDB Atlas
 * - Uses Mongoose ODM for schema-based data modeling
 * - Implements connection error handling
 * - Logs connection status
 */
const connectDB = async () => {
  // Pre-register all models to prevent MissingSchemaError on population
  try {
    require("../models/User");
    require("../models/Customer");
    require("../models/Driver");
    require("../models/Vehicle");
    require("../models/Shipment");
    require("../models/Trip");
    require("../models/Maintenance");
    require("../models/Payment");
    require("../models/Notification");
  } catch (schemaErr) {
    console.error("Model registration note:", schemaErr.message);
  }

  mongoose.connection.on("disconnected", () => {
    console.warn("⚠️ MongoDB disconnected. Attempting to reconnect...");
  });

  mongoose.connection.on("reconnected", () => {
    console.log("✅ MongoDB reconnected successfully");
  });

  mongoose.connection.on("error", (err) => {
    console.error("⚠️ MongoDB connection event error:", err.message);
  });

  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    console.log(`📊 Database: ${conn.connection.name}`);
  } catch (error) {
    console.error(`⚠️ Initial MongoDB Connection Error: ${error.message}`);
    console.log("Will retry connecting in 5 seconds...");
    setTimeout(connectDB, 5000);
  }
};

module.exports = connectDB;

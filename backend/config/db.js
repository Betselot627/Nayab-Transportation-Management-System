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
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    console.log(`📊 Database: ${conn.connection.name}`);

    // Pre-register all models to prevent MissingSchemaError on population
    require("../models/User");
    require("../models/Customer");
    require("../models/Driver");
    require("../models/Vehicle");
    require("../models/Shipment");
    require("../models/Trip");
    require("../models/Maintenance");
    require("../models/Payment");
    require("../models/Notification");
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;

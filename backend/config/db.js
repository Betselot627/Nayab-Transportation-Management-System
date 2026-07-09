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
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;

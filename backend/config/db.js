const prisma = require("./prisma");

/**
 * Database Connection Configuration
 *
 * Purpose: Establishes connection to Neon PostgreSQL via Prisma Client
 * - Implements connection error handling
 * - Logs connection status
 */
const connectDB = async () => {
  try {
    await prisma.$connect();
    console.log("✅ PostgreSQL Connected successfully via Prisma");
  } catch (error) {
    console.error(`⚠️ Initial PostgreSQL Connection Error: ${error.message}`);
    console.log("Will retry connecting in 5 seconds...");
    setTimeout(connectDB, 5000);
  }
};

module.exports = connectDB;

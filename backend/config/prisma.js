require("dotenv").config({ path: require("path").join(__dirname, "../.env"), override: true });
const { PrismaClient } = require("@prisma/client");

/**
 * Global Prisma Client Initialization
 *
 * Purpose: Exposes a single, shared Prisma connection instance
 * - Automatically connects to PostgreSQL/Neon
 * - Manages connection pooling
 *
 * NOTE: PostgreSQL is the primary database. All models are accessed through
 * the Mongoose-style adapter in dbAdapter.js, which is built on this client.
 */

let prisma;

try {
  // Only initialize if DATABASE_URL is configured
  if (process.env.DATABASE_URL) {
    prisma = new PrismaClient({
      log:
        process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
    });
  } else {
    console.warn(
      "⚠️  Prisma DATABASE_URL not configured. Running with a no-op client.",
    );
    // Create a mock prisma object to prevent errors
    prisma = {
      $connect: async () => console.log("Prisma skipped - no DATABASE_URL"),
      $disconnect: async () => {},
    };
  }
} catch (error) {
  console.warn("⚠️  Prisma initialization skipped:", error.message);
  prisma = {
    $connect: async () => {},
    $disconnect: async () => {},
  };
}

module.exports = prisma;

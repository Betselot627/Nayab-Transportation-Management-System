const { PrismaClient } = require("@prisma/client");

/**
 * Global Prisma Client Initialization
 *
 * Purpose: Exposes a single, shared Prisma connection instance
 * - Automatically connects to PostgreSQL/Neon
 * - Manages connection pooling
 *
 * NOTE: This project now uses MongoDB/Mongoose as the primary database.
 * Prisma is kept for legacy compatibility but is not actively used.
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
      "⚠️  Prisma DATABASE_URL not configured. Using MongoDB/Mongoose instead.",
    );
    // Create a mock prisma object to prevent errors
    prisma = {
      $connect: async () => console.log("Prisma skipped - using MongoDB"),
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

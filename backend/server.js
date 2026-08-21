const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

require("dotenv").config();

const connectDB = require("./config/db");
const { notFound, errorHandler } = require("./middleware/errorMiddleware");

/**
 * Nayab Transportation Management System - Backend Server
 *
 * Technology Stack:
 * - Node.js + Express.js
 * - PostgreSQL (Neon) via Prisma, behind a Mongoose-style adapter (config/dbAdapter.js)
 * - JWT Authentication
 * - Cloudinary File Upload
 *
 * Features:
 * - Role-based access control (Admin, Dispatcher, Driver, Customer)
 * - Shipment management and tracking
 * - Vehicle fleet management
 * - Driver assignment and trip tracking
 * - Payment processing
 * - Maintenance scheduling
 * - Real-time notifications
 */

// Initialize Express app
const app = express();

// Connect to PostgreSQL (via Prisma)
connectDB();

const path = require("path");
const fs = require("fs");

// Security Middleware
app.use(
  helmet({
    crossOriginResourcePolicy: false,
    contentSecurityPolicy: false,
  }),
); // Set security HTTP headers


// Rate limiting (generous for active dashboard usage)
const limiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 1000, // Limit each IP to 1000 requests per windowMs
  message: {
    success: false,
    message: "Too many requests from this IP, please try again later",
  },
});
app.use("/api/", limiter);

// CORS Configuration - allowlist based (FRONTEND_URL + local development origins)
const allowedOrigins = new Set(
  [
    process.env.FRONTEND_URL,
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "https://nayab-transportation-management-sys.vercel.app",
  ].filter(Boolean),
);

const isPrivateNetworkOrigin = (origin) => {
  try {
    const { hostname } = new URL(origin);
    return (
      hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      hostname === "[::1]" ||
      /^192\.168\./.test(hostname) ||
      /^10\./.test(hostname) ||
      /^172\.(1[6-9]|2\d|3[01])\./.test(hostname)
    );
  } catch {
    return false;
  }
};

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow non-browser requests (curl, health checks) and same-origin
      if (!origin) return callback(null, true);
      if (
        allowedOrigins.has(origin) ||
        (process.env.NODE_ENV !== "production" && isPrivateNetworkOrigin(origin))
      ) {
        return callback(null, true);
      }
      return callback(null, false);
    },
    credentials: true,
    optionsSuccessStatus: 200,
  }),
);

// Body Parser Middleware with high limit for base64 images and documents
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Serve frontend build if dist folder exists
const frontendDistPath = path.join(__dirname, "../frontend/dist");
if (fs.existsSync(frontendDistPath)) {
  app.use(express.static(frontendDistPath));
}

// API Root Route
app.get("/api", (req, res) => {
  res.json({
    message: "Nayab Transportation Management System API",
    version: "1.0.0",
    status: "Running",
    endpoints: {
      auth: "/api/auth",
      users: "/api/users",
      customers: "/api/customers",
      drivers: "/api/drivers",
      vehicles: "/api/vehicles",
      shipments: "/api/shipments",
      trips: "/api/trips",
      maintenance: "/api/maintenance",
      payments: "/api/payments",
      notifications: "/api/notifications",
      reports: "/api/reports",
    },
  });
});

// Import and use all API routes (see routes/index.js)
app.use("/api", require("./routes/index"));

// Catch-all for non-API routes to serve SPA index.html if dist exists
if (fs.existsSync(frontendDistPath)) {
  app.get("*", (req, res, next) => {
    if (req.originalUrl.startsWith("/api")) {
      return next();
    }
    res.sendFile(path.join(frontendDistPath, "index.html"));
  });
}

// Error Handling Middleware for API routes
app.use(notFound); // 404 handler for unmatched API routes
app.use(errorHandler); // Global error handler

// Start Server
const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, "0.0.0.0", () => {
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("  🚛 NTMS Backend Server Started");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`  📍 Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(`  🌐 Server URL: http://localhost:${PORT}`);
  console.log(`  🔗 API Base: http://localhost:${PORT}/api`);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
});

// Handle unhandled promise rejections gracefully without crashing the server
process.on("unhandledRejection", (err) => {
  console.error("⚠️ Unhandled Rejection (Server Kept Running):", err?.message || err);
  if (err?.stack) {
    console.error(err.stack);
  }
});

// Handle uncaught exceptions gracefully without crashing the server
process.on("uncaughtException", (err) => {
  console.error("⚠️ Uncaught Exception (Server Kept Running):", err?.message || err);
  if (err?.stack) {
    console.error(err.stack);
  }
});

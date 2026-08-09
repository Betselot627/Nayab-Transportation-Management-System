const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const mongoSanitize = require("express-mongo-sanitize");
require("dotenv").config();

const connectDB = require("./config/db");
const { notFound, errorHandler } = require("./middleware/errorMiddleware");

/**
 * Nayab Transportation Management System - Backend Server
 *
 * Technology Stack:
 * - Node.js + Express.js
 * - MongoDB + Mongoose
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

// Connect to MongoDB
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
app.use(mongoSanitize()); // Prevent MongoDB injection

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

// CORS Configuration
app.use(
  cors({
    origin: true, // Allow any origin dynamically to support any local testing port and network IPs
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

// Import and use routes
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/users", require("./routes/userRoutes"));
app.use("/api/customers", require("./routes/customerRoutes"));
app.use("/api/drivers", require("./routes/driverRoutes"));
app.use("/api/vehicles", require("./routes/vehicleRoutes"));
app.use("/api/shipments", require("./routes/shipmentRoutes"));
app.use("/api/trips", require("./routes/tripRoutes"));
app.use("/api/maintenance", require("./routes/maintenanceRoutes"));
app.use("/api/payments", require("./routes/paymentRoutes"));
app.use("/api/notifications", require("./routes/notificationRoutes"));
app.use("/api/reports", require("./routes/reportRoutes"));

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

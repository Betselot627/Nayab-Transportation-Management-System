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

// Security Middleware
app.use(helmet()); // Set security HTTP headers
app.use(mongoSanitize()); // Prevent MongoDB injection

// Rate limiting
const limiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP, please try again later",
});
app.use("/api/", limiter);

// CORS Configuration
const corsOptions = {
  origin: process.env.FRONTEND_URL || "http://localhost:5173",
  credentials: true,
  optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));

// Body Parser Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Routes
app.get("/", (req, res) => {
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

// Error Handling Middleware
app.use(notFound); // 404 handler
app.use(errorHandler); // Global error handler

// Start Server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("  🚛 NTMS Backend Server Started");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`  📍 Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(`  🌐 Server URL: http://localhost:${PORT}`);
  console.log(`  🔗 API Base: http://localhost:${PORT}/api`);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
});

// Handle unhandled promise rejections
process.on("unhandledRejection", (err) => {
  console.error("❌ Unhandled Rejection:", err.message);
  // Close server & exit process
  process.exit(1);
});

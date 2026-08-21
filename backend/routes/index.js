const express = require("express");
const router = express.Router();

const authRoutes = require("./authRoutes");
const userRoutes = require("./userRoutes");
const customerRoutes = require("./customerRoutes");
const driverRoutes = require("./driverRoutes");
const vehicleRoutes = require("./vehicleRoutes");
const shipmentRoutes = require("./shipmentRoutes");
const tripRoutes = require("./tripRoutes");
const maintenanceRoutes = require("./maintenanceRoutes");
const paymentRoutes = require("./paymentRoutes");
const notificationRoutes = require("./notificationRoutes");
const reportRoutes = require("./reportRoutes");

router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/customers", customerRoutes);
router.use("/drivers", driverRoutes);
router.use("/vehicles", vehicleRoutes);
router.use("/shipments", shipmentRoutes);
router.use("/trips", tripRoutes);
router.use("/maintenance", maintenanceRoutes);
router.use("/payments", paymentRoutes);
router.use("/notifications", notificationRoutes);
router.use("/reports", reportRoutes);

router.get("/health", (req, res) => {
  res.json({ status: "OK", message: "Server is running" });
});

module.exports = router;

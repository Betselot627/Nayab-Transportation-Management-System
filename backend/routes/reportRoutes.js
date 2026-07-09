const express = require("express");
const router = express.Router();
const {
  getDashboardStats,
  getFinancialReport,
  getDriverPerformance,
  getVehicleUtilization,
  getMonthlyReport,
} = require("../controllers/reportController");
const { protect } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");

/**
 * Reports and Analytics Routes
 *
 * Base URL: /api/reports
 * Access: Admin only
 */

router.use(protect);
router.use(authorize("admin"));

router.get("/dashboard", getDashboardStats);
router.get("/financial", getFinancialReport);
router.get("/driver-performance", getDriverPerformance);
router.get("/vehicle-utilization", getVehicleUtilization);
router.get("/monthly", getMonthlyReport);

module.exports = router;

const express = require("express");
const router = express.Router();
const {
  getAllDrivers,
  getDriverById,
  createDriver,
  updateDriver,
  deleteDriver,
  updateDriverStatus,
  getAvailableDrivers,
} = require("../controllers/driverController");
const { protect } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");

/**
 * Driver Management Routes
 *
 * Base URL: /api/drivers
 *
 * Access Control:
 * - GET: Admin, Dispatcher
 * - POST/PUT/DELETE: Admin only
 */

router.use(protect);

router
  .route("/")
  .get(authorize("admin", "dispatcher"), getAllDrivers)
  .post(authorize("admin"), createDriver);

router.get("/available", authorize("admin", "dispatcher"), getAvailableDrivers);

router
  .route("/:id")
  .get(authorize("admin", "dispatcher"), getDriverById)
  .put(authorize("admin"), updateDriver)
  .delete(authorize("admin"), deleteDriver);

router.put("/:id/status", authorize("admin", "driver"), updateDriverStatus);

module.exports = router;

const express = require("express");
const router = express.Router();
const {
  getAllMaintenance,
  getMaintenanceById,
  createMaintenance,
  updateMaintenance,
  deleteMaintenance,
  getVehicleMaintenanceHistory,
  getUpcomingMaintenance,
  getMaintenanceStats,
} = require("../controllers/maintenanceController");
const { protect } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");

/**
 * Maintenance Management Routes
 *
 * Base URL: /api/maintenance
 * Access: Admin only
 */

router.use(protect);
router.use(authorize("admin"));

router.route("/").get(getAllMaintenance).post(createMaintenance);

router.get("/upcoming", getUpcomingMaintenance);
router.get("/stats", getMaintenanceStats);
router.get("/vehicle/:vehicleId", getVehicleMaintenanceHistory);

router
  .route("/:id")
  .get(getMaintenanceById)
  .put(updateMaintenance)
  .delete(deleteMaintenance);

module.exports = router;

const express = require("express");
const router = express.Router();
const {
  getAllVehicles,
  getVehicleById,
  createVehicle,
  updateVehicle,
  deleteVehicle,
  updateVehicleStatus,
  getVehicleStats,
} = require("../controllers/vehicleController");
const { protect } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");

/**
 * Vehicle Management Routes
 *
 * Base URL: /api/vehicles
 *
 * Access Control:
 * - GET: Admin, Dispatcher
 * - POST/PUT/DELETE: Admin only
 */

router.use(protect);

router
  .route("/")
  .get(authorize("admin", "dispatcher"), getAllVehicles)
  .post(authorize("admin"), createVehicle);

router.get("/stats", authorize("admin"), getVehicleStats);

router
  .route("/:id")
  .get(authorize("admin", "dispatcher"), getVehicleById)
  .put(authorize("admin"), updateVehicle)
  .delete(authorize("admin"), deleteVehicle);

router.put("/:id/status", authorize("admin"), updateVehicleStatus);

module.exports = router;

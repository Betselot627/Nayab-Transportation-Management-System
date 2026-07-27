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
  approveVehicle,
  rejectVehicle,
  getPendingVehicles,
  assignVehicleToCustomer,
  unassignVehicle,
  getVehicleRecommendations,
} = require("../controllers/vehicleController");
const { protect } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");

/**
 * Vehicle Management Routes
 *
 * Base URL: /api/vehicles
 *
 * Access Control:
 * - GET: Admin, Dispatcher, Driver (own vehicles)
 * - POST: Driver (register), Admin (direct create)
 * - PUT/DELETE: Admin only
 * - Approval: Admin only
 * - Assignment: Admin only
 */

router.use(protect);

router
  .route("/")
  .get(authorize("admin", "dispatcher", "driver"), getAllVehicles)
  .post(authorize("admin", "driver"), createVehicle);

router.get("/pending", authorize("admin"), getPendingVehicles);
router.get(
  "/recommendations",
  authorize("admin", "dispatcher"),
  getVehicleRecommendations,
);
router.get("/stats", authorize("admin"), getVehicleStats);

router
  .route("/:id")
  .get(authorize("admin", "dispatcher", "driver"), getVehicleById)
  .put(authorize("admin"), updateVehicle)
  .delete(authorize("admin"), deleteVehicle);

router.put("/:id/status", authorize("admin"), updateVehicleStatus);
router.put("/:id/approve", authorize("admin"), approveVehicle);
router.put("/:id/reject", authorize("admin"), rejectVehicle);
router.put("/:id/assign-customer", authorize("admin"), assignVehicleToCustomer);
router.put("/:id/unassign", authorize("admin"), unassignVehicle);

module.exports = router;

const express = require("express");
const router = express.Router();
const {
  createShipment,
  getAllShipments,
  getShipmentById,
  assignShipment,
  updateShipmentStatus,
  deleteShipment,
  getShipmentStats,
  approveShipment,
} = require("../controllers/shipmentController");
const { protect } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");

/**
 * Shipment Management Routes
 *
 * Base URL: /api/shipments
 *
 * Access Control:
 * - Customer: Create, view own shipments
 * - Dispatcher/Admin: View all, assign, update status
 * - Driver: View assigned shipments
 */

router.use(protect);

router
  .route("/")
  .get(getAllShipments)
  .post(authorize("customer"), createShipment);

router.get("/stats", authorize("admin", "dispatcher"), getShipmentStats);

router
  .route("/:id")
  .get(getShipmentById)
  .delete(authorize("admin", "customer"), deleteShipment);

router.put("/:id/assign", authorize("admin", "dispatcher"), assignShipment);
router.put("/:id/approve", authorize("admin"), approveShipment);
router.patch("/:id/status", updateShipmentStatus);

module.exports = router;

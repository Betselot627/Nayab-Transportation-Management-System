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
  confirmFinalPrice,
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
 * - Dispatcher/Admin: View all, assign, update status, confirm final price
 * - Driver: View assigned shipments
 */

router.use(protect);

router
  .route("/")
  .get(getAllShipments)
  .post(createShipment);

router.get("/stats", authorize("admin", "dispatcher"), getShipmentStats);

router
  .route("/:id")
  .get(getShipmentById)
  .delete(deleteShipment);

router.put("/:id/assign", authorize("admin", "dispatcher"), assignShipment);
router.put("/:id/approve", authorize("admin"), approveShipment);
router.put("/:id/confirm-price", authorize("admin", "dispatcher"), confirmFinalPrice);
router.patch("/:id/status", updateShipmentStatus);

module.exports = router;

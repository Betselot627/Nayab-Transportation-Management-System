const express = require("express");
const router = express.Router();
const {
  getAllPayments,
  getPaymentById,
  createPayment,
  updatePaymentStatus,
  updatePayment,
  deletePayment,
  getShipmentPayments,
  getPaymentStats,
} = require("../controllers/paymentController");
const { protect } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");

/**
 * Payment Management Routes
 *
 * Base URL: /api/payments
 *
 * Access Control:
 * - Customer: View own payments, create payments
 * - Admin: Full access
 */

router.use(protect);

router
  .route("/")
  .get(getAllPayments)
  .post(authorize("admin", "customer"), createPayment);

router.get("/stats", authorize("admin"), getPaymentStats);
router.get("/shipment/:shipmentId", getShipmentPayments);

router
  .route("/:id")
  .get(getPaymentById)
  .put(authorize("admin"), updatePayment)
  .delete(authorize("admin"), deletePayment);

router.put("/:id/status", authorize("admin"), updatePaymentStatus);

module.exports = router;

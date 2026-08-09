const express = require("express");
const router = express.Router();
const {
  initializePayment,
  verifyPayment,
  handleWebhook,
  getMyPayments,
  getPaymentReceipt,
  getAllPayments,
  getPaymentStats,
  getPaymentById,
} = require("../controllers/paymentController");
const { protect } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");

/**
 * Payment Management Routes - NTMS Chapa Gateway
 *
 * Base URL: /api/payments
 */

// 1. Webhook endpoint (Public, signature validated internally)
router.post("/webhook", handleWebhook);

// 2. Public / Callback verification endpoint (also supports authenticated verification)
router.get("/verify/:txRef", verifyPayment);

// 3. Protected payment routes
router.use(protect);

router.post("/initialize", authorize("customer", "admin"), initializePayment);
router.get("/my-payments", authorize("customer", "admin"), getMyPayments);
router.get("/receipt/:txRef", getPaymentReceipt);
router.get("/stats", authorize("admin"), getPaymentStats);

router.get("/", authorize("admin"), getAllPayments);
router.get("/:id", getPaymentById);

module.exports = router;

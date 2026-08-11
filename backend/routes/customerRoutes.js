const express = require("express");
const router = express.Router();
const {
  getAllCustomers,
  getCustomerById,
  getMyProfile,
  updateMyProfile,
  getCustomerShipments,
  updateCustomer,
  deleteCustomer,
} = require("../controllers/customerController");
const { protect } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");

/**
 * Customer Management Routes
 *
 * Base URL: /api/customers
 */

router.use(protect);

// Customer own profile routes
router.get("/profile/me", getMyProfile);
router.put("/profile/me", updateMyProfile);

// Admin routes
router.get("/", authorize("admin"), getAllCustomers);
router.get("/:id", authorize("admin"), getCustomerById);
router.put("/:id", authorize("admin"), updateCustomer);
router.delete("/:id", authorize("admin"), deleteCustomer);
router.get("/:id/shipments", authorize("admin"), getCustomerShipments);

module.exports = router;

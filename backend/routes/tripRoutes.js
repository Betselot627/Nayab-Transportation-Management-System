const express = require("express");
const router = express.Router();
const {
  getAllTrips,
  getMyTrips,
  getTripById,
  updateTripStatus,
  updateLocation,
  addCheckpoint,
  reportIncident,
  updateExpenses,
} = require("../controllers/tripController");
const { protect } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");

/**
 * Trip Management Routes
 *
 * Base URL: /api/trips
 *
 * Access Control:
 * - Driver: View and update own trips
 * - Admin/Dispatcher: View all trips
 */

router.use(protect);

router.get("/", authorize("admin", "dispatcher"), getAllTrips);
router.get("/my-trips", authorize("driver"), getMyTrips);
router.get("/:id", getTripById);

// Driver operations
router.patch("/:id/status", authorize("driver"), updateTripStatus);
router.patch("/:id/location", authorize("driver"), updateLocation);
router.post("/:id/checkpoint", authorize("driver"), addCheckpoint);
router.post("/:id/incident", authorize("driver"), reportIncident);
router.put("/:id/expenses", authorize("driver"), updateExpenses);

module.exports = router;

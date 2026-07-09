const express = require("express");
const router = express.Router();
const {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  updateUserStatus,
  getUserStats,
} = require("../controllers/userController");
const { protect } = require("../middleware/authMiddleware");
const { isAdmin } = require("../middleware/roleMiddleware");

/**
 * User Management Routes
 *
 * Base URL: /api/users
 * Access: Admin only
 */

// All routes are protected and require admin role
router.use(protect);
router.use(isAdmin);

router.route("/").get(getAllUsers).post(createUser);

router.get("/stats", getUserStats);

router.route("/:id").get(getUserById).put(updateUser).delete(deleteUser);

router.put("/:id/status", updateUserStatus);

module.exports = router;

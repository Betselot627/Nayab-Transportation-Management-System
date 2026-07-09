const express = require("express");
const router = express.Router();
const {
  register,
  login,
  getMe,
  updatePassword,
} = require("../controllers/authController");
const { protect } = require("../middleware/authMiddleware");

/**
 * Authentication Routes
 *
 * Base URL: /api/auth
 *
 * Public Routes:
 * - POST /register - Register new user
 * - POST /login - User login
 *
 * Protected Routes:
 * - GET /me - Get current user
 * - PUT /update-password - Update password
 */

// Public routes
router.post("/register", register);
router.post("/login", login);

// Protected routes
router.get("/me", protect, getMe);
router.put("/update-password", protect, updatePassword);

module.exports = router;

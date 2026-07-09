const jwt = require("jsonwebtoken");
const User = require("../models/User");

/**
 * Authentication Middleware
 *
 * Purpose: Protect routes requiring authentication
 * - Verifies JWT token from Authorization header
 * - Attaches user object to request
 * - Blocks unauthorized access
 *
 * Usage: Add to routes that require login
 * Example: router.get('/profile', protect, getProfile)
 */
const protect = async (req, res, next) => {
  let token;

  // Check if authorization header exists and starts with Bearer
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      // Extract token from header
      // Format: "Bearer <token>"
      token = req.headers.authorization.split(" ")[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from database (exclude password)
      req.user = await User.findById(decoded.id).select("-password");

      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: "User not found",
        });
      }

      // Check if user is active
      if (req.user.status !== "active") {
        return res.status(401).json({
          success: false,
          message: "Account is not active",
        });
      }

      next();
    } catch (error) {
      console.error("Auth Middleware Error:", error.message);
      return res.status(401).json({
        success: false,
        message: "Not authorized, token failed",
      });
    }
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Not authorized, no token provided",
    });
  }
};

module.exports = { protect };

/**
 * Role-Based Access Control Middleware
 *
 * Purpose: Restrict access based on user roles
 * - Must be used after protect middleware
 * - Checks if user has required role
 * - Supports multiple role authorization
 *
 * Usage Examples:
 * - Single role: authorize('admin')
 * - Multiple roles: authorize('admin', 'dispatcher')
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    // Check if user exists (should be attached by protect middleware)
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
    }

    // Check if user's role is in the allowed roles
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Role '${req.user.role}' is not authorized to access this route`,
      });
    }

    next();
  };
};

/**
 * Check if user is admin
 */
const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    next();
  } else {
    res.status(403).json({
      success: false,
      message: "Admin access required",
    });
  }
};

/**
 * Check if user is dispatcher
 */
const isDispatcher = (req, res, next) => {
  if (
    req.user &&
    (req.user.role === "dispatcher" || req.user.role === "admin")
  ) {
    next();
  } else {
    res.status(403).json({
      success: false,
      message: "Dispatcher access required",
    });
  }
};

/**
 * Check if user is driver
 */
const isDriver = (req, res, next) => {
  if (req.user && req.user.role === "driver") {
    next();
  } else {
    res.status(403).json({
      success: false,
      message: "Driver access required",
    });
  }
};

/**
 * Check if user is customer
 */
const isCustomer = (req, res, next) => {
  if (req.user && req.user.role === "customer") {
    next();
  } else {
    res.status(403).json({
      success: false,
      message: "Customer access required",
    });
  }
};

module.exports = {
  authorize,
  isAdmin,
  isDispatcher,
  isDriver,
  isCustomer,
};

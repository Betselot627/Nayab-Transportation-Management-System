/**
 * Global Error Handling Middleware
 *
 * Purpose: Centralized error handling for the application
 * - Catches all errors from routes and controllers
 * - Formats error responses consistently
 * - Handles different error types
 *
 * Error Types Handled:
 * - Mongoose validation errors
 * - Mongoose duplicate key errors
 * - Mongoose cast errors (invalid ObjectId)
 * - JWT errors
 * - Custom operational errors
 */

/**
 * 404 Not Found Handler
 * Catches requests to undefined routes
 */
const notFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

/**
 * Global Error Handler
 * Catches and formats all errors
 */
const errorHandler = (err, req, res, next) => {
  // If headers already sent, delegate to default Express error handler
  if (res.headersSent) {
    return next(err);
  }

  // Default status code
  let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  let message = err.message;
  let errors = null;

  // Mongoose validation error
  if (err.name === "ValidationError") {
    statusCode = 400;
    message = "Validation Error";
    errors = Object.values(err.errors).map((error) => ({
      field: error.path,
      message: error.message,
    }));
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    statusCode = 400;
    const field = Object.keys(err.keyPattern)[0];
    message = `${field} already exists`;
    errors = [
      {
        field: field,
        message: `This ${field} is already registered`,
      },
    ];
  }

  // Mongoose cast error (invalid ObjectId)
  if (err.name === "CastError") {
    statusCode = 400;
    message = `Invalid ${err.path}: ${err.value}`;
  }

  // JWT errors
  if (err.name === "JsonWebTokenError") {
    statusCode = 401;
    message = "Invalid token";
  }

  if (err.name === "TokenExpiredError") {
    statusCode = 401;
    message = "Token expired";
  }

  // Multer file upload errors
  if (err.name === "MulterError") {
    statusCode = 400;
    if (err.code === "LIMIT_FILE_SIZE") {
      message = "File size too large. Maximum size is 5MB";
    } else {
      message = err.message;
    }
  }

  // Log error in development
  if (process.env.NODE_ENV === "development") {
    console.error("Error Stack:", err.stack);
  }

  // Send error response
  res.status(statusCode).json({
    success: false,
    message: message,
    errors: errors,
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
  });
};

module.exports = {
  notFound,
  errorHandler,
};

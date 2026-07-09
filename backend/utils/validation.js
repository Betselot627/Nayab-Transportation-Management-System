/**
 * Validation Utilities
 *
 * Purpose: Reusable validation functions
 * - Input sanitization
 * - Format validation
 * - Business logic validation
 */

// Validate email format
const isValidEmail = (email) => {
  const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
  return emailRegex.test(email);
};

// Validate phone number (Pakistan format)
const isValidPhone = (phone) => {
  const phoneRegex = /^(\+92|0)?[0-9]{10}$/;
  return phoneRegex.test(phone);
};

// Validate date is not in the past
const isValidFutureDate = (date) => {
  return new Date(date) > new Date();
};

// Validate license expiry (should be in future)
const isValidLicenseExpiry = (expiryDate) => {
  const expiry = new Date(expiryDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return expiry > today;
};

// Validate vehicle year
const isValidVehicleYear = (year) => {
  const currentYear = new Date().getFullYear();
  return year >= 1990 && year <= currentYear + 1;
};

// Sanitize string input
const sanitizeString = (str) => {
  if (!str) return "";
  return str.trim().replace(/[<>]/g, "");
};

// Validate coordinates
const isValidCoordinates = (coordinates) => {
  if (!Array.isArray(coordinates) || coordinates.length !== 2) {
    return false;
  }
  const [lng, lat] = coordinates;
  return lng >= -180 && lng <= 180 && lat >= -90 && lat <= 90;
};

// Validate positive number
const isPositiveNumber = (num) => {
  return typeof num === "number" && num > 0;
};

// Validate ObjectId format
const isValidObjectId = (id) => {
  return /^[0-9a-fA-F]{24}$/.test(id);
};

module.exports = {
  isValidEmail,
  isValidPhone,
  isValidFutureDate,
  isValidLicenseExpiry,
  isValidVehicleYear,
  sanitizeString,
  isValidCoordinates,
  isPositiveNumber,
  isValidObjectId,
};

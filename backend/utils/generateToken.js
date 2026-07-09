const jwt = require("jsonwebtoken");

/**
 * JWT Token Generator
 *
 * Purpose: Generate secure JWT tokens for authentication
 * - Signs user ID and role into token
 * - Sets expiration from environment variable
 * - Used in login and registration
 *
 * Token Payload:
 * {
 *   id: user._id,
 *   role: user.role
 * }
 */
const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || "30d",
  });
};

module.exports = generateToken;

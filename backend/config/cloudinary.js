const cloudinary = require("cloudinary").v2;

/**
 * Cloudinary Configuration
 *
 * Purpose: Configure Cloudinary for file uploads
 * - Used for driver licenses
 * - Vehicle documents
 * - Insurance documents
 * - Delivery receipts
 *
 * Security: Credentials stored in environment variables
 */
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

module.exports = cloudinary;

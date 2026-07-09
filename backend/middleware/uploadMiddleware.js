const multer = require("multer");
const path = require("path");
const cloudinary = require("../config/cloudinary");

/**
 * File Upload Middleware
 *
 * Purpose: Handle file uploads to Cloudinary
 * - Uses multer for file processing
 * - Stores files in memory buffer
 * - Uploads to Cloudinary
 * - Returns Cloudinary URL
 *
 * Supported Files:
 * - Images: Driver license, vehicle photos
 * - Documents: Insurance, registration, receipts
 */

// Configure multer to store files in memory
const storage = multer.memoryStorage();

// File filter to accept only specific file types
const fileFilter = (req, file, cb) => {
  // Allowed file extensions
  const allowedTypes = /jpeg|jpg|png|pdf|doc|docx/;

  // Check extension
  const extname = allowedTypes.test(
    path.extname(file.originalname).toLowerCase(),
  );

  // Check mimetype
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb(new Error("Only images and PDF documents are allowed"));
  }
};

// Multer upload configuration
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: fileFilter,
});

/**
 * Upload single file to Cloudinary
 *
 * @param {Buffer} fileBuffer - File buffer from multer
 * @param {String} folder - Cloudinary folder name
 * @returns {Promise<String>} - Cloudinary URL
 */
const uploadToCloudinary = (fileBuffer, folder = "ntms") => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: folder,
        resource_type: "auto",
      },
      (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result.secure_url);
        }
      },
    );

    uploadStream.end(fileBuffer);
  });
};

/**
 * Middleware to handle single file upload
 */
const uploadSingle = (fieldName, folder) => {
  return async (req, res, next) => {
    // Use multer to process the file
    upload.single(fieldName)(req, res, async (err) => {
      if (err) {
        return res.status(400).json({
          success: false,
          message: err.message,
        });
      }

      // If no file uploaded, continue
      if (!req.file) {
        return next();
      }

      try {
        // Upload to Cloudinary
        const cloudinaryUrl = await uploadToCloudinary(req.file.buffer, folder);

        // Attach URL to request
        req.fileUrl = cloudinaryUrl;
        next();
      } catch (error) {
        console.error("Cloudinary Upload Error:", error);
        return res.status(500).json({
          success: false,
          message: "File upload failed",
        });
      }
    });
  };
};

/**
 * Middleware to handle multiple file uploads
 */
const uploadMultiple = (fieldName, maxCount, folder) => {
  return async (req, res, next) => {
    upload.array(fieldName, maxCount)(req, res, async (err) => {
      if (err) {
        return res.status(400).json({
          success: false,
          message: err.message,
        });
      }

      // If no files uploaded, continue
      if (!req.files || req.files.length === 0) {
        return next();
      }

      try {
        // Upload all files to Cloudinary
        const uploadPromises = req.files.map((file) =>
          uploadToCloudinary(file.buffer, folder),
        );

        const cloudinaryUrls = await Promise.all(uploadPromises);

        // Attach URLs to request
        req.fileUrls = cloudinaryUrls;
        next();
      } catch (error) {
        console.error("Cloudinary Upload Error:", error);
        return res.status(500).json({
          success: false,
          message: "File upload failed",
        });
      }
    });
  };
};

module.exports = {
  upload,
  uploadSingle,
  uploadMultiple,
  uploadToCloudinary,
};

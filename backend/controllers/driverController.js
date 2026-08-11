const Driver = require("../models/Driver");
const User = require("../models/User");

/**
 * Driver Management Controller
 *
 * Purpose: Manage driver profiles and operations
 * - CRUD operations for drivers
 * - Track driver availability
 * - Manage driver assignments
 */

/**
 * @route   GET /api/drivers
 * @desc    Get all drivers
 * @access  Private/Admin/Dispatcher
 */
const getAllDrivers = async (req, res) => {
  try {
    const { status, available, page = 1, limit = 10 } = req.query;
    const query = {};

    if (status) query.status = status;
    if (available === "true") query.status = "available";

    const limitNum = parseInt(limit);
    const skip = (parseInt(page) - 1) * limitNum;

    const [drivers, total] = await Promise.all([
      Driver.find(query)
        .populate("userId", "name email phone status")
        .limit(limitNum)
        .skip(skip)
        .sort({ createdAt: -1 })
        .lean(),
      Driver.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      count: drivers.length,
      total,
      pages: Math.ceil(total / limitNum),
      currentPage: parseInt(page),
      data: drivers,
    });
  } catch (error) {
    console.error("Get Drivers Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * @route   GET /api/drivers/:id
 * @desc    Get single driver
 * @access  Private
 */
const getDriverById = async (req, res) => {
  try {
    const driver = await Driver.findById(req.params.id).populate(
      "userId",
      "name email phone status",
    );

    if (!driver) {
      return res.status(404).json({
        success: false,
        message: "Driver not found",
      });
    }

    res.status(200).json({
      success: true,
      data: driver,
    });
  } catch (error) {
    console.error("Get Driver Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * @route   POST /api/drivers
 * @desc    Create new driver profile
 * @access  Private/Admin
 */
const createDriver = async (req, res) => {
  try {
    const { userId, fullName, licenseNumber, licenseExpiry, experience } =
      req.body;

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Check if driver profile already exists
    const existingDriver = await Driver.findOne({ userId });
    if (existingDriver) {
      return res.status(400).json({
        success: false,
        message: "Driver profile already exists for this user",
      });
    }

    // Check license number uniqueness
    const licenseExists = await Driver.findOne({ licenseNumber });
    if (licenseExists) {
      return res.status(400).json({
        success: false,
        message: "License number already registered",
      });
    }

    const driver = await Driver.create({
      userId,
      fullName,
      licenseNumber,
      licenseExpiry,
      experience,
      ...req.body,
    });

    // Update user role to driver
    user.role = "driver";
    await user.save();

    res.status(201).json({
      success: true,
      message: "Driver created successfully",
      data: driver,
    });
  } catch (error) {
    console.error("Create Driver Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * @route   PUT /api/drivers/:id
 * @desc    Update driver
 * @access  Private/Admin
 */
const updateDriver = async (req, res) => {
  try {
    const driver = await Driver.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).populate("userId");

    if (!driver) {
      return res.status(404).json({
        success: false,
        message: "Driver not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Driver updated successfully",
      data: driver,
    });
  } catch (error) {
    console.error("Update Driver Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * @route   DELETE /api/drivers/:id
 * @desc    Delete driver
 * @access  Private/Admin
 */
const deleteDriver = async (req, res) => {
  try {
    const driver = await Driver.findById(req.params.id);

    if (!driver) {
      return res.status(404).json({
        success: false,
        message: "Driver not found",
      });
    }

    // Check if driver is on trip
    if (driver.status === "on_trip") {
      return res.status(400).json({
        success: false,
        message: "Cannot delete driver who is currently on trip",
      });
    }

    await driver.deleteOne();

    res.status(200).json({
      success: true,
      message: "Driver deleted successfully",
    });
  } catch (error) {
    console.error("Delete Driver Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * @route   PUT /api/drivers/:id/status
 * @desc    Update driver status
 * @access  Private/Admin/Driver
 */
const updateDriverStatus = async (req, res) => {
  try {
    const { status } = req.body;

    const driver = await Driver.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true },
    );

    if (!driver) {
      return res.status(404).json({
        success: false,
        message: "Driver not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Driver status updated",
      data: driver,
    });
  } catch (error) {
    console.error("Update Status Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * @route   GET /api/drivers/available
 * @desc    Get available drivers
 * @access  Private/Admin/Dispatcher
 */
const getAvailableDrivers = async (req, res) => {
  try {
    const drivers = await Driver.find({ status: "available" })
      .populate("userId", "name phone")
      .sort({ lastAssignedAt: 1, createdAt: 1 }); // Fair queue: longest waiting first

    res.status(200).json({
      success: true,
      count: drivers.length,
      data: drivers,
    });
  } catch (error) {
    console.error("Get Available Drivers Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getMyProfile = async (req, res) => {
  try {
    let driver = await Driver.findOne({ userId: req.user._id }).populate(
      "userId",
      "name email phone",
    );

    if (!driver) {
      driver = await Driver.create({
        userId: req.user._id,
        fullName: req.user.name,
        licenseNumber: `PENDING-${req.user._id.toString().substring(18)}`,
        licenseExpiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        experience: 0,
      });
      driver = await Driver.findById(driver._id).populate(
        "userId",
        "name email phone",
      );
    }

    res.status(200).json({
      success: true,
      data: driver,
    });
  } catch (error) {
    console.error("Get Driver Profile Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const updateMyProfile = async (req, res) => {
  try {
    const { name, email, phone, licenseNumber, experience, licenseExpiry, profileImage, licenseImage, documents } = req.body;

    // Update User model fields
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (name) user.name = name;
    if (profileImage) user.profileImage = profileImage;
    if (email) {
      const emailExists = await User.findOne({ email, _id: { $ne: req.user._id } });
      if (emailExists) {
        return res.status(400).json({
          success: false,
          message: "Email is already in use by another account",
        });
      }
      user.email = email;
    }
    if (phone) user.phone = phone;
    await user.save();

    // Ensure Driver model exists
    let driverExists = await Driver.findOne({ userId: req.user._id });
    if (!driverExists) {
      await Driver.create({
        userId: req.user._id,
        fullName: user.name,
        licenseNumber: `PENDING-${req.user._id.toString().substring(18)}`,
        licenseExpiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        experience: 0,
      });
    }

    // Update Driver model fields
    const driverUpdate = {};
    if (licenseNumber) {
      const licenseExists = await Driver.findOne({ licenseNumber, userId: { $ne: req.user._id } });
      if (licenseExists) {
        return res.status(400).json({
          success: false,
          message: "License number already registered",
        });
      }
      driverUpdate.licenseNumber = licenseNumber;
    }
    if (experience !== undefined) driverUpdate.experience = Number(experience);
    if (licenseExpiry) driverUpdate.licenseExpiry = new Date(licenseExpiry);
    if (licenseImage) driverUpdate.licenseImage = licenseImage;
    if (req.body.fullName) driverUpdate.fullName = req.body.fullName;
    if (req.body.emergencyContact) driverUpdate.emergencyContact = req.body.emergencyContact;

    if (documents) {
      driverUpdate.documents = {
        cnic: documents.cnic || undefined,
        medicalCertificate: documents.medicalCertificate || undefined,
        other: documents.other || undefined,
      };
    }

    const driver = await Driver.findOneAndUpdate(
      { userId: req.user._id },
      driverUpdate,
      { new: true, runValidators: true },
    ).populate("userId");

    if (!driver) {
      return res.status(404).json({
        success: false,
        message: "Driver profile not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: driver,
    });
  } catch (error) {
    console.error("Update Driver Profile Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * @route   GET /api/drivers/earnings/me
 * @desc    Get logged in driver's earnings & commission history
 * @access  Private/Driver
 */
const getMyEarnings = async (req, res) => {
  try {
    const driver = await Driver.findOne({ userId: req.user._id });
    if (!driver) {
      return res.status(404).json({
        success: false,
        message: "Driver profile not found",
      });
    }

    const Trip = require("../models/Trip");
    const trips = await Trip.find({ driverId: driver._id, status: "completed" })
      .populate("shipmentId", "shipmentNumber pickupLocation destination pricing finalPrice actualDeliveryDate")
      .populate("vehicleId", "plateNumber model type")
      .sort({ updatedAt: -1 })
      .lean();

    const totalEarned = driver.totalEarnings || trips.reduce((sum, t) => sum + (t.driverCommission?.amount || 0), 0);

    res.status(200).json({
      success: true,
      data: {
        totalEarnings: totalEarned,
        commissionRate: driver.commissionRate || 15,
        completedTrips: trips.length,
        trips,
      },
    });
  } catch (error) {
    console.error("Get Driver Earnings Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  getAllDrivers,
  getDriverById,
  createDriver,
  updateDriver,
  deleteDriver,
  updateDriverStatus,
  getAvailableDrivers,
  getMyProfile,
  updateMyProfile,
  getMyEarnings,
};

const Vehicle = require("../models/Vehicle");

/**
 * Vehicle Management Controller
 *
 * Purpose: Fleet management operations
 * - Add/Update/Delete vehicles
 * - Track vehicle status and maintenance
 * - Vehicle assignment to drivers
 *
 * Access: Admin only
 */

/**
 * @route   GET /api/vehicles
 * @desc    Get all vehicles with filtering
 * @access  Private/Admin/Dispatcher
 */
const getAllVehicles = async (req, res) => {
  try {
    const { status, type, search, available, page = 1, limit = 10 } = req.query;

    const query = {};

    if (status) query.status = status;
    if (type) query.type = type;
    if (available === "true") query.status = "available";

    if (search) {
      query.$or = [
        { plateNumber: { $regex: search, $options: "i" } },
        { model: { $regex: search, $options: "i" } },
        { manufacturer: { $regex: search, $options: "i" } },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const vehicles = await Vehicle.find(query)
      .populate("currentDriver", "fullName phone")
      .limit(parseInt(limit))
      .skip(skip)
      .sort({ createdAt: -1 });

    const total = await Vehicle.countDocuments(query);

    res.status(200).json({
      success: true,
      count: vehicles.length,
      total,
      pages: Math.ceil(total / parseInt(limit)),
      currentPage: parseInt(page),
      data: vehicles,
    });
  } catch (error) {
    console.error("Get Vehicles Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * @route   GET /api/vehicles/:id
 * @desc    Get single vehicle
 * @access  Private
 */
const getVehicleById = async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id).populate(
      "currentDriver",
      "fullName phone email licenseNumber",
    );

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: "Vehicle not found",
      });
    }

    res.status(200).json({
      success: true,
      data: vehicle,
    });
  } catch (error) {
    console.error("Get Vehicle Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * @route   POST /api/vehicles
 * @desc    Create new vehicle
 * @access  Private/Admin
 */
const createVehicle = async (req, res) => {
  try {
    const vehicleData = req.body;

    // Check if plate number exists
    const existingVehicle = await Vehicle.findOne({
      plateNumber: vehicleData.plateNumber,
    });

    if (existingVehicle) {
      return res.status(400).json({
        success: false,
        message: "Vehicle with this plate number already exists",
      });
    }

    const vehicle = await Vehicle.create(vehicleData);

    res.status(201).json({
      success: true,
      message: "Vehicle created successfully",
      data: vehicle,
    });
  } catch (error) {
    console.error("Create Vehicle Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * @route   PUT /api/vehicles/:id
 * @desc    Update vehicle
 * @access  Private/Admin
 */
const updateVehicle = async (req, res) => {
  try {
    const vehicle = await Vehicle.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: "Vehicle not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Vehicle updated successfully",
      data: vehicle,
    });
  } catch (error) {
    console.error("Update Vehicle Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * @route   DELETE /api/vehicles/:id
 * @desc    Delete vehicle
 * @access  Private/Admin
 */
const deleteVehicle = async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: "Vehicle not found",
      });
    }

    // Check if vehicle is in use
    if (vehicle.status === "in_use") {
      return res.status(400).json({
        success: false,
        message: "Cannot delete vehicle that is currently in use",
      });
    }

    await vehicle.deleteOne();

    res.status(200).json({
      success: true,
      message: "Vehicle deleted successfully",
    });
  } catch (error) {
    console.error("Delete Vehicle Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * @route   PUT /api/vehicles/:id/status
 * @desc    Update vehicle status
 * @access  Private/Admin
 */
const updateVehicleStatus = async (req, res) => {
  try {
    const { status } = req.body;

    const vehicle = await Vehicle.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true },
    );

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: "Vehicle not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Vehicle status updated",
      data: vehicle,
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
 * @route   GET /api/vehicles/stats
 * @desc    Get vehicle statistics
 * @access  Private/Admin
 */
const getVehicleStats = async (req, res) => {
  try {
    const total = await Vehicle.countDocuments();
    const available = await Vehicle.countDocuments({ status: "available" });
    const inUse = await Vehicle.countDocuments({ status: "in_use" });
    const maintenance = await Vehicle.countDocuments({ status: "maintenance" });

    const byType = await Vehicle.aggregate([
      {
        $group: {
          _id: "$type",
          count: { $sum: 1 },
        },
      },
    ]);

    res.status(200).json({
      success: true,
      data: {
        total,
        available,
        inUse,
        maintenance,
        byType,
      },
    });
  } catch (error) {
    console.error("Get Stats Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  getAllVehicles,
  getVehicleById,
  createVehicle,
  updateVehicle,
  deleteVehicle,
  updateVehicleStatus,
  getVehicleStats,
};

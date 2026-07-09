const Maintenance = require("../models/Maintenance");
const Vehicle = require("../models/Vehicle");

/**
 * Maintenance Management Controller
 *
 * Purpose: Track vehicle maintenance and service history
 * - Schedule maintenance
 * - Record service history
 * - Manage maintenance costs
 */

/**
 * @route   GET /api/maintenance
 * @desc    Get all maintenance records
 * @access  Private/Admin
 */
const getAllMaintenance = async (req, res) => {
  try {
    const { vehicleId, status, serviceType, page = 1, limit = 10 } = req.query;
    const query = {};

    if (vehicleId) query.vehicleId = vehicleId;
    if (status) query.status = status;
    if (serviceType) query.serviceType = serviceType;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const maintenance = await Maintenance.find(query)
      .populate("vehicleId", "plateNumber model type")
      .populate("createdBy", "name email")
      .limit(parseInt(limit))
      .skip(skip)
      .sort({ serviceDate: -1 });

    const total = await Maintenance.countDocuments(query);

    res.status(200).json({
      success: true,
      count: maintenance.length,
      total,
      pages: Math.ceil(total / parseInt(limit)),
      currentPage: parseInt(page),
      data: maintenance,
    });
  } catch (error) {
    console.error("Get Maintenance Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * @route   GET /api/maintenance/:id
 * @desc    Get single maintenance record
 * @access  Private
 */
const getMaintenanceById = async (req, res) => {
  try {
    const maintenance = await Maintenance.findById(req.params.id)
      .populate("vehicleId")
      .populate("createdBy", "name email");

    if (!maintenance) {
      return res.status(404).json({
        success: false,
        message: "Maintenance record not found",
      });
    }

    res.status(200).json({
      success: true,
      data: maintenance,
    });
  } catch (error) {
    console.error("Get Maintenance Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * @route   POST /api/maintenance
 * @desc    Create maintenance record
 * @access  Private/Admin
 */
const createMaintenance = async (req, res) => {
  try {
    const maintenanceData = {
      ...req.body,
      createdBy: req.user._id,
    };

    const maintenance = await Maintenance.create(maintenanceData);

    // Update vehicle maintenance dates
    const vehicle = await Vehicle.findById(maintenance.vehicleId);
    if (vehicle) {
      vehicle.lastMaintenanceDate = maintenance.serviceDate;
      if (maintenance.nextServiceDate) {
        vehicle.nextMaintenanceDate = maintenance.nextServiceDate;
      }

      // Set vehicle to maintenance status if service is in progress
      if (maintenance.status === "in_progress") {
        vehicle.status = "maintenance";
      }

      await vehicle.save();
    }

    res.status(201).json({
      success: true,
      message: "Maintenance record created successfully",
      data: maintenance,
    });
  } catch (error) {
    console.error("Create Maintenance Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * @route   PUT /api/maintenance/:id
 * @desc    Update maintenance record
 * @access  Private/Admin
 */
const updateMaintenance = async (req, res) => {
  try {
    const maintenance = await Maintenance.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true },
    ).populate("vehicleId");

    if (!maintenance) {
      return res.status(404).json({
        success: false,
        message: "Maintenance record not found",
      });
    }

    // Update vehicle status if maintenance completed
    if (maintenance.status === "completed") {
      const vehicle = await Vehicle.findById(maintenance.vehicleId);
      if (vehicle && vehicle.status === "maintenance") {
        vehicle.status = "available";
        await vehicle.save();
      }
    }

    res.status(200).json({
      success: true,
      message: "Maintenance record updated successfully",
      data: maintenance,
    });
  } catch (error) {
    console.error("Update Maintenance Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * @route   DELETE /api/maintenance/:id
 * @desc    Delete maintenance record
 * @access  Private/Admin
 */
const deleteMaintenance = async (req, res) => {
  try {
    const maintenance = await Maintenance.findById(req.params.id);

    if (!maintenance) {
      return res.status(404).json({
        success: false,
        message: "Maintenance record not found",
      });
    }

    await maintenance.deleteOne();

    res.status(200).json({
      success: true,
      message: "Maintenance record deleted successfully",
    });
  } catch (error) {
    console.error("Delete Maintenance Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * @route   GET /api/maintenance/vehicle/:vehicleId
 * @desc    Get maintenance history for a vehicle
 * @access  Private
 */
const getVehicleMaintenanceHistory = async (req, res) => {
  try {
    const maintenance = await Maintenance.find({
      vehicleId: req.params.vehicleId,
    })
      .populate("createdBy", "name")
      .sort({ serviceDate: -1 });

    res.status(200).json({
      success: true,
      count: maintenance.length,
      data: maintenance,
    });
  } catch (error) {
    console.error("Get Vehicle History Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * @route   GET /api/maintenance/upcoming
 * @desc    Get upcoming scheduled maintenance
 * @access  Private/Admin
 */
const getUpcomingMaintenance = async (req, res) => {
  try {
    const today = new Date();
    const next30Days = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);

    const upcoming = await Maintenance.find({
      status: "scheduled",
      serviceDate: { $gte: today, $lte: next30Days },
    })
      .populate("vehicleId", "plateNumber model")
      .sort({ serviceDate: 1 });

    res.status(200).json({
      success: true,
      count: upcoming.length,
      data: upcoming,
    });
  } catch (error) {
    console.error("Get Upcoming Maintenance Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * @route   GET /api/maintenance/stats
 * @desc    Get maintenance statistics
 * @access  Private/Admin
 */
const getMaintenanceStats = async (req, res) => {
  try {
    const total = await Maintenance.countDocuments();

    const byStatus = await Maintenance.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    const byServiceType = await Maintenance.aggregate([
      {
        $group: {
          _id: "$serviceType",
          count: { $sum: 1 },
        },
      },
    ]);

    const totalCost = await Maintenance.aggregate([
      {
        $match: { status: "completed" },
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$cost.total" },
        },
      },
    ]);

    res.status(200).json({
      success: true,
      data: {
        total,
        byStatus,
        byServiceType,
        totalCost: totalCost[0]?.total || 0,
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
  getAllMaintenance,
  getMaintenanceById,
  createMaintenance,
  updateMaintenance,
  deleteMaintenance,
  getVehicleMaintenanceHistory,
  getUpcomingMaintenance,
  getMaintenanceStats,
};

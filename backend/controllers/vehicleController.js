const Vehicle = require("../models/Vehicle");
const Driver = require("../models/Driver");
const Notification = require("../models/Notification");

/**
 * Vehicle Management Controller
 *
 * Purpose: Fleet management operations with driver self-registration
 * - Drivers register their own vehicles
 * - Admin approves/rejects vehicle requests
 * - Track vehicle status and maintenance
 *
 * Workflow:
 * 1. Driver registers vehicle (status: pending)
 * 2. Admin reviews and approves/rejects
 * 3. Approved vehicles become available for assignment
 */

/**
 * @route   GET /api/vehicles
 * @desc    Get all vehicles with filtering
 * @access  Private/Admin/Dispatcher
 */
const getAllVehicles = async (req, res) => {
  try {
    const {
      status,
      type,
      search,
      available,
      approvalStatus,
      page = 1,
      limit = 10,
    } = req.query;

    const query = {};

    // For drivers, show only their own vehicles
    if (req.user.role === "driver") {
      const driver = await Driver.findOne({ userId: req.user._id });
      if (driver) {
        query.registeredBy = driver._id;
      }
    }

    if (status) query.status = status;
    if (type) query.type = type;
    if (approvalStatus) query.approvalStatus = approvalStatus;
    if (available === "true") {
      query.status = "available";
      query.approvalStatus = "approved";
    }

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
      .populate("registeredBy", "fullName licenseNumber")
      .populate("approvedBy", "name email")
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
 * @desc    Register new vehicle (Driver) or Create vehicle (Admin)
 * @access  Private/Driver/Admin
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

    // If driver is registering their vehicle
    if (req.user.role === "driver") {
      let driver = await Driver.findOne({ userId: req.user._id });

      if (!driver) {
        // Auto-create basic driver profile if it doesn't exist
        driver = await Driver.create({
          userId: req.user._id,
          fullName: req.user.name || "Driver",
          licenseNumber: `TEMP-${Date.now()}`, // Temporary license number
          licenseExpiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
          experience: 0,
        });
      }

      vehicleData.registeredBy = driver._id;
      vehicleData.approvalStatus = "pending";
      vehicleData.currentDriver = driver._id;
    } else if (req.user.role === "admin") {
      // Admin can directly approve
      vehicleData.approvalStatus = "approved";
      vehicleData.approvedBy = req.user._id;
      vehicleData.approvalDate = new Date();
    }

    const vehicle = await Vehicle.create(vehicleData);

    // Notify admins if driver registered
    if (req.user.role === "driver") {
      // Find all admin users
      const User = require("../models/User");
      const adminUsers = await User.find({ role: "admin" });

      // Create notification for each admin
      for (const admin of adminUsers) {
        await Notification.create({
          userId: admin._id,
          title: "New Vehicle Registration",
          message: `Driver has registered vehicle ${vehicle.plateNumber} for approval`,
          type: "vehicle_registration",
          relatedEntity: {
            entityType: "vehicle",
            entityId: vehicle._id,
          },
        });
      }
    }

    res.status(201).json({
      success: true,
      message:
        req.user.role === "driver"
          ? "Vehicle registered successfully. Awaiting admin approval."
          : "Vehicle created successfully",
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

/**
 * @route   PUT /api/vehicles/:id/approve
 * @desc    Approve vehicle registration
 * @access  Private/Admin
 */
const approveVehicle = async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id).populate(
      "registeredBy",
    );

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: "Vehicle not found",
      });
    }

    if (vehicle.approvalStatus === "approved") {
      return res.status(400).json({
        success: false,
        message: "Vehicle is already approved",
      });
    }

    vehicle.approvalStatus = "approved";
    vehicle.approvedBy = req.user._id;
    vehicle.approvalDate = new Date();
    vehicle.status = "available";

    await vehicle.save();

    // Notify driver
    if (vehicle.registeredBy && vehicle.registeredBy.userId) {
      await Notification.create({
        userId: vehicle.registeredBy.userId,
        title: "Vehicle Approved",
        message: `Your vehicle ${vehicle.plateNumber} has been approved and is now available for assignments`,
        type: "vehicle_approval",
        relatedEntity: {
          entityType: "vehicle",
          entityId: vehicle._id,
        },
      });
    }

    res.status(200).json({
      success: true,
      message: "Vehicle approved successfully",
      data: vehicle,
    });
  } catch (error) {
    console.error("Approve Vehicle Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * @route   PUT /api/vehicles/:id/reject
 * @desc    Reject vehicle registration
 * @access  Private/Admin
 */
const rejectVehicle = async (req, res) => {
  try {
    const { reason } = req.body;

    if (!reason) {
      return res.status(400).json({
        success: false,
        message: "Rejection reason is required",
      });
    }

    const vehicle = await Vehicle.findById(req.params.id).populate(
      "registeredBy",
    );

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: "Vehicle not found",
      });
    }

    vehicle.approvalStatus = "rejected";
    vehicle.rejectionReason = reason;
    vehicle.status = "inactive";

    await vehicle.save();

    // Notify driver
    if (vehicle.registeredBy && vehicle.registeredBy.userId) {
      await Notification.create({
        userId: vehicle.registeredBy.userId,
        title: "Vehicle Registration Rejected",
        message: `Your vehicle ${vehicle.plateNumber} registration was rejected. Reason: ${reason}`,
        type: "vehicle_rejection",
        relatedEntity: {
          entityType: "vehicle",
          entityId: vehicle._id,
        },
      });
    }

    res.status(200).json({
      success: true,
      message: "Vehicle rejected",
      data: vehicle,
    });
  } catch (error) {
    console.error("Reject Vehicle Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * @route   PUT /api/vehicles/:id/assign-customer
 * @desc    Assign vehicle to customer based on cargo type
 * @access  Private/Admin
 */
const assignVehicleToCustomer = async (req, res) => {
  try {
    const { customerId, itemType, shipmentId } = req.body;

    if (!customerId || !itemType) {
      return res.status(400).json({
        success: false,
        message: "Customer ID and item type are required",
      });
    }

    const vehicle = await Vehicle.findById(req.params.id).populate(
      "registeredBy",
    );

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: "Vehicle not found",
      });
    }

    // Check if vehicle is approved
    if (vehicle.approvalStatus !== "approved") {
      return res.status(400).json({
        success: false,
        message: "Only approved vehicles can be assigned",
      });
    }

    // Check if vehicle is available
    if (vehicle.status !== "available") {
      return res.status(400).json({
        success: false,
        message: `Vehicle is currently ${vehicle.status}`,
      });
    }

    // Verify customer exists
    const customer = await require("../models/Customer").findById(customerId);
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    // Assign vehicle to customer
    vehicle.assignedCustomer = customerId;
    vehicle.assignedItemType = itemType;
    vehicle.assignedAt = new Date();
    vehicle.status = "in_use";

    await vehicle.save();

    // Notify driver
    if (vehicle.registeredBy && vehicle.registeredBy.userId) {
      await Notification.create({
        userId: vehicle.registeredBy.userId,
        title: "Vehicle Assigned",
        message: `Your vehicle ${vehicle.plateNumber} has been assigned to deliver ${itemType}${shipmentId ? ` for shipment #${shipmentId}` : ""}`,
        type: "vehicle_assignment",
        relatedEntity: {
          entityType: "vehicle",
          entityId: vehicle._id,
        },
      });
    }

    res.status(200).json({
      success: true,
      message: "Vehicle assigned to customer successfully",
      data: vehicle,
    });
  } catch (error) {
    console.error("Assign Vehicle to Customer Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * @route   PUT /api/vehicles/:id/unassign
 * @desc    Unassign vehicle from customer
 * @access  Private/Admin
 */
const unassignVehicle = async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: "Vehicle not found",
      });
    }

    vehicle.assignedCustomer = null;
    vehicle.assignedItemType = null;
    vehicle.assignedAt = null;
    vehicle.status = "available";

    await vehicle.save();

    res.status(200).json({
      success: true,
      message: "Vehicle unassigned successfully",
      data: vehicle,
    });
  } catch (error) {
    console.error("Unassign Vehicle Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * @route   GET /api/vehicles/recommendations
 * @desc    Get vehicle recommendations based on cargo type
 * @access  Private/Admin
 */
const getVehicleRecommendations = async (req, res) => {
  try {
    const { itemType, weight, weightUnit } = req.query;

    if (!itemType) {
      return res.status(400).json({
        success: false,
        message: "Item type is required",
      });
    }

    const query = {
      approvalStatus: "approved",
      status: "available",
    };

    // Recommend vehicle type based on item type
    const itemTypeLower = itemType.toLowerCase();
    let recommendedTypes = [];

    if (
      itemTypeLower.includes("document") ||
      itemTypeLower.includes("envelope") ||
      itemTypeLower.includes("letter")
    ) {
      recommendedTypes = ["pickup", "van"];
    } else if (
      itemTypeLower.includes("furniture") ||
      itemTypeLower.includes("heavy") ||
      itemTypeLower.includes("machinery")
    ) {
      recommendedTypes = ["truck", "trailer"];
    } else if (
      itemTypeLower.includes("fragile") ||
      itemTypeLower.includes("electronics")
    ) {
      recommendedTypes = ["van", "pickup"];
    } else if (
      itemTypeLower.includes("bulk") ||
      itemTypeLower.includes("construction")
    ) {
      recommendedTypes = ["truck", "trailer"];
    } else {
      recommendedTypes = ["van", "pickup", "truck"];
    }

    if (recommendedTypes.length > 0) {
      query.type = { $in: recommendedTypes };
    }

    // Filter by weight capacity if provided
    if (weight && weightUnit) {
      const weightInKg = weightUnit === "ton" ? weight * 1000 : weight;
      query.$or = [
        { "capacity.weight": { $gte: weight }, "capacity.unit": weightUnit },
        { "capacity.weight": { $gte: weightInKg }, "capacity.unit": "kg" },
      ];
    }

    const vehicles = await Vehicle.find(query)
      .populate("registeredBy", "fullName phone")
      .populate("currentDriver", "fullName phone")
      .sort({ "capacity.weight": 1 })
      .limit(10);

    res.status(200).json({
      success: true,
      count: vehicles.length,
      itemType,
      recommendedTypes,
      data: vehicles,
    });
  } catch (error) {
    console.error("Get Vehicle Recommendations Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * @route   GET /api/vehicles/pending
 * @desc    Get pending vehicle registrations
 * @access  Private/Admin
 */
const getPendingVehicles = async (req, res) => {
  try {
    const vehicles = await Vehicle.find({ approvalStatus: "pending" })
      .populate("registeredBy", "fullName phone licenseNumber")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: vehicles.length,
      data: vehicles,
    });
  } catch (error) {
    console.error("Get Pending Vehicles Error:", error);
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
  approveVehicle,
  rejectVehicle,
  getPendingVehicles,
  assignVehicleToCustomer,
  unassignVehicle,
  getVehicleRecommendations,
};

const Shipment = require("../models/Shipment");
const Customer = require("../models/Customer");
const Trip = require("../models/Trip");
const Notification = require("../models/Notification");

/**
 * Shipment Management Controller
 *
 * Purpose: Core business logic for shipment operations
 * - Customer creates shipments
 * - Dispatcher approves and assigns
 * - Driver updates status
 * - Real-time tracking
 */

/**
 * @route   POST /api/shipments
 * @desc    Create new shipment (Customer)
 * @access  Private/Customer
 */
const createShipment = async (req, res) => {
  try {
    // Get customer profile
    const customer = await Customer.findOne({ userId: req.user._id });

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer profile not found",
      });
    }

    const shipmentData = {
      ...req.body,
      customerId: customer._id,
    };

    const shipment = await Shipment.create(shipmentData);

    // Update customer stats
    customer.totalShipments += 1;
    await customer.save();

    res.status(201).json({
      success: true,
      message: "Shipment created successfully",
      data: shipment,
    });
  } catch (error) {
    console.error("Create Shipment Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * @route   GET /api/shipments
 * @desc    Get all shipments with filters
 * @access  Private
 */
const getAllShipments = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const query = {};

    // Role-based filtering
    if (req.user.role === "customer") {
      const customer = await Customer.findOne({ userId: req.user._id });
      query.customerId = customer._id;
    } else if (req.user.role === "driver") {
      const driver = await Driver.findOne({ userId: req.user._id });
      query.driverId = driver._id;
    }

    if (status) query.status = status;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const shipments = await Shipment.find(query)
      .populate("customerId", "companyName")
      .populate("vehicleId", "plateNumber model type")
      .populate("driverId", "fullName phone")
      .limit(parseInt(limit))
      .skip(skip)
      .sort({ createdAt: -1 });

    const total = await Shipment.countDocuments(query);

    res.status(200).json({
      success: true,
      count: shipments.length,
      total,
      pages: Math.ceil(total / parseInt(limit)),
      currentPage: parseInt(page),
      data: shipments,
    });
  } catch (error) {
    console.error("Get Shipments Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * @route   GET /api/shipments/:id
 * @desc    Get single shipment
 * @access  Private
 */
const getShipmentById = async (req, res) => {
  try {
    const shipment = await Shipment.findById(req.params.id)
      .populate("customerId")
      .populate("vehicleId")
      .populate("driverId");

    if (!shipment) {
      return res.status(404).json({
        success: false,
        message: "Shipment not found",
      });
    }

    res.status(200).json({
      success: true,
      data: shipment,
    });
  } catch (error) {
    console.error("Get Shipment Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * @route   PUT /api/shipments/:id/assign
 * @desc    Assign driver and vehicle to shipment
 * @access  Private/Dispatcher/Admin
 */
const assignShipment = async (req, res) => {
  try {
    const { driverId, vehicleId } = req.body;

    const shipment = await Shipment.findById(req.params.id);

    if (!shipment) {
      return res.status(404).json({
        success: false,
        message: "Shipment not found",
      });
    }

    // Update shipment
    shipment.driverId = driverId;
    shipment.vehicleId = vehicleId;
    shipment.status = "assigned";

    shipment.statusHistory.push({
      status: "assigned",
      updatedBy: req.user._id,
      remarks: "Driver and vehicle assigned",
    });

    await shipment.save();

    // Create trip
    const trip = await Trip.create({
      shipmentId: shipment._id,
      driverId,
      vehicleId,
    });

    // Create notification for driver
    await Notification.create({
      userId: driverId,
      title: "New Trip Assigned",
      message: `You have been assigned to shipment ${shipment.shipmentNumber}`,
      type: "trip",
      relatedEntity: {
        entityType: "shipment",
        entityId: shipment._id,
      },
    });

    res.status(200).json({
      success: true,
      message: "Shipment assigned successfully",
      data: { shipment, trip },
    });
  } catch (error) {
    console.error("Assign Shipment Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * @route   PATCH /api/shipments/:id/status
 * @desc    Update shipment status
 * @access  Private
 */
const updateShipmentStatus = async (req, res) => {
  try {
    const { status, remarks } = req.body;

    const shipment = await Shipment.findById(req.params.id);

    if (!shipment) {
      return res.status(404).json({
        success: false,
        message: "Shipment not found",
      });
    }

    const oldStatus = shipment.status;
    shipment.status = status;

    // Update dates based on status
    if (status === "picked_up" && !shipment.actualPickupDate) {
      shipment.actualPickupDate = new Date();
    }
    if (status === "delivered" && !shipment.actualDeliveryDate) {
      shipment.actualDeliveryDate = new Date();
    }

    shipment.statusHistory.push({
      status,
      updatedBy: req.user._id,
      remarks,
    });

    await shipment.save();

    res.status(200).json({
      success: true,
      message: "Shipment status updated",
      data: shipment,
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
 * @route   DELETE /api/shipments/:id
 * @desc    Cancel/Delete shipment
 * @access  Private
 */
const deleteShipment = async (req, res) => {
  try {
    const shipment = await Shipment.findById(req.params.id);

    if (!shipment) {
      return res.status(404).json({
        success: false,
        message: "Shipment not found",
      });
    }

    // Only allow deletion if not started
    if (!["pending", "approved"].includes(shipment.status)) {
      return res.status(400).json({
        success: false,
        message: "Cannot delete shipment that is already in progress",
      });
    }

    shipment.status = "cancelled";
    await shipment.save();

    res.status(200).json({
      success: true,
      message: "Shipment cancelled successfully",
    });
  } catch (error) {
    console.error("Delete Shipment Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * @route   GET /api/shipments/stats
 * @desc    Get shipment statistics
 * @access  Private
 */
const getShipmentStats = async (req, res) => {
  try {
    const total = await Shipment.countDocuments();

    const byStatus = await Shipment.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    const revenue = await Shipment.aggregate([
      {
        $match: { status: "completed" },
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$pricing.totalAmount" },
        },
      },
    ]);

    res.status(200).json({
      success: true,
      data: {
        total,
        byStatus,
        totalRevenue: revenue[0]?.total || 0,
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
  createShipment,
  getAllShipments,
  getShipmentById,
  assignShipment,
  updateShipmentStatus,
  deleteShipment,
  getShipmentStats,
};

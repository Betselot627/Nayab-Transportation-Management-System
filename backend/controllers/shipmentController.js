const Shipment = require("../models/Shipment");
const Customer = require("../models/Customer");
const Driver = require("../models/Driver");
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

    // Trigger notification to Admin(s)
    try {
      const User = require("../models/User");
      const admins = await User.find({ role: "admin" });
      for (const admin of admins) {
        await Notification.create({
          userId: admin._id,
          title: "New Booking Pending Approval",
          message: `A new booking ${shipment.shipmentNumber || shipment._id} has been created and is pending approval.`,
          type: "shipment",
          priority: "medium",
          relatedEntity: {
            entityType: "shipment",
            entityId: shipment._id,
          },
        });
      }
    } catch (notifError) {
      console.error("Failed to trigger new booking notification to admins:", notifError.message);
    }

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
    const { driverId } = req.body;

    if (!driverId) {
      return res.status(400).json({
        success: false,
        message: "Driver ID is required",
      });
    }

    const shipment = await Shipment.findById(req.params.id);

    if (!shipment) {
      return res.status(404).json({
        success: false,
        message: "Shipment not found",
      });
    }

    // Verify driver exists
    const driver = await Driver.findById(driverId);
    if (!driver) {
      return res.status(404).json({
        success: false,
        message: "Driver not found",
      });
    }

    // Find driver's approved and available vehicles
    const Vehicle = require("../models/Vehicle");
    const driverVehicles = await Vehicle.find({
      registeredBy: driverId,
      approvalStatus: "approved",
      status: "available",
    }).sort({ "capacity.weight": 1 });

    if (driverVehicles.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Driver has no approved and available vehicles",
      });
    }

    // Smart vehicle selection based on cargo type
    const cargoType = shipment.cargoDetails?.type?.toLowerCase() || "";
    const cargoWeight = shipment.cargoDetails?.weight || 0;
    const cargoUnit = shipment.cargoDetails?.unit || "kg";

    let selectedVehicle = null;

    // Convert cargo weight to kg for comparison
    const cargoWeightKg =
      cargoUnit === "ton" ? cargoWeight * 1000 : cargoWeight;

    // Filter vehicles by type recommendation
    let recommendedVehicles = driverVehicles;

    if (
      cargoType.includes("document") ||
      cargoType.includes("envelope") ||
      cargoType.includes("letter")
    ) {
      recommendedVehicles = driverVehicles.filter((v) =>
        ["pickup", "van"].includes(v.type),
      );
    } else if (
      cargoType.includes("furniture") ||
      cargoType.includes("heavy") ||
      cargoType.includes("machinery")
    ) {
      recommendedVehicles = driverVehicles.filter((v) =>
        ["truck", "trailer"].includes(v.type),
      );
    } else if (
      cargoType.includes("fragile") ||
      cargoType.includes("electronics")
    ) {
      recommendedVehicles = driverVehicles.filter((v) =>
        ["van", "pickup"].includes(v.type),
      );
    } else if (
      cargoType.includes("bulk") ||
      cargoType.includes("construction")
    ) {
      recommendedVehicles = driverVehicles.filter((v) =>
        ["truck", "trailer"].includes(v.type),
      );
    }

    // If no type match, use all driver vehicles
    if (recommendedVehicles.length === 0) {
      recommendedVehicles = driverVehicles;
    }

    // Find vehicle with sufficient capacity
    for (const vehicle of recommendedVehicles) {
      const vehicleCapacityKg =
        vehicle.capacity.unit === "ton"
          ? vehicle.capacity.weight * 1000
          : vehicle.capacity.weight;

      if (vehicleCapacityKg >= cargoWeightKg) {
        selectedVehicle = vehicle;
        break;
      }
    }

    // If no vehicle with sufficient capacity, use the largest available
    if (!selectedVehicle) {
      selectedVehicle = recommendedVehicles[recommendedVehicles.length - 1];
    }

    // Update shipment
    shipment.driverId = driverId;
    shipment.vehicleId = selectedVehicle._id;
    shipment.status = "assigned";

    shipment.statusHistory.push({
      status: "assigned",
      updatedBy: req.user._id,
      remarks: `Driver and vehicle (${selectedVehicle.plateNumber}) auto-assigned`,
    });

    await shipment.save();

    // Update vehicle status
    selectedVehicle.status = "in_use";
    selectedVehicle.assignedCustomer = shipment.customerId;
    selectedVehicle.assignedItemType = shipment.cargoDetails?.type;
    selectedVehicle.assignedAt = new Date();
    await selectedVehicle.save();

    // Update driver status
    driver.status = "on_trip";
    await driver.save();

    // Create trip
    const trip = await Trip.create({
      shipmentId: shipment._id,
      driverId,
      vehicleId: selectedVehicle._id,
    });

    // Create notification for driver
    await Notification.create({
      userId: driver.userId,
      title: "New Trip Assigned",
      message: `You have been assigned to shipment ${shipment.shipmentNumber} with vehicle ${selectedVehicle.plateNumber}`,
      type: "trip",
      relatedEntity: {
        entityType: "shipment",
        entityId: shipment._id,
      },
    });

    res.status(200).json({
      success: true,
      message: "Shipment assigned successfully",
      data: {
        shipment,
        trip,
        selectedVehicle: {
          _id: selectedVehicle._id,
          plateNumber: selectedVehicle.plateNumber,
          type: selectedVehicle.type,
          model: selectedVehicle.model,
        },
      },
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

/**
 * @route   PUT /api/shipments/:id/approve
 * @desc    Approve booking and auto-assign available driver and vehicle (Admin only)
 * @access  Private/Admin
 */
const approveShipment = async (req, res) => {
  try {
    const shipment = await Shipment.findById(req.params.id);

    if (!shipment) {
      return res.status(404).json({
        success: false,
        message: "Shipment not found",
      });
    }

    if (shipment.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: `Shipment is already ${shipment.status} and cannot be approved.`,
      });
    }

    // Find all available drivers
    const drivers = await Driver.find({ status: "available" }).populate("userId");
    
    let selectedDriver = null;
    let selectedVehicle = null;

    const Vehicle = require("../models/Vehicle");

    // Loop through available drivers to find one who has an approved & available vehicle
    for (const driver of drivers) {
      const vehicles = await Vehicle.find({
        registeredBy: driver._id,
        approvalStatus: "approved",
        status: "available",
      });

      if (vehicles.length > 0) {
        selectedDriver = driver;

        // Auto selection based on weight capacity
        const cargoWeight = shipment.cargoDetails?.weight || 0;
        const cargoUnit = shipment.cargoDetails?.unit || "kg";
        const cargoWeightKg = cargoUnit === "ton" ? cargoWeight * 1000 : cargoWeight;

        // Sort vehicles by capacity ascending to find the smallest suitable vehicle
        vehicles.sort((a, b) => {
          const capA = a.capacity.unit === "ton" ? a.capacity.weight * 1000 : a.capacity.weight;
          const capB = b.capacity.unit === "ton" ? b.capacity.weight * 1000 : b.capacity.weight;
          return capA - capB;
        });

        // Pick first vehicle that can carry the load
        for (const vehicle of vehicles) {
          const vehicleCapKg = vehicle.capacity.unit === "ton" ? vehicle.capacity.weight * 1000 : vehicle.capacity.weight;
          if (vehicleCapKg >= cargoWeightKg) {
            selectedVehicle = vehicle;
            break;
          }
        }

        // Fallback: if no vehicle is large enough, pick the largest one
        if (!selectedVehicle) {
          selectedVehicle = vehicles[vehicles.length - 1];
        }
        break;
      }
    }

    if (!selectedDriver || !selectedVehicle) {
      return res.status(400).json({
        success: false,
        message: "No available driver with an approved and available vehicle could be found for auto-assignment.",
      });
    }

    // Update shipment details
    shipment.driverId = selectedDriver._id;
    shipment.vehicleId = selectedVehicle._id;
    shipment.status = "approved"; // Status transitions to approved
    shipment.statusHistory.push({
      status: "approved",
      updatedBy: req.user._id,
      remarks: `Booking approved. Auto-assigned driver ${selectedDriver.fullName} and vehicle ${selectedVehicle.plateNumber}.`,
    });

    await shipment.save();

    // Update vehicle status
    selectedVehicle.status = "in_use";
    selectedVehicle.assignedCustomer = shipment.customerId;
    selectedVehicle.assignedItemType = shipment.cargoDetails?.type;
    selectedVehicle.assignedAt = new Date();
    await selectedVehicle.save();

    // Update driver status
    selectedDriver.status = "on_trip";
    await selectedDriver.save();

    // Create the active trip
    const trip = await Trip.create({
      shipmentId: shipment._id,
      driverId: selectedDriver._id,
      vehicleId: selectedVehicle._id,
    });

    // Notify Driver
    if (selectedDriver.userId) {
      await Notification.create({
        userId: selectedDriver.userId._id,
        title: "New Trip Assigned",
        message: `You have been assigned to shipment ${shipment.shipmentNumber} with vehicle ${selectedVehicle.plateNumber}.`,
        type: "trip",
        relatedEntity: {
          entityType: "shipment",
          entityId: shipment._id,
        },
      });
    }

    // Notify Customer
    const customer = await Customer.findById(shipment.customerId);
    if (customer && customer.userId) {
      await Notification.create({
        userId: customer.userId,
        title: "Booking Approved",
        message: `Your booking ${shipment.shipmentNumber} has been approved and scheduled. Driver: ${selectedDriver.fullName}, Vehicle: ${selectedVehicle.plateNumber}.`,
        type: "shipment",
        relatedEntity: {
          entityType: "shipment",
          entityId: shipment._id,
        },
      });
    }

    res.status(200).json({
      success: true,
      message: "Shipment approved and driver/vehicle auto-assigned successfully",
      data: {
        shipment,
        trip,
      },
    });

  } catch (error) {
    console.error("Approve Shipment Error:", error);
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
  approveShipment,
};

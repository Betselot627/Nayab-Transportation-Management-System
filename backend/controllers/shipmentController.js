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
      if (!customer) {
        return res.status(200).json({
          success: true,
          count: 0,
          total: 0,
          pages: 0,
          currentPage: parseInt(page),
          data: [],
        });
      }
      query.customerId = customer._id;
    } else if (req.user.role === "driver") {
      const driver = await Driver.findOne({ userId: req.user._id });
      if (!driver) {
        return res.status(200).json({
          success: true,
          count: 0,
          total: 0,
          pages: 0,
          currentPage: parseInt(page),
          data: [],
        });
      }
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
      .populate({
        path: "customerId",
        populate: {
          path: "userId",
          select: "name email phone profileImage"
        }
      })
      .populate("vehicleId")
      .populate({
        path: "driverId",
        populate: {
          path: "userId",
          select: "name email phone profileImage"
        }
      });

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

    if (!driverId || !vehicleId) {
      return res.status(400).json({
        success: false,
        message: "Both Driver ID and Vehicle ID are required for manual assignment.",
      });
    }

    const shipment = await Shipment.findById(req.params.id);
    if (!shipment) {
      return res.status(404).json({
        success: false,
        message: "Shipment not found",
      });
    }

    // Verify driver exists and is available
    const driver = await Driver.findById(driverId);
    if (!driver) {
      return res.status(404).json({
        success: false,
        message: "Driver not found",
      });
    }
    if (driver.status !== "available") {
      return res.status(400).json({
        success: false,
        message: `Driver ${driver.fullName} is currently not available (Status: ${driver.status})`,
      });
    }

    // Verify vehicle exists, is approved, and available
    const Vehicle = require("../models/Vehicle");
    const vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: "Vehicle not found",
      });
    }
    if (vehicle.status !== "available" || vehicle.approvalStatus !== "approved") {
      return res.status(400).json({
        success: false,
        message: `Vehicle ${vehicle.plateNumber} is not approved or available (Status: ${vehicle.status}, Approval: ${vehicle.approvalStatus})`,
      });
    }

    // Verify vehicle capacity meets shipment cargo size requirements
    const cargoWeight = shipment.cargoDetails?.weight || 0;
    const cargoUnit = shipment.cargoDetails?.unit || "kg";
    const cargoWeightKg = cargoUnit === "ton" ? cargoWeight * 1005 : cargoWeight;

    const vehicleCap = vehicle.capacity?.weight || 0;
    const vehicleUnit = vehicle.capacity?.unit || "kg";
    const vehicleCapKg = vehicleUnit === "ton" ? vehicleCap * 1000 : vehicleCap;

    if (vehicleCapKg < cargoWeightKg) {
      return res.status(400).json({
        success: false,
        message: `Vehicle ${vehicle.plateNumber} capacity (${vehicleCap} ${vehicleUnit}) is insufficient for cargo weight (${cargoWeight} ${cargoUnit})`,
      });
    }

    // Verify driver-vehicle relationship (either registered by driver or is a fleet vehicle)
    if (vehicle.registeredBy && String(vehicle.registeredBy) !== String(driver._id)) {
      return res.status(400).json({
        success: false,
        message: `Vehicle ${vehicle.plateNumber} is registered to another driver and cannot be manually assigned to ${driver.fullName}`,
      });
    }

    // Update shipment
    shipment.driverId = driverId;
    shipment.vehicleId = vehicle._id;
    shipment.status = "assigned";

    shipment.statusHistory.push({
      status: "assigned",
      updatedBy: req.user._id,
      remarks: `Driver and vehicle (${vehicle.plateNumber}) manually assigned`,
    });

    await shipment.save();

    // Update vehicle status
    vehicle.status = "in_use";
    vehicle.assignedCustomer = shipment.customerId;
    vehicle.assignedItemType = shipment.cargoDetails?.type;
    vehicle.assignedAt = new Date();
    await vehicle.save();

    // Update driver status
    driver.status = "on_trip";
    driver.lastAssignedAt = new Date();
    driver.totalTrips = (driver.totalTrips || 0) + 1;
    await driver.save();

    // Create trip
    const trip = await Trip.create({
      shipmentId: shipment._id,
      driverId,
      vehicleId: vehicle._id,
    });

    // Create notification for driver
    await Notification.create({
      userId: driver.userId,
      title: "New Trip Assigned",
      message: `You have been assigned to shipment ${shipment.shipmentNumber} with vehicle ${vehicle.plateNumber}`,
      type: "trip",
      relatedEntity: {
        entityType: "trip",
        entityId: trip._id,
      },
    });

    // Create notification for customer
    const customer = await Customer.findById(shipment.customerId);
    if (customer && customer.userId) {
      await Notification.create({
        userId: customer.userId,
        title: "Shipment Assigned & Dispatched",
        message: `Your booking ${shipment.shipmentNumber} has been assigned to driver ${driver.fullName} with vehicle ${vehicle.plateNumber}. You can now track it live!`,
        type: "shipment",
        relatedEntity: {
          entityType: "shipment",
          entityId: shipment._id,
        },
      });
    }

    res.status(200).json({
      success: true,
      message: "Shipment manually assigned successfully",
      data: {
        shipment,
        trip,
        selectedVehicle: {
          _id: vehicle._id,
          plateNumber: vehicle.plateNumber,
          type: vehicle.type,
          model: vehicle.model,
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

    // Notify Customer when status changes
    try {
      const customer = await Customer.findById(shipment.customerId);
      if (customer && customer.userId) {
        await Notification.create({
          userId: customer.userId,
          title: "Shipment Status Updated",
          message: `Your booking ${shipment.shipmentNumber || shipment._id} status has been updated to "${status.replace("_", " ")}".`,
          type: "shipment",
          priority: "medium",
          relatedEntity: {
            entityType: "shipment",
            entityId: shipment._id,
          },
        });
      }
    } catch (notifErr) {
      console.error("Failed to notify customer on status update:", notifErr);
    }

    // Notify Driver when status changes
    try {
      if (shipment.driverId) {
        const Driver = require("../models/Driver");
        const driver = await Driver.findById(shipment.driverId);
        if (driver && driver.userId) {
          const Notification = require("../models/Notification");
          await Notification.create({
            userId: driver.userId,
            title: "Shipment Details Updated",
            message: `Shipment ${shipment.shipmentNumber || shipment._id} status has been updated to "${status.replace("_", " ")}".`,
            type: "trip",
            priority: "medium",
            relatedEntity: {
              entityType: "shipment",
              entityId: shipment._id,
            },
          });
        }
      }
    } catch (driverNotifErr) {
      console.error("Failed to notify driver on status update:", driverNotifErr);
    }

    res.status(200).json({
      success: true,
      message: "Shipment status updated successfully",
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

    // Find all available drivers sorted by longest waiting first (fair queue)
    const drivers = await Driver.find({ status: "available" })
      .populate("userId")
      .sort({ lastAssignedAt: 1, createdAt: 1 });
    
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
    selectedDriver.lastAssignedAt = new Date();
    selectedDriver.totalTrips = (selectedDriver.totalTrips || 0) + 1;
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
         userId: selectedDriver.userId._id || selectedDriver.userId,
         title: "New Trip Assigned",
         message: `You have been assigned to shipment ${shipment.shipmentNumber} with vehicle ${selectedVehicle.plateNumber}.`,
         type: "trip",
         relatedEntity: {
           entityType: "trip",
           entityId: trip._id,
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

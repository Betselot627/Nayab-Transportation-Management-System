const Shipment = require("../models/Shipment");
const Customer = require("../models/Customer");
const Driver = require("../models/Driver");
const Vehicle = require("../models/Vehicle");
const User = require("../models/User");
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

const { calculateShipmentPrice } = require("../utils/pricingCalculator");

/**
 * @route   POST /api/shipments
 * @desc    Create new shipment (Customer)
 * @access  Private/Customer
 */
const createShipment = async (req, res) => {
  try {
    // Get customer profile
    let customer = await Customer.findOne({ userId: req.user._id });

    if (!customer) {
      customer = await Customer.create({
        userId: req.user._id,
        companyName: req.user.name,
        contactPerson: {
          name: req.user.name,
          phone: req.user.phone || "+251911000000",
          email: req.user.email,
        },
      });
    }

    const payload = { ...req.body };

    // Auto-calculate price if not supplied or zero
    if (!payload.pricing?.totalAmount || payload.pricing?.totalAmount <= 0) {
      const priceEst = calculateShipmentPrice({
        pickupCity: payload.pickupLocation?.city,
        deliveryCity: payload.destination?.city,
        weight: payload.cargoDetails?.weight || 100,
        unit: payload.cargoDetails?.unit || "kg",
        distanceKm: payload.distance || 0,
      });

      payload.distance = priceEst.distanceKm;
      payload.pricing = {
        baseAmount: priceEst.baseFee,
        additionalCharges: priceEst.weightSurcharge,
        totalAmount: priceEst.totalAmount,
        currency: "ETB",
      };
      payload.finalPrice = priceEst.totalAmount;
    } else {
      payload.finalPrice = payload.pricing.totalAmount;
    }

    payload.customerId = customer._id;
    payload.status = "pending"; // Always starts as Pending Approval

    // Default scheduledPickupDate if omitted or empty string
    if (!payload.scheduledPickupDate || payload.scheduledPickupDate === "") {
      payload.scheduledPickupDate = new Date(Date.now() + 24 * 60 * 60 * 1000); // default to tomorrow
    } else {
      payload.scheduledPickupDate = new Date(payload.scheduledPickupDate);
    }

    if (!payload.estimatedDeliveryDate || payload.estimatedDeliveryDate === "") {
      delete payload.estimatedDeliveryDate;
    } else {
      payload.estimatedDeliveryDate = new Date(payload.estimatedDeliveryDate);
    }

    const shipment = await Shipment.create(payload);

    // Update customer stats
    customer.totalShipments = (customer.totalShipments || 0) + 1;
    await customer.save();

    // Trigger notification to Admin(s)
    try {
      const User = require("../models/User");
      const admins = await User.find({ role: "admin" });
      const pickupCity = shipment.pickupLocation?.city || "Origin";
      const destCity = shipment.destination?.city || "Destination";
      const cargoType = shipment.cargoDetails?.type || "General";
      const cargoWeight = shipment.cargoDetails?.weight || 0;
      const cargoUnit = shipment.cargoDetails?.unit || "kg";
      const schedDate = shipment.scheduledPickupDate ? new Date(shipment.scheduledPickupDate).toLocaleDateString() : "Immediate";
      const customerName = customer.companyName || req.user.name;

      for (const admin of admins) {
        await Notification.create({
          userId: admin._id,
          title: "New Booking Pending Approval",
          message: `New booking #${shipment.shipmentNumber} from ${customerName}. Route: ${pickupCity} → ${destCity}. Cargo: ${cargoType} (${cargoWeight} ${cargoUnit}). Date: ${schedDate}.`,
          type: "shipment",
          priority: "high",
          actionUrl: "/admin/shipments",
          relatedEntity: {
            entityType: "shipment",
            entityId: shipment._id,
          },
        });
      }

      // Customer confirmation notification
      await Notification.create({
        userId: req.user._id,
        title: "Booking Submitted Successfully",
        message: `Your booking #${shipment.shipmentNumber} (${pickupCity} → ${destCity}) has been submitted and is awaiting Admin approval.`,
        type: "shipment",
        priority: "medium",
        actionUrl: "/customer/my-bookings",
        relatedEntity: {
          entityType: "shipment",
          entityId: shipment._id,
        },
      });
    } catch (notifError) {
      console.error("Failed to trigger new booking notification:", notifError.message);
    }

    res.status(201).json({
      success: true,
      message: "Shipment booking created successfully. Awaiting Admin approval.",
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
    const { status, page = 1, limit = 50 } = req.query;
    const query = {};

    // Role-based filtering
    if (req.user.role === "customer") {
      let customer = await Customer.findOne({ userId: req.user._id }).select("_id");
      if (!customer) {
        customer = await Customer.create({
          userId: req.user._id,
          companyName: req.user.name,
          contactPerson: {
            name: req.user.name,
            phone: req.user.phone || "+251911000000",
            email: req.user.email,
          },
        });
      }
      query.$or = [{ customerId: customer._id }, { customerId: req.user._id }];
    } else if (req.user.role === "driver") {
      let driver = await Driver.findOne({ userId: req.user._id }).select("_id");
      if (!driver) {
        const uniqueLicense = `DL-${req.user._id.toString().slice(-6).toUpperCase()}`;
        driver = await Driver.create({
          userId: req.user._id,
          fullName: req.user.name || "Driver",
          licenseNumber: uniqueLicense,
          licenseExpiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
          experience: 1,
          status: "available",
        });
      }
      query.$or = [{ driverId: driver._id }, { driverId: req.user._id }];
    }

    if (status && status !== "all") query.status = status;

    const limitNum = parseInt(limit);
    const skip = (parseInt(page) - 1) * limitNum;

    const [shipments, total] = await Promise.all([
      Shipment.find(query)
        .populate({
          path: "customerId",
          select: "companyName contactPerson address userId",
          populate: {
            path: "userId",
            select: "name email phone profileImage status",
          },
        })
        .populate("vehicleId", "plateNumber model manufacturer type capacity status")
        .populate({
          path: "driverId",
          select: "fullName licenseNumber experience status userId",
          populate: {
            path: "userId",
            select: "name email phone profileImage",
          },
        })
        .limit(limitNum)
        .skip(skip)
        .sort({ createdAt: -1 })
        .lean(),
      Shipment.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      count: shipments.length,
      total,
      pages: Math.ceil(total / limitNum),
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

    const User = require("../models/User");
    const customer = await Customer.findById(shipment.customerId).populate("userId");
    const driverUser = await User.findById(driver.userId);
    const customerUser = customer?.userId;

    // Create notification for driver
    const customerName = customerUser?.name || customer?.companyName || "Valued Customer";
    const customerPhone = customerUser?.phone || customer?.contactPerson?.phone || "N/A";
    const pickupLoc = shipment.pickupLocation?.city || "Pickup Location";
    const destLoc = shipment.destination?.city || "Destination";
    const cargoDesc = `${shipment.cargoDetails?.type || "Cargo"} (${shipment.cargoDetails?.weight || 0} ${shipment.cargoDetails?.unit || "kg"})`;
    const schedDate = shipment.scheduledPickupDate ? new Date(shipment.scheduledPickupDate).toLocaleDateString() : "Immediate";

    await Notification.create({
      userId: driver.userId,
      title: "New Trip Assigned",
      message: `You have been assigned to shipment #${shipment.shipmentNumber}. Customer: ${customerName} (${customerPhone}). Route: ${pickupLoc} → ${destLoc}. Cargo: ${cargoDesc}. Vehicle: ${vehicle.plateNumber}. Scheduled: ${schedDate}.`,
      type: "trip",
      priority: "high",
      actionUrl: "/driver/my-trips",
      relatedEntity: {
        entityType: "trip",
        entityId: trip._id,
      },
    });

    // Create notification for customer
    if (customer && customer.userId) {
      await Notification.create({
        userId: customer.userId._id || customer.userId,
        title: "Shipment Assigned & Dispatched",
        message: `Your booking #${shipment.shipmentNumber} has been assigned to driver ${driver.fullName} (${driverUser?.phone || "Contact via App"}) with vehicle ${vehicle.plateNumber} (${vehicle.manufacturer} ${vehicle.model}). Live tracking is ready!`,
        type: "shipment",
        priority: "high",
        actionUrl: `/customer/track-shipment/${shipment._id}`,
        relatedEntity: {
          entityType: "shipment",
          entityId: shipment._id,
        },
      });
    }

    // Create notification for Admins
    const admins = await User.find({ role: "admin" });
    for (const admin of admins) {
      await Notification.create({
        userId: admin._id,
        title: "Shipment Assigned",
        message: `Shipment #${shipment.shipmentNumber} assigned to driver ${driver.fullName} and vehicle ${vehicle.plateNumber}.`,
        type: "shipment",
        priority: "medium",
        actionUrl: "/admin/shipments",
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
    const [total, byStatus, revenue] = await Promise.all([
      Shipment.countDocuments(),
      Shipment.aggregate([
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 },
          },
        },
      ]),
      Shipment.aggregate([
        {
          $match: { status: "completed" },
        },
        {
          $group: {
            _id: null,
            total: { $sum: "$pricing.totalAmount" },
          },
        },
      ]),
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
 * @desc    Approve booking, confirm final price, and assign suitable driver & vehicle (Admin only)
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

    if (shipment.status !== "pending" && shipment.status !== "approved") {
      return res.status(400).json({
        success: false,
        message: `Shipment is currently ${shipment.status} and cannot be re-approved.`,
      });
    }

    const { finalPrice, driverId, vehicleId } = req.body || {};

    // 1. Confirm and save final price
    if (finalPrice && parseFloat(finalPrice) > 0) {
      shipment.finalPrice = parseFloat(finalPrice);
      if (!shipment.pricing) shipment.pricing = {};
      shipment.pricing.totalAmount = parseFloat(finalPrice);
    } else if (!shipment.finalPrice || shipment.finalPrice <= 0) {
      // Auto-calculate if price was 0
      const priceEst = calculateShipmentPrice({
        pickupCity: shipment.pickupLocation?.city,
        deliveryCity: shipment.destination?.city,
        weight: shipment.cargoDetails?.weight || 100,
        unit: shipment.cargoDetails?.unit || "kg",
        distanceKm: shipment.distance || 0,
      });
      shipment.finalPrice = priceEst.totalAmount;
      if (!shipment.pricing) shipment.pricing = {};
      shipment.pricing.totalAmount = priceEst.totalAmount;
    }

    shipment.priceConfirmedBy = req.user._id;
    shipment.priceConfirmedAt = new Date();

    const Vehicle = require("../models/Vehicle");
    let selectedDriver = null;
    let selectedVehicle = null;
    let trip = null;

    // 2. Handle manual driver & vehicle assignment if provided
    if (driverId && vehicleId) {
      const d = await Driver.findById(driverId).populate("userId");
      const v = await Vehicle.findById(vehicleId);

      if (!d || d.status !== "available") {
        return res.status(400).json({
          success: false,
          message: "Selected driver is not available.",
        });
      }
      if (!v || v.status !== "available" || v.approvalStatus !== "approved") {
        return res.status(400).json({
          success: false,
          message: "Selected vehicle is not approved or available.",
        });
      }

      selectedDriver = d;
      selectedVehicle = v;
    } else if (!shipment.driverId) {
      // Auto-search available drivers & vehicles
      const drivers = await Driver.find({ status: "available" })
        .populate("userId")
        .sort({ lastAssignedAt: 1, createdAt: 1 });

      const cargoWeight = shipment.cargoDetails?.weight || 0;
      const cargoUnit = shipment.cargoDetails?.unit || "kg";
      const cargoWeightKg = cargoUnit === "ton" ? cargoWeight * 1000 : cargoWeight;

      for (const d of drivers) {
        const vehicles = await Vehicle.find({
          registeredBy: d._id,
          approvalStatus: "approved",
          status: "available",
        });

        if (vehicles.length > 0) {
          const suitable = vehicles.find((v) => {
            const capKg = v.capacity.unit === "ton" ? v.capacity.weight * 1000 : v.capacity.weight;
            return capKg >= cargoWeightKg;
          }) || vehicles[0];

          selectedDriver = d;
          selectedVehicle = suitable;
          break;
        }
      }
    }

    // 3. Assign driver & vehicle if matched
    if (selectedDriver && selectedVehicle) {
      shipment.driverId = selectedDriver._id;
      shipment.vehicleId = selectedVehicle._id;

      selectedVehicle.status = "in_use";
      selectedVehicle.assignedCustomer = shipment.customerId;
      selectedVehicle.assignedItemType = shipment.cargoDetails?.type;
      selectedVehicle.assignedAt = new Date();
      await selectedVehicle.save();

      selectedDriver.status = "on_trip";
      selectedDriver.lastAssignedAt = new Date();
      selectedDriver.totalTrips = (selectedDriver.totalTrips || 0) + 1;
      await selectedDriver.save();

      // Check if active trip already exists
      trip = await Trip.findOne({ shipmentId: shipment._id });
      if (!trip) {
        trip = await Trip.create({
          shipmentId: shipment._id,
          driverId: selectedDriver._id,
          vehicleId: selectedVehicle._id,
        });
      }
    }

    shipment.status = "approved";
    shipment.statusHistory.push({
      status: "approved",
      updatedBy: req.user._id,
      remarks: `Booking approved with confirmed price ${shipment.finalPrice.toLocaleString()} ETB.${selectedDriver ? ` Assigned driver: ${selectedDriver.fullName}` : ""}`,
    });

    await shipment.save();

    // 4. Notify Customer that booking is approved and ready for payment
    setImmediate(async () => {
      try {
        const customer = await Customer.findById(shipment.customerId);
        if (customer && customer.userId) {
          await Notification.create({
            userId: customer.userId,
            title: "Booking Approved - Ready for Payment",
            message: `Your booking ${shipment.shipmentNumber} has been approved for ${shipment.finalPrice.toLocaleString()} ETB. You can now proceed to payment via Chapa (Telebirr / CBE Birr).`,
            type: "payment",
            priority: "high",
            relatedEntity: {
              entityType: "shipment",
              entityId: shipment._id,
            },
          });
        }

        if (selectedDriver && selectedDriver.userId) {
          await Notification.create({
            userId: selectedDriver.userId._id || selectedDriver.userId,
            title: "New Shipment Assigned",
            message: `You have been assigned to shipment ${shipment.shipmentNumber} (${shipment.pickupLocation?.city} → ${shipment.destination?.city}).`,
            type: "trip",
            priority: "medium",
            relatedEntity: {
              entityType: "shipment",
              entityId: shipment._id,
            },
          });
        }
      } catch (notifErr) {
        console.error("Approval notification error:", notifErr);
      }
    });

    res.status(200).json({
      success: true,
      message: "Shipment booking approved successfully. Ready for customer payment.",
      data: {
        shipment,
        trip,
        finalPrice: shipment.finalPrice,
        selectedDriver: selectedDriver ? { _id: selectedDriver._id, fullName: selectedDriver.fullName } : null,
        selectedVehicle: selectedVehicle ? { _id: selectedVehicle._id, plateNumber: selectedVehicle.plateNumber } : null,
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

/**
 * @route   PUT /api/shipments/:id/confirm-price
 * @desc    Confirm final transportation price (Admin/Dispatcher)
 * @access  Private/Admin/Dispatcher
 */
const confirmFinalPrice = async (req, res) => {
  try {
    const { finalPrice } = req.body;

    if (!finalPrice || isNaN(finalPrice) || Number(finalPrice) <= 0) {
      return res.status(400).json({
        success: false,
        message: "A valid positive final price amount is required",
      });
    }

    const shipment = await Shipment.findById(req.params.id);
    if (!shipment) {
      return res.status(404).json({
        success: false,
        message: "Shipment not found",
      });
    }

    shipment.finalPrice = Number(finalPrice);
    shipment.pricing = shipment.pricing || {};
    shipment.pricing.totalAmount = Number(finalPrice);
    shipment.pricing.currency = "ETB";
    shipment.priceConfirmedBy = req.user._id;
    shipment.priceConfirmedAt = new Date();
    if (shipment.status === "pending") {
      shipment.status = "approved";
    }

    await shipment.save();

    // Notify Customer that final price is confirmed and PAY NOW is available
    const customer = await Customer.findById(shipment.customerId);
    if (customer && customer.userId) {
      await Notification.create({
        userId: customer.userId,
        title: "Final Price Confirmed - Ready to Pay",
        message: `The transportation price for booking ${shipment.shipmentNumber} has been confirmed at ${Number(finalPrice).toLocaleString()} ETB. You can now click PAY NOW to complete payment.`,
        type: "payment",
        priority: "high",
        relatedEntity: {
          entityType: "shipment",
          entityId: shipment._id,
        },
      });
    }

    res.status(200).json({
      success: true,
      message: "Final transportation price confirmed successfully. Customer has been notified to pay.",
      data: shipment,
    });
  } catch (error) {
    console.error("Confirm Final Price Error:", error);
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
  confirmFinalPrice,
};


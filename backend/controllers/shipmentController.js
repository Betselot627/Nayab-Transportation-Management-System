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

// ---------- Assignment helpers (shared) ----------
const toKg = (weight, unit = "kg") =>
  String(unit).toLowerCase() === "ton"
    ? Number(weight || 0) * 1000
    : Number(weight || 0);

// Cargo type keyword -> suitable vehicle types (see SHIPMENT_ASSIGNMENT_WORKFLOW.md)
const preferredVehicleTypes = (cargoType = "") => {
  const t = String(cargoType).toLowerCase();
  if (/document|envelope|letter|parcel/.test(t)) return ["pickup", "van"];
  if (/furniture|heavy|machinery|construction|bulk/.test(t)) return ["truck", "trailer"];
  if (/fragile|electronic|glass/.test(t)) return ["van", "pickup"];
  return null;
};

const vehicleCapacityKg = (vehicle) =>
  toKg(vehicle.capacity?.weight, vehicle.capacity?.unit);

/**
 * Rank vehicles best-first for a given cargo type/weight:
 * 1. Prefer vehicles whose capacity can carry the cargo
 * 2. Among those prefer cargo-type-appropriate vehicles
 * 3. Within that pool, prefer the smallest sufficient capacity
 */
const rankVehiclesForCargo = (vehicles, cargoType, cargoWeightKg) => {
  if (!vehicles || vehicles.length === 0) return [];
  const sufficient = vehicles.filter((v) => vehicleCapacityKg(v) >= cargoWeightKg);
  let pool = sufficient.length > 0 ? sufficient : [...vehicles];

  const preferred = preferredVehicleTypes(cargoType);
  if (preferred) {
    const matching = pool.filter((v) =>
      preferred.includes(String(v.type || "").toLowerCase()),
    );
    if (matching.length > 0) pool = matching;
  }

  return [...pool].sort(
    (a, b) => vehicleCapacityKg(a) - vehicleCapacityKg(b),
  );
};

/**
 * @route   POST /api/shipments/quote
 * @desc    Calculate estimated shipping price (cargo weight + delivery distance)
 * @access  Private
 *
 * Body: { pickupCity, deliveryCity, weight, unit, distanceKm? }
 */
const quoteShipmentPrice = async (req, res) => {
  try {
    const { pickupCity, deliveryCity, weight, unit, distanceKm } = req.body || {};

    const estimate = calculateShipmentPrice({
      pickupCity,
      deliveryCity,
      weight,
      unit,
      distanceKm,
    });

    res.status(200).json({
      success: true,
      data: {
        ...estimate,
        estimatedPrice: estimate.totalAmount,
      },
    });
  } catch (error) {
    console.error("Quote Shipment Price Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * @route   GET /api/shipments/:id/suggestions
 * @desc    Ranked available drivers & recommended vehicles for a shipment,
 *          including each driver's auto-calculated payment (commission)
 * @access  Private/Admin/Dispatcher
 */
const getShipmentSuggestions = async (req, res) => {
  try {
    const shipment = await Shipment.findById(req.params.id);
    if (!shipment) {
      return res.status(404).json({
        success: false,
        message: "Shipment not found",
      });
    }

    if (shipment.driverId && shipment.status !== "pending" && shipment.status !== "approved") {
      return res.status(400).json({
        success: false,
        message: `Shipment is already assigned (status: ${shipment.status})`,
      });
    }

    const cargoWeightKg = toKg(shipment.cargoDetails?.weight, shipment.cargoDetails?.unit);
    const cargoType = shipment.cargoDetails?.type || "";
    const finalPrice =
      shipment.finalPrice || shipment.pricing?.totalAmount || 0;

    // Available drivers, fair-queue first
    const drivers = await Driver.find({ status: "available" })
      .populate("userId")
      .sort({ lastAssignedAt: 1, createdAt: 1 });

    // All approved + available vehicles (fleet + driver-registered)
    const allAvailableVehicles = await Vehicle.find({
      approvalStatus: "approved",
      status: "available",
    }).populate("registeredBy", "fullName userId");

    const suggestions = [];

    for (const driver of drivers) {
      const driverIdStr = String(driver._id);
      const driverUserIdStr = driver.userId ? String(driver.userId._id || driver.userId) : "";

      // Vehicles this driver may use: own registered + company fleet (no owner)
      const eligibleVehicles = allAvailableVehicles.filter((v) => {
        if (!v.registeredBy) return true;
        const ownerId = String(v.registeredBy._id || v.registeredBy);
        const ownerUserId = v.registeredBy.userId
          ? String(v.registeredBy.userId._id || v.registeredBy.userId)
          : "";
        return ownerId === driverIdStr || (driverUserIdStr && ownerUserId === driverUserIdStr);
      });

      const ranked = rankVehiclesForCargo(eligibleVehicles, cargoType, cargoWeightKg);
      if (ranked.length === 0) continue;

      const recommended = ranked[0];
      const commissionRate = Number(driver.commissionRate) > 0 ? Number(driver.commissionRate) : 15;
      const estimatedDriverPayment = Math.round((finalPrice * commissionRate) / 100);
      const capacitySufficient = vehicleCapacityKg(recommended) >= cargoWeightKg;

      suggestions.push({
        driver: {
          _id: driver._id,
          fullName: driver.fullName,
          licenseNumber: driver.licenseNumber,
          phone: driver.userId?.phone,
          rating: driver.rating,
          experience: driver.experience,
          completedTrips: driver.completedTrips,
        },
        vehicle: {
          _id: recommended._id,
          plateNumber: recommended.plateNumber,
          type: recommended.type,
          manufacturer: recommended.manufacturer,
          model: recommended.model,
          capacityWeight: recommended.capacity?.weight,
          capacityUnit: recommended.capacity?.unit,
          isOwnerOperated: Boolean(recommended.registeredBy),
        },
        alternativeVehicleIds: ranked.slice(1, 4).map((v) => v._id),
        estimatedDriverPayment,
        commissionRate,
        match: {
          capacitySufficient,
          typeMatched: (() => {
            const preferred = preferredVehicleTypes(cargoType);
            return preferred
              ? preferred.includes(String(recommended.type || "").toLowerCase())
              : true;
          })(),
        },
      });
    }

    // Rank drivers: rating first, then completed trips; fair queue as tie-breaker
    suggestions.sort((a, b) => {
      const byRating = (b.driver.rating || 0) - (a.driver.rating || 0);
      if (byRating !== 0) return byRating;
      const byTrips = (b.driver.completedTrips || 0) - (a.driver.completedTrips || 0);
      if (byTrips !== 0) return byTrips;
      return b.match.capacitySufficient - a.match.capacitySufficient;
    });

    res.status(200).json({
      success: true,
      data: {
        shipmentId: shipment._id,
        shipmentNumber: shipment.shipmentNumber,
        finalPrice,
        currency: "ETB",
        count: suggestions.length,
        suggestions: suggestions.slice(0, 8),
      },
    });
  } catch (error) {
    console.error("Get Shipment Suggestions Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

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

    // Always auto-calculate price server-side from cargo size/weight & delivery
    // distance. Client-supplied amounts are ignored (admin confirms final price later).
    const priceEst = calculateShipmentPrice({
      pickupCity: payload.pickupLocation?.city,
      deliveryCity: payload.destination?.city,
      weight: payload.cargoDetails?.weight || 100,
      unit: payload.cargoDetails?.unit || "kg",
      distanceKm:
        payload.distance && Number(payload.distance) > 0
          ? Number(payload.distance)
          : 0,
    });

    payload.distance = priceEst.distanceKm;
    payload.pricing = {
      baseAmount: priceEst.baseFee,
      additionalCharges: priceEst.distanceCost + priceEst.weightSurcharge,
      totalAmount: priceEst.totalAmount,
      currency: "ETB",
    };
    // Estimated price until an admin confirms the final amount
    payload.finalPrice = priceEst.totalAmount;

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
    const cargoWeightKg = toKg(shipment.cargoDetails?.weight, shipment.cargoDetails?.unit);

    const vehicleCapKg = vehicleCapacityKg(vehicle);

    if (vehicleCapKg < cargoWeightKg) {
      return res.status(400).json({
        success: false,
        message: `Vehicle ${vehicle.plateNumber} capacity (${vehicle.capacity?.weight} ${vehicle.capacity?.unit || "kg"}) is insufficient for cargo weight (${shipment.cargoDetails?.weight} ${shipment.cargoDetails?.unit || "kg"})`,
      });
    }

    // Verify driver-vehicle relationship (if registered by driver, check driver._id or driver.userId)
    if (vehicle.registeredBy) {
      const ownerId = String(vehicle.registeredBy._id || vehicle.registeredBy);
      const isMatch =
        ownerId === String(driver._id) ||
        (driver.userId && ownerId === String(driver.userId));

      if (!isMatch && req.user.role !== "admin") {
        return res.status(400).json({
          success: false,
          message: `Vehicle ${vehicle.plateNumber} is registered to another driver and cannot be manually assigned to ${driver.fullName}`,
        });
      }
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

    // Auto-calculated driver payment for this shipment (commission-based)
    const commissionRate = Number(driver.commissionRate) > 0 ? Number(driver.commissionRate) : 15;
    const expectedDriverPay = Math.round(
      ((shipment.finalPrice || shipment.pricing?.totalAmount || 0) * commissionRate) / 100,
    );

    await Notification.create({
      userId: driver.userId,
      title: "New Trip Assigned",
      message: `You have been assigned to shipment #${shipment.shipmentNumber}. Customer: ${customerName} (${customerPhone}). Route: ${pickupLoc} → ${destLoc}. Cargo: ${cargoDesc}. Vehicle: ${vehicle.plateNumber}. Scheduled: ${schedDate}. Estimated payment: ${expectedDriverPay.toLocaleString()} ETB (${commissionRate}% commission).`,
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
 * @desc    Update shipment status (Enforces strict 5-stage workflow: Booked -> Picked Up -> In Transit -> Arrived -> Delivered)
 * @access  Private
 */
const updateShipmentStatus = async (req, res) => {
  try {
    const { status, remarks } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: "Status is required",
      });
    }

    const shipment = await Shipment.findById(req.params.id)
      .populate("driverId")
      .populate("vehicleId")
      .populate({
        path: "customerId",
        populate: { path: "userId" },
      });

    if (!shipment) {
      return res.status(404).json({
        success: false,
        message: "Shipment not found",
      });
    }

    // Role check: If driver, verify assigned
    if (req.user.role === "driver") {
      const userId = req.user._id || req.user.id;
      const driver = await Driver.findOne({ userId }).select("_id");
      const assignedDriverId = shipment.driverId?._id || shipment.driverId;
      if (!driver || !assignedDriverId || String(driver._id) !== String(assignedDriverId)) {
        return res.status(403).json({
          success: false,
          message: "Access denied. Only the assigned driver can update this shipment status.",
        });
      }
    }

    // Normalize target status
    const targetStatus =
      status === "delivered" || status === "completed"
        ? "delivered"
        : status === "arrived" || status === "arrived_at_destination"
        ? "arrived"
        : status === "in_transit" || status === "on_the_way"
        ? "in_transit"
        : status;

    // Map current status to step category
    const normalizeCurrent = (s) => {
      if (["pending", "approved", "assigned", "booked"].includes(s)) return "booked";
      if (s === "picked_up") return "picked_up";
      if (s === "in_transit" || s === "on_the_way") return "in_transit";
      if (s === "arrived" || s === "arrived_at_destination") return "arrived";
      if (s === "delivered" || s === "completed") return "delivered";
      return s || "booked";
    };

    const currentStep = normalizeCurrent(shipment.status);

    // Strict 5-Stage Sequential Validation:
    // Booked -> Picked Up -> In Transit -> Arrived -> Delivered
    const allowedNextSteps = {
      booked: ["picked_up"],
      picked_up: ["in_transit"],
      in_transit: ["arrived"],
      arrived: ["delivered"],
      delivered: [],
    };

    const validTransitions = allowedNextSteps[currentStep] || [];

    if (validTransitions.length > 0 && !validTransitions.includes(targetStatus) && currentStep !== targetStatus) {
      const stepNames = {
        booked: "Booked / Assigned",
        picked_up: "Picked Up",
        in_transit: "In Transit",
        arrived: "Arrived",
        delivered: "Delivered",
      };
      return res.status(400).json({
        success: false,
        message: `Workflow step violation: Cannot jump from '${stepNames[currentStep] || currentStep}' to '${stepNames[targetStatus] || targetStatus}'. Next required step is: '${stepNames[validTransitions[0]] || validTransitions[0]}'.`,
      });
    }

    const oldStatus = shipment.status;
    shipment.status = targetStatus;

    // Update timestamps
    if (targetStatus === "picked_up" && !shipment.actualPickupDate) {
      shipment.actualPickupDate = new Date();
    }
    if (targetStatus === "delivered") {
      if (!shipment.actualDeliveryDate) {
        shipment.actualDeliveryDate = new Date();
      }
    }

    shipment.statusHistory.push({
      status: targetStatus,
      updatedBy: req.user._id,
      remarks: remarks || `Status transitioned from ${oldStatus} to ${targetStatus}`,
      timestamp: new Date(),
    });

    await shipment.save();

    // Synchronize Trip, Driver, and Vehicle
    const trip = await Trip.findOne({ shipmentId: shipment._id });
    if (trip) {
      trip.status = targetStatus === "delivered" ? "completed" : targetStatus;
      if (targetStatus === "picked_up" && !trip.startTime) {
        trip.startTime = new Date();
      }
      if (targetStatus === "delivered") {
        trip.endTime = new Date();
        if (trip.startTime) {
          const duration = (new Date() - new Date(trip.startTime)) / (1000 * 60 * 60);
          trip.actualDuration = parseFloat(duration.toFixed(2));
        }
      }
      if (remarks) {
        trip.checkpoints.push({
          location: targetStatus.replace(/_/g, " "),
          timestamp: new Date(),
          status: targetStatus,
          remarks,
        });
      }
      await trip.save();
    }

    // On Delivered: Release vehicle & driver and calculate commission
    let commissionEarned = 0;
    if (targetStatus === "delivered") {
      const driver = shipment.driverId?._id ? await Driver.findById(shipment.driverId._id) : null;
      const vehicle = shipment.vehicleId?._id ? await Vehicle.findById(shipment.vehicleId._id) : null;

      if (vehicle) {
        vehicle.status = "available";
        vehicle.assignedCustomer = null;
        vehicle.assignedItemType = null;
        await vehicle.save();
      }

      if (driver) {
        const shipmentRevenue = shipment.finalPrice || shipment.pricing?.totalAmount || 0;
        const commissionRate = driver.commissionRate || 15;
        commissionEarned = Math.round(shipmentRevenue * (commissionRate / 100));

        driver.status = "available";
        driver.completedTrips = (driver.completedTrips || 0) + 1;
        driver.totalEarnings = (driver.totalEarnings || 0) + commissionEarned;
        await driver.save();
      }
    }

    // Milestone Notifications (Customer & Admin)
    setImmediate(async () => {
      try {
        const pickupCity = shipment.pickupLocation?.city || "Origin";
        const destCity = shipment.destination?.city || "Destination";
        const driverName = shipment.driverId?.fullName || "Assigned Driver";
        const plateNum = shipment.vehicleId?.plateNumber || "Fleet Vehicle";
        const customerUser = shipment.customerId?.userId;

        const customerTitles = {
          picked_up: "Cargo Picked Up ✓",
          in_transit: "Shipment In Transit ✓",
          arrived: "Driver Arrived at Destination ✓",
          delivered: "Shipment Delivered ✓",
        };

        const customerMsgs = {
          picked_up: `Driver ${driverName} (${plateNum}) has picked up and loaded your shipment #${shipment.shipmentNumber} at ${pickupCity}.`,
          in_transit: `Your shipment #${shipment.shipmentNumber} is now in transit from ${pickupCity} to ${destCity}. Live tracking is active!`,
          arrived: `Driver ${driverName} has arrived at destination (${destCity}) for shipment #${shipment.shipmentNumber}.`,
          delivered: `Your shipment #${shipment.shipmentNumber} has been successfully delivered! Thank you for using NTMS.`,
        };

        // Notify Customer
        if (customerUser) {
          const custUserId = customerUser._id || customerUser;
          await Notification.create({
            userId: custUserId,
            title: customerTitles[targetStatus] || `Shipment ${targetStatus.replace(/_/g, " ")}`,
            message: customerMsgs[targetStatus] || `Shipment #${shipment.shipmentNumber} status is now ${targetStatus}.`,
            type: "shipment",
            priority: targetStatus === "delivered" ? "high" : "medium",
            actionUrl: `/customer/track-shipment?id=${shipment._id}`,
            relatedEntity: {
              entityType: "shipment",
              entityId: shipment._id,
            },
          });
        }

        // Notify Admins
        const admins = await User.find({ role: "admin" });
        for (const admin of admins) {
          await Notification.create({
            userId: admin._id,
            title: `Shipment #${shipment.shipmentNumber}: ${targetStatus.replace(/_/g, " ").toUpperCase()}`,
            message: `Shipment #${shipment.shipmentNumber} (${pickupCity} → ${destCity}) was updated to "${targetStatus.replace(/_/g, " ")}" by ${driverName} (Vehicle: ${plateNum}).`,
            type: "shipment",
            priority: targetStatus === "delivered" ? "high" : "low",
            actionUrl: "/admin/shipments",
            relatedEntity: {
              entityType: "shipment",
              entityId: shipment._id,
            },
          });
        }
      } catch (notifError) {
        console.error("Status update notification error:", notifError);
      }
    });

    res.status(200).json({
      success: true,
      message: `Shipment status updated to ${targetStatus} successfully`,
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
          $match: { status: { $in: ["delivered", "completed"] } },
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

      const cargoWeightKg = toKg(shipment.cargoDetails?.weight, shipment.cargoDetails?.unit);
      const cargoType = shipment.cargoDetails?.type || "";

      for (const d of drivers) {
        const vehicles = await Vehicle.find({
          registeredBy: d._id,
          approvalStatus: "approved",
          status: "available",
        });

        if (vehicles.length > 0) {
          selectedDriver = d;
          selectedVehicle = rankVehiclesForCargo(vehicles, cargoType, cargoWeightKg)[0];
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
          const commissionRate = Number(selectedDriver.commissionRate) > 0 ? Number(selectedDriver.commissionRate) : 15;
          const expectedPay = Math.round(((shipment.finalPrice || shipment.pricing?.totalAmount || 0) * commissionRate) / 100);
          await Notification.create({
            userId: selectedDriver.userId._id || selectedDriver.userId,
            title: "New Shipment Assigned",
            message: `You have been assigned to shipment ${shipment.shipmentNumber} (${shipment.pickupLocation?.city} → ${shipment.destination?.city}). Cargo: ${shipment.cargoDetails?.type || "General"} (${shipment.cargoDetails?.weight || 0} ${shipment.cargoDetails?.unit || "kg"}). Estimated payment: ${expectedPay.toLocaleString()} ETB (${commissionRate}% commission).`,
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
  quoteShipmentPrice,
  getShipmentSuggestions,
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


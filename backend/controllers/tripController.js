const Trip = require("../models/Trip");
const Driver = require("../models/Driver");
const Vehicle = require("../models/Vehicle");
const Shipment = require("../models/Shipment");
const Customer = require("../models/Customer");
const User = require("../models/User");
const Notification = require("../models/Notification");

/**
 * Trip Management Controller
 *
 * Purpose: Track active deliveries and driver operations
 * - Create trips when shipments are assigned
 * - Driver updates trip status and location
 * - Real-time tracking
 */

/**
 * @route   GET /api/trips
 * @desc    Get all trips
 * @access  Private/Admin/Dispatcher
 */
const getAllTrips = async (req, res) => {
  try {
    const { status, driverId, page = 1, limit = 10 } = req.query;
    const query = {};

    if (status) query.status = status;
    if (driverId) query.driverId = driverId;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const limitNum = parseInt(limit);

    const [trips, total] = await Promise.all([
      Trip.find(query)
        .populate("shipmentId", "shipmentNumber pickupLocation destination status pricing cargoDetails")
        .populate("driverId", "fullName phone")
        .populate("vehicleId", "plateNumber model type")
        .limit(limitNum)
        .skip(skip)
        .sort({ createdAt: -1 })
        .lean(),
      Trip.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      count: trips.length,
      total,
      pages: Math.ceil(total / limitNum),
      currentPage: parseInt(page),
      data: trips,
    });
  } catch (error) {
    console.error("Get Trips Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * @route   GET /api/trips/my-trips
 * @desc    Get driver's assigned trips
 * @access  Private/Driver
 */
const getMyTrips = async (req, res) => {
  try {
    let driver = await Driver.findOne({ userId: req.user._id }).select("_id fullName").lean();

    if (!driver) {
      const created = await Driver.create({
        userId: req.user._id,
        fullName: req.user.name,
        licenseNumber: `PENDING-${req.user._id.toString().substring(18)}`,
        licenseExpiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        experience: 0,
      });
      driver = { _id: created._id, fullName: created.fullName };
    }

    const trips = await Trip.find({ $or: [{ driverId: driver._id }, { driverId: req.user._id }] })
      .populate({
        path: "shipmentId",
        select: "shipmentNumber pickupLocation destination cargoDetails status pricing scheduledPickupDate estimatedDeliveryDate customerId",
        populate: {
          path: "customerId",
          select: "companyName contactPerson userId",
          populate: {
            path: "userId",
            select: "name email phone profileImage",
          },
        },
      })
      .populate("vehicleId", "plateNumber model type color capacity")
      .sort({ createdAt: -1 })
      .lean();

    // Generate upcoming reminders in the background without blocking the response
    setImmediate(async () => {
      try {
        const Notification = require("../models/Notification");
        const now = new Date();

        for (const trip of trips) {
          if (trip.status === "completed" || trip.status === "cancelled") continue;
          const shipment = trip.shipmentId;
          if (!shipment || !shipment.scheduledPickupDate) continue;

          const pickupDate = new Date(shipment.scheduledPickupDate);
          const diffHours = (pickupDate - now) / (1000 * 60 * 60);

          if (diffHours > 0 && diffHours <= 24) {
            const exists = await Notification.findOne({
              userId: req.user._id,
              title: "Upcoming Shipment Reminder",
              "relatedEntity.entityId": trip._id,
            });

            if (!exists) {
              await Notification.create({
                userId: req.user._id,
                title: "Upcoming Shipment Reminder",
                message: `Trip ${trip.tripNumber} starts in less than 24 hours (scheduled for ${pickupDate.toLocaleDateString()}).`,
                type: "trip",
                priority: "medium",
                relatedEntity: {
                  entityType: "trip",
                  entityId: trip._id,
                },
              });
            }
          }

          if (pickupDate.toDateString() === now.toDateString()) {
            const exists = await Notification.findOne({
              userId: req.user._id,
              title: "Shipment Scheduled Today",
              "relatedEntity.entityId": trip._id,
            });

            if (!exists) {
              await Notification.create({
                userId: req.user._id,
                title: "Shipment Scheduled Today",
                message: `Trip ${trip.tripNumber} is scheduled for today! Scheduled pickup: ${pickupDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}.`,
                type: "trip",
                priority: "high",
                relatedEntity: {
                  entityType: "trip",
                  entityId: trip._id,
                },
              });
            }
          }

          if (diffHours > 0 && diffHours <= 2) {
            const exists = await Notification.findOne({
              userId: req.user._id,
              title: "Pickup Time Approaching",
              "relatedEntity.entityId": trip._id,
            });

            if (!exists) {
              await Notification.create({
                userId: req.user._id,
                title: "Pickup Time Approaching",
                message: `🚨 Pickup time for Trip ${trip.tripNumber} starts in less than 2 hours!`,
                type: "trip",
                priority: "high",
                relatedEntity: {
                  entityType: "trip",
                  entityId: trip._id,
                },
              });
            }
          }
        }
      } catch (reminderErr) {
        // Non-fatal background reminder error
      }
    });

    res.status(200).json({
      success: true,
      count: trips.length,
      data: trips,
    });
  } catch (error) {
    console.error("Get My Trips Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * @route   GET /api/trips/:id
 * @desc    Get single trip
 * @access  Private
 */
const getTripById = async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.id)
      .populate({
        path: "shipmentId",
        populate: {
          path: "customerId",
          populate: {
            path: "userId",
            select: "name email phone profileImage"
          }
        }
      })
      .populate({
        path: "driverId",
        populate: {
          path: "userId",
          select: "name email phone profileImage"
        }
      })
      .populate("vehicleId");

    if (!trip) {
      return res.status(404).json({
        success: false,
        message: "Trip not found",
      });
    }

    res.status(200).json({
      success: true,
      data: trip,
    });
  } catch (error) {
    console.error("Get Trip Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * @route   PATCH /api/trips/:id/status
 * @desc    Update trip status (Driver 4-step workflow: picked_up -> in_transit -> arrived_at_destination -> completed)
 * @access  Private/Driver
 */
const updateTripStatus = async (req, res) => {
  try {
    const { status, remarks, coordinates, address } = req.body;

    const trip = await Trip.findById(req.params.id);

    if (!trip) {
      return res.status(404).json({
        success: false,
        message: "Trip not found",
      });
    }

    // 1. Role & Driver Assignment Validation
    if (req.user.role === "driver") {
      const loggedDriver = await Driver.findOne({ userId: req.user._id });
      if (!loggedDriver || String(trip.driverId) !== String(loggedDriver._id)) {
        return res.status(403).json({
          success: false,
          message: "You are not authorized to update this trip. Only the assigned driver can update its status.",
        });
      }
    }

    // 2. Normalize status
    const targetStatus =
      status === "delivered" || status === "completed"
        ? "completed"
        : status === "arrived" || status === "arrived_at_destination"
        ? "arrived"
        : status;

    const currentStep =
      trip.status === "arrived_at_destination" ? "arrived" : trip.status || "pending";

    // 3. Strict Sequential Step Enforcement (Cannot skip steps)
    const allowedNextSteps = {
      pending: ["picked_up", "on_the_way", "arrived_at_pickup"],
      on_the_way: ["arrived_at_pickup", "picked_up"],
      arrived_at_pickup: ["picked_up"],
      picked_up: ["in_transit"],
      in_transit: ["arrived"],
      arrived: ["completed"],
      completed: [],
    };

    const validTransitions = allowedNextSteps[currentStep] || [];
    if (
      req.user.role === "driver" &&
      validTransitions.length > 0 &&
      !validTransitions.includes(targetStatus) &&
      currentStep !== targetStatus
    ) {
      return res.status(400).json({
        success: false,
        message: `Workflow step violation: Cannot jump from '${currentStep.replace(
          /_/g,
          " "
        )}' to '${targetStatus.replace(
          /_/g,
          " "
        )}'. Next required step is: ${validTransitions
          .map((s) => s.replace(/_/g, " "))
          .join(" or ")}.`,
      });
    }

    const oldStatus = trip.status;
    trip.status = targetStatus;

    // Record checkpoint / route update if location provided
    if (coordinates && Array.isArray(coordinates) && coordinates.length === 2) {
      trip.currentLocation = {
        type: "Point",
        coordinates,
        address: address || "",
        lastUpdated: new Date(),
      };
      trip.route.push({
        location: {
          type: "Point",
          coordinates,
        },
        timestamp: new Date(),
      });
    }

    if (remarks) {
      trip.checkpoints.push({
        location: address || targetStatus.replace(/_/g, " "),
        timestamp: new Date(),
        status: targetStatus,
        remarks,
      });
    }

    // Update timestamps
    if (["picked_up", "on_the_way", "in_transit"].includes(targetStatus) && !trip.startTime) {
      trip.startTime = new Date();
    }

    const shipment = await Shipment.findById(trip.shipmentId);
    const driver = await Driver.findById(trip.driverId);
    const vehicle = await Vehicle.findById(trip.vehicleId);

    let commissionEarned = 0;

    if (targetStatus === "completed") {
      trip.endTime = new Date();

      if (trip.startTime) {
        const duration = (new Date() - new Date(trip.startTime)) / (1000 * 60 * 60);
        trip.actualDuration = parseFloat(duration.toFixed(2));
      }

      // Calculate Driver Commission (15% by default)
      const shipmentRevenue = shipment?.finalPrice || shipment?.pricing?.totalAmount || 0;
      const commissionRate = driver?.commissionRate || 15;
      commissionEarned = Math.round(shipmentRevenue * (commissionRate / 100));

      trip.driverCommission = {
        amount: commissionEarned,
        percentage: commissionRate,
        status: "earned",
        earnedAt: new Date(),
      };

      if (driver) {
        driver.status = "available";
        driver.completedTrips = (driver.completedTrips || 0) + 1;
        driver.totalEarnings = (driver.totalEarnings || 0) + commissionEarned;
        await driver.save();
      }

      if (vehicle) {
        vehicle.status = "available";
        vehicle.assignedCustomer = null;
        vehicle.assignedItemType = null;
        await vehicle.save();
      }

      if (shipment) {
        shipment.status = "delivered";
        shipment.actualDeliveryDate = new Date();
      }
    } else {
      if (driver) {
        driver.status = "on_trip";
        await driver.save();
      }
      if (vehicle) {
        vehicle.status = "in_use";
        await vehicle.save();
      }

      if (shipment) {
        if (targetStatus === "picked_up") {
          shipment.status = "picked_up";
          if (!shipment.actualPickupDate) shipment.actualPickupDate = new Date();
        } else if (targetStatus === "in_transit" || targetStatus === "on_the_way") {
          shipment.status = "in_transit";
        } else if (targetStatus === "arrived") {
          shipment.status = "arrived";
        }
      }
    }

    await trip.save();

    if (shipment) {
      shipment.statusHistory.push({
        status: shipment.status,
        updatedBy: req.user._id,
        remarks: remarks || `Status updated to "${targetStatus.replace(/_/g, " ")}" by driver.`,
      });
      await shipment.save();

      // Send milestone notifications asynchronously
      setImmediate(async () => {
        try {
          const customer = await Customer.findById(shipment.customerId);

          const statusTitles = {
            picked_up: "Cargo Received & Loaded",
            in_transit: "Trip Started & In Transit",
            arrived_at_destination: "Driver Arrived at Destination",
            completed: "Shipment Delivered Successfully",
          };

          const customerMessages = {
            picked_up: `Driver ${driver?.fullName || "Assigned Driver"} has received and loaded your cargo for shipment ${shipment.shipmentNumber}.`,
            in_transit: `Driver ${driver?.fullName || "Assigned Driver"} has started the journey for shipment ${shipment.shipmentNumber}. Live tracking is active!`,
            arrived_at_destination: `Driver ${driver?.fullName || "Assigned Driver"} has arrived at the destination for shipment ${shipment.shipmentNumber}.`,
            completed: `Your shipment ${shipment.shipmentNumber} has been delivered successfully! Your digital receipt is available in the portal.`,
          };

          if (customer && customer.userId) {
            await Notification.create({
              userId: customer.userId._id || customer.userId,
              title: statusTitles[status] || "Shipment Progress Update",
              message: customerMessages[status] || `Your shipment ${shipment.shipmentNumber} is now ${status.replace(/_/g, " ")}.`,
              type: "shipment",
              priority: status === "completed" ? "high" : "medium",
              actionUrl: `/customer/track-shipment/${shipment._id}`,
              relatedEntity: {
                entityType: "shipment",
                entityId: shipment._id,
              },
            });
          }

          // Admin notification
          const admins = await User.find({ role: "admin" });
          for (const admin of admins) {
            await Notification.create({
              userId: admin._id,
              title: `Shipment ${status.replace(/_/g, " ").toUpperCase()}`,
              message: status === "completed"
                ? `Shipment ${shipment.shipmentNumber} delivered by ${driver?.fullName || "Driver"}. Commission: ${commissionEarned.toLocaleString()} ETB.`
                : `Shipment ${shipment.shipmentNumber} status updated to "${status.replace(/_/g, " ")}" by driver ${driver?.fullName || ""}.`,
              type: "shipment",
              priority: status === "completed" ? "high" : "low",
              actionUrl: "/admin/shipments",
              relatedEntity: {
                entityType: "shipment",
                entityId: shipment._id,
              },
            });
          }

          // Driver notification on completion
          if (status === "completed" && driver && driver.userId) {
            await Notification.create({
              userId: driver.userId._id || driver.userId,
              title: "Delivery Complete & Commission Earned",
              message: `Great job! You completed trip ${trip.tripNumber}. You earned ${commissionEarned.toLocaleString()} ETB commission.`,
              type: "payment",
              priority: "high",
              actionUrl: "/driver/my-trips",
              relatedEntity: {
                entityType: "trip",
                entityId: trip._id,
              },
            });
          }
        } catch (notifErr) {
          console.error("Status notification dispatch error:", notifErr);
        }
      });
    }

    res.status(200).json({
      success: true,
      message: "Trip status updated successfully",
      data: {
        trip,
        commissionEarned,
      },
    });
  } catch (error) {
    console.error("Update Trip Status Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * @route   PATCH /api/trips/:id/location
 * @desc    Update current location (GPS tracking)
 * @access  Private/Driver
 */
const updateLocation = async (req, res) => {
  try {
    const { coordinates, address } = req.body;

    const trip = await Trip.findById(req.params.id);

    if (!trip) {
      return res.status(404).json({
        success: false,
        message: "Trip not found",
      });
    }

    // Update current location
    trip.currentLocation = {
      type: "Point",
      coordinates: coordinates, // [longitude, latitude]
      address: address,
      lastUpdated: new Date(),
    };

    // Add to route history
    trip.route.push({
      location: {
        type: "Point",
        coordinates: coordinates,
      },
      timestamp: new Date(),
    });

    await trip.save();

    res.status(200).json({
      success: true,
      message: "Location updated successfully",
      data: {
        currentLocation: trip.currentLocation,
      },
    });
  } catch (error) {
    console.error("Update Location Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * @route   POST /api/trips/:id/checkpoint
 * @desc    Add checkpoint (stop point during trip)
 * @access  Private/Driver
 */
const addCheckpoint = async (req, res) => {
  try {
    const { location, status, remarks } = req.body;

    const trip = await Trip.findById(req.params.id);

    if (!trip) {
      return res.status(404).json({
        success: false,
        message: "Trip not found",
      });
    }

    trip.checkpoints.push({
      location,
      timestamp: new Date(),
      status,
      remarks,
    });

    await trip.save();

    res.status(200).json({
      success: true,
      message: "Checkpoint added successfully",
      data: trip.checkpoints,
    });
  } catch (error) {
    console.error("Add Checkpoint Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * @route   POST /api/trips/:id/incident
 * @desc    Report incident during trip
 * @access  Private/Driver
 */
const reportIncident = async (req, res) => {
  try {
    const { type, description } = req.body;

    const trip = await Trip.findById(req.params.id);

    if (!trip) {
      return res.status(404).json({
        success: false,
        message: "Trip not found",
      });
    }

    trip.incidents.push({
      type,
      description,
      timestamp: new Date(),
      resolved: false,
    });

    await trip.save();

    res.status(200).json({
      success: true,
      message: "Incident reported successfully",
      data: trip.incidents,
    });
  } catch (error) {
    console.error("Report Incident Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * @route   PUT /api/trips/:id/expenses
 * @desc    Update trip expenses
 * @access  Private/Driver
 */
const updateExpenses = async (req, res) => {
  try {
    const { fuel, toll, maintenance, other } = req.body;

    const trip = await Trip.findById(req.params.id);

    if (!trip) {
      return res.status(404).json({
        success: false,
        message: "Trip not found",
      });
    }

    if (fuel) trip.expenses.fuel = fuel;
    if (toll) trip.expenses.toll = toll;
    if (maintenance) trip.expenses.maintenance = maintenance;
    if (other) trip.expenses.other = other;

    // Calculate total
    trip.expenses.total =
      trip.expenses.fuel +
      trip.expenses.toll +
      trip.expenses.maintenance +
      trip.expenses.other;

    await trip.save();

    res.status(200).json({
      success: true,
      message: "Expenses updated successfully",
      data: trip.expenses,
    });
  } catch (error) {
    console.error("Update Expenses Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  getAllTrips,
  getMyTrips,
  getTripById,
  updateTripStatus,
  updateLocation,
  addCheckpoint,
  reportIncident,
  updateExpenses,
};

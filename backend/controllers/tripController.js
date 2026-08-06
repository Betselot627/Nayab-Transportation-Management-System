const Trip = require("../models/Trip");
const Driver = require("../models/Driver");
const Vehicle = require("../models/Vehicle");
const Shipment = require("../models/Shipment");

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

    const trips = await Trip.find(query)
      .populate(
        "shipmentId",
        "shipmentNumber pickupLocation destination status",
      )
      .populate("driverId", "fullName phone")
      .populate("vehicleId", "plateNumber model")
      .limit(parseInt(limit))
      .skip(skip)
      .sort({ createdAt: -1 });

    const total = await Trip.countDocuments(query);

    res.status(200).json({
      success: true,
      count: trips.length,
      total,
      pages: Math.ceil(total / parseInt(limit)),
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
    let driver = await Driver.findOne({ userId: req.user._id });

    if (!driver) {
      driver = await Driver.create({
        userId: req.user._id,
        fullName: req.user.name,
        licenseNumber: `PENDING-${req.user._id.toString().substring(18)}`,
        licenseExpiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        experience: 0,
      });
    }

    const trips = await Trip.find({ driverId: driver._id })
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
      .populate("vehicleId", "plateNumber model type color capacity")
      .sort({ createdAt: -1 });

    // Generate upcoming reminders dynamically
    try {
      const Notification = require("../models/Notification");
      const now = new Date();

      for (const trip of trips) {
        if (trip.status === "completed" || trip.status === "cancelled") continue;
        const shipment = trip.shipmentId;
        if (!shipment || !shipment.scheduledPickupDate) continue;

        const pickupDate = new Date(shipment.scheduledPickupDate);
        const diffHours = (pickupDate - now) / (1000 * 60 * 60);

        // 1. Check if 24 hours approaching reminder is needed
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

        // 2. Check if same-day reminder is needed
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
              message: `Trip ${trip.tripNumber} is scheduled for today! Scheduled pickup: ${pickupDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`,
              type: "trip",
              priority: "high",
              relatedEntity: {
                entityType: "trip",
                entityId: trip._id,
              },
            });
          }
        }

        // 3. Check if pickup approaching reminder is needed (within 2 hours)
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
      console.error("Failed to generate dynamic trip reminders:", reminderErr);
    }

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
 * @desc    Update trip status
 * @access  Private/Driver
 */
const updateTripStatus = async (req, res) => {
  try {
    const { status, remarks } = req.body;

    const trip = await Trip.findById(req.params.id);

    if (!trip) {
      return res.status(404).json({
        success: false,
        message: "Trip not found",
      });
    }

    const oldStatus = trip.status;
    trip.status = status;

    // Update timestamps
    if (["on_the_way", "arrived_at_pickup", "picked_up", "in_transit"].includes(status) && !trip.startTime) {
      trip.startTime = new Date();
    }
    if (status === "completed" && !trip.endTime) {
      trip.endTime = new Date();

      // Calculate duration
      if (trip.startTime) {
        const duration =
          (new Date() - new Date(trip.startTime)) / (1000 * 60 * 60); // in hours
        trip.actualDuration = duration.toFixed(2);
      }
    }

    await trip.save();

    // Update driver status
    const driver = await Driver.findById(trip.driverId);
    if (driver) {
      if (status === "completed") {
        driver.status = "available";
        driver.completedTrips = (driver.completedTrips || 0) + 1;
      } else {
        driver.status = "on_trip";
      }
      await driver.save();
    }

    // Update vehicle status
    const vehicle = await Vehicle.findById(trip.vehicleId);
    if (vehicle) {
      if (status === "completed") {
        vehicle.status = "available";
      } else {
        vehicle.status = "in_use";
      }
      await vehicle.save();
    }

    // Update shipment status
    const shipment = await Shipment.findById(trip.shipmentId);
    if (shipment) {
      if (["pending", "on_the_way", "arrived_at_pickup"].includes(status)) {
        shipment.status = "assigned";
      } else if (status === "picked_up") {
        shipment.status = "picked_up";
      } else if (["in_transit", "arrived_at_destination"].includes(status)) {
        shipment.status = "in_transit";
      } else if (status === "completed") {
        shipment.status = "delivered";
      }
      shipment.statusHistory.push({
        status: shipment.status,
        updatedBy: req.user._id,
        remarks: remarks || `Trip status updated to "${status.replace(/_/g, " ")}" by driver.`,
      });
      await shipment.save();

      // Notify Customer & Driver on status change
      try {
        const customer = await Customer.findById(shipment.customerId);
        if (customer && customer.userId) {
          await Notification.create({
            userId: customer.userId,
            title: "Shipment Progress Update",
            message: `Your shipment ${shipment.shipmentNumber} is now "${shipment.status.replace("_", " ")}" (${status.replace(/_/g, " ")}).`,
            type: "shipment",
            relatedEntity: {
              entityType: "shipment",
              entityId: shipment._id,
            },
          });
        }

        if (driver && driver.userId) {
          await Notification.create({
            userId: driver.userId,
            title: "Trip Status Updated",
            message: `Your assigned trip status has transitioned to "${status.replace(/_/g, " ")}"!`,
            type: "trip",
            relatedEntity: {
              entityType: "shipment",
              entityId: shipment._id,
            },
          });
        }
      } catch (notifErr) {
        console.error("Failed to trigger status change notifications:", notifErr);
      }
    }

    res.status(200).json({
      success: true,
      message: "Trip status updated successfully",
      data: trip,
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

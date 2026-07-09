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
    const driver = await Driver.findOne({ userId: req.user._id });

    if (!driver) {
      return res.status(404).json({
        success: false,
        message: "Driver profile not found",
      });
    }

    const trips = await Trip.find({ driverId: driver._id })
      .populate("shipmentId")
      .populate("vehicleId", "plateNumber model type")
      .sort({ createdAt: -1 });

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
      .populate("shipmentId")
      .populate("driverId")
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
    if (status === "in_progress" && !trip.startTime) {
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
      if (status === "in_progress") {
        driver.status = "on_trip";
      } else if (status === "completed") {
        driver.status = "available";
        driver.completedTrips += 1;
      }
      await driver.save();
    }

    // Update vehicle status
    const vehicle = await Vehicle.findById(trip.vehicleId);
    if (vehicle) {
      if (status === "in_progress") {
        vehicle.status = "in_use";
      } else if (status === "completed") {
        vehicle.status = "available";
        vehicle.currentDriver = null;
      }
      await vehicle.save();
    }

    // Update shipment status
    const shipment = await Shipment.findById(trip.shipmentId);
    if (shipment) {
      if (status === "in_progress") {
        shipment.status = "in_transit";
      }
      await shipment.save();
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

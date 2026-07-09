const User = require("../models/User");
const Vehicle = require("../models/Vehicle");
const Driver = require("../models/Driver");
const Shipment = require("../models/Shipment");
const Trip = require("../models/Trip");
const Payment = require("../models/Payment");
const Maintenance = require("../models/Maintenance");

/**
 * Reports and Analytics Controller
 *
 * Purpose: Generate business insights and reports
 * - Dashboard statistics
 * - Financial reports
 * - Performance metrics
 * - Monthly/Yearly reports
 */

/**
 * @route   GET /api/reports/dashboard
 * @desc    Get dashboard statistics
 * @access  Private/Admin
 */
const getDashboardStats = async (req, res) => {
  try {
    // Count totals
    const totalVehicles = await Vehicle.countDocuments();
    const availableVehicles = await Vehicle.countDocuments({
      status: "available",
    });
    const totalDrivers = await Driver.countDocuments();
    const availableDrivers = await Driver.countDocuments({
      status: "available",
    });
    const totalShipments = await Shipment.countDocuments();
    const activeShipments = await Shipment.countDocuments({
      status: { $in: ["assigned", "picked_up", "in_transit"] },
    });
    const completedShipments = await Shipment.countDocuments({
      status: "completed",
    });

    // Revenue calculation
    const revenueData = await Payment.aggregate([
      { $match: { paymentStatus: "paid" } },
      {
        $group: {
          _id: null,
          total: { $sum: "$amount" },
        },
      },
    ]);
    const totalRevenue = revenueData[0]?.total || 0;

    // Pending payments
    const pendingPayments = await Payment.countDocuments({
      paymentStatus: "pending",
    });

    // Recent shipments
    const recentShipments = await Shipment.find()
      .limit(5)
      .sort({ createdAt: -1 })
      .populate("customerId", "companyName")
      .populate("vehicleId", "plateNumber")
      .populate("driverId", "fullName");

    // Active trips
    const activeTrips = await Trip.find({ status: "in_progress" })
      .limit(5)
      .populate("driverId", "fullName")
      .populate("vehicleId", "plateNumber");

    // Shipments by status
    const shipmentsByStatus = await Shipment.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    // Monthly revenue (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyRevenue = await Payment.aggregate([
      {
        $match: {
          paymentStatus: "paid",
          paymentDate: { $gte: sixMonthsAgo },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$paymentDate" },
            month: { $month: "$paymentDate" },
          },
          revenue: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]);

    res.status(200).json({
      success: true,
      data: {
        overview: {
          totalVehicles,
          availableVehicles,
          totalDrivers,
          availableDrivers,
          totalShipments,
          activeShipments,
          completedShipments,
          totalRevenue,
          pendingPayments,
        },
        recentShipments,
        activeTrips,
        shipmentsByStatus,
        monthlyRevenue,
      },
    });
  } catch (error) {
    console.error("Get Dashboard Stats Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * @route   GET /api/reports/financial
 * @desc    Get financial report
 * @access  Private/Admin
 */
const getFinancialReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const dateFilter = {};
    if (startDate) dateFilter.$gte = new Date(startDate);
    if (endDate) dateFilter.$lte = new Date(endDate);

    // Revenue by status
    const revenueByStatus = await Payment.aggregate([
      ...(Object.keys(dateFilter).length > 0
        ? [{ $match: { paymentDate: dateFilter } }]
        : []),
      {
        $group: {
          _id: "$paymentStatus",
          amount: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
    ]);

    // Revenue by payment method
    const revenueByMethod = await Payment.aggregate([
      { $match: { paymentStatus: "paid" } },
      ...(Object.keys(dateFilter).length > 0
        ? [{ $match: { paymentDate: dateFilter } }]
        : []),
      {
        $group: {
          _id: "$paymentMethod",
          amount: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
    ]);

    // Maintenance costs
    const maintenanceCosts = await Maintenance.aggregate([
      { $match: { status: "completed" } },
      ...(Object.keys(dateFilter).length > 0
        ? [{ $match: { serviceDate: dateFilter } }]
        : []),
      {
        $group: {
          _id: null,
          total: { $sum: "$cost.total" },
          count: { $sum: 1 },
        },
      },
    ]);

    // Trip expenses
    const tripExpenses = await Trip.aggregate([
      { $match: { status: "completed" } },
      ...(Object.keys(dateFilter).length > 0
        ? [{ $match: { endTime: dateFilter } }]
        : []),
      {
        $group: {
          _id: null,
          fuel: { $sum: "$expenses.fuel" },
          toll: { $sum: "$expenses.toll" },
          maintenance: { $sum: "$expenses.maintenance" },
          other: { $sum: "$expenses.other" },
          total: { $sum: "$expenses.total" },
        },
      },
    ]);

    res.status(200).json({
      success: true,
      data: {
        revenueByStatus,
        revenueByMethod,
        maintenanceCosts: maintenanceCosts[0] || { total: 0, count: 0 },
        tripExpenses: tripExpenses[0] || {
          fuel: 0,
          toll: 0,
          maintenance: 0,
          other: 0,
          total: 0,
        },
      },
    });
  } catch (error) {
    console.error("Get Financial Report Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * @route   GET /api/reports/driver-performance
 * @desc    Get driver performance report
 * @access  Private/Admin
 */
const getDriverPerformance = async (req, res) => {
  try {
    const driverStats = await Trip.aggregate([
      { $match: { status: "completed" } },
      {
        $group: {
          _id: "$driverId",
          totalTrips: { $sum: 1 },
          totalDistance: { $sum: "$distance" },
          totalExpenses: { $sum: "$expenses.total" },
          avgDuration: { $avg: "$actualDuration" },
        },
      },
      {
        $lookup: {
          from: "drivers",
          localField: "_id",
          foreignField: "_id",
          as: "driver",
        },
      },
      { $unwind: "$driver" },
      {
        $project: {
          driverName: "$driver.fullName",
          totalTrips: 1,
          totalDistance: 1,
          totalExpenses: 1,
          avgDuration: 1,
          rating: "$driver.rating",
        },
      },
      { $sort: { totalTrips: -1 } },
    ]);

    res.status(200).json({
      success: true,
      data: driverStats,
    });
  } catch (error) {
    console.error("Get Driver Performance Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * @route   GET /api/reports/vehicle-utilization
 * @desc    Get vehicle utilization report
 * @access  Private/Admin
 */
const getVehicleUtilization = async (req, res) => {
  try {
    const vehicleStats = await Trip.aggregate([
      { $match: { status: "completed" } },
      {
        $group: {
          _id: "$vehicleId",
          totalTrips: { $sum: 1 },
          totalDistance: { $sum: "$distance" },
          totalExpenses: { $sum: "$expenses.total" },
        },
      },
      {
        $lookup: {
          from: "vehicles",
          localField: "_id",
          foreignField: "_id",
          as: "vehicle",
        },
      },
      { $unwind: "$vehicle" },
      {
        $project: {
          plateNumber: "$vehicle.plateNumber",
          model: "$vehicle.model",
          type: "$vehicle.type",
          totalTrips: 1,
          totalDistance: 1,
          totalExpenses: 1,
          mileage: "$vehicle.mileage",
        },
      },
      { $sort: { totalTrips: -1 } },
    ]);

    // Maintenance frequency
    const maintenanceFrequency = await Maintenance.aggregate([
      {
        $group: {
          _id: "$vehicleId",
          maintenanceCount: { $sum: 1 },
          totalCost: { $sum: "$cost.total" },
        },
      },
      {
        $lookup: {
          from: "vehicles",
          localField: "_id",
          foreignField: "_id",
          as: "vehicle",
        },
      },
      { $unwind: "$vehicle" },
      {
        $project: {
          plateNumber: "$vehicle.plateNumber",
          maintenanceCount: 1,
          totalCost: 1,
        },
      },
    ]);

    res.status(200).json({
      success: true,
      data: {
        utilization: vehicleStats,
        maintenance: maintenanceFrequency,
      },
    });
  } catch (error) {
    console.error("Get Vehicle Utilization Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * @route   GET /api/reports/monthly
 * @desc    Get monthly summary report
 * @access  Private/Admin
 */
const getMonthlyReport = async (req, res) => {
  try {
    const { year, month } = req.query;

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    const shipments = await Shipment.countDocuments({
      createdAt: { $gte: startDate, $lte: endDate },
    });

    const completedShipments = await Shipment.countDocuments({
      status: "completed",
      actualDeliveryDate: { $gte: startDate, $lte: endDate },
    });

    const revenue = await Payment.aggregate([
      {
        $match: {
          paymentStatus: "paid",
          paymentDate: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$amount" },
        },
      },
    ]);

    const expenses = await Trip.aggregate([
      {
        $match: {
          status: "completed",
          endTime: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$expenses.total" },
        },
      },
    ]);

    const maintenanceCost = await Maintenance.aggregate([
      {
        $match: {
          status: "completed",
          serviceDate: { $gte: startDate, $lte: endDate },
        },
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
        period: { year, month },
        totalShipments: shipments,
        completedShipments,
        revenue: revenue[0]?.total || 0,
        tripExpenses: expenses[0]?.total || 0,
        maintenanceCost: maintenanceCost[0]?.total || 0,
        netProfit:
          (revenue[0]?.total || 0) -
          (expenses[0]?.total || 0) -
          (maintenanceCost[0]?.total || 0),
      },
    });
  } catch (error) {
    console.error("Get Monthly Report Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  getDashboardStats,
  getFinancialReport,
  getDriverPerformance,
  getVehicleUtilization,
  getMonthlyReport,
};

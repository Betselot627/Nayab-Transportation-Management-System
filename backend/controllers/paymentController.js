const Payment = require("../models/Payment");
const Shipment = require("../models/Shipment");
const Customer = require("../models/Customer");

/**
 * Payment Management Controller
 *
 * Purpose: Handle financial transactions
 * - Record payments for shipments
 * - Track payment status
 * - Generate invoices and receipts
 */

/**
 * @route   GET /api/payments
 * @desc    Get all payments
 * @access  Private/Admin
 */
const getAllPayments = async (req, res) => {
  try {
    const { status, method, customerId, page = 1, limit = 10 } = req.query;
    const query = {};

    if (status) query.paymentStatus = status;
    if (method) query.paymentMethod = method;
    if (customerId) query.customerId = customerId;

    // If customer role, show only their payments
    if (req.user.role === "customer") {
      const customer = await Customer.findOne({ userId: req.user._id });
      query.customerId = customer._id;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const payments = await Payment.find(query)
      .populate("shipmentId", "shipmentNumber pickupLocation destination")
      .populate("customerId", "companyName")
      .populate("paidBy", "name email")
      .limit(parseInt(limit))
      .skip(skip)
      .sort({ createdAt: -1 });

    const total = await Payment.countDocuments(query);

    res.status(200).json({
      success: true,
      count: payments.length,
      total,
      pages: Math.ceil(total / parseInt(limit)),
      currentPage: parseInt(page),
      data: payments,
    });
  } catch (error) {
    console.error("Get Payments Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * @route   GET /api/payments/:id
 * @desc    Get single payment
 * @access  Private
 */
const getPaymentById = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id)
      .populate("shipmentId")
      .populate("customerId")
      .populate("paidBy", "name email")
      .populate("processedBy", "name email");

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment not found",
      });
    }

    res.status(200).json({
      success: true,
      data: payment,
    });
  } catch (error) {
    console.error("Get Payment Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * @route   POST /api/payments
 * @desc    Create payment record
 * @access  Private/Admin/Customer
 */
const createPayment = async (req, res) => {
  try {
    const { shipmentId, amount, paymentMethod, transactionDetails } = req.body;

    // Get shipment
    const shipment = await Shipment.findById(shipmentId).populate("customerId");

    if (!shipment) {
      return res.status(404).json({
        success: false,
        message: "Shipment not found",
      });
    }

    const paymentData = {
      shipmentId,
      customerId: shipment.customerId._id,
      amount: amount || shipment.pricing.totalAmount,
      paymentMethod,
      transactionDetails,
      paidBy: req.user._id,
      breakdown: {
        baseAmount: shipment.pricing.baseAmount,
        additionalCharges: shipment.pricing.additionalCharges,
      },
    };

    const payment = await Payment.create(paymentData);

    res.status(201).json({
      success: true,
      message: "Payment record created successfully",
      data: payment,
    });
  } catch (error) {
    console.error("Create Payment Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * @route   PUT /api/payments/:id/status
 * @desc    Update payment status
 * @access  Private/Admin
 */
const updatePaymentStatus = async (req, res) => {
  try {
    const { status } = req.body;

    const payment = await Payment.findById(req.params.id);

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment not found",
      });
    }

    payment.paymentStatus = status;
    payment.processedBy = req.user._id;

    if (status === "paid" && !payment.paymentDate) {
      payment.paymentDate = new Date();

      // Update shipment status
      const shipment = await Shipment.findById(payment.shipmentId);
      if (shipment && shipment.status === "delivered") {
        shipment.status = "completed";
        await shipment.save();
      }

      // Update customer stats
      const customer = await Customer.findById(payment.customerId);
      if (customer) {
        customer.totalSpent += payment.amount;
        await customer.save();
      }
    }

    await payment.save();

    res.status(200).json({
      success: true,
      message: "Payment status updated successfully",
      data: payment,
    });
  } catch (error) {
    console.error("Update Payment Status Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * @route   PUT /api/payments/:id
 * @desc    Update payment
 * @access  Private/Admin
 */
const updatePayment = async (req, res) => {
  try {
    const payment = await Payment.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).populate("shipmentId customerId");

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Payment updated successfully",
      data: payment,
    });
  } catch (error) {
    console.error("Update Payment Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * @route   DELETE /api/payments/:id
 * @desc    Delete payment
 * @access  Private/Admin
 */
const deletePayment = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id);

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment not found",
      });
    }

    // Don't allow deletion of completed payments
    if (payment.paymentStatus === "paid") {
      return res.status(400).json({
        success: false,
        message: "Cannot delete completed payment",
      });
    }

    await payment.deleteOne();

    res.status(200).json({
      success: true,
      message: "Payment deleted successfully",
    });
  } catch (error) {
    console.error("Delete Payment Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * @route   GET /api/payments/shipment/:shipmentId
 * @desc    Get payments for a shipment
 * @access  Private
 */
const getShipmentPayments = async (req, res) => {
  try {
    const payments = await Payment.find({
      shipmentId: req.params.shipmentId,
    }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: payments.length,
      data: payments,
    });
  } catch (error) {
    console.error("Get Shipment Payments Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * @route   GET /api/payments/stats
 * @desc    Get payment statistics
 * @access  Private/Admin
 */
const getPaymentStats = async (req, res) => {
  try {
    const total = await Payment.countDocuments();

    const byStatus = await Payment.aggregate([
      {
        $group: {
          _id: "$paymentStatus",
          count: { $sum: 1 },
          amount: { $sum: "$amount" },
        },
      },
    ]);

    const byMethod = await Payment.aggregate([
      {
        $group: {
          _id: "$paymentMethod",
          count: { $sum: 1 },
        },
      },
    ]);

    const totalRevenue = await Payment.aggregate([
      {
        $match: { paymentStatus: "paid" },
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$amount" },
        },
      },
    ]);

    const pendingAmount = await Payment.aggregate([
      {
        $match: { paymentStatus: "pending" },
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$amount" },
        },
      },
    ]);

    res.status(200).json({
      success: true,
      data: {
        total,
        byStatus,
        byMethod,
        totalRevenue: totalRevenue[0]?.total || 0,
        pendingAmount: pendingAmount[0]?.total || 0,
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
  getAllPayments,
  getPaymentById,
  createPayment,
  updatePaymentStatus,
  updatePayment,
  deletePayment,
  getShipmentPayments,
  getPaymentStats,
};

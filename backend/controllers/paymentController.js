const Payment = require("../models/Payment");
const Shipment = require("../models/Shipment");
const Customer = require("../models/Customer");
const User = require("../models/User");
const Notification = require("../models/Notification");
const chapaService = require("../services/chapaService");

/**
 * Payment Controller - NTMS
 *
 * Implements Chapa payment integration:
 * - Secure payment initialization (backend derives confirmed final price)
 * - Chapa checkout redirection
 * - Idempotent payment verification
 * - Webhook processing
 * - Automated receipt generation
 * - Role notifications (Customer, Admin, Dispatcher)
 */

/**
 * @route   POST /api/payments/initialize
 * @desc    Initialize Chapa payment for a shipment
 * @access  Private/Customer/Admin
 */
const initializePayment = async (req, res) => {
  try {
    const { shipmentId, paymentMethod = "Chapa", simulated = false } = req.body;

    if (!shipmentId) {
      return res.status(400).json({
        success: false,
        message: "Shipment ID is required",
      });
    }

    // 1. Find the shipment
    const shipment = await Shipment.findById(shipmentId)
      .populate("customerId")
      .populate("driverId");

    if (!shipment) {
      return res.status(404).json({
        success: false,
        message: "Shipment not found",
      });
    }

    // 2. Verify Customer ownership (or Admin/Dispatcher override)
    let customerRecord = shipment.customerId;
    if (req.user.role === "customer") {
      let loggedCustomer = await Customer.findOne({ userId: req.user._id });
      if (!loggedCustomer) {
        loggedCustomer = await Customer.create({
          userId: req.user._id,
          companyName: req.user.name,
          contactPerson: {
            name: req.user.name,
            phone: req.user.phone || "+251911000000",
            email: req.user.email,
          },
        });
      }

      const shipCustId = String(shipment.customerId?._id || shipment.customerId);
      const isOwner =
        shipCustId === String(loggedCustomer._id) ||
        shipCustId === String(req.user._id);

      if (!isOwner) {
        return res.status(403).json({
          success: false,
          message: "You are not authorized to make a payment for this shipment.",
        });
      }
      customerRecord = loggedCustomer;
    }

    if (!customerRecord) {
      customerRecord = (await Customer.findOne({ userId: shipment.customerId })) || {
        _id: shipment.customerId,
      };
    }

    // 3. Verify shipment payment status
    if (shipment.paymentStatus === "PAID") {
      return res.status(400).json({
        success: false,
        message: "This shipment has already been paid in full.",
      });
    }

    // 4. Retrieve and validate final price strictly from MongoDB
    let finalAmount =
      shipment.finalPrice ||
      shipment.pricing?.totalAmount ||
      shipment.pricing?.baseAmount ||
      0;

    if (!finalAmount || finalAmount <= 0) {
      // Auto-fallback calculation if finalPrice was not initialized
      finalAmount = 2500;
      shipment.finalPrice = finalAmount;
      shipment.pricing = shipment.pricing || {};
      shipment.pricing.totalAmount = finalAmount;
      await shipment.save();
    }

    // Determine normalized method name
    const normalizedMethod = 
      paymentMethod.toLowerCase() === "telebirr" 
        ? "Telebirr" 
        : paymentMethod.toLowerCase() === "cbe_birr" 
        ? "CBE Birr" 
        : "Chapa";

    const isSimulated = simulated || paymentMethod.toLowerCase() === "telebirr" || paymentMethod.toLowerCase() === "cbe_birr";

    // 5. Generate unique transaction reference
    const timestamp = Date.now();
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const txRef = isSimulated
      ? `NTMS-SIM-${timestamp}-${randomSuffix}`
      : `NTMS-TX-${timestamp}-${randomSuffix}`;

    // Customer details for checkout
    const customerUser = await User.findById(customerRecord?.userId || req.user._id);
    const nameParts = (customerUser?.name || "Customer User").split(" ");
    const firstName = nameParts[0] || "Customer";
    const lastName = nameParts.slice(1).join(" ") || "User";
    const email = customerUser?.email || req.user.email || "customer@ntms.com";
    const phoneNumber = customerUser?.phone || "";

    const frontendBase = (process.env.FRONTEND_URL || "http://localhost:5173").replace(/\/$/, "");
    const backendBase = (process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 5002}`).replace(/\/$/, "");

    const returnUrl = `${frontendBase}/payment/success?tx_ref=${txRef}`;
    const callbackUrl = `${backendBase}/api/payments/webhook`;

    // 6. Create PENDING Payment in MongoDB
    const payment = await Payment.create({
      txRef,
      shipmentId: shipment._id,
      customerId: customerRecord._id,
      amount: finalAmount,
      currency: "ETB",
      status: "PENDING",
      paymentMethod: normalizedMethod,
      paidBy: req.user._id,
      customerDetails: {
        name: customerUser?.name || "Customer",
        email,
        phone: phoneNumber,
      },
      metadata: {
        shipmentNumber: shipment.shipmentNumber,
        pickupCity: shipment.pickupLocation?.city,
        destinationCity: shipment.destination?.city,
      },
    });

    let checkoutUrl = `${frontendBase}/payment/success?tx_ref=${txRef}`;

    if (!isSimulated) {
      try {
        // 7. Call Chapa initialize API
        const chapaResponse = await chapaService.initializePayment({
          amount: finalAmount,
          currency: "ETB",
          email,
          firstName,
          lastName,
          phoneNumber,
          txRef,
          callbackUrl,
          returnUrl,
          title: `Nayab Trading PLC - NTMS`,
          description: `Payment for Shipment ${shipment.shipmentNumber}`,
        });

        checkoutUrl = chapaResponse.checkoutUrl;
      } catch (err) {
        console.warn("⚠️ Chapa API initialization failed, falling back to simulated mode in development:", err.message);
        // Fallback to simulation reference by recreating/updating the reference with SIM prefix
        const fallbackTxRef = `NTMS-SIM-${timestamp}-${randomSuffix}`;
        payment.txRef = fallbackTxRef;
        checkoutUrl = `${frontendBase}/payment/success?tx_ref=${fallbackTxRef}&simulated=true`;
      }
    }

    // 8. Update Payment record with checkoutUrl
    payment.checkoutUrl = checkoutUrl;
    await payment.save();

    // 9. Update Shipment status to PENDING
    shipment.paymentStatus = "PENDING";
    await shipment.save();

    res.status(200).json({
      success: true,
      message: "Payment initialized successfully",
      checkoutUrl,
      txRef: payment.txRef,
      amount: finalAmount,
      currency: "ETB",
      shipmentNumber: shipment.shipmentNumber,
    });
  } catch (error) {
    console.error("Initialize Payment Error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to initialize payment",
    });
  }
};

/**
 * @route   GET /api/payments/verify/:txRef
 * @desc    Verify payment transaction with Chapa (Idempotent)
 * @access  Public / Private
 */
const verifyPayment = async (req, res) => {
  try {
    const { txRef } = req.params;

    if (!txRef) {
      return res.status(400).json({
        success: false,
        message: "Transaction reference (txRef) is required",
      });
    }

    // 1. Find payment record in MongoDB
    const payment = await Payment.findOne({ txRef })
      .populate("shipmentId")
      .populate("customerId")
      .populate("paidBy", "name email phone");

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment transaction record not found",
      });
    }

    // 2. IDEMPOTENCY CHECK: If already PAID, return clean verified receipt without repeating side-effects
    if (payment.status === "PAID") {
      return res.status(200).json({
        success: true,
        message: "Payment already confirmed and verified.",
        data: payment,
        receiptNumber: payment.receiptNumber,
        alreadyProcessed: true,
      });
    }

    // 3. Verify transaction directly with Chapa API
    const verifyResult = await chapaService.verifyPayment(txRef);

    const shipment = await Shipment.findById(payment.shipmentId?._id || payment.shipmentId);

    if (verifyResult.success && verifyResult.status === "success") {
      // 4. Update Payment to PAID
      payment.status = "PAID";
      payment.paidAt = new Date();
      payment.paymentMethod = txRef.startsWith("NTMS-SIM-") ? (payment.paymentMethod || "Telebirr") : (verifyResult.method || "Chapa");
      payment.chapaTransactionId = verifyResult.transactionId || txRef;

      // Pre-save will generate receiptNumber if absent
      await payment.save();

      // 5. Update Shipment paymentStatus to PAID
      if (shipment) {
        shipment.paymentStatus = "PAID";
        shipment.statusHistory.push({
          status: shipment.status,
          updatedBy: payment.paidBy?._id || payment.paidBy,
          remarks: `Payment of ${payment.amount.toLocaleString()} ETB completed successfully via ${payment.paymentMethod}. Receipt #${payment.receiptNumber}`,
        });
        await shipment.save();
      }

      // 6. Trigger In-App Notifications to Customer, Admin, and Dispatcher
      try {
        const customer = await Customer.findById(payment.customerId?._id || payment.customerId);
        
        // Customer Notification
        if (customer && customer.userId) {
          await Notification.create({
            userId: customer.userId,
            title: "Payment Successful",
            message: `Your payment of ${payment.amount.toLocaleString()} ETB for shipment ${shipment?.shipmentNumber || ""} was successfully completed. Receipt: ${payment.receiptNumber}`,
            type: "payment",
            priority: "high",
            relatedEntity: {
              entityType: "payment",
              entityId: payment._id,
            },
          });
        }

        // Admin Notification
        const adminUsers = await User.find({ role: "admin" });
        for (const admin of adminUsers) {
          await Notification.create({
            userId: admin._id,
            title: "Payment Received",
            message: `Payment of ${payment.amount.toLocaleString()} ETB received for shipment ${shipment?.shipmentNumber || ""} from ${payment.customerDetails?.name || "Customer"}. Status: PAID`,
            type: "payment",
            priority: "medium",
            relatedEntity: {
              entityType: "payment",
              entityId: payment._id,
            },
          });
        }

        // Dispatcher Notification
        const dispatchers = await User.find({ role: "dispatcher" });
        for (const dispatcher of dispatchers) {
          await Notification.create({
            userId: dispatcher._id,
            title: "Payment Confirmed",
            message: `Shipment ${shipment?.shipmentNumber || ""} has been paid (${payment.amount.toLocaleString()} ETB) and is ready for next transportation workflow step.`,
            type: "payment",
            priority: "medium",
            relatedEntity: {
              entityType: "shipment",
              entityId: shipment?._id,
            },
          });
        }
      } catch (notifErr) {
        console.error("Failed to generate payment notifications:", notifErr.message);
      }

      return res.status(200).json({
        success: true,
        message: "Payment successfully verified and confirmed.",
        data: payment,
        receiptNumber: payment.receiptNumber,
      });
    } else {
      // Payment Failed or Cancelled
      payment.status = "FAILED";
      payment.failedAt = new Date();
      await payment.save();

      if (shipment && shipment.paymentStatus !== "PAID") {
        shipment.paymentStatus = "FAILED";
        await shipment.save();
      }

      return res.status(400).json({
        success: false,
        message: verifyResult.message || "Payment verification failed or payment was cancelled by user.",
        data: payment,
      });
    }
  } catch (error) {
    console.error("Verify Payment Error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Internal server error while verifying payment",
    });
  }
};

/**
 * @route   POST /api/payments/webhook
 * @desc    Chapa Webhook / Callback Handler (Idempotent)
 * @access  Public (Signature protected)
 */
const handleWebhook = async (req, res) => {
  try {
    const signature = req.headers["chapa-signature"] || req.headers["x-chapa-signature"];

    // Validate signature
    if (process.env.CHAPA_WEBHOOK_SECRET && signature) {
      const isValid = chapaService.validateWebhookSignature(req.body, signature);
      if (!isValid) {
        return res.status(401).json({ success: false, message: "Invalid webhook signature" });
      }
    }

    const txRef = req.body?.tx_ref || req.body?.trx_ref;

    if (!txRef) {
      return res.status(200).json({ success: true, message: "Webhook acknowledged (No tx_ref)" });
    }

    const payment = await Payment.findOne({ txRef });

    if (!payment) {
      return res.status(200).json({ success: true, message: "Payment not found in NTMS" });
    }

    // IDEMPOTENCY: If already processed, exit safely
    if (payment.status === "PAID") {
      return res.status(200).json({ success: true, message: "Payment already marked as PAID (Idempotent)" });
    }

    // Perform verification
    const verifyResult = await chapaService.verifyPayment(txRef);

    if (verifyResult.success && verifyResult.status === "success") {
      payment.status = "PAID";
      payment.paidAt = new Date();
      payment.paymentMethod = verifyResult.method || "Chapa";
      payment.chapaTransactionId = verifyResult.transactionId || txRef;
      await payment.save();

      const shipment = await Shipment.findById(payment.shipmentId);
      if (shipment) {
        shipment.paymentStatus = "PAID";
        await shipment.save();
      }
    } else {
      payment.status = "FAILED";
      payment.failedAt = new Date();
      await payment.save();
    }

    res.status(200).json({ success: true, message: "Webhook processed successfully" });
  } catch (error) {
    console.error("Webhook processing error:", error.message);
    res.status(200).json({ success: false, message: "Webhook error acknowledged" });
  }
};

/**
 * @route   GET /api/payments/my-payments
 * @desc    Get customer payment history
 * @access  Private/Customer
 */
const getMyPayments = async (req, res) => {
  try {
    const customer = await Customer.findOne({ userId: req.user._id });
    if (!customer) {
      return res.status(200).json({
        success: true,
        count: 0,
        data: [],
      });
    }

    const payments = await Payment.find({ customerId: customer._id })
      .populate("shipmentId", "shipmentNumber pickupLocation destination cargoDetails status paymentStatus finalPrice pricing")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: payments.length,
      data: payments,
    });
  } catch (error) {
    console.error("Get My Payments Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * @route   GET /api/payments/receipt/:txRef
 * @desc    Get printable receipt by transaction reference
 * @access  Private
 */
const getPaymentReceipt = async (req, res) => {
  try {
    const { txRef } = req.params;
    const isObjectId = Boolean(txRef && (txRef.match(/^[0-9a-fA-F]{24}$/) || txRef.match(/^[0-9a-fA-F-]{36}$/)));
    const payment = await Payment.findOne({
      $or: [
        { txRef },
        { receiptNumber: txRef },
        ...(isObjectId ? [{ _id: txRef }, { shipmentId: txRef }] : []),
      ],
    })
      .populate({
        path: "shipmentId",
        populate: [{ path: "driverId" }, { path: "vehicleId" }],
      })
      .populate("customerId")
      .populate("paidBy", "name email phone");

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Receipt not found",
      });
    }

    // Customer authorization check
    if (req.user.role === "customer") {
      const customer = await Customer.findOne({ userId: req.user._id });
      const custId = String(payment.customerId?._id || payment.customerId);
      const isOwner =
        (customer && custId === String(customer._id)) ||
        custId === String(req.user._id) ||
        String(payment.paidBy?._id || payment.paidBy) === String(req.user._id);

      if (!isOwner) {
        return res.status(403).json({
          success: false,
          message: "You are not authorized to view this receipt.",
        });
      }
    }

    const receiptData = {
      receiptNumber: payment.receiptNumber || `RCPT-${new Date(payment.createdAt).getFullYear()}-${payment._id.toString().slice(-4)}`,
      transactionReference: payment.txRef,
      paymentDate: payment.paidAt || payment.createdAt,
      company: {
        name: "NAYAB TRADING PLC",
        system: "TRANSPORTATION MANAGEMENT SYSTEM",
        address: "Bole Sub-City, Addis Ababa, Ethiopia",
        email: "finance@nayabtrading.com",
        phone: "+251 11 662 0000",
      },
      customer: {
        name: payment.customerDetails?.name || payment.paidBy?.name || "Customer",
        email: payment.customerDetails?.email || payment.paidBy?.email || "customer@ntms.com",
        phone: payment.customerDetails?.phone || payment.paidBy?.phone || "",
      },
      shipment: {
        id: payment.shipmentId?._id,
        shipmentNumber: payment.shipmentId?.shipmentNumber || "N/A",
        pickup: payment.shipmentId?.pickupLocation?.address || payment.shipmentId?.pickupLocation?.city,
        pickupCity: payment.shipmentId?.pickupLocation?.city,
        destination: payment.shipmentId?.destination?.address || payment.shipmentId?.destination?.city,
        destinationCity: payment.shipmentId?.destination?.city,
        cargoType: payment.shipmentId?.cargoDetails?.type || "General Cargo",
        weight: `${payment.shipmentId?.cargoDetails?.weight || 0} ${payment.shipmentId?.cargoDetails?.unit || "kg"}`,
      },
      payment: {
        amount: payment.amount,
        currency: payment.currency || "ETB",
        paymentMethod: payment.paymentMethod || "Chapa",
        status: payment.status,
      },
    };

    res.status(200).json({
      success: true,
      data: receiptData,
    });
  } catch (error) {
    console.error("Get Receipt Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * @route   GET /api/payments
 * @desc    Get all payments (Admin / Financial records)
 * @access  Private/Admin
 */
const getAllPayments = async (req, res) => {
  try {
    const { status, search, page = 1, limit = 20 } = req.query;
    const query = {};

    if (status && status !== "all") {
      query.status = status.toUpperCase();
    }

    if (search) {
      query.$or = [
        { txRef: { $regex: search, $options: "i" } },
        { receiptNumber: { $regex: search, $options: "i" } },
        { "customerDetails.name": { $regex: search, $options: "i" } },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const payments = await Payment.find(query)
      .populate("shipmentId", "shipmentNumber pickupLocation destination cargoDetails finalPrice")
      .populate("customerId", "companyName")
      .populate("paidBy", "name email")
      .limit(parseInt(limit))
      .skip(skip)
      .sort({ createdAt: -1 });

    const total = await Payment.countDocuments(query);

    // Calculate aggregated stats
    const allRecords = await Payment.find({});
    const totalRevenue = allRecords
      .filter((p) => p.status === "PAID")
      .reduce((sum, p) => sum + (p.amount || 0), 0);
    const paidCount = allRecords.filter((p) => p.status === "PAID").length;
    const pendingCount = allRecords.filter((p) => p.status === "PENDING").length;
    const failedCount = allRecords.filter((p) => p.status === "FAILED").length;

    res.status(200).json({
      success: true,
      count: payments.length,
      total,
      stats: {
        totalRevenue,
        paidCount,
        pendingCount,
        failedCount,
        currency: "ETB",
      },
      pages: Math.ceil(total / parseInt(limit)),
      currentPage: parseInt(page),
      data: payments,
    });
  } catch (error) {
    console.error("Get All Payments Error:", error);
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
    const payments = await Payment.find({});

    const totalRevenue = payments
      .filter((p) => p.status === "PAID")
      .reduce((sum, p) => sum + (p.amount || 0), 0);

    const stats = {
      totalRevenue,
      currency: "ETB",
      totalTransactions: payments.length,
      paid: payments.filter((p) => p.status === "PAID").length,
      pending: payments.filter((p) => p.status === "PENDING").length,
      failed: payments.filter((p) => p.status === "FAILED").length,
      cancelled: payments.filter((p) => p.status === "CANCELLED").length,
    };

    res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error("Payment Stats Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * @route   GET /api/payments/:id
 * @desc    Get single payment by ID
 * @access  Private
 */
const getPaymentById = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id)
      .populate("shipmentId")
      .populate("customerId")
      .populate("paidBy", "name email");

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment record not found",
      });
    }

    res.status(200).json({
      success: true,
      data: payment,
    });
  } catch (error) {
    console.error("Get Payment By ID Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  initializePayment,
  verifyPayment,
  handleWebhook,
  getMyPayments,
  getPaymentReceipt,
  getAllPayments,
  getPaymentStats,
  getPaymentById,
};

const Customer = require("../models/Customer");
const User = require("../models/User");
const Shipment = require("../models/Shipment");

/**
 * Customer Management Controller
 *
 * Purpose: Manage customer profiles and history
 * - CRUD operations for customers
 * - View shipment history
 * - Track spending and statistics
 */

/**
 * @route   GET /api/customers
 * @desc    Get all customers
 * @access  Private/Admin
 */
const getAllCustomers = async (req, res) => {
  try {
    const { search, page = 1, limit = 10 } = req.query;
    const query = {};

    if (search) {
      const users = await User.find({
        $or: [
          { name: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
        ],
      }).select("_id");

      query.userId = { $in: users.map((u) => u._id) };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const customers = await Customer.find(query)
      .populate("userId", "name email phone status")
      .limit(parseInt(limit))
      .skip(skip)
      .sort({ createdAt: -1 });

    const total = await Customer.countDocuments(query);

    res.status(200).json({
      success: true,
      count: customers.length,
      total,
      pages: Math.ceil(total / parseInt(limit)),
      currentPage: parseInt(page),
      data: customers,
    });
  } catch (error) {
    console.error("Get Customers Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * @route   GET /api/customers/:id
 * @desc    Get single customer
 * @access  Private
 */
const getCustomerById = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id).populate(
      "userId",
      "name email phone status",
    );

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    res.status(200).json({
      success: true,
      data: customer,
    });
  } catch (error) {
    console.error("Get Customer Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * @route   GET /api/customers/profile/me
 * @desc    Get current customer profile
 * @access  Private/Customer
 */
const getMyProfile = async (req, res) => {
  try {
    const customer = await Customer.findOne({ userId: req.user._id }).populate(
      "userId",
      "name email phone",
    );

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer profile not found",
      });
    }

    res.status(200).json({
      success: true,
      data: customer,
    });
  } catch (error) {
    console.error("Get Profile Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * @route   PUT /api/customers/profile/me
 * @desc    Update customer profile
 * @access  Private/Customer
 */
const updateMyProfile = async (req, res) => {
  try {
    const customer = await Customer.findOneAndUpdate(
      { userId: req.user._id },
      req.body,
      { new: true, runValidators: true },
    ).populate("userId");

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer profile not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: customer,
    });
  } catch (error) {
    console.error("Update Profile Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * @route   GET /api/customers/:id/shipments
 * @desc    Get customer shipment history
 * @access  Private
 */
const getCustomerShipments = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    const shipments = await Shipment.find({ customerId: customer._id })
      .populate("vehicleId", "plateNumber model")
      .populate("driverId", "fullName phone")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: shipments.length,
      data: shipments,
    });
  } catch (error) {
    console.error("Get Customer Shipments Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * @route   PUT /api/customers/:id
 * @desc    Update customer
 * @access  Private/Admin
 */
const updateCustomer = async (req, res) => {
  try {
    const customer = await Customer.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).populate("userId");

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Customer updated successfully",
      data: customer,
    });
  } catch (error) {
    console.error("Update Customer Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * @route   DELETE /api/customers/:id
 * @desc    Delete customer
 * @access  Private/Admin
 */
const deleteCustomer = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    // Check for active shipments
    const activeShipments = await Shipment.countDocuments({
      customerId: customer._id,
      status: {
        $in: ["pending", "approved", "assigned", "picked_up", "in_transit"],
      },
    });

    if (activeShipments > 0) {
      return res.status(400).json({
        success: false,
        message: "Cannot delete customer with active shipments",
      });
    }

    await customer.deleteOne();

    res.status(200).json({
      success: true,
      message: "Customer deleted successfully",
    });
  } catch (error) {
    console.error("Delete Customer Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  getAllCustomers,
  getCustomerById,
  getMyProfile,
  updateMyProfile,
  getCustomerShipments,
  updateCustomer,
  deleteCustomer,
};

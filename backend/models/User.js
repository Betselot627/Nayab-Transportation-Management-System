const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

/**
 * User Model
 *
 * Purpose: Base authentication model for all system users
 * - Handles user authentication
 * - Stores role-based access control
 * - Password hashing with bcrypt
 *
 * Roles:
 * - admin: Full system access
 * - dispatcher: Manage shipments and assignments
 * - driver: View and update assigned trips
 * - customer: Create and track shipments
 */
const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters"],
      maxlength: [50, "Name cannot exceed 50 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        "Please provide a valid email",
      ],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters"],
      select: false, // Don't return password in queries by default
    },
    phone: {
      type: String,
      required: [true, "Phone number is required"],
      trim: true,
      match: [/^\+?[0-9]{10,15}$/, "Please provide a valid phone number"],
    },
    role: {
      type: String,
      enum: {
        values: ["admin", "dispatcher", "driver", "customer"],
        message: "{VALUE} is not a valid role",
      },
      default: "customer",
    },
    status: {
      type: String,
      enum: ["active", "inactive", "suspended"],
      default: "active",
    },
    profileImage: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt
  },
);

// Hash password before saving
userSchema.pre("save", async function () {
  // Only hash if password is modified
  if (!this.isModified("password")) {
    return;
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Method to compare entered password with hashed password
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model("User", userSchema);

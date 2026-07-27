const mongoose = require("mongoose");

/**
 * Notification Model
 *
 * Purpose: In-app notification system
 * - Alert users about important events
 * - Track read/unread status
 * - Support different notification types
 *
 * Types:
 * - shipment: Shipment status updates
 * - trip: Trip assignments and updates
 * - payment: Payment notifications
 * - maintenance: Vehicle maintenance alerts
 * - system: General system notifications
 * - vehicle_registration: New vehicle registration by driver
 * - vehicle_approval: Vehicle approved by admin
 * - vehicle_rejection: Vehicle rejected by admin
 * - vehicle_assignment: Vehicle assigned to customer
 */
const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false, // Allow null for admin broadcast notifications
      default: null,
    },
    title: {
      type: String,
      required: [true, "Notification title is required"],
      trim: true,
    },
    message: {
      type: String,
      required: [true, "Notification message is required"],
      trim: true,
    },
    type: {
      type: String,
      required: [true, "Notification type is required"],
      enum: [
        "shipment",
        "trip",
        "payment",
        "maintenance",
        "system",
        "alert",
        "info",
        "vehicle_registration",
        "vehicle_approval",
        "vehicle_rejection",
        "vehicle_assignment",
      ],
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
    },
    read: {
      type: Boolean,
      default: false,
    },
    readAt: {
      type: Date,
    },
    relatedEntity: {
      entityType: {
        type: String,
        enum: ["shipment", "trip", "vehicle", "payment", "maintenance", "user"],
      },
      entityId: {
        type: mongoose.Schema.Types.ObjectId,
      },
    },
    actionUrl: {
      type: String,
      trim: true,
    },
    expiresAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  },
);

// Index for faster queries
notificationSchema.index({ userId: 1, read: 1 });
notificationSchema.index({ createdAt: -1 });
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index

module.exports = mongoose.model("Notification", notificationSchema);

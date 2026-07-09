const express = require("express");
const router = express.Router();
const {
  getMyNotifications,
  getUnreadCount,
  getNotificationById,
  createNotification,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  clearAllRead,
} = require("../controllers/notificationController");
const { protect } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");

/**
 * Notification Management Routes
 *
 * Base URL: /api/notifications
 *
 * Access: All authenticated users
 */

router.use(protect);

router.get("/", getMyNotifications);
router.get("/unread-count", getUnreadCount);
router.post("/", authorize("admin"), createNotification);
router.put("/mark-all-read", markAllAsRead);
router.delete("/clear-all", clearAllRead);

router.route("/:id").get(getNotificationById).delete(deleteNotification);

router.put("/:id/read", markAsRead);

module.exports = router;

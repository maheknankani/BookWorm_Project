import express from "express";
import Notification from "../models/Notification.js";
import protectRoute from "../middleware/auth.middleware.js";

const router = express.Router();

// Get notifications for current user + unread count
router.get("/", protectRoute, async (req, res) => {
  try {
    const notifications = await Notification.find({ recipient: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50)
      .populate("sender", "username profileImage")
      .populate("book", "title image");

    const unreadCount = await Notification.countDocuments({
      recipient: req.user._id,
      isRead: false,
    });

    res.json({
      notifications,
      unreadCount,
    });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Mark all notifications as read
router.patch("/read-all", protectRoute, async (req, res) => {
  try {
    await Notification.updateMany(
      { recipient: req.user._id, isRead: false },
      { isRead: true }
    );
    res.json({ message: "All notifications marked as read" });
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Mark single notification as read
router.patch("/:id/read", protectRoute, async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, recipient: req.user._id },
      { isRead: true },
      { new: true }
    );
    if (!notification) return res.status(404).json({ message: "Notification not found" });
    res.json(notification);
  } catch (error) {
    console.error("Error marking notification as read:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Delete single notification
router.delete("/:id", protectRoute, async (req, res) => {
  try {
    const notification = await Notification.findOneAndDelete({
      _id: req.params.id,
      recipient: req.user._id,
    });
    if (!notification) return res.status(404).json({ message: "Notification not found" });
    res.json({ message: "Notification deleted successfully", id: req.params.id });
  } catch (error) {
    console.error("Error deleting notification:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Delete all notifications for current user
router.delete("/", protectRoute, async (req, res) => {
  try {
    await Notification.deleteMany({ recipient: req.user._id });
    res.json({ message: "All notifications deleted" });
  } catch (error) {
    console.error("Error deleting all notifications:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;

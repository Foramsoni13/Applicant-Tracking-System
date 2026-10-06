import express from "express";
import Notification from "../models/Notification.js";
import User from "../models/User.js";

const router = express.Router();

// Helper to push notification to Notification collection AND User document
export const createNotificationHelper = async ({ userId, type, title, message, link }) => {
  try {
    if (!userId) return null;
    const notif = await Notification.create({
      userId,
      type: type || "APPLICATION_SUBMITTED",
      title: title || "Notification",
      message: message || "",
      link: link || "/candidate/interviews",
      read: false,
    });

    // Also push to User embedded array for dual compatibility
    try {
      await User.findByIdAndUpdate(userId, {
        $push: {
          notifications: {
            title: title || "Notification",
            message: message || "",
            type: type || "info",
            link: link || "/candidate/interviews",
            read: false,
            createdAt: new Date(),
          },
        },
      });
    } catch (e) {
      console.warn("Failed updating User embedded notification:", e.message);
    }

    return notif;
  } catch (err) {
    console.error("createNotificationHelper error:", err);
    return null;
  }
};

// ==========================================
// 1. GET ALL NOTIFICATIONS FOR USER
// GET /api/notifications?userId=...
// GET /api/notifications/user/:userId
// ==========================================
router.get("/", async (req, res) => {
  try {
    const userId = req.query.userId || req.headers["x-user-id"];
    if (!userId) {
      return res.status(400).json({ success: false, message: "userId parameter is required." });
    }

    const notifications = await Notification.find({ userId })
      .sort({ createdAt: -1 })
      .lean();

    return res.json(notifications);
  } catch (error) {
    console.error("GET /api/notifications error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch notifications", error: error.message });
  }
});

router.get("/user/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const notifications = await Notification.find({ userId })
      .sort({ createdAt: -1 })
      .lean();

    return res.json(notifications);
  } catch (error) {
    console.error("GET /api/notifications/user error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch notifications", error: error.message });
  }
});

// ==========================================
// 2. CREATE NOTIFICATION
// POST /api/notifications
// ==========================================
router.post("/", async (req, res) => {
  try {
    const { userId, type, title, message, link } = req.body;
    if (!userId || !title || !message) {
      return res.status(400).json({ success: false, message: "userId, title, and message are required." });
    }

    const notif = await createNotificationHelper({ userId, type, title, message, link });
    return res.status(201).json({ success: true, notification: notif });
  } catch (error) {
    console.error("POST /api/notifications error:", error);
    return res.status(500).json({ success: false, message: "Failed to create notification", error: error.message });
  }
});

// ==========================================
// 3. MARK ALL NOTIFICATIONS AS READ
// PUT /api/notifications/read-all
// ==========================================
router.put("/read-all", async (req, res) => {
  try {
    const userId = req.body.userId || req.query.userId || req.headers["x-user-id"];
    if (!userId) {
      return res.status(400).json({ success: false, message: "userId is required to mark all as read." });
    }

    await Notification.updateMany({ userId, read: false }, { $set: { read: true } });

    // Also mark embedded user notifications as read
    try {
      const user = await User.findById(userId);
      if (user && user.notifications && user.notifications.length > 0) {
        user.notifications.forEach((n) => { n.read = true; });
        await user.save();
      }
    } catch (e) {
      console.warn("User embedded mark read error:", e.message);
    }

    return res.json({ success: true, message: "All notifications marked as read." });
  } catch (error) {
    console.error("PUT /api/notifications/read-all error:", error);
    return res.status(500).json({ success: false, message: "Failed to mark all notifications as read", error: error.message });
  }
});

// ==========================================
// 4. MARK ONE NOTIFICATION AS READ
// PUT /api/notifications/:notificationId/read
// ==========================================
router.put("/:notificationId/read", async (req, res) => {
  try {
    const { notificationId } = req.params;
    const notif = await Notification.findByIdAndUpdate(
      notificationId,
      { $set: { read: true } },
      { new: true }
    );

    return res.json({ success: true, notification: notif });
  } catch (error) {
    console.error("PUT /api/notifications/:id/read error:", error);
    return res.status(500).json({ success: false, message: "Failed to mark notification as read", error: error.message });
  }
});

export default router;

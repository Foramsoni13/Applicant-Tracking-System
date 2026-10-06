import express from "express";
import Message from "../models/Message.js";

const router = express.Router();

// GET /api/messages?userId=...
// GET /api/messages/user/:userId
router.get("/", async (req, res) => {
  try {
    const userId = req.query.userId || req.headers["x-user-id"];
    if (!userId) {
      return res.status(400).json({ success: false, message: "userId query parameter is required." });
    }

    const messages = await Message.find({ receiverId: userId })
      .sort({ createdAt: -1 })
      .lean();

    return res.json(messages);
  } catch (error) {
    console.error("GET /api/messages error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch messages", error: error.message });
  }
});

router.get("/user/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const messages = await Message.find({ receiverId: userId })
      .sort({ createdAt: -1 })
      .lean();

    return res.json(messages);
  } catch (error) {
    console.error("GET /api/messages/user error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch messages", error: error.message });
  }
});

// POST /api/messages
router.post("/", async (req, res) => {
  try {
    const {
      senderId,
      receiverId,
      senderName,
      senderEmail,
      receiverEmail,
      type,
      subject,
      message,
      relatedApplicationId,
      relatedInterviewId,
    } = req.body;

    if (!receiverId || !message || !type) {
      return res.status(400).json({ success: false, message: "receiverId, type, and message are required." });
    }

    const newMsg = await Message.create({
      senderId: senderId || undefined,
      receiverId,
      senderName: senderName || "RecruitSmart",
      senderEmail: senderEmail || process.env.EMAIL_USER,
      receiverEmail: receiverEmail || "",
      type,
      subject: subject || type,
      message,
      relatedApplicationId: relatedApplicationId || undefined,
      relatedInterviewId: relatedInterviewId || undefined,
      isRead: false,
    });

    return res.status(201).json({ success: true, message: newMsg });
  } catch (error) {
    console.error("POST /api/messages error:", error);
    return res.status(500).json({ success: false, message: "Failed to create message", error: error.message });
  }
});

// PUT /api/messages/:id/read
router.put("/:id/read", async (req, res) => {
  try {
    const { id } = req.params;
    const msg = await Message.findByIdAndUpdate(
      id,
      { $set: { isRead: true } },
      { new: true }
    );

    return res.json({ success: true, message: msg });
  } catch (error) {
    console.error("PUT /api/messages/:id/read error:", error);
    return res.status(500).json({ success: false, message: "Failed to mark message as read", error: error.message });
  }
});

// PUT /api/messages/read-all
router.put("/read-all", async (req, res) => {
  try {
    const userId = req.body.userId || req.query.userId || req.headers["x-user-id"];
    if (!userId) {
      return res.status(400).json({ success: false, message: "userId is required to mark all messages as read." });
    }

    await Message.updateMany({ receiverId: userId, isRead: false }, { $set: { isRead: true } });

    return res.json({ success: true, message: "All messages marked as read." });
  } catch (error) {
    console.error("PUT /api/messages/read-all error:", error);
    return res.status(500).json({ success: false, message: "Failed to mark all messages as read", error: error.message });
  }
});
// DELETE /api/messages/:id
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ success: false, message: "Message ID is required." });
    }

    const deletedMessage = await Message.findByIdAndDelete(id);
    
    if (!deletedMessage) {
      return res.status(404).json({ success: false, message: "Message not found." });
    }

    return res.json({ success: true, message: "Message deleted successfully." });
  } catch (error) {
    console.error("DELETE /api/messages error:", error);
    return res.status(500).json({ success: false, message: "Failed to delete message" });
  }
});

// PUT /api/messages/:id/note
router.put("/:id/note", async (req, res) => {
  try {
    const { id } = req.params;
    const { hrNote } = req.body;

    const message = await Message.findById(id);
    if (!message) {
      return res.status(404).json({ success: false, message: "Message not found" });
    }

    message.hrNote = hrNote;
    await message.save();

    return res.json({ success: true, message: "Note updated successfully", hrNote: message.hrNote });
  } catch (error) {
    console.error("PUT /api/messages/:id/note error:", error);
    return res.status(500).json({ success: false, message: "Failed to update note" });
  }
});

export default router;

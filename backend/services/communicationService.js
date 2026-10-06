import Message from "../models/Message.js";
import Notification from "../models/Notification.js";
import User from "../models/User.js";

/**
 * Creates an in-app message in the Message collection.
 */
export const createInAppMessage = async ({
  senderId,
  receiverId,
  senderName = "RecruitSmart",
  senderEmail = process.env.EMAIL_USER || "foramsoni1312@gmail.com",
  receiverEmail = "",
  type,
  subject = "",
  message,
  relatedApplicationId,
  relatedInterviewId,
}) => {
  try {
    if (!receiverId || !message) {
      console.warn("createInAppMessage missing required fields: receiverId or message");
      return null;
    }

    const newMsg = await Message.create({
      senderId: senderId || undefined,
      receiverId,
      senderName,
      senderEmail,
      receiverEmail,
      type: type || "GENERAL",
      subject: subject || type || "Notification",
      message,
      relatedApplicationId: relatedApplicationId || undefined,
      relatedInterviewId: relatedInterviewId || undefined,
      isRead: false,
    });

    console.log(`[MESSAGE CREATED] Receiver: ${receiverId}, Type: ${type}`);
    return newMsg;
  } catch (err) {
    console.error("createInAppMessage Error:", err.message);
    return null;
  }
};

/**
 * Creates an in-app notification in Notification collection & User embedded notifications.
 */
export const createInAppNotification = async ({
  userId,
  type = "NOTIFICATION",
  title = "Notification",
  message = "",
  link = "/candidate-dashboard",
  relatedApplicationId,
  relatedInterviewId,
}) => {
  try {
    if (!userId || !title || !message) return null;

    const notif = await Notification.create({
      userId,
      type,
      title,
      message,
      link,
      relatedApplicationId: relatedApplicationId || undefined,
      relatedInterviewId: relatedInterviewId || undefined,
      isRead: false,
      read: false,
    });

    // Dual compatibility: update User embedded notifications array
    try {
      await User.findByIdAndUpdate(userId, {
        $push: {
          notifications: {
            title,
            message,
            type,
            link,
            read: false,
            createdAt: new Date(),
          },
        },
      });
    } catch (userErr) {
      console.warn("Failed updating User embedded notification:", userErr.message);
    }

    console.log(`[NOTIFICATION CREATED] User: ${userId}, Title: ${title}`);
    return notif;
  } catch (err) {
    console.error("createInAppNotification Error:", err.message);
    return null;
  }
};

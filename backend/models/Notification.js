import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    type: {
      type: String,
      default: "NOTIFICATION",
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    link: {
      type: String,
      default: "/candidate/interviews",
    },
    relatedApplicationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Application",
    },
    relatedInterviewId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Interview",
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    read: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

const Notification = mongoose.model("Notification", notificationSchema);
export default Notification;

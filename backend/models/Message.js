import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    receiverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    senderName: {
      type: String,
      default: "RecruitSmart",
    },
    senderEmail: {
      type: String,
    },
    receiverEmail: {
      type: String,
    },
    type: {
      type: String,
      required: true,
    },
    subject: {
      type: String,
    },
    message: {
      type: String,
      required: true,
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
    hrNote: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

const Message = mongoose.model("Message", messageSchema);
export default Message;

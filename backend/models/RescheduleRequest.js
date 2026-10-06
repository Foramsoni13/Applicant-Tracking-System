import mongoose from "mongoose";

const rescheduleRequestSchema = new mongoose.Schema(
  {
    interviewId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Interview",
      required: true,
    },
    applicationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Application",
    },
    candidateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    hrId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "HR",
      required: true,
    },
    jobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Job",
    },
    candidateName: {
      type: String,
      default: "Candidate",
    },
    candidateEmail: {
      type: String,
      default: "",
    },
    jobTitle: {
      type: String,
      default: "Job Position",
    },
    currentDate: {
      type: String,
      required: true,
    },
    currentTime: {
      type: String,
      required: true,
    },
    requestedDate: {
      type: String,
      required: true,
    },
    requestedTime: {
      type: String,
      required: true,
    },
    reason: {
      type: String,
      required: true,
      trim: true,
    },
    approvedDate: {
      type: String,
      default: "",
    },
    approvedTime: {
      type: String,
      default: "",
    },
    duration: {
      type: String,
      default: "45 min",
    },
    rejectionReason: {
      type: String,
      default: "",
    },
    hrNote: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "Pending", "Approved", "Rejected"],
      default: "pending",
    },
  },
  {
    timestamps: true,
  }
);

const RescheduleRequest = mongoose.model("RescheduleRequest", rescheduleRequestSchema);

export default RescheduleRequest;

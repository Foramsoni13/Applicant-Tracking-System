import mongoose from "mongoose";

const interviewSchema = new mongoose.Schema(
  {
    candidateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    applicationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Application",
      required: true,
    },

    hrId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "HR",
    },

    date: {
      type: String,
      required: true, // YYYY-MM-DD
    },

    time: {
      type: String,
      required: true, // HH:MM in 24-hour format
    },

    type: {
      type: String,
      enum: ["online", "in_person", "Online", "In Person"],
      default: "online",
    },

    meetingLink: {
      type: String,
      default: "",
    },

    address: {
      type: String,
      default: "",
    },

    status: {
      type: String,
      enum: [
        "scheduled", "accepted", "reschedule_requested", "rescheduled", "cancelled", "completed",
        "Scheduled", "Accepted", "Reschedule Requested", "Rescheduled", "Cancelled", "Completed",
        "Interview Completed", "Selected", "Rejected"
      ],
      default: "scheduled",
    },

    hrReview: {
      rating: { type: Number, default: 0 },
      technicalPerformance: { type: String, default: "" }, // "Excellent", "Good", "Average", "Needs Improvement"
      communication: { type: String, default: "" }, // "Excellent", "Good", "Average", "Needs Improvement"
      overallPerformance: { type: String, default: "" }, // "Excellent", "Good", "Average", "Poor"
      strengths: { type: String, default: "" },
      areasForImprovement: { type: String, default: "" },
      feedback: { type: String, default: "" }, // Final comments
      comments: { type: String, default: "" },
      decision: { type: String, enum: ["Selected", "Rejected", "Pending", ""], default: "Pending" },
      submittedAt: { type: Date },
      hrId: { type: mongoose.Schema.Types.ObjectId, ref: "HR" },
    },

    candidateReview: {
      rating: { type: Number, default: 0 },
      experience: { type: String, default: "" }, // "Excellent", "Good", "Average", "Poor"
      comments: { type: String, default: "" },
      suggestions: { type: String, default: "" },
      submittedAt: { type: Date },
    },

    rescheduleRequest: {
      requestedDate: { type: String, default: "" },
      requestedTime: { type: String, default: "" },
      reason: { type: String, default: "" },
      status: { type: String, enum: ["pending", "approved", "rejected", ""], default: "" },
      requestedAt: { type: Date },
    },

    duration: {
      type: String,
      default: "45 min",
    },

    calendarEventId: {
      type: String,
      default: "",
    },

    notes: {
      type: String,
      default: "",
    },

    hrNotes: [{
      text: { type: String, required: true },
      createdBy: { type: String, default: "HR" },
      hrId: { type: mongoose.Schema.Types.ObjectId, ref: "HR" },
      createdAt: { type: Date, default: Date.now }
    }],

    remindersSent: {
      oneHour: { type: Boolean, default: false },
      tenMin: { type: Boolean, default: false },
    },
  },
  {
    timestamps: true,
  }
);

const Interview = mongoose.model("Interview", interviewSchema);

export default Interview;

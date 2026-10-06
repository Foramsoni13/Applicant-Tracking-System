import mongoose from "mongoose";

const applicationSchema = new mongoose.Schema(
  {
    jobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Job",
      required: true,
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

    candidateName: {
      type: String,
      required: true,
    },

    candidateEmail: {
      type: String,
      required: true,
    },

    resume: {
      type: String,
      required: true,
    },

    status: {
      type: String,
      enum: [
        "Applied",
        "Under Review",
        "Shortlisted",
        "Accepted",
        "Rejected",
        "Rejected by HR",
        "Interview Invited",
        "Interview Scheduled",
        "Interview Confirmed",
        "Interview Rescheduled",
        "Interview Reschedule Requested",
        "Interview In Progress",
        "Interview Completed",
        "Awaiting HR Feedback",
        "Awaiting Candidate Response",
        "Interview Cancelled",
        "Selected",
        "Job Offered",
        "Job Accepted",
        "Job Accepted by Candidate",
        "Job Rejected",
        "Job Rejected by Candidate"
      ],
      default: "Applied",
    },

    candidateJobDecision: {
      type: String,
      enum: ["Pending", "Accepted", "Rejected", ""],
      default: "",
    },

    candidateJobDecisionReason: {
      type: String,
      default: "",
    },

    candidateJobDecisionAt: {
      type: Date,
    },

    hrInterviewFeedback: {
      rating: { type: Number, default: 0 },
      technicalPerformance: { type: String, default: "" },
      communication: { type: String, default: "" },
      overallPerformance: { type: String, default: "" },
      strengths: { type: String, default: "" },
      areasForImprovement: { type: String, default: "" },
      feedback: { type: String, default: "" },
      comments: { type: String, default: "" },
      decision: { type: String, enum: ["Selected", "Rejected", "Pending", ""], default: "Pending" },
      submittedAt: { type: Date },
      hrId: { type: mongoose.Schema.Types.ObjectId, ref: "HR" },
    },

    candidateInterviewReview: {
      rating: { type: Number, default: 0 },
      experience: { type: String, default: "" },
      comments: { type: String, default: "" },
      suggestions: { type: String, default: "" },
      submittedAt: { type: Date },
    },

    source: {
      type: String,
      enum: ["Manual", "Auto Applied"],
      default: "Manual",
    },

    interviewDetails: {
      interviewRound: { type: String, default: "" },
      interviewDate: { type: String, default: "" },
      interviewTime: { type: String, default: "" },
      interviewType: { type: String, enum: ["Online", "Offline"], default: "Online" },
      meetingLink: { type: String, default: "" },
      location: { type: String, default: "" },
      interviewerName: { type: String, default: "" },
      notes: { type: String, default: "" },
      scheduledAt: { type: Date },
    },

    // ==========================================
    // AI Resume Match Data
    // ==========================================

    matchScore: {
      type: Number,
      default: 0,
    },

    matchedSkills: [{
      type: String,
      trim: true,
    }],

    missingSkills: [{
      type: String,
      trim: true,
    }],

    resumeStatus: {
      type: String,
      enum: ["Pending", "Accepted", "Rejected"],
      default: "Pending",
    },

    rejectionReason: {
      type: String,
      default: "",
    },

    // ==========================================
    // Full Resume Scan Data
    // ==========================================

    resumeText: {
      type: String,
      default: "",
    },

    technologies: [{
      type: String,
      trim: true,
    }],

    extractedSkills: [{
      type: String,
      trim: true,
    }],

    extraSkills: [{
      type: String,
      trim: true,
    }],

    resumeSummary: {
      type: String,
      default: "",
    },

    education: {
      type: mongoose.Schema.Types.Mixed,
      default: [],
    },

    experience: {
      type: mongoose.Schema.Types.Mixed,
      default: [],
    },

    projects: {
      type: mongoose.Schema.Types.Mixed,
      default: [],
    },

    certifications: {
      type: mongoose.Schema.Types.Mixed,
      default: [],
    },

    location: {
      type: String,
      default: "",
    },

    candidatePhone: {
      type: String,
      default: "",
    },

    textSimilarity: {
      type: Number,
      default: 0,
    },

    skillMatchRate: {
      type: Number,
      default: 0,
    },

    // ==========================================
    // TF-IDF Resume Screening Scores
    // ==========================================

    tfidfPercentage: {
      type: Number,
      default: 0,
    },

    skillPercentage: {
      type: Number,
      default: 0,
    },

    finalPercentage: {
      type: Number,
      default: 0,
    },

    keywordMatchScore: {
      type: Number,
      default: 0,
    },

    skillsMatchScore: {
      type: Number,
      default: 0,
    },

    experienceMatchScore: {
      type: Number,
      default: 0,
    },

    educationMatchScore: {
      type: Number,
      default: 0,
    },

    projectMatchScore: {
      type: Number,
      default: 0,
    },

    certificationsMatchScore: {
      type: Number,
      default: 0,
    },

    completenessMatchScore: {
      type: Number,
      default: 0,
    },

    breakdown: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

  },
  {
    timestamps: true,
  }
);

const Application = mongoose.model("Application", applicationSchema);

export default Application;
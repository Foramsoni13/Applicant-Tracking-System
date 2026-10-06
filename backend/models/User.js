import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    password: {
      type: String,
      required: true,
    },

    totp_secret: {
      type: String,
      default: "",
    },

    totp_enabled: {
      type: Boolean,
      default: false,
    },

    resetToken: {
      type: String,
      default: "",
    },

    resetTokenExpires: {
      type: Date,
      default: null,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    phone: {
      type: String,
      default: "",
    },

    skills: {
      type: String,
      default: "",
    },

    education: {
      type: String,
      default: "",
    },

    experience: {
      type: String,
      default: "",
    },

    resume: {
      type: String,
      default: "",
    },

    location: {
      type: String,
      default: "",
    },

    about: {
      type: String,
      default: "",
    },

    projects: {
      type: String,
      default: "",
    },

    headline: {
      type: String,
      default: "",
    },

    profilePicture: {
      type: String,
      default: "",
    },

    linkedin: {
      type: String,
      default: "",
    },

    github: {
      type: String,
      default: "",
    },

    portfolio: {
      type: String,
      default: "",
    },

    certificates: [{
      name: String,
      issuingOrganization: String,
      issueDate: String,
      expiryDate: String,
      credentialId: String,
      credentialUrl: String,
      file: String,
      uploadedAt: { type: Date, default: Date.now }
    }],

    role: {
      type: String,
      enum: ["candidate", "hr", "admin"],
      default: "candidate",
    },

    status: {
      type: String,
      default: "Active",
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    notifications: [
      {
        title: { type: String, required: true },
        message: { type: String, required: true },
        type: { type: String, default: "info" },
        jobId: { type: mongoose.Schema.Types.ObjectId, ref: "Job" },
        applicationId: { type: mongoose.Schema.Types.ObjectId, ref: "Application" },
        read: { type: Boolean, default: false },
        createdAt: { type: Date, default: Date.now },
      },
    ],
  },
  {
    timestamps: true,
  }
);

const User = mongoose.model("User", userSchema);

export default User;
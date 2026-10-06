import mongoose from "mongoose";

const hrSchema = new mongoose.Schema(
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

    company: {
      type: String,
      default: "",
    },

    department: {
      type: String,
      default: "",
    },

    role: {
      type: String,
      default: "hr",
    },

    status: {
      type: String,
      default: "Active",
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    atsThreshold: {
      type: Number,
      default: 60,
      min: 0,
      max: 100,
    },
  },
  {
    timestamps: true,
  }
);

const HR = mongoose.model("HR", hrSchema,   "hr");

export default HR;
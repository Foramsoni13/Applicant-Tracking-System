import express from "express";
import User from "../models/User.js";
import protect from "../middleware/authMiddleware.js";

const router = express.Router();


import Resume from "../models/Resume.js";

import Interview from "../models/Interview.js";
import Application from "../models/Application.js";
import Job from "../models/Job.js";
import RescheduleRequest from "../models/RescheduleRequest.js";
import { createNotificationHelper } from "./notificationRoutes.js";
import { createInAppMessage, createInAppNotification } from "../services/communicationService.js";

// Candidate Reschedule Handler Alias
const handleCandidateReschedule = async (req, res) => {
  try {
    const interviewId = req.params.interviewId || req.body.interviewId || req.body.applicationId || req.body._id;
    const { requestedDate, requestedTime, reason } = req.body;

    console.log("[CANDIDATE API RESCHEDULE] Request received for ID:", interviewId);

    if (!requestedDate || !requestedTime || !reason || !reason.trim()) {
      return res.status(400).json({
        success: false,
        message: "New preferred date, preferred time, and reason are required.",
      });
    }

    let interview = await Interview.findById(interviewId);
    let appDoc = null;

    if (interview) {
      appDoc = await Application.findById(interview.applicationId).populate("jobId").populate("candidateId");
    } else {
      appDoc = await Application.findById(interviewId).populate("jobId").populate("candidateId");
      if (appDoc) {
        interview = await Interview.findOne({ applicationId: appDoc._id });
      }
    }

    if (!interview && !appDoc) {
      return res.status(404).json({
        success: false,
        message: "Interview or Application record not found.",
      });
    }

    const candidateIdStr = (appDoc?.candidateId?._id || appDoc?.candidateId || interview?.candidateId)?.toString() || req.body.candidateId;

    let rawHrId = interview?.hrId || appDoc?.hrId || appDoc?.jobId?.hrId || req.body.hrId;
    if (typeof rawHrId === "object" && rawHrId?._id) rawHrId = rawHrId._id;
    let hrIdStr = rawHrId ? rawHrId.toString() : null;

    if (!hrIdStr) {
      try {
        const fallbackHr = await User.findOne({ role: "hr" });
        if (fallbackHr) hrIdStr = fallbackHr._id.toString();
      } catch (e) {}
    }

    if (interview) {
      interview.hrId = hrIdStr;
      interview.status = "reschedule_requested";
      interview.rescheduleRequest = {
        requestedDate,
        requestedTime,
        reason: reason.trim(),
        status: "pending",
        requestedAt: new Date(),
      };
      await interview.save();
    }

    if (appDoc) {
      if (hrIdStr) appDoc.hrId = hrIdStr;
      appDoc.status = "Interview Reschedule Requested";
      await appDoc.save();
    }

    const candidateName = appDoc?.candidateName || appDoc?.candidateId?.name || "Candidate";
    const candidateEmail = appDoc?.candidateId?.email || appDoc?.candidateEmail || "";
    const jobTitle = appDoc?.jobId?.title || "Job Position";
    const currentDate = interview?.date || appDoc?.interviewDetails?.interviewDate || "Scheduled Date";
    const currentTime = interview?.time || appDoc?.interviewDetails?.interviewTime || "Scheduled Time";

    try {
      await RescheduleRequest.findOneAndUpdate(
        { interviewId: interview?._id || interviewId },
        {
          interviewId: interview?._id || interviewId,
          applicationId: appDoc?._id,
          candidateId: candidateIdStr,
          hrId: hrIdStr,
          jobId: appDoc?.jobId?._id || appDoc?.jobId,
          candidateName,
          candidateEmail,
          jobTitle,
          currentDate,
          currentTime,
          requestedDate,
          requestedTime,
          reason: reason.trim(),
          status: "pending",
        },
        { upsert: true, new: true }
      );
    } catch (e) {
      console.warn("RescheduleRequest save warning:", e.message);
    }

    if (hrIdStr) {
      // 1. Create In-App Message for HR (Section 8)
      const hrMessageBody = `Interview Reschedule Request\n\nCandidate: ${candidateName}\nPosition: ${jobTitle}\n\nCurrent Interview:\nDate: ${currentDate}\nTime: ${currentTime}\n\nRequested:\nDate: ${requestedDate}\nTime: ${requestedTime}\n\nReason:\n${reason.trim()}`;

      await createInAppMessage({
        senderId: candidateIdStr,
        receiverId: hrIdStr,
        senderName: candidateName,
        senderEmail: candidateEmail,
        type: "RESCHEDULE_REQUEST",
        subject: "Interview Reschedule Request",
        message: hrMessageBody,
        relatedApplicationId: appDoc?._id,
        relatedInterviewId: interview?._id,
      });

      // 2. Create HR Notification (Section 8)
      await createInAppNotification({
        userId: hrIdStr,
        type: "INTERVIEW_RESCHEDULE_REQUEST",
        title: "New Interview Reschedule Request",
        message: `${candidateName} has requested to reschedule the ${jobTitle} interview.`,
        link: "/hr-dashboard",
        relatedApplicationId: appDoc?._id,
        relatedInterviewId: interview?._id,
      });
    }

    if (candidateIdStr) {
      await createInAppNotification({
        userId: candidateIdStr,
        type: "RESCHEDULE_SENT",
        title: "Reschedule Request Sent",
        message: "Your interview reschedule request has been sent to HR.",
        link: "/candidate/interviews",
        relatedApplicationId: appDoc?._id,
        relatedInterviewId: interview?._id,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Reschedule request sent successfully",
    });
  } catch (err) {
    console.error("Candidate reschedule error:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to submit reschedule request: " + err.message,
    });
  }
};

router.post("/reschedule", handleCandidateReschedule);
router.post("/reschedule-request", handleCandidateReschedule);
router.post("/:interviewId/reschedule", handleCandidateReschedule);
router.post("/:interviewId/reschedule-request", handleCandidateReschedule);

// ==========================================
// GET CANDIDATE PROFILE
// ==========================================

const getProfileHandler = async (req, res) => {
  try {
    let targetId = req.user?._id || req.user?.id;

    // HR and Admin roles can view candidate profile by URL param ID
    if ((req.user?.role === "hr" || req.user?.role === "admin") && req.params.id && req.params.id !== "me" && req.params.id !== "profile") {
      targetId = req.params.id;
    }

    // Fallback to param ID if req.user not set
    if (!targetId && req.params.id && req.params.id !== "me" && req.params.id !== "profile") {
      targetId = req.params.id;
    }

    if (!targetId || targetId === "me" || targetId === "profile") {
      return res.status(401).json({
        success: false,
        message: "User not authenticated and no valid candidate ID provided",
      });
    }

    const user = await User.findById(targetId).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Candidate not found",
      });
    }

    const resume = await Resume.findOne({ candidateId: user._id }).sort({ uploadedAt: -1 });

    const userData = user.toObject();

    if (resume) {
      if (!userData.projects || (Array.isArray(userData.projects) && userData.projects.length === 0) || userData.projects === "") {
        if (resume.projects && resume.projects.length > 0) userData.projects = resume.projects;
      }
      if (!userData.experience || (Array.isArray(userData.experience) && userData.experience.length === 0) || userData.experience === "") {
        if (resume.experience && resume.experience.length > 0) userData.experience = resume.experience;
      }
      if (!userData.education || (Array.isArray(userData.education) && userData.education.length === 0) || userData.education === "") {
        if (resume.education && resume.education.length > 0) userData.education = resume.education;
      }
      if (!userData.skills || userData.skills === "") {
        if (resume.extractedSkills && resume.extractedSkills.length > 0) userData.skills = resume.extractedSkills;
      }
      if (!userData.resume && resume.filePath) {
        userData.resume = resume.filePath;
      }
      userData.extractedSkills = resume.extractedSkills || [];
      userData.extractedText = resume.extractedText || "";
    }

    return res.status(200).json({
      success: true,
      user: userData,
    });

  } catch (error) {
    console.log("Get profile error:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

router.get("/me", protect, getProfileHandler);
router.get("/profile", protect, getProfileHandler);
router.get("/:id", protect, getProfileHandler);


import multer from "multer";
import path from "path";
import fs from "fs";

const certStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), "uploads", "certificates");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const filename = `cert_${Date.now()}_${Math.random().toString(36).substring(2, 8)}${ext}`;
    cb(null, filename);
  },
});
const uploadCert = multer({ storage: certStorage });

const avatarStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), "uploads", "avatars");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const filename = `avatar_${Date.now()}_${Math.random().toString(36).substring(2, 8)}${ext}`;
    cb(null, filename);
  },
});
const uploadAvatar = multer({ storage: avatarStorage });

// ==========================================
// UPDATE CANDIDATE PROFILE
// ==========================================

const handleProfileUpdate = async (req, res) => {
  try {
    let targetId = req.user?._id || req.user?.id;

    if ((req.user?.role === "hr" || req.user?.role === "admin") && req.params.id && req.params.id !== "me" && req.params.id !== "profile") {
      targetId = req.params.id;
    }
    if (!targetId && req.params.id && req.params.id !== "me" && req.params.id !== "profile") {
      targetId = req.params.id;
    }
    if (!targetId || targetId === "me" || targetId === "profile") {
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
    }

    const updateData = {};
    if (req.body.name !== undefined) updateData.name = req.body.name;
    if (req.body.phone !== undefined) updateData.phone = req.body.phone;
    if (req.body.skills !== undefined) updateData.skills = req.body.skills;
    if (req.body.education !== undefined) updateData.education = req.body.education;
    if (req.body.experience !== undefined) updateData.experience = req.body.experience;
    if (req.body.location !== undefined) updateData.location = req.body.location;
    if (req.body.about !== undefined) updateData.about = req.body.about;
    if (req.body.projects !== undefined) updateData.projects = req.body.projects;
    if (req.body.headline !== undefined) updateData.headline = req.body.headline;
    if (req.body.linkedin !== undefined) updateData.linkedin = req.body.linkedin;
    if (req.body.github !== undefined) updateData.github = req.body.github;
    if (req.body.portfolio !== undefined) updateData.portfolio = req.body.portfolio;
    if (req.body.profilePicture !== undefined) updateData.profilePicture = req.body.profilePicture;

    if (req.file) {
      updateData.profilePicture = `/uploads/avatars/${req.file.filename}`;
    }

    const updatedUser = await User.findByIdAndUpdate(targetId, updateData, { new: true });

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: "Candidate not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

router.put("/me", protect, uploadAvatar.single("profilePicture"), handleProfileUpdate);
router.put("/profile", protect, uploadAvatar.single("profilePicture"), handleProfileUpdate);
router.put("/:id", protect, uploadAvatar.single("profilePicture"), handleProfileUpdate);
router.put("/profile/:id", protect, uploadAvatar.single("profilePicture"), handleProfileUpdate);

// ==========================================
// CERTIFICATE MANAGEMENT ENDPOINTS
// ==========================================

// Add Certificate
router.post("/certificates/:candidateId", uploadCert.single("file"), async (req, res) => {
  try {
    const { name, issuingOrganization, issueDate, expiryDate, credentialId, credentialUrl } = req.body;
    const user = await User.findById(req.params.candidateId);

    if (!user) {
      return res.status(404).json({ success: false, message: "Candidate not found" });
    }

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: "Certificate name is required" });
    }

    let filePath = "";
    if (req.file) {
      filePath = `/uploads/certificates/${req.file.filename}`;
    }

    const newCert = {
      name: name.trim(),
      issuingOrganization: (issuingOrganization || "").trim(),
      issueDate: issueDate || "",
      expiryDate: expiryDate || "",
      credentialId: (credentialId || "").trim(),
      credentialUrl: (credentialUrl || "").trim(),
      file: filePath,
      uploadedAt: new Date(),
    };

    user.certificates.push(newCert);
    await user.save();

    return res.status(201).json({
      success: true,
      message: "Certificate added successfully",
      certificates: user.certificates,
    });
  } catch (error) {
    console.error("Add certificate error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

// Delete Certificate
router.delete("/certificates/:candidateId/:certId", async (req, res) => {
  try {
    const user = await User.findById(req.params.candidateId);
    if (!user) {
      return res.status(404).json({ success: false, message: "Candidate not found" });
    }

    user.certificates = user.certificates.filter(
      (c) => c._id.toString() !== req.params.certId
    );
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Certificate deleted successfully",
      certificates: user.certificates,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});


// ==========================================
// GET CANDIDATE NOTIFICATIONS
// ==========================================

router.get("/notifications/:candidateId", async (req, res) => {
  try {
    const user = await User.findById(req.params.candidateId).select("notifications");
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Candidate not found",
      });
    }

    const notifications = (user.notifications || []).sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );

    return res.status(200).json({
      success: true,
      notifications,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});


// ==========================================
// MARK NOTIFICATIONS AS READ
// ==========================================

router.put("/notifications/mark-read/:candidateId", async (req, res) => {
  try {
    const user = await User.findById(req.params.candidateId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Candidate not found",
      });
    }

    if (user.notifications && user.notifications.length > 0) {
      user.notifications.forEach((n) => {
        n.read = true;
      });
      await user.save();
    }

    return res.status(200).json({
      success: true,
      message: "Notifications marked as read",
      notifications: user.notifications,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

export default router;
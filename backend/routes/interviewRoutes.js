import express from "express";
import mongoose from "mongoose";
import Interview from "../models/Interview.js";
import Application from "../models/Application.js";
import Job from "../models/Job.js";
import HR from "../models/HR.js";
import User from "../models/User.js";
import RescheduleRequest from "../models/RescheduleRequest.js";
import { createNotificationHelper } from "./notificationRoutes.js";
import { createInAppMessage, createInAppNotification } from "../services/communicationService.js";
import {
  sendInterviewScheduledEmail,
  sendInterviewRescheduledEmail,
  sendInterviewCancelledEmail,
  sendInterviewRescheduleRejectedEmail,
} from "../services/emailService.js";

const router = express.Router();

// Helper to push notifications if available
const pushNotification = async (userId, notification) => {
  try {
    // Graceful notification push
    console.log(`[Notification Push to ${userId}]`, notification.title, notification.message);
  } catch (err) {
    console.error("Notification Error:", err);
  }
};

// Test API Route
router.get("/test", (req, res) => {
  console.log("GET /api/interviews/test HIT");
  return res.json({
    success: true,
    message: "Interview API is working",
  });
});

// ==========================================
// CANDIDATE RESCHEDULE ENDPOINTS (TOP PRIORITY ROUTE MATCHING)
// ==========================================
router.post("/reschedule", handleCandidateRescheduleRequest);
router.post("/reschedule-request", handleCandidateRescheduleRequest);
router.post("/:interviewId/reschedule-request", handleCandidateRescheduleRequest);
router.post("/:interviewId/reschedule", handleCandidateRescheduleRequest);

// ==========================================
// 1. GET ALL SCHEDULED INTERVIEWS
// GET /api/interviews
// ==========================================
router.get("/", async (req, res) => {
  console.log("GET /api/interviews HIT");
  try {
    const { hrId } = req.query;
    const filter = { status: { $ne: "cancelled" } };
    if (hrId) filter.hrId = hrId;

    // Fetch from Interview collection first as raw lean JS objects
    const interviews = await Interview.find(filter)
      .populate("candidateId")
      .sort({ date: 1, time: 1 })
      .lean();

    // Also fetch Applications with interview status
    const appFilter = {
      $or: [
        { "interviewDetails.interviewDate": { $exists: true, $ne: "" } },
        { status: { $in: ["Interview Scheduled", "Interview Rescheduled", "Interview Reschedule Requested", "Interview Confirmed", "Interview In Progress", "Interview Completed", "Selected", "Job Accepted by Candidate", "Job Rejected by Candidate", "Rejected by HR", "Rejected"] } }
      ]
    };
    if (hrId) appFilter.hrId = hrId;

    const scheduledApps = await Application.find(appFilter)
      .populate("jobId")
      .populate("candidateId")
      .lean();

    const toIdStr = (val) => {
      if (!val) return "";
      if (typeof val === "string") return val;
      if (val._id) return val._id.toString();
      if (typeof val.toHexString === "function") return val.toHexString();
      const str = String(val);
      return str === "[object Object]" ? "" : str;
    };

    const map = new Map();

    // 1. Process Applications with interview status
    scheduledApps.forEach((app) => {
      const details = app.interviewDetails || {};
      if (!details.interviewDate || !details.interviewTime) return;

      const appIdStr = toIdStr(app._id);

      map.set(appIdStr, {
        _id: appIdStr,
        interviewId: appIdStr,
        applicationId: appIdStr,
        candidateId: toIdStr(app.candidateId),
        candidateName: app.candidateName || app.candidateId?.name || "Candidate",
        candidateEmail: app.candidateEmail || app.candidateId?.email || "",
        candidatePhone: app.candidatePhone || app.candidateId?.phone || "",
        jobTitle: app.jobId?.title || "Job Position",
        company: app.jobId?.company || "",
        date: details.interviewDate,
        time: details.interviewTime,
        type: details.interviewType === "In Person" || details.interviewType === "in_person" ? "in_person" : "online",
        meetingLink: details.meetingLink || "",
        address: details.location || "",
        status: app.status === "Interview Reschedule Requested" ? "reschedule_requested" : (app.status === "Interview Completed" ? "completed" : (app.status === "Selected" ? "Selected" : "scheduled")),
        applicationStatus: app.status,
        hrReview: app.hrInterviewFeedback || null,
        candidateReview: app.candidateInterviewReview || null,
        candidateJobDecision: app.candidateJobDecision || "",
        candidateJobDecisionReason: app.candidateJobDecisionReason || "",
        interviewDetails: details,
        rescheduleRequest: null,
        hrNotes: [],
      });
    });

    // 2. Override with explicit Interview collection documents (primary source of truth)
    interviews.forEach((inv) => {
      const invIdStr = toIdStr(inv._id);
      const appIdStr = toIdStr(inv.applicationId);
      const candIdStr = toIdStr(inv.candidateId);

      let targetAppId = appIdStr;
      if (!targetAppId && candIdStr) {
        const matched = scheduledApps.find((a) => toIdStr(a.candidateId) === candIdStr);
        if (matched) targetAppId = toIdStr(matched._id);
      }

      // KEY FIX: Use the unique interview ID to avoid overwriting multiple interviews for the same application
      const key = invIdStr || targetAppId;

      const existingApp = targetAppId ? map.get(targetAppId) : undefined;
      const candObj = (inv.candidateId && typeof inv.candidateId === "object") ? inv.candidateId : existingApp?.candidateId;
      const jobObj = existingApp?.jobId;

      map.set(key, {
        _id: invIdStr,
        interviewId: invIdStr,
        applicationId: key,
        candidateId: candIdStr || existingApp?.candidateId || "",
        candidateName: candObj?.name || existingApp?.candidateName || "Candidate",
        candidateEmail: candObj?.email || existingApp?.candidateEmail || "",
        candidatePhone: candObj?.phone || existingApp?.candidatePhone || "",
        jobTitle: jobObj?.title || existingApp?.jobTitle || "Job Position",
        company: jobObj?.company || existingApp?.company || "",
        date: inv.date,
        time: inv.time,
        type: inv.type,
        meetingLink: inv.meetingLink || "",
        address: inv.address || "",
        status: inv.status,
        applicationStatus: existingApp?.applicationStatus || (inv.status === "completed" ? "Interview Completed" : ""),
        hrReview: inv.hrReview || existingApp?.hrReview || null,
        candidateReview: inv.candidateReview || existingApp?.candidateReview || null,
        candidateJobDecision: existingApp?.candidateJobDecision || "",
        candidateJobDecisionReason: existingApp?.candidateJobDecisionReason || "",
        rescheduleRequest: inv.rescheduleRequest || existingApp?.rescheduleRequest || null,
        hrNotes: inv.hrNotes || [],
        interviewDetails: {
          interviewDate: inv.date,
          interviewTime: inv.time,
          interviewType: inv.type === "online" || inv.type === "Online" ? "Online" : "In Person",
          meetingLink: inv.meetingLink || "",
          location: inv.address || "",
        },
      });
    });

    const resultList = Array.from(map.values());
    console.log(`[GET /api/interviews] Returned ${resultList.length} unique scheduled interviews.`);
    return res.json(resultList);
  } catch (error) {
    console.error("GET /api/interviews Error:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to load interviews. Please check the backend.",
      error: error.message,
    });
  }
});

// ==========================================
// 2. GET ALL RESCHEDULE REQUESTS FOR HR
// GET /api/interviews/reschedule-requests?hrId=...
// ==========================================
router.get("/reschedule-requests", async (req, res) => {
  try {
    const { hrId } = req.query;
    const validHrId = (hrId && hrId !== "undefined" && hrId !== "null" && hrId !== "") ? hrId : null;
    
    console.log("[HR MESSAGES] HR ID:", validHrId || "All HRs");
    
    const filter = validHrId ? { hrId: validHrId } : {};

    // Fetch from RescheduleRequest collection
    let requests = await RescheduleRequest.find(filter)
      .populate("candidateId")
      .populate("jobId")
      .populate("interviewId")
      .sort({ createdAt: -1 })
      .lean();

    // Fallback: If hrId query returned 0 results, fetch all reschedule requests so HR never misses messages
    if (validHrId && requests.length === 0) {
      const allReqs = await RescheduleRequest.find({})
        .populate("candidateId")
        .populate("jobId")
        .populate("interviewId")
        .sort({ createdAt: -1 })
        .lean();
      if (allReqs.length > 0) {
        requests = allReqs;
      }
    }

    // Also fetch from Interview collection for any reschedule_requested records
    const interviewFilter = validHrId
      ? { hrId: validHrId, status: { $in: ["reschedule_requested", "rescheduled", "scheduled"] } }
      : { status: { $in: ["reschedule_requested", "rescheduled", "scheduled"] } };

    let interviews = await Interview.find(interviewFilter)
      .populate("candidateId")
      .populate({
        path: "applicationId",
        populate: { path: "jobId" },
      })
      .lean();

    if (validHrId && interviews.length === 0) {
      interviews = await Interview.find({ status: { $in: ["reschedule_requested", "rescheduled", "scheduled"] } })
        .populate("candidateId")
        .populate({
          path: "applicationId",
          populate: { path: "jobId" },
        })
        .lean();
    }

    const itemsMap = new Map();

    // 1. Process explicit RescheduleRequest documents
    requests.forEach((r) => {
      const key = r.interviewId?._id ? r.interviewId._id.toString() : (r.interviewId ? r.interviewId.toString() : (r._id ? r._id.toString() : ""));
      if (!key) return;
      itemsMap.set(key, {
        _id: r._id ? r._id.toString() : key,
        interviewId: key,
        applicationId: r.applicationId?.toString() || "",
        candidateId: r.candidateId?._id ? r.candidateId._id.toString() : r.candidateId?.toString(),
        candidateName: r.candidateName || r.candidateId?.name || "Candidate",
        candidateEmail: r.candidateEmail || r.candidateId?.email || "",
        candidatePhone: r.candidateId?.phone || "",
        jobTitle: r.jobTitle || r.jobId?.title || "Job Position",
        company: r.jobId?.company || "Company",
        currentDate: r.currentDate,
        currentTime: r.currentTime,
        requestedDate: r.requestedDate,
        requestedTime: r.requestedTime,
        reason: r.reason,
        status: r.status, // "pending", "approved", "rejected"
        createdAt: r.createdAt,
        type: r.interviewId?.type === "in_person" ? "In Person" : "Online",
        meetingLink: r.interviewId?.meetingLink || "",
        address: r.interviewId?.address || "",
      });
    });

    // 2. Process Interview documents with rescheduleRequest embedded
    interviews.forEach((inv) => {
      if (inv.status === "reschedule_requested" || inv.rescheduleRequest) {
        const key = inv._id ? inv._id.toString() : inv.interviewId;
        if (!key) return;
        const existing = itemsMap.get(key);
        const reqObj = inv.rescheduleRequest || {};

        if (!existing) {
          itemsMap.set(key, {
            _id: key,
            interviewId: key,
            applicationId: inv.applicationId?._id ? inv.applicationId._id.toString() : (typeof inv.applicationId === "string" ? inv.applicationId : ""),
            candidateId: inv.candidateId?._id ? inv.candidateId._id.toString() : (typeof inv.candidateId === "string" ? inv.candidateId : ""),
            candidateName: inv.candidateName || "Candidate",
            candidateEmail: inv.candidateEmail || "",
            candidatePhone: inv.candidatePhone || "",
            jobTitle: inv.jobTitle || "Job Position",
            company: inv.company || "Company",
            currentDate: inv.date || inv.interviewDetails?.interviewDate || "Scheduled Date",
            currentTime: inv.time || inv.interviewDetails?.interviewTime || "Scheduled Time",
            requestedDate: reqObj.requestedDate || "Requested Date",
            requestedTime: reqObj.requestedTime || "Requested Time",
            reason: reqObj.reason || "Reason provided by candidate",
            status: reqObj.status || (inv.status === "reschedule_requested" ? "pending" : inv.status),
            createdAt: reqObj.requestedAt || new Date(),
            type: inv.type === "in_person" ? "In Person" : "Online",
            meetingLink: inv.meetingLink || "",
            address: inv.address || "",
          });
        }
      }
    });

    const resultList = Array.from(itemsMap.values()).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    console.log("[HR MESSAGES] Reschedule requests found:", resultList.length);
    return res.json(resultList);
  } catch (error) {
    console.error("GET /api/interviews/reschedule-requests Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch reschedule requests: " + error.message,
      error: error.message,
    });
  }
});

// ==========================================
// 3. GET INTERVIEWS FOR SPECIFIC CANDIDATE
// GET /api/interviews/candidate/:candidateId
// ==========================================
router.get("/candidate/:candidateId", async (req, res) => {
  try {
    const { candidateId } = req.params;

    // Fetch from explicit Interview collection
    const interviews = await Interview.find({
      candidateId,
      status: { $ne: "cancelled" },
    })
      .populate({
        path: "applicationId",
        populate: { path: "jobId" },
      })
      .sort({ date: 1, time: 1 })
      .lean();

    // Fetch from Application collection for candidates with interview details
    const appsWithInterview = await Application.find({
      candidateId,
      status: { $nin: ["Interview Cancelled"] },
      $or: [
        { "interviewDetails.interviewDate": { $exists: true, $ne: "" } },
        { status: { $in: ["Interview Scheduled", "Interview Rescheduled", "Interview Confirmed", "Interview In Progress", "Interview Completed", "Selected", "Job Offered", "Job Accepted", "Job Accepted by Candidate", "Job Rejected", "Job Rejected by Candidate", "Rejected by HR", "Rejected"] } }
      ]
    })
      .populate("jobId")
      .lean();

    const map = new Map();

    // 1. Map Applications with interviewDetails
    appsWithInterview.forEach((app) => {
      const details = app.interviewDetails || {};
      if (!details.interviewDate || !details.interviewTime) return;
      const appIdStr = app._id.toString();

      map.set(appIdStr, {
        _id: appIdStr,
        interviewId: appIdStr,
        applicationId: appIdStr,
        candidateId: candidateId,
        candidateName: app.candidateName || "Candidate",
        jobTitle: app.jobId?.title || "Job Position",
        company: app.jobId?.company || "Company",
        location: details.location || app.jobId?.location || "",
        date: details.interviewDate,
        time: details.interviewTime,
        type: details.interviewType === "In Person" || details.interviewType === "in_person" ? "in_person" : "online",
        meetingLink: details.meetingLink || "",
        address: details.location || "",
        status: app.status === "Interview Completed" ? "completed" : (app.status === "Interview Confirmed" ? "accepted" : (app.status === "Interview Rescheduled" ? "rescheduled" : (app.status === "Selected" ? "Selected" : "scheduled"))),
        applicationStatus: app.status,
        hrReview: app.hrInterviewFeedback || null,
        candidateReview: app.candidateInterviewReview || null,
        candidateJobDecision: app.candidateJobDecision || "",
        candidateJobDecisionReason: app.candidateJobDecisionReason || "",
        interviewDetails: details,
        rescheduleRequest: null,
        hrId: app.hrId || app.jobId?.hrId,
      });
    });

    // 2. Override / enrich with explicit Interview collection documents
    interviews.forEach((inv) => {
      const invIdStr = inv._id.toString();
      const appIdStr = inv.applicationId?._id ? inv.applicationId._id.toString() : (typeof inv.applicationId === "string" ? inv.applicationId : invIdStr);
      const appObj = (inv.applicationId && typeof inv.applicationId === "object") ? inv.applicationId : null;
      const jobObj = appObj?.jobId;

      const existingApp = map.get(appIdStr);

      map.set(appIdStr || invIdStr, {
        _id: invIdStr,
        interviewId: invIdStr,
        applicationId: appIdStr,
        candidateId: candidateId,
        candidateName: appObj?.candidateName || existingApp?.candidateName || "Candidate",
        jobTitle: jobObj?.title || existingApp?.jobTitle || "Job Position",
        company: jobObj?.company || existingApp?.company || "Company",
        location: inv.address || existingApp?.location || "",
        date: inv.date,
        time: inv.time,
        type: inv.type,
        meetingLink: inv.meetingLink || "",
        address: inv.address || "",
        status: inv.status,
        applicationStatus: appObj?.status || existingApp?.applicationStatus || (inv.status === "completed" ? "Interview Completed" : ""),
        hrReview: inv.hrReview || appObj?.hrInterviewFeedback || existingApp?.hrReview || null,
        candidateReview: inv.candidateReview || appObj?.candidateInterviewReview || existingApp?.candidateReview || null,
        candidateJobDecision: appObj?.candidateJobDecision || existingApp?.candidateJobDecision || "",
        candidateJobDecisionReason: appObj?.candidateJobDecisionReason || existingApp?.candidateJobDecisionReason || "",
        rescheduleRequest: inv.rescheduleRequest || null,
        hrId: inv.hrId || existingApp?.hrId,
        interviewDetails: {
          interviewDate: inv.date,
          interviewTime: inv.time,
          interviewType: inv.type === "online" || inv.type === "Online" ? "Online" : "In Person",
          meetingLink: inv.meetingLink || "",
          location: inv.address || "",
        },
      });
    });

    const result = Array.from(map.values());
    return res.json(result);
  } catch (error) {
    console.error("GET /api/interviews/candidate Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch candidate interviews",
      error: error.message,
    });
  }
});

// ==========================================
// GET /api/interviews/application/:applicationId
// ==========================================
router.get("/application/:applicationId", async (req, res) => {
  try {
    const { applicationId } = req.params;

    // Fetch from explicit Interview collection
    const interviews = await Interview.find({
      applicationId,
      status: { $ne: "cancelled" },
    })
      .populate("jobId")
      .populate("candidateId")
      .lean();

    if (interviews && interviews.length > 0) {
      return res.json({
        success: true,
        interviews: interviews.map(interview => ({
          ...interview,
          interviewDetails: {
            interviewDate: interview.date,
            interviewTime: interview.time,
            interviewType: interview.type === "online" || interview.type === "Online" ? "Online" : "In Person",
            meetingLink: interview.meetingLink || "",
            location: interview.address || "",
          }
        }))
      });
    }

    // Fallback to Application document if no Interview exists yet
    const app = await Application.findById(applicationId).lean();
    if (app && app.interviewDetails && app.interviewDetails.interviewDate) {
      return res.json({
        success: true,
        interviews: [{
          _id: app._id,
          applicationId: app._id,
          candidateId: app.candidateId,
          date: app.interviewDetails.interviewDate,
          time: app.interviewDetails.interviewTime,
          type: app.interviewDetails.interviewType === "In Person" ? "in_person" : "online",
          meetingLink: app.interviewDetails.meetingLink || "",
          address: app.interviewDetails.location || "",
          status: app.status === "Interview Scheduled" ? "scheduled" : app.status,
          interviewDetails: app.interviewDetails,
        }]
      });
    }

    return res.json({
      success: true,
      interviews: []
    });
  } catch (error) {
    console.error("GET /api/interviews/application Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch application interview",
      error: error.message,
    });
  }
});

// ==========================================
// 3. CREATE INTERVIEW
// POST /api/interviews
// ==========================================
router.post("/", async (req, res) => {
  console.log("POST /api/interviews HIT");
  try {
    console.log("[POST /api/interviews] Payload:", req.body);
    const { candidateId, applicationId, date, time, type, meetingLink, address } = req.body;

    if (!date || !time) {
      return res.status(400).json({
        success: false,
        message: "Interview date and time are required.",
      });
    }

    // Past date check
    const selectedDate = new Date(date);
    selectedDate.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (selectedDate < today) {
      return res.status(400).json({
        success: false,
        message: "Please select a valid future date.",
      });
    }

    const typeNormalized = type === "in_person" || type === "In Person" ? "in_person" : "online";

    if (typeNormalized === "online" && (!meetingLink || meetingLink.trim() === "")) {
      return res.status(400).json({
        success: false,
        message: "Meeting link is required for online interviews.",
      });
    }

    if (typeNormalized === "in_person" && (!address || address.trim() === "")) {
      return res.status(400).json({
        success: false,
        message: "Address is required for in-person interviews.",
      });
    }

    // Double Booking / Conflict Check on Backend
    const filterInterview = {
      date,
      time,
      status: { $ne: "cancelled" },
    };
    const filterApp = {
      status: { $in: ["Interview Scheduled", "Interview Rescheduled"] },
      "interviewDetails.interviewDate": date,
      "interviewDetails.interviewTime": time,
    };

    if (applicationId) {
      filterApp._id = { $ne: applicationId };
      filterInterview.applicationId = { $ne: applicationId };
    }

    const interviewConflict = await Interview.findOne(filterInterview);
    const appConflict = await Application.findOne(filterApp);

    if (interviewConflict || appConflict) {
      return res.status(409).json({
        success: false,
        message: "Interview already scheduled for this date and time. Please select another time.",
      });
    }

    // Resolve application & candidate
    let targetApp = null;
    if (applicationId) {
      targetApp = await Application.findById(applicationId);
    }

    const finalCandidateId = candidateId || targetApp?.candidateId;
    if (!finalCandidateId) {
      return res.status(400).json({
        success: false,
        message: "Candidate ID or Application ID is required.",
      });
    }

    // Create Interview Document
    const newInterview = await Interview.create({
      candidateId: finalCandidateId,
      applicationId: targetApp?._id || applicationId,
      hrId: req.body.hrId || targetApp?.hrId,
      date,
      time,
      type: typeNormalized,
      meetingLink: meetingLink || "",
      address: address || "",
      status: "scheduled",
      hrNotes: req.body.initialNote ? [{ text: req.body.initialNote, createdBy: "HR", hrId: req.body.hrId || targetApp?.hrId, createdAt: new Date() }] : []
    });

    // Update Application Document
    if (targetApp) {
      targetApp.status = "Interview Scheduled";
      targetApp.interviewDetails = {
        interviewDate: date,
        interviewTime: time,
        interviewType: typeNormalized === "in_person" ? "In Person" : "Online",
        meetingLink: meetingLink || "",
        location: address || "",
        scheduledAt: new Date(),
      };
      await targetApp.save();
    }

    // Fetch full context for communications
    const fullApp = targetApp
      ? await Application.findById(targetApp._id).populate("jobId").populate("candidateId")
      : null;
    const candUser = await User.findById(finalCandidateId);

    const candEmail = fullApp?.candidateEmail || fullApp?.candidateId?.email || candUser?.email || "";
    const candName = fullApp?.candidateName || fullApp?.candidateId?.name || candUser?.name || "Candidate";
    const jobTitle = fullApp?.jobId?.title || "Job Position";
    let companyName = fullApp?.jobId?.company || newInterview.company || "Our Company";

    let hrName = fullApp?.jobId?.hrName || newInterview.hrName || "";
    let hrEmail = fullApp?.jobId?.hrEmail || newInterview.hrEmail || "";

    const targetHrId = newInterview.hrId || fullApp?.hrId;
    if ((!hrName || !hrEmail || !companyName || companyName === "Our Company") && targetHrId) {
      try {
        const hrUser = await HR.findById(targetHrId);
        if (hrUser) {
          if (!hrName) hrName = hrUser.name || "";
          if (!hrEmail) hrEmail = hrUser.email || "";
          if (!companyName || companyName === "Our Company") companyName = hrUser.company || companyName;
        }
      } catch (err) {
        console.error("HR lookup error:", err.message);
      }
    }

    const meetingOrLocation = meetingLink || address || "N/A";

    // 1. Create In-App Message for Candidate (Section 6)
    const scheduleMessageBody = `Hi **${candName}**,\n\nYour interview has been scheduled for the **${jobTitle}** position at **${companyName}**.\n\n**Interview Details**\nDate: **${date}**\nTime: **${time}**\nMeeting: **${meetingOrLocation}**\n\nPlease make sure you are available at the scheduled time.`;

    await createInAppMessage({
      senderId: targetHrId,
      receiverId: finalCandidateId,
      senderName: "RecruitSmart",
      senderEmail: process.env.EMAIL_USER,
      receiverEmail: candEmail,
      type: "INTERVIEW_SCHEDULED",
      subject: `Interview Scheduled – ${jobTitle}`,
      message: scheduleMessageBody,
      relatedApplicationId: targetApp?._id || applicationId,
      relatedInterviewId: newInterview._id,
    });

    // 2. Create Candidate Notification (Section 6 & 9)
    await createInAppNotification({
      userId: finalCandidateId,
      type: "INTERVIEW_SCHEDULED",
      title: "Interview Scheduled",
      message: `Your interview for the ${jobTitle} position at ${companyName} has been scheduled.`,
      link: "/candidate/interviews",
      relatedApplicationId: targetApp?._id || applicationId,
      relatedInterviewId: newInterview._id,
    });

    // 3. Send RecruitSmart Email (Section 6)
    await sendInterviewScheduledEmail({
      to: candEmail,
      candidateName: candName,
      jobTitle,
      companyName,
      interviewDate: date,
      interviewTime: time,
      meetingLink: meetingLink || "",
      location: address || "",
      type: typeNormalized,
      hrName,
      hrEmail,
    }).catch((err) => console.error("Email notification failed:", err.message));

    console.log("[POST /api/interviews SUCCESS] Created ID:", newInterview._id);
    return res.status(201).json({
      success: true,
      message: "Interview scheduled successfully.",
      interview: newInterview,
    });
  } catch (error) {
    console.error("[POST /api/interviews ERROR]:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to schedule interview. Please check the backend.",
      error: error.message,
    });
  }
});

// ==========================================
// 4. RESCHEDULE INTERVIEW
// PUT /api/interviews/:interviewId
// ==========================================
router.put("/:interviewId", async (req, res) => {
  try {
    console.log(`[PUT /api/interviews/${req.params.interviewId}] Payload:`, req.body);
    const { date, time, type, meetingLink, address } = req.body;
    const { interviewId } = req.params;

    if (!date || !time) {
      return res.status(400).json({
        success: false,
        message: "Interview date and time are required.",
      });
    }

    // Past date check
    const selectedDate = new Date(date);
    selectedDate.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (selectedDate < today) {
      return res.status(400).json({
        success: false,
        message: "Please select a valid future date.",
      });
    }

    const typeNormalized = type === "in_person" || type === "In Person" ? "in_person" : "online";

    if (typeNormalized === "online" && (!meetingLink || meetingLink.trim() === "")) {
      return res.status(400).json({
        success: false,
        message: "Meeting link is required for online interviews.",
      });
    }

    if (typeNormalized === "in_person" && (!address || address.trim() === "")) {
      return res.status(400).json({
        success: false,
        message: "Address is required for in-person interviews.",
      });
    }

    // Exclude existing interview and its parent application from conflict check
    let existingInterview = await Interview.findById(interviewId);
    let excludeInterviewId = existingInterview ? existingInterview._id : interviewId;
    let excludeAppId = existingInterview ? existingInterview.applicationId : interviewId;

    if (!existingInterview) {
      const existingApp = await Application.findById(interviewId);
      if (existingApp) {
        excludeAppId = existingApp._id;
        const linkedInv = await Interview.findOne({ applicationId: existingApp._id });
        if (linkedInv) excludeInterviewId = linkedInv._id;
      }
    }

    // Conflict Check Excluding Current Interview & Application Record
    const interviewConflict = await Interview.findOne({
      _id: { $ne: excludeInterviewId },
      date,
      time,
      status: { $ne: "cancelled" },
    });

    const appConflict = await Application.findOne({
      _id: { $ne: excludeAppId },
      status: { $in: ["Interview Scheduled", "Interview Rescheduled"] },
      "interviewDetails.interviewDate": date,
      "interviewDetails.interviewTime": time,
    });

    if (interviewConflict || appConflict) {
      return res.status(409).json({
        success: false,
        message: "Interview already scheduled for this date and time. Please select another time.",
      });
    }

    // Update Interview Document
    let updatedInterview = await Interview.findByIdAndUpdate(
      interviewId,
      {
        date,
        time,
        type: typeNormalized,
        meetingLink: meetingLink || "",
        address: address || "",
        status: "rescheduled",
      },
      { new: true }
    );

    // If interview ID is actually an Application ID
    if (!updatedInterview) {
      const appDoc = await Application.findById(interviewId);
      if (appDoc) {
        appDoc.status = "Interview Rescheduled";
        appDoc.interviewDetails = {
          interviewDate: date,
          interviewTime: time,
          interviewType: typeNormalized === "in_person" ? "In Person" : "Online",
          meetingLink: meetingLink || "",
          location: address || "",
          scheduledAt: new Date(),
        };
        await appDoc.save();

        return res.json({
          success: true,
          message: "Interview rescheduled successfully.",
          application: appDoc,
        });
      }

      return res.status(404).json({
        success: false,
        message: "Interview record not found.",
      });
    }

    // Update parent Application if present
    if (updatedInterview.applicationId) {
      await Application.findByIdAndUpdate(updatedInterview.applicationId, {
        status: "Interview Rescheduled",
        interviewDetails: {
          interviewDate: date,
          interviewTime: time,
          interviewType: typeNormalized === "in_person" ? "In Person" : "Online",
          meetingLink: meetingLink || "",
          location: address || "",
          scheduledAt: new Date(),
        },
      });
    }

    // Send Notification to Candidate on Reschedule
    if (updatedInterview.candidateId) {
      await createNotificationHelper({
        userId: updatedInterview.candidateId,
        type: "INTERVIEW_RESCHEDULED",
        title: "Interview Rescheduled",
        message: `Your interview has been rescheduled to ${date} at ${time}.`,
        link: "/candidate/interviews",
      });

      try {
        const fullApp = updatedInterview.applicationId
          ? await Application.findById(updatedInterview.applicationId).populate("jobId").populate("candidateId")
          : null;
        const candUser = await User.findById(updatedInterview.candidateId);

        const candEmail = fullApp?.candidateEmail || fullApp?.candidateId?.email || candUser?.email;
        const candName = fullApp?.candidateName || fullApp?.candidateId?.name || candUser?.name || "Candidate";
        const jobTitle = fullApp?.jobId?.title || "Job Position";
        let companyName = fullApp?.jobId?.company || updatedInterview.company || "Our Company";

        let hrName = fullApp?.jobId?.hrName || updatedInterview.hrName || "";
        let hrEmail = fullApp?.jobId?.hrEmail || updatedInterview.hrEmail || "";

        const targetHrId = updatedInterview.hrId || fullApp?.hrId;
        if ((!hrName || !hrEmail || !companyName || companyName === "Our Company") && targetHrId) {
          try {
            const hrUser = await HR.findById(targetHrId);
            if (hrUser) {
              if (!hrName) hrName = hrUser.name || "";
              if (!hrEmail) hrEmail = hrUser.email || "";
              if (!companyName || companyName === "Our Company") companyName = hrUser.company || companyName;
            }
          } catch (err) {}
        }

        await sendInterviewRescheduledEmail({
          to: candEmail,
          candidateName: candName,
          jobTitle,
          companyName,
          previousDate: existingInterview?.date || "",
          previousTime: existingInterview?.time || "",
          newDate: date,
          newTime: time,
          meetingLink: meetingLink || updatedInterview.meetingLink || "",
          location: address || updatedInterview.address || "",
          type: typeNormalized,
          hrName,
          hrEmail,
        }).catch((err) => console.error("Email notification failed:", err.message));
      } catch (emailErr) {
        console.error("Email preparation error:", emailErr.message);
      }
    }

    console.log("[PUT /api/interviews SUCCESS] Rescheduled ID:", interviewId);
    return res.json({
      success: true,
      message: "Interview rescheduled successfully.",
      interview: updatedInterview,
    });
  } catch (error) {
    console.error("[PUT /api/interviews ERROR]:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to reschedule interview. Please check the backend.",
      error: error.message,
    });
  }
});

// ==========================================
// 6. CANDIDATE ACCEPTS INTERVIEW
// PUT /api/interviews/:interviewId/accept
// ==========================================
router.put("/:interviewId/accept", async (req, res) => {
  try {
    const { interviewId } = req.params;
    console.log(`[PUT /api/interviews/${interviewId}/accept] Candidate accepted interview`);

    let interview = await Interview.findById(interviewId);
    let appDoc = null;

    if (!interview) {
      // If ID is Application ID
      appDoc = await Application.findById(interviewId).populate("jobId").populate("candidateId");
      if (appDoc) {
        interview = await Interview.findOne({ applicationId: appDoc._id });
      }
    } else {
      appDoc = await Application.findById(interview.applicationId).populate("jobId").populate("candidateId");
    }

    if (interview) {
      interview.status = "accepted";
      await interview.save();
    }

    if (appDoc) {
      appDoc.status = "Interview Confirmed";
      await appDoc.save();
    }

    // Send Notification to HR
    const hrId = interview?.hrId || appDoc?.hrId || appDoc?.jobId?.hrId;
    const candidateName = appDoc?.candidateName || appDoc?.candidateId?.name || "Candidate";
    const jobTitle = appDoc?.jobId?.title || "Job Position";

    if (hrId) {
      await createNotificationHelper({
        userId: hrId,
        type: "INTERVIEW_ACCEPTED",
        title: "Interview Accepted",
        message: `Candidate ${candidateName} has accepted the interview for ${jobTitle}.`,
        link: "/hr/accepted-candidates",
      });
    }

    return res.json({
      success: true,
      message: "Interview accepted successfully.",
      status: "accepted",
    });
  } catch (error) {
    console.error("ACCEPT INTERVIEW ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to accept interview.",
      error: error.message,
    });
  }
});

// ==========================================
// 7. CANDIDATE REQUESTS INTERVIEW RESCHEDULE
// POST /api/interviews/:interviewId/reschedule
// POST /api/interviews/:interviewId/reschedule-request
// ==========================================
async function handleCandidateRescheduleRequest(req, res) {
  try {
    const interviewId = req.params.interviewId || req.body.interviewId || req.body.applicationId || req.body._id;
    const { requestedDate, requestedTime, reason } = req.body;

    console.log("[RESCHEDULE] Request received");
    console.log("[RESCHEDULE] Resolved Interview ID:", interviewId);
    console.log("[RESCHEDULE] Requested date:", requestedDate);
    console.log("[RESCHEDULE] Requested time:", requestedTime);

    if (!requestedDate || !requestedTime || !reason || !reason.trim()) {
      return res.status(400).json({
        success: false,
        message: "New preferred date, preferred time, and reason are required.",
      });
    }

    // Future date validation
    const selDate = new Date(requestedDate);
    selDate.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (selDate < today) {
      return res.status(400).json({
        success: false,
        message: "Please select a valid future date for rescheduling.",
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

    const candidateIdStr = (appDoc?.candidateId?._id || appDoc?.candidateId || interview?.candidateId)?.toString();
    console.log("[RESCHEDULE] Candidate ID:", candidateIdStr);

    // Trace & Resolve HR ID: Interview -> Application -> Job -> HR Model -> User Model -> Fallback HR
    let rawHrId = interview?.hrId || appDoc?.hrId || appDoc?.jobId?.hrId || req.body.hrId;
    if (typeof rawHrId === "object" && rawHrId?._id) {
      rawHrId = rawHrId._id;
    }

    let targetJob = null;
    if (appDoc?.jobId) {
      const targetJobId = appDoc.jobId._id || appDoc.jobId;
      targetJob = await Job.findById(targetJobId);
      if (!rawHrId && targetJob?.hrId) {
        rawHrId = targetJob.hrId;
      }
    }

    let hrIdStr = null;
    let hrNameStr = "Hiring Team";

    if (rawHrId) {
      const hrRecord = (await HR.findById(rawHrId)) || (await User.findById(rawHrId));
      if (hrRecord) {
        hrIdStr = hrRecord._id.toString();
        hrNameStr = hrRecord.name || hrNameStr;
      }
    }

    if (!hrIdStr && (targetJob?.hrEmail || appDoc?.jobId?.hrEmail)) {
      const emailToLook = targetJob?.hrEmail || appDoc?.jobId?.hrEmail;
      const hrByEmail = (await HR.findOne({ email: emailToLook })) || (await User.findOne({ email: emailToLook, role: "hr" }));
      if (hrByEmail) {
        hrIdStr = hrByEmail._id.toString();
        hrNameStr = hrByEmail.name || hrNameStr;
      }
    }

    if (!hrIdStr) {
      try {
        const fallbackHr = (await HR.findOne({})) || (await User.findOne({ role: "hr" }));
        if (fallbackHr) {
          hrIdStr = fallbackHr._id.toString();
          hrNameStr = fallbackHr.name || hrNameStr;
          console.log("[RESCHEDULE] Resolved HR ID via DB Fallback:", hrIdStr);
        }
      } catch (fbErr) {
        console.warn("[RESCHEDULE] Fallback HR lookup warning:", fbErr.message);
      }
    }

    console.log("[RESCHEDULE] Resolved HR ID:", hrIdStr);

    if (!hrIdStr) {
      console.error("[RESCHEDULE ERROR] Unable to resolve HR ID for interviewId:", interviewId);
      return res.status(400).json({
        success: false,
        message: "Unable to locate the HR user responsible for this job.",
      });
    }

    // Create Interview document if missing from Application
    if (!interview && appDoc) {
      interview = new Interview({
        candidateId: candidateIdStr,
        applicationId: appDoc._id,
        hrId: hrIdStr,
        date: appDoc.interviewDetails?.interviewDate || requestedDate,
        time: appDoc.interviewDetails?.interviewTime || requestedTime,
        type: appDoc.interviewDetails?.interviewType === "In Person" ? "in_person" : "online",
        meetingLink: appDoc.interviewDetails?.meetingLink || "",
        address: appDoc.interviewDetails?.location || "",
        status: "reschedule_requested",
      });
    }

    // 1. SAVE RESCHEDULE REQUEST IN MONGODB (Do NOT create new interview)
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
      appDoc.hrId = hrIdStr;
      appDoc.status = "Interview Reschedule Requested";
      await appDoc.save();
    }

    const candidateName = appDoc?.candidateName || appDoc?.candidateId?.name || "Candidate";
    const candidateEmail = appDoc?.candidateId?.email || appDoc?.candidateEmail || "";
    const jobTitle = appDoc?.jobId?.title || "Job Position";
    const currentDateStr = interview?.date || appDoc?.interviewDetails?.interviewDate || "Scheduled Date";
    const currentTimeStr = interview?.time || appDoc?.interviewDetails?.interviewTime || "Scheduled Time";

    // Save into RescheduleRequest collection
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
          currentDate: currentDateStr,
          currentTime: currentTimeStr,
          requestedDate,
          requestedTime,
          reason: reason.trim(),
          status: "pending",
        },
        { upsert: true, new: true }
      );
      console.log("[RESCHEDULE] Request saved successfully");
      console.log("[RESCHEDULE] HR ID:", hrIdStr);
      console.log("[RESCHEDULE] HR message created successfully");
    } catch (reqErr) {
      console.error("[RESCHEDULE ERROR] RescheduleRequest document save error:", reqErr.message);
    }

    // 2. CREATE HR MESSAGE & NOTIFICATION (Section 8)
    if (hrIdStr) {
      try {
        const hrMessageBody = `Hi **${hrNameStr}**,\n\n**${candidateName}** has requested to reschedule their interview for the **${jobTitle}** position.\n\n**Current Interview**\nDate: **${currentDateStr}**\nTime: **${currentTimeStr}**\n\n**Requested Interview**\nDate: **${requestedDate}**\nTime: **${requestedTime}**\n\n**Reason:**\n${reason.trim()}\n\n**Status:** Pending\n\nPlease review the request and choose **Approve** or **Reject**.`;

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

        await createInAppNotification({
          userId: hrIdStr,
          type: "INTERVIEW_RESCHEDULE_REQUEST",
          title: "New Interview Reschedule Request",
          message: `${candidateName} has requested to reschedule the ${jobTitle} interview.`,
          link: "/hr-dashboard",
          relatedApplicationId: appDoc?._id,
          relatedInterviewId: interview?._id,
        });
      } catch (hrCommErr) {
        console.error("[RESCHEDULE ERROR] HR message/notification creation error:", hrCommErr.message);
      }
    }

    // 3. CREATE CANDIDATE NOTIFICATION
    if (candidateIdStr) {
      try {
        await createInAppNotification({
          userId: candidateIdStr,
          type: "RESCHEDULE_SENT",
          title: "Reschedule Request Sent",
          message: "Your interview reschedule request has been sent to HR.",
          link: "/candidate/interviews",
          relatedApplicationId: appDoc?._id,
          relatedInterviewId: interview?._id,
        });
      } catch (candNotifErr) {
        console.warn("Candidate notification creation warning:", candNotifErr.message);
      }
    }

    return res.status(200).json({
      success: true,
      message: "Reschedule request sent successfully",
      interviewId: interview?._id,
      status: "reschedule_requested",
      rescheduleRequest: { requestedDate, requestedTime, reason: reason.trim(), status: "pending" },
    });
  } catch (error) {
    console.error("RESCHEDULE REQUEST ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to submit reschedule request: " + error.message,
      error: error.message,
    });
  }
};

// ==========================================
// 8. HR CANCELS INTERVIEW
// DELETE /api/interviews/:interviewId
// ==========================================
router.delete("/:interviewId", async (req, res) => {
  try {
    const { interviewId } = req.params;
    console.log(`[DELETE /api/interviews] Request to delete interview: ${interviewId}`);

    const interview = await Interview.findById(interviewId);
    if (!interview) {
      return res.status(404).json({ success: false, message: "Interview not found" });
    }

    // Attempt to update related application status, but do not block deletion
    try {
      const appDoc = await Application.findById(interview.applicationId);
      if (appDoc) {
        appDoc.status = "Interview Cancelled";
        appDoc.interviewDetails = null;
        await appDoc.save();
      }
    } catch (e) {
      console.warn("Failed to update application on interview delete:", e);
    }

    await Interview.findByIdAndDelete(interviewId);

    res.json({ success: true, message: "Interview cancelled and deleted successfully" });
  } catch (error) {
    console.error("[DELETE /api/interviews] Error:", error);
    res.status(500).json({ success: false, message: "Failed to delete interview", error: error.message });
  }
});

router.post("/reschedule", handleCandidateRescheduleRequest);
router.post("/reschedule-request", handleCandidateRescheduleRequest);
router.post("/:interviewId/reschedule-request", handleCandidateRescheduleRequest);
router.post("/:interviewId/reschedule", handleCandidateRescheduleRequest);

// ==========================================
// 8. GET ALL RESCHEDULE REQUESTS FOR HR
// GET /api/interviews/reschedule-requests?hrId=...
// ==========================================
router.get("/reschedule-requests", async (req, res) => {
  try {
    const { hrId } = req.query;
    const filter = {};
    if (hrId) filter.hrId = hrId;

    const requests = await RescheduleRequest.find(filter)
      .populate("candidateId")
      .populate("jobId")
      .populate("interviewId")
      .sort({ createdAt: -1 })
      .lean();

    return res.json(requests);
  } catch (error) {
    console.error("GET /api/interviews/reschedule-requests Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch reschedule requests",
      error: error.message,
    });
  }
});

// ==========================================
// 9. HR APPROVES RESCHEDULE REQUEST (OPTION A)
// PUT /api/interviews/:interviewId/approve-reschedule
// ==========================================
const handleApproveReschedule = async (req, res) => {
  try {
    const interviewId = req.params.interviewId || req.params.id;
    console.log(`[HR RESCHEDULE] HR approving reschedule for ID: ${interviewId}`);

    let interview = await Interview.findById(interviewId);
    let appDoc = null;

    if (!interview) {
      appDoc = await Application.findById(interviewId).populate("jobId").populate("candidateId");
      if (appDoc) {
        interview = await Interview.findOne({ applicationId: appDoc._id });
      }
    } else {
      appDoc = await Application.findById(interview.applicationId).populate("jobId").populate("candidateId");
    }

    if (!interview && !appDoc) {
      return res.status(404).json({
        success: false,
        message: "Interview record not found.",
      });
    }

    const newDate = req.body.requestedDate || interview?.rescheduleRequest?.requestedDate;
    const newTime = req.body.requestedTime || interview?.rescheduleRequest?.requestedTime;

    if (!newDate || !newTime) {
      return res.status(400).json({
        success: false,
        message: "Requested date and time not found in request.",
      });
    }

    // Conflict Check for target date and time excluding current record
    const excludeInterviewId = interview ? interview._id : interviewId;
    const excludeAppId = appDoc ? appDoc._id : interviewId;

    const interviewConflict = await Interview.findOne({
      _id: { $ne: excludeInterviewId },
      date: newDate,
      time: newTime,
      status: { $ne: "cancelled" },
      $or: [
        { candidateId: interview?.candidateId || appDoc?.candidateId },
        { hrId: interview?.hrId || appDoc?.hrId }
      ]
    });

    const appConflict = await Application.findOne({
      _id: { $ne: excludeAppId },
      status: { $in: ["Interview Scheduled", "Interview Rescheduled", "Interview Confirmed"] },
      "interviewDetails.interviewDate": newDate,
      "interviewDetails.interviewTime": newTime,
      $or: [
        { candidateId: interview?.candidateId || appDoc?.candidateId },
        { hrId: interview?.hrId || appDoc?.hrId }
      ]
    });

    if (interviewConflict || appConflict) {
      return res.status(409).json({
        success: false,
        message: "You already have an interview scheduled at this time. Please select another time.",
      });
    }

    // Update Interview Document (Keep same interviewId and calendarEventId)
    if (interview) {
      interview.date = newDate;
      interview.time = newTime;
      if (!interview.calendarEventId) {
        interview.calendarEventId = `cal_${interview._id}`;
      }
      interview.remindersSent = { oneHour: false, tenMin: false };
      interview.status = "rescheduled";
      if (interview.rescheduleRequest) {
        interview.rescheduleRequest.status = "approved";
      }
      await interview.save();
    }

    // Update Parent Application Document
    if (appDoc) {
      appDoc.status = "Interview Rescheduled";
      appDoc.interviewDetails = {
        ...appDoc.interviewDetails,
        interviewDate: newDate,
        interviewTime: newTime,
        scheduledAt: new Date(),
      };
      await appDoc.save();
    }

    // Sync RescheduleRequest document
    try {
      await RescheduleRequest.findOneAndUpdate(
        { interviewId: excludeInterviewId },
        { status: "approved", approvedDate: newDate, approvedTime: newTime }
      );
    } catch (e) {
      console.warn("RescheduleRequest status update warning:", e.message);
    }

    // Communications for candidate & HR
    const candidateId = interview?.candidateId || appDoc?.candidateId?._id || appDoc?.candidateId;
    const hrId = interview?.hrId || appDoc?.hrId || appDoc?.jobId?.hrId;

    try {
      const candUser = candidateId ? await User.findById(candidateId) : null;
      const candEmail = appDoc?.candidateEmail || appDoc?.candidateId?.email || candUser?.email || "";
      const candName = appDoc?.candidateName || appDoc?.candidateId?.name || candUser?.name || "Candidate";
      const jobTitle = appDoc?.jobId?.title || "Job Position";
      let companyName = appDoc?.jobId?.company || interview?.company || "Our Company";

      let hrName = appDoc?.jobId?.hrName || interview?.hrName || "";
      let hrEmail = appDoc?.jobId?.hrEmail || interview?.hrEmail || "";

      if ((!hrName || !hrEmail || !companyName || companyName === "Our Company") && hrId) {
        try {
          const hrUser = await HR.findById(hrId);
          if (hrUser) {
            if (!hrName) hrName = hrUser.name || "";
            if (!hrEmail) hrEmail = hrUser.email || "";
            if (!companyName || companyName === "Our Company") companyName = hrUser.company || companyName;
          }
        } catch (err) {}
      }

      const meetingOrLoc = interview?.meetingLink || appDoc?.interviewDetails?.meetingLink || interview?.address || appDoc?.interviewDetails?.location || "N/A";

      if (candidateId) {
        // 1. Create In-App Message for Candidate (Section 7)
        const rescheduledMsgBody = `Hi **${candName}**,\n\nYour interview for the **${jobTitle}** position at **${companyName}** has been rescheduled successfully.\n\n**Updated Interview Details**\nDate: **${newDate}**\nTime: **${newTime}**\nMeeting: **${meetingOrLoc}**\n\nPlease note the updated date and time.`;

        await createInAppMessage({
          senderId: hrId,
          receiverId: candidateId,
          senderName: "RecruitSmart",
          senderEmail: process.env.EMAIL_USER,
          receiverEmail: candEmail,
          type: "INTERVIEW_RESCHEDULED",
          subject: `Interview Rescheduled – ${jobTitle}`,
          message: rescheduledMsgBody,
          relatedApplicationId: appDoc?._id,
          relatedInterviewId: interview?._id,
        });

        // 2. Create Candidate Notification (Section 7 & 9)
        await createInAppNotification({
          userId: candidateId,
          type: "INTERVIEW_RESCHEDULED",
          title: "Interview Rescheduled",
          message: `Your interview for the ${jobTitle} position at ${companyName} has been rescheduled.`,
          link: "/candidate/interviews",
          relatedApplicationId: appDoc?._id,
          relatedInterviewId: interview?._id,
        });

        // 3. Send RecruitSmart Email (Section 7)
        await sendInterviewRescheduledEmail({
          to: candEmail,
          candidateName: candName,
          jobTitle,
          companyName,
          previousDate: interview?.date || appDoc?.interviewDetails?.interviewDate || "",
          previousTime: interview?.time || appDoc?.interviewDetails?.interviewTime || "",
          newDate: newDate,
          newTime: newTime,
          meetingLink: interview?.meetingLink || appDoc?.interviewDetails?.meetingLink || "",
          location: interview?.address || appDoc?.interviewDetails?.location || "",
          hrName,
          hrEmail,
        }).catch((err) => console.error("Email notification failed:", err.message));
      }

      if (hrId) {
        await createInAppNotification({
          userId: hrId,
          type: "RESCHEDULE_APPROVED_HR",
          title: "Interview Rescheduled",
          message: `Rescheduled interview for ${candName} to ${newDate} at ${newTime}.`,
          link: "/hr-dashboard",
          relatedApplicationId: appDoc?._id,
          relatedInterviewId: interview?._id,
        });
      }
    } catch (commErr) {
      console.error("Communication processing error in approve-reschedule:", commErr.message);
    }

    return res.json({
      success: true,
      message: "Interview reschedule approved successfully.",
      date: newDate,
      time: newTime,
      status: "rescheduled",
    });
  } catch (error) {
    console.error("APPROVE RESCHEDULE ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to approve reschedule request.",
      error: error.message,
    });
  }
};

// ==========================================
// 10. HR CHANGES DATE & TIME (OPTION B)
// PUT /api/interviews/:interviewId/change-schedule
// ==========================================
const handleChangeSchedule = async (req, res) => {
  try {
    const interviewId = req.params.interviewId || req.params.id;
    const { newDate, newTime, duration, notes, rejectionReason } = req.body;
    console.log(`[HR RESCHEDULE] HR changing schedule for ID: ${interviewId} to ${newDate} ${newTime}`);

    if (!newDate || !newTime) {
      return res.status(400).json({
        success: false,
        message: "New date and time are required.",
      });
    }

    // Future date validation
    const selDate = new Date(newDate);
    selDate.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (selDate < today) {
      return res.status(400).json({
        success: false,
        message: "Please select a valid future date.",
      });
    }

    let interview = await Interview.findById(interviewId);
    let appDoc = null;

    if (!interview) {
      appDoc = await Application.findById(interviewId).populate("jobId").populate("candidateId");
      if (appDoc) {
        interview = await Interview.findOne({ applicationId: appDoc._id });
      }
    } else {
      appDoc = await Application.findById(interview.applicationId).populate("jobId").populate("candidateId");
    }

    if (!interview && !appDoc) {
      return res.status(404).json({
        success: false,
        message: "Interview record not found.",
      });
    }

    // Conflict Check
    const excludeInterviewId = interview ? interview._id : interviewId;
    const excludeAppId = appDoc ? appDoc._id : interviewId;

    const interviewConflict = await Interview.findOne({
      _id: { $ne: excludeInterviewId },
      date: newDate,
      time: newTime,
      status: { $ne: "cancelled" },
      $or: [
        { candidateId: interview?.candidateId || appDoc?.candidateId },
        { hrId: interview?.hrId || appDoc?.hrId }
      ]
    });

    const appConflict = await Application.findOne({
      _id: { $ne: excludeAppId },
      status: { $in: ["Interview Scheduled", "Interview Rescheduled", "Interview Confirmed"] },
      "interviewDetails.interviewDate": newDate,
      "interviewDetails.interviewTime": newTime,
      $or: [
        { candidateId: interview?.candidateId || appDoc?.candidateId },
        { hrId: interview?.hrId || appDoc?.hrId }
      ]
    });

    if (interviewConflict || appConflict) {
      return res.status(409).json({
        success: false,
        message: "You already have an interview scheduled at this time. Please select another time.",
      });
    }

    // Update Interview Document
    if (interview) {
      interview.date = newDate;
      interview.time = newTime;
      if (duration) interview.duration = duration;
      if (notes) interview.notes = notes;
      if (!interview.calendarEventId) {
        interview.calendarEventId = `cal_${interview._id}`;
      }
      interview.remindersSent = { oneHour: false, tenMin: false };
      interview.status = "rescheduled";
      if (interview.rescheduleRequest) {
        interview.rescheduleRequest.status = "approved";
      }
      await interview.save();
    }

    // Update Parent Application
    if (appDoc) {
      appDoc.status = "Interview Rescheduled";
      appDoc.interviewDetails = {
        ...appDoc.interviewDetails,
        interviewDate: newDate,
        interviewTime: newTime,
        scheduledAt: new Date(),
      };
      await appDoc.save();
    }

    // Sync RescheduleRequest document
    try {
      await RescheduleRequest.findOneAndUpdate(
        { interviewId: excludeInterviewId },
        {
          status: "approved",
          approvedDate: newDate,
          approvedTime: newTime,
          duration: duration || "45 min",
          hrNote: notes || "",
        }
      );
    } catch (e) {
      console.warn("RescheduleRequest status update warning:", e.message);
    }

    // Notifications & Messages
    const candidateId = interview?.candidateId || appDoc?.candidateId?._id || appDoc?.candidateId;
    const hrId = interview?.hrId || appDoc?.hrId || appDoc?.jobId?.hrId;
    const candidateName = appDoc?.candidateName || appDoc?.candidateId?.name || "Candidate";

    if (candidateId) {
      try {
        const candUser = await User.findById(candidateId);
        const candEmail = appDoc?.candidateEmail || appDoc?.candidateId?.email || candUser?.email || "";
        const candName = appDoc?.candidateName || appDoc?.candidateId?.name || candUser?.name || "Candidate";
        const jobTitle = appDoc?.jobId?.title || "Job Position";
        let companyName = appDoc?.jobId?.company || interview?.company || "Our Company";

        let hrName = appDoc?.jobId?.hrName || interview?.hrName || "";
        let hrEmail = appDoc?.jobId?.hrEmail || interview?.hrEmail || "";

        const targetHrId = hrId || interview?.hrId || appDoc?.hrId;
        if ((!hrName || !hrEmail || !companyName || companyName === "Our Company") && targetHrId) {
          try {
            const hrUser = await HR.findById(targetHrId);
            if (hrUser) {
              if (!hrName) hrName = hrUser.name || "";
              if (!hrEmail) hrEmail = hrUser.email || "";
              if (!companyName || companyName === "Our Company") companyName = hrUser.company || companyName;
            }
          } catch (err) {}
        }

        const meetingOrLoc = interview?.meetingLink || appDoc?.interviewDetails?.meetingLink || interview?.address || appDoc?.interviewDetails?.location || "N/A";

        // 1. Create In-App Message for Candidate (Section 7)
        const rescheduledMsgBody = `Hi **${candName}**,\n\nYour interview for the **${jobTitle}** position at **${companyName}** has been rescheduled successfully.\n\n**Updated Interview Details**\nDate: **${newDate}**\nTime: **${newTime}**\nMeeting: **${meetingOrLoc}**\n\nPlease note the updated date and time.`;

        await createInAppMessage({
          senderId: targetHrId,
          receiverId: candidateId,
          senderName: "RecruitSmart",
          senderEmail: process.env.EMAIL_USER,
          receiverEmail: candEmail,
          type: "INTERVIEW_RESCHEDULED",
          subject: `Interview Rescheduled – ${jobTitle}`,
          message: rescheduledMsgBody,
          relatedApplicationId: appDoc?._id,
          relatedInterviewId: interview?._id,
        });

        // 2. Create Candidate Notification (Section 7 & 9)
        await createInAppNotification({
          userId: candidateId,
          type: "INTERVIEW_RESCHEDULED",
          title: "Interview Rescheduled",
          message: `Your interview for the ${jobTitle} position at ${companyName} has been rescheduled.`,
          link: "/candidate/interviews",
          relatedApplicationId: appDoc?._id,
          relatedInterviewId: interview?._id,
        });

        // 3. Send RecruitSmart Email (Section 7)
        await sendInterviewRescheduledEmail({
          to: candEmail,
          candidateName: candName,
          jobTitle,
          companyName,
          previousDate: interview?.date || appDoc?.interviewDetails?.interviewDate || "",
          previousTime: interview?.time || appDoc?.interviewDetails?.interviewTime || "",
          newDate: newDate,
          newTime: newTime,
          meetingLink: interview?.meetingLink || appDoc?.interviewDetails?.meetingLink || "",
          location: interview?.address || appDoc?.interviewDetails?.location || "",
          hrName,
          hrEmail,
        }).catch((err) => console.error("Email notification failed:", err.message));
      } catch (emailErr) {
        console.error("Email preparation error:", emailErr.message);
      }
    }

    if (hrId) {
      await createNotificationHelper({
        userId: hrId,
        type: "RESCHEDULE_UPDATED_HR",
        title: "Interview Schedule Updated",
        message: `Updated interview schedule for ${candidateName} to ${newDate} at ${newTime}.`,
        link: "/hr-dashboard",
      });
    }

    return res.json({
      success: true,
      message: `Interview schedule updated to ${newDate} at ${newTime}.`,
      date: newDate,
      time: newTime,
      status: "rescheduled",
      interview,
    });
  } catch (error) {
    console.error("CHANGE SCHEDULE ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update interview schedule.",
      error: error.message,
    });
  }
};

// ==========================================
// 11. HR REJECTS RESCHEDULE REQUEST (OPTION C)
// PUT /api/interviews/:interviewId/reject-reschedule
// ==========================================
const handleRejectReschedule = async (req, res) => {
  try {
    const interviewId = req.params.interviewId || req.params.id;
    const { rejectionReason, reason } = req.body;
    const finalReason = rejectionReason || reason || "";
    console.log(`[HR RESCHEDULE] HR rejecting reschedule for ID: ${interviewId}`);

    let interview = await Interview.findById(interviewId);
    let appDoc = null;

    if (!interview) {
      appDoc = await Application.findById(interviewId).populate("jobId").populate("candidateId");
      if (appDoc) {
        interview = await Interview.findOne({ applicationId: appDoc._id });
      }
    } else {
      appDoc = await Application.findById(interview.applicationId).populate("jobId").populate("candidateId");
    }

    if (interview) {
      interview.status = "scheduled";
      if (interview.rescheduleRequest) {
        interview.rescheduleRequest.status = "rejected";
      }
      await interview.save();
    }

    if (appDoc) {
      appDoc.status = "Interview Scheduled";
      await appDoc.save();
    }

    const targetId = interview ? interview._id : interviewId;
    try {
      await RescheduleRequest.findOneAndUpdate(
        { interviewId: targetId },
        { status: "rejected", rejectionReason: finalReason }
      );
    } catch (e) {
      console.warn("RescheduleRequest status update warning:", e.message);
    }

    // Send Notification to Candidate and HR
    const candidateId = interview?.candidateId || appDoc?.candidateId?._id || appDoc?.candidateId;
    const hrId = interview?.hrId || appDoc?.hrId || appDoc?.jobId?.hrId;
    const candidateName = appDoc?.candidateName || appDoc?.candidateId?.name || "Candidate";

    if (candidateId) {
      const jobTitle = appDoc?.jobId?.title || "Job Position";
      const companyName = appDoc?.jobId?.company || interview?.company || "Our Company";
      
      const rejectedMsgBody = `Hi **${candidateName}**,\n\nYour request to reschedule the interview for the **${jobTitle}** position at **${companyName}** was not approved.\n\nYour original interview remains scheduled:\n\n**Date:** ${interview?.date || appDoc?.interviewDetails?.interviewDate}\n**Time:** ${interview?.time || appDoc?.interviewDetails?.interviewTime}\n\nPlease attend the interview at the original scheduled time.`;

      await createInAppMessage({
        senderId: hrId,
        receiverId: candidateId,
        senderName: "RecruitSmart",
        senderEmail: process.env.EMAIL_USER,
        receiverEmail: appDoc?.candidateEmail || appDoc?.candidateId?.email || "",
        type: "RESCHEDULE_REJECTED",
        subject: `Reschedule Request Rejected – ${jobTitle}`,
        message: rejectedMsgBody,
        relatedApplicationId: appDoc?._id,
        relatedInterviewId: interview?._id,
      });

      await createNotificationHelper({
        userId: candidateId,
        type: "RESCHEDULE_REJECTED",
        title: "Reschedule Request Rejected",
        message: "Your interview reschedule request was rejected. Your original interview schedule remains unchanged.",
        link: "/candidate-dashboard",
      });

      // Send email
      try {
        await sendInterviewRescheduleRejectedEmail({
          to: appDoc?.candidateEmail || appDoc?.candidateId?.email || "",
          candidateName: candidateName,
          jobTitle: jobTitle,
          companyName: companyName,
          originalDate: interview?.date || appDoc?.interviewDetails?.interviewDate || "",
          originalTime: interview?.time || appDoc?.interviewDetails?.interviewTime || ""
        }).catch(err => console.error("Email notification failed:", err.message));
      } catch (emailErr) {
        console.error("Email preparation error:", emailErr.message);
      }
    }

    if (hrId) {
      await createNotificationHelper({
        userId: hrId,
        type: "RESCHEDULE_REJECTED_HR",
        title: "Reschedule Request Rejected",
        message: `Rejected reschedule request from ${candidateName}.`,
        link: "/hr-dashboard",
      });
    }

    return res.json({
      success: true,
      message: "Reschedule request rejected. Original interview date/time maintained.",
    });
  } catch (error) {
    console.error("REJECT RESCHEDULE ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to reject reschedule request.",
      error: error.message,
    });
  }
};

router.put("/:interviewId/approve-reschedule", handleApproveReschedule);
router.patch("/:interviewId/approve-reschedule", handleApproveReschedule);
router.patch("/reschedule-requests/:interviewId/approve", handleApproveReschedule);
router.put("/reschedule-requests/:interviewId/approve", handleApproveReschedule);

router.put("/:interviewId/change-schedule", handleChangeSchedule);
router.patch("/:interviewId/change-schedule", handleChangeSchedule);
router.put("/:interviewId/change-date-time", handleChangeSchedule);

router.put("/:interviewId/reject-reschedule", handleRejectReschedule);
router.patch("/:interviewId/reject-reschedule", handleRejectReschedule);
router.patch("/reschedule-requests/:interviewId/reject", handleRejectReschedule);
router.put("/reschedule-requests/:interviewId/reject", handleRejectReschedule);

// DELETE /api/interviews/:interviewId/reschedule-request
// Dismisses/Deletes a reschedule request without rejecting it explicitly
router.delete("/:interviewId/reschedule-request", async (req, res) => {
  try {
    const { interviewId } = req.params;

    // Remove from RescheduleRequest collection
    await RescheduleRequest.findOneAndDelete({ interviewId });

    // Update interview if it has an embedded reschedule request
    const interview = await Interview.findById(interviewId);
    if (interview) {
      if (interview.status === "reschedule_requested") {
        interview.status = "scheduled"; // revert
      }
      interview.rescheduleRequest = undefined;
      await interview.save();
    }

    res.json({ success: true, message: "Reschedule request deleted successfully." });
  } catch (err) {
    console.error("[DELETE /reschedule-request] Error:", err.message);
    res.status(500).json({ success: false, message: "Failed to delete reschedule request" });
  }
});

// ==========================================
// 12. HR MARKS INTERVIEW AS COMPLETED
// PUT /api/interviews/:interviewId/complete
// ==========================================
router.put("/:interviewId/complete", async (req, res) => {
  try {
    const { interviewId } = req.params;
    
    let interview = await Interview.findById(interviewId);
    if (!interview) {
      interview = await Interview.findOne({ applicationId: interviewId });
    }

    let appDoc = null;
    if (interview && interview.applicationId) {
      appDoc = await Application.findById(interview.applicationId).populate("jobId").populate("candidateId");
    } else {
      appDoc = await Application.findById(interviewId).populate("jobId").populate("candidateId");
    }

    if (interview) {
      interview.status = "completed";
      await interview.save();
    }

    if (appDoc) {
      if (appDoc.status !== "Selected" && appDoc.status !== "Job Accepted by Candidate" && appDoc.status !== "Job Rejected by Candidate" && appDoc.status !== "Rejected") {
        appDoc.status = "Interview Completed";
        await appDoc.save();
      }

      const candId = appDoc.candidateId?._id || appDoc.candidateId;
      const jobTitle = appDoc.jobId?.title || "Job Position";

      if (candId) {
        await createInAppNotification({
          userId: candId,
          type: "INTERVIEW_COMPLETED",
          title: "Interview Completed",
          message: `Your interview for ${jobTitle} has been marked as completed. You can now submit your review and rating.`,
          link: "/candidate-interviews",
          relatedApplicationId: appDoc._id,
          relatedInterviewId: interview?._id,
        }).catch((e) => console.warn("Failed sending interview complete notification:", e.message));
      }
    }

    res.json({ success: true, message: "Interview marked as completed successfully.", interview, application: appDoc });
  } catch (err) {
    console.error("[PUT /complete] Error:", err.message);
    res.status(500).json({ success: false, message: "Failed to complete interview" });
  }
});

// ==========================================
// ==========================================
// 12B. HR SUBMITS CANDIDATE INTERVIEW FEEDBACK
// POST /api/interviews/:interviewId/hr-review
// PUT /api/interviews/:interviewId/hr-review
// ==========================================
const handleHRInterviewReview = async (req, res) => {
  try {
    const { interviewId } = req.params;
    const {
      rating,
      technicalPerformance,
      communication,
      overallPerformance,
      strengths,
      areasForImprovement,
      feedback,
      comments,
      decision,
      hrId
    } = req.body;

    console.log(`[HR FEEDBACK] HIT for ${interviewId}: Rating=${rating}, Decision=${decision}`);

    let interview = await Interview.findById(interviewId);
    if (!interview) {
      interview = await Interview.findOne({ applicationId: interviewId });
    }

    let application = null;
    if (interview && interview.applicationId) {
      application = await Application.findById(interview.applicationId).populate("jobId").populate("candidateId");
    } else {
      application = await Application.findById(interviewId).populate("jobId").populate("candidateId");
    }

    const finalFeedbackText = feedback || comments || "";
    const chosenDecision = decision || (interview?.hrReview?.decision || "Pending");

    const reviewData = {
      rating: Number(rating) || 0,
      technicalPerformance: technicalPerformance || "",
      communication: communication || "",
      overallPerformance: overallPerformance || "",
      strengths: strengths || "",
      areasForImprovement: areasForImprovement || "",
      feedback: finalFeedbackText,
      comments: finalFeedbackText,
      decision: chosenDecision,
      submittedAt: new Date(),
      hrId: hrId || (interview ? interview.hrId : undefined),
    };

    if (interview) {
      interview.hrReview = reviewData;
      interview.status = "completed";
      await interview.save();
    }

    if (application) {
      application.hrInterviewFeedback = {
        ...reviewData,
        hrId: hrId || application.hrId || (interview ? interview.hrId : undefined),
      };

      const candId = application.candidateId?._id || application.candidateId;
      const candidateName = application.candidateName || application.candidateId?.name || "Candidate";
      const candidateEmail = application.candidateEmail || application.candidateId?.email || "";
      const jobTitle = application.jobId?.title || "Job Position";
      const companyName = application.jobId?.company || "Our Company";

      if (chosenDecision === "Selected") {
        application.status = "Selected";
        application.candidateJobDecision = "Pending";
        await application.save();

        if (candId) {
          // In-App Notification
          await createInAppNotification({
            userId: candId,
            type: "CANDIDATE_SELECTED",
            title: "🎉 Congratulations! You have been Selected",
            message: `Congratulations! You have been selected for the position of ${jobTitle} at ${companyName}. Please view your Job Offer on your dashboard to accept or decline.`,
            link: "/candidate-dashboard",
            relatedApplicationId: application._id,
            relatedInterviewId: interview?._id,
          });

          // In-App Message
          await createInAppMessage({
            senderId: hrId || application.hrId,
            receiverId: candId,
            senderName: "RecruitSmart HR Team",
            receiverEmail: candidateEmail,
            type: "JOB_OFFER",
            subject: `Job Offer: ${jobTitle} at ${companyName}`,
            message: `Congratulations ${candidateName}!\n\nWe are pleased to inform you that you have been SELECTED for the position of ${jobTitle} at ${companyName} following your interview.\n\nPlease log in to your dashboard to review and accept your job offer.\n\nBest regards,\nHiring Team`,
            relatedApplicationId: application._id,
            relatedInterviewId: interview?._id,
          });
        }
      } else if (chosenDecision === "Rejected") {
        application.status = "Rejected";
        application.rejectionReason = finalFeedbackText || "Candidate was not selected after the interview round.";
        await application.save();

        if (candId) {
          // In-App Notification
          await createInAppNotification({
            userId: candId,
            type: "APPLICATION_REJECTED",
            title: "Application Status Update",
            message: `Thank you for completing the interview for ${jobTitle} at ${companyName}. Unfortunately, the team has decided not to move forward at this time.`,
            link: "/candidate-applications",
            relatedApplicationId: application._id,
            relatedInterviewId: interview?._id,
          });

          // In-App Message
          await createInAppMessage({
            senderId: hrId || application.hrId,
            receiverId: candId,
            senderName: "RecruitSmart HR Team",
            receiverEmail: candidateEmail,
            type: "APPLICATION_REJECTED",
            subject: `Update on your application for ${jobTitle}`,
            message: `Dear ${candidateName},\n\nThank you for interviewing for the ${jobTitle} position at ${companyName}.\n\nAfter careful consideration, we have decided to move forward with other candidates. We appreciate your time and effort and wish you the best in your job search.\n\nFeedback: ${finalFeedbackText || "Standard evaluation"}\n\nBest regards,\nHiring Team`,
            relatedApplicationId: application._id,
            relatedInterviewId: interview?._id,
          });
        }
      } else {
        if (!application.status.includes("Selected") && !application.status.includes("Rejected")) {
          application.status = "Interview Completed";
        }
        await application.save();

        if (candId) {
          await createInAppNotification({
            userId: candId,
            type: "HR_FEEDBACK_SUBMITTED",
            title: "HR Interview Feedback Submitted",
            message: `HR has submitted interview evaluation feedback for the ${jobTitle} position. Check your dashboard to view the feedback.`,
            link: "/candidate-interviews",
            relatedApplicationId: application._id,
            relatedInterviewId: interview?._id,
          }).catch((e) => console.warn("Failed sending HR feedback notification:", e.message));
        }
      }
    }

    return res.json({
      success: true,
      message: "HR interview feedback saved successfully.",
      interview,
      application,
    });
  } catch (error) {
    console.error("[HR Review Error]:", error);
    return res.status(500).json({ success: false, message: error.message || "Failed to save HR review." });
  }
};

router.post("/:interviewId/hr-review", handleHRInterviewReview);
router.put("/:interviewId/hr-review", handleHRInterviewReview);

// ==========================================
// 12C. HR MAKES FINAL INTERVIEW SELECTION DECISION (SEPARATE ACTION)
// POST /api/interviews/:interviewId/decision
// PUT /api/interviews/:interviewId/decision
// ==========================================
const handleHRInterviewDecision = async (req, res) => {
  try {
    const { interviewId } = req.params;
    const { decision, reason, hrId } = req.body;

    console.log(`[HR DECISION] HIT for ${interviewId}: Decision=${decision}`);

    if (!decision || !["Selected", "Rejected", "Pending"].includes(decision)) {
      return res.status(400).json({ success: false, message: "Valid decision (Selected, Rejected, Pending) is required." });
    }

    let interview = await Interview.findById(interviewId);
    if (!interview) {
      interview = await Interview.findOne({ applicationId: interviewId });
    }

    let application = null;
    if (interview && interview.applicationId) {
      application = await Application.findById(interview.applicationId).populate("jobId").populate("candidateId");
    } else {
      application = await Application.findById(interviewId).populate("jobId").populate("candidateId");
    }

    if (interview) {
      if (!interview.hrReview) interview.hrReview = {};
      interview.hrReview.decision = decision;
      await interview.save();
    }

    if (application) {
      if (!application.hrInterviewFeedback) application.hrInterviewFeedback = {};
      application.hrInterviewFeedback.decision = decision;

      const candId = application.candidateId?._id || application.candidateId;
      const candidateName = application.candidateName || application.candidateId?.name || "Candidate";
      const candidateEmail = application.candidateEmail || application.candidateId?.email || "";
      const jobTitle = application.jobId?.title || "Job Position";
      const companyName = application.jobId?.company || "Our Company";

      if (decision === "Selected") {
        application.status = "Selected";
        application.candidateJobDecision = "Pending";
        await application.save();

        if (candId) {
          await createInAppNotification({
            userId: candId,
            type: "CANDIDATE_SELECTED",
            title: "🎉 Congratulations! You have been Selected",
            message: `Congratulations! You have been selected for the position of ${jobTitle} at ${companyName}. Please view your Job Offer on your dashboard to accept or decline.`,
            link: "/candidate-dashboard",
            relatedApplicationId: application._id,
            relatedInterviewId: interview?._id,
          });

          await createInAppMessage({
            senderId: hrId || application.hrId,
            receiverId: candId,
            senderName: "RecruitSmart HR Team",
            receiverEmail: candidateEmail,
            type: "JOB_OFFER",
            subject: `Job Offer: ${jobTitle} at ${companyName}`,
            message: `Congratulations ${candidateName}!\n\nWe are pleased to inform you that you have been SELECTED for the position of ${jobTitle} at ${companyName} following your interview.\n\nPlease log in to your dashboard to review and accept your job offer.\n\nBest regards,\nHiring Team`,
            relatedApplicationId: application._id,
            relatedInterviewId: interview?._id,
          });
        }
      } else if (decision === "Rejected") {
        application.status = "Rejected";
        application.rejectionReason = reason || application.hrInterviewFeedback?.feedback || "Candidate was not selected after the interview round.";
        await application.save();

        if (candId) {
          await createInAppNotification({
            userId: candId,
            type: "APPLICATION_REJECTED",
            title: "Application Status Update",
            message: `Thank you for completing the interview for ${jobTitle} at ${companyName}. Unfortunately, the team has decided not to move forward at this time.`,
            link: "/candidate-applications",
            relatedApplicationId: application._id,
            relatedInterviewId: interview?._id,
          });

          await createInAppMessage({
            senderId: hrId || application.hrId,
            receiverId: candId,
            senderName: "RecruitSmart HR Team",
            receiverEmail: candidateEmail,
            type: "APPLICATION_REJECTED",
            subject: `Update on your application for ${jobTitle}`,
            message: `Dear ${candidateName},\n\nThank you for interviewing for the ${jobTitle} position at ${companyName}.\n\nAfter careful consideration, we have decided to move forward with other candidates. We appreciate your time and effort and wish you the best in your job search.\n\nBest regards,\nHiring Team`,
            relatedApplicationId: application._id,
            relatedInterviewId: interview?._id,
          });
        }
      } else {
        application.status = "Interview Completed";
        await application.save();
      }
    }

    return res.json({
      success: true,
      message: `Candidate decision updated to ${decision} successfully.`,
      interview,
      application,
    });
  } catch (error) {
    console.error("[HR Decision Error]:", error);
    return res.status(500).json({ success: false, message: error.message || "Failed to update decision." });
  }
};

router.post("/:interviewId/decision", handleHRInterviewDecision);
router.put("/:interviewId/decision", handleHRInterviewDecision);

// ==========================================
// 12D. CANDIDATE SUBMITS INTERVIEW FEEDBACK TO HR
// POST /api/interviews/:interviewId/candidate-review
// PUT /api/interviews/:interviewId/candidate-review
// ==========================================
const handleCandidateInterviewReview = async (req, res) => {
  try {
    const { interviewId } = req.params;
    const { rating, experience, comments, suggestions, candidateId } = req.body;

    console.log(`[CANDIDATE FEEDBACK] HIT for ${interviewId}: Rating=${rating}, Experience=${experience}`);

    let interview = await Interview.findById(interviewId);
    if (!interview) {
      interview = await Interview.findOne({ applicationId: interviewId });
    }

    let application = null;
    if (interview && interview.applicationId) {
      application = await Application.findById(interview.applicationId).populate("jobId").populate("candidateId");
    } else {
      application = await Application.findById(interviewId).populate("jobId").populate("candidateId");
    }

    const reviewData = {
      rating: Number(rating) || 0,
      experience: experience || "Good",
      comments: comments || "",
      suggestions: suggestions || "",
      submittedAt: new Date(),
    };

    if (interview) {
      interview.candidateReview = reviewData;
      await interview.save();
    }

    if (application) {
      application.candidateInterviewReview = reviewData;
      await application.save();

      const candidateName = application.candidateName || application.candidateId?.name || "Candidate";
      const jobTitle = application.jobId?.title || "Job Position";
      const targetHrId = application.hrId || (interview ? interview.hrId : null);

      if (targetHrId) {
        await createInAppNotification({
          userId: targetHrId,
          type: "INTERVIEW_REVIEW_SUBMITTED",
          title: "Candidate Submitted Interview Feedback",
          message: `${candidateName} has submitted interview feedback (${rating}/5 Stars, ${experience || 'Experience'}) for the ${jobTitle} position.`,
          link: "/hr-dashboard",
          relatedApplicationId: application._id,
          relatedInterviewId: interview?._id,
        }).catch((e) => console.warn("Failed sending candidate review notification to HR:", e.message));
      }
    }

    return res.json({
      success: true,
      message: "Candidate interview feedback submitted successfully.",
      interview,
      application,
    });
  } catch (error) {
    console.error("[Candidate Review Error]:", error);
    return res.status(500).json({ success: false, message: error.message || "Failed to submit candidate feedback." });
  }
};

router.post("/:interviewId/candidate-review", handleCandidateInterviewReview);
router.put("/:interviewId/candidate-review", handleCandidateInterviewReview);

// ==========================================
// 13. HR ADDS/UPDATES NOTE ON RESCHEDULE REQUEST
// PUT /api/interviews/reschedule-request/:id/note
// ==========================================
router.put("/reschedule-request/:id/note", async (req, res) => {
  try {
    const { id } = req.params;
    const { hrNote } = req.body;

    const request = await RescheduleRequest.findById(id);
    if (!request) {
      return res.status(404).json({ success: false, message: "Reschedule request not found" });
    }

    request.hrNote = hrNote;
    await request.save();

    return res.json({ success: true, message: "Note updated successfully", hrNote: request.hrNote });
  } catch (error) {
    console.error("PUT /api/interviews/reschedule-request/:id/note error:", error);
    return res.status(500).json({ success: false, message: "Failed to update note" });
  }
});

// ==========================================
// 14. HR ADDS/DELETES NOTE ON INTERVIEW
// ==========================================
router.post("/:id/notes", async (req, res) => {
  try {
    const { id } = req.params;
    const { text, hrId, createdBy } = req.body;

    const interview = await Interview.findById(id);
    if (!interview) {
      return res.status(404).json({ success: false, message: "Interview not found" });
    }

    interview.hrNotes.push({
      text,
      hrId: hrId || null,
      createdBy: createdBy || "HR",
      createdAt: new Date(),
    });
    await interview.save();

    return res.json({ success: true, message: "Note added successfully", hrNotes: interview.hrNotes });
  } catch (error) {
    console.error("POST /api/interviews/:id/notes error:", error);
    return res.status(500).json({ success: false, message: "Failed to add note" });
  }
});

router.delete("/:id/notes/:noteId", async (req, res) => {
  try {
    const { id, noteId } = req.params;

    const interview = await Interview.findById(id);
    if (!interview) {
      return res.status(404).json({ success: false, message: "Interview not found" });
    }

    interview.hrNotes = interview.hrNotes.filter(note => note._id.toString() !== noteId);
    await interview.save();

    return res.json({ success: true, message: "Note deleted successfully", hrNotes: interview.hrNotes });
  } catch (error) {
    console.error("DELETE /api/interviews/:id/notes/:noteId error:", error);
    return res.status(500).json({ success: false, message: "Failed to delete note" });
  }
});

export default router;

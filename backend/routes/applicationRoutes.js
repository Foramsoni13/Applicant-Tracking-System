import express from "express";
import Application from "../models/Application.js";
import Job from "../models/Job.js";
import User from "../models/User.js";
import Resume from "../models/Resume.js";
import HR from "../models/HR.js";
import Interview from "../models/Interview.js";
import upload from "../middleware/upload.js";
import { parseResume } from "../services/resumeParser.js";
import { calculateMatchScore } from "../services/matchingService.js";
import { calculateMatchScorePython } from "../services/pythonMatcher.js";
import { createNotificationHelper } from "./notificationRoutes.js";
import {
  sendAcceptedEmail,
  sendRejectedEmail,
  sendInterviewScheduledEmail,
  sendInterviewRescheduledEmail,
  sendInterviewCancelledEmail,
} from "../services/emailService.js";
import { createInAppMessage, createInAppNotification } from "../services/communicationService.js";

const router = express.Router();


// ==========================================
// APPLY JOB (with Auto TF-IDF Matching)
// ==========================================

router.post(
  "/apply",
  (req, res, next) => {
    upload.single("resume")(req, res, (err) => {
      if (err) {
        let message = "Resume upload failed";

        if (err.code === "LIMIT_FILE_SIZE") {
          message = "Resume file is too large. Maximum size is 5 MB.";
        } else if (err.code === "LIMIT_UNEXPECTED_FILE") {
          message = "Unexpected file field received.";
        } else if (err.message) {
          message = err.message;
        }

        return res.status(400).json({
          success: false,
          message,
        });
      }

      next();
    });
  },
  async (req, res) => {
    try {
      console.log("========== APPLY REQUEST ==========");
      console.log("BODY:", req.body);
      console.log("FILE:", req.file);

      const { jobId, candidateId } = req.body;

      if (!jobId || !candidateId) {
        return res.status(400).json({
          success: false,
          message: "Job ID and Candidate ID are required",
        });
      }

      // Look for existing saved resume document
      let resumeDoc = await Resume.findOne({ candidateId });

      if (!req.file && (!resumeDoc || !resumeDoc.fileName)) {
        return res.status(400).json({
          success: false,
          message: "Resume file or saved resume is required",
        });
      }

      const job = await Job.findById(jobId);

      if (!job) {
        return res.status(404).json({
          success: false,
          message: "Job not found",
        });
      }

      const candidate = await User.findById(candidateId);

      if (!candidate) {
        return res.status(404).json({
          success: false,
          message: "Candidate not found",
        });
      }

      const existing = await Application.findOne({
        jobId,
        candidateId,
      });

      if (existing) {
        return res.status(400).json({
          success: false,
          message: "Already applied for this job",
        });
      }

      // ==========================================
      // PARSE & MATCH RESUME (OPTIMIZED FAST PATH)
      // ==========================================
      let matchResult = null;
      try {
        const jobText = [
          job.title || "",
          job.description || "",
          (job.requiredSkills || job.skills || []).join(" "),
          job.experience || "",
          job.employmentType || "",
          job.location || ""
        ].join(" ");

        const jobSkills = job.requiredSkills || job.skills || [];
        const jobExperience = job.experience || "";

        // Fast path: if no new file is uploaded OR existing resume has cached extracted text
        if (!req.file && resumeDoc && resumeDoc.extractedText) {
          console.log("⚡ Instant matching using cached resume data...");
          const jsMatch = calculateMatchScore(
            resumeDoc.extractedText,
            jobText,
            resumeDoc.skills || resumeDoc.extractedSkills || [],
            jobSkills
          );

          let hrThreshold = 60;
          if (job.hrId) {
            const hrOwner = await HR.findById(job.hrId);
            if (hrOwner && typeof hrOwner.atsThreshold === "number") {
              hrThreshold = hrOwner.atsThreshold;
            }
          }

          const atsScore = jsMatch.matchScore || 0;
          matchResult = {
            success: true,
            atsScore,
            matchScore: atsScore,
            status: atsScore >= hrThreshold ? "Qualified" : "Not Qualified",
            resumeStatus: atsScore >= hrThreshold ? "Accepted" : "Rejected",
            breakdown: {
              skills: Math.round((jsMatch.skillMatchRate || 0) * 0.4),
              experience: 20,
              education: 15,
              projects: 15,
              certifications: 5,
              resumeCompleteness: 5
            },
            matchedSkills: jsMatch.matchedSkills || [],
            missingSkills: jsMatch.missingSkills || [],
            extraSkills: [],
            extractedText: resumeDoc.extractedText,
            extractedSkills: resumeDoc.extractedSkills || [],
            skills: resumeDoc.skills || resumeDoc.extractedSkills || [],
            education: resumeDoc.education || [],
            experience: resumeDoc.experience || [],
            projects: resumeDoc.projects || [],
            certifications: resumeDoc.certifications || [],
            candidateName: resumeDoc.candidateName || candidate.name || "",
            email: resumeDoc.email || candidate.email || "",
            phone: resumeDoc.phone || candidate.phone || "",
            location: resumeDoc.location || "",
            rejectionReason: jsMatch.rejectionReason || "",
            textSimilarity: jsMatch.textSimilarity || 0,
            skillMatchRate: jsMatch.skillMatchRate || 0,
            skillsMatchScore: jsMatch.skillMatchRate || 0,
            keywordMatchScore: jsMatch.textSimilarity || 0,
          };
        } else {
          const targetFilePath = req.file ? req.file.path : (resumeDoc ? resumeDoc.filePath : "");
          console.log("⏳ Starting Python ATS Scanner matching flow for file:", targetFilePath);
          matchResult = await calculateMatchScorePython(
            targetFilePath,
            jobText,
            jobSkills,
            jobExperience
          );

          if (matchResult.success === false || matchResult.parseError) {
            console.error("❌ Resume Match/Parse Error:", matchResult.parseError);
            return res.status(400).json({
              success: false,
              message: `Resume Parsing Failed. Reason: ${matchResult.parseError || matchResult.rejectionReason || "The resume could not be parsed."}`,
            });
          }
          console.log("✅ Resume parsed and matched successfully via Python");
        }

        // Also update/create Resume document in background
        let resumeDoc = await Resume.findOne({ candidateId });

        if (resumeDoc) {
          resumeDoc.fileName = req.file.filename;
          resumeDoc.filePath = req.file.path;
          resumeDoc.fileType = req.file.mimetype;
          resumeDoc.fileSize = req.file.size;
          resumeDoc.extractedText = matchResult.extractedText;
          resumeDoc.extractedSkills = matchResult.extractedSkills || [];
          resumeDoc.skills = matchResult.skills || matchResult.extractedSkills || [];
          resumeDoc.education = matchResult.education || [];
          resumeDoc.experience = matchResult.experience || [];
          resumeDoc.phone = matchResult.phone || "";
          resumeDoc.email = matchResult.email || "";
          resumeDoc.location = matchResult.location || "";
          resumeDoc.projects = matchResult.projects || [];
          resumeDoc.certifications = matchResult.certifications || [];
          resumeDoc.languages = matchResult.languages || [];
          resumeDoc.achievements = matchResult.achievements || [];
          resumeDoc.technologies = matchResult.technologies || [];
          resumeDoc.candidateName = matchResult.candidateName || "";
          resumeDoc.scanStatus = "Completed";
          resumeDoc.uploadedAt = Date.now();
        } else {
          resumeDoc = new Resume({
            candidateId,
            fileName: req.file.filename,
            filePath: req.file.path,
            fileType: req.file.mimetype,
            fileSize: req.file.size,
            extractedText: matchResult.extractedText,
            extractedSkills: matchResult.extractedSkills || [],
            skills: matchResult.skills || matchResult.extractedSkills || [],
            education: matchResult.education || [],
            experience: matchResult.experience || [],
            phone: matchResult.phone || "",
            email: matchResult.email || "",
            location: matchResult.location || "",
            projects: matchResult.projects || [],
            certifications: matchResult.certifications || [],
            languages: matchResult.languages || [],
            achievements: matchResult.achievements || [],
            technologies: matchResult.technologies || [],
            candidateName: matchResult.candidateName || "",
            scanStatus: "Completed",
          });
        }

        await resumeDoc.save();

        // Update candidate profile with extracted data
        const updateData = {};
        if (matchResult.phone && !candidate.phone) updateData.phone = matchResult.phone;
        if (matchResult.education && matchResult.education.length > 0 && !candidate.education) {
          updateData.education = Array.isArray(matchResult.education) ? matchResult.education.map(e => e.degree || e.institution).join(", ") : String(matchResult.education);
        }
        if (matchResult.experience && matchResult.experience.length > 0 && !candidate.experience) {
          updateData.experience = Array.isArray(matchResult.experience) ? matchResult.experience.map(e => e.title || e.company).join(", ") : String(matchResult.experience);
        }
        if (matchResult.extractedSkills && matchResult.extractedSkills.length > 0 && !candidate.skills) {
          updateData.skills = matchResult.extractedSkills.join(", ");
        }
        updateData.resume = req.file.filename;

        if (Object.keys(updateData).length > 0) {
          await User.findByIdAndUpdate(candidateId, updateData);
        }

      } catch (parseError) {
        console.error("❌ Exception during resume processing:", parseError);
        return res.status(400).json({
          success: false,
          message: `Resume Parsing Failed. Reason: ${parseError.message || parseError}`,
        });
      }

      let hrThreshold = 60;
      if (job.hrId) {
        const hrOwner = await HR.findById(job.hrId);
        if (hrOwner && typeof hrOwner.atsThreshold === "number") {
          hrThreshold = hrOwner.atsThreshold;
        }
      }

      const finalScore = matchResult.atsScore || matchResult.matchScore || 0;
      let finalAppStatus = finalScore >= hrThreshold ? "Accepted" : "Applied";

      const application = await Application.create({
        jobId,
        candidateId,
        hrId: job.hrId,
        candidateName: candidate.name,
        candidateEmail: candidate.email,
        resume: req.file.filename,
        status: finalAppStatus,
        matchScore: finalScore,
        matchedSkills: matchResult.matchedSkills || [],
        missingSkills: matchResult.missingSkills || [],
        resumeStatus: finalScore >= hrThreshold ? "Accepted" : "Rejected",
        rejectionReason: matchResult.rejectionReason || "",

        // Full resume scan data
        resumeText: matchResult.extractedText || "",
        technologies: matchResult.technologies || [],
        extractedSkills: matchResult.extractedSkills || [],
        extraSkills: matchResult.extraSkills || [],
        resumeSummary: matchResult.resumeSummary || "",
        education: matchResult.education || [],
        experience: matchResult.experience || [],
        projects: matchResult.projects || [],
        certifications: matchResult.certifications || [],
        candidatePhone: matchResult.phone || candidate.phone || "",
        textSimilarity: matchResult.textSimilarity || 0,
        skillMatchRate: matchResult.skillMatchRate || 0,
        keywordMatchScore: matchResult.keywordMatchScore || 0,
        skillsMatchScore: matchResult.skillsMatchScore || 0,
        experienceMatchScore: matchResult.experienceMatchScore || 0,
        educationMatchScore: matchResult.educationMatchScore || 0,
        projectMatchScore: matchResult.projectMatchScore || 0,
        certificationsMatchScore: matchResult.certificationsMatchScore || 0,
        completenessMatchScore: matchResult.completenessMatchScore || matchResult.completenessScore || 0,
        breakdown: matchResult.breakdown || {},
      });

      console.log("Application Saved:", application._id, "Status:", finalAppStatus, "Score:", finalScore);

      // Trigger Notifications
      if (finalScore >= 50) {
        await createNotificationHelper({
          userId: candidateId,
          type: "CANDIDATE_ACCEPTED",
          title: "Application Accepted 🎉",
          message: `Your application for ${job.title || "Job Position"} has been accepted with ATS score ${finalScore}%.`,
          link: "/candidate/applications",
        });

        // Send acceptance email
        try {
          await sendAcceptedEmail({
            to: candidate.email,
            candidateName: candidate.name,
            jobTitle: job.title,
            companyName: job.company || "Our Company",
          });
          console.log("✅ Auto-acceptance email sent to candidate.");
        } catch (emailErr) {
          console.error("❌ Failed to send auto-acceptance email:", emailErr);
        }

        if (job.hrId) {
          await createNotificationHelper({
            userId: job.hrId,
            type: "CANDIDATE_ACCEPTED",
            title: "Candidate Accepted",
            message: `Candidate ${candidate.name} has been automatically accepted with ATS score ${finalScore}%.`,
            link: "/hr/accepted-candidates",
          });
        }
      } else {
        await createNotificationHelper({
          userId: candidateId,
          type: "APPLICATION_SUBMITTED",
          title: "Application Submitted",
          message: `Your application for ${job.title || "Job Position"} was submitted successfully.`,
          link: "/candidate/applications",
        });

        if (job.hrId) {
          await createNotificationHelper({
            userId: job.hrId,
            type: "NEW_APPLICATION",
            title: "New Application Received",
            message: `New application received from ${candidate.name} for ${job.title}.`,
            link: "/hr/applications",
          });
        }
      }

      return res.status(201).json({
        success: true,
        message: "Application submitted successfully",
        application,
        atsScore: matchResult.atsScore || matchResult.matchScore,
        matchScore: matchResult.atsScore || matchResult.matchScore,
        status: matchResult.status,
        breakdown: matchResult.breakdown,
        matchedSkills: matchResult.matchedSkills,
        missingSkills: matchResult.missingSkills,
        extraSkills: matchResult.extraSkills || [],
        extractedSkills: matchResult.extractedSkills || [],
        resumeSummary: matchResult.resumeSummary || "",
        resumeStatus: matchResult.resumeStatus,
        textSimilarity: matchResult.textSimilarity,
        skillMatchRate: matchResult.skillMatchRate,
        keywordMatchScore: matchResult.keywordMatchScore,
        skillsMatchScore: matchResult.skillsMatchScore,
        experienceMatchScore: matchResult.experienceMatchScore,
        educationMatchScore: matchResult.educationMatchScore,
        projectMatchScore: matchResult.projectMatchScore,
        certificationsMatchScore: matchResult.certificationsMatchScore || 0,
        completenessMatchScore: matchResult.completenessMatchScore || matchResult.completenessScore || 0,
        rejectionReason: matchResult.rejectionReason,
        recommendations: matchResult.recommendations || [],
        matchedKeywords: matchResult.matchedKeywords || [],
        missingKeywords: matchResult.missingKeywords || [],
        insights: matchResult.insights || [],
        matchDetails: matchResult.matchDetails || [],
        charts: matchResult.charts || {},
        candidateName: matchResult.candidateName || candidate.name || "",
        email: matchResult.email || candidate.email || "",
        phone: matchResult.phone || candidate.phone || "",
        location: matchResult.location || candidate.location || "",
        linkedin: matchResult.linkedin || candidate.linkedin || "",
        github: matchResult.github || candidate.github || "",
        education: matchResult.education || [],
        experience: matchResult.experience || [],
        projects: matchResult.projects || [],
        certifications: matchResult.certifications || [],
        languages: matchResult.languages || [],
        parseError: matchResult.parseError || null,
      });

    } catch (error) {
      console.log("Apply Error:", error);

      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
);


// ==========================================
// ==========================================
// HELPER: PUSH NOTIFICATION TO CANDIDATE
// ==========================================
const pushNotification = async (candidateId, notification) => {
  try {
    if (!candidateId) return;
    await User.findByIdAndUpdate(candidateId, {
      $push: {
        notifications: {
          ...notification,
          createdAt: new Date(),
        },
      },
    });
  } catch (err) {
    console.error("Push Notification Error:", err);
  }
};

// ==========================================
const getAllApplicationsHandler = async (req, res) => {
  try {
    const { jobId, status } = req.query;
    const filter = {};
    if (jobId && jobId !== "ALL") filter.jobId = jobId;
    if (status && status !== "ALL") filter.status = status;

    const applications = await Application.find(filter)
      .populate("jobId")
      .populate("candidateId")
      .sort({ createdAt: -1 });

    return res.status(200).json(applications);
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

router.get("/all", getAllApplicationsHandler);

// ==========================================
// HR APPLICATIONS (with Optional jobId and status filter)
// ==========================================

router.get("/hr/:hrId", async (req, res) => {
  try {
    const { hrId } = req.params;
    const { jobId, status } = req.query;

    const hrJobs = await Job.find({ hrId }).select("_id");
    const jobIds = hrJobs.map(j => j._id);

    const filter = {
      $or: [{ hrId }, { jobId: { $in: jobIds } }]
    };

    if (jobId && jobId !== "ALL") {
      filter.jobId = jobId;
      delete filter.$or;
    }
    if (status && status !== "ALL") {
      filter.status = status;
    }

    const applications = await Application.find(filter)
      .populate("jobId")
      .populate("candidateId")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      applications,
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
// CANDIDATE APPLICATIONS
// ==========================================

router.get("/candidate/:candidateId", async (req, res) => {
  try {

    const applications = await Application.find({
      candidateId: req.params.candidateId,
    })
      .populate("jobId")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      applications,
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
// APPLICATION DETAILS (Single with enriched candidate & resume profile)
// ==========================================

router.get("/details/:id", async (req, res) => {
  try {

    const application = await Application.findById(req.params.id)
      .populate("jobId")
      .populate("candidateId");

    if (!application) {
      return res.status(404).json({
        success: false,
        message: "Application not found",
      });
    }

    // Also fetch resume data for richer details
    let resumeData = null;
    try {
      resumeData = await Resume.findOne({
        candidateId: application.candidateId?._id || application.candidateId,
      }).sort({ uploadedAt: -1 });
    } catch (resumeErr) {
      console.log("Resume fetch error:", resumeErr.message);
    }

    return res.json({
      success: true,
      application,
      resumeData,
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
// ACCEPTED / SHORTLISTED / SELECTED CANDIDATES (with jobId filter)
// ==========================================

router.get("/accepted", async (req, res) => {
  try {
    const { jobId, hrId } = req.query;
    // Exclude candidate-rejected jobs from active selected/accepted list
    const filter = {
      status: {
        $in: [
          "Shortlisted",
          "Accepted",
          "Interview Scheduled",
          "Interview Rescheduled",
          "Interview Confirmed",
          "Interview In Progress",
          "Interview Completed",
          "Selected",
          "Job Offered",
          "Job Accepted",
          "Job Accepted by Candidate"
        ],
        $nin: ["Job Rejected by Candidate", "Rejected", "Rejected by HR", "Interview Cancelled"]
      },
    };

    if (hrId) filter.hrId = hrId;
    if (jobId && jobId !== "ALL") filter.jobId = jobId;

    const applications = await Application.find(filter)
      .populate("jobId")
      .populate("candidateId")
      .sort({ createdAt: -1 });

    const candidateIds = applications.map(a => a.candidateId?._id || a.candidateId).filter(Boolean);
    const appIds = applications.map(a => a._id);

    const [resumes, interviews] = await Promise.all([
      Resume.find({ candidateId: { $in: candidateIds } }),
      Interview.find({ applicationId: { $in: appIds } })
    ]);

    const resumeMap = new Map();
    resumes.forEach(r => {
      if (r.candidateId) resumeMap.set(r.candidateId.toString(), r);
    });

    const interviewMap = new Map();
    interviews.forEach(i => {
      if (i.applicationId) interviewMap.set(i.applicationId.toString(), i);
    });

    const candidates = applications.map((app) => {
      const candIdStr = (app.candidateId?._id || app.candidateId || "").toString();
      const resumeDoc = resumeMap.get(candIdStr);
      const intDoc = interviewMap.get(app._id.toString());

      const hasAppProjects = Array.isArray(app.projects) ? app.projects.length > 0 : Boolean(app.projects);
      const hasAppExp = Array.isArray(app.experience) ? app.experience.length > 0 : Boolean(app.experience);
      const hasAppEdu = Array.isArray(app.education) ? app.education.length > 0 : Boolean(app.education);

      const projects = hasAppProjects ? app.projects : (resumeDoc?.projects?.length ? resumeDoc.projects : app.candidateId?.projects || []);
      const experience = hasAppExp ? app.experience : (resumeDoc?.experience?.length ? resumeDoc.experience : app.candidateId?.experience || []);
      const education = hasAppEdu ? app.education : (resumeDoc?.education?.length ? resumeDoc.education : app.candidateId?.education || []);

      return {
        _id: app._id,
        candidateId: app.candidateId,
        jobId: app.jobId,
        name: app.candidateName || app.candidateId?.name || "Candidate",
        email: app.candidateEmail || app.candidateId?.email || "N/A",
        phone: app.candidatePhone || app.candidateId?.phone || "N/A",
        location: app.location || app.candidateId?.location || "N/A",
        jobTitle: app.jobId?.title || "Job",
        company: app.jobId?.company || "",
        matchScore: app.matchScore || 0,
        matchedSkills: app.matchedSkills || [],
        missingSkills: app.missingSkills || [],
        extractedSkills: app.extractedSkills || [],
        technologies: app.technologies || [],
        education,
        experience,
        projects,
        certifications: app.certifications || [],
        languages: app.languages || [],
        resumeSummary: app.resumeSummary || resumeDoc?.extractedText || "",
        skills: app.candidateId?.skills || "",
        resume: app.resume,
        status: app.status,
        hrInterviewFeedback: app.hrInterviewFeedback || intDoc?.hrReview || null,
        candidateInterviewReview: app.candidateInterviewReview || intDoc?.candidateReview || null,
        candidateJobDecision: app.candidateJobDecision || "",
        candidateJobDecisionReason: app.candidateJobDecisionReason || "",
        candidateJobDecisionAt: app.candidateJobDecisionAt || null,
        interviewDetails: intDoc ? {
          _id: intDoc._id,
          status: intDoc.status || "scheduled",
          interviewDate: intDoc.date || app.interviewDetails?.interviewDate,
          interviewTime: intDoc.time || app.interviewDetails?.interviewTime,
          date: intDoc.date,
          time: intDoc.time,
          type: intDoc.type,
          meetingLink: intDoc.meetingLink || intDoc.address || app.interviewDetails?.meetingLink || app.interviewDetails?.location,
          address: intDoc.address || "",
          hrReview: intDoc.hrReview || app.hrInterviewFeedback || null,
          candidateReview: intDoc.candidateReview || app.candidateInterviewReview || null,
        } : (app.interviewDetails || {}),
        textSimilarity: app.textSimilarity || 0,
        skillMatchRate: app.skillMatchRate || 0,
        skillsMatchScore: app.skillsMatchScore || 0,
        keywordMatchScore: app.keywordMatchScore || 0,
        experienceMatchScore: app.experienceMatchScore || 0,
        educationMatchScore: app.educationMatchScore || 0,
        projectMatchScore: app.projectMatchScore || 0,
        appliedDate: app.createdAt,
      };
    });

    return res.json(candidates);

  } catch (error) {
    console.log(error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});


// ==========================================
// REJECTED CANDIDATES (with jobId filter)
// ==========================================

router.get("/rejected", async (req, res) => {
  try {
    const { jobId, hrId } = req.query;
    const filter = {
      status: {
        $in: ["Rejected", "Rejected by HR", "Job Rejected by Candidate", "Interview Cancelled"]
      }
    };

    if (hrId) filter.hrId = hrId;
    if (jobId && jobId !== "ALL") filter.jobId = jobId;

    const applications = await Application.find(filter)
      .populate("jobId")
      .populate("candidateId")
      .sort({ createdAt: -1 });

    const candidateIds = applications.map(a => a.candidateId?._id || a.candidateId).filter(Boolean);
    const resumes = await Resume.find({ candidateId: { $in: candidateIds } });
    const resumeMap = new Map();
    resumes.forEach(r => {
      if (r.candidateId) resumeMap.set(r.candidateId.toString(), r);
    });

    const candidates = applications.map((app) => {
      const candIdStr = (app.candidateId?._id || app.candidateId || "").toString();
      const resumeDoc = resumeMap.get(candIdStr);

      const hasAppProjects = Array.isArray(app.projects) ? app.projects.length > 0 : Boolean(app.projects);
      const hasAppExp = Array.isArray(app.experience) ? app.experience.length > 0 : Boolean(app.experience);
      const hasAppEdu = Array.isArray(app.education) ? app.education.length > 0 : Boolean(app.education);

      const projects = hasAppProjects ? app.projects : (resumeDoc?.projects?.length ? resumeDoc.projects : app.candidateId?.projects || []);
      const experience = hasAppExp ? app.experience : (resumeDoc?.experience?.length ? resumeDoc.experience : app.candidateId?.experience || []);
      const education = hasAppEdu ? app.education : (resumeDoc?.education?.length ? resumeDoc.education : app.candidateId?.education || []);

      return {
        _id: app._id,
        candidateId: app.candidateId,
        jobId: app.jobId,
        name: app.candidateName || app.candidateId?.name || "Candidate",
        email: app.candidateEmail || app.candidateId?.email || "N/A",
        phone: app.candidatePhone || app.candidateId?.phone || "N/A",
        location: app.location || app.candidateId?.location || "N/A",
        jobTitle: app.jobId?.title || "Job",
        company: app.jobId?.company || "",
        matchScore: app.matchScore || 0,
        matchedSkills: app.matchedSkills || [],
        missingSkills: app.missingSkills || [],
        extractedSkills: app.extractedSkills || [],
        technologies: app.technologies || [],
        education,
        experience,
        projects,
        certifications: app.certifications || [],
        languages: app.languages || [],
        resumeSummary: app.resumeSummary || resumeDoc?.extractedText || "",
        rejectionReason: app.rejectionReason || app.candidateJobDecisionReason || "Candidate did not meet requirements or rejected offer.",
        candidateJobDecisionReason: app.candidateJobDecisionReason || "",
        candidateJobDecision: app.candidateJobDecision || "",
        hrInterviewFeedback: app.hrInterviewFeedback || null,
        candidateInterviewReview: app.candidateInterviewReview || null,
        skills: app.candidateId?.skills || "",
        resume: app.resume,
        status: app.status,
        textSimilarity: app.textSimilarity || 0,
        skillMatchRate: app.skillMatchRate || 0,
        skillsMatchScore: app.skillsMatchScore || 0,
        keywordMatchScore: app.keywordMatchScore || 0,
        experienceMatchScore: app.experienceMatchScore || 0,
        educationMatchScore: app.educationMatchScore || 0,
        projectMatchScore: app.projectMatchScore || 0,
        appliedDate: app.createdAt,
      };
    });

    return res.json(candidates);

  } catch (error) {
    console.log(error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});


// ==========================================
// ACCEPT APPLICATION
// ==========================================

const handleAcceptApplication = async (req, res) => {
  try {
    const id = req.params.id || req.params.appId;
    console.log("[ACCEPT CANDIDATE API] HIT with ID:", id);

    let application = await Application.findById(id).populate("jobId").populate("candidateId");
    if (!application) {
      application = await Application.findOne({ candidateId: id }).sort({ createdAt: -1 }).populate("jobId").populate("candidateId");
    }

    if (!application) {
      return res.status(404).json({
        success: false,
        message: "Application record not found",
      });
    }

    const previousStatus = application.status;
    application.status = "Accepted";
    application.rejectionReason = ""; // Clear rejection reason upon acceptance
    await application.save();

    console.log("[ACCEPT CANDIDATE API SUCCESS] Application ID:", application._id, "Status: Accepted");

    if (previousStatus !== "Accepted") {
      const candidateEmail = application.candidateEmail || application.candidateId?.email;
      const candidateName = application.candidateName || application.candidateId?.name || "Candidate";
      const jobTitle = application.jobId?.title || "Job Position";
      let companyName = application.jobId?.company || "Our Company";
      const matchScore = application.matchScore || application.finalPercentage || 0;

      let hrName = application.jobId?.hrName || "";
      let hrEmail = application.jobId?.hrEmail || "";

      if ((!hrName || !hrEmail || !companyName || companyName === "Our Company") && application.hrId) {
        try {
          const hrUser = await HR.findById(application.hrId);
          if (hrUser) {
            if (!hrName) hrName = hrUser.name || "";
            if (!hrEmail) hrEmail = hrUser.email || "";
            if (!companyName || companyName === "Our Company") companyName = hrUser.company || companyName;
          }
        } catch (err) {
          console.error("HR lookup error:", err.message);
        }
      }

      const candId = application.candidateId?._id || application.candidateId;

      // 1. Create In-App Message for Candidate (Section 2)
      if (candId) {
        const acceptMessageBody = `Application Accepted\n\nCongratulations ${candidateName}!\n\nYou have been selected for the ${jobTitle} position at ${companyName}.\n\nATS Match Score: ${matchScore}%\n\nCongratulations! You have been selected for the position. Our HR team will contact you soon.\n\n— RecruitSmart`;

        await createInAppMessage({
          senderId: application.hrId,
          receiverId: candId,
          senderName: "RecruitSmart",
          senderEmail: process.env.EMAIL_USER,
          receiverEmail: candidateEmail,
          type: "APPLICATION_ACCEPTED",
          subject: "Application Accepted",
          message: acceptMessageBody,
          relatedApplicationId: application._id,
        });

        // 2. Create Candidate Notification (Section 2 & 9)
        await createInAppNotification({
          userId: candId,
          type: "APPLICATION_ACCEPTED",
          title: "Application Accepted",
          message: "Congratulations! You have been selected for the position. Our HR team will contact you soon.",
          link: "/candidate/applications",
          relatedApplicationId: application._id,
        });

        if (application.hrId) {
          await createInAppNotification({
            userId: application.hrId,
            type: "CANDIDATE_ACCEPTED",
            title: "Candidate Accepted",
            message: `Candidate ${candidateName} has been accepted for ${jobTitle}.`,
            link: "/hr/accepted-candidates",
            relatedApplicationId: application._id,
          });
        }
      }

      // 3. Send RecruitSmart Email (Section 3)
      await sendAcceptedEmail({
        to: candidateEmail,
        candidateName,
        jobTitle,
        companyName,
        matchScore,
        hrName,
        hrEmail,
      }).catch((err) => console.error("Email notification failed:", err.message));
    }

    return res.json({
      success: true,
      message: "Application Accepted",
      application,
    });

  } catch (error) {
    console.error("[ACCEPT CANDIDATE API Error]:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

router.put("/accept/:id", handleAcceptApplication);
router.post("/accept/:id", handleAcceptApplication);
router.put("/:id/accept", handleAcceptApplication);
router.post("/:id/accept", handleAcceptApplication);

// ==========================================
// CANDIDATE ACCEPTS OR REJECTS JOB OFFER
// PUT /api/applications/:id/job-decision
// POST /api/applications/:id/job-decision
// ==========================================
const handleJobDecision = async (req, res) => {
  try {
    const { id } = req.params;
    const { decision, reason } = req.body;

    console.log(`[JOB DECISION] HIT for Application ${id}: Decision=${decision}, Reason=${reason}`);

    let application = await Application.findById(id).populate("jobId").populate("candidateId");
    if (!application) {
      application = await Application.findOne({ candidateId: id }).sort({ createdAt: -1 }).populate("jobId").populate("candidateId");
    }

    if (!application) {
      return res.status(404).json({ success: false, message: "Application record not found" });
    }

    const candId = application.candidateId?._id || application.candidateId;
    const candidateName = application.candidateName || application.candidateId?.name || "Candidate";
    const candidateEmail = application.candidateEmail || application.candidateId?.email || "";
    const jobTitle = application.jobId?.title || "Job Position";
    const companyName = application.jobId?.company || "Our Company";
    const hrId = application.hrId;

    if (decision === "Accepted") {
      application.status = "Job Accepted by Candidate";
      application.candidateJobDecision = "Accepted";
      application.candidateJobDecisionAt = new Date();
      await application.save();

      // Notify HR
      if (hrId) {
        await createInAppNotification({
          userId: hrId,
          type: "JOB_ACCEPTED",
          title: "🎉 Job Offer Accepted!",
          message: `${candidateName} has ACCEPTED the job offer for the position of ${jobTitle}.`,
          link: "/hr-dashboard",
          relatedApplicationId: application._id,
        });

        await createInAppMessage({
          senderId: candId,
          receiverId: hrId,
          senderName: candidateName,
          senderEmail: candidateEmail,
          type: "JOB_ACCEPTED",
          subject: `Job Offer Accepted - ${candidateName} (${jobTitle})`,
          message: `Great news!\n\nCandidate ${candidateName} has formally accepted the job offer for the ${jobTitle} position at ${companyName}.\n\nYou can now proceed with onboarding.`,
          relatedApplicationId: application._id,
        });
      }

      // Notify Candidate
      if (candId) {
        await createInAppNotification({
          userId: candId,
          type: "JOB_ACCEPTED",
          title: "Job Offer Accepted",
          message: `You have successfully accepted the job offer for ${jobTitle} at ${companyName}. Congratulations and welcome aboard!`,
          link: "/candidate-dashboard",
          relatedApplicationId: application._id,
        });
      }

      return res.json({
        success: true,
        message: "Job offer accepted successfully! Congratulations!",
        application,
      });

    } else if (decision === "Rejected") {
      const rejReason = reason || req.body.rejectionReason || "Candidate declined the job offer.";
      application.status = "Job Rejected by Candidate";
      application.candidateJobDecision = "Rejected";
      application.candidateJobDecisionReason = rejReason;
      application.candidateJobDecisionAt = new Date();
      await application.save();

      // Notify HR
      if (hrId) {
        await createInAppNotification({
          userId: hrId,
          type: "JOB_REJECTED",
          title: "Job Offer Declined by Candidate",
          message: `${candidateName} has DECLINED the job offer for ${jobTitle}. Reason: ${rejReason}`,
          link: "/hr-dashboard",
          relatedApplicationId: application._id,
        });

        await createInAppMessage({
          senderId: candId,
          receiverId: hrId,
          senderName: candidateName,
          senderEmail: candidateEmail,
          type: "JOB_REJECTED",
          subject: `Job Offer Declined - ${candidateName} (${jobTitle})`,
          message: `Candidate ${candidateName} has declined the job offer for ${jobTitle}.\n\nReason: ${rejReason}`,
          relatedApplicationId: application._id,
        });
      }

      // Notify Candidate
      if (candId) {
        await createInAppNotification({
          userId: candId,
          type: "JOB_REJECTED",
          title: "Job Offer Declined",
          message: `You have declined the job offer for ${jobTitle} at ${companyName}.`,
          link: "/candidate-dashboard",
          relatedApplicationId: application._id,
        });
      }

      return res.json({
        success: true,
        message: "Job offer declined.",
        application,
      });

    } else {
      return res.status(400).json({ success: false, message: "Invalid decision. Must be 'Accepted' or 'Rejected'." });
    }
  } catch (error) {
    console.error("[handleJobDecision Error]:", error);
    return res.status(500).json({ success: false, message: error.message || "Failed to process job decision." });
  }
};

router.put("/:id/job-decision", handleJobDecision);
router.post("/:id/job-decision", handleJobDecision);
router.put("/job-decision/:id", handleJobDecision);
router.post("/job-decision/:id", handleJobDecision);


// ==========================================
// REJECT APPLICATION
// ==========================================

router.put("/reject/:id", async (req, res) => {
  try {
    const { id } = req.params;
    console.log("[PUT /api/applications/reject/:id] HIT with ID:", id, "Body:", req.body);

    let application = await Application.findById(id).populate("jobId").populate("candidateId");
    if (!application) {
      application = await Application.findOne({ candidateId: id }).sort({ createdAt: -1 }).populate("jobId").populate("candidateId");
    }

    if (!application) {
      return res.status(404).json({
        success: false,
        message: "Application record not found",
      });
    }

    const previousStatus = application.status;
    const reasonText = req.body.reason || req.body.rejectionReason || "Candidate did not meet the requirements for this job posting.";
    application.status = "Rejected";
    application.rejectionReason = reasonText;
    await application.save();

    console.log("[PUT /api/applications/reject SUCCESS] Application ID:", application._id, "Status: Rejected, Reason:", reasonText);

    if (previousStatus !== "Rejected") {
      const candidateEmail = application.candidateEmail || application.candidateId?.email;
      const candidateName = application.candidateName || application.candidateId?.name || "Candidate";
      const jobTitle = application.jobId?.title || "Job Position";
      let companyName = application.jobId?.company || "Our Company";

      let hrName = application.jobId?.hrName || "";
      let hrEmail = application.jobId?.hrEmail || "";

      if ((!hrName || !hrEmail || !companyName || companyName === "Our Company") && application.hrId) {
        try {
          const hrUser = await HR.findById(application.hrId);
          if (hrUser) {
            if (!hrName) hrName = hrUser.name || "";
            if (!hrEmail) hrEmail = hrUser.email || "";
            if (!companyName || companyName === "Our Company") companyName = hrUser.company || companyName;
          }
        } catch (err) {
          console.error("HR lookup error:", err.message);
        }
      }

      const candId = application.candidateId?._id || application.candidateId;

      // 1. Create In-App Message for Candidate (Section 4)
      if (candId) {
        const rejectMessageBody = `Application Update\n\nHi ${candidateName},\n\nThank you for applying for the ${jobTitle} position at ${companyName}.\n\nThank you for applying. We regret to inform you that you were not selected for this position. We wish you the best in your future.\n\n— RecruitSmart`;

        await createInAppMessage({
          senderId: application.hrId,
          receiverId: candId,
          senderName: "RecruitSmart",
          senderEmail: process.env.EMAIL_USER,
          receiverEmail: candidateEmail,
          type: "APPLICATION_REJECTED",
          subject: "Application Update",
          message: rejectMessageBody,
          relatedApplicationId: application._id,
        });

        // 2. Create Candidate Notification (Section 4 & 9)
        await createInAppNotification({
          userId: candId,
          type: "APPLICATION_REJECTED",
          title: "Application Rejected",
          message: "Thank you for applying. We regret to inform you that you were not selected for this position.",
          link: "/candidate/applications",
          relatedApplicationId: application._id,
        });

        if (application.hrId) {
          await createInAppNotification({
            userId: application.hrId,
            type: "CANDIDATE_REJECTED",
            title: "Candidate Rejected",
            message: `Candidate ${candidateName} was rejected.`,
            link: "/hr/rejected-candidates",
            relatedApplicationId: application._id,
          });
        }
      }

      // 3. Send RecruitSmart Email (Section 5)
      await sendRejectedEmail({
        to: candidateEmail,
        candidateName,
        jobTitle,
        companyName,
        rejectionReason: reasonText,
        hrName,
        hrEmail,
      }).catch((err) => console.error("Email notification failed:", err.message));
    }

    return res.json({
      success: true,
      message: "Application Rejected",
      application,
    });

  } catch (error) {
    console.error("[PUT /api/applications/reject Error]:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// ==========================================
// UPDATE APPLICATION STATUS
// PUT /api/applications/:id/status
// ==========================================
router.put("/:id/status", async (req, res) => {
  try {
    const { id } = req.params;
    const { status, reason, rejectionReason } = req.body;
    console.log(`[PUT /api/applications/${id}/status] HIT. Target status:`, status);

    let application = await Application.findById(id).populate("jobId").populate("candidateId");
    if (!application) {
      application = await Application.findOne({ candidateId: id }).sort({ createdAt: -1 }).populate("jobId").populate("candidateId");
    }

    if (!application) {
      return res.status(404).json({
        success: false,
        message: "Application record not found",
      });
    }

    const previousStatus = application.status;
    const normStatus = status
      ? status.charAt(0).toUpperCase() + status.slice(1).toLowerCase()
      : "Rejected";

    application.status = normStatus === "Rejected" ? "Rejected" : normStatus;
    if (normStatus === "Accepted") {
      application.rejectionReason = "";
    } else if (reason || rejectionReason) {
      application.rejectionReason = reason || rejectionReason;
    }
    await application.save();

    console.log(`[PUT /api/applications/${id}/status SUCCESS] Set status to:`, application.status);

    const candidateEmail = application.candidateEmail || application.candidateId?.email;
    const candidateName = application.candidateName || application.candidateId?.name || "Candidate";
    const jobTitle = application.jobId?.title || "Job Position";
    let companyName = application.jobId?.company || "Our Company";
    const candId = application.candidateId?._id || application.candidateId;

    let hrName = application.jobId?.hrName || "";
    let hrEmail = application.jobId?.hrEmail || "";

    if ((!hrName || !hrEmail || !companyName || companyName === "Our Company") && application.hrId) {
      try {
        const hrUser = await HR.findById(application.hrId);
        if (hrUser) {
          if (!hrName) hrName = hrUser.name || "";
          if (!hrEmail) hrEmail = hrUser.email || "";
          if (!companyName || companyName === "Our Company") companyName = hrUser.company || companyName;
        }
      } catch (err) {}
    }

    if (application.status === "Accepted" && previousStatus !== "Accepted") {
      const matchScore = application.matchScore || application.finalPercentage || 0;
      if (candId) {
        const acceptMessageBody = `Application Accepted\n\nCongratulations ${candidateName}!\n\nYou have been selected for the ${jobTitle} position at ${companyName}.\n\nATS Match Score: ${matchScore}%\n\nCongratulations! You have been selected for the position. Our HR team will contact you soon.\n\n— RecruitSmart`;

        await createInAppMessage({
          senderId: application.hrId,
          receiverId: candId,
          senderName: "RecruitSmart",
          senderEmail: process.env.EMAIL_USER,
          receiverEmail: candidateEmail,
          type: "APPLICATION_ACCEPTED",
          subject: "Application Accepted",
          message: acceptMessageBody,
          relatedApplicationId: application._id,
        });

        await createInAppNotification({
          userId: candId,
          type: "APPLICATION_ACCEPTED",
          title: "Application Accepted",
          message: "Congratulations! You have been selected for the position. Our HR team will contact you soon.",
          link: "/candidate/applications",
          relatedApplicationId: application._id,
        });
      }

      await sendAcceptedEmail({
        to: candidateEmail,
        candidateName,
        jobTitle,
        companyName,
        matchScore,
        hrName,
        hrEmail,
      }).catch((err) => console.error("Email notification failed:", err.message));
    } else if (application.status === "Rejected" && previousStatus !== "Rejected") {
      const reasonText = application.rejectionReason || "Candidate did not meet the requirements for this job posting.";
      if (candId) {
        const rejectMessageBody = `Application Update\n\nHi ${candidateName},\n\nThank you for applying for the ${jobTitle} position at ${companyName}.\n\nThank you for applying. We regret to inform you that you were not selected for this position. We wish you the best in your future.\n\n— RecruitSmart`;

        await createInAppMessage({
          senderId: application.hrId,
          receiverId: candId,
          senderName: "RecruitSmart",
          senderEmail: process.env.EMAIL_USER,
          receiverEmail: candidateEmail,
          type: "APPLICATION_REJECTED",
          subject: "Application Update",
          message: rejectMessageBody,
          relatedApplicationId: application._id,
        });

        await createInAppNotification({
          userId: candId,
          type: "APPLICATION_REJECTED",
          title: "Application Rejected",
          message: "Thank you for applying. We regret to inform you that you were not selected for this position.",
          link: "/candidate/applications",
          relatedApplicationId: application._id,
        });
      }

      await sendRejectedEmail({
        to: candidateEmail,
        candidateName,
        jobTitle,
        companyName,
        rejectionReason: reasonText,
        hrName,
        hrEmail,
      }).catch((err) => console.error("Email notification failed:", err.message));
    }

    return res.json({
      success: true,
      message: `Application status updated to ${application.status}`,
      application,
    });
  } catch (error) {
    console.error("[PUT /api/applications/:id/status Error]:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});


// ==========================================
// SHORTLIST APPLICATION
// ==========================================

router.put("/shortlist/:id", async (req, res) => {
  try {

    const existing = await Application.findById(req.params.id).populate("jobId");

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Application not found",
      });
    }

    if (existing.status === "Shortlisted") {
      return res.status(400).json({
        success: false,
        message: "Application is already shortlisted",
      });
    }

    const application = await Application.findByIdAndUpdate(
      req.params.id,
      {
        status: "Shortlisted",
      },
      {
        new: true,
      }
    ).populate("jobId").populate("candidateId");

    await pushNotification(application.candidateId?._id || application.candidateId, {
      title: "Application Shortlisted ⭐",
      message: `Congratulations! Your application for ${application.jobId?.title || "Job"} has been Shortlisted.`,
      type: "info",
      jobId: application.jobId?._id,
      applicationId: application._id,
    });

    return res.json({
      success: true,
      message: "Application Shortlisted",
      application,
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
// GET ALL SCHEDULED INTERVIEWS (FOR HR CALENDAR)
// ==========================================

const getInterviewsHandler = async (req, res) => {
  try {
    const { hrId } = req.query;
    const filter = { status: "Interview Scheduled" };
    if (hrId) filter.hrId = hrId;

    const applications = await Application.find(filter)
      .populate("jobId")
      .populate("candidateId")
      .sort({ "interviewDetails.interviewDate": 1, "interviewDetails.interviewTime": 1 });

    const interviews = applications.map((app) => ({
      _id: app._id,
      candidateId: app.candidateId,
      candidateName: app.candidateName || app.candidateId?.name || "Candidate",
      candidateEmail: app.candidateEmail || app.candidateId?.email || "",
      candidatePhone: app.candidatePhone || app.candidateId?.phone || "",
      jobTitle: app.jobId?.title || "Job Position",
      company: app.jobId?.company || "",
      interviewDetails: app.interviewDetails || {},
      status: app.status,
      resume: app.resume,
      matchScore: app.matchScore || 0,
    }));

    return res.json(interviews);
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

router.get("/interviews", getInterviewsHandler);
router.get("/", (req, res, next) => {
  if (req.baseUrl === "/api/interviews") {
    return getInterviewsHandler(req, res);
  }
  return getAllApplicationsHandler(req, res);
});

// ==========================================
// SCHEDULE / UPDATE INTERVIEW (WITH CONFLICT CHECK)
// ==========================================

const handleScheduleInterviewRoute = async (req, res) => {
  try {
    const {
      interviewDate,
      interviewTime,
      interviewType,
      meetingLink,
      location,
      interviewerName,
      notes,
    } = req.body;

    if (!interviewDate || !interviewTime) {
      return res.status(400).json({
        success: false,
        message: "Interview date and time are required",
      });
    }

    // Past date validation
    const selectedDate = new Date(interviewDate);
    selectedDate.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (selectedDate < today) {
      return res.status(400).json({
        success: false,
        message: "Please select a valid future date.",
      });
    }

    const typeSelected = interviewType || "Online";

    // Required Field Validations
    if (typeSelected === "Online" && (!meetingLink || meetingLink.trim() === "")) {
      return res.status(400).json({
        success: false,
        message: "Meeting link is required for online interviews.",
      });
    }

    if (typeSelected === "In Person" && (!location || location.trim() === "")) {
      return res.status(400).json({
        success: false,
        message: "Address is required for in-person interviews.",
      });
    }

    const existing = await Application.findById(req.params.id).populate("jobId");

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Application not found",
      });
    }

    // Double Booking / Conflict Check
    const conflict = await Application.findOne({
      _id: { $ne: req.params.id },
      status: "Interview Scheduled",
      "interviewDetails.interviewDate": interviewDate,
      "interviewDetails.interviewTime": interviewTime,
    }).populate("candidateId");

    if (conflict) {
      return res.status(400).json({
        success: false,
        message: "Another interview is already scheduled for this date and time. Please select a different time.",
      });
    }

    const isUpdate = existing.status === "Interview Scheduled";

    const application = await Application.findByIdAndUpdate(
      req.params.id,
      {
        status: "Interview Scheduled",
        interviewDetails: {
          interviewDate,
          interviewTime,
          interviewType: typeSelected,
          meetingLink: meetingLink || "",
          location: location || "",
          interviewerName: interviewerName || "",
          notes: notes || "",
          scheduledAt: new Date(),
        },
      },
      { new: true }
    ).populate("jobId").populate("candidateId");

    const notifTitle = isUpdate ? "Interview Schedule Updated 📅" : "Interview Scheduled! 📅";
    const notifMessage = `Your interview for ${application.jobId?.title || "Job"} has been scheduled on ${interviewDate} at ${interviewTime}. Type: ${typeSelected}.`;

    await pushNotification(application.candidateId?._id || application.candidateId, {
      title: notifTitle,
      message: notifMessage,
      type: "warning",
      jobId: application.jobId?._id,
      applicationId: application._id,
    });

    const candidateEmail = application.candidateEmail || application.candidateId?.email;
    const candidateName = application.candidateName || application.candidateId?.name || "Candidate";
    const jobTitle = application.jobId?.title || "Job Position";
    const companyName = application.jobId?.company || "Our Company";

    if (isUpdate) {
      await sendInterviewRescheduledEmail({
        to: candidateEmail,
        candidateName,
        jobTitle,
        companyName,
        previousDate: existing.interviewDetails?.interviewDate || "",
        previousTime: existing.interviewDetails?.interviewTime || "",
        newDate: interviewDate,
        newTime: interviewTime,
        meetingLink: meetingLink || "",
        location: location || "",
        type: typeSelected,
      }).catch((err) => console.error("Email notification failed:", err.message));
    } else {
      await sendInterviewScheduledEmail({
        to: candidateEmail,
        candidateName,
        jobTitle,
        companyName,
        interviewDate,
        interviewTime,
        meetingLink: meetingLink || "",
        location: location || "",
        type: typeSelected,
      }).catch((err) => console.error("Email notification failed:", err.message));
    }

    return res.json({
      success: true,
      message: isUpdate ? "Interview schedule updated successfully" : "Interview scheduled successfully",
      application,
    });

  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

router.put("/schedule-interview/:id", handleScheduleInterviewRoute);
router.put("/:id/schedule-interview", handleScheduleInterviewRoute);


// ==========================================
// CANCEL INTERVIEW
// ==========================================

router.put("/cancel-interview/:id", async (req, res) => {
  try {
    const existing = await Application.findById(req.params.id).populate("jobId");

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Application not found",
      });
    }

    const application = await Application.findByIdAndUpdate(
      req.params.id,
      {
        status: "Shortlisted",
        interviewDetails: {
          interviewDate: "",
          interviewTime: "",
          interviewType: "Online",
          meetingLink: "",
          location: "",
          interviewerName: "",
          notes: "",
        },
      },
      { new: true }
    ).populate("jobId").populate("candidateId");

    await pushNotification(application.candidateId?._id || application.candidateId, {
      title: "Interview Cancelled ❌",
      message: `Your scheduled interview for ${application.jobId?.title || "Job"} was cancelled. Your application remains shortlisted.`,
      type: "info",
      jobId: application.jobId?._id,
      applicationId: application._id,
    });

    const candidateEmail = application.candidateEmail || application.candidateId?.email;
    const candidateName = application.candidateName || application.candidateId?.name || "Candidate";
    const jobTitle = application.jobId?.title || "Job Position";
    const companyName = application.jobId?.company || "Our Company";

    await sendInterviewCancelledEmail({
      to: candidateEmail,
      candidateName,
      jobTitle,
      companyName,
    }).catch((err) => console.error("Email notification failed:", err.message));

    return res.json({
      success: true,
      message: "Interview cancelled successfully",
      application,
    });

  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});
// DELETE /api/applications/:id
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ success: false, message: "Application ID is required." });
    }

    // Check if there is an interview associated with this application
    const existingInterview = await Interview.findOne({ applicationId: id });
    if (existingInterview && existingInterview.status !== "cancelled" && existingInterview.status !== "rejected") {
      return res.status(400).json({ 
        success: false, 
        message: "This application has a scheduled interview. Cancel the interview before deleting the application." 
      });
    }

    const deletedApp = await Application.findByIdAndDelete(id);
    
    if (!deletedApp) {
      return res.status(404).json({ success: false, message: "Application not found." });
    }

    return res.json({ success: true, message: "Application deleted successfully." });
  } catch (error) {
    console.error("DELETE /api/applications/:id error:", error);
    return res.status(500).json({ success: false, message: "Failed to delete application", error: error.message });
  }
});

export default router;
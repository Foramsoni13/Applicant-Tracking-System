import express from "express";
import Resume from "../models/Resume.js";
import User from "../models/User.js";
import Job from "../models/Job.js";
import Application from "../models/Application.js";
import upload from "../middleware/upload.js";
import { calculateMatchScorePython } from "../services/pythonMatcher.js";
import { calculateMatchScore } from "../services/matchingService.js";

const router = express.Router();

// ==========================================
// UPLOAD & SCAN RESUME
// ==========================================


router.post(
  "/upload",
  (req, res, next) => {
    upload.single("resume")(req, res, (err) => {
      if (err) {
        let message = "Resume upload failed";

        if (err.code === "LIMIT_FILE_SIZE") {
          message = "Resume file is too large. Maximum size is 5 MB.";
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

      const { candidateId } = req.body;

      if (!candidateId) {
        return res.status(400).json({
          success: false,
          message: "Candidate ID is required",
        });
      }

      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "Resume file is required",
        });
      }


      // Check if candidate exists
      const candidate = await User.findById(candidateId);

      if (!candidate) {
        return res.status(404).json({
          success: false,
          message: "Candidate not found",
        });
      }


      // Check if resume already exists for this candidate
      let resume = await Resume.findOne({ candidateId });

      if (resume) {
        // Update existing resume
        resume.fileName = req.file.filename;
        resume.filePath = req.file.path;
        resume.fileType = req.file.mimetype;
        resume.fileSize = req.file.size;
        resume.scanStatus = "Scanning";
        resume.uploadedAt = Date.now();
      } else {
        // Create new resume entry
        resume = new Resume({
          candidateId,
          fileName: req.file.filename,
          filePath: req.file.path,
          fileType: req.file.mimetype,
          fileSize: req.file.size,
          scanStatus: "Scanning",
        });
      }

      await resume.save();


      // ==========================================
      // AUTO-SCAN: Extract text and parse resume
      // ==========================================

      try {

        // Use python scanner
        const parsed = await calculateMatchScorePython(req.file.path, "", [], "");

        if (parsed.success === false || parsed.parseError) {
          throw new Error(parsed.parseError || parsed.rejectionReason || "The resume could not be parsed.");
        }

        resume.extractedText = parsed.extractedText;
        resume.extractedSkills = parsed.extractedSkills || [];
        resume.skills = parsed.skills || parsed.extractedSkills || [];
        resume.education = parsed.education || [];
        resume.experience = parsed.experience || [];
        resume.phone = parsed.phone || "";
        resume.email = parsed.email || "";
        resume.location = parsed.location || "";
        resume.projects = parsed.projects || [];
        resume.certifications = parsed.certifications || [];
        resume.languages = parsed.languages || [];
        resume.achievements = parsed.achievements || [];
        resume.technologies = parsed.technologies || [];
        resume.candidateName = parsed.candidateName || "";
        resume.linkedin = parsed.linkedin || "";
        resume.github = parsed.github || "";
        resume.atsScore = parsed.atsScore || parsed.matchScore || 0;
        resume.breakdown = parsed.breakdown || {};
        resume.recommendations = parsed.recommendations || [];
        resume.scanStatus = "Completed";

        await resume.save();

        // Also update candidate profile with extracted data
        const updateData = {};
        if (parsed.phone && !candidate.phone) updateData.phone = parsed.phone;
        if (parsed.education && parsed.education.length > 0 && !candidate.education) {
          updateData.education = Array.isArray(parsed.education) ? parsed.education.map(e => e.degree || e.institution).join(", ") : String(parsed.education);
        }
        if (parsed.experience && parsed.experience.length > 0 && !candidate.experience) {
          updateData.experience = Array.isArray(parsed.experience) ? parsed.experience.map(e => e.title || e.company).join(", ") : String(parsed.experience);
        }
        if (parsed.extractedSkills && parsed.extractedSkills.length > 0 && !candidate.skills) {
          updateData.skills = parsed.extractedSkills.join(", ");
        }
        updateData.resume = req.file.filename;

        if (Object.keys(updateData).length > 0) {
          await User.findByIdAndUpdate(candidateId, updateData);
        }

        // ==========================================
        // AUTO-APPLY LOGIC (Fast In-Memory Evaluation)
        // ==========================================
        const autoAppliedJobs = [];

        try {
          // Find all active jobs
          const openJobs = await Job.find({}); 

          for (const job of openJobs) {
            try {
              // 1. Check if application already exists
              const existingApp = await Application.findOne({
                jobId: job._id,
                candidateId: candidateId
              });

              if (existingApp) continue;

              // 2. Calculate Job-Specific Match Score in Memory
              const jobSkills = job.skills || job.requiredSkills || [];
              const candidateSkills = parsed.skills || parsed.extractedSkills || [];
              const jobText = `${job.title || ""} ${job.description || ""} ${jobSkills.join(" ")}`;

              const matchResult = calculateMatchScore(
                parsed.extractedText || "",
                jobText,
                candidateSkills,
                jobSkills
              );

              let hrThreshold = 60;
              if (job.hrId) {
                const hrOwner = await HR.findById(job.hrId);
                if (hrOwner && typeof hrOwner.atsThreshold === "number") {
                  hrThreshold = hrOwner.atsThreshold;
                }
              }

              const score = matchResult.matchScore || 0;

              // Apply HR's ATS Threshold
              if (score >= hrThreshold) {
                const newApp = new Application({
                  jobId: job._id,
                  candidateId: candidateId,
                  hrId: job.hrId,
                  candidateName: parsed.candidateName || candidate.name,
                  candidateEmail: parsed.email || candidate.email,
                  candidatePhone: parsed.phone || candidate.phone,
                  resume: req.file.filename,
                  status: "Applied",
                  source: "Auto Applied",
                  matchScore: score,
                  matchedSkills: matchResult.matchedSkills || [],
                  missingSkills: matchResult.missingSkills || [],
                  resumeStatus: "Pending",
                  resumeText: parsed.extractedText || "",
                  technologies: parsed.technologies || [],
                  extractedSkills: parsed.extractedSkills || [],
                  resumeSummary: parsed.resumeSummary || "",
                  education: parsed.education || [],
                  experience: parsed.experience || [],
                  projects: parsed.projects || [],
                  certifications: parsed.certifications || [],
                  location: parsed.location || "",
                });

                await newApp.save();

                autoAppliedJobs.push({
                  jobId: job._id,
                  jobTitle: job.title,
                  company: job.company,
                  matchScore: score
                });
                console.log(`🚀 Auto-Applied to ${job.title} for ${candidate.name} (Score: ${score}%)`);
              }
            } catch (err) {
              console.log("⚠️ Error in auto-apply for job:", job._id, err.message);
            }
          }

        } catch (autoApplyError) {
          console.log("❌ Auto-apply system error:", autoApplyError.message);
        }

        console.log("✅ Resume Scanned Successfully:", resume._id);

        return res.status(201).json({
          success: true,
          message: "Resume uploaded and scanned successfully",
          resume,
          insights: parsed.insights || [],
          matchDetails: parsed.matchDetails || [],
          matchedKeywords: parsed.matchedKeywords || [],
          missingKeywords: parsed.missingKeywords || [],
          charts: parsed.charts || {},
          autoAppliedJobs
        });



      } catch (scanError) {

        console.log("❌ Resume Scan Error:", scanError.message);

        resume.scanStatus = "Failed";
        await resume.save();

        return res.status(400).json({
          success: false,
          message: "Resume Parsing Failed. Reason: " + scanError.message,
        });
      }


    } catch (error) {

      console.log("Upload Error:", error);

      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
);


// ==========================================
// RE-SCAN RESUME
// ==========================================

router.post("/scan/:resumeId", async (req, res) => {

  try {

    const resume = await Resume.findById(req.params.resumeId);

    if (!resume) {
      return res.status(404).json({
        success: false,
        message: "Resume not found",
      });
    }

    resume.scanStatus = "Scanning";
    await resume.save();


    try {

      const parsed = await calculateMatchScorePython(resume.filePath, "", [], "");

      if (parsed.success === false || parsed.parseError) {
        throw new Error(parsed.parseError || parsed.rejectionReason || "The resume could not be parsed.");
      }

      resume.extractedText = parsed.extractedText;
      resume.extractedSkills = parsed.extractedSkills || [];
      resume.skills = parsed.skills || parsed.extractedSkills || [];
      resume.education = parsed.education || [];
      resume.experience = parsed.experience || [];
      resume.phone = parsed.phone || "";
      resume.email = parsed.email || "";
      resume.location = parsed.location || "";
      resume.projects = parsed.projects || [];
      resume.certifications = parsed.certifications || [];
      resume.languages = parsed.languages || [];
      resume.achievements = parsed.achievements || [];
      resume.technologies = parsed.technologies || [];
      resume.candidateName = parsed.candidateName || "";
      resume.linkedin = parsed.linkedin || "";
      resume.github = parsed.github || "";
      resume.atsScore = parsed.atsScore || parsed.matchScore || 0;
      resume.breakdown = parsed.breakdown || {};
      resume.recommendations = parsed.recommendations || [];
      resume.scanStatus = "Completed";

      await resume.save();

      return res.json({
        success: true,
        message: "Resume re-scanned successfully",
        resume,
      });

    } catch (scanError) {

      resume.scanStatus = "Failed";
      await resume.save();

      return res.status(400).json({
        success: false,
        message: "Resume scan failed: " + scanError.message,
      });
    }


  } catch (error) {

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }

});


// ==========================================
// GET CANDIDATE RESUME
// ==========================================

router.get("/candidate/:candidateId", async (req, res) => {

  try {

    const resume = await Resume.findOne({
      candidateId: req.params.candidateId,
    }).sort({ uploadedAt: -1 });

    if (!resume) {
      return res.status(404).json({
        success: false,
        message: "No resume found for this candidate",
      });
    }

    return res.json({
      success: true,
      resume,
    });

  } catch (error) {

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }

});


export default router;
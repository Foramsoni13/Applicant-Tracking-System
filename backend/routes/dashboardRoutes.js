import express from "express";
import mongoose from "mongoose";
import Job from "../models/Job.js";
import Application from "../models/Application.js";
import User from "../models/User.js";
import HR from "../models/HR.js";

const router = express.Router();

// Helper to compute dashboard stats for a given set of jobs & applications
const computeStatsResponse = (jobs, applications) => {
  const totalJobs = jobs.length;
  const activeJobs = jobs.filter(job => job.status === "Active" || !job.status || job.status !== "Closed").length;
  const closedJobs = totalJobs - activeJobs;

  const totalApplications = applications.length;

  let accepted = 0;
  let rejected = 0;
  let pending = 0;
  let shortlisted = 0;
  let interviewScheduled = 0;
  let selected = 0;

  const candidatesSet = new Set();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const startOfWeek = new Date();
  startOfWeek.setDate(today.getDate() - today.getDay());
  startOfWeek.setHours(0, 0, 0, 0);

  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

  let applicationsToday = 0;
  let applicationsThisWeek = 0;
  let applicationsThisMonth = 0;

  applications.forEach(app => {
    if (app.candidateId) {
      candidatesSet.add(app.candidateId.toString());
    }

    const st = (app.status || "").trim();
    if (st === "Accepted" || st === "Job Accepted by Candidate" || st === "Job Accepted") {
      accepted++;
    } else if (st === "Selected" || st === "Job Offered") {
      selected++;
      accepted++;
    } else if (st === "Rejected" || st === "Rejected by HR" || st === "Job Rejected by Candidate") {
      rejected++;
    } else if (st === "Shortlisted") {
      shortlisted++;
    } else if (st.includes("Interview")) {
      interviewScheduled++;
    } else {
      pending++;
    }

    const appDate = new Date(app.createdAt);
    if (appDate >= today) applicationsToday++;
    if (appDate >= startOfWeek) applicationsThisWeek++;
    if (appDate >= startOfMonth) applicationsThisMonth++;
  });

  const totalCandidates = candidatesSet.size;

  // Chart: Applications per Month (Last 6 months)
  const appsPerMonth = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const monthStr = d.toLocaleString('default', { month: 'short' });

    const count = applications.filter(app => {
      const ad = new Date(app.createdAt);
      return ad.getMonth() === d.getMonth() && ad.getFullYear() === d.getFullYear();
    }).length;

    appsPerMonth.push({ name: monthStr, Applications: count });
  }

  // Chart: Jobs Posted per Month
  const jobsPerMonth = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const monthStr = d.toLocaleString('default', { month: 'short' });

    const count = jobs.filter(job => {
      const jd = new Date(job.createdAt);
      return jd.getMonth() === d.getMonth() && jd.getFullYear() === d.getFullYear();
    }).length;

    jobsPerMonth.push({ name: monthStr, Jobs: count });
  }

  // Applications & Acceptance Rate by Job
  const appCountByJob = {};
  const acceptedCountByJob = {};
  applications.forEach(app => {
    const jId = app.jobId ? app.jobId.toString() : null;
    if (jId) {
      appCountByJob[jId] = (appCountByJob[jId] || 0) + 1;
      if (app.status === "Accepted" || app.status === "Selected" || app.status === "Job Accepted by Candidate") {
        acceptedCountByJob[jId] = (acceptedCountByJob[jId] || 0) + 1;
      }
    }
  });

  // Top Jobs Table Data
  const topJobsTable = jobs
    .map(job => {
      const appCount = appCountByJob[job._id.toString()] || 0;
      const acceptedCnt = acceptedCountByJob[job._id.toString()] || 0;
      const rate = appCount > 0 ? Math.round((acceptedCnt / appCount) * 100) : 0;

      return {
        jobId: job._id,
        title: job.title || "Untitled Job",
        company: job.company || "Company",
        location: job.location || "Location",
        applicationCount: appCount,
        acceptedCount: acceptedCnt,
        acceptanceRate: rate,
        status: job.status || "Active",
        lastUpdated: job.updatedAt ? new Date(job.updatedAt).toLocaleDateString() : new Date(job.createdAt).toLocaleDateString()
      };
    })
    .sort((a, b) => b.applicationCount - a.applicationCount);

  return {
    success: true,
    stats: {
      jobs: totalJobs,
      activeJobs,
      closedJobs,
      totalCandidates,
      applications: totalApplications,
      accepted,
      selected,
      rejected,
      pending,
      shortlisted,
      interviews: interviewScheduled,
      interviewScheduled,
      applicationsToday,
      applicationsThisWeek,
      applicationsThisMonth
    },
    topJobsTable,
    charts: {
      appsPerMonth,
      jobsPerMonth,
      statusData: [
        { name: "Accepted / Selected", value: accepted, fill: "#2482C1" },
        { name: "Interview Scheduled", value: interviewScheduled, fill: "#68AAD0" },
        { name: "Pending", value: pending, fill: "#8DBBD7" },
        { name: "Rejected", value: rejected, fill: "#B7D8EA" },
        { name: "Shortlisted", value: shortlisted, fill: "#D6E9F2" }
      ]
    }
  };
};

// GET /api/dashboard/stats - Fetch overall system dashboard stats
router.get("/stats", async (req, res) => {
  try {
    const jobs = await Job.find({});
    const applications = await Application.find({});
    return res.json(computeStatsResponse(jobs, applications));
  } catch (error) {
    console.error("Dashboard Stats Error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/dashboard/stats/:hrId - Fetch HR or overall dashboard stats
router.get("/stats/:hrId", async (req, res) => {
  try {
    const { hrId } = req.params;

    const isAll = !hrId || hrId === "all" || hrId === "admin" || hrId === "undefined" || hrId === "null";

    if (isAll) {
      const jobs = await Job.find({});
      const applications = await Application.find({});
      return res.json(computeStatsResponse(jobs, applications));
    }

    if (!mongoose.Types.ObjectId.isValid(hrId)) {
      const jobs = await Job.find({});
      const applications = await Application.find({});
      return res.json(computeStatsResponse(jobs, applications));
    }

    // Resolve HR IDs and Email
    let queryHrIds = [new mongoose.Types.ObjectId(hrId)];
    let hrEmail = null;

    const userDoc = await User.findById(hrId);
    if (userDoc) hrEmail = userDoc.email;

    const hrDoc = await HR.findOne({ $or: [{ _id: hrId }, ...(hrEmail ? [{ email: hrEmail }] : [])] });
    if (hrDoc) {
      queryHrIds.push(hrDoc._id);
      if (!hrEmail) hrEmail = hrDoc.email;
    }

    const jobFilter = {
      $or: [
        { hrId: { $in: queryHrIds } },
        ...(hrEmail ? [{ hrEmail }] : [])
      ]
    };

    let jobs = await Job.find(jobFilter);

    // If specific HR ID produced no jobs, fallback to fetching all jobs/apps to avoid 0 stats
    if (jobs.length === 0) {
      jobs = await Job.find({});
      const applications = await Application.find({});
      return res.json(computeStatsResponse(jobs, applications));
    }

    const jobIds = jobs.map(j => j._id);
    const applications = await Application.find({
      $or: [
        { hrId: { $in: queryHrIds } },
        { jobId: { $in: jobIds } }
      ]
    });

    return res.json(computeStatsResponse(jobs, applications));
  } catch (error) {
    console.error("Dashboard Stats Error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

export default router;

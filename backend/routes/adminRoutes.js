import express from "express";
import User from "../models/User.js";
import HR from "../models/HR.js";
import Job from "../models/Job.js";
import Application from "../models/Application.js";
import Interview from "../models/Interview.js";
import SystemSetting from "../models/SystemSetting.js";

const router = express.Router();

// Helper: Calculate date threshold based on period string
const getStartDateFromPeriod = (period) => {
  const now = new Date();
  if (period === "today") {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    return start;
  }
  if (period === "7days") {
    const start = new Date();
    start.setDate(now.getDate() - 7);
    return start;
  }
  if (period === "30days") {
    const start = new Date();
    start.setDate(now.getDate() - 30);
    return start;
  }
  if (period === "6months") {
    const start = new Date();
    start.setMonth(now.getMonth() - 6);
    return start;
  }
  if (period === "1year") {
    const start = new Date();
    start.setFullYear(now.getFullYear() - 1);
    return start;
  }
  return null; // "all" or default
};

// ==========================================
// 1. ADMIN OVERVIEW STATS
// GET /api/admin/stats
// ==========================================
router.get("/stats", async (req, res) => {
  try {
    const [
      totalUsersCount,
      totalCandidatesCount,
      totalHrCount,
      totalJobsCount,
      totalAppsCount,
      acceptedAppsCount,
      rejectedAppsCount,
      pendingAppsCount,
      interviewsCount,
    ] = await Promise.all([
      User.countDocuments({}),
      User.countDocuments({ role: "candidate" }),
      HR.countDocuments({}),
      Job.countDocuments({}),
      Application.countDocuments({}),
      Application.countDocuments({ status: { $in: ["Accepted", "Interview Scheduled", "Interview Invited", "Interview Confirmed"] } }),
      Application.countDocuments({ status: "Rejected" }),
      Application.countDocuments({ status: { $in: ["Applied", "Pending", "Shortlisted"] } }),
      Interview.countDocuments({}),
    ]);

    return res.json({
      success: true,
      stats: {
        totalUsers: totalUsersCount + totalHrCount,
        totalCandidates: totalCandidatesCount,
        totalHr: totalHrCount,
        totalJobs: totalJobsCount,
        totalApplications: totalAppsCount,
        acceptedApplications: acceptedAppsCount,
        rejectedApplications: rejectedAppsCount,
        pendingApplications: pendingAppsCount,
        scheduledInterviews: interviewsCount,
      },
    });
  } catch (err) {
    console.error("ADMIN STATS ERROR:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ==========================================
// 2. MANAGE USERS
// GET /api/admin/users
// ==========================================
router.get("/users", async (req, res) => {
  try {
    const candidates = await User.find({}).sort({ createdAt: -1 }).lean();
    const hrs = await HR.find({}).sort({ createdAt: -1 }).lean();

    // Map candidate application counts
    const apps = await Application.find({}, "candidateId hrId status").lean();
    const appCountMap = {};
    apps.forEach((app) => {
      const cid = app.candidateId?.toString();
      if (cid) appCountMap[cid] = (appCountMap[cid] || 0) + 1;
    });

    const hrJobCountMap = {};
    const jobs = await Job.find({}, "hrId").lean();
    jobs.forEach((j) => {
      const hId = j.hrId?.toString();
      if (hId) hrJobCountMap[hId] = (hrJobCountMap[hId] || 0) + 1;
    });

    const formattedCandidates = candidates.map((u) => ({
      _id: u._id,
      name: u.name,
      email: u.email,
      role: u.role || "candidate",
      phone: u.phone || "",
      registrationDate: u.createdAt,
      applicationCount: appCountMap[u._id.toString()] || 0,
      status: u.status || (u.isActive === false ? "Inactive" : "Active"),
      isActive: u.isActive !== false,
      userType: "User",
    }));

    const formattedHrs = hrs.map((h) => ({
      _id: h._id,
      name: h.name,
      email: h.email,
      role: "hr",
      company: h.company || "N/A",
      department: h.department || "N/A",
      phone: h.phone || "",
      registrationDate: h.createdAt,
      applicationCount: hrJobCountMap[h._id.toString()] || 0,
      status: h.status || (h.isActive === false ? "Inactive" : "Active"),
      isActive: h.isActive !== false,
      userType: "HR",
    }));

    const allUsers = [...formattedCandidates, ...formattedHrs];
    return res.json({ success: true, users: allUsers });
  } catch (err) {
    console.error("ADMIN GET USERS ERROR:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

// Toggle User Status
// PUT /api/admin/users/:id/status
router.put("/users/:id/status", async (req, res) => {
  try {
    const { id } = req.params;
    const { status, isActive } = req.body;

    let user = await User.findById(id);
    if (user) {
      user.isActive = typeof isActive === "boolean" ? isActive : user.isActive === false ? true : false;
      user.status = status || (user.isActive ? "Active" : "Inactive");
      await user.save();
      return res.json({ success: true, user });
    }

    let hr = await HR.findById(id);
    if (hr) {
      hr.isActive = typeof isActive === "boolean" ? isActive : hr.isActive === false ? true : false;
      hr.status = status || (hr.isActive ? "Active" : "Inactive");
      await hr.save();
      return res.json({ success: true, user: hr });
    }

    return res.status(404).json({ success: false, message: "User or HR not found" });
  } catch (err) {
    console.error("ADMIN USER STATUS UPDATE ERROR:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE User
// DELETE /api/admin/users/:id
router.delete("/users/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const userDel = await User.findByIdAndDelete(id);
    if (userDel) return res.json({ success: true, message: "User deleted successfully" });

    const hrDel = await HR.findByIdAndDelete(id);
    if (hrDel) return res.json({ success: true, message: "HR deleted successfully" });

    return res.status(404).json({ success: false, message: "User not found" });
  } catch (err) {
    console.error("ADMIN DELETE USER ERROR:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ==========================================
// 3. MANAGE HR
// GET /api/admin/hrs
// ==========================================
router.get("/hrs", async (req, res) => {
  try {
    const hrs = await HR.find({}).sort({ createdAt: -1 }).lean();
    const jobs = await Job.find({}).lean();
    const apps = await Application.find({}).lean();
    const interviews = await Interview.find({}).lean();

    const result = hrs.map((h) => {
      const hrIdStr = h._id.toString();
      const hrJobs = jobs.filter((j) => j.hrId?.toString() === hrIdStr || j.hrEmail === h.email);
      const hrJobIds = hrJobs.map((j) => j._id.toString());

      const hrApps = apps.filter((a) => a.hrId?.toString() === hrIdStr || hrJobIds.includes(a.jobId?.toString()));
      const hrInterviews = interviews.filter((i) => i.hrId?.toString() === hrIdStr);

      return {
        _id: h._id,
        name: h.name,
        email: h.email,
        phone: h.phone || "",
        company: h.company || "N/A",
        department: h.department || "N/A",
        jobsPosted: hrJobs.length,
        applicationsReceived: hrApps.length,
        interviewsScheduled: hrInterviews.length,
        status: h.status || (h.isActive === false ? "Inactive" : "Active"),
        isActive: h.isActive !== false,
        joinedDate: h.createdAt,
      };
    });

    return res.json({ success: true, hrs: result });
  } catch (err) {
    console.error("ADMIN GET HRS ERROR:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

// Detailed HR Profile
// GET /api/admin/hrs/:id
router.get("/hrs/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const hr = await HR.findById(id).lean();
    if (!hr) {
      return res.status(404).json({ success: false, message: "HR account not found" });
    }

    const hrIdStr = hr._id.toString();
    const jobs = await Job.find({ $or: [{ hrId: id }, { hrEmail: hr.email }] }).sort({ createdAt: -1 }).lean();
    const jobIds = jobs.map((j) => j._id);

    const apps = await Application.find({ $or: [{ hrId: id }, { jobId: { $in: jobIds } }] }).lean();
    const interviews = await Interview.find({ hrId: id }).lean();

    const jobsWithStats = jobs.map((j) => {
      const jIdStr = j._id.toString();
      const jApps = apps.filter((a) => a.jobId?.toString() === jIdStr);
      return {
        _id: j._id,
        title: j.title,
        location: j.location,
        postedDate: j.postedDate || j.createdAt,
        company: j.company,
        applicationsCount: jApps.length,
        acceptedCount: jApps.filter((a) => ["Accepted", "Interview Scheduled", "Interview Invited"].includes(a.status)).length,
        rejectedCount: jApps.filter((a) => a.status === "Rejected").length,
        pendingCount: jApps.filter((a) => ["Applied", "Pending", "Shortlisted"].includes(a.status)).length,
      };
    });

    const stats = {
      totalJobs: jobs.length,
      totalApplications: apps.length,
      acceptedCandidates: apps.filter((a) => ["Accepted", "Interview Scheduled", "Interview Invited"].includes(a.status)).length,
      rejectedCandidates: apps.filter((a) => a.status === "Rejected").length,
      pendingApplications: apps.filter((a) => ["Applied", "Pending", "Shortlisted"].includes(a.status)).length,
      interviewsScheduled: interviews.length,
    };

    return res.json({
      success: true,
      hr: {
        _id: hr._id,
        name: hr.name,
        email: hr.email,
        company: hr.company,
        department: hr.department,
        phone: hr.phone,
        status: hr.status || (hr.isActive === false ? "Inactive" : "Active"),
        isActive: hr.isActive !== false,
        joinedDate: hr.createdAt,
      },
      stats,
      jobs: jobsWithStats,
    });
  } catch (err) {
    console.error("ADMIN GET HR DETAILS ERROR:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

// Toggle HR Status
// PUT /api/admin/hrs/:id/status
router.put("/hrs/:id/status", async (req, res) => {
  try {
    const { id } = req.params;
    const { status, isActive } = req.body;

    let hr = await HR.findById(id);
    if (!hr) {
      return res.status(404).json({ success: false, message: "HR not found" });
    }

    hr.isActive = typeof isActive === "boolean" ? isActive : hr.isActive === false ? true : false;
    hr.status = status || (hr.isActive ? "Active" : "Inactive");
    await hr.save();

    return res.json({ success: true, hr });
  } catch (err) {
    console.error("ADMIN HR STATUS UPDATE ERROR:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE HR
// DELETE /api/admin/hrs/:id
router.delete("/hrs/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const hrDel = await HR.findByIdAndDelete(id);
    if (!hrDel) return res.status(404).json({ success: false, message: "HR not found" });
    return res.json({ success: true, message: "HR deleted successfully" });
  } catch (err) {
    console.error("ADMIN DELETE HR ERROR:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ==========================================
// 4. VIEW APPLICATIONS
// GET /api/admin/applications
// ==========================================
router.get("/applications", async (req, res) => {
  try {
    const apps = await Application.find({})
      .populate("candidateId", "name email phone skills education experience resume location projects certificates")
      .populate("jobId", "title company location requiredSkills educationRequirement experience description salary")
      .populate("hrId", "name email company department")
      .sort({ appliedDate: -1, createdAt: -1 })
      .lean();

    const interviews = await Interview.find({}).lean();
    const interviewMap = {};
    interviews.forEach((inv) => {
      const appIdStr = inv.applicationId?.toString();
      if (appIdStr) interviewMap[appIdStr] = inv;
    });

    const formattedApps = apps.map((app) => {
      const inv = interviewMap[app._id.toString()];
      return {
        _id: app._id,
        candidateName: app.candidateName || app.candidateId?.name || "N/A",
        candidateEmail: app.candidateEmail || app.candidateId?.email || "N/A",
        candidatePhone: app.candidateId?.phone || app.phone || "N/A",
        jobTitle: app.jobId?.title || app.jobTitle || "N/A",
        company: app.jobId?.company || app.company || "N/A",
        hrName: app.hrId?.name || app.hrName || "N/A",
        hrEmail: app.hrId?.email || app.hrEmail || "N/A",
        atsScore: app.matchScore || app.atsScore || app.overallScore || 0,
        appliedDate: app.appliedDate || app.createdAt,
        status: app.status || "Pending",
        interviewStatus: inv ? inv.status || "Scheduled" : app.interviewDetails?.status || "Not Scheduled",
        interviewDate: inv ? inv.date : app.interviewDetails?.date || null,
        interviewTime: inv ? inv.time : app.interviewDetails?.time || null,
        resume: app.resume || app.candidateId?.resume || "",
        matchBreakdown: app.matchBreakdown || null,
        candidateDetails: app.candidateId || null,
        jobDetails: app.jobId || null,
      };
    });

    return res.json({ success: true, applications: formattedApps });
  } catch (err) {
    console.error("ADMIN GET APPLICATIONS ERROR:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

// Single Application Details
// GET /api/admin/applications/:id
router.get("/applications/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const app = await Application.findById(id)
      .populate("candidateId")
      .populate("jobId")
      .populate("hrId")
      .lean();

    if (!app) {
      return res.status(404).json({ success: false, message: "Application not found" });
    }

    const interview = await Interview.findOne({ applicationId: app._id }).lean();

    return res.json({
      success: true,
      application: {
        ...app,
        interview,
      },
    });
  } catch (err) {
    console.error("ADMIN GET SINGLE APPLICATION ERROR:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ==========================================
// 5. JOBS MANAGEMENT
// GET /api/admin/jobs
// ==========================================
router.get("/jobs", async (req, res) => {
  try {
    const jobs = await Job.find({}).populate("hrId", "name email company").sort({ postedDate: -1, createdAt: -1 }).lean();
    const apps = await Application.find({}, "jobId status matchScore atsScore overallScore").lean();

    const formattedJobs = jobs.map((j) => {
      const jIdStr = j._id.toString();
      const jApps = apps.filter((a) => a.jobId?.toString() === jIdStr);
      const qualified = jApps.filter((a) => (a.matchScore || a.atsScore || a.overallScore || 0) >= 60);
      const accepted = jApps.filter((a) => ["Accepted", "Interview Scheduled", "Interview Invited"].includes(a.status));
      const rejected = jApps.filter((a) => a.status === "Rejected");

      return {
        _id: j._id,
        title: j.title,
        company: j.company,
        location: j.location,
        hrName: j.hrName || j.hrId?.name || "N/A",
        hrEmail: j.hrEmail || j.hrId?.email || "N/A",
        postedDate: j.postedDate || j.createdAt,
        applicationsCount: jApps.length,
        qualifiedCount: qualified.length,
        acceptedCount: accepted.length,
        rejectedCount: rejected.length,
        status: j.lastDate && new Date(j.lastDate) < new Date() ? "Closed" : "Active",
        description: j.description,
        requiredSkills: j.requiredSkills || j.skills || [],
        salary: j.salary,
        experience: j.experience,
      };
    });

    return res.json({ success: true, jobs: formattedJobs });
  } catch (err) {
    console.error("ADMIN GET JOBS ERROR:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ==========================================
// 6. ANALYTICS DASHBOARD
// GET /api/admin/analytics
// ==========================================
router.get("/analytics", async (req, res) => {
  try {
    const { period, jobId, company, hrId } = req.query;
    const startDate = getStartDateFromPeriod(period);

    // Build filters
    const appFilter = {};
    if (startDate) appFilter.appliedDate = { $gte: startDate };
    if (jobId) appFilter.jobId = jobId;
    if (company) appFilter.company = company;
    if (hrId) appFilter.hrId = hrId;

    const [apps, jobs, users, hrs, interviews] = await Promise.all([
      Application.find(appFilter).populate("jobId", "title company").populate("candidateId", "createdAt").lean(),
      Job.find(startDate ? { postedDate: { $gte: startDate } } : {}).lean(),
      User.find(startDate ? { createdAt: { $gte: startDate } } : {}).lean(),
      HR.find(startDate ? { createdAt: { $gte: startDate } } : {}).lean(),
      Interview.find(startDate ? { createdAt: { $gte: startDate } } : {}).lean(),
    ]);

    // 1. Applications Trend Over Time
    const timeTrendMap = {};
    apps.forEach((a) => {
      const dt = new Date(a.appliedDate || a.createdAt);
      const key = period === "today" 
        ? `${dt.getHours().toString().padStart(2, '0')}:00` 
        : period === "7days" || period === "30days"
        ? dt.toLocaleDateString("en-US", { month: "short", day: "numeric" })
        : dt.toLocaleDateString("en-US", { month: "short", year: "2-digit" });

      timeTrendMap[key] = (timeTrendMap[key] || 0) + 1;
    });

    const applicationsTrend = Object.keys(timeTrendMap).map((k) => ({
      date: k,
      Applications: timeTrendMap[k],
    }));

    // 2. Applications by Job & Job Demand
    const jobAppCountMap = {};
    apps.forEach((a) => {
      const jTitle = a.jobTitle || a.jobId?.title || "Unknown Job";
      jobAppCountMap[jTitle] = (jobAppCountMap[jTitle] || 0) + 1;
    });

    const applicationsByJob = Object.keys(jobAppCountMap).map((title) => ({
      jobTitle: title,
      Applications: jobAppCountMap[title],
    })).sort((a, b) => b.Applications - a.Applications);

    const sortedJobCounts = [...applicationsByJob];
    const mostAppliedJob = sortedJobCounts[0]?.jobTitle || "None";
    const leastAppliedJob = sortedJobCounts[sortedJobCounts.length - 1]?.jobTitle || "None";
    const totalJobsWithApps = sortedJobCounts.length || 1;
    const avgAppsPerJob = (apps.length / totalJobsWithApps).toFixed(1);

    // 3. Application Status Distribution
    const statusCounts = {
      Accepted: 0,
      Rejected: 0,
      Pending: 0,
      Shortlisted: 0,
      "Interview Scheduled": 0,
    };

    apps.forEach((a) => {
      const st = a.status || "Pending";
      if (st === "Accepted" || st === "Interview Confirmed") statusCounts.Accepted++;
      else if (st === "Rejected") statusCounts.Rejected++;
      else if (st === "Interview Scheduled" || st === "Interview Invited") statusCounts["Interview Scheduled"]++;
      else if (st === "Shortlisted" || st === "Qualified") statusCounts.Shortlisted++;
      else statusCounts.Pending++;
    });

    const applicationStatusDistribution = [
      { name: "Accepted", count: statusCounts.Accepted, color: "#2563eb" },
      { name: "Interview Scheduled", count: statusCounts["Interview Scheduled"], color: "#3b82f6" },
      { name: "Shortlisted", count: statusCounts.Shortlisted, color: "#60a5fa" },
      { name: "Pending Review", count: statusCounts.Pending, color: "#94a3b8" },
      { name: "Rejected", count: statusCounts.Rejected, color: "#cbd5e1" },
    ];

    // 4. ATS Score Analytics
    const scores = apps.map((a) => a.matchScore || a.atsScore || a.overallScore || 0);
    const avgAtsScore = scores.length ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1) : 0;
    const highestAtsScore = scores.length ? Math.max(...scores) : 0;
    const lowestAtsScore = scores.length ? Math.min(...scores) : 0;
    const qualifiedCandidates = scores.filter((s) => s >= 60).length;
    const notQualifiedCandidates = scores.length - qualifiedCandidates;

    const atsRanges = { "0-20": 0, "21-40": 0, "41-60": 0, "61-80": 0, "81-100": 0 };
    scores.forEach((s) => {
      if (s <= 20) atsRanges["0-20"]++;
      else if (s <= 40) atsRanges["21-40"]++;
      else if (s <= 60) atsRanges["41-60"]++;
      else if (s <= 80) atsRanges["61-80"]++;
      else atsRanges["81-100"]++;
    });

    const atsDistribution = Object.keys(atsRanges).map((range) => ({
      range,
      candidates: atsRanges[range],
    }));

    // 5. User Growth & Distribution
    const userRoleCounts = { Candidate: users.length, HR: hrs.length, Admin: 1 };
    const userDistribution = [
      { name: "Candidates", value: userRoleCounts.Candidate, color: "#2563eb" },
      { name: "HR Accounts", value: userRoleCounts.HR, color: "#3b82f6" },
      { name: "Admins", value: userRoleCounts.Admin, color: "#1e293b" },
    ];

    // 6. HR Analytics
    const hrAppMap = {};
    const hrJobMap = {};
    jobs.forEach((j) => {
      const name = j.hrName || "Unknown HR";
      hrJobMap[name] = (hrJobMap[name] || 0) + 1;
    });
    apps.forEach((a) => {
      const name = a.hrName || a.hrId?.name || "Unknown HR";
      hrAppMap[name] = (hrAppMap[name] || 0) + 1;
    });

    const hrNames = Array.from(new Set([...Object.keys(hrJobMap), ...Object.keys(hrAppMap)]));
    const hrAnalytics = hrNames.map((name) => ({
      hrName: name,
      jobsPosted: hrJobMap[name] || 0,
      applicationsReceived: hrAppMap[name] || 0,
    }));

    // 7. Company Analytics
    const companyAppMap = {};
    apps.forEach((a) => {
      const comp = a.company || a.jobId?.company || "General";
      companyAppMap[comp] = (companyAppMap[comp] || 0) + 1;
    });

    const companyAnalytics = Object.keys(companyAppMap).map((comp) => ({
      company: comp,
      applications: companyAppMap[comp],
    })).sort((a, b) => b.applications - a.applications);

    // 8. Interview Analytics
    const interviewStatusMap = { Scheduled: 0, Completed: 0, Rescheduled: 0, Cancelled: 0 };
    interviews.forEach((inv) => {
      const st = inv.status || "Scheduled";
      if (st.includes("Resched")) interviewStatusMap.Rescheduled++;
      else if (st === "Completed") interviewStatusMap.Completed++;
      else if (st === "Cancelled") interviewStatusMap.Cancelled++;
      else interviewStatusMap.Scheduled++;
    });

    return res.json({
      success: true,
      analytics: {
        summaryCards: {
          totalApplications: apps.length,
          avgAtsScore,
          qualifiedRatio: scores.length ? ((qualifiedCandidates / scores.length) * 100).toFixed(1) : 0,
          totalInterviews: interviews.length,
        },
        applicationsTrend,
        applicationsByJob,
        jobDemand: {
          mostAppliedJob,
          leastAppliedJob,
          avgAppsPerJob,
        },
        applicationStatusDistribution,
        atsAnalytics: {
          avgAtsScore,
          highestAtsScore,
          lowestAtsScore,
          qualifiedCandidates,
          notQualifiedCandidates,
          atsDistribution,
        },
        userDistribution,
        hrAnalytics,
        companyAnalytics,
        interviewStatusMap,
      },
    });
  } catch (err) {
    console.error("ADMIN ANALYTICS ERROR:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ==========================================
// 7. ADMIN SETTINGS (autoActivateHr)
// ==========================================
router.get("/settings", async (req, res) => {
  try {
    const setting = await SystemSetting.findOne({ key: "autoActivateHr" });
    return res.json({
      success: true,
      settings: {
        autoActivateHr: setting ? setting.value !== false : true,
      },
    });
  } catch (err) {
    console.error("ADMIN GET SETTINGS ERROR:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

router.put("/settings", async (req, res) => {
  try {
    const { autoActivateHr } = req.body;
    const isAuto = autoActivateHr !== false;

    await SystemSetting.findOneAndUpdate(
      { key: "autoActivateHr" },
      { value: isAuto },
      { upsert: true, new: true }
    );

    return res.json({
      success: true,
      message: "Admin settings updated successfully",
      settings: {
        autoActivateHr: isAuto,
      },
    });
  } catch (err) {
    console.error("ADMIN UPDATE SETTINGS ERROR:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

export default router;

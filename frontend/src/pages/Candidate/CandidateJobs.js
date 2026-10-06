import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  FiSearch,
  FiMapPin,
  FiBriefcase,
  FiClock,
  FiAward,
  FiFileText,
  FiAlertCircle,
  FiUploadCloud,
  FiCheck,
  FiImage,
  FiCalendar,
  FiArrowLeft,
  FiGrid,
  FiUser,
  FiLogOut
} from "react-icons/fi";
import CandidateNavbar from "./CandidateNavbar";
import "./CandidateJobs.css";

const getPosterUrl = (job) => {
  if (!job) return null;
  const rawPoster = job.selectedPoster || (Array.isArray(job.posters) && job.posters.length > 0 ? job.posters[0] : "");
  if (!rawPoster) return null;

  if (rawPoster.startsWith("http://") || rawPoster.startsWith("https://")) {
    return rawPoster;
  }

  const cleanPath = rawPoster.startsWith("/") ? rawPoster : `/${rawPoster}`;
  return `http://localhost:5002${cleanPath}`;
};

const safeStr = (val) => {
  if (val === null || val === undefined) return "";
  if (typeof val === "string") return val;
  if (typeof val === "number" || typeof val === "boolean") return String(val);
  if (Array.isArray(val)) return val.map(safeStr).join(", ");
  if (typeof val === "object") {
    const candidates = ["name", "title", "text", "value", "label", "degree", "company", "institution"];
    for (const key of candidates) {
      if (typeof val[key] === "string" && val[key]) return val[key];
    }
    return JSON.stringify(val);
  }
  return String(val);
};

const toArray = (val) => (Array.isArray(val) ? val : []);

const safeCertText = (item) => {
  if (!item) return "";
  if (typeof item === "string") return item;
  if (typeof item === "object") {
    const parts = [];
    if (item.name) parts.push(item.name);
    if (item.issuer) parts.push(item.issuer);
    if (item.year) parts.push(item.year);
    if (item.title) parts.push(item.title);
    return parts.length ? parts.join(" · ") : safeStr(item);
  }
  return String(item);
};

function CandidateJobs() {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [appliedJobIds, setAppliedJobIds] = useState(new Set());
  const [loadingJobs, setLoadingJobs] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  const [viewingJob, setViewingJob] = useState(null);
  const [resume, setResume] = useState(null);
  const [existingResume, setExistingResume] = useState(null);
  const [useSavedResume, setUseSavedResume] = useState(true);
  const [applying, setApplying] = useState(false);
  const [message, setMessage] = useState("");
  const [atsResult, setAtsResult] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Search & Filters State
  const [search, setSearch] = useState("");
  const [filterJobType, setFilterJobType] = useState("ALL");
  const [filterLocation, setFilterLocation] = useState("ALL");
  const [filterExperience, setFilterExperience] = useState("ALL");
  const [filterEducation, setFilterEducation] = useState("ALL");

  const user = JSON.parse(localStorage.getItem("user") || "null");
  const userId = user?._id;

  // Candidate Apply Form State
  const [fullName, setFullName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [coverLetter, setCoverLetter] = useState("");

  const handleOpenApply = (job) => {
    setSelectedJob(job);
    setFullName(user?.name || "");
    setEmail(user?.email || "");
    setPhone(user?.phone || "");
    setCoverLetter("");
    setMessage("");
  };

  const fetchJobs = useCallback(async () => {
    setLoadingJobs(true);
    try {
      const res = await axios.get("http://localhost:5002/api/jobs");
      setJobs(res.data || []);
    } catch (error) {
      console.error("Fetch jobs error:", error);
    } finally {
      setLoadingJobs(false);
    }
  }, []);

  const fetchAppliedJobs = useCallback(async () => {
    if (!userId) return;
    try {
      const res = await axios.get(`http://localhost:5002/api/applications/candidate/${userId}`);
      if (res.data && Array.isArray(res.data.applications)) {
        const ids = res.data.applications.map((app) =>
          typeof app.jobId === "object" && app.jobId?._id ? app.jobId._id.toString() : (app.jobId ? app.jobId.toString() : "")
        ).filter(Boolean);
        setAppliedJobIds(new Set(ids));
      }
    } catch (error) {
      console.error("Fetch applied jobs error:", error);
    }
  }, [userId]);

  const fetchCandidateResume = useCallback(async () => {
    if (!userId) return;
    try {
      const res = await axios.get(`http://localhost:5002/api/resume/candidate/${userId}`);
      if (res.data && res.data.resume) {
        setExistingResume(res.data.resume);
        setUseSavedResume(true);
      }
    } catch (error) {
      console.log("No saved resume found for candidate");
    }
  }, [userId]);

  useEffect(() => {
    fetchJobs();
    fetchAppliedJobs();
    fetchCandidateResume();
  }, [fetchJobs, fetchAppliedJobs, fetchCandidateResume]);

  // Handle Application Submit
  const applyJob = async () => {
    if (!user || !user._id) {
      setMessage("User login required.");
      return;
    }

    if (!fullName || !fullName.trim()) {
      setMessage("Please enter your full name.");
      return;
    }
    if (!email || !email.trim()) {
      setMessage("Please enter your email address.");
      return;
    }

    if (appliedJobIds.has(selectedJob._id.toString())) {
      setMessage("You have already submitted an application for this position.");
      return;
    }

    const hasSaved = existingResume && existingResume.fileName;
    if (!useSavedResume && !resume) {
      setMessage("Please choose a resume file.");
      return;
    }
    if (!hasSaved && !resume) {
      setMessage("Please choose a resume file.");
      return;
    }

    const formData = new FormData();
    formData.append("jobId", selectedJob._id);
    formData.append("candidateId", user._id);
    formData.append("candidateName", fullName);
    formData.append("candidateEmail", email);
    formData.append("candidatePhone", phone);
    if (coverLetter) {
      formData.append("coverLetter", coverLetter);
    }
    if (!useSavedResume && resume) {
      formData.append("resume", resume, resume.name);
    } else if (resume && !hasSaved) {
      formData.append("resume", resume, resume.name);
    }

    setApplying(true);
    setMessage("");

    try {
      const response = await axios.post(
        "http://localhost:5002/api/applications/apply",
        formData
      );

      // Add job ID to applied list
      setAppliedJobIds((prev) => new Set([...prev, selectedJob._id.toString()]));

      const appDoc = response.data.application || {};
      const realScore = response.data.matchScore ?? response.data.atsScore ?? appDoc.matchScore ?? 0;
      const realStatus = response.data.status || appDoc.status || (realScore >= 50 ? "Qualified" : "Applied");
      const breakdownObj = response.data.breakdown || appDoc.breakdown || {};

      setAtsResult({
        matchScore: realScore,
        status: realStatus,
        jobTitle: selectedJob.title,
        company: selectedJob.company,
        breakdown: breakdownObj,
        skillsMatchScore: response.data.skillsMatchScore ?? appDoc.skillsMatchScore ?? (breakdownObj.skills !== undefined ? Math.round((breakdownObj.skills / 40) * 100) : 0),
        experienceMatchScore: response.data.experienceMatchScore ?? appDoc.experienceMatchScore ?? (breakdownObj.experience !== undefined ? Math.round((breakdownObj.experience / 20) * 100) : 0),
        educationMatchScore: response.data.educationMatchScore ?? appDoc.educationMatchScore ?? (breakdownObj.education !== undefined ? Math.round((breakdownObj.education / 15) * 100) : 0),
        projectMatchScore: response.data.projectMatchScore ?? appDoc.projectMatchScore ?? (breakdownObj.projects !== undefined ? Math.round((breakdownObj.projects / 15) * 100) : 0),
        certificationsMatchScore: response.data.certificationsMatchScore ?? appDoc.certificationsMatchScore ?? (breakdownObj.certifications !== undefined ? Math.round((breakdownObj.certifications / 5) * 100) : 100),
        completenessMatchScore: response.data.completenessMatchScore ?? appDoc.completenessMatchScore ?? (breakdownObj.resumeCompleteness !== undefined ? Math.round((breakdownObj.resumeCompleteness / 5) * 100) : 100),
        keywordMatchScore: response.data.keywordMatchScore ?? appDoc.keywordMatchScore ?? response.data.textSimilarity ?? 0,
        matchedSkills: response.data.matchedSkills || appDoc.matchedSkills || [],
        missingSkills: response.data.missingSkills || appDoc.missingSkills || [],
        extractedSkills: response.data.extractedSkills || appDoc.extractedSkills || [],
        education: response.data.education || appDoc.education || [],
        experience: response.data.experience || appDoc.experience || [],
        projects: response.data.projects || appDoc.projects || [],
        certifications: response.data.certifications || appDoc.certifications || [],
        candidateName: response.data.candidateName || appDoc.candidateName || user?.name || "",
        candidateEmail: response.data.candidateEmail || appDoc.candidateEmail || user?.email || "",
        candidatePhone: response.data.candidatePhone || appDoc.candidatePhone || user?.phone || "",
      });

      setResume(null);
      setSelectedJob(null);
    } catch (error) {
      console.error("Apply job error:", error);
      setMessage(
        error.response?.data?.message || "Failed to submit application. Please try again."
      );
    } finally {
      setApplying(false);
    }
  };

  // Derive unique filter options
  const locationOptions = Array.from(
    new Set(jobs.map((j) => j.location).filter(Boolean))
  );
  const experienceOptions = Array.from(
    new Set(jobs.map((j) => j.experience).filter(Boolean))
  );
  const educationOptions = Array.from(
    new Set(jobs.map((j) => j.educationRequirement).filter(Boolean))
  );
  const jobTypeOptions = Array.from(
    new Set(jobs.map((j) => j.employmentType).filter(Boolean))
  );

  // Filter Jobs
  const filteredJobs = jobs.filter((job) => {
    const matchesSearch =
      (job.title || "").toLowerCase().includes(search.toLowerCase()) ||
      (job.company || "").toLowerCase().includes(search.toLowerCase()) ||
      (job.location || "").toLowerCase().includes(search.toLowerCase()) ||
      (job.description || "").toLowerCase().includes(search.toLowerCase()) ||
      (job.skills || []).some((s) => s.toLowerCase().includes(search.toLowerCase()));

    const matchesType =
      filterJobType === "ALL" ||
      (job.employmentType || "").toLowerCase() === filterJobType.toLowerCase();

    const matchesLoc =
      filterLocation === "ALL" ||
      (job.location || "").toLowerCase() === filterLocation.toLowerCase();

    const matchesExp =
      filterExperience === "ALL" ||
      (job.experience || "").toLowerCase() === filterExperience.toLowerCase();

    const matchesEdu =
      filterEducation === "ALL" ||
      (job.educationRequirement || "").toLowerCase() === filterEducation.toLowerCase();

    return matchesSearch && matchesType && matchesLoc && matchesExp && matchesEdu;
  });

  const formatApplyByDate = (dateVal) => {
    if (!dateVal) return "Sep 12, 2026";
    try {
      const d = new Date(dateVal);
      if (isNaN(d.getTime())) return String(dateVal);
      return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    } catch (e) {
      return String(dateVal);
    }
  };

  const getSkillsDisplay = (job) => {
    if (Array.isArray(job.skills) && job.skills.length > 0) {
      return job.skills.join(", ");
    }
    if (typeof job.skills === "string" && job.skills.trim()) {
      return job.skills;
    }
    return "HTML, CSS";
  };

  return (
    <div className="candidate-page">
      <CandidateNavbar onToggleSidebar={() => setSidebarOpen((prev) => !prev)} sidebarOpen={sidebarOpen} />

      <div className="candidate-shell">
        {/* Drawer / Sidebar */}
        <aside className={`candidate-sidebar ${sidebarOpen ? "sidebar-open" : "sidebar-collapsed"}`}>
          <div className="sidebar-nav">
            <div className="sidebar-drawer-header">
              <h4>QUICK ACTIONS</h4>
            </div>
            <button
              className="nav-btn"
              onClick={() => {
                navigate("/candidate-dashboard");
                setSidebarOpen(false);
              }}
            >
              <FiGrid className="btn-icon" />
              <span>Dashboard Home</span>
            </button>
            <button
              className="nav-btn"
              onClick={() => {
                navigate("/candidate-job-offers");
                setSidebarOpen(false);
              }}
            >
              <FiAward className="btn-icon" />
              <span>Job Offer</span>
            </button>
            <button
              className="nav-btn"
              onClick={() => {
                navigate("/candidate-profile");
                setSidebarOpen(false);
              }}
            >
              <FiUser className="btn-icon" />
              <span>My Profile</span>
            </button>
            <button
              className="nav-btn active"
              onClick={() => setSidebarOpen(false)}
            >
              <FiSearch className="btn-icon" />
              <span>Explore Jobs</span>
            </button>
            <button
              className="nav-btn"
              onClick={() => {
                navigate("/candidate-applications");
                setSidebarOpen(false);
              }}
            >
              <FiFileText className="btn-icon" />
              <span>My Applications</span>
            </button>
            <button
              className="nav-btn"
              onClick={() => {
                navigate("/candidate-interviews");
                setSidebarOpen(false);
              }}
            >
              <FiCalendar className="btn-icon" />
              <span>My Interviews</span>
            </button>
            <button
              className="nav-btn nav-btn-logout"
              onClick={() => {
                localStorage.removeItem("user");
                navigate("/login");
              }}
            >
              <FiLogOut className="btn-icon" />
              <span>Logout</span>
            </button>
          </div>
        </aside>
        {sidebarOpen && <div className="sidebar-backdrop" onClick={() => setSidebarOpen(false)} />}

        {/* Main Content Area */}
        <main className="candidate-content animate-fade-in">
          <div className="jobs-container">
            {/* Header Row */}
            <div className="jobs-page-header-row">
              <div className="jobs-header-title-block">
                <h1>Explore jobs</h1>
                <p>Browse open positions and apply with your profile.</p>
              </div>
              <div className="jobs-header-count">
                <span>Showing {filteredJobs.length} jobs · Sorted by last date</span>
              </div>
            </div>

        {/* Search & Filter Bar Row */}
        <div className="jobs-search-filter-row">
          <div className="search-input-wrapper-pill">
            <FiSearch className="search-icon-pill" />
            <input
              type="text"
              className="job-search-input-pill"
              placeholder="Search by title, company, or skill"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="filters-dropdowns-row">
            <div className="filter-select-wrapper">
              <select
                value={filterJobType}
                onChange={(e) => setFilterJobType(e.target.value)}
              >
                <option value="ALL">All types</option>
                {jobTypeOptions.map((type, idx) => (
                  <option key={idx} value={type}>{type}</option>
                ))}
              </select>
            </div>

            <div className="filter-select-wrapper">
              <select
                value={filterLocation}
                onChange={(e) => setFilterLocation(e.target.value)}
              >
                <option value="ALL">All locations</option>
                {locationOptions.map((loc, idx) => (
                  <option key={idx} value={loc}>{loc}</option>
                ))}
              </select>
            </div>

            <div className="filter-select-wrapper">
              <select
                value={filterExperience}
                onChange={(e) => setFilterExperience(e.target.value)}
              >
                <option value="ALL">Experience</option>
                {experienceOptions.map((exp, idx) => (
                  <option key={idx} value={exp}>{exp}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Loading / Empty / Jobs Grid */}
        {loadingJobs ? (
          <div className="jobs-grid-skeleton">
            <div className="skeleton-job-card"></div>
            <div className="skeleton-job-card"></div>
            <div className="skeleton-job-card"></div>
            <div className="skeleton-job-card"></div>
          </div>
        ) : filteredJobs.length === 0 ? (
          <div className="jobs-empty-card">
            <FiSearch className="empty-search-icon" />
            <h3>No matching jobs found</h3>
            <p>Try resetting filters or searching with different keywords.</p>
          </div>
        ) : (
          <div className="jobs-grid-layout-2col">
            {filteredJobs.map((job) => {
              const isApplied = appliedJobIds.has(job._id.toString());
              const posterSrc = getPosterUrl(job);
              const deadlineDate = job.lastDate || job.deadline || job.applicationDeadline;

              return (
                <div className="find-job-card" key={job._id}>
                  {/* Top Poster Banner Area */}
                  <div className="job-card-poster-area">
                    <span className="job-card-type-badge">{job.employmentType || "Full time"}</span>
                    <div className="job-card-poster-frame">
                      {posterSrc ? (
                        <img
                          src={posterSrc}
                          alt={`${job.title} Poster`}
                          className="job-card-poster-img"
                          onError={(e) => {
                            e.target.style.display = "none";
                            if (e.target.nextSibling) e.target.nextSibling.style.display = "flex";
                          }}
                        />
                      ) : null}
                      <div className="job-poster-fallback-poster" style={{ display: posterSrc ? "none" : "flex" }}>
                        <div className="fallback-poster-content">
                          <span className="fb-hiring-tag">WE ARE HIRING</span>
                          <h4 className="fb-job-title">{job.title}</h4>
                          <div className="fb-info-box">
                            <p className="fb-comp">COMPANY {job.company || "Abc"}</p>
                            <p className="fb-loc">LOCATION {job.location ? job.location.toUpperCase() : "AHMEDABAD"}</p>
                            <p className="fb-type">{job.employmentType || "Full time"}</p>
                          </div>
                          <div className="fb-btn-pill">APPLY NOW</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="find-job-card-body">
                    {/* Company avatar + Title */}
                    <div className="job-header-info-row">
                      <div className="job-company-avatar">
                        {(job.company || "A").charAt(0).toUpperCase()}
                      </div>
                      <div className="job-title-meta">
                        <h3>{job.title}</h3>
                        <p className="job-company-subtitle">{job.company || "Abc"}</p>
                      </div>
                    </div>

                    {/* Chips Row */}
                    <div className="job-chips-pill-row">
                      <span className="job-chip-pill">
                        <FiMapPin /> {job.location || "Ahmedabad"}
                      </span>
                      <span className="job-chip-pill">
                        <FiClock /> {job.experience || "0 to 2 years"}
                      </span>
                      <span className="job-chip-pill">
                        <FiAward /> {job.educationRequirement || "BCA"}
                      </span>
                    </div>

                    {/* Skills & Deadline */}
                    <div className="job-skills-deadline-row">
                      <span className="job-skills-text">
                        Skills: <strong>{getSkillsDisplay(job)}</strong>
                      </span>
                      <span className="job-deadline-text">
                        <FiCalendar /> Apply by <strong>{formatApplyByDate(deadlineDate)}</strong>
                      </span>
                    </div>

                    {/* Action Buttons */}
                    <div className="job-actions-grid-row">
                      <button
                        type="button"
                        className="btn-view-job-outline"
                        onClick={() => setViewingJob(job)}
                      >
                        View job
                      </button>
                      {isApplied ? (
                        <button type="button" className="btn-apply-job-solid btn-applied" disabled>
                          <FiCheck /> Applied
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="btn-apply-job-solid"
                          onClick={() => handleOpenApply(job)}
                        >
                          Apply now
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
          </div>
        </main>
      </div>

      {/* ==================== JOB DETAILS MODAL ==================== */}
      {viewingJob && (
        <div className="ats-overlay" onClick={() => setViewingJob(null)}>
          <div className="job-details-modal-blue" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-blue">
              <div>
                <h2>{viewingJob.title}</h2>
                <p className="modal-company">{viewingJob.company}</p>
              </div>
              <button className="close-btn-blue" onClick={() => setViewingJob(null)}>✕</button>
            </div>

            {/* Full Job Poster Preview */}
            {getPosterUrl(viewingJob) && (
              <div style={{ width: "100%", display: "flex", justifyContent: "center", alignItems: "center", background: "#D6E9F2", border: "1px solid #BFDBFE", borderRadius: "12px", padding: "12px", marginBottom: "20px" }}>
                <img
                  src={getPosterUrl(viewingJob)}
                  alt={`${viewingJob.title} Poster`}
                  style={{ width: "100%", height: "auto", maxHeight: "380px", objectFit: "contain", borderRadius: "8px", display: "block" }}
                  onError={(e) => {
                    e.target.style.display = "none";
                  }}
                />
              </div>
            )}

            <div className="job-details-info-grid">
              <div className="info-box">
                <span className="box-lbl"><FiMapPin /> Location</span>
                <span className="box-val">{viewingJob.location || "Not specified"}</span>
              </div>
              <div className="info-box">
                <span className="box-lbl"><FiBriefcase /> Job Type</span>
                <span className="box-val">{viewingJob.employmentType || "Full-time"}</span>
              </div>
              <div className="info-box">
                <span className="box-lbl"><FiClock /> Experience Required</span>
                <span className="box-val">{viewingJob.experience || "Fresher"}</span>
              </div>
              <div className="info-box">
                <span className="box-lbl"><FiAward /> Education Required</span>
                <span className="box-val">{viewingJob.educationRequirement || "Any Education"}</span>
              </div>
              <div className="info-box">
                <span className="box-lbl"><FiCalendar /> Last Date</span>
                <span className="box-val">{viewingJob.lastDate ? new Date(viewingJob.lastDate).toLocaleDateString() : (viewingJob.deadline ? new Date(viewingJob.deadline).toLocaleDateString() : (viewingJob.applicationDeadline ? new Date(viewingJob.applicationDeadline).toLocaleDateString() : "Open"))}</span>
              </div>
            </div>

            <div className="job-details-body">
              <h3>Required Skills</h3>
              <div className="skills-tags-row">
                {(viewingJob.skills || []).map((skill, index) => (
                  <span key={index} className="skill-pill-blue">{skill}</span>
                ))}
              </div>

              <h3>Job Description</h3>
              <p className="description-text">{viewingJob.description || "No description provided."}</p>

              {viewingJob.responsibilities && (
                <>
                  <h3>Responsibilities</h3>
                  <p className="description-text">{viewingJob.responsibilities}</p>
                </>
              )}

              {viewingJob.qualifications && (
                <>
                  <h3>Qualifications</h3>
                  <p className="description-text">{viewingJob.qualifications}</p>
                </>
              )}
            </div>

            <div className="modal-footer-blue">
              {appliedJobIds.has(viewingJob._id.toString()) ? (
                <button className="btn-applied-disabled" disabled>
                  <FiCheck /> Application Submitted
                </button>
              ) : (
                <button
                  className="btn-primary-blue"
                  onClick={() => {
                    const currentJob = viewingJob;
                    setViewingJob(null);
                    handleOpenApply(currentJob);
                  }}
                >
                  Apply Now
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ==================== APPLY JOB RESUME UPLOAD MODAL ==================== */}
      {selectedJob && (
        <div className="ats-overlay" onClick={() => setSelectedJob(null)}>
          <div className="apply-modal-blue" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-blue">
              <h2>Apply for {selectedJob.title}</h2>
              <button className="close-btn-blue" onClick={() => setSelectedJob(null)}>✕</button>
            </div>

            {/* Selected Job Information Card */}
            <div className="apply-job-info-card">
              <div className="info-card-header">
                <h3>{selectedJob.title}</h3>
              </div>
              <div className="info-card-grid">
                <p><strong>Company:</strong> {selectedJob.company || "Not specified"}</p>
                <p><strong>Location:</strong> {selectedJob.location || "Not specified"}</p>
                <p><strong>Experience:</strong> {selectedJob.experience || "Fresher"}</p>
                {selectedJob.salary && <p><strong>Salary:</strong> {selectedJob.salary}</p>}
                <p><strong>Last Date:</strong> {selectedJob.lastDate ? new Date(selectedJob.lastDate).toLocaleDateString() : (selectedJob.deadline ? new Date(selectedJob.deadline).toLocaleDateString() : (selectedJob.applicationDeadline ? new Date(selectedJob.applicationDeadline).toLocaleDateString() : "Open"))}</p>
              </div>
            </div>

            {/* Application Form */}
            <form className="apply-form-body" onSubmit={(e) => { e.preventDefault(); applyJob(); }}>
              <div className="form-field-group">
                <label className="field-label">Full Name</label>
                <input
                  type="text"
                  className="ats-form-input"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>

              <div className="form-field-group">
                <label className="field-label">Email</label>
                <input
                  type="email"
                  className="ats-form-input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className="form-field-group">
                <label className="field-label">Phone</label>
                <input
                  type="tel"
                  className="ats-form-input"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>

              <div className="form-field-group">
                <label className="field-label">Resume</label>
                {existingResume && existingResume.fileName ? (
                  <div className="resume-source-card">
                    <p className="resume-source-title">Select Resume Source:</p>
                    
                    <label className="resume-radio-label">
                      <input
                        type="radio"
                        name="resumeChoice"
                        checked={useSavedResume}
                        onChange={() => setUseSavedResume(true)}
                        className="ats-radio-input"
                      />
                      <span>⚡ <strong>Use Saved Resume:</strong> {existingResume.fileName}</span>
                    </label>

                    <label className="resume-radio-label">
                      <input
                        type="radio"
                        name="resumeChoice"
                        checked={!useSavedResume}
                        onChange={() => setUseSavedResume(false)}
                        className="ats-radio-input"
                      />
                      <span>📁 Upload a new resume file</span>
                    </label>
                  </div>
                ) : null}

                {(!existingResume || !useSavedResume) && (
                  <div className="resume-upload-dropzone">
                    <FiUploadCloud className="upload-icon" />
                    <label htmlFor="resume-file-input" className="file-input-label">
                      Choose Resume
                    </label>
                    <input
                      id="resume-file-input"
                      type="file"
                      accept=".pdf,.doc,.docx"
                      onChange={(e) => {
                        setResume(e.target.files[0]);
                        setMessage("");
                      }}
                    />
                    {resume && (
                      <p className="selected-filename">Selected File: <strong>{resume.name}</strong></p>
                    )}
                  </div>
                )}
              </div>

              <div className="form-field-group">
                <label className="field-label">Cover Letter</label>
                <textarea
                  className="ats-form-textarea"
                  rows="3"
                  value={coverLetter}
                  onChange={(e) => setCoverLetter(e.target.value)}
                />
              </div>

              {message && (
                <div className="apply-alert-box">
                  <FiAlertCircle className="alert-icon" /> {message}
                </div>
              )}

              <div className="modal-footer-blue">
                <button
                  type="button"
                  className="btn-secondary-blue"
                  onClick={() => setSelectedJob(null)}
                  disabled={applying}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary-blue"
                  disabled={applying}
                >
                  {applying ? "Submitting Application..." : "Submit Application"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== FIRST ATS SCAN COMPLETED MODAL ==================== */}
      {atsResult && (
        <div className="ats-overlay" onClick={() => setAtsResult(null)}>
          <div className="ats-results-card-blue" onClick={(e) => e.stopPropagation()}>
            <button className="ats-close-btn" onClick={() => setAtsResult(null)}>✕</button>

            <div className="ats-results-header" style={{ textAlign: "center", marginBottom: "16px" }}>
              <h2 style={{ fontSize: "1.35rem", fontWeight: "800", color: "#000000", margin: "0 0 6px 0" }}>Resume Scanning Complete</h2>
              <p className="ats-job-title" style={{ fontSize: "0.9rem", color: "#000000", fontWeight: "700", margin: 0 }}>
                Matching your resume with <strong>{atsResult.jobTitle}</strong> {atsResult.company ? `at ${atsResult.company}` : ""}
              </p>
            </div>

            <div style={{ height: "1px", background: "#BFDBFE", margin: "16px 0" }} />

            {/* THIS MATCH SECTION */}
            <div className="ats-score-section" style={{ textAlign: "center", padding: "8px 0" }}>
              <span style={{ fontSize: "0.8rem", fontWeight: "800", color: "#000000", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                MATCH SCORE
              </span>

              <div className="ats-score-circle-blue" style={{ margin: "12px auto" }}>
                <span className="score-number">{atsResult.matchScore}</span>
                <span className="score-percent">%</span>
              </div>

              <p style={{ fontSize: "0.9rem", color: "#000000", margin: "6px 0 12px 0", fontWeight: "600" }}>
                Your resume matches this job by <strong>{atsResult.matchScore}%</strong>.
              </p>

              <div className="ats-status-section" style={{ textAlign: "center", marginBottom: "12px" }}>
                <span className="status-pill">
                  {atsResult.status}
                </span>
              </div>
            </div>

            <div style={{ height: "1px", background: "#BFDBFE", margin: "16px 0" }} />

            {/* Score Breakdown Section — Match Details */}
            <div className="ats-breakdown-box">
              <h3 style={{ fontSize: "0.92rem", fontWeight: "800", color: "#000000", margin: "0 0 12px 0", textTransform: "uppercase" }}>Match Details</h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", color: "#000000" }}>
                  <span>Skills</span>
                  <strong>{atsResult.skillsMatchScore}%</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", color: "#000000" }}>
                  <span>Experience</span>
                  <strong>{atsResult.experienceMatchScore}%</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", color: "#000000" }}>
                  <span>Education</span>
                  <strong>{atsResult.educationMatchScore}%</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", color: "#000000" }}>
                  <span>Projects</span>
                  <strong>{atsResult.projectMatchScore}%</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", color: "#000000" }}>
                  <span>Certifications</span>
                  <strong>{atsResult.certificationsMatchScore}%</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", color: "#000000" }}>
                  <span>Completeness</span>
                  <strong>{atsResult.completenessMatchScore}%</strong>
                </div>
              </div>
            </div>

            {/* Matched & Missing Skills Section */}
            {(toArray(atsResult.matchedSkills).length > 0 || toArray(atsResult.missingSkills).length > 0) && (
              <div className="ats-skills-container">
                {toArray(atsResult.matchedSkills).length > 0 && (
                  <div style={{ marginBottom: toArray(atsResult.missingSkills).length > 0 ? "14px" : "0" }}>
                    <h4 style={{ fontSize: "0.8rem", fontWeight: "800", color: "#000000", textTransform: "uppercase", margin: "0 0 8px 0" }}>Matched Skills</h4>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                      {toArray(atsResult.matchedSkills).map((s, idx) => (
                        <span key={idx} className="skill-pill-blue">
                          ✓ {safeStr(s)}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {toArray(atsResult.missingSkills).length > 0 && (
                  <div>
                    <h4 style={{ fontSize: "0.8rem", fontWeight: "800", color: "#000000", textTransform: "uppercase", margin: "0 0 8px 0" }}>Missing Skills</h4>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                      {toArray(atsResult.missingSkills).map((s, idx) => (
                        <span key={idx} className="skill-pill-blue">
                          • {safeStr(s)}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Extracted Resume Information */}
            <div className="ats-resume-info-box">
              <h3 style={{ fontSize: "0.92rem", fontWeight: "800", color: "#000000", margin: "0 0 14px 0", textTransform: "uppercase" }}>Extracted Resume Details</h3>
              
              {/* Personal Info */}
              {(atsResult.candidateName || atsResult.candidateEmail || atsResult.candidatePhone) && (
                <div style={{ marginBottom: "14px", borderBottom: "1px solid #BFDBFE", paddingBottom: "10px" }}>
                  <h4 style={{ fontSize: "0.78rem", fontWeight: "800", color: "#000000", textTransform: "uppercase", margin: "0 0 6px 0" }}>Personal Information</h4>
                  <p style={{ fontSize: "0.85rem", color: "#000000", margin: "3px 0" }}><strong>Name:</strong> {safeStr(atsResult.candidateName)}</p>
                  <p style={{ fontSize: "0.85rem", color: "#000000", margin: "3px 0" }}><strong>Email:</strong> {safeStr(atsResult.candidateEmail)}</p>
                  {atsResult.candidatePhone && <p style={{ fontSize: "0.85rem", color: "#000000", margin: "3px 0" }}><strong>Phone:</strong> {safeStr(atsResult.candidatePhone)}</p>}
                </div>
              )}

              {/* All Extracted Skills */}
              {toArray(atsResult.extractedSkills).length > 0 && (
                <div style={{ marginBottom: "14px", borderBottom: "1px solid #BFDBFE", paddingBottom: "10px" }}>
                  <h4 style={{ fontSize: "0.78rem", fontWeight: "800", color: "#000000", textTransform: "uppercase", margin: "0 0 8px 0" }}>All Extracted Skills</h4>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                    {toArray(atsResult.extractedSkills).map((s, idx) => (
                      <span key={idx} className="skill-pill-blue">{safeStr(s)}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Education */}
              {toArray(atsResult.education).length > 0 && (
                <div style={{ marginBottom: "14px", borderBottom: "1px solid #BFDBFE", paddingBottom: "10px" }}>
                  <h4 style={{ fontSize: "0.78rem", fontWeight: "800", color: "#000000", textTransform: "uppercase", margin: "0 0 8px 0" }}>Education</h4>
                  {toArray(atsResult.education).map((edu, idx) => (
                    <div key={idx} style={{ marginBottom: "8px" }}>
                      <p style={{ fontSize: "0.85rem", fontWeight: "700", color: "#000000", margin: 0 }}>{safeStr(edu.degree || edu.institution)}</p>
                      {edu.institution && <p style={{ fontSize: "0.82rem", color: "#000000", margin: "2px 0" }}>{safeStr(edu.institution)}</p>}
                      <div style={{ display: "flex", gap: "10px", fontSize: "0.8rem", color: "#000000", fontWeight: "600" }}>
                        {edu.year && <span>Year: {safeStr(edu.year)}</span>}
                        {edu.cgpa && <span>CGPA: {safeStr(edu.cgpa)}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Experience */}
              {toArray(atsResult.experience).length > 0 && (
                <div style={{ marginBottom: "14px", borderBottom: "1px solid #BFDBFE", paddingBottom: "10px" }}>
                  <h4 style={{ fontSize: "0.78rem", fontWeight: "800", color: "#000000", textTransform: "uppercase", margin: "0 0 8px 0" }}>Work Experience</h4>
                  {toArray(atsResult.experience).map((exp, idx) => (
                    <div key={idx} style={{ marginBottom: "10px" }}>
                      <p style={{ fontSize: "0.85rem", fontWeight: "700", color: "#000000", margin: "0" }}>{safeStr(exp.title || exp.company)}</p>
                      {exp.company && <p style={{ fontSize: "0.82rem", color: "#000000", fontWeight: "700", margin: "2px 0" }}>{safeStr(exp.company)} {exp.duration && `(${safeStr(exp.duration)})`}</p>}
                      {exp.description && <p style={{ fontSize: "0.82rem", color: "#000000", margin: "4px 0 0 0", whiteSpace: "pre-line" }}>{safeStr(exp.description)}</p>}
                    </div>
                  ))}
                </div>
              )}

              {/* Projects */}
              {toArray(atsResult.projects).length > 0 && (
                <div style={{ marginBottom: "14px", borderBottom: toArray(atsResult.certifications).length > 0 ? "1px solid #BFDBFE" : "none", paddingBottom: "10px" }}>
                  <h4 style={{ fontSize: "0.78rem", fontWeight: "800", color: "#000000", textTransform: "uppercase", margin: "0 0 8px 0" }}>Projects</h4>
                  {toArray(atsResult.projects).map((proj, idx) => (
                    <div key={idx} style={{ marginBottom: "10px" }}>
                      <p style={{ fontSize: "0.85rem", fontWeight: "700", color: "#000000", margin: "0" }}>{safeStr(proj.name)}</p>
                      {toArray(proj.technologies).length > 0 && (
                        <p style={{ fontSize: "0.82rem", color: "#000000", fontWeight: "700", margin: "2px 0" }}>
                          Technologies: {toArray(proj.technologies).map(safeStr).join(" • ")}
                        </p>
                      )}
                      {proj.description && <p style={{ fontSize: "0.82rem", color: "#000000", margin: "4px 0 0 0", whiteSpace: "pre-line" }}>{safeStr(proj.description)}</p>}
                    </div>
                  ))}
                </div>
              )}

              {/* Certifications */}
              {toArray(atsResult.certifications).length > 0 && (
                <div>
                  <h4 style={{ fontSize: "0.78rem", fontWeight: "800", color: "#000000", textTransform: "uppercase", margin: "0 0 8px 0" }}>Certifications</h4>
                  {toArray(atsResult.certifications).map((cert, idx) => (
                    <p key={idx} style={{ fontSize: "0.85rem", color: "#000000", margin: "3px 0" }}>
                      • {safeCertText(cert)}
                    </p>
                  ))}
                </div>
              )}
            </div>

            <button className="full-width-btn" onClick={() => setAtsResult(null)}>
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default CandidateJobs;
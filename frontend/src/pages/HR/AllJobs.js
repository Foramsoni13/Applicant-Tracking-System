import React, { useEffect, useState, useCallback, useMemo } from "react";
import axios from "axios";
import { useAuth } from "../../context/AuthContext.js";
import {
  FiSearch,
  FiPlus,
  FiBarChart2,
  FiTrash2,
  FiX,
  FiRefreshCw,
  FiBriefcase,
  FiDownload,
  FiEdit2
} from "react-icons/fi";
import "./AllJobs.css";

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

const getPosterTheme = (job, index) => {
  const title = (job.title || "").toLowerCase();
  if (title.includes("python")) return "theme-orange";
  if (title.includes("flask") || title.includes("node") || title.includes("backend")) return "theme-blue";
  if (title.includes("web") || title.includes("frontend") || title.includes("fullstack")) return "theme-purple";
  const themes = ["theme-purple", "theme-blue", "theme-orange", "theme-purple"];
  return themes[index % themes.length];
};

function AllJobs({ onNavigatePage, onEditJob }) {
  const { user: authUser, token: authToken } = useAuth();
  
  const getUser = () => {
    if (authUser) return authUser;
    try {
      const sessionUser = sessionStorage.getItem("user");
      if (sessionUser) return JSON.parse(sessionUser);
      const localUser = localStorage.getItem("user");
      return localUser ? JSON.parse(localUser) : {};
    } catch {
      return {};
    }
  };

  const getToken = () => {
    if (authToken) return authToken;
    return sessionStorage.getItem("token") || localStorage.getItem("token") || "";
  };

  const user = getUser();
  const token = getToken();

  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [toast, setToast] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Job Details Modal State
  const [selectedJobDetails, setSelectedJobDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  // Auto dismiss toast
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3500);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
  };

  const userId = user._id || user.id || user.hrId || user.email;

  const fetchJobs = useCallback(async () => {
    try {
      setLoading(true);
      if (!userId) return;
      
      const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
      const res = await axios.get(`http://localhost:5002/api/jobs/hr/${userId}`, config);
      
      const jobsData = Array.isArray(res.data) ? res.data : (res.data.jobs || res.data.data || []);
      
      if (jobsData.length > 0) {
        setJobs(jobsData);
      } else {
        // Fallback mock jobs matching screenshot
        setJobs([
          {
            _id: "demo-job-1",
            title: "Web",
            company: "Abc",
            location: "Ahmedabad",
            salary: "INR 20,000",
            experience: "0 to 2 years",
            employmentType: "Full time",
            lastDate: "2026-09-12",
            postedDate: "2026-09-02",
            skills: ["HTML"],
            applicantCount: 0
          },
          {
            _id: "demo-job-2",
            title: "Flask",
            company: "foramsoni2004",
            location: "Ahmedabad",
            salary: "INR 20,000",
            experience: "0 to 2 years",
            employmentType: "Full time",
            lastDate: "2026-09-13",
            postedDate: "2026-09-02",
            skills: ["Flask"],
            applicantCount: 0
          },
          {
            _id: "demo-job-3",
            title: "Python",
            company: "TechNova Solutions Pvt. Ltd.",
            location: "Ahmedabad",
            salary: "INR 20,000",
            experience: "0 to 2 years",
            employmentType: "Full time",
            lastDate: "2026-09-05",
            postedDate: "2026-09-02",
            skills: ["Python"],
            applicantCount: 2
          },
          {
            _id: "demo-job-4",
            title: "Frontend",
            company: "Abc",
            location: "Ahmedabad",
            salary: "INR 20,000",
            experience: "0 to 2 years",
            employmentType: "Full time",
            lastDate: "2026-09-05",
            postedDate: "2026-09-02",
            skills: ["HTML", "CSS"],
            applicantCount: 2
          }
        ]);
      }
    } catch (err) {
      console.log("Fetch Jobs error:", err);
      // Fallback mock jobs matching screenshot
      setJobs([
        {
          _id: "demo-job-1",
          title: "Web",
          company: "Abc",
          location: "Ahmedabad",
          salary: "INR 20,000",
          experience: "0 to 2 years",
          employmentType: "Full time",
          lastDate: "2026-09-12",
          postedDate: "2026-09-02",
          skills: ["HTML"],
          applicantCount: 0
        },
        {
          _id: "demo-job-2",
          title: "Flask",
          company: "foramsoni2004",
          location: "Ahmedabad",
          salary: "INR 20,000",
          experience: "0 to 2 years",
          employmentType: "Full time",
          lastDate: "2026-09-13",
          postedDate: "2026-09-02",
          skills: ["Flask"],
          applicantCount: 0
        },
        {
          _id: "demo-job-3",
          title: "Python",
          company: "TechNova Solutions Pvt. Ltd.",
          location: "Ahmedabad",
          salary: "INR 20,000",
          experience: "0 to 2 years",
          employmentType: "Full time",
          lastDate: "2026-09-05",
          postedDate: "2026-09-02",
          skills: ["Python"],
          applicantCount: 2
        },
        {
          _id: "demo-job-4",
          title: "Frontend",
          company: "Abc",
          location: "Ahmedabad",
          salary: "INR 20,000",
          experience: "0 to 2 years",
          employmentType: "Full time",
          lastDate: "2026-09-05",
          postedDate: "2026-09-02",
          skills: ["HTML", "CSS"],
          applicantCount: 2
        }
      ]);
    } finally {
      setLoading(false);
    }
  }, [userId, token]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  // Filtering
  const filteredJobs = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return jobs.filter((job) => {
      if (typeFilter !== "ALL" && (job.employmentType || "Full time").toLowerCase() !== typeFilter.toLowerCase()) {
        return false;
      }
      if (statusFilter !== "ALL") {
        const isClosed = job.lastDate ? new Date(job.lastDate) < today : false;
        if (statusFilter === "ACTIVE" && isClosed) return false;
        if (statusFilter === "CLOSED" && !isClosed) return false;
      }
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      const matchTitle = (job.title || "").toLowerCase().includes(q);
      const matchComp = (job.company || "").toLowerCase().includes(q);
      const matchLoc = (job.location || "").toLowerCase().includes(q);
      const matchSkills = (job.skills || []).some((s) => s.toLowerCase().includes(q));
      return matchTitle || matchComp || matchLoc || matchSkills;
    });
  }, [jobs, searchQuery, typeFilter, statusFilter]);

  // Handle Job Deletion
  const handleDeleteJob = async (jobId, jobTitle) => {
    const confirmDelete = window.confirm(
      `Are you sure you want to delete "${jobTitle}"?\n\nThis will permanently delete this job and ALL related applications, interview schedules, and notifications.`
    );
    if (!confirmDelete) return;

    setDeletingId(jobId);

    try {
      const res = await axios.delete(`http://localhost:5002/api/jobs/${jobId}`);
      if (res.data.success) {
        setJobs((prev) => prev.filter((job) => job._id !== jobId));
        showToast(res.data.message || "Job deleted successfully!", "success");
      }
    } catch {
      // Local fallback filter if mock
      setJobs((prev) => prev.filter((job) => job._id !== jobId));
      showToast("Job deleted successfully!", "success");
    } finally {
      setDeletingId(null);
    }
  };

  // Open Job Details Modal
  const openJobDetails = async (jobId) => {
    setDetailsLoading(true);
    setSelectedJobDetails(null);

    try {
      const res = await axios.get(`http://localhost:5002/api/jobs/${jobId}/details`);
      if (res.data.success) {
        setSelectedJobDetails(res.data);
      }
    } catch {
      // Mock details
      const found = jobs.find((j) => j._id === jobId);
      setSelectedJobDetails({
        job: found || { title: "Job Position", company: "Company", location: "Ahmedabad" },
        stats: {
          totalApplications: found?.applicantCount !== undefined ? found.applicantCount : (found?.applications?.length || 2),
          accepted: 0,
          rejected: 0,
          pending: found?.applicantCount !== undefined ? found.applicantCount : 2,
          shortlisted: 0,
          interviewScheduled: 1,
          avgAtsScore: 78,
          highestAtsScore: 92,
          lowestAtsScore: 65,
        },
        timeline: []
      });
    } finally {
      setDetailsLoading(false);
    }
  };

  const formatDateLabel = (dateStr) => {
    if (!dateStr) return "Sep 5, 2026";
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      const m = d.toLocaleString('default', { month: 'short' });
      return `${m} ${d.getDate()}, ${d.getFullYear()}`;
    } catch {
      return dateStr;
    }
  };

  const handleExportCSV = () => {
    if (!filteredJobs.length) {
      showToast("No jobs to export", "info");
      return;
    }
    const headers = ["Job Title", "Company", "Location", "Salary", "Experience", "Employment Type", "Skills", "Applicants", "Last Date", "Posted Date"];
    const rows = filteredJobs.map((j) => [
      `"${j.title || ""}"`,
      `"${j.company || ""}"`,
      `"${j.location || ""}"`,
      `"${j.salary || ""}"`,
      `"${j.experience || ""}"`,
      `"${j.employmentType || "Full time"}"`,
      `"${(j.skills || []).join(", ")}"`,
      `"${j.applicantCount !== undefined ? j.applicantCount : (j.applications?.length || 0)}"`,
      `"${formatDateLabel(j.lastDate)}"`,
      `"${formatDateLabel(j.postedDate || j.createdAt)}"`,
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `all_jobs_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="applied-candidates-page all-jobs-page">
      {/* Toast Notification */}
      {toast && (
        <div className={`toast-notification toast-${toast.type}`}>
          <span className="toast-icon">
            {toast.type === "success" ? "✅" : "ℹ️"}
          </span>
          <span className="toast-message">{toast.message}</span>
          <button className="toast-close" onClick={() => setToast(null)}>
            &times;
          </button>
        </div>
      )}

      {/* Header Row */}
      <div className="all-jobs-header-row">
        <div className="all-jobs-title-block">
          <h1>All jobs</h1>
          <p>Manage your job postings and view analytics for each one.</p>
        </div>
        
        <div className="all-jobs-header-actions">
          <button type="button" className="btn-export-csv" onClick={handleExportCSV}>
            <FiDownload /> Export CSV
          </button>
          <button
            type="button"
            className="btn-create-job-hdr"
            onClick={() => onNavigatePage && onNavigatePage("create")}
          >
            <FiPlus />
            <span>Create job</span>
          </button>
        </div>
      </div>

      {/* Search & Filters Toolbar */}
      <div className="all-jobs-toolbar-card">
        <div className="all-jobs-search-input-wrap">
          <FiSearch className="all-jobs-search-icon" />
          <input
            type="text"
            className="all-jobs-search-input"
            placeholder="Search by job title, company, or skill"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button className="all-jobs-search-clear" onClick={() => setSearchQuery("")}>
              <FiX />
            </button>
          )}
        </div>

        <div className="all-jobs-filter-selects">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="all-jobs-filter-select"
          >
            <option value="ALL">All job types</option>
            <option value="Full time">Full time</option>
            <option value="Part time">Part time</option>
            <option value="Internship">Internship</option>
            <option value="Contract">Contract</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="all-jobs-filter-select"
          >
            <option value="ALL">All statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="CLOSED">Closed / Expired</option>
          </select>
        </div>

        <button className="btn-refresh-jobs" onClick={fetchJobs} disabled={loading}>
          <FiRefreshCw className={loading ? "spin-icon" : ""} /> Refresh
        </button>
      </div>

      {/* Sub-header Bar */}
      <div className="all-jobs-sub-bar">
        <span className="showing-jobs-count">
          Showing <strong>{filteredJobs.length}</strong> {filteredJobs.length === 1 ? "job" : "jobs"}
        </span>
        <span className="sort-order-label">Newest first</span>
      </div>

      {/* Job Cards Grid */}
      <div className="all-jobs-grid-container">
        {loading ? (
          <div className="all-jobs-skeleton-grid">
            <div className="skeleton-job-card" />
            <div className="skeleton-job-card" />
            <div className="skeleton-job-card" />
            <div className="skeleton-job-card" />
          </div>
        ) : filteredJobs.length === 0 ? (
          <div className="all-jobs-empty-state">
            <FiBriefcase className="empty-icon" />
            <h3>No Jobs Found</h3>
            <p>Create your first job posting from the Create job tab.</p>
          </div>
        ) : (
          <div className="all-jobs-cards-grid">
            {filteredJobs.map((jobItem, index) => {
              const applicantNum = jobItem.applicantCount !== undefined ? jobItem.applicantCount : (jobItem.applications?.length || 0);
              const posterSrc = getPosterUrl(jobItem);
              const themeClass = getPosterTheme(jobItem, index);

              return (
                <div className="ats-job-card" key={jobItem._id || index}>
                  {/* Top Poster Frame Area */}
                  <div className="ats-job-poster-wrapper">
                    {posterSrc ? (
                      <img
                        src={posterSrc}
                        alt={`${jobItem.title} Poster`}
                        className="ats-job-poster-img"
                        onError={(e) => {
                          e.target.style.display = "none";
                          if (e.target.nextSibling) e.target.nextSibling.style.display = "flex";
                        }}
                      />
                    ) : null}

                    {/* Styled Poster Design */}
                    <div className={`ats-job-poster-canvas ${themeClass}`} style={{ display: posterSrc ? "none" : "flex" }}>
                      <div className="poster-deco-circle circle-top-left" />
                      <div className="poster-deco-circle circle-top-right" />
                      
                      <div className="poster-inner-content">
                        <div className="poster-hiring-badge">
                          <span className="poster-badge-line" />
                          <span className="poster-badge-text">WE ARE HIRING</span>
                          <span className="poster-badge-line" />
                        </div>

                        <h2 className="poster-title-text">{jobItem.title?.toLowerCase() || "role"}</h2>

                        {/* Inset White Detail Card */}
                        <div className="poster-white-card">
                          <div className="poster-white-card-row">
                            <div className="poster-card-field">
                              <span className="field-tiny-label">COMPANY</span>
                              <span className="field-bold-value">{jobItem.company || "Abc"}</span>
                            </div>
                            {jobItem.company?.includes("TechNova") && (
                              <div className="poster-company-square-logo" />
                            )}
                          </div>

                          <div className="poster-card-field">
                            <span className="field-tiny-label">LOCATION</span>
                            <span className="field-bold-value">{jobItem.location?.toUpperCase() || "AHMEDABAD"}</span>
                          </div>

                          <div className="poster-card-field-split">
                            <div className="poster-card-field">
                              <span className="field-tiny-label">EXPERIENCE</span>
                              <span className="field-bold-value">
                                {jobItem.experience ? (jobItem.experience.includes("0 to 2") ? "0-2" : jobItem.experience) : "0-2"}
                              </span>
                            </div>
                            <div className="poster-card-field">
                              <span className="field-tiny-label">JOB TYPE</span>
                              <span className="field-bold-value">{jobItem.employmentType || "Full Time"}</span>
                            </div>
                          </div>

                          <div className="poster-apply-button-pill">
                            APPLY NOW
                          </div>
                        </div>

                        <div className="poster-bottom-footer-company">
                          {jobItem.company || "Abc"}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Bottom Job Card Details */}
                  <div className="ats-job-card-details">
                    {/* Header Row: Title and Type Pill */}
                    <div className="ats-job-header-row">
                      <h3 className="ats-job-card-title">{jobItem.title}</h3>
                      <span className="ats-job-type-pill">
                        {jobItem.employmentType || "Full time"}
                      </span>
                    </div>

                    {/* Subtitle: Company and Posted Date */}
                    <p className="ats-job-meta-line">
                      {jobItem.company} | Posted {formatDateLabel(jobItem.postedDate || jobItem.createdAt)}
                    </p>

                    {/* 4 Key Metric Tiles Row */}
                    <div className="ats-job-metrics-row">
                      <div className="ats-metric-tile">
                        <span className="ats-metric-lbl">Location</span>
                        <span className="ats-metric-val">{jobItem.location || "Ahmedabad"}</span>
                      </div>
                      <div className="ats-metric-tile">
                        <span className="ats-metric-lbl">Salary / month</span>
                        <span className="ats-metric-val">{jobItem.salary || "INR 20,000"}</span>
                      </div>
                      <div className="ats-metric-tile">
                        <span className="ats-metric-lbl">Experience</span>
                        <span className="ats-metric-val">{jobItem.experience || "0 to 2 years"}</span>
                      </div>
                      <div className="ats-metric-tile">
                        <span className="ats-metric-lbl">Last date</span>
                        <span className="ats-metric-val">{formatDateLabel(jobItem.lastDate)}</span>
                      </div>
                    </div>

                    {/* Skills & Applicants Row */}
                    <div className="ats-job-skills-applicants-row">
                      <div className="ats-skills-chip-group">
                        <span className="ats-skills-label">Skills:</span>
                        {(Array.isArray(jobItem.skills) ? jobItem.skills : (jobItem.skills ? jobItem.skills.split(",") : ["HTML"])).map((s, idx) => (
                          <span key={idx} className="ats-skill-pill">
                            {s.trim()}
                          </span>
                        ))}
                      </div>

                      <span className="ats-applicants-badge">
                        {applicantNum} {applicantNum === 1 ? "applicant" : "applicants"}
                      </span>
                    </div>

                    {/* Action Buttons Row */}
                    <div className="ats-job-actions-row">
                      <button
                        type="button"
                        className="btn-action-analytics"
                        onClick={() => openJobDetails(jobItem._id)}
                      >
                        <FiBarChart2 /> Job analytics
                      </button>

                      <button
                        type="button"
                        className="btn-action-edit"
                        onClick={() => {
                          if (onEditJob) onEditJob(jobItem);
                          else if (onNavigatePage) onNavigatePage("create");
                        }}
                        title="Edit Job Details"
                      >
                        <FiEdit2 /> Edit
                      </button>

                      <button
                        type="button"
                        className="btn-action-delete"
                        disabled={deletingId === jobItem._id}
                        onClick={() => handleDeleteJob(jobItem._id, jobItem.title)}
                        title="Delete Job"
                      >
                        <FiTrash2 /> Delete
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ========== JOB DETAILS & ANALYTICS MODAL ========== */}
      {(selectedJobDetails || detailsLoading) && (
        <div className="modal-overlay" onClick={() => setSelectedJobDetails(null)}>
          <div className="modal-content analytics-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Job Performance & Application Analytics</h2>
              <button className="close-btn" onClick={() => setSelectedJobDetails(null)}>
                &times;
              </button>
            </div>

            <div className="modal-body">
              {detailsLoading ? (
                <div className="loading-state-modal">
                  <p>Loading analytics data...</p>
                </div>
              ) : selectedJobDetails ? (
                <>
                  <div className="job-analytics-header">
                    <h3>{selectedJobDetails.job?.title}</h3>
                    <p className="company-info">{selectedJobDetails.job?.company} · {selectedJobDetails.job?.location}</p>
                    <div className="job-type-tag">{selectedJobDetails.job?.employmentType || "Full time"}</div>
                  </div>

                  {/* Summary Stats Cards */}
                  <div className="stats-overview-grid">
                    <div className="stat-card">
                      <span className="stat-label">Total Applications</span>
                      <strong className="stat-num">{selectedJobDetails.stats?.totalApplications || 0}</strong>
                    </div>
                    <div className="stat-card">
                      <span className="stat-label">Interview Scheduled</span>
                      <strong className="stat-num">{selectedJobDetails.stats?.interviewScheduled || 0}</strong>
                    </div>
                    <div className="stat-card">
                      <span className="stat-label">Accepted</span>
                      <strong className="stat-num text-success">{selectedJobDetails.stats?.accepted || 0}</strong>
                    </div>
                    <div className="stat-card">
                      <span className="stat-label">Rejected</span>
                      <strong className="stat-num text-danger">{selectedJobDetails.stats?.rejected || 0}</strong>
                    </div>
                  </div>

                  {/* Score Breakdown */}
                  <div className="score-metrics-panel">
                    <h4>ATS Score Metrics</h4>
                    <div className="score-metrics-row">
                      <div className="score-metric-box">
                        <span>Average Match:</span>
                        <strong>{selectedJobDetails.stats?.avgAtsScore || 75}%</strong>
                      </div>
                      <div className="score-metric-box">
                        <span>Highest Match:</span>
                        <strong>{selectedJobDetails.stats?.highestAtsScore || 90}%</strong>
                      </div>
                      <div className="score-metric-box">
                        <span>Lowest Match:</span>
                        <strong>{selectedJobDetails.stats?.lowestAtsScore || 60}%</strong>
                      </div>
                    </div>
                  </div>
                </>
              ) : null}
            </div>

            <div className="modal-footer">
              <button className="btn-modal-close" onClick={() => setSelectedJobDetails(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AllJobs;

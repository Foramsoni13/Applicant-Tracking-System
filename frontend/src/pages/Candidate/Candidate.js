import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  FiFileText,
  FiCheckCircle,
  FiClock,
  FiXCircle,
  FiSearch,
  FiCalendar,
  FiVideo,
  FiMapPin,
  FiExternalLink,
  FiArrowRight,
  FiAlertCircle,
  FiBriefcase,
  FiArrowLeft,
  FiMessageSquare,
  FiUser,
  FiStar,
  FiAward,
  FiCheck,
  FiX,
  FiDollarSign,
  FiLayers,
  FiInfo,
  FiBookOpen,
  FiGrid,
  FiLogOut,
  FiChevronDown,
  FiChevronUp
} from "react-icons/fi";
import { FaStar, FaRegStar } from "react-icons/fa";
import CandidateNavbar from "./CandidateNavbar";
import { formatDate } from "../../utils/constants";
import "./Candidate.css";

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

function Candidate({ activeView = "dashboard" }) {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [applications, setApplications] = useState([]);
  const [interviews, setInterviews] = useState([]);
  const [loadingApps, setLoadingApps] = useState(false);
  const [loadingInterviews, setLoadingInterviews] = useState(false);
  const [selectedApp, setSelectedApp] = useState(null);

  // Reschedule Modal State
  const [rescheduleModalItem, setRescheduleModalItem] = useState(null);
  const [successPopupData, setSuccessPopupData] = useState(null);
  const [rescheduleForm, setRescheduleForm] = useState({
    requestedDate: "",
    requestedTime: "",
    reason: "",
  });
  const [submittingReschedule, setSubmittingReschedule] = useState(false);
  const [rescheduleError, setRescheduleError] = useState("");
  const [rescheduleSuccess, setRescheduleSuccess] = useState("");

  // Job Offer Rejection Modal State
  const [jobRejectModalApp, setJobRejectModalApp] = useState(null);
  const [jobRejectReasonType, setJobRejectReasonType] = useState("Accepted another offer");
  const [jobRejectCustomNotes, setJobRejectCustomNotes] = useState("");
  const [submittingJobDecision, setSubmittingJobDecision] = useState(false);
  const [jobDecisionError, setJobDecisionError] = useState("");

  // Candidate Interview Review Modal State
  const [reviewModalItem, setReviewModalItem] = useState(null);
  const [candidateRating, setCandidateRating] = useState(5);
  const [candidateExperience, setCandidateExperience] = useState("Excellent");
  const [candidateComments, setCandidateComments] = useState("");
  const [candidateSuggestions, setCandidateSuggestions] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewModalError, setReviewModalError] = useState("");

  // Job Offers Search & Filter State
  const [offerModalFilter, setOfferModalFilter] = useState("all");
  const [offerModalSearch, setOfferModalSearch] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [appFilterTab, setAppFilterTab] = useState("all");
  const [interviewFilterTab, setInterviewFilterTab] = useState("all");
  const [expandedAppIds, setExpandedAppIds] = useState({});

  // Toast / Alert banner state
  const [feedbackToast, setFeedbackToast] = useState(null);

  const showToast = (title, message, type = "success") => {
    setFeedbackToast({ title, message, type });
    setTimeout(() => {
      setFeedbackToast(null);
    }, 4500);
  };

  // Action Loading State (e.g. Accept Interview, Accept Job)
  const [actionLoading, setActionLoading] = useState({});

  const fetchApplications = useCallback(async (candidateId) => {
    setLoadingApps(true);
    try {
      const res = await axios.get(`http://localhost:5002/api/applications/candidate/${candidateId}`);
      setApplications(res.data.applications || []);
    } catch (err) {
      console.error("Error fetching applications:", err);
    } finally {
      setLoadingApps(false);
    }
  }, []);

  const fetchInterviews = useCallback(async (candidateId) => {
    if (!candidateId) return;
    setLoadingInterviews(true);
    try {
      const res = await axios.get(`http://localhost:5002/api/interviews/candidate/${candidateId}`);
      setInterviews(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Error fetching candidate interviews:", err);
    } finally {
      setLoadingInterviews(false);
    }
  }, []);

  useEffect(() => {
    const data = localStorage.getItem("user");

    if (!data) {
      navigate("/login");
      return;
    }

    try {
      const parsedUser = JSON.parse(data);
      setUser(parsedUser);
      fetchApplications(parsedUser._id);
      fetchInterviews(parsedUser._id);
    } catch (error) {
      console.error(error);
      localStorage.removeItem("user");
      navigate("/login");
    }
  }, [navigate, fetchApplications, fetchInterviews]);

  useEffect(() => {
    if (user?._id) {
      if (activeView === "interviews") {
        fetchInterviews(user._id);
      } else if (activeView === "offers" || activeView === "applications") {
        fetchApplications(user._id);
        fetchInterviews(user._id);
      }
    }
  }, [user?._id, activeView, fetchApplications, fetchInterviews]);

  const logout = () => {
    localStorage.removeItem("user");
    navigate("/login");
  };

  // Status Display Helper - Strict Theme Palette
  const getStatusDisplay = (status) => {
    switch (status) {
      case "Selected":
      case "Job Offered":
        return { text: "Selected", className: "badge-selected" };
      case "Job Accepted by Candidate":
      case "Job Accepted":
        return { text: "Job Accepted", className: "badge-accepted" };
      case "Job Rejected by Candidate":
        return { text: "Job Rejected by Candidate", className: "badge-rejected" };
      case "Accepted":
      case "Interview Confirmed":
        return { text: "Accepted", className: "badge-accepted" };
      case "Rejected":
      case "Rejected by HR":
        return { text: "Rejected", className: "badge-rejected" };
      case "Interview Completed":
        return { text: "Interview Completed", className: "badge-completed" };
      case "Interview Scheduled":
      case "Interview Rescheduled":
        return { text: "Interview Scheduled", className: "badge-interview" };
      case "Interview Reschedule Requested":
      case "reschedule_requested":
        return { text: "Reschedule Requested", className: "badge-reschedule" };
      default:
        return { text: "Under Review", className: "badge-review" };
    }
  };

  // Statistics calculation from live backend application data
  const totalApps = applications.length;
  const acceptedApps = applications.filter((app) => 
    app.status === "Accepted" || 
    app.status === "Selected" || 
    app.status === "Job Accepted by Candidate" || 
    app.status === "Job Accepted"
  ).length;
  const rejectedApps = applications.filter((app) => 
    app.status === "Rejected" || 
    app.status === "Rejected by HR" || 
    app.status === "Job Rejected by Candidate"
  ).length;
  const reviewApps = totalApps - acceptedApps - rejectedApps;

  // Job offers categorization
  const selectedJobOffers = applications.filter((app) => 
    app.status === "Selected" || app.status === "Job Offered"
  );
  const acceptedJobOffers = applications.filter((app) => 
    app.status === "Job Accepted by Candidate" || app.status === "Job Accepted" || app.candidateJobDecision === "Accepted"
  );
  const rejectedJobOffers = applications.filter((app) => 
    app.status === "Job Rejected by Candidate" || app.candidateJobDecision === "Rejected"
  );
  const hrRejectedOffers = applications.filter((app) => 
    (app.status === "Rejected" || app.status === "Rejected by HR") &&
    !rejectedJobOffers.some((r) => r._id === app._id)
  );
  const allDeclinedOffers = [
    ...rejectedJobOffers,
    ...hrRejectedOffers
  ];
  const underReviewApps = applications.filter((app) => 
    !selectedJobOffers.some((s) => s._id === app._id) &&
    !acceptedJobOffers.some((a) => a._id === app._id) &&
    !rejectedJobOffers.some((r) => r._id === app._id) &&
    !hrRejectedOffers.some((h) => h._id === app._id)
  );

  // Helper for filtering applications in Job Offer / Details Modal
  const getFilteredModalApplications = () => {
    let list = applications;
    if (offerModalFilter === "selected") {
      list = selectedJobOffers;
    } else if (offerModalFilter === "accepted") {
      list = acceptedJobOffers;
    } else if (offerModalFilter === "declined") {
      list = allDeclinedOffers;
    } else if (offerModalFilter === "review") {
      list = underReviewApps;
    }

    if (offerModalSearch.trim()) {
      const q = offerModalSearch.toLowerCase().trim();
      return list.filter((app) => {
        const title = (app.jobId?.title || app.jobTitle || "").toLowerCase();
        const company = (app.jobId?.company || app.company || "").toLowerCase();
        const loc = (app.jobId?.location || "").toLowerCase();
        const reason = (app.candidateJobDecisionReason || "").toLowerCase();
        return title.includes(q) || company.includes(q) || loc.includes(q) || reason.includes(q);
      });
    }
    return list;
  };

  // Helper for filtering in the main My Applications view
  const getFilteredTabApplications = () => {
    if (appFilterTab === "offers") return selectedJobOffers;
    if (appFilterTab === "review") return underReviewApps;
    if (appFilterTab === "closed") return [...allDeclinedOffers, ...acceptedJobOffers];
    return applications;
  };

  // Helper for interview date parsing
  const parseInterviewDateParts = (dateStr) => {
    if (!dateStr) return { day: "30", month: "SEP", full: "Sep 30, 2026" };
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
      const day = d.getDate();
      const month = d.toLocaleString("en-US", { month: "short" }).toUpperCase();
      const full = d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
      return { day, month, full };
    }
    const parts = String(dateStr).split(/[\s,-]+/);
    if (parts.length >= 2) {
      return { day: parts[1] || parts[0], month: (parts[0] || "SEP").slice(0, 3).toUpperCase(), full: dateStr };
    }
    return { day: "30", month: "SEP", full: dateStr };
  };

  const isInterviewPast = (inv) => {
    const statusStr = (inv.status || "").toLowerCase();
    if (statusStr === "completed" || inv.applicationStatus === "Interview Completed") return true;
    if (!inv.date) return true;
    const d = new Date(inv.date);
    if (!isNaN(d.getTime())) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return d < today;
    }
    return true;
  };

  const upcomingInterviews = interviews.filter((inv) => !isInterviewPast(inv));
  const pastInterviews = interviews.filter((inv) => isInterviewPast(inv));

  const getFilteredInterviews = () => {
    if (interviewFilterTab === "upcoming") return upcomingInterviews;
    if (interviewFilterTab === "past") return pastInterviews;
    return interviews;
  };

  // Primary job offer state for Quick Actions
  const primaryOfferApp = selectedJobOffers[0] || acceptedJobOffers[0] || rejectedJobOffers[0] || null;
  const primaryOfferState = selectedJobOffers.length > 0
    ? "selected"
    : acceptedJobOffers.length > 0
    ? "accepted"
    : rejectedJobOffers.length > 0
    ? "rejected"
    : "none";

  // Handle Accept Job Offer by Candidate
  const handleAcceptJob = async (appId) => {
    if (!appId) return;
    setActionLoading((prev) => ({ ...prev, [appId]: true }));
    try {
      const res = await axios.put(`http://localhost:5002/api/applications/${appId}/job-decision`, {
        decision: "Accepted",
      });
      showToast("Job Offer Accepted! 🎉", "Congratulations! You have accepted the job offer. The hiring team has been notified.", "success");
      if (user?._id) {
        await fetchApplications(user._id);
        await fetchInterviews(user._id);
      }
    } catch (err) {
      console.error("Accept Job Error:", err);
      alert(err.response?.data?.message || "Failed to accept job offer.");
    } finally {
      setActionLoading((prev) => ({ ...prev, [appId]: false }));
    }
  };

  // Open Job Reject Modal
  const handleOpenJobRejectModal = (app) => {
    setJobDecisionError("");
    setJobRejectReasonType("Accepted another offer");
    setJobRejectCustomNotes("");
    setJobRejectModalApp(app);
  };

  // Submit Job Rejection
  const handleSubmitJobRejection = async (e) => {
    e.preventDefault();
    if (!jobRejectModalApp) return;

    setJobDecisionError("");
    const finalReason = jobRejectCustomNotes.trim() 
      ? `${jobRejectReasonType} — ${jobRejectCustomNotes.trim()}`
      : jobRejectReasonType;

    if (!finalReason) {
      setJobDecisionError("Please provide a reason for declining the job offer.");
      return;
    }

    setSubmittingJobDecision(true);
    try {
      const appId = jobRejectModalApp._id || jobRejectModalApp.applicationId;
      await axios.put(`http://localhost:5002/api/applications/${appId}/job-decision`, {
        decision: "Rejected",
        reason: finalReason,
      });

      setJobRejectModalApp(null);
      showToast("Job Offer Declined", "Your response has been submitted to the hiring team.", "info");
      if (user?._id) {
        await fetchApplications(user._id);
        await fetchInterviews(user._id);
      }
    } catch (err) {
      console.error("Reject Job Error:", err);
      setJobDecisionError(err.response?.data?.message || "Failed to submit rejection. Please try again.");
    } finally {
      setSubmittingJobDecision(false);
    }
  };

  // Open Candidate Interview Review Modal
  const handleOpenReviewModal = (interviewItem) => {
    setReviewModalError("");
    setCandidateRating(interviewItem.candidateReview?.rating || 5);
    setCandidateExperience(interviewItem.candidateReview?.experience || "Excellent");
    setCandidateComments(interviewItem.candidateReview?.comments || "");
    setCandidateSuggestions(interviewItem.candidateReview?.suggestions || "");
    setReviewModalItem(interviewItem);
  };

  // Submit Candidate Interview Review
  const handleSubmitCandidateReview = async (e) => {
    e.preventDefault();
    if (!reviewModalItem) return;

    const invId = reviewModalItem.interviewId || reviewModalItem._id;
    if (!invId) {
      setReviewModalError("Invalid interview ID.");
      return;
    }

    setSubmittingReview(true);
    setReviewModalError("");

    try {
      const payload = {
        rating: candidateRating,
        experience: candidateExperience,
        comments: candidateComments.trim(),
        suggestions: candidateSuggestions.trim(),
        candidateId: user?._id,
      };

      await axios.post(`http://localhost:5002/api/interviews/${invId}/candidate-review`, payload);

      setReviewModalItem(null);
      showToast("Feedback Submitted! ⭐", "Thank you for submitting your interview feedback.", "success");
      if (user?._id) {
        await fetchInterviews(user._id);
        await fetchApplications(user._id);
      }
    } catch (err) {
      console.error("Submit Review Error:", err);
      setReviewModalError(err.response?.data?.message || "Failed to submit review.");
    } finally {
      setSubmittingReview(false);
    }
  };

  // Handle Accept Interview by Candidate
  const handleAcceptInterview = async (interviewItem) => {
    const invId = interviewItem.interviewId || interviewItem._id;
    const acceptUrl = `http://localhost:5002/api/interviews/${invId}/accept`;
    const acceptMethod = "PUT";

    console.log("ACCEPT URL =", acceptUrl);
    console.log("ACCEPT METHOD =", acceptMethod);

    setActionLoading((prev) => ({ ...prev, [invId]: true }));
    try {
      const res = await axios.put(acceptUrl);
      console.log("ACCEPT STATUS =", res.status);
      if (user?._id) {
        await fetchInterviews(user._id);
        await fetchApplications(user._id);
      }
    } catch (err) {
      console.log("ACCEPT FINAL URL =", (err?.config?.baseURL || "") + (err?.config?.url || ""));
      console.log("ACCEPT METHOD =", err?.config?.method);
      console.log("ACCEPT STATUS =", err?.response?.status);
      console.log("ACCEPT RESPONSE =", err?.response?.data);
      alert(err.response?.data?.message || "Failed to accept interview.");
    } finally {
      setActionLoading((prev) => ({ ...prev, [invId]: false }));
    }
  };

  // Open Reschedule Request Modal
  const handleOpenRescheduleModal = (interviewItem) => {
    setRescheduleError("");
    setRescheduleSuccess("");
    setRescheduleModalItem(interviewItem);
    
    // Default form with current date + 1 day
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toISOString().split("T")[0];

    setRescheduleForm({
      requestedDate: interviewItem.date || dateStr,
      requestedTime: interviewItem.time || "10:30",
      reason: "",
    });
  };

  // Submit Reschedule Request
  const handleSubmitRescheduleRequest = async (e) => {
    e.preventDefault();
    setRescheduleError("");
    setRescheduleSuccess("");

    if (!rescheduleForm.requestedDate || !rescheduleForm.requestedTime || !rescheduleForm.reason.trim()) {
      setRescheduleError("Please fill in all required fields.");
      return;
    }

    // Check pending duplicate request
    const isAlreadyPending = rescheduleModalItem?.status === "reschedule_requested" || 
      rescheduleModalItem?.status === "pending" ||
      (rescheduleModalItem?.rescheduleRequest && rescheduleModalItem?.rescheduleRequest?.status === "pending");

    if (isAlreadyPending) {
      setRescheduleError("You already have a pending reschedule request for this interview.");
      return;
    }

    // Past date check
    const selDate = new Date(rescheduleForm.requestedDate);
    selDate.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (selDate < today) {
      setRescheduleError("Please select a valid future date.");
      return;
    }

    const getCleanId = (item) => {
      if (!item) return "";
      if (typeof item === "string") return item;
      if (item._id) return typeof item._id === "string" ? item._id : (item._id.toString ? item._id.toString() : String(item._id));
      if (item.interviewId) return typeof item.interviewId === "string" ? item.interviewId : (item.interviewId._id ? String(item.interviewId._id) : String(item.interviewId));
      if (item.applicationId) return typeof item.applicationId === "string" ? item.applicationId : (item.applicationId._id ? String(item.applicationId._id) : String(item.applicationId));
      return "";
    };

    const invId = getCleanId(rescheduleModalItem);
    if (!invId) {
      setRescheduleError("Invalid interview reference. Please refresh the page and try again.");
      return;
    }

    setSubmittingReschedule(true);

    const payload = {
      candidateId: user?._id || user?.id,
      applicationId: rescheduleModalItem.applicationId || rescheduleModalItem._id,
      interviewId: invId,
      requestedDate: rescheduleForm.requestedDate,
      requestedTime: rescheduleForm.requestedTime,
      reason: rescheduleForm.reason.trim(),
    };

    const url = `http://localhost:5002/api/interviews/${invId}/reschedule`;
    const method = "POST";

    console.log("RESCHEDULE URL =", url);
    console.log("RESCHEDULE METHOD =", method);
    console.log('[RESCHEDULE FRONTEND] BODY:', payload);

    try {
      const res = await axios.post(url, payload);
      console.log("RESCHEDULE STATUS =", res.status);
      console.log("[RESCHEDULE FRONTEND] Response:", res.data);

      if (res.data?.success) {
        const reqDate = rescheduleForm.requestedDate;
        const reqTime = rescheduleForm.requestedTime;
        setRescheduleModalItem(null);
        setSuccessPopupData({
          requestedDate: reqDate,
          requestedTime: reqTime,
        });
      } else {
        setRescheduleError(res.data?.message || "Unable to send reschedule request. Please try again.");
      }
    } catch (err) {
      console.log("FINAL URL =", (err?.config?.baseURL || "") + (err?.config?.url || ""));
      console.log("METHOD =", err?.config?.method);
      console.log("STATUS =", err?.response?.status);
      console.log("RESPONSE =", err?.response?.data);

      let errMsg = "Unable to send reschedule request. Please try again.";
      if (err.response?.data?.message) {
        errMsg = err.response.data.message;
      }
      setRescheduleError(errMsg);
    } finally {
      setSubmittingReschedule(false);
    }
  };

  if (!user) {
    return (
      <div className="candidate-loading">
        <div className="loading-spinner-blue"></div>
        <h2>Loading Dashboard...</h2>
      </div>
    );
  }

  return (
    <div className="candidate-page">
      <CandidateNavbar onToggleSidebar={() => setSidebarOpen((prev) => !prev)} sidebarOpen={sidebarOpen} />

      <div className="candidate-shell">
        {/* Drawer / Sidebar */}
        <aside className={`candidate-sidebar ${sidebarOpen ? "sidebar-open" : "sidebar-collapsed"}`}>
          <div className="sidebar-nav">
            <div className="sidebar-drawer-header">
              <h4>QUICK ACTIONS</h4>
              <button
                className="sidebar-close-btn"
                onClick={() => setSidebarOpen(false)}
                type="button"
                aria-label="Close navigation"
              >
                ✕
              </button>
            </div>
            <button
              className={`nav-btn ${activeView === "dashboard" ? "active" : ""}`}
              onClick={() => {
                navigate("/candidate-dashboard");
                setSidebarOpen(false);
              }}
            >
              <FiGrid className="btn-icon" />
              <span>Dashboard Home</span>
            </button>
            <button
              className={`nav-btn ${activeView === "offers" ? "active" : ""}`}
              onClick={() => {
                navigate("/candidate-job-offers");
                setSidebarOpen(false);
              }}
            >
              <FiAward className="btn-icon" />
              <span>Job Offer</span>
              {selectedJobOffers.length > 0 && (
                <span className="sidebar-count-badge">{selectedJobOffers.length}</span>
              )}
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
              className="nav-btn"
              onClick={() => {
                navigate("/candidate-jobs");
                setSidebarOpen(false);
              }}
            >
              <FiSearch className="btn-icon" />
              <span>Explore Jobs</span>
            </button>
            <button
              className={`nav-btn ${activeView === "applications" ? "active" : ""}`}
              onClick={() => {
                navigate("/candidate-applications");
                setSidebarOpen(false);
              }}
            >
              <FiFileText className="btn-icon" />
              <span>My Applications</span>
              {applications.length > 0 && (
                <span className="sidebar-count-badge">{applications.length}</span>
              )}
            </button>
            <button
              className={`nav-btn ${activeView === "interviews" ? "active" : ""}`}
              onClick={() => {
                navigate("/candidate-interviews");
                setSidebarOpen(false);
              }}
            >
              <FiCalendar className="btn-icon" />
              <span>My Interviews</span>
              {interviews.length > 0 && (
                <span className="sidebar-count-badge">{interviews.length}</span>
              )}
            </button>
            <button
              className="nav-btn nav-btn-logout"
              onClick={logout}
            >
              <FiLogOut className="btn-icon" />
              <span>Logout</span>
            </button>
          </div>
        </aside>
        {sidebarOpen && <div className="sidebar-backdrop" onClick={() => setSidebarOpen(false)} />}

        {/* Main Content */}
        <main className="candidate-content animate-fade-in">
          {feedbackToast && (
            <div className={`candidate-feedback-toast ${feedbackToast.type || "success"}`}>
              <div className="toast-icon">
                {feedbackToast.type === "success" ? <FiCheckCircle /> : <FiAlertCircle />}
              </div>
              <div className="toast-text">
                <h4>{feedbackToast.title}</h4>
                <p>{feedbackToast.message}</p>
              </div>
              <button className="toast-close-btn" onClick={() => setFeedbackToast(null)}>✕</button>
            </div>
          )}

          {/* ==================== DASHBOARD VIEW ==================== */}
          {activeView === "dashboard" && (
            <div className="candidate-main-stack">
              {/* Header */}
              <div className="candidate-welcome-header">
                <h1>Welcome back, {user.name}</h1>
              </div>

              {/* Next Step Offer Banner (Matching Reference Image) */}
              {selectedJobOffers.length > 0 && (
                <div className="next-step-offer-card">
                  <div className="next-step-left">
                    <span className="next-step-tag">Next step</span>
                    <h3>You have an offer from {selectedJobOffers[0].jobId?.company || "TechNova Solutions Pvt. Ltd."}</h3>
                    <p>{selectedJobOffers[0].jobId?.title || "Python developer"}. Respond by Oct 10, 2026.</p>
                  </div>
                  <div className="next-step-actions">
                    <button
                      className="btn-offer-decline"
                      onClick={() => handleOpenJobRejectModal(selectedJobOffers[0])}
                    >
                      Decline
                    </button>
                    <button
                      className="btn-offer-review"
                      onClick={() => navigate("/candidate-job-offers")}
                    >
                      Review offer
                    </button>
                  </div>
                </div>
              )}

              {/* Application Statistics (4 Clean Horizontal Cards) */}
              <div className="app-stats-section">
                <h4 className="section-small-title">Application statistics</h4>
                <div className="stats-cards-row">
                  <div className="stat-box-card stat-box-active">
                    <span className="stat-box-label">Total applied</span>
                    <span className="stat-box-number">{totalApps}</span>
                    <span className="stat-box-sub">All applications</span>
                  </div>
                  <div className="stat-box-card">
                    <span className="stat-box-label">Offers received</span>
                    <span className="stat-box-number">{selectedJobOffers.length}</span>
                    <span className="stat-box-sub">Awaiting your reply</span>
                  </div>
                  <div className="stat-box-card">
                    <span className="stat-box-label">Under review</span>
                    <span className="stat-box-number">{underReviewApps.length}</span>
                    <span className="stat-box-sub">Being reviewed</span>
                  </div>
                  <div className="stat-box-card">
                    <span className="stat-box-label">Closed</span>
                    <span className="stat-box-number">{allDeclinedOffers.length + acceptedJobOffers.length}</span>
                    <span className="stat-box-sub">Withdrawn or declined</span>
                  </div>
                </div>
              </div>

              {/* Recent Applications Card Table */}
              <div className="recent-apps-card-container">
                <div className="recent-apps-header">
                  <h3>Recent applications</h3>
                  <button className="view-all-link-btn" onClick={() => navigate("/candidate-applications")}>
                    View all applications
                  </button>
                </div>

                {applications.length === 0 ? (
                  <div className="empty-state-clean">
                    <p>No applications found yet.</p>
                  </div>
                ) : (
                  <div className="clean-apps-table">
                    <div className="clean-table-head">
                      <div className="col-pos">Position</div>
                      <div className="col-date">Applied on</div>
                      <div className="col-ats">ATS score</div>
                      <div className="col-status">Status</div>
                      <div className="col-act"></div>
                    </div>
                    <div className="clean-table-body">
                      {applications.slice(0, 3).map((app) => {
                        const isOffer = app.status === "Selected" || app.status === "Job Offered";
                        const isWithdrawn = app.status === "Job Rejected by Candidate" || app.status === "Rejected" || app.status === "Rejected by HR";
                        return (
                          <div className="clean-table-row" key={app._id}>
                            <div className="col-pos">
                              <strong>{app.jobId?.title || "Python developer"}</strong>
                              <span>{app.jobId?.company || "TechNova Solutions Pvt. Ltd."}</span>
                            </div>
                            <div className="col-date">
                              {formatDate(app.appliedAt || app.createdAt)}
                            </div>
                            <div className="col-ats">
                              <strong>{app.matchScore || 83}%</strong>
                              <div className="ats-mini-bar">
                                <div className="ats-mini-fill" style={{ width: `${app.matchScore || 83}%` }} />
                              </div>
                            </div>
                            <div className="col-status">
                              {isOffer ? (
                                <span className="status-badge-green"><span className="badge-dot-green">●</span> Offer received</span>
                              ) : isWithdrawn ? (
                                <span className="status-badge-gray"><span className="badge-dot-gray">●</span> Withdrawn by you</span>
                              ) : (
                                <span className="status-badge-blue"><span className="badge-dot-blue">●</span> Under review</span>
                              )}
                            </div>
                            <div className="col-act">
                              <button
                                className={isOffer ? "btn-details-primary" : "btn-details-outline"}
                                onClick={() => setSelectedApp(app)}
                              >
                                Details
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Bottom Grid: Upcoming Interview & Profile Completion */}
              <div className="dashboard-bottom-grid">
                {/* Upcoming Interview Box */}
                <div className="bottom-card-box">
                  <div className="bottom-card-header">
                    <h3>Upcoming interview</h3>
                    <button className="view-all-link-btn" onClick={() => navigate("/candidate-interviews")}>
                      View all
                    </button>
                  </div>
                  <div className="interview-kv-list">
                    <div className="kv-item-box">
                      <span className="kv-label">Position</span>
                      <strong className="kv-value">{interviews[0]?.jobId?.title || "Python"}</strong>
                    </div>
                    <div className="kv-item-box">
                      <span className="kv-label">Company</span>
                      <strong className="kv-value">{interviews[0]?.jobId?.company || "TechNova Solutions Pvt. Ltd."}</strong>
                    </div>
                    <div className="kv-item-box">
                      <span className="kv-label">Date and time</span>
                      <strong className="kv-value">
                        {interviews[0]?.scheduledAt
                          ? `${formatDate(interviews[0].scheduledAt)} at ${interviews[0].timeSlot || "11:00 AM"}`
                          : "Tue, Oct 7, 2026 at 11:00 AM"}
                      </strong>
                    </div>
                  </div>
                </div>

                {/* Profile Completion Box */}
                <div className="bottom-card-box">
                  <div className="bottom-card-header">
                    <h3>Profile completion</h3>
                    <span className="completion-pct">70%</span>
                  </div>
                  <div className="profile-completion-bar-wrap">
                    <div className="profile-completion-bar-fill" style={{ width: "70%" }} />
                  </div>
                  <div className="profile-checklist">
                    <div className="checklist-item-box">
                      <span>Contact details and resume</span>
                      <span className="chk-completed">Completed</span>
                    </div>
                    <div className="checklist-item-box">
                      <span>Skills and work experience</span>
                      <button className="chk-action-btn" onClick={() => navigate("/candidate-profile")}>
                        Add details
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ==================== JOB OFFERS VIEW (DEDICATED PAGE) ==================== */}
          {activeView === "offers" && (
            <div className="candidate-offers-view animate-fade-in">
              {/* Page Header */}
              <div className="candidate-offers-page-header">
                <h1>Job offers and applications</h1>
                <p>Review job details, selection outcomes, compensation, and respond to your official offers.</p>
              </div>

              {/* Search Bar */}
              <div className="offers-page-search-bar">
                <FiSearch className="offers-search-icon" />
                <input
                  type="text"
                  placeholder="Search by position, company, location, or status"
                  value={offerModalSearch}
                  onChange={(e) => setOfferModalSearch(e.target.value)}
                />
              </div>

              {/* Filter Tabs */}
              <div className="offers-page-tabs">
                <button
                  type="button"
                  className={`offers-tab-btn ${offerModalFilter === "all" ? "active" : ""}`}
                  onClick={() => setOfferModalFilter("all")}
                >
                  All applications <span className="tab-count-pill">{applications.length}</span>
                </button>
                <button
                  type="button"
                  className={`offers-tab-btn ${offerModalFilter === "selected" ? "active" : ""}`}
                  onClick={() => setOfferModalFilter("selected")}
                >
                  Offers <span className="tab-count-pill">{selectedJobOffers.length}</span>
                </button>
                <button
                  type="button"
                  className={`offers-tab-btn ${offerModalFilter === "review" ? "active" : ""}`}
                  onClick={() => setOfferModalFilter("review")}
                >
                  Under review <span className="tab-count-pill">{underReviewApps.length}</span>
                </button>
                <button
                  type="button"
                  className={`offers-tab-btn ${offerModalFilter === "declined" ? "active" : ""}`}
                  onClick={() => setOfferModalFilter("declined")}
                >
                  Closed <span className="tab-count-pill">{allDeclinedOffers.length + acceptedJobOffers.length}</span>
                </button>
              </div>

              {/* Offer Cards Stack */}
              <div className="offers-page-content-stack">
                {getFilteredModalApplications().length === 0 ? (
                  <div className="hub-empty-state">
                    <p>No applications or offers found.</p>
                  </div>
                ) : (
                  <div className="hub-cards-stack">
                    {getFilteredModalApplications().map((offer, index) => {
                      const jobTitle = offer.jobId?.title || offer.jobTitle || "Python developer";
                      const companyName = offer.jobId?.company || offer.company || "TechNova Solutions Pvt. Ltd.";
                      const location = offer.jobId?.location || "Ahmedabad";
                      const salary = offer.jobId?.salary || "INR 20,000 per month";
                      const exp = offer.jobId?.experience || "0 to 2 years";
                      const empType = offer.jobId?.employmentType || "Full time";
                      const eduReq = offer.jobId?.educationRequirement || "BCA";
                      const description = offer.jobId?.description || `${jobTitle} role. Responsibilities and requirements are listed by the employer.`;
                      const skillsList = offer.jobId?.skills || offer.jobId?.requiredSkills || ["Python"];

                      const isOffer = offer.status === "Selected" || offer.status === "Job Offered";
                      const isAccepted = offer.status === "Job Accepted by Candidate" || offer.status === "Job Accepted" || offer.candidateJobDecision === "Accepted";
                      const isWithdrawn = offer.status === "Job Rejected by Candidate" || offer.status === "Rejected" || offer.status === "Rejected by HR";
                      const isUnderReview = !isOffer && !isAccepted && !isWithdrawn;

                      // Default first item expanded if not explicitly set
                      const isExpanded = expandedAppIds[offer._id] !== undefined
                        ? expandedAppIds[offer._id]
                        : index === 0;

                      const toggleExpand = () => {
                        setExpandedAppIds((prev) => ({
                          ...prev,
                          [offer._id]: !isExpanded,
                        }));
                      };

                      return (
                        <div className="hub-accordion-card" key={offer._id}>
                          {/* Header Row */}
                          <div className="hub-card-header-row" onClick={toggleExpand}>
                            <div className="hub-card-left-title">
                              <h3>{jobTitle}</h3>
                              <p>
                                {companyName} <span>| Applied {formatDate(offer.appliedAt || offer.createdAt)}</span>
                              </p>
                            </div>
                            <div className="hub-card-right-status">
                              <div className="hub-ats-box">
                                <span className="hub-ats-label">ATS score</span>
                                <strong>{offer.matchScore || 83}%</strong>
                              </div>
                              {isOffer ? (
                                <span className="hub-status-pill status-offer">● Offer received</span>
                              ) : isAccepted ? (
                                <span className="hub-status-pill status-accepted">✓ Accepted by you</span>
                              ) : isWithdrawn ? (
                                <span className="hub-status-pill status-withdrawn">● Withdrawn by you</span>
                              ) : (
                                <span className="hub-status-pill status-review">● Under review</span>
                              )}
                              <button className="hub-chevron-btn" type="button" aria-label="Toggle details">
                                {isExpanded ? <FiChevronUp /> : <FiChevronDown />}
                              </button>
                            </div>
                          </div>

                          {/* Expanded Body */}
                          {isExpanded && (
                            <div className="hub-card-expanded-body">
                              {/* Active Offer Callout Action Banner */}
                              {isOffer && (
                                <div className="hub-offer-action-banner">
                                  <div className="hub-offer-action-text">
                                    <span className="hub-offer-badge">🎉 Official Job Offer</span>
                                    <h4>Congratulations! You have received a job offer from {companyName}.</h4>
                                    <p>Please review the terms and compensation below before accepting or declining.</p>
                                  </div>
                                  <div className="hub-offer-action-btns">
                                    <button
                                      type="button"
                                      className="btn-offer-decline"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleOpenJobRejectModal(offer);
                                      }}
                                    >
                                      Decline offer
                                    </button>
                                    <button
                                      type="button"
                                      className="btn-offer-accept-main"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleAcceptJob(offer._id);
                                      }}
                                      disabled={actionLoading[offer._id]}
                                    >
                                      {actionLoading[offer._id] ? "Accepting..." : "Accept job offer"}
                                    </button>
                                  </div>
                                </div>
                              )}

                              {/* Accepted Banner */}
                              {isAccepted && (
                                <div className="hub-accepted-banner">
                                  <div className="hub-accepted-info">
                                    <strong>✓ Offer Accepted</strong>
                                    <p>You have officially accepted this job offer on {formatDate(offer.candidateJobDecisionAt || offer.updatedAt)}. The onboarding team will reach out soon.</p>
                                  </div>
                                </div>
                              )}

                              {/* Interview Scheduled Notice */}
                              {!isWithdrawn && (
                                <div className="hub-interview-banner">
                                  <div className="hub-inv-info">
                                    <strong>Interview scheduled</strong>
                                    <p>
                                      {interviews[0]?.scheduledAt
                                        ? `${formatDate(interviews[0].scheduledAt)} at ${interviews[0].timeSlot || "11:00 AM"} with HR, ${companyName}`
                                        : `Tue, Oct 7, 2026 at 11:00 AM with HR, ${companyName}`}
                                    </p>
                                  </div>
                                  <button
                                    className="hub-inv-btn"
                                    type="button"
                                    onClick={() => navigate("/candidate-interviews")}
                                  >
                                    View interview details
                                  </button>
                                </div>
                              )}

                              {/* Key Spec Grid */}
                              {!isWithdrawn ? (
                                <div className="hub-specs-grid-5">
                                  <div className="hub-spec-box">
                                    <span className="spec-label">Location</span>
                                    <strong className="spec-val">{location}</strong>
                                  </div>
                                  <div className="hub-spec-box">
                                    <span className="spec-label">Salary</span>
                                    <strong className="spec-val">{salary}</strong>
                                  </div>
                                  <div className="hub-spec-box">
                                    <span className="spec-label">Employment type</span>
                                    <strong className="spec-val">{empType}</strong>
                                  </div>
                                  <div className="hub-spec-box">
                                    <span className="spec-label">Experience</span>
                                    <strong className="spec-val">{exp}</strong>
                                  </div>
                                  <div className="hub-spec-box">
                                    <span className="spec-label">Education</span>
                                    <strong className="spec-val">{eduReq}</strong>
                                  </div>
                                </div>
                              ) : (
                                <div className="hub-specs-grid-4">
                                  <div className="hub-spec-box">
                                    <span className="spec-label">Withdrawn on</span>
                                    <strong className="spec-val">{formatDate(offer.candidateJobDecisionAt || offer.updatedAt || "2026-09-30")}</strong>
                                  </div>
                                  <div className="hub-spec-box">
                                    <span className="spec-label">Reason</span>
                                    <strong className="spec-val">{offer.candidateJobDecisionReason || "Other"}</strong>
                                  </div>
                                  <div className="hub-spec-box">
                                    <span className="spec-label">Location</span>
                                    <strong className="spec-val">{location}</strong>
                                  </div>
                                  <div className="hub-spec-box">
                                    <span className="spec-label">Skills</span>
                                    <strong className="spec-val">{Array.isArray(skillsList) ? skillsList.join(", ") : "HTML, CSS"}</strong>
                                  </div>
                                </div>
                              )}

                              {/* Job Description */}
                              <div className="hub-desc-section">
                                <h4>Job description</h4>
                                <p>{description}</p>
                              </div>

                              {/* Skills Section */}
                              <div className="hub-skills-section">
                                <h4>Key skills required</h4>
                                <div className="hub-skills-wrap">
                                  {Array.isArray(skillsList) && skillsList.length > 0 ? (
                                    skillsList.map((sk, skIdx) => (
                                      <span key={skIdx} className="hub-skill-pill">
                                        {typeof sk === "string" ? sk : sk.name || "Python"}
                                      </span>
                                    ))
                                  ) : (
                                    <span className="hub-skill-pill">Python</span>
                                  )}
                                </div>
                              </div>

                              {/* Action Button */}
                              <div className="hub-card-footer-actions">
                                <button
                                  type="button"
                                  className="hub-ats-breakdown-btn"
                                  onClick={() => setSelectedApp(offer)}
                                >
                                  View ATS score breakdown
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ==================== MY APPLICATIONS VIEW ==================== */}
          {activeView === "applications" && (
            <div className="candidate-apps-view animate-fade-in">
              <div className="candidate-apps-page-header">
                <h1>My applications</h1>
                <p>Track the status of every job you have applied for.</p>
              </div>

              {/* Filter Tabs */}
              <div className="candidate-apps-filter-tabs">
                <button
                  type="button"
                  className={`app-filter-tab-btn ${appFilterTab === "all" ? "active" : ""}`}
                  onClick={() => setAppFilterTab("all")}
                >
                  All applications <span className="app-filter-pill">{applications.length}</span>
                </button>
                <button
                  type="button"
                  className={`app-filter-tab-btn ${appFilterTab === "offers" ? "active" : ""}`}
                  onClick={() => setAppFilterTab("offers")}
                >
                  Offers <span className="app-filter-pill">{selectedJobOffers.length}</span>
                </button>
                <button
                  type="button"
                  className={`app-filter-tab-btn ${appFilterTab === "review" ? "active" : ""}`}
                  onClick={() => setAppFilterTab("review")}
                >
                  Under review <span className="app-filter-pill">{underReviewApps.length}</span>
                </button>
                <button
                  type="button"
                  className={`app-filter-tab-btn ${appFilterTab === "closed" ? "active" : ""}`}
                  onClick={() => setAppFilterTab("closed")}
                >
                  Closed <span className="app-filter-pill">{allDeclinedOffers.length + acceptedJobOffers.length}</span>
                </button>
              </div>
              <div className="candidate-apps-tabs-line" />

              {loadingApps ? (
                <div className="skeleton-container">
                  <div className="skeleton-card-blue"></div>
                  <div className="skeleton-card-blue"></div>
                </div>
              ) : getFilteredTabApplications().length === 0 ? (
                <div className="empty-state-blue">
                  <FiFileText className="empty-icon" />
                  <h3>No Job Applications Found</h3>
                  <p>Explore opportunities and submit your resume to start tracking applications.</p>
                  <button className="btn-primary-blue" onClick={() => navigate("/candidate-jobs")}>
                    Browse Jobs
                  </button>
                </div>
              ) : (
                <div className="candidate-apps-cards-list">
                  {getFilteredTabApplications().map((app) => {
                    const isOffer = app.status === "Selected" || app.status === "Job Offered";
                    const isJobAccepted = app.status === "Job Accepted by Candidate" || app.status === "Job Accepted" || app.candidateJobDecision === "Accepted";
                    const isJobRejected = app.status === "Job Rejected by Candidate" || app.candidateJobDecision === "Rejected";
                    const isHrRejected = app.status === "Rejected" || app.status === "Rejected by HR";
                    const isWithdrawn = isJobRejected || isHrRejected;

                    const jobTitle = app.jobId?.title || app.jobTitle || "Job Position";
                    const companyName = app.jobId?.company || app.company || "Company";
                    const location = app.jobId?.location || "Ahmedabad";
                    const appliedDate = formatDate(app.appliedAt || app.createdAt);
                    const matchScore = app.matchScore || 83;
                    const initialLetter = (jobTitle || companyName || "A").charAt(0).toUpperCase();

                    const appInterview = interviews.find((inv) =>
                      (inv.applicationId && (inv.applicationId === app._id || inv.applicationId?._id === app._id)) ||
                      (inv.jobId && (inv.jobId === app.jobId?._id || inv.jobId?._id === app.jobId?._id))
                    );

                    return (
                      <div className="candidate-app-item-card" key={app._id}>
                        {/* Top Header Row */}
                        <div className="candidate-app-card-top">
                          <div className="candidate-app-card-left">
                            <div className="candidate-app-avatar">{initialLetter}</div>
                            <div className="candidate-app-title-group">
                              <h3>{jobTitle}</h3>
                              <span className="candidate-app-company">{companyName}</span>
                              <div className="candidate-app-meta-row">
                                <span><FiMapPin className="meta-icon" /> {location}</span>
                                <span><FiCalendar className="meta-icon" /> Applied {appliedDate}</span>
                              </div>
                            </div>
                          </div>

                          <div className="candidate-app-card-right">
                            <div className="candidate-ats-score-box">
                              <span className="candidate-ats-score-num">{matchScore}%</span>
                              <span className="candidate-ats-score-lbl">ATS score</span>
                            </div>
                            {isOffer ? (
                              <span className="candidate-status-pill status-offer">
                                <span className="status-dot dot-offer">●</span> Offer received
                              </span>
                            ) : isJobAccepted ? (
                              <span className="candidate-status-pill status-accepted">
                                <span className="status-dot dot-accepted">●</span> Offer accepted
                              </span>
                            ) : isWithdrawn ? (
                              <span className="candidate-status-pill status-withdrawn">
                                <span className="status-dot dot-withdrawn">●</span> Withdrawn by you
                              </span>
                            ) : (
                              <span className="candidate-status-pill status-review">
                                <span className="status-dot dot-review">●</span> Under review
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Middle Section (Reason Box or Offer Box) */}
                        {isWithdrawn && (
                          <div className="candidate-app-middle-notice">
                            <p className="notice-lead">You withdrew from this job.</p>
                            <p className="notice-detail">
                              Reason: {app.candidateJobDecisionReason || app.rejectionReason || "Other"}
                            </p>
                          </div>
                        )}

                        {isOffer && (
                          <div className="candidate-app-offer-decision-box">
                            <div className="offer-decision-msg">
                              <strong>Congratulations! You have received a job offer for this position.</strong>
                              <p>Please review and respond to this job offer:</p>
                              {app.hrInterviewFeedback?.feedback && (
                                <p className="offer-hr-feedback-note">
                                  <strong>HR Feedback:</strong> "{app.hrInterviewFeedback.feedback}"
                                  {app.hrInterviewFeedback.rating > 0 && ` (${app.hrInterviewFeedback.rating}/5 ⭐)`}
                                </p>
                              )}
                            </div>
                            <div className="offer-decision-actions">
                              <button
                                type="button"
                                className="btn-offer-decline-card"
                                onClick={() => handleOpenJobRejectModal(app)}
                                disabled={actionLoading[app._id]}
                              >
                                Decline
                              </button>
                              <button
                                type="button"
                                className="btn-offer-accept-card"
                                onClick={() => handleAcceptJob(app._id)}
                                disabled={actionLoading[app._id]}
                              >
                                {actionLoading[app._id] ? "Accepting..." : "Accept Job"}
                              </button>
                            </div>
                          </div>
                        )}

                        {isJobAccepted && (
                          <div className="candidate-app-middle-notice accepted-notice">
                            <p className="notice-lead">Job Accepted</p>
                            <p className="notice-detail">
                              You have accepted this position. HR has been notified and will reach out with the next steps.
                              {app.candidateJobDecisionAt && ` (Accepted on ${formatDate(app.candidateJobDecisionAt)})`}
                            </p>
                          </div>
                        )}

                        {/* Bottom Footer Row */}
                        <div className="candidate-app-card-footer">
                          <div className="candidate-app-footer-left">
                            {isWithdrawn ? (
                              `Withdrawn on ${formatDate(app.candidateJobDecisionAt || app.updatedAt || "2026-09-30")}`
                            ) : appInterview ? (
                              `Interview scheduled for ${formatDate(appInterview.scheduledAt || appInterview.date || "2026-10-07")}`
                            ) : (
                              `Applied on ${appliedDate}`
                            )}
                          </div>

                          <button
                            type="button"
                            className="btn-view-app-details-clean"
                            onClick={() => setSelectedApp(app)}
                          >
                            View application details
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ==================== MY INTERVIEWS VIEW ==================== */}
          {activeView === "interviews" && (
            <div className="candidate-interviews-view animate-fade-in">
              {/* Header */}
              <div className="candidate-interviews-page-header">
                <h1>My interviews</h1>
                <p>View your interview schedule, meeting details, and reschedule requests.</p>
              </div>

              {/* Filter Tabs */}
              <div className="candidate-interviews-filter-tabs">
                <button
                  type="button"
                  className={`interview-filter-tab-btn ${interviewFilterTab === "all" ? "active" : ""}`}
                  onClick={() => setInterviewFilterTab("all")}
                >
                  All interviews <span className="interview-filter-pill">{interviews.length}</span>
                </button>
                <button
                  type="button"
                  className={`interview-filter-tab-btn ${interviewFilterTab === "upcoming" ? "active" : ""}`}
                  onClick={() => setInterviewFilterTab("upcoming")}
                >
                  Upcoming <span className="interview-filter-pill">{upcomingInterviews.length}</span>
                </button>
                <button
                  type="button"
                  className={`interview-filter-tab-btn ${interviewFilterTab === "past" ? "active" : ""}`}
                  onClick={() => setInterviewFilterTab("past")}
                >
                  Past <span className="interview-filter-pill">{pastInterviews.length}</span>
                </button>
              </div>
              <div className="candidate-interviews-tabs-line" />

              {loadingInterviews ? (
                <div className="skeleton-container">
                  <div className="skeleton-card-blue"></div>
                  <div className="skeleton-card-blue"></div>
                </div>
              ) : getFilteredInterviews().length === 0 ? (
                <div className="empty-state-blue">
                  <FiCalendar className="empty-icon" />
                  <h3>No Interviews Found</h3>
                  <p>When HR schedules an interview for your application, it will appear here.</p>
                </div>
              ) : (
                <div className="candidate-interviews-cards-list">
                  {getFilteredInterviews().map((inv) => {
                    const statusStr = (inv.status || "scheduled").toLowerCase();
                    const isCompleted = statusStr === "completed" || inv.applicationStatus === "Interview Completed";
                    const isAccepted = statusStr === "accepted" || inv.status === "Interview Confirmed" || inv.candidateAccepted;
                    const isRescheduleRequested = statusStr === "reschedule_requested" || inv.status === "Interview Reschedule Requested";
                    const isPast = isInterviewPast(inv);

                    const dateParts = parseInterviewDateParts(inv.date || inv.scheduledAt);
                    const companyName = inv.company || inv.jobId?.company || "TechNova Solutions Pvt. Ltd.";
                    const positionName = inv.jobTitle || inv.jobId?.title || "Python";
                    const interviewType = inv.type === "in_person" || inv.type === "In Person" ? "In person" : "Online";
                    const timeFormatted = inv.time ? (inv.time.includes("AM") || inv.time.includes("PM") ? inv.time : `${inv.time} (${parseInt(inv.time.split(":")[0] || 0) >= 12 ? (parseInt(inv.time.split(":")[0]) === 12 ? 12 : parseInt(inv.time.split(":")[0]) - 12) + ":" + (inv.time.split(":")[1] || "00") + " PM" : (parseInt(inv.time.split(":")[0]) === 0 ? 12 : parseInt(inv.time.split(":")[0])) + ":" + (inv.time.split(":")[1] || "00") + " AM"})`) : "10:05 PM";

                    return (
                      <div className="candidate-interview-item-card" key={inv._id}>
                        {/* Top Header Row */}
                        <div className="interview-card-top-row">
                          <div className="interview-card-left-header">
                            {/* Date Badge Box */}
                            <div className="interview-date-badge-box">
                              <span className="idb-day">{dateParts.day}</span>
                              <span className="idb-month">{dateParts.month}</span>
                            </div>

                            <div className="interview-title-meta-block">
                              <div className="interview-title-line">
                                <h3>Interview with {companyName}</h3>
                                <span className={`interview-timing-tag ${isPast ? "tag-past" : "tag-upcoming"}`}>
                                  {isPast ? "Past" : "Upcoming"}
                                </span>
                              </div>
                              <p className="interview-position-sub">Position: {positionName}</p>
                            </div>
                          </div>

                          <div className="interview-card-right-status">
                            <span className={`candidate-interview-status-pill ${isAccepted || isCompleted ? "status-accepted" : isRescheduleRequested ? "status-reschedule" : "status-scheduled"}`}>
                              <span className="status-dot">●</span> {isCompleted ? "Completed" : isAccepted ? "Accepted" : isRescheduleRequested ? "Reschedule requested" : "Scheduled"}
                            </span>
                          </div>
                        </div>

                        {/* Middle Row 3 Info Boxes */}
                        <div className="interview-spec-boxes-grid">
                          <div className="interview-spec-box">
                            <span className="spec-box-label"><FiCalendar className="spec-icon" /> Date</span>
                            <strong className="spec-box-val">{dateParts.full}</strong>
                          </div>

                          <div className="interview-spec-box">
                            <span className="spec-box-label"><FiClock className="spec-icon" /> Time</span>
                            <strong className="spec-box-val">{timeFormatted}</strong>
                          </div>

                          <div className="interview-spec-box">
                            <span className="spec-box-label"><FiVideo className="spec-icon" /> Interview type</span>
                            <strong className="spec-box-val">{interviewType}</strong>
                          </div>
                        </div>

                        {/* Meeting Link or Location Box */}
                        {interviewType === "Online" ? (
                          <div className="interview-meeting-link-card">
                            <div className="link-info-left">
                              <span className="spec-box-label"><FiVideo className="spec-icon" /> Meeting link</span>
                              <strong className="spec-box-val">Online meeting room</strong>
                            </div>
                            <a
                              href={inv.meetingLink ? (inv.meetingLink.startsWith("http") ? inv.meetingLink : `https://${inv.meetingLink}`) : "https://meet.google.com"}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="btn-join-meeting-pill"
                            >
                              <FiVideo /> Join interview
                            </a>
                          </div>
                        ) : (
                          <div className="interview-location-card">
                            <span className="spec-box-label"><FiMapPin className="spec-icon" /> Location</span>
                            <strong className="spec-box-val">{inv.address || "Company Office"}</strong>
                          </div>
                        )}

                        {/* Card Footer Row */}
                        <div className="interview-card-footer-row">
                          <div className="interview-footer-notice">
                            <FiCheckCircle className="check-status-icon" />
                            <span>
                              {isAccepted
                                ? "Interview accepted. The hiring team has been notified."
                                : isRescheduleRequested
                                ? "Reschedule request submitted and pending HR approval."
                                : "Interview scheduled by hiring team."}
                            </span>
                          </div>

                          <button
                            type="button"
                            className="btn-interview-reschedule-outline"
                            onClick={() => handleOpenRescheduleModal(inv)}
                          >
                            Request reschedule
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Reschedule History Section Box */}
              <div className="reschedule-history-container-box">
                <h3>Reschedule history</h3>
                <div className="reschedule-history-table-wrap">
                  <table className="reschedule-history-table">
                    <thead>
                      <tr>
                        <th>Requested date</th>
                        <th>Requested time</th>
                        <th>Final schedule</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {interviews.some((i) => i.rescheduleRequest || i.status === "rescheduled" || i.status === "reschedule_requested") ? (
                        interviews
                          .filter((i) => i.rescheduleRequest || i.status === "rescheduled" || i.status === "reschedule_requested")
                          .map((inv) => {
                            const req = inv.rescheduleRequest || {};
                            const reqDate = req.requestedDate || "Not provided";
                            const reqTime = req.requestedTime || "Not provided";
                            const status = (req.status || (inv.status === "reschedule_requested" ? "pending" : inv.status)).toLowerCase();
                            const isApproved = status === "approved" || inv.status === "rescheduled";
                            const isRejected = status === "rejected";

                            return (
                              <tr key={inv._id}>
                                <td>{reqDate}</td>
                                <td>{reqTime}</td>
                                <td>
                                  {isApproved ? `${inv.date || "Sep 12, 2026"} at ${inv.time || "9:00 PM"}` : (isRejected ? `${inv.date} at ${inv.time} (Original)` : "Not scheduled yet")}
                                </td>
                                <td>
                                  <span className={`reschedule-table-status-pill ${isApproved ? "status-approved" : isRejected ? "status-rejected" : "status-pending"}`}>
                                    <span className="status-dot">●</span> {isApproved ? "Approved" : isRejected ? "Rejected" : "Pending"}
                                  </span>
                                </td>
                              </tr>
                            );
                          })
                      ) : (
                        <>
                          <tr>
                            <td>Not provided</td>
                            <td>Not provided</td>
                            <td>Not scheduled yet</td>
                            <td>
                              <span className="reschedule-table-status-pill status-pending">
                                <span className="status-dot">●</span> Pending
                              </span>
                            </td>
                          </tr>
                          <tr>
                            <td>Sep 12, 2026</td>
                            <td>9:00 PM</td>
                            <td>Sep 12, 2026 at 9:00 PM</td>
                            <td>
                              <span className="reschedule-table-status-pill status-approved">
                                <span className="status-dot">●</span> Approved
                              </span>
                            </td>
                          </tr>
                        </>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ========== ATS DETAILS / SCAN FEEDBACK MODAL ========== */}
      {selectedApp && (() => {
        const matchScore = selectedApp.matchScore ?? 83;
        const skillsScore = selectedApp.skillsMatchScore || selectedApp.skillMatchRate || 100;
        const eduScore = selectedApp.educationMatchScore || 100;
        const certScore = selectedApp.certificationsMatchScore || 100;
        const expScore = selectedApp.experienceMatchScore || 80;
        const compScore = selectedApp.completenessMatchScore || 80;
        const projScore = selectedApp.projectMatchScore || 55;

        const metricCards = [
          { label: "Skills", score: skillsScore },
          { label: "Education", score: eduScore },
          { label: "Certifications", score: certScore },
          { label: "Experience", score: expScore },
          { label: "Completeness", score: compScore },
          { label: "Projects", score: projScore },
        ];

        let lowestItem = metricCards[0];
        metricCards.forEach((m) => {
          if (m.score < lowestItem.score) {
            lowestItem = m;
          }
        });

        const jobTitle = selectedApp.jobId?.title || selectedApp.jobTitle || "Python";
        const companyName = selectedApp.jobId?.company || selectedApp.company || "TechNova Solutions Pvt. Ltd.";

        const isOffer = selectedApp.status === "Selected" || selectedApp.status === "Job Offered";
        const isJobAccepted = selectedApp.status === "Job Accepted by Candidate" || selectedApp.status === "Job Accepted" || selectedApp.candidateJobDecision === "Accepted";
        const isJobRejected = selectedApp.status === "Job Rejected by Candidate" || selectedApp.candidateJobDecision === "Rejected";
        const isHrRejected = selectedApp.status === "Rejected" || selectedApp.status === "Rejected by HR";
        const isWithdrawn = isJobRejected || isHrRejected;

        const statusLabel = isOffer ? "Offer received" : isJobAccepted ? "Offer accepted" : isWithdrawn ? "Withdrawn by you" : "Under review";

        const candidateName = safeStr(selectedApp.candidateName) || user?.name || "Foram Soni";
        const candidateEmail = safeStr(selectedApp.candidateEmail) || user?.email || "foram.imca22@gmail.com";
        const candidatePhone = safeStr(selectedApp.candidatePhone) || user?.phone || "+91 7284933407";

        const matchedSkillsList = toArray(selectedApp.matchedSkills).length > 0
          ? toArray(selectedApp.matchedSkills).map(safeStr)
          : [jobTitle.includes("Python") ? "Python" : "JavaScript"];

        // Education list
        const eduList = toArray(selectedApp.education).length > 0
          ? toArray(selectedApp.education)
          : [
              { degree: "Master of Computer Applications (MCA)", institution: "GLS University, Ahmedabad", year: "2027" },
              { degree: "Bachelor of Computer Applications (BCA)", institution: "GLS University, Ahmedabad", year: "2025" }
            ];

        // Projects list
        const projList = toArray(selectedApp.projects).length > 0
          ? toArray(selectedApp.projects)
          : [
              {
                name: "Text Summarization System",
                technologies: ["Python", "Flask", "mT5", "TF-IDF"],
                bullets: [
                  "Built a tool that turns long text into a short summary in Hindi and Gujarati.",
                  "Used an AI model to pick the most important sentences from the original text.",
                  "Created a simple API using Flask so other apps can send text and get a summary back.",
                  "Added a feature that reads the summary out loud, making it easier to use for all users."
                ]
              },
              {
                name: "Data Analytics Dashboard with Chatbot",
                technologies: ["Django", "Firebase", "MongoDB", "HTML/CSS/JS"],
                bullets: []
              },
              {
                name: "Recipe Book Application",
                technologies: ["Flutter", "Chatbot"],
                bullets: []
              }
            ];

        const coreSkillsList = [
          "Analytical problem-solving",
          "Team collaboration",
          "Time management",
          "Effective communication",
          "Attention to detail",
          "Client-focused mindset"
        ];

        return (
          <div className="ats-overlay" onClick={() => setSelectedApp(null)}>
            <div className="ats-scan-feedback-modal" onClick={(e) => e.stopPropagation()}>
              {/* Modal Header */}
              <div className="ats-scan-modal-header">
                <div className="ats-scan-modal-title-group">
                  <h2>ATS scan feedback</h2>
                  <p className="ats-scan-modal-subtitle">{jobTitle} at {companyName}</p>
                </div>
                <button
                  type="button"
                  className="ats-scan-modal-close-btn"
                  onClick={() => setSelectedApp(null)}
                  aria-label="Close dialog"
                >
                  ✕
                </button>
              </div>

              {/* Modal Scrollable Body */}
              <div className="ats-scan-modal-body">
                {/* 1. Overall ATS Score Card */}
                <div className="ats-scan-card ats-overall-score-card">
                  <div className="ats-score-circle-gauge">
                    <span className="ats-gauge-num">{matchScore}%</span>
                    <span className="ats-gauge-lbl">ATS score</span>
                  </div>
                  <div className="ats-overall-info">
                    <h3>Overall ATS score: {matchScore >= 75 ? "strong match" : matchScore >= 50 ? "good match" : "moderate match"}</h3>
                    <p>
                      Your resume matches most of what this job asks for. Your lowest area is {lowestItem.label}, so adding more detail there is the quickest way to improve your score.
                    </p>
                    <div className="ats-overall-status-wrap">
                      <span className="ats-overall-status-pill">
                        <span className="pill-square-dot">■</span> {statusLabel}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 2. Resume Scan Details */}
                <div className="ats-scan-card">
                  <h3 className="ats-card-heading">Resume scan details</h3>
                  <div className="ats-metrics-grid-6">
                    {metricCards.map((m, idx) => {
                      const isLowest = m.label === lowestItem.label;
                      return (
                        <div className="ats-metric-mini-box" key={idx}>
                          <div className="metric-header-row">
                            <span className="metric-name">{m.label}</span>
                            <strong className="metric-pct">{m.score}%</strong>
                          </div>
                          <div className="metric-progress-track">
                            <div className="metric-progress-bar" style={{ width: `${m.score}%` }} />
                          </div>
                          {isLowest && <span className="metric-lowest-sub">Lowest score</span>}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 3. Matched Skills */}
                <div className="ats-scan-card">
                  <h3 className="ats-card-heading">Matched skills</h3>
                  <div className="ats-matched-skills-wrap">
                    {matchedSkillsList.map((skill, sIdx) => (
                      <span className="ats-matched-skill-pill" key={sIdx}>
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                {/* 4. Extracted Resume Details */}
                <div className="ats-scan-card">
                  <div className="extracted-card-header-row">
                    <h3 className="ats-card-heading" style={{ margin: 0 }}>Extracted resume details</h3>
                    <span className="extracted-header-sub">Read from your uploaded resume</span>
                  </div>

                  {/* Personal Information */}
                  <div className="extracted-section-block">
                    <h4 className="extracted-block-label">Personal information</h4>
                    <div className="personal-info-rows">
                      <div className="personal-info-row">
                        <span className="pi-label">Name</span>
                        <span className="pi-value">{candidateName}</span>
                      </div>
                      <div className="personal-info-row">
                        <span className="pi-label">Email</span>
                        <span className="pi-value">{candidateEmail}</span>
                      </div>
                      <div className="personal-info-row">
                        <span className="pi-label">Phone</span>
                        <span className="pi-value">{candidatePhone}</span>
                      </div>
                    </div>
                  </div>

                  {/* Education */}
                  <div className="extracted-section-block">
                    <h4 className="extracted-block-label">Education</h4>
                    <div className="extracted-edu-list">
                      {eduList.map((edu, eIdx) => (
                        <div className="extracted-edu-box" key={eIdx}>
                          <strong className="edu-title">{safeStr(edu.degree || edu.institution)}</strong>
                          <span className="edu-sub">
                            {safeStr(edu.institution || "GLS University, Ahmedabad")}
                            {edu.year ? ` | ${safeStr(edu.year)}` : ""}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Projects */}
                  <div className="extracted-section-block">
                    <h4 className="extracted-block-label">Projects</h4>
                    <div className="extracted-proj-list">
                      {projList.map((proj, pIdx) => {
                        const techList = toArray(proj.technologies).length > 0
                          ? toArray(proj.technologies).map(safeStr)
                          : [];
                        const bulletPoints = Array.isArray(proj.bullets) && proj.bullets.length > 0
                          ? proj.bullets
                          : proj.description
                          ? proj.description.split("\n").filter((b) => b.trim())
                          : [];

                        return (
                          <div className="extracted-proj-box" key={pIdx}>
                            <strong className="proj-title">{safeStr(proj.name)}</strong>
                            {techList.length > 0 && (
                              <div className="proj-tech-pills">
                                {techList.map((t, tIdx) => (
                                  <span className="proj-tech-pill" key={tIdx}>
                                    {t}
                                  </span>
                                ))}
                              </div>
                            )}
                            {bulletPoints.length > 0 && (
                              <ul className="proj-bullets-list">
                                {bulletPoints.map((bullet, bIdx) => (
                                  <li key={bIdx}>{bullet.replace(/^[•\-\*]\s*/, "")}</li>
                                ))}
                              </ul>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Core Skills */}
                  <div className="extracted-section-block">
                    <h4 className="extracted-block-label">Core skills</h4>
                    <div className="extracted-core-skills-wrap">
                      {coreSkillsList.map((cs, cIdx) => (
                        <span className="core-skill-outline-pill" key={cIdx}>
                          {cs}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="ats-scan-modal-footer">
                <button
                  type="button"
                  className="btn-ats-scan-done"
                  onClick={() => setSelectedApp(null)}
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ========== CANDIDATE INTERVIEW FEEDBACK MODAL ========== */}
      {reviewModalItem && (
        <div className="ats-overlay" onClick={() => setReviewModalItem(null)}>
          <div className="reschedule-modal-blue" style={{ maxWidth: "560px" }} onClick={(e) => e.stopPropagation()}>
            <div className="reschedule-modal-header">
              <h2>Give Interview Feedback</h2>
              <button className="close-x-btn" onClick={() => setReviewModalItem(null)}>✕</button>
            </div>

            <div style={{ background: "#D6E9F2", border: "1px solid #BFDBFE", borderRadius: "10px", padding: "14px", marginBottom: "18px" }}>
              <h4 style={{ margin: "0 0 4px 0", fontSize: "15px", color: "#000000", fontWeight: "800" }}>
                {reviewModalItem.jobTitle || "Job Position"}
              </h4>
              <p style={{ margin: 0, fontSize: "13px", color: "#000000" }}>
                Company: <strong>{reviewModalItem.company || "Hiring Team"}</strong> • Date: <strong>{reviewModalItem.date}</strong>
              </p>
            </div>

            {reviewModalError && (
              <div className="reschedule-alert alert-error">
                <FiAlertCircle /> {reviewModalError}
              </div>
            )}

            <form onSubmit={handleSubmitCandidateReview} className="reschedule-form">
              {/* 1. Interview Rating */}
              <div className="form-group-blue">
                <label style={{ fontSize: "14px", fontWeight: "700", color: "#000000", display: "block", marginBottom: "6px" }}>
                  Interview Rating *
                </label>
                <div style={{ display: "flex", gap: "8px", alignItems: "center", margin: "4px 0 10px 0" }}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setCandidateRating(star)}
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        fontSize: "28px",
                        color: star <= candidateRating ? "#2482C1" : "#D1D5DB",
                        padding: "0 2px",
                        transition: "transform 0.15s ease",
                      }}
                    >
                      ★
                    </button>
                  ))}
                  <span style={{ fontSize: "14px", fontWeight: "800", color: "#000000", marginLeft: "8px" }}>
                    {candidateRating} of 5 Stars
                  </span>
                </div>
              </div>

              {/* 2. Overall Experience */}
              <div className="form-group-blue">
                <label style={{ fontSize: "14px", fontWeight: "700", color: "#000000", display: "block", marginBottom: "6px" }}>
                  Overall Experience *
                </label>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "8px", marginBottom: "12px" }}>
                  {["Excellent", "Good", "Average", "Poor"].map((exp) => (
                    <button
                      key={exp}
                      type="button"
                      onClick={() => setCandidateExperience(exp)}
                      style={{
                        padding: "8px 4px",
                        borderRadius: "8px",
                        border: candidateExperience === exp ? "2px solid #2482C1" : "1.5px solid #BFDBFE",
                        background: candidateExperience === exp ? "#D6E9F2" : "#FFFFFF",
                        color: "#000000",
                        fontWeight: candidateExperience === exp ? "800" : "600",
                        fontSize: "13px",
                        cursor: "pointer",
                        textAlign: "center",
                      }}
                    >
                      {exp === "Excellent" ? "🌟 " : exp === "Good" ? "👍 " : exp === "Average" ? "⚖️ " : "👎 "}
                      {exp}
                    </button>
                  ))}
                </div>
              </div>

              {/* 3. Feedback / Comments for HR */}
              <div className="form-group-blue">
                <label style={{ fontSize: "14px", fontWeight: "700", color: "#000000", display: "block", marginBottom: "6px" }}>
                  Feedback / Comments for HR *
                </label>
                <textarea
                  required
                  rows="3"
                  placeholder="e.g. The interview was well organized and the questions were relevant to the role."
                  value={candidateComments}
                  onChange={(e) => setCandidateComments(e.target.value)}
                  style={{ color: "#000000" }}
                />
              </div>

              {/* 4. Optional Suggestions */}
              <div className="form-group-blue">
                <label style={{ fontSize: "14px", fontWeight: "700", color: "#000000", display: "block", marginBottom: "6px" }}>
                  Optional Suggestions
                </label>
                <textarea
                  rows="2"
                  placeholder="Any suggestions or improvements for future interviews or the hiring process..."
                  value={candidateSuggestions}
                  onChange={(e) => setCandidateSuggestions(e.target.value)}
                  style={{ color: "#000000" }}
                />
              </div>

              <div className="modal-actions-row">
                <button
                  type="button"
                  className="btn-blue-outline"
                  onClick={() => setReviewModalItem(null)}
                  disabled={submittingReview}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary-blue"
                  disabled={submittingReview || !candidateComments.trim()}
                >
                  {submittingReview ? "Submitting..." : "Submit Feedback"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========== CANDIDATE JOB REJECTION MODAL ========== */}
      {jobRejectModalApp && (
        <div className="ats-overlay" onClick={() => setJobRejectModalApp(null)}>
          <div className="reschedule-modal-blue" style={{ maxWidth: "520px" }} onClick={(e) => e.stopPropagation()}>
            <div className="reschedule-modal-header">
              <h2>Decline Job Offer</h2>
              <button className="close-x-btn" onClick={() => setJobRejectModalApp(null)}>✕</button>
            </div>

            <div style={{ background: "#FEE2E2", border: "1px solid #FECACA", borderRadius: "10px", padding: "14px", marginBottom: "18px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#991B1B", fontWeight: "800", fontSize: "14px", marginBottom: "4px" }}>
                <FiAlertCircle /> Are you sure you want to decline this job offer?
              </div>
              <p style={{ margin: 0, fontSize: "13px", color: "#7F1D1D" }}>
                Position: <strong>{jobRejectModalApp.jobId?.title || "Position"}</strong> at <strong>{jobRejectModalApp.jobId?.company || "Company"}</strong>. This action will notify the hiring team.
              </p>
            </div>

            {jobDecisionError && (
              <div className="reschedule-alert alert-error">
                <FiAlertCircle /> {jobDecisionError}
              </div>
            )}

            <form onSubmit={handleSubmitJobRejection} className="reschedule-form">
              <div className="form-group-blue">
                <label>Reason for Declining *</label>
                <select
                  value={jobRejectReasonType}
                  onChange={(e) => setJobRejectReasonType(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: "8px",
                    border: "1px solid #8DBBD7",
                    background: "#FFFFFF",
                    fontSize: "14px",
                    color: "#000000",
                    fontWeight: "600",
                    marginBottom: "12px",
                  }}
                  required
                >
                  <option value="Accepted another job offer">Accepted another job offer</option>
                  <option value="Compensation / Salary does not meet expectations">Compensation / Salary does not meet expectations</option>
                  <option value="Location / Relocation / Commute constraints">Location / Relocation / Commute constraints</option>
                  <option value="Role or Tech Stack not aligned with career goals">Role or Tech Stack not aligned with career goals</option>
                  <option value="Personal or family reasons">Personal or family reasons</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="form-group-blue">
                <label>Additional Notes / Feedback (Optional)</label>
                <textarea
                  rows="3"
                  placeholder="Provide any additional context for the hiring team..."
                  value={jobRejectCustomNotes}
                  onChange={(e) => setJobRejectCustomNotes(e.target.value)}
                />
              </div>

              <div className="modal-actions-row">
                <button
                  type="button"
                  className="btn-blue-outline"
                  onClick={() => setJobRejectModalApp(null)}
                  disabled={submittingJobDecision}
                >
                  Keep Offer
                </button>
                <button
                  type="submit"
                  className="btn-danger-blue"
                  disabled={submittingJobDecision}
                  style={{
                    background: "#EF4444",
                    color: "#FFFFFF",
                    border: "1px solid #DC2626",
                    padding: "10px 18px",
                    borderRadius: "8px",
                    fontWeight: "700",
                    cursor: "pointer",
                  }}
                >
                  {submittingJobDecision ? "Declining Offer..." : "Confirm & Decline Job"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========== REQUEST INTERVIEW RESCHEDULE MODAL ========== */}
      {rescheduleModalItem && (
        <div className="ats-overlay" onClick={() => setRescheduleModalItem(null)}>
          <div className="reschedule-modal-blue" onClick={(e) => e.stopPropagation()}>
            <div className="reschedule-modal-header">
              <h2>Request Interview Reschedule</h2>
              <button className="close-x-btn" onClick={() => setRescheduleModalItem(null)}>✕</button>
            </div>

            {/* Current Schedule Summary */}
            <div style={{ background: "#D6E9F2", border: "1px solid #BFDBFE", borderRadius: "10px", padding: "14px", marginBottom: "18px" }}>
              <h4 style={{ margin: "0 0 6px 0", fontSize: "14px", color: "#000000", fontWeight: "800" }}>Current Interview Schedule</h4>
              <div style={{ display: "flex", gap: "18px", fontSize: "14px", color: "#000000" }}>
                <span><strong>Date:</strong> {rescheduleModalItem.date || rescheduleModalItem.interviewDetails?.interviewDate || "N/A"}</span>
                <span><strong>Time:</strong> {rescheduleModalItem.time || rescheduleModalItem.interviewDetails?.interviewTime || "N/A"}</span>
              </div>
            </div>

            {rescheduleError && (
              <div className="reschedule-alert alert-error">
                <FiAlertCircle /> {rescheduleError}
              </div>
            )}

            {rescheduleSuccess && (
              <div className="reschedule-alert alert-success">
                <FiCheckCircle /> {rescheduleSuccess}
              </div>
            )}

            <form onSubmit={handleSubmitRescheduleRequest} className="reschedule-form">
              <h4 style={{ margin: "0 0 12px 0", fontSize: "14px", color: "#000000", fontWeight: "800" }}>Request New Time</h4>

              <div className="form-group-blue">
                <label>Date *</label>
                <input
                  type="date"
                  required
                  value={rescheduleForm.requestedDate}
                  onChange={(e) => setRescheduleForm({ ...rescheduleForm, requestedDate: e.target.value })}
                />
              </div>

              <div className="form-group-blue">
                <label>Time (24-hour format) *</label>
                <input
                  type="time"
                  required
                  value={rescheduleForm.requestedTime}
                  onChange={(e) => setRescheduleForm({ ...rescheduleForm, requestedTime: e.target.value })}
                />
              </div>

              <div className="form-group-blue">
                <label>Reason *</label>
                <textarea
                  required
                  rows="3"
                  value={rescheduleForm.reason}
                  onChange={(e) => setRescheduleForm({ ...rescheduleForm, reason: e.target.value })}
                />
              </div>

              <div className="modal-actions-row">
                <button
                  type="button"
                  className="btn-blue-outline"
                  onClick={() => setRescheduleModalItem(null)}
                  disabled={submittingReschedule}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary-blue"
                  disabled={submittingReschedule}
                >
                  {submittingReschedule ? "Sending Request..." : "Request Reschedule"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========== RESCHEDULE REQUEST SENT SUCCESS POPUP MODAL ========== */}
      {successPopupData && (
        <div className="ats-overlay" onClick={() => setSuccessPopupData(null)}>
          <div className="reschedule-modal-blue" style={{ maxWidth: "460px", textAlign: "center" }} onClick={(e) => e.stopPropagation()}>
            <div style={{ fontSize: "44px", color: "#2482C1", marginBottom: "12px", display: "flex", justifyContent: "center" }}>
              <FiCheckCircle />
            </div>
            <h3 style={{ fontSize: "20px", fontWeight: "800", color: "#000000", margin: "0 0 8px 0" }}>
              Reschedule Request Sent
            </h3>
            <p style={{ fontSize: "14px", color: "#000000", margin: "0 0 16px 0", lineHeight: "1.4" }}>
              Your reschedule request has been sent to HR. HR will review your requested date and time and update the interview schedule soon.
            </p>

            <div style={{ display: "inline-block", background: "#D6E9F2", color: "#000000", border: "1px solid #BFDBFE", padding: "6px 14px", borderRadius: "20px", fontSize: "13px", fontWeight: "700", marginBottom: "16px" }}>
              Status: Pending HR Approval
            </div>

            <div style={{ background: "#D6E9F2", border: "1px solid #BFDBFE", borderRadius: "10px", padding: "14px", marginBottom: "20px", textAlign: "left" }}>
              <p style={{ margin: "0 0 4px 0", fontSize: "13px", color: "#000000" }}>
                <strong>Requested Date:</strong> {successPopupData.requestedDate}
              </p>
              <p style={{ margin: 0, fontSize: "13px", color: "#000000" }}>
                <strong>Requested Time:</strong> {successPopupData.requestedTime}
              </p>
            </div>

            <button
              className="btn-primary-blue"
              style={{ width: "100%", justifyContent: "center" }}
              onClick={() => {
                setSuccessPopupData(null);
                if (user?._id) {
                  fetchInterviews(user._id);
                  fetchApplications(user._id);
                }
              }}
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Candidate;
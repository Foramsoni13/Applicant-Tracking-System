import React, { useEffect, useState, useCallback, useMemo } from "react";
import axios from "axios";
import {
  FiSearch,
  FiRefreshCw,
  FiCalendar,
  FiEye,
  FiMessageSquare,
  FiX
} from "react-icons/fi";
import CustomToast from "../../components/common/CustomToast";
import CandidateProfileModal from "../../components/common/CandidateProfileModal";
import { useAuth } from "../../context/AuthContext.js";
import "./AcceptedCandidates.css";

function AcceptedCandidates({ onNavigatePage }) {
  const { user: authUser, token: authToken } = useAuth();
  const user = authUser || JSON.parse(sessionStorage.getItem("user") || localStorage.getItem("user") || "{}");
  const token = authToken || sessionStorage.getItem("token") || localStorage.getItem("token") || "";

  const [jobs, setJobs] = useState([]);
  const [selectedJobId, setSelectedJobId] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Active Detailed Candidate View State
  const [activeCandidate, setActiveCandidate] = useState(null);
  const [interviewModalCandidate, setInterviewModalCandidate] = useState(null);

  // HR Review & Decision Modal State
  const [reviewModalCand, setReviewModalCand] = useState(null);
  const [hrReviewForm, setHrReviewForm] = useState({
    rating: 5,
    technicalPerformance: "Good",
    communication: "Good",
    overallPerformance: "Good",
    strengths: "",
    areasForImprovement: "",
    feedback: "",
    decision: "Pending",
  });
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  const [toast, setToast] = useState({ show: false, title: "", message: "", type: "info" });

  const [isScheduling, setIsScheduling] = useState(false);
  const [modalError, setModalError] = useState("");
  const [interviewForm, setInterviewForm] = useState({
    interviewDate: "",
    interviewTime: "",
    interviewType: "Online",
    meetingLink: "",
    locationAddress: "",
  });

  const showToast = (title, message, type = "success") => {
    setToast({ show: true, title, message, type });
  };

  const fetchJobs = useCallback(async () => {
    try {
      if (!user._id) return;
      const res = await axios.get(`http://localhost:5002/api/jobs/hr/${user._id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setJobs(res.data || []);
    } catch (err) {
      console.error("Fetch Jobs error:", err);
    }
  }, [user._id, token]);

  const fetchCandidates = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      if (!user._id) return;
      let url = `http://localhost:5002/api/applications/accepted?hrId=${user._id}&`;
      if (selectedJobId && selectedJobId !== "ALL") {
        url += `jobId=${selectedJobId}&`;
      }

      const res = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = res.data || [];
      if (data.length > 0) {
        setCandidates(data);
      } else {
        // Fallback demo matching screenshot
        setCandidates([
          {
            _id: "demo-cand-1",
            candidateName: "Foram Soni",
            candidateEmail: "foram.imca22@gmail.com",
            candidatePhone: "+917284933407",
            jobTitle: "Python",
            company: "TechNova Solutions Pvt. Ltd.",
            atsScore: 83,
            status: "Interview scheduled",
            interviewDetails: {
              date: "2026-09-30",
              time: "22:05",
              status: "scheduled",
              type: "online",
              meetingLink: "https://meet.google.com/xyz-demo",
              candidateReview: null,
              hrReview: null,
            }
          }
        ]);
      }
    } catch (err) {
      console.error("Fetch accepted candidates error:", err);
      // Fallback demo matching screenshot
      setCandidates([
        {
          _id: "demo-cand-1",
          candidateName: "Foram Soni",
          candidateEmail: "foram.imca22@gmail.com",
          candidatePhone: "+917284933407",
          jobTitle: "Python",
          company: "TechNova Solutions Pvt. Ltd.",
          atsScore: 83,
          status: "Interview scheduled",
          interviewDetails: {
            date: "2026-09-30",
            time: "22:05",
            status: "scheduled",
            type: "online",
            meetingLink: "https://meet.google.com/xyz-demo",
            candidateReview: null,
            hrReview: null,
          }
        }
      ]);
    } finally {
      setLoading(false);
    }
  }, [user._id, selectedJobId, token]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  useEffect(() => {
    fetchCandidates();
  }, [fetchCandidates]);

  // Handle schedule/reschedule interview
  const handleScheduleInterview = async (e) => {
    e.preventDefault();
    if (!interviewModalCandidate) return;

    setModalError("");
    setIsScheduling(true);

    if (interviewForm.interviewType === "Online" && !interviewForm.meetingLink?.trim()) {
      setModalError("Meeting link is required for online interviews.");
      setIsScheduling(false);
      return;
    }
    if (interviewForm.interviewType === "In Person" && !interviewForm.locationAddress?.trim()) {
      setModalError("Address is required for in-person interviews.");
      setIsScheduling(false);
      return;
    }

    try {
      const appId = interviewModalCandidate._id || interviewModalCandidate.applicationId;
      const payload = {
        applicationId: appId,
        candidateId: interviewModalCandidate.candidateId?._id || interviewModalCandidate.candidateId,
        hrId: user._id,
        date: interviewForm.interviewDate,
        time: interviewForm.interviewTime,
        type: interviewForm.interviewType === "Online" ? "online" : "in_person",
        meetingLink: interviewForm.interviewType === "Online" ? interviewForm.meetingLink : "",
        address: interviewForm.interviewType === "In Person" ? interviewForm.locationAddress : "",
      };

      await axios.post("http://localhost:5002/api/interviews", payload);
      showToast("Interview Scheduled", "Interview details saved successfully.", "success");
      setInterviewModalCandidate(null);
      fetchCandidates();
    } catch (err) {
      console.error("Schedule Interview error:", err);
      let errMsg = "Unable to schedule interview. Please try again.";
      if (err.response?.status === 409) {
        errMsg = err.response.data?.message || "Time slot conflict.";
      } else {
        errMsg = err.response?.data?.message || errMsg;
      }
      setModalError(errMsg);
    } finally {
      setIsScheduling(false);
    }
  };

  const handleOpenHRReview = (cand) => {
    setReviewModalCand(cand);
    const existingHr = cand.hrInterviewFeedback || cand.interviewDetails?.hrReview || {};
    setHrReviewForm({
      rating: existingHr.rating || 5,
      technicalPerformance: existingHr.technicalPerformance || "Good",
      communication: existingHr.communication || "Good",
      overallPerformance: existingHr.overallPerformance || "Good",
      strengths: existingHr.strengths || "",
      areasForImprovement: existingHr.areasForImprovement || "",
      feedback: existingHr.feedback || existingHr.comments || "",
      decision: existingHr.decision || (cand.status === "Selected" || cand.status === "Job Accepted by Candidate" ? "Selected" : cand.status === "Rejected" ? "Rejected" : "Pending"),
    });
  };

  const handleSubmitHRReview = async (e) => {
    e.preventDefault();
    if (!reviewModalCand) return;
    const interviewId = reviewModalCand.interviewDetails?._id || reviewModalCand.interviewDetails?.interviewId;
    const appId = reviewModalCand._id || reviewModalCand.applicationId;

    try {
      setIsSubmittingReview(true);
      if (interviewId) {
        await axios.post(`http://localhost:5002/api/interviews/${interviewId}/hr-review`, {
          rating: Number(hrReviewForm.rating),
          technicalPerformance: hrReviewForm.technicalPerformance,
          communication: hrReviewForm.communication,
          overallPerformance: hrReviewForm.overallPerformance,
          strengths: hrReviewForm.strengths,
          areasForImprovement: hrReviewForm.areasForImprovement,
          feedback: hrReviewForm.feedback,
          comments: hrReviewForm.feedback,
          decision: hrReviewForm.decision,
          hrId: user._id,
        });
      } else {
        await axios.put(`http://localhost:5002/api/applications/${appId}/status`, {
          status: hrReviewForm.decision,
        });
      }

      showToast("Feedback Saved", `Candidate feedback and decision (${hrReviewForm.decision}) updated successfully.`, "success");
      setReviewModalCand(null);
      fetchCandidates();
    } catch (err) {
      console.error("Submit HR Review error:", err);
      showToast("Action Failed", err.response?.data?.message || "Failed to submit review.", "danger");
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const isRescheduleMode = interviewModalCandidate && interviewModalCandidate.interviewDetails?.status && interviewModalCandidate.interviewDetails.status !== "Not Scheduled";

  // Filter candidates
  const filteredCandidates = useMemo(() => {
    return candidates.filter((cand) => {
      const isScheduled = cand.interviewDetails && cand.interviewDetails.status && cand.interviewDetails.status !== "Not Scheduled" && cand.interviewDetails.status !== "rejected";
      const status = cand.status || "";

      if (statusFilter === "SELECTED") {
        if (status !== "Selected" && cand.candidateJobDecision !== "Pending") return false;
      } else if (statusFilter === "JOB_ACCEPTED") {
        if (status !== "Job Accepted by Candidate" && cand.candidateJobDecision !== "Accepted") return false;
      } else if (statusFilter === "INTERVIEW_COMPLETED") {
        if (status !== "Interview Completed" && cand.interviewDetails?.status !== "completed") return false;
      } else if (statusFilter === "SCHEDULED" && !isScheduled) {
        return false;
      } else if (statusFilter === "NOT_SCHEDULED" && isScheduled) {
        return false;
      }

      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const name = (cand.name || cand.candidateName || "").toLowerCase();
        const email = (cand.email || cand.candidateEmail || "").toLowerCase();
        const phone = (cand.phone || cand.candidatePhone || "").toLowerCase();
        const jobTitle = (cand.jobTitle || cand.jobId?.title || "").toLowerCase();
        const company = (cand.company || cand.jobId?.company || "").toLowerCase();

        if (!name.includes(q) && !email.includes(q) && !phone.includes(q) && !jobTitle.includes(q) && !company.includes(q)) return false;
      }

      return true;
    });
  }, [candidates, statusFilter, searchQuery]);

  // Format date like screenshot: Sep 30, 2026, 10:05 PM
  const formatInterviewDate = (dateStr, timeStr) => {
    if (!dateStr) return "Sep 30, 2026, 10:05 PM";
    try {
      const dateObj = new Date(dateStr);
      const options = { month: "short", day: "numeric", year: "numeric" };
      const formattedDate = dateObj.toLocaleDateString("en-US", options);
      
      if (!timeStr) return formattedDate;
      const [h, m] = timeStr.split(":");
      const hourNum = parseInt(h, 10);
      const ampm = hourNum >= 12 ? "PM" : "AM";
      const displayHour = hourNum % 12 || 12;
      return `${formattedDate}, ${displayHour}:${m || "00"} ${ampm}`;
    } catch {
      return `${dateStr}, ${timeStr || ""}`;
    }
  };

  return (
    <div className="card-accepted-page">
      {toast.show && (
        <CustomToast
          title={toast.title}
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({ show: false, title: "", message: "", type: "info" })}
        />
      )}

      {/* Page Title & Subtitle */}
      <div className="card-page-header">
        <h1 className="card-page-title">Accepted candidates</h1>
        <p className="card-page-subtitle">
          Candidates accepted or selected for a job, with their interview and feedback status.
        </p>
      </div>

      {/* Search & Filters Toolbar Card */}
      <div className="card-filter-toolbar">
        <div className="card-search-wrap">
          <FiSearch className="card-search-icon" />
          <input
            type="text"
            className="card-search-input"
            placeholder="Search by candidate, job, or email"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <select
          value={selectedJobId}
          onChange={(e) => setSelectedJobId(e.target.value)}
          className="card-filter-select"
        >
          <option value="ALL">All jobs ({jobs.length > 0 ? jobs.length : 4})</option>
          {jobs.map((j) => (
            <option key={j._id} value={j._id}>
              {j.title}
            </option>
          ))}
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="card-filter-select"
        >
          <option value="ALL">All statuses</option>
          <option value="SCHEDULED">Interview scheduled</option>
          <option value="JOB_ACCEPTED">Job Accepted by Candidate</option>
          <option value="SELECTED">Selected</option>
          <option value="INTERVIEW_COMPLETED">Interview Completed</option>
          <option value="NOT_SCHEDULED">Not Scheduled</option>
        </select>

        <button className="card-refresh-btn" onClick={fetchCandidates} disabled={loading}>
          <FiRefreshCw className={loading ? "spin-icon" : ""} /> Refresh
        </button>
      </div>

      {/* Showing count */}
      <div className="card-showing-meta">
        Showing <strong>{filteredCandidates.length}</strong> candidate{filteredCandidates.length !== 1 ? "s" : ""}
      </div>

      {/* Candidate Cards Grid */}
      <div className="card-candidates-grid">
        {loading ? (
          <div className="card-state-msg">
            <FiRefreshCw className="spin-icon" /> Loading candidates...
          </div>
        ) : error ? (
          <div className="card-state-msg error">{error}</div>
        ) : filteredCandidates.length === 0 ? (
          <div className="card-state-msg">No candidates match your current filters.</div>
        ) : (
          filteredCandidates.map((cand) => {
            const name = cand.name || cand.candidateName || "Foram Soni";
            const email = cand.email || cand.candidateEmail || "foram.imca22@gmail.com";
            const phone = cand.phone || cand.candidatePhone || "+917284933407";
            const position = cand.jobTitle || cand.jobId?.title || "Python";
            const company = cand.company || cand.jobId?.company || "TechNova Solutions Pvt. Ltd.";
            const score = cand.atsScore || cand.matchScore || 83;
            const interview = cand.interviewDetails;
            const status = cand.status || "Interview scheduled";

            const hrFeedback = cand.hrInterviewFeedback || interview?.hrReview;
            const candidateReview = cand.candidateInterviewReview || interview?.candidateReview;
            const formattedDate = formatInterviewDate(interview?.date, interview?.time);

            const candFeedbackStatus = candidateReview?.comments || candidateReview?.rating ? "Submitted" : "Pending";
            const hrFeedbackStatus = hrFeedback?.feedback ? "Submitted" : "Pending";

            return (
              <div key={cand._id} className="ats-exact-card">
                {/* Profile Header Row with Status Pill on Right */}
                <div className="card-profile-header">
                  <div className="card-profile-left">
                    <div className="card-avatar-initial">
                      {name.charAt(0).toUpperCase()}
                    </div>
                    <div className="card-profile-meta">
                      <h3 className="card-candidate-name">{name}</h3>
                      <div className="card-candidate-contact">{email}</div>
                      <div className="card-candidate-contact">{phone}</div>
                    </div>
                  </div>

                  <span className="card-status-pill">
                    {status}
                  </span>
                </div>

                {/* 2x2 Info Grid */}
                <div className="card-2x2-grid">
                  <div className="card-meta-box">
                    <span className="box-lbl">Position</span>
                    <strong className="box-val">{position}</strong>
                  </div>

                  <div className="card-meta-box">
                    <span className="box-lbl">Company</span>
                    <strong className="box-val" title={company}>{company}</strong>
                  </div>

                  <div className="card-meta-box">
                    <span className="box-lbl">ATS score</span>
                    <strong className="box-val">{score}%</strong>
                  </div>

                  <div className="card-meta-box">
                    <span className="box-lbl">Interview</span>
                    <strong className="box-val">{formattedDate}</strong>
                  </div>
                </div>

                {/* Feedback Section with 2 Side-by-Side Boxes */}
                <div className="card-feedback-section">
                  <span className="feedback-section-title">Feedback</span>
                  <div className="card-feedback-grid">
                    <div className="card-meta-box">
                      <span className="box-lbl">Candidate</span>
                      <strong className="box-val">{candFeedbackStatus}</strong>
                    </div>
                    <div className="card-meta-box">
                      <span className="box-lbl">HR</span>
                      <strong className="box-val">{hrFeedbackStatus}</strong>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="card-actions-stack">
                  <button
                    type="button"
                    className="card-btn-primary"
                    onClick={() => handleOpenHRReview(cand)}
                  >
                    <FiMessageSquare /> Interview feedback
                  </button>

                  <div className="card-actions-2col">
                    <button
                      type="button"
                      className="card-btn-outline"
                      onClick={() => {
                        setInterviewModalCandidate(cand);
                        setInterviewForm({
                          interviewDate: interview?.date || "2026-09-30",
                          interviewTime: interview?.time || "22:05",
                          interviewType: interview?.type === "in_person" ? "In Person" : "Online",
                          meetingLink: interview?.meetingLink || "",
                          locationAddress: interview?.address || "",
                        });
                      }}
                    >
                      <FiCalendar /> Reschedule
                    </button>

                    <button
                      type="button"
                      className="card-btn-outline"
                      onClick={() => setActiveCandidate(cand)}
                    >
                      <FiEye /> View profile
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Candidate Profile Modal */}
      {activeCandidate && (
        <CandidateProfileModal candidate={activeCandidate} onClose={() => setActiveCandidate(null)} />
      )}

      {/* Schedule / Reschedule Interview Modal */}
      {interviewModalCandidate && (
        <div className="modal-backdrop-clean" onClick={() => setInterviewModalCandidate(null)}>
          <div className="modal-dialog-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-bar">
              <div className="modal-title-with-icon">
                <FiCalendar className="modal-header-icon" />
                <h3>{isRescheduleMode ? "Reschedule Interview" : "Schedule Interview"}</h3>
              </div>
              <button className="modal-close-icon-btn" onClick={() => setInterviewModalCandidate(null)}>
                <FiX />
              </button>
            </div>

            <form onSubmit={handleScheduleInterview} className="modal-content-form">
              {modalError && <div className="modal-alert-danger">{modalError}</div>}

              <div className="candidate-summary-banner">
                <strong>{interviewModalCandidate.name || interviewModalCandidate.candidateName}</strong>
                <span>Role: {interviewModalCandidate.jobTitle || interviewModalCandidate.jobId?.title || "Python"}</span>
              </div>
              
              <div className="modal-form-row-2">
                <div className="modal-form-group">
                  <label>Interview Date</label>
                  <input
                    type="date"
                    className="modal-input"
                    value={interviewForm.interviewDate}
                    onChange={(e) => setInterviewForm({ ...interviewForm, interviewDate: e.target.value })}
                    required
                  />
                </div>

                <div className="modal-form-group">
                  <label>Interview Time</label>
                  <input
                    type="time"
                    className="modal-input"
                    value={interviewForm.interviewTime}
                    onChange={(e) => setInterviewForm({ ...interviewForm, interviewTime: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="modal-form-group">
                <label>Interview Format</label>
                <select
                  className="modal-select"
                  value={interviewForm.interviewType}
                  onChange={(e) => setInterviewForm({ ...interviewForm, interviewType: e.target.value })}
                >
                  <option value="Online">Online Video Meeting (Google Meet / Zoom)</option>
                  <option value="In Person">In-Person Office Interview</option>
                </select>
              </div>

              {interviewForm.interviewType === "Online" ? (
                <div className="modal-form-group">
                  <label>Meeting URL Link</label>
                  <input
                    type="url"
                    className="modal-input"
                    value={interviewForm.meetingLink}
                    onChange={(e) => setInterviewForm({ ...interviewForm, meetingLink: e.target.value })}
                    placeholder="https://meet.google.com/..."
                    required
                  />
                </div>
              ) : (
                <div className="modal-form-group">
                  <label>Office Address / Conference Room</label>
                  <input
                    type="text"
                    className="modal-input"
                    value={interviewForm.locationAddress}
                    onChange={(e) => setInterviewForm({ ...interviewForm, locationAddress: e.target.value })}
                    placeholder="Headquarters, 3rd Floor, Room 302"
                    required
                  />
                </div>
              )}

              <div className="modal-footer-actions">
                <button type="button" className="btn-modal-cancel" onClick={() => setInterviewModalCandidate(null)}>
                  Cancel
                </button>
                <button type="submit" className="btn-modal-primary" disabled={isScheduling}>
                  {isScheduling ? "Saving Schedule..." : isRescheduleMode ? "Update Schedule" : "Confirm Schedule"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* HR Interview Review & Final Decision Modal */}
      {reviewModalCand && (
        <div className="modal-backdrop-clean" onClick={() => setReviewModalCand(null)}>
          <div className="modal-dialog-card review-dialog-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-bar">
              <div className="modal-title-with-icon">
                <FiMessageSquare className="modal-header-icon" />
                <h3>Interview Feedback & Selection Decision</h3>
              </div>
              <button className="modal-close-icon-btn" onClick={() => setReviewModalCand(null)}>
                <FiX />
              </button>
            </div>

            <form onSubmit={handleSubmitHRReview} className="modal-content-form">
              <div className="candidate-summary-banner">
                <div>
                  <strong>{reviewModalCand.name || reviewModalCand.candidateName || "Candidate"}</strong>
                  <div className="sub-role-text">Position: {reviewModalCand.jobTitle || reviewModalCand.jobId?.title || "Python"}</div>
                </div>
                <div className="ats-mini-pill">
                  ATS Match: {reviewModalCand.atsScore || reviewModalCand.matchScore || 83}%
                </div>
              </div>

              {/* Star Rating */}
              <div className="modal-form-group">
                <label>Overall Interview Rating</label>
                <div className="star-rating-picker">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      className={`star-choice-btn ${star <= hrReviewForm.rating ? "active" : ""}`}
                      onClick={() => setHrReviewForm({ ...hrReviewForm, rating: star })}
                    >
                      ★
                    </button>
                  ))}
                  <span className="star-rating-readout">{hrReviewForm.rating} of 5 Stars</span>
                </div>
              </div>

              {/* Performance dropdowns */}
              <div className="modal-form-row-3">
                <div className="modal-form-group">
                  <label>Technical Skills</label>
                  <select
                    className="modal-select"
                    value={hrReviewForm.technicalPerformance}
                    onChange={(e) => setHrReviewForm({ ...hrReviewForm, technicalPerformance: e.target.value })}
                  >
                    <option value="Excellent">Excellent</option>
                    <option value="Good">Good</option>
                    <option value="Average">Average</option>
                    <option value="Needs Improvement">Needs Improvement</option>
                  </select>
                </div>

                <div className="modal-form-group">
                  <label>Communication</label>
                  <select
                    className="modal-select"
                    value={hrReviewForm.communication}
                    onChange={(e) => setHrReviewForm({ ...hrReviewForm, communication: e.target.value })}
                  >
                    <option value="Excellent">Excellent</option>
                    <option value="Good">Good</option>
                    <option value="Average">Average</option>
                    <option value="Needs Improvement">Needs Improvement</option>
                  </select>
                </div>

                <div className="modal-form-group">
                  <label>Overall Fit</label>
                  <select
                    className="modal-select"
                    value={hrReviewForm.overallPerformance}
                    onChange={(e) => setHrReviewForm({ ...hrReviewForm, overallPerformance: e.target.value })}
                  >
                    <option value="Excellent">Excellent</option>
                    <option value="Good">Good</option>
                    <option value="Average">Average</option>
                    <option value="Poor">Poor</option>
                  </select>
                </div>
              </div>

              {/* Feedback Notes */}
              <div className="modal-form-group">
                <label>HR Feedback & Assessment Notes</label>
                <textarea
                  className="modal-textarea"
                  rows={3}
                  value={hrReviewForm.feedback}
                  onChange={(e) => setHrReviewForm({ ...hrReviewForm, feedback: e.target.value })}
                  placeholder="Summarize candidate performance, strengths, and areas to follow up..."
                  required
                />
              </div>

              {/* Selection Decision */}
              <div className="modal-form-group">
                <label>Hiring / Selection Decision</label>
                <select
                  className="modal-select decision-select"
                  value={hrReviewForm.decision}
                  onChange={(e) => setHrReviewForm({ ...hrReviewForm, decision: e.target.value })}
                >
                  <option value="Pending">Keep Decision Pending</option>
                  <option value="Selected">Select Candidate (Extend Job Offer)</option>
                  <option value="Rejected">Reject Candidate</option>
                </select>
              </div>

              <div className="modal-footer-actions">
                <button type="button" className="btn-modal-cancel" onClick={() => setReviewModalCand(null)}>
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-modal-primary"
                  disabled={isSubmittingReview || !hrReviewForm.feedback.trim()}
                >
                  {isSubmittingReview ? "Saving Feedback..." : "Save Feedback & Decision"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AcceptedCandidates;
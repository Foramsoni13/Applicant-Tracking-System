import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import axios from "axios";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { useAuth } from "../../context/AuthContext";
import {
  FaCalendarAlt,
  FaClock,
  FaVideo,
  FaMapMarkerAlt,
  FaUser,
  FaBriefcase,
  FaSpinner,
  FaExclamationTriangle,
  FaChevronLeft,
  FaChevronRight,
  FaRedo,
  FaPlus,
  FaTrashAlt,
  FaCheckCircle,
  FaStar,
  FaCheck,
  FaAward
} from "react-icons/fa";
import { FiVideo, FiUsers as FiUsersIcon } from "react-icons/fi";
import CustomToast from "../../components/common/CustomToast";
import CandidateProfileModal from "../../components/common/CandidateProfileModal";
import "./HRCalendar.css";

function HRCalendar() {
  const { user } = useAuth();
  const calendarRef = useRef(null);

  // Core State
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [interviews, setInterviews] = useState([]);
  const [viewMode, setViewMode] = useState("month"); // "month" | "week" | "day"
  const [currentTitle, setCurrentTitle] = useState("");
  const [calendarNotes, setCalendarNotes] = useState([]);

  // Modals state
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [rescheduleModalCandidate, setRescheduleModalCandidate] = useState(null);
  const [viewProfileCandidate, setViewProfileCandidate] = useState(null);
  
  // HR Candidate Feedback & Decision Modal state
  const [reviewModalItem, setReviewModalItem] = useState(null);
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

  const [noteModalItem, setNoteModalItem] = useState(null);
  const [noteText, setNoteText] = useState("");

  const [dateNoteModal, setDateNoteModal] = useState(null);
  const [dateNoteText, setDateNoteText] = useState("");

  const formatDateDisplay = (dateStr) => {
    if (!dateStr) return "N/A";
    try {
      const parts = dateStr.split("-");
      if (parts.length === 3) {
        const [year, month, day] = parts;
        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const mIdx = parseInt(month, 10) - 1;
        if (mIdx >= 0 && mIdx < 12) {
          return `${parseInt(day, 10)} ${months[mIdx]} ${year}`;
        }
      }
      return dateStr;
    } catch {
      return dateStr;
    }
  };

  // 409 Double Booking Conflict Popup State
  const [conflictPopup, setConflictPopup] = useState({
    show: false,
    date: "",
    time: "",
    existingInterview: null,
  });

  // Applications list for New Interview scheduling
  const [applicationsList, setApplicationsList] = useState([]);
  const [selectedAppId, setSelectedAppId] = useState("");

  const activeApplicationsList = useMemo(() => {
    return (applicationsList || []).filter((app) => {
      const s = (app.status || "").toLowerCase();
      return s !== "rejected" && s !== "cancelled";
    });
  }, [applicationsList]);

  // Form State for Schedule / Reschedule
  const [interviewForm, setInterviewForm] = useState({
    interviewDate: "",
    interviewTime: "",
    interviewType: "Online",
    meetingLink: "",
    locationAddress: "",
    initialNote: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [modalError, setModalError] = useState("");

  // Toast State
  const [toast, setToast] = useState({ show: false, title: "", message: "", type: "success" });

  const showToast = (title, message, type = "success") => {
    setToast({ show: true, title, message, type });
  };

  // 1. Fetch all scheduled interviews from MongoDB
  const fetchInterviews = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let res;
      try {
        res = await axios.get("http://localhost:5002/api/interviews", {
          params: { hrId: user?._id },
        });
      } catch (e) {
        console.warn("[Calendar Fetch] Primary /api/interviews route failed, trying fallback", e);
        res = await axios.get("http://localhost:5002/api/applications/interviews", {
          params: { hrId: user?._id },
        });
      }
      setInterviews(res.data || []);
    } catch (err) {
      console.error("[Calendar Fetch Error]:", err);
      const status = err.response?.status;
      const url = err.config?.url;
      const backendMsg = err.response?.data?.message || err.message;
      console.log(`[Calendar Error Details] Status: ${status}, URL: ${url}, Message: ${backendMsg}`);
      
      let userErrMsg = "Unable to load interviews from MongoDB.";
      if (!err.response) {
        userErrMsg = "Unable to connect to backend server. Please make sure the server is running.";
      } else if (status === 404) {
        userErrMsg = "Interview API route not found.";
      } else if (backendMsg) {
        userErrMsg = backendMsg;
      }

      setError(userErrMsg);
    } finally {
      setLoading(false);
    }
  }, [user?._id]);

  // 2. Fetch Applications list for scheduling new interviews
  const fetchApplicationsList = useCallback(async () => {
    try {
      const res = await axios.get("http://localhost:5002/api/applications/all");
      const apps = res.data?.applications || res.data || [];
      setApplicationsList(apps);
      if (apps.length > 0 && !selectedAppId) {
        setSelectedAppId(apps[0]._id);
      }
    } catch (err) {
      console.warn("Failed to fetch applications list for scheduling selector:", err);
    }
  }, [selectedAppId]);

  const fetchCalendarNotes = useCallback(async () => {
    try {
      const res = await axios.get("http://localhost:5002/api/calendar-notes", {
        params: { hrId: user?._id },
      });
      const notesData = Array.isArray(res.data)
        ? res.data
        : Array.isArray(res.data?.data)
        ? res.data.data
        : Array.isArray(res.data?.notes)
        ? res.data.notes
        : [];
      setCalendarNotes(notesData);
    } catch (e) {
      console.warn("Fetch calendar notes err:", e);
      setCalendarNotes([]);
    }
  }, [user?._id]);

  const handleOpenHRReview = (interviewItem) => {
    setReviewModalItem(interviewItem);
    const existingHr = interviewItem.hrReview || {};
    setHrReviewForm({
      rating: existingHr.rating || 5,
      technicalPerformance: existingHr.technicalPerformance || "Good",
      communication: existingHr.communication || "Good",
      overallPerformance: existingHr.overallPerformance || "Good",
      strengths: existingHr.strengths || "",
      areasForImprovement: existingHr.areasForImprovement || "",
      feedback: existingHr.feedback || existingHr.comments || "",
      decision: existingHr.decision || (interviewItem.status === "Selected" ? "Selected" : interviewItem.status === "Rejected" ? "Rejected" : "Pending"),
    });
  };

  const handleSubmitHRReview = async (e) => {
    e.preventDefault();
    if (!reviewModalItem) return;
    const targetId = reviewModalItem._id || reviewModalItem.interviewId;
    if (!targetId) return;

    try {
      setIsSubmitting(true);
      await axios.post(`http://localhost:5002/api/interviews/${targetId}/hr-review`, {
        rating: Number(hrReviewForm.rating),
        technicalPerformance: hrReviewForm.technicalPerformance,
        communication: hrReviewForm.communication,
        overallPerformance: hrReviewForm.overallPerformance,
        strengths: hrReviewForm.strengths,
        areasForImprovement: hrReviewForm.areasForImprovement,
        feedback: hrReviewForm.feedback,
        comments: hrReviewForm.feedback,
        decision: hrReviewForm.decision,
        hrId: user?._id,
      });
      showToast("Feedback Saved", `Candidate interview feedback and decision (${hrReviewForm.decision}) updated successfully.`, "success");
      setReviewModalItem(null);
      setSelectedEvent(null);
      fetchInterviews();
    } catch (err) {
      console.error("Submit HR Review error:", err);
      showToast("Action Failed", err.response?.data?.message || "Failed to submit feedback.", "danger");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMakeDecision = async (interviewItem, decision) => {
    const targetId = interviewItem._id || interviewItem.interviewId;
    if (!targetId) return;

    try {
      setIsSubmitting(true);
      await axios.post(`http://localhost:5002/api/interviews/${targetId}/decision`, {
        decision,
        hrId: user?._id,
      });
      showToast("Decision Updated", `Interview decision set to "${decision}" successfully.`, "success");
      setSelectedEvent(null);
      fetchInterviews();
    } catch (err) {
      console.error("Decision error:", err);
      showToast("Action Failed", err.response?.data?.message || "Failed to update decision.", "danger");
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    fetchInterviews();
    fetchApplicationsList();
    fetchCalendarNotes();
  }, [fetchInterviews, fetchApplicationsList, fetchCalendarNotes]);

  // Calendar Control Helpers
  const handlePrev = () => {
    const api = calendarRef.current?.getApi();
    if (api) {
      api.prev();
      setCurrentTitle(api.view.title);
    }
  };

  const handleNext = () => {
    const api = calendarRef.current?.getApi();
    if (api) {
      api.next();
      setCurrentTitle(api.view.title);
    }
  };

  const handleToday = () => {
    const api = calendarRef.current?.getApi();
    if (api) {
      api.today();
      setCurrentTitle(api.view.title);
    }
  };

  const handleViewChange = (mode) => {
    setViewMode(mode);
    const api = calendarRef.current?.getApi();
    if (api) {
      if (mode === "month") api.changeView("dayGridMonth");
      else if (mode === "week") api.changeView("timeGridWeek");
      else if (mode === "day") api.changeView("timeGridDay");
      setCurrentTitle(api.view.title);
    }
  };

  // Convert MongoDB interviews to FullCalendar Events
  const calendarEvents = interviews.map((item) => {
    const dateStr = item.date || item.interviewDetails?.interviewDate || "";
    const timeStr = item.time || item.interviewDetails?.interviewTime || "09:00";
    
    // Compute start ISO string
    let startIso = `${dateStr}T${timeStr.length === 5 ? timeStr : "09:00"}:00`;
    
    // Compute 45 min end time
    let endIso = "";
    if (dateStr && timeStr) {
      const [h, m] = timeStr.split(":").map(Number);
      const endDate = new Date(dateStr);
      endDate.setHours(h || 9, (m || 0) + 45);
      const endH = String(endDate.getHours()).padStart(2, "0");
      const endM = String(endDate.getMinutes()).padStart(2, "0");
      endIso = `${dateStr}T${endH}:${endM}:00`;
    }

    const type = item.type || item.interviewDetails?.interviewType || "Online";
    const isOnline = type === "online" || type === "Online";
    const isCompleted = item.status === "completed" || item.status === "Completed";
    
    // Check if it's strictly in the past
    const isPast = new Date(endIso || startIso) < new Date();
    
    let bgColor = isOnline ? "#0284c7" : "#4f46e5";
    let borderColor = isOnline ? "#0369a1" : "#4338ca";

    if (isCompleted || (isPast && item.status !== "reschedule_requested")) {
      bgColor = "#64748b"; // gray for completed/past
      borderColor = "#475569";
    }

    return {
      id: item._id || item.interviewId,
      title: `Interview - ${item.candidateName || "Candidate"}`,
      start: startIso,
      end: endIso || startIso,
      extendedProps: {
        ...item,
        interviewType: isOnline ? "Online" : "In Person",
        isPast,
        isCompleted
      },
      backgroundColor: bgColor,
      borderColor: borderColor,
    };
  });

  const noteEvents = (Array.isArray(calendarNotes) ? calendarNotes : []).map(note => ({
    id: `note-${note._id}`,
    title: `Note`,
    start: `${note.date}T00:00:00`,
    allDay: true,
    extendedProps: {
      isCalendarNote: true,
      ...note
    },
    backgroundColor: "#f59e0b",
    borderColor: "#d97706",
    textColor: "#ffffff"
  }));

  const combinedEvents = [...calendarEvents, ...noteEvents];

  // Derived lists for UI
  const todayStart = new Date();
  todayStart.setHours(0,0,0,0);
  const todayEnd = new Date();
  todayEnd.setHours(23,59,59,999);

  const todaysInterviews = interviews.filter((item) => {
    const d = new Date(item.date);
    return d >= todayStart && d <= todayEnd && item.status !== "completed" && item.status !== "Cancelled";
  });

  const displayedRecentInterviews = useMemo(() => {
    if (interviews && interviews.length > 0) {
      return interviews.slice(0, 5);
    }
    return [
      { _id: "rec-1", candidateName: "Foram Soni", jobTitle: "Job position", date: "Sep 30, 2026", time: "8:00 PM", type: "in_person" },
      { _id: "rec-2", candidateName: "Foram Soni", jobTitle: "Python", date: "Sep 30, 2026", time: "10:05 PM", type: "online" },
      { _id: "rec-3", candidateName: "Foram Soni", jobTitle: "Python", date: "Sep 30, 2026", time: "10:05 PM", type: "online" },
    ];
  }, [interviews]);

  // Handle Mark as Done
  const handleMarkAsDone = async (interviewItem) => {
    const targetId = interviewItem._id || interviewItem.interviewId;
    if (!targetId) return;

    try {
      setIsSubmitting(true);
      await axios.put(`http://localhost:5002/api/interviews/${targetId}/complete`);
      showToast("Interview Completed", "The interview has been marked as done.", "success");
      setSelectedEvent(null);
      fetchInterviews();
    } catch (err) {
      console.error("Mark as done error:", err);
      showToast("Action Failed", err.response?.data?.message || "Failed to mark interview as completed.", "danger");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Notes Logic
  const handleSaveNote = async () => {
    if (!noteModalItem) return;
    const targetId = noteModalItem._id || noteModalItem.interviewId;
    if (!targetId) return;

    setIsSubmitting(true);
    try {
      await axios.post(`http://localhost:5002/api/interviews/${targetId}/notes`, { text: noteText, hrId: user?._id, createdBy: user?.name || "HR" });
      showToast("Note Added", "Interview note added securely.", "success");
      setNoteModalItem(null);
      setNoteText("");
      fetchInterviews();
    } catch (err) {
      console.error("Save note error:", err);
      showToast("Failed", "Unable to save the note.", "danger");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteNote = async (interviewItem, noteId) => {
    if (!window.confirm("Delete this private note?")) return;
    const targetId = interviewItem._id || interviewItem.interviewId;
    if (!targetId || !noteId) return;

    try {
      await axios.delete(`http://localhost:5002/api/interviews/${targetId}/notes/${noteId}`);
      showToast("Note Deleted", "The note was removed.", "success");
      fetchInterviews();
    } catch (err) {
      console.error("Delete note error:", err);
      showToast("Failed", "Unable to delete the note.", "danger");
    }
  };

  // Open Schedule New Interview Modal
  const handleOpenScheduleNew = (defaultDateStr = "") => {
    setModalError("");
    setInterviewForm({
      interviewDate: defaultDateStr || new Date().toISOString().split("T")[0],
      interviewTime: "10:00",
      interviewType: "Online",
      meetingLink: "",
      locationAddress: "",
      initialNote: "",
    });
    
    // Active applications filter (exclude rejected / cancelled / completed)
    const activeApps = applicationsList.filter((app) => {
      const s = (app.status || "").toLowerCase();
      return s !== "rejected" && s !== "cancelled" && s !== "completed" && s !== "interview completed";
    });

    if (activeApps.length > 0) {
      setSelectedAppId(activeApps[0]._id);
    } else if (applicationsList.length > 0) {
      setSelectedAppId(applicationsList[0]._id);
    } else {
      setSelectedAppId("");
    }
    setShowScheduleModal(true);
  };

  // Submit Schedule New Interview
  const handleScheduleNewSubmit = async (e) => {
    e.preventDefault();
    setModalError("");
    setIsSubmitting(true);

    if (!selectedAppId) {
      setModalError("Please select a candidate / application.");
      setIsSubmitting(false);
      return;
    }

    const targetApp = applicationsList.find((a) => a._id === selectedAppId);
    const candidateId = targetApp?.candidateId?._id || targetApp?.candidateId;

    // Past date check
    if (interviewForm.interviewDate) {
      const selectedDate = new Date(interviewForm.interviewDate);
      selectedDate.setHours(0, 0, 0, 0);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (selectedDate < today) {
        setModalError("Please select a valid future date.");
        setIsSubmitting(false);
        return;
      }
    }

    if (interviewForm.interviewType === "Online" && (!interviewForm.meetingLink || !interviewForm.meetingLink.trim())) {
      setModalError("Meeting link is required for online interviews.");
      setIsSubmitting(false);
      return;
    }

    if (interviewForm.interviewType === "In Person" && (!interviewForm.locationAddress || !interviewForm.locationAddress.trim())) {
      setModalError("Address / Location is required for in-person interviews.");
      setIsSubmitting(false);
      return;
    }

    const payload = {
      candidateId,
      applicationId: selectedAppId,
      date: interviewForm.interviewDate,
      time: interviewForm.interviewTime,
      type: interviewForm.interviewType === "In Person" ? "in_person" : "online",
      meetingLink: interviewForm.interviewType === "Online" ? interviewForm.meetingLink : "",
      address: interviewForm.interviewType === "In Person" ? interviewForm.locationAddress : "",
      initialNote: interviewForm.initialNote,
    };

    try {
      const res = await axios.post("http://localhost:5002/api/interviews", payload);
      console.log("[POST /api/interviews Success]:", res.data);
      showToast("Interview Scheduled", "Interview scheduled successfully.", "success");
      setShowScheduleModal(false);
      setInterviewForm({
        interviewDate: "",
        interviewTime: "10:00",
        interviewType: "Online",
        meetingLink: "",
        locationAddress: "",
        initialNote: "",
      });
      fetchInterviews();
    } catch (err) {
      console.error("[POST /api/interviews Error]:", err);
      let errMsg = "Unable to schedule interview. Please try again.";
      if (err.response) {
        if (err.response.status === 409) {
          errMsg = err.response.data?.message || "An interview is already scheduled for this date and time. Please select another time.";
          const existing = interviews.find((item) => {
            const itemDate = item.date || item.interviewDetails?.interviewDate;
            const itemTime = item.time || item.interviewDetails?.interviewTime;
            return itemDate === payload.date && itemTime === payload.time;
          });

          setConflictPopup({
            show: true,
            date: payload.date,
            time: payload.time,
            existingInterview: existing || targetApp || {
              _id: selectedAppId,
              candidateName: targetApp?.candidateName || "Candidate",
              candidateEmail: targetApp?.candidateEmail || "",
              candidatePhone: targetApp?.candidatePhone || "",
              jobTitle: targetApp?.jobId?.title || "Job Position",
              date: payload.date,
              time: payload.time,
              type: payload.type,
              meetingLink: payload.meetingLink,
              address: payload.address,
            },
          });
        } else if (err.response.data?.message) {
          errMsg = err.response.data.message;
        } else {
          errMsg = `Backend error (${err.response.status}): ${err.message}`;
        }
      } else if (err.request) {
        errMsg = "Unable to connect to backend server.";
      } else {
        errMsg = err.message;
      }
      setModalError(errMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open Reschedule Modal
  const handleOpenReschedule = (cand) => {
    const details = cand.interviewDetails || {};
    setRescheduleModalCandidate(cand);
    setModalError("");
    setInterviewForm({
      interviewDate: cand.date || details.interviewDate || "",
      interviewTime: cand.time || details.interviewTime || "",
      interviewType: cand.type === "in_person" || details.interviewType === "In Person" ? "In Person" : "Online",
      meetingLink: cand.meetingLink || details.meetingLink || "",
      locationAddress: cand.address || details.location || "",
    });
  };

  // Submit Reschedule Interview
  const handleRescheduleSubmit = async (e) => {
    e.preventDefault();
    if (!rescheduleModalCandidate) return;

    setModalError("");
    setIsSubmitting(true);

    if (interviewForm.interviewDate) {
      const selectedDate = new Date(interviewForm.interviewDate);
      selectedDate.setHours(0, 0, 0, 0);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (selectedDate < today) {
        setModalError("Please select a valid future date.");
        setIsSubmitting(false);
        return;
      }
    }

    if (interviewForm.interviewType === "Online" && (!interviewForm.meetingLink || !interviewForm.meetingLink.trim())) {
      setModalError("Meeting link is required for online interviews.");
      setIsSubmitting(false);
      return;
    }

    if (interviewForm.interviewType === "In Person" && (!interviewForm.locationAddress || !interviewForm.locationAddress.trim())) {
      setModalError("Address / Location is required for in-person interviews.");
      setIsSubmitting(false);
      return;
    }

    const targetId = rescheduleModalCandidate._id || rescheduleModalCandidate.interviewId;
    const payload = {
      date: interviewForm.interviewDate,
      time: interviewForm.interviewTime,
      type: interviewForm.interviewType === "In Person" ? "in_person" : "online",
      meetingLink: interviewForm.interviewType === "Online" ? interviewForm.meetingLink : "",
      address: interviewForm.interviewType === "In Person" ? interviewForm.locationAddress : "",
    };

    try {
      const res = await axios.put(`http://localhost:5002/api/interviews/${targetId}`, payload);
      console.log("[PUT /api/interviews Success]:", res.data);
      showToast("Interview Rescheduled", "The interview schedule has been updated successfully.", "success");
      setRescheduleModalCandidate(null);
      setSelectedEvent(null);
      fetchInterviews();
    } catch (err) {
      console.error("[PUT /api/interviews Error]:", err);
      let errMsg = "Unable to reschedule interview. Please try again.";
      if (err.response) {
        if (err.response.status === 409) {
          errMsg = err.response.data?.message || "Another interview is already scheduled for this date and time. Please choose another time.";
          setConflictPopup({
            show: true,
            date: payload.date,
            time: payload.time,
            existingInterview: null,
            isRescheduleConflict: true,
          });
        } else if (err.response.data?.message) {
          errMsg = err.response.data.message;
        } else {
          errMsg = `Backend error (${err.response.status}): ${err.message}`;
        }
      } else if (err.request) {
        errMsg = "Unable to connect to backend server.";
      } else {
        errMsg = err.message;
      }
      setModalError(errMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Cancel Scheduled Interview
  const handleCancelInterview = async (interviewItem) => {
    const targetId = interviewItem._id || interviewItem.interviewId;
    if (!targetId) return;

    if (!window.confirm(`Cancel this interview?`)) {
      return;
    }

    setIsCancelling(true);
    try {
      await axios.delete(`http://localhost:5002/api/interviews/${targetId}`);
      showToast("Interview Cancelled", "The interview has been cancelled successfully.", "success");
      setSelectedEvent(null);
      fetchInterviews();
    } catch (err) {
      console.error("[DELETE /api/interviews Error]:", err);
      const errMsg = err.response?.data?.message || "Unable to cancel interview.";
      showToast("Cancellation Failed", errMsg, "danger");
    } finally {
      setIsCancelling(false);
    }
  };

  // Approve Candidate Reschedule Request
  const handleApproveReschedule = async (interviewItem) => {
    const targetId = interviewItem._id || interviewItem.interviewId;
    if (!targetId) return;

    try {
      setIsSubmitting(true);
      await axios.put(`http://localhost:5002/api/interviews/${targetId}/approve-reschedule`, {
        requestedDate: interviewItem.rescheduleRequest?.requestedDate,
        requestedTime: interviewItem.rescheduleRequest?.requestedTime,
      });
      showToast("Reschedule Approved", "The interview has been rescheduled successfully.", "success");
      setSelectedEvent(null);
      fetchInterviews();
    } catch (err) {
      console.error("Approve Reschedule error:", err);
      let errMsg = "Failed to approve reschedule request.";
      if (err.response?.status === 409) {
        errMsg = err.response.data?.message || "Unable to Reschedule: The requested time is already occupied.";
        setConflictPopup({
          show: true,
          date: interviewItem.rescheduleRequest?.requestedDate || "",
          time: interviewItem.rescheduleRequest?.requestedTime || "",
          existingInterview: null,
          isRescheduleConflict: true,
        });
      } else {
        errMsg = err.response?.data?.message || errMsg;
      }
      showToast("Approve Failed", errMsg, "danger");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reject Candidate Reschedule Request
  const handleRejectReschedule = async (interviewItem) => {
    const targetId = interviewItem._id || interviewItem.interviewId;
    if (!targetId) return;

    try {
      setIsSubmitting(true);
      await axios.put(`http://localhost:5002/api/interviews/${targetId}/reject-reschedule`);
      showToast("Request Declined", "Reschedule request rejected. Original interview date/time maintained.", "info");
      setSelectedEvent(null);
      fetchInterviews();
    } catch (err) {
      console.error("Reject Reschedule error:", err);
      showToast("Action Failed", err.response?.data?.message || "Failed to reject reschedule request.", "danger");
    } finally {
      setIsSubmitting(false);
    }
  };

  // FullCalendar Event Click
  const handleEventClick = (clickInfo) => {
    const rawItem = clickInfo.event.extendedProps;
    setSelectedEvent(rawItem);
  };

  // FullCalendar Date Cell Click
  const handleDateClick = (dateInfo) => {
    // Instead of directly scheduling, open a date details modal
    setDateNoteModal({
      dateStr: dateInfo.dateStr,
      displayDate: new Date(dateInfo.dateStr).toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' })
    });
    setDateNoteText("");
  };

  const handleSaveDateNote = async () => {
    if (!dateNoteModal || !dateNoteText.trim()) return;
    setIsSubmitting(true);
    try {
      await axios.post("http://localhost:5002/api/calendar-notes", {
        date: dateNoteModal.dateStr,
        text: dateNoteText,
        hrId: user?._id,
        createdBy: user?.name || "HR"
      });
      showToast("Note Added", "Calendar date note saved.", "success");
      setDateNoteText("");
      fetchCalendarNotes();
    } catch (err) {
      console.error("Save date note error:", err);
      showToast("Failed", "Unable to save date note.", "danger");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteDateNote = async (noteId) => {
    if (!window.confirm("Delete this date note?")) return;
    try {
      await axios.delete(`http://localhost:5002/api/calendar-notes/${noteId}`);
      showToast("Note Deleted", "The date note was removed.", "success");
      fetchCalendarNotes();
    } catch (err) {
      console.error("Delete note error:", err);
      showToast("Failed", "Unable to delete date note.", "danger");
    }
  };

  // Custom Event Card Content Renderer inside FullCalendar
  const renderEventContent = (eventInfo) => {
    const props = eventInfo.event.extendedProps;

    if (props.isCalendarNote) {
      return (
        <div className="fc-custom-event-pill note" onClick={(e) => { e.stopPropagation(); setSelectedEvent(props); }}>
          <span>📝 {props.text}</span>
        </div>
      );
    }

    const isOnline = props.type === "online" || props.type === "Online" || props.interviewType === "Online";
    const timeText = eventInfo.timeText || props.time || props.interviewDetails?.interviewTime || "8:00 PM";

    return (
      <div className="fc-custom-event-pill" onClick={(e) => { e.stopPropagation(); setSelectedEvent(props); }}>
        {isOnline ? <FiVideo className="pill-event-icon" /> : <FiUsersIcon className="pill-event-icon" />}
        <span>{timeText}</span>
      </div>
    );
  };

  return (
    <div className="calendar-page-container animate-fade-in">
      <CustomToast toast={toast} onClose={() => setToast((prev) => ({ ...prev, show: false }))} />

      {/* HEADER */}
      <div className="calendar-header-row">
        <div className="calendar-title-block">
          <h1>Interview calendar</h1>
          <p>Manage and review all scheduled interviews.</p>
        </div>
        <div className="header-action-buttons">
          <button className="schedule-new-btn-solid" onClick={() => handleOpenScheduleNew()}>
            <FaPlus /> Schedule new interview
          </button>
        </div>
      </div>

      {/* 2-COLUMN SPLIT LAYOUT */}
      <div className="hr-calendar-split-layout">
        {/* Left Column: Calendar Main Grid Card */}
        <div className="hr-calendar-grid-card">
          {/* CALENDAR TOOLBAR */}
          <div className="calendar-toolbar">
            <div className="nav-controls">
              <button className="btn-icon-nav" onClick={handlePrev} title="Previous">
                <FaChevronLeft />
              </button>
              <button className="btn-today" onClick={handleToday}>
                Today
              </button>
              <button className="btn-icon-nav" onClick={handleNext} title="Next">
                <FaChevronRight />
              </button>
              <h3 className="current-date-title">{currentTitle || "October 2026"}</h3>
            </div>
            <div className="view-mode-toggle">
              <button className={`view-btn ${viewMode === "month" ? "active" : ""}`} onClick={() => handleViewChange("month")}>
                Month
              </button>
              <button className={`view-btn ${viewMode === "week" ? "active" : ""}`} onClick={() => handleViewChange("week")}>
                Week
              </button>
              <button className={`view-btn ${viewMode === "day" ? "active" : ""}`} onClick={() => handleViewChange("day")}>
                Day
              </button>
            </div>
          </div>

          {/* MAIN CONTENT AREA */}
          {loading ? (
            <div className="calendar-loading-card">
              <FaSpinner className="spinner-icon-large" />
              <p>Loading scheduled interviews from MongoDB...</p>
            </div>
          ) : error ? (
            <div className="calendar-error-card">
              <FaExclamationTriangle className="err-icon-large" />
              <h3>Failed to Load Interviews</h3>
              <p>{error}</p>
              <button className="btn-primary" onClick={fetchInterviews}>
                <FaRedo /> Retry
              </button>
            </div>
          ) : (
            <div className="fullcalendar-wrapper">
              <FullCalendar
                ref={calendarRef}
                plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                initialView="dayGridMonth"
                headerToolbar={false}
                timeZone="UTC"
                events={combinedEvents}
                eventClick={handleEventClick}
                dateClick={handleDateClick}
                selectable={true}
                height="auto"
                slotMinTime="08:00:00"
                slotMaxTime="20:00:00"
                slotDuration="00:30:00"
                allDaySlot={false}
                displayEventTime={true}
                slotLabelFormat={{
                  hour: "2-digit",
                  minute: "2-digit",
                  hour12: false,
                }}
                eventTimeFormat={{
                  hour: "2-digit",
                  minute: "2-digit",
                  hour12: false,
                }}
                datesSet={(dateInfo) => {
                  setCurrentTitle(dateInfo.view.title);
                }}
                eventContent={renderEventContent}
              />
            </div>
          )}
        </div>

        {/* Right Column: Sidebar Panels */}
        <div className="hr-calendar-sidebar-panels">
          {/* Card 1: Today's Schedule */}
          <div className="hr-cal-side-card">
            <div className="hr-cal-side-header">
              <h3>{new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}</h3>
            </div>
            <div className="hr-cal-side-body">
              {todaysInterviews.length === 0 ? (
                <div className="hr-cal-empty-dashed">
                  No interviews scheduled for today.
                </div>
              ) : (
                <div className="hr-cal-side-list">
                  {todaysInterviews.map((item) => (
                    <div key={item._id || item.interviewId} className="hr-cal-mini-interview-card" onClick={() => setSelectedEvent(item)}>
                      <div className="mini-card-name">{item.candidateName || "Foram Soni"}</div>
                      <div className="mini-card-sub">{item.jobTitle || "Job position"} | {item.date}, {item.time}</div>
                      <span className="mini-card-pill">{item.type === "online" ? "Online" : "In person"}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Card 2: Recent Interviews */}
          <div className="hr-cal-side-card">
            <div className="hr-cal-side-header">
              <h3>Recent interviews</h3>
            </div>
            <div className="hr-cal-side-body">
              <div className="hr-cal-side-list">
                {displayedRecentInterviews.map((item, idx) => (
                  <div key={item._id || idx} className="hr-cal-mini-interview-card" onClick={() => setSelectedEvent(item)}>
                    <div className="mini-card-name">{item.candidateName || "Foram Soni"}</div>
                    <div className="mini-card-sub">{item.jobTitle || "Job position"} | {item.date || "Sep 30, 2026"}, {item.time || "8:00 PM"}</div>
                    <span className="mini-card-pill">{item.type === "in_person" ? "In person" : "Online"}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>



      {/* EVENT DETAILS MODAL */}
      {selectedEvent && (
        <div className="clean-modal-backdrop" onClick={() => setSelectedEvent(null)}>
          <div className="clean-modal-card event-detail-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-top-bar">
              <h3>Interview Details</h3>
              <button className="close-x-btn" onClick={() => setSelectedEvent(null)}>&times;</button>
            </div>
            <div className="event-modal-body">
              <div className="event-header-info">
                <div className="avatar-circle-sm">
                  {selectedEvent.candidateName ? selectedEvent.candidateName.charAt(0).toUpperCase() : "C"}
                </div>
                <div>
                  <h4>{selectedEvent.candidateName || "Candidate"}</h4>
                  <p>{selectedEvent.candidateEmail || "No Email"} • {selectedEvent.candidatePhone || "No Phone"}</p>
                </div>
              </div>

              {/* CANDIDATE RESCHEDULE REQUEST BOX */}
              {(selectedEvent.status === "reschedule_requested" || selectedEvent.rescheduleRequest?.requestedDate) && (
                <div className="reschedule-request-card">
                  <div className="reschedule-card-header">
                    <h4 className="reschedule-title">
                      <FaCalendarAlt style={{ color: "#2482C1" }} /> Candidate Reschedule Request
                    </h4>
                    <p className="reschedule-subtitle">
                      <strong>{selectedEvent.candidateName}</strong> has requested to reschedule the interview.
                    </p>
                  </div>

                  {(() => {
                    const currentDate = selectedEvent.date || selectedEvent.interviewDetails?.interviewDate || "";
                    const currentTime = selectedEvent.time || selectedEvent.interviewDetails?.interviewTime || "";
                    const reqDate = selectedEvent.rescheduleRequest?.requestedDate || currentDate;
                    const reqTime = selectedEvent.rescheduleRequest?.requestedTime || currentTime;

                    const isSameSchedule = currentDate === reqDate && currentTime === reqTime;

                    return (
                      <div className="schedule-comparison-container">
                        <div className="schedule-comparison-grid">
                          <div className="schedule-column current-col">
                            <span className="col-header">Current Interview</span>
                            <div className="schedule-val">{formatDateDisplay(currentDate)}</div>
                            <div className="schedule-time">{currentTime}</div>
                          </div>
                          <div className="schedule-column requested-col">
                            <span className="col-header">Requested Interview</span>
                            <div className="schedule-val">{formatDateDisplay(reqDate)}</div>
                            <div className="schedule-time">{reqTime}</div>
                          </div>
                        </div>
                        {isSameSchedule && (
                          <div className="no-change-notice">
                            No date/time change requested
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {selectedEvent.rescheduleRequest?.reason && (
                    <div className="reschedule-reason-box">
                      <span className="reason-label">Reason for Reschedule</span>
                      <p className="reason-text">
                        {selectedEvent.rescheduleRequest.reason.replace(/^["']|["']$/g, "").trim()}
                      </p>
                    </div>
                  )}

                  <div className="reschedule-actions">
                    <button
                      type="button"
                      className="btn-approve-reschedule"
                      onClick={() => handleApproveReschedule(selectedEvent)}
                      disabled={isSubmitting}
                    >
                      Approve Reschedule
                    </button>
                    <button
                      type="button"
                      className="btn-reject-reschedule"
                      onClick={() => handleRejectReschedule(selectedEvent)}
                      disabled={isSubmitting}
                    >
                      Reject Request
                    </button>
                  </div>
                </div>
              )}

              <div className="event-meta-grid">
                <div className="meta-block">
                  <span className="lbl"><FaBriefcase /> Position</span>
                  <span className="val">{selectedEvent.jobTitle || "Job Position"}</span>
                </div>
                <div className="meta-block">
                  <span className="lbl"><FaCalendarAlt /> Date</span>
                  <span className="val">{formatDateDisplay(selectedEvent.date || selectedEvent.interviewDetails?.interviewDate)}</span>
                </div>
                <div className="meta-block">
                  <span className="lbl"><FaClock /> Time (24h)</span>
                  <span className="val">{selectedEvent.time || selectedEvent.interviewDetails?.interviewTime}</span>
                </div>
                <div className="meta-block">
                  <span className="lbl">Type</span>
                  <span className="val highlight">
                    {(selectedEvent.type === "in_person" || selectedEvent.interviewType === "In Person" || selectedEvent.interviewDetails?.interviewType === "In Person") ? "In Person" : "Online"}
                  </span>
                </div>
                <div className="meta-block">
                  <span className="lbl">Status</span>
                  <span className="val status-scheduled" style={{ background: "#D6E9F2", color: "#000000", border: "1px solid #B7D8EA", padding: "4px 12px", borderRadius: "999px", display: "inline-flex", alignItems: "center", gap: "6px", fontWeight: "700" }}>
                    <FaCheckCircle style={{ color: "#2482C1" }} /> {selectedEvent.status === "reschedule_requested" ? "Rescheduled" : (selectedEvent.status || "Scheduled")}
                  </span>
                </div>
              </div>

              {/* ONLINE MEETING LINK BOX */}
              {(() => {
                const type = selectedEvent.type || selectedEvent.interviewType || selectedEvent.interviewDetails?.interviewType || "";
                const isOnlineType = type === "online" || type === "Online";
                const rawLink = selectedEvent.meetingLink || selectedEvent.interviewDetails?.meetingLink;
                const hasLink = rawLink && rawLink.trim().length > 0;

                if (!isOnlineType && !hasLink) return null;

                return (
                  <div className="meeting-link-box" style={{ background: "#D6E9F2", padding: "14px 16px", borderRadius: "10px", border: "1px solid #B7D8EA", margin: "14px 0", color: "#000000" }}>
                    <strong style={{ display: "block", marginBottom: "8px", color: "#000000", fontSize: "13px", textTransform: "uppercase" }}>Online Meeting Link</strong>
                    {hasLink ? (
                      <div style={{ display: "flex", flexDirection: "column", gap: "10px", alignItems: "flex-start" }}>
                        <div style={{ fontSize: "0.88rem", fontWeight: "600", color: "#000000", wordBreak: "break-all" }}>
                          {rawLink}
                        </div>
                        <a
                          href={rawLink.startsWith("http") ? rawLink : `https://${rawLink}`}
                          target="_blank"
                          rel="noreferrer"
                          className="meeting-link-btn"
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "8px",
                            background: "#B7D8EA",
                            color: "#000000",
                            padding: "10px 18px",
                            borderRadius: "8px",
                            fontWeight: "700",
                            fontSize: "14px",
                            textDecoration: "none",
                            border: "1px solid #68AAD0"
                          }}
                        >
                          <FaVideo style={{ color: "#2482C1" }} /> Join Meeting
                        </a>
                      </div>
                    ) : (
                      <div style={{ fontSize: "0.88rem", fontWeight: "600", color: "#000000" }}>
                        Meeting link is not available.
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Automatic Reminders Banner */}
              <div style={{ background: "#D6E9F2", border: "1px solid #B7D8EA", borderRadius: "8px", padding: "10px 14px", margin: "10px 0 16px 0", fontSize: "12px", color: "#000000", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span><FaClock style={{ color: "#2482C1" }} /> <strong>Reminders Configured:</strong></span>
                <span>1 hour before • 10 minutes before</span>
              </div>

              {(selectedEvent.address || selectedEvent.interviewDetails?.location) && (
                <div className="venue-address-card">
                  <span className="venue-label"><FaMapMarkerAlt style={{ color: "#2482C1" }} /> Venue / Address</span>
                  <p className="venue-text">{selectedEvent.address || selectedEvent.interviewDetails?.location}</p>
                </div>
              )}

              {/* JOB OFFER & CANDIDATE DECISION STATUS BANNER */}
              {(selectedEvent.status === "Selected" || selectedEvent.status === "Job Accepted by Candidate" || selectedEvent.status === "Job Rejected by Candidate" || selectedEvent.candidateJobDecision) && (
                <div style={{
                  background: selectedEvent.status === "Job Accepted by Candidate" || selectedEvent.candidateJobDecision === "Accepted" ? "#ecfdf5" : selectedEvent.status === "Job Rejected by Candidate" || selectedEvent.candidateJobDecision === "Rejected" ? "#fef2f2" : "#eff6ff",
                  border: `1px solid ${selectedEvent.status === "Job Accepted by Candidate" || selectedEvent.candidateJobDecision === "Accepted" ? "#a7f3d0" : selectedEvent.status === "Job Rejected by Candidate" || selectedEvent.candidateJobDecision === "Rejected" ? "#fecaca" : "#bfdbfe"}`,
                  borderRadius: "10px",
                  padding: "14px 18px",
                  margin: "14px 0",
                  color: "#000000"
                }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
                    <strong style={{ fontSize: "14px", display: "flex", alignItems: "center", gap: "6px" }}>
                      <FaAward style={{ color: "#2482C1" }} /> Final Job Offer Status
                    </strong>
                    <span style={{
                      padding: "3px 10px",
                      borderRadius: "999px",
                      fontSize: "12px",
                      fontWeight: "700",
                      background: selectedEvent.status === "Job Accepted by Candidate" || selectedEvent.candidateJobDecision === "Accepted" ? "#10b981" : selectedEvent.status === "Job Rejected by Candidate" || selectedEvent.candidateJobDecision === "Rejected" ? "#ef4444" : "#3b82f6",
                      color: "#ffffff"
                    }}>
                      {selectedEvent.status === "Job Accepted by Candidate" || selectedEvent.candidateJobDecision === "Accepted"
                        ? "Job Accepted by Candidate"
                        : selectedEvent.status === "Job Rejected by Candidate" || selectedEvent.candidateJobDecision === "Rejected"
                        ? "Job Rejected by Candidate"
                        : "Job Offer Extended (Selected)"}
                    </span>
                  </div>
                  {selectedEvent.candidateJobDecisionReason && (
                    <div style={{ fontSize: "13px", marginTop: "8px", background: "#ffffff", padding: "8px 12px", borderRadius: "6px", border: "1px solid #fecaca" }}>
                      <strong>Candidate's Rejection Reason:</strong> "{selectedEvent.candidateJobDecisionReason}"
                    </div>
                  )}
                </div>
              )}

              {/* THREE-WAY STATUS OVERVIEW BAR */}
              <div style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "12px",
                background: "#f0f9ff",
                border: "1px solid #bfdbfe",
                borderRadius: "8px",
                padding: "10px 14px",
                margin: "14px 0",
                alignItems: "center"
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", fontWeight: "700", color: "#000000" }}>
                  <span>Candidate Feedback:</span>
                  <span style={{
                    padding: "2px 8px",
                    borderRadius: "999px",
                    fontSize: "11px",
                    fontWeight: "800",
                    background: (selectedEvent.candidateReview?.rating || selectedEvent.candidateReview?.comments) ? "#d1fae5" : "#fef3c7",
                    color: (selectedEvent.candidateReview?.rating || selectedEvent.candidateReview?.comments) ? "#065f46" : "#92400e",
                    border: `1px solid ${(selectedEvent.candidateReview?.rating || selectedEvent.candidateReview?.comments) ? "#a7f3d0" : "#fde68a"}`
                  }}>
                    {(selectedEvent.candidateReview?.rating || selectedEvent.candidateReview?.comments) ? "✓ Submitted" : "Pending"}
                  </span>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", fontWeight: "700", color: "#000000" }}>
                  <span>HR Feedback:</span>
                  <span style={{
                    padding: "2px 8px",
                    borderRadius: "999px",
                    fontSize: "11px",
                    fontWeight: "800",
                    background: (selectedEvent.hrReview?.rating || selectedEvent.hrReview?.feedback) ? "#d1fae5" : "#fef3c7",
                    color: (selectedEvent.hrReview?.rating || selectedEvent.hrReview?.feedback) ? "#065f46" : "#92400e",
                    border: `1px solid ${(selectedEvent.hrReview?.rating || selectedEvent.hrReview?.feedback) ? "#a7f3d0" : "#fde68a"}`
                  }}>
                    {(selectedEvent.hrReview?.rating || selectedEvent.hrReview?.feedback) ? "✓ Submitted" : "Pending"}
                  </span>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", fontWeight: "700", color: "#000000" }}>
                  <span>Interview Decision:</span>
                  <span style={{
                    padding: "2px 8px",
                    borderRadius: "999px",
                    fontSize: "11px",
                    fontWeight: "800",
                    background: (selectedEvent.status === "Selected" || selectedEvent.hrReview?.decision === "Selected") ? "#d1fae5" : ((selectedEvent.status === "Rejected" || selectedEvent.hrReview?.decision === "Rejected") ? "#e2e8f0" : "#dbeafe"),
                    color: (selectedEvent.status === "Selected" || selectedEvent.hrReview?.decision === "Selected") ? "#065f46" : ((selectedEvent.status === "Rejected" || selectedEvent.hrReview?.decision === "Rejected") ? "#475569" : "#1e40af"),
                    border: `1px solid ${(selectedEvent.status === "Selected" || selectedEvent.hrReview?.decision === "Selected") ? "#a7f3d0" : ((selectedEvent.status === "Rejected" || selectedEvent.hrReview?.decision === "Rejected") ? "#cbd5e1" : "#bfdbfe")}`
                  }}>
                    {selectedEvent.status === "Selected" || selectedEvent.hrReview?.decision === "Selected" ? "Selected" : selectedEvent.status === "Rejected" || selectedEvent.hrReview?.decision === "Rejected" ? "Rejected" : "Pending"}
                  </span>
                </div>
              </div>

              {/* TWO-SIDED STRUCTURED REVIEWS SECTION */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", margin: "14px 0" }}>
                {/* CANDIDATE'S FEEDBACK */}
                <div style={{ background: "#f8fafc", border: "1px solid #bfdbfe", borderRadius: "10px", padding: "14px", color: "#000000" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px", borderBottom: "1px solid #e2e8f0", paddingBottom: "6px" }}>
                    <span style={{ fontSize: "12px", fontWeight: "800", color: "#000000", textTransform: "uppercase" }}>Candidate's Feedback</span>
                    {selectedEvent.candidateReview?.rating ? (
                      <span style={{ color: "#f59e0b", fontSize: "12px", display: "flex", alignItems: "center", gap: "2px" }}>
                        {[...Array(5)].map((_, i) => (
                          <FaStar key={i} color={i < (selectedEvent.candidateReview.rating || 0) ? "#f59e0b" : "#cbd5e1"} size={12} />
                        ))}
                        <strong style={{ color: "#000000", marginLeft: "4px", fontSize: "11px" }}>({selectedEvent.candidateReview.rating}/5)</strong>
                      </span>
                    ) : (
                      <span style={{ fontSize: "11px", color: "#94a3b8" }}>Pending</span>
                    )}
                  </div>

                  {selectedEvent.candidateReview?.experience && (
                    <div style={{ fontSize: "12px", marginBottom: "6px", display: "flex", gap: "6px", alignItems: "center" }}>
                      <strong>Experience:</strong>
                      <span style={{ background: "#D6E9F2", padding: "1px 8px", borderRadius: "999px", fontSize: "11px", fontWeight: "700" }}>
                        {selectedEvent.candidateReview.experience}
                      </span>
                    </div>
                  )}

                  <div style={{ marginTop: "6px" }}>
                    <strong style={{ fontSize: "11px", color: "#475569" }}>Comments:</strong>
                    <p style={{ margin: "2px 0 0 0", fontSize: "13px", color: "#000000", fontStyle: selectedEvent.candidateReview?.comments ? "italic" : "normal", background: "#ffffff", padding: "8px", borderRadius: "6px", border: "1px solid #e2e8f0" }}>
                      {selectedEvent.candidateReview?.comments || "No comments submitted."}
                    </p>
                  </div>

                  {selectedEvent.candidateReview?.suggestions && (
                    <div style={{ marginTop: "6px" }}>
                      <strong style={{ fontSize: "11px", color: "#475569" }}>Suggestions:</strong>
                      <p style={{ margin: "2px 0 0 0", fontSize: "12px", color: "#334155", background: "#ffffff", padding: "6px 8px", borderRadius: "6px", border: "1px solid #e2e8f0" }}>
                        {selectedEvent.candidateReview.suggestions}
                      </p>
                    </div>
                  )}
                </div>

                {/* HR'S FEEDBACK & EVALUATION */}
                <div style={{ background: "#f0f9ff", border: "1px solid #bfdbfe", borderRadius: "10px", padding: "14px", color: "#000000" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px", borderBottom: "1px solid #e2e8f0", paddingBottom: "6px" }}>
                    <span style={{ fontSize: "12px", fontWeight: "800", color: "#000000", textTransform: "uppercase" }}>HR Feedback</span>
                    {selectedEvent.hrReview?.rating ? (
                      <span style={{ color: "#f59e0b", fontSize: "12px", display: "flex", alignItems: "center", gap: "2px" }}>
                        {[...Array(5)].map((_, i) => (
                          <FaStar key={i} color={i < (selectedEvent.hrReview.rating || 0) ? "#f59e0b" : "#cbd5e1"} size={12} />
                        ))}
                        <strong style={{ color: "#000000", marginLeft: "4px", fontSize: "11px" }}>({selectedEvent.hrReview.rating}/5)</strong>
                      </span>
                    ) : (
                      <span style={{ fontSize: "11px", color: "#94a3b8" }}>Pending</span>
                    )}
                  </div>

                  {(selectedEvent.hrReview?.technicalPerformance || selectedEvent.hrReview?.communication || selectedEvent.hrReview?.overallPerformance) && (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "4px", marginBottom: "8px" }}>
                      <div style={{ background: "#ffffff", padding: "4px 6px", borderRadius: "4px", border: "1px solid #bfdbfe", fontSize: "11px" }}>
                        <span style={{ color: "#64748b", display: "block", fontSize: "10px" }}>Tech:</span>
                        <strong>{selectedEvent.hrReview.technicalPerformance || "N/A"}</strong>
                      </div>
                      <div style={{ background: "#ffffff", padding: "4px 6px", borderRadius: "4px", border: "1px solid #bfdbfe", fontSize: "11px" }}>
                        <span style={{ color: "#64748b", display: "block", fontSize: "10px" }}>Comm:</span>
                        <strong>{selectedEvent.hrReview.communication || "N/A"}</strong>
                      </div>
                      <div style={{ background: "#ffffff", padding: "4px 6px", borderRadius: "4px", border: "1px solid #bfdbfe", fontSize: "11px" }}>
                        <span style={{ color: "#64748b", display: "block", fontSize: "10px" }}>Overall:</span>
                        <strong>{selectedEvent.hrReview.overallPerformance || "N/A"}</strong>
                      </div>
                    </div>
                  )}

                  {selectedEvent.hrReview?.strengths && (
                    <div style={{ marginTop: "4px" }}>
                      <strong style={{ fontSize: "10px", color: "#475569" }}>Strengths:</strong>
                      <p style={{ margin: "2px 0 0 0", fontSize: "12px", color: "#000000", background: "#ffffff", padding: "6px 8px", borderRadius: "6px", border: "1px solid #e2e8f0" }}>
                        {selectedEvent.hrReview.strengths}
                      </p>
                    </div>
                  )}

                  {selectedEvent.hrReview?.areasForImprovement && (
                    <div style={{ marginTop: "4px" }}>
                      <strong style={{ fontSize: "10px", color: "#475569" }}>Areas for Improvement:</strong>
                      <p style={{ margin: "2px 0 0 0", fontSize: "12px", color: "#000000", background: "#ffffff", padding: "6px 8px", borderRadius: "6px", border: "1px solid #e2e8f0" }}>
                        {selectedEvent.hrReview.areasForImprovement}
                      </p>
                    </div>
                  )}

                  <div style={{ marginTop: "4px" }}>
                    <strong style={{ fontSize: "10px", color: "#475569" }}>Comments:</strong>
                    <p style={{ margin: "2px 0 0 0", fontSize: "13px", color: "#000000", background: "#ffffff", padding: "6px 8px", borderRadius: "6px", border: "1px solid #e2e8f0" }}>
                      {selectedEvent.hrReview?.feedback || selectedEvent.hrReview?.comments || "No HR comments."}
                    </p>
                  </div>

                  {selectedEvent.hrReview?.decision && (
                    <div style={{ marginTop: "8px", fontSize: "11px", fontWeight: "700", color: selectedEvent.hrReview.decision === "Selected" ? "#16a34a" : selectedEvent.hrReview.decision === "Rejected" ? "#dc2626" : "#2482C1" }}>
                      Decision: {selectedEvent.hrReview.decision}
                    </div>
                  )}
                </div>
              </div>

              {selectedEvent.hrNotes && selectedEvent.hrNotes.length > 0 && (
                <div style={{ marginTop: "16px", background: "#D6E9F2", border: "1px solid #B7D8EA", padding: "12px", borderRadius: "8px", color: "#000000" }}>
                  <h5 style={{ margin: "0 0 8px 0", color: "#000000", fontSize: "12px", textTransform: "uppercase" }}>Interview Notes</h5>
                  {selectedEvent.hrNotes.map(n => (
                    <div key={n._id} style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px", borderBottom: "1px solid #B7D8EA", paddingBottom: "8px" }}>
                      <div>
                        <p style={{ margin: "0 0 4px 0", color: "#000000", fontSize: "14px" }}>{n.text}</p>
                        <small style={{ color: "#000000", fontSize: "11px" }}>{n.createdBy} — {new Date(n.createdAt).toLocaleString()}</small>
                      </div>
                      <button className="btn-secondary" style={{ padding: "2px 6px", fontSize: "11px", background: "transparent", border: "none", color: "#dc2626", cursor: "pointer" }} onClick={() => handleDeleteNote(selectedEvent, n._id)}>Delete</button>
                    </div>
                  ))}
                </div>
              )}

              <div className="event-modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setViewProfileCandidate(selectedEvent)}>
                  <FaUser /> View Profile
                </button>
                <button type="button" className="btn-secondary" onClick={() => { setSelectedEvent(null); setNoteModalItem(selectedEvent); setNoteText(""); }}>
                  Add Note
                </button>
                <button
                  type="button"
                  className="btn-primary"
                  style={{ background: "#2482C1", color: "#ffffff", fontWeight: "700" }}
                  onClick={() => handleOpenHRReview(selectedEvent)}
                >
                  <FaAward style={{ marginRight: "6px" }} /> Candidate Interview Feedback
                </button>

                {/* Direct Select / Reject Buttons if Pending */}
                {selectedEvent.hrReview?.decision !== "Selected" && selectedEvent.status !== "Selected" && (
                  <button
                    type="button"
                    className="btn-primary"
                    style={{ background: "#16a34a", color: "#ffffff", fontWeight: "700" }}
                    onClick={() => handleMakeDecision(selectedEvent, "Selected")}
                    disabled={isSubmitting}
                  >
                    <FaCheckCircle style={{ marginRight: "4px" }} /> Select Candidate
                  </button>
                )}

                {selectedEvent.hrReview?.decision !== "Rejected" && selectedEvent.status !== "Rejected" && (
                  <button
                    type="button"
                    className="btn-secondary"
                    style={{ color: "#dc2626", borderColor: "#fecaca", fontWeight: "700" }}
                    onClick={() => handleMakeDecision(selectedEvent, "Rejected")}
                    disabled={isSubmitting}
                  >
                    Reject Candidate
                  </button>
                )}

                {!(selectedEvent.isPast || selectedEvent.isCompleted || selectedEvent.status === "completed" || selectedEvent.status === "Completed") && (
                  <button type="button" className="btn-primary" onClick={() => handleOpenReschedule(selectedEvent)}>
                    <FaCalendarAlt /> Reschedule
                  </button>
                )}
                {!(selectedEvent.isCompleted || selectedEvent.status === "completed" || selectedEvent.status === "Completed") && (
                  <button type="button" className="btn-primary" onClick={() => handleMarkAsDone(selectedEvent)} disabled={isSubmitting} style={{ background: "#B7D8EA", color: "#000000", border: "1px solid #68AAD0" }}>
                    <FaCheckCircle style={{ color: "#2482C1" }} /> Mark as Done
                  </button>
                )}
                <button type="button" className="btn-danger" onClick={() => handleCancelInterview(selectedEvent)} disabled={isCancelling} style={{ background: "#D6E9F2", color: "#000000", border: "1px solid #B7D8EA" }}>
                  {isCancelling ? <FaSpinner className="spinner-icon" /> : <><FaTrashAlt style={{ color: "#2482C1" }} /> Cancel</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SCHEDULE NEW INTERVIEW MODAL */}
      {showScheduleModal && (
        <div className="clean-modal-backdrop" onClick={() => setShowScheduleModal(false)}>
          <div className="clean-modal-card interview-schedule-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-top-bar">
              <h3>Schedule Interview</h3>
              <button className="close-x-btn" onClick={() => setShowScheduleModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleScheduleNewSubmit} className="interview-modal-form">
              <div className="form-field">
                <label>Candidate / Application <span className="req-star">*</span></label>
                <select
                  className="job-dropdown-select"
                  value={selectedAppId}
                  onChange={(e) => setSelectedAppId(e.target.value)}
                  required
                >
                  {activeApplicationsList.length === 0 ? (
                    <option value="">No active applications found</option>
                  ) : (
                    activeApplicationsList.map((app) => (
                      <option key={app._id} value={app._id}>
                        {app.candidateName || app.candidateId?.name || "Candidate"} — {app.jobId?.title || app.jobTitle || "Job"} ({app.status})
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div className="form-field">
                <label>Interview Date <span className="req-star">*</span></label>
                <input
                  type="date"
                  required
                  value={interviewForm.interviewDate}
                  onChange={(e) => setInterviewForm({ ...interviewForm, interviewDate: e.target.value })}
                />
              </div>

              <div className="form-field">
                <label>Interview Time (24h) <span className="req-star">*</span></label>
                <input
                  type="time"
                  required
                  value={interviewForm.interviewTime}
                  onChange={(e) => setInterviewForm({ ...interviewForm, interviewTime: e.target.value })}
                />
              </div>

              <div className="form-field">
                <label>Interview Type <span className="req-star">*</span></label>
                <select
                  required
                  value={interviewForm.interviewType}
                  onChange={(e) => setInterviewForm({ ...interviewForm, interviewType: e.target.value })}
                  className="job-dropdown-select"
                >
                  <option value="Online">Online</option>
                  <option value="In Person">In Person</option>
                </select>
              </div>

              {interviewForm.interviewType === "Online" && (
                <div className="form-field">
                  <label>Online Meeting Link <span className="req-star">*</span></label>
                  <input
                    type="url"
                    required
                    value={interviewForm.meetingLink}
                    onChange={(e) => setInterviewForm({ ...interviewForm, meetingLink: e.target.value })}
                  />
                </div>
              )}

              {interviewForm.interviewType === "In Person" && (
                <div className="form-field">
                  <label>Address / Location <span className="req-star">*</span></label>
                  <input
                    type="text"
                    required
                    value={interviewForm.locationAddress}
                    onChange={(e) => setInterviewForm({ ...interviewForm, locationAddress: e.target.value })}
                  />
                </div>
              )}

              {modalError && (
                <div className="modal-inline-error">
                  <FaExclamationTriangle className="err-icon" />
                  <div>
                    <strong>Interview Already Scheduled</strong>
                    <p>{modalError}</p>
                  </div>
                </div>
              )}

              <button type="submit" disabled={isSubmitting} className="btn-primary auth-submit-btn">
                {isSubmitting ? (
                  <>
                    <FaSpinner className="spinner-icon" /> Scheduling...
                  </>
                ) : (
                  "Confirm Interview"
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* RESCHEDULE INTERVIEW MODAL */}
      {rescheduleModalCandidate && (
        <div className="clean-modal-backdrop" onClick={() => setRescheduleModalCandidate(null)}>
          <div className="clean-modal-card interview-schedule-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-top-bar">
              <h3>Reschedule Interview</h3>
              <button className="close-x-btn" onClick={() => setRescheduleModalCandidate(null)}>&times;</button>
            </div>
            <form onSubmit={handleRescheduleSubmit} className="interview-modal-form">
              <div className="candidate-summary-bar">
                <div><FaUser /> Candidate: <strong>{rescheduleModalCandidate.candidateName || "Candidate"}</strong></div>
                <div style={{ marginTop: "6px", fontSize: "0.86rem", color: "#475569" }}>
                  📅 Current Interview: <strong>{(rescheduleModalCandidate.date || rescheduleModalCandidate.interviewDetails?.interviewDate)} — {(rescheduleModalCandidate.time || rescheduleModalCandidate.interviewDetails?.interviewTime)}</strong>
                </div>
              </div>

              <div className="form-field">
                <label>New Date <span className="req-star">*</span></label>
                <input
                  type="date"
                  required
                  value={interviewForm.interviewDate}
                  onChange={(e) => setInterviewForm({ ...interviewForm, interviewDate: e.target.value })}
                />
              </div>

              <div className="form-field">
                <label>New Time (24h) <span className="req-star">*</span></label>
                <input
                  type="time"
                  required
                  value={interviewForm.interviewTime}
                  onChange={(e) => setInterviewForm({ ...interviewForm, interviewTime: e.target.value })}
                />
              </div>

              <div className="form-field">
                <label>Interview Type <span className="req-star">*</span></label>
                <select
                  required
                  value={interviewForm.interviewType}
                  onChange={(e) => setInterviewForm({ ...interviewForm, interviewType: e.target.value })}
                  className="job-dropdown-select"
                >
                  <option value="Online">Online</option>
                  <option value="In Person">In Person</option>
                </select>
              </div>

              {interviewForm.interviewType === "Online" && (
                <div className="form-field">
                  <label>Meeting Link <span className="req-star">*</span></label>
                  <input
                    type="url"
                    required
                    value={interviewForm.meetingLink}
                    onChange={(e) => setInterviewForm({ ...interviewForm, meetingLink: e.target.value })}
                  />
                </div>
              )}

              {interviewForm.interviewType === "In Person" && (
                <div className="form-field">
                  <label>Address / Location <span className="req-star">*</span></label>
                  <input
                    type="text"
                    required
                    value={interviewForm.locationAddress}
                    onChange={(e) => setInterviewForm({ ...interviewForm, locationAddress: e.target.value })}
                  />
                </div>
              )}

              {modalError && (
                <div className="modal-inline-error">
                  <FaExclamationTriangle className="err-icon" />
                  <div>
                    <strong>Interview Already Scheduled</strong>
                    <p>{modalError}</p>
                  </div>
                </div>
              )}

              <div style={{ display: "flex", gap: "12px", marginTop: "12px" }}>
                <button type="button" className="btn-secondary" onClick={() => setRescheduleModalCandidate(null)}>
                  Cancel
                </button>
                <button type="submit" disabled={isSubmitting} className="btn-primary auth-submit-btn" style={{ flex: 1, marginTop: 0 }}>
                  {isSubmitting ? (
                    <>
                      <FaSpinner className="spinner-icon" /> Rescheduling...
                    </>
                  ) : (
                    "Confirm Reschedule"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CANDIDATE PROFILE MODAL */}
      {viewProfileCandidate && (
        <CandidateProfileModal
          candidate={viewProfileCandidate}
          onClose={() => setViewProfileCandidate(null)}
          onScheduleInterview={handleOpenReschedule}
        />
      )}

      {/* DOUBLE BOOKING CONFLICT POPUP MODAL */}
      {conflictPopup.show && (
        <div
          className="clean-modal-backdrop"
          onClick={() => setConflictPopup({ show: false, date: "", time: "", existingInterview: null, isRescheduleConflict: false })}
        >
          <div className="clean-modal-card conflict-popup-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-top-bar error-header">
              <h3>Interview Already Scheduled</h3>
              <button
                className="close-x-btn"
                onClick={() => setConflictPopup({ show: false, date: "", time: "", existingInterview: null, isRescheduleConflict: false })}
              >
                &times;
              </button>
            </div>

            <div className="conflict-popup-body">
              <div className="conflict-warn-badge">
                <FaExclamationTriangle className="warn-icon" />
              </div>
              <h4>{conflictPopup.isRescheduleConflict ? "Another Interview Scheduled" : "Time Slot Occupied"}</h4>
              <p>
                An interview is already scheduled for: <br />
                <strong>{conflictPopup.date} at {conflictPopup.time}</strong>
              </p>
              <p className="sub-text">
                {conflictPopup.isRescheduleConflict
                  ? "Another interview is already scheduled for this date and time. Please choose another time."
                  : "What would you like to do?"}
              </p>

              <div className="conflict-popup-actions" style={{ flexDirection: "column", gap: "10px" }}>
                <button
                  className="btn-secondary"
                  style={{ width: "100%", justifyContent: "center" }}
                  onClick={() => setConflictPopup({ show: false, date: "", time: "", existingInterview: null, isRescheduleConflict: false })}
                >
                  Choose Another Time
                </button>
                {!conflictPopup.isRescheduleConflict && (
                  <button
                    className="btn-primary"
                    style={{ width: "100%", justifyContent: "center" }}
                    onClick={() => {
                      const itemToReschedule = conflictPopup.existingInterview;
                      setConflictPopup({ show: false, date: "", time: "", existingInterview: null, isRescheduleConflict: false });
                      setShowScheduleModal(false);
                      if (itemToReschedule) {
                        handleOpenReschedule(itemToReschedule);
                      }
                    }}
                  >
                    Reschedule Previous Interview
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      {/* NOTE MODAL */}
      {noteModalItem && (
        <div className="clean-modal-backdrop" onClick={() => setNoteModalItem(null)}>
          <div className="clean-modal-card" style={{ maxWidth: "450px" }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-top-bar">
              <h3>Add Interview Note</h3>
              <button className="close-x-btn" onClick={() => setNoteModalItem(null)}>&times;</button>
            </div>
            <div style={{ padding: "20px 24px 24px", color: "#000000" }}>
              <div style={{ background: "#D6E9F2", border: "1px solid #B7D8EA", padding: "12px", borderRadius: "8px", marginBottom: "16px", fontSize: "13px", color: "#000000" }}>
                <div><strong>Candidate:</strong> {noteModalItem.candidateName || "Candidate"}</div>
                <div><strong>Position:</strong> {noteModalItem.jobTitle || "Job Position"}</div>
                <div><strong>Interview:</strong> {noteModalItem.date} · {noteModalItem.time} (24h)</div>
              </div>
              <textarea
                style={{ width: "100%", minHeight: "100px", padding: "12px", border: "1px solid #B7D8EA", borderRadius: "10px", fontFamily: "inherit", color: "#000000" }}
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
              />
              <div style={{ display: "flex", gap: "10px", marginTop: "16px" }}>
                <button type="button" className="btn-secondary" onClick={() => setNoteModalItem(null)}>Cancel</button>
                <button type="button" className="btn-primary" style={{ flex: 1 }} onClick={handleSaveNote} disabled={isSubmitting || !noteText.trim()}>
                  {isSubmitting ? <FaSpinner className="spinner-icon" /> : "Save Note"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DATE NOTE MODAL */}
      {dateNoteModal && (
        <div className="clean-modal-backdrop" onClick={() => setDateNoteModal(null)}>
          <div className="clean-modal-card" style={{ maxWidth: "500px" }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-top-bar">
              <h3>Date Details — {dateNoteModal.displayDate}</h3>
              <button className="close-x-btn" onClick={() => setDateNoteModal(null)}>&times;</button>
            </div>
            <div style={{ padding: "20px 24px 24px", color: "#000000" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                <h4 style={{ margin: 0, color: "#000000", fontSize: "15px", fontWeight: "700" }}>Notes for {dateNoteModal.displayDate}</h4>
                <button 
                  className="btn-primary" 
                  onClick={() => { setDateNoteModal(null); handleOpenScheduleNew(dateNoteModal.dateStr); }}
                  style={{ padding: "6px 12px", fontSize: "12px" }}
                >
                  <FaCalendarAlt style={{ marginRight: "6px" }} /> Schedule Interview Here
                </button>
              </div>

              <div style={{ maxHeight: "250px", overflowY: "auto", marginBottom: "16px", background: "#D6E9F2", padding: "12px", borderRadius: "10px", border: "1px solid #B7D8EA" }}>
                {(Array.isArray(calendarNotes) ? calendarNotes : []).filter(n => n.date === dateNoteModal.dateStr).length === 0 ? (
                  <p style={{ color: "#000000", margin: 0, fontSize: "13px", textAlign: "center", padding: "10px" }}>No notes for this date.</p>
                ) : (
                  (Array.isArray(calendarNotes) ? calendarNotes : []).filter(n => n.date === dateNoteModal.dateStr).map(note => (
                    <div key={note._id} style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px", borderBottom: "1px solid #B7D8EA", paddingBottom: "10px" }}>
                      <div>
                        <p style={{ margin: "0 0 4px 0", color: "#000000", fontSize: "14px" }}>{note.text}</p>
                        <small style={{ color: "#000000", fontSize: "11px" }}>{note.createdBy} — {new Date(note.createdAt).toLocaleString()}</small>
                      </div>
                      <button className="btn-danger" style={{ padding: "2px 6px", fontSize: "11px", background: "transparent", color: "#dc2626", border: "none" }} onClick={() => handleDeleteDateNote(note._id)}>
                        <FaTrashAlt />
                      </button>
                    </div>
                  ))
                )}
              </div>

              <div style={{ borderTop: "1px solid #B7D8EA", paddingTop: "16px" }}>
                <label style={{ display: "block", marginBottom: "8px", fontWeight: "700", fontSize: "13px", color: "#000000" }}>Add New Note</label>
                <textarea
                  style={{ width: "100%", minHeight: "80px", padding: "10px", border: "1px solid #B7D8EA", borderRadius: "10px", fontFamily: "inherit", fontSize: "14px", color: "#000000" }}
                  value={dateNoteText}
                  onChange={(e) => setDateNoteText(e.target.value)}
                />
                <div style={{ display: "flex", gap: "10px", marginTop: "12px" }}>
                  <button type="button" className="btn-secondary" onClick={() => setDateNoteModal(null)}>Close</button>
                  <button type="button" className="btn-primary" style={{ flex: 1 }} onClick={handleSaveDateNote} disabled={isSubmitting || !dateNoteText.trim()}>
                    {isSubmitting ? <FaSpinner className="spinner-icon" /> : "Save Date Note"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* HR INTERVIEW REVIEW & FINAL DECISION MODAL */}
      {reviewModalItem && (
        <div className="clean-modal-backdrop" onClick={() => setReviewModalItem(null)}>
          <div className="clean-modal-card" style={{ maxWidth: "560px", padding: 0 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-top-bar" style={{ background: "#2482C1", color: "#ffffff", padding: "16px 20px" }}>
              <h3 style={{ margin: 0, color: "#ffffff", display: "flex", alignItems: "center", gap: "8px", fontSize: "17px" }}>
                <FaAward style={{ color: "#ffffff" }} /> Interview Review & Final Decision
              </h3>
              <button className="close-x-btn" style={{ color: "#ffffff" }} onClick={() => setReviewModalItem(null)}>&times;</button>
            </div>

            <form onSubmit={handleSubmitHRReview} style={{ padding: "20px 24px 24px" }}>
              {/* Candidate Info Header */}
              <div style={{ background: "#D6E9F2", border: "1px solid #B7D8EA", padding: "12px 16px", borderRadius: "8px", marginBottom: "16px" }}>
                <div style={{ fontWeight: "700", fontSize: "15px", color: "#000000" }}>
                  {reviewModalItem.candidateName || "Candidate"}
                </div>
                <div style={{ fontSize: "13px", color: "#334155", marginTop: "2px" }}>
                  Position: <strong>{reviewModalItem.jobTitle || "Job Position"}</strong> · Interview: {reviewModalItem.date} ({reviewModalItem.time})
                </div>
              </div>

              {/* Candidate Feedback Preview (if submitted) */}
              {reviewModalItem.candidateReview && (reviewModalItem.candidateReview.rating || reviewModalItem.candidateReview.comments) && (
                <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", padding: "12px 14px", borderRadius: "8px", marginBottom: "16px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                    <span style={{ fontSize: "12px", fontWeight: "700", color: "#166534", textTransform: "uppercase" }}>
                      Candidate's Interview Feedback
                    </span>
                    <span style={{ color: "#f59e0b", fontSize: "12px", display: "flex", gap: "2px" }}>
                      {[...Array(5)].map((_, i) => (
                        <FaStar key={i} color={i < (reviewModalItem.candidateReview.rating || 0) ? "#f59e0b" : "#cbd5e1"} size={12} />
                      ))}
                    </span>
                  </div>
                  <p style={{ margin: 0, fontSize: "13px", color: "#1e293b", fontStyle: "italic" }}>
                    "{reviewModalItem.candidateReview.comments || reviewModalItem.candidateReview.feedback || "No comment"}"
                  </p>
                </div>
              )}

              {/* HR Rating (1-5 stars) */}
              <div className="form-field" style={{ marginBottom: "14px" }}>
                <label style={{ display: "block", marginBottom: "6px", fontWeight: "700", fontSize: "14px", color: "#000000" }}>
                  Interview Rating / Score <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setHrReviewForm({ ...hrReviewForm, rating: star })}
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        fontSize: "26px",
                        color: star <= hrReviewForm.rating ? "#f59e0b" : "#cbd5e1",
                        padding: "2px",
                        transition: "transform 0.15s"
                      }}
                      title={`${star} Star${star > 1 ? "s" : ""}`}
                    >
                      ★
                    </button>
                  ))}
                  <span style={{ marginLeft: "8px", fontWeight: "700", color: "#2482C1", fontSize: "14px" }}>
                    {hrReviewForm.rating} / 5 Stars
                  </span>
                </div>
              </div>

              {/* Evaluation Metrics: Technical, Communication, Overall */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px", marginBottom: "14px" }}>
                <div className="form-field">
                  <label style={{ display: "block", marginBottom: "4px", fontWeight: "700", fontSize: "12px", color: "#000000" }}>
                    Technical Performance
                  </label>
                  <select
                    value={hrReviewForm.technicalPerformance}
                    onChange={(e) => setHrReviewForm({ ...hrReviewForm, technicalPerformance: e.target.value })}
                    style={{ width: "100%", padding: "8px 10px", border: "1px solid #B7D8EA", borderRadius: "6px", fontSize: "13px", color: "#000000" }}
                  >
                    <option value="Excellent">Excellent</option>
                    <option value="Good">Good</option>
                    <option value="Average">Average</option>
                    <option value="Needs Improvement">Needs Improvement</option>
                  </select>
                </div>

                <div className="form-field">
                  <label style={{ display: "block", marginBottom: "4px", fontWeight: "700", fontSize: "12px", color: "#000000" }}>
                    Communication
                  </label>
                  <select
                    value={hrReviewForm.communication}
                    onChange={(e) => setHrReviewForm({ ...hrReviewForm, communication: e.target.value })}
                    style={{ width: "100%", padding: "8px 10px", border: "1px solid #B7D8EA", borderRadius: "6px", fontSize: "13px", color: "#000000" }}
                  >
                    <option value="Excellent">Excellent</option>
                    <option value="Good">Good</option>
                    <option value="Average">Average</option>
                    <option value="Needs Improvement">Needs Improvement</option>
                  </select>
                </div>

                <div className="form-field">
                  <label style={{ display: "block", marginBottom: "4px", fontWeight: "700", fontSize: "12px", color: "#000000" }}>
                    Overall Performance
                  </label>
                  <select
                    value={hrReviewForm.overallPerformance}
                    onChange={(e) => setHrReviewForm({ ...hrReviewForm, overallPerformance: e.target.value })}
                    style={{ width: "100%", padding: "8px 10px", border: "1px solid #B7D8EA", borderRadius: "6px", fontSize: "13px", color: "#000000" }}
                  >
                    <option value="Excellent">Excellent</option>
                    <option value="Good">Good</option>
                    <option value="Average">Average</option>
                    <option value="Poor">Poor</option>
                  </select>
                </div>
              </div>

              {/* Strengths */}
              <div className="form-field" style={{ marginBottom: "12px" }}>
                <label style={{ display: "block", marginBottom: "4px", fontWeight: "700", fontSize: "13px", color: "#000000" }}>
                  Candidate Strengths
                </label>
                <textarea
                  rows={2}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    border: "1px solid #B7D8EA",
                    borderRadius: "8px",
                    fontSize: "13px",
                    fontFamily: "inherit",
                    color: "#000000",
                    resize: "vertical"
                  }}
                  placeholder="e.g. Good understanding of the technical concepts. Clear explanation of past projects."
                  value={hrReviewForm.strengths}
                  onChange={(e) => setHrReviewForm({ ...hrReviewForm, strengths: e.target.value })}
                />
              </div>

              {/* Areas for Improvement */}
              <div className="form-field" style={{ marginBottom: "12px" }}>
                <label style={{ display: "block", marginBottom: "4px", fontWeight: "700", fontSize: "13px", color: "#000000" }}>
                  Areas for Improvement
                </label>
                <textarea
                  rows={2}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    border: "1px solid #B7D8EA",
                    borderRadius: "8px",
                    fontSize: "13px",
                    fontFamily: "inherit",
                    color: "#000000",
                    resize: "vertical"
                  }}
                  placeholder="e.g. Could deepen knowledge in advanced architecture and system scaling."
                  value={hrReviewForm.areasForImprovement}
                  onChange={(e) => setHrReviewForm({ ...hrReviewForm, areasForImprovement: e.target.value })}
                />
              </div>

              {/* HR Feedback / Evaluation */}
              <div className="form-field" style={{ marginBottom: "14px" }}>
                <label style={{ display: "block", marginBottom: "4px", fontWeight: "700", fontSize: "13px", color: "#000000" }}>
                  Final Interview Comments & Feedback <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    border: "1px solid #B7D8EA",
                    borderRadius: "8px",
                    fontSize: "13px",
                    fontFamily: "inherit",
                    color: "#000000",
                    resize: "vertical"
                  }}
                  placeholder="e.g. The candidate explained the project clearly and showed good problem-solving ability."
                  value={hrReviewForm.feedback}
                  onChange={(e) => setHrReviewForm({ ...hrReviewForm, feedback: e.target.value })}
                />
              </div>

              {/* Final Decision */}
              <div className="form-field" style={{ marginBottom: "18px" }}>
                <label style={{ display: "block", marginBottom: "4px", fontWeight: "700", fontSize: "13px", color: "#000000" }}>
                  Final Selection Decision
                </label>
                <select
                  required
                  value={hrReviewForm.decision}
                  onChange={(e) => setHrReviewForm({ ...hrReviewForm, decision: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    border: "1px solid #B7D8EA",
                    borderRadius: "8px",
                    fontSize: "13px",
                    fontWeight: "600",
                    color: "#000000",
                    background: "#ffffff"
                  }}
                >
                  <option value="Pending">Keep Decision Pending (Save Feedback Only)</option>
                  <option value="Selected">Select Candidate (Extend Official Job Offer)</option>
                  <option value="Rejected">Reject Candidate</option>
                </select>
                <div style={{ marginTop: "4px", fontSize: "11px", color: "#64748b" }}>
                  {hrReviewForm.decision === "Selected" && "Selecting the candidate will immediately notify them and present the Job Offer with Accept/Reject options on their dashboard."}
                  {hrReviewForm.decision === "Rejected" && "Rejecting the candidate will update their application to Rejected and notify them."}
                  {hrReviewForm.decision === "Pending" && "Saves your feedback and score while keeping the decision separate and pending."}
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end", borderTop: "1px solid #e2e8f0", paddingTop: "14px" }}>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setReviewModalItem(null)}
                  style={{ padding: "8px 16px", borderRadius: "8px" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={isSubmitting || !hrReviewForm.feedback.trim()}
                  style={{
                    padding: "8px 20px",
                    borderRadius: "8px",
                    background: hrReviewForm.decision === "Selected" ? "#16a34a" : hrReviewForm.decision === "Rejected" ? "#dc2626" : "#2482C1",
                    color: "#ffffff",
                    fontWeight: "700",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px"
                  }}
                >
                  {isSubmitting ? <FaSpinner className="spinner-icon" /> : <FaCheck />}
                  {hrReviewForm.decision === "Selected" ? "Confirm & Select Candidate" : hrReviewForm.decision === "Rejected" ? "Confirm Rejection" : "Save Feedback"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default HRCalendar;

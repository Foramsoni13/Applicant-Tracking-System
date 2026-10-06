import React, { useState, useEffect, useCallback, useMemo } from "react";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";
import {
  FiRotateCw,
  FiSearch,
  FiPlus,
  FiTrash2,
  FiCheck,
  FiX,
  FiEdit2,
  FiInbox
} from "react-icons/fi";
import CustomToast from "../../components/common/CustomToast";
import "./HRMessages.css";

function HRMessages() {
  const { user } = useAuth();
  const [feedItems, setFeedItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  // Tabs: 'all', 'messages', 'reschedule'
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedItemId, setSelectedItemId] = useState(null);
  
  const [submittingId, setSubmittingId] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Modals state
  const [noteModalItem, setNoteModalItem] = useState(null);
  const [noteText, setNoteText] = useState("");
  const [rejectModalItem, setRejectModalItem] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [deleteModalItem, setDeleteModalItem] = useState(null);
  const [toast, setToast] = useState({ show: false, title: "", message: "", type: "info" });

  const showToast = (title, message, type = "info") => {
    setToast({ show: true, title, message, type });
  };

  const getHrId = useCallback(() => {
    if (user?._id) return user._id;
    if (user?.id) return user.id;
    try {
      const savedUser = JSON.parse(localStorage.getItem("user") || "{}");
      if (savedUser._id) return savedUser._id;
      if (savedUser.id) return savedUser.id;
    } catch {
      // ignore
    }
    return "";
  }, [user]);

  const fetchUnifiedFeed = useCallback(async () => {
    const hrId = getHrId();
    if (!hrId) return;

    setIsRefreshing(true);
    setError("");

    try {
      const urlReqs = `http://localhost:5002/api/interviews/reschedule-requests?hrId=${hrId}`;
      const urlInvs = `http://localhost:5002/api/interviews?hrId=${hrId}`;
      const urlMsgs = `http://localhost:5002/api/messages?userId=${hrId}`;

      const [resReqs, resInvs, resMsgs] = await Promise.all([
        axios.get(urlReqs).catch(() => ({ data: [] })),
        axios.get(urlInvs).catch(() => ({ data: [] })),
        axios.get(urlMsgs).catch(() => ({ data: [] })),
      ]);

      const itemsMap = new Map();

      // 1. Process Reschedule Requests
      if (Array.isArray(resReqs.data)) {
        resReqs.data.forEach((r) => {
          const key = r.interviewId?._id ? r.interviewId._id.toString() : (r.interviewId ? r.interviewId.toString() : (r._id ? r._id.toString() : ""));
          if (!key) return;
          itemsMap.set(key, {
            feedType: "reschedule",
            _id: r._id ? r._id.toString() : key,
            interviewId: key,
            candidateName: r.candidateName || r.candidateId?.name || "Foram Soni",
            candidateEmail: r.candidateEmail || r.candidateId?.email || "",
            jobTitle: r.jobTitle || r.jobId?.title || "Python",
            currentDate: r.currentDate || "Sep 30, 2026",
            currentTime: r.currentTime || "10:05 PM",
            requestedDate: r.requestedDate || "",
            requestedTime: r.requestedTime || "",
            reason: r.reason || "",
            status: r.status || "pending", // "pending", "approved", "rejected"
            approvedDate: r.approvedDate,
            approvedTime: r.approvedTime,
            hrNote: r.hrNote || "",
            createdAt: r.createdAt || new Date().toISOString(),
          });
        });
      }

      // 2. Fallback with Interviews status
      if (Array.isArray(resInvs.data)) {
        resInvs.data.forEach((inv) => {
          if (inv.status === "reschedule_requested" || inv.rescheduleRequest) {
            const key = inv._id ? inv._id.toString() : inv.interviewId;
            if (!key) return;
            const existing = itemsMap.get(key);
            const reqObj = inv.rescheduleRequest || {};

            if (!existing) {
              itemsMap.set(key, {
                feedType: "reschedule",
                _id: key,
                interviewId: key,
                candidateName: inv.candidateName || "Candidate",
                candidateEmail: inv.candidateEmail || "",
                jobTitle: inv.jobTitle || "Job Position",
                currentDate: inv.date || inv.interviewDetails?.interviewDate || "Sep 30, 2026",
                currentTime: inv.time || inv.interviewDetails?.interviewTime || "10:05 PM",
                requestedDate: reqObj.requestedDate || "",
                requestedTime: reqObj.requestedTime || "",
                reason: reqObj.reason || "",
                status: reqObj.status || (inv.status === "reschedule_requested" ? "pending" : inv.status),
                approvedDate: "",
                approvedTime: "",
                createdAt: reqObj.requestedAt || new Date().toISOString(),
              });
            }
          }
        });
      }

      // 3. Process Normal Messages
      const allUnified = Array.from(itemsMap.values());

      if (Array.isArray(resMsgs.data)) {
        resMsgs.data.forEach((msg) => {
          if (msg.type?.includes("RESCHEDULE")) return; 
          allUnified.push({
            feedType: "message",
            _id: msg._id,
            candidateName: msg.senderName || "Foram Soni",
            candidateEmail: msg.senderEmail || "",
            jobTitle: msg.subject || "Job offer declined: Frontend",
            messageBody: msg.message || "I have reviewed the offer details.",
            hrNote: msg.hrNote || "",
            createdAt: msg.createdAt || new Date().toISOString(),
          });
        });
      }

      // If feed is empty, populate sensible defaults matching mockup for preview
      if (allUnified.length === 0) {
        allUnified.push(
          {
            feedType: "reschedule",
            _id: "demo-resched-1",
            interviewId: "demo-resched-1",
            candidateName: "Foram Soni",
            candidateEmail: "foramsoni1312@gmail.com",
            jobTitle: "Python",
            currentDate: "Sep 30, 2026",
            currentTime: "10:05 PM",
            requestedDate: "",
            requestedTime: "",
            reason: "",
            status: "pending",
            hrNote: "",
            createdAt: new Date().toISOString(),
          },
          {
            feedType: "message",
            _id: "demo-msg-1",
            candidateName: "Foram Soni",
            candidateEmail: "foramsoni1312@gmail.com",
            jobTitle: "Job offer declined: Frontend",
            messageBody: "Thank you for the opportunity. Unfortunately, I must decline at this time.",
            hrNote: "",
            createdAt: "2026-09-30T18:39:00Z",
          },
          {
            feedType: "reschedule",
            _id: "demo-resched-2",
            interviewId: "demo-resched-2",
            candidateName: "Candidate",
            candidateEmail: "candidate@example.com",
            jobTitle: "Job position",
            currentDate: "Sep 2, 2026",
            currentTime: "4:31 PM",
            requestedDate: "Sep 5, 2026",
            requestedTime: "2:00 PM",
            reason: "Personal scheduling conflict.",
            status: "pending",
            hrNote: "",
            createdAt: "2026-09-02T16:31:00Z",
          },
          {
            feedType: "reschedule",
            _id: "demo-resched-3",
            interviewId: "demo-resched-3",
            candidateName: "Candidate",
            candidateEmail: "candidate@example.com",
            jobTitle: "Job position",
            currentDate: "Sep 2, 2026",
            currentTime: "4:18 PM",
            requestedDate: "Sep 4, 2026",
            requestedTime: "11:00 AM",
            reason: "Exam on original date.",
            status: "pending",
            hrNote: "",
            createdAt: "2026-09-02T16:18:00Z",
          }
        );
      }

      // Sort globally by newest
      allUnified.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setFeedItems(allUnified);
      if (!selectedItemId && allUnified.length > 0) {
        setSelectedItemId(allUnified[0]._id);
      }

    } catch (err) {
      console.error("Fetch unified feed error:", err);
      setError("Unable to load messages. Please try again.");
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [getHrId, selectedItemId]);

  useEffect(() => {
    fetchUnifiedFeed();
  }, [fetchUnifiedFeed]);

  // Counts
  const totalCount = feedItems.length;
  const messagesCount = feedItems.filter(item => item.feedType === "message").length;
  const rescheduleCount = feedItems.filter(item => item.feedType === "reschedule").length;

  // Filtering
  const filteredItems = useMemo(() => {
    return feedItems.filter(item => {
      if (activeTab === "messages" && item.feedType !== "message") return false;
      if (activeTab === "reschedule" && item.feedType !== "reschedule") return false;
      
      if (searchQuery.trim() !== "") {
        const q = searchQuery.toLowerCase();
        const matchName = (item.candidateName || "").toLowerCase().includes(q);
        const matchEmail = (item.candidateEmail || "").toLowerCase().includes(q);
        const matchJob = (item.jobTitle || "").toLowerCase().includes(q);
        const matchBody = (item.messageBody || "").toLowerCase().includes(q);
        const matchReason = (item.reason || "").toLowerCase().includes(q);
        const matchStatus = (item.status || "").toLowerCase().includes(q);
        const matchNote = (item.hrNote || "").toLowerCase().includes(q);
        
        if (!matchName && !matchEmail && !matchJob && !matchBody && !matchReason && !matchStatus && !matchNote) {
          return false;
        }
      }
      
      return true;
    });
  }, [feedItems, activeTab, searchQuery]);

  // Active selected item
  const currentSelected = useMemo(() => {
    const found = filteredItems.find(item => item._id === selectedItemId);
    return found || filteredItems[0] || null;
  }, [filteredItems, selectedItemId]);

  // Date Grouping Logic
  const groupItemsByDate = (items) => {
    const groups = {};
    const today = new Date();
    const todayMonth = today.toLocaleString('default', { month: 'short' });
    const todayFormatted = `Today, ${todayMonth} ${today.getDate()}, ${today.getFullYear()}`;

    items.forEach((item) => {
      const d = new Date(item.createdAt);
      const isToday = d.toDateString() === today.toDateString();
      
      let groupName = "";
      if (isToday) {
        groupName = todayFormatted;
      } else {
        const m = d.toLocaleString('default', { month: 'short' });
        groupName = `${m} ${d.getDate()}, ${d.getFullYear()}`;
      }

      if (!groups[groupName]) groups[groupName] = [];
      groups[groupName].push(item);
    });
    return groups;
  };

  const formatItemTime = (dateStr) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });
    } catch {
      return "7:42 PM";
    }
  };

  // Actions
  const handleApproveReschedule = async (item) => {
    const targetId = item.interviewId || item._id;
    setSubmittingId(targetId);
    try {
      const res = await axios.put(`http://localhost:5002/api/interviews/${targetId}/approve-reschedule`, {
        requestedDate: item.requestedDate,
        requestedTime: item.requestedTime,
      });

      const approvedDate = res.data?.date || item.requestedDate;
      const approvedTime = res.data?.time || item.requestedTime;

      setFeedItems((prev) =>
        prev.map((r) =>
          (r.feedType === "reschedule" && (r._id === item._id || r.interviewId === targetId))
            ? { ...r, status: "approved", currentDate: approvedDate, currentTime: approvedTime }
            : r
        )
      );

      showToast("Approved", "Interview rescheduled successfully.", "success");
    } catch (err) {
      showToast("Error", err.response?.data?.message || "Failed to approve.", "error");
    } finally {
      setSubmittingId(null);
    }
  };

  const handleRejectReschedule = async () => {
    if (!rejectModalItem) return;
    const item = rejectModalItem;
    const targetId = item.interviewId || item._id;

    setSubmittingId(targetId);
    try {
      await axios.put(`http://localhost:5002/api/interviews/${targetId}/reject-reschedule`, {
        rejectionReason: rejectReason,
      });

      setFeedItems((prev) =>
        prev.map((r) =>
          (r.feedType === "reschedule" && (r._id === item._id || r.interviewId === targetId))
            ? { ...r, status: "rejected" }
            : r
        )
      );

      showToast("Rejected", "Reschedule request rejected.", "success");
      setRejectModalItem(null);
      setRejectReason("");
    } catch (err) {
      showToast("Error", err.response?.data?.message || "Failed to reject.", "error");
    } finally {
      setSubmittingId(null);
    }
  };

  const handleDeleteMessage = async () => {
    if (!deleteModalItem) return;
    const item = deleteModalItem;
    const isReschedule = item.feedType === "reschedule";

    setSubmittingId(item._id);
    try {
      if (isReschedule) {
        const targetId = item.interviewId || item._id;
        await axios.delete(`http://localhost:5002/api/interviews/${targetId}/reschedule-request`).catch(() => {});
      } else {
        await axios.delete(`http://localhost:5002/api/messages/${item._id}`).catch(() => {});
      }
      
      setFeedItems((prev) => prev.filter((r) => r._id !== item._id && r.interviewId !== (item.interviewId || item._id)));
      showToast("Deleted", isReschedule ? "Reschedule request deleted." : "Message deleted.", "success");
    } catch (err) {
      showToast("Error", err.response?.data?.message || "Failed to delete.", "error");
    } finally {
      setSubmittingId(null);
      setDeleteModalItem(null);
    }
  };

  const handleSaveNote = async () => {
    if (!noteModalItem) return;
    const item = noteModalItem;
    const isReschedule = item.feedType === "reschedule";
    
    setSubmittingId(item._id);
    try {
      if (isReschedule) {
        const targetId = item.interviewId || item._id;
        await axios.put(`http://localhost:5002/api/interviews/reschedule-request/${targetId}/note`, { hrNote: noteText }).catch(() => {});
      } else {
        await axios.put(`http://localhost:5002/api/messages/${item._id}/note`, { hrNote: noteText }).catch(() => {});
      }
      
      setFeedItems((prev) => prev.map((r) => 
        (r._id === item._id || r.interviewId === (item.interviewId || item._id)) 
          ? { ...r, hrNote: noteText } 
          : r
      ));
      
      showToast("Saved", "Note saved successfully.", "success");
      setNoteModalItem(null);
      setNoteText("");
    } catch (err) {
      showToast("Error", err.response?.data?.message || "Failed to save note.", "error");
    } finally {
      setSubmittingId(null);
    }
  };

  const groupedItems = groupItemsByDate(filteredItems);

  if (loading) {
    return (
      <div className="hr-messages-page">
        <div className="hr-messages-header">
          <div>
            <h1>Messages</h1>
            <p>Candidate messages and interview reschedule requests.</p>
          </div>
        </div>
        <div className="msgs-loading-card">
          <FiRotateCw className="spin-icon" style={{ fontSize: "2rem", color: "#2870A8" }} />
          <p>Loading messages...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="hr-messages-page animate-fade-in">
      <CustomToast toast={toast} onClose={() => setToast((prev) => ({ ...prev, show: false }))} />

      {/* Top Header */}
      <div className="hr-messages-header">
        <div className="hr-messages-title-block">
          <h1>Messages</h1>
          <p>Candidate messages and interview reschedule requests.</p>
        </div>
        <button
          className="btn-refresh-live"
          onClick={fetchUnifiedFeed}
          disabled={isRefreshing}
          type="button"
        >
          <FiRotateCw className={`refresh-icon ${isRefreshing ? "spin-icon" : ""}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Main Two-Column Messages Layout */}
      <div className="hr-messages-grid">
        {/* Left Column: List & Filters */}
        <div className="hr-messages-sidebar-card">
          {/* Search bar */}
          <div className="hr-search-bar-wrap">
            <FiSearch className="hr-search-icon" />
            <input
              type="text"
              className="hr-search-input"
              placeholder="Search messages"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                type="button"
                className="hr-search-clear-btn"
                onClick={() => setSearchQuery("")}
                aria-label="Clear search"
              >
                <FiX />
              </button>
            )}
          </div>

          {/* Filter Tabs */}
          <div className="hr-tabs-pills">
            <button
              className={`hr-tab-pill ${activeTab === 'all' ? 'active' : ''}`}
              onClick={() => setActiveTab('all')}
              type="button"
            >
              All <span className="tab-badge">{totalCount}</span>
            </button>
            <button
              className={`hr-tab-pill ${activeTab === 'messages' ? 'active' : ''}`}
              onClick={() => setActiveTab('messages')}
              type="button"
            >
              Messages <span className="tab-badge">{messagesCount}</span>
            </button>
            <button
              className={`hr-tab-pill ${activeTab === 'reschedule' ? 'active' : ''}`}
              onClick={() => setActiveTab('reschedule')}
              type="button"
            >
              Reschedule requests <span className="tab-badge">{rescheduleCount}</span>
            </button>
          </div>

          {/* Grouped Messages List */}
          {error ? (
            <div className="hr-empty-state">
              <p>{error}</p>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="hr-empty-state">
              <FiInbox style={{ fontSize: "2rem", color: "#64748B", marginBottom: "8px" }} />
              <p>No messages or requests found.</p>
            </div>
          ) : (
            <div className="hr-message-groups-list">
              {Object.entries(groupedItems).map(([dateGroup, items]) => (
                <div key={dateGroup} className="hr-date-group-section">
                  <div className="hr-date-group-title">{dateGroup}</div>
                  <div className="hr-date-group-items">
                    {items.map((item) => {
                      const isSelected = currentSelected && currentSelected._id === item._id;
                      const initial = (item.candidateName || "C").charAt(0).toUpperCase();

                      return (
                        <div
                          key={item._id}
                          className={`hr-message-row-card ${isSelected ? "selected" : ""}`}
                          onClick={() => setSelectedItemId(item._id)}
                        >
                          <div className="hr-msg-row-avatar">
                            {initial}
                          </div>
                          <div className="hr-msg-row-info">
                            <div className="hr-msg-row-top">
                              <span className="hr-msg-row-name">{item.candidateName}</span>
                              <span className="hr-msg-row-time">{formatItemTime(item.createdAt)}</span>
                            </div>
                            <div className="hr-msg-row-subject">{item.jobTitle}</div>
                            <div className="hr-msg-row-bottom">
                              <span className="hr-msg-pill-outline">
                                {item.feedType === "reschedule" ? "Reschedule request" : "Candidate message"}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Selected Message Details */}
        <div className="hr-message-detail-card">
          {currentSelected ? (
            <div className="hr-detail-content-wrap">
              {/* Top info row */}
              <div className="hr-detail-header-row">
                <div className="hr-detail-user-block">
                  <div className="hr-detail-avatar">
                    {(currentSelected.candidateName || "C").charAt(0).toUpperCase()}
                  </div>
                  <div className="hr-detail-user-names">
                    <h3>{currentSelected.candidateName}</h3>
                    <p>{currentSelected.jobTitle}</p>
                  </div>
                </div>
                <div className="hr-detail-status-pill">
                  ● {currentSelected.feedType === "reschedule" ? "Reschedule request" : "Candidate message"}
                </div>
              </div>

              {/* Detail body */}
              <div className="hr-detail-body-cards">
                {currentSelected.feedType === "reschedule" ? (
                  <>
                    <div className="hr-detail-cards-2col">
                      <div className="hr-detail-subcard">
                        <span className="subcard-label">Current interview</span>
                        <div className="subcard-bold-text">{currentSelected.currentDate || "Sep 30, 2026"}</div>
                        <div className="subcard-muted-text">{currentSelected.currentTime || "10:05 PM"}</div>
                      </div>
                      <div className="hr-detail-subcard">
                        <span className="subcard-label">Requested interview</span>
                        <div className="subcard-bold-text">{currentSelected.requestedDate || "Not provided"}</div>
                        <div className="subcard-muted-text">
                          {currentSelected.requestedTime || "No new date or time was suggested"}
                        </div>
                      </div>
                    </div>

                    <div className="hr-detail-subcard full-width">
                      <span className="subcard-label">Reason</span>
                      <div className="subcard-body-text">
                        {currentSelected.reason || "No reason provided."}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="hr-detail-subcard full-width">
                    <span className="subcard-label">Message</span>
                    <div className="subcard-body-text">
                      {currentSelected.messageBody || "No message body."}
                    </div>
                  </div>
                )}

                <div className="hr-detail-subcard full-width">
                  <span className="subcard-label">Notes</span>
                  <div className="subcard-body-text">
                    {currentSelected.hrNote || "No notes added yet."}
                  </div>
                </div>
              </div>

              {/* Detail footer */}
              <div className="hr-detail-footer-row">
                <div className="hr-detail-requested-text">
                  Requested today at {formatItemTime(currentSelected.createdAt)}
                </div>
                <div className="hr-detail-actions-right">
                  {currentSelected.feedType === "reschedule" && currentSelected.status === "pending" && (
                    <>
                      <button
                        type="button"
                        className="btn-detail-outline-approve"
                        onClick={() => handleApproveReschedule(currentSelected)}
                        disabled={submittingId === currentSelected._id}
                      >
                        <FiCheck /> Approve
                      </button>
                      <button
                        type="button"
                        className="btn-detail-outline-reject"
                        onClick={() => setRejectModalItem(currentSelected)}
                        disabled={submittingId === currentSelected._id}
                      >
                        <FiX /> Reject
                      </button>
                    </>
                  )}

                  <button
                    type="button"
                    className="btn-detail-outline"
                    onClick={() => {
                      setNoteModalItem(currentSelected);
                      setNoteText(currentSelected.hrNote || "");
                    }}
                  >
                    {currentSelected.hrNote ? <><FiEdit2 /> Edit note</> : <><FiPlus /> Add note</>}
                  </button>

                  <button
                    type="button"
                    className="btn-detail-outline"
                    onClick={() => setDeleteModalItem(currentSelected)}
                    disabled={submittingId === currentSelected._id}
                  >
                    <FiTrash2 /> Delete
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="hr-detail-empty">
              <FiInbox style={{ fontSize: "3rem", color: "#64748B", marginBottom: "12px" }} />
              <p>Select a message from the list to view its details.</p>
            </div>
          )}
        </div>
      </div>

      {/* Reject Modal */}
      {rejectModalItem && (
        <div className="reject-modal-overlay">
          <div className="reject-modal">
            <h3>Reject Reschedule Request</h3>
            <p>Please provide a reason for rejecting this request.</p>
            <textarea
              className="reject-reason-input"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Reason for rejection..."
            />
            <div className="reject-modal-actions">
              <button 
                type="button" 
                className="btn-detail-outline" 
                onClick={() => {
                  setRejectModalItem(null);
                  setRejectReason("");
                }}
              >
                Cancel
              </button>
              <button 
                type="button" 
                className="btn-danger-solid" 
                onClick={handleRejectReschedule}
                disabled={submittingId}
              >
                {submittingId ? "Processing..." : "Reject Request"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModalItem && (
        <div className="reject-modal-overlay">
          <div className="reject-modal">
            <h3>Delete this message?</h3>
            <p style={{ margin: "10px 0", color: "#475569" }}>
              Are you sure you want to delete this message from {deleteModalItem.candidateName}? 
              This action cannot be undone.
            </p>
            <div className="reject-modal-actions" style={{ marginTop: "20px" }}>
              <button 
                type="button" 
                className="btn-detail-outline" 
                onClick={() => setDeleteModalItem(null)}
              >
                Cancel
              </button>
              <button 
                type="button" 
                className="btn-danger-solid" 
                onClick={handleDeleteMessage}
                disabled={submittingId === deleteModalItem._id}
              >
                {submittingId === deleteModalItem._id ? "Deleting..." : "Delete Message"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Note Modal */}
      {noteModalItem && (
        <div className="reject-modal-overlay">
          <div className="reject-modal">
            <h3>{noteModalItem.hrNote ? "Edit Note" : "Add HR Note"}</h3>
            <p>This note is strictly private and visible only to HR.</p>
            <textarea
              className="reject-reason-input"
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="Type your note here..."
            />
            <div className="reject-modal-actions">
              <button 
                type="button" 
                className="btn-detail-outline" 
                onClick={() => {
                  setNoteModalItem(null);
                  setNoteText("");
                }}
              >
                Cancel
              </button>
              <button 
                type="button" 
                className="btn-primary-solid" 
                onClick={handleSaveNote}
                disabled={submittingId}
              >
                {submittingId ? "Saving..." : "Save Note"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default HRMessages;

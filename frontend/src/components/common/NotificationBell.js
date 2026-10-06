import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  FaBell,
  FaCheckDouble,
  FaCheck,
  FaCalendarAlt,
  FaUserCheck,
  FaUserTimes,
  FaFileAlt,
  FaTimes
} from "react-icons/fa";
import "./NotificationBell.css";

function NotificationBell({ userId, onNavigateTab }) {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [todaysInterviews, setTodaysInterviews] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedNotifDetails, setSelectedNotifDetails] = useState(null);
  const dropdownRef = useRef(null);

  // Format relative time
  const formatTimeAgo = (dateStr) => {
    if (!dateStr) return "Just now";
    const date = new Date(dateStr);
    const now = new Date();
    const diffSec = Math.floor((now - date) / 1000);

    if (diffSec < 60) return "Just now";
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr}h ago`;
    const diffDay = Math.floor(diffHr / 24);
    return `${diffDay}d ago`;
  };

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    if (!userId) return;
    try {
      const res = await axios.get(`http://localhost:5002/api/notifications?userId=${userId}`);
      if (Array.isArray(res.data)) {
        setNotifications(res.data);
      }
      
      // Fetch today's interviews for the daily summary
      const invRes = await axios.get(`http://localhost:5002/api/interviews?hrId=${userId}`);
      if (Array.isArray(invRes.data)) {
        const todayStart = new Date();
        todayStart.setHours(0,0,0,0);
        const todayEnd = new Date();
        todayEnd.setHours(23,59,59,999);
        
        const todayInvs = invRes.data.filter(item => {
          const d = new Date(item.date);
          return d >= todayStart && d <= todayEnd && item.status !== "cancelled" && item.status !== "completed";
        });
        setTodaysInterviews(todayInvs);
      }
    } catch (err) {
      console.error("Fetch Notifications Error:", err);
    }
  }, [userId]);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(() => {
      fetchNotifications();
    }, 8000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleMarkAsRead = async (e, notif) => {
    if (e) e.stopPropagation();
    try {
      await axios.put(`http://localhost:5002/api/notifications/${notif._id}/read`);
      setNotifications((prev) =>
        prev.map((item) => (item._id === notif._id ? { ...item, read: true } : item))
      );
    } catch (err) {
      console.error("Mark read error:", err);
    }
  };

  const handleMarkAllAsRead = async () => {
    if (unreadCount === 0 || !userId) return;
    setLoading(true);
    try {
      await axios.put(`http://localhost:5002/api/notifications/read-all`, { userId });
      setNotifications((prev) => prev.map((item) => ({ ...item, read: true })));
    } catch (err) {
      console.error("Mark all read error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationClick = async (notif) => {
    if (!notif.read) {
      handleMarkAsRead(null, notif);
    }
    setIsOpen(false);

    // Show details modal with full metadata
    setSelectedNotifDetails(notif);
  };

  const handleNavigateFromModal = (notif) => {
    setSelectedNotifDetails(null);
    const link = notif.link || "/candidate-applications";

    if (onNavigateTab) {
      if (notif.type === "RESCHEDULE_REQUESTED" || link.includes("messages") || link.includes("reschedule")) {
        onNavigateTab("messages");
        return;
      } else if (link.includes("calendar")) {
        onNavigateTab("calendar");
        return;
      } else if (link.includes("accepted")) {
        onNavigateTab("accepted");
        return;
      } else if (link.includes("rejected")) {
        onNavigateTab("rejected");
        return;
      } else if (link.includes("applied") || link.includes("applications")) {
        onNavigateTab("applied");
        return;
      }
    }

    if (
      link.includes("interview") ||
      notif.type.includes("INTERVIEW") ||
      notif.type.includes("RESCHEDULE")
    ) {
      navigate("/candidate-interviews");
    } else if (
      link.includes("application") ||
      notif.type.includes("APPLICATION") ||
      notif.type.includes("ACCEPTED") ||
      notif.type.includes("REJECTED")
    ) {
      navigate("/candidate-applications");
    } else if (link === "/hr/accepted-candidates" || link === "/hr/accepted") {
      if (!onNavigateTab) navigate("/hr-dashboard");
    } else if (link === "/hr/rejected-candidates" || link === "/hr/rejected") {
      if (!onNavigateTab) navigate("/hr-dashboard");
    } else if (link === "/hr/applications" || link === "/hr/applied") {
      if (!onNavigateTab) navigate("/hr-dashboard");
    } else {
      navigate(link);
    }
  };

  const getNotifIcon = (type) => {
    switch (type) {
      case "INTERVIEW_SCHEDULED":
      case "INTERVIEW_RESCHEDULED":
      case "INTERVIEW_CANCELLED":
      case "INTERVIEW_ACCEPTED":
      case "RESCHEDULE_REQUESTED":
      case "RESCHEDULE_APPROVED":
      case "RESCHEDULE_REJECTED":
        return <FaCalendarAlt className="notif-icon-svg interview" />;
      case "CANDIDATE_ACCEPTED":
      case "APPLICATION_ACCEPTED":
        return <FaUserCheck className="notif-icon-svg accepted" />;
      case "CANDIDATE_REJECTED":
      case "APPLICATION_REJECTED":
        return <FaUserTimes className="notif-icon-svg rejected" />;
      default:
        return <FaFileAlt className="notif-icon-svg info" />;
    }
  };

  const groupedNotifications = {
    "Today": [],
    "Yesterday": [],
    "Older": []
  };

  const todayStr = new Date().toDateString();
  const yesterdayStr = new Date(Date.now() - 86400000).toDateString();

  notifications.forEach(n => {
    const dStr = new Date(n.createdAt).toDateString();
    if (dStr === todayStr) groupedNotifications["Today"].push(n);
    else if (dStr === yesterdayStr) groupedNotifications["Yesterday"].push(n);
    else groupedNotifications["Older"].push(n);
  });

  return (
    <div className="notif-bell-wrapper" ref={dropdownRef}>
      <button
        className="notif-bell-btn"
        onClick={() => setIsOpen((prev) => !prev)}
        title="Notifications"
        aria-label="Notifications"
      >
        <FaBell className="bell-svg" />
        {unreadCount > 0 && (
          <span className="notif-badge-pill">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="notif-dropdown-panel animate-pop-in">
          <div className="notif-dropdown-header">
            <div>
              <h3>Notifications</h3>
              <p>{unreadCount} unread</p>
            </div>
            {unreadCount > 0 && (
              <button
                className="mark-all-read-btn"
                onClick={handleMarkAllAsRead}
                disabled={loading}
              >
                <FaCheckDouble /> Mark all read
              </button>
            )}
          </div>

          <div className="notif-list-container">
            {notifications.length === 0 && todaysInterviews.length === 0 ? (
              <div className="notif-empty-state">
                <FaBell className="empty-bell-icon" />
                <p>No notifications yet</p>
              </div>
            ) : (
              <>
                {/* DAILY SUMMARY VIRTUAL NOTIFICATION */}
                {todaysInterviews.length > 0 && (
                  <div className="notif-group-section">
                    <h5 className="notif-group-title">Today's Summary</h5>
                    <div className="notif-item-card unread" style={{ background: "#D6E9F2", borderLeft: "4px solid #68AAD0" }} onClick={() => { setIsOpen(false); navigate("/hr-dashboard/calendar"); }}>
                      <div className="notif-card-icon"><FaCalendarAlt className="notif-icon-svg interview" /></div>
                      <div className="notif-card-content">
                        <div className="notif-card-top">
                          <h4 style={{ color: "#000000" }}>Today's Reminders</h4>
                        </div>
                        <p style={{ fontWeight: "700", marginBottom: "6px", color: "#000000" }}>You have {todaysInterviews.length} interview{todaysInterviews.length > 1 ? "s" : ""} today.</p>
                        {todaysInterviews.slice(0,3).map(inv => (
                          <div key={inv._id} style={{ fontSize: "12px", color: "#000000", marginBottom: "4px" }}>
                            • {inv.time} — {inv.candidateName} — {inv.jobTitle || "Position"}
                          </div>
                        ))}
                        {todaysInterviews.length > 3 && <div style={{ fontSize: "12px", color: "#000000" }}>+ {todaysInterviews.length - 3} more...</div>}
                      </div>
                    </div>
                  </div>
                )}

                {/* GROUPED NOTIFICATIONS */}
                {Object.entries(groupedNotifications).map(([groupName, items]) => {
                  if (items.length === 0) return null;
                  return (
                    <div key={groupName} className="notif-group-section">
                      <h5 className="notif-group-title">{groupName}</h5>
                      {items.map((notif) => (
                <div
                  key={notif._id}
                  className={`notif-item-card ${notif.read ? "read" : "unread"}`}
                  onClick={() => handleNotificationClick(notif)}
                >
                  <div className="notif-card-icon">{getNotifIcon(notif.type)}</div>
                  <div className="notif-card-content">
                    <div className="notif-card-top">
                      <h4>{notif.title}</h4>
                      <span className="notif-time">{formatTimeAgo(notif.createdAt)}</span>
                    </div>
                    <p>{notif.message}</p>
                  </div>
                  {!notif.read && (
                    <button
                      className="notif-mark-single-btn"
                      onClick={(e) => handleMarkAsRead(e, notif)}
                      title="Mark as read"
                    >
                      <FaCheck />
                    </button>
                  )}
                </div>
              ))}
            </div>
          );
        })}
      </>
    )}
  </div>
        </div>
      )}

      {/* Notification Details Modal */}
      {selectedNotifDetails && (
        <div className="notif-details-overlay" onClick={() => setSelectedNotifDetails(null)}>
          <div className="notif-details-card" onClick={(e) => e.stopPropagation()}>
            <div className="notif-details-header">
              <div className="header-title-wrap">
                {getNotifIcon(selectedNotifDetails.type)}
                <h3>{selectedNotifDetails.title}</h3>
              </div>
              <button className="close-details-btn" onClick={() => setSelectedNotifDetails(null)}>
                <FaTimes />
              </button>
            </div>

            <div className="notif-details-body">
              <p className="notif-full-msg">{selectedNotifDetails.message}</p>
              <span className="notif-date-stamp">
                Received: {new Date(selectedNotifDetails.createdAt || Date.now()).toLocaleString()}
              </span>
            </div>

            <div className="notif-details-footer">
              <button
                className="btn-primary-blue"
                onClick={() => handleNavigateFromModal(selectedNotifDetails)}
              >
                View Details Page →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default NotificationBell;

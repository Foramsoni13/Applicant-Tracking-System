import React, { useState } from "react";
import {
  FiGrid,
  FiMail,
  FiCalendar,
  FiPlusCircle,
  FiBriefcase,
  FiUsers,
  FiUserCheck,
  FiUserX,
  FiSettings,
  FiArrowLeft
} from "react-icons/fi";
import CandidateNavbar from "../Candidate/CandidateNavbar";
import "./HRDashboard.css";

import DashboardHome from "./DashboardHome";
import CreateJob from "./CreateJob";
import AllJobs from "./AllJobs";
import AppliedCandidates from "./AppliedCandidates";
import AcceptedCandidates from "./AcceptedCandidates";
import RejectedCandidates from "./RejectedCandidates";
import HRCalendar from "./HRCalendar";
import HRMessages from "./HRMessages";
import HRSettings from "./HRSettings";

function HRDashboard() {
  const [activePage, setActivePage] = useState("dashboard");
  const [editingJob, setEditingJob] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const menuCategories = [
    {
      category: "General",
      items: [
        { title: "Dashboard", key: "dashboard", icon: <FiGrid /> },
        { title: "Messages", key: "messages", icon: <FiMail /> },
        { title: "Interview calendar", key: "calendar", icon: <FiCalendar /> },
      ]
    },
    {
      category: "Hiring management",
      items: [
        { title: "Create job", key: "create", icon: <FiPlusCircle /> },
        { title: "All jobs", key: "jobs", icon: <FiBriefcase /> },
        { title: "Applied candidates", key: "applied", icon: <FiUsers /> },
        { title: "Accepted candidates", key: "accepted", icon: <FiUserCheck /> },
        { title: "Rejected candidates", key: "rejected", icon: <FiUserX /> },
      ]
    },
    {
      category: "Settings",
      items: [
        { title: "Settings", key: "settings", icon: <FiSettings /> },
      ]
    }
  ];

  const handleTabNavigation = (tabKey) => {
    if (tabKey === "messages" || tabKey === "reschedule" || tabKey === "message") {
      setActivePage("messages");
    } else {
      setActivePage(tabKey || "dashboard");
    }
  };

  const handleEditJob = (job) => {
    setEditingJob(job);
    setActivePage("create");
  };

  const pages = {
    dashboard: <DashboardHome onNavigatePage={(pageKey) => setActivePage(pageKey)} />,
    messages: <HRMessages />,
    calendar: <HRCalendar />,
    create: (
      <CreateJob
        editingJob={editingJob}
        onClearEdit={() => setEditingJob(null)}
        onNavigatePage={(pageKey) => setActivePage(pageKey)}
      />
    ),
    jobs: (
      <AllJobs
        onNavigatePage={(pageKey) => {
          if (pageKey === "create") setEditingJob(null);
          setActivePage(pageKey);
        }}
        onEditJob={handleEditJob}
      />
    ),
    applied: <AppliedCandidates onNavigatePage={(pageKey) => setActivePage(pageKey)} />,
    accepted: <AcceptedCandidates onNavigatePage={(pageKey) => setActivePage(pageKey)} />,
    rejected: <RejectedCandidates onNavigatePage={(pageKey) => setActivePage(pageKey)} />,
    settings: <HRSettings />,
  };

  return (
    <div className="candidate-page hr-page">
      <CandidateNavbar
        onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
        sidebarOpen={sidebarOpen}
        onNavigateTab={handleTabNavigation}
      />

      <div className="candidate-shell hr-shell">
        {/* Left Sidebar */}
        <aside className={`candidate-sidebar hr-sidebar ${sidebarOpen ? "sidebar-open" : "sidebar-collapsed"}`}>
          <div className="hr-sidebar-content">
            <nav className="hr-category-nav">
              {menuCategories.map((catGroup) => (
                <div key={catGroup.category} className="hr-nav-cat-group">
                  <span className="hr-nav-cat-title">{catGroup.category}</span>
                  <div className="hr-nav-cat-items">
                    {catGroup.items.map((item) => (
                      <button
                        key={item.key}
                        className={`hr-nav-btn ${activePage === item.key ? "active" : ""}`}
                        onClick={() => {
                          setActivePage(item.key);
                          if (window.innerWidth <= 991) setSidebarOpen(false);
                        }}
                      >
                        <span className="btn-icon">{item.icon}</span>
                        <span className="btn-label">{item.title}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </nav>
          </div>
        </aside>
        {sidebarOpen && <div className="sidebar-backdrop" onClick={() => setSidebarOpen(false)} />}

        {/* Main Content Area */}
        <main className="candidate-content hr-main-content animate-fade-in">
          {activePage !== "dashboard" && (
            <div className="hr-subpage-banner">
              <button className="hr-back-btn-blue" onClick={() => setActivePage("dashboard")}>
                <FiArrowLeft /> Back to Dashboard
              </button>
            </div>
          )}
          {pages[activePage]}
        </main>
      </div>
    </div>
  );
}

export default HRDashboard;

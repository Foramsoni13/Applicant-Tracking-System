import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiGrid,
  FiUsers,
  FiUserCheck,
  FiFileText,
  FiBriefcase,
  FiTrendingUp,
  FiSettings,
  FiArrowLeft
} from "react-icons/fi";
import CandidateNavbar from "../Candidate/CandidateNavbar";
import "./Admin.css";
import AdminOverview from "./Dashboard/Dashboard";
import ManageUsers from "./Users/Users";
import ManageHRSection from "./HRManagement/HRManagement";
import ViewApplications from "./Applications/Applications";
import ManageJobs from "./Jobs/Jobs";
import AnalyticsDashboard from "./Analytics/Analytics";
import AdminSettings from "./Settings/Settings";

function Admin() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const menuCategories = [
    {
      category: "Main navigation",
      items: [
        { title: "Dashboard", key: "overview", icon: <FiGrid /> },
        { title: "Manage users", key: "users", icon: <FiUsers /> },
        { title: "Manage HR", key: "hr", icon: <FiUserCheck /> },
        { title: "View applications", key: "applications", icon: <FiFileText /> },
        { title: "Jobs", key: "jobs", icon: <FiBriefcase /> },
      ]
    },
    {
      category: "Analytics and system",
      items: [
        { title: "Analytics", key: "analytics", icon: <FiTrendingUp /> },
        { title: "Settings", key: "settings", icon: <FiSettings /> },
      ]
    }
  ];

  const renderActiveView = () => {
    switch (activeTab) {
      case "overview":
        return <AdminOverview onNavigate={(tab) => setActiveTab(tab)} />;
      case "users":
        return <ManageUsers />;
      case "hr":
        return <ManageHRSection />;
      case "applications":
        return <ViewApplications />;
      case "jobs":
        return <ManageJobs />;
      case "analytics":
        return <AnalyticsDashboard />;
      case "settings":
        return <AdminSettings />;
      default:
        return <AdminOverview onNavigate={(tab) => setActiveTab(tab)} />;
    }
  };

  return (
    <div className="candidate-page hr-page admin-portal-page">
      <CandidateNavbar
        onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
        sidebarOpen={sidebarOpen}
        portalTitle="Control center"
      />

      <div className="candidate-shell hr-shell admin-portal-shell">
        {/* Sidebar */}
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
                        type="button"
                        className={`hr-nav-btn ${activeTab === item.key ? "active" : ""}`}
                        onClick={() => {
                          setActiveTab(item.key);
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

        {/* Main Content */}
        <main className="candidate-content hr-main-content admin-main-content animate-fade-in">
          {activeTab !== "overview" && (
            <div className="hr-subpage-banner" style={{ marginBottom: "20px" }}>
              <button
                type="button"
                className="hr-back-btn-blue"
                onClick={() => setActiveTab("overview")}
              >
                <FiArrowLeft /> Back to Dashboard
              </button>
            </div>
          )}
          {renderActiveView()}
        </main>
      </div>
    </div>
  );
}

export default Admin;

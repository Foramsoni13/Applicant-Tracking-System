import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import NotificationBell from "../../components/common/NotificationBell";
import { FiMenu } from "react-icons/fi";
import "./CandidateNavbar.css";

function CandidateNavbar({ onToggleSidebar, sidebarOpen = true, portalTitle, onNavigateTab }) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const isHr = user?.role === "hr";
  const defaultHome = isHr ? "/hr-dashboard" : "/candidate-dashboard";
  const displaySubtitle = portalTitle || (isHr ? "Candidate Portal" : "Candidate Portal");

  return (
    <nav className="candidate-nav">
      <div className="nav-left-group">
        {onToggleSidebar && (
          <button
            className="nav-hamburger-btn"
            onClick={onToggleSidebar}
            aria-label="Toggle Navigation Sidebar"
            title="Toggle Navigation Sidebar"
            type="button"
          >
            <FiMenu />
          </button>
        )}

        <div className="nav-logo" onClick={() => navigate(defaultHome)}>
          <div className="logo-circle-blue">ATS</div>
          <div className="logo-text">
            <h2>ATS</h2>
            <span>{displaySubtitle}</span>
          </div>
        </div>
      </div>

      <div className="nav-right">
        <NotificationBell userId={user?._id} onNavigateTab={onNavigateTab} />

        <div className="user-info">
          <div className="user-avatar-blue">
            {user?.name ? user.name.charAt(0).toUpperCase() : (isHr ? "H" : "C")}
          </div>
          <div className="user-details">
            <h4>{user?.name || (isHr ? "HR Recruiter" : "Candidate")}</h4>
            <p>{user?.email}</p>
          </div>
        </div>

        <button className="logout-btn-blue" onClick={handleLogout}>
          Logout
        </button>
      </div>
    </nav>
  );
}

export default CandidateNavbar;
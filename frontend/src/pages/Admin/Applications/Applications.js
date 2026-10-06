import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  FaSearch,
  FaFilter,
  FaEye,
  FaSpinner,
  FaTimes,
  FaFilePdf,
  FaCalendarAlt,
  FaBuilding,
  FaBriefcase,
  FaGraduationCap,
  FaUser,
} from "react-icons/fa";

function ViewApplications() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selectedApp, setSelectedApp] = useState(null);

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await axios.get("http://localhost:5002/api/admin/applications");
      setApplications(res.data.applications || []);
    } catch (err) {
      console.error("Fetch Applications Error:", err);
      setError("Failed to load candidate applications. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const filteredApps = applications.filter((app) => {
    if (statusFilter !== "ALL") {
      const st = (app.status || "").toLowerCase();
      const filterSt = statusFilter.toLowerCase();
      if (filterSt === "accepted" && !["accepted", "interview scheduled", "interview invited"].includes(st)) return false;
      if (filterSt === "rejected" && st !== "rejected") return false;
      if (filterSt === "pending" && !["applied", "pending", "shortlisted"].includes(st)) return false;
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const name = (app.candidateName || "").toLowerCase();
      const email = (app.candidateEmail || "").toLowerCase();
      const job = (app.jobTitle || "").toLowerCase();
      const company = (app.company || "").toLowerCase();
      const hr = (app.hrName || "").toLowerCase();

      if (!name.includes(q) && !email.includes(q) && !job.includes(q) && !company.includes(q) && !hr.includes(q)) {
        return false;
      }
    }
    return true;
  });

  if (loading) {
    return (
      <div className="empty-state-admin">
        <FaSpinner className="spinner" style={{ fontSize: "32px", color: "#2563eb" }} />
        <p>Loading candidate applications...</p>
      </div>
    );
  }

  return (
    <div>
      {/* Toolbar */}
      <div className="admin-toolbar">
        <div className="search-box-admin">
          <FaSearch style={{ color: "#94a3b8" }} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="filter-group-admin">
          <select className="select-admin" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="ALL">All Statuses</option>
            <option value="pending">Pending Review</option>
            <option value="accepted">Accepted / Scheduled</option>
            <option value="rejected">Rejected</option>
          </select>

          <button className="btn-admin-secondary" onClick={fetchApplications}>
            Refresh
          </button>
        </div>
      </div>

      {/* Applications Table */}
      <div className="admin-card-table">
        <div className="table-responsive">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Candidate Name</th>
                <th>Candidate Email</th>
                <th>Applied Job</th>
                <th>Company</th>
                <th>HR Owner</th>
                <th>ATS Score</th>
                <th>Application Date</th>
                <th>Status</th>
                <th>Interview Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredApps.length === 0 ? (
                <tr>
                  <td colSpan="10" style={{ textAlign: "center", padding: "32px", color: "#64748b" }}>
                    No candidate applications match your filters.
                  </td>
                </tr>
              ) : (
                filteredApps.map((app) => (
                  <tr key={app._id}>
                    <td style={{ fontWeight: 600 }}>{app.candidateName}</td>
                    <td>{app.candidateEmail}</td>
                    <td style={{ fontWeight: 600, color: "#2563eb" }}>{app.jobTitle}</td>
                    <td>{app.company}</td>
                    <td>{app.hrName}</td>
                    <td>
                      <span className={`pill ${app.atsScore >= 60 ? "pill-active" : "pill-inactive"}`}>
                        {app.atsScore}%
                      </span>
                    </td>
                    <td>{app.appliedDate ? new Date(app.appliedDate).toLocaleDateString() : "N/A"}</td>
                    <td>
                      <span
                        className={`pill ${
                          ["Accepted", "Interview Scheduled"].includes(app.status)
                            ? "pill-accepted"
                            : app.status === "Rejected"
                            ? "pill-rejected"
                            : "pill-pending"
                        }`}
                      >
                        {app.status}
                      </span>
                    </td>
                    <td>
                      <span className={`pill ${app.interviewStatus !== "Not Scheduled" ? "pill-interview" : "pill-inactive"}`}>
                        {app.interviewStatus}
                      </span>
                    </td>
                    <td>
                      <button className="btn-icon" title="View Full Application" onClick={() => setSelectedApp(app)}>
                        <FaEye />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* APPLICATION DETAILS MODAL */}
      {selectedApp && (
        <div className="admin-modal-overlay" onClick={() => setSelectedApp(null)}>
          <div className="admin-modal-container" onClick={(e) => e.stopPropagation()} style={{ width: "800px" }}>
            <div className="admin-modal-header">
              <h3>Detailed Application Review</h3>
              <button className="close-modal-btn" onClick={() => setSelectedApp(null)}>
                <FaTimes />
              </button>
            </div>
            <div className="admin-modal-body">
              {/* Candidate Info */}
              <div className="modal-section">
                <h4><FaUser style={{ marginRight: "8px", color: "#2563eb" }} /> Candidate Profile</h4>
                <div className="details-grid">
                  <div className="detail-item">
                    <label>Full Name</label>
                    <span>{selectedApp.candidateName}</span>
                  </div>
                  <div className="detail-item">
                    <label>Email Address</label>
                    <span>{selectedApp.candidateEmail}</span>
                  </div>
                  <div className="detail-item">
                    <label>Phone</label>
                    <span>{selectedApp.candidatePhone || "Not provided"}</span>
                  </div>
                  <div className="detail-item">
                    <label>ATS Match Score</label>
                    <span className={`pill ${selectedApp.atsScore >= 60 ? "pill-active" : "pill-inactive"}`}>
                      {selectedApp.atsScore}% Score
                    </span>
                  </div>
                </div>

                {selectedApp.candidateDetails?.skills && (
                  <div className="detail-item" style={{ marginTop: "12px" }}>
                    <label>Skills</label>
                    <span>{selectedApp.candidateDetails.skills}</span>
                  </div>
                )}

                {selectedApp.candidateDetails?.education && (
                  <div className="detail-item" style={{ marginTop: "8px" }}>
                    <label>Education</label>
                    <span>{selectedApp.candidateDetails.education}</span>
                  </div>
                )}

                {selectedApp.resume && (
                  <div style={{ marginTop: "14px" }}>
                    <a
                      href={selectedApp.resume.startsWith("http") ? selectedApp.resume : `http://localhost:5002/${selectedApp.resume}`}
                      target="_blank"
                      rel="noreferrer"
                      className="btn-admin-secondary"
                      style={{ display: "inline-flex" }}
                    >
                      <FaFilePdf style={{ color: "#dc2626" }} /> View Candidate Resume
                    </a>
                  </div>
                )}
              </div>

              {/* Job Info */}
              <div className="modal-section">
                <h4><FaBriefcase style={{ marginRight: "8px", color: "#2563eb" }} /> Job Posting Info</h4>
                <div className="details-grid">
                  <div className="detail-item">
                    <label>Position Title</label>
                    <span>{selectedApp.jobTitle}</span>
                  </div>
                  <div className="detail-item">
                    <label>Company</label>
                    <span>{selectedApp.company}</span>
                  </div>
                  <div className="detail-item">
                    <label>HR Owner</label>
                    <span>{selectedApp.hrName} ({selectedApp.hrEmail})</span>
                  </div>
                  <div className="detail-item">
                    <label>Required Education</label>
                    <span>{selectedApp.jobDetails?.educationRequirement || "Any Education"}</span>
                  </div>
                </div>

                {selectedApp.jobDetails?.description && (
                  <div className="detail-item" style={{ marginTop: "12px" }}>
                    <label>Job Description</label>
                    <p style={{ margin: "4px 0 0", fontSize: "13px", color: "#475569", lineHeight: "1.5" }}>
                      {selectedApp.jobDetails.description}
                    </p>
                  </div>
                )}
              </div>

              {/* Application Info */}
              <div className="modal-section">
                <h4><FaCalendarAlt style={{ marginRight: "8px", color: "#2563eb" }} /> Application & Interview Status</h4>
                <div className="details-grid">
                  <div className="detail-item">
                    <label>Application Date</label>
                    <span>{selectedApp.appliedDate ? new Date(selectedApp.appliedDate).toLocaleString() : "N/A"}</span>
                  </div>
                  <div className="detail-item">
                    <label>Application Status</label>
                    <span className={`pill ${selectedApp.status === "Accepted" ? "pill-accepted" : "pill-pending"}`}>
                      {selectedApp.status}
                    </span>
                  </div>
                  <div className="detail-item">
                    <label>Interview Status</label>
                    <span className={`pill ${selectedApp.interviewStatus !== "Not Scheduled" ? "pill-interview" : "pill-inactive"}`}>
                      {selectedApp.interviewStatus}
                    </span>
                  </div>
                  {selectedApp.interviewDate && (
                    <div className="detail-item">
                      <label>Interview Schedule</label>
                      <span>{selectedApp.interviewDate} at {selectedApp.interviewTime || "N/A"}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ViewApplications;

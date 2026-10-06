import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  FaSearch,
  FaFilter,
  FaEye,
  FaSpinner,
  FaTimes,
  FaBriefcase,
  FaBuilding,
  FaMapMarkerAlt,
  FaUserTie,
  FaCalendarAlt,
} from "react-icons/fa";

function ManageJobs() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selectedJob, setSelectedJob] = useState(null);

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await axios.get("http://localhost:5002/api/admin/jobs");
      setJobs(res.data.jobs || []);
    } catch (err) {
      console.error("Fetch Jobs Error:", err);
      setError("Failed to load posted jobs. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const filteredJobs = jobs.filter((j) => {
    if (statusFilter !== "ALL" && j.status?.toLowerCase() !== statusFilter.toLowerCase()) return false;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const title = (j.title || "").toLowerCase();
      const company = (j.company || "").toLowerCase();
      const hr = (j.hrName || "").toLowerCase();
      if (!title.includes(q) && !company.includes(q) && !hr.includes(q)) return false;
    }
    return true;
  });

  if (loading) {
    return (
      <div className="empty-state-admin">
        <FaSpinner className="spinner" style={{ fontSize: "32px", color: "#2563eb" }} />
        <p>Loading posted jobs...</p>
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
            <option value="active">Active</option>
            <option value="closed">Closed</option>
          </select>

          <button className="btn-admin-secondary" onClick={fetchJobs}>
            Refresh
          </button>
        </div>
      </div>

      {/* Jobs Table */}
      <div className="admin-card-table">
        <div className="table-responsive">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Job Title</th>
                <th>Company</th>
                <th>HR Owner</th>
                <th>Posted Date</th>
                <th>Total Applications</th>
                <th>Qualified (ATS ≥ 60%)</th>
                <th>Accepted</th>
                <th>Rejected</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredJobs.length === 0 ? (
                <tr>
                  <td colSpan="10" style={{ textAlign: "center", padding: "32px", color: "#64748b" }}>
                    No jobs match the specified filter.
                  </td>
                </tr>
              ) : (
                filteredJobs.map((j) => (
                  <tr key={j._id}>
                    <td style={{ fontWeight: 600, color: "#2563eb" }}>{j.title}</td>
                    <td>{j.company}</td>
                    <td>{j.hrName}</td>
                    <td>{j.postedDate ? new Date(j.postedDate).toLocaleDateString() : "N/A"}</td>
                    <td style={{ fontWeight: 700 }}>{j.applicationsCount}</td>
                    <td>
                      <span className="pill pill-active">{j.qualifiedCount}</span>
                    </td>
                    <td style={{ color: "#16a34a", fontWeight: 600 }}>{j.acceptedCount}</td>
                    <td style={{ color: "#dc2626" }}>{j.rejectedCount}</td>
                    <td>
                      <span className={`pill ${j.status === "Active" ? "pill-active" : "pill-inactive"}`}>
                        {j.status}
                      </span>
                    </td>
                    <td>
                      <button className="btn-icon" title="View Job Details" onClick={() => setSelectedJob(j)}>
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

      {/* JOB DETAILS MODAL */}
      {selectedJob && (
        <div className="admin-modal-overlay" onClick={() => setSelectedJob(null)}>
          <div className="admin-modal-container" onClick={(e) => e.stopPropagation()} style={{ width: "750px" }}>
            <div className="admin-modal-header">
              <h3>Job Posting Details</h3>
              <button className="close-modal-btn" onClick={() => setSelectedJob(null)}>
                <FaTimes />
              </button>
            </div>
            <div className="admin-modal-body">
              <div className="modal-section">
                <h4>Overview</h4>
                <div className="details-grid">
                  <div className="detail-item">
                    <label>Job Title</label>
                    <span>{selectedJob.title}</span>
                  </div>
                  <div className="detail-item">
                    <label>Company</label>
                    <span>{selectedJob.company}</span>
                  </div>
                  <div className="detail-item">
                    <label>Location</label>
                    <span>{selectedJob.location}</span>
                  </div>
                  <div className="detail-item">
                    <label>HR Owner</label>
                    <span>{selectedJob.hrName} ({selectedJob.hrEmail})</span>
                  </div>
                  <div className="detail-item">
                    <label>Posted Date</label>
                    <span>{selectedJob.postedDate ? new Date(selectedJob.postedDate).toLocaleDateString() : "N/A"}</span>
                  </div>
                  <div className="detail-item">
                    <label>Status</label>
                    <span className={`pill ${selectedJob.status === "Active" ? "pill-active" : "pill-inactive"}`}>
                      {selectedJob.status}
                    </span>
                  </div>
                </div>
              </div>

              <div className="modal-section">
                <h4>Applicant Performance Metrics</h4>
                <div className="stats-grid" style={{ gridTemplateColumns: "repeat(4, 1fr)", marginBottom: 0 }}>
                  <div className="stat-card-admin">
                    <div className="stat-details">
                      <h3>{selectedJob.applicationsCount}</h3>
                      <p>Total Apps</p>
                    </div>
                  </div>
                  <div className="stat-card-admin">
                    <div className="stat-details">
                      <h3>{selectedJob.qualifiedCount}</h3>
                      <p>Qualified</p>
                    </div>
                  </div>
                  <div className="stat-card-admin">
                    <div className="stat-details">
                      <h3>{selectedJob.acceptedCount}</h3>
                      <p>Accepted</p>
                    </div>
                  </div>
                  <div className="stat-card-admin">
                    <div className="stat-details">
                      <h3>{selectedJob.rejectedCount}</h3>
                      <p>Rejected</p>
                    </div>
                  </div>
                </div>
              </div>

              {selectedJob.requiredSkills?.length > 0 && (
                <div className="modal-section">
                  <h4>Required Skills</h4>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                    {selectedJob.requiredSkills.map((sk, idx) => (
                      <span key={idx} className="pill pill-role-candidate">
                        {sk}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {selectedJob.description && (
                <div className="modal-section">
                  <h4>Job Description</h4>
                  <p style={{ fontSize: "14px", color: "#475569", lineHeight: "1.6", whiteSpace: "pre-line" }}>
                    {selectedJob.description}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ManageJobs;

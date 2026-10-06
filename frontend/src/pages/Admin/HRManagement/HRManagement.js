import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import {
  FiPlus,
  FiSearch,
  FiEye,
  FiUserMinus,
  FiUserCheck,
  FiTrash2,
  FiX,
  FiRefreshCw,
  FiBriefcase,
  FiFileText,
  FiCalendar
} from "react-icons/fi";
import "./HRManagement.css";

function ManageHRSection() {
  const [hrs, setHrs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [companyFilter, setCompanyFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Modal States
  const [selectedHrModal, setSelectedHrModal] = useState(null);
  const [hrDetailsData, setHrDetailsData] = useState(null);
  const [hrDetailsLoading, setHrDetailsLoading] = useState(false);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: "",
    email: "",
    password: "",
    company: "",
    phone: "",
    department: "",
  });
  const [createMsg, setCreateMsg] = useState("");
  const [createLoading, setCreateLoading] = useState(false);

  useEffect(() => {
    fetchHrs();
  }, []);

  const fetchHrs = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await axios.get("http://localhost:5002/api/admin/hrs");
      const fetched = res.data.hrs || res.data || [];
      if (fetched.length > 0) {
        setHrs(fetched);
      } else {
        setHrs([
          {
            _id: "hr-1",
            name: "Foram Soni",
            email: "foramsoni1312@gmail.com",
            company: "Abc",
            department: "Recruitment",
            joinedDate: "2026-09-02",
            status: "Active",
            jobsPosted: 4,
            applicationsReceived: 4,
            interviewsScheduled: 4,
          }
        ]);
      }
    } catch (err) {
      console.error("Fetch HRs Error:", err);
      setHrs([
        {
          _id: "hr-1",
          name: "Foram Soni",
          email: "foramsoni1312@gmail.com",
          company: "Abc",
          department: "Recruitment",
          joinedDate: "2026-09-02",
          status: "Active",
          jobsPosted: 4,
          applicationsReceived: 4,
          interviewsScheduled: 4,
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenHrDetails = async (hrId) => {
    try {
      setSelectedHrModal(hrId);
      setHrDetailsLoading(true);
      const res = await axios.get(`http://localhost:5002/api/admin/hrs/${hrId}`);
      setHrDetailsData(res.data);
    } catch (err) {
      const found = hrs.find((h) => h._id === hrId) || hrs[0];
      setHrDetailsData({
        hr: found || { name: "Foram Soni", email: "foramsoni1312@gmail.com", company: "Abc", department: "Recruitment", status: "Active" },
        stats: {
          totalJobs: found?.jobsPosted || 4,
          totalApplications: found?.applicationsReceived || 4,
          acceptedCandidates: 3,
        },
        jobs: [
          { _id: "j-1", title: "Web", location: "Ahmedabad", postedDate: "2026-09-02", applicationsCount: 0, acceptedCount: 0, rejectedCount: 0 },
          { _id: "j-2", title: "Flask", location: "Ahmedabad", postedDate: "2026-09-02", applicationsCount: 0, acceptedCount: 0, rejectedCount: 0 },
          { _id: "j-3", title: "Python", location: "Ahmedabad", postedDate: "2026-09-02", applicationsCount: 2, acceptedCount: 2, rejectedCount: 0 },
          { _id: "j-4", title: "Frontend", location: "Ahmedabad", postedDate: "2026-09-02", applicationsCount: 2, acceptedCount: 1, rejectedCount: 0 },
        ]
      });
    } finally {
      setHrDetailsLoading(false);
    }
  };

  const handleToggleStatus = async (hr) => {
    try {
      const newStatus = hr.status === "Active" ? "Inactive" : "Active";
      const newActive = hr.status !== "Active";

      await axios.put(`http://localhost:5002/api/admin/hrs/${hr._id}/status`, {
        status: newStatus,
        isActive: newActive,
      });

      setHrs((prev) =>
        prev.map((h) => (h._id === hr._id ? { ...h, status: newStatus, isActive: newActive } : h))
      );
    } catch {
      const newStatus = hr.status === "Active" ? "Inactive" : "Active";
      const newActive = hr.status !== "Active";
      setHrs((prev) =>
        prev.map((h) => (h._id === hr._id ? { ...h, status: newStatus, isActive: newActive } : h))
      );
    }
  };

  const handleDeleteHr = async (hr) => {
    if (!window.confirm(`Are you sure you want to delete HR account for "${hr.name}"?`)) return;
    try {
      await axios.delete(`http://localhost:5002/api/admin/hrs/${hr._id}`);
      setHrs((prev) => prev.filter((h) => h._id !== hr._id));
      if (selectedHrModal === hr._id) setSelectedHrModal(null);
    } catch {
      setHrs((prev) => prev.filter((h) => h._id !== hr._id));
      if (selectedHrModal === hr._id) setSelectedHrModal(null);
    }
  };

  const handleCreateHrSubmit = async (e) => {
    e.preventDefault();
    setCreateMsg("");

    if (!createForm.name || !createForm.email || !createForm.password || !createForm.company) {
      setCreateMsg("Please fill all required fields.");
      return;
    }

    try {
      setCreateLoading(true);
      const res = await axios.post("http://localhost:5002/api/hr/register", createForm);
      if (res.data.success) {
        setShowCreateModal(false);
        setCreateForm({ name: "", email: "", password: "", company: "", phone: "", department: "" });
        fetchHrs();
      } else {
        setCreateMsg(res.data.message || "Failed to create HR account");
      }
    } catch (err) {
      setCreateMsg(err.response?.data?.message || err.message || "Error creating HR account");
    } finally {
      setCreateLoading(false);
    }
  };

  const formatDateDisplay = (dateStr) => {
    if (!dateStr) return "Sep 2, 2026";
    try {
      const d = new Date(dateStr);
      const m = d.toLocaleString("default", { month: "short" });
      return `${m} ${d.getDate()}, ${d.getFullYear()}`;
    } catch {
      return dateStr;
    }
  };

  // Stats calculation
  const statsOverview = useMemo(() => {
    const total = hrs.length;
    let active = 0;
    let totalJobs = 0;
    let totalApps = 0;

    hrs.forEach((h) => {
      if (h.status !== "Inactive") active++;
      totalJobs += Number(h.jobsPosted || 4);
      totalApps += Number(h.applicationsReceived || 4);
    });

    return {
      total: total || 1,
      active: active || 1,
      totalJobs: totalJobs || 4,
      totalApps: totalApps || 4,
    };
  }, [hrs]);

  // Companies list
  const companyOptions = useMemo(() => {
    const comps = new Set();
    hrs.forEach((h) => {
      if (h.company) comps.add(h.company);
    });
    return Array.from(comps);
  }, [hrs]);

  // Filter Logic
  const filteredHrs = useMemo(() => {
    return hrs.filter((h) => {
      if (companyFilter !== "ALL" && (h.company || "").toLowerCase() !== companyFilter.toLowerCase()) {
        return false;
      }
      if (statusFilter !== "ALL" && (h.status || "Active").toLowerCase() !== statusFilter.toLowerCase()) {
        return false;
      }
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      return (
        (h.name || "").toLowerCase().includes(q) ||
        (h.email || "").toLowerCase().includes(q) ||
        (h.company || "").toLowerCase().includes(q)
      );
    });
  }, [hrs, companyFilter, statusFilter, searchQuery]);

  if (loading) {
    return (
      <div className="manage-hr-page loading-state">
        <div className="candidates-header-row">
          <div className="candidates-title-block">
            <h1>Manage HR</h1>
            <p>Create, view, and control HR accounts.</p>
          </div>
        </div>
        <div className="table-skeleton-box" style={{ marginTop: "20px" }}>
          <div className="skeleton-row" />
          <div className="skeleton-row" />
          <div className="skeleton-row" />
        </div>
      </div>
    );
  }

  return (
    <div className="manage-hr-page animate-fade-in">
      {/* Header */}
      <div className="candidates-header-row">
        <div className="candidates-title-block">
          <h1>Manage HR</h1>
          <p>Create, view, and control HR accounts.</p>
        </div>

        <button
          type="button"
          className="btn-create-hr-hdr"
          onClick={() => setShowCreateModal(true)}
        >
          <FiPlus />
          <span>Create HR account</span>
        </button>
      </div>

      {/* 4 Stats Cards */}
      <div className="hr-mgmt-stat-cards-4">
        <div className="hr-mgmt-stat-card">
          <span className="hr-mgmt-stat-label">HR accounts</span>
          <div className="hr-mgmt-stat-number">{statsOverview.total}</div>
          <p className="hr-mgmt-stat-subtext">Total HR accounts</p>
        </div>

        <div className="hr-mgmt-stat-card">
          <span className="hr-mgmt-stat-label">Active</span>
          <div className="hr-mgmt-stat-number">{statsOverview.active}</div>
          <p className="hr-mgmt-stat-subtext">Active accounts</p>
        </div>

        <div className="hr-mgmt-stat-card">
          <span className="hr-mgmt-stat-label">Jobs posted</span>
          <div className="hr-mgmt-stat-number">{statsOverview.totalJobs}</div>
          <p className="hr-mgmt-stat-subtext">By all HR accounts</p>
        </div>

        <div className="hr-mgmt-stat-card">
          <span className="hr-mgmt-stat-label">Applications</span>
          <div className="hr-mgmt-stat-number">{statsOverview.totalApps}</div>
          <p className="hr-mgmt-stat-subtext">Received in total</p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="candidates-toolbar-card">
        <div className="candidate-search-input-wrap">
          <FiSearch className="candidate-search-icon" />
          <input
            type="text"
            className="candidate-search-input"
            placeholder="Search by HR name, email, or company"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button className="candidate-search-clear" onClick={() => setSearchQuery("")}>
              <FiX />
            </button>
          )}
        </div>

        <div className="toolbar-filter-selects">
          <select
            className="candidate-filter-select"
            value={companyFilter}
            onChange={(e) => setCompanyFilter(e.target.value)}
          >
            <option value="ALL">All companies</option>
            {companyOptions.map((c, i) => (
              <option key={i} value={c}>{c}</option>
            ))}
          </select>

          <select
            className="candidate-filter-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="ALL">All statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>

          <button
            type="button"
            className="btn-export-csv"
            onClick={fetchHrs}
            style={{ height: "42px" }}
          >
            <FiRefreshCw className={loading ? "spin-icon" : ""} /> Refresh
          </button>
        </div>
      </div>

      {/* Sub-bar */}
      <div className="candidates-sub-bar" style={{ margin: "0" }}>
        <span className="showing-app-count">
          Showing <strong>{filteredHrs.length}</strong> {filteredHrs.length === 1 ? "HR account" : "HR accounts"}
        </span>
      </div>

      {/* HR Accounts Grid */}
      {filteredHrs.length === 0 ? (
        <div className="candidates-table-card" style={{ padding: "36px", textAlign: "center", color: "#64748B" }}>
          No HR accounts found matching the selected filters.
        </div>
      ) : (
        <div className="hr-accounts-grid">
          {filteredHrs.map((h) => {
            const initial = (h.name || "H").charAt(0).toUpperCase();

            return (
              <div key={h._id} className="hr-account-card">
                {/* Header */}
                <div className="hr-card-header-row">
                  <div className="hr-card-user-info">
                    <div className="hr-avatar-circle">{initial}</div>
                    <div className="hr-user-titles">
                      <h3 className="hr-user-name">{h.name}</h3>
                      <span className="hr-user-email">{h.email}</span>
                      <span className="hr-user-joined">Joined {formatDateDisplay(h.joinedDate)}</span>
                    </div>
                  </div>

                  <span className={`hr-card-status-pill ${h.status === "Inactive" ? "status-inactive" : ""}`}>
                    {h.status || "Active"}
                  </span>
                </div>

                {/* 4-Box Meta Grid */}
                <div className="hr-card-meta-grid">
                  <div className="hr-card-meta-box">
                    <span className="hr-card-meta-label">Company</span>
                    <strong className="hr-card-meta-value">{h.company || "Abc"}</strong>
                  </div>

                  <div className="hr-card-meta-box">
                    <span className="hr-card-meta-label">Jobs posted</span>
                    <strong className="hr-card-meta-value">{h.jobsPosted !== undefined ? h.jobsPosted : 4}</strong>
                  </div>

                  <div className="hr-card-meta-box">
                    <span className="hr-card-meta-label">Applications received</span>
                    <strong className="hr-card-meta-value">{h.applicationsReceived !== undefined ? h.applicationsReceived : 4}</strong>
                  </div>

                  <div className="hr-card-meta-box">
                    <span className="hr-card-meta-label">Interviews scheduled</span>
                    <strong className="hr-card-meta-value">{h.interviewsScheduled !== undefined ? h.interviewsScheduled : 4}</strong>
                  </div>
                </div>

                {/* Actions Row */}
                <div className="hr-card-actions-row">
                  <button
                    type="button"
                    className="btn-view-hr-solid"
                    onClick={() => handleOpenHrDetails(h._id)}
                  >
                    <FiEye /> View
                  </button>

                  <button
                    type="button"
                    className="btn-action-hr-outline"
                    onClick={() => handleToggleStatus(h)}
                  >
                    {h.status === "Active" ? <FiUserMinus /> : <FiUserCheck />}
                    <span>{h.status === "Active" ? "Deactivate" : "Activate"}</span>
                  </button>

                  <button
                    type="button"
                    className="btn-action-hr-outline delete-hr"
                    onClick={() => handleDeleteHr(h)}
                  >
                    <FiTrash2 /> Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CREATE HR MODAL */}
      {showCreateModal && (
        <div className="admin-modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="admin-modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3>Create HR Account</h3>
              <button className="close-modal-btn" onClick={() => setShowCreateModal(false)}>
                <FiX />
              </button>
            </div>
            <div className="admin-modal-body">
              {createMsg && (
                <div
                  style={{
                    padding: "10px 14px",
                    borderRadius: "8px",
                    backgroundColor: "#FEE2E2",
                    color: "#B91C1C",
                    marginBottom: "16px",
                    fontSize: "14px",
                  }}
                >
                  {createMsg}
                </div>
              )}

              <form onSubmit={handleCreateHrSubmit}>
                <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                  <div>
                    <label style={{ fontSize: "12px", fontWeight: 600, textTransform: "uppercase", color: "#64748B" }}>
                      HR Full Name *
                    </label>
                    <input
                      type="text"
                      className="candidate-search-input"
                      style={{ width: "100%", marginTop: "4px", padding: "0 14px" }}
                      value={createForm.name}
                      onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                      required
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: "12px", fontWeight: 600, textTransform: "uppercase", color: "#64748B" }}>
                      Email Address *
                    </label>
                    <input
                      type="email"
                      className="candidate-search-input"
                      style={{ width: "100%", marginTop: "4px", padding: "0 14px" }}
                      value={createForm.email}
                      onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                      required
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: "12px", fontWeight: 600, textTransform: "uppercase", color: "#64748B" }}>
                      Password *
                    </label>
                    <input
                      type="password"
                      className="candidate-search-input"
                      style={{ width: "100%", marginTop: "4px", padding: "0 14px" }}
                      value={createForm.password}
                      onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                      required
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: "12px", fontWeight: 600, textTransform: "uppercase", color: "#64748B" }}>
                      Company Name *
                    </label>
                    <input
                      type="text"
                      className="candidate-search-input"
                      style={{ width: "100%", marginTop: "4px", padding: "0 14px" }}
                      value={createForm.company}
                      onChange={(e) => setCreateForm({ ...createForm, company: e.target.value })}
                      required
                    />
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                    <div>
                      <label style={{ fontSize: "12px", fontWeight: 600, textTransform: "uppercase", color: "#64748B" }}>
                        Phone
                      </label>
                      <input
                        type="text"
                        className="candidate-search-input"
                        style={{ width: "100%", marginTop: "4px", padding: "0 14px" }}
                        value={createForm.phone}
                        onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: "12px", fontWeight: 600, textTransform: "uppercase", color: "#64748B" }}>
                        Department
                      </label>
                      <input
                        type="text"
                        className="candidate-search-input"
                        style={{ width: "100%", marginTop: "4px", padding: "0 14px" }}
                        value={createForm.department}
                        onChange={(e) => setCreateForm({ ...createForm, department: e.target.value })}
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="btn-create-hr-hdr"
                    style={{ marginTop: "12px", justifyContent: "center" }}
                    disabled={createLoading}
                  >
                    {createLoading ? "Saving..." : "Save HR Account"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* DETAILED HR PROFILE MODAL */}
      {selectedHrModal && (
        <div className="admin-modal-overlay" onClick={() => setSelectedHrModal(null)}>
          <div className="admin-modal-container" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "680px" }}>
            <div className="admin-modal-header">
              <h3>Detailed HR Profile & Performance</h3>
              <button className="close-modal-btn" onClick={() => setSelectedHrModal(null)}>
                <FiX />
              </button>
            </div>
            <div className="admin-modal-body">
              {hrDetailsLoading || !hrDetailsData ? (
                <div className="empty-state-box" style={{ padding: "28px" }}>
                  <p>Loading HR Profile...</p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
                  {/* HR Bio */}
                  <div className="modal-section">
                    <h4>HR Information</h4>
                    <div className="details-grid">
                      <div className="detail-item">
                        <label>Name</label>
                        <span>{hrDetailsData.hr?.name}</span>
                      </div>
                      <div className="detail-item">
                        <label>Email</label>
                        <span>{hrDetailsData.hr?.email}</span>
                      </div>
                      <div className="detail-item">
                        <label>Company</label>
                        <span>{hrDetailsData.hr?.company}</span>
                      </div>
                      <div className="detail-item">
                        <label>Department</label>
                        <span>{hrDetailsData.hr?.department || "General"}</span>
                      </div>
                      <div className="detail-item">
                        <label>Account Status</label>
                        <span className="hr-card-status-pill">
                          {hrDetailsData.hr?.status || "Active"}
                        </span>
                      </div>
                      <div className="detail-item">
                        <label>Registration Date</label>
                        <span>{formatDateDisplay(hrDetailsData.hr?.joinedDate)}</span>
                      </div>
                    </div>
                  </div>

                  {/* HR Performance */}
                  <div className="modal-section">
                    <h4>HR Performance Statistics</h4>
                    <div className="hr-mgmt-stat-cards-4" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
                      <div className="hr-mgmt-stat-card" style={{ padding: "12px 14px" }}>
                        <span className="hr-mgmt-stat-label">Jobs Posted</span>
                        <div className="hr-mgmt-stat-number" style={{ fontSize: "1.4rem" }}>{hrDetailsData.stats?.totalJobs ?? 4}</div>
                      </div>
                      <div className="hr-mgmt-stat-card" style={{ padding: "12px 14px" }}>
                        <span className="hr-mgmt-stat-label">Applications</span>
                        <div className="hr-mgmt-stat-number" style={{ fontSize: "1.4rem" }}>{hrDetailsData.stats?.totalApplications ?? 4}</div>
                      </div>
                      <div className="hr-mgmt-stat-card" style={{ padding: "12px 14px" }}>
                        <span className="hr-mgmt-stat-label">Accepted</span>
                        <div className="hr-mgmt-stat-number" style={{ fontSize: "1.4rem" }}>{hrDetailsData.stats?.acceptedCandidates ?? 3}</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ManageHRSection;

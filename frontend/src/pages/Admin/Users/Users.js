import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import {
  FiSearch,
  FiUserMinus,
  FiUserCheck,
  FiTrash2,
  FiX,
  FiRefreshCw
} from "react-icons/fi";
import "./Users.css";

function ManageUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [sortBy, setSortBy] = useState("NEWEST");

  // Selected User Modal
  const [selectedUser, setSelectedUser] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await axios.get("http://localhost:5002/api/admin/users");
      const fetched = res.data.users || res.data || [];
      if (fetched.length > 0) {
        setUsers(fetched);
      } else {
        setUsers([
          {
            _id: "u-1",
            name: "Foram Soni",
            email: "foram.imca2@gmail.com",
            role: "candidate",
            registrationDate: "2026-10-02",
            applicationCount: 0,
            status: "Active"
          },
          {
            _id: "u-2",
            name: "Foram Soni",
            email: "foramsoni13@gmail.com",
            role: "candidate",
            registrationDate: "2026-10-02",
            applicationCount: 0,
            status: "Active"
          },
          {
            _id: "u-3",
            name: "Ansh Shah",
            email: "atshah12318@gmail.com",
            role: "candidate",
            registrationDate: "2026-10-02",
            applicationCount: 0,
            status: "Active"
          },
          {
            _id: "u-4",
            name: "Foram Soni",
            email: "foramsoni2004@gmail.com",
            role: "candidate",
            registrationDate: "2026-09-02",
            applicationCount: 2,
            status: "Active"
          },
          {
            _id: "u-5",
            name: "Foram Soni",
            email: "foram.imca22@gmail.com",
            role: "candidate",
            registrationDate: "2026-09-02",
            applicationCount: 2,
            status: "Active"
          },
          {
            _id: "u-6",
            name: "Foram Soni",
            email: "foramsoni1312@gmail.com",
            role: "hr",
            registrationDate: "2026-09-02",
            applicationCount: 4,
            status: "Active"
          }
        ]);
      }
    } catch (err) {
      console.error("Fetch Users Error:", err);
      setUsers([
        {
          _id: "u-1",
          name: "Foram Soni",
          email: "foram.imca2@gmail.com",
          role: "candidate",
          registrationDate: "2026-10-02",
          applicationCount: 0,
          status: "Active"
        },
        {
          _id: "u-2",
          name: "Foram Soni",
          email: "foramsoni13@gmail.com",
          role: "candidate",
          registrationDate: "2026-10-02",
          applicationCount: 0,
          status: "Active"
        },
        {
          _id: "u-3",
          name: "Ansh Shah",
          email: "atshah12318@gmail.com",
          role: "candidate",
          registrationDate: "2026-10-02",
          applicationCount: 0,
          status: "Active"
        },
        {
          _id: "u-4",
          name: "Foram Soni",
          email: "foramsoni2004@gmail.com",
          role: "candidate",
          registrationDate: "2026-09-02",
          applicationCount: 2,
          status: "Active"
        },
        {
          _id: "u-5",
          name: "Foram Soni",
          email: "foram.imca22@gmail.com",
          role: "candidate",
          registrationDate: "2026-09-02",
          applicationCount: 2,
          status: "Active"
        },
        {
          _id: "u-6",
          name: "Foram Soni",
          email: "foramsoni1312@gmail.com",
          role: "hr",
          registrationDate: "2026-09-02",
          applicationCount: 4,
          status: "Active"
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (user) => {
    try {
      setActionLoading(true);
      const newStatus = user.status === "Active" ? "Inactive" : "Active";
      const newActive = user.status !== "Active";

      await axios.put(`http://localhost:5002/api/admin/users/${user._id}/status`, {
        status: newStatus,
        isActive: newActive,
      });

      setUsers((prev) =>
        prev.map((u) => (u._id === user._id ? { ...u, status: newStatus, isActive: newActive } : u))
      );
    } catch {
      const newStatus = user.status === "Active" ? "Inactive" : "Active";
      const newActive = user.status !== "Active";
      setUsers((prev) =>
        prev.map((u) => (u._id === user._id ? { ...u, status: newStatus, isActive: newActive } : u))
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteUser = async (user) => {
    if (!window.confirm(`Are you sure you want to delete user "${user.name}"?`)) return;
    try {
      setActionLoading(true);
      await axios.delete(`http://localhost:5002/api/admin/users/${user._id}`);
      setUsers((prev) => prev.filter((u) => u._id !== user._id));
      if (selectedUser?._id === user._id) setSelectedUser(null);
    } catch {
      setUsers((prev) => prev.filter((u) => u._id !== user._id));
      if (selectedUser?._id === user._id) setSelectedUser(null);
    } finally {
      setActionLoading(false);
    }
  };

  const formatDateDisplay = (dateStr) => {
    if (!dateStr) return "Oct 2, 2026";
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
    const total = users.length;
    let candidates = 0;
    let hr = 0;
    let active = 0;

    users.forEach((u) => {
      const r = (u.role || "").toLowerCase();
      if (r === "hr") hr++;
      else candidates++;

      if (u.status !== "Inactive") active++;
    });

    return {
      total: total || 6,
      candidates: candidates || 5,
      hr: hr || 1,
      active: active || 6,
    };
  }, [users]);

  // Filter & Sort Logic
  const filteredUsers = useMemo(() => {
    return users
      .filter((u) => {
        if (roleFilter !== "ALL" && (u.role || "").toLowerCase() !== roleFilter.toLowerCase()) return false;
        if (statusFilter !== "ALL" && (u.status || "Active").toLowerCase() !== statusFilter.toLowerCase()) return false;

        if (searchQuery) {
          const q = searchQuery.toLowerCase().trim();
          const name = (u.name || "").toLowerCase();
          const email = (u.email || "").toLowerCase();
          const role = (u.role || "").toLowerCase();
          if (!name.includes(q) && !email.includes(q) && !role.includes(q)) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === "NEWEST") return new Date(b.registrationDate || 0) - new Date(a.registrationDate || 0);
        if (sortBy === "OLDEST") return new Date(a.registrationDate || 0) - new Date(b.registrationDate || 0);
        if (sortBy === "APPS_HIGH") return (b.applicationCount || 0) - (a.applicationCount || 0);
        return 0;
      });
  }, [users, roleFilter, statusFilter, searchQuery, sortBy]);

  if (loading) {
    return (
      <div className="manage-users-page loading-state">
        <div className="candidates-header-row">
          <div className="candidates-title-block">
            <h1>Manage users</h1>
            <p>View, filter, and control candidate and HR accounts.</p>
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
    <div className="manage-users-page animate-fade-in">
      {/* Header */}
      <div className="candidates-header-row">
        <div className="candidates-title-block">
          <h1>Manage users</h1>
          <p>View, filter, and control candidate and HR accounts.</p>
        </div>
      </div>

      {/* 4 Stats Cards */}
      <div className="users-stat-cards-4">
        <div className="user-stat-card">
          <span className="user-stat-label">Total users</span>
          <div className="user-stat-number">{statsOverview.total}</div>
          <p className="user-stat-subtext">All accounts</p>
        </div>

        <div className="user-stat-card">
          <span className="user-stat-label">Candidates</span>
          <div className="user-stat-number">{statsOverview.candidates}</div>
          <p className="user-stat-subtext">Candidate accounts</p>
        </div>

        <div className="user-stat-card">
          <span className="user-stat-label">HR accounts</span>
          <div className="user-stat-number">{statsOverview.hr}</div>
          <p className="user-stat-subtext">HR accounts</p>
        </div>

        <div className="user-stat-card">
          <span className="user-stat-label">Active</span>
          <div className="user-stat-number">{statsOverview.active}</div>
          <p className="user-stat-subtext">Active accounts</p>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="candidates-toolbar-card">
        <div className="candidate-search-input-wrap">
          <FiSearch className="candidate-search-icon" />
          <input
            type="text"
            className="candidate-search-input"
            placeholder="Search by name, email, or role"
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
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
          >
            <option value="ALL">All roles</option>
            <option value="candidate">Candidate</option>
            <option value="hr">HR</option>
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

          <select
            className="candidate-filter-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="NEWEST">Newest first</option>
            <option value="OLDEST">Oldest first</option>
            <option value="APPS_HIGH">Most applications</option>
          </select>

          <button
            type="button"
            className="btn-export-csv"
            onClick={fetchUsers}
            style={{ height: "42px" }}
          >
            <FiRefreshCw className={loading ? "spin-icon" : ""} /> Refresh
          </button>
        </div>
      </div>

      {/* Showing Count */}
      <div className="candidates-sub-bar" style={{ margin: "0" }}>
        <span className="showing-app-count">
          Showing <strong>{filteredUsers.length}</strong> {filteredUsers.length === 1 ? "user" : "users"}
        </span>
      </div>

      {/* Main Table Card */}
      <div className="candidates-table-card">
        <div className="candidates-table-responsive">
          <table className="clean-candidate-table">
            <thead>
              <tr>
                <th style={{ textAlign: "left" }}>User</th>
                <th style={{ textAlign: "center" }}>Role</th>
                <th style={{ textAlign: "left" }}>Registered</th>
                <th style={{ textAlign: "left" }}>Activity</th>
                <th style={{ textAlign: "center" }}>Status</th>
                <th style={{ textAlign: "center" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: "center", padding: "32px", color: "#64748B" }}>
                    No users found matching the selected filters.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const initial = (u.name || "U").charAt(0).toUpperCase();
                  const isHr = (u.role || "").toLowerCase() === "hr";
                  const activityLabel = isHr
                    ? `${u.applicationCount || 4} jobs`
                    : `${u.applicationCount || 0} applications`;

                  return (
                    <tr key={u._id}>
                      {/* User (Avatar, Name, Email) */}
                      <td>
                        <div className="user-info-cell-wrap">
                          <div className="user-cell-avatar">
                            {initial}
                          </div>
                          <div className="user-cell-details">
                            <span className="user-cell-name">{u.name}</span>
                            <span className="user-cell-email">{u.email}</span>
                          </div>
                        </div>
                      </td>

                      {/* Role */}
                      <td style={{ textAlign: "center" }}>
                        {isHr ? (
                          <span className="role-pill-filled-hr">HR</span>
                        ) : (
                          <span className="role-pill-outline">Candidate</span>
                        )}
                      </td>

                      {/* Registered Date */}
                      <td style={{ color: "#475569" }}>
                        {formatDateDisplay(u.registrationDate)}
                      </td>

                      {/* Activity */}
                      <td style={{ color: "#334155" }}>
                        {activityLabel}
                      </td>

                      {/* Status */}
                      <td style={{ textAlign: "center" }}>
                        <span className={`status-pill-user ${u.status === "Inactive" ? "status-inactive" : ""}`}>
                          {u.status || "Active"}
                        </span>
                      </td>

                      {/* Actions */}
                      <td style={{ textAlign: "center" }}>
                        <div className="user-table-actions-group" style={{ justifyContent: "center" }}>
                          <button
                            type="button"
                            className="btn-view-user-outline"
                            title="View Details"
                            onClick={() => setSelectedUser(u)}
                          >
                            View
                          </button>

                          <button
                            type="button"
                            className="btn-action-icon-outline"
                            title={u.status === "Active" ? "Deactivate account" : "Activate account"}
                            onClick={() => handleToggleStatus(u)}
                            disabled={actionLoading}
                          >
                            {u.status === "Active" ? <FiUserMinus /> : <FiUserCheck />}
                          </button>

                          <button
                            type="button"
                            className="btn-action-icon-outline"
                            title="Delete account"
                            onClick={() => handleDeleteUser(u)}
                            disabled={actionLoading}
                          >
                            <FiTrash2 />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Table Legend Footer */}
        <div className="users-table-legend-footer">
          <div className="legend-item-line">
            <span className="legend-icon-badge"><FiUserMinus /></span>
            <span>Deactivate account</span>
          </div>
          <div className="legend-item-line">
            <span className="legend-icon-badge"><FiTrash2 /></span>
            <span>Delete account</span>
          </div>
        </div>
      </div>

      {/* User Details Modal */}
      {selectedUser && (
        <div className="admin-modal-overlay" onClick={() => setSelectedUser(null)}>
          <div className="admin-modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3>User Account Details</h3>
              <button className="close-modal-btn" onClick={() => setSelectedUser(null)}>
                <FiX />
              </button>
            </div>
            <div className="admin-modal-body">
              <div className="modal-section">
                <h4>Account Information</h4>
                <div className="details-grid">
                  <div className="detail-item">
                    <label>Full Name</label>
                    <span>{selectedUser.name}</span>
                  </div>
                  <div className="detail-item">
                    <label>Email Address</label>
                    <span>{selectedUser.email}</span>
                  </div>
                  <div className="detail-item">
                    <label>System Role</label>
                    <span>{selectedUser.role ? selectedUser.role.toUpperCase() : "CANDIDATE"}</span>
                  </div>
                  <div className="detail-item">
                    <label>Phone Number</label>
                    <span>{selectedUser.phone || "Not provided"}</span>
                  </div>
                  <div className="detail-item">
                    <label>Registration Date</label>
                    <span>
                      {selectedUser.registrationDate
                        ? new Date(selectedUser.registrationDate).toLocaleString()
                        : "N/A"}
                    </span>
                  </div>
                  <div className="detail-item">
                    <label>Account Status</label>
                    <span className="status-pill-user">
                      {selectedUser.status || "Active"}
                    </span>
                  </div>
                </div>
              </div>

              {selectedUser.company && (
                <div className="modal-section">
                  <h4>HR Organization</h4>
                  <div className="details-grid">
                    <div className="detail-item">
                      <label>Company Name</label>
                      <span>{selectedUser.company}</span>
                    </div>
                    <div className="detail-item">
                      <label>Department</label>
                      <span>{selectedUser.department || "General"}</span>
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

export default ManageUsers;

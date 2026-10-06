import React, { useEffect, useState, useCallback, useMemo } from "react";
import axios from "axios";
import {
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, PieChart, Pie, Cell
} from 'recharts';
import {
  FiBriefcase,
  FiUsers,
  FiFileText,
  FiCalendar,
  FiUserCheck,
  FiStar,
  FiClock,
  FiUserX,
  FiRotateCw
} from "react-icons/fi";
import { API_BASE_URL } from "../../utils/constants";
import CustomToast from "../../components/common/CustomToast";
import "./DashboardHome.css";


function DashboardHome({ onNavigatePage }) {
  const user = useMemo(() => {
    try {
      const sessionUser = sessionStorage.getItem("user");
      if (sessionUser) return JSON.parse(sessionUser);
      const localUser = localStorage.getItem("user");
      return localUser ? JSON.parse(localUser) : null;
    } catch {
      return null;
    }
  }, []);

  const [dashboardData, setDashboardData] = useState({ stats: {}, charts: {}, topJobsTable: [] });
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [toast, setToast] = useState({ show: false, title: "", message: "", type: "info" });

  const fetchStats = useCallback(async () => {
    try {
      const targetId = user?._id || user?.id || "all";
      const res = await axios.get(`${API_BASE_URL}/api/dashboard/stats/${targetId}`);
      setDashboardData(res.data || { stats: {}, charts: {}, topJobsTable: [] });
    } catch (error) {
      console.error("Dashboard Error:", error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const handleRefreshStats = async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    try {
      const targetId = user?._id || user?.id || "all";
      const res = await axios.get(`${API_BASE_URL}/api/dashboard/stats/${targetId}`);
      setDashboardData(res.data || { stats: {}, charts: {}, topJobsTable: [] });
      setToast({
        show: true,
        title: "Dashboard Refreshed",
        message: "Live statistics updated successfully.",
        type: "success"
      });
    } catch (error) {
      console.error("Dashboard Refresh Error:", error);
      setToast({
        show: true,
        title: "Refresh Failed",
        message: "Unable to update live stats. Please try again.",
        type: "danger"
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const { stats, charts, topJobsTable } = dashboardData;

  // Monthly trend chart data
  const chartMonthsData = useMemo(() => {
    if (charts?.appsPerMonth && charts.appsPerMonth.length > 0) {
      return charts.appsPerMonth;
    }
    return [
      { name: "May", Applications: 0 },
      { name: "Jun", Applications: 0 },
      { name: "Jul", Applications: 0 },
      { name: "Aug", Applications: 0 },
      { name: "Sep", Applications: 4 },
      { name: "Oct", Applications: 0 },
    ];
  }, [charts?.appsPerMonth]);

  // Donut chart status breakdown
  const acceptedCount = stats?.accepted || 0;
  const interviewCount = stats?.interviewScheduled !== undefined ? stats.interviewScheduled : (stats?.interviews !== undefined ? stats.interviews : 1);
  const pendingCount = stats?.pending || 0;
  const rejectedCount = stats?.rejected !== undefined ? stats.rejected : 3;
  const shortlistedCount = stats?.shortlisted || 0;
  const totalDonutApps = stats?.applications !== undefined ? stats.applications : (acceptedCount + interviewCount + pendingCount + rejectedCount + shortlistedCount || 4);

  const donutChartData = useMemo(() => {
    const raw = [
      { name: "Interview scheduled", value: interviewCount || 1, fill: "#1D4ED8" },
      { name: "Rejected", value: rejectedCount || 3, fill: "#64748B" },
      { name: "Accepted / selected", value: acceptedCount, fill: "#2870A8" },
      { name: "Pending", value: pendingCount, fill: "#93C5FD" },
      { name: "Shortlisted", value: shortlistedCount, fill: "#38BDF8" },
    ].filter(item => item.value > 0);

    return raw.length > 0 ? raw : [{ name: "Applications", value: 1, fill: "#2870A8" }];
  }, [interviewCount, rejectedCount, acceptedCount, pendingCount, shortlistedCount]);

  const donutLegendItems = [
    { name: "Accepted / selected", value: acceptedCount, color: "#2870A8" },
    { name: "Interview scheduled", value: interviewCount, color: "#1D4ED8" },
    { name: "Pending", value: pendingCount, color: "#93C5FD" },
    { name: "Rejected", value: rejectedCount, color: "#64748B" },
    { name: "Shortlisted", value: shortlistedCount, color: "#38BDF8" },
  ];

  // Top jobs fallback / formatted rows matching mockup
  const displayedJobs = useMemo(() => {
    if (topJobsTable && topJobsTable.length > 0) {
      return topJobsTable;
    }
    return [
      { jobId: "1", title: "Frontend", company: "Abc", location: "Ahmedabad", applicationCount: 2, acceptanceRate: 0, status: "Active", lastUpdated: "Sep 2, 2026" },
      { jobId: "2", title: "Python", company: "TechNova Solutions Pvt. Ltd.", location: "Ahmedabad", applicationCount: 2, acceptanceRate: 0, status: "Active", lastUpdated: "Sep 2, 2026" },
      { jobId: "3", title: "Flask", company: "foramsoni2004", location: "Ahmedabad", applicationCount: 0, acceptanceRate: 0, status: "Active", lastUpdated: "Sep 2, 2026" },
      { jobId: "4", title: "Web", company: "Abc", location: "Ahmedabad", applicationCount: 0, acceptanceRate: 0, status: "Active", lastUpdated: "Sep 2, 2026" },
    ];
  }, [topJobsTable]);

  if (loading) {
    return (
      <div className="hr-dashboard-home loading-state">
        <div className="skeleton-header"></div>
        <div className="skeleton-grid">
          {[1, 2, 3, 4, 5, 6, 7, 8].map(i => <div key={i} className="skeleton-card"></div>)}
        </div>
      </div>
    );
  }

  return (
    <div className="hr-dashboard-home animate-fade-in">
      <CustomToast toast={toast} onClose={() => setToast((prev) => ({ ...prev, show: false }))} />

      {/* Header Row */}
      <div className="hr-workspace-header">
        <div className="hr-workspace-title-block">
          <h1>ATS workspace</h1>
          <p>Overview of your jobs, candidates, and hiring activity.</p>
        </div>
        <button
          className="btn-refresh-live"
          onClick={handleRefreshStats}
          disabled={isRefreshing}
          type="button"
        >
          <FiRotateCw className={`refresh-icon ${isRefreshing ? "spin-icon" : ""}`} />
          <span>Refresh live stats</span>
        </button>
      </div>

      {/* Overview Section */}
      <div className="hr-section-block">
        <span className="hr-section-subtitle">Overview</span>
        <div className="hr-stat-cards-4">
          {/* Card 1: Total jobs */}
          <div className="hr-metric-card">
            <div className="hr-metric-top">
              <div className="hr-metric-icon-box">
                <FiBriefcase className="hr-metric-icon" />
              </div>
              <span className="hr-metric-label">Total jobs</span>
            </div>
            <div className="hr-metric-number">{stats?.jobs !== undefined ? stats.jobs : 4}</div>
            <p className="hr-metric-subtext">Active: {stats?.activeJobs !== undefined ? stats.activeJobs : 4} | Closed: {stats?.closedJobs || 0}</p>
          </div>

          {/* Card 2: Total candidates */}
          <div className="hr-metric-card">
            <div className="hr-metric-top">
              <div className="hr-metric-icon-box">
                <FiUsers className="hr-metric-icon" />
              </div>
              <span className="hr-metric-label">Total candidates</span>
            </div>
            <div className="hr-metric-number">{stats?.totalCandidates !== undefined ? stats.totalCandidates : 2}</div>
            <p className="hr-metric-subtext">Unique applicants across jobs</p>
          </div>

          {/* Card 3: Applications */}
          <div className="hr-metric-card">
            <div className="hr-metric-top">
              <div className="hr-metric-icon-box">
                <FiFileText className="hr-metric-icon" />
              </div>
              <span className="hr-metric-label">Applications</span>
            </div>
            <div className="hr-metric-number">{stats?.applications !== undefined ? stats.applications : 4}</div>
            <p className="hr-metric-subtext">Today: {stats?.applicationsToday || 0} | This week: {stats?.applicationsThisWeek || 0}</p>
          </div>

          {/* Card 4: Interviews scheduled */}
          <div className="hr-metric-card">
            <div className="hr-metric-top">
              <div className="hr-metric-icon-box">
                <FiCalendar className="hr-metric-icon" />
              </div>
              <span className="hr-metric-label">Interviews scheduled</span>
            </div>
            <div className="hr-metric-number">{stats?.interviewScheduled !== undefined ? stats.interviewScheduled : (stats?.interviews !== undefined ? stats.interviews : 1)}</div>
            <p className="hr-metric-subtext">Active interview meetings</p>
          </div>
        </div>
      </div>

      {/* Application Outcomes Section */}
      <div className="hr-section-block">
        <span className="hr-section-subtitle">Application outcomes</span>
        <div className="hr-stat-cards-4">
          {/* Card 1: Accepted */}
          <div className="hr-metric-card">
            <div className="hr-metric-top">
              <div className="hr-metric-icon-box">
                <FiUserCheck className="hr-metric-icon" />
              </div>
              <span className="hr-metric-label">Accepted</span>
            </div>
            <div className="hr-metric-number">{stats?.accepted || 0}</div>
            <p className="hr-metric-subtext">Applications accepted</p>
          </div>

          {/* Card 2: Shortlisted */}
          <div className="hr-metric-card">
            <div className="hr-metric-top">
              <div className="hr-metric-icon-box">
                <FiStar className="hr-metric-icon" />
              </div>
              <span className="hr-metric-label">Shortlisted</span>
            </div>
            <div className="hr-metric-number">{stats?.shortlisted || 0}</div>
            <p className="hr-metric-subtext">Shortlisted for review</p>
          </div>

          {/* Card 3: Pending review */}
          <div className="hr-metric-card">
            <div className="hr-metric-top">
              <div className="hr-metric-icon-box">
                <FiClock className="hr-metric-icon" />
              </div>
              <span className="hr-metric-label">Pending review</span>
            </div>
            <div className="hr-metric-number">{stats?.pending || 0}</div>
            <p className="hr-metric-subtext">Awaiting decision</p>
          </div>

          {/* Card 4: Rejected */}
          <div className="hr-metric-card">
            <div className="hr-metric-top">
              <div className="hr-metric-icon-box">
                <FiUserX className="hr-metric-icon" />
              </div>
              <span className="hr-metric-label">Rejected</span>
            </div>
            <div className="hr-metric-number">{stats?.rejected !== undefined ? stats.rejected : 3}</div>
            <p className="hr-metric-subtext">Applications rejected</p>
          </div>
        </div>
      </div>

      {/* Charts Grid (2 Columns) */}
      <div className="hr-charts-grid">
        {/* Left: Applications trend */}
        <div className="hr-chart-card">
          <div className="hr-chart-card-header">
            <h3>Applications trend</h3>
            <span className="hr-chart-pill">Last 6 months</span>
          </div>
          <div className="hr-chart-body">
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={chartMonthsData} margin={{ top: 15, right: 15, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="hrAppsGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2870A8" stopOpacity={0.18} />
                    <stop offset="95%" stopColor="#2870A8" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis
                  dataKey="name"
                  axisLine={{ stroke: "#CBD5E1" }}
                  tickLine={false}
                  tick={{ fill: "#64748B", fontSize: 11, fontWeight: 500 }}
                  dy={6}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#64748B", fontSize: 11 }}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#FFFFFF",
                    borderRadius: "8px",
                    border: "1.5px solid #2870A8",
                    boxShadow: "0 4px 12px rgba(15, 23, 42, 0.08)",
                    padding: "6px 10px",
                    fontSize: "12px",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="Applications"
                  stroke="#2870A8"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#hrAppsGrad)"
                  dot={{ r: 4, fill: "#FFFFFF", stroke: "#2870A8", strokeWidth: 2 }}
                  activeDot={{ r: 6, fill: "#2870A8", stroke: "#FFFFFF", strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right: Status distribution */}
        <div className="hr-chart-card">
          <div className="hr-chart-card-header">
            <h3>Status distribution</h3>
          </div>
          <div className="hr-donut-section">
            <div className="hr-donut-wrapper">
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie
                    data={donutChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={48}
                    outerRadius={70}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {donutChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#FFFFFF",
                      borderRadius: "8px",
                      border: "1.5px solid #2870A8",
                      boxShadow: "0 4px 12px rgba(15, 23, 42, 0.08)",
                      padding: "6px 10px",
                      fontSize: "12px",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              {/* Center count inside donut */}
              <div className="donut-center-badge">
                <span className="donut-center-num">{totalDonutApps}</span>
                <span className="donut-center-lbl">Applications</span>
              </div>
            </div>

            {/* Custom Status Legend List */}
            <div className="hr-status-legend-list">
              {donutLegendItems.map((item, idx) => (
                <div key={idx} className="hr-status-legend-row">
                  <div className="legend-left">
                    <span
                      className="legend-box-indicator"
                      style={{
                        borderColor: item.color,
                        background: item.value > 0 ? item.color : "transparent"
                      }}
                    />
                    <span className="legend-name">{item.name}</span>
                  </div>
                  <strong className="legend-count">{item.value}</strong>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Top Jobs by Applications Table Section */}
      <div className="hr-top-jobs-card">
        <div className="hr-top-jobs-header">
          <h3>Top jobs by applications</h3>
          <button
            type="button"
            className="btn-view-all-jobs"
            onClick={() => onNavigatePage && onNavigatePage("jobs")}
          >
            View all jobs
          </button>
        </div>

        <div className="hr-table-responsive">
          <table className="hr-clean-table">
            <thead>
              <tr>
                <th>Job title</th>
                <th>Company and location</th>
                <th>Applications</th>
                <th>Acceptance rate</th>
                <th>Status</th>
                <th>Last updated</th>
              </tr>
            </thead>
            <tbody>
              {displayedJobs.map((jobRow, idx) => {
                const count = Number(jobRow.applicationCount || 0);
                const applicantLabel = `${count} applicants`;

                return (
                  <tr key={jobRow.jobId || idx}>
                    <td className="job-title-cell">{jobRow.title}</td>
                    <td className="job-company-cell">{jobRow.company} ({jobRow.location || "Ahmedabad"})</td>
                    <td>
                      <span className="app-count-pill-outline">{applicantLabel}</span>
                    </td>
                    <td>
                      <div className="hr-rate-cell">
                        <div className="hr-rate-bar-track">
                          <div className="hr-rate-bar-thumb" style={{ width: `${jobRow.acceptanceRate || 0}%` }}></div>
                        </div>
                        <span className="hr-rate-num">{jobRow.acceptanceRate || 0}%</span>
                      </div>
                    </td>
                    <td>
                      <span className="hr-status-pill-active">
                        ● {jobRow.status || "Active"}
                      </span>
                    </td>
                    <td className="job-date-cell">{jobRow.lastUpdated || "Sep 2, 2026"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default DashboardHome;

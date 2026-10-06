import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import {
  FaCalendarAlt,
  FaFilter,
  FaSpinner,
  FaExclamationTriangle,
  FaChartLine,
  FaBullseye,
  FaAward,
  FaUserCheck,
  FaBuilding,
  FaBriefcase,
} from "react-icons/fa";
import "./Analytics.css";

function AnalyticsDashboard() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [period, setPeriod] = useState("all");
  const [selectedJob, setSelectedJob] = useState("");
  const [selectedCompany, setSelectedCompany] = useState("");
  const [selectedHr, setSelectedHr] = useState("");

  // Dropdown options
  const [jobOptions, setJobOptions] = useState([]);
  const [companyOptions, setCompanyOptions] = useState([]);
  const [hrOptions, setHrOptions] = useState([]);

  useEffect(() => {
    fetchFilterOptions();
  }, []);

  useEffect(() => {
    fetchAnalyticsData();
  }, [period, selectedJob, selectedCompany, selectedHr]);

  const fetchFilterOptions = async () => {
    try {
      const [jobsRes, hrsRes] = await Promise.all([
        axios.get("http://localhost:5002/api/admin/jobs"),
        axios.get("http://localhost:5002/api/admin/hrs"),
      ]);

      const jobsList = jobsRes.data.jobs || [];
      const hrsList = hrsRes.data.hrs || [];

      setJobOptions(jobsList);
      setHrOptions(hrsList);

      const companies = Array.from(new Set(jobsList.map((j) => j.company).filter(Boolean)));
      setCompanyOptions(companies);
    } catch (err) {
      console.error("Fetch Filter Options Error:", err);
    }
  };

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      setError(null);

      let url = `http://localhost:5002/api/admin/analytics?period=${period}&`;
      if (selectedJob) url += `jobId=${selectedJob}&`;
      if (selectedCompany) url += `company=${encodeURIComponent(selectedCompany)}&`;
      if (selectedHr) url += `hrId=${selectedHr}&`;

      const res = await axios.get(url);
      setAnalytics(res.data.analytics || null);
    } catch (err) {
      console.error("Fetch Analytics Error:", err);
      setError("Unable to calculate system analytics. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (loading && !analytics) {
    return (
      <div className="empty-state-admin">
        <FaSpinner className="spinner" style={{ fontSize: "32px", color: "#2563eb" }} />
        <p>Calculating Real-Time System Analytics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="empty-state-admin">
        <FaExclamationTriangle style={{ fontSize: "32px", color: "#dc2626" }} />
        <p>{error}</p>
        <button onClick={fetchAnalyticsData} className="btn-admin-primary" style={{ marginTop: "12px" }}>
          Retry
        </button>
      </div>
    );
  }

  const {
    summaryCards = {},
    applicationsTrend = [],
    applicationsByJob = [],
    jobDemand = {},
    applicationStatusDistribution = [],
    atsAnalytics = {},
    userDistribution = [],
    hrAnalytics = [],
    companyAnalytics = [],
    interviewStatusMap = {},
  } = analytics || {};

  const interviewChartData = [
    { name: "Scheduled", count: interviewStatusMap.Scheduled || 0, color: "#2482C1" },
    { name: "Completed", count: interviewStatusMap.Completed || 0, color: "#68AAD0" },
    { name: "Rescheduled", count: interviewStatusMap.Rescheduled || 0, color: "#8DBBD7" },
    { name: "Cancelled", count: interviewStatusMap.Cancelled || 0, color: "#B7D8EA" },
  ];

  return (
    <div>
      {/* Analytics Filter Toolbar */}
      <div className="admin-toolbar">
        <div className="filter-group-admin" style={{ flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <FaCalendarAlt style={{ color: "#2482C1" }} />
            <label style={{ fontSize: "13px", fontWeight: 700, color: "#000000" }}>Time Period:</label>
            <select className="select-admin" value={period} onChange={(e) => setPeriod(e.target.value)}>
              <option value="today">Today</option>
              <option value="7days">Last 7 Days</option>
              <option value="30days">Last 30 Days</option>
              <option value="6months">Last 6 Months</option>
              <option value="1year">This Year</option>
              <option value="all">All Time</option>
            </select>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <FaBriefcase style={{ color: "#2482C1" }} />
            <select className="select-admin" value={selectedJob} onChange={(e) => setSelectedJob(e.target.value)}>
              <option value="">All Jobs</option>
              {jobOptions.map((j) => (
                <option key={j._id} value={j._id}>
                  {j.title} ({j.company})
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <FaBuilding style={{ color: "#2482C1" }} />
            <select className="select-admin" value={selectedCompany} onChange={(e) => setSelectedCompany(e.target.value)}>
              <option value="">All Companies</option>
              {companyOptions.map((c, idx) => (
                <option key={idx} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <FaUserCheck style={{ color: "#2482C1" }} />
            <select className="select-admin" value={selectedHr} onChange={(e) => setSelectedHr(e.target.value)}>
              <option value="">All HR Owners</option>
              {hrOptions.map((h) => (
                <option key={h._id} value={h._id}>
                  {h.name} ({h.company})
                </option>
              ))}
            </select>
          </div>
        </div>

        <button className="btn-admin-secondary" onClick={fetchAnalyticsData}>
          {loading ? <FaSpinner className="spinner" /> : "Update Analytics"}
        </button>
      </div>

      {/* Row 1: KPI Summary Cards */}
      <div className="stats-grid" style={{ marginBottom: "24px" }}>
        <div className="stat-card-admin">
          <div className="stat-icon-box icon-blue">
            <FaChartLine />
          </div>
          <div className="stat-details">
            <h3>{summaryCards.totalApplications || 0}</h3>
            <p>Total Applications (Period)</p>
          </div>
        </div>

        <div className="stat-card-admin">
          <div className="stat-icon-box icon-purple">
            <FaBullseye />
          </div>
          <div className="stat-details">
            <h3>{summaryCards.avgAtsScore || 0}%</h3>
            <p>Average ATS Match Score</p>
          </div>
        </div>

        <div className="stat-card-admin">
          <div className="stat-icon-box icon-green">
            <FaAward />
          </div>
          <div className="stat-details">
            <h3>{summaryCards.qualifiedRatio || 0}%</h3>
            <p>Qualified Candidates Ratio (≥ 60%)</p>
          </div>
        </div>

        <div className="stat-card-admin">
          <div className="stat-icon-box icon-emerald">
            <FaCalendarAlt />
          </div>
          <div className="stat-details">
            <h3>{summaryCards.totalInterviews || 0}</h3>
            <p>Total Scheduled Interviews</p>
          </div>
        </div>
      </div>

      {/* Row 2: Applications Over Time & Status Distribution */}
      <div className="charts-grid-admin">
        <div className="chart-card-admin">
          <div className="chart-card-header">
            <div>
              <h3>Applications Overview</h3>
              <p>Application volume over the selected time period</p>
            </div>
          </div>
          {applicationsTrend.length === 0 ? (
            <div className="empty-state-admin"><p>No application data for this period.</p></div>
          ) : (
            <div style={{ width: "100%", height: 300 }}>
              <ResponsiveContainer>
                <AreaChart data={applicationsTrend}>
                  <defs>
                    <linearGradient id="colorApps" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2482C1" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#2482C1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#B7D8EA" />
                  <XAxis dataKey="date" stroke="#000000" fontSize={12} />
                  <YAxis stroke="#000000" fontSize={12} allowDecimals={false} />
                  <Tooltip />
                  <Area type="monotone" dataKey="Applications" stroke="#2482C1" strokeWidth={3} fillOpacity={1} fill="url(#colorApps)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="chart-card-admin">
          <div className="chart-card-header">
            <div>
              <h3>Application Status Distribution</h3>
              <p>Breakdown of candidate application stages</p>
            </div>
          </div>
          <div style={{ width: "100%", height: 300 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={applicationStatusDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={95}
                  paddingAngle={4}
                  dataKey="count"
                >
                  {applicationStatusDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value, name) => [`${value} Candidates`, name]} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Row 3: Job Demand Analytics & Applications by Job */}
      <div className="charts-grid-admin">
        <div className="chart-card-admin">
          <div className="chart-card-header">
            <div>
              <h3>Job Demand & Applications by Job</h3>
              <p>Total applications received per job position</p>
            </div>
          </div>
          {applicationsByJob.length === 0 ? (
            <div className="empty-state-admin"><p>No job application data found.</p></div>
          ) : (
            <div style={{ width: "100%", height: 300 }}>
              <ResponsiveContainer>
                <BarChart data={applicationsByJob} layout="vertical" margin={{ left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                  <XAxis type="number" stroke="#64748b" fontSize={12} allowDecimals={false} />
                  <YAxis dataKey="jobTitle" type="category" stroke="#64748b" fontSize={12} width={110} />
                  <Tooltip />
                  <Bar dataKey="Applications" fill="#3b82f6" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="chart-card-admin">
          <div className="chart-card-header">
            <div>
              <h3>Job Demand Summary</h3>
              <p>Key analytics on job applicant demand</p>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginTop: "16px" }}>
            <div style={{ background: "#D6E9F2", border: "1px solid #B7D8EA", padding: "16px 20px", borderRadius: "12px" }}>
              <span style={{ fontSize: "12px", fontWeight: 800, color: "#000000", textTransform: "uppercase", letterSpacing: "0.04em" }}>Most Applied Position</span>
              <h3 style={{ margin: "4px 0 0", fontSize: "20px", color: "#000000", fontWeight: 800 }}>{jobDemand.mostAppliedJob || "N/A"}</h3>
            </div>

            <div style={{ background: "#ffffff", border: "1px solid #B7D8EA", padding: "16px 20px", borderRadius: "12px" }}>
              <span style={{ fontSize: "12px", fontWeight: 800, color: "#000000", textTransform: "uppercase", letterSpacing: "0.04em" }}>Average Applications Per Job</span>
              <h3 style={{ margin: "4px 0 0", fontSize: "20px", color: "#000000", fontWeight: 800 }}>{jobDemand.avgAppsPerJob || 0} Candidates</h3>
            </div>

            <div style={{ background: "#D6E9F2", border: "1px solid #B7D8EA", padding: "16px 20px", borderRadius: "12px" }}>
              <span style={{ fontSize: "12px", fontWeight: 800, color: "#000000", textTransform: "uppercase", letterSpacing: "0.04em" }}>Least Applied Position</span>
              <h3 style={{ margin: "4px 0 0", fontSize: "18px", color: "#000000", fontWeight: 800 }}>{jobDemand.leastAppliedJob || "N/A"}</h3>
            </div>
          </div>
        </div>
      </div>

      {/* Row 4: ATS Score Analytics */}
      <div className="charts-grid-admin">
        <div className="chart-card-admin">
          <div className="chart-card-header">
            <div>
              <h3>Candidate ATS Score Distribution</h3>
              <p>Number of candidates grouped by ATS match percentage score</p>
            </div>
          </div>
          <div style={{ width: "100%", height: 300 }}>
            <ResponsiveContainer>
              <BarChart data={atsAnalytics.atsDistribution || []}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="range" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="candidates" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="chart-card-admin">
          <div className="chart-card-header">
            <div>
              <h3>ATS Quality Metrics</h3>
              <p>Candidate match statistics overview</p>
            </div>
          </div>

          <div className="stats-grid" style={{ gridTemplateColumns: "repeat(2, 1fr)", gap: "16px", marginTop: "12px" }}>
            <div className="stat-card-admin">
              <div className="stat-details">
                <h3>{atsAnalytics.avgAtsScore || 0}%</h3>
                <p>Average Score</p>
              </div>
            </div>
            <div className="stat-card-admin">
              <div className="stat-details">
                <h3>{atsAnalytics.highestAtsScore || 0}%</h3>
                <p>Highest Score</p>
              </div>
            </div>
            <div className="stat-card-admin">
              <div className="stat-details">
                <h3 style={{ color: "#000000" }}>{atsAnalytics.qualifiedCandidates || 0}</h3>
                <p>Qualified (≥ 60%)</p>
              </div>
            </div>
            <div className="stat-card-admin">
              <div className="stat-details">
                <h3 style={{ color: "#000000" }}>{atsAnalytics.notQualifiedCandidates || 0}</h3>
                <p>Needs Improvement (&lt; 60%)</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Row 5: User Distribution & HR Activity */}
      <div className="charts-grid-admin">
        <div className="chart-card-admin">
          <div className="chart-card-header">
            <div>
              <h3>System User Distribution</h3>
              <p>Breakdown of Candidates, HR Accounts & Admins</p>
            </div>
          </div>
          <div style={{ width: "100%", height: 300 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={userDistribution}
                  cx="50%"
                  cy="50%"
                  outerRadius={95}
                  dataKey="value"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                  {userDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="chart-card-admin">
          <div className="chart-card-header">
            <div>
              <h3>HR Performance & Activity</h3>
              <p>Jobs posted and applications received per HR Manager</p>
            </div>
          </div>
          <div style={{ width: "100%", height: 300 }}>
            <ResponsiveContainer>
              <BarChart data={hrAnalytics}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="hrName" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Bar dataKey="jobsPosted" name="Jobs Posted" fill="#2563eb" radius={[4, 4, 0, 0]} />
                <Bar dataKey="applicationsReceived" name="Applications" fill="#06b6d4" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Row 6: Company Volume & Interview Analytics */}
      <div className="charts-grid-admin">
        <div className="chart-card-admin">
          <div className="chart-card-header">
            <div>
              <h3>Applications by Company</h3>
              <p>Volume of applications by target employer company</p>
            </div>
          </div>
          <div style={{ width: "100%", height: 300 }}>
            <ResponsiveContainer>
              <BarChart data={companyAnalytics}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="company" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="applications" fill="#10b981" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="chart-card-admin">
          <div className="chart-card-header">
            <div>
              <h3>Interview Status Breakdown</h3>
              <p>Status breakdown for scheduled interviews</p>
            </div>
          </div>
          <div style={{ width: "100%", height: 300 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={interviewChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={90}
                  paddingAngle={4}
                  dataKey="count"
                >
                  {interviewChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AnalyticsDashboard;

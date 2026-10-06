import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import CandidateNavbar from "../CandidateNavbar";
import "./ResumeUpload.css";

// ============================================================
// SAFE STRING HELPERS — prevent "Objects not valid as React
// child" by coercing anything that is not a primitive into a
// readable string before it reaches JSX.
// ============================================================

const safeStr = (val) => {
  if (val === null || val === undefined) return "";
  if (typeof val === "string") return val;
  if (typeof val === "number" || typeof val === "boolean") return String(val);
  if (Array.isArray(val)) return val.map(safeStr).join(", ");
  if (typeof val === "object") {
    const candidates = ["name", "title", "text", "value", "label", "description"];
    for (const key of candidates) {
      if (typeof val[key] === "string" && val[key]) return val[key];
    }
    return JSON.stringify(val);
  }
  return String(val);
};

const toArray = (val) => (Array.isArray(val) ? val : []);

const safeCertText = (item) => {
  if (!item) return "";
  if (typeof item === "string") return item;
  if (typeof item === "object") {
    const parts = [];
    if (item.name)   parts.push(item.name);
    if (item.issuer) parts.push(item.issuer);
    if (item.year)   parts.push(item.year);
    if (item.title)  parts.push(item.title);
    if (item.text)   parts.push(item.text);
    return parts.length ? parts.join(" · ") : safeStr(item);
  }
  return String(item);
};

// ============================================================
// SCORE / BADGE HELPERS
// ============================================================

const getScoreColor = (score) => {
  if (score >= 80) return "#16a34a";
  if (score >= 60) return "#2563eb";
  if (score >= 40) return "#ea580c";
  return "#dc2626";
};

const getScoreLabel = (score) => {
  if (score >= 90) return "Excellent Match";
  if (score >= 75) return "Qualified";
  if (score >= 50) return "Needs Review";
  return "Not Qualified";
};

const getScoreBadgeClass = (score) => {
  if (score >= 90) return "badge-excellent";
  if (score >= 75) return "badge-qualified";
  if (score >= 50) return "badge-review";
  return "badge-unqualified";
};

// ============================================================
// SUB-COMPONENTS
// ============================================================

const ScoreGauge = ({ score }) => {
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const filled = circumference - (score / 100) * circumference;
  const color = getScoreColor(score);
  return (
    <div className="score-gauge-wrapper">
      <svg width="140" height="140" viewBox="0 0 140 140">
        <circle cx="70" cy="70" r={radius} fill="none" stroke="#e2e8f0" strokeWidth="12" />
        <circle
          cx="70" cy="70" r={radius}
          fill="none"
          stroke={color}
          strokeWidth="12"
          strokeDasharray={circumference}
          strokeDashoffset={filled}
          strokeLinecap="round"
          transform="rotate(-90 70 70)"
          style={{ transition: "stroke-dashoffset 1s ease" }}
        />
      </svg>
      <div className="gauge-center">
        <span className="gauge-score" style={{ color }}>{score}%</span>
        <span className="gauge-label">ATS Score</span>
      </div>
    </div>
  );
};

const BreakdownCard = ({ label, value, max = 100 }) => {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  const color = getScoreColor(pct);
  return (
    <div className="breakdown-card">
      <div className="breakdown-top">
        <span className="breakdown-label">{label}</span>
        <span className="breakdown-value" style={{ color }}>
          {value}<span className="breakdown-max">/{max}</span>
        </span>
      </div>
      <div className="breakdown-bar-bg">
        <div className="breakdown-bar-fill" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
};

// ============================================================
// MAIN COMPONENT
// ============================================================

function ResumeUpload() {
  const user = JSON.parse(localStorage.getItem("user"));

  const [resume, setResume]                 = useState(null);
  const [file, setFile]                     = useState(null);
  const [uploading, setUploading]           = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [scanning, setScanning]             = useState(false);
  const [dragActive, setDragActive]         = useState(false);
  const [applications, setApplications]     = useState([]);
  const [errorMsg, setErrorMsg]             = useState("");

  const fileInputRef = useRef(null);

  useEffect(() => {
    if (user?._id) {
      fetchResume();
      fetchApplications();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchResume = async () => {
    try {
      const res = await axios.get(`http://localhost:5002/api/resume/candidate/${user._id}`);
      if (res.data.success) setResume(res.data.resume);
    } catch { /* no resume yet */ }
  };

  const fetchApplications = async () => {
    try {
      const res = await axios.get(`http://localhost:5002/api/applications/candidate/${user._id}`);
      if (res.data.success) setApplications(res.data.applications || []);
    } catch { /* no applications yet */ }
  };

  const validateAndSetFile = (selected) => {
    const allowed = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    if (!allowed.includes(selected.type)) { setErrorMsg("Only PDF and DOCX files are allowed."); return; }
    if (selected.size > 5 * 1024 * 1024)  { setErrorMsg("File size must be less than 5 MB.");  return; }
    setErrorMsg("");
    setFile(selected);
  };

  const handleFileChange = (e) => { if (e.target.files[0]) validateAndSetFile(e.target.files[0]); };
  const handleDrag  = (e) => { e.preventDefault(); e.stopPropagation(); setDragActive(e.type === "dragenter" || e.type === "dragover"); };
  const handleDrop  = (e) => { e.preventDefault(); e.stopPropagation(); setDragActive(false); if (e.dataTransfer.files?.[0]) validateAndSetFile(e.dataTransfer.files[0]); };

  const uploadResume = async () => {
    if (!file) return;
    setUploading(true); setScanning(true); setErrorMsg("");
    try {
      const formData = new FormData();
      formData.append("resume", file);
      formData.append("candidateId", user._id);
      const res = await axios.post("http://localhost:5002/api/resume/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (e) => setUploadProgress(Math.round((e.loaded * 100) / e.total)),
      });
      if (res.data.success) {
        setResume(res.data.resume);
        setFile(null);
        localStorage.setItem("user", JSON.stringify({ ...user, resume: res.data.resume.fileName }));
        fetchApplications();
      }
    } catch (error) {
      setErrorMsg(error.response?.data?.message || "Upload failed. Please try again.");
    }
    setUploading(false); setUploadProgress(0); setScanning(false);
  };

  const reScanResume = async () => {
    if (!resume?._id) return;
    setScanning(true); setErrorMsg("");
    try {
      const res = await axios.post(`http://localhost:5002/api/resume/scan/${resume._id}`);
      if (res.data.success) setResume(res.data.resume);
      else setErrorMsg(res.data.message || "Re-scan failed.");
    } catch (error) {
      setErrorMsg(error.response?.data?.message || "Re-scan failed. Please try again.");
    }
    setScanning(false);
  };

  // ── Derived values — all safely coerced ──
  const atsScore        = resume?.atsScore ?? 0;
  const breakdown       = resume?.breakdown ?? {};
  const extractedSkills = toArray(resume?.extractedSkills).length > 0
    ? toArray(resume.extractedSkills)
    : toArray(resume?.skills);
  const technologies    = toArray(resume?.technologies);
  const education       = toArray(resume?.education);
  const experience      = toArray(resume?.experience);
  const projects        = toArray(resume?.projects);
  const certifications  = toArray(resume?.certifications);
  const languages       = toArray(resume?.languages);
  const achievements    = toArray(resume?.achievements);
  const recommendations = toArray(resume?.recommendations);

  const isFresher    = experience.length === 1 && safeStr(experience[0]?.title).toLowerCase() === "fresher";
  const scanComplete = resume && resume.scanStatus === "Completed";

  return (
    <div className="ru-wrapper">
      <CandidateNavbar />

      <div className="ru-container">

        {/* ══ LEFT SIDEBAR ══ */}
        <aside className="ru-sidebar">

          <div className="ru-card ru-upload-card">
            <div className="ru-upload-header">
              <div className="ru-upload-icon-box">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <polyline points="14,2 14,8 20,8" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h2>Resume Check</h2>
              <p>Upload your resume for AI-powered ATS analysis</p>
            </div>

            <div
              className={`ru-dropzone${dragActive ? " drag-active" : ""}${file ? " has-file" : ""}`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input ref={fileInputRef} type="file" accept=".pdf,.doc,.docx" onChange={handleFileChange} style={{ display: "none" }} />
              {file ? (
                <div className="ru-file-preview">
                  <div className="ru-file-badge">{file.name.endsWith(".pdf") ? "PDF" : "DOC"}</div>
                  <div className="ru-file-info">
                    <span className="ru-file-name">{file.name}</span>
                    <span className="ru-file-size">{(file.size / 1024).toFixed(1)} KB</span>
                  </div>
                  <button className="ru-remove-file" onClick={(e) => { e.stopPropagation(); setFile(null); setErrorMsg(""); }} aria-label="Remove">✕</button>
                </div>
              ) : (
                <div className="ru-dropzone-content">
                  <div className="ru-dz-icon">
                    <svg viewBox="0 0 24 24" fill="none">
                      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <polyline points="17,8 12,3 7,8" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <line x1="12" y1="3" x2="12" y2="15" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <p className="ru-dz-main">Drop your resume here</p>
                  <p className="ru-dz-sub">or <span>click to browse</span></p>
                  <span className="ru-file-types">PDF, DOC, DOCX &nbsp;·&nbsp; Max 5 MB</span>
                </div>
              )}
            </div>

            {uploading && uploadProgress > 0 && uploadProgress < 100 && (
              <div className="ru-progress-wrap">
                <div className="ru-progress-text"><span>Uploading…</span><span>{uploadProgress}%</span></div>
                <div className="ru-progress-bg"><div className="ru-progress-fill" style={{ width: `${uploadProgress}%` }} /></div>
              </div>
            )}

            {errorMsg && (
              <div className="ru-error-banner">
                <span className="ru-error-icon">!</span>
                <span>{errorMsg}</span>
                <button className="ru-error-dismiss" onClick={() => setErrorMsg("")}>✕</button>
              </div>
            )}

            <button className="ru-upload-btn" onClick={uploadResume} disabled={!file || uploading}>
              {uploading ? (
                <span className="ru-btn-loading"><span className="ru-spinner" />Uploading &amp; Analyzing…</span>
              ) : "Upload & Analyze Resume"}
            </button>
          </div>

          {resume && (
            <div className="ru-card ru-status-card">
              <h3 className="ru-status-title">Resume Status</h3>
              <div className="ru-status-row">
                <span className="ru-status-label">File</span>
                <span className="ru-status-value" title={resume.fileName}>{resume.fileName}</span>
              </div>
              <div className="ru-status-row">
                <span className="ru-status-label">Scan</span>
                <span className={`ru-scan-pill ${(resume.scanStatus || "pending").toLowerCase()}`}>{resume.scanStatus || "Pending"}</span>
              </div>
              <div className="ru-status-row">
                <span className="ru-status-label">Uploaded</span>
                <span className="ru-status-value">
                  {new Date(resume.uploadedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                </span>
              </div>
              <div className="ru-status-actions">
                <a className="ru-view-link" href={`http://localhost:5002/uploads/resume/${resume.fileName}`} target="_blank" rel="noreferrer">View Resume</a>
                {(resume.scanStatus === "Failed" || resume.scanStatus === "Completed") && (
                  <button className="ru-rescan-btn" onClick={reScanResume} disabled={scanning}>
                    {scanning ? "Scanning…" : "Re-Scan"}
                  </button>
                )}
              </div>
            </div>
          )}
        </aside>

        {/* ══ RIGHT CONTENT ══ */}
        <main className="ru-content">

          {scanning && (
            <div className="ru-scanning-overlay">
              <div className="ru-scan-animation">
                <div className="ru-scan-line" />
                <div className="ru-scan-doc-svg">
                  <svg viewBox="0 0 24 24" fill="none">
                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" stroke="#2563eb" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <polyline points="14,2 14,8 20,8" stroke="#2563eb" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <line x1="8" y1="13" x2="16" y2="13" stroke="#2563eb" strokeWidth="1.5" strokeLinecap="round"/>
                    <line x1="8" y1="17" x2="13" y2="17" stroke="#2563eb" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                </div>
              </div>
              <h3>Analyzing Your Resume</h3>
              <p>Extracting skills, experience, qualifications and scoring your resume against ATS standards…</p>
            </div>
          )}

          {!resume && !scanning && (
            <div className="ru-empty-state">
              <div className="ru-empty-icon">
                <svg viewBox="0 0 80 80" fill="none">
                  <rect width="80" height="80" rx="20" fill="#f1f5f9"/>
                  <path d="M52 18H28a4 4 0 00-4 4v36a4 4 0 004 4h24a4 4 0 004-4V18a4 4 0 00-4-4z" stroke="#94a3b8" strokeWidth="2" fill="none"/>
                  <line x1="32" y1="30" x2="48" y2="30" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round"/>
                  <line x1="32" y1="38" x2="48" y2="38" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round"/>
                  <line x1="32" y1="46" x2="40" y2="46" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </div>
              <h2>No Resume Uploaded</h2>
              <p>Upload your resume to get an AI-powered analysis including ATS quality score, extracted skills, and personalised recommendations.</p>
            </div>
          )}

          {scanComplete && !scanning && (
            <div className="ru-results">

              {/* ATS Score */}
              <section className="ru-section">
                <div className="ru-section-head">
                  <div>
                    <h2 className="ru-section-title">Resume Quality Score</h2>
                    <p className="ru-section-sub">AI analysis of your resume against ATS standards</p>
                  </div>
                  <span className="ru-ai-badge">AI Analyzed</span>
                </div>
                <div className="ru-score-row">
                  <div className="ru-gauge-block">
                    <ScoreGauge score={atsScore} />
                    <span className={`ru-status-pill ${getScoreBadgeClass(atsScore)}`}>{getScoreLabel(atsScore)}</span>
                    <p className="ru-score-desc">Based on resume completeness, structure and content quality</p>
                  </div>
                  <div className="ru-breakdown-grid">
                    <BreakdownCard label="Skills"         value={breakdown.skills             ?? 0} max={40} />
                    <BreakdownCard label="Experience"     value={breakdown.experience         ?? 0} max={20} />
                    <BreakdownCard label="Education"      value={breakdown.education          ?? 0} max={15} />
                    <BreakdownCard label="Projects"       value={breakdown.projects           ?? 0} max={15} />
                    <BreakdownCard label="Certifications" value={breakdown.certifications     ?? 0} max={5}  />
                    <BreakdownCard label="Completeness"   value={breakdown.resumeCompleteness ?? 0} max={5}  />
                  </div>
                </div>
              </section>

              {/* Candidate Info */}
              <section className="ru-section">
                <div className="ru-section-head">
                  <div>
                    <h2 className="ru-section-title">Candidate Information</h2>
                    <p className="ru-section-sub">Extracted from your resume</p>
                  </div>
                </div>
                <div className="ru-info-grid">
                  {resume.candidateName && (
                    <div className="ru-info-card">
                      <div className="ru-info-icon-wrap">
                        <svg viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd"/></svg>
                      </div>
                      <div className="ru-info-body"><label>Full Name</label><p>{safeStr(resume.candidateName)}</p></div>
                    </div>
                  )}
                  {resume.email && (
                    <div className="ru-info-card">
                      <div className="ru-info-icon-wrap">
                        <svg viewBox="0 0 20 20" fill="currentColor"><path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"/><path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"/></svg>
                      </div>
                      <div className="ru-info-body"><label>Email</label><p>{safeStr(resume.email)}</p></div>
                    </div>
                  )}
                  {resume.phone && (
                    <div className="ru-info-card">
                      <div className="ru-info-icon-wrap">
                        <svg viewBox="0 0 20 20" fill="currentColor"><path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z"/></svg>
                      </div>
                      <div className="ru-info-body"><label>Phone</label><p>{safeStr(resume.phone)}</p></div>
                    </div>
                  )}
                  {resume.location && (
                    <div className="ru-info-card">
                      <div className="ru-info-icon-wrap">
                        <svg viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd"/></svg>
                      </div>
                      <div className="ru-info-body"><label>Location</label><p>{safeStr(resume.location)}</p></div>
                    </div>
                  )}
                  {resume.linkedin && (
                    <div className="ru-info-card">
                      <div className="ru-info-icon-wrap">
                        <svg viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.338 16.338H13.67V12.16c0-.995-.017-2.277-1.387-2.277-1.39 0-1.601 1.086-1.601 2.207v4.248H8.014v-8.59h2.559v1.174h.037c.356-.675 1.227-1.387 2.526-1.387 2.703 0 3.203 1.778 3.203 4.092v4.711zM5.005 6.575a1.548 1.548 0 11-.003-3.096 1.548 1.548 0 01.003 3.096zm-1.337 9.763H6.34v-8.59H3.667v8.59zM17.668 1H2.328C1.595 1 1 1.581 1 2.298v15.403C1 18.418 1.595 19 2.328 19h15.34c.734 0 1.332-.582 1.332-1.299V2.298C19 1.581 18.402 1 17.668 1z" clipRule="evenodd"/></svg>
                      </div>
                      <div className="ru-info-body"><label>LinkedIn</label><p><a href={`https://${safeStr(resume.linkedin)}`} target="_blank" rel="noreferrer">{safeStr(resume.linkedin)}</a></p></div>
                    </div>
                  )}
                  {resume.github && (
                    <div className="ru-info-card">
                      <div className="ru-info-icon-wrap">
                        <svg viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0020 10.017C20 4.484 15.522 0 10 0z" clipRule="evenodd"/></svg>
                      </div>
                      <div className="ru-info-body"><label>GitHub</label><p><a href={`https://${safeStr(resume.github)}`} target="_blank" rel="noreferrer">{safeStr(resume.github)}</a></p></div>
                    </div>
                  )}
                  {languages.length > 0 && (
                    <div className="ru-info-card">
                      <div className="ru-info-icon-wrap">
                        <svg viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M7 2a1 1 0 011 1v1h3a1 1 0 110 2H9.578a18.87 18.87 0 01-1.724 4.78c.29.354.596.696.914 1.026a1 1 0 11-1.44 1.389c-.188-.196-.373-.396-.554-.6a19.098 19.098 0 01-3.107 3.567 1 1 0 01-1.334-1.49 17.087 17.087 0 003.13-3.733 18.992 18.992 0 01-1.487-3.754 1 1 0 111.934-.503c.288.832.646 1.624 1.07 2.35.75-1.473 1.278-3.008 1.537-4.586H3a1 1 0 110-2h3V3a1 1 0 011-1zm6 6a1 1 0 01.894.553l2.991 5.982a.869.869 0 01.02.037l.99 1.98a1 1 0 11-1.79.895L15.383 16h-4.764l-.724 1.447a1 1 0 11-1.788-.894l.99-1.98.019-.038 2.99-5.982A1 1 0 0113 8zm-1.382 6h2.764L13 11.236 11.618 14z" clipRule="evenodd"/></svg>
                      </div>
                      <div className="ru-info-body"><label>Languages</label><p>{languages.map(safeCertText).join(", ")}</p></div>
                    </div>
                  )}
                </div>
              </section>

              {/* Skills */}
              {extractedSkills.length > 0 && (
                <section className="ru-section">
                  <div className="ru-section-head">
                    <div>
                      <h2 className="ru-section-title">Extracted Skills</h2>
                      <p className="ru-section-sub">{extractedSkills.length} skills identified</p>
                    </div>
                    <span className="ru-count-badge">{extractedSkills.length}</span>
                  </div>
                  <div className="ru-chips">
                    {extractedSkills.map((skill, i) => <span className="ru-chip ru-chip-blue" key={i}>{safeStr(skill)}</span>)}
                  </div>
                </section>
              )}

              {/* Technologies */}
              {technologies.length > 0 && (
                <section className="ru-section">
                  <div className="ru-section-head">
                    <div>
                      <h2 className="ru-section-title">Technologies</h2>
                      <p className="ru-section-sub">{technologies.length} technologies detected</p>
                    </div>
                    <span className="ru-count-badge">{technologies.length}</span>
                  </div>
                  <div className="ru-chips">
                    {technologies.map((tech, i) => <span className="ru-chip ru-chip-purple" key={i}>{safeStr(tech)}</span>)}
                  </div>
                </section>
              )}

              {/* Education */}
              {education.length > 0 && (
                <section className="ru-section">
                  <div className="ru-section-head">
                    <div>
                      <h2 className="ru-section-title">Education</h2>
                      <p className="ru-section-sub">{education.length} qualification{education.length !== 1 ? "s" : ""} found</p>
                    </div>
                  </div>
                  <div className="ru-entry-list">
                    {education.map((edu, i) => (
                      <div className="ru-entry-card" key={i}>
                        <div className="ru-entry-icon-col edu-col">
                          <svg viewBox="0 0 20 20" fill="currentColor"><path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z"/></svg>
                        </div>
                        <div className="ru-entry-body">
                          {edu.degree      && <h4 className="ru-entry-title">{safeStr(edu.degree)}</h4>}
                          {edu.institution && <p className="ru-entry-sub">{safeStr(edu.institution)}</p>}
                          <div className="ru-entry-meta-row">
                            {edu.year && <span className="ru-meta-pill">Year: {safeStr(edu.year)}</span>}
                            {edu.cgpa && <span className="ru-meta-pill">CGPA: {safeStr(edu.cgpa)}</span>}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Experience */}
              {experience.length > 0 && (
                <section className="ru-section">
                  <div className="ru-section-head">
                    <div>
                      <h2 className="ru-section-title">Experience</h2>
                      <p className="ru-section-sub">
                        {isFresher ? "No prior work experience" : `${experience.length} position${experience.length !== 1 ? "s" : ""} found`}
                      </p>
                    </div>
                  </div>
                  {isFresher ? (
                    <div className="ru-fresher-card">
                      <div className="ru-fresher-icon">
                        <svg viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd"/></svg>
                      </div>
                      <div>
                        <h4>Fresher</h4>
                        <p>No prior work experience — ready to begin your professional journey!</p>
                      </div>
                    </div>
                  ) : (
                    <div className="ru-entry-list">
                      {experience.map((exp, i) => (
                        <div className="ru-entry-card" key={i}>
                          <div className="ru-entry-icon-col exp-col">
                            <svg viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M6 6V5a3 3 0 013-3h2a3 3 0 013 3v1h2a2 2 0 012 2v3.57A22.952 22.952 0 0110 13a22.95 22.95 0 01-8-1.43V8a2 2 0 012-2h2zm2-1a1 1 0 011-1h2a1 1 0 011 1v1H8V5zm1 5a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z" clipRule="evenodd"/><path d="M2 13.692V16a2 2 0 002 2h12a2 2 0 002-2v-2.308A24.974 24.974 0 0110 15c-2.796 0-5.487-.46-8-1.308z"/></svg>
                          </div>
                          <div className="ru-entry-body">
                            {exp.title && <h4 className="ru-entry-title">{safeStr(exp.title)}</h4>}
                            <div className="ru-entry-meta-row">
                              {exp.company  && <span className="ru-entry-company">{safeStr(exp.company)}</span>}
                              {exp.duration && <span className="ru-meta-pill">{safeStr(exp.duration)}</span>}
                            </div>
                            {exp.description && <p className="ru-entry-desc">{safeStr(exp.description)}</p>}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              )}

              {/* Projects */}
              {projects.length > 0 && (
                <section className="ru-section">
                  <div className="ru-section-head">
                    <div>
                      <h2 className="ru-section-title">Projects</h2>
                      <p className="ru-section-sub">{projects.length} project{projects.length !== 1 ? "s" : ""} found</p>
                    </div>
                    <span className="ru-count-badge">{projects.length}</span>
                  </div>
                  <div className="ru-entry-list">
                    {projects.map((proj, i) => (
                      <div className="ru-entry-card ru-project-card" key={i}>
                        <div className="ru-entry-icon-col proj-col">
                          <svg viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 4a1 1 0 011-1h4a1 1 0 010 2H6.414l2.293 2.293a1 1 0 11-1.414 1.414L5 6.414V8a1 1 0 01-2 0V4zm9 1a1 1 0 010-2h4a1 1 0 011 1v4a1 1 0 01-2 0V6.414l-2.293 2.293a1 1 0 11-1.414-1.414L13.586 5H12zm-9 7a1 1 0 012 0v1.586l2.293-2.293a1 1 0 111.414 1.414L6.414 15H8a1 1 0 010 2H4a1 1 0 01-1-1v-4zm13-1a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 010-2h1.586l-2.293-2.293a1 1 0 111.414-1.414L15 13.586V12a1 1 0 011-1z" clipRule="evenodd"/></svg>
                        </div>
                        <div className="ru-entry-body">
                          {proj.name && <h4 className="ru-entry-title">{safeStr(proj.name)}</h4>}
                          {proj.description && <p className="ru-entry-desc">{safeStr(proj.description)}</p>}
                          {toArray(proj.technologies).length > 0 && (
                            <div className="ru-tech-row">
                              {toArray(proj.technologies).map((tech, j) => <span className="ru-tech-pill" key={j}>{safeStr(tech)}</span>)}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Certifications */}
              {certifications.length > 0 && (
                <section className="ru-section">
                  <div className="ru-section-head">
                    <div>
                      <h2 className="ru-section-title">Certifications</h2>
                      <p className="ru-section-sub">{certifications.length} certification{certifications.length !== 1 ? "s" : ""} found</p>
                    </div>
                    <span className="ru-count-badge">{certifications.length}</span>
                  </div>
                  <div className="ru-list-grid">
                    {certifications.map((cert, i) => (
                      <div className="ru-list-item" key={i}>
                        <div className="ru-list-dot cert-dot" />
                        <span>{safeCertText(cert)}</span>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Achievements */}
              {achievements.length > 0 && (
                <section className="ru-section">
                  <div className="ru-section-head">
                    <div>
                      <h2 className="ru-section-title">Achievements</h2>
                      <p className="ru-section-sub">{achievements.length} achievement{achievements.length !== 1 ? "s" : ""} listed</p>
                    </div>
                  </div>
                  <div className="ru-list-grid">
                    {achievements.map((ach, i) => (
                      <div className="ru-list-item" key={i}>
                        <div className="ru-list-dot ach-dot" />
                        <span>{safeCertText(ach)}</span>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Recommendations */}
              {recommendations.length > 0 && (
                <section className="ru-section ru-reco-section">
                  <div className="ru-section-head">
                    <div>
                      <h2 className="ru-section-title">AI Recommendations</h2>
                      <p className="ru-section-sub">Tips to improve your resume</p>
                    </div>
                    <span className="ru-count-badge">{recommendations.length} tips</span>
                  </div>
                  <div className="ru-reco-list">
                    {recommendations.map((rec, i) => (
                      <div className="ru-reco-item" key={i}>
                        <div className="ru-reco-num">{i + 1}</div>
                        <p className="ru-reco-text">{safeCertText(rec)}</p>
                      </div>
                    ))}
                  </div>
                </section>
              )}

            </div>
          )}

          {/* Application Match Scores */}
          {applications.length > 0 && (
            <section className="ru-section ru-apps-section">
              <div className="ru-section-head">
                <div>
                  <h2 className="ru-section-title">Job Application Match Scores</h2>
                  <p className="ru-section-sub">Resume vs. job requirements for each application</p>
                </div>
                <span className="ru-count-badge">{applications.length}</span>
              </div>
              <div className="ru-app-grid">
                {applications.map((app) => (
                  <div className="ru-app-card" key={app._id}>
                    <div className="ru-app-card-head">
                      <div className="ru-app-job-info">
                        <h4>{safeStr(app.jobId?.title) || "Job Opening"}</h4>
                        <p>{safeStr(app.jobId?.company) || ""}</p>
                      </div>
                      <div
                        className="ru-match-ring"
                        style={{ background: `conic-gradient(${getScoreColor(app.matchScore)} ${(app.matchScore || 0) * 3.6}deg, #e2e8f0 0deg)` }}
                      >
                        <div className="ru-ring-inner"><span>{app.matchScore || 0}%</span></div>
                      </div>
                    </div>
                    <div className="ru-app-card-meta">
                      <span className={`ru-status-pill ${getScoreBadgeClass(app.matchScore)}`}>{getScoreLabel(app.matchScore)}</span>
                      <span className={`ru-app-status-pill ${(app.status || "").toLowerCase()}`}>{safeStr(app.status)}</span>
                    </div>
                    {toArray(app.matchedSkills).length > 0 && (
                      <div className="ru-skill-match-row">
                        <span className="ru-skill-match-label">Matched Skills</span>
                        <div className="ru-chips ru-chips-sm">
                          {toArray(app.matchedSkills).map((s, i) => <span className="ru-chip ru-chip-green" key={i}>{safeStr(s)}</span>)}
                        </div>
                      </div>
                    )}
                    {toArray(app.missingSkills).length > 0 && (
                      <div className="ru-skill-match-row">
                        <span className="ru-skill-match-label">Missing Skills</span>
                        <div className="ru-chips ru-chips-sm">
                          {toArray(app.missingSkills).map((s, i) => <span className="ru-chip ru-chip-red" key={i}>{safeStr(s)}</span>)}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

        </main>
      </div>
    </div>
  );
}

export default ResumeUpload;

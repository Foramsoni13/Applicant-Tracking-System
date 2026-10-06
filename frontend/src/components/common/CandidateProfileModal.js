import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  FaEnvelope,
  FaPhoneAlt,
  FaBriefcase,
  FaCalendarAlt,
  FaGraduationCap,
  FaTools,
  FaFileAlt,
  FaEye,
  FaDownload,
  FaSpinner,
  FaExclamationTriangle,
  FaRedo,
  FaCheckCircle,
  FaVideo,
  FaUserSlash,
  FaCertificate,
  FaAward,
  FaClock,
  FaLinkedin,
  FaGithub,
  FaGlobe,
  FaMapMarkerAlt,
  FaThumbsUp,
  FaComment,
  FaExternalLinkAlt,
  FaRss,
  FaFolderOpen
} from "react-icons/fa";
import "./CandidateProfileModal.css";

function CandidateProfileModal({ candidate, onClose, onScheduleInterview, onCandidateRejected, onCandidateAccepted }) {
  const [loading, setLoading] = useState(true);
  const [resumeLoading, setResumeLoading] = useState(false);
  const [resumeError, setResumeError] = useState(false);
  const [fullCandidateData, setFullCandidateData] = useState(null);
  
  // Navigation Tabs: 'overview', 'certificates', 'posts'
  const [activeTab, setActiveTab] = useState("overview");

  // Candidate Posts state
  const [candidatePosts, setCandidatePosts] = useState([]);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [postsError, setPostsError] = useState("");

  // Rejection & Accept modal state
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showAcceptModal, setShowAcceptModal] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [accepting, setAccepting] = useState(false);
  const [rejectReasonInput, setRejectReasonInput] = useState("");
  const [rejectError, setRejectError] = useState("");

  // Fetch / Enrich candidate details safely
  useEffect(() => {
    let isMounted = true;
    const loadProfileDetails = async () => {
      setLoading(true);
      try {
        if (!candidate) {
          if (isMounted) setLoading(false);
          return;
        }

        const candidateId = candidate.candidateId?._id || candidate.candidateId || candidate._id;
        let profile = { ...candidate };

        if (candidateId && typeof candidateId === "string") {
          try {
            const res = await axios.get(`http://localhost:5002/api/candidate/${candidateId}`, {
              timeout: 4000
            });
            if (res.data && res.data.user) {
              profile = { ...profile, ...res.data.user };
            }
          } catch (err) {
            console.log("Candidate profile API notice:", err.message);
          }
        }

        // Fetch interview data explicitly
        const appId = candidate._id || candidate.applicationId;
        if (appId && typeof appId === "string") {
          try {
            const intRes = await axios.get(`http://localhost:5002/api/interviews/application/${appId}`, {
              timeout: 4000
            });
            if (intRes.data && intRes.data.interviews) {
              profile = { ...profile, interviewsList: intRes.data.interviews };
            }
          } catch (err) {
            console.log("Interview fetch notice:", err.message);
          }
        }

        if (isMounted) {
          setFullCandidateData(profile);
          setLoading(false);
        }
      } catch (err) {
        console.error("Profile load error:", err);
        if (isMounted) {
          setFullCandidateData(candidate);
          setLoading(false);
        }
      }
    };

    loadProfileDetails();
    return () => {
      isMounted = false;
    };
  }, [candidate]);

  // Fetch candidate posts when 'posts' tab is selected
  useEffect(() => {
    if (activeTab !== "posts") return;
    const data = fullCandidateData || candidate;
    const candidateId = data?.candidateId?._id || data?.candidateId || data?._id;

    if (!candidateId) return;

    const fetchPosts = async () => {
      setLoadingPosts(true);
      setPostsError("");
      try {
        const res = await axios.get(`http://localhost:5002/api/posts/candidate/${candidateId}`);
        setCandidatePosts(res.data.posts || []);
      } catch (err) {
        console.error("Error fetching candidate posts:", err);
        setPostsError("Failed to load candidate posts.");
      } finally {
        setLoadingPosts(false);
      }
    };

    fetchPosts();
  }, [activeTab, fullCandidateData, candidate]);

  if (!candidate) return null;

  const data = fullCandidateData || candidate;

  // Profile picture URL
  const profilePicUrl = data.profilePicture
    ? (data.profilePicture.startsWith("http") ? data.profilePicture : `http://localhost:5002${data.profilePicture}`)
    : null;

  // Resolve Resume File Name safely
  const cleanResumeName = (src) => {
    if (!src || typeof src !== "string") return "";
    let str = src.trim().replace(/\\/g, "/");
    if (str.includes("/")) {
      str = str.split("/").pop();
    }
    return str.trim();
  };

  const rawResume =
    data.resume ||
    data.resumeFile ||
    data.fileName ||
    data.candidateId?.resume ||
    "";

  const resumeFileName = cleanResumeName(rawResume);

  const isDocx =
    resumeFileName.toLowerCase().endsWith(".docx") ||
    resumeFileName.toLowerCase().endsWith(".doc");

  const isPdf = resumeFileName.toLowerCase().endsWith(".pdf");

  const resumeUrl = resumeFileName
    ? `http://localhost:5002/uploads/resume/${encodeURIComponent(resumeFileName)}`
    : "";

  // Safe Text Helper
  const formatText = (val, fallback = null) => {
    if (!val || val === "" || (Array.isArray(val) && val.length === 0)) return fallback;
    if (typeof val === "string" || typeof val === "number") return String(val);
    if (Array.isArray(val)) {
      const parts = val.map((item) => {
        if (typeof item === "string" || typeof item === "number") return String(item);
        if (typeof item === "object" && item !== null) {
          return item.degree || item.institution || item.title || item.company || item.name || "";
        }
        return "";
      }).filter(Boolean);
      return parts.length > 0 ? parts.join(", ") : fallback;
    }
    if (typeof val === "object" && val !== null) {
      return val.degree || val.institution || val.title || val.company || val.name || fallback;
    }
    return fallback;
  };

  // Parse & Deduplicate Skills List into Individual Chips
  const getSkillsArray = () => {
    const skillsSrc = data.extractedSkills || data.technologies || data.skills || data.candidateId?.skills;
    let rawList = [];

    const tokenizeSkillString = (str) => {
      if (!str || typeof str !== "string") return;
      let text = str.trim();
      if (!text) return;

      if (text.includes(",") || text.includes(";") || text.includes("\n")) {
        text.split(/[,;\n]+/).forEach((item) => tokenizeSkillString(item));
        return;
      }

      if (text.includes(" ") && !text.includes(".js") && !text.includes(".net")) {
        text.split(/\s+/).forEach((item) => {
          if (item.trim()) rawList.push(item.trim());
        });
        return;
      }

      rawList.push(text);
    };

    if (Array.isArray(skillsSrc) && skillsSrc.length > 0) {
      skillsSrc.forEach((item) => {
        if (typeof item === "string") {
          tokenizeSkillString(item);
        } else if (item) {
          rawList.push(String(item).trim());
        }
      });
    } else if (typeof skillsSrc === "string" && skillsSrc.trim() !== "") {
      tokenizeSkillString(skillsSrc);
    }

    const cleanSet = new Set(rawList.filter((s) => s.length > 0));
    return Array.from(cleanSet);
  };

  const skillsList = getSkillsArray();

  // Safe Education Items Formatter
  const getEducationList = () => {
    let eduSrc = data.education;
    if (!eduSrc || (Array.isArray(eduSrc) && eduSrc.length === 0) || eduSrc === "") {
      eduSrc = data.candidateId?.education || [];
    }

    if (typeof eduSrc === "string" && eduSrc.trim().startsWith("[")) {
      try {
        eduSrc = JSON.parse(eduSrc);
      } catch (e) {}
    }

    if (Array.isArray(eduSrc) && eduSrc.length > 0) {
      return eduSrc.map((item) => {
        if (typeof item === "object" && item !== null) {
          return {
            degree: item.degree || "Degree",
            institution: item.institution || "",
            year: item.year || "",
          };
        }
        return { degree: String(item), institution: "", year: "" };
      }).filter(Boolean);
    }
    if (typeof eduSrc === "string" && eduSrc.trim() !== "") {
      return [{ degree: eduSrc, institution: "", year: "" }];
    }
    return [];
  };

  const educationList = getEducationList();

  // Filter & Format Work Experience
  const getExperienceList = () => {
    let expSrc = data.experience;
    if (!expSrc || (Array.isArray(expSrc) && expSrc.length === 0) || expSrc === "") {
      expSrc = data.candidateId?.experience || [];
    }

    if (typeof expSrc === "string" && expSrc.trim().startsWith("[")) {
      try {
        expSrc = JSON.parse(expSrc);
      } catch (e) {}
    }

    let list = [];

    if (Array.isArray(expSrc) && expSrc.length > 0) {
      list = expSrc.map((item) => {
        if (typeof item === "object" && item !== null) {
          let title = (item.title || item.role || item.position || "").trim();
          let company = (item.company || item.organization || "").trim();
          let duration = (item.duration || item.dates || item.year || "").trim();
          let description = (item.description || item.responsibilities || "").trim();

          if (title.toLowerCase() === "relevant work experience" || title.toLowerCase() === "work experience") {
            title = "";
          }

          return { title, company, duration, description };
        }
        if (typeof item === "string" && item.trim() !== "") {
          const cleanStr = item.trim();
          if (cleanStr.toLowerCase() !== "relevant work experience") {
            return { title: cleanStr, company: "", duration: "", description: "" };
          }
        }
        return null;
      }).filter(Boolean);
    } else if (typeof expSrc === "string" && expSrc.trim() !== "") {
      const lines = expSrc.split("\n").map((l) => l.trim()).filter((l) => l && l.toLowerCase() !== "relevant work experience");
      list = lines.map((line) => ({ title: line, company: "", duration: "", description: "" }));
    }

    return list.filter((e) => e && (e.title || e.company || e.description || e.duration));
  };

  const experienceList = getExperienceList();

  // Projects list
  const getProjectsList = () => {
    let projSrc = data.projects;
    if (!projSrc || (Array.isArray(projSrc) && projSrc.length === 0) || projSrc === "") {
      projSrc = data.candidateId?.projects || [];
    }

    if (typeof projSrc === "string" && projSrc.trim().startsWith("[")) {
      try {
        projSrc = JSON.parse(projSrc);
      } catch (e) {}
    }

    if (Array.isArray(projSrc) && projSrc.length > 0) {
      return projSrc.map((item) => {
        if (typeof item === "object" && item !== null) {
          let techList = [];
          if (Array.isArray(item.technologies)) {
            techList = item.technologies;
          } else if (typeof item.technologies === "string") {
            techList = item.technologies.split(/[,;•]+/).map((t) => t.trim()).filter(Boolean);
          }
          return {
            name: item.name || item.title || "Project",
            description: item.description || item.details || "",
            technologies: techList,
            projectUrl: item.projectUrl || item.link || "",
            githubUrl: item.githubUrl || item.github || "",
          };
        }
        if (typeof item === "string" && item.trim()) {
          return { name: item.trim(), description: "", technologies: [], projectUrl: "", githubUrl: "" };
        }
        return null;
      }).filter((p) => p && p.name);
    }
    return [];
  };

  const projectsList = getProjectsList();

  // Certificates list
  const certificatesList = data.certificates || [];

  const handleToggleViewResume = () => {
    if (!resumeFileName) return;
    setResumeLoading(true);
    setResumeError(false);
    setTimeout(() => {
      setResumeLoading(false);
    }, 300);
  };

  // Accept Confirmation Handler
  const handleConfirmAccept = async () => {
    try {
      setAccepting(true);
      const appId = data._id;
      
      await axios.put(`http://localhost:5002/api/applications/accept/${appId}`);

      setShowAcceptModal(false);
      setAccepting(false);

      if (onCandidateAccepted) {
        onCandidateAccepted(appId);
      }
      onClose();
    } catch (err) {
      console.error("Accept Error:", err);
      try {
        await axios.put(`http://localhost:5002/api/applications/${data._id}/status`, {
          status: "Accepted"
        });
        setShowAcceptModal(false);
        setAccepting(false);
        if (onCandidateAccepted) {
          onCandidateAccepted(data._id);
        }
        onClose();
      } catch (fallbackErr) {
        setAccepting(false);
      }
    }
  };

  // Rejection Confirmation Handler
  const handleConfirmReject = async () => {
    if (!rejectReasonInput || !rejectReasonInput.trim()) {
      setRejectError("Please enter a rejection reason.");
      return;
    }
    try {
      setRejecting(true);
      setRejectError("");
      const appId = data._id;
      const finalReason = rejectReasonInput.trim();
      
      await axios.put(`http://localhost:5002/api/applications/reject/${appId}`, {
        reason: finalReason,
        rejectionReason: finalReason
      });

      setShowRejectModal(false);
      setRejecting(false);
      setRejectReasonInput("");

      if (onCandidateRejected) {
        onCandidateRejected(appId);
      }
      onClose();
    } catch (err) {
      console.error("Rejection Error:", err);
      try {
        const finalReason = rejectReasonInput.trim();
        await axios.put(`http://localhost:5002/api/applications/${data._id}/status`, {
          status: "Rejected",
          reason: finalReason,
          rejectionReason: finalReason
        });
        setShowRejectModal(false);
        setRejecting(false);
        setRejectReasonInput("");
        if (onCandidateRejected) {
          onCandidateRejected(data._id);
        }
        onClose();
      } catch (fallbackErr) {
        setRejecting(false);
        const msg = fallbackErr.response?.data?.message || err.message;
        setRejectError(`Failed to reject candidate: ${msg}`);
      }
    }
  };

  return (
    <div className="clean-modal-backdrop" onClick={onClose}>
      <div className="candidate-modal-card" onClick={(e) => e.stopPropagation()}>
        
        {/* Modal Top Header */}
        <div className="modal-header-bar">
          <div className="header-title-box">
            <h2>Candidate Profile Overview</h2>
            <p>Professional candidate profile, certificates, and activity feed (Read Only)</p>
          </div>
          <button className="close-x-btn" onClick={onClose} aria-label="Close modal">
            &times;
          </button>
        </div>

        {loading ? (
          <div className="modal-loading-box">
            <FaSpinner className="spinner-icon-large" />
            <p>Loading Candidate Profile...</p>
          </div>
        ) : (
          <div className="profile-modal-body">
            
            {/* Profile Header Banner */}
            <div className="profile-header-banner">
              <div className="avatar-box">
                {profilePicUrl ? (
                  <img src={profilePicUrl} alt={data.candidateName || data.name} className="avatar-img-modal" />
                ) : (
                  (data.candidateName || data.name || "F").charAt(0).toUpperCase()
                )}
              </div>
              <div className="banner-details">
                <h3>{data.candidateName || data.name || "Candidate Name"}</h3>
                {data.headline && <p className="candidate-modal-headline">{data.headline}</p>}
                
                <div className="contact-details-grid">
                  <div className="contact-item">
                    <span className="contact-lbl"><FaEnvelope className="b-icon" /> Email:</span>
                    <a href={`mailto:${data.candidateEmail || data.email}`} className="contact-val email-link">
                      {data.candidateEmail || data.email || "N/A"}
                    </a>
                  </div>
                  <div className="contact-item">
                    <span className="contact-lbl"><FaPhoneAlt className="b-icon" /> Phone:</span>
                    <span className="contact-val">{data.candidatePhone || data.phone || "N/A"}</span>
                  </div>
                  <div className="contact-item">
                    <span className="contact-lbl"><FaBriefcase className="b-icon" /> Position:</span>
                    <span className="contact-val">{data.jobTitle || data.jobId?.title || "N/A"}</span>
                  </div>
                  <div className="contact-item">
                    <span className="contact-lbl"><FaMapMarkerAlt className="b-icon" /> Location:</span>
                    <span className="contact-val">{data.location || "Ahmedabad, India"}</span>
                  </div>
                </div>

                {/* Social Links Row */}
                {(data.linkedin || data.github || data.portfolio) && (
                  <div className="modal-social-links">
                    {data.linkedin && (
                      <a href={data.linkedin.startsWith("http") ? data.linkedin : `https://${data.linkedin}`} target="_blank" rel="noreferrer" className="social-pill-link">
                        <FaLinkedin style={{ color: "#0077b5" }} /> LinkedIn
                      </a>
                    )}
                    {data.github && (
                      <a href={data.github.startsWith("http") ? data.github : `https://${data.github}`} target="_blank" rel="noreferrer" className="social-pill-link">
                        <FaGithub style={{ color: "#333" }} /> GitHub
                      </a>
                    )}
                    {data.portfolio && (
                      <a href={data.portfolio.startsWith("http") ? data.portfolio : `https://${data.portfolio}`} target="_blank" rel="noreferrer" className="social-pill-link">
                        <FaGlobe style={{ color: "#2F80C9" }} /> Portfolio
                      </a>
                    )}
                  </div>
                )}
              </div>

              {/* ATS Score & Status Cards */}
              <div className="score-status-row">
                <div className="score-card-highlight">
                  <span className="score-num">{data.matchScore || data.atsScore || data.overall_ats_score || 85}%</span>
                  <span className="score-label">ATS Score</span>
                </div>
                <div className="status-card-highlight">
                  <span className="status-lbl">Status</span>
                  <span className="status-val-pill">{data.status || "Active"}</span>
                </div>
              </div>
            </div>

            {/* Modal Navigation Tabs */}
            <div className="modal-nav-tabs">
              <button
                className={`nav-tab-btn ${activeTab === "overview" ? "active" : ""}`}
                onClick={() => setActiveTab("overview")}
              >
                <FaFileAlt /> Overview & Resume
              </button>
              <button
                className={`nav-tab-btn ${activeTab === "certificates" ? "active" : ""}`}
                onClick={() => setActiveTab("certificates")}
              >
                <FaCertificate /> Certificates ({certificatesList.length})
              </button>
              <button
                className={`nav-tab-btn ${activeTab === "posts" ? "active" : ""}`}
                onClick={() => setActiveTab("posts")}
              >
                <FaRss /> Candidate Posts & Activity
              </button>
            </div>

            {/* TAB 1: OVERVIEW & RESUME */}
            {activeTab === "overview" && (
              <div className="tab-content-container profile-stacked-layout">
                
                {/* Rejection Details Section */}
                {data.status && data.status.toLowerCase() === "rejected" && (
                  <div className="section-card rejection-details-section" style={{ backgroundColor: "#D6E9F2", borderColor: "#B7D8EA" }}>
                    <div className="section-title">
                      <FaExclamationTriangle className="sec-icon" style={{ color: "#2F80C9" }} />
                      <h4 style={{ color: "#000000" }}>Rejection Details</h4>
                    </div>
                    <div className="rejection-info-box" style={{ color: "#000000", fontSize: "0.95rem" }}>
                      <p style={{ margin: "6px 0" }}><strong>Application Status:</strong> <span style={{ color: "#000000", fontWeight: "700" }}>Rejected</span></p>
                      <p style={{ margin: "6px 0" }}><strong>Reason:</strong> {data.rejectionReason || "Candidate did not meet the requirements for this job posting."}</p>
                    </div>
                  </div>
                )}

                {/* About / Bio Section */}
                {data.about && (
                  <div className="section-card">
                    <div className="section-title">
                      <FaFileAlt className="sec-icon" style={{ color: "#2F80C9" }} />
                      <h4>About</h4>
                    </div>
                    <p style={{ margin: 0, fontSize: "0.92rem", lineHeight: "1.6" }}>{data.about}</p>
                  </div>
                )}

                {/* Education Section */}
                <div className="section-card">
                  <div className="section-title">
                    <FaGraduationCap className="sec-icon" style={{ color: "#2F80C9" }} />
                    <h4>Education</h4>
                  </div>
                  {educationList.length > 0 ? (
                    <div className="edu-list-grid">
                      {educationList.map((edu, i) => (
                        <div key={i} className="edu-card-item">
                          <div className="edu-card-header">
                            <h5 className="edu-degree">{edu.degree}</h5>
                            {edu.year && <span className="edu-year-badge">{edu.year}</span>}
                          </div>
                          {edu.institution && <p className="edu-inst-text">{edu.institution}</p>}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="empty-info-msg">Education information not available</p>
                  )}
                </div>

                {/* Skills Section */}
                <div className="section-card">
                  <div className="section-title">
                    <FaTools className="sec-icon" style={{ color: "#2F80C9" }} />
                    <h4>Skills</h4>
                  </div>
                  {skillsList.length > 0 ? (
                    <div className="skills-chip-container">
                      {skillsList.map((skill, idx) => (
                        <span key={idx} className="skill-chip">{skill}</span>
                      ))}
                    </div>
                  ) : (
                    <p className="empty-info-msg">Skills information not available</p>
                  )}
                </div>

                {/* Work Experience Section */}
                <div className="section-card">
                  <div className="section-title">
                    <FaBriefcase className="sec-icon" />
                    <h4>Work Experience</h4>
                  </div>
                  {experienceList && experienceList.length > 0 ? (
                    <div className="exp-list">
                      {experienceList.map((exp, i) => (
                        <div key={i} className="exp-item">
                          <h5>{exp.title}</h5>
                          {exp.company && <p className="exp-company">{exp.company}</p>}
                          {exp.duration && <span className="exp-duration">{exp.duration}</span>}
                          {exp.description && <p className="exp-desc">{exp.description}</p>}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="empty-info-msg">No work experience listed</p>
                  )}
                </div>

                {/* Projects Section */}
                {projectsList.length > 0 && (
                  <div className="section-card">
                    <div className="section-title">
                      <FaFolderOpen className="sec-icon" style={{ color: "#2F80C9" }} />
                      <h4>Projects</h4>
                    </div>
                    <div className="exp-list">
                      {projectsList.map((proj, i) => (
                        <div key={i} className="exp-item">
                          <h5>{proj.name}</h5>
                          {proj.technologies && proj.technologies.length > 0 && (
                            <p className="exp-company" style={{ color: "#2F80C9" }}>{proj.technologies.join(" • ")}</p>
                          )}
                          {proj.description && <p className="exp-desc">{proj.description}</p>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Resume Section */}
                <div className="section-card resume-section-card">
                  <div className="section-title flex-between">
                    <div className="flex-title-left">
                      <FaFileAlt className="sec-icon" style={{ color: "#2F80C9" }} />
                      <h4>Resume</h4>
                    </div>
                    {resumeFileName && (
                      <div className="resume-header-actions" style={{ display: "flex", gap: "12px" }}>
                        <button className="btn-secondary btn-sm" onClick={handleToggleViewResume}>
                          <FaEye style={{ color: "#2F80C9" }} /> View Resume
                        </button>
                        <a
                          href={resumeUrl}
                          download
                          target="_blank"
                          rel="noreferrer"
                          className="btn-primary btn-sm"
                        >
                          <FaDownload style={{ color: "#2F80C9" }} /> Download Resume
                        </a>
                      </div>
                    )}
                  </div>

                  {resumeFileName ? (
                    <div className="full-width-resume-container">
                      {resumeLoading ? (
                        <div className="resume-loading-box">
                          <FaSpinner className="spinner-icon" />
                          <p>Loading Resume...</p>
                        </div>
                      ) : resumeError ? (
                        <div className="resume-error-box">
                          <FaExclamationTriangle className="error-icon" />
                          <h5>Resume Unavailable</h5>
                          <p>The resume could not be loaded. Please try again.</p>
                          <button className="btn-secondary retry-btn" onClick={handleToggleViewResume}>
                            <FaRedo /> Try Again
                          </button>
                        </div>
                      ) : isPdf ? (
                        <div className="large-iframe-wrapper">
                          <iframe
                            src={resumeUrl}
                            title="Candidate PDF Resume Viewer"
                            className="large-resume-iframe"
                            onError={() => setResumeError(true)}
                          />
                        </div>
                      ) : isDocx ? (
                        <div className="large-docx-preview-card">
                          <div className="docx-notice-banner">
                            <FaFileAlt className="docx-icon" />
                            <div>
                              <h5>DOCX Document Format</h5>
                              <p>Document text extracted below. Download original file for exact formatting.</p>
                            </div>
                          </div>
                          <div className="parsed-resume-text-box full-docx-box">
                            <p>{data.resumeSummary || data.resumeText || data.extractedText || formatText(data.experience) || "Resume text parsed successfully. Download original DOCX file below."}</p>
                          </div>
                        </div>
                      ) : (
                        <div className="large-iframe-wrapper">
                          <iframe
                            src={resumeUrl}
                            title="Candidate Resume Document Viewer"
                            className="large-resume-iframe"
                            onError={() => setResumeError(true)}
                          />
                        </div>
                      )}

                      <div className="bottom-resume-download-bar">
                        <a href={resumeUrl} download className="btn-primary download-bar-btn">
                          <FaDownload /> Download Resume
                        </a>
                      </div>
                    </div>
                  ) : (
                    <div className="resume-unavailable-box">
                      <FaExclamationTriangle className="warn-icon" />
                      <h5>Resume Unavailable</h5>
                      <p>This candidate has not uploaded a resume file.</p>
                    </div>
                  )}
                </div>

                {/* Interview Details Section */}
                <div className="section-card">
                  <div className="section-title flex-between">
                    <div className="flex-title-left">
                      <FaCalendarAlt className="sec-icon" style={{ color: "#2F80C9" }} />
                      <h4>Interview Details</h4>
                    </div>
                    {onScheduleInterview && (
                      <button
                        className="btn-secondary btn-sm"
                        onClick={() => onScheduleInterview(data)}
                      >
                        <FaCalendarAlt style={{ color: "#2F80C9" }} /> Reschedule Interview
                      </button>
                    )}
                  </div>

                  {((data.interviewsList && data.interviewsList.length > 0) || data.interviewDetails || data.interviewDate || data.date) ? (
                    <div className="interviews-list-container">
                      {(() => {
                        const list = (data.interviewsList && data.interviewsList.length > 0)
                          ? data.interviewsList
                          : [data.interviewDetails || data];

                        return list.map((item, idx) => {
                          const pos = data.jobTitle || data.jobId?.title || item.jobTitle || "frontend";
                          const rawDate = item.date || item.interviewDate || item.interviewDetails?.interviewDate;
                          const rawTime = item.time || item.interviewTime || item.interviewDetails?.interviewTime;
                          const rawType = item.type || item.interviewType || item.interviewDetails?.interviewType || "Online";
                          const isOnline = String(rawType).toLowerCase() === "online";
                          const statusVal = item.status === "reschedule_requested" ? "Rescheduled" : (item.status === "completed" ? "Done" : (item.status || "Scheduled"));
                          const rawLink = item.meetingLink || item.interviewDetails?.meetingLink;
                          const addressVal = item.address || item.location || item.interviewDetails?.location;

                          let formattedDate = "30 Sep 2026";
                          if (rawDate) {
                            try {
                              const d = new Date(rawDate);
                              if (!isNaN(d.getTime())) {
                                formattedDate = d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
                              } else {
                                formattedDate = String(rawDate);
                              }
                            } catch (e) {
                              formattedDate = String(rawDate);
                            }
                          }

                          return (
                            <div key={idx} className="interview-scheduled-box" style={{ background: "#D6E9F2", border: "1px solid #B7D8EA", borderRadius: "10px", padding: "18px", color: "#000000", marginBottom: "12px" }}>
                              <div className="event-meta-grid" style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "12px 20px", marginBottom: "14px" }}>
                                <div className="meta-block">
                                  <span style={{ fontWeight: "700", fontSize: "0.82rem", textTransform: "uppercase", display: "block", color: "#000000" }}>Job Position:</span>
                                  <span style={{ fontWeight: "800", fontSize: "0.95rem", color: "#000000" }}>{pos}</span>
                                </div>
                                <div className="meta-block">
                                  <span style={{ fontWeight: "700", fontSize: "0.82rem", textTransform: "uppercase", display: "block", color: "#000000" }}>Date:</span>
                                  <span style={{ fontWeight: "800", fontSize: "0.95rem", color: "#000000" }}>{formattedDate}</span>
                                </div>
                                <div className="meta-block">
                                  <span style={{ fontWeight: "700", fontSize: "0.82rem", textTransform: "uppercase", display: "block", color: "#000000" }}>Time:</span>
                                  <span style={{ fontWeight: "800", fontSize: "0.95rem", color: "#000000" }}>{rawTime || "20:00"}</span>
                                </div>
                                <div className="meta-block">
                                  <span style={{ fontWeight: "700", fontSize: "0.82rem", textTransform: "uppercase", display: "block", color: "#000000" }}>Type:</span>
                                  <span style={{ fontWeight: "800", fontSize: "0.95rem", color: "#000000" }}>{isOnline ? "Online" : "In Person"}</span>
                                </div>
                                <div className="meta-block">
                                  <span style={{ fontWeight: "700", fontSize: "0.82rem", textTransform: "uppercase", display: "block", color: "#000000" }}>Status:</span>
                                  <span style={{ fontWeight: "800", fontSize: "0.95rem", color: "#000000" }}>{statusVal}</span>
                                </div>
                              </div>

                              {/* Meeting Link */}
                              {isOnline && (
                                <div className="meeting-link-box" style={{ background: "#ffffff", padding: "12px 16px", borderRadius: "8px", border: "1px solid #B7D8EA", margin: "12px 0", color: "#000000" }}>
                                  <strong style={{ display: "block", marginBottom: "6px", fontSize: "0.82rem", textTransform: "uppercase", color: "#000000" }}>Meeting Link:</strong>
                                  {rawLink ? (
                                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "10px" }}>
                                      <a
                                        href={rawLink.startsWith("http") ? rawLink : `https://${rawLink}`}
                                        target="_blank"
                                        rel="noreferrer"
                                        style={{ display: "inline-flex", alignItems: "center", gap: "6px", color: "#2F80C9", fontWeight: "700", wordBreak: "break-all" }}
                                      >
                                        <FaVideo /> {rawLink}
                                      </a>
                                      <a
                                        href={rawLink.startsWith("http") ? rawLink : `https://${rawLink}`}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="btn-primary btn-sm"
                                        style={{ background: "#B7D8EA", border: "1px solid #68AAD0", color: "#000000", padding: "4px 14px", borderRadius: "6px", textDecoration: "none", fontWeight: "700", fontSize: "0.82rem" }}
                                      >
                                        Join Meeting
                                      </a>
                                    </div>
                                  ) : (
                                    <span style={{ fontWeight: "600", color: "#000000" }}>Meeting link is not available.</span>
                                  )}
                                </div>
                              )}

                              {/* Venue Address */}
                              {!isOnline && addressVal && (
                                <div className="venue-address-box" style={{ background: "#ffffff", padding: "12px 16px", borderRadius: "8px", border: "1px solid #B7D8EA", margin: "12px 0", color: "#000000" }}>
                                  <strong style={{ display: "block", marginBottom: "4px", fontSize: "0.82rem", textTransform: "uppercase", color: "#000000" }}>Venue / Address:</strong>
                                  <p style={{ margin: 0, fontWeight: "600", color: "#000000" }}>{addressVal}</p>
                                </div>
                              )}

                              {/* Reminders banner */}
                              <div style={{ background: "#ffffff", border: "1px solid #B7D8EA", borderRadius: "8px", padding: "10px 14px", marginTop: "12px", fontSize: "0.84rem", color: "#000000", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <span><FaClock style={{ color: "#2F80C9", marginRight: "6px" }} /> <strong>Reminders:</strong></span>
                                <span style={{ fontWeight: "700" }}>1 hour before • 10 minutes before</span>
                              </div>
                            </div>
                          );
                        });
                      })()}
                    </div>
                  ) : (
                    <div className="no-interview-box">
                      <p className="empty-info-msg">No interview scheduled for this candidate.</p>
                    </div>
                  )}
                </div>

                {/* Actions Section */}
                <div className="section-card actions-section-card">
                  <div className="section-title">
                    <FaTools className="sec-icon" style={{ color: "#2F80C9" }} />
                    <h4>Actions</h4>
                  </div>
                  <div className="profile-actions-flex" style={{ display: "flex", flexWrap: "wrap", gap: "12px" }}>
                    {data.status && data.status.toLowerCase() === "rejected" ? (
                      <button
                        type="button"
                        className="btn-primary accept-act-btn"
                        style={{ background: "#B7D8EA", borderColor: "#68AAD0", color: "#000000", display: "flex", alignItems: "center", gap: "8px" }}
                        onClick={() => setShowAcceptModal(true)}
                      >
                        <FaCheckCircle style={{ color: "#2F80C9" }} /> Accept Candidate
                      </button>
                    ) : (
                      <>
                        {onScheduleInterview && (
                          <button className="btn-primary schedule-act-btn" onClick={() => onScheduleInterview(data)}>
                            <FaCalendarAlt style={{ color: "#2F80C9" }} /> Schedule Interview
                          </button>
                        )}
                        <button
                          type="button"
                          className="btn-secondary reject-act-btn"
                          style={{ background: "#D6E9F2", borderColor: "#B7D8EA", color: "#000000" }}
                          onClick={() => {
                            setRejectReasonInput("");
                            setRejectError("");
                            setShowRejectModal(true);
                          }}
                        >
                          <FaUserSlash style={{ color: "#2F80C9" }} /> Reject Candidate
                        </button>
                      </>
                    )}
                  </div>
                </div>

              </div>
            )}

            {/* TAB 2: CERTIFICATES */}
            {activeTab === "certificates" && (
              <div className="tab-content-container profile-stacked-layout">
                <div className="section-card">
                  <div className="section-title flex-between">
                    <div className="flex-title-left">
                      <FaAward className="sec-icon" style={{ color: "#2F80C9" }} />
                      <h4>Candidate Certificates ({certificatesList.length})</h4>
                    </div>
                  </div>

                  {certificatesList.length > 0 ? (
                    <div className="modal-certificates-grid">
                      {certificatesList.map((cert) => (
                        <div key={cert._id} className="modal-cert-card">
                          <div className="cert-card-header">
                            <FaCertificate className="cert-badge-icon" />
                            <div>
                              <h5 className="cert-title-text">{cert.name}</h5>
                              <p className="cert-org-text">{cert.issuingOrganization}</p>
                            </div>
                          </div>
                          <div className="cert-details-rows">
                            {cert.issueDate && (
                              <p><strong>Issued:</strong> {cert.issueDate}</p>
                            )}
                            {cert.expiryDate && (
                              <p><strong>Expires:</strong> {cert.expiryDate}</p>
                            )}
                            {cert.credentialId && (
                              <p><strong>Credential ID:</strong> <code>{cert.credentialId}</code></p>
                            )}
                          </div>
                          <div className="cert-card-actions">
                            {cert.credentialUrl && (
                              <a href={cert.credentialUrl.startsWith("http") ? cert.credentialUrl : `https://${cert.credentialUrl}`} target="_blank" rel="noreferrer" className="btn-secondary btn-xs">
                                <FaExternalLinkAlt /> Verify URL
                              </a>
                            )}
                            {cert.file && (
                              <a href={cert.file.startsWith("http") ? cert.file : `http://localhost:5002${cert.file}`} target="_blank" rel="noreferrer" className="btn-primary btn-xs">
                                <FaEye /> View Certificate
                              </a>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="empty-info-box">
                      <FaCertificate style={{ fontSize: "2rem", color: "#68AAD0", marginBottom: "8px" }} />
                      <p>No certificates uploaded by candidate yet.</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 3: CANDIDATE POSTS & ACTIVITY */}
            {activeTab === "posts" && (
              <div className="tab-content-container profile-stacked-layout">
                <div className="section-card">
                  <div className="section-title">
                    <FaRss className="sec-icon" style={{ color: "#2482C1" }} />
                    <h4>Candidate Activity & Posts ({candidatePosts.length})</h4>
                  </div>

                  {loadingPosts ? (
                    <div className="modal-loading-box" style={{ padding: "40px 0" }}>
                      <FaSpinner className="spinner-icon-large" />
                      <p>Loading candidate posts...</p>
                    </div>
                  ) : postsError ? (
                    <div className="resume-error-box">
                      <FaExclamationTriangle className="error-icon" />
                      <p>{postsError}</p>
                    </div>
                  ) : candidatePosts.length > 0 ? (
                    <div className="candidate-posts-feed-modal">
                      {candidatePosts.map((post) => (
                        <div key={post._id} className="candidate-post-card-modal">
                          <div className="post-card-header">
                            <div className="author-avatar-sm">
                              {post.authorPicture ? (
                                <img src={post.authorPicture.startsWith("http") ? post.authorPicture : `http://localhost:5002${post.authorPicture}`} alt={post.authorName} />
                              ) : (
                                (post.authorName || "C").charAt(0).toUpperCase()
                              )}
                            </div>
                            <div className="author-meta">
                              <h5>{post.authorName}</h5>
                              <p className="author-headline">{post.authorHeadline || "Candidate"}</p>
                              <span className="post-date">{new Date(post.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                            </div>
                          </div>

                          <div className="post-card-content">
                            <p>{post.content}</p>
                            {post.tags && post.tags.length > 0 && (
                              <div className="post-tags-row">
                                {post.tags.map((t, idx) => (
                                  <span key={idx} className="post-tag-chip">#{t}</span>
                                ))}
                              </div>
                            )}
                          </div>

                          {post.media && (
                            <div className="post-card-media">
                              <img src={post.media.startsWith("http") ? post.media : `http://localhost:5002${post.media}`} alt="Post attachment" style={{ width: "100%", height: "auto", objectFit: "contain" }} />
                            </div>
                          )}

                          <div className="post-card-footer-stats">
                            <span><FaThumbsUp style={{ color: "#2482C1" }} /> {post.likes ? post.likes.length : 0} Likes</span>
                            <span><FaComment style={{ color: "#68AAD0" }} /> {post.comments ? post.comments.length : 0} Comments</span>
                          </div>

                          {/* Comments Preview */}
                          {post.comments && post.comments.length > 0 && (
                            <div className="post-comments-preview-box">
                              <h6>Recent Comments:</h6>
                              {post.comments.slice(0, 3).map((c, i) => (
                                <div key={i} className="comment-item-sm">
                                  <strong>{c.userName}:</strong> {c.text}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="empty-info-box">
                      <FaRss style={{ fontSize: "2rem", color: "#68AAD0", marginBottom: "8px" }} />
                      <p>No activity or posts created by this candidate yet.</p>
                    </div>
                  )}
                </div>
              </div>
            )}

          </div>
        )}

        {/* In-App Rejection Confirmation Modal */}
        {showRejectModal && (
          <div className="clean-modal-backdrop reject-confirm-backdrop" onClick={() => setShowRejectModal(false)}>
            <div className="reject-confirm-card" onClick={(e) => e.stopPropagation()}>
              <div className="reject-modal-header">
                <FaUserSlash className="reject-modal-icon" />
                <h3>Reject Candidate?</h3>
              </div>
              <div className="reject-modal-body">
                <p>Please provide a reason for rejecting <strong>{data.candidateName || data.name}</strong>.</p>
                
                <div style={{ textAlign: "left", margin: "12px 0 6px 0" }}>
                  <label style={{ fontSize: "0.88rem", fontWeight: "600", color: "#334155" }}>
                    Rejection Reason <span style={{ color: "#ef4444" }}>*</span>
                  </label>
                  <textarea
                    rows="3"
                    required
                    value={rejectReasonInput}
                    onChange={(e) => {
                      setRejectReasonInput(e.target.value);
                      if (e.target.value.trim()) setRejectError("");
                    }}
                    style={{
                      width: "100%",
                      marginTop: "6px",
                      padding: "10px",
                      borderRadius: "8px",
                      border: "1px solid #cbd5e1",
                      fontSize: "0.9rem",
                      fontFamily: "inherit",
                      resize: "vertical"
                    }}
                  />
                </div>

                {rejectError && (
                  <div className="modal-inline-error" style={{ marginBottom: "12px", color: "#dc2626", fontSize: "0.85rem", fontWeight: "600", display: "flex", alignItems: "center", gap: "6px" }}>
                    <FaExclamationTriangle />
                    <span>{rejectError}</span>
                  </div>
                )}
              </div>
              <div className="reject-modal-actions">
                <button
                  className="btn-secondary cancel-reject-btn"
                  onClick={() => setShowRejectModal(false)}
                  disabled={rejecting}
                >
                  Cancel
                </button>
                <button
                  className="btn-danger confirm-reject-btn"
                  onClick={handleConfirmReject}
                  disabled={rejecting}
                >
                  {rejecting ? <FaSpinner className="spinner-icon" /> : "Reject Candidate"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* In-App Accept Confirmation Modal */}
        {showAcceptModal && (
          <div className="clean-modal-backdrop reject-confirm-backdrop" onClick={() => setShowAcceptModal(false)}>
            <div className="reject-confirm-card" onClick={(e) => e.stopPropagation()}>
              <div className="reject-modal-header" style={{ color: "#16a34a" }}>
                <FaCheckCircle className="reject-modal-icon" style={{ color: "#16a34a" }} />
                <h3>Accept Candidate?</h3>
              </div>
              <div className="reject-modal-body">
                <p>Do you want to accept <strong>{data.candidateName || data.name}</strong>?</p>
                <p className="reject-sub-msg">This will update the application status to Accepted.</p>
              </div>
              <div className="reject-modal-actions">
                <button
                  className="btn-secondary cancel-reject-btn"
                  onClick={() => setShowAcceptModal(false)}
                  disabled={accepting}
                >
                  Cancel
                </button>
                <button
                  className="btn-primary confirm-accept-btn"
                  style={{ backgroundColor: "#16a34a", borderColor: "#15803d" }}
                  onClick={handleConfirmAccept}
                  disabled={accepting}
                >
                  {accepting ? <FaSpinner className="spinner-icon" /> : "Accept Candidate"}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

export default CandidateProfileModal;

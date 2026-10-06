import React, { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";
import {
  FiBriefcase,
  FiMapPin,
  FiClock,
  FiCalendar,
  FiTool,
  FiUploadCloud,
  FiCheckCircle,
  FiCircle,
  FiBookOpen,
  FiFileText,
  FiCheck,
  FiPlus,
  FiEdit3
} from "react-icons/fi";
import CustomToast from "../../components/common/CustomToast";
import "./CreateJob.css";

function CreateJob({ editingJob, onClearEdit, onNavigatePage, onJobUpdated }) {
  const { user } = useAuth();

  const [job, setJob] = useState({
    title: "",
    company: "",
    location: "",
    salary: "",
    experience: "",
    employmentType: "",
    educationRequirement: "",
    skills: "",
    description: "",
    lastDate: "",
  });

  const [logo, setLogo] = useState(null);
  const [logoPreview, setLogoPreview] = useState("");
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ show: false, title: "", message: "", type: "info" });

  // AI Generated Posters State
  const [jobId, setJobId] = useState("");
  const [posters, setPosters] = useState([]);
  const [selectedPoster, setSelectedPoster] = useState("");
  const [uploading, setUploading] = useState(false);

  // Sync editingJob into form state when provided
  useEffect(() => {
    if (editingJob) {
      let formattedLastDate = "";
      if (editingJob.lastDate) {
        try {
          const d = new Date(editingJob.lastDate);
          if (!isNaN(d.getTime())) {
            formattedLastDate = d.toISOString().split("T")[0];
          }
        } catch {
          formattedLastDate = "";
        }
      }

      setJob({
        title: editingJob.title || "",
        company: editingJob.company || "",
        location: editingJob.location || "",
        salary: editingJob.salary || "",
        experience: editingJob.experience || "",
        employmentType: editingJob.employmentType || "Full Time",
        educationRequirement: editingJob.educationRequirement || "",
        skills: Array.isArray(editingJob.skills) ? editingJob.skills.join(", ") : (editingJob.skills || ""),
        description: editingJob.description || "",
        lastDate: formattedLastDate,
      });

      if (editingJob.companyLogo) {
        setLogoPreview(editingJob.companyLogo);
      }
      setJobId(editingJob._id || "");
      setPosters(editingJob.posters || []);
      setSelectedPoster(editingJob.selectedPoster || "");
    }
  }, [editingJob]);

  const showToast = (title, message, type = "success") => {
    setToast({ show: true, title, message, type });
  };

  const handleChange = (e) => {
    setJob({ ...job, [e.target.name]: e.target.value });
  };

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setLogo(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const handleCancel = () => {
    setJob({
      title: "",
      company: "",
      location: "",
      salary: "",
      experience: "",
      employmentType: "",
      educationRequirement: "",
      skills: "",
      description: "",
      lastDate: "",
    });
    setLogo(null);
    setLogoPreview("");
    if (onClearEdit) onClearEdit();
  };

  // Select AI Generated Poster
  const handlePosterSelect = (posterUrl) => {
    setSelectedPoster(posterUrl);
  };

  // Upload/Save Selected Poster
  const uploadSelectedPoster = async () => {
    if (!jobId || !selectedPoster) return;

    try {
      setUploading(true);
      await axios.post("http://localhost:5002/api/jobs/select-poster", {
        jobId,
        posterUrl: selectedPoster,
      });

      showToast("Poster Saved", "Selected promotional poster has been attached to the job posting.", "success");
    } catch (err) {
      console.error("Save poster error:", err);
      showToast("Poster Save Error", err.response?.data?.message || "Failed to save selected poster.", "danger");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmitJob = async (e) => {
    if (e) e.preventDefault();

    if (!user?._id) {
      showToast("Authentication Error", "HR credentials not found. Please log in again.", "danger");
      return;
    }

    if (!job.title.trim() || !job.company.trim() || !job.location.trim() || !job.description.trim() || !job.skills.trim()) {
      showToast("Missing Required Fields", "Please complete all required fields (*).", "warning");
      return;
    }

    setLoading(true);

    try {
      // 1. Upload Logo if new logo selected
      let logoUrl = logoPreview || "";
      if (logo) {
        const formData = new FormData();
        formData.append("logo", logo);
        try {
          const logoRes = await axios.post("http://localhost:5002/api/upload/logo", formData, {
            headers: { "Content-Type": "multipart/form-data" },
          });
          logoUrl = logoRes.data.url || logoUrl;
        } catch (logoErr) {
          console.warn("Logo Upload Failed, continuing with existing/no logo:", logoErr);
        }
      }

      // 2. Prepare payload
      const jobPayload = {
        title: job.title.trim(),
        company: job.company.trim(),
        location: job.location.trim(),
        salary: job.salary.trim(),
        experience: job.experience.trim(),
        employmentType: job.employmentType || "Full Time",
        educationRequirement: job.educationRequirement.trim(),
        skills: job.skills.split(",").map((s) => s.trim()).filter(Boolean),
        description: job.description.trim(),
        lastDate: job.lastDate || null,
        hrId: user._id,
        companyLogo: logoUrl,
        postedDate: editingJob?.postedDate || new Date(),
      };

      // 3. API Call: Update or Create
      if (editingJob && editingJob._id) {
        try {
          const res = await axios.put(`http://localhost:5002/api/jobs/update/${editingJob._id}`, jobPayload);
          if (res?.data?.success || res?.status === 200) {
            showToast("Job Updated", "The job details have been updated successfully.", "success");
            if (onJobUpdated) onJobUpdated(res.data.job || { ...editingJob, ...jobPayload });
            if (onClearEdit) onClearEdit();
            if (onNavigatePage) {
              setTimeout(() => onNavigatePage("jobs"), 1000);
            }
          }
        } catch (updateErr) {
          console.error("Update error:", updateErr);
          // Fallback direct PUT /api/jobs/:id
          const fallbackRes = await axios.put(`http://localhost:5002/api/jobs/${editingJob._id}`, jobPayload);
          showToast("Job Updated", "The job details have been updated successfully.", "success");
          if (onJobUpdated) onJobUpdated(fallbackRes.data.job || { ...editingJob, ...jobPayload });
          if (onClearEdit) onClearEdit();
          if (onNavigatePage) {
            setTimeout(() => onNavigatePage("jobs"), 1000);
          }
        }
      } else {
        const res = await axios.post("http://localhost:5002/api/jobs/create", jobPayload, {
          timeout: 15000,
        });

        if (res?.data?.success && res?.data?.job) {
          const createdJob = res.data.job;
          setJobId(createdJob._id || "");
          setPosters(createdJob.posters || []);
          setSelectedPoster(createdJob.selectedPoster || "");

          if (createdJob.posters && createdJob.posters.length > 0) {
            showToast("Job Created", "The job posting and promotional posters have been created successfully.", "success");
          } else if (createdJob.posterGenerationStatus === "Failed") {
            showToast("Job Created", "Job posted successfully. Image processing service was unavailable at this time.", "info");
          } else {
            showToast("Job Created", "The job posting has been created successfully.", "success");
          }

          // Reset Form Fields
          handleCancel();
        } else {
          showToast("Unable to Create Job", "Please check the information and try again.", "warning");
        }
      }
    } catch (error) {
      console.error("Save Job Error:", error);
      const errorMsg = error?.response?.data?.message || "Please check the information and try again.";
      showToast("Unable to Save Job", errorMsg, "danger");
    } finally {
      setLoading(false);
    }
  };

  const today = new Date().toISOString().split("T")[0];

  // Checklist status
  const isTitleDone = Boolean(job.title.trim());
  const isCompanyDone = Boolean(job.company.trim());
  const isLocationDone = Boolean(job.location.trim());
  const isTypeDone = Boolean(job.employmentType.trim());
  const isSkillsDone = Boolean(job.skills.trim());
  const isDescDone = Boolean(job.description.trim());

  return (
    <div className="create-job-page animate-fade-in">
      <CustomToast toast={toast} onClose={() => setToast((prev) => ({ ...prev, show: false }))} />

      {/* Header */}
      <div className="create-job-workspace-header">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px", width: "100%" }}>
          <div>
            <h1>{editingJob ? "Edit job details" : "Create job"}</h1>
            <p>{editingJob ? "Update the job opening details. Fields marked with * are required." : "Post a new job opening. Fields marked with * are required."}</p>
          </div>
          {editingJob && (
            <button
              type="button"
              className="btn-create-job-hdr"
              style={{ background: "#FFFFFF", color: "#2870A8", border: "1.5px solid #2870A8" }}
              onClick={() => {
                if (onClearEdit) onClearEdit();
                handleCancel();
              }}
            >
              <FiPlus />
              <span>Create new job instead</span>
            </button>
          )}
        </div>
      </div>

      {/* 2-Column Split Layout */}
      <form onSubmit={handleSubmitJob} className="create-job-layout-grid">
        {/* Left Column: Form Cards */}
        <div className="create-job-main-form">
          
          {/* Card 1: Job Details */}
          <div className="hr-create-section-card">
            <div className="hr-create-section-header">
              <h3>Job details</h3>
              <p>Basic information about the position.</p>
            </div>
            <div className="hr-create-section-body">
              <div className="create-fields-2col">
                <div className="form-field-item">
                  <label htmlFor="job-title">Job title *</label>
                  <div className="field-input-box">
                    <FiBriefcase className="field-box-icon" />
                    <input
                      id="job-title"
                      type="text"
                      name="title"
                      placeholder="e.g. Python developer"
                      value={job.title}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>

                <div className="form-field-item">
                  <label htmlFor="job-company">Company name *</label>
                  <div className="field-input-box">
                    <FiBriefcase className="field-box-icon" />
                    <input
                      id="job-company"
                      type="text"
                      name="company"
                      placeholder="e.g. TechNova Solutions Pvt. Ltd."
                      value={job.company}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>

                <div className="form-field-item">
                  <label htmlFor="job-location">Location *</label>
                  <div className="field-input-box">
                    <FiMapPin className="field-box-icon" />
                    <input
                      id="job-location"
                      type="text"
                      name="location"
                      placeholder="e.g. Ahmedabad"
                      value={job.location}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>

                <div className="form-field-item">
                  <label htmlFor="job-employmentType">Employment type *</label>
                  <div className="field-input-box">
                    <FiClock className="field-box-icon" />
                    <select
                      id="job-employmentType"
                      name="employmentType"
                      value={job.employmentType}
                      onChange={handleChange}
                      required
                    >
                      <option value="">Select employment type</option>
                      <option value="Full Time">Full Time</option>
                      <option value="Part Time">Part Time</option>
                      <option value="Internship">Internship</option>
                      <option value="Contract">Contract</option>
                      <option value="Remote">Remote</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Requirements */}
          <div className="hr-create-section-card">
            <div className="hr-create-section-header">
              <h3>Requirements</h3>
              <p>What candidates need to apply.</p>
            </div>
            <div className="hr-create-section-body">
              <div className="create-fields-2col">
                <div className="form-field-item">
                  <label htmlFor="job-experience">Experience required</label>
                  <div className="field-input-box">
                    <FiBriefcase className="field-box-icon" />
                    <input
                      id="job-experience"
                      type="text"
                      name="experience"
                      placeholder="e.g. 0 to 2 years"
                      value={job.experience}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div className="form-field-item">
                  <label htmlFor="job-education">Education required</label>
                  <div className="field-input-box">
                    <FiBookOpen className="field-box-icon" />
                    <input
                      id="job-education"
                      type="text"
                      name="educationRequirement"
                      placeholder="e.g. BCA"
                      value={job.educationRequirement}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div className="form-field-item">
                  <label htmlFor="job-salary">Salary or compensation</label>
                  <div className="field-input-box">
                    <FiFileText className="field-box-icon" />
                    <input
                      id="job-salary"
                      type="text"
                      name="salary"
                      placeholder="e.g. INR 20,000 per month"
                      value={job.salary}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div className="form-field-item">
                  <label htmlFor="job-lastDate">Application deadline</label>
                  <div className="field-input-box">
                    <FiCalendar className="field-box-icon" />
                    <input
                      id="job-lastDate"
                      type="date"
                      name="lastDate"
                      min={today}
                      value={job.lastDate}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div className="form-field-item full-width">
                  <label htmlFor="job-skills">Required skills *</label>
                  <div className="field-input-box">
                    <FiTool className="field-box-icon" />
                    <input
                      id="job-skills"
                      type="text"
                      name="skills"
                      placeholder="e.g. Python, Flask, SQL"
                      value={job.skills}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <span className="field-sub-helper">Separate skills with commas.</span>
                </div>
              </div>
            </div>
          </div>

          {/* Card 3: Job Description */}
          <div className="hr-create-section-card">
            <div className="hr-create-section-header">
              <h3>Job description</h3>
              <p>Describe the role and responsibilities.</p>
            </div>
            <div className="hr-create-section-body">
              <div className="form-field-item full-width">
                <label htmlFor="job-description">Description and responsibilities *</label>
                <div className="field-textarea-box">
                  <textarea
                    id="job-description"
                    name="description"
                    rows="6"
                    placeholder="Describe the role, key responsibilities, and any other details candidates should know."
                    value={job.description}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Right Column: Sidebar Panels & Actions */}
        <div className="create-job-sidebar">
          {/* Panel 1: Company logo */}
          <div className="hr-create-side-card">
            <div className="hr-create-side-header">
              <h3>Company logo</h3>
              <span className="side-opt-tag">Optional</span>
            </div>
            <div className="hr-create-side-body">
              <div className="company-logo-upload-dropzone">
                <input
                  id="job-logo"
                  type="file"
                  accept="image/*"
                  onChange={handleLogoChange}
                  className="logo-file-input-hidden"
                />
                {logoPreview ? (
                  <div className="logo-uploaded-preview">
                    <img src={logoPreview} alt="Logo Preview" />
                    <span className="logo-filename">{logo?.name || "Logo uploaded"}</span>
                  </div>
                ) : (
                  <div className="logo-dropzone-placeholder">
                    <FiUploadCloud className="dropzone-cloud-icon" />
                    <div className="dropzone-text-primary">Click to upload company logo</div>
                    <div className="dropzone-text-muted">PNG or JPG</div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Panel 2: Before you post checklist */}
          <div className="hr-create-side-card">
            <div className="hr-create-side-header">
              <h3>Before you post</h3>
            </div>
            <div className="hr-create-side-body">
              <div className="checklist-items-list">
                <div className={`checklist-row-box ${isTitleDone ? "completed" : ""}`}>
                  {isTitleDone ? <FiCheckCircle className="check-icon done" /> : <FiCircle className="check-icon" />}
                  <span>Job title</span>
                </div>
                <div className={`checklist-row-box ${isCompanyDone ? "completed" : ""}`}>
                  {isCompanyDone ? <FiCheckCircle className="check-icon done" /> : <FiCircle className="check-icon" />}
                  <span>Company name</span>
                </div>
                <div className={`checklist-row-box ${isLocationDone ? "completed" : ""}`}>
                  {isLocationDone ? <FiCheckCircle className="check-icon done" /> : <FiCircle className="check-icon" />}
                  <span>Location</span>
                </div>
                <div className={`checklist-row-box ${isTypeDone ? "completed" : ""}`}>
                  {isTypeDone ? <FiCheckCircle className="check-icon done" /> : <FiCircle className="check-icon" />}
                  <span>Employment type</span>
                </div>
                <div className={`checklist-row-box ${isSkillsDone ? "completed" : ""}`}>
                  {isSkillsDone ? <FiCheckCircle className="check-icon done" /> : <FiCircle className="check-icon" />}
                  <span>Required skills</span>
                </div>
                <div className={`checklist-row-box ${isDescDone ? "completed" : ""}`}>
                  {isDescDone ? <FiCheckCircle className="check-icon done" /> : <FiCircle className="check-icon" />}
                  <span>Job description</span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons Row */}
          <div className="create-job-actions-row">
            <button
              type="button"
              className="btn-create-cancel"
              onClick={handleCancel}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-create-submit"
              disabled={loading}
            >
              <FiBriefcase className="btn-icon" />
              <span>{loading ? "Saving..." : editingJob ? "Update job details" : "Create job posting"}</span>
            </button>
          </div>
        </div>
      </form>

      {/* AI Generated Posters Selection Section (if available) */}
      {posters.length > 0 && (
        <div className="poster-section animate-fade-in" style={{ marginTop: "24px" }}>
          <div className="poster-header">
            <h3>Promotional Job Posters</h3>
            <p>Select a generated poster to attach to this job posting</p>
          </div>

          {selectedPoster && (
            <div className="selected-poster-preview">
              <h4>Active Selected Poster Preview</h4>
              <img
                src={
                  selectedPoster.startsWith("/")
                    ? `http://localhost:5002${selectedPoster}`
                    : `http://localhost:5002/${selectedPoster}`
                }
                alt="Active Job Poster"
              />
            </div>
          )}

          <div className="poster-grid">
            {posters.map((poster, index) => (
              <div
                key={index}
                className={`poster-card ${selectedPoster === poster ? "selected" : ""}`}
                onClick={() => handlePosterSelect(poster)}
              >
                <img
                  src={
                    poster.startsWith("/")
                      ? `http://localhost:5002${poster}`
                      : `http://localhost:5002/${poster}`
                  }
                  alt={`Job Poster Option ${index + 1}`}
                />
                {selectedPoster === poster && (
                  <div className="selected-badge">
                    <FiCheck /> Selected
                  </div>
                )}
              </div>
            ))}
          </div>

          <button
            type="button"
            className="btn-secondary save-poster-btn"
            onClick={uploadSelectedPoster}
            disabled={uploading || !selectedPoster}
          >
            {uploading ? "Saving Poster..." : "Confirm & Save Selected Poster"}
          </button>
        </div>
      )}
    </div>
  );
}

export default CreateJob;

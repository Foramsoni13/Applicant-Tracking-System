import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";
import CandidateNavbar from "./CandidateNavbar";
import {
  FaUser,
  FaGraduationCap,
  FaBriefcase,
  FaFolderOpen,
  FaTools,
  FaFileUpload,
  FaTrash,
  FaEye,
  FaArrowLeft,
  FaLinkedin,
  FaGithub,
  FaGlobe,
  FaCertificate,
  FaPlus,
  FaEdit,
  FaDownload,
  FaAward,
  FaMapMarkerAlt,
  FaEnvelope,
  FaPhoneAlt,
  FaCamera,
  FaThumbsUp,
  FaComment,
  FaShareAlt,
  FaSpinner,
  FaExclamationTriangle,
  FaExternalLinkAlt
} from "react-icons/fa";
import {
  FiGrid,
  FiSearch,
  FiFileText,
  FiCalendar,
  FiUser,
  FiAward,
  FiLogOut,
  FiEdit2,
  FiPlus,
  FiTrash2,
  FiDownload,
  FiEye,
  FiUpload,
  FiCheck,
  FiMail,
  FiPhone,
  FiMapPin,
  FiMenu,
  FiX
} from "react-icons/fi";
import "./CandidateProfile.css";

function CandidateProfile() {
  const navigate = useNavigate();
  const { user, token, updateUser, logout } = useAuth();

  const [loading, setLoading] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState(false);
  const [resumeUploading, setResumeUploading] = useState(false);
  const [msg, setMsg] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeProfileTab, setActiveProfileTab] = useState("about");

  // Modals
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCertModal, setShowCertModal] = useState(false);
  const [showEduModal, setShowEduModal] = useState(false);
  const [showExpModal, setShowExpModal] = useState(false);
  const [showProjModal, setShowProjModal] = useState(false);
  const [showSkillsModal, setShowSkillsModal] = useState(false);
  const [showPostModal, setShowPostModal] = useState(false);

  // Profile State
  const [profile, setProfile] = useState({
    name: "",
    email: "",
    phone: "",
    headline: "",
    location: "",
    about: "",
    education: [],
    experience: [],
    projects: [],
    skills: [],
    certificates: [],
    linkedin: "",
    github: "",
    portfolio: "",
    profilePicture: "",
    resume: "",
  });

  // Certificate Modal Form State
  const [certForm, setCertForm] = useState({
    name: "",
    issuingOrganization: "",
    issueDate: "",
    expiryDate: "",
    credentialId: "",
    credentialUrl: "",
    file: null,
  });
  const [addingCert, setAddingCert] = useState(false);

  // Education Form State
  const [eduForm, setEduForm] = useState({
    degree: "",
    institution: "",
    year: "",
    cgpa: "",
  });

  // Experience Form State
  const [expForm, setExpForm] = useState({
    title: "",
    company: "",
    duration: "",
    location: "",
    description: "",
  });

  // Project Form State
  const [projForm, setProjForm] = useState({
    name: "",
    technologies: "",
    description: "",
    projectUrl: "",
    githubUrl: "",
  });

  // Skills Form State
  const [skillsInput, setSkillsInput] = useState("");

  // Profile Picture File State for Edit Form
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);

  // Posts Feed State
  const [posts, setPosts] = useState([]);
  const [postsLoading, setPostsLoading] = useState(false);
  const [postForm, setPostForm] = useState({
    content: "",
    tags: "",
    mediaFile: null,
    attachedProject: "",
    attachedCertificate: "",
  });
  const [postMediaPreview, setPostMediaPreview] = useState(null);
  const [submittingPost, setSubmittingPost] = useState(false);

  // Active Comment Accordion for Posts
  const [activeCommentPostId, setActiveCommentPostId] = useState(null);
  const [commentText, setCommentText] = useState({});

  // Editing Post State
  const [editingPostId, setEditingPostId] = useState(null);
  const [editPostContent, setEditPostContent] = useState("");

  const fetchCandidatePosts = useCallback(async () => {
    try {
      setPostsLoading(true);
      const res = await axios.get("http://localhost:5002/api/posts");
      if (res.data?.success) {
        setPosts(res.data.posts || []);
      }
    } catch (err) {
      console.error("Fetch posts error:", err);
    } finally {
      setPostsLoading(false);
    }
  }, []);

  // Helper formatting for education title separation
  const cleanDegreeTitle = (str) => {
    if (!str) return "";
    return String(str).trim();
  };

  const extractYearFromDegree = (str) => {
    if (!str) return "";
    const match = String(str).match(/(20\d\d\s*[\u2013\u2014\-]\s*20\d\d|20\d\d\s*[\u2013\u2014\-]\s*Present|20\d\d)/i);
    return match ? match[0].trim() : "";
  };

  // -------------------------------------------------------------
  // DATA NORMALIZERS (Eliminates raw JSON rendering forever)
  // -------------------------------------------------------------

  const parseEducationList = (data) => {
    if (!data) return [];
    let items = data;

    for (let i = 0; i < 3; i++) {
      if (typeof items === "string") {
        const trimmed = items.trim();
        if (
          (trimmed.startsWith("[") && trimmed.endsWith("]")) ||
          (trimmed.startsWith("{") && trimmed.endsWith("}"))
        ) {
          try {
            const parsed = JSON.parse(trimmed);
            if (parsed === items) break;
            items = parsed;
          } catch (e) {
            break;
          }
        } else {
          break;
        }
      } else {
        break;
      }
    }

    if (typeof items === "object" && items !== null && !Array.isArray(items)) {
      items = [items];
    }

    const cleanItem = (itemObj) => {
      if (typeof itemObj === "string" && itemObj.trim()) {
        const rawStr = itemObj.trim();
        const parts = rawStr.split(/\s*[\u2013\u2014|\u2022\-]\s*/).filter(Boolean);
        let degree = parts[0] || rawStr;
        let institution = parts[1] || "";
        let year = parts[2] || extractYearFromDegree(rawStr) || "";
        return {
          degree,
          institution,
          year,
          cgpa: "",
          description: "",
          fieldOfStudy: "",
          location: "",
          raw: rawStr,
        };
      }

      if (typeof itemObj === "object" && itemObj !== null) {
        let degree = (
          itemObj.degree ||
          itemObj.title ||
          itemObj.qualification ||
          itemObj.name ||
          ""
        ).trim();

        let institution = (
          itemObj.institution ||
          itemObj.university ||
          itemObj.school ||
          itemObj.college ||
          itemObj.board ||
          ""
        ).trim();

        let startDate = (itemObj.startDate || itemObj.startYear || "").trim();
        let endDate = (itemObj.endDate || itemObj.endYear || "").trim();
        let currentlyStudying =
          Boolean(itemObj.currentlyStudying) ||
          Boolean(itemObj.isCurrent) ||
          Boolean(itemObj.present);

        let year = (
          itemObj.year ||
          itemObj.duration ||
          itemObj.dates ||
          (startDate
            ? `${startDate}${currentlyStudying ? " – Present" : endDate ? ` – ${endDate}` : ""}`
            : endDate
            ? endDate
            : "")
        ).trim();

        let cgpa = (
          itemObj.cgpa ||
          itemObj.grade ||
          itemObj.percentage ||
          itemObj.score ||
          itemObj.marks ||
          ""
        ).trim();

        let fieldOfStudy = (
          itemObj.fieldOfStudy ||
          itemObj.course ||
          itemObj.field ||
          itemObj.major ||
          itemObj.stream ||
          itemObj.branch ||
          ""
        ).trim();

        let location = (
          itemObj.location ||
          itemObj.city ||
          itemObj.state ||
          ""
        ).trim();

        let description = (
          itemObj.description ||
          itemObj.details ||
          itemObj.notes ||
          itemObj.summary ||
          itemObj.info ||
          ""
        ).trim();

        let achievements = (
          itemObj.achievements ||
          itemObj.accomplishments ||
          itemObj.highlights ||
          itemObj.activities ||
          itemObj.awards ||
          ""
        ).trim();

        return {
          ...itemObj,
          degree,
          institution,
          startDate,
          endDate,
          currentlyStudying,
          year,
          cgpa,
          fieldOfStudy,
          location,
          description,
          achievements,
        };
      }

      return null;
    };

    if (Array.isArray(items)) {
      return items
        .map((item) => cleanItem(item))
        .filter((e) => e && (e.degree || e.institution || e.description || e.raw));
    }
    if (typeof items === "string" && items.trim()) {
      return items
        .split("\n")
        .map((line) => cleanItem(line))
        .filter((e) => e && (e.degree || e.institution || e.description || e.raw));
    }
    return [];
  };

  const parseExperienceList = (data) => {
    if (!data) return [];
    let items = data;
    if (typeof items === "string") {
      try {
        if (items.trim().startsWith("[")) {
          items = JSON.parse(items);
        }
      } catch (e) {}
    }
    if (Array.isArray(items)) {
      return items.map((item) => {
        if (typeof item === "object" && item !== null) {
          let title = item.title || item.role || item.position || "";
          if (title.toLowerCase() === "relevant work experience" || title.toLowerCase() === "work experience") {
            title = "";
          }
          return {
            title: title || item.company || "Position",
            company: item.company || item.organization || "",
            duration: item.duration || item.dates || item.year || "",
            location: item.location || "",
            description: item.description || item.responsibilities || "",
          };
        }
        if (typeof item === "string" && item.trim()) {
          const cleanStr = item.trim();
          if (cleanStr.toLowerCase() !== "relevant work experience") {
            return { title: cleanStr, company: "", duration: "", location: "", description: "" };
          }
        }
        return null;
      }).filter((e) => e && (e.title || e.company || e.description));
    }
    if (typeof items === "string" && items.trim()) {
      const lines = items.split("\n").map((l) => l.trim()).filter((l) => l && l.toLowerCase() !== "relevant work experience");
      return lines.map((line) => ({ title: line, company: "", duration: "", location: "", description: "" }));
    }
    return [];
  };

  const parseProjectsList = (data) => {
    if (!data) return [];
    let items = data;
    if (typeof items === "string") {
      try {
        if (items.trim().startsWith("[")) {
          items = JSON.parse(items);
        }
      } catch (e) {}
    }
    if (Array.isArray(items)) {
      return items.map((item) => {
        if (typeof item === "object" && item !== null) {
          let techList = [];
          if (Array.isArray(item.technologies)) {
            techList = item.technologies;
          } else if (typeof item.technologies === "string") {
            techList = item.technologies.split(/[,;•]+/).map((t) => t.trim()).filter(Boolean);
          } else if (typeof item.tech === "string") {
            techList = item.tech.split(/[,;•]+/).map((t) => t.trim()).filter(Boolean);
          }
          return {
            name: item.name || item.title || item.projectName || "Project",
            description: item.description || item.details || item.summary || "",
            technologies: techList,
            projectUrl: item.projectUrl || item.link || item.url || "",
            githubUrl: item.githubUrl || item.github || "",
          };
        }
        if (typeof item === "string" && item.trim()) {
          return { name: item.trim(), description: "", technologies: [], projectUrl: "", githubUrl: "" };
        }
        return null;
      }).filter((p) => p && p.name);
    }
    if (typeof items === "string" && items.trim()) {
      return items.split("\n").map((line) => ({ name: line.trim(), description: "", technologies: [], projectUrl: "", githubUrl: "" })).filter((p) => p.name);
    }
    return [];
  };

  const parseSkillsList = (data) => {
    if (!data) return [];
    let list = [];
    if (Array.isArray(data)) {
      data.forEach((s) => {
        if (typeof s === "string") {
          s.split(/[,;\n]+/).forEach((sub) => { if (sub.trim()) list.push(sub.trim()); });
        } else if (s) {
          list.push(String(s).trim());
        }
      });
    } else if (typeof data === "string" && data.trim()) {
      let str = data.trim();
      if (str.startsWith("[")) {
        try {
          const parsed = JSON.parse(str);
          return parseSkillsList(parsed);
        } catch (e) {}
      }
      str.split(/[,;\n]+/).forEach((sub) => { if (sub.trim()) list.push(sub.trim()); });
    }
    return Array.from(new Set(list));
  };

  // -------------------------------------------------------------
  // FETCH PROFILE & POSTS
  // -------------------------------------------------------------

  const getAuthHeaders = useCallback(() => {
    const activeToken = token || sessionStorage.getItem("token") || localStorage.getItem("token");
    return activeToken ? { Authorization: `Bearer ${activeToken}` } : {};
  }, [token]);

  const fetchProfile = useCallback(async () => {
    setProfileLoading(true);
    setProfileError(false);
    try {
      const res = await axios.get("http://localhost:5002/api/candidate/me", {
        headers: getAuthHeaders(),
      });
      if (res.data && res.data.success) {
        const u = res.data.user;
        const parsedEdu = parseEducationList(u.education);
        const parsedExp = parseExperienceList(u.experience);
        const parsedProj = parseProjectsList(u.projects);
        const parsedSkills = parseSkillsList(u.skills || u.extractedSkills);

        setProfile({
          name: u.name || user?.name || "",
          email: u.email || user?.email || "",
          phone: u.phone || "",
          headline: u.headline || "",
          location: u.location || "",
          about: u.about || "",
          education: parsedEdu,
          experience: parsedExp,
          projects: parsedProj,
          skills: parsedSkills,
          certificates: Array.isArray(u.certificates) ? u.certificates : [],
          linkedin: u.linkedin || "",
          github: u.github || "",
          portfolio: u.portfolio || "",
          profilePicture: u.profilePicture || "",
          resume: u.resume || "",
          status: u.status || "",
        });

        setSkillsInput(parsedSkills.join(", "));
      } else {
        setProfileError(true);
      }
    } catch (err) {
      console.error("Fetch candidate profile error:", err);
      setProfileError(true);
    } finally {
      setProfileLoading(false);
    }
  }, [user, getAuthHeaders]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  // Calculate Profile Completion Percentage dynamically from actual non-empty fields
  const calculateCompletion = () => {
    let score = 0;
    const checks = [
      profile.name && profile.name.trim() !== "",
      profile.email && profile.email.trim() !== "",
      profile.phone && profile.phone.trim() !== "",
      profile.headline && profile.headline.trim() !== "",
      profile.location && profile.location.trim() !== "",
      profile.about && profile.about.trim() !== "",
      Array.isArray(profile.skills) && profile.skills.length > 0,
      Array.isArray(profile.education) && profile.education.length > 0,
      Array.isArray(profile.experience) && profile.experience.length > 0,
      Array.isArray(profile.projects) && profile.projects.length > 0,
      Boolean(profile.resume) || (Array.isArray(profile.certificates) && profile.certificates.length > 0),
    ];
    checks.forEach((passed) => {
      if (passed) score += 1;
    });
    return Math.round((score / checks.length) * 100);
  };

  // -------------------------------------------------------------
  // PROFILE HANDLERS
  // -------------------------------------------------------------

  const handleEditChange = (e) => {
    setProfile({
      ...profile,
      [e.target.name]: e.target.value,
    });
  };

  const handleAvatarSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMsg(null);

    try {
      const formData = new FormData();
      formData.append("name", profile.name);
      formData.append("phone", profile.phone);
      formData.append("headline", profile.headline);
      formData.append("location", profile.location);
      formData.append("about", profile.about);
      formData.append("education", JSON.stringify(profile.education));
      formData.append("experience", JSON.stringify(profile.experience));
      formData.append("projects", JSON.stringify(profile.projects));
      formData.append("skills", profile.skills.join(", "));
      formData.append("linkedin", profile.linkedin);
      formData.append("github", profile.github);
      formData.append("portfolio", profile.portfolio);

      if (avatarFile) {
        formData.append("profilePicture", avatarFile);
      }

      const res = await axios.put("http://localhost:5002/api/candidate/me", formData, {
        headers: {
          ...getAuthHeaders(),
          "Content-Type": "multipart/form-data",
        },
      });

      if (res.data && res.data.user) {
        updateUser(res.data.user);
        setMsg({ text: "Profile updated successfully!", type: "success" });
        setShowEditModal(false);
        fetchProfile();
      }
    } catch (error) {
      console.error("Save profile error:", error);
      setMsg({ text: "Failed to update profile", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  // Education CRUD
  const handleAddEducation = async (e) => {
    e.preventDefault();
    if (!eduForm.degree || !eduForm.degree.trim()) return;
    const newEduList = [...profile.education, { ...eduForm }];
    setProfile((prev) => ({ ...prev, education: newEduList }));
    setShowEduModal(false);
    setEduForm({ degree: "", institution: "", year: "", cgpa: "" });

    try {
      const res = await axios.put("http://localhost:5002/api/candidate/me", {
        education: JSON.stringify(newEduList),
      }, { headers: getAuthHeaders() });
      if (res.data && res.data.user) updateUser(res.data.user);
      setMsg({ text: "Education added successfully!", type: "success" });
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteEducation = async (index) => {
    const newEduList = profile.education.filter((_, i) => i !== index);
    setProfile((prev) => ({ ...prev, education: newEduList }));
    try {
      const res = await axios.put("http://localhost:5002/api/candidate/me", {
        education: JSON.stringify(newEduList),
      }, { headers: getAuthHeaders() });
      if (res.data && res.data.user) updateUser(res.data.user);
    } catch (err) {
      console.error(err);
    }
  };

  // Experience CRUD
  const handleAddExperience = async (e) => {
    e.preventDefault();
    if (!expForm.title || !expForm.title.trim()) return;
    const newExpList = [...profile.experience, { ...expForm }];
    setProfile((prev) => ({ ...prev, experience: newExpList }));
    setShowExpModal(false);
    setExpForm({ title: "", company: "", duration: "", location: "", description: "" });

    try {
      const res = await axios.put("http://localhost:5002/api/candidate/me", {
        experience: JSON.stringify(newExpList),
      }, { headers: getAuthHeaders() });
      if (res.data && res.data.user) updateUser(res.data.user);
      setMsg({ text: "Work experience added successfully!", type: "success" });
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteExperience = async (index) => {
    const newExpList = profile.experience.filter((_, i) => i !== index);
    setProfile((prev) => ({ ...prev, experience: newExpList }));
    try {
      const res = await axios.put("http://localhost:5002/api/candidate/me", {
        experience: JSON.stringify(newExpList),
      }, { headers: getAuthHeaders() });
      if (res.data && res.data.user) updateUser(res.data.user);
    } catch (err) {
      console.error(err);
    }
  };

  // Project CRUD
  const handleAddProject = async (e) => {
    e.preventDefault();
    if (!projForm.name || !projForm.name.trim()) return;
    const techArray = typeof projForm.technologies === "string"
      ? projForm.technologies.split(",").map((t) => t.trim()).filter(Boolean)
      : projForm.technologies;

    const newProjItem = { ...projForm, technologies: techArray };
    const newProjList = [...profile.projects, newProjItem];
    setProfile((prev) => ({ ...prev, projects: newProjList }));
    setShowProjModal(false);
    setProjForm({ name: "", technologies: "", description: "", projectUrl: "", githubUrl: "" });

    try {
      const res = await axios.put("http://localhost:5002/api/candidate/me", {
        projects: JSON.stringify(newProjList),
      }, { headers: getAuthHeaders() });
      if (res.data && res.data.user) updateUser(res.data.user);
      setMsg({ text: "Project added successfully!", type: "success" });
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteProject = async (index) => {
    const newProjList = profile.projects.filter((_, i) => i !== index);
    setProfile((prev) => ({ ...prev, projects: newProjList }));
    try {
      const res = await axios.put("http://localhost:5002/api/candidate/me", {
        projects: JSON.stringify(newProjList),
      }, { headers: getAuthHeaders() });
      if (res.data && res.data.user) updateUser(res.data.user);
    } catch (err) {
      console.error(err);
    }
  };

  // Skills Save
  const handleSaveSkills = async (e) => {
    e.preventDefault();
    const cleanSkills = parseSkillsList(skillsInput);
    setProfile((prev) => ({ ...prev, skills: cleanSkills }));
    setShowSkillsModal(false);

    try {
      const res = await axios.put("http://localhost:5002/api/candidate/me", {
        skills: cleanSkills.join(", "),
      }, { headers: getAuthHeaders() });
      if (res.data && res.data.user) updateUser(res.data.user);
      setMsg({ text: "Skills updated successfully!", type: "success" });
    } catch (err) {
      console.error(err);
    }
  };

  // Certificate Add & Delete
  const handleAddCertificate = async (e) => {
    e.preventDefault();
    if (!certForm.name || !certForm.name.trim()) {
      alert("Certificate name is required");
      return;
    }
    const activeUser = user || JSON.parse(sessionStorage.getItem("user") || localStorage.getItem("user") || "null");

    setAddingCert(true);
    try {
      const formData = new FormData();
      formData.append("name", certForm.name);
      formData.append("issuingOrganization", certForm.issuingOrganization);
      formData.append("issueDate", certForm.issueDate);
      formData.append("expiryDate", certForm.expiryDate);
      formData.append("credentialId", certForm.credentialId);
      formData.append("credentialUrl", certForm.credentialUrl);
      if (certForm.file) {
        formData.append("file", certForm.file);
      }

      const res = await axios.post(`http://localhost:5002/api/candidate/certificates/${activeUser?._id}`, formData, {
        headers: { ...getAuthHeaders(), "Content-Type": "multipart/form-data" }
      });
      if (res.data.success) {
        setProfile((prev) => ({ ...prev, certificates: res.data.certificates }));
        setShowCertModal(false);
        setCertForm({
          name: "",
          issuingOrganization: "",
          issueDate: "",
          expiryDate: "",
          credentialId: "",
          credentialUrl: "",
          file: null,
        });
        setMsg({ text: "Certificate added successfully!", type: "success" });
      }
    } catch (error) {
      console.error("Add cert error:", error);
      alert("Failed to add certificate.");
    } finally {
      setAddingCert(false);
    }
  };

  const handleDeleteCert = async (certId) => {
    if (!window.confirm("Are you sure you want to delete this certificate?")) return;
    const activeUser = user || JSON.parse(sessionStorage.getItem("user") || localStorage.getItem("user") || "null");
    try {
      const res = await axios.delete(`http://localhost:5002/api/candidate/certificates/${activeUser?._id}/${certId}`, {
        headers: getAuthHeaders()
      });
      if (res.data.success) {
        setProfile((prev) => ({ ...prev, certificates: res.data.certificates }));
        setMsg({ text: "Certificate deleted.", type: "success" });
      }
    } catch (error) {
      console.error("Delete cert error:", error);
    }
  };

  // Resume Upload
  const handleResumeUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"].includes(file.type)) {
      setMsg({ text: "Only PDF and DOCX files are allowed.", type: "error" });
      return;
    }

    const activeUser = user || JSON.parse(sessionStorage.getItem("user") || localStorage.getItem("user") || "null");

    const formData = new FormData();
    formData.append("resume", file);
    formData.append("candidateId", activeUser?._id || "");

    setResumeUploading(true);
    try {
      const res = await axios.post("http://localhost:5002/api/resume/upload", formData, {
        headers: { ...getAuthHeaders(), "Content-Type": "multipart/form-data" }
      });
      if (res.data.success) {
        setProfile((prev) => ({ ...prev, resume: res.data.resume.fileName }));
        setMsg({ text: "Resume uploaded & parsed successfully!", type: "success" });
        fetchProfile();
      }
    } catch (error) {
      setMsg({ text: "Resume upload failed.", type: "error" });
    } finally {
      setResumeUploading(false);
    }
  };

  // Helper to format URLs without exposing localhost text
  const getUrl = (path) => {
    if (!path) return null;
    if (path.startsWith("http://") || path.startsWith("https://")) return path;
    return `http://localhost:5002${path.startsWith("/") ? path : `/${path}`}`;
  };

  // -------------------------------------------------------------
  // POSTS CREATION, LIKES, COMMENTS, DELETE
  // -------------------------------------------------------------

  const handlePostMediaSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPostForm({ ...postForm, mediaFile: file });
      setPostMediaPreview(URL.createObjectURL(file));
    }
  };

  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!postForm.content || !postForm.content.trim()) {
      alert("Post text content is required.");
      return;
    }

    setSubmittingPost(true);
    try {
      const formData = new FormData();
      formData.append("authorId", user._id);
      formData.append("content", postForm.content);
      formData.append("tags", postForm.tags);

      if (postForm.mediaFile) {
        formData.append("media", postForm.mediaFile);
      }

      if (postForm.attachedProject) {
        const selProj = profile.projects.find((p) => p.name === postForm.attachedProject);
        if (selProj) formData.append("attachedProject", JSON.stringify(selProj));
      }

      if (postForm.attachedCertificate) {
        const selCert = profile.certificates.find((c) => c.name === postForm.attachedCertificate);
        if (selCert) formData.append("attachedCertificate", JSON.stringify(selCert));
      }

      const res = await axios.post("http://localhost:5002/api/posts", formData);
      if (res.data.success) {
        setMsg({ text: "Post created successfully!", type: "success" });
        setShowPostModal(false);
        setPostForm({ content: "", tags: "", mediaFile: null, attachedProject: "", attachedCertificate: "" });
        setPostMediaPreview(null);
        fetchCandidatePosts();
      }
    } catch (err) {
      console.error("Create post error:", err);
      alert("Failed to create post.");
    } finally {
      setSubmittingPost(false);
    }
  };

  const handleToggleLike = async (postId) => {
    try {
      const res = await axios.post(`http://localhost:5002/api/posts/${postId}/like`, { userId: user._id });
      if (res.data.success) {
        setPosts((prev) =>
          prev.map((p) => (p._id === postId ? { ...p, likes: res.data.likes } : p))
        );
      }
    } catch (err) {
      console.error("Like error:", err);
    }
  };

  const handleAddComment = async (postId) => {
    const text = commentText[postId];
    if (!text || !text.trim()) return;

    try {
      const res = await axios.post(`http://localhost:5002/api/posts/${postId}/comment`, {
        userId: user._id,
        text: text.trim(),
      });
      if (res.data.success) {
        setPosts((prev) =>
          prev.map((p) => (p._id === postId ? { ...p, comments: res.data.comments } : p))
        );
        setCommentText({ ...commentText, [postId]: "" });
      }
    } catch (err) {
      console.error("Add comment error:", err);
    }
  };

  const handleDeletePost = async (postId) => {
    if (!window.confirm("Are you sure you want to delete this post?")) return;
    try {
      const res = await axios.delete(`http://localhost:5002/api/posts/${postId}`);
      if (res.data.success) {
        setPosts((prev) => prev.filter((p) => p._id !== postId));
        setMsg({ text: "Post deleted.", type: "success" });
      }
    } catch (err) {
      console.error("Delete post error:", err);
    }
  };

  const handleSaveEditPost = async (postId) => {
    if (!editPostContent || !editPostContent.trim()) return;
    try {
      const res = await axios.put(`http://localhost:5002/api/posts/${postId}`, {
        content: editPostContent.trim(),
      });
      if (res.data.success) {
        setPosts((prev) =>
          prev.map((p) => (p._id === postId ? { ...p, content: editPostContent.trim() } : p))
        );
        setEditingPostId(null);
        setEditPostContent("");
      }
    } catch (err) {
      console.error("Edit post error:", err);
    }
  };

  const [activeNav, setActiveNav] = useState("about");

  const scrollToSection = (id) => {
    setActiveNav(id);
    const elem = document.getElementById(id);
    if (elem) {
      const offset = 80;
      const bodyRect = document.body.getBoundingClientRect().top;
      const elemRect = elem.getBoundingClientRect().top;
      const elemPosition = elemRect - bodyRect;
      const offsetPosition = elemPosition - offset;
      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth"
      });
    }
  };

  const completionPct = calculateCompletion();

  if (profileLoading) {
    return (
      <div className="candidate-profile-page">
        <CandidateNavbar />
        <div className="profile-container animate-fade-in">
          <div className="profile-loading-box">
            <FaSpinner className="spinner-icon-blue" />
            <p>Loading your profile...</p>
          </div>
        </div>
      </div>
    );
  }

  if (profileError) {
    return (
      <div className="candidate-profile-page">
        <CandidateNavbar />
        <div className="profile-container animate-fade-in">
          <div className="profile-error-card">
            <FaExclamationTriangle className="error-icon-red" />
            <h3>Unable to load your profile.</h3>
            <p>There was an error communicating with the backend server.</p>
            <button type="button" className="btn-ats-blue" onClick={fetchProfile} style={{ margin: "16px auto 0 auto" }}>
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="candidate-profile-page">
      <CandidateNavbar onToggleSidebar={() => setSidebarOpen((prev) => !prev)} />

      <div className="candidate-profile-shell">
        {/* Sidebar Drawer */}
        <aside className={`profile-sidebar ${sidebarOpen ? "sidebar-open" : "sidebar-collapsed"}`}>
          <div className="sidebar-nav">
            <div className="sidebar-drawer-header">
              <h4>QUICK ACTIONS</h4>
              <button
                className="sidebar-close-btn"
                onClick={() => setSidebarOpen(false)}
                type="button"
                aria-label="Close navigation"
              >
                ✕
              </button>
            </div>
            <button
              className="nav-btn"
              onClick={() => {
                navigate("/candidate-dashboard");
                setSidebarOpen(false);
              }}
            >
              <FiGrid className="btn-icon" />
              <span>Dashboard Home</span>
            </button>
            <button
              className="nav-btn"
              onClick={() => {
                navigate("/candidate-job-offers");
                setSidebarOpen(false);
              }}
            >
              <FiAward className="btn-icon" />
              <span>Job Offer</span>
            </button>
            <button
              className="nav-btn active"
              onClick={() => setSidebarOpen(false)}
            >
              <FiUser className="btn-icon" />
              <span>My Profile</span>
            </button>
            <button
              className="nav-btn"
              onClick={() => {
                navigate("/candidate-jobs");
                setSidebarOpen(false);
              }}
            >
              <FiSearch className="btn-icon" />
              <span>Explore Jobs</span>
            </button>
            <button
              className="nav-btn"
              onClick={() => {
                navigate("/candidate-applications");
                setSidebarOpen(false);
              }}
            >
              <FiFileText className="btn-icon" />
              <span>My Applications</span>
              <span className="sidebar-count-badge">2</span>
            </button>
            <button
              className="nav-btn"
              onClick={() => {
                navigate("/candidate-interviews");
                setSidebarOpen(false);
              }}
            >
              <FiCalendar className="btn-icon" />
              <span>My Interviews</span>
              <span className="sidebar-count-badge">2</span>
            </button>
            <button
              className="nav-btn nav-btn-logout"
              onClick={logout}
            >
              <FiLogOut className="btn-icon" />
              <span>Logout</span>
            </button>
          </div>
        </aside>
        {sidebarOpen && <div className="sidebar-backdrop" onClick={() => setSidebarOpen(false)} />}

        {/* Main Content Area */}
        <div className="profile-main-content animate-fade-in">
          {msg && <div className={`profile-toast toast-${msg.type}`}>{msg.text}</div>}

          {/* 1. HERO PROFILE CARD */}
          <div className="profile-hero-card-box">
            <div className="profile-hero-left">
              <div className="profile-hero-avatar">
                {profile.profilePicture ? (
                  <img src={getUrl(profile.profilePicture)} alt={profile.name} />
                ) : (
                  <span>
                    {profile.name
                      ? profile.name.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase()
                      : "FS"}
                  </span>
                )}
              </div>
              <div className="profile-hero-details">
                <h1>{profile.name || user?.name || "Foram Soni"}</h1>
                <p className="profile-hero-sub">
                  {profile.headline || "MCA student, 2025 to 2027"}
                </p>
                <div className="profile-hero-badges-row">
                  <span className="hero-info-badge">
                    <FiMail /> {profile.email || user?.email || "foram.imca22@gmail.com"}
                  </span>
                  <span className="hero-info-badge">
                    <FiPhone /> {profile.phone || "8141153084"}
                  </span>
                  <span className="hero-info-badge">
                    <FiMapPin /> {profile.location || "Location not added"}
                  </span>
                </div>
              </div>
            </div>

            <div className="profile-hero-right">
              <button
                type="button"
                className="btn-edit-profile-hero"
                onClick={() => setShowEditModal(true)}
              >
                <FiEdit2 /> Edit profile
              </button>
            </div>
          </div>

          {/* 2. FIVE PROFILE STATUS STATS CARDS */}
          <div className="profile-stats-5-row">
            <div className="p-stat-box">
              <span className="p-stat-label">Profile status</span>
              <span className="p-stat-number">{completionPct}%</span>
              <span className="p-stat-sub">Complete your profile</span>
            </div>
            <div className="p-stat-box">
              <span className="p-stat-label">Experience</span>
              <span className="p-stat-number">{profile.experience?.length ? `${profile.experience.length}+ years` : "0+ years"}</span>
              <span className="p-stat-sub">{profile.experience?.length ? "Work history listed" : "No work history yet"}</span>
            </div>
            <div className="p-stat-box">
              <span className="p-stat-label">Education</span>
              <span className="p-stat-number">{profile.education?.length || 1}</span>
              <span className="p-stat-sub">Listed</span>
            </div>
            <div className="p-stat-box">
              <span className="p-stat-label">Skills</span>
              <span className="p-stat-number">{profile.skills?.length || 13}</span>
              <span className="p-stat-sub">Listed</span>
            </div>
            <div className="p-stat-box">
              <span className="p-stat-label">Certificates</span>
              <span className="p-stat-number">{profile.certificates?.length || 0}</span>
              <span className="p-stat-sub">Verified</span>
            </div>
          </div>

          {/* 3. SECTION NAVIGATION TABS */}
          <div className="profile-section-tabs-bar">
            <button
              className={`p-tab-btn ${activeProfileTab === "about" ? "active" : ""}`}
              onClick={() => setActiveProfileTab("about")}
            >
              About
            </button>
            <button
              className={`p-tab-btn ${activeProfileTab === "skills" ? "active" : ""}`}
              onClick={() => setActiveProfileTab("skills")}
            >
              Skills
            </button>
            <button
              className={`p-tab-btn ${activeProfileTab === "education" ? "active" : ""}`}
              onClick={() => setActiveProfileTab("education")}
            >
              Education
            </button>
            <button
              className={`p-tab-btn ${activeProfileTab === "experience" ? "active" : ""}`}
              onClick={() => setActiveProfileTab("experience")}
            >
              Experience
            </button>
            <button
              className={`p-tab-btn ${activeProfileTab === "resume" ? "active" : ""}`}
              onClick={() => setActiveProfileTab("resume")}
            >
              Resume
            </button>
          </div>

          {/* 4. MAIN TWO-COLUMN BODY */}
          <div className="profile-two-col-layout">
            {/* LEFT COLUMN */}
            <div className="profile-left-stack">
              {/* About me Card */}
              <div className="profile-card-box" id="about">
                <div className="profile-card-header">
                  <h3>About me</h3>
                  <button
                    type="button"
                    className="btn-card-action-outline"
                    onClick={() => setShowEditModal(true)}
                  >
                    <FiEdit2 /> Edit
                  </button>
                </div>
                {profile.about && profile.about.trim() ? (
                  <p className="profile-about-text">{profile.about}</p>
                ) : (
                  <div className="profile-dashed-empty-box">
                    <p>Add a short professional summary so recruiters know who you are.</p>
                    <button
                      type="button"
                      className="btn-card-action-outline"
                      onClick={() => setShowEditModal(true)}
                    >
                      <FiPlus /> Add summary
                    </button>
                  </div>
                )}
              </div>

              {/* Skills and expertise Card */}
              <div className="profile-card-box" id="skills">
                <div className="profile-card-header">
                  <h3>Skills and expertise</h3>
                  <button
                    type="button"
                    className="btn-card-action-outline"
                    onClick={() => setShowSkillsModal(true)}
                  >
                    <FiEdit2 /> Edit skills
                  </button>
                </div>
                <div className="profile-skills-pills-wrap">
                  {(profile.skills && profile.skills.length > 0
                    ? profile.skills
                    : ["Flask", "CSS", "Django", "Express", "Git", "HTML", "Java", "JavaScript", "MongoDB", "Node.js", "Python", "React", "SQL"]
                  ).map((skill, idx) => (
                    <span key={idx} className="p-skill-pill-box">
                      {typeof skill === "string" ? skill : skill.name || "Skill"}
                    </span>
                  ))}
                </div>
              </div>

              {/* Education Card */}
              <div className="profile-card-box" id="education">
                <div className="profile-card-header">
                  <h3>Education</h3>
                  <button
                    type="button"
                    className="btn-card-action-outline"
                    onClick={() => setShowEduModal(true)}
                  >
                    <FiPlus /> Add education
                  </button>
                </div>
                <div className="profile-items-list">
                  {profile.education && profile.education.length > 0 ? (
                    profile.education.map((edu, idx) => (
                      <div key={idx} className="profile-item-box">
                        <div className="item-info">
                          <h4>{edu.degree || "Master of Computer Applications (MCA)"}</h4>
                          <p>{edu.institution || "Degree"}</p>
                          <span className="item-date-pill">
                            {edu.year || "2025 to 2027"}
                          </span>
                        </div>
                        <button
                          type="button"
                          className="btn-item-delete"
                          onClick={() => handleDeleteEducation(idx)}
                          title="Delete education"
                        >
                          <FiTrash2 />
                        </button>
                      </div>
                    ))
                  ) : (
                    <div className="profile-item-box">
                      <div className="item-info">
                        <h4>Master of Computer Applications (MCA)</h4>
                        <p>Degree</p>
                        <span className="item-date-pill">2025 to 2027</span>
                      </div>
                      <button
                        type="button"
                        className="btn-item-delete"
                        onClick={() => setShowEduModal(true)}
                        title="Delete education"
                      >
                        <FiTrash2 />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Work experience Card */}
              <div className="profile-card-box" id="experience">
                <div className="profile-card-header">
                  <h3>Work experience</h3>
                  <button
                    type="button"
                    className="btn-card-action-outline"
                    onClick={() => setShowExpModal(true)}
                  >
                    <FiPlus /> Add experience
                  </button>
                </div>
                {profile.experience && profile.experience.length > 0 ? (
                  <div className="profile-items-list">
                    {profile.experience.map((exp, idx) => (
                      <div key={idx} className="profile-item-box">
                        <div className="item-info">
                          <h4>{exp.title}</h4>
                          <p>{exp.company} {exp.duration ? `• ${exp.duration}` : ""}</p>
                        </div>
                        <button
                          type="button"
                          className="btn-item-delete"
                          onClick={() => handleDeleteExperience(idx)}
                          title="Delete experience"
                        >
                          <FiTrash2 />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="profile-dashed-empty-box">
                    <p>No work experience added yet.</p>
                    <button
                      type="button"
                      className="btn-card-action-outline"
                      onClick={() => setShowExpModal(true)}
                    >
                      <FiPlus /> Add experience
                    </button>
                  </div>
                )}
              </div>

              {/* Certifications and achievements Card */}
              <div className="profile-card-box">
                <div className="profile-card-header">
                  <h3>Certifications and achievements</h3>
                  <button
                    type="button"
                    className="btn-card-action-outline"
                    onClick={() => setShowCertModal(true)}
                  >
                    <FiPlus /> Add certificate
                  </button>
                </div>
                {profile.certificates && profile.certificates.length > 0 ? (
                  <div className="profile-items-list">
                    {profile.certificates.map((cert) => (
                      <div key={cert._id || Math.random()} className="profile-item-box">
                        <div className="item-info">
                          <h4>{cert.name}</h4>
                          <p>{cert.issuingOrganization || "Issuing Organization"}</p>
                          {cert.issueDate && (
                            <span className="item-date-pill">Issued: {cert.issueDate}</span>
                          )}
                        </div>
                        <button
                          type="button"
                          className="btn-item-delete"
                          onClick={() => handleDeleteCert(cert._id)}
                          title="Delete certificate"
                        >
                          <FiTrash2 />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="profile-dashed-empty-box">
                    <p>No certificates added yet.</p>
                    <button
                      type="button"
                      className="btn-card-action-outline"
                      onClick={() => setShowCertModal(true)}
                    >
                      <FiPlus /> Add certificate
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* RIGHT COLUMN */}
            <div className="profile-right-stack">
              {/* Profile Completion Widget */}
              <div className="profile-card-box">
                <div className="profile-card-header">
                  <h3>Profile completion</h3>
                  <span className="completion-pct-tag">{completionPct}%</span>
                </div>
                <div className="profile-widget-progress-wrap">
                  <div
                    className="profile-widget-progress-fill"
                    style={{ width: `${completionPct}%` }}
                  />
                </div>
                <div className="profile-widget-checklist">
                  <div className="p-chk-item-box">
                    <span>Contact details</span>
                    <span className="p-chk-done">Done</span>
                  </div>
                  <div className="p-chk-item-box">
                    <span>Education</span>
                    <span className="p-chk-done">Done</span>
                  </div>
                  <div className="p-chk-item-box">
                    <span>Skills</span>
                    <span className="p-chk-done">Done</span>
                  </div>
                  <div className="p-chk-item-box">
                    <span>About summary</span>
                    <button
                      type="button"
                      className="p-chk-add-btn"
                      onClick={() => setShowEditModal(true)}
                    >
                      {profile.about ? "Done" : "Add"}
                    </button>
                  </div>
                  <div className="p-chk-item-box">
                    <span>Work experience</span>
                    <button
                      type="button"
                      className="p-chk-add-btn"
                      onClick={() => setShowExpModal(true)}
                    >
                      {profile.experience?.length ? "Done" : "Add"}
                    </button>
                  </div>
                  <div className="p-chk-item-box">
                    <span>Location</span>
                    <button
                      type="button"
                      className="p-chk-add-btn"
                      onClick={() => setShowEditModal(true)}
                    >
                      {profile.location ? "Done" : "Add"}
                    </button>
                  </div>
                </div>
              </div>

              {/* Resume Widget */}
              <div className="profile-card-box" id="resume">
                <div className="profile-card-header">
                  <h3>Resume</h3>
                </div>
                <div className="profile-resume-preview-card">
                  <div className="resume-doc-top">
                    <FiFileText className="resume-file-icon" />
                    <strong>{profile.name || user?.name || "Foram Soni"}</strong>
                  </div>
                  <div className="resume-dashed-line" />
                  <div className="resume-skeleton-lines">
                    <div className="sk-line sk-long" />
                    <div className="sk-line sk-med" />
                    <div className="sk-line sk-short" />
                    <div className="sk-line sk-long" />
                  </div>
                  <p className="resume-filename-text">
                    {profile.resume || "1788340427153-Foram_Soni_Resume_3.pdf"}
                  </p>

                  <div className="resume-actions-row-grid">
                    {profile.resume ? (
                      <a
                        href={`http://localhost:5002/uploads/resume/${encodeURIComponent(profile.resume)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-resume-view"
                      >
                        <FiEye /> View
                      </a>
                    ) : (
                      <button type="button" className="btn-resume-view">
                        <FiEye /> View
                      </button>
                    )}
                    {profile.resume ? (
                      <a
                        href={`http://localhost:5002/uploads/resume/${encodeURIComponent(profile.resume)}`}
                        download
                        className="btn-resume-download"
                      >
                        <FiDownload /> Download
                      </a>
                    ) : (
                      <button type="button" className="btn-resume-download">
                        <FiDownload /> Download
                      </button>
                    )}
                  </div>

                  <label className="btn-resume-upload-full">
                    <FiUpload /> Upload new resume
                    <input
                      type="file"
                      accept=".pdf,.docx"
                      onChange={handleResumeUpload}
                      style={{ display: "none" }}
                    />
                  </label>
                  {resumeUploading && <p className="uploading-msg">Uploading resume file...</p>}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* EDIT PROFILE MODAL */}
      {showEditModal && (
        <div className="ats-overlay" onClick={() => setShowEditModal(false)}>
          <div className="edit-profile-modal-blue" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-blue">
              <h2>Edit Professional Profile</h2>
              <button type="button" className="close-btn-blue" onClick={() => setShowEditModal(false)}>✕</button>
            </div>

            <form onSubmit={handleSaveProfile} className="edit-profile-form">
              <div className="form-grid-2">
                <div className="form-group-blue">
                  <label className="field-label">Full Name</label>
                  <input type="text" className="ats-form-input" name="name" value={profile.name} onChange={handleEditChange} required />
                </div>

                <div className="form-group-blue">
                  <label className="field-label">Phone</label>
                  <input type="text" className="ats-form-input" name="phone" value={profile.phone} onChange={handleEditChange} />
                </div>
              </div>

              <div className="form-group-blue">
                <label className="field-label">Professional Headline</label>
                <input type="text" className="ats-form-input" name="headline" placeholder="e.g. Frontend Developer | Software Engineer" value={profile.headline} onChange={handleEditChange} />
              </div>

              <div className="form-group-blue">
                <label className="field-label">Location</label>
                <input type="text" className="ats-form-input" name="location" placeholder="e.g. Ahmedabad, India" value={profile.location} onChange={handleEditChange} />
              </div>

              <div className="form-group-blue">
                <label className="field-label">Profile Photo</label>
                <input type="file" accept="image/*" onChange={handleAvatarSelect} className="file-input-custom" />
                {avatarPreview && <img src={avatarPreview} alt="Preview" style={{ width: "60px", height: "60px", borderRadius: "50%", marginTop: "6px", objectFit: "cover" }} />}
              </div>

              <div className="form-group-blue">
                <label className="field-label">About / Bio</label>
                <textarea className="ats-form-textarea" rows="3" name="about" value={profile.about} onChange={handleEditChange} />
              </div>

              <div className="form-grid-3">
                <div className="form-group-blue">
                  <label className="field-label">LinkedIn URL</label>
                  <input type="text" className="ats-form-input" name="linkedin" value={profile.linkedin} onChange={handleEditChange} />
                </div>
                <div className="form-group-blue">
                  <label className="field-label">GitHub URL</label>
                  <input type="text" className="ats-form-input" name="github" value={profile.github} onChange={handleEditChange} />
                </div>
                <div className="form-group-blue">
                  <label className="field-label">Portfolio URL</label>
                  <input type="text" className="ats-form-input" name="portfolio" value={profile.portfolio} onChange={handleEditChange} />
                </div>
              </div>

              <div className="modal-footer-blue">
                <button type="button" className="btn-ats-blue" onClick={() => setShowEditModal(false)} disabled={loading}>
                  Cancel
                </button>
                <button type="submit" className="btn-ats-blue" disabled={loading}>
                  {loading ? "Saving..." : "Save Profile"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT SKILLS MODAL */}
      {showSkillsModal && (
        <div className="ats-overlay" onClick={() => setShowSkillsModal(false)}>
          <div className="edit-profile-modal-blue" style={{ maxWidth: "500px" }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-blue">
              <h2>Edit Skills</h2>
              <button type="button" className="close-btn-blue" onClick={() => setShowSkillsModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSaveSkills} className="edit-profile-form">
              <div className="form-group-blue">
                <label className="field-label">Skills (Comma separated)</label>
                <textarea
                  rows="4"
                  className="ats-form-textarea"
                  placeholder="Flask, CSS, Django, Express, Git, HTML, Java, JavaScript, MongoDB, Node.js, Python, React, SQL"
                  value={skillsInput}
                  onChange={(e) => setSkillsInput(e.target.value)}
                />
              </div>
              <div className="modal-footer-blue">
                <button type="button" className="btn-ats-blue" onClick={() => setShowSkillsModal(false)}>Cancel</button>
                <button type="submit" className="btn-ats-blue">Save Skills</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD EDUCATION MODAL */}
      {showEduModal && (
        <div className="ats-overlay" onClick={() => setShowEduModal(false)}>
          <div className="edit-profile-modal-blue" style={{ maxWidth: "520px" }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-blue">
              <h2>Add Education</h2>
              <button type="button" className="close-btn-blue" onClick={() => setShowEduModal(false)}>✕</button>
            </div>
            <form onSubmit={handleAddEducation} className="edit-profile-form">
              <div className="form-group-blue">
                <label className="field-label">Degree / Field of Study *</label>
                <input type="text" className="ats-form-input" required placeholder="e.g. Master of Computer Applications (MCA)" value={eduForm.degree} onChange={(e) => setEduForm({ ...eduForm, degree: e.target.value })} />
              </div>
              <div className="form-group-blue">
                <label className="field-label">University / Institution</label>
                <input type="text" className="ats-form-input" placeholder="e.g. GLS University, Ahmedabad" value={eduForm.institution} onChange={(e) => setEduForm({ ...eduForm, institution: e.target.value })} />
              </div>
              <div className="form-grid-2">
                <div className="form-group-blue">
                  <label className="field-label">Year / Duration</label>
                  <input type="text" className="ats-form-input" placeholder="e.g. 2025 – 2027" value={eduForm.year} onChange={(e) => setEduForm({ ...eduForm, year: e.target.value })} />
                </div>
                <div className="form-group-blue">
                  <label className="field-label">CGPA / Grade (Optional)</label>
                  <input type="text" className="ats-form-input" placeholder="e.g. 8.5 / 10" value={eduForm.cgpa} onChange={(e) => setEduForm({ ...eduForm, cgpa: e.target.value })} />
                </div>
              </div>
              <div className="form-grid-2">
                <div className="form-group-blue">
                  <label className="field-label">Field of Study (Optional)</label>
                  <input type="text" className="ats-form-input" placeholder="e.g. Computer Science & Engineering" value={eduForm.fieldOfStudy || ""} onChange={(e) => setEduForm({ ...eduForm, fieldOfStudy: e.target.value })} />
                </div>
                <div className="form-group-blue">
                  <label className="field-label">Location (Optional)</label>
                  <input type="text" className="ats-form-input" placeholder="e.g. Ahmedabad, India" value={eduForm.location || ""} onChange={(e) => setEduForm({ ...eduForm, location: e.target.value })} />
                </div>
              </div>
              <div className="form-group-blue">
                <label className="field-label">Description / Additional Information (Optional)</label>
                <textarea rows="3" className="ats-form-textarea" placeholder="Specialized coursework, honors, projects, thesis, etc." value={eduForm.description || ""} onChange={(e) => setEduForm({ ...eduForm, description: e.target.value })} />
              </div>
              <div className="modal-footer-blue">
                <button type="button" className="btn-ats-blue" onClick={() => setShowEduModal(false)}>Cancel</button>
                <button type="submit" className="btn-ats-blue">Add Education</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD WORK EXPERIENCE MODAL */}
      {showExpModal && (
        <div className="ats-overlay" onClick={() => setShowExpModal(false)}>
          <div className="edit-profile-modal-blue" style={{ maxWidth: "540px" }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-blue">
              <h2>Add Work Experience</h2>
              <button type="button" className="close-btn-blue" onClick={() => setShowExpModal(false)}>✕</button>
            </div>
            <form onSubmit={handleAddExperience} className="edit-profile-form">
              <div className="form-group-blue">
                <label className="field-label">Job Title / Role *</label>
                <input type="text" className="ats-form-input" required placeholder="e.g. Frontend Developer" value={expForm.title} onChange={(e) => setExpForm({ ...expForm, title: e.target.value })} />
              </div>
              <div className="form-group-blue">
                <label className="field-label">Company / Organization</label>
                <input type="text" className="ats-form-input" placeholder="e.g. Tech Solutions Ltd." value={expForm.company} onChange={(e) => setExpForm({ ...expForm, company: e.target.value })} />
              </div>
              <div className="form-grid-2">
                <div className="form-group-blue">
                  <label className="field-label">Duration / Dates</label>
                  <input type="text" className="ats-form-input" placeholder="e.g. 2023 - Present" value={expForm.duration} onChange={(e) => setExpForm({ ...expForm, duration: e.target.value })} />
                </div>
                <div className="form-group-blue">
                  <label className="field-label">Location (Optional)</label>
                  <input type="text" className="ats-form-input" placeholder="e.g. Ahmedabad, India" value={expForm.location} onChange={(e) => setExpForm({ ...expForm, location: e.target.value })} />
                </div>
              </div>
              <div className="form-group-blue">
                <label className="field-label">Description / Responsibilities</label>
                <textarea rows="3" className="ats-form-textarea" placeholder="Describe your key achievements and technologies used..." value={expForm.description} onChange={(e) => setExpForm({ ...expForm, description: e.target.value })} />
              </div>
              <div className="modal-footer-blue">
                <button type="button" className="btn-ats-blue" onClick={() => setShowExpModal(false)}>Cancel</button>
                <button type="submit" className="btn-ats-blue">Add Experience</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD PROJECT MODAL */}
      {showProjModal && (
        <div className="ats-overlay" onClick={() => setShowProjModal(false)}>
          <div className="edit-profile-modal-blue" style={{ maxWidth: "560px" }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-blue">
              <h2>Add Project</h2>
              <button type="button" className="close-btn-blue" onClick={() => setShowProjModal(false)}>✕</button>
            </div>
            <form onSubmit={handleAddProject} className="edit-profile-form">
              <div className="form-group-blue">
                <label className="field-label">Project Name *</label>
                <input type="text" className="ats-form-input" required placeholder="e.g. Text Summarization System" value={projForm.name} onChange={(e) => setProjForm({ ...projForm, name: e.target.value })} />
              </div>
              <div className="form-group-blue">
                <label className="field-label">Technologies Used (Comma separated)</label>
                <input type="text" className="ats-form-input" placeholder="e.g. Python, Flask, mT5, TF-IDF" value={projForm.technologies} onChange={(e) => setProjForm({ ...projForm, technologies: e.target.value })} />
              </div>
              <div className="form-group-blue">
                <label className="field-label">Project Description</label>
                <textarea rows="3" className="ats-form-textarea" placeholder="Developed a text summarization system using Python and NLP techniques..." value={projForm.description} onChange={(e) => setProjForm({ ...projForm, description: e.target.value })} />
              </div>
              <div className="form-grid-2">
                <div className="form-group-blue">
                  <label className="field-label">Project Live URL (Optional)</label>
                  <input type="text" className="ats-form-input" placeholder="https://..." value={projForm.projectUrl} onChange={(e) => setProjForm({ ...projForm, projectUrl: e.target.value })} />
                </div>
                <div className="form-group-blue">
                  <label className="field-label">GitHub Repository URL (Optional)</label>
                  <input type="text" className="ats-form-input" placeholder="https://github.com/..." value={projForm.githubUrl} onChange={(e) => setProjForm({ ...projForm, githubUrl: e.target.value })} />
                </div>
              </div>
              <div className="modal-footer-blue">
                <button type="button" className="btn-ats-blue" onClick={() => setShowProjModal(false)}>Cancel</button>
                <button type="submit" className="btn-ats-blue">Add Project</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD CERTIFICATE MODAL */}
      {showCertModal && (
        <div className="ats-overlay" onClick={() => setShowCertModal(false)}>
          <div className="edit-profile-modal-blue" style={{ maxWidth: "540px" }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-blue">
              <h2>Add Certificate</h2>
              <button type="button" className="close-btn-blue" onClick={() => setShowCertModal(false)}>✕</button>
            </div>

            <form onSubmit={handleAddCertificate} className="edit-profile-form">
              <div className="form-group-blue">
                <label className="field-label">Certificate Name *</label>
                <input type="text" className="ats-form-input" required placeholder="e.g. React Development" value={certForm.name} onChange={(e) => setCertForm({ ...certForm, name: e.target.value })} />
              </div>

              <div className="form-group-blue">
                <label className="field-label">Issuing Organization</label>
                <input type="text" className="ats-form-input" placeholder="e.g. Coursera" value={certForm.issuingOrganization} onChange={(e) => setCertForm({ ...certForm, issuingOrganization: e.target.value })} />
              </div>

              <div className="form-grid-2">
                <div className="form-group-blue">
                  <label className="field-label">Issue Date</label>
                  <input type="text" className="ats-form-input" placeholder="e.g. Aug 2026" value={certForm.issueDate} onChange={(e) => setCertForm({ ...certForm, issueDate: e.target.value })} />
                </div>
                <div className="form-group-blue">
                  <label className="field-label">Expiry Date (Optional)</label>
                  <input type="text" className="ats-form-input" placeholder="e.g. Aug 2028" value={certForm.expiryDate} onChange={(e) => setCertForm({ ...certForm, expiryDate: e.target.value })} />
                </div>
              </div>

              <div className="form-group-blue">
                <label className="field-label">Credential ID (Optional)</label>
                <input type="text" className="ats-form-input" placeholder="e.g. CERT-89123" value={certForm.credentialId} onChange={(e) => setCertForm({ ...certForm, credentialId: e.target.value })} />
              </div>

              <div className="form-group-blue">
                <label className="field-label">Credential URL (Optional)</label>
                <input type="text" className="ats-form-input" placeholder="https://..." value={certForm.credentialUrl} onChange={(e) => setCertForm({ ...certForm, credentialUrl: e.target.value })} />
              </div>

              <div className="form-group-blue">
                <label className="field-label">Upload Certificate File (PDF/Image)</label>
                <input type="file" accept="image/*,.pdf" onChange={(e) => setCertForm({ ...certForm, file: e.target.files[0] })} className="file-input-custom" />
              </div>

              <div className="modal-footer-blue">
                <button type="button" className="btn-ats-blue" onClick={() => setShowCertModal(false)} disabled={addingCert}>
                  Cancel
                </button>
                <button type="submit" className="btn-ats-blue" disabled={addingCert}>
                  {addingCert ? "Adding..." : "Add Certificate"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

export default CandidateProfile;
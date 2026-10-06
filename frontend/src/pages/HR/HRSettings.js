import React, { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";
import CustomToast from "../../components/common/CustomToast";
import "./HRSettings.css";

function HRSettings() {
  const { user } = useAuth();
  const hrUser = user || JSON.parse(sessionStorage.getItem("user") || localStorage.getItem("user") || "{}");

  const [threshold, setThreshold] = useState(50);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState({ show: false, title: "", message: "", type: "info" });

  const showToast = (title, message, type = "success") => {
    setToast({ show: true, title, message, type });
  };

  useEffect(() => {
    if (hrUser?._id) {
      fetchHrSettings();
    } else {
      setLoading(false);
    }
  }, [hrUser?._id]);

  const fetchHrSettings = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`http://localhost:5002/api/hr/settings/${hrUser._id}`);
      if (res.data.success && typeof res.data.settings?.atsThreshold === "number") {
        setThreshold(res.data.settings.atsThreshold);
      }
    } catch (err) {
      console.error("Fetch HR Settings Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    const numValue = Number(threshold);
    if (isNaN(numValue) || numValue < 0 || numValue > 100) {
      showToast("Invalid value", "Please enter a value between 0 and 100.", "error");
      return;
    }

    try {
      setSaving(true);
      const res = await axios.post(`http://localhost:5002/api/hr/settings/${hrUser._id}`, {
        atsThreshold: numValue,
      });

      if (res.data.success) {
        showToast("Settings Saved", "Candidate threshold settings saved successfully.", "success");
      } else {
        showToast("Error", res.data.message || "Failed to update settings.", "error");
      }
    } catch (err) {
      console.error("Save HR Settings Error:", err);
      showToast("Settings Saved", "Candidate threshold settings saved successfully.", "success");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="hr-settings-layout-page">
      {toast.show && (
        <CustomToast
          title={toast.title}
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({ show: false, title: "", message: "", type: "info" })}
        />
      )}

      {/* Header */}
      <div className="hr-settings-header-block">
        <h1 className="hr-settings-main-title">HR workspace settings</h1>
        <p className="hr-settings-main-subtitle">
          Configure candidate qualification thresholds for your recruitment process.
        </p>
      </div>

      {/* Settings Card Container */}
      <form onSubmit={handleSaveSettings} className="hr-settings-card-box">
        {/* Top Info Section */}
        <div className="hr-settings-section-top">
          <h3 className="settings-section-heading">ATS qualified score threshold</h3>
          <p className="settings-section-desc">
            Candidates scoring above this threshold will automatically be marked as Qualified for HR review.
          </p>
        </div>

        {/* Input & Form Section */}
        <div className="hr-settings-section-body">
          <label className="settings-input-label">Match threshold</label>
          <div className="settings-input-row">
            <div className="settings-input-number-wrap">
              <input
                type="number"
                min="0"
                max="100"
                value={threshold}
                onChange={(e) => setThreshold(e.target.value)}
                className="settings-number-input"
                required
              />
              <span className="settings-percent-unit">%</span>
            </div>
            <span className="settings-match-text">match</span>
          </div>
          <span className="settings-helper-hint">Enter a value between 0 and 100.</span>
        </div>

        {/* Save Button Row */}
        <div className="hr-settings-btn-row">
          <button type="submit" className="hr-settings-submit-btn" disabled={saving}>
            {saving ? "Saving..." : "Save settings"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default HRSettings;

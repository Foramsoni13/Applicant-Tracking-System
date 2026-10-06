import React, { useEffect, useState } from "react";
import axios from "axios";
import { FaUserCheck, FaSpinner, FaCheckCircle, FaExclamationTriangle } from "react-icons/fa";

function AdminSettings() {
  const [autoActivateHr, setAutoActivateHr] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await axios.get("http://localhost:5002/api/admin/settings");
      if (res.data.success && typeof res.data.settings?.autoActivateHr === "boolean") {
        setAutoActivateHr(res.data.settings.autoActivateHr);
      }
    } catch (err) {
      console.error("Fetch Admin Settings Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleAutoActivate = async (newValue) => {
    try {
      setSaving(true);
      setMessage({ type: "", text: "" });
      setAutoActivateHr(newValue);

      const res = await axios.put("http://localhost:5002/api/admin/settings", {
        autoActivateHr: newValue,
      });

      if (res.data.success) {
        setMessage({
          type: "success",
          text: newValue
            ? "Auto-activation enabled: Newly registered HR accounts will be active immediately."
            : "Auto-activation disabled: Newly registered HR accounts require explicit Admin activation.",
        });
      }
    } catch (err) {
      console.error("Update Admin Settings Error:", err);
      setMessage({ type: "error", text: "Failed to update system settings." });
      // Revert state on failure
      setAutoActivateHr(!newValue);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="empty-state-admin">
        <FaSpinner className="spinner" style={{ fontSize: "28px", color: "#2563eb" }} />
        <p>Loading Admin Settings...</p>
      </div>
    );
  }

  return (
    <div className="admin-card-table" style={{ padding: "32px" }}>
      <div style={{ borderBottom: "1px solid #e2e8f0", paddingBottom: "16px", marginBottom: "24px" }}>
        <h3 style={{ margin: 0, fontSize: "18px", fontWeight: 700, color: "#1e293b" }}>Admin System Settings</h3>
        <p style={{ margin: "4px 0 0", fontSize: "13px", color: "#64748b" }}>
          Manage global enterprise policies and HR account activation behavior.
        </p>
      </div>

      {message.text && (
        <div
          style={{
            padding: "12px 16px",
            borderRadius: "8px",
            marginBottom: "20px",
            fontSize: "14px",
            fontWeight: 500,
            display: "flex",
            alignItems: "center",
            gap: "8px",
            maxWidth: "600px",
            backgroundColor: message.type === "success" ? "#f0fdf4" : "#fef2f2",
            color: message.type === "success" ? "#16a34a" : "#dc2626",
            border: `1px solid ${message.type === "success" ? "#bbf7d0" : "#fecaca"}`,
          }}
        >
          {message.type === "success" ? <FaCheckCircle /> : <FaExclamationTriangle />}
          <span>{message.text}</span>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: "24px", maxWidth: "600px" }}>
        {/* HR Auto Activation Setting */}
        <div style={{ background: "#ffffff", border: "1px solid #dbe4f0", padding: "24px", borderRadius: "12px", boxShadow: "0 2px 12px rgba(15, 23, 42, 0.05)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={{ width: "36px", height: "36px", borderRadius: "8px", backgroundColor: "#eff6ff", color: "#2563eb", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px" }}>
                <FaUserCheck />
              </div>
              <h4 style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: "#1e293b" }}>
                Auto-activate newly created HR accounts
              </h4>
            </div>

            {/* Custom Toggle Switch */}
            <label style={{ position: "relative", display: "inline-block", width: "48px", height: "26px" }}>
              <input
                type="checkbox"
                checked={autoActivateHr}
                onChange={(e) => handleToggleAutoActivate(e.target.checked)}
                disabled={saving}
                style={{ opacity: 0, width: 0, height: 0 }}
              />
              <span
                style={{
                  position: "absolute",
                  cursor: "pointer",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: autoActivateHr ? "#2563eb" : "#cbd5e1",
                  transition: ".3s",
                  borderRadius: "26px",
                }}
              >
                <span
                  style={{
                    position: "absolute",
                    content: '""',
                    height: "20px",
                    width: "20px",
                    left: autoActivateHr ? "24px" : "3px",
                    bottom: "3px",
                    backgroundColor: "white",
                    transition: ".3s",
                    borderRadius: "50%",
                  }}
                />
              </span>
            </label>
          </div>

          <p style={{ margin: 0, fontSize: "14px", color: "#64748b", lineHeight: "1.5" }}>
            Control whether newly registered HR accounts require explicit Admin activation before posting jobs. When disabled, newly created HR accounts will remain pending until an Admin approves them.
          </p>
        </div>
      </div>
    </div>
  );
}

export default AdminSettings;

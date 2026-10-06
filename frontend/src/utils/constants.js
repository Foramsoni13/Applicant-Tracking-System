// ===============================
// API Configuration
// ===============================
// All API requests point to this base URL (port 5002).
// Uses the REACT_APP_API_URL environment variable with a hardcoded fallback to port 5002.

export const API_BASE_URL = process.env.REACT_APP_API_URL || "http://127.0.0.1:5002";

// ===============================
// Safe Date Formatting Helpers
// ===============================

/**
 * Format any date string / ISO date / timestamp safely.
 * Returns a human-friendly string (e.g. "Aug 30, 2026") or fallback.
 */
export const formatDate = (dateVal, fallback = "N/A") => {
  if (!dateVal) return fallback;
  try {
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return fallback;
    return d.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch (err) {
    return fallback;
  }
};

/**
 * Format date & time safely (e.g. "Aug 30, 2026, 2:30 PM").
 */
export const formatDateTime = (dateVal, fallback = "N/A") => {
  if (!dateVal) return fallback;
  try {
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return fallback;
    return d.toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch (err) {
    return fallback;
  }
};

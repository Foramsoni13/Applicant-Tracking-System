import React, { useEffect } from "react";
import { FaInfoCircle, FaCheckCircle, FaExclamationTriangle, FaTimesCircle, FaTimes } from "react-icons/fa";
import "./CustomToast.css";

const CustomToast = ({ toast, onClose }) => {
  useEffect(() => {
    if (toast?.autoClose !== false) {
      const timer = setTimeout(() => {
        if (onClose) onClose();
      }, toast?.duration || 4000);
      return () => clearTimeout(timer);
    }
  }, [toast, onClose]);

  if (!toast || !toast.show) return null;

  const getIcon = () => {
    switch (toast.type) {
      case "error":
      case "danger":
        return <FaTimesCircle className="toast-icon icon-error" />;
      case "warning":
        return <FaExclamationTriangle className="toast-icon icon-warning" />;
      case "info":
        return <FaInfoCircle className="toast-icon icon-info" />;
      case "success":
      default:
        return <FaCheckCircle className="toast-icon icon-success" />;
    }
  };

  return (
    <div className="custom-toast-overlay">
      <div className="custom-toast-card">
        <div className="toast-header-row">
          <div className="toast-title-badge">
            {getIcon()}
            <h4 className="toast-title">{toast.title || "Notification"}</h4>
          </div>
          <button className="toast-close-btn" onClick={onClose} aria-label="Close notification">
            <FaTimes />
          </button>
        </div>
        <p className="toast-message">{toast.message}</p>
      </div>
    </div>
  );
};

export default CustomToast;

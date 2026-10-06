import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, role } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(role)) {
    // Redirect user to their appropriate dashboard based on their role
    if (role === "hr") {
      return <Navigate to="/hr-dashboard" replace />;
    } else if (role === "candidate") {
      return <Navigate to="/candidate-dashboard" replace />;
    } else if (role === "admin") {
      return <Navigate to="/admin-dashboard" replace />;
    }
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;

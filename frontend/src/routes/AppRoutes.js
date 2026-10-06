import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "../context/AuthContext";
import ProtectedRoute from "./ProtectedRoute";

import Splash from "../pages/Splash/Splash";
import Login from "../pages/Login/Login";
import Register from "../pages/Register/Register";

import Candidate from "../pages/Candidate/Candidate";
import CandidateJobs from "../pages/Candidate/CandidateJobs";
import CandidateProfile from "../pages/Candidate/CandidateProfile";

import HRDashboard from "../pages/HR/HRDashboard";

import Admin from "../pages/Admin/Admin";
import ManageHR from "../pages/Admin/ManageHR";
import ForgotPassword from "../pages/ForgotPassword/ForgotPassword";

function AppRoutes() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Splash />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />

          {/* Candidate Protected Routes */}
          <Route
            path="/candidate-dashboard"
            element={
              <ProtectedRoute allowedRoles={["candidate"]}>
                <Candidate activeView="dashboard" />
              </ProtectedRoute>
            }
          />
          <Route
            path="/candidate-profile"
            element={
              <ProtectedRoute allowedRoles={["candidate"]}>
                <CandidateProfile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/candidate-jobs"
            element={
              <ProtectedRoute allowedRoles={["candidate"]}>
                <CandidateJobs />
              </ProtectedRoute>
            }
          />
          <Route
            path="/candidate-applications"
            element={
              <ProtectedRoute allowedRoles={["candidate"]}>
                <Candidate activeView="applications" />
              </ProtectedRoute>
            }
          />
          <Route
            path="/candidate-job-offers"
            element={
              <ProtectedRoute allowedRoles={["candidate"]}>
                <Candidate activeView="offers" />
              </ProtectedRoute>
            }
          />
          <Route
            path="/candidate-offers"
            element={
              <ProtectedRoute allowedRoles={["candidate"]}>
                <Candidate activeView="offers" />
              </ProtectedRoute>
            }
          />
          <Route
            path="/candidate-saved-jobs"
            element={
              <ProtectedRoute allowedRoles={["candidate"]}>
                <Candidate activeView="saved-jobs" />
              </ProtectedRoute>
            }
          />
          <Route
            path="/candidate-notifications"
            element={
              <ProtectedRoute allowedRoles={["candidate"]}>
                <Candidate activeView="notifications" />
              </ProtectedRoute>
            }
          />
          <Route
            path="/candidate-interviews"
            element={
              <ProtectedRoute allowedRoles={["candidate"]}>
                <Candidate activeView="interviews" />
              </ProtectedRoute>
            }
          />
          <Route
            path="/candidate-settings"
            element={
              <ProtectedRoute allowedRoles={["candidate"]}>
                <Candidate activeView="settings" />
              </ProtectedRoute>
            }
          />
          <Route
            path="/candidate-help"
            element={
              <ProtectedRoute allowedRoles={["candidate"]}>
                <Candidate activeView="help" />
              </ProtectedRoute>
            }
          />

          {/* HR Protected Routes */}
          <Route
            path="/hr-dashboard"
            element={
              <ProtectedRoute allowedRoles={["hr"]}>
                <HRDashboard />
              </ProtectedRoute>
            }
          />

          {/* Admin Protected Routes */}
          <Route
            path="/admin-dashboard"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <Admin />
              </ProtectedRoute>
            }
          />
          <Route
            path="/manage-hr"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <ManageHR />
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default AppRoutes;
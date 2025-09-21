import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";

// Pages
import LoginPage from "./pages/Auth/LoginPage";
import SignupPage from "./pages/Auth/SignupPage";
import ForgotPasswordPage from "./pages/Auth/ForgotPasswordPage";
import ResetPasswordConfirmPage from "./pages/Auth/ResetPasswordConfirmPage";
import Dashboard from "./pages/Dashboard";

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/password-reset/confirm" element={<ResetPasswordConfirmPage />} />

        {/* Protected Route */}
        <Route path="/*" element={<ProtectedApp />} />
      </Routes>
    </AuthProvider>
  );
}

// Protected wrapper
function ProtectedApp() {
  const { user, authLoading } = useAuth();
  if (authLoading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: "#475569" }}>
        Loading…
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;

  return <Dashboard />;
}

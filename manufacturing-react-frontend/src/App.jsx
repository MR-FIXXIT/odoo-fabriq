import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import AppShell from "./components/AppShell";

// Public Pages
import LoginPage from "./pages/Auth/LoginPage";
import SignupPage from "./pages/Auth/SignupPage";

// Protected Pages
import DashboardPage from "./pages/Dashboard";
import OrdersPage from "./pages/Orders";
import OrderDetailPage from "./pages/OrderDetail";
import WorkOrdersPage from "./pages/WorkOrders";
import BOMsPage from "./pages/BOMs";
import StockPage from "./pages/Stock";

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />

        {/* Protected Routes */}
        <Route path="/*" element={<ProtectedApp />} />
      </Routes>
    </AuthProvider>
  );
}

// Protected routes wrapper
function ProtectedApp() {
  const { user } = useAuth();

  // Redirect to login if not authenticated
  if (!user) return <Navigate to="/login" replace />;

  return (
    <DasboardPage />
  );
}

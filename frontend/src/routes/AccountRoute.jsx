import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function AccountRoute({ children }) {
  const { isAdmin, profile } = useAuth();
  if (!isAdmin && !profile?.dashboardUnlocked) return <Navigate to="/dashboard" replace />;
  return children;
}

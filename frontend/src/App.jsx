import React from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import Layout from "./components/Layout";
import ProtectedRoute from "./routes/ProtectedRoute";
import AccountRoute from "./routes/AccountRoute";
import Login from "./pages/Login";
import PublicDashboard from "./pages/PublicDashboard";
import Register from "./pages/Register";
import OtpVerify from "./pages/OtpVerify";
import Dashboard from "./pages/Dashboard";
import Transactions from "./pages/Transactions";
import BankingOperations from "./pages/BankingOperations";
import InvestmentPanel from "./pages/InvestmentPanel";
import LoanDashboard from "./pages/LoanDashboard";
import FraudAlerts from "./pages/FraudAlerts";
import AdminDashboard from "./pages/AdminDashboard";
import AiAssistant from "./pages/AiAssistant";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<PublicDashboard />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/verify-otp" element={<OtpVerify />} />
      <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/transactions" element={<AccountRoute><Transactions /></AccountRoute>} />
        <Route path="/operations" element={<AccountRoute><BankingOperations /></AccountRoute>} />
        <Route path="/deposit" element={<Navigate to="/operations" replace />} />
        <Route path="/withdraw" element={<Navigate to="/operations" replace />} />
        <Route path="/transfer" element={<Navigate to="/operations" replace />} />
        <Route path="/qr-payment" element={<Navigate to="/operations" replace />} />
        <Route path="/investments" element={<AccountRoute><InvestmentPanel /></AccountRoute>} />
        <Route path="/loans" element={<AccountRoute><LoanDashboard /></AccountRoute>} />
        <Route path="/fraud-alerts" element={<AccountRoute><FraudAlerts /></AccountRoute>} />
        <Route path="/ai-assistant" element={<AiAssistant />} />
        <Route path="/admin" element={<ProtectedRoute adminOnly><AdminDashboard /></ProtectedRoute>} />
      </Route>
    </Routes>
  );
}

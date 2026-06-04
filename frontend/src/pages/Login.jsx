import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getError } from "../api/client";
import FormStatus from "../components/FormStatus";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const { loginPassword, loading } = useAuth();
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const res = await loginPassword(email, password);
      setSuccess(res.message);
      navigate(`/verify-otp?email=${encodeURIComponent(email)}`);
    } catch (err) {
      setError(getError(err));
    }
  };

  return <AuthShell title="SmartBank AI" subtitle="Secure banking with OTP login, KYC approval, AI fraud alerts, investments, loans, and Gemini assistance.">
    <form className="auth-card" onSubmit={submit}>
      <div className="auth-card-head">
        <span>Secure Access</span>
        <h2>Login</h2>
        <p>Enter your credentials. We will verify your login with an email OTP.</p>
      </div>
      <label>Email<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required /></label>
      <label>Password<input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Minimum 6 characters" required minLength={6} /></label>
      <FormStatus error={error} success={success} />
      <button disabled={loading}>{loading ? "Checking..." : "Continue"}</button>
      <p>New customer? <Link to="/register">Create account</Link></p>
    </form>
  </AuthShell>;
}

export function AuthShell({ title, subtitle, children }) {
  return <div className="auth-shell">
    <section className="auth-brand-panel">
      <div className="brand-mark">SB</div>
      <span className="auth-eyebrow">SmartBank AI Platform</span>
      <h1>{title}</h1>
      <p>{subtitle}</p>
      <div className="auth-feature-grid">
        <div><strong>OTP</strong><span>Email verification</span></div>
        <div><strong>KYC</strong><span>Admin approval</span></div>
        <div><strong>AI</strong><span>Fraud insights</span></div>
      </div>
    </section>
    {children}
  </div>;
}

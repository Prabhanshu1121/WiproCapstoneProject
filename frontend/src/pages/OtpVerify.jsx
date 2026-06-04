import React, { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { getError } from "../api/client";
import FormStatus from "../components/FormStatus";
import { useAuth } from "../context/AuthContext";
import { AuthShell } from "./Login";

export default function OtpVerify() {
  const [params] = useSearchParams();
  const [email, setEmail] = useState(params.get("email") || "");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const { verifyOtp, loading } = useAuth();
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    try {
      await verifyOtp(email, otp);
      navigate("/dashboard");
    } catch (err) {
      setError(getError(err));
    }
  };

  return <AuthShell title="MFA Verification" subtitle="Complete login with the one-time password sent to email.">
    <form className="auth-card" onSubmit={submit}>
      <h2>Verify OTP</h2>
      <label>Email<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></label>
      <label>OTP<input value={otp} onChange={(e) => setOtp(e.target.value)} required maxLength={6} /></label>
      <FormStatus error={error} />
      <button disabled={loading}>{loading ? "Verifying..." : "Verify and enter"}</button>
    </form>
  </AuthShell>;
}

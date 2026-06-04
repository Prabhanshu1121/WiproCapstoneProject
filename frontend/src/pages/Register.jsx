import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getError } from "../api/client";
import FormStatus from "../components/FormStatus";
import { AuthShell } from "./Login";
import { useAuth } from "../context/AuthContext";

export default function Register() {
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const { register } = useAuth();
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await register(form);
      setSuccess("Registered successfully. Check your email for the OTP.");
      navigate(`/verify-otp?email=${encodeURIComponent(form.email)}`);
    } catch (err) {
      setError(getError(err));
    }
  };

  return <AuthShell title="Open SmartBank Account" subtitle="Register, verify OTP, submit KYC, and wait for admin approval.">
    <form className="auth-card" onSubmit={submit}>
      <div className="auth-card-head">
        <span>New Customer</span>
        <h2>Register</h2>
        <p>Create your profile first. Banking access unlocks after OTP and KYC approval.</p>
      </div>
      {["name", "email", "phone", "password"].map((field) => (
        <label key={field}>{field[0].toUpperCase() + field.slice(1)}
          <input type={field === "password" ? "password" : field === "email" ? "email" : "text"} value={form[field]} onChange={(e) => setForm({ ...form, [field]: e.target.value })} placeholder={placeholder(field)} required={field !== "phone"} minLength={field === "password" ? 6 : undefined} />
        </label>
      ))}
      <FormStatus error={error} success={success} />
      <button>Create account</button>
      <p>Already registered? <Link to="/login">Login</Link></p>
    </form>
  </AuthShell>;
}

function placeholder(field) {
  if (field === "name") return "Full name";
  if (field === "email") return "you@example.com";
  if (field === "phone") return "Mobile number";
  return "Minimum 6 characters";
}

import React from "react";
import { Link } from "react-router-dom";

const services = [
  ["Secure Accounts", "Open an account, verify with OTP, complete KYC, and wait for admin approval before banking access."],
  ["Banking Operations", "Deposit, withdraw, transfer, and make QR based payments from one simple workspace."],
  ["AI Monitoring", "Fraud alerts, loan checks, investment guidance, and SmartBank AI assistant support customers and admins."]
];

const highlights = [
  ["OTP Login", "Email based two step verification"],
  ["KYC Approval", "Admin reviewed customer onboarding"],
  ["QR Payments", "Account specific payment QR flow"],
  ["Smart Insights", "Fraud, loan, and investment analytics"]
];

export default function PublicDashboard() {
  return (
    <main className="public-dashboard">
      <header className="public-header">
        <Link className="public-brand" to="/">
          <span>SB</span>
          <strong>SmartBank AI</strong>
        </Link>
        <nav>
          <Link className="secondary-action" to="/register">Create Account</Link>
          <Link className="public-login" to="/login">Login</Link>
        </nav>
      </header>

      <section className="public-hero">
        <div>
          <span className="public-kicker">Digital Banking Platform</span>
          <h1>Simple banking with secure onboarding and AI support.</h1>
          <p>
            SmartBank AI helps customers manage savings accounts, payments, loans,
            investments, fraud alerts, and KYC approval in one clean banking system.
          </p>
          <div className="public-actions">
            <Link className="public-login" to="/login">Login to Account</Link>
            <Link className="secondary-action" to="/register">Open Account</Link>
          </div>
        </div>
        <aside className="public-summary">
          <span>Platform Status</span>
          <strong>Ready</strong>
          <p>Customer registration, OTP login, KYC review, QR payments, and admin controls are available.</p>
        </aside>
      </section>

      <section className="public-services">
        {services.map(([title, text]) => (
          <article key={title}>
            <h2>{title}</h2>
            <p>{text}</p>
          </article>
        ))}
      </section>

      <section className="public-highlights">
        <div>
          <span className="public-kicker">Bank Details</span>
          <h2>What SmartBank AI includes</h2>
          <p>A practical banking project with customer flows, admin workflows, MySQL backed data, and Gemini powered assistant support.</p>
        </div>
        <div className="public-highlight-grid">
          {highlights.map(([title, text]) => (
            <div key={title}>
              <strong>{title}</strong>
              <span>{text}</span>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}

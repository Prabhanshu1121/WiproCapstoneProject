import React from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const nav = [
  ["Dashboard", "/dashboard", "DA"],
  ["Transactions", "/transactions", "TX"],
  ["Banking Operations", "/operations", "BO"],
  ["Investments", "/investments", "AI"],
  ["Loans", "/loans", "LN"],
  ["Fraud Alerts", "/fraud-alerts", "FR"],
  ["AI Assistant", "/ai-assistant", "GM"]
];

function IconBadge({ label }) {
  return <span className="nav-icon">{label}</span>;
}

export default function Layout() {
  const { profile, isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const visibleNav = profile?.dashboardUnlocked || isAdmin ? nav : nav.slice(0, 1);
  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand"><span>SB</span><strong>SmartBank AI</strong></div>
        <nav>
          {visibleNav.map(([label, href, icon]) => <NavLink key={href} to={href}><IconBadge label={icon} />{label}</NavLink>)}
          {isAdmin && <NavLink to="/admin"><IconBadge label="AD" />Admin Analytics</NavLink>}
        </nav>
      </aside>
      <main className="main">
        <header className="topbar">
          <div>
            <p>Welcome back</p>
            <h1>{profile?.name || "Customer"}</h1>
          </div>
          <div className="top-actions">
            <span className="pill">{profile?.accountNumber || "No account"}</span>
            <button className="logout-button" title="Sign out of SmartBank AI" onClick={() => { logout(); navigate("/login"); }}>
              <span className="logout-mark">↗</span>
              Logout
            </button>
          </div>
        </header>
        <Outlet />
      </main>
    </div>
  );
}

import React, { useEffect, useState } from "react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { getError } from "../api/client";
import FormStatus from "../components/FormStatus";
import { useAuth } from "../context/AuthContext";
import { bankingApi, kycApi } from "../services/api";

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [txs, setTxs] = useState([]);
  const { profile, isAdmin, refreshProfile } = useAuth();

  useEffect(() => {
    if (profile?.dashboardUnlocked) {
      bankingApi.dashboard().then((r) => setData(r.data));
      bankingApi.transactions().then((r) => setTxs((r.data || []).slice(0, 6)));
    }
  }, [profile?.dashboardUnlocked]);

  if (!isAdmin && !profile?.dashboardUnlocked) return <KycGate profile={profile} refreshProfile={refreshProfile} />;

  const chart = [...txs].reverse().map((t, i) => ({ name: `T${i + 1}`, amount: Number(t.amount), type: displayType(t.type) }));
  const mix = [{ name: "Income", value: Number(data?.income || 0) }, { name: "Expenses", value: Number(data?.expenses || 0) }];

  return <div className="dashboard-page">
    <section className="dashboard-hero">
      <div>
        <span className="section-kicker">Account Overview</span>
        <h2>Financial snapshot</h2>
        <p>Monitor balance, activity, spending movement, and security risk from your approved SmartBank account.</p>
      </div>
      <div className="dashboard-balance"><span>Available Balance</span><strong>{money(data?.balance)}</strong></div>
    </section>

    <section className="dashboard-kpis">
      <Kpi label="Income" value={money(data?.income)} meta="Credits received" tone="blue" />
      <Kpi label="Expenses" value={money(data?.expenses)} meta="Debits and transfers" tone="rose" />
      <Kpi label="Transactions" value={data?.transactions || txs.length} meta="Recent account activity" tone="mint" />
      <Kpi label="Risk Score" value={`${data?.riskScore || 0}/100`} meta="Fraud monitoring" tone="amber" />
    </section>

    <section className="dashboard-grid">
      <section className="panel dashboard-card wide">
        <h2>Transaction Trend</h2>
        <div className="chart">
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={chart}>
              <defs><linearGradient id="amount" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#0f766e" stopOpacity={0.45}/><stop offset="95%" stopColor="#0f766e" stopOpacity={0}/></linearGradient></defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#dce7e2" />
              <XAxis dataKey="name" /><YAxis /><Tooltip formatter={(value) => money(value)} />
              <Area type="monotone" dataKey="amount" stroke="#0f766e" fill="url(#amount)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="panel dashboard-card">
        <h2>Income vs Expenses</h2>
        <div className="chart compact-chart">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={mix}><CartesianGrid strokeDasharray="3 3" stroke="#dce7e2" /><XAxis dataKey="name" /><YAxis /><Tooltip formatter={(value) => money(value)} /><Bar dataKey="value" fill="#0f766e" radius={[6, 6, 0, 0]} /></BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="panel dashboard-card">
        <h2>Recent Activity</h2>
        <div className="activity-list">{txs.map((t) => <div key={t.id} className="activity-row"><span>{shortType(t.type)}</span><div><strong>{t.description}</strong><small>{new Date(t.createdAt).toLocaleString()}</small></div><strong>{money(t.amount)}</strong></div>)}{txs.length === 0 && <p className="empty-copy">No activity yet.</p>}</div>
      </section>
    </section>
  </div>;
}

function Kpi({ label, value, meta, tone }) {
  return <div className={`dashboard-kpi ${tone}`}><span>{label}</span><strong>{value}</strong><small>{meta}</small></div>;
}

function KycGate({ profile, refreshProfile }) {
  const [existingKyc, setExistingKyc] = useState(null);
  const [form, setForm] = useState({
    fullName: profile?.name || "",
    mobileNumber: profile?.phone || "",
    address: "",
    panNumber: "",
    aadhaarNumber: ""
  });
  const [status, setStatus] = useState({});

  useEffect(() => {
    kycApi.mine().then((res) => {
      if (res.data) {
        setExistingKyc(res.data);
        setForm({
          fullName: res.data.fullName || profile?.name || "",
          mobileNumber: res.data.mobileNumber || profile?.phone || "",
          address: res.data.address || "",
          panNumber: res.data.panNumber || "",
          aadhaarNumber: res.data.aadhaarNumber || ""
        });
      }
    });
  }, []);

  useEffect(() => {
    if (profile?.kycStatus !== "PENDING") return;
    const timer = setInterval(() => refreshProfile(), 5000);
    return () => clearInterval(timer);
  }, [profile?.kycStatus, refreshProfile]);

  if (profile?.kycStatus === "PENDING" || existingKyc?.status === "PENDING") {
    return <section className="panel form-panel">
      <h2>KYC Pending</h2>
      <p>Your KYC request has been submitted. The dashboard will unlock after admin approval.</p>
      <div className="risk-badge">PENDING</div>
      <div className="readonly-grid">
        <div><span>Full Name</span><strong>{existingKyc?.fullName || form.fullName}</strong></div>
        <div><span>Mobile Number</span><strong>{existingKyc?.mobileNumber || form.mobileNumber}</strong></div>
        <div><span>Address</span><strong>{existingKyc?.address || form.address}</strong></div>
        <div><span>PAN Number</span><strong>{existingKyc?.panNumber || form.panNumber}</strong></div>
        <div><span>Aadhaar Number</span><strong>{existingKyc?.aadhaarNumber || form.aadhaarNumber}</strong></div>
      </div>
    </section>;
  }

  const submit = async (e) => {
    e.preventDefault();
    setStatus({});
    try {
      await kycApi.submit(form);
      await refreshProfile();
      setStatus({ success: "KYC submitted. Dashboard unlocks after admin approval." });
    } catch (err) {
      setStatus({ error: getError(err) });
    }
  };

  return <section className="panel form-panel">
    <h2>KYC Required</h2>
    <p>Your savings account and banking dashboard unlock after admin approves KYC.</p>
    <div className="risk-badge">{profile?.kycStatus || "NOT_SUBMITTED"}</div>
    <form onSubmit={submit}>
      <label>Full Name<input value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} required /></label>
      <label>Mobile Number<input value={form.mobileNumber} onChange={(e) => setForm({ ...form, mobileNumber: e.target.value })} required /></label>
      <label>Address<input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} required /></label>
      <label>PAN Number<input value={form.panNumber} onChange={(e) => setForm({ ...form, panNumber: e.target.value.toUpperCase() })} pattern="[A-Z]{5}[0-9]{4}[A-Z]" maxLength={10} placeholder="ABCDE1234F" title="PAN must be 5 letters, 4 digits, and 1 letter" required /></label>
      <label>Aadhaar Number<input value={form.aadhaarNumber} onChange={(e) => setForm({ ...form, aadhaarNumber: e.target.value.replace(/\D/g, '') })} pattern="[0-9]{12}" maxLength={12} placeholder="123456789012" title="Aadhaar must be exactly 12 digits" required /></label>
      <FormStatus {...status} />
      <button>Submit KYC</button>
    </form>
  </section>;
}

function displayType(type) {
  return type === "QR_PAYMENT" ? "TRANSFER" : type;
}

function shortType(type) {
  const clean = displayType(type || "");
  if (clean === "DEPOSIT") return "DP";
  if (clean === "WITHDRAW") return "WD";
  return "TR";
}

function money(value) {
  return `Rs ${Number(value || 0).toLocaleString("en-IN")}`;
}

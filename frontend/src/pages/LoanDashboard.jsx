import React, { useEffect, useMemo, useState } from "react";
import { Pie, PieChart, ResponsiveContainer, Cell, Tooltip } from "recharts";
import { getError } from "../api/client";
import FormStatus from "../components/FormStatus";
import { loanApi } from "../services/api";

export default function LoanDashboard() {
  const [emiForm, setEmiForm] = useState({ principal: 500000, annualRate: 9.5, tenureMonths: 60 });
  const [loanForm, setLoanForm] = useState({ creditScore: 760, monthlyIncome: 90000, existingEmi: 12000, loanAmount: 700000, employmentType: "salaried" });
  const [emi, setEmi] = useState(null);
  const [prediction, setPrediction] = useState(null);
  const [applications, setApplications] = useState([]);
  const [status, setStatus] = useState({});

  const loadHistory = () => loanApi.credit().then((r) => setApplications(r.data.applications || [])).catch(() => {});
  useEffect(() => { loadHistory(); }, []);

  const calculate = async (e) => {
    e.preventDefault();
    setStatus({});
    try { setEmi((await loanApi.emi(toNumbers(emiForm))).data); } catch (err) { setStatus({ error: getError(err) }); }
  };

  const predict = async (e) => {
    e.preventDefault();
    setStatus({});
    try {
      const res = await loanApi.predict(toNumbers(loanForm));
      setPrediction(res.data);
      await loadHistory();
      setStatus({ success: "Loan application analyzed and saved." });
    } catch (err) {
      setStatus({ error: getError(err) });
    }
  };

  const score = Number(prediction?.approvalScore || applications[0]?.approvalScore || 0);
  const risk = score >= 75 ? "LOW" : score < 45 ? "HIGH" : "MEDIUM";
  const chart = useMemo(() => [{ name: "Approval", value: score }, { name: "Gap", value: Math.max(0, 100 - score) }], [score]);

  return <div className="loan-page">
    <section className="loan-hero">
      <div>
        <span className="section-kicker">Loan Studio</span>
        <h2>Plan EMI and check approval strength</h2>
        <p>Calculate monthly EMI, submit loan prediction data, and track underwriting history from the same workspace.</p>
      </div>
      <div className="loan-score-card">
        <span>Approval Score</span>
        <strong>{score}%</strong>
        <small>{risk} risk</small>
      </div>
    </section>

    <FormStatus {...status} />

    <section className="loan-grid">
      <section className="panel loan-card">
        <h2>EMI Calculator</h2>
        <form onSubmit={calculate} className="smart-form">
          <label>Principal<input type="number" min="1" value={emiForm.principal} onChange={(e) => setEmiForm({ ...emiForm, principal: e.target.value })} /></label>
          <label>Annual Rate (%)<input type="number" min="0" step="0.1" value={emiForm.annualRate} onChange={(e) => setEmiForm({ ...emiForm, annualRate: e.target.value })} /></label>
          <label>Tenure Months<input type="number" min="1" value={emiForm.tenureMonths} onChange={(e) => setEmiForm({ ...emiForm, tenureMonths: e.target.value })} /></label>
          <button>Calculate EMI</button>
        </form>
        <div className="loan-result-grid">
          <Metric label="Monthly EMI" value={money(emi?.emi)} />
          <Metric label="Total Interest" value={money(emi?.interest)} />
          <Metric label="Total Payment" value={money(emi?.totalPayment)} />
        </div>
      </section>

      <section className="panel loan-card">
        <h2>Approval Prediction</h2>
        <form onSubmit={predict} className="smart-form two-col">
          <label>Credit Score<input type="number" min="300" max="900" value={loanForm.creditScore} onChange={(e) => setLoanForm({ ...loanForm, creditScore: e.target.value })} /></label>
          <label>Monthly Income<input type="number" min="1" value={loanForm.monthlyIncome} onChange={(e) => setLoanForm({ ...loanForm, monthlyIncome: e.target.value })} /></label>
          <label>Existing EMI<input type="number" min="0" value={loanForm.existingEmi} onChange={(e) => setLoanForm({ ...loanForm, existingEmi: e.target.value })} /></label>
          <label>Loan Amount<input type="number" min="1" value={loanForm.loanAmount} onChange={(e) => setLoanForm({ ...loanForm, loanAmount: e.target.value })} /></label>
          <label>Employment Type<select value={loanForm.employmentType} onChange={(e) => setLoanForm({ ...loanForm, employmentType: e.target.value })}><option value="salaried">Salaried</option><option value="self-employed">Self-employed</option><option value="business">Business</option></select></label>
          <button>Predict Approval</button>
        </form>
      </section>

      <section className="panel loan-card loan-insight">
        <h2>Underwriting Snapshot</h2>
        <div className="loan-score-visual">
          <ResponsiveContainer width="100%" height={190}>
            <PieChart><Pie data={chart} dataKey="value" innerRadius={58} outerRadius={78} startAngle={90} endAngle={-270}>{chart.map((entry, i) => <Cell key={entry.name} fill={i === 0 ? "#0f766e" : "#e5ece9"} />)}</Pie><Tooltip /></PieChart>
          </ResponsiveContainer>
          <strong>{score}%</strong>
        </div>
        <div className="readonly-grid compact">
          <div><span>Status</span><strong>{prediction?.status || applications[0]?.status || "Not checked"}</strong></div>
          <div><span>Risk Level</span><strong>{risk}</strong></div>
          <div className="full"><span>AI Recommendation</span><strong>{score >= 75 ? "Strong approval profile" : score < 45 ? "High risk, improve score or reduce amount" : "Manual review recommended"}</strong></div>
        </div>
      </section>

      <section className="panel loan-card">
        <h2>Application History</h2>
        <div className="loan-history">
          {applications.map((app) => <div key={app.id} className="loan-history-row"><div><strong>{money(app.loanAmount)}</strong><span>{new Date(app.createdAt).toLocaleString()}</span></div><span className={`status-badge ${app.status}`}>{app.status}</span><strong>{app.approvalScore}%</strong></div>)}
          {applications.length === 0 && <p className="empty-copy">No loan applications yet.</p>}
        </div>
      </section>
    </section>
  </div>;
}

function Metric({ label, value }) {
  return <div className="mini-metric"><span>{label}</span><strong>{value}</strong></div>;
}

function toNumbers(obj) {
  return Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, k === "employmentType" ? v : Number(v)]));
}

function money(value) {
  return `Rs ${Number(value || 0).toLocaleString("en-IN")}`;
}

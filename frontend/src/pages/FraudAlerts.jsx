import React, { useEffect, useMemo, useState } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { fraudApi } from "../services/api";

export default function FraudAlerts() {
  const [alerts, setAlerts] = useState([]);
  const [score, setScore] = useState(0);

  useEffect(() => {
    fraudApi.alerts().then((r) => setAlerts(r.data || []));
    fraudApi.riskScore().then((r) => setScore(r.data.riskScore || 0));
  }, []);

  const riskLabel = score >= 70 ? "High" : score >= 35 ? "Moderate" : "Low";
  const distribution = useMemo(() => countBy(alerts, "riskLevel"), [alerts]);

  return <div className="fraud-page">
    <section className="fraud-hero">
      <div>
        <span className="section-kicker">Fraud Intelligence</span>
        <h2>{riskLabel} account risk</h2>
        <p>SmartBank reviews unusual transactions, new receivers, high-value withdrawals, and rapid activity patterns.</p>
      </div>
      <div className="fraud-score">
        <strong>{score}</strong>
        <span>/100</span>
      </div>
    </section>

    <section className="fraud-grid">
      <section className="panel fraud-card">
        <h2>Risk Meter</h2>
        <div className="risk-meter large"><span style={{ width: `${score}%` }} /></div>
        <div className="risk-scale"><span>Safe</span><span>Watch</span><span>Critical</span></div>
        <div className="fraud-summary">
          <div><span>Total Alerts</span><strong>{alerts.length}</strong></div>
          <div><span>Open Reviews</span><strong>{alerts.filter((a) => !a.resolved).length}</strong></div>
          <div><span>Highest Risk</span><strong>{alerts[0]?.riskLevel || "LOW"}</strong></div>
        </div>
      </section>

      <section className="panel fraud-card">
        <h2>Risk Distribution</h2>
        {alerts.length ? <ResponsiveContainer width="100%" height={220}><PieChart><Pie data={distribution} dataKey="value" nameKey="name" innerRadius={52} outerRadius={82}>{distribution.map((entry) => <Cell key={entry.name} fill={colorForRisk(entry.name)} />)}</Pie><Tooltip /></PieChart></ResponsiveContainer> : <div className="secure-empty"><strong>No suspicious activity</strong><span>Your latest account activity looks clean.</span></div>}
      </section>

      <section className="panel fraud-card wide">
        <h2>Alert Timeline</h2>
        <div className="fraud-list">
          {alerts.map((alert) => <div key={alert.id} className="fraud-row">
            <span className={`status-badge ${alert.riskLevel}`}>{alert.riskLevel}</span>
            <div><strong>{alert.reason}</strong><small>{new Date(alert.createdAt).toLocaleString()}</small></div>
            <span>{alert.resolved ? "Resolved" : "Open"}</span>
          </div>)}
          {alerts.length === 0 && <p className="empty-copy">No fraud alerts found.</p>}
        </div>
      </section>
    </section>
  </div>;
}

function countBy(rows, key) {
  const counts = {};
  rows.forEach((row) => { const name = row[key] || "UNKNOWN"; counts[name] = (counts[name] || 0) + 1; });
  return Object.entries(counts).map(([name, value]) => ({ name, value }));
}

function colorForRisk(risk) {
  if (risk === "HIGH") return "#e11d48";
  if (risk === "MEDIUM") return "#d97706";
  return "#0f766e";
}

import React, { useEffect, useMemo, useState } from "react";
import { getError } from "../api/client";
import FormStatus from "../components/FormStatus";
import { investmentApi } from "../services/api";

const defaultProfile = {
  monthlyIncome: "",
  monthlyExpenses: "",
  investmentGoal: "Wealth creation",
  riskAppetite: "medium",
  investmentDurationYears: ""
};

const defaultPortfolio = {
  assetName: "",
  assetType: "Mutual Fund",
  investedAmount: "",
  currentValue: ""
};

export default function InvestmentPanel() {
  const [profile, setProfile] = useState(defaultProfile);
  const [portfolio, setPortfolio] = useState(defaultPortfolio);
  const [suggestions, setSuggestions] = useState(null);
  const [analytics, setAnalytics] = useState({ records: [], invested: 0, currentValue: 0, gainLoss: 0 });
  const [customAllocation, setCustomAllocation] = useState(null);
  const [status, setStatus] = useState({});
  const [loading, setLoading] = useState(false);

  const surplus = Number(suggestions?.monthlySurplus ?? (Number(profile.monthlyIncome || 0) - Number(profile.monthlyExpenses || 0)));
  const sip = Number(suggestions?.suggestedSip ?? Math.max(0, Math.round(surplus * 0.2)));
  const invested = Number(analytics?.invested || 0);
  const currentValue = Number(analytics?.currentValue || 0);
  const gainLoss = Number(analytics?.gainLoss || 0);
  const returnPercent = invested > 0 ? ((gainLoss / invested) * 100).toFixed(1) : "0.0";
  const records = analytics?.records || [];

  const recommendedAllocation = useMemo(() => allocationFor(suggestions), [suggestions]);
  const allocation = customAllocation || recommendedAllocation;
  const allocationTotal = allocation.reduce((total, item) => total + Number(item.value || 0), 0);

  const refresh = async () => {
    const [profileRes, suggestionRes, analyticsRes] = await Promise.all([
      investmentApi.profile(),
      investmentApi.suggestions(),
      investmentApi.analytics()
    ]);
    if (profileRes.data) {
      setProfile({
        monthlyIncome: profileRes.data.monthlyIncome ?? "",
        monthlyExpenses: profileRes.data.monthlyExpenses ?? "",
        investmentGoal: profileRes.data.investmentGoal || "Wealth creation",
        riskAppetite: profileRes.data.riskAppetite || "medium",
        investmentDurationYears: profileRes.data.investmentDurationYears ?? ""
      });
    }
    setSuggestions(suggestionRes.data);
    setCustomAllocation(null);
    setAnalytics(analyticsRes.data);
  };

  useEffect(() => {
    refresh().catch((err) => setStatus({ error: getError(err) }));
  }, []);

  const submitProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus({});
    try {
      await investmentApi.riskProfile({
        ...profile,
        monthlyIncome: Number(profile.monthlyIncome),
        monthlyExpenses: Number(profile.monthlyExpenses),
        investmentDurationYears: Number(profile.investmentDurationYears)
      });
      await refresh();
      setStatus({ success: "Risk profile analyzed" });
    } catch (err) {
      setStatus({ error: getError(err) });
    } finally {
      setLoading(false);
    }
  };

  const useSuggestion = (name) => {
    setPortfolio({
      assetName: name,
      assetType: assetTypeFor(name),
      investedAmount: sip || "",
      currentValue: sip || ""
    });
    setStatus({ success: `${name} selected. Review amount and add it to portfolio.` });
  };

  const changeAllocation = (label, value) => {
    setCustomAllocation(allocation.map((item) => item.label === label ? { ...item, value: Number(value) } : item));
  };

  const applyRecommendedAllocation = () => {
    setCustomAllocation(null);
    setStatus({ success: "AI recommended allocation restored" });
  };

  const removePortfolio = async (id) => {
    setLoading(true);
    setStatus({});
    try {
      await investmentApi.deletePortfolio(id);
      await refresh();
      setStatus({ success: "Portfolio asset removed" });
    } catch (err) {
      setStatus({ error: getError(err) });
    } finally {
      setLoading(false);
    }
  };

  const addPortfolio = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus({});
    try {
      await investmentApi.addPortfolio({
        ...portfolio,
        investedAmount: Number(portfolio.investedAmount),
        currentValue: Number(portfolio.currentValue)
      });
      await refresh();
      setPortfolio(defaultPortfolio);
      setStatus({ success: "Portfolio asset added" });
    } catch (err) {
      setStatus({ error: getError(err) });
    } finally {
      setLoading(false);
    }
  };

  return <div className="investment-page">
    <section className="investment-hero">
      <div>
        <span className="section-kicker">AI Investment Panel</span>
        <h2>Plan smarter monthly investing</h2>
        <p>Analyze your risk profile, review suggested fund categories, and track your portfolio returns in one place.</p>
      </div>
      <div className="investment-score">
        <span>Risk style</span>
        <strong>{suggestions?.riskType || "BALANCED"}</strong>
      </div>
    </section>

    <section className="stats-row investment-stats">
      <Metric label="Monthly Surplus" value={money(surplus)} accent="mint" />
      <Metric label="Suggested SIP" value={money(sip)} accent="blue" />
      <Metric label="Portfolio Value" value={money(currentValue)} accent="amber" />
      <Metric label="Return" value={`${returnPercent}%`} accent={gainLoss >= 0 ? "mint" : "rose"} />
    </section>

    <FormStatus {...status} />

    <div className="investment-grid">
      <div className="investment-column">
        <section className="panel investment-card">
          <h2>Risk Profile</h2>
          <form onSubmit={submitProfile} className="investment-form">
            <label>Monthly Income<input type="number" min="0" value={profile.monthlyIncome} onChange={(e) => setProfile({ ...profile, monthlyIncome: e.target.value })} required /></label>
            <label>Monthly Expenses<input type="number" min="0" value={profile.monthlyExpenses} onChange={(e) => setProfile({ ...profile, monthlyExpenses: e.target.value })} required /></label>
            <label>Investment Goal
              <select value={profile.investmentGoal} onChange={(e) => setProfile({ ...profile, investmentGoal: e.target.value })}>
                <option>Wealth creation</option>
                <option>Emergency fund</option>
                <option>Retirement planning</option>
                <option>Child education</option>
                <option>Home purchase</option>
              </select>
            </label>
            <label>Risk Appetite
              <select value={profile.riskAppetite} onChange={(e) => setProfile({ ...profile, riskAppetite: e.target.value })}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </label>
            <label>Investment Duration Years<input type="number" min="1" max="40" value={profile.investmentDurationYears} onChange={(e) => setProfile({ ...profile, investmentDurationYears: e.target.value })} required /></label>
            <button disabled={loading}>{loading ? "Analyzing..." : "Analyze Risk"}</button>
          </form>
        </section>

        <section className="panel investment-card">
          <h2>Add Portfolio</h2>
          <form onSubmit={addPortfolio} className="investment-form">
            <label>Asset Name<input value={portfolio.assetName} onChange={(e) => setPortfolio({ ...portfolio, assetName: e.target.value })} placeholder="Nifty Index Fund" required /></label>
            <label>Asset Type
              <select value={portfolio.assetType} onChange={(e) => setPortfolio({ ...portfolio, assetType: e.target.value })}>
                <option>Mutual Fund</option>
                <option>Index Fund</option>
                <option>Stock</option>
                <option>Fixed Deposit</option>
                <option>Gold</option>
                <option>Bond</option>
              </select>
            </label>
            <label>Invested Amount<input type="number" min="1" value={portfolio.investedAmount} onChange={(e) => setPortfolio({ ...portfolio, investedAmount: e.target.value })} required /></label>
            <label>Current Value<input type="number" min="0" value={portfolio.currentValue} onChange={(e) => setPortfolio({ ...portfolio, currentValue: e.target.value })} required /></label>
            <button disabled={loading}>{loading ? "Saving..." : "Add Portfolio"}</button>
          </form>
        </section>
      </div>

      <div className="investment-column">
        <section className="panel investment-card">
          <h2>AI Suggestions</h2>
          <div className={`risk-badge ${suggestions?.riskType || ""}`}>{suggestions?.riskType || "BALANCED"}</div>
          <div className="chips suggestion-chips">{(suggestions?.suggestions || []).map((s) => <button type="button" key={s} onClick={() => useSuggestion(s)}>{s}</button>)}</div>
          <p className="investment-note">{suggestions?.savingsRecommendation || "Analyze risk to get suggestions."}</p>
          <div className={`allocation-total ${allocationTotal === 100 ? "ready" : ""}`}>
            <span>Allocation total</span>
            <strong>{allocationTotal}%</strong>
          </div>
          <div className="allocation-list">
            {allocation.map((item) => <div key={item.label}>
              <span>{item.label}</span>
              <strong>{item.value}%</strong>
              <input type="range" min="0" max="100" value={item.value} onChange={(e) => changeAllocation(item.label, e.target.value)} />
              <small>{money(Math.round((sip * item.value) / 100))} monthly</small>
              <div className="risk-meter"><span style={{ width: `${item.value}%` }} /></div>
            </div>)}
          </div>
          <button type="button" className="secondary-action" onClick={applyRecommendedAllocation}>Use AI Allocation</button>
        </section>

        <section className="panel investment-card">
          <h2>Portfolio Analytics</h2>
          <div className="portfolio-summary">
            <Metric label="Invested" value={money(invested)} />
            <Metric label="Current" value={money(currentValue)} />
            <Metric label="Gain/Loss" value={money(gainLoss)} accent={gainLoss >= 0 ? "mint" : "rose"} />
          </div>
          <div className="portfolio-list">
            {records.map((item) => <div key={item.id} className="portfolio-row">
              <div><strong>{item.assetName}</strong><span>{item.assetType}</span></div>
              <div><span>Invested</span><strong>{money(item.investedAmount)}</strong></div>
              <div><span>Current</span><strong>{money(item.currentValue)}</strong></div>
              <button type="button" className="light-action" onClick={() => removePortfolio(item.id)} disabled={loading}>Remove</button>
            </div>)}
            {records.length === 0 && <p className="empty-copy">No portfolio assets yet.</p>}
          </div>
        </section>
      </div>
    </div>
  </div>;
}

function Metric({ label, value, accent = "mint" }) {
  return <div className={`stat ${accent}`}><span>{label}</span><strong>{value}</strong></div>;
}

function allocationFor(suggestions) {
  if (suggestions?.allocation) {
    return Object.entries(suggestions.allocation).map(([label, value]) => ({ label, value }));
  }
  if (suggestions?.riskType === "CONSERVATIVE") return [{ label: "Debt", value: 60 }, { label: "Equity", value: 25 }, { label: "Cash", value: 15 }];
  if (suggestions?.riskType === "AGGRESSIVE") return [{ label: "Equity", value: 75 }, { label: "Debt", value: 15 }, { label: "Cash", value: 10 }];
  return [{ label: "Equity", value: 50 }, { label: "Debt", value: 35 }, { label: "Cash", value: 15 }];
}

function assetTypeFor(name) {
  const lower = name.toLowerCase();
  if (lower.includes("fixed")) return "Fixed Deposit";
  if (lower.includes("index") || lower.includes("nifty")) return "Index Fund";
  if (lower.includes("debt") || lower.includes("liquid")) return "Bond";
  if (lower.includes("sector") || lower.includes("small cap") || lower.includes("equity")) return "Mutual Fund";
  return "Mutual Fund";
}

function money(value) {
  return `₹${Number(value || 0).toLocaleString("en-IN")}`;
}

import React, { useEffect, useMemo, useState } from "react";
import { bankingApi } from "../services/api";

export default function Transactions() {
  const [rows, setRows] = useState([]);
  const [filter, setFilter] = useState("ALL");
  const [query, setQuery] = useState("");

  useEffect(() => { bankingApi.transactions().then((r) => setRows(r.data || [])); }, []);

  const filtered = useMemo(() => rows.filter((tx) => {
    const typeMatch = filter === "ALL" || displayType(tx.type) === filter;
    const term = query.trim().toLowerCase();
    const textMatch = !term || [tx.description, tx.category, tx.receiverAccount, tx.type].some((value) => String(value || "").toLowerCase().includes(term));
    return typeMatch && textMatch;
  }), [rows, filter, query]);

  const totals = useMemo(() => ({
    deposits: sum(rows.filter((tx) => displayType(tx.type) === "DEPOSIT")),
    withdrawals: sum(rows.filter((tx) => displayType(tx.type) === "WITHDRAW")),
    transfers: sum(rows.filter((tx) => displayType(tx.type) === "TRANSFER")),
    count: rows.length
  }), [rows]);

  return <div className="transactions-page">
    <section className="transactions-hero">
      <div>
        <span className="section-kicker">Transaction Ledger</span>
        <h2>Track every money movement</h2>
        <p>Search, filter, and review deposits, withdrawals, transfers, and QR payment records in one clean view.</p>
      </div>
      <div className="ledger-count"><strong>{totals.count}</strong><span>Total records</span></div>
    </section>

    <section className="tx-summary-grid">
      <Summary label="Deposits" value={money(totals.deposits)} tone="mint" />
      <Summary label="Withdrawals" value={money(totals.withdrawals)} tone="rose" />
      <Summary label="Transfers" value={money(totals.transfers)} tone="blue" />
      <Summary label="Visible Rows" value={filtered.length} tone="amber" />
    </section>

    <section className="panel tx-panel">
      <div className="tx-toolbar">
        <div className="tx-filters">{["ALL", "DEPOSIT", "WITHDRAW", "TRANSFER"].map((item) => <button key={item} className={filter === item ? "active" : ""} onClick={() => setFilter(item)}>{item}</button>)}</div>
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search description, category, receiver" />
      </div>
      <div className="tx-list">
        {filtered.map((tx) => <div key={tx.id} className="tx-row-card">
          <span className={`tx-icon ${displayType(tx.type)}`}>{shortType(tx.type)}</span>
          <div>
            <strong>{tx.description || displayType(tx.type)}</strong>
            <small>{new Date(tx.createdAt).toLocaleString()} · {tx.category || "OTHER"}</small>
          </div>
          <span className="tx-receiver">{tx.receiverAccount || "Self"}</span>
          <strong className={displayType(tx.type) === "DEPOSIT" ? "amount-positive" : "amount-negative"}>{displayType(tx.type) === "DEPOSIT" ? "+" : "-"}{money(tx.amount)}</strong>
        </div>)}
        {filtered.length === 0 && <p className="empty-copy">No transactions match your filter.</p>}
      </div>
    </section>
  </div>;
}

function Summary({ label, value, tone }) {
  return <div className={`tx-summary ${tone}`}><span>{label}</span><strong>{value}</strong></div>;
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

function sum(items) {
  return items.reduce((total, tx) => total + Number(tx.amount || 0), 0);
}

function money(value) {
  return `Rs ${Number(value || 0).toLocaleString("en-IN")}`;
}

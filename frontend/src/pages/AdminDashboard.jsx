import React, { useEffect, useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { getError } from "../api/client";
import FormStatus from "../components/FormStatus";
import StatCard from "../components/StatCard";
import { adminApi } from "../services/api";

const tabs = ["Analytics", "KYC", "Fraud", "Loans", "Customers", "Audit Logs"];
const kycTabs = ["PENDING", "APPROVED", "REJECTED"];
const colors = ["#0f766e", "#2563eb", "#d97706", "#e11d48", "#7c3aed", "#0891b2"];

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("Analytics");
  const [kycStatus, setKycStatus] = useState("PENDING");
  const [data, setData] = useState({});
  const [users, setUsers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [kycList, setKycList] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loans, setLoans] = useState([]);
  const [fraudAlerts, setFraudAlerts] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [query, setQuery] = useState("");
  const [auditQuery, setAuditQuery] = useState("");
  const [auditModule, setAuditModule] = useState("");
  const [auditAction, setAuditAction] = useState("");
  const [auditRole, setAuditRole] = useState("");
  const [selectedKyc, setSelectedKyc] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [loanRejectReason, setLoanRejectReason] = useState("");
  const [status, setStatus] = useState({});
  const [loading, setLoading] = useState(false);

  const refresh = async () => {
    setLoading(true);
    try {
      const [dashboardRes, usersRes, kycRes, txRes, loanRes, fraudRes, auditRes] = await Promise.all([
        adminApi.dashboard(),
        adminApi.users(),
        adminApi.kycByStatus(kycStatus),
        adminApi.transactions(),
        adminApi.loans(),
        adminApi.fraudAlerts(),
        adminApi.auditLogs()
      ]);
      setData(dashboardRes.data || {});
      setUsers(usersRes.data || []);
      setKycList(kycRes.data || []);
      setTransactions(txRes.data || []);
      setLoans(loanRes.data || []);
      setFraudAlerts(fraudRes.data || []);
      setAuditLogs(auditRes.data || []);
    } catch (err) {
      setStatus({ error: getError(err) });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, [kycStatus]);

  const runAction = async (action, message) => {
    setStatus({});
    setLoading(true);
    try {
      await action();
      await refresh();
      setStatus({ success: message });
    } catch (err) {
      setStatus({ error: getError(err) });
    } finally {
      setLoading(false);
    }
  };

  const approveKyc = (id) => runAction(async () => {
    await adminApi.approveKyc(id);
    setSelectedKyc(null);
  }, "KYC approved and account created.");

  const rejectKyc = (id) => {
    if (!rejectReason.trim()) return setStatus({ error: "Enter rejection reason." });
    return runAction(async () => {
      await adminApi.rejectKyc(id, rejectReason.trim());
      setRejectReason("");
      setSelectedKyc(null);
    }, "KYC rejected with reason.");
  };

  const approveLoan = (id) => runAction(() => adminApi.approveLoan(id), "Loan approved and disbursed.");
  const rejectLoan = (id) => {
    if (!loanRejectReason.trim()) return setStatus({ error: "Enter loan rejection reason." });
    return runAction(async () => {
      await adminApi.rejectLoan(id, loanRejectReason.trim());
      setLoanRejectReason("");
    }, "Loan rejected with reason.");
  };

  const approveFraud = (id) => runAction(() => adminApi.approveFraud(id), "Fraud alert approved.");
  const blockFraud = (id) => runAction(() => adminApi.blockFraud(id), "Fraud alert blocked.");

  const openCustomer = async (id) => {
    setStatus({});
    try {
      const res = await adminApi.user(id);
      setSelectedCustomer(res.data);
    } catch (err) {
      setStatus({ error: getError(err) });
    }
  };

  const controlCustomer = (id, action, message) => runAction(async () => {
    await action(id);
    if (selectedCustomer?.id === id) await openCustomer(id);
  }, message);

  const filteredUsers = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return users;
    return users.filter((user) => [user.username, user.name, user.email, user.mobile, user.kycStatus, user.accountStatus].some((value) => String(value || "").toLowerCase().includes(term)));
  }, [users, query]);

  const filteredAuditLogs = useMemo(() => {
    return auditLogs.filter((log) => {
      const textMatch = !auditQuery.trim() || [log.action, log.module, log.actorRole, log.description].some((value) => String(value || "").toLowerCase().includes(auditQuery.trim().toLowerCase()));
      const moduleMatch = !auditModule || log.module === auditModule;
      const actionMatch = !auditAction || log.action === auditAction;
      const roleMatch = !auditRole || log.actorRole === auditRole;
      return textMatch && moduleMatch && actionMatch && roleMatch;
    });
  }, [auditLogs, auditQuery, auditModule, auditAction, auditRole]);

  const analytics = buildAnalytics(data, transactions, users, fraudAlerts, loans);

  return <div className="admin-page">
    <section className="admin-hero">
      <div>
        <span className="section-kicker">Admin Control Center</span>
        <h2>SmartBank admin modules</h2>
        <p>KYC approval, fraud review, loan decisions, customer management, analytics, and audit logs connected to live database records.</p>
      </div>
      <button type="button" className="admin-refresh" onClick={refresh} disabled={loading}>{loading ? "Refreshing..." : "Refresh"}</button>
    </section>

    <FormStatus {...status} />

    <div className="admin-tabs">
      {tabs.map((tab) => <button key={tab} type="button" className={activeTab === tab ? "active" : ""} onClick={() => setActiveTab(tab)}>{tab}</button>)}
    </div>

    {activeTab === "Analytics" && <Analytics data={data} analytics={analytics} />}
    {activeTab === "KYC" && <KycModule kycStatus={kycStatus} setKycStatus={setKycStatus} kycList={kycList} selectedKyc={selectedKyc} setSelectedKyc={setSelectedKyc} loading={loading} rejectReason={rejectReason} setRejectReason={setRejectReason} approveKyc={approveKyc} rejectKyc={rejectKyc} />}
    {activeTab === "Fraud" && <FraudModule fraudAlerts={fraudAlerts} loading={loading} approveFraud={approveFraud} blockFraud={blockFraud} />}
    {activeTab === "Loans" && <LoanModule loans={loans} loading={loading} rejectReason={loanRejectReason} setRejectReason={setLoanRejectReason} approveLoan={approveLoan} rejectLoan={rejectLoan} />}
    {activeTab === "Customers" && <CustomerModule users={filteredUsers} query={query} setQuery={setQuery} selectedCustomer={selectedCustomer} openCustomer={openCustomer} loading={loading} controlCustomer={controlCustomer} />}
    {activeTab === "Audit Logs" && <AuditModule logs={filteredAuditLogs} allLogs={auditLogs} query={auditQuery} setQuery={setAuditQuery} module={auditModule} setModule={setAuditModule} action={auditAction} setAction={setAuditAction} role={auditRole} setRole={setAuditRole} />}
  </div>;
}

function Analytics({ data, analytics }) {
  return <>
    <section className="stats-row admin-stats">
      <StatCard label="Total Customers" value={data.totalUsers || 0} />
      <StatCard label="Total Accounts" value={data.totalAccounts || 0} accent="blue" />
      <StatCard label="Total Deposits" value={money(data.totalDeposits)} />
      <StatCard label="Total Withdrawals" value={money(data.totalWithdrawals)} accent="rose" />
      <StatCard label="Total Transfers" value={data.totalTransfers || 0} accent="amber" />
      <StatCard label="Total Loans" value={data.loanApplicationsCount || 0} accent="blue" />
      <StatCard label="Active Loans" value={data.activeLoansCount || 0} />
      <StatCard label="Loan Outstanding" value={money(data.loanOutstanding)} accent="amber" />
      <StatCard label="Fraud Alerts" value={data.fraudAlertsCount || 0} accent="rose" />
      <StatCard label="Pending Fraud" value={data.pendingFraudReviews || 0} accent="rose" />
      <StatCard label="Pending KYC" value={data.pendingKycCount || 0} accent="amber" />
      <StatCard label="Approved KYC" value={data.approvedKycCount || 0} />
      <StatCard label="Rejected KYC" value={data.rejectedKycCount || 0} accent="rose" />
      <StatCard label="Frozen Funds" value={money(data.totalFrozenFunds)} accent="rose" />
    </section>
    <section className="admin-chart-grid">
      <BarCard title="Monthly Transactions" data={analytics.monthlyTransactions} />
      <BarCard title="Deposit vs Withdrawal" data={analytics.depositWithdrawal} moneyTooltip />
      <BarCard title="Customer Growth" data={analytics.customerGrowth} />
      <PieCard title="Fraud Distribution" data={analytics.fraudDistribution} />
      <PieCard title="Loan Distribution" data={analytics.loanDistribution} />
      <PieCard title="KYC Distribution" data={analytics.kycDistribution} />
    </section>
  </>;
}

function KycModule({ kycStatus, setKycStatus, kycList, selectedKyc, setSelectedKyc, loading, rejectReason, setRejectReason, approveKyc, rejectKyc }) {
  const activeKyc = selectedKyc || kycList[0];
  return <section className="panel admin-card">
    <div className="admin-section-head">
      <div><h2>KYC Approval System</h2><p>View pending, approved, and rejected requests with complete KYC information.</p></div>
      <div className="admin-filter">{kycTabs.map((tab) => <button key={tab} type="button" className={kycStatus === tab ? "active" : ""} onClick={() => setKycStatus(tab)}>{tab}</button>)}</div>
    </div>
    <div className="kyc-review-grid">
      <div className="admin-list">
        {kycList.map((kyc) => <button type="button" key={kyc.id} className={`kyc-list-item ${activeKyc?.id === kyc.id ? "active" : ""}`} onClick={() => setSelectedKyc(kyc)}>
          <span><strong>{kyc.fullName || kyc.userName}</strong><small>{kyc.userEmail}</small></span><Badge value={kyc.status} />
        </button>)}
        {kycList.length === 0 && <p className="empty-copy">No {kycStatus.toLowerCase()} KYC requests.</p>}
      </div>
      <KycDetails kyc={activeKyc} loading={loading} reason={rejectReason} setReason={setRejectReason} approve={approveKyc} reject={rejectKyc} />
    </div>
  </section>;
}

function FraudModule({ fraudAlerts, loading, approveFraud, blockFraud }) {
  return <AdminTable title="Fraud Approval / Blocking System" subtitle="View suspicious transactions, fraud reasons, risk score, and approve or block open reviews.">
    <thead><tr><th>Date</th><th>Risk Score</th><th>Reason</th><th>Transaction</th><th>Status</th><th>Action</th></tr></thead>
    <tbody>{fraudAlerts.map((alert) => <tr key={alert.id}><td>{date(alert.createdAt)}</td><td><Badge value={alert.riskLevel} /></td><td>{alert.reason}</td><td>{alert.transaction ? `${displayType(alert.transaction.type)} ${money(alert.transaction.amount)}` : "-"}</td><td>{alert.resolved ? "Resolved" : "Pending Review"}</td><td><div className="row-actions"><button disabled={loading || alert.resolved} onClick={() => approveFraud(alert.id)}>Approve</button><button disabled={loading || alert.resolved} className="danger-action" onClick={() => blockFraud(alert.id)}>Block</button></div></td></tr>)}</tbody>
  </AdminTable>;
}

function LoanModule({ loans, loading, rejectReason, setRejectReason, approveLoan, rejectLoan }) {
  return <section className="panel admin-card">
    <div className="admin-section-head"><div><h2>Loan Approval / Rejection System</h2><p>Review AI underwriting data, credit score, income, EMI, amount, risk, and recommendation.</p></div></div>
    <label className="admin-inline-reason">Loan Rejection Reason<input value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} placeholder="Required before rejecting a loan" /></label>
    <div className="admin-table-wrap"><table><thead><tr><th>Date</th><th>Status</th><th>Credit Score</th><th>Income</th><th>Existing EMI</th><th>Loan Amount</th><th>Risk</th><th>AI Recommendation</th><th>Action</th></tr></thead>
      <tbody>{loans.map((loan) => <tr key={loan.id}><td>{date(loan.createdAt)}</td><td><Badge value={loan.status} /></td><td>{loan.creditScore}</td><td>{money(loan.monthlyIncome)}</td><td>{money(loan.existingEmi)}</td><td>{money(loan.loanAmount)}</td><td>{loan.approvalScore >= 75 ? "LOW" : loan.approvalScore < 45 ? "HIGH" : "MEDIUM"}</td><td>{loan.approvalScore >= 75 ? "Approve" : loan.approvalScore < 45 ? "Reject" : "Manual review"}</td><td><div className="row-actions"><button disabled={loading || loan.status === "APPROVED"} onClick={() => approveLoan(loan.id)}>Approve</button><button disabled={loading || loan.status === "REJECTED"} className="danger-action" onClick={() => rejectLoan(loan.id)}>Reject</button></div></td></tr>)}</tbody>
    </table></div>
  </section>;
}

function CustomerModule({ users, query, setQuery, selectedCustomer, openCustomer, loading, controlCustomer }) {
  return <section className="admin-customer-grid">
    <div className="panel admin-card">
      <div className="admin-section-head"><div><h2>Customer Management</h2><p>Search, filter, and open customer profiles.</p></div><input className="admin-search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search name, email, mobile, KYC, account status" /></div>
      <div className="admin-table-wrap"><table><thead><tr><th>Name</th><th>Email</th><th>Mobile</th><th>KYC</th><th>Account</th><th>Action</th></tr></thead><tbody>{users.map((user) => <tr key={user.id}><td>{user.name}</td><td>{user.email}</td><td>{user.mobile || "-"}</td><td><Badge value={user.kycStatus} /></td><td><Badge value={user.accountStatus} /></td><td><button onClick={() => openCustomer(user.id)}>View Profile</button></td></tr>)}</tbody></table></div>
    </div>
    <CustomerProfile customer={selectedCustomer} loading={loading} controlCustomer={controlCustomer} />
  </section>;
}

function CustomerProfile({ customer, loading, controlCustomer }) {
  if (!customer) return <section className="panel admin-card"><h2>Customer Profile</h2><p className="empty-copy">Select a customer to view profile, account, transaction, fraud, and loan history.</p></section>;
  return <section className="panel admin-card">
    <div className="admin-section-head"><div><h2>{customer.name}</h2><p>{customer.email}</p></div><Badge value={customer.enabled ? "ACTIVE" : "DISABLED"} /></div>
    <div className="readonly-grid compact">
      <div><span>Username</span><strong>{customer.username}</strong></div><div><span>Mobile</span><strong>{customer.mobile || "-"}</strong></div>
      <div><span>Account Number</span><strong>{customer.accountNumber || "-"}</strong></div><div><span>Balance</span><strong>{money(customer.accountBalance)}</strong></div>
      <div><span>Frozen Balance</span><strong>{money(customer.frozenBalance)}</strong></div><div><span>KYC Status</span><strong>{customer.kycStatus}</strong></div>
      <div><span>Loan Status</span><strong>{customer.loanStatus}</strong></div><div><span>Fraud Alerts</span><strong>{customer.fraudAlertCount}</strong></div>
      <div><span>Total Transactions</span><strong>{customer.totalTransactions}</strong></div><div><span>Registration Date</span><strong>{date(customer.createdAt)}</strong></div>
    </div>
    <div className="row-actions wrap"><button disabled={loading || customer.enabled} onClick={() => controlCustomer(customer.id, adminApi.enableUser, "Customer enabled.")}>Enable Customer</button><button disabled={loading || !customer.enabled} className="danger-action" onClick={() => controlCustomer(customer.id, adminApi.disableUser, "Customer disabled.")}>Disable Customer</button><button disabled={loading || customer.accountStatus === "FROZEN" || customer.accountStatus === "NO_ACCOUNT"} className="danger-action" onClick={() => controlCustomer(customer.id, adminApi.freezeAccount, "Account frozen.")}>Freeze Account</button><button disabled={loading || customer.accountStatus !== "FROZEN"} onClick={() => controlCustomer(customer.id, adminApi.unfreezeAccount, "Account unfrozen.")}>Unfreeze Account</button></div>
    <History title="Transaction History" rows={customer.transactions || []} render={(tx) => `${date(tx.createdAt)} - ${displayType(tx.type)} - ${money(tx.amount)} - ${tx.description || "-"}`} />
    <History title="Fraud History" rows={customer.fraudAlerts || []} render={(alert) => `${date(alert.createdAt)} - ${alert.riskLevel} - ${alert.reason}`} />
    <History title="Loan History" rows={customer.loans || []} render={(loan) => `${date(loan.createdAt)} - ${loan.status} - ${money(loan.loanAmount)} - score ${loan.approvalScore || 0}%`} />
  </section>;
}

function AuditModule({ logs, allLogs, query, setQuery, module, setModule, action, setAction, role, setRole }) {
  const modules = unique(allLogs.map((log) => log.module));
  const actions = unique(allLogs.map((log) => log.action));
  const roles = unique(allLogs.map((log) => log.actorRole));
  return <section className="panel admin-card">
    <div className="admin-section-head"><div><h2>Audit Log System</h2><p>Search logs and filter by module, action, role, and event details.</p></div></div>
    <div className="audit-filters"><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search logs" /><select value={module} onChange={(e) => setModule(e.target.value)}><option value="">All Modules</option>{modules.map((item) => <option key={item}>{item}</option>)}</select><select value={action} onChange={(e) => setAction(e.target.value)}><option value="">All Actions</option>{actions.map((item) => <option key={item}>{item}</option>)}</select><select value={role} onChange={(e) => setRole(e.target.value)}><option value="">All Roles</option>{roles.map((item) => <option key={item}>{item}</option>)}</select></div>
    <div className="admin-table-wrap"><table><thead><tr><th>Date</th><th>Actor</th><th>Role</th><th>Module</th><th>Action</th><th>Description</th><th>IP</th></tr></thead><tbody>{logs.map((log) => <tr key={log.id}><td>{date(log.createdAt)}</td><td>{log.actorUserId || "-"}</td><td>{log.actorRole}</td><td>{log.module}</td><td>{log.action}</td><td>{log.description}</td><td>{log.ipAddress || "-"}</td></tr>)}</tbody></table></div>
  </section>;
}

function KycDetails({ kyc, loading, reason, setReason, approve, reject }) {
  if (!kyc) return <div className="kyc-details empty"><p>Select a KYC request to view complete details.</p></div>;
  const canReview = kyc.status === "PENDING";
  return <div className="kyc-details">
    <div className="kyc-details-head"><div><h3>{kyc.fullName || kyc.userName}</h3><p>{kyc.userEmail}</p></div><Badge value={kyc.status} /></div>
    <div className="readonly-grid compact"><div><span>Mobile</span><strong>{kyc.mobileNumber || "-"}</strong></div><div><span>PAN</span><strong>{kyc.panNumber || "-"}</strong></div><div><span>Aadhaar</span><strong>{kyc.aadhaarNumber || "-"}</strong></div><div><span>Submitted</span><strong>{date(kyc.submittedAt)}</strong></div><div className="full"><span>Address</span><strong>{kyc.address || "-"}</strong></div><div className="full"><span>Remarks</span><strong>{kyc.remarks || "-"}</strong></div></div>
    {canReview && <div className="kyc-actions"><button type="button" onClick={() => approve(kyc.id)} disabled={loading}>Approve KYC</button><label>Rejection Reason<input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Example: PAN details do not match" /></label><button type="button" className="danger-action" onClick={() => reject(kyc.id)} disabled={loading}>Reject KYC</button></div>}
  </div>;
}

function AdminTable({ title, subtitle, children }) {
  return <section className="panel admin-card"><div className="admin-section-head"><div><h2>{title}</h2><p>{subtitle}</p></div></div><div className="admin-table-wrap"><table>{children}</table></div></section>;
}

function History({ title, rows, render }) {
  return <div className="history-box"><h3>{title}</h3>{rows.length === 0 ? <p className="empty-copy">No records.</p> : rows.slice(0, 6).map((row) => <p key={row.id}>{render(row)}</p>)}</div>;
}

function BarCard({ title, data, moneyTooltip = false }) {
  return <section className="panel admin-card"><h2>{title}</h2><div className="admin-chart"><ResponsiveContainer width="100%" height={260}><BarChart data={data}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" /><YAxis /><Tooltip formatter={(value) => moneyTooltip ? money(value) : value} /><Bar dataKey="value" fill="#0f766e" radius={[6, 6, 0, 0]} /></BarChart></ResponsiveContainer></div></section>;
}

function PieCard({ title, data }) {
  return <section className="panel admin-card"><h2>{title}</h2><div className="admin-chart"><ResponsiveContainer width="100%" height={230}><PieChart><Pie data={data} dataKey="value" nameKey="name" innerRadius={52} outerRadius={86} paddingAngle={3}>{data.map((entry, index) => <Cell key={entry.name} fill={colors[index % colors.length]} />)}</Pie><Tooltip /></PieChart></ResponsiveContainer></div><div className="chart-legend">{data.map((item, index) => <span key={item.name}><i style={{ background: colors[index % colors.length] }} />{item.name}: {item.value}</span>)}</div></section>;
}

function buildAnalytics(data, transactions, users, fraudAlerts, loans) {
  return {
    monthlyTransactions: monthBuckets(transactions, "createdAt", (txs) => txs.length),
    depositWithdrawal: [{ name: "Deposits", value: Number(data.totalDeposits || 0) }, { name: "Withdrawals", value: Number(data.totalWithdrawals || 0) }],
    customerGrowth: monthBuckets(users, "createdAt", (items) => items.length),
    fraudDistribution: countBy(fraudAlerts, "riskLevel"),
    loanDistribution: countBy(loans, "status"),
    kycDistribution: [{ name: "Pending", value: Number(data.pendingKycCount || 0) }, { name: "Approved", value: Number(data.approvedKycCount || 0) }, { name: "Rejected", value: Number(data.rejectedKycCount || 0) }]
  };
}

function monthBuckets(rows, key, resolveValue) {
  const buckets = {};
  rows.forEach((row) => {
    const dateValue = row[key] ? new Date(row[key]) : null;
    if (!dateValue || Number.isNaN(dateValue.getTime())) return;
    const name = dateValue.toLocaleString("en-US", { month: "short" });
    buckets[name] = [...(buckets[name] || []), row];
  });
  return Object.entries(buckets).map(([name, items]) => ({ name, value: resolveValue(items) })).slice(-6);
}

function countBy(rows, key) {
  const counts = {};
  rows.forEach((row) => { const name = row[key] || "UNKNOWN"; counts[name] = (counts[name] || 0) + 1; });
  return Object.entries(counts).map(([name, value]) => ({ name, value }));
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function Badge({ value }) {
  const normalized = String(value || "UNKNOWN").toUpperCase();
  return <span className={`status-badge ${normalized}`}>{normalized.replaceAll("_", " ")}</span>;
}

function displayType(type) {
  return type === "QR_PAYMENT" ? "TRANSFER" : type || "-";
}

function date(value) {
  if (!value) return "-";
  return new Date(value).toLocaleString();
}

function money(value) {
  return `Rs ${Number(value || 0).toLocaleString("en-IN")}`;
}

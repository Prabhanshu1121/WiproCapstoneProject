import client from "../api/client";

export const authApi = {
  register: (data) => client.post("/auth/register", data),
  login: (data) => client.post("/auth/login", data),
  verifyOtp: (data) => client.post("/auth/verify-otp", data),
  profile: () => client.get("/auth/profile")
};

export const bankingApi = {
  dashboard: () => client.get("/banking/dashboard"),
  transactions: () => client.get("/banking/transactions"),
  deposit: (data) => client.post("/banking/deposit", data),
  withdraw: (data) => client.post("/banking/withdraw", data),
  transfer: (data) => client.post("/banking/transfer", data),
  myQr: () => client.get("/banking/my-qr"),
  qrPayment: (data) => client.post("/banking/qr-payment", data)
};

export const fraudApi = {
  alerts: () => client.get("/fraud/alerts"),
  riskScore: () => client.get("/fraud/user-risk-score")
};

export const aiApi = {
  chat: (data) => client.post("/ai/chat", data)
};

export const investmentApi = {
  riskProfile: (data) => client.post("/investment/risk-profile", data),
  profile: () => client.get("/investment/risk-profile"),
  suggestions: () => client.get("/investment/suggestions"),
  addPortfolio: (data) => client.post("/investment/add-portfolio", data),
  deletePortfolio: (id) => client.delete(`/investment/portfolio/${id}`),
  analytics: () => client.get("/investment/portfolio-analytics")
};

export const loanApi = {
  emi: (data) => client.post("/loan/calculate-emi", data),
  predict: (data) => client.post("/loan/predict-approval", data),
  credit: () => client.get("/loan/credit-analysis")
};

export const adminApi = {
  dashboard: () => client.get("/admin/dashboard"),
  users: () => client.get("/admin/users"),
  user: (id) => client.get(`/admin/users/${id}`),
  enableUser: (id) => client.post(`/admin/users/${id}/enable`),
  disableUser: (id) => client.post(`/admin/users/${id}/disable`),
  freezeAccount: (id) => client.post(`/admin/users/${id}/freeze-account`),
  unfreezeAccount: (id) => client.post(`/admin/users/${id}/unfreeze-account`),
  transactions: () => client.get("/admin/transactions"),
  fraudAlerts: () => client.get("/admin/fraud-alerts"),
  approveFraud: (id) => client.post(`/admin/fraud-alerts/${id}/approve`),
  blockFraud: (id) => client.post(`/admin/fraud-alerts/${id}/block`),
  loans: () => client.get("/admin/loan-applications"),
  approveLoan: (id) => client.post(`/admin/loan-applications/${id}/approve`),
  rejectLoan: (id, reason) => client.post(`/admin/loan-applications/${id}/reject`, { reason }),
  auditLogs: () => client.get("/admin/audit-logs"),
  pendingKyc: () => client.get("/admin/kyc/pending"),
  kycByStatus: (status) => client.get(`/admin/kyc/${status}`),
  approveKyc: (id) => client.post(`/admin/kyc/${id}/approve`),
  rejectKyc: (id, reason) => client.post(`/admin/kyc/${id}/reject`, { reason })
};

export const kycApi = {
  submit: (data) => client.post("/kyc/submit", data),
  mine: () => client.get("/kyc/me")
};

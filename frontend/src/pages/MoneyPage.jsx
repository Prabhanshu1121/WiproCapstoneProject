import React, { useState } from "react";
import { getError } from "../api/client";
import FormStatus from "../components/FormStatus";
import { bankingApi } from "../services/api";

export default function MoneyPage({ mode }) {
  const [form, setForm] = useState({ amount: "" });
  const [status, setStatus] = useState({});
  const isDeposit = mode === "deposit";
  const submit = async (e) => {
    e.preventDefault();
    setStatus({});
    try {
      await (isDeposit ? bankingApi.deposit({ amount: form.amount }) : bankingApi.withdraw({ amount: form.amount }));
      setStatus({ success: `${isDeposit ? "Deposit" : "Withdrawal"} completed` });
      setForm({ amount: "" });
    } catch (err) {
      setStatus({ error: getError(err) });
    }
  };
  return <section className="panel form-panel"><h2>{isDeposit ? "Deposit Money" : "Withdraw Money"}</h2><form onSubmit={submit}>
    <label>Amount<input type="number" min="1" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required /></label>
    <FormStatus {...status} />
    <button>{isDeposit ? "Deposit" : "Withdraw"}</button>
  </form></section>;
}

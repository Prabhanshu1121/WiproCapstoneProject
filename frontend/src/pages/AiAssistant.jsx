import React, { useMemo, useState } from "react";
import { getError } from "../api/client";
import FormStatus from "../components/FormStatus";
import { useAuth } from "../context/AuthContext";
import { aiApi } from "../services/api";

const prompts = [
  "How do I complete KYC?",
  "Why is my dashboard locked?",
  "How can I trigger fraud alert testing?",
  "Explain my loan approval score",
  "How do QR payments work?",
  "What can admin manage?"
];

export default function AiAssistant() {
  const { profile, isAdmin } = useAuth();
  const [messages, setMessages] = useState([
    { role: "assistant", text: "Hi, I am your SmartBank AI assistant. Ask me about KYC, transactions, QR payments, loans, fraud alerts, investments, or admin workflows." }
  ]);
  const [input, setInput] = useState("");
  const [status, setStatus] = useState({});
  const [loading, setLoading] = useState(false);

  const contextText = useMemo(() => {
    return isAdmin ? "Admin mode" : `${profile?.kycStatus || "KYC"} · ${profile?.accountNumber || "No account"}`;
  }, [isAdmin, profile]);

  const send = async (text = input) => {
    const clean = text.trim();
    if (!clean) return;
    setStatus({});
    setLoading(true);
    const nextMessages = [...messages, { role: "user", text: clean }];
    setMessages(nextMessages);
    setInput("");
    try {
      const history = nextMessages.slice(-8).map((item) => ({ role: item.role, text: item.text }));
      const res = await aiApi.chat({ message: clean, history });
      setMessages([...nextMessages, { role: "assistant", text: res.data.reply }]);
    } catch (err) {
      setStatus({ error: getError(err) });
      setMessages([...nextMessages, { role: "assistant", text: "I could not reach the AI service right now. Please check backend configuration." }]);
    } finally {
      setLoading(false);
    }
  };

  return <div className="ai-page">
    <section className="ai-hero">
      <div>
        <span className="section-kicker">Gemini Assistant</span>
        <h2>Ask SmartBank AI</h2>
        <p>Project-wide assistant for customer banking, fraud, loans, investments, KYC, and admin workflows.</p>
      </div>
      <div className="ai-context"><span>Context</span><strong>{contextText}</strong></div>
    </section>

    <FormStatus {...status} />

    <section className="ai-shell">
      <aside className="ai-side panel">
        <h2>Quick Questions</h2>
        <div className="ai-prompts">{prompts.map((prompt) => <button key={prompt} type="button" onClick={() => send(prompt)} disabled={loading}>{prompt}</button>)}</div>
      </aside>

      <section className="ai-chat panel">
        <div className="ai-messages">
          {messages.map((message, index) => <div key={`${message.role}-${index}`} className={`ai-message ${message.role}`}>
            <span>{message.role === "user" ? "You" : "SmartBank AI"}</span>
            <p>{message.text}</p>
          </div>)}
        </div>
        <form className="ai-input" onSubmit={(e) => { e.preventDefault(); send(); }}>
          <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask about any SmartBank feature..." disabled={loading} />
          <button disabled={loading || !input.trim()}>{loading ? "Thinking..." : "Send"}</button>
        </form>
      </section>
    </section>
  </div>;
}

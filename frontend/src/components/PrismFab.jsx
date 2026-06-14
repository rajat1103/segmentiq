/**
 * PrismFab.jsx — Floating Prism AI Mini-Chat Button
 * A glassmorphic floating action button that expands into a compact
 * AI chat panel. Lives on Dashboard and Customers pages.
 * Uses the same AI endpoint as the full Prism AI workspace.
 */
import { useState, useRef, useEffect, useCallback } from "react";
import { PrismLogo } from "./Logo";
import { X, Send, Minimize2, Sparkles, Bot } from "lucide-react";
import { aiChat } from "../services/api";
import { useDataset } from "../context/DatasetContext";

const MAX_MESSAGES = 20;

function TypingDots() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "4px", padding: "10px 14px" }}>
      <div style={{ width: 28, height: 28, borderRadius: "50%", background: "linear-gradient(135deg,#6366f1,#818cf8)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <PrismLogo size={16} />
      </div>
      <div style={{ display: "flex", gap: "3px", alignItems: "center", padding: "6px 10px", background: "rgba(238,242,255,0.80)", borderRadius: "12px 12px 12px 0", border: "1px solid rgba(199,210,254,0.40)" }}>
        {[0, 1, 2].map(i => (
          <div key={i} style={{ width: 5, height: 5, borderRadius: "50%", background: "#6366f1", animation: `fabBounce 1.3s ease-in-out ${i * 0.2}s infinite`, opacity: 0.7 }} />
        ))}
      </div>
    </div>
  );
}

export default function PrismFab() {
  const [open,     setOpen]     = useState(false);
  const [messages, setMessages] = useState([]);
  const [input,    setInput]    = useState("");
  const [typing,   setTyping]   = useState(false);
  const [greeted,  setGreeted]  = useState(false);
  const endRef  = useRef(null);
  const inputRef = useRef(null);
  const { dataset } = useDataset();

  /* ── Initial greeting ── */
  useEffect(() => {
    if (open && !greeted) {
      setGreeted(true);
      setTyping(true);
      setTimeout(() => {
        const greet = dataset
          ? `👋 Hi! I'm Prism AI. I can see your dataset **${dataset.fileName}** with **${dataset.summary?.totalCustomers} customers**.\n\nAsk me anything about your data — segments, revenue, customer trends, or campaign ideas!`
          : `👋 Hi! I'm Prism AI, your CRM intelligence assistant.\n\nUpload a customer dataset from this page, then ask me about segments, trends, or campaign recommendations!`;
        setMessages([{ role: "ai", content: greet, id: Date.now() }]);
        setTyping(false);
      }, 900);
    }
  }, [open, greeted, dataset]);

  /* ── Auto scroll ── */
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing]);

  /* ── Focus input on open ── */
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 100);
  }, [open]);

  /* ── Build system context from dataset ── */
  const buildSystemContext = useCallback(() => {
    if (!dataset) return null;
    const s = dataset.summary || {};
    return `You are Prism AI, a CRM analytics assistant. The user has uploaded a customer dataset with the following summary:
- Total customers: ${s.totalCustomers}
- Cities: ${(s.cities || []).join(", ")}
- Gender breakdown: ${JSON.stringify(s.genderBreakdown)}
- Average age: ${s.averageAge}
- Total revenue: ₹${s.totalRevenue}
- Average spend per customer: ₹${s.avgSpend}
- File: ${dataset.fileName} (uploaded ${new Date(dataset.uploadedAt).toLocaleDateString()})

First few rows of CSV data:
${(dataset.csvText || "").split("\n").slice(0, 6).join("\n")}

Answer questions about this data concisely and helpfully.`;
  }, [dataset]);

  /* ── Send message ── */
  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text) return;

    const userMsg = { role: "user", content: text, id: Date.now() };
    setMessages(prev => [...prev.slice(-(MAX_MESSAGES - 1)), userMsg]);
    setInput("");
    setTyping(true);

    try {
      // Build history for API
      const history = [...messages, userMsg]
        .slice(-8)
        .map(m => ({ role: m.role === "ai" ? "assistant" : "user", content: m.content }));

      // Prepend system context if dataset available
      const systemCtx = buildSystemContext();
      const apiMessages = systemCtx
        ? [{ role: "user", content: systemCtx }, { role: "assistant", content: "Understood! I have full context of your customer dataset. Ask me anything." }, ...history]
        : history;

      const res = await aiChat(apiMessages);
      const aiMsg = { role: "ai", content: res.data.reply, id: Date.now() + 1 };
      setMessages(prev => [...prev.slice(-(MAX_MESSAGES - 1)), aiMsg]);
    } catch (err) {
      const errMsg = err?.response?.data?.detail || "Connection error. Please try again.";
      setMessages(prev => [...prev, { role: "ai", content: `⚠️ ${errMsg}`, id: Date.now() + 1 }]);
    } finally {
      setTyping(false);
    }
  }, [input, messages, buildSystemContext]);

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const QUICK = dataset
    ? ["Segment high spenders", "Revenue by city?", "Campaign idea?"]
    : ["What is SegmentIQ?", "How to import data?", "Campaign tips"];

  return (
    <>
      <style>{`
        @keyframes fabBounce { 0%,100%{transform:translateY(0);opacity:.4} 50%{transform:translateY(-4px);opacity:1} }
        @keyframes fabPulse  { 0%,100%{box-shadow:0 0 0 0 rgba(99,102,241,.40)} 50%{box-shadow:0 0 0 10px rgba(99,102,241,0)} }
        @keyframes fabSlide  { from{opacity:0;transform:translateY(20px) scale(0.95)} to{opacity:1;transform:translateY(0) scale(1)} }
        .fab-msg-user { animation: fabSlide 0.18s ease both; }
        .fab-msg-ai   { animation: fabSlide 0.20s ease both; }
        .fab-quick-chip:hover { background:rgba(99,102,241,0.12)!important; color:#6366f1!important; }
      `}</style>

      {/* ── Expanded Chat Panel ── */}
      {open && (
        <div style={{
          position: "fixed", bottom: "80px", right: "24px",
          width: "320px", height: "430px",
          background: "rgba(255,255,255,0.94)",
          backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)",
          border: "1px solid rgba(199,210,254,0.55)",
          borderRadius: "20px",
          boxShadow: "0 24px 64px rgba(99,102,241,0.18), 0 8px 24px rgba(15,23,42,0.12)",
          display: "flex", flexDirection: "column", overflow: "hidden",
          zIndex: 999,
          animation: "fabSlide 0.22s cubic-bezier(0.16,1,0.3,1) both",
        }}>

          {/* Header */}
          <div style={{
            padding: "12px 14px",
            borderBottom: "1px solid rgba(226,232,255,0.50)",
            display: "flex", alignItems: "center", gap: "10px",
            background: "linear-gradient(135deg, rgba(238,242,255,0.80), rgba(245,240,255,0.60))",
            flexShrink: 0,
          }}>
            <div style={{ width: 32, height: 32, borderRadius: "9px", background: "linear-gradient(135deg,#6366f1,#818cf8)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 8px rgba(99,102,241,0.30)" }}>
              <PrismLogo size={18} />
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: "12.5px", fontWeight: 800, color: "#1a1d2e", margin: 0, letterSpacing: "-0.01em" }}>Prism AI</p>
              <p style={{ fontSize: "10px", color: "#6366f1", margin: 0, fontWeight: 600 }}>
                {dataset ? `● ${dataset.summary?.totalCustomers} customers loaded` : "● Ask anything"}
              </p>
            </div>
            <button onClick={() => setOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#8891a8", padding: "3px", borderRadius: "5px" }}
              onMouseEnter={e => e.currentTarget.style.background = "rgba(226,232,255,0.60)"}
              onMouseLeave={e => e.currentTarget.style.background = "none"}>
              <X size={14} />
            </button>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: "auto", padding: "10px 12px", display: "flex", flexDirection: "column", gap: "6px" }}>
            {messages.map(m => (
              <div key={m.id} className={m.role === "user" ? "fab-msg-user" : "fab-msg-ai"}
                style={{ display: "flex", gap: "7px", alignItems: "flex-end", flexDirection: m.role === "user" ? "row-reverse" : "row" }}>
                {m.role === "ai" && (
                  <div style={{ width: 22, height: 22, borderRadius: "50%", background: "linear-gradient(135deg,#6366f1,#818cf8)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <PrismLogo size={12} />
                  </div>
                )}
                <div style={{
                  maxWidth: "78%", padding: "8px 11px", borderRadius: m.role === "user" ? "14px 14px 0 14px" : "14px 14px 14px 0",
                  background: m.role === "user" ? "linear-gradient(135deg,#6366f1,#818cf8)" : "rgba(238,242,255,0.90)",
                  border: m.role === "user" ? "none" : "1px solid rgba(199,210,254,0.40)",
                  color: m.role === "user" ? "white" : "#1a1d2e",
                  fontSize: "12px", lineHeight: 1.5, fontWeight: 400,
                  boxShadow: m.role === "user" ? "0 2px 10px rgba(99,102,241,0.25)" : "none",
                  whiteSpace: "pre-wrap",
                }}>
                  {m.content}
                </div>
              </div>
            ))}
            {typing && <TypingDots />}
            <div ref={endRef} />
          </div>

          {/* Quick chips */}
          {messages.length <= 2 && !typing && (
            <div style={{ padding: "0 10px 8px", display: "flex", gap: "5px", flexWrap: "wrap" }}>
              {QUICK.map(q => (
                <button key={q} className="fab-quick-chip" onClick={() => { setInput(q); setTimeout(() => inputRef.current?.focus(), 50); }}
                  style={{
                    fontSize: "10.5px", fontWeight: 600, padding: "4px 9px", borderRadius: "99px",
                    border: "1px solid rgba(199,210,254,0.50)", background: "rgba(238,242,255,0.55)",
                    color: "#4338ca", cursor: "pointer", transition: "all 0.15s ease",
                  }}>
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* Input row */}
          <div style={{
            padding: "10px 12px", borderTop: "1px solid rgba(226,232,255,0.50)",
            display: "flex", gap: "7px", alignItems: "center",
            background: "rgba(248,249,254,0.60)", flexShrink: 0,
          }}>
            <input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder={dataset ? "Ask about your data…" : "Ask Prism AI…"}
              style={{
                flex: 1, border: "1px solid rgba(199,210,254,0.50)", borderRadius: "10px",
                padding: "8px 12px", fontSize: "12px", outline: "none",
                background: "rgba(255,255,255,0.90)", color: "#1a1d2e",
                fontFamily: "var(--font-sans)",
              }}
              onFocus={e => e.target.style.borderColor = "#6366f1"}
              onBlur={e => e.target.style.borderColor = "rgba(199,210,254,0.50)"}
            />
            <button onClick={handleSend} disabled={!input.trim() || typing}
              style={{
                width: 32, height: 32, borderRadius: "9px", border: "none",
                background: input.trim() && !typing ? "linear-gradient(135deg,#6366f1,#818cf8)" : "rgba(226,232,255,0.60)",
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: input.trim() && !typing ? "pointer" : "default",
                transition: "all 0.15s ease", flexShrink: 0,
              }}>
              <Send size={13} color={input.trim() && !typing ? "white" : "#a5b4fc"} />
            </button>
          </div>
        </div>
      )}

      {/* ── FAB Button ── */}
      <button
        onClick={() => setOpen(v => !v)}
        title={open ? "Close Prism AI" : "Ask Prism AI"}
        style={{
          position: "fixed", bottom: "24px", right: "24px",
          width: 52, height: 52, borderRadius: "16px", border: "none",
          background: open
            ? "rgba(226,232,255,0.90)"
            : "linear-gradient(135deg, #6366f1, #818cf8)",
          boxShadow: open
            ? "0 4px 16px rgba(99,102,241,0.20)"
            : "0 8px 28px rgba(99,102,241,0.40), 0 2px 8px rgba(15,23,42,0.12)",
          display: "flex", alignItems: "center", justifyContent: "center",
          cursor: "pointer", transition: "all 0.2s cubic-bezier(0.34,1.56,0.64,1)",
          zIndex: 1000,
          animation: open ? "none" : "fabPulse 3s ease-in-out infinite",
        }}
        onMouseEnter={e => e.currentTarget.style.transform = "scale(1.08)"}
        onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
      >
        {open
          ? <X size={20} color="#6366f1" />
          : <PrismLogo size={28} />
        }
      </button>
    </>
  );
}

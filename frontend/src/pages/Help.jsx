import { useState } from "react";
import {
  HelpCircle,
  MessageSquare,
  Mail,
  Phone,
  MapPin,
  Send,
  User,
  ShieldAlert,
  Terminal,
} from "lucide-react";

export default function HelpPage() {
  const [messages, setMessages] = useState([
    {
      sender: "prism",
      text: "Hello! I am your Prism AI Support Assistant. Ask me anything about the SegmentIQ platform architecture, FastAPI configurations, or Neon Postgres integration.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  // Hardcoded Support Documentation mappings
  const FAQ_MAPPINGS = {
    "lead score": "Lead Scores are computed dynamically based on two factors: total orders count and aggregate customer spend. The algorithm scales the results into a 1-100 range and assigns a tier: Cold (<=30), Warm (31-60), Hot (61-89), or VIP (>=90).",
    "roi": "The Campaign ROI Calculator takes target audience size, expected conversion rate (%), and cost per contact to project your potential gross revenue and profit margin prior to launching campaigns.",
    "fastapi": "Ensure the backend environment variables are configured. Rename .env.example to .env, set DATABASE_URL to your Neon connection string, and run uvicorn app.main:app --reload.",
    "neon": "Neon Postgres requires SSL mode configured. The database.py script automatically injects 'sslmode=require' for production connections outside localhost.",
    "cors": "If you experience CORS errors, verify that your Vercel deployment URL is declared inside the ALLOWED_ORIGINS env variable in your Render dashboard.",
  };

  const handleSend = async (e) => {
    e?.preventDefault();
    if (!input.trim() || loading) return;

    const userText = input;
    setMessages((prev) => [...prev, { sender: "user", text: userText }]);
    setInput("");
    setLoading(true);

    setTimeout(() => {
      let reply = "I couldn't find specific documentation matching your query. Please escalalate to Lead Architect Rishabh Raj using the Technical Escalation panel on the right.";
      
      const normalizedQuery = userText.toLowerCase();
      for (const [key, value] of Object.entries(FAQ_MAPPINGS)) {
        if (normalizedQuery.includes(key)) {
          reply = value;
          break;
        }
      }

      setMessages((prev) => [...prev, { sender: "prism", text: reply }]);
      setLoading(false);
    }, 800);
  };

  const askPreset = (query) => {
    setInput(query);
    setTimeout(() => {
      // Small trigger delay
      const mockForm = document.getElementById("support-chat-form");
      if (mockForm) mockForm.dispatchEvent(new Event("submit", { cancelable: true, bubbles: true }));
    }, 50);
  };

  return (
    <div style={{ animation: "crmFadeIn 0.25s ease" }}>
      {/* Page Header */}
      <div className="crm-page-header" style={{ marginBottom: "20px" }}>
        <div>
          <h1 className="crm-page-title" style={{ fontSize: "20px", display: "flex", alignItems: "center", gap: "8px" }}>
            <HelpCircle size={20} color="#3b82f6" /> Help & Support Center
          </h1>
          <p className="crm-page-subtitle">Get instant documentation assistance from Prism AI or escalate complex bugs to the system administrator.</p>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: "20px" }}>
        {/* Left Panel: AI Support Assistant */}
        <div className="glass-card" style={{ display: "flex", flexDirection: "column", height: "500px", padding: "18px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", borderBottom: "1px solid rgba(226, 232, 240, 0.60)", paddingBottom: "12px", marginBottom: "12px", flexShrink: 0 }}>
            <MessageSquare size={16} color="#3b82f6" />
            <div>
              <p style={{ fontSize: "13px", fontWeight: 700, color: "#0f172a", margin: 0 }}>Prism Support Copilot</p>
              <p style={{ fontSize: "10px", color: "#64748b", margin: 0 }}>Interactive Technical Documentation Assistant</p>
            </div>
          </div>

          {/* Quick FAQ Preset Chips */}
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "12px", flexShrink: 0 }}>
            {[
              { label: "Lead Score Algorithm", query: "How is lead score calculated?" },
              { label: "Database SSL Config", query: "How is Neon Postgres SSL configured?" },
              { label: "Local FastAPI Setup", query: "How to run FastAPI locally?" },
            ].map((p) => (
              <button
                key={p.label}
                onClick={() => askPreset(p.query)}
                style={{
                  fontSize: "11px",
                  padding: "4px 8px",
                  borderRadius: "4px",
                  background: "rgba(239, 246, 255, 0.7)",
                  border: "1px solid rgba(191, 219, 254, 0.6)",
                  color: "#1d4ed8",
                  cursor: "pointer",
                  fontWeight: 600,
                  transition: "all 0.12s ease"
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(191, 219, 254, 0.70)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(239, 246, 255, 0.7)"; }}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Messages Scroll Area */}
          <div style={{ flex: 1, overflowY: "auto", padding: "6px", marginBottom: "12px", display: "flex", flexDirection: "column", gap: "12px" }}>
            {messages.map((m, i) => {
              const isPrism = m.sender === "prism";
              return (
                <div
                  key={i}
                  style={{
                    alignSelf: isPrism ? "flex-start" : "flex-end",
                    maxWidth: "85%",
                    background: isPrism ? "rgba(241, 245, 249, 0.90)" : "rgba(37, 99, 235, 0.90)",
                    color: isPrism ? "#334155" : "#ffffff",
                    border: isPrism ? "1px solid rgba(226, 232, 240, 0.60)" : "none",
                    borderRadius: isPrism ? "10px 10px 10px 2px" : "10px 10px 2px 10px",
                    padding: "10px 14px",
                    fontSize: "12.5px",
                    lineHeight: 1.4
                  }}
                >
                  <p style={{ fontWeight: 700, fontSize: "10px", margin: "0 0 3px", opacity: 0.8, textTransform: "uppercase" }}>
                    {isPrism ? "Prism Support" : "Rishabh Raj"}
                  </p>
                  <span>{m.text}</span>
                </div>
              );
            })}
            {loading && (
              <div style={{ alignSelf: "flex-start", padding: "8px 12px", background: "rgba(241, 245, 249, 0.90)", border: "1px solid rgba(226, 232, 240, 0.60)", borderRadius: "8px", fontSize: "11px", color: "#64748b" }}>
                Prism is typing...
              </div>
            )}
          </div>

          {/* Input Chat Bar */}
          <form id="support-chat-form" onSubmit={handleSend} style={{ display: "flex", gap: "8px", flexShrink: 0 }}>
            <input
              type="text"
              placeholder="Ask support bot (e.g. 'lead score', 'neon', 'fastapi')..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="glass-input"
              style={{ flex: 1, padding: "8px 12px" }}
            />
            <button
              type="submit"
              className="glass-btn-primary"
              style={{ padding: "8px 14px" }}
              disabled={!input.trim() || loading}
            >
              <Send size={14} />
            </button>
          </form>
        </div>

        {/* Right Panel: Technical Escalation */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* Main Escalation Card */}
          <div className="glass-card" style={{ padding: "20px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", borderBottom: "1px solid rgba(226, 232, 240, 0.60)", paddingBottom: "10px", marginBottom: "16px" }}>
              <ShieldAlert size={16} color="#dc2626" />
              <h3 style={{ fontSize: "13.5px", fontWeight: 700, color: "#0f172a", margin: 0 }}>Direct Technical Escalation</h3>
            </div>
            
            <p style={{ fontSize: "12.5px", color: "#64748b", margin: "0 0 16px", lineHeight: 1.4 }}>
              For critical pipeline bugs, database outages, or deployment blockages, contact the system administrator directly.
            </p>

            {/* Stakeholder Details Card */}
            <div style={{ background: "rgba(248, 250, 252, 0.70)", border: "1px solid rgba(226, 232, 240, 0.80)", borderRadius: "8px", padding: "14px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
                <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#3b82f6", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: 700, color: "#ffffff" }}>
                  RR
                </div>
                <div>
                  <h4 style={{ fontSize: "13px", fontWeight: 700, color: "#0f172a", margin: 0 }}>Rishabh Raj</h4>
                  <p style={{ fontSize: "10px", color: "#64748b", margin: 0 }}>Lead Architect / System Administrator</p>
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "10px", fontSize: "12px", color: "#334155" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <Mail size={13} color="#64748b" />
                  <a href="mailto:rajatrishabh03@gmail.com" style={{ color: "#2563eb", textDecoration: "none", fontWeight: 500 }}>rajatrishabh03@gmail.com</a>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <Phone size={13} color="#64748b" />
                  <span style={{ fontWeight: 500 }}>+91 7870038771</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <MapPin size={13} color="#64748b" />
                  <span>Chennai, Tamil Nadu</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Diagnostic Card */}
          <div className="glass-card" style={{ padding: "16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "8px" }}>
              <Terminal size={14} color="#64748b" />
              <span style={{ fontSize: "11px", fontWeight: 700, color: "#475569", textTransform: "uppercase" }}>Diagnostic Payload</span>
            </div>
            <pre style={{
              margin: 0,
              padding: "10px",
              background: "#0f172a",
              color: "#38bdf8",
              borderRadius: "6px",
              fontSize: "10px",
              fontFamily: "var(--font-mono)",
              overflowX: "auto"
            }}>
{`Host: client.segmentiq.internal
Auth Context: RR-LeadAdmin
Neon Host SSL: ENABLED
API Target: LOCALHOST-8000`}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}

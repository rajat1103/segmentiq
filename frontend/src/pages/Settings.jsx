import { useState, useEffect } from "react";
import {
  Settings,
  Database,
  Link2,
  Sliders,
  CheckCircle2,
  XCircle,
  Activity,
  Server,
  RefreshCw,
  Info,
} from "lucide-react";
import API from "../services/api";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("api");
  const [dbStatus, setDbStatus] = useState("checking");
  const [apiStatus, setApiStatus] = useState("checking");
  const [latency, setLatency] = useState(null);
  const [checking, setChecking] = useState(false);

  // Settings state
  const [density, setDensity] = useState("compact");
  const [borderStyle, setBorderStyle] = useState("muted");
  const [themeMode, setThemeMode] = useState("light-slate");

  const checkConnection = async () => {
    setChecking(true);
    const start = Date.now();
    try {
      const dbRes = await API.get("/health/db");
      const end = Date.now();
      setLatency(end - start);
      if (dbRes.data?.status === "success") {
        setDbStatus("connected");
      } else {
        setDbStatus("error");
      }
    } catch (e) {
      setDbStatus("offline");
      setLatency(null);
    }

    try {
      await API.get("/");
      setApiStatus("online");
    } catch (e) {
      setApiStatus("offline");
    }
    setChecking(false);
  };

  useEffect(() => {
    checkConnection();
  }, []);

  return (
    <div style={{ animation: "crmFadeIn 0.25s ease" }}>
      {/* Page Header */}
      <div className="crm-page-header" style={{ marginBottom: "20px" }}>
        <div>
          <h1 className="crm-page-title" style={{ fontSize: "20px", display: "flex", alignItems: "center", gap: "8px" }}>
            <Settings size={20} color="#3b82f6" /> System Settings
          </h1>
          <p className="crm-page-subtitle">Configure application options, database connection nodes, and theme configurations.</p>
        </div>
        <button
          onClick={checkConnection}
          disabled={checking}
          className="glass-btn-secondary"
          style={{ fontSize: "12px", gap: "6px" }}
        >
          <RefreshCw size={12} className={checking ? "animate-spin" : ""} />
          {checking ? "Checking..." : "Recheck Status"}
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "220px 1fr", gap: "20px" }}>
        {/* Left: Settings Nav Tabs */}
        <div className="glass-card" style={{ padding: "10px", height: "fit-content" }}>
          {[
            { id: "api", label: "API Integrations", icon: Link2 },
            { id: "db", label: "Database Config", icon: Database },
            { id: "theme", label: "Theme Customization", icon: Sliders },
          ].map((t) => {
            const Icon = t.icon;
            const active = activeTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: "6px",
                  border: "none",
                  background: active ? "rgba(239, 246, 255, 0.90)" : "transparent",
                  color: active ? "#1d4ed8" : "var(--color-text-secondary)",
                  fontWeight: active ? 600 : 400,
                  fontSize: "13px",
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "all 0.15s ease",
                  marginBottom: "4px",
                }}
              >
                <Icon size={16} color={active ? "#3b82f6" : "#64748b"} />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>

        {/* Right: Settings Content Panels */}
        <div className="glass-card" style={{ padding: "24px" }}>
          {/* Tab 1: API Integrations */}
          {activeTab === "api" && (
            <div>
              <h2 style={{ fontSize: "16px", fontWeight: 700, margin: "0 0 4px", color: "#0f172a" }}>FastAPI Endpoint Configurations</h2>
              <p style={{ fontSize: "12.5px", color: "#64748b", margin: "0 0 20px" }}>
                Active status monitoring of the core FastAPI endpoints routing queries and auth processes.
              </p>

              {/* Status Banner */}
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: "14px",
                borderRadius: "8px",
                background: apiStatus === "online" ? "rgba(240, 253, 244, 0.70)" : "rgba(254, 242, 242, 0.70)",
                border: apiStatus === "online" ? "1px solid rgba(74, 222, 128, 0.40)" : "1px solid rgba(248, 113, 113, 0.40)",
                marginBottom: "20px"
              }}>
                {apiStatus === "online" ? (
                  <CheckCircle2 size={18} color="#16a34a" />
                ) : (
                  <XCircle size={18} color="#dc2626" />
                )}
                <div>
                  <p style={{ fontSize: "13px", fontWeight: 700, color: "#0f172a", margin: 0 }}>
                    API Endpoint Status: {apiStatus === "online" ? "Operational" : "Offline / Connecting"}
                  </p>
                  <p style={{ fontSize: "11.5px", color: "#64748b", margin: 0 }}>
                    Target Host URL: <code style={{ background: "rgba(0,0,0,0.03)", padding: "1px 4px", borderRadius: "3px" }}>{API.defaults.baseURL}</code>
                  </p>
                </div>
              </div>

              {/* Grid of Endpoints */}
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {[
                  { path: "/auth/login", method: "POST", desc: "User credentials validation & authentication tokens issuance" },
                  { path: "/auth/signup", method: "POST", desc: "Enterprise administrator registration and workspace scaffolding" },
                  { path: "/dashboard/stats", method: "GET", desc: "Aggregates revenue, order volumes, and customer conversion KPIs" },
                  { path: "/customers/", method: "GET/POST", desc: "Read and create customer entities connected to Neon Postgres" },
                  { path: "/campaigns/", method: "GET/POST", desc: "Launch and calculate campaign ROI structures" },
                  { path: "/communication-logs/", method: "GET", desc: "Chronological activity audit trails matching CRM channels" },
                ].map((ep) => (
                  <div
                    key={ep.path}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "10px 14px",
                      borderRadius: "6px",
                      background: "rgba(255,255,255,0.40)",
                      border: "1px solid rgba(226, 232, 240, 0.60)"
                    }}
                  >
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "2px" }}>
                        <span style={{
                          fontSize: "9px",
                          fontWeight: 800,
                          padding: "2px 6px",
                          borderRadius: "4px",
                          background: ep.method === "POST" ? "rgba(239, 246, 255, 0.9)" : "rgba(240, 253, 244, 0.9)",
                          color: ep.method === "POST" ? "#1d4ed8" : "#16a34a",
                          border: ep.method === "POST" ? "1px solid rgba(191, 219, 254, 0.60)" : "1px solid rgba(187, 247, 208, 0.60)"
                        }}>
                          {ep.method}
                        </span>
                        <code style={{ fontSize: "12px", fontWeight: 700, color: "#334155" }}>{ep.path}</code>
                      </div>
                      <p style={{ fontSize: "11px", color: "#64748b", margin: 0 }}>{ep.desc}</p>
                    </div>
                    <span style={{
                      fontSize: "11px",
                      fontWeight: 600,
                      color: apiStatus === "online" ? "#16a34a" : "#dc2626"
                    }}>
                      {apiStatus === "online" ? "Active" : "Offline"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tab 2: Database Connection State */}
          {activeTab === "db" && (
            <div>
              <h2 style={{ fontSize: "16px", fontWeight: 700, margin: "0 0 4px", color: "#0f172a" }}>Database Connection State</h2>
              <p style={{ fontSize: "12.5px", color: "#64748b", margin: "0 0 20px" }}>
                Real-time configuration parameters and connectivity telemetry for the Neon Serverless Postgres instance.
              </p>

              <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "20px" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  <div className="glass-card" style={{ padding: "14px", background: "rgba(255,255,255,0.40)" }}>
                    <p style={{ fontSize: "11px", color: "#64748b", fontWeight: 600, textTransform: "uppercase", margin: "0 0 4px" }}>
                      Database Host Address
                    </p>
                    <code style={{ fontSize: "12px", fontWeight: 700, color: "#334155", display: "block", overflowWrap: "anywhere" }}>
                      ep-noisy-thunder-a50z1hml.ap-southeast-1.aws.neon.tech
                    </code>
                  </div>

                  <div className="glass-card" style={{ padding: "14px", background: "rgba(255,255,255,0.40)" }}>
                    <p style={{ fontSize: "11px", color: "#64748b", fontWeight: 600, textTransform: "uppercase", margin: "0 0 4px" }}>
                      Connection Parameters
                    </p>
                    <div style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "12px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span style={{ color: "#64748b" }}>SSL Mode</span>
                        <span style={{ fontWeight: 600, color: "#16a34a" }}>require (Enforced)</span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span style={{ color: "#64748b" }}>Driver</span>
                        <span style={{ fontWeight: 600, color: "#334155" }}>SQLAlchemy / psycopg2</span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span style={{ color: "#64748b" }}>Pool Size</span>
                        <span style={{ fontWeight: 600, color: "#334155" }}>5 connections (max 20)</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {/* Status Indicator Card */}
                  <div style={{
                    padding: "16px",
                    borderRadius: "8px",
                    background: dbStatus === "connected" ? "rgba(240, 253, 244, 0.7)" : "rgba(254, 242, 242, 0.7)",
                    border: dbStatus === "connected" ? "1px solid rgba(74, 222, 128, 0.40)" : "1px solid rgba(248, 113, 113, 0.40)",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    textAlign: "center",
                    minHeight: "140px"
                  }}>
                    <Server size={32} color={dbStatus === "connected" ? "#16a34a" : "#dc2626"} style={{ marginBottom: "10px" }} />
                    <p style={{ fontSize: "14px", fontWeight: 700, color: "#0f172a", margin: "0 0 2px" }}>
                      Neon DB: {dbStatus === "connected" ? "Connected" : "Offline"}
                    </p>
                    {latency && (
                      <p style={{ fontSize: "11px", color: "#64748b", margin: 0 }}>
                        Response Time: <span style={{ fontWeight: 700, color: "#2563eb" }}>{latency}ms</span>
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab 3: Theme Customization */}
          {activeTab === "theme" && (
            <div>
              <h2 style={{ fontSize: "16px", fontWeight: 700, margin: "0 0 4px", color: "#0f172a" }}>Theme Customization</h2>
              <p style={{ fontSize: "12.5px", color: "#64748b", margin: "0 0 20px" }}>
                Adjust display parameters and spatial padding preferences for enterprise density alignment.
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                {/* Density Selector */}
                <div>
                  <label className="glass-label" style={{ fontSize: "12px", color: "#334155" }}>Interface Density</label>
                  <div style={{ display: "flex", gap: "10px", marginTop: "6px" }}>
                    {[
                      { id: "compact", title: "Compact Zoho Canvas", desc: "Maximum information density, small text & padding." },
                      { id: "comfortable", title: "Comfortable Glassmorphic", desc: "Extended card margins & standard element line-heights." }
                    ].map((d) => (
                      <button
                        key={d.id}
                        onClick={() => setDensity(d.id)}
                        style={{
                          flex: 1,
                          padding: "14px",
                          borderRadius: "8px",
                          border: density === d.id ? "2px solid #3b82f6" : "1px solid rgba(226, 232, 240, 0.60)",
                          background: density === d.id ? "rgba(239, 246, 255, 0.60)" : "rgba(255,255,255,0.40)",
                          textAlign: "left",
                          cursor: "pointer",
                          transition: "all 0.15s ease",
                        }}
                      >
                        <p style={{ fontSize: "13px", fontWeight: 700, color: "#0f172a", margin: "0 0 2px" }}>{d.title}</p>
                        <p style={{ fontSize: "11px", color: "#64748b", margin: 0 }}>{d.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Border Muted Options */}
                <div>
                  <label className="glass-label" style={{ fontSize: "12px", color: "#334155" }}>Core UI Glass Borders</label>
                  <div style={{ display: "flex", gap: "10px", marginTop: "6px" }}>
                    {[
                      { id: "muted", label: "Muted Slate Border", css: "border-slate-200/60" },
                      { id: "transparent", label: "Ultra-thin Frosted", css: "border-white/30" }
                    ].map((b) => (
                      <button
                        key={b.id}
                        onClick={() => setBorderStyle(b.id)}
                        style={{
                          padding: "8px 16px",
                          borderRadius: "6px",
                          border: borderStyle === b.id ? "1px solid #3b82f6" : "1px solid rgba(226, 232, 240, 0.60)",
                          background: borderStyle === b.id ? "#3b82f6" : "transparent",
                          color: borderStyle === b.id ? "#ffffff" : "#334155",
                          cursor: "pointer",
                          fontSize: "12px",
                          fontWeight: 600,
                        }}
                      >
                        {b.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Info Note */}
                <div style={{
                  display: "flex",
                  gap: "10px",
                  padding: "12px",
                  borderRadius: "6px",
                  background: "rgba(239, 246, 255, 0.50)",
                  border: "1px solid rgba(191, 219, 254, 0.50)",
                  fontSize: "11.5px",
                  color: "#1d4ed8"
                }}>
                  <Info size={14} style={{ flexShrink: 0, marginTop: "2px" }} />
                  <div>
                    <span style={{ fontWeight: 700 }}>Note:</span> All styling options are handled in accordance with Phase 1 guidelines, locking the base palette to the clean light gray canvas (#F8FAFC).
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

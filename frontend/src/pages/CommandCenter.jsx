import { useState, useEffect, useCallback, Suspense, lazy } from "react";
import { useNavigate } from "react-router-dom";
import {
  Crown, TrendingUp, Users, Megaphone, Bell, Zap,
  ArrowRight, BarChart3, Target, Activity, Sparkles,
  ChevronRight, AlertTriangle, CheckCircle2, Clock,
  ArrowUpRight, Play, Plus, UserPlus, Calendar,
} from "lucide-react";
import { getStats, getCampaigns } from "../services/api";
import PlasmaGlobe from "../components/PlasmaGlobe";
import { useAuth } from "../context/AuthContext";

/* ═══════════════════════════════════════════════════════════
   CIRCULAR GAUGE COMPONENT
   ═══════════════════════════════════════════════════════════ */
function CircleGauge({ value, max = 100, label, sublabel, color, size = 96 }) {
  const [displayed, setDisplayed] = useState(0);
  const radius = (size - 16) / 2;
  const circ   = 2 * Math.PI * radius;
  const pct    = Math.min(displayed / max, 1);
  const offset = circ * (1 - pct);

  useEffect(() => {
    const start = Date.now();
    const duration = 1200;
    const raf = () => {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayed(Math.round(value * eased));
      if (progress < 1) requestAnimationFrame(raf);
    };
    const id = requestAnimationFrame(raf);
    return () => cancelAnimationFrame(id);
  }, [value]);

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
      <div style={{ position: "relative", width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
          {/* Track */}
          <circle
            cx={size / 2} cy={size / 2} r={radius}
            fill="none" stroke="rgba(226,232,255,0.55)" strokeWidth="8"
          />
          {/* Fill */}
          <circle
            cx={size / 2} cy={size / 2} r={radius}
            fill="none" stroke={color} strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circ}
            strokeDashoffset={offset}
            style={{ transition: "stroke-dashoffset 0.05s linear", filter: `drop-shadow(0 0 6px ${color}60)` }}
          />
        </svg>
        <div style={{
          position: "absolute", inset: 0,
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
        }}>
          <span style={{ fontFamily: "var(--font-display)", fontSize: "18px", fontWeight: 800, color: "var(--color-text-primary)", lineHeight: 1 }}>
            {displayed}{typeof max === "number" && max !== 100 ? "" : "%"}
          </span>
        </div>
      </div>
      <div style={{ textAlign: "center" }}>
        <p style={{ fontSize: "12px", fontWeight: 700, color: "var(--color-text-primary)", margin: "0 0 1px" }}>{label}</p>
        <p style={{ fontSize: "10px", color: "var(--color-text-muted)", margin: 0 }}>{sublabel}</p>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   KPI QUICK CHIP
   ═══════════════════════════════════════════════════════════ */
function QuickChip({ icon: Icon, label, value, color, bg, trend }) {
  return (
    <div className="glass-card" style={{
      padding: "14px 16px",
      display: "flex", alignItems: "center", gap: "12px",
      transition: "all 0.2s ease",
      cursor: "default",
    }}
      onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 12px 32px rgba(99,102,241,0.14)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "var(--glass-shadow)"; }}
    >
      <div style={{
        width: 40, height: 40, borderRadius: "11px",
        background: bg, display: "flex", alignItems: "center", justifyContent: "center",
        flexShrink: 0,
      }}>
        <Icon size={18} color={color} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: "10.5px", color: "#8891a8", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 2px" }}>
          {label}
        </p>
        <p style={{ fontFamily: "var(--font-display)", fontSize: "19px", fontWeight: 800, color: "#1a1d2e", margin: 0, letterSpacing: "-0.02em" }}>
          {value ?? "—"}
        </p>
      </div>
      {trend !== undefined && (
        <span style={{
          fontSize: "10.5px", fontWeight: 700, color: trend >= 0 ? "#10b981" : "#ef4444",
          display: "flex", alignItems: "center", gap: "2px",
        }}>
          <ArrowUpRight size={11} style={{ transform: trend < 0 ? "rotate(90deg)" : "none" }} />
          {Math.abs(trend)}%
        </span>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   CAMPAIGN TICKER
   ═══════════════════════════════════════════════════════════ */
function CampaignTicker({ campaigns }) {
  const MOCK = [
    { name: "Summer Blitz 2025", status: "Launched", reach: "1,247" },
    { name: "Re-engagement Wave", status: "Active",   reach: "892"   },
    { name: "VIP Loyalty Drive",  status: "Launched", status_color: "success", reach: "342"   },
    { name: "Churn Prevention Q3", status: "Draft",   reach: "2,104"  },
    { name: "Festive Season Push", status: "Launched", reach: "4,512" },
    { name: "New User Onboarding", status: "Active",  reach: "678"   },
  ];
  const items = campaigns?.length > 0 ? [...campaigns.slice(0, 6), ...campaigns.slice(0, 6)] : [...MOCK, ...MOCK];

  const STATUS_COLORS = {
    Launched: { bg: "rgba(220,252,231,0.80)", text: "#15803d" },
    Active:   { bg: "rgba(238,242,255,0.80)", text: "#4338ca" },
    Draft:    { bg: "rgba(241,242,248,0.80)", text: "#4b5168" },
    launched: { bg: "rgba(220,252,231,0.80)", text: "#15803d" },
    active:   { bg: "rgba(238,242,255,0.80)", text: "#4338ca" },
    draft:    { bg: "rgba(241,242,248,0.80)", text: "#4b5168" },
  };

  return (
    <div style={{
      overflow: "hidden",
      padding: "10px 0",
    }}>
      <div className="ticker-track" style={{ display: "flex", gap: "12px", alignItems: "center" }}>
        {items.map((c, i) => {
          const label = c.name || c.segment_conditions || "Campaign";
          const status = c.launched ? "Launched" : (c.status || "Draft");
          const cfg = STATUS_COLORS[status] || STATUS_COLORS.Draft;
          return (
            <div key={i} style={{
              display: "flex", alignItems: "center", gap: "8px",
              padding: "6px 14px",
              borderRadius: "99px",
              background: "rgba(255,255,255,0.70)",
              backdropFilter: "blur(8px)",
              border: "1px solid rgba(196,196,255,0.40)",
              whiteSpace: "nowrap",
              flexShrink: 0,
            }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: status === "Launched" ? "#10b981" : "#6366f1", flexShrink: 0 }} />
              <span style={{ fontSize: "12px", fontWeight: 600, color: "#1a1d2e" }}>{label}</span>
              <span style={{ fontSize: "10px", fontWeight: 700, padding: "1px 6px", borderRadius: "99px", background: cfg.bg, color: cfg.text }}>
                {status}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   ALERT CARD
   ═══════════════════════════════════════════════════════════ */
function AlertCard({ icon: Icon, message, type, time, action, onAction }) {
  const TYPES = {
    warning: { iconBg: "rgba(254,243,199,0.80)", iconColor: "#f59e0b", dot: "#f59e0b", border: "rgba(253,224,71,0.35)" },
    success: { iconBg: "rgba(220,252,231,0.80)", iconColor: "#10b981", dot: "#10b981", border: "rgba(134,239,172,0.35)" },
    info:    { iconBg: "rgba(239,246,255,0.80)", iconColor: "#2563eb", dot: "#2563eb", border: "rgba(191,219,254,0.45)" },
    ai:      { iconBg: "rgba(239,246,255,0.80)", iconColor: "#3b82f6", dot: "#3b82f6", border: "rgba(191,219,254,0.45)" },
  };
  const cfg = TYPES[type] || TYPES.info;

  return (
    <div style={{
      display: "flex", alignItems: "flex-start", gap: "12px",
      padding: "12px 14px",
      borderRadius: "10px",
      background: "rgba(255,255,255,0.65)",
      backdropFilter: "blur(10px)",
      border: `1px solid ${cfg.border}`,
      marginBottom: "8px",
      transition: "all 0.15s ease",
    }}
      onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.85)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.65)"; }}
    >
      <div style={{
        width: 34, height: 34, borderRadius: "9px",
        background: cfg.iconBg, display: "flex",
        alignItems: "center", justifyContent: "center",
        flexShrink: 0,
      }}>
        <Icon size={15} color={cfg.iconColor} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: "12.5px", color: "#0f172a", margin: "0 0 2px", lineHeight: 1.4, fontWeight: 500 }}>{message}</p>
        <p style={{ fontSize: "10.5px", color: "#64748b", margin: 0 }}>{time}</p>
      </div>
      {action && (
        <button 
          onClick={onAction}
          style={{
            border: "none", background: "none", cursor: "pointer",
            color: "#2563eb", fontSize: "11px", fontWeight: 600,
            flexShrink: 0, padding: "2px 6px",
            borderRadius: "5px",
            transition: "all 0.12s ease",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(239,246,255,0.70)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "none"; }}
        >
          {action} →
        </button>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   MAIN COMMAND CENTER PAGE
   ═══════════════════════════════════════════════════════════ */
export default function CommandCenter() {
  const navigate = useNavigate();
  const [stats,     setStats]     = useState(null);
  const [campaigns, setCampaigns] = useState([]);
  const [loading,   setLoading]   = useState(true);

  const { user } = useAuth();

  const firstName = user?.name?.split(" ")[0] || user?.email?.split("@")[0] || "there";
  const fullName  = user?.name || user?.email?.split("@")[0] || "User";

  const now    = new Date();
  const hour   = now.getHours();
  const greeting =
    hour < 12 ? "Good morning" :
    hour < 17 ? "Good afternoon" : "Good evening";

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [statsRes, campRes] = await Promise.all([
          getStats().catch(() => ({ data: null })),
          getCampaigns({ limit: 12 }).catch(() => ({ data: [] })),
        ]);
        setStats(statsRes.data);
        setCampaigns(Array.isArray(campRes.data) ? campRes.data : []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const fmt   = (n) => n != null ? Number(n).toLocaleString("en-IN") : "—";
  const fmtRs = (n) => n != null ? `₹${Number(n).toLocaleString("en-IN")}` : "—";

  const launched  = campaigns.filter(c => c.launched).length;
  const convRate  = loading ? 0 : Math.min(Math.round((launched / Math.max(campaigns.length, 1)) * 100), 100) || 74;
  const engRate   = loading ? 0 : 68;
  const revTarget = loading ? 0 : 82;

  const ALERTS = [
    { icon: AlertTriangle, message: "3 campaigns have low open rates. Review targeting.", type: "warning", time: "10 min ago", action: "View", path: "/campaigns" },
    { icon: CheckCircle2,  message: `${fmt(stats?.total_customers)} customers synced from backend.`, type: "success", time: "just now", action: null },
    { icon: Sparkles,      message: "Prism AI indexed 2,363 document chunks — knowledge base ready.", type: "ai", time: "2 hours ago", action: "Open Prism", path: "/segment-ai" },
    { icon: Activity,      message: "Revenue exceeding target by 14% this quarter.", type: "info", time: "1 hour ago", action: null },
  ];

  const QUICK_ACTIONS = [
    { label: "New Campaign",    icon: Megaphone, color: "#2563eb", bg: "#2563eb", path: "/campaigns" },
    { label: "Add Customer",    icon: UserPlus,  color: "#10b981", bg: "#10b981", path: "/customers" },
    { label: "View Analytics",  icon: BarChart3, color: "#f59e0b", bg: "#f59e0b", path: "/dashboard" },
    { label: "Festival Calendar",icon: Calendar,  color: "#8b5cf6", bg: "#8b5cf6", path: "/calendar" },
    { label: "Prism AI",        icon: Sparkles,  color: "#06b6d4", bg: "#06b6d4", path: "/segment-ai" },
  ];

  return (
    <div style={{ animation: "crmFadeIn 0.35s ease" }}>

      {/* ── Hero Greeting Banner ──────────────────────── */}
      <div style={{
        position: "relative",
        borderRadius: "12px",
        padding: "24px 28px",
        marginBottom: "20px",
        background: "rgba(255, 255, 255, 0.60)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        border: "1px solid rgba(255, 255, 255, 0.40)",
        boxShadow: "0 4px 12px rgba(15, 23, 42, 0.03)",
        overflow: "hidden",
      }}>
        {/* Decorative subtle circles */}
        <div style={{
          position: "absolute", width: 180, height: 180, borderRadius: "50%",
          background: "rgba(59,130,246,0.03)", top: -60, right: 100,
          animation: "floatSlow 8s ease-in-out infinite",
        }} />
        <div style={{
          position: "absolute", width: 120, height: 120, borderRadius: "50%",
          background: "rgba(16,185,129,0.02)", bottom: -40, right: 40,
        }} />

        <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
              <div style={{
                width: 32, height: 32, borderRadius: "8px",
                background: "rgba(59, 130, 246, 0.10)",
                display: "flex", alignItems: "center", justifyContent: "center",
                backdropFilter: "blur(10px)",
              }}>
                <Crown size={16} color="#3b82f6" />
              </div>
              <span style={{
                fontSize: "10px", fontWeight: 700, letterSpacing: "0.08em",
                textTransform: "uppercase", color: "#64748b",
              }}>
                Command Center
              </span>
            </div>
            <h1 style={{
              fontFamily: "var(--font-display)",
              fontSize: "24px",
              fontWeight: 800,
              color: "#0f172a",
              margin: "0 0 6px",
              letterSpacing: "-0.02em",
            }}>
              {greeting}, {firstName} 👋
            </h1>
            <p style={{ fontSize: "13px", color: "#475569", margin: "0 0 16px" }}>
              Here's your business snapshot for{" "}
              <strong style={{ color: "#0f172a" }}>
                {now.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
              </strong>
            </p>
            <div style={{ display: "flex", gap: "10px" }}>
              <button
                onClick={() => navigate("/dashboard")}
                style={{
                  display: "flex", alignItems: "center", gap: "6px",
                  padding: "8px 16px",
                  borderRadius: "6px",
                  background: "rgba(255, 255, 255, 0.80)",
                  backdropFilter: "blur(10px)",
                  border: "1px solid rgba(59, 130, 246, 0.30)",
                  color: "#1d4ed8", fontSize: "12.5px", fontWeight: 600,
                  cursor: "pointer", transition: "all 0.15s ease",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(239, 246, 255, 0.90)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255, 255, 255, 0.80)"; }}
              >
                <BarChart3 size={13} /> View Full Analytics
              </button>
              <button
                onClick={() => navigate("/campaigns")}
                style={{
                  display: "flex", alignItems: "center", gap: "6px",
                  padding: "8px 16px", borderRadius: "6px",
                  background: "#3b82f6", color: "#ffffff",
                  border: "none", fontSize: "12.5px", fontWeight: 600,
                  cursor: "pointer", transition: "all 0.15s ease",
                  boxShadow: "0 2px 4px rgba(37, 99, 235, 0.15)",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "#2563eb"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "#3b82f6"; }}
              >
                <Plus size={13} /> New Campaign
              </button>
            </div>
          </div>

          {/* Right: 3D Plasma Globe */}
          <div style={{
            width: "320px",
            height: "220px",
            background: "rgba(15,23,42,0.06)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            border: "1px solid rgba(255,255,255,0.30)",
            borderRadius: "16px",
            overflow: "hidden",
            flexShrink: 0,
            position: "relative",
          }}>
            <div style={{
              position: "absolute", top: 8, left: 12,
              fontSize: "9px", fontWeight: 700,
              textTransform: "uppercase", letterSpacing: "0.08em",
              color: "rgba(255,255,255,0.60)",
              zIndex: 2,
            }}>Global Expansion</div>
            <Suspense fallback={
              <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <div style={{ width: 32, height: 32, borderRadius: "50%", border: "2px solid #f9a8d4", borderTop: "2px solid transparent", animation: "spin 0.8s linear infinite" }} />
              </div>
            }>
              <PlasmaGlobe height="220px" />
            </Suspense>
          </div>
        </div>
      </div>

      {/* ── KPI Quick Chips ───────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "14px", marginBottom: "20px" }}>
        <QuickChip
          icon={Users} label="Total Customers"
          value={loading ? "…" : fmt(stats?.total_customers)}
          color="#6366f1" bg="rgba(238,242,255,0.80)" trend={4.2}
        />
        <QuickChip
          icon={Megaphone} label="Active Campaigns"
          value={loading ? "…" : launched || campaigns.length}
          color="#10b981" bg="rgba(220,252,231,0.80)" trend={11.2}
        />
        <QuickChip
          icon={TrendingUp} label="Gross Revenue"
          value={loading ? "…" : fmtRs(stats?.total_revenue)}
          color="#f59e0b" bg="rgba(254,243,199,0.80)" trend={8.3}
        />
        <QuickChip
          icon={Activity} label="Avg. Order Value"
          value={loading ? "…" : fmtRs(Math.round(stats?.average_order_value || 0))}
          color="#8b5cf6" bg="rgba(245,243,255,0.80)" trend={-1.2}
        />
      </div>

      {/* ── Campaign Ticker ───────────────────────────── */}
      <div className="glass-card" style={{ marginBottom: "20px", padding: "14px 16px", overflow: "hidden" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
          <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#10b981", animation: "ping 1.5s ease-out infinite" }} />
          <p style={{ fontSize: "11px", fontWeight: 700, color: "#8891a8", textTransform: "uppercase", letterSpacing: "0.07em", margin: 0 }}>
            Live Campaign Feed
          </p>
        </div>
        <CampaignTicker campaigns={campaigns} />
      </div>

      {/* ── 3-Column: Alerts + Actions + Mini-Chart ───── */}
      <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr 1fr", gap: "14px" }}>

        {/* Alerts panel */}
        <div className="glass-card" style={{ padding: "16px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "7px" }}>
              <Bell size={14} color="#6366f1" />
              <p style={{ fontSize: "13px", fontWeight: 700, color: "#1a1d2e", margin: 0 }}>Critical Alerts</p>
            </div>
            <span className="glass-badge glass-badge-info">{ALERTS.length} new</span>
          </div>
          {ALERTS.map((a, i) => (
            <AlertCard
              key={i} icon={a.icon} message={a.message}
              type={a.type} time={a.time} action={a.action}
              onAction={() => {
                if (a.path) navigate(a.path);
              }}
            />
          ))}
        </div>

        {/* Quick Actions */}
        <div className="glass-card" style={{ padding: "16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "7px", marginBottom: "14px" }}>
            <Zap size={14} color="#f59e0b" />
            <p style={{ fontSize: "13px", fontWeight: 700, color: "#1a1d2e", margin: 0 }}>Quick Actions</p>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {QUICK_ACTIONS.map((qa) => {
              const Icon = qa.icon;
              return (
                <button
                  key={qa.label}
                  onClick={() => navigate(qa.path)}
                  style={{
                    display: "flex", alignItems: "center", gap: "12px",
                    padding: "12px 14px",
                    borderRadius: "10px",
                    background: "rgba(255,255,255,0.65)",
                    backdropFilter: "blur(8px)",
                    border: "1px solid rgba(196,196,255,0.35)",
                    cursor: "pointer", transition: "all 0.18s ease",
                    textAlign: "left", width: "100%",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateX(4px)";
                    e.currentTarget.style.background = "rgba(238,242,255,0.80)";
                    e.currentTarget.style.borderColor = "rgba(165,180,252,0.50)";
                    e.currentTarget.style.boxShadow = "0 4px 16px rgba(99,102,241,0.12)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateX(0)";
                    e.currentTarget.style.background = "rgba(255,255,255,0.65)";
                    e.currentTarget.style.borderColor = "rgba(196,196,255,0.35)";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                >
                  <div style={{
                    width: 36, height: 36, borderRadius: "9px",
                    background: qa.bg,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    flexShrink: 0, boxShadow: `0 4px 10px ${qa.color}40`,
                  }}>
                    <Icon size={16} color="white" />
                  </div>
                  <span style={{ fontSize: "13px", fontWeight: 600, color: "#1a1d2e", flex: 1 }}>
                    {qa.label}
                  </span>
                  <ChevronRight size={14} color="#8891a8" />
                </button>
              );
            })}
          </div>
        </div>

        {/* Daily performance panel */}
        <div className="glass-card" style={{ padding: "16px", display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "7px", marginBottom: "14px" }}>
            <Target size={14} color="#10b981" />
            <p style={{ fontSize: "13px", fontWeight: 700, color: "#1a1d2e", margin: 0 }}>Daily Snapshot</p>
          </div>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "10px" }}>
            {[
              { label: "Emails Sent",     value: 1247, max: 2000, color: "#6366f1" },
              { label: "SMS Delivered",   value: 892,  max: 1200, color: "#10b981" },
              { label: "WhatsApp Reads",  value: 634,  max: 900,  color: "#f59e0b" },
              { label: "New Signups",     value: 48,   max: 100,  color: "#8b5cf6" },
              { label: "Orders Today",    value: 312,  max: 500,  color: "#06b6d4" },
            ].map((item) => (
              <div key={item.label}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                  <span style={{ fontSize: "11.5px", color: "#4b5168", fontWeight: 500 }}>{item.label}</span>
                  <span style={{ fontSize: "11.5px", fontWeight: 700, color: item.color }}>
                    {item.value.toLocaleString("en-IN")}
                  </span>
                </div>
                <div style={{ height: 5, borderRadius: "99px", background: "rgba(226,232,255,0.55)", overflow: "hidden" }}>
                  <div style={{
                    height: "100%", borderRadius: "99px",
                    background: item.color,
                    width: `${Math.round((item.value / item.max) * 100)}%`,
                    transition: "width 1s cubic-bezier(0.16, 1, 0.3, 1)",
                    boxShadow: `0 0 8px ${item.color}60`,
                  }} />
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={() => navigate("/dashboard")}
            className="glass-btn-secondary"
            style={{ marginTop: "16px", justifyContent: "center", fontSize: "12px" }}
          >
            Full Analytics <ArrowRight size={12} />
          </button>
        </div>

      </div>
    </div>
  );
}

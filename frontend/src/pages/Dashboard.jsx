import { useEffect, useState, useCallback } from "react";
import { Users, ShoppingCart, IndianRupee, TrendingUp, RefreshCw } from "lucide-react";

import { getStats, getCityDistribution, getRevenueByCity } from "../services/api";

import SciFiGlobe from "../components/SciFiGlobe";
import IndiaTopoMap from "../components/IndiaTopoMap";
import EmptyState from "../components/EmptyState";

/* ── Circle Gauge Component ────────────────────────────── */
function CircleGauge({ value, max = 100, label, sublabel, color, size = 80 }) {
  const isDark = document.documentElement.classList.contains("dark");
  const [displayed, setDisplayed] = useState(0);
  const radius = (size - 12) / 2;
  const circ   = 2 * Math.PI * radius;
  const pct    = Math.min(displayed / max, 1);
  const offset = circ * (1 - pct);

  useEffect(() => {
    let start = Date.now();
    const duration = 1000;
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
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" }}>
      <div style={{ position: "relative", width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
          <circle
            cx={size / 2} cy={size / 2} r={radius}
            fill="none"
            stroke={isDark ? "rgba(148, 163, 184, 0.24)" : "rgba(226, 232, 240, 0.40)"}
            strokeWidth="6"
          />
          <circle
            cx={size / 2} cy={size / 2} r={radius}
            fill="none" stroke={color} strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={circ}
            strokeDashoffset={offset}
            style={{ transition: "stroke-dashoffset 0.05s linear" }}
          />
        </svg>
        <div style={{
          position: "absolute", inset: 0,
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
        }}>
          <span style={{ fontFamily: "var(--font-display)", fontSize: "14.5px", fontWeight: 800, color: "var(--color-text-primary)" }}>
            {displayed}%
          </span>
        </div>
      </div>
      <div style={{ textAlign: "center" }}>
        <p style={{ fontSize: "11px", fontWeight: 700, color: "var(--color-text-primary)", margin: 0 }}>{label}</p>
        <p style={{ fontSize: "9.5px", color: "var(--color-text-muted)", margin: 0 }}>{sublabel}</p>
      </div>
    </div>
  );
}



/* ── Lead Conversion Funnel ────────────────────────────── */
function LeadFunnel({ stats }) {
  const isDark = document.documentElement.classList.contains("dark");
  const total = stats?.total_customers || 0;
  const activeBuyers = stats?.total_orders || 0;
  const prospects = Math.max(total - activeBuyers, Math.round(total * 0.55));
  const highValue = Math.round(total * 0.16);
  const STAGES = [
    { label: "Total Leads",   value: total,                   pct: total ? 100 : 0, color: "#3b82f6" },
    { label: "Prospects",     value: prospects,              pct: total ? Math.round((prospects / total) * 100) : 0, color: "#0ea5e9" },
    { label: "Active Buyers", value: activeBuyers,           pct: total ? Math.round((activeBuyers / total) * 100) : 0, color: "#10b981" },
    { label: "High Value",    value: highValue,              pct: total ? Math.round((highValue / total) * 100) : 0, color: "#2563eb" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
      {STAGES.map((s) => (
        <div key={s.label} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "3px" }}>
              <span style={{ fontSize: "11.5px", fontWeight: 600, color: "var(--color-text-secondary)" }}>{s.label}</span>
              <span style={{ fontSize: "11.5px", fontWeight: 700, color: s.color }}>
                {s.value.toLocaleString("en-IN")}
              </span>
            </div>
            <div style={{ height: 5, borderRadius: "99px", background: isDark ? "rgba(71, 85, 105, 0.24)" : "rgba(226,232,255,0.40)", overflow: "hidden" }}>
              <div style={{
                width: `${s.pct}%`, height: "100%", borderRadius: "99px",
                background: s.color,
                transition: "width 1s cubic-bezier(0.16, 1, 0.3, 1)",
              }} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── Channel Performance Widget ────────────────────────── */
function CommunicationSummary({ stats }) {
  const isDark = document.documentElement.classList.contains("dark");
  const deliveredRate = stats.total ? Math.round(((stats.delivered || 0) / stats.total) * 100) : 0;
  const clickedRate   = stats.total ? Math.round(((stats.clicked   || 0) / stats.total) * 100) : 0;
  const failedRate    = stats.total ? Math.round(((stats.failed    || 0) / stats.total) * 100) : 0;
  const successRate   = stats.total ? Math.round((((stats.delivered || 0) + (stats.clicked || 0)) / stats.total) * 100) : 0;

  const rows = [
    { label: "Sent",      value: stats.sent      || 0, color: "#0ea5e9", rate: `${stats.total ? Math.round(((stats.sent||0)/stats.total)*100) : 0}%` },
    { label: "Delivered", value: stats.delivered || 0, color: "#10b981", rate: `${deliveredRate}%` },
    { label: "Clicked",   value: stats.clicked   || 0, color: "#6366f1", rate: `${clickedRate}%` },
    { label: "Failed",    value: stats.failed    || 0, color: "#ef4444", rate: `${failedRate}%` },
    { label: "Pending",   value: stats.pending   || 0, color: "#f59e0b", rate: `${stats.total ? Math.round(((stats.pending||0)/stats.total)*100) : 0}%` },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: "140px", padding: "14px", borderRadius: "16px", background: isDark ? "rgba(15,23,42,0.85)" : "rgba(255,255,255,0.85)", border: isDark ? "1px solid rgba(71,85,105,0.48)" : "1px solid rgba(226,232,240,0.72)" }}>
          <p style={{ margin: 0, fontSize: "12px", color: "var(--color-text-muted)", fontWeight: 700 }}>Total Messages</p>
          <p style={{ margin: "8px 0 0", fontSize: "28px", fontWeight: 800, color: "var(--color-text-primary)" }}>{(stats.total || 0).toLocaleString("en-IN")}</p>
        </div>
        <div style={{ flex: 1, minWidth: "140px", padding: "14px", borderRadius: "16px", background: isDark ? "rgba(15,23,42,0.85)" : "rgba(255,255,255,0.85)", border: isDark ? "1px solid rgba(71,85,105,0.48)" : "1px solid rgba(226,232,240,0.72)" }}>
          <p style={{ margin: 0, fontSize: "12px", color: "var(--color-text-muted)", fontWeight: 700 }}>Delivery Success</p>
          <p style={{ margin: "8px 0 0", fontSize: "28px", fontWeight: 800, color: "#10b981" }}>{successRate}%</p>
        </div>
      </div>
      <div style={{ display: "grid", gap: "8px" }}>
        {rows.map((item) => (
          <div key={item.label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", borderRadius: "10px", background: isDark ? "rgba(15,23,42,0.72)" : "rgba(247,250,255,0.82)", border: isDark ? "1px solid rgba(71,85,105,0.40)" : "1px solid rgba(226,232,240,0.68)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: item.color, flexShrink: 0 }} />
              <p style={{ margin: 0, fontSize: "11px", color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}>{item.label}</p>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <p style={{ margin: 0, fontSize: "15px", fontWeight: 800, color: item.color }}>{item.value.toLocaleString("en-IN")}</p>
              <span style={{ fontSize: "10px", fontWeight: 700, color: "var(--color-text-secondary)", background: `${item.color}15`, padding: "1px 6px", borderRadius: "99px" }}>{item.rate}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}


/* ── Glass Panel Wrapper ───────────────────────────────── */
function GlassPanel({ title, subtitle, children, widthStyle = "1fr" }) {
  return (
    <div className="glass-card" style={{ padding: "16px", display: "flex", flexDirection: "column" }}>
      <div style={{ marginBottom: "14px" }}>
        <p style={{ fontSize: "13px", fontWeight: 700, color: "var(--color-text-primary)", margin: 0 }}>{title}</p>
        {subtitle && <p style={{ fontSize: "10.5px", color: "var(--color-text-muted)", margin: 0 }}>{subtitle}</p>}
      </div>
      <div style={{ flex: 1 }}>{children}</div>
    </div>
  );
}

/* ── Glass KPI Card ────────────────────────────────────── */
function KPICard({ title, value, subtitle, icon: Icon, color, trend }) {
  return (
    <div className="glass-card" style={{
      padding: "14px 16px",
      transition: "all 0.2s ease",
      cursor: "default",
      position: "relative",
    }}
      onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "var(--glass-shadow-lg)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = ""; }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "8px" }}>
        <div style={{
          width: "32px", height: "32px", borderRadius: "8px",
          background: `${color}18`,
          border: `1px solid ${color}30`,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <Icon size={15} color={color} />
        </div>
        {trend !== undefined && (
          <span style={{
            fontSize: "10.5px", fontWeight: 700, color: trend >= 0 ? "#10b981" : "#ef4444",
            padding: "2px 7px", borderRadius: "99px",
            background: trend >= 0 ? "rgba(220,252,231,0.70)" : "rgba(254,226,226,0.70)",
          }}>
            {trend >= 0 ? "+" : ""}{trend}%
          </span>
        )}
      </div>
      <p style={{ fontSize: "10.5px", fontWeight: 600, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.04em", margin: "0 0 4px" }}>
        {title}
      </p>
      <p style={{ fontFamily: "var(--font-display)", fontSize: "22px", fontWeight: 800, color: "var(--color-text-primary)", margin: 0, letterSpacing: "-0.01em" }}>
        {value}
      </p>
    </div>
  );
}

/* ── Skeleton Loader ───────────────────────────────────── */
function Skeleton({ h = 20, w = "60%" }) {
  const isDark = document.documentElement.classList.contains("dark");
  return (
    <div style={{
      height: h, width: w, borderRadius: "4px",
      background: isDark
        ? "linear-gradient(90deg, rgba(30,41,59,0.32) 25%, rgba(51,65,85,0.32) 50%, rgba(30,41,59,0.32) 75%)"
        : "linear-gradient(90deg, rgba(241,245,249,0.6) 25%, rgba(226,232,240,0.6) 50%, rgba(241,245,249,0.6) 75%)",
      backgroundSize: "200% 100%",
      animation: "shimmer 1.5s infinite",
    }} />
  );
}

/* ════════════════════════════════════════════════════════
   MAIN DASHBOARD COMPONENT
   ════════════════════════════════════════════════════════ */
export default function Dashboard() {
  const [stats,      setStats]      = useState(null);
  const [cities,     setCities]     = useState([]);
  const [revenue,    setRevenue]    = useState([]);
  const [commStats,  setCommStats]  = useState({ sent: 0, failed: 0, pending: 0, total: 0 });
  const [loading,    setLoading]    = useState(true);
  const [lastFetched, setLastFetched] = useState(null);
  const [activeTab,  setActiveTab]  = useState("india");

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    try {
      const [statsRes, cityRes, revenueRes] = await Promise.all([
        getStats(),
        getCityDistribution(),
        getRevenueByCity(),
      ]);

      const data = statsRes.data;
      setStats(data);
      setCities((cityRes.data || []).map((item) => ({ ...item, count: item.customers ?? item.count })));
      setRevenue(revenueRes.data || []);

      // Use comm breakdown directly from the stats endpoint (Phase 4 data)
      setCommStats({
        sent:      (data.comm_sent      || 0) + (data.comm_delivered || 0) + (data.comm_clicked || 0),
        delivered: data.comm_delivered  || 0,
        clicked:   data.comm_clicked    || 0,
        failed:    data.comm_failed     || 0,
        pending:   data.comm_pending    || 0,
        total:     data.comm_total      || 0,
      });

      setLastFetched(new Date());
    } catch (err) {
      console.error("Dashboard loading failure:", err);
    } finally {
      setLoading(false);
    }
  }, []);


  useEffect(() => { loadDashboard(); }, [loadDashboard]);

  const fmt   = (n) => n != null ? Number(n).toLocaleString("en-IN") : "—";
  const fmtRs = (n) => n != null ? `₹${Number(n).toLocaleString("en-IN")}` : "—";
  const isDark = document.documentElement.classList.contains("dark");

  return (
    <>
      <style>{`
        @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
      `}</style>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifySpaceBetween: "space-between", justifyContent: "space-between", marginBottom: "20px" }}>
        <div>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: "18px", fontWeight: 800, color: "var(--color-text-primary)", margin: "0 0 2px", letterSpacing: "-0.01em" }}>
            Analytics Overview
          </h1>
          <p style={{ fontSize: "12px", color: "var(--color-text-muted)", margin: 0 }}>
            {lastFetched ? `Last synchronized: ${lastFetched.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}` : "Connecting to FastAPI..."}
          </p>
        </div>
        <button onClick={loadDashboard} disabled={loading} className="glass-btn-secondary" style={{ fontSize: "12px", gap: "6px" }}>
          <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {/* Dashboard Quote Insight */}
      <div style={{ marginBottom: "20px" }}>
        <div className="glass-card" style={{ padding: "20px", display: "grid", gridTemplateColumns: "2.6fr 1fr", gap: "16px", alignItems: "stretch" }}>
          <div>
            <p style={{ fontSize: "12px", fontWeight: 700, textTransform: "uppercase", color: isDark ? "#a5b4fc" : "#6366f1", margin: 0, letterSpacing: "0.14em" }}>
              Executive Insight
            </p>
            <h2 style={{ fontSize: "22px", fontWeight: 800, color: "var(--color-text-primary)", margin: "10px 0 8px", lineHeight: 1.2 }}>
              Regional telemetry should always drive campaign action.
            </h2>
            <p style={{ fontSize: "13px", color: "var(--color-text-muted)", margin: 0, maxWidth: "680px", lineHeight: 1.7 }}>
              "Data without context is just noise. SegmentIQ bridges the gap between regional telemetry and automated campaign output. Your workspace environment is now fully synchronized."
            </p>
            <p style={{ fontSize: "12px", color: "var(--color-text-muted)", fontWeight: 700, margin: "16px 0 0" }}>
              — Rishabh Raj, Founder & Architect
            </p>
          </div>
          <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", gap: "12px" }}>
            <div style={{ padding: "14px", borderRadius: "14px", background: isDark ? "rgba(99,102,241,0.14)" : "rgba(59,130,246,0.08)", border: isDark ? "1px solid rgba(99,102,241,0.20)" : "1px solid rgba(59,130,246,0.14)" }}>
              <p style={{ fontSize: "11px", fontWeight: 700, color: isDark ? "#93c5fd" : "#1e3a8a", margin: 0 }}>Action Focus</p>
              <p style={{ fontSize: "13px", fontWeight: 800, color: "var(--color-text-primary)", margin: "8px 0 0" }}>Make every city a campaign launchpad.</p>
            </div>
            <div style={{ padding: "14px", borderRadius: "14px", background: isDark ? "rgba(16,185,129,0.16)" : "rgba(16,185,129,0.08)", border: isDark ? "1px solid rgba(16,185,129,0.30)" : "1px solid rgba(16,185,129,0.16)" }}>
              <p style={{ fontSize: "11px", fontWeight: 700, color: isDark ? "#6ee7b7" : "#065f46", margin: 0 }}>Telemetry Priority</p>
              <p style={{ fontSize: "13px", fontWeight: 800, color: "var(--color-text-primary)", margin: "8px 0 0" }}>City-level insights first, campaign orchestration next.</p>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "14px", marginBottom: "20px" }}>
        {[
          { title: "Total Customers", value: loading ? <Skeleton h={22} w="60%" /> : fmt(stats?.total_customers), icon: Users, color: "#3b82f6", trend: 4.2 },
          { title: "Total Orders", value: loading ? <Skeleton h={22} w="60%" /> : fmt(stats?.total_orders), icon: ShoppingCart, color: "#0ea5e9", trend: 11.7 },
          { title: "Total Revenue", value: loading ? <Skeleton h={22} w="60%" /> : fmtRs(stats?.total_revenue), icon: IndianRupee, color: "#10b981", trend: 8.3 },
          { title: "Avg. Order Value", value: loading ? <Skeleton h={22} w="60%" /> : fmtRs(Math.round(stats?.average_order_value || 0)), icon: TrendingUp, color: "#2563eb", trend: -1.2 }
        ].map((kpi, idx) => (
          <KPICard key={idx} {...kpi} />
        ))}
      </div>

      {/* Row 1: Sci-Fi Cybernetic Globe & Expansion Nodes */}
      <div style={{ marginBottom: "14px" }}>
        <GlassPanel
          title="Operational Network & Pipeline Expansion"
          subtitle="Toggle between local India telemetry map and global 3D cybernetic network"
        >
          {loading ? (
            <Skeleton h={420} w="100%" />
          ) : (
            <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
              <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
                <button
                  onClick={() => setActiveTab("india")}
                  style={{
                    padding: "6px 14px",
                    borderRadius: "20px",
                    fontSize: "11px",
                    fontWeight: 700,
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    border: "1px solid rgba(99, 102, 241, 0.2)",
                    background: activeTab === "india" ? "linear-gradient(135deg, #6366f1, #4f46e5)" : "rgba(255, 255, 255, 0.4)",
                    color: activeTab === "india" ? "#fff" : "#4b5563",
                  }}
                >
                  🗺️ India Telemetry
                </button>
                <button
                  onClick={() => setActiveTab("global")}
                  style={{
                    padding: "6px 14px",
                    borderRadius: "20px",
                    fontSize: "11px",
                    fontWeight: 700,
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    border: "1px solid rgba(99, 102, 241, 0.2)",
                    background: activeTab === "global"
                      ? "linear-gradient(135deg, #6366f1, #4f46e5)"
                      : isDark
                        ? "rgba(255, 255, 255, 0.10)"
                        : "rgba(255, 255, 255, 0.4)",
                    color: activeTab === "global" ? "#fff" : isDark ? "#cbd5e1" : "#4b5563",
                  }}
                >
                  🪐 Global Network
                </button>
              </div>
              <div style={{ height: "440px", width: "100%", position: "relative" }}>
                {activeTab === "india" ? (
                  <IndiaTopoMap cities={cities} revenue={revenue} />
                ) : (
                  <SciFiGlobe />
                )}
              </div>
            </div>
          )}
        </GlassPanel>
      </div>

      {/* Row 2: Gauges/Funnel + Channel performance or Empty State */}
      {!loading && (!stats || stats.total_customers === 0) ? (
        <EmptyState
          iconName="Database"
          title="No Customer Telemetry Yet"
          description="SegmentIQ is ready to visualize live customer flows. Add your first customer or connect your source to populate the analytics workspace."
          actionText="Add First Customer"
          onAction={() => { window.location.href = "/customers"; }}
        />
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "14px" }}>
          <GlassPanel title="Conversion Metrics & Lifecycle Progression" subtitle="Dynamic lead conversion stages alongside performance gauges">
            <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "20px", alignItems: "center" }}>
              {loading ? <Skeleton h={110} w="100%" /> : <LeadFunnel stats={stats} />}
              
              {/* Frosted Gauges */}
              <div style={{ display: "flex", gap: "16px", justifyContent: "center" }}>
                <CircleGauge value={74} label="Conversion" sublabel="Ratio" color="#3b82f6" />
                <CircleGauge value={68} label="Engagement" sublabel="Score" color="#10b981" />
              </div>
            </div>
          </GlassPanel>

          <GlassPanel title="Communication Throughput" subtitle="Live delivery metrics from active communication logs">
            <CommunicationSummary stats={commStats} />
          </GlassPanel>
        </div>
      )}
    </>
  );
}
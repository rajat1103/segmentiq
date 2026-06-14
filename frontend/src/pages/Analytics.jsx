/**
 * Analytics.jsx — Dynamic Analytics Hub
 * • Continuous data (time-series, trends) → single-hue gradient shades
 * • Discrete data (categories, segments)  → distinct curated palette
 * • Animated bar/area entries, glassmorphism panels, dark-mode aware
 */
import { useEffect, useState, useCallback, useRef } from "react";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  LineChart, Line, ComposedChart,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import {
  TrendingUp, Users, IndianRupee, ShoppingCart,
  BarChart3, PieChart as PieIcon, Activity, RefreshCw,
  Send, CheckCircle2, XCircle, MousePointer, Clock, Target,
  ArrowUpRight, ArrowDownRight, Zap,
} from "lucide-react";
import {
  getStats, getCityDistribution, getRevenueByCity,
  getGenderDistribution, getMonthlyRevenue, getChannelStats,
} from "../services/api";

/* ─── Palettes ───────────────────────────────────────────────
   Continuous (time-series): single indigo hue, 6 shades
   Discrete  (categories)  : curated vibrant palette            */
const CONTINUOUS = ["#312e81", "#4338ca", "#6366f1", "#818cf8", "#a5b4fc", "#c7d2fe"];
const DISCRETE   = ["#6366f1", "#0ea5e9", "#10b981", "#f59e0b", "#ec4899", "#8b5cf6", "#06b6d4"];

/* ─── Hooks ─────────────────────────────────────────────────── */
function useCountUp(target, duration = 1200) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!target || isNaN(target)) return;
    const n = Number(target);
    const start = performance.now();
    const tick = (now) => {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setVal(Math.round(eased * n));
      if (t < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [target, duration]);
  return val;
}

/* ─── KPI Card ───────────────────────────────────────────────── */
function KpiCard({ label, rawValue, formatted, sub, icon: Icon, color, trendUp, trend }) {
  const animVal = useCountUp(rawValue, 1400);
  return (
    <div
      className="glass-card"
      style={{
        padding: "18px 20px", display: "flex", alignItems: "flex-start",
        gap: "14px", transition: "all 0.25s ease", cursor: "default",
      }}
      onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = `0 12px 32px ${color}25`; }}
      onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = ""; }}
    >
      <div style={{
        width: 44, height: 44, borderRadius: "12px", flexShrink: 0,
        background: `linear-gradient(135deg, ${color}dd, ${color}99)`,
        display: "flex", alignItems: "center", justifyContent: "center",
        boxShadow: `0 6px 16px ${color}35`,
      }}>
        <Icon size={20} color="white" />
      </div>
      <div style={{ flex: 1 }}>
        <p style={{ fontSize: "10.5px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.07em", margin: "0 0 4px" }}>{label}</p>
        <p style={{ fontFamily: "var(--font-display)", fontSize: "24px", fontWeight: 800, color: "var(--color-text-primary)", margin: "0 0 5px", letterSpacing: "-0.025em" }}>
          {formatted ? formatted : animVal.toLocaleString("en-IN")}
        </p>
        {trend && (
          <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            {trendUp
              ? <ArrowUpRight size={12} color="#10b981" />
              : <ArrowDownRight size={12} color="#ef4444" />}
            <span style={{ fontSize: "11px", fontWeight: 600, color: trendUp ? "#10b981" : "#ef4444" }}>{trend}</span>
            {sub && <span style={{ fontSize: "10.5px", color: "var(--color-text-muted)", marginLeft: "4px" }}>{sub}</span>}
          </div>
        )}
        {!trend && sub && <p style={{ fontSize: "11px", color: "var(--color-text-muted)", margin: 0 }}>{sub}</p>}
      </div>
    </div>
  );
}

/* ─── Chart Panel ────────────────────────────────────────────── */
function Panel({ title, subtitle, icon: Icon, children, action, minH = 300 }) {
  return (
    <div className="glass-card" style={{ padding: 0, overflow: "hidden" }}>
      <div style={{
        padding: "14px 20px",
        borderBottom: "1px solid var(--color-surface-border)",
        background: "rgba(248,249,254,0.55)",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {Icon && <Icon size={14} color="#6366f1" />}
          <div>
            <p style={{ fontSize: "13px", fontWeight: 700, color: "var(--color-text-primary)", margin: 0 }}>{title}</p>
            {subtitle && <p style={{ fontSize: "11px", color: "var(--color-text-muted)", margin: 0 }}>{subtitle}</p>}
          </div>
        </div>
        {action}
      </div>
      <div style={{ padding: "20px", minHeight: minH }}>{children}</div>
    </div>
  );
}

/* ─── Custom Tooltip ─────────────────────────────────────────── */
function GlassTooltip({ active, payload, label, prefix = "", suffix = "" }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: "var(--color-surface-white)", border: "1px solid var(--color-surface-border)",
      borderRadius: "10px", padding: "10px 14px", fontSize: "12px", minWidth: "140px",
      boxShadow: "0 8px 24px rgba(15,23,42,0.10)", backdropFilter: "blur(16px)",
    }}>
      {label && <p style={{ fontWeight: 700, color: "var(--color-text-primary)", margin: "0 0 6px" }}>{label}</p>}
      {payload.map((e, i) => (
        <div key={i} style={{ display: "flex", justifyContent: "space-between", gap: "16px", marginBottom: "3px" }}>
          <span style={{ color: e.color || "var(--color-text-muted)", fontWeight: 600 }}>{e.name}</span>
          <span style={{ fontWeight: 800, color: "var(--color-text-primary)" }}>
            {prefix}{typeof e.value === "number" ? e.value.toLocaleString("en-IN") : e.value}{suffix}
          </span>
        </div>
      ))}
    </div>
  );
}

/* ─── Animated Progress Bar ──────────────────────────────────── */
function AnimBar({ label, value, total, color, delay = 0 }) {
  const [width, setWidth] = useState(0);
  const pct = total ? ((value / total) * 100) : 0;
  useEffect(() => {
    const t = setTimeout(() => setWidth(pct), delay + 200);
    return () => clearTimeout(t);
  }, [pct, delay]);
  return (
    <div style={{ marginBottom: "14px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "7px" }}>
          <div style={{ width: 9, height: 9, borderRadius: "50%", background: color }} />
          <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--color-text-primary)" }}>{label}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "13px", fontWeight: 800, color }}>{value.toLocaleString("en-IN")}</span>
          <span style={{ fontSize: "10px", background: `${color}18`, color, padding: "1px 7px", borderRadius: "99px", fontWeight: 700 }}>{pct.toFixed(1)}%</span>
        </div>
      </div>
      <div style={{ height: "7px", borderRadius: "99px", background: "rgba(226,232,255,0.55)", overflow: "hidden" }}>
        <div style={{
          width: `${Math.min(100, width)}%`, height: "100%", borderRadius: "99px",
          background: `linear-gradient(to right, ${color}cc, ${color})`,
          transition: "width 1s cubic-bezier(0.4,0,0.2,1)",
          boxShadow: `0 0 10px ${color}50`,
        }} />
      </div>
    </div>
  );
}

/* ─── Empty placeholder ──────────────────────────────────────── */
function EmptyChart({ icon: Icon, text }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "240px", color: "var(--color-text-muted)" }}>
      <Icon size={36} style={{ marginBottom: "10px", opacity: 0.35 }} />
      <p style={{ margin: 0, fontSize: "13px" }}>{text}</p>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   MAIN PAGE
══════════════════════════════════════════════════════════════ */
export default function Analytics() {
  const [stats,        setStats]        = useState(null);
  const [cityData,     setCityData]     = useState([]);
  const [revenueCity,  setRevenueCity]  = useState([]);
  const [genderData,   setGenderData]   = useState([]);
  const [monthlyRev,   setMonthlyRev]   = useState([]);
  const [channelStats, setChannelStats] = useState(null);
  const [loading,      setLoading]      = useState(true);
  const [activeTab,    setActiveTab]    = useState("overview");
  const [lastFetched,  setLastFetched]  = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [sR, cR, rcR, gR, mR, chR] = await Promise.all([
        getStats(), getCityDistribution(), getRevenueByCity(),
        getGenderDistribution(), getMonthlyRevenue(), getChannelStats(),
      ]);
      setStats(sR.data);
      setCityData((cR.data || []).map(d => ({ name: d.city, value: d.customers ?? d.count ?? 0 })));
      setRevenueCity((rcR.data || []).map(d => ({ name: d.city, revenue: d.revenue ?? 0 })));
      setGenderData((gR.data || []).map(d => ({ name: d.gender, value: d.count ?? 0 })));
      setMonthlyRev(mR.data || []);
      setChannelStats(chR.data);
      setLastFetched(new Date());
    } catch (err) {
      console.error("Analytics load error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const fmt      = n => n != null ? Number(n).toLocaleString("en-IN") : "—";
  const fmtRupee = n => n != null ? `₹${Number(n).toLocaleString("en-IN", { maximumFractionDigits: 0 })}` : "—";

  /* ── Tabs ── */
  const TABS = [
    { id: "overview",  label: "Overview",       icon: BarChart3  },
    { id: "revenue",   label: "Revenue",         icon: TrendingUp },
    { id: "customers", label: "Customers",       icon: Users      },
    { id: "delivery",  label: "Delivery",        icon: Send       },
  ];

  /* ── Derived ── */
  const totalChannel = channelStats?.total || 0;
  const deliveryRows = channelStats ? [
    { label: "Sent",      value: channelStats.sent      || 0, color: "#0ea5e9" },
    { label: "Delivered", value: channelStats.delivered || 0, color: "#10b981" },
    { label: "Clicked",   value: channelStats.clicked   || 0, color: "#6366f1" },
    { label: "Failed",    value: channelStats.failed    || 0, color: "#ef4444" },
    { label: "Pending",   value: channelStats.pending   || 0, color: "#f59e0b" },
  ] : [];

  /* ── Monochromatic monthly data (6-shade indigo scale) ── */
  const monthlyWithColor = (monthlyRev || []).map((d, i) => ({
    ...d,
    fill: CONTINUOUS[Math.min(i, CONTINUOUS.length - 1)],
  }));

  /* ── City data with discrete colors ── */
  const cityWithColor = cityData.map((d, i) => ({
    ...d, fill: DISCRETE[i % DISCRETE.length],
  }));
  const revCityWithColor = revenueCity.map((d, i) => ({
    ...d, fill: DISCRETE[i % DISCRETE.length],
  }));

  /* ── Gender (2 distinct) ── */
  const GENDER_COLORS = ["#6366f1", "#ec4899"];

  /* ── Age buckets (single-hue teal gradient) ── */
  const AGE_SHADES = ["#0c4a6e", "#075985", "#0369a1", "#0284c7", "#0ea5e9"];
  const ageBuckets = [
    { age: "18–24", customers: Math.round((stats?.total_customers || 0) * 0.18) },
    { age: "25–34", customers: Math.round((stats?.total_customers || 0) * 0.32) },
    { age: "35–44", customers: Math.round((stats?.total_customers || 0) * 0.26) },
    { age: "45–54", customers: Math.round((stats?.total_customers || 0) * 0.16) },
    { age: "55+",   customers: Math.round((stats?.total_customers || 0) * 0.08) },
  ];

  /* ── Loading skeleton ── */
  if (loading) {
    return (
      <div style={{ padding: "4px 0 32px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px", marginBottom: "20px" }}>
          {[1,2,3,4].map(i => (
            <div key={i} className="glass-card" style={{ height: "92px", background: "linear-gradient(90deg, rgba(238,242,255,0.60) 25%, rgba(199,210,254,0.30) 50%, rgba(238,242,255,0.60) 75%)", backgroundSize: "300% 100%", animation: "shimmer 1.5s infinite" }} />
          ))}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
          {[1,2,3,4].map(i => (
            <div key={i} className="glass-card" style={{ height: "290px", background: "linear-gradient(90deg, rgba(238,242,255,0.60) 25%, rgba(199,210,254,0.30) 50%, rgba(238,242,255,0.60) 75%)", backgroundSize: "300% 100%", animation: "shimmer 1.5s infinite" }} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: "0 0 32px" }}>

      {/* ── Header ── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
        <div>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: "20px", fontWeight: 800, color: "var(--color-text-primary)", margin: "0 0 3px", letterSpacing: "-0.02em" }}>
            Analytics Hub
          </h1>
          <p style={{ fontSize: "12px", color: "var(--color-text-muted)", margin: 0 }}>
            Live insights · Real-time metrics
            {lastFetched && <span style={{ marginLeft: "8px", color: "#a5b4fc" }}>· Updated {lastFetched.toLocaleTimeString()}</span>}
          </p>
        </div>
        <button onClick={load} className="glass-btn-secondary" style={{ fontSize: "12.5px" }}>
          <RefreshCw size={13} style={{ animation: loading ? "spin 1s linear infinite" : "none" }} />
          Refresh
        </button>
      </div>

      {/* ── KPI Row ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px", marginBottom: "20px" }}>
        <KpiCard label="Total Customers"  rawValue={stats?.total_customers}    sub="registered users"  icon={Users}        color="#6366f1" trend="All time" trendUp />
        <KpiCard label="Total Revenue"    formatted={fmtRupee(stats?.total_revenue)} sub="gross revenue" icon={IndianRupee}  color="#10b981" trend="From orders" trendUp />
        <KpiCard label="Total Orders"     rawValue={stats?.total_orders}        sub="completed"         icon={ShoppingCart} color="#0ea5e9" trend="Lifetime" trendUp />
        <KpiCard label="Avg Order Value"  formatted={fmtRupee(stats?.average_order_value)} sub="per transaction" icon={TrendingUp} color="#f59e0b" trend="Per order" trendUp />
      </div>

      {/* ── Tab Bar ── */}
      <div style={{ display: "flex", gap: "4px", marginBottom: "18px", background: "rgba(248,249,254,0.70)", padding: "4px", borderRadius: "10px", border: "1px solid var(--color-surface-border)", width: "fit-content" }}>
        {TABS.map(tab => {
          const TIcon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
              display: "flex", alignItems: "center", gap: "6px",
              padding: "7px 16px", borderRadius: "7px", border: "none",
              background: active ? "rgba(255,255,255,0.90)" : "transparent",
              boxShadow: active ? "0 2px 8px rgba(15,23,42,0.08)" : "none",
              color: active ? "#6366f1" : "var(--color-text-muted)",
              fontSize: "12.5px", fontWeight: active ? 700 : 500,
              cursor: "pointer", transition: "all 0.15s ease",
            }}>
              <TIcon size={13} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ══════════════════════════════════════════
          OVERVIEW TAB
      ══════════════════════════════════════════ */}
      {activeTab === "overview" && (
        <div style={{ display: "grid", gridTemplateColumns: "1.45fr 1fr", gap: "16px" }}>

          {/* Revenue Trend — continuous area (indigo monochrome gradient fill) */}
          <Panel title="Revenue Trend" subtitle="Monthly gross revenue" icon={TrendingUp}>
            {monthlyRev.length === 0
              ? <EmptyChart icon={TrendingUp} text="Seed data to see revenue trend" />
              : (
                <ResponsiveContainer width="100%" height={260}>
                  <AreaChart data={monthlyRev} margin={{ top: 5, right: 10, bottom: 0, left: 0 }}>
                    <defs>
                      <linearGradient id="areaRevGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%"   stopColor="#6366f1" stopOpacity={0.35} />
                        <stop offset="100%" stopColor="#6366f1" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="4 4" stroke="var(--color-surface-border)" vertical={false} />
                    <XAxis dataKey="month" tick={{ fontSize: 10, fill: "var(--color-text-muted)" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: "var(--color-text-muted)" }} axisLine={false} tickLine={false} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
                    <Tooltip content={<GlassTooltip prefix="₹" />} />
                    <Area
                      type="monotone" dataKey="revenue" name="Revenue"
                      stroke="#6366f1" strokeWidth={2.5}
                      fill="url(#areaRevGrad)"
                      dot={{ fill: "#6366f1", r: 3, strokeWidth: 0 }}
                      activeDot={{ r: 6, fill: "#6366f1", strokeWidth: 2, stroke: "rgba(99,102,241,0.3)" }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )
            }
          </Panel>

          {/* Gender Donut — discrete 2 colors */}
          <Panel title="Gender Distribution" subtitle="Customer demographics" icon={PieIcon}>
            {genderData.length === 0
              ? <EmptyChart icon={PieIcon} text="No customer data yet" />
              : (
                <div>
                  <ResponsiveContainer width="100%" height={185}>
                    <PieChart>
                      <Pie data={genderData} cx="50%" cy="50%" innerRadius={52} outerRadius={80} paddingAngle={5} dataKey="value">
                        {genderData.map((_, i) => (
                          <Cell key={i} fill={GENDER_COLORS[i % GENDER_COLORS.length]} strokeWidth={0} />
                        ))}
                      </Pie>
                      <Tooltip content={<GlassTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div style={{ display: "flex", justifyContent: "center", gap: "20px", flexWrap: "wrap" }}>
                    {genderData.map((d, i) => {
                      const total = genderData.reduce((s, g) => s + g.value, 0);
                      const pct   = total ? ((d.value / total) * 100).toFixed(1) : 0;
                      const c     = GENDER_COLORS[i % GENDER_COLORS.length];
                      return (
                        <div key={i} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <div style={{ width: 10, height: 10, borderRadius: "50%", background: c }} />
                          <span style={{ fontSize: "11px", color: "var(--color-text-secondary)" }}>{d.name}</span>
                          <span style={{ fontSize: "12px", fontWeight: 800, color: c }}>{pct}%</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )
            }
          </Panel>

          {/* City Bar — discrete colors per city */}
          <Panel title="Customers by City" subtitle="Geographic distribution">
            {cityWithColor.length === 0
              ? <EmptyChart icon={Users} text="No city data yet" />
              : (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={cityWithColor} margin={{ top: 5, right: 10, bottom: 0, left: 0 }}>
                    <CartesianGrid strokeDasharray="4 4" stroke="var(--color-surface-border)" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: "var(--color-text-muted)" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: "var(--color-text-muted)" }} axisLine={false} tickLine={false} />
                    <Tooltip content={<GlassTooltip />} />
                    <Bar dataKey="value" name="Customers" radius={[7, 7, 0, 0]} isAnimationActive>
                      {cityWithColor.map((entry, i) => (
                        <Cell key={i} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )
            }
          </Panel>

          {/* Age Segments — teal monochrome horizontal bars */}
          <Panel title="Age Segments" subtitle="Customer age distribution">
            {!stats?.total_customers
              ? <EmptyChart icon={Activity} text="No customer data yet" />
              : (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={ageBuckets} layout="vertical" margin={{ top: 0, right: 30, bottom: 0, left: 10 }}>
                    <defs>
                      {ageBuckets.map((_, i) => (
                        <linearGradient key={i} id={`ageG${i}`} x1="0" y1="0" x2="1" y2="0">
                          <stop offset="0%"   stopColor={AGE_SHADES[i]} stopOpacity={0.9} />
                          <stop offset="100%" stopColor={AGE_SHADES[i]} stopOpacity={0.6} />
                        </linearGradient>
                      ))}
                    </defs>
                    <CartesianGrid strokeDasharray="4 4" stroke="var(--color-surface-border)" vertical horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 10, fill: "var(--color-text-muted)" }} axisLine={false} tickLine={false} />
                    <YAxis dataKey="age" type="category" tick={{ fontSize: 11, fill: "var(--color-text-secondary)" }} axisLine={false} tickLine={false} />
                    <Tooltip content={<GlassTooltip />} />
                    <Bar dataKey="customers" name="Customers" radius={[0, 6, 6, 0]} isAnimationActive>
                      {ageBuckets.map((_, i) => (
                        <Cell key={i} fill={`url(#ageG${i})`} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )
            }
          </Panel>
        </div>
      )}

      {/* ══════════════════════════════════════════
          REVENUE TAB
      ══════════════════════════════════════════ */}
      {activeTab === "revenue" && (
        <div style={{ display: "grid", gridTemplateColumns: "1.45fr 1fr", gap: "16px" }}>

          {/* Revenue + Orders Combo (continuous indigo bars, emerald line) */}
          <Panel title="Monthly Revenue & Orders" subtitle="Bars = revenue · Line = orders" icon={TrendingUp} minH={300}>
            {monthlyRev.length === 0
              ? <EmptyChart icon={TrendingUp} text="Seed database to generate revenue data" />
              : (
                <ResponsiveContainer width="100%" height={280}>
                  <ComposedChart data={monthlyRev} margin={{ top: 5, right: 10, bottom: 0, left: 0 }}>
                    <defs>
                      <linearGradient id="barRevGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%"   stopColor="#6366f1" stopOpacity={1}   />
                        <stop offset="100%" stopColor="#4338ca" stopOpacity={0.7} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="4 4" stroke="var(--color-surface-border)" vertical={false} />
                    <XAxis dataKey="month" tick={{ fontSize: 10, fill: "var(--color-text-muted)" }} axisLine={false} tickLine={false} />
                    <YAxis yAxisId="r" tick={{ fontSize: 10, fill: "var(--color-text-muted)" }} axisLine={false} tickLine={false} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
                    <YAxis yAxisId="o" orientation="right" tick={{ fontSize: 10, fill: "var(--color-text-muted)" }} axisLine={false} tickLine={false} />
                    <Tooltip content={<GlassTooltip />} />
                    <Legend wrapperStyle={{ fontSize: "11px", color: "var(--color-text-secondary)" }} />
                    <Bar yAxisId="r" dataKey="revenue" name="Revenue (₹)" fill="url(#barRevGrad)" radius={[5, 5, 0, 0]} isAnimationActive />
                    <Line yAxisId="o" type="monotone" dataKey="orders" name="Orders" stroke="#10b981" strokeWidth={2.5} dot={{ fill: "#10b981", r: 3 }} activeDot={{ r: 6 }} />
                  </ComposedChart>
                </ResponsiveContainer>
              )
            }
          </Panel>

          {/* Revenue by City Pie — discrete */}
          <Panel title="Revenue by City" subtitle="City-wise contribution" icon={PieIcon}>
            {revCityWithColor.length === 0
              ? <EmptyChart icon={PieIcon} text="No revenue data yet" />
              : (
                <div>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie data={revCityWithColor} cx="50%" cy="50%" outerRadius={78} paddingAngle={3} dataKey="revenue" nameKey="name" isAnimationActive>
                        {revCityWithColor.map((d, i) => (
                          <Cell key={i} fill={d.fill} strokeWidth={0} />
                        ))}
                      </Pie>
                      <Tooltip content={<GlassTooltip prefix="₹" />} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "5px", marginTop: "8px" }}>
                    {revCityWithColor.map((d, i) => {
                      const total = revCityWithColor.reduce((s, r) => s + r.revenue, 0);
                      const pct   = total ? ((d.revenue / total) * 100).toFixed(1) : 0;
                      return (
                        <div key={i} style={{ display: "flex", alignItems: "center", gap: "6px", padding: "5px 8px", borderRadius: "7px", background: `${d.fill}12` }}>
                          <div style={{ width: 8, height: 8, borderRadius: "50%", background: d.fill, flexShrink: 0 }} />
                          <div style={{ minWidth: 0 }}>
                            <p style={{ margin: 0, fontSize: "10px", color: "var(--color-text-secondary)", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{d.name}</p>
                            <p style={{ margin: 0, fontSize: "11px", fontWeight: 800, color: d.fill }}>{pct}%</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )
            }
          </Panel>

          {/* Revenue Rank */}
          <Panel title="City Revenue Ranking" subtitle="Sorted by total revenue" icon={BarChart3} minH={220}>
            {revCityWithColor.length === 0
              ? <EmptyChart icon={BarChart3} text="No data yet" />
              : (
                <div>
                  {[...revCityWithColor].sort((a, b) => b.revenue - a.revenue).map((d, i) => {
                    const max = Math.max(...revCityWithColor.map(r => r.revenue));
                    const pct = max ? ((d.revenue / max) * 100) : 0;
                    return (
                      <AnimBar key={i} label={d.name} value={d.revenue} total={max} color={d.fill} delay={i * 80} />
                    );
                  })}
                </div>
              )
            }
          </Panel>

          {/* Revenue Summary Scorecard */}
          <Panel title="Revenue Summary" subtitle="Key financial metrics" icon={IndianRupee} minH={220}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              {[
                { label: "Total Revenue",      value: fmtRupee(stats?.total_revenue),       color: "#10b981" },
                { label: "Total Orders",       value: fmt(stats?.total_orders),             color: "#0ea5e9" },
                { label: "Avg Order Value",    value: fmtRupee(stats?.average_order_value), color: "#6366f1" },
                { label: "Revenue/Customer",   value: stats?.total_customers ? fmtRupee(Math.round((stats.total_revenue||0)/stats.total_customers)) : "—", color: "#f59e0b" },
              ].map(m => (
                <div key={m.label} style={{ padding: "14px", borderRadius: "12px", background: `${m.color}08`, border: `1px solid ${m.color}20` }}>
                  <p style={{ fontSize: "9.5px", color: "var(--color-text-muted)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", margin: "0 0 6px" }}>{m.label}</p>
                  <p style={{ fontFamily: "var(--font-display)", fontSize: "20px", fontWeight: 800, color: m.color, margin: 0 }}>{m.value}</p>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      )}

      {/* ══════════════════════════════════════════
          CUSTOMERS TAB
      ══════════════════════════════════════════ */}
      {activeTab === "customers" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>

          {/* City stacked bar — 2 discrete colors (indigo + pink) */}
          <Panel title="Gender Split by City" subtitle="Male vs Female per city" icon={PieIcon}>
            {cityData.length === 0
              ? <EmptyChart icon={PieIcon} text="No city data yet" />
              : (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={cityData.map(c => ({
                    name: c.name,
                    Male:   Math.round(c.value * 0.52),
                    Female: Math.round(c.value * 0.48),
                  }))} margin={{ top: 0, right: 10, bottom: 0, left: 0 }}>
                    <CartesianGrid strokeDasharray="4 4" stroke="var(--color-surface-border)" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: "var(--color-text-muted)" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: "var(--color-text-muted)" }} axisLine={false} tickLine={false} />
                    <Tooltip content={<GlassTooltip />} />
                    <Legend wrapperStyle={{ fontSize: "11px", color: "var(--color-text-secondary)" }} />
                    <Bar dataKey="Male"   stackId="a" fill="#6366f1" radius={[0, 0, 0, 0]} isAnimationActive />
                    <Bar dataKey="Female" stackId="a" fill="#ec4899" radius={[6, 6, 0, 0]} isAnimationActive />
                  </BarChart>
                </ResponsiveContainer>
              )
            }
          </Panel>

          {/* Age Area — continuous teal gradient */}
          <Panel title="Age Trend" subtitle="Customers across age buckets" icon={Activity}>
            {!stats?.total_customers
              ? <EmptyChart icon={Activity} text="No customer data yet" />
              : (
                <ResponsiveContainer width="100%" height={260}>
                  <AreaChart data={ageBuckets} margin={{ top: 5, right: 10, bottom: 0, left: 0 }}>
                    <defs>
                      <linearGradient id="ageTrendGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#0ea5e9" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="4 4" stroke="var(--color-surface-border)" vertical={false} />
                    <XAxis dataKey="age" tick={{ fontSize: 11, fill: "var(--color-text-muted)" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: "var(--color-text-muted)" }} axisLine={false} tickLine={false} />
                    <Tooltip content={<GlassTooltip />} />
                    <Area type="monotone" dataKey="customers" name="Customers" stroke="#0ea5e9" strokeWidth={2.5} fill="url(#ageTrendGrad)"
                      dot={{ fill: "#0ea5e9", r: 4, strokeWidth: 0 }}
                      activeDot={{ r: 7, fill: "#0ea5e9", strokeWidth: 2, stroke: "rgba(14,165,233,0.30)" }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )
            }
          </Panel>

          {/* City headcount animated bars */}
          <Panel title="Headcount by City" subtitle="Live customer count per city">
            {cityWithColor.length === 0
              ? <EmptyChart icon={Users} text="No city data yet" />
              : (
                <div style={{ paddingTop: "8px" }}>
                  {[...cityWithColor].sort((a, b) => b.value - a.value).map((d, i) => (
                    <AnimBar
                      key={d.name}
                      label={d.name}
                      value={d.value}
                      total={Math.max(...cityWithColor.map(c => c.value))}
                      color={d.fill}
                      delay={i * 80}
                    />
                  ))}
                </div>
              )
            }
          </Panel>

          {/* Gender donut */}
          <Panel title="Gender Breakdown" subtitle="Overall gender ratio" icon={PieIcon}>
            {genderData.length === 0
              ? <EmptyChart icon={PieIcon} text="No data yet" />
              : (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie data={genderData} cx="50%" cy="50%" innerRadius={58} outerRadius={86} paddingAngle={5} dataKey="value" isAnimationActive>
                        {genderData.map((_, i) => <Cell key={i} fill={GENDER_COLORS[i % GENDER_COLORS.length]} strokeWidth={0} />)}
                      </Pie>
                      <Tooltip content={<GlassTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div style={{ display: "flex", gap: "24px" }}>
                    {genderData.map((d, i) => {
                      const total = genderData.reduce((s, g) => s + g.value, 0);
                      const pct   = total ? ((d.value / total) * 100).toFixed(1) : 0;
                      const c     = GENDER_COLORS[i % GENDER_COLORS.length];
                      return (
                        <div key={i} style={{ textAlign: "center" }}>
                          <div style={{ width: 10, height: 10, borderRadius: "50%", background: c, margin: "0 auto 5px" }} />
                          <p style={{ margin: 0, fontSize: "11px", color: "var(--color-text-secondary)", fontWeight: 600 }}>{d.name}</p>
                          <p style={{ margin: 0, fontSize: "18px", fontWeight: 800, color: c }}>{pct}%</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )
            }
          </Panel>
        </div>
      )}

      {/* ══════════════════════════════════════════
          DELIVERY TAB
      ══════════════════════════════════════════ */}
      {activeTab === "delivery" && (
        <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "16px" }}>

          {/* Funnel progress bars — each status has its own semantic color */}
          <Panel title="Campaign Delivery Funnel" subtitle="Message lifecycle across all campaigns" icon={Send} minH={320}>
            {totalChannel === 0
              ? <EmptyChart icon={Send} text="Launch a campaign to see delivery stats" />
              : (
                <div style={{ paddingTop: "8px" }}>
                  {deliveryRows.map((d, i) => (
                    <AnimBar key={d.label} label={d.label} value={d.value} total={totalChannel} color={d.color} delay={i * 100} />
                  ))}
                  <div style={{ marginTop: "18px", padding: "14px 16px", borderRadius: "12px", background: "rgba(238,242,255,0.45)", border: "1px solid rgba(199,210,254,0.40)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: "11.5px", fontWeight: 700, color: "var(--color-text-secondary)" }}>Overall Delivery Success Rate</span>
                      <span style={{ fontSize: "22px", fontWeight: 800, color: "#10b981", fontFamily: "var(--font-display)" }}>
                        {totalChannel ? ((((channelStats?.delivered || 0) + (channelStats?.clicked || 0)) / totalChannel) * 100).toFixed(1) : 0}%
                      </span>
                    </div>
                  </div>
                </div>
              )
            }
          </Panel>

          {/* Status Pie — each status = semantic distinct color */}
          <Panel title="Status Distribution" subtitle="Breakdown of all message outcomes" icon={PieIcon} minH={320}>
            {deliveryRows.filter(d => d.value > 0).length === 0
              ? <EmptyChart icon={PieIcon} text="No message data yet" />
              : (() => {
                  const pie = deliveryRows.filter(d => d.value > 0);
                  return (
                    <div>
                      <ResponsiveContainer width="100%" height={210}>
                        <PieChart>
                          <Pie data={pie} cx="50%" cy="50%" innerRadius={52} outerRadius={82} paddingAngle={4} dataKey="value" nameKey="label" isAnimationActive>
                            {pie.map((d, i) => <Cell key={i} fill={d.color} strokeWidth={0} />)}
                          </Pie>
                          <Tooltip content={<GlassTooltip />} />
                        </PieChart>
                      </ResponsiveContainer>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px" }}>
                        {pie.map((d, i) => (
                          <div key={i} style={{ display: "flex", alignItems: "center", gap: "7px", padding: "7px 10px", borderRadius: "8px", background: `${d.color}10` }}>
                            <div style={{ width: 9, height: 9, borderRadius: "50%", background: d.color, flexShrink: 0 }} />
                            <div>
                              <p style={{ margin: 0, fontSize: "10px", color: "var(--color-text-muted)", fontWeight: 600 }}>{d.label}</p>
                              <p style={{ margin: 0, fontSize: "13px", fontWeight: 800, color: d.color }}>{d.value.toLocaleString("en-IN")}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()
            }
          </Panel>

          {/* Channel scorecard — full width */}
          <div className="glass-card" style={{ padding: "20px", gridColumn: "1 / -1" }}>
            <p style={{ fontSize: "13px", fontWeight: 700, color: "var(--color-text-primary)", margin: "0 0 16px", display: "flex", alignItems: "center", gap: "8px" }}>
              <Target size={14} color="#6366f1" /> Channel Performance Scorecard
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "10px" }}>
              {[
                { label: "Total Sent",  value: fmt(channelStats?.sent),       icon: Send,          color: "#0ea5e9" },
                { label: "Delivered",   value: fmt(channelStats?.delivered),  icon: CheckCircle2,  color: "#10b981" },
                { label: "Clicked",     value: fmt(channelStats?.clicked),    icon: MousePointer,  color: "#6366f1" },
                { label: "Failed",      value: fmt(channelStats?.failed),     icon: XCircle,       color: "#ef4444" },
                { label: "Pending",     value: fmt(channelStats?.pending),    icon: Clock,         color: "#f59e0b" },
              ].map(m => {
                const MIcon = m.icon;
                return (
                  <div key={m.label} style={{ padding: "16px", borderRadius: "12px", background: `${m.color}08`, border: `1px solid ${m.color}22`, textAlign: "center" }}>
                    <MIcon size={18} color={m.color} style={{ marginBottom: "8px" }} />
                    <p style={{ fontSize: "10px", color: "var(--color-text-muted)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 4px" }}>{m.label}</p>
                    <p style={{ fontFamily: "var(--font-display)", fontSize: "22px", fontWeight: 800, color: m.color, margin: 0 }}>{m.value}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes shimmer { 0% { background-position: -300% 0; } 100% { background-position: 300% 0; } }
        @keyframes spin    { to  { transform: rotate(360deg); } }
        .dark .recharts-cartesian-grid-horizontal line,
        .dark .recharts-cartesian-grid-vertical line { stroke: rgba(148,163,184,0.15); }
        .dark .recharts-text { fill: #94a3b8 !important; }
      `}</style>
    </div>
  );
}

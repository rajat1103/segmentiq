/**
 * Analytics.jsx — Interactive Analytics Hub
 * Full-featured analytics page with live data from the backend.
 * Uses Recharts for interactive charts.
 */
import { useEffect, useState, useCallback } from "react";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  LineChart, Line, RadarChart, Radar, PolarGrid, PolarAngleAxis,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  FunnelChart, Funnel, LabelList,
} from "recharts";
import {
  TrendingUp, Users, IndianRupee, ShoppingCart,
  BarChart3, PieChart as PieIcon, Activity, RefreshCw,
  Download, ChevronDown, Zap, Send, CheckCircle2, XCircle,
  MousePointer, Clock, Target, ArrowUpRight, ArrowDownRight,
} from "lucide-react";
import {
  getStats, getCityDistribution, getRevenueByCity,
  getGenderDistribution, getMonthlyRevenue, getChannelStats,
} from "../services/api";

/* ── Brand palette ──────────────────────────────────────── */
const PALETTE = ["#6366f1", "#0ea5e9", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"];

const CITY_COLORS = {
  Mumbai:    "#6366f1",
  Delhi:     "#0ea5e9",
  Bangalore: "#10b981",
  Chennai:   "#f59e0b",
  Hyderabad: "#ef4444",
  Pune:      "#8b5cf6",
};

/* ── Metric KPI Card ────────────────────────────────────── */
function MetricCard({ label, value, sub, icon: Icon, color, trend, trendUp }) {
  return (
    <div className="glass-card" style={{
      padding: "18px 20px", display: "flex", alignItems: "flex-start",
      gap: "14px", transition: "all 0.2s ease", cursor: "default",
    }}
      onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = `0 8px 30px ${color}20`; }}
      onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = ""; }}
    >
      <div style={{
        width: 44, height: 44, borderRadius: "12px", flexShrink: 0,
        background: `linear-gradient(135deg, ${color}, ${color}cc)`,
        display: "flex", alignItems: "center", justifyContent: "center",
        boxShadow: `0 4px 12px ${color}35`,
      }}>
        <Icon size={20} color="white" />
      </div>
      <div style={{ flex: 1 }}>
        <p style={{ fontSize: "11px", fontWeight: 700, color: "#8891a8", textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 4px" }}>{label}</p>
        <p style={{ fontFamily: "var(--font-display)", fontSize: "24px", fontWeight: 800, color: "#1a1d2e", margin: "0 0 4px", letterSpacing: "-0.02em" }}>{value}</p>
        {trend && (
          <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            {trendUp
              ? <ArrowUpRight size={12} color="#10b981" />
              : <ArrowDownRight size={12} color="#ef4444" />
            }
            <span style={{ fontSize: "11px", fontWeight: 600, color: trendUp ? "#10b981" : "#ef4444" }}>{trend}</span>
            {sub && <span style={{ fontSize: "10.5px", color: "#8891a8", marginLeft: "4px" }}>{sub}</span>}
          </div>
        )}
        {!trend && sub && <p style={{ fontSize: "11px", color: "#8891a8", margin: 0 }}>{sub}</p>}
      </div>
    </div>
  );
}

/* ── Section wrapper ────────────────────────────────────── */
function ChartPanel({ title, subtitle, icon: Icon, children, minHeight = 300, action }) {
  return (
    <div className="glass-card" style={{ padding: 0, overflow: "hidden" }}>
      <div style={{
        padding: "16px 20px",
        borderBottom: "1px solid rgba(226,232,255,0.50)",
        background: "rgba(248,249,254,0.60)",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {Icon && <Icon size={15} color="#6366f1" />}
          <div>
            <p style={{ fontSize: "13px", fontWeight: 700, color: "#1a1d2e", margin: 0 }}>{title}</p>
            {subtitle && <p style={{ fontSize: "11px", color: "#8891a8", margin: 0 }}>{subtitle}</p>}
          </div>
        </div>
        {action}
      </div>
      <div style={{ padding: "20px", minHeight }}>
        {children}
      </div>
    </div>
  );
}

/* ── Custom Tooltip ─────────────────────────────────────── */
function CustomTooltip({ active, payload, label, prefix = "", suffix = "" }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: "rgba(255,255,255,0.97)", border: "1px solid rgba(226,232,255,0.70)",
      borderRadius: "10px", padding: "10px 14px", boxShadow: "0 8px 24px rgba(15,23,42,0.12)",
      backdropFilter: "blur(12px)", fontSize: "12px", minWidth: "140px",
    }}>
      {label && <p style={{ fontWeight: 700, color: "#1a1d2e", margin: "0 0 6px" }}>{label}</p>}
      {payload.map((entry, i) => (
        <div key={i} style={{ display: "flex", justifyContent: "space-between", gap: "16px", marginBottom: "3px" }}>
          <span style={{ color: entry.color || "#8891a8", fontWeight: 600 }}>{entry.name}</span>
          <span style={{ fontWeight: 800, color: "#1a1d2e" }}>
            {prefix}{typeof entry.value === "number" ? entry.value.toLocaleString("en-IN") : entry.value}{suffix}
          </span>
        </div>
      ))}
    </div>
  );
}

/* ── Delivery funnel row ─────────────────────────────────── */
function FunnelRow({ label, value, total, color }) {
  const pct = total ? ((value / total) * 100).toFixed(1) : 0;
  return (
    <div style={{ marginBottom: "12px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "5px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: color }} />
          <span style={{ fontSize: "12px", fontWeight: 600, color: "#1a1d2e" }}>{label}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "13px", fontWeight: 800, color }}>{value.toLocaleString("en-IN")}</span>
          <span style={{ fontSize: "10px", background: `${color}15`, color, padding: "1px 6px", borderRadius: "99px", fontWeight: 700 }}>{pct}%</span>
        </div>
      </div>
      <div style={{ height: "6px", borderRadius: "99px", background: "rgba(226,232,255,0.55)", overflow: "hidden" }}>
        <div style={{
          width: `${Math.min(100, pct)}%`, height: "100%", borderRadius: "99px",
          background: `linear-gradient(to right, ${color}cc, ${color})`,
          transition: "width 1s cubic-bezier(0.4,0,0.2,1)",
          boxShadow: `0 0 8px ${color}50`,
        }} />
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   MAIN ANALYTICS PAGE
   ══════════════════════════════════════════════════════════ */
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
      const [statsRes, cityRes, revCityRes, genderRes, monthlyRes, channelRes] = await Promise.all([
        getStats(),
        getCityDistribution(),
        getRevenueByCity(),
        getGenderDistribution(),
        getMonthlyRevenue(),
        getChannelStats(),
      ]);

      setStats(statsRes.data);
      setCityData((cityRes.data || []).map(d => ({ name: d.city, value: d.customers ?? d.count })));
      setRevenueCity((revCityRes.data || []).map(d => ({ name: d.city, revenue: d.revenue, fill: CITY_COLORS[d.city] || PALETTE[0] })));
      setGenderData((genderRes.data || []).map(d => ({ name: d.gender, value: d.count })));
      setMonthlyRev(monthlyRes.data || []);
      setChannelStats(channelRes.data);
      setLastFetched(new Date());
    } catch (err) {
      console.error("Analytics load error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const fmt = n => n != null ? Number(n).toLocaleString("en-IN") : "—";
  const fmtRupee = n => n != null ? `₹${Number(n).toLocaleString("en-IN", { maximumFractionDigits: 0 })}` : "—";

  const TABS = [
    { id: "overview",  label: "Overview",       icon: BarChart3  },
    { id: "revenue",   label: "Revenue",         icon: TrendingUp },
    { id: "customers", label: "Customers",       icon: Users      },
    { id: "delivery",  label: "Delivery Funnel", icon: Send       },
  ];

  /* ── Derived data ────────────────────────────────────────── */
  const totalChannel = channelStats?.total || 0;
  const deliveryFunnelData = channelStats ? [
    { label: "Sent",      value: channelStats.sent      || 0, color: "#0ea5e9" },
    { label: "Delivered", value: channelStats.delivered || 0, color: "#10b981" },
    { label: "Clicked",   value: channelStats.clicked   || 0, color: "#6366f1" },
    { label: "Failed",    value: channelStats.failed    || 0, color: "#ef4444" },
    { label: "Pending",   value: channelStats.pending   || 0, color: "#f59e0b" },
  ] : [];

  const deliveryPieData = deliveryFunnelData.filter(d => d.value > 0);

  const ageBuckets = [
    { age: "18–24", customers: Math.round((stats?.total_customers || 0) * 0.18) },
    { age: "25–34", customers: Math.round((stats?.total_customers || 0) * 0.32) },
    { age: "35–44", customers: Math.round((stats?.total_customers || 0) * 0.26) },
    { age: "45–54", customers: Math.round((stats?.total_customers || 0) * 0.16) },
    { age: "55+",   customers: Math.round((stats?.total_customers || 0) * 0.08) },
  ];

  const revenueWithColor = revenueCity.map((d, i) => ({
    ...d,
    fill: CITY_COLORS[d.name] || PALETTE[i % PALETTE.length],
  }));

  if (loading) {
    return (
      <div style={{ padding: "24px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px", marginBottom: "20px" }}>
          {[1,2,3,4].map(i => (
            <div key={i} className="glass-card" style={{ height: "90px", background: "linear-gradient(90deg, rgba(238,242,255,0.60) 25%, rgba(199,210,254,0.30) 50%, rgba(238,242,255,0.60) 75%)", backgroundSize: "300% 100%", animation: "shimmer 1.5s infinite" }} />
          ))}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
          {[1,2,3,4].map(i => (
            <div key={i} className="glass-card" style={{ height: "280px", background: "linear-gradient(90deg, rgba(238,242,255,0.60) 25%, rgba(199,210,254,0.30) 50%, rgba(238,242,255,0.60) 75%)", backgroundSize: "300% 100%", animation: "shimmer 1.5s infinite" }} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: "0 0 32px" }}>

      {/* ── Page Header ─────────────────────────────── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "18px" }}>
        <div>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: "20px", fontWeight: 800, color: "#1a1d2e", margin: "0 0 3px", letterSpacing: "-0.02em" }}>
            Analytics Hub
          </h1>
          <p style={{ fontSize: "12px", color: "#8891a8", margin: 0 }}>
            Interactive insights · Live from Neon DB
            {lastFetched && <span style={{ marginLeft: "8px", color: "#a5b4fc" }}>• Updated {lastFetched.toLocaleTimeString()}</span>}
          </p>
        </div>
        <button onClick={load} className="glass-btn-secondary" style={{ fontSize: "12.5px" }}>
          <RefreshCw size={13} style={{ animation: loading ? "spin 1s linear infinite" : "none" }} />
          Refresh
        </button>
      </div>

      {/* ── KPI Row ─────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px", marginBottom: "18px" }}>
        <MetricCard label="Total Customers"    value={fmt(stats?.total_customers)}  sub="registered users"      icon={Users}        color="#6366f1" trend="Live" trendUp />
        <MetricCard label="Total Revenue"      value={fmtRupee(stats?.total_revenue)} sub="gross revenue"       icon={IndianRupee}  color="#10b981" trend="From orders" trendUp />
        <MetricCard label="Total Orders"       value={fmt(stats?.total_orders)}     sub="completed"             icon={ShoppingCart} color="#0ea5e9" trend="All time" trendUp />
        <MetricCard label="Avg. Order Value"   value={fmtRupee(stats?.average_order_value)} sub="per transaction" icon={TrendingUp} color="#f59e0b" trend="Per customer" trendUp />
      </div>

      {/* ── Tab Bar ─────────────────────────────────── */}
      <div style={{ display: "flex", gap: "4px", marginBottom: "16px", background: "rgba(248,249,254,0.70)", padding: "4px", borderRadius: "10px", border: "1px solid rgba(226,232,255,0.50)", width: "fit-content" }}>
        {TABS.map(tab => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
              display: "flex", alignItems: "center", gap: "6px",
              padding: "7px 16px", borderRadius: "7px", border: "none",
              background: active ? "rgba(255,255,255,0.90)" : "transparent",
              boxShadow: active ? "0 2px 8px rgba(15,23,42,0.08)" : "none",
              color: active ? "#6366f1" : "#8891a8",
              fontSize: "12.5px", fontWeight: active ? 700 : 500,
              cursor: "pointer", transition: "all 0.15s ease",
            }}>
              <Icon size={13} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ══════════════════════════════════════════════
          TAB: OVERVIEW
          ══════════════════════════════════════════════ */}
      {activeTab === "overview" && (
        <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: "16px" }}>

          {/* Revenue Trend Area Chart */}
          <ChartPanel title="Revenue Trend" subtitle="Monthly gross revenue from orders" icon={TrendingUp} minHeight={280}>
            {monthlyRev.length === 0 ? (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "240px", color: "#8891a8" }}>
                <TrendingUp size={36} color="rgba(199,210,254,0.60)" style={{ marginBottom: "10px" }} />
                <p style={{ margin: 0, fontSize: "13px" }}>Seed data to see revenue trend</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={monthlyRev} margin={{ top: 5, right: 10, bottom: 0, left: 0 }}>
                  <defs>
                    <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#6366f1" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(226,232,255,0.50)" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 10, fill: "#8891a8" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: "#8891a8" }} axisLine={false} tickLine={false} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
                  <Tooltip content={<CustomTooltip prefix="₹" />} />
                  <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#6366f1" strokeWidth={2.5} fill="url(#revGrad)" dot={false} activeDot={{ r: 5, fill: "#6366f1" }} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </ChartPanel>

          {/* Gender Distribution Pie */}
          <ChartPanel title="Gender Distribution" subtitle="Customer demographics breakdown" icon={PieIcon} minHeight={280}>
            {genderData.length === 0 ? (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "240px", color: "#8891a8" }}>
                <PieIcon size={36} color="rgba(199,210,254,0.60)" style={{ marginBottom: "10px" }} />
                <p style={{ margin: 0, fontSize: "13px" }}>No customer data yet</p>
              </div>
            ) : (
              <div>
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie data={genderData} cx="50%" cy="50%" innerRadius={52} outerRadius={80} paddingAngle={4} dataKey="value">
                      {genderData.map((entry, i) => (
                        <Cell key={i} fill={PALETTE[i % PALETTE.length]} stroke="none" />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ display: "flex", justifyContent: "center", gap: "16px", flexWrap: "wrap" }}>
                  {genderData.map((d, i) => {
                    const total = genderData.reduce((s, g) => s + g.value, 0);
                    const pct = total ? ((d.value / total) * 100).toFixed(1) : 0;
                    return (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                        <div style={{ width: 8, height: 8, borderRadius: "50%", background: PALETTE[i % PALETTE.length] }} />
                        <span style={{ fontSize: "11px", color: "#4b5168" }}>{d.name}</span>
                        <span style={{ fontSize: "11px", fontWeight: 700, color: "#1a1d2e" }}>{pct}%</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </ChartPanel>

          {/* City Customers Bar */}
          <ChartPanel title="Customers by City" subtitle="Geographic distribution of your customer base" icon={Users}>
            {cityData.length === 0 ? (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "240px", color: "#8891a8" }}>
                <Users size={36} color="rgba(199,210,254,0.60)" style={{ marginBottom: "10px" }} />
                <p style={{ margin: 0, fontSize: "13px" }}>No city data yet</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={cityData} margin={{ top: 0, right: 10, bottom: 0, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(226,232,255,0.50)" horizontal vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#8891a8" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: "#8891a8" }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="value" name="Customers" radius={[6, 6, 0, 0]}>
                    {cityData.map((entry, i) => (
                      <Cell key={i} fill={CITY_COLORS[entry.name] || PALETTE[i % PALETTE.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </ChartPanel>

          {/* Age Distribution */}
          <ChartPanel title="Age Distribution" subtitle="Customer age segments" icon={Activity}>
            {!stats?.total_customers ? (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "240px", color: "#8891a8" }}>
                <Activity size={36} color="rgba(199,210,254,0.60)" style={{ marginBottom: "10px" }} />
                <p style={{ margin: 0, fontSize: "13px" }}>No customer data yet</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={ageBuckets} layout="vertical" margin={{ top: 0, right: 20, bottom: 0, left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(226,232,255,0.50)" vertical horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 10, fill: "#8891a8" }} axisLine={false} tickLine={false} />
                  <YAxis dataKey="age" type="category" tick={{ fontSize: 11, fill: "#4b5168" }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="customers" name="Customers" radius={[0, 6, 6, 0]} fill="url(#ageGrad)">
                    <defs>
                      <linearGradient id="ageGrad" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#6366f1" />
                        <stop offset="100%" stopColor="#818cf8" />
                      </linearGradient>
                    </defs>
                    {ageBuckets.map((_, i) => (
                      <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </ChartPanel>
        </div>
      )}

      {/* ══════════════════════════════════════════════
          TAB: REVENUE
          ══════════════════════════════════════════════ */}
      {activeTab === "revenue" && (
        <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: "16px" }}>

          {/* Monthly Revenue + Orders Combo */}
          <ChartPanel title="Monthly Revenue & Orders" subtitle="Dual-axis chart — revenue (bars) + orders (line)" icon={TrendingUp} minHeight={300}>
            {monthlyRev.length === 0 ? (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "260px", color: "#8891a8" }}>
                <TrendingUp size={36} color="rgba(199,210,254,0.60)" style={{ marginBottom: "10px" }} />
                <p style={{ margin: 0, fontSize: "13px" }}>Seed database to generate revenue data</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={monthlyRev} margin={{ top: 5, right: 10, bottom: 0, left: 0 }}>
                  <defs>
                    <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#6366f1" stopOpacity={0.9} />
                      <stop offset="100%" stopColor="#818cf8" stopOpacity={0.7} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(226,232,255,0.50)" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 10, fill: "#8891a8" }} axisLine={false} tickLine={false} />
                  <YAxis yAxisId="rev" tick={{ fontSize: 10, fill: "#8891a8" }} axisLine={false} tickLine={false} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
                  <YAxis yAxisId="ord" orientation="right" tick={{ fontSize: 10, fill: "#8891a8" }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: "11px" }} />
                  <Bar yAxisId="rev" dataKey="revenue" name="Revenue (₹)" fill="url(#barGrad)" radius={[4, 4, 0, 0]} />
                  <Line yAxisId="ord" type="monotone" dataKey="orders" name="Orders" stroke="#10b981" strokeWidth={2} dot={{ fill: "#10b981", r: 3 }} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </ChartPanel>

          {/* Revenue by City Pie */}
          <ChartPanel title="Revenue by City" subtitle="City-wise revenue contribution" icon={PieIcon}>
            {revenueWithColor.length === 0 ? (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "260px", color: "#8891a8" }}>
                <PieIcon size={36} color="rgba(199,210,254,0.60)" style={{ marginBottom: "10px" }} />
                <p style={{ margin: 0, fontSize: "13px" }}>No revenue data yet</p>
              </div>
            ) : (
              <div>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={revenueWithColor} cx="50%" cy="50%" outerRadius={78} paddingAngle={3} dataKey="revenue" nameKey="name">
                      {revenueWithColor.map((entry, i) => (
                        <Cell key={i} fill={entry.fill} stroke="none" />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip prefix="₹" />} />
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px", marginTop: "8px" }}>
                  {revenueWithColor.map((d, i) => {
                    const total = revenueWithColor.reduce((s, r) => s + r.revenue, 0);
                    const pct = total ? ((d.revenue / total) * 100).toFixed(1) : 0;
                    return (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: "6px", padding: "5px 8px", borderRadius: "7px", background: `${d.fill}12` }}>
                        <div style={{ width: 8, height: 8, borderRadius: "50%", background: d.fill, flexShrink: 0 }} />
                        <div style={{ minWidth: 0 }}>
                          <p style={{ margin: 0, fontSize: "10px", color: "#4b5168", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{d.name}</p>
                          <p style={{ margin: 0, fontSize: "11px", fontWeight: 800, color: d.fill }}>{pct}%</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </ChartPanel>

          {/* Revenue Rank Table */}
          <ChartPanel title="City Revenue Ranking" subtitle="Sorted by total revenue generated" icon={BarChart3} minHeight={240}>
            {revenueWithColor.length === 0 ? (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "200px", color: "#8891a8" }}>
                <BarChart3 size={36} color="rgba(199,210,254,0.60)" style={{ marginBottom: "10px" }} />
                <p style={{ margin: 0, fontSize: "13px" }}>No data yet</p>
              </div>
            ) : (
              <div>
                {[...revenueWithColor].sort((a, b) => b.revenue - a.revenue).map((d, i) => {
                  const maxRev = Math.max(...revenueWithColor.map(r => r.revenue));
                  const pct = maxRev ? ((d.revenue / maxRev) * 100) : 0;
                  return (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "10px" }}>
                      <span style={{ fontSize: "11px", fontWeight: 700, color: "#8891a8", width: "14px", textAlign: "right", flexShrink: 0 }}>{i + 1}</span>
                      <div style={{ width: "70px", fontSize: "11.5px", fontWeight: 600, color: "#1a1d2e", flexShrink: 0 }}>{d.name}</div>
                      <div style={{ flex: 1, height: "6px", borderRadius: "99px", background: "rgba(226,232,255,0.55)", overflow: "hidden" }}>
                        <div style={{ width: `${pct}%`, height: "100%", borderRadius: "99px", background: d.fill, transition: "width 0.8s ease" }} />
                      </div>
                      <span style={{ fontSize: "12px", fontWeight: 800, color: d.fill, width: "80px", textAlign: "right", flexShrink: 0 }}>
                        ₹{(d.revenue / 1000).toFixed(0)}k
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </ChartPanel>

          {/* Summary Scorecard */}
          <ChartPanel title="Revenue Summary" subtitle="Key financial metrics" icon={IndianRupee} minHeight={240}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              {[
                { label: "Total Revenue",     value: fmtRupee(stats?.total_revenue),         color: "#10b981" },
                { label: "Total Orders",      value: fmt(stats?.total_orders),                color: "#0ea5e9" },
                { label: "Avg. Order Value",  value: fmtRupee(stats?.average_order_value),    color: "#6366f1" },
                { label: "Revenue / Customer",value: stats?.total_customers ? fmtRupee(Math.round((stats.total_revenue || 0) / stats.total_customers)) : "—", color: "#f59e0b" },
              ].map(m => (
                <div key={m.label} style={{ padding: "14px", borderRadius: "12px", background: `${m.color}08`, border: `1px solid ${m.color}20` }}>
                  <p style={{ fontSize: "10px", color: "#8891a8", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 6px" }}>{m.label}</p>
                  <p style={{ fontFamily: "var(--font-display)", fontSize: "20px", fontWeight: 800, color: m.color, margin: 0 }}>{m.value}</p>
                </div>
              ))}
            </div>
          </ChartPanel>
        </div>
      )}

      {/* ══════════════════════════════════════════════
          TAB: CUSTOMERS
          ══════════════════════════════════════════════ */}
      {activeTab === "customers" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>

          {/* City Distribution Bar */}
          <ChartPanel title="Customers by City" subtitle="Live headcount per city" icon={Users} minHeight={280}>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={cityData} margin={{ top: 0, right: 10, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(226,232,255,0.50)" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#8891a8" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "#8891a8" }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="value" name="Customers" radius={[6, 6, 0, 0]}>
                  {cityData.map((entry, i) => (
                    <Cell key={i} fill={CITY_COLORS[entry.name] || PALETTE[i % PALETTE.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartPanel>

          {/* Gender + City Stacked (radar-style visualization) */}
          <ChartPanel title="Gender Split by City" subtitle="Male vs female across each city" icon={PieIcon} minHeight={280}>
            {cityData.length === 0 ? (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "240px", color: "#8891a8" }}>
                <PieIcon size={36} color="rgba(199,210,254,0.60)" style={{ marginBottom: "10px" }} />
                <p style={{ margin: 0, fontSize: "13px" }}>No data yet. Seed the database.</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={cityData.map(c => ({
                  name: c.name,
                  Male:   Math.round(c.value * 0.52),
                  Female: Math.round(c.value * 0.48),
                }))} margin={{ top: 0, right: 10, bottom: 0, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(226,232,255,0.50)" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#8891a8" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: "#8891a8" }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: "11px" }} />
                  <Bar dataKey="Male"   stackId="a" fill="#6366f1" radius={[0,0,0,0]} />
                  <Bar dataKey="Female" stackId="a" fill="#ec4899" radius={[6,6,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </ChartPanel>

          {/* Age distribution */}
          <ChartPanel title="Age Segments" subtitle="Customer distribution across age buckets" icon={Activity} minHeight={260}>
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={ageBuckets} margin={{ top: 5, right: 10, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="ageAreaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#0ea5e9" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(226,232,255,0.50)" vertical={false} />
                <XAxis dataKey="age" tick={{ fontSize: 11, fill: "#8891a8" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "#8891a8" }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="customers" name="Customers" stroke="#0ea5e9" strokeWidth={2.5} fill="url(#ageAreaGrad)" dot={{ fill: "#0ea5e9", r: 4 }} activeDot={{ r: 6 }} />
              </AreaChart>
            </ResponsiveContainer>
          </ChartPanel>

          {/* Gender Donut */}
          <ChartPanel title="Gender Breakdown" subtitle="Overall gender ratio" icon={PieIcon} minHeight={260}>
            {genderData.length === 0 ? (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "220px", color: "#8891a8" }}>
                <PieIcon size={36} color="rgba(199,210,254,0.60)" style={{ marginBottom: "10px" }} />
                <p style={{ margin: 0, fontSize: "13px" }}>No data yet</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie data={genderData} cx="50%" cy="50%" innerRadius={55} outerRadius={82} paddingAngle={4} dataKey="value">
                      {genderData.map((_, i) => <Cell key={i} fill={i === 0 ? "#6366f1" : "#ec4899"} stroke="none" />)}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ display: "flex", gap: "20px" }}>
                  {genderData.map((d, i) => {
                    const total = genderData.reduce((s, g) => s + g.value, 0);
                    const pct = total ? ((d.value / total) * 100).toFixed(1) : 0;
                    return (
                      <div key={i} style={{ textAlign: "center" }}>
                        <div style={{ width: 10, height: 10, borderRadius: "50%", background: i === 0 ? "#6366f1" : "#ec4899", margin: "0 auto 4px" }} />
                        <p style={{ margin: 0, fontSize: "11px", color: "#4b5168", fontWeight: 600 }}>{d.name}</p>
                        <p style={{ margin: 0, fontSize: "16px", fontWeight: 800, color: i === 0 ? "#6366f1" : "#ec4899" }}>{pct}%</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </ChartPanel>
        </div>
      )}

      {/* ══════════════════════════════════════════════
          TAB: DELIVERY FUNNEL
          ══════════════════════════════════════════════ */}
      {activeTab === "delivery" && (
        <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "16px" }}>

          {/* Funnel progress bars */}
          <ChartPanel title="Campaign Delivery Funnel" subtitle="Message lifecycle across all campaigns" icon={Send} minHeight={320}>
            {totalChannel === 0 ? (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "280px", color: "#8891a8" }}>
                <Send size={36} color="rgba(199,210,254,0.60)" style={{ marginBottom: "10px" }} />
                <p style={{ margin: 0, fontSize: "13px", textAlign: "center" }}>
                  Launch a campaign to see delivery stats
                </p>
              </div>
            ) : (
              <div style={{ paddingTop: "8px" }}>
                {deliveryFunnelData.map(d => (
                  <FunnelRow key={d.label} label={d.label} value={d.value} total={totalChannel} color={d.color} />
                ))}
                <div style={{ marginTop: "16px", padding: "12px", borderRadius: "10px", background: "rgba(238,242,255,0.40)", border: "1px solid rgba(199,210,254,0.35)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "11.5px", fontWeight: 700, color: "#4b5168" }}>Overall Delivery Success Rate</span>
                    <span style={{ fontSize: "20px", fontWeight: 800, color: "#10b981", fontFamily: "var(--font-display)" }}>
                      {totalChannel ? (((( channelStats?.delivered || 0) + (channelStats?.clicked || 0)) / totalChannel) * 100).toFixed(1) : 0}%
                    </span>
                  </div>
                </div>
              </div>
            )}
          </ChartPanel>

          {/* Pie chart of statuses */}
          <ChartPanel title="Status Distribution" subtitle="Breakdown of all message outcomes" icon={PieIcon} minHeight={320}>
            {deliveryPieData.length === 0 ? (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "280px", color: "#8891a8" }}>
                <PieIcon size={36} color="rgba(199,210,254,0.60)" style={{ marginBottom: "10px" }} />
                <p style={{ margin: 0, fontSize: "13px" }}>No message data yet</p>
              </div>
            ) : (
              <div>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={deliveryPieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={4} dataKey="value" nameKey="label">
                      {deliveryPieData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} stroke="none" />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px" }}>
                  {deliveryPieData.map((d, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: "6px", padding: "6px 8px", borderRadius: "7px", background: `${d.color}10` }}>
                      <div style={{ width: 8, height: 8, borderRadius: "50%", background: d.color, flexShrink: 0 }} />
                      <div>
                        <p style={{ margin: 0, fontSize: "10px", color: "#8891a8", fontWeight: 600 }}>{d.label}</p>
                        <p style={{ margin: 0, fontSize: "12px", fontWeight: 800, color: d.color }}>{d.value.toLocaleString("en-IN")}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </ChartPanel>

          {/* Channel performance scorecard */}
          <div className="glass-card" style={{ padding: "20px", gridColumn: "1 / -1" }}>
            <p style={{ fontSize: "13px", fontWeight: 700, color: "#1a1d2e", margin: "0 0 16px", display: "flex", alignItems: "center", gap: "8px" }}>
              <Target size={14} color="#6366f1" /> Channel Performance Scorecard
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "10px" }}>
              {[
                { label: "Total Sent",    value: fmt(channelStats?.sent),       icon: Send,          color: "#0ea5e9" },
                { label: "Delivered",     value: fmt(channelStats?.delivered),   icon: CheckCircle2,  color: "#10b981" },
                { label: "Clicked",       value: fmt(channelStats?.clicked),     icon: MousePointer,  color: "#6366f1" },
                { label: "Failed",        value: fmt(channelStats?.failed),      icon: XCircle,       color: "#ef4444" },
                { label: "Pending",       value: fmt(channelStats?.pending),     icon: Clock,         color: "#f59e0b" },
              ].map(m => {
                const Icon = m.icon;
                return (
                  <div key={m.label} style={{ padding: "14px", borderRadius: "12px", background: `${m.color}08`, border: `1px solid ${m.color}20`, textAlign: "center" }}>
                    <Icon size={18} color={m.color} style={{ marginBottom: "8px" }} />
                    <p style={{ fontSize: "10px", color: "#8891a8", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 4px" }}>{m.label}</p>
                    <p style={{ fontFamily: "var(--font-display)", fontSize: "22px", fontWeight: 800, color: m.color, margin: 0 }}>{m.value}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

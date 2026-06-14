import { useEffect, useState, useCallback } from "react";
import toast, { Toaster } from "react-hot-toast";
import {
  Megaphone, Plus, Rocket, BarChart3, History,
  Eye, RefreshCw, X, Users, CheckCircle2,
  XCircle, TrendingUp, Send, Clock, Zap,
  Calculator, DollarSign, Target, ChevronRight,
  ArrowRight,
} from "lucide-react";
import {
  createCampaign, previewSegment, getCampaignHistory,
  launchCampaign, getCampaignStats,
} from "../services/api";
import EmptyState from "../components/EmptyState";

/* ── Tab definitions ─────────────────────────────────────── */
const TABS = [
  { id: "create",  label: "Create Campaign", icon: Plus      },
  { id: "history", label: "Campaign History", icon: History  },
  { id: "stats",   label: "Analytics",        icon: BarChart3 },
  { id: "roi",     label: "ROI Calculator",   icon: Calculator},
];

/* ── Pipeline Stage Tracker ─────────────────────────────── */
const PIPELINE_STAGES = [
  { id: "draft",    label: "Draft",    icon: Clock,         color: "#8891a8", activeGrad: "#8891a8" },
  { id: "targeted", label: "Targeted", icon: Users,         color: "#0ea5e9", activeGrad: "#0ea5e9" },
  { id: "audited",  label: "Audited",  icon: CheckCircle2,  color: "#f59e0b", activeGrad: "#f59e0b" },
  { id: "launched", label: "Launched", icon: Rocket,        color: "#10b981", activeGrad: "#10b981" },
];

function getPipelineStage(campaign) {
  if (campaign.sent > 0 || campaign.launched) return "launched";
  if (campaign.audience_size > 0) return "audited";
  if (campaign.segment_query)     return "targeted";
  return "draft";
}

function PipelineTracker({ stageId }) {
  const currentIdx = PIPELINE_STAGES.findIndex((s) => s.id === stageId);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0", width: "100%" }}>
      {PIPELINE_STAGES.map((stage, i) => {
        const done    = i < currentIdx;
        const current = i === currentIdx;
        const Icon    = stage.icon;
        return (
          <div key={stage.id} style={{ display: "flex", alignItems: "center", flex: 1 }}>
            <div style={{
              display: "flex", flexDirection: "column", alignItems: "center", gap: "3px",
            }}>
              <div style={{
                width: 24, height: 24, borderRadius: "50%",
                background: done || current ? stage.activeGrad : "rgba(226,232,255,0.70)",
                display: "flex", alignItems: "center", justifyContent: "center",
                border: current ? `2px solid ${stage.color}` : "none",
                boxShadow: current ? `0 0 10px ${stage.color}50` : "none",
                transition: "all 0.3s ease",
                flexShrink: 0,
              }}>
                <Icon size={11} color={done || current ? "white" : "#b9bece"} />
              </div>
              <span style={{
                fontSize: "8.5px", fontWeight: current ? 700 : 500,
                color: current ? stage.color : done ? "#4b5168" : "#b9bece",
                whiteSpace: "nowrap",
                transition: "all 0.3s ease",
              }}>
                {stage.label}
              </span>
            </div>
            {i < PIPELINE_STAGES.length - 1 && (
              <div style={{
                flex: 1, height: "2px", margin: "0 2px",
                marginBottom: "14px",
                background: done
                  ? `linear-gradient(to right, ${PIPELINE_STAGES[i].color}80, ${PIPELINE_STAGES[i+1].color}80)`
                  : "rgba(226,232,255,0.60)",
                transition: "background 0.4s ease",
              }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ── Summary chip ────────────────────────────────────────── */
function SummaryChip({ label, value, icon: Icon, color, gradient }) {
  return (
    <div className="glass-card" style={{
      padding: "14px 16px", display: "flex", alignItems: "center", gap: "10px",
      transition: "all 0.2s ease",
    }}
      onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; }}
    >
      <div style={{
        width: 36, height: 36, borderRadius: "10px",
        background: gradient, display: "flex", alignItems: "center", justifyContent: "center",
        boxShadow: `0 4px 10px ${color}30`, flexShrink: 0,
      }}>
        <Icon size={16} color="white" />
      </div>
      <div>
        <p style={{ fontSize: "10px", fontWeight: 600, color: "#8891a8", textTransform: "uppercase", letterSpacing: "0.05em", margin: 0 }}>
          {label}
        </p>
        <p style={{ fontFamily: "var(--font-display)", fontSize: "18px", fontWeight: 800, color: "#1a1d2e", margin: 0 }}>
          {value ?? "—"}
        </p>
      </div>
    </div>
  );
}

/* ── Delivery progress bar ───────────────────────────────── */
function DeliveryBar({ pct, color = "#10b981" }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
      <div style={{ flex: 1, height: 5, borderRadius: 99, background: "rgba(226,232,255,0.55)", overflow: "hidden" }}>
        <div style={{
          width: `${Math.min(100, pct || 0)}%`, height: "100%", borderRadius: 99,
          background: color, transition: "width 0.8s ease",
          boxShadow: `0 0 6px ${color}60`,
        }} />
      </div>
      <span style={{ fontSize: "11px", fontWeight: 700, color: "#4b5168", flexShrink: 0 }}>
        {(pct || 0).toFixed(1)}%
      </span>
    </div>
  );
}

/* ── Status badge ────────────────────────────────────────── */
function StatusBadge({ launched }) {
  return launched ? (
    <span className="glass-badge glass-badge-success">
      <Rocket size={9} /> Launched
    </span>
  ) : (
    <span className="glass-badge glass-badge-neutral">
      <Clock size={9} /> Draft
    </span>
  );
}

/* ── ROI Calculator ──────────────────────────────────────── */
function ROICalculator() {
  const [inputs, setInputs] = useState({
    audienceSize: 1000,
    costPerMessage: 0.5,
    conversionRate: 5,
    avgOrderValue: 1200,
  });

  const set = (k, v) => setInputs((prev) => ({ ...prev, [k]: parseFloat(v) || 0 }));

  const totalCost      = inputs.audienceSize * inputs.costPerMessage;
  const conversions    = Math.round(inputs.audienceSize * (inputs.conversionRate / 100));
  const revenue        = conversions * inputs.avgOrderValue;
  const profit         = revenue - totalCost;
  const roi            = totalCost > 0 ? ((profit / totalCost) * 100).toFixed(1) : 0;
  const roiPositive    = profit >= 0;

  const FIELDS = [
    { key: "audienceSize",    label: "Audience Size",        icon: Users,       suffix: "contacts", step: 100, min: 1 },
    { key: "costPerMessage",  label: "Cost Per Message (₹)", icon: DollarSign,  suffix: "₹/msg",   step: 0.1, min: 0 },
    { key: "conversionRate",  label: "Conversion Rate",      icon: Target,      suffix: "%",       step: 0.5, min: 0, max: 100 },
    { key: "avgOrderValue",   label: "Avg. Order Value (₹)", icon: TrendingUp,  suffix: "₹",       step: 100, min: 0 },
  ];

  return (
    <div style={{ padding: "24px" }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>

        {/* Inputs */}
        <div>
          <p style={{ fontSize: "13px", fontWeight: 700, color: "#1a1d2e", margin: "0 0 16px", display: "flex", alignItems: "center", gap: "7px" }}>
            <Calculator size={14} color="#6366f1" /> Campaign Parameters
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            {FIELDS.map((f) => {
              const FIcon = f.icon;
              return (
                <div key={f.key}>
                  <label className="crm-label" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <FIcon size={11} color="#8891a8" /> {f.label}
                  </label>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <input
                      type="number"
                      value={inputs[f.key]}
                      onChange={(e) => set(f.key, e.target.value)}
                      step={f.step}
                      min={f.min}
                      max={f.max}
                      className="crm-input"
                      style={{ flex: 1 }}
                    />
                    <span style={{ fontSize: "11px", color: "#8891a8", whiteSpace: "nowrap", fontWeight: 500 }}>
                      {f.suffix}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Results */}
        <div>
          <p style={{ fontSize: "13px", fontWeight: 700, color: "#1a1d2e", margin: "0 0 16px", display: "flex", alignItems: "center", gap: "7px" }}>
            <BarChart3 size={14} color="#10b981" /> Projected Results
          </p>

          {/* ROI Hero */}
          <div style={{
            padding: "20px",
            borderRadius: "14px",
            background: roiPositive
              ? "rgba(220, 252, 231, 0.85)"
              : "rgba(254, 226, 226, 0.85)",
            border: `1px solid ${roiPositive ? "rgba(134,239,172,0.50)" : "rgba(252,165,165,0.50)"}`,
            marginBottom: "14px",
            textAlign: "center",
          }}>
            <p style={{ fontSize: "11px", fontWeight: 700, color: roiPositive ? "#15803d" : "#dc2626", textTransform: "uppercase", letterSpacing: "0.07em", margin: "0 0 4px" }}>
              ROI
            </p>
            <p style={{
              fontFamily: "var(--font-display)", fontSize: "36px", fontWeight: 800,
              color: roiPositive ? "#15803d" : "#dc2626", margin: 0,
              letterSpacing: "-0.03em",
            }}>
              {roiPositive ? "+" : ""}{roi}%
            </p>
            <p style={{ fontSize: "11.5px", color: roiPositive ? "#15803d" : "#dc2626", margin: "4px 0 0", fontWeight: 600 }}>
              {roiPositive ? "Profitable Campaign" : "Campaign at a Loss"}
            </p>
          </div>

          {/* Metrics breakdown */}
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {[
              { label: "Campaign Cost",     val: `₹${totalCost.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, color: "#ef4444", bg: "rgba(254,226,226,0.60)" },
              { label: "Expected Conversions", val: conversions.toLocaleString("en-IN"),    color: "#6366f1", bg: "rgba(238,242,255,0.60)" },
              { label: "Projected Revenue", val: `₹${revenue.toLocaleString("en-IN")}`,    color: "#10b981", bg: "rgba(220,252,231,0.60)" },
              { label: "Net Profit",        val: `${profit >= 0 ? "+" : ""}₹${Math.abs(profit).toLocaleString("en-IN")}`, color: profit >= 0 ? "#10b981" : "#ef4444", bg: profit >= 0 ? "rgba(220,252,231,0.60)" : "rgba(254,226,226,0.60)" },
            ].map((m) => (
              <div key={m.label} style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "8px 12px", borderRadius: "8px",
                background: m.bg,
                border: `1px solid ${m.color}20`,
              }}>
                <span style={{ fontSize: "12px", color: "#4b5168", fontWeight: 500 }}>{m.label}</span>
                <span style={{ fontSize: "13px", fontWeight: 800, color: m.color, fontFamily: "var(--font-display)" }}>{m.val}</span>
              </div>
            ))}
          </div>

          {/* Conversion funnel visualization */}
          <div style={{ marginTop: "14px", padding: "12px", borderRadius: "10px", background: "rgba(238,242,255,0.40)", border: "1px solid rgba(199,210,254,0.35)" }}>
            <p style={{ fontSize: "10.5px", fontWeight: 700, color: "#8891a8", margin: "0 0 8px", textTransform: "uppercase", letterSpacing: "0.06em" }}>
              Conversion Flow
            </p>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", justifyContent: "space-between" }}>
              {[
                { label: "Sent", val: inputs.audienceSize, color: "#6366f1" },
                { label: "Opens (est.)", val: Math.round(inputs.audienceSize * 0.35), color: "#0ea5e9" },
                { label: "Converts", val: conversions, color: "#10b981" },
              ].map((step, i) => (
                <div key={step.label} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <div style={{ textAlign: "center" }}>
                    <p style={{ fontFamily: "var(--font-display)", fontSize: "14px", fontWeight: 800, color: step.color, margin: 0 }}>
                      {step.val.toLocaleString("en-IN")}
                    </p>
                    <p style={{ fontSize: "9.5px", color: "#8891a8", margin: 0 }}>{step.label}</p>
                  </div>
                  {i < 2 && <ArrowRight size={12} color="#b9bece" />}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   MAIN CAMPAIGNS PAGE
   ═══════════════════════════════════════════════════════ */
export default function Campaigns() {
  const [tab,           setTab]           = useState("create");
  const [history,       setHistory]       = useState([]);
  const [histLoading,   setHistLoading]   = useState(true);
  const [selectedStats, setSelectedStats] = useState(null);
  const [statsLoading,  setStatsLoading]  = useState(false);

  const EMPTY_FORM = { name: "", segment_query: "", message_template: "", launch_date: "" };
  const [form,         setForm]         = useState(EMPTY_FORM);
  const [creating,     setCreating]     = useState(false);
  const [previewing,   setPreviewing]   = useState(false);
  const [audienceSize, setAudienceSize] = useState(null);
  const [launching,    setLaunching]    = useState(null);

  const loadHistory = useCallback(async () => {
    setHistLoading(true);
    try {
      const res = await getCampaignHistory();
      setHistory(res.data || []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load campaign history.");
    } finally {
      setHistLoading(false);
    }
  }, []);

  useEffect(() => { loadHistory(); }, [loadHistory]);
  
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const eventName = params.get("event");
    const launchDate = params.get("date");
    if (eventName || launchDate) {
      setForm({
        name: eventName ? `${eventName} Campaign Outreach` : "",
        segment_query: "",
        message_template: "",
        launch_date: launchDate || "",
      });
      setTab("create");
    }
  }, []);

  const handlePreview = async () => {
    if (!form.segment_query.trim()) { toast.error("Enter a segment query to preview audience."); return; }
    try {
      setPreviewing(true);
      const res = await previewSegment({ segment_query: form.segment_query });
      setAudienceSize(res.data.audience_size);
      toast.success(`Audience size: ${res.data.audience_size} customers`);
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Preview failed.");
    } finally {
      setPreviewing(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.segment_query.trim() || !form.message_template.trim()) {
      toast.error("All fields are required.");
      return;
    }
    try {
      setCreating(true);
      await createCampaign({
        name: form.name,
        segment_query: form.segment_query,
        message_template: form.message_template
      });
      toast.success("Campaign created successfully!");
      setForm(EMPTY_FORM);
      setAudienceSize(null);
      loadHistory();
      setTab("history");
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Failed to create campaign.");
    } finally {
      setCreating(false);
    }
  };

  const handleLaunch = async (campaignId, campaignName) => {
    try {
      setLaunching(campaignId);
      const res = await launchCampaign(campaignId);
      toast.success(`🚀 "${campaignName}" launched! ${res.data.messages_created ?? res.data.audience_size} messages queued.`, { duration: 4000 });
      loadHistory();
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Launch failed.");
    } finally {
      setLaunching(null);
    }
  };

  const handleViewStats = async (campaignId) => {
    try {
      setStatsLoading(true);
      setTab("stats");
      const res = await getCampaignStats(campaignId);
      setSelectedStats(res.data);
    } catch (err) {
      toast.error("Failed to load analytics.");
    } finally {
      setStatsLoading(false);
    }
  };

  const totalAudience = history.reduce((s, c) => s + (c.audience_size || 0), 0);
  const totalSent     = history.reduce((s, c) => s + (c.sent || 0), 0);
  const totalFailed   = history.reduce((s, c) => s + (c.failed || 0), 0);
  const launched      = history.filter((c) => c.sent > 0 || c.launched).length;

  return (
    <>
      <Toaster position="top-right" toastOptions={{
        style: { fontFamily: "var(--font-sans)", fontSize: "13px", border: "1px solid rgba(226,232,255,0.70)", boxShadow: "var(--shadow-panel)", background: "rgba(255,255,255,0.95)", backdropFilter: "blur(12px)" },
      }} />

      {/* ── Page Header ─────────────────────────────── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
        <div>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: "18px", fontWeight: 800, color: "#1a1d2e", margin: "0 0 2px", letterSpacing: "-0.02em" }}>
            Campaign Engine
          </h1>
          <p style={{ fontSize: "12px", color: "#8891a8", margin: 0 }}>
            Create segments · Launch campaigns · Track delivery · Project ROI
          </p>
        </div>
        <button onClick={loadHistory} className="glass-btn-secondary" style={{ fontSize: "12.5px" }}>
          <RefreshCw size={13} style={{ animation: histLoading ? "spin 1s linear infinite" : "none" }} />
          Refresh
        </button>
      </div>

      {/* ── Summary chips ────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px", marginBottom: "16px" }}>
        <SummaryChip label="Total Campaigns" value={history.length}               icon={Megaphone}   color="#2563eb" gradient="#2563eb" />
        <SummaryChip label="Launched"         value={launched}                    icon={Rocket}      color="#10b981" gradient="#10b981"   />
        <SummaryChip label="Messages Sent"    value={totalSent.toLocaleString()}  icon={Send}        color="#0ea5e9" gradient="#0ea5e9"   />
        <SummaryChip label="Failed"           value={totalFailed.toLocaleString()} icon={XCircle}   color="#ef4444" gradient="#ef4444"   />
      </div>

      {/* ── Tab Bar + Content ────────────────────────── */}
      <div className="glass-card" style={{ padding: 0, overflow: "hidden" }}>
        {/* Glass tab bar */}
        <div style={{
          display: "flex",
          borderBottom: "1px solid rgba(226,232,255,0.50)",
          background: "rgba(248,249,254,0.60)",
        }}>
          {TABS.map((t) => {
            const Icon   = t.icon;
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                style={{
                  display: "flex", alignItems: "center", gap: "6px",
                  padding: "11px 18px",
                  border: "none",
                  background: active
                    ? "rgba(238,242,255,0.80)"
                    : "transparent",
                  backdropFilter: active ? "blur(8px)" : "none",
                  fontSize: "12.5px", fontWeight: active ? 700 : 500,
                  color: active ? "#6366f1" : "#4b5168",
                  borderBottom: active ? "2px solid #6366f1" : "2px solid transparent",
                  cursor: "pointer", transition: "all 0.15s ease",
                  marginBottom: "-1px",
                }}
              >
                <Icon size={13} />
                {t.label}
              </button>
            );
          })}
        </div>

        {/* ── Create Campaign ────────────────────────── */}
        {tab === "create" && (
          <form onSubmit={handleCreate} style={{ padding: "24px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "24px" }}>
              {/* Left: form fields */}
              <div>
                <p style={{ fontSize: "12px", fontWeight: 700, color: "#8891a8", textTransform: "uppercase", letterSpacing: "0.07em", margin: "0 0 14px" }}>
                  Campaign Details
                </p>

                <div style={{ marginBottom: "14px" }}>
                  <label className="crm-label" htmlFor="camp-name">Campaign Name <span style={{ color: "#ef4444" }}>*</span></label>
                  <input id="camp-name" className="crm-input"
                    placeholder="e.g. Summer 2025 Mumbai Outreach"
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  />
                </div>

                <div style={{ marginBottom: "14px" }}>
                  <label className="crm-label" htmlFor="camp-date">Targeted Launch Date</label>
                  <input id="camp-date" className="crm-input"
                    type="date"
                    value={form.launch_date || ""}
                    onChange={(e) => setForm((f) => ({ ...f, launch_date: e.target.value }))}
                  />
                </div>

                <div style={{ marginBottom: "8px" }}>
                  <label className="crm-label" htmlFor="camp-query">Segment Query <span style={{ color: "#ef4444" }}>*</span></label>
                  <input id="camp-query" className="crm-input"
                    placeholder='e.g. city="Mumbai" AND total_spent > 5000'
                    value={form.segment_query}
                    onChange={(e) => { setForm((f) => ({ ...f, segment_query: e.target.value })); setAudienceSize(null); }}
                  />
                </div>

                {/* Preview button */}
                <div style={{ display: "flex", gap: "8px", marginBottom: "14px" }}>
                  <button
                    type="button" onClick={handlePreview}
                    disabled={previewing || !form.segment_query.trim()}
                    className="glass-btn-secondary" style={{ fontSize: "12.5px" }}
                  >
                    {previewing ? (
                      <span style={{ width: 12, height: 12, border: "2px solid rgba(99,102,241,0.25)", borderTop: "2px solid #6366f1", borderRadius: "50%", animation: "spin 0.7s linear infinite", display: "inline-block" }} />
                    ) : <Eye size={13} />}
                    Preview Audience
                  </button>
                  {audienceSize !== null && (
                    <div style={{
                      display: "flex", alignItems: "center", gap: "6px",
                      padding: "6px 12px", borderRadius: "8px",
                      background: "rgba(238,242,255,0.80)", border: "1px solid rgba(199,210,254,0.60)",
                      fontSize: "12.5px", fontWeight: 600, color: "#4338ca",
                    }}>
                      <Users size={12} />
                      {audienceSize.toLocaleString()} in segment
                    </div>
                  )}
                </div>

                <div style={{ marginBottom: "20px" }}>
                  <label className="crm-label" htmlFor="camp-message">Message Template <span style={{ color: "#ef4444" }}>*</span></label>
                  <textarea id="camp-message" className="crm-input"
                    placeholder="Hi {name}, we have an exclusive offer just for you…"
                    value={form.message_template}
                    onChange={(e) => setForm((f) => ({ ...f, message_template: e.target.value }))}
                    style={{ height: "120px", resize: "vertical", lineHeight: 1.6 }}
                  />
                  <p style={{ fontSize: "11px", color: "#8891a8", margin: "4px 0 0" }}>
                    Use <code style={{ background: "rgba(238,242,255,0.80)", padding: "1px 5px", borderRadius: 3, border: "1px solid rgba(199,210,254,0.40)" }}>{"{name}"}</code> as customer name placeholder.
                  </p>
                </div>

                <div style={{ display: "flex", gap: "10px" }}>
                  <button id="create-campaign-submit" type="submit" disabled={creating} className="glass-btn-primary" style={{ padding: "10px 24px" }}>
                    {creating ? (
                      <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span style={{ width: 13, height: 13, border: "2px solid rgba(255,255,255,0.3)", borderTop: "2px solid #fff", borderRadius: "50%", animation: "spin 0.7s linear infinite", display: "inline-block" }} />
                        Creating…
                      </span>
                    ) : (
                      <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <Zap size={14} /> Create Campaign
                      </span>
                    )}
                  </button>
                  <button type="button" onClick={() => { setForm(EMPTY_FORM); setAudienceSize(null); }} className="glass-btn-secondary">
                    Clear
                  </button>
                </div>
              </div>

              {/* Right: pipeline preview + tips */}
              <div>
                <p style={{ fontSize: "12px", fontWeight: 700, color: "#8891a8", textTransform: "uppercase", letterSpacing: "0.07em", margin: "0 0 14px" }}>
                  Campaign Pipeline
                </p>

                {/* Stage tracker preview */}
                <div style={{ padding: "16px", borderRadius: "12px", background: "rgba(238,242,255,0.40)", border: "1px solid rgba(199,210,254,0.35)", marginBottom: "14px" }}>
                  <p style={{ fontSize: "11px", color: "#8891a8", margin: "0 0 12px", fontWeight: 500 }}>Your campaign will progress through these stages:</p>
                  <PipelineTracker stageId={audienceSize !== null ? "audited" : form.segment_query ? "targeted" : "draft"} />
                </div>

                {/* Query helper chips */}
                <div>
                  <p style={{ fontSize: "11.5px", fontWeight: 600, color: "#1a1d2e", margin: "0 0 8px" }}>Quick Query Templates</p>
                  {[
                    { label: "High spenders", query: 'total_spent > 10000' },
                    { label: "Mumbai customers", query: 'city="Mumbai"' },
                    { label: "Young & active", query: 'age < 35 AND total_orders > 2' },
                  ].map((q) => (
                    <button key={q.label}
                      type="button"
                      onClick={() => { setForm((f) => ({ ...f, segment_query: q.query })); setAudienceSize(null); }}
                      style={{
                        display: "flex", alignItems: "center", justifyContent: "space-between",
                        width: "100%", padding: "8px 12px", marginBottom: "6px",
                        borderRadius: "8px",
                        background: "rgba(255,255,255,0.65)",
                        border: "1px solid rgba(196,196,255,0.40)",
                        cursor: "pointer", transition: "all 0.14s ease",
                        textAlign: "left",
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(238,242,255,0.80)"; e.currentTarget.style.borderColor = "rgba(165,180,252,0.50)"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.65)"; e.currentTarget.style.borderColor = "rgba(196,196,255,0.40)"; }}
                    >
                      <div>
                        <p style={{ fontSize: "12px", fontWeight: 600, color: "#1a1d2e", margin: 0 }}>{q.label}</p>
                        <p style={{ fontSize: "10.5px", color: "#8891a8", margin: 0, fontFamily: "var(--font-mono)" }}>{q.query}</p>
                      </div>
                      <ChevronRight size={13} color="#8891a8" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </form>
        )}

        {/* ── Campaign History ────────────────────────── */}
        {tab === "history" && (
          !histLoading && history.length === 0 ? (
            <EmptyState
              iconName="Megaphone"
              title="No Outreach Campaigns"
              description="Coordinate target segments and launch email, SMS, and WhatsApp broadcasts to engage customers. Build your target query in the Create tab or connect live customer data."
              actionText="Create A Campaign"
              onAction={() => setTab("create")}
            />
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table className="crm-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Campaign</th>
                    <th>Pipeline</th>
                    <th>Status</th>
                    <th>Audience</th>
                    <th>Sent</th>
                    <th>Success</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {histLoading ? (
                    Array.from({ length: 6 }).map((_, i) => (
                      <tr key={i}>
                        {Array.from({ length: 8 }).map((_, j) => (
                          <td key={j} style={{ padding: "11px 14px" }}>
                            <div style={{ height: 12, borderRadius: 4, width: j === 2 ? "120px" : "60%",
                              background: "linear-gradient(90deg, rgba(238,242,255,0.60) 25%, rgba(199,210,254,0.40) 50%, rgba(238,242,255,0.60) 75%)",
                              backgroundSize: "300% 100%", animation: "shimmer 1.5s infinite",
                            }} />
                          </td>
                        ))}
                      </tr>
                    ))
                  ) : (
                    history.map((c, i) => {
                      const successRate = c.audience_size > 0 ? ((c.sent / c.audience_size) * 100).toFixed(1) : 0;
                      const isLaunched  = (c.audience_size > 0 && c.sent >= 0) || c.launched;
                      const isLaunching = launching === c.campaign_id;
                      const stage       = getPipelineStage(c);

                      return (
                        <tr key={c.campaign_id}>
                          <td style={{ color: "#8891a8", fontSize: "12px" }}>{i + 1}</td>
                          <td>
                            <p style={{ fontWeight: 600, color: "#1a1d2e", margin: "0 0 2px", fontSize: "13px" }}>{c.campaign_name}</p>
                            <p style={{ fontSize: "10.5px", color: "#8891a8", margin: 0, maxWidth: "180px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {c.segment_query || "—"}
                            </p>
                          </td>
                          <td style={{ minWidth: "140px" }}>
                            <PipelineTracker stageId={stage} />
                          </td>
                          <td><StatusBadge launched={isLaunched} /></td>
                          <td style={{ fontWeight: 600, color: "#1a1d2e" }}>
                            {(c.audience_size || 0).toLocaleString()}
                          </td>
                          <td>
                            <span className="glass-badge glass-badge-success">{(c.sent || 0).toLocaleString()}</span>
                          </td>
                          <td style={{ minWidth: "110px" }}>
                            <DeliveryBar pct={Number(successRate)} />
                          </td>
                          <td>
                            <div style={{ display: "flex", gap: "5px" }}>
                              <button
                                id={`launch-campaign-${c.campaign_id}`}
                                disabled={isLaunched || isLaunching}
                                onClick={() => handleLaunch(c.campaign_id, c.campaign_name)}
                                style={{
                                  display: "flex", alignItems: "center", gap: "4px",
                                  padding: "4px 9px", borderRadius: "6px", fontSize: "11.5px",
                                  fontWeight: 600, cursor: isLaunched ? "not-allowed" : "pointer",
                                  border: isLaunched ? "1px solid rgba(226,232,255,0.60)" : "1px solid rgba(199,210,254,0.60)",
                                  background: isLaunched ? "rgba(248,249,254,0.60)" : "rgba(238,242,255,0.80)",
                                  color: isLaunched ? "#8891a8" : "#4338ca",
                                  backdropFilter: "blur(8px)",
                                  transition: "all 0.13s ease",
                                }}
                                onMouseEnter={(e) => { if (!isLaunched) { e.currentTarget.style.background = "#2563eb"; e.currentTarget.style.color = "#fff"; e.currentTarget.style.border = "1px solid transparent"; }}}
                                onMouseLeave={(e) => { if (!isLaunched) { e.currentTarget.style.background = "rgba(238,242,255,0.80)"; e.currentTarget.style.color = "#4338ca"; e.currentTarget.style.border = "1px solid rgba(199,210,254,0.60)"; }}}
                              >
                                {isLaunching ? (
                                  <span style={{ width: 10, height: 10, border: "2px solid rgba(99,102,241,0.30)", borderTop: "2px solid #6366f1", borderRadius: "50%", animation: "spin 0.7s linear infinite", display: "inline-block" }} />
                                ) : <Rocket size={10} />}
                                {isLaunched ? "Launched" : "Launch"}
                              </button>
                              <button
                                onClick={() => handleViewStats(c.campaign_id)}
                                style={{
                                  display: "flex", alignItems: "center", gap: "4px",
                                  padding: "4px 9px", borderRadius: "6px", fontSize: "11.5px",
                                  fontWeight: 600, cursor: "pointer",
                                  border: "1px solid rgba(196,196,255,0.40)",
                                  background: "rgba(255,255,255,0.65)", color: "#4b5168",
                                  backdropFilter: "blur(8px)",
                                  transition: "all 0.13s ease",
                                }}
                                onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(238,242,255,0.80)"; e.currentTarget.style.color = "#1a1d2e"; }}
                                onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.65)"; e.currentTarget.style.color = "#4b5168"; }}
                              >
                                <BarChart3 size={10} /> Stats
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )
        )}

        {/* ── Analytics / Stats ───────────────────────── */}
        {tab === "stats" && (
          <div style={{ padding: "24px" }}>
            {statsLoading ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "14px", maxWidth: "480px" }}>
                {[1,2,3,4].map((i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between" }}>
                    <div style={{ height: 14, width: "40%", borderRadius: 4, background: "rgba(238,242,255,0.60)", animation: "shimmer 1.5s infinite", backgroundSize: "300% 100%" }} />
                    <div style={{ height: 14, width: "25%", borderRadius: 4, background: "rgba(238,242,255,0.60)", animation: "shimmer 1.5s infinite", backgroundSize: "300% 100%" }} />
                  </div>
                ))}
              </div>
            ) : !selectedStats ? (
              <div style={{ textAlign: "center", padding: "40px" }}>
                <BarChart3 size={40} color="rgba(199,210,254,0.70)" style={{ marginBottom: "14px" }} />
                <p style={{ fontSize: "13.5px", color: "#8891a8", margin: 0 }}>
                  Select a campaign from the <strong>History</strong> tab and click <strong>Stats</strong> to view analytics.
                </p>
              </div>
            ) : (
              <div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
                  <div>
                    <h2 style={{ fontFamily: "var(--font-display)", fontSize: "16px", fontWeight: 800, color: "#1a1d2e", margin: "0 0 3px" }}>
                      {selectedStats.campaign_name}
                    </h2>
                    <p style={{ fontSize: "12px", color: "#8891a8", margin: 0 }}>Campaign delivery analytics</p>
                  </div>
                  <button onClick={() => setSelectedStats(null)} className="glass-btn-secondary" style={{ fontSize: "12px" }}>
                    <X size={12} /> Clear
                  </button>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px", marginBottom: "20px" }}>
                  {[
                    { label: "Audience", val: (selectedStats.audience_size || 0).toLocaleString(), color: "#2563eb", gradient: "#2563eb", icon: Users },
                    { label: "Sent",     val: (selectedStats.sent    || 0).toLocaleString(), color: "#10b981", gradient: "#10b981", icon: CheckCircle2 },
                    { label: "Failed",   val: (selectedStats.failed  || 0).toLocaleString(), color: "#ef4444", gradient: "#ef4444", icon: XCircle },
                  ].map(({ label, val, color, gradient, icon: Icon }) => (
                    <div key={label} className="glass-card" style={{ padding: "16px 18px", display: "flex", alignItems: "center", gap: "12px" }}>
                      <div style={{ width: 36, height: 36, borderRadius: "10px", background: gradient, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 4px 10px ${color}30` }}>
                        <Icon size={16} color="white" />
                      </div>
                      <div>
                        <p style={{ fontSize: "10px", fontWeight: 600, color: "#8891a8", textTransform: "uppercase", letterSpacing: "0.05em", margin: 0 }}>{label}</p>
                        <p style={{ fontFamily: "var(--font-display)", fontSize: "20px", fontWeight: 800, color: "#1a1d2e", margin: 0 }}>{val}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="glass-card" style={{ padding: "18px 20px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
                    <TrendingUp size={14} color="#10b981" />
                    <p style={{ fontSize: "13px", fontWeight: 700, color: "#1a1d2e", margin: 0 }}>Delivery Success Rate</p>
                    <span style={{ marginLeft: "auto", fontFamily: "var(--font-display)", fontSize: "22px", fontWeight: 800, color: "#10b981" }}>
                      {selectedStats.success_rate}%
                    </span>
                  </div>
                  <div style={{ width: "100%", height: "8px", borderRadius: 99, background: "rgba(226,232,255,0.55)", overflow: "hidden" }}>
                    <div style={{
                      width: `${Math.min(100, selectedStats.success_rate || 0)}%`,
                      height: "100%", borderRadius: 99,
                      background: selectedStats.success_rate >= 80
                        ? "linear-gradient(90deg, #10b981, #34d399)"
                        : selectedStats.success_rate >= 50
                          ? "linear-gradient(90deg, #f59e0b, #fbbf24)"
                          : "linear-gradient(90deg, #ef4444, #f87171)",
                      boxShadow: "0 0 8px rgba(16,185,129,0.40)",
                      transition: "width 0.8s ease",
                    }} />
                  </div>
                  <p style={{ fontSize: "11.5px", color: "#8891a8", margin: "8px 0 0" }}>
                    {selectedStats.sent} of {selectedStats.audience_size} messages successfully delivered.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── ROI Calculator ──────────────────────────── */}
        {tab === "roi" && <ROICalculator />}
      </div>

      <style>{`
        @keyframes shimmer { 0% { background-position: -300% 0; } 100% { background-position: 300% 0; } }
        @keyframes spin    { to { transform: rotate(360deg); } }
      `}</style>
    </>
  );
}
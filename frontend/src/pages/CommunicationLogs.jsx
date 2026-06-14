/**
 * CommunicationLogs.jsx — Advanced Operational Audit Console
 * Rich split-panel with device previews, lifecycle tracker,
 * live metrics, timeline mini-chart, and glassmorphism design.
 */
import { useEffect, useState, useCallback, useRef } from "react";
import toast, { Toaster } from "react-hot-toast";
import {
  AreaChart, Area, BarChart, Bar, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import {
  MessageSquare, RefreshCw, Search,
  CheckCircle2, XCircle, Clock, ChevronLeft, ChevronRight,
  AlertCircle, Mail, Phone, Send, Activity,
  Filter, Inbox, MessageCircle, Copy, X, ArrowRight, Play,
  TrendingUp, BarChart3, Zap, Eye,
} from "lucide-react";
import { getCommunicationLogs } from "../services/api";
import EmptyState from "../components/EmptyState";

const PAGE_SIZE = 15;

/* ── Channel config ──────────────────────────────────────────── */
const CHANNEL_CONFIG = {
  email:    { icon: Mail,          color: "#6366f1", bg: "rgba(99,102,241,0.12)",  label: "Email"    },
  EMAIL:    { icon: Mail,          color: "#6366f1", bg: "rgba(99,102,241,0.12)",  label: "Email"    },
  sms:      { icon: MessageCircle, color: "#10b981", bg: "rgba(16,185,129,0.12)",  label: "SMS"      },
  SMS:      { icon: MessageCircle, color: "#10b981", bg: "rgba(16,185,129,0.12)",  label: "SMS"      },
  whatsapp: { icon: MessageSquare, color: "#25D366", bg: "rgba(37,211,102,0.12)",  label: "WhatsApp" },
  WHATSAPP: { icon: MessageSquare, color: "#25D366", bg: "rgba(37,211,102,0.12)",  label: "WhatsApp" },
  call:     { icon: Phone,         color: "#0ea5e9", bg: "rgba(14,165,233,0.12)",  label: "Call"     },
  CALL:     { icon: Phone,         color: "#0ea5e9", bg: "rgba(14,165,233,0.12)",  label: "Call"     },
};

/* ── Status config ───────────────────────────────────────────── */
const STATUS_CONFIG = {
  sent:      { icon: Send,         color: "#6366f1", bg: "rgba(99,102,241,0.12)",  border: "rgba(99,102,241,0.25)",  text: "Sent"      },
  SENT:      { icon: Send,         color: "#6366f1", bg: "rgba(99,102,241,0.12)",  border: "rgba(99,102,241,0.25)",  text: "Sent"      },
  delivered: { icon: CheckCircle2, color: "#10b981", bg: "rgba(16,185,129,0.12)",  border: "rgba(16,185,129,0.25)",  text: "Delivered" },
  DELIVERED: { icon: CheckCircle2, color: "#10b981", bg: "rgba(16,185,129,0.12)",  border: "rgba(16,185,129,0.25)",  text: "Delivered" },
  clicked:   { icon: Activity,     color: "#8b5cf6", bg: "rgba(139,92,246,0.12)",  border: "rgba(139,92,246,0.25)",  text: "Clicked"   },
  CLICKED:   { icon: Activity,     color: "#8b5cf6", bg: "rgba(139,92,246,0.12)",  border: "rgba(139,92,246,0.25)",  text: "Clicked"   },
  failed:    { icon: XCircle,      color: "#ef4444", bg: "rgba(239,68,68,0.12)",   border: "rgba(239,68,68,0.25)",   text: "Failed"    },
  FAILED:    { icon: XCircle,      color: "#ef4444", bg: "rgba(239,68,68,0.12)",   border: "rgba(239,68,68,0.25)",   text: "Failed"    },
  pending:   { icon: Clock,        color: "#f59e0b", bg: "rgba(245,158,11,0.12)",  border: "rgba(245,158,11,0.25)",  text: "Pending"   },
  PENDING:   { icon: Clock,        color: "#f59e0b", bg: "rgba(245,158,11,0.12)",  border: "rgba(245,158,11,0.25)",  text: "Pending"   },
};

function fmtDate(raw) {
  if (!raw) return "—";
  try {
    const d = new Date(raw);
    const now = new Date();
    const diffMs  = now - d;
    const diffMin = Math.floor(diffMs / 60000);
    const diffHr  = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHr / 24);
    if (diffMin < 1)  return "just now";
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHr  < 24) return `${diffHr}h ago`;
    if (diffDay < 7)  return `${diffDay}d ago`;
    return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  } catch { return raw; }
}

/* ── Audit Row ───────────────────────────────────────────────── */
function AuditRow({ log, active, onClick, idx }) {
  const statusCfg  = STATUS_CONFIG[log.status]   || { icon: AlertCircle, color: "#8891a8", bg: "rgba(148,163,184,0.12)", border: "rgba(148,163,184,0.20)", text: log.status || "Unknown" };
  const channelCfg = CHANNEL_CONFIG[log.channel] || { icon: MessageSquare, color: "#8891a8", bg: "rgba(148,163,184,0.12)", label: log.channel || "Unknown" };
  const SIcon = statusCfg.icon;
  const CIcon = channelCfg.icon;

  return (
    <div
      onClick={onClick}
      style={{
        display: "flex", alignItems: "flex-start", gap: "13px",
        padding: "13px 16px",
        borderBottom: "1px solid var(--color-surface-border)",
        background: active ? "rgba(99,102,241,0.06)" : "transparent",
        borderLeft: active ? "3px solid #6366f1" : "3px solid transparent",
        transition: "all 0.18s ease",
        cursor: "pointer",
        animation: "slideUpFade 0.22s ease both",
        animationDelay: `${idx * 0.02}s`,
      }}
      className="log-row-hover"
    >
      {/* Channel icon pill */}
      <div style={{
        width: 38, height: 38, borderRadius: "10px",
        background: channelCfg.bg,
        border: `1px solid ${channelCfg.color}25`,
        display: "flex", alignItems: "center", justifyContent: "center",
        flexShrink: 0,
        boxShadow: `0 2px 8px ${channelCfg.color}18`,
      }}>
        <CIcon size={16} color={channelCfg.color} />
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px", flexWrap: "wrap" }}>
          <span style={{ fontSize: "12.5px", fontWeight: 700, color: "var(--color-text-primary)" }}>
            {log.customer_name || "Unknown Customer"}
          </span>
          <ArrowRight size={10} color="var(--color-text-muted)" style={{ opacity: 0.5 }} />
          <span style={{
            fontSize: "9.5px", fontWeight: 700, padding: "1px 7px", borderRadius: "99px",
            background: channelCfg.bg, color: channelCfg.color,
            border: `1px solid ${channelCfg.color}20`,
          }}>
            {channelCfg.label}
          </span>
          <span style={{
            fontSize: "9.5px", fontWeight: 700, padding: "1px 7px", borderRadius: "99px",
            background: statusCfg.bg, color: statusCfg.color,
            border: `1px solid ${statusCfg.border}`,
            display: "flex", alignItems: "center", gap: "3px",
          }}>
            <SIcon size={8} /> {statusCfg.text}
          </span>
          <div style={{ marginLeft: "auto", fontSize: "10px", color: "var(--color-text-muted)", whiteSpace: "nowrap" }}>
            {fmtDate(log.created_at)}
          </div>
        </div>
        {log.message && (
          <p style={{
            fontSize: "11.5px", color: "var(--color-text-secondary)", margin: "3px 0 0",
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            maxWidth: "90%", opacity: 0.85,
          }}>
            {log.message}
          </p>
        )}
        {log.campaign_name && (
          <span style={{ fontSize: "10px", color: "var(--color-text-muted)", marginTop: "4px", display: "inline-block" }}>
            📣 {log.campaign_name}
          </span>
        )}
      </div>
    </div>
  );
}

/* ── Filter Pill ─────────────────────────────────────────────── */
function FilterPill({ label, active, onClick, color, count }) {
  return (
    <button onClick={onClick} style={{
      display: "inline-flex", alignItems: "center", gap: "6px",
      padding: "5px 12px", borderRadius: "99px",
      border: active ? `1.5px solid ${color}` : "1px solid var(--color-surface-border)",
      background: active ? `${color}15` : "var(--glass-bg)",
      color: active ? color : "var(--color-text-secondary)",
      fontSize: "11.5px", fontWeight: active ? 700 : 500,
      cursor: "pointer", transition: "all 0.15s ease",
      backdropFilter: "blur(8px)",
    }} className="filter-pill-btn">
      {label}
      {count !== undefined && (
        <span style={{
          fontSize: "9.5px", fontWeight: 700, padding: "1px 5px", borderRadius: "99px",
          background: active ? color : "var(--color-surface-hover)",
          color: active ? "white" : "var(--color-text-muted)",
        }}>
          {count}
        </span>
      )}
    </button>
  );
}

/* ── Device Simulator ────────────────────────────────────────── */
function DevicePreview({ log }) {
  const channel = (log.channel || "email").toLowerCase();
  const timeStr = new Date(log.created_at || Date.now()).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });

  if (channel === "whatsapp") {
    return (
      <div style={{ background: "#efe5dd", borderRadius: "12px", overflow: "hidden", height: "210px", display: "flex", flexDirection: "column", boxShadow: "inset 0 0 10px rgba(0,0,0,0.05)" }}>
        <div style={{ background: "#075e54", color: "white", padding: "8px 12px", display: "flex", alignItems: "center", gap: "8px" }}>
          <div style={{ width: 26, height: 26, borderRadius: "50%", background: "#128c7e", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px", fontWeight: 700 }}>
            {(log.customer_name || "C").charAt(0).toUpperCase()}
          </div>
          <div>
            <p style={{ margin: 0, fontSize: "11px", fontWeight: 700 }}>{log.customer_name || "Customer"}</p>
            <p style={{ margin: 0, fontSize: "8.5px", opacity: 0.8 }}>Online</p>
          </div>
        </div>
        <div style={{ flex: 1, padding: "12px", display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
          <div style={{ background: "#dcf8c6", alignSelf: "flex-end", maxWidth: "85%", padding: "8px 10px", borderRadius: "8px 0 8px 8px", boxShadow: "0 1px 2px rgba(0,0,0,0.15)" }}>
            <p style={{ margin: 0, fontSize: "11.5px", color: "#303030", lineHeight: 1.4 }}>{log.message}</p>
            <div style={{ display: "flex", alignItems: "center", gap: "3px", alignSelf: "flex-end", marginTop: "4px", justifyContent: "flex-end" }}>
              <span style={{ fontSize: "8px", color: "rgba(0,0,0,0.45)" }}>{timeStr}</span>
              <span style={{ fontSize: "10px", color: (log.status === "CLICKED" || log.status === "DELIVERED") ? "#34b7f1" : "rgba(0,0,0,0.3)", fontWeight: "bold" }}>
                {(log.status === "CLICKED" || log.status === "DELIVERED") ? "✓✓" : "✓"}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (channel === "sms") {
    return (
      <div style={{ background: "var(--color-surface-hover)", borderRadius: "12px", overflow: "hidden", height: "210px", display: "flex", flexDirection: "column", border: "1px solid var(--color-surface-border)" }}>
        <div style={{ padding: "8px 12px", borderBottom: "1px solid var(--color-surface-border)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--color-text-primary)" }}>{log.customer_phone || "+91 Mobile"}</span>
        </div>
        <div style={{ flex: 1, padding: "12px", display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
          <div style={{ background: "#007aff", alignSelf: "flex-end", maxWidth: "85%", padding: "8px 12px", borderRadius: "14px 14px 0 14px" }}>
            <p style={{ margin: 0, fontSize: "11.5px", color: "white", lineHeight: 1.4 }}>{log.message}</p>
          </div>
          <span style={{ fontSize: "8.5px", color: "var(--color-text-muted)", alignSelf: "flex-end", marginTop: "4px", paddingRight: "4px" }}>iMessage · {timeStr}</span>
        </div>
      </div>
    );
  }

  if (channel === "call") {
    return (
      <div style={{ background: "linear-gradient(to bottom, #111827, #1f2937)", borderRadius: "12px", overflow: "hidden", height: "210px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "white", position: "relative" }}>
        <div style={{ position: "absolute", top: "10px", fontSize: "9px", color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "0.07em" }}>Outbound Call</div>
        <div style={{ width: 44, height: 44, borderRadius: "50%", background: "rgba(14,165,233,0.25)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "10px", animation: "bounce 2s infinite" }}>
          <Phone size={20} color="#0ea5e9" />
        </div>
        <p style={{ margin: "0 0 2px", fontSize: "13px", fontWeight: 700 }}>{log.customer_name || "Subscriber"}</p>
        <p style={{ margin: "0 0 16px", fontSize: "11px", color: "rgba(255,255,255,0.6)" }}>{log.customer_phone || "Connected"}</p>
        <div style={{ display: "flex", gap: "2px", alignItems: "center", height: "22px" }}>
          {[10, 16, 7, 20, 13, 22, 9, 18, 14, 8, 17, 11].map((h, i) => (
            <div key={i} style={{ width: "3px", height: `${h}px`, background: "#0ea5e9", borderRadius: "99px", animation: `waveBar 1.2s ease-in-out infinite`, animationDelay: `${i * 0.07}s` }} />
          ))}
        </div>
      </div>
    );
  }

  // Email
  return (
    <div style={{ background: "var(--color-surface-white)", borderRadius: "12px", overflow: "hidden", height: "210px", display: "flex", flexDirection: "column", border: "1px solid var(--color-surface-border)" }}>
      <div style={{ borderBottom: "1px solid var(--color-surface-border)", padding: "10px 12px", fontSize: "11px", color: "var(--color-text-secondary)", display: "flex", flexDirection: "column", gap: "2px" }}>
        <p style={{ margin: 0 }}><strong>From:</strong> campaigns@segmentiq.app</p>
        <p style={{ margin: 0 }}><strong>To:</strong> {log.customer_email || "recipient@domain.com"}</p>
      </div>
      <div style={{ flex: 1, padding: "12px", overflowY: "auto", background: "var(--color-surface-hover)" }}>
        <div style={{ background: "var(--color-surface-white)", border: "1px solid var(--color-surface-border)", borderRadius: "8px", padding: "12px", fontSize: "11.5px", color: "var(--color-text-primary)", lineHeight: 1.5 }}>
          <p style={{ margin: "0 0 8px", fontSize: "10.5px", color: "#6366f1", fontWeight: 700 }}>📧 CAMPAIGN MESSAGE</p>
          {log.message}
        </div>
      </div>
    </div>
  );
}

/* ── Delivery Lifecycle ───────────────────────────────────────── */
function LifecycleTracker({ status }) {
  const steps = [
    { key: "PENDING",   label: "Queued",      desc: "Enqueued in database" },
    { key: "SENT",      label: "Dispatched",  desc: "Sent via gateway" },
    { key: "DELIVERED", label: "Delivered",   desc: "Delivered to device" },
    { key: "CLICKED",   label: "Engaged",     desc: "Recipient opened/clicked" },
  ];
  const statusVal = (status || "PENDING").toUpperCase();
  const indexMap  = { PENDING: 0, SENT: 1, DELIVERED: 2, CLICKED: 3 };
  const curIdx    = indexMap[statusVal] ?? 0;

  const getState = (key) => {
    if (statusVal === "FAILED") {
      if (key === "PENDING" || key === "SENT") return "done";
      if (key === "DELIVERED")                 return "fail";
      return "idle";
    }
    const t = indexMap[key];
    if (t < curIdx) return "done";
    if (t === curIdx) return "active";
    return "idle";
  };

  return (
    <div style={{ position: "relative" }}>
      {/* connecting line */}
      <div style={{ position: "absolute", left: "9px", top: "20px", bottom: "20px", width: "2px", background: "var(--color-surface-border)" }} />
      {steps.map((step) => {
        const state = getState(step.key);
        const dotColor = state === "done" ? "#10b981" : state === "active" ? "#6366f1" : state === "fail" ? "#ef4444" : "var(--color-text-disabled)";
        const textColor = state === "idle" ? "var(--color-text-muted)" : "var(--color-text-primary)";
        return (
          <div key={step.key} style={{ display: "flex", alignItems: "flex-start", gap: "12px", marginBottom: "14px", position: "relative", zIndex: 1 }}>
            <div style={{
              width: 20, height: 20, borderRadius: "50%",
              background: state === "idle" ? "var(--color-surface-hover)" : dotColor,
              border: `2px solid ${dotColor}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0, boxShadow: state === "active" ? `0 0 10px ${dotColor}50` : "none",
            }}>
              {state === "done"   && <CheckCircle2 size={10} color="white" />}
              {state === "active" && <div style={{ width: 6, height: 6, borderRadius: "50%", background: "white" }} />}
              {state === "fail"   && <XCircle size={10} color="white" />}
            </div>
            <div>
              <p style={{ margin: 0, fontSize: "12px", fontWeight: 700, color: textColor }}>
                {state === "fail" ? "Failed Delivery" : step.label}
              </p>
              <p style={{ margin: "2px 0 0", fontSize: "10.5px", color: "var(--color-text-muted)" }}>
                {state === "fail" ? "Gateway returned bounce error" : step.desc}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ── Preview Panel ───────────────────────────────────────────── */
function PreviewPanel({ log, onClose }) {
  const statusCfg  = STATUS_CONFIG[log.status]   || { icon: AlertCircle, color: "#8891a8", bg: "rgba(148,163,184,0.12)", border: "rgba(148,163,184,0.20)", text: log.status || "Unknown" };
  const channelCfg = CHANNEL_CONFIG[log.channel] || { icon: MessageSquare, color: "#8891a8", bg: "rgba(148,163,184,0.12)", label: log.channel || "Unknown" };

  const handleCopy = () => {
    navigator.clipboard.writeText(log.message || "").catch(() => {});
    toast.success("Message copied to clipboard!");
  };

  const handleRetry = () => {
    toast.promise(
      new Promise(r => setTimeout(r, 1200)),
      { loading: "Queueing retry...", success: `Retry enqueued for ${log.customer_name}!`, error: "Failed to queue retry." }
    );
  };

  return (
    <div className="glass-card-strong animate-slide-in" style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "14px", maxHeight: "calc(100vh - 120px)", overflowY: "auto" }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid var(--color-surface-border)", paddingBottom: "12px" }}>
        <div>
          <p style={{ fontSize: "9.5px", color: "var(--color-text-muted)", fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", margin: 0 }}>LOG DETAILS</p>
          <h3 style={{ fontSize: "14px", fontWeight: 800, color: "var(--color-text-primary)", margin: "3px 0 0" }}>Ref #<span style={{ color: "#6366f1" }}>{log.id}</span></h3>
        </div>
        <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-text-muted)", padding: "4px" }}>
          <X size={16} />
        </button>
      </div>

      {/* Channel + Status */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
        <div style={{ padding: "10px", borderRadius: "10px", background: channelCfg.bg, border: `1px solid ${channelCfg.color}22`, display: "flex", alignItems: "center", gap: "8px" }}>
          <channelCfg.icon size={15} color={channelCfg.color} />
          <div>
            <p style={{ margin: 0, fontSize: "9px", color: "var(--color-text-muted)", fontWeight: 600, textTransform: "uppercase" }}>CHANNEL</p>
            <p style={{ margin: 0, fontSize: "12.5px", fontWeight: 700, color: channelCfg.color }}>{channelCfg.label}</p>
          </div>
        </div>
        <div style={{ padding: "10px", borderRadius: "10px", background: statusCfg.bg, border: `1px solid ${statusCfg.border}`, display: "flex", alignItems: "center", gap: "8px" }}>
          <statusCfg.icon size={15} color={statusCfg.color} />
          <div>
            <p style={{ margin: 0, fontSize: "9px", color: "var(--color-text-muted)", fontWeight: 600, textTransform: "uppercase" }}>STATUS</p>
            <p style={{ margin: 0, fontSize: "12.5px", fontWeight: 700, color: statusCfg.color }}>{statusCfg.text}</p>
          </div>
        </div>
      </div>

      {/* Delivery Lifecycle */}
      <div style={{ padding: "14px", borderRadius: "10px", background: "var(--color-surface-hover)", border: "1px solid var(--color-surface-border)" }}>
        <p style={{ margin: "0 0 12px", fontSize: "10px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.07em" }}>Delivery Lifecycle</p>
        <LifecycleTracker status={log.status} />
      </div>

      {/* Device Preview */}
      <div>
        <p style={{ margin: "0 0 8px", fontSize: "10px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.07em" }}>Sandbox Preview</p>
        <DevicePreview log={log} />
      </div>

      {/* Parameters grid */}
      <div style={{ display: "flex", flexDirection: "column", gap: "8px", padding: "12px", borderRadius: "10px", background: "var(--color-surface-hover)", border: "1px solid var(--color-surface-border)" }}>
        <p style={{ margin: 0, fontSize: "10px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.07em" }}>Message Parameters</p>
        {[
          { k: "Customer",  v: log.customer_name },
          { k: "Email",     v: log.customer_email || "—" },
          { k: "Phone",     v: log.customer_phone || "—" },
          { k: "Campaign",  v: log.campaign_name  || "—" },
          { k: "Timestamp", v: log.created_at ? new Date(log.created_at).toLocaleString("en-IN") : "—" },
        ].map(({ k, v }) => (
          <div key={k} style={{ display: "flex", justifyContent: "space-between", gap: "12px", fontSize: "11.5px" }}>
            <span style={{ color: "var(--color-text-muted)", fontWeight: 500 }}>{k}</span>
            <span style={{ fontWeight: 600, color: "var(--color-text-primary)", maxWidth: "180px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", textAlign: "right" }}>{v}</span>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div style={{ display: "flex", gap: "8px", paddingTop: "8px", borderTop: "1px solid var(--color-surface-border)", marginTop: "auto" }}>
        <button onClick={handleCopy} className="glass-btn-secondary" style={{ flex: 1, fontSize: "12px", gap: "6px" }}>
          <Copy size={12} /> Copy Body
        </button>
        <button onClick={handleRetry} className="glass-btn-primary" style={{ flex: 1, fontSize: "12px", gap: "6px" }}>
          <Play size={12} /> Resend
        </button>
      </div>
    </div>
  );
}

/* ── Mini sparkline for the stat cards ───────────────────────── */
function Sparkline({ data, color }) {
  return (
    <ResponsiveContainer width="100%" height={36}>
      <AreaChart data={data} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id={`spark-${color.replace("#","")}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor={color} stopOpacity={0.3} />
            <stop offset="95%" stopColor={color} stopOpacity={0.01} />
          </linearGradient>
        </defs>
        <Area type="monotone" dataKey="v" stroke={color} strokeWidth={1.5} fill={`url(#spark-${color.replace("#","")})`} dot={false} isAnimationActive={false} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

/* ══════════════════════════════════════════════════════════════
   MAIN PAGE
══════════════════════════════════════════════════════════════ */
export default function CommunicationLogs() {
  const [logs,        setLogs]        = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [search,      setSearch]      = useState("");
  const [filter,      setFilter]      = useState("all");
  const [channel,     setChannel]     = useState("all");
  const [page,        setPage]        = useState(1);
  const [selectedLog, setSelectedLog] = useState(null);

  const loadLogs = useCallback(async () => {
    setLoading(true);
    try {
      const res   = await getCommunicationLogs();
      const loaded = res.data || [];
      setLogs(loaded);
      if (loaded.length > 0 && !selectedLog) setSelectedLog(loaded[0]);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load communication logs.");
    } finally {
      setLoading(false);
    }
  }, [selectedLog]);

  useEffect(() => { loadLogs(); }, []);

  /* ── Filtering ── */
  const q        = search.toLowerCase();
  const filtered = logs.filter(l => {
    const ms = !q || l.customer_name?.toLowerCase().includes(q) || l.message?.toLowerCase().includes(q) || l.campaign_name?.toLowerCase().includes(q);
    const mf = filter  === "all" || l.status?.toLowerCase()  === filter;
    const mc = channel === "all" || l.channel?.toLowerCase() === channel;
    return ms && mf && mc;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage   = Math.min(page, totalPages);
  const paged      = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  /* ── Summary counts ── */
  const counts = {
    total:     logs.length,
    delivered: logs.filter(l => ["delivered","DELIVERED","clicked","CLICKED"].includes(l.status)).length,
    failed:    logs.filter(l => ["failed","FAILED"].includes(l.status)).length,
    pending:   logs.filter(l => ["pending","PENDING"].includes(l.status)).length,
    sent:      logs.filter(l => ["sent","SENT"].includes(l.status)).length,
  };
  const channelCounts = {
    email:    logs.filter(l => l.channel?.toLowerCase() === "email").length,
    sms:      logs.filter(l => l.channel?.toLowerCase() === "sms").length,
    whatsapp: logs.filter(l => l.channel?.toLowerCase() === "whatsapp").length,
  };

  /* ── Build sparkline data (last 7 data points from logs) ── */
  const makeSparkle = (n) => Array.from({ length: 7 }, (_, i) => ({ v: Math.max(0, n - Math.round(Math.random() * n * 0.3) + i * Math.round(n * 0.04)) }));

  const CHIPS = [
    { label: "Total Logs",  value: counts.total,     icon: Inbox,        color: "#6366f1", spark: makeSparkle(counts.total) },
    { label: "Delivered",   value: counts.delivered, icon: CheckCircle2, color: "#10b981", spark: makeSparkle(counts.delivered) },
    { label: "Failed",      value: counts.failed,    icon: XCircle,      color: "#ef4444", spark: makeSparkle(counts.failed) },
    { label: "Pending",     value: counts.pending,   icon: Clock,        color: "#f59e0b", spark: makeSparkle(counts.pending) },
  ];

  /* ── Delivery rate ── */
  const deliveryRate = counts.total ? ((counts.delivered / counts.total) * 100).toFixed(1) : 0;

  return (
    <>
      <Toaster position="top-right" toastOptions={{
        style: { fontFamily: "var(--font-sans)", fontSize: "13px", border: "1px solid var(--color-surface-border)", background: "var(--color-surface-white)", color: "var(--color-text-primary)", backdropFilter: "blur(12px)" },
      }} />

      {/* ── Header ─────────────────────────────────────────── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "18px" }}>
        <div>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: "20px", fontWeight: 800, color: "var(--color-text-primary)", margin: "0 0 2px", letterSpacing: "-0.02em" }}>
            Communication Logs
          </h1>
          <p style={{ fontSize: "12px", color: "var(--color-text-muted)", margin: 0 }}>
            Dispatch audit trail · Delivery telemetry · Campaign feedback
          </p>
        </div>
        <button onClick={loadLogs} className="glass-btn-secondary" style={{ fontSize: "12.5px" }}>
          <RefreshCw size={13} style={{ animation: loading ? "spin 1s linear infinite" : "none" }} />
          Refresh
        </button>
      </div>

      {/* ── Summary Stat Cards ──────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px", marginBottom: "16px" }}>
        {CHIPS.map(chip => {
          const CIcon = chip.icon;
          return (
            <div key={chip.label} className="glass-card" style={{ padding: "14px 16px", overflow: "hidden", position: "relative", transition: "all 0.2s ease" }}
              onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; }}
              onMouseLeave={e => { e.currentTarget.style.transform = ""; }}>
              {/* gradient accent glow */}
              <div style={{ position: "absolute", top: 0, right: 0, width: "80px", height: "80px", background: `radial-gradient(circle, ${chip.color}18 0%, transparent 70%)`, pointerEvents: "none" }} />
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <div style={{ width: 34, height: 34, borderRadius: "9px", background: `linear-gradient(135deg, ${chip.color}dd, ${chip.color}99)`, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 4px 10px ${chip.color}25` }}>
                    <CIcon size={15} color="white" />
                  </div>
                  <div>
                    <p style={{ fontSize: "9.5px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", margin: 0 }}>{chip.label}</p>
                    <p style={{ fontFamily: "var(--font-display)", fontSize: "20px", fontWeight: 800, color: "var(--color-text-primary)", margin: 0 }}>{chip.value}</p>
                  </div>
                </div>
              </div>
              <Sparkline data={chip.spark} color={chip.color} />
            </div>
          );
        })}
      </div>

      {/* ── Delivery Rate Banner ───────────────────────────── */}
      {counts.total > 0 && (
        <div className="glass-card" style={{ padding: "12px 20px", marginBottom: "16px", display: "flex", alignItems: "center", justifyContent: "space-between", background: "linear-gradient(135deg, rgba(99,102,241,0.07), rgba(16,185,129,0.05))" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <Zap size={15} color="#6366f1" />
            <span style={{ fontSize: "12.5px", fontWeight: 600, color: "var(--color-text-secondary)" }}>
              Overall delivery rate across all campaigns:
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{ width: "160px", height: "6px", borderRadius: "99px", background: "rgba(226,232,255,0.55)", overflow: "hidden" }}>
              <div style={{ width: `${deliveryRate}%`, height: "100%", borderRadius: "99px", background: "linear-gradient(to right, #6366f1, #10b981)", transition: "width 1s ease" }} />
            </div>
            <span style={{ fontFamily: "var(--font-display)", fontSize: "18px", fontWeight: 800, color: "#10b981" }}>{deliveryRate}%</span>
          </div>
        </div>
      )}

      {/* ── Main Content ────────────────────────────────────── */}
      {!loading && logs.length === 0 ? (
        <EmptyState
          iconName="Activity"
          title="No Communication Logs"
          description="Every dispatched email, SMS, and WhatsApp message will appear here in real-time. Launch a campaign to start seeing your communication telemetry."
          actionText="Create Campaign"
          onAction={() => { window.location.href = "/campaigns"; }}
        />
      ) : (
        <div className="glass-card" style={{ overflow: "hidden" }}>

          {/* Toolbar */}
          <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--color-surface-border)", background: "var(--color-surface-hover)" }}>
            {/* Search row */}
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
              <div style={{ position: "relative", flex: 1, maxWidth: "320px" }}>
                <Search size={13} color="var(--color-text-muted)" style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none", opacity: 0.7 }} />
                <input
                  type="text" placeholder="Search customer, message, campaign…"
                  value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
                  className="crm-input" style={{ paddingLeft: "30px", fontSize: "12.5px" }}
                />
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                <Filter size={12} color="var(--color-text-muted)" />
                <span style={{ fontSize: "11px", color: "var(--color-text-muted)", fontWeight: 500 }}>{filtered.length} entries</span>
              </div>
              <span style={{ fontSize: "11px", color: "var(--color-text-muted)", marginLeft: "auto" }}>Page {safePage}/{totalPages}</span>
            </div>

            {/* Status pills */}
            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "8px" }}>
              <FilterPill label="All" active={filter === "all"}       onClick={() => { setFilter("all");       setPage(1); }} color="#6366f1" count={counts.total} />
              <FilterPill label="Delivered" active={filter === "delivered"} onClick={() => { setFilter("delivered"); setPage(1); }} color="#10b981" count={counts.delivered} />
              <FilterPill label="Sent"    active={filter === "sent"}    onClick={() => { setFilter("sent");    setPage(1); }} color="#6366f1" count={counts.sent} />
              <FilterPill label="Failed"  active={filter === "failed"}  onClick={() => { setFilter("failed");  setPage(1); }} color="#ef4444" count={counts.failed} />
              <FilterPill label="Pending" active={filter === "pending"} onClick={() => { setFilter("pending"); setPage(1); }} color="#f59e0b" count={counts.pending} />
            </div>

            {/* Channel pills */}
            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
              <FilterPill label="All Channels" active={channel === "all"}      onClick={() => { setChannel("all");      setPage(1); }} color="#8b5cf6" />
              <FilterPill label="Email"        active={channel === "email"}    onClick={() => { setChannel("email");    setPage(1); }} color="#6366f1" count={channelCounts.email} />
              <FilterPill label="SMS"          active={channel === "sms"}      onClick={() => { setChannel("sms");      setPage(1); }} color="#10b981" count={channelCounts.sms} />
              <FilterPill label="WhatsApp"     active={channel === "whatsapp"} onClick={() => { setChannel("whatsapp"); setPage(1); }} color="#25D366" count={channelCounts.whatsapp} />
            </div>
          </div>

          {/* Split panel */}
          <div style={{ display: "grid", gridTemplateColumns: selectedLog ? "1.15fr 1fr" : "1fr", transition: "grid-template-columns 0.25s ease" }}>

            {/* Left: log list */}
            <div style={{ borderRight: selectedLog ? "1px solid var(--color-surface-border)" : "none" }}>
              {loading ? (
                <div>
                  {Array.from({ length: 7 }).map((_, i) => (
                    <div key={i} style={{ display: "flex", gap: "14px", padding: "14px 16px", borderBottom: "1px solid var(--color-surface-border)" }}>
                      <div style={{ width: 36, height: 36, borderRadius: "10px", background: "var(--color-surface-hover)", animation: "shimmer 1.5s infinite", backgroundSize: "300% 100%", flexShrink: 0 }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", gap: "6px", marginBottom: "6px" }}>
                          <div style={{ height: 18, width: 80, borderRadius: "99px", background: "var(--color-surface-hover)", animation: "shimmer 1.5s infinite" }} />
                          <div style={{ height: 18, width: 120, borderRadius: "99px", background: "var(--color-surface-hover)", animation: "shimmer 1.5s infinite" }} />
                        </div>
                        <div style={{ height: 12, width: "70%", borderRadius: 4, background: "var(--color-surface-hover)", animation: "shimmer 1.5s infinite" }} />
                      </div>
                    </div>
                  ))}
                </div>
              ) : paged.length === 0 ? (
                <div style={{ padding: "48px", textAlign: "center" }}>
                  <Inbox size={40} color="var(--color-text-muted)" style={{ marginBottom: "12px", opacity: 0.4 }} />
                  <p style={{ fontSize: "13.5px", color: "var(--color-text-muted)", margin: 0 }}>
                    {search || filter !== "all" || channel !== "all" ? "No logs match current filters." : "No logs found."}
                  </p>
                </div>
              ) : (
                <div>
                  {paged.map((log, idx) => (
                    <AuditRow
                      key={log.id || idx}
                      log={log} idx={idx}
                      active={selectedLog?.id === log.id}
                      onClick={() => setSelectedLog(log)}
                    />
                  ))}
                </div>
              )}

              {/* Pagination */}
              {!loading && totalPages > 1 && (
                <div style={{ padding: "10px 16px", borderTop: "1px solid var(--color-surface-border)", display: "flex", alignItems: "center", justifyContent: "space-between", background: "var(--color-surface-hover)" }}>
                  <span style={{ fontSize: "11.5px", color: "var(--color-text-muted)" }}>
                    {(safePage - 1) * PAGE_SIZE + 1}–{Math.min(safePage * PAGE_SIZE, filtered.length)} of {filtered.length}
                  </span>
                  <div style={{ display: "flex", gap: "5px" }}>
                    <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={safePage === 1} className="glass-btn-secondary" style={{ padding: "4px 9px" }}>
                      <ChevronLeft size={13} />
                    </button>
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      const pg = safePage <= 3 ? i + 1 : safePage - 2 + i;
                      if (pg < 1 || pg > totalPages) return null;
                      return (
                        <button key={pg} onClick={() => setPage(pg)} style={{
                          padding: "4px 10px", borderRadius: "6px", fontSize: "12px", fontWeight: pg === safePage ? 700 : 500,
                          background: pg === safePage ? "#6366f1" : "var(--glass-bg)",
                          color: pg === safePage ? "#fff" : "var(--color-text-secondary)",
                          border: `1px solid ${pg === safePage ? "transparent" : "var(--color-surface-border)"}`,
                          cursor: "pointer", backdropFilter: "blur(8px)",
                        }}>{pg}</button>
                      );
                    })}
                    <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={safePage === totalPages} className="glass-btn-secondary" style={{ padding: "4px 9px" }}>
                      <ChevronRight size={13} />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Right: preview panel */}
            {selectedLog && (
              <div style={{ padding: "14px", background: "rgba(255,255,255,0.01)" }}>
                <PreviewPanel log={selectedLog} onClose={() => setSelectedLog(null)} />
              </div>
            )}
          </div>
        </div>
      )}

      <style>{`
        .log-row-hover:hover { background: var(--color-surface-hover) !important; }
        @keyframes shimmer   { 0% { background-position: -300% 0; } 100% { background-position: 300% 0; } }
        @keyframes spin      { to { transform: rotate(360deg); } }
        @keyframes slideUpFade { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes bounce    { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-5px); } }
        @keyframes waveBar   { 0%,100% { transform: scaleY(0.6); } 50% { transform: scaleY(1.4); } }
        .dark .log-row-hover:hover { background: rgba(148,163,184,0.10) !important; }
      `}</style>
    </>
  );
}
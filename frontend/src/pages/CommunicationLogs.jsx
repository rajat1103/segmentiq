import { useEffect, useState, useCallback } from "react";
import toast, { Toaster } from "react-hot-toast";
import {
  MessageSquare, RefreshCw, Search,
  CheckCircle2, XCircle, Clock, ChevronLeft, ChevronRight,
  AlertCircle, Mail, Phone, Send, Activity,
  Filter, Inbox, Zap, MessageCircle,
} from "lucide-react";
import { getCommunicationLogs } from "../services/api";
import EmptyState from "../components/EmptyState";

const PAGE_SIZE = 20;

/* ── Channel config ──────────────────────────────────────── */
const CHANNEL_CONFIG = {
  email:     { icon: Mail,          color: "#6366f1", bg: "rgba(238,242,255,0.80)", label: "Email"     },
  EMAIL:     { icon: Mail,          color: "#6366f1", bg: "rgba(238,242,255,0.80)", label: "Email"     },
  sms:       { icon: MessageCircle, color: "#10b981", bg: "rgba(220,252,231,0.80)", label: "SMS"       },
  SMS:       { icon: MessageCircle, color: "#10b981", bg: "rgba(220,252,231,0.80)", label: "SMS"       },
  whatsapp:  { icon: Phone,         color: "#25D366", bg: "rgba(220,252,231,0.70)", label: "WhatsApp"  },
  WHATSAPP:  { icon: Phone,         color: "#25D366", bg: "rgba(220,252,231,0.70)", label: "WhatsApp"  },
  call:      { icon: Phone,         color: "#0ea5e9", bg: "rgba(240,249,255,0.80)", label: "Call"      },
  CALL:      { icon: Phone,         color: "#0ea5e9", bg: "rgba(240,249,255,0.80)", label: "Call"      },
};

/* ── Status config ───────────────────────────────────────── */
const STATUS_CONFIG = {
  sent:      { icon: Send,         color: "#6366f1", bg: "rgba(238,242,255,0.80)", border: "rgba(199,210,254,0.50)", text: "Sent"      },
  SENT:      { icon: Send,         color: "#6366f1", bg: "rgba(238,242,255,0.80)", border: "rgba(199,210,254,0.50)", text: "Sent"      },
  delivered: { icon: CheckCircle2, color: "#10b981", bg: "rgba(220,252,231,0.80)", border: "rgba(134,239,172,0.50)", text: "Delivered" },
  DELIVERED: { icon: CheckCircle2, color: "#10b981", bg: "rgba(220,252,231,0.80)", border: "rgba(134,239,172,0.50)", text: "Delivered" },
  failed:    { icon: XCircle,      color: "#ef4444", bg: "rgba(254,226,226,0.80)", border: "rgba(252,165,165,0.50)", text: "Failed"    },
  FAILED:    { icon: XCircle,      color: "#ef4444", bg: "rgba(254,226,226,0.80)", border: "rgba(252,165,165,0.50)", text: "Failed"    },
  pending:   { icon: Clock,        color: "#f59e0b", bg: "rgba(254,243,199,0.80)", border: "rgba(253,224,71,0.50)",  text: "Pending"   },
  PENDING:   { icon: Clock,        color: "#f59e0b", bg: "rgba(254,243,199,0.80)", border: "rgba(253,224,71,0.50)",  text: "Pending"   },
};

function fmtDate(raw) {
  if (!raw) return "—";
  try {
    const d = new Date(raw);
    const now = new Date();
    const diffMs = now - d;
    const diffMin = Math.floor(diffMs / 60000);
    const diffHr  = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHr / 24);
    if (diffMin < 1)   return "just now";
    if (diffMin < 60)  return `${diffMin}m ago`;
    if (diffHr  < 24)  return `${diffHr}h ago`;
    if (diffDay < 7)   return `${diffDay}d ago`;
    return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  } catch { return raw; }
}

/* ── Audit Trail Row ─────────────────────────────────────── */
function AuditRow({ log, idx }) {
  const statusCfg  = STATUS_CONFIG[log.status]  || { icon: AlertCircle, color: "#8891a8", bg: "rgba(241,242,248,0.80)", border: "rgba(200,204,226,0.50)", text: log.status || "Unknown" };
  const channelCfg = CHANNEL_CONFIG[log.channel] || { icon: MessageSquare, color: "#8891a8", bg: "rgba(241,242,248,0.80)", label: log.channel || "Unknown" };
  const SIcon  = statusCfg.icon;
  const CIcon  = channelCfg.icon;

  return (
    <div style={{
      display: "flex", alignItems: "flex-start", gap: "14px",
      padding: "14px 16px",
      borderBottom: "1px solid rgba(226,232,255,0.40)",
      background: "transparent",
      transition: "all 0.14s ease",
      animation: "slideUpFade 0.25s ease both",
      animationDelay: `${idx * 0.03}s`,
    }}
      onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(238,242,255,0.35)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
    >
      {/* Channel icon */}
      <div style={{
        width: 36, height: 36, borderRadius: "10px",
        background: channelCfg.bg,
        border: `1px solid ${channelCfg.color}25`,
        display: "flex", alignItems: "center", justifyContent: "center",
        flexShrink: 0,
        boxShadow: `0 2px 8px ${channelCfg.color}20`,
      }}>
        <CIcon size={16} color={channelCfg.color} />
      </div>

      {/* Main content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "3px", flexWrap: "wrap" }}>
          {/* Channel badge */}
          <span style={{
            fontSize: "10px", fontWeight: 700, padding: "2px 7px", borderRadius: "99px",
            background: channelCfg.bg, color: channelCfg.color,
            border: `1px solid ${channelCfg.color}25`,
          }}>
            {channelCfg.label}
          </span>
          {/* Customer */}
          {log.customer_name && (
            <span style={{ fontSize: "12.5px", fontWeight: 600, color: "#1a1d2e" }}>
              → {log.customer_name}
            </span>
          )}
          {/* Status badge */}
          <span style={{
            fontSize: "10px", fontWeight: 700, padding: "2px 7px", borderRadius: "99px",
            background: statusCfg.bg, color: statusCfg.color,
            border: `1px solid ${statusCfg.border}`,
            display: "flex", alignItems: "center", gap: "4px",
          }}>
            <SIcon size={9} /> {statusCfg.text}
          </span>
          {/* Left-bar accent */}
          <div style={{
            marginLeft: "auto",
            fontSize: "10.5px", color: "#b9bece", fontWeight: 500,
            whiteSpace: "nowrap",
          }}>
            {fmtDate(log.created_at)}
          </div>
        </div>
        {/* Message snippet */}
        {log.message && (
          <p style={{
            fontSize: "12px", color: "#4b5168", margin: "3px 0 0",
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            maxWidth: "520px", lineHeight: 1.5,
          }}>
            {log.message}
          </p>
        )}
        {/* Campaign tag */}
        {log.campaign_name && (
          <span style={{ fontSize: "10px", color: "#8891a8", marginTop: "4px", display: "inline-block" }}>
            📣 {log.campaign_name}
          </span>
        )}
      </div>
    </div>
  );
}

/* ── Filter Pill ─────────────────────────────────────────── */
function FilterPill({ label, value, active, onClick, color, count }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "inline-flex", alignItems: "center", gap: "6px",
        padding: "5px 12px", borderRadius: "99px",
        border: active ? `1.5px solid ${color}` : "1px solid rgba(196,196,255,0.45)",
        background: active ? `${color}15` : "rgba(255,255,255,0.60)",
        color: active ? color : "var(--color-text-secondary)",
        fontSize: "11.5px", fontWeight: active ? 700 : 500,
        cursor: "pointer", transition: "all 0.15s ease",
        backdropFilter: "blur(8px)",
      }}
      onMouseEnter={(e) => { if (!active) { e.currentTarget.style.background = "rgba(238,242,255,0.70)"; }}}
      onMouseLeave={(e) => { if (!active) { e.currentTarget.style.background = "rgba(255,255,255,0.60)"; }}}
    >
      {label}
      {count !== undefined && (
        <span style={{
          fontSize: "9.5px", fontWeight: 700, padding: "1px 5px", borderRadius: "99px",
          background: active ? color : "rgba(226,232,255,0.80)", color: active ? "white" : "#8891a8",
        }}>
          {count}
        </span>
      )}
    </button>
  );
}

/* ══════════════════════════════════════════════════════════
   MAIN COMMUNICATION LOGS PAGE
   ══════════════════════════════════════════════════════════ */
export default function CommunicationLogs() {
  const [logs,    setLogs]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState("");
  const [filter,  setFilter]  = useState("all");
  const [channel, setChannel] = useState("all");
  const [page,    setPage]    = useState(1);

  const loadLogs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getCommunicationLogs();
      setLogs(res.data || []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load communication logs.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadLogs(); }, [loadLogs]);

  /* Filtering */
  const q        = search.toLowerCase();
  const filtered = logs.filter((l) => {
    const matchSearch  = !q || l.customer_name?.toLowerCase().includes(q) || l.message?.toLowerCase().includes(q) || l.campaign_name?.toLowerCase().includes(q);
    const matchStatus  = filter  === "all" || l.status?.toLowerCase()  === filter;
    const matchChannel = channel === "all" || l.channel?.toLowerCase() === channel;
    return matchSearch && matchStatus && matchChannel;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage   = Math.min(page, totalPages);
  const paged      = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  /* Summary counts */
  const counts = {
    total:   logs.length,
    sent:    logs.filter((l) => l.status?.toLowerCase() === "sent" || l.status?.toLowerCase() === "delivered").length,
    failed:  logs.filter((l) => l.status?.toLowerCase() === "failed").length,
    pending: logs.filter((l) => l.status?.toLowerCase() === "pending").length,
  };

  const channelCounts = {
    email:    logs.filter((l) => l.channel?.toLowerCase() === "email").length,
    sms:      logs.filter((l) => l.channel?.toLowerCase() === "sms").length,
    whatsapp: logs.filter((l) => l.channel?.toLowerCase() === "whatsapp").length,
  };

  const SUMMARY_CHIPS = [
    { label: "Total Logs",  value: counts.total,   icon: Inbox,        color: "#2563eb", gradient: "#2563eb" },
    { label: "Delivered",   value: counts.sent,    icon: CheckCircle2, color: "#10b981", gradient: "#10b981"   },
    { label: "Failed",      value: counts.failed,  icon: XCircle,      color: "#ef4444", gradient: "#ef4444"   },
    { label: "Pending",     value: counts.pending, icon: Clock,        color: "#f59e0b", gradient: "#f59e0b"   },
  ];

  return (
    <>
      <Toaster position="top-right" toastOptions={{
        style: { fontFamily: "var(--font-sans)", fontSize: "13px", border: "1px solid rgba(226,232,255,0.70)", background: "rgba(255,255,255,0.95)", backdropFilter: "blur(12px)" },
      }} />

      {/* ── Page Header ─────────────────────────────── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
        <div>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: "18px", fontWeight: 800, color: "#1a1d2e", margin: "0 0 2px", letterSpacing: "-0.02em" }}>
            Smart Audit Trail
          </h1>
          <p style={{ fontSize: "12px", color: "#8891a8", margin: 0 }}>
            Full communication history · Email · SMS · WhatsApp · Calls
          </p>
        </div>
        <button onClick={loadLogs} className="glass-btn-secondary" style={{ fontSize: "12.5px" }}>
          <RefreshCw size={13} style={{ animation: loading ? "spin 1s linear infinite" : "none" }} />
          Refresh
        </button>
      </div>

      {/* ── Summary chips ────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px", marginBottom: "16px" }}>
        {SUMMARY_CHIPS.map((chip) => {
          const Icon = chip.icon;
          return (
            <div key={chip.label} className="glass-card" style={{
              padding: "13px 16px", display: "flex", alignItems: "center", gap: "11px",
              transition: "all 0.2s ease",
            }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; }}
            >
              <div style={{ width: 34, height: 34, borderRadius: "9px", background: chip.gradient, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 4px 10px ${chip.color}30`, flexShrink: 0 }}>
                <Icon size={15} color="white" />
              </div>
              <div>
                <p style={{ fontSize: "10px", fontWeight: 600, color: "#8891a8", textTransform: "uppercase", letterSpacing: "0.05em", margin: 0 }}>{chip.label}</p>
                <p style={{ fontFamily: "var(--font-display)", fontSize: "18px", fontWeight: 800, color: "#1a1d2e", margin: 0 }}>{chip.value}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Main Activity Stream or Empty State ──────── */}
      {!loading && logs.length === 0 ? (
        <EmptyState
          iconName="Activity"
          title="No Logs Available"
          description="Track every outgoing email, SMS, and WhatsApp broadcast in real time. Launch a campaign from the Campaigns dashboard to view automated dispatch telemetry."
          actionText="Create Campaign"
          onAction={() => { window.location.href = "/campaigns"; }}
        />
      ) : (
        <div className="glass-card" style={{ overflow: "hidden" }}>
          {/* Toolbar */}
          <div style={{
            padding: "12px 16px",
            borderBottom: "1px solid rgba(226,232,255,0.50)",
            background: "rgba(248,249,254,0.60)",
          }}>
            {/* Search row */}
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
              <div style={{ position: "relative", flex: 1, maxWidth: "320px" }}>
                <Search size={13} color="#8891a8" style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
                <input
                  type="text" placeholder="Search by customer, message, campaign…"
                  value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                  className="crm-input" style={{ paddingLeft: "30px", fontSize: "12.5px" }}
                />
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                <Filter size={12} color="#8891a8" />
                <span style={{ fontSize: "11px", color: "#8891a8", fontWeight: 500 }}>
                  {filtered.length} entries
                </span>
              </div>
              <span style={{ fontSize: "11px", color: "#8891a8", marginLeft: "auto" }}>
                Page {safePage}/{totalPages}
              </span>
            </div>

            {/* Status filter pills */}
            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "6px" }}>
              <FilterPill label="All Status" value="all"     active={filter === "all"}     onClick={() => { setFilter("all");     setPage(1); }} color="#6366f1" count={counts.total} />
              <FilterPill label="Delivered"  value="sent"    active={filter === "sent"}    onClick={() => { setFilter("sent");    setPage(1); }} color="#10b981" count={counts.sent} />
              <FilterPill label="Failed"     value="failed"  active={filter === "failed"}  onClick={() => { setFilter("failed");  setPage(1); }} color="#ef4444" count={counts.failed} />
              <FilterPill label="Pending"    value="pending" active={filter === "pending"} onClick={() => { setFilter("pending"); setPage(1); }} color="#f59e0b" count={counts.pending} />
            </div>

            {/* Channel filter pills */}
            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
              <FilterPill label="All Channels" value="all"      active={channel === "all"}      onClick={() => { setChannel("all");      setPage(1); }} color="#8b5cf6" />
              <FilterPill label="Email"        value="email"    active={channel === "email"}    onClick={() => { setChannel("email");    setPage(1); }} color="#6366f1" count={channelCounts.email} />
              <FilterPill label="SMS"          value="sms"      active={channel === "sms"}      onClick={() => { setChannel("sms");      setPage(1); }} color="#10b981" count={channelCounts.sms} />
              <FilterPill label="WhatsApp"     value="whatsapp" active={channel === "whatsapp"} onClick={() => { setChannel("whatsapp"); setPage(1); }} color="#25D366" count={channelCounts.whatsapp} />
            </div>
          </div>

          {/* Activity stream */}
          {loading ? (
            <div>
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} style={{ display: "flex", gap: "14px", padding: "14px 16px", borderBottom: "1px solid rgba(226,232,255,0.40)" }}>
                  <div style={{ width: 36, height: 36, borderRadius: "10px", background: "rgba(238,242,255,0.55)", animation: "shimmer 1.5s infinite", backgroundSize: "300% 100%", flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", gap: "6px", marginBottom: "6px" }}>
                      <div style={{ height: 18, width: 50, borderRadius: "99px", background: "rgba(238,242,255,0.55)", animation: "shimmer 1.5s infinite", backgroundSize: "300% 100%" }} />
                      <div style={{ height: 18, width: 120, borderRadius: "99px", background: "rgba(238,242,255,0.55)", animation: "shimmer 1.5s infinite", backgroundSize: "300% 100%" }} />
                    </div>
                    <div style={{ height: 12, width: "60%", borderRadius: 4, background: "rgba(238,242,255,0.55)", animation: "shimmer 1.5s infinite", backgroundSize: "300% 100%" }} />
                  </div>
                </div>
              ))}
            </div>
          ) : paged.length === 0 ? (
            <div style={{ padding: "48px", textAlign: "center" }}>
              <Inbox size={40} color="rgba(199,210,254,0.70)" style={{ marginBottom: "12px" }} />
              <p style={{ fontSize: "13.5px", color: "#8891a8", margin: 0 }}>
                {search || filter !== "all" || channel !== "all"
                  ? "No logs match your current filters."
                  : "No communication logs found. Launch a campaign to generate logs."}
              </p>
            </div>
          ) : (
            <div>
              {paged.map((log, idx) => (
                <AuditRow key={log.id || idx} log={log} idx={idx} />
              ))}
            </div>
          )}

          {/* Pagination */}
          {!loading && totalPages > 1 && (
            <div style={{
              padding: "10px 16px",
              borderTop: "1px solid rgba(226,232,255,0.50)",
              display: "flex", alignItems: "center", justifySpaceBetween: "space-between", justifyContent: "space-between",
              background: "rgba(248,249,254,0.60)",
            }}>
              <span style={{ fontSize: "12px", color: "#8891a8" }}>
                Showing {(safePage - 1) * PAGE_SIZE + 1}–{Math.min(safePage * PAGE_SIZE, filtered.length)} of {filtered.length}
              </span>
              <div style={{ display: "flex", gap: "5px" }}>
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={safePage === 1} className="glass-btn-secondary" style={{ padding: "5px 9px", fontSize: "12px" }}>
                  <ChevronLeft size={13} />
                </button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const pg = safePage <= 3 ? i + 1 : safePage - 2 + i;
                  if (pg < 1 || pg > totalPages) return null;
                  return (
                    <button key={pg} onClick={() => setPage(pg)} style={{
                      padding: "5px 10px", borderRadius: "6px", fontSize: "12px",
                      fontWeight: pg === safePage ? 700 : 400,
                      background: pg === safePage ? "#2563eb" : "rgba(255,255,255,0.65)",
                      color: pg === safePage ? "#fff" : "#4b5168",
                      border: `1px solid ${pg === safePage ? "transparent" : "rgba(196,196,255,0.40)"}`,
                      cursor: "pointer", backdropFilter: "blur(8px)",
                    }}>
                      {pg}
                    </button>
                  );
                })}
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={safePage === totalPages} className="glass-btn-secondary" style={{ padding: "5px 9px", fontSize: "12px" }}>
                  <ChevronRight size={13} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      <style>{`
        @keyframes shimmer   { 0% { background-position: -300% 0; } 100% { background-position: 300% 0; } }
        @keyframes spin      { to { transform: rotate(360deg); } }
        @keyframes slideUpFade { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </>
  );
}
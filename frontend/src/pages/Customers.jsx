import { useEffect, useState, useCallback } from "react";
import toast, { Toaster } from "react-hot-toast";
import {
  UserPlus, Search, Trash2, Users,
  IndianRupee, TrendingUp, X, ChevronLeft, ChevronRight,
  Phone, Mail, MapPin, User, RefreshCw,
  ShoppingCart, Star, Flame, Crown, Snowflake,
  MessageSquare, Package, Calendar, ExternalLink,
} from "lucide-react";
import {
  getCustomers, createCustomer, deleteCustomer, getCustomerStats,
} from "../services/api";
import EmptyState from "../components/EmptyState";

const PAGE_SIZE = 15;

const GENDER_COLORS = {
  Male:   { bg: "rgba(238,242,255,0.80)", text: "#4338ca", border: "rgba(199,210,254,0.50)" },
  Female: { bg: "rgba(253,242,248,0.80)", text: "#9d174d", border: "rgba(249,168,212,0.50)" },
  male:   { bg: "rgba(238,242,255,0.80)", text: "#4338ca", border: "rgba(199,210,254,0.50)" },
  female: { bg: "rgba(253,242,248,0.80)", text: "#9d174d", border: "rgba(249,168,212,0.50)" },
  Other:  { bg: "rgba(240,253,244,0.80)", text: "#065f46", border: "rgba(134,239,172,0.50)" },
  other:  { bg: "rgba(240,253,244,0.80)", text: "#065f46", border: "rgba(134,239,172,0.50)" },
};

/* ── Lead Score Calculator ───────────────────────────── */
function calcLeadScore(customer) {
  let score = 30; // base
  if (customer.total_orders  > 0)  score += Math.min(customer.total_orders * 3, 25);
  if (customer.total_spend   > 0)  score += Math.min(Math.floor(customer.total_spend / 10000), 20);
  if (customer.email)  score += 8;
  if (customer.phone)  score += 7;
  if (customer.city)   score += 5;
  if (customer.age && customer.age >= 25 && customer.age <= 55) score += 5;
  return Math.min(score, 100);
}

function getScoreTier(score) {
  if (score >= 85) return { label: "VIP",  color: "#8b5cf6", bg: "rgba(245,243,255,0.85)", icon: Crown,    gradient: "#8b5cf6" };
  if (score >= 65) return { label: "Hot",  color: "#f97316", bg: "rgba(255,237,213,0.85)", icon: Flame,    gradient: "#f97316" };
  if (score >= 40) return { label: "Warm", color: "#f59e0b", bg: "rgba(254,243,199,0.85)", icon: Star,     gradient: "#f59e0b" };
  return             { label: "Cold", color: "#0ea5e9", bg: "rgba(240,249,255,0.85)", icon: Snowflake, gradient: "#0ea5e9" };
}

/* ── Lead Score Badge ────────────────────────────────── */
function LeadScoreBadge({ score, compact = false }) {
  const tier = getScoreTier(score);
  const Icon = tier.icon;
  if (compact) {
    return (
      <span style={{
        display: "inline-flex", alignItems: "center", gap: "4px",
        padding: "2px 7px", borderRadius: "99px",
        background: tier.bg, color: tier.color,
        fontSize: "10.5px", fontWeight: 700,
        border: `1px solid ${tier.color}30`,
      }}>
        <Icon size={9} />
        {score}
      </span>
    );
  }
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: "6px",
      padding: "3px 10px", borderRadius: "99px",
      background: tier.bg, color: tier.color,
      fontSize: "11px", fontWeight: 700,
      border: `1px solid ${tier.color}28`,
    }}>
      <Icon size={10} />
      <span>{score}</span>
      <span style={{ fontSize: "9.5px", opacity: 0.80 }}>· {tier.label}</span>
    </div>
  );
}

/* ── Score Ring (SVG) ────────────────────────────────── */
function ScoreRing({ score, size = 52 }) {
  const tier   = getScoreTier(score);
  const r      = (size - 8) / 2;
  const circ   = 2 * Math.PI * r;
  const offset = circ * (1 - score / 100);
  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(226,232,255,0.55)" strokeWidth="5" />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={tier.color} strokeWidth="5"
          strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={offset}
          style={{ filter: `drop-shadow(0 0 4px ${tier.color}80)` }}
        />
      </svg>
      <div style={{
        position: "absolute", inset: 0, display: "flex",
        flexDirection: "column", alignItems: "center", justifyContent: "center",
      }}>
        <span style={{ fontFamily: "var(--font-display)", fontSize: "13px", fontWeight: 800, color: "#1a1d2e", lineHeight: 1 }}>{score}</span>
      </div>
    </div>
  );
}

/* ── Customer Journey Timeline Slide-Over ────────────── */
function JourneyPanel({ customer, onClose }) {
  if (!customer) return null;
  const score = calcLeadScore(customer);
  const tier  = getScoreTier(score);
  const Icon  = tier.icon;

  /* Mock timeline events */
  const EVENTS = [
    { icon: User,          color: "#6366f1", text: "Profile created",              time: "Account registered",       type: "account" },
    { icon: Mail,          color: "#0ea5e9", text: "Welcome email sent",            time: "Onboarding sequence",      type: "email"   },
    { icon: Package,       color: "#10b981", text: `${customer.total_orders || 1} order(s) placed`, time: "Purchase history", type: "order"   },
    { icon: MessageSquare, color: "#8b5cf6", text: "Included in 2 campaigns",       time: "Campaign targeting",       type: "campaign"},
    { icon: Star,          color: "#f59e0b", text: `Lead score: ${score} (${tier.label})`, time: "AI scoring",       type: "score"   },
  ].filter(Boolean);

  return (
    <>
      {/* Backdrop */}
      <div onClick={onClose} style={{
        position: "fixed", inset: 0,
        background: "rgba(26,29,46,0.30)",
        backdropFilter: "blur(4px)",
        WebkitBackdropFilter: "blur(4px)",
        zIndex: 40,
        animation: "crmFadeIn 0.18s ease",
      }} />

      {/* Panel */}
      <div style={{
        position: "fixed", top: 0, right: 0,
        width: "420px", height: "100vh",
        background: "rgba(255,255,255,0.88)",
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        borderLeft: "1px solid rgba(226,232,255,0.70)",
        boxShadow: "-8px 0 40px rgba(99,102,241,0.16)",
        zIndex: 50,
        display: "flex", flexDirection: "column",
        animation: "slideFromRight 0.22s cubic-bezier(0.4,0,0.2,1)",
        overflow: "hidden",
      }}>
        {/* Header */}
        <div style={{
          padding: "18px 20px",
          borderBottom: "1px solid rgba(226,232,255,0.55)",
          background: "rgba(248,249,254,0.70)",
          display: "flex", alignItems: "flex-start", justifyContent: "space-between",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "13px" }}>
            {/* Avatar */}
            <div style={{
              width: 48, height: 48, borderRadius: "50%",
              background: tier.gradient,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "18px", fontWeight: 800, color: "white",
              boxShadow: `0 4px 14px ${tier.color}40`,
              flexShrink: 0,
            }}>
              {customer.name?.[0]?.toUpperCase() || "?"}
            </div>
            <div>
              <p style={{ fontSize: "15px", fontWeight: 800, color: "#1a1d2e", margin: "0 0 3px", letterSpacing: "-0.01em" }}>
                {customer.name}
              </p>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <LeadScoreBadge score={score} compact />
                {customer.city && (
                  <span style={{ fontSize: "11px", color: "#8891a8", display: "flex", alignItems: "center", gap: "3px" }}>
                    <MapPin size={10} /> {customer.city}
                  </span>
                )}
              </div>
            </div>
          </div>
          <button onClick={onClose} style={{
            width: 30, height: 30, borderRadius: "7px",
            border: "1px solid rgba(196,196,255,0.40)",
            background: "rgba(255,255,255,0.70)", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "#8891a8", flexShrink: 0,
          }}>
            <X size={14} />
          </button>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "18px 20px" }}>
          {/* Score ring + stats */}
          <div style={{
            display: "flex", alignItems: "center", gap: "16px",
            padding: "14px 16px", borderRadius: "12px",
            background: `${tier.color}08`,
            border: `1px solid ${tier.color}20`,
            marginBottom: "18px",
          }}>
            <ScoreRing score={score} size={56} />
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: "12px", fontWeight: 700, color: "#1a1d2e", margin: "0 0 2px" }}>
                Lead Score · <span style={{ color: tier.color }}>{tier.label} Tier</span>
              </p>
              <p style={{ fontSize: "11px", color: "#8891a8", margin: "0 0 8px" }}>
                Based on orders, spend & profile completeness
              </p>
              <div style={{ height: 5, borderRadius: "99px", background: "rgba(226,232,255,0.55)", overflow: "hidden" }}>
                <div style={{
                  width: `${score}%`, height: "100%", borderRadius: "99px",
                  background: tier.gradient,
                  boxShadow: `0 0 8px ${tier.color}60`,
                }} />
              </div>
            </div>
          </div>

          {/* Contact info */}
          <div style={{
            padding: "12px 14px", borderRadius: "10px",
            background: "rgba(255,255,255,0.60)",
            border: "1px solid rgba(226,232,255,0.50)",
            marginBottom: "16px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px",
          }}>
            {[
              { label: "Email",  val: customer.email  || "—", icon: Mail  },
              { label: "Phone",  val: customer.phone  || "—", icon: Phone },
              { label: "Gender", val: customer.gender || "—", icon: User  },
              { label: "Age",    val: customer.age    || "—", icon: Calendar },
            ].map((f) => {
              const FIcon = f.icon;
              return (
                <div key={f.label}>
                  <p style={{ fontSize: "9.5px", fontWeight: 700, color: "#8891a8", textTransform: "uppercase", letterSpacing: "0.07em", margin: "0 0 2px", display: "flex", alignItems: "center", gap: "4px" }}>
                    <FIcon size={9} /> {f.label}
                  </p>
                  <p style={{ fontSize: "12.5px", fontWeight: 500, color: "#1a1d2e", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {f.val}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Purchase metrics */}
          <div style={{
            display: "grid", gridTemplateColumns: "1fr 1fr",
            gap: "8px", marginBottom: "18px",
          }}>
            {[
              { label: "Orders",      val: customer.total_orders || 0, icon: ShoppingCart, color: "#6366f1", bg: "rgba(238,242,255,0.70)" },
              { label: "Total Spend", val: customer.total_spend ? `₹${Number(customer.total_spend).toLocaleString("en-IN")}` : "₹0", icon: IndianRupee, color: "#10b981", bg: "rgba(220,252,231,0.70)" },
            ].map((m) => {
              const MIcon = m.icon;
              return (
                <div key={m.label} style={{
                  padding: "12px 14px", borderRadius: "10px",
                  background: m.bg, border: `1px solid ${m.color}20`,
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
                    <MIcon size={12} color={m.color} />
                    <span style={{ fontSize: "10px", fontWeight: 700, color: "#8891a8", textTransform: "uppercase", letterSpacing: "0.06em" }}>{m.label}</span>
                  </div>
                  <p style={{ fontFamily: "var(--font-display)", fontSize: "18px", fontWeight: 800, color: m.color, margin: 0 }}>{m.val}</p>
                </div>
              );
            })}
          </div>

          {/* Timeline */}
          <p style={{ fontSize: "10.5px", fontWeight: 700, color: "#8891a8", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 12px" }}>
            Customer Journey
          </p>
          <div style={{ position: "relative" }}>
            {EVENTS.map((ev, i) => {
              const EIcon = ev.icon;
              return (
                <div key={i} style={{ display: "flex", gap: "12px", marginBottom: i < EVENTS.length - 1 ? "0" : "0", position: "relative" }}>
                  {/* Connector */}
                  {i < EVENTS.length - 1 && (
                    <div style={{
                      position: "absolute", left: "15px", top: "32px",
                      width: "2px", height: "calc(100% - 8px)",
                      background: `linear-gradient(to bottom, ${ev.color}40, ${ev.color}08)`,
                    }} />
                  )}
                  {/* Dot */}
                  <div style={{
                    width: 32, height: 32, borderRadius: "50%", flexShrink: 0,
                    background: `${ev.color}18`,
                    border: `2px solid ${ev.color}35`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    position: "relative", zIndex: 1,
                  }}>
                    <EIcon size={13} color={ev.color} />
                  </div>
                  {/* Content */}
                  <div style={{ flex: 1, paddingBottom: "14px" }}>
                    <p style={{ fontSize: "12.5px", fontWeight: 600, color: "#1a1d2e", margin: "6px 0 2px", lineHeight: 1.3 }}>
                      {ev.text}
                    </p>
                    <p style={{ fontSize: "10.5px", color: "#8891a8", margin: 0 }}>{ev.time}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}

/* ── Add Customer SlideOver ──────────────────────────── */
function AddCustomerPanel({ open, onClose, onSuccess }) {
  const EMPTY = { name: "", email: "", phone: "", city: "", gender: "", age: "" };
  const [form,   setForm]   = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim()) {
      toast.error("Name and email are required.");
      return;
    }
    try {
      setSaving(true);
      await createCustomer({ ...form, age: form.age ? parseInt(form.age) : null });
      toast.success("Customer added successfully.");
      setForm(EMPTY);
      onSuccess();
      onClose();
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Failed to add customer.");
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <>
      <div onClick={onClose} style={{
        position: "fixed", inset: 0, background: "rgba(26,29,46,0.30)",
        backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)",
        zIndex: 40, animation: "crmFadeIn 0.18s ease",
      }} />
      <div style={{
        position: "fixed", top: 0, right: 0,
        width: "400px", height: "100vh",
        background: "rgba(255,255,255,0.90)",
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        borderLeft: "1px solid rgba(226,232,255,0.60)",
        boxShadow: "-8px 0 40px rgba(99,102,241,0.14)",
        zIndex: 50, display: "flex", flexDirection: "column",
        animation: "slideFromRight 0.22s cubic-bezier(0.4,0,0.2,1)",
      }}>
        <div style={{
          padding: "16px 20px",
          borderBottom: "1px solid rgba(226,232,255,0.55)",
          background: "rgba(248,249,254,0.70)",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <div>
            <p style={{ fontSize: "14px", fontWeight: 700, color: "#1a1d2e", margin: 0 }}>Add Customer</p>
            <p style={{ fontSize: "11.5px", color: "#8891a8", margin: 0 }}>Fill in the customer details below</p>
          </div>
          <button onClick={onClose} style={{
            width: 30, height: 30, borderRadius: "7px",
            border: "1px solid rgba(196,196,255,0.40)",
            background: "rgba(255,255,255,0.70)", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", color: "#8891a8",
          }}>
            <X size={15} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ flex: 1, overflowY: "auto", padding: "20px" }}>
          {[
            { name: "name",  label: "Full Name", type: "text",  icon: User,  required: true },
            { name: "email", label: "Email",     type: "email", icon: Mail,  required: true },
            { name: "phone", label: "Phone",     type: "tel",   icon: Phone, required: false },
            { name: "city",  label: "City",      type: "text",  icon: MapPin,required: false },
          ].map(({ name, label, type, icon: Icon, required }) => (
            <div key={name} style={{ marginBottom: "14px" }}>
              <label className="crm-label" htmlFor={`cust-${name}`}>
                {label} {required && <span style={{ color: "#ef4444" }}>*</span>}
              </label>
              <div style={{ position: "relative" }}>
                <Icon size={13} color="#8891a8" style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
                <input
                  id={`cust-${name}`} name={name} type={type}
                  value={form[name]} onChange={handleChange}
                  className="crm-input" style={{ paddingLeft: "30px" }} placeholder={label}
                />
              </div>
            </div>
          ))}

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "14px" }}>
            <div>
              <label className="crm-label" htmlFor="cust-gender">Gender</label>
              <select id="cust-gender" name="gender" value={form.gender} onChange={handleChange} className="crm-input">
                <option value="">Select…</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="crm-label" htmlFor="cust-age">Age</label>
              <input id="cust-age" name="age" type="number" value={form.age} onChange={handleChange}
                className="crm-input" placeholder="e.g. 28" min="1" max="120" />
            </div>
          </div>

          <button id="add-customer-submit" type="submit" disabled={saving} className="crm-btn-primary"
            style={{ width: "100%", padding: "10px", marginTop: "4px" }}>
            {saving ? (
              <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ width: 13, height: 13, border: "2px solid rgba(255,255,255,0.3)", borderTop: "2px solid #fff", borderRadius: "50%", animation: "spin 0.7s linear infinite", display: "inline-block" }} />
                Saving…
              </span>
            ) : (
              <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <UserPlus size={14} /> Add Customer
              </span>
            )}
          </button>
        </form>
      </div>
    </>
  );
}

/* ── Delete confirmation modal ───────────────────────── */
function DeleteModal({ customer, onConfirm, onCancel }) {
  if (!customer) return null;
  return (
    <>
      <div onClick={onCancel} style={{
        position: "fixed", inset: 0, background: "rgba(26,29,46,0.35)",
        backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)",
        zIndex: 60, animation: "crmFadeIn 0.15s ease",
      }} />
      <div style={{
        position: "fixed", top: "50%", left: "50%",
        transform: "translate(-50%, -50%)",
        background: "var(--color-surface-white)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderRadius: "16px",
        boxShadow: "0 24px 64px rgba(99,102,241,0.18)",
        border: "1px solid var(--color-surface-border)",
        padding: "24px 28px", zIndex: 70, width: "340px",
        animation: "crmFadeIn 0.15s ease",
      }}>
        <div style={{ textAlign: "center", marginBottom: "16px" }}>
          <div style={{ width: 44, height: 44, borderRadius: "50%", background: "rgba(254,226,226,0.80)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}>
            <Trash2 size={20} color="#dc2626" />
          </div>
          <h3 style={{ fontSize: "15px", fontWeight: 700, color: "var(--color-text-primary)", margin: "0 0 6px" }}>Delete Customer</h3>
          <p style={{ fontSize: "13px", color: "var(--color-text-secondary)", margin: 0 }}>
            Are you sure you want to delete <strong>{customer.name}</strong>? This action cannot be undone.
          </p>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <button onClick={onCancel} className="crm-btn-secondary" style={{ flex: 1 }}>Cancel</button>
          <button onClick={onConfirm} style={{
            flex: 1, padding: "8px 16px", borderRadius: "8px",
            background: "#dc2626", border: "1px solid #b91c1c",
            color: "#fff", fontWeight: 600, fontSize: "13px", cursor: "pointer",
          }}>Delete</button>
        </div>
      </div>
    </>
  );
}

/* ── Stat chip ───────────────────────────────────────── */
function StatChip({ label, value, icon: Icon, color, gradient }) {
  return (
    <div className="glass-card" style={{
      padding: "14px 16px", display: "flex", alignItems: "center", gap: "12px",
      transition: "all 0.2s ease",
    }}
      onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; }}
    >
      <div style={{
        width: 36, height: 36, borderRadius: "10px",
        background: gradient, display: "flex", alignItems: "center", justifyContent: "center",
        boxShadow: `0 4px 10px ${color}30`,
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

/* ═══════════════════════════════════════════════════════
   MAIN CUSTOMERS PAGE
   ═══════════════════════════════════════════════════════ */
export default function Customers() {
  const [customers,       setCustomers]       = useState([]);
  const [stats,           setStats]           = useState(null);
  const [search,          setSearch]          = useState("");
  const [page,            setPage]            = useState(1);
  const [loading,         setLoading]         = useState(true);
  const [panelOpen,       setPanelOpen]       = useState(false);
  const [toDelete,        setToDelete]        = useState(null);
  const [journeyCustomer, setJourneyCustomer] = useState(null);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [custRes, statRes] = await Promise.all([getCustomers(), getCustomerStats()]);
      setCustomers(custRes.data || []);
      setStats(statRes.data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load customer data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  const handleDelete = async () => {
    if (!toDelete) return;
    try {
      await deleteCustomer(toDelete.id);
      toast.success(`${toDelete.name} removed.`);
      setToDelete(null);
      loadAll();
    } catch {
      toast.error("Failed to delete customer.");
    }
  };

  const q        = search.toLowerCase();
  const filtered = customers.filter((c) =>
    !q || c.name?.toLowerCase().includes(q) || c.email?.toLowerCase().includes(q) ||
    c.city?.toLowerCase().includes(q) || c.phone?.includes(q)
  );
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage   = Math.min(page, totalPages);
  const paged      = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const fmt   = (n) => n != null ? Number(n).toLocaleString("en-IN") : "—";
  const fmtRs = (n) => n != null ? `₹${Number(n).toLocaleString("en-IN")}` : "—";

  return (
    <>
      <Toaster position="top-right" toastOptions={{ style: { fontFamily: "var(--font-sans)", fontSize: "13px", border: "1px solid rgba(226,232,255,0.70)", boxShadow: "var(--shadow-panel)", background: "rgba(255,255,255,0.95)", backdropFilter: "blur(12px)" } }} />

      <AddCustomerPanel open={panelOpen} onClose={() => setPanelOpen(false)} onSuccess={loadAll} />
      <DeleteModal customer={toDelete} onConfirm={handleDelete} onCancel={() => setToDelete(null)} />
      <JourneyPanel customer={journeyCustomer} onClose={() => setJourneyCustomer(null)} />

      {/* ── Page Header ─────────────────────────────── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
        <div>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: "18px", fontWeight: 800, color: "#1a1d2e", margin: "0 0 2px", letterSpacing: "-0.02em" }}>
            Customer Management
          </h1>
          <p style={{ fontSize: "12px", color: "#8891a8", margin: 0 }}>
            {filtered.length.toLocaleString()} customer{filtered.length !== 1 ? "s" : ""}{search && ` matching "${search}"`}
          </p>
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          <button onClick={loadAll} className="glass-btn-secondary" style={{ fontSize: "12.5px" }}>
            <RefreshCw size={13} style={{ animation: loading ? "spin 1s linear infinite" : "none" }} />
            Refresh
          </button>
          <button id="open-add-customer" onClick={() => setPanelOpen(true)} className="glass-btn-primary" style={{ fontSize: "12.5px" }}>
            <UserPlus size={13} /> Add Customer
          </button>
        </div>
      </div>

      {/* ── Stats row ───────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px", marginBottom: "16px" }}>
        <StatChip label="Total Customers" icon={Users}         value={fmt(stats?.total_customers)} color="#2563eb" gradient="#2563eb" />
        <StatChip label="Total Revenue"   icon={IndianRupee}   value={fmtRs(stats?.total_revenue)} color="#10b981" gradient="#10b981"   />
        <StatChip label="Avg. Spend"      icon={TrendingUp}    value={fmtRs(Math.round(stats?.average_spent || 0))} color="#f59e0b" gradient="#f59e0b" />
      </div>

      {/* ── Search + Table or Empty State ──────────────── */}
      {!loading && customers.length === 0 ? (
        <EmptyState
          iconName="Users"
          title="No Customers Registered Yet"
          description="Build your pipeline and start tracking customer lead scoring, regional hub demographics, and outreach campaign statistics. Add a customer manually or load live data from the backend."
          actionText="Add Your First Customer"
          onAction={() => setPanelOpen(true)}
        />
      ) : (
        <div className="glass-card" style={{ overflow: "hidden" }}>
          {/* Toolbar */}
          <div style={{
            padding: "12px 16px",
            borderBottom: "1px solid rgba(226,232,255,0.50)",
            display: "flex", alignItems: "center", gap: "10px",
            background: "var(--color-surface-hover)",
          }}>
            <div style={{ position: "relative", flex: 1, maxWidth: "320px" }}>
              <Search size={13} color="#8891a8" style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
              <input
                id="customer-search" type="text"
                placeholder="Search by name, email, city, phone…"
                value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="crm-input" style={{ paddingLeft: "30px", fontSize: "12.5px" }}
              />
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", marginLeft: "auto" }}>
              {/* Tier legend */}
              {[
                { label: "VIP", color: "#8b5cf6" }, { label: "Hot", color: "#f97316" },
                { label: "Warm", color: "#f59e0b" }, { label: "Cold", color: "#0ea5e9" },
              ].map((t) => (
                <span key={t.label} style={{ fontSize: "9.5px", fontWeight: 700, color: t.color, padding: "2px 7px", borderRadius: "99px", background: `${t.color}12`, border: `1px solid ${t.color}25` }}>
                  {t.label}
                </span>
              ))}
              <span style={{ fontSize: "11.5px", color: "#8891a8" }}>· Page {safePage}/{totalPages}</span>
            </div>
          </div>

          {/* Table */}
          <div style={{ overflowX: "auto" }}>
            <table className="crm-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Customer</th>
                  <th>Lead Score</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>City</th>
                  <th>Gender</th>
                  <th>Age</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 8 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 9 }).map((_, j) => (
                        <td key={j} style={{ padding: "11px 14px" }}>
                          <div style={{
                            height: 12, borderRadius: 4, width: j === 1 ? "80%" : j === 2 ? "40px" : "65%",
                            background: "linear-gradient(90deg, rgba(238,242,255,0.60) 25%, rgba(199,210,254,0.40) 50%, rgba(238,242,255,0.60) 75%)",
                            backgroundSize: "300% 100%", animation: "shimmer 1.5s infinite",
                          }} />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : paged.length === 0 ? (
                  <tr>
                    <td colSpan={9} style={{ padding: "40px", textAlign: "center", color: "#8891a8", fontSize: "13px" }}>
                      {search ? `No customers match "${search}"` : "No customers found."}
                    </td>
                  </tr>
                ) : (
                  paged.map((c, i) => {
                    const gColor = GENDER_COLORS[c.gender] || { bg: "rgba(241,242,248,0.80)", text: "#4b5168", border: "rgba(200,204,226,0.50)" };
                    const score  = calcLeadScore(c);
                    return (
                      <tr key={c.id} style={{ cursor: "pointer" }}
                        onClick={() => setJourneyCustomer(c)}
                      >
                        <td style={{ color: "var(--color-text-muted)", fontSize: "12px" }}>
                          {(safePage - 1) * PAGE_SIZE + i + 1}
                        </td>
                        <td>
                          <div style={{ display: "flex", alignItems: "center", gap: "9px" }}>
                            <div style={{
                              width: 30, height: 30, borderRadius: "50%", flexShrink: 0,
                              background: getScoreTier(score).gradient,
                              display: "flex", alignItems: "center", justifyContent: "center",
                              fontSize: "11px", fontWeight: 700, color: "white",
                              boxShadow: `0 2px 6px ${getScoreTier(score).color}40`,
                            }}>
                              {c.name?.[0]?.toUpperCase() || "?"}
                            </div>
                            <div>
                              <span style={{ fontWeight: 600, color: "var(--color-text-primary)", fontSize: "13px", display: "block" }}>{c.name}</span>
                            </div>
                          </div>
                        </td>
                        <td onClick={(e) => e.stopPropagation()}>
                          <LeadScoreBadge score={score} />
                        </td>
                        <td style={{ color: "var(--color-text-secondary)", fontSize: "12.5px" }}>{c.email || "—"}</td>
                        <td style={{ color: "var(--color-text-secondary)", fontSize: "12.5px" }}>{c.phone || "—"}</td>
                        <td>
                          {c.city ? (
                            <span style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "12.5px", color: "var(--color-text-secondary)" }}>
                              <MapPin size={11} color="var(--color-text-muted)" /> {c.city}
                            </span>
                          ) : "—"}
                        </td>
                        <td>
                          {c.gender ? (
                            <span className="crm-badge" style={{ background: gColor.bg, color: gColor.text, border: `1px solid ${gColor.border}` }}>
                              {c.gender}
                            </span>
                          ) : "—"}
                        </td>
                        <td style={{ color: "var(--color-text-secondary)", fontSize: "12.5px" }}>{c.age ?? "—"}</td>
                        <td>
                          <div style={{ display: "flex", gap: "5px" }} onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => setJourneyCustomer(c)}
                              style={{
                                display: "flex", alignItems: "center", gap: "4px",
                                padding: "4px 8px", borderRadius: "5px",
                                border: "1px solid rgba(199,210,254,0.55)", background: "rgba(238,242,255,0.70)",
                                color: "#6366f1", fontSize: "11.5px", fontWeight: 500,
                                cursor: "pointer", transition: "all 0.13s ease",
                              }}
                              onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(238,242,255,0.90)"; }}
                              onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(238,242,255,0.70)"; }}
                            >
                              <ExternalLink size={11} /> View
                            </button>
                            <button
                              onClick={() => setToDelete(c)}
                              style={{
                                display: "flex", alignItems: "center", gap: "4px",
                                padding: "4px 8px", borderRadius: "5px",
                                border: "1px solid rgba(252,165,165,0.50)", background: "rgba(254,226,226,0.60)",
                                color: "#dc2626", fontSize: "11.5px", fontWeight: 500,
                                cursor: "pointer", transition: "all 0.13s ease",
                              }}
                              onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(254,226,226,0.90)"; }}
                              onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(254,226,226,0.60)"; }}
                            >
                              <Trash2 size={11} /> Delete
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

          {/* Pagination */}
          {!loading && totalPages > 1 && (
            <div style={{
              padding: "10px 16px",
              borderTop: "1px solid rgba(226,232,255,0.50)",
              display: "flex", alignItems: "center", justifyContent: "space-between",
              background: "var(--color-surface-hover)",
            }}>
              <span style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>
                Showing {(safePage - 1) * PAGE_SIZE + 1}–{Math.min(safePage * PAGE_SIZE, filtered.length)} of {filtered.length}
              </span>
              <div style={{ display: "flex", gap: "5px" }}>
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={safePage === 1} className="crm-btn-secondary" style={{ padding: "5px 9px", fontSize: "12px" }}>
                  <ChevronLeft size={13} />
                </button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const pg = safePage <= 3 ? i + 1 : safePage - 2 + i;
                  if (pg < 1 || pg > totalPages) return null;
                  return (
                    <button key={pg} onClick={() => setPage(pg)} style={{
                      padding: "5px 10px", borderRadius: "6px", fontSize: "12px",
                      fontWeight: pg === safePage ? 700 : 400,
                      background: pg === safePage ? "var(--color-brand-600)" : "var(--glass-bg)",
                      color: pg === safePage ? "#fff" : "var(--color-text-secondary)",
                      border: `1px solid ${pg === safePage ? "transparent" : "var(--glass-border)"}`,
                      cursor: "pointer",
                      backdropFilter: "var(--glass-blur-sm)",
                    }}>
                      {pg}
                    </button>
                  );
                })}
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={safePage === totalPages} className="crm-btn-secondary" style={{ padding: "5px 9px", fontSize: "12px" }}>
                  <ChevronRight size={13} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      <style>{`
        @keyframes shimmer { 0% { background-position: -300% 0; } 100% { background-position: 300% 0; } }
        @keyframes spin    { to { transform: rotate(360deg); } }
        @keyframes slideFromRight { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        @keyframes crmFadeIn { from { opacity: 0; } to { opacity: 1; } }
      `}</style>
    </>
  );
}
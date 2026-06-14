import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  ChevronLeft, ChevronRight, Calendar, Megaphone, X,
  Star, Sparkles, Gift, Flag, Sun, Moon, Heart, Music,
} from "lucide-react";

/* ─── Festival Data ────────────────────────────────────── */
const FESTIVALS = [
  // January
  { month: 0, day: 1,  name: "New Year's Day",     color: "#6366f1", icon: Star,     category: "global",   desc: "Ring in the new year with exclusive offers." },
  { month: 0, day: 14, name: "Makar Sankranti",     color: "#f59e0b", icon: Sun,      category: "indian",   desc: "Harvest festival celebrated across India." },
  { month: 0, day: 26, name: "Republic Day",         color: "#10b981", icon: Flag,     category: "national", desc: "India's 76th Republic Day — national pride campaigns." },
  // February
  { month: 1, day: 14, name: "Valentine's Day",      color: "#ec4899", icon: Heart,    category: "global",   desc: "Perfect for gifting and couple-oriented campaigns." },
  { month: 1, day: 26, name: "Maha Shivratri",       color: "#8b5cf6", icon: Moon,     category: "indian",   desc: "Major Hindu festival dedicated to Lord Shiva." },
  // March
  { month: 2, day: 14, name: "Holi",                 color: "#f97316", icon: Sparkles, category: "indian",   desc: "Festival of colors — vibrant, joyful campaigns." },
  { month: 2, day: 25, name: "Good Friday",           color: "#64748b", icon: Star,     category: "global",   desc: "Christian observance — reflective messaging." },
  // April
  { month: 3, day: 14, name: "Baisakhi",             color: "#22c55e", icon: Sun,      category: "indian",   desc: "Harvest festival and Sikh New Year." },
  { month: 3, day: 17, name: "Easter",               color: "#a78bfa", icon: Gift,     category: "global",   desc: "Spring celebration with gifting opportunities." },
  // May
  { month: 4, day: 1,  name: "Labour Day",           color: "#3b82f6", icon: Flag,     category: "global",   desc: "International Workers' Day." },
  { month: 4, day: 12, name: "Mother's Day",         color: "#f472b6", icon: Heart,    category: "global",   desc: "Celebrate mothers — high-conversion gifting season." },
  // June
  { month: 5, day: 5,  name: "Environment Day",      color: "#10b981", icon: Sun,      category: "global",   desc: "World Environment Day — eco-conscious campaigns." },
  { month: 5, day: 21, name: "Father's Day",         color: "#2563eb", icon: Heart,    category: "global",   desc: "Father's Day — gifting and family-focused campaigns." },
  // July
  { month: 6, day: 6,  name: "Eid al-Adha",         color: "#f59e0b", icon: Moon,     category: "indian",   desc: "Festival of Sacrifice — inclusive campaign messaging." },
  // August
  { month: 7, day: 15, name: "Independence Day",     color: "#ef4444", icon: Flag,     category: "national", desc: "India's Independence Day — patriotic campaigns." },
  { month: 7, day: 19, name: "Raksha Bandhan",       color: "#ec4899", icon: Heart,    category: "indian",   desc: "Sibling bond festival — gifting campaigns." },
  { month: 7, day: 26, name: "Janmashtami",          color: "#6366f1", icon: Music,    category: "indian",   desc: "Birth of Lord Krishna — devotional campaigns." },
  // September
  { month: 8, day: 7,  name: "Ganesh Chaturthi",    color: "#f97316", icon: Sparkles, category: "indian",   desc: "Auspicious start to new ventures. High spending season." },
  // October
  { month: 9, day: 2,  name: "Gandhi Jayanti",       color: "#22c55e", icon: Flag,     category: "national", desc: "Mahatma Gandhi's birthday — values-driven campaigns." },
  { month: 9, day: 20, name: "Dussehra",             color: "#ef4444", icon: Star,     category: "indian",   desc: "Victory of good over evil — powerful campaign hooks." },
  { month: 9, day: 31, name: "Halloween",            color: "#f97316", icon: Moon,     category: "global",   desc: "Spooky season — themed product campaigns." },
  // November
  { month: 10, day: 1,  name: "Diwali",             color: "#f59e0b", icon: Sparkles, category: "indian",   desc: "Festival of Lights — peak shopping and gifting season. HIGHEST ROI." },
  { month: 10, day: 5,  name: "Bhai Dooj",          color: "#ec4899", icon: Heart,    category: "indian",   desc: "Sibling celebration after Diwali." },
  { month: 10, day: 14, name: "Children's Day",     color: "#22c55e", icon: Gift,     category: "national", desc: "India's Children's Day — family-focused campaigns." },
  { month: 10, day: 28, name: "Black Friday",        color: "#0f172a", icon: Star,     category: "global",   desc: "Biggest global sale event of the year." },
  { month: 10, day: 30, name: "Cyber Monday",        color: "#6366f1", icon: Sparkles, category: "global",   desc: "Peak online shopping day for digital campaigns." },
  // December
  { month: 11, day: 25, name: "Christmas",           color: "#22c55e", icon: Gift,     category: "global",   desc: "Festive gifting peak season." },
  { month: 11, day: 31, name: "New Year's Eve",      color: "#6366f1", icon: Star,     category: "global",   desc: "End-of-year blowout campaigns and retrospectives." },
];

const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December"
];

const WEEKDAYS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

const CATEGORY_COLORS = {
  indian:   { bg: "rgba(245,243,255,0.85)", text: "#7c3aed", border: "rgba(167,139,250,0.40)" },
  national: { bg: "rgba(240,253,244,0.85)", text: "#15803d", border: "rgba(134,239,172,0.40)" },
  global:   { bg: "rgba(239,246,255,0.85)", text: "#1d4ed8", border: "rgba(147,197,253,0.40)" },
};

/* ─── Utility: build calendar grid ────────────────────── */
function buildCalendarDays(year, month) {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

/* ─── Festival Side Panel ──────────────────────────────── */
function FestivalPanel({ festival, year, month, onClose, onDraftCampaign }) {
  if (!festival) return null;
  const IconComp = festival.icon;
  const catCfg = CATEGORY_COLORS[festival.category] || CATEGORY_COLORS.global;
  const dateStr = new Date(year, month, festival.day).toLocaleDateString("en-IN", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });

  return (
    <>
      {/* Backdrop */}
      <div onClick={onClose} style={{
        position: "fixed", inset: 0,
        background: "rgba(15,23,42,0.25)",
        backdropFilter: "blur(4px)",
        WebkitBackdropFilter: "blur(4px)",
        zIndex: 40,
        animation: "crmFadeIn 0.18s ease",
      }} />

      {/* Panel */}
      <div style={{
        position: "fixed", top: 0, right: 0,
        width: "380px", height: "100vh",
        background: "rgba(255,255,255,0.92)",
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        borderLeft: "1px solid rgba(226,232,255,0.70)",
        boxShadow: "-8px 0 40px rgba(99,102,241,0.12)",
        zIndex: 50,
        display: "flex", flexDirection: "column",
        animation: "slideFromRight 0.22s cubic-bezier(0.4,0,0.2,1)",
        overflow: "hidden",
      }}>
        {/* Header */}
        <div style={{
          padding: "18px 20px",
          borderBottom: "1px solid rgba(226,232,255,0.50)",
          background: "rgba(248,249,254,0.70)",
          display: "flex", alignItems: "flex-start", justifyContent: "space-between",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{
              width: 48, height: 48, borderRadius: "14px",
              background: `${festival.color}18`,
              border: `1.5px solid ${festival.color}30`,
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0,
            }}>
              <IconComp size={22} color={festival.color} />
            </div>
            <div>
              <p style={{ fontSize: "16px", fontWeight: 800, color: "#0f172a", margin: "0 0 3px", letterSpacing: "-0.01em" }}>
                {festival.name}
              </p>
              <span style={{
                fontSize: "10px", fontWeight: 700, padding: "2px 8px",
                borderRadius: "99px", textTransform: "uppercase", letterSpacing: "0.06em",
                background: catCfg.bg, color: catCfg.text, border: `1px solid ${catCfg.border}`,
              }}>
                {festival.category}
              </span>
            </div>
          </div>
          <button onClick={onClose} style={{
            width: 30, height: 30, borderRadius: "8px",
            border: "1px solid rgba(196,196,255,0.40)",
            background: "rgba(255,255,255,0.70)",
            cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "#8891a8",
          }}>
            <X size={14} />
          </button>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "20px" }}>
          {/* Date */}
          <div style={{
            padding: "12px 16px", borderRadius: "12px",
            background: "rgba(239,246,255,0.60)",
            border: "1px solid rgba(191,219,254,0.50)",
            marginBottom: "16px",
            display: "flex", alignItems: "center", gap: "10px",
          }}>
            <Calendar size={16} color="#2563eb" />
            <span style={{ fontSize: "13px", fontWeight: 600, color: "#1d4ed8" }}>{dateStr}</span>
          </div>

          {/* Description */}
          <p style={{ fontSize: "13.5px", color: "#334155", lineHeight: 1.7, marginBottom: "20px" }}>
            {festival.desc}
          </p>

          {/* Campaign Opportunity callout */}
          <div style={{
            padding: "14px 16px", borderRadius: "12px",
            background: `linear-gradient(135deg, ${festival.color}10, ${festival.color}06)`,
            border: `1px solid ${festival.color}25`,
            marginBottom: "20px",
          }}>
            <p style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: festival.color, margin: "0 0 6px" }}>
              Campaign Opportunity
            </p>
            <p style={{ fontSize: "12.5px", color: "#334155", margin: 0, lineHeight: 1.6 }}>
              This is an ideal moment to launch a targeted campaign. Pre-fill the campaign builder with event metadata and reach your most relevant segments.
            </p>
          </div>

          {/* Suggested Segments */}
          <p style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "#8891a8", marginBottom: "10px" }}>
            Suggested Targeting
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "24px" }}>
            {["All Customers", "High Spenders", "Mumbai", "Delhi", "Chennai"].map(seg => (
              <span key={seg} style={{
                fontSize: "11.5px", fontWeight: 600, padding: "3px 10px",
                borderRadius: "99px",
                background: "rgba(238,242,255,0.80)",
                color: "#4338ca",
                border: "1px solid rgba(199,210,254,0.60)",
              }}>{seg}</span>
            ))}
          </div>

          {/* Draft Campaign Button */}
          <button
            onClick={() => onDraftCampaign(festival)}
            style={{
              width: "100%", padding: "12px 20px",
              borderRadius: "10px",
              background: `linear-gradient(135deg, ${festival.color}, ${festival.color}cc)`,
              color: "#ffffff",
              border: "none", cursor: "pointer",
              fontSize: "13.5px", fontWeight: 700,
              display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
              boxShadow: `0 6px 20px ${festival.color}40`,
              transition: "all 0.18s ease",
              letterSpacing: "0.01em",
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = `0 10px 30px ${festival.color}55`; }}
            onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = `0 6px 20px ${festival.color}40`; }}
          >
            <Megaphone size={16} />
            Draft Campaign for {festival.name}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes slideFromRight { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        @keyframes crmFadeIn { from { opacity: 0; } to { opacity: 1; } }
      `}</style>
    </>
  );
}

/* ─── Main Calendar Page ───────────────────────────────── */
export default function CalendarPage() {
  const navigate = useNavigate();
  const today = new Date();
  const [viewYear, setViewYear]  = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selectedFestival, setSelectedFestival] = useState(null);
  const [filterCat, setFilterCat] = useState("all");

  const calDays = useMemo(() => buildCalendarDays(viewYear, viewMonth), [viewYear, viewMonth]);

  const monthFestivals = useMemo(() =>
    FESTIVALS.filter(f => f.month === viewMonth &&
      (filterCat === "all" || f.category === filterCat)),
    [viewMonth, filterCat]
  );

  const getFestivalsForDay = (day) =>
    day ? monthFestivals.filter(f => f.day === day) : [];

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  };

  const handleDraftCampaign = (festival) => {
    const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(festival.day).padStart(2, "0")}`;
    navigate(`/campaigns?event=${encodeURIComponent(festival.name)}&date=${dateStr}`);
  };

  const upcomingFestivals = FESTIVALS
    .filter(f => {
      const fd = new Date(today.getFullYear(), f.month, f.day);
      return fd >= today;
    })
    .sort((a, b) => {
      const da = new Date(today.getFullYear(), a.month, a.day);
      const db = new Date(today.getFullYear(), b.month, b.day);
      return da - db;
    })
    .slice(0, 5);

  return (
    <div style={{ animation: "crmFadeIn 0.3s ease" }}>
      {/* Page Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
        <div>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: "20px", fontWeight: 800, color: "var(--color-text-primary)", margin: "0 0 3px", letterSpacing: "-0.02em" }}>
            Festival & Campaign Calendar
          </h1>
          <p style={{ fontSize: "12.5px", color: "var(--color-text-muted)", margin: 0 }}>
            Click any festival to draft a targeted campaign instantly
          </p>
        </div>
        {/* Category Filter */}
        <div style={{ display: "flex", gap: "6px" }}>
          {[
            { val: "all",      label: "All Events",   bg: "#6366f1" },
            { val: "indian",   label: "Indian",        bg: "#7c3aed" },
            { val: "national", label: "National",      bg: "#15803d" },
            { val: "global",   label: "Global",        bg: "#1d4ed8" },
          ].map(cat => (
            <button
              key={cat.val}
              onClick={() => setFilterCat(cat.val)}
              style={{
                padding: "6px 14px", borderRadius: "99px", border: "none",
                background: filterCat === cat.val ? cat.bg : "rgba(255,255,255,0.60)",
                color: filterCat === cat.val ? "#fff" : "var(--color-text-secondary)",
                fontSize: "11.5px", fontWeight: 600, cursor: "pointer",
                backdropFilter: "blur(8px)",
                border: filterCat === cat.val ? "none" : "1px solid rgba(196,196,255,0.40)",
                transition: "all 0.15s ease",
                boxShadow: filterCat === cat.val ? `0 3px 10px ${cat.bg}40` : "none",
              }}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 260px", gap: "16px" }}>
        {/* Calendar Grid */}
        <div className="glass-card" style={{ padding: "20px" }}>
          {/* Month Navigation */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "18px" }}>
            <button onClick={prevMonth} style={{
              width: 32, height: 32, borderRadius: "8px", border: "1px solid rgba(196,196,255,0.40)",
              background: "rgba(255,255,255,0.60)", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "var(--color-text-secondary)", transition: "all 0.13s ease",
              backdropFilter: "blur(8px)",
            }}
              onMouseEnter={e => e.currentTarget.style.background = "rgba(238,242,255,0.80)"}
              onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.60)"}
            >
              <ChevronLeft size={15} />
            </button>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: "16px", fontWeight: 800, color: "var(--color-text-primary)", margin: 0, letterSpacing: "-0.01em" }}>
              {MONTHS[viewMonth]} {viewYear}
            </h2>
            <button onClick={nextMonth} style={{
              width: 32, height: 32, borderRadius: "8px", border: "1px solid rgba(196,196,255,0.40)",
              background: "rgba(255,255,255,0.60)", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "var(--color-text-secondary)", transition: "all 0.13s ease",
              backdropFilter: "blur(8px)",
            }}
              onMouseEnter={e => e.currentTarget.style.background = "rgba(238,242,255,0.80)"}
              onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.60)"}
            >
              <ChevronRight size={15} />
            </button>
          </div>

          {/* Weekday Headers */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "4px", marginBottom: "6px" }}>
            {WEEKDAYS.map(wd => (
              <div key={wd} style={{
                textAlign: "center", fontSize: "10.5px", fontWeight: 700,
                color: "var(--color-text-muted)", textTransform: "uppercase",
                letterSpacing: "0.06em", padding: "6px 0",
              }}>
                {wd}
              </div>
            ))}
          </div>

          {/* Day Grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "4px" }}>
            {calDays.map((day, idx) => {
              const festivals = getFestivalsForDay(day);
              const isToday = day === today.getDate() && viewMonth === today.getMonth() && viewYear === today.getFullYear();
              const hasFestival = festivals.length > 0;

              return (
                <div
                  key={idx}
                  onClick={() => hasFestival && setSelectedFestival(festivals[0])}
                  style={{
                    minHeight: "64px", borderRadius: "8px", padding: "6px",
                    background: isToday
                      ? "rgba(99,102,241,0.10)"
                      : hasFestival
                        ? "rgba(255,255,255,0.50)"
                        : day ? "rgba(255,255,255,0.25)" : "transparent",
                    border: isToday
                      ? "1.5px solid rgba(99,102,241,0.40)"
                      : hasFestival
                        ? `1px solid ${festivals[0].color}30`
                        : "1px solid transparent",
                    cursor: hasFestival ? "pointer" : "default",
                    transition: "all 0.15s ease",
                    backdropFilter: day ? "blur(6px)" : "none",
                    position: "relative",
                  }}
                  onMouseEnter={e => { if (hasFestival || day) e.currentTarget.style.background = "rgba(238,242,255,0.65)"; }}
                  onMouseLeave={e => {
                    if (isToday) e.currentTarget.style.background = "rgba(99,102,241,0.10)";
                    else if (hasFestival) e.currentTarget.style.background = "rgba(255,255,255,0.50)";
                    else if (day) e.currentTarget.style.background = "rgba(255,255,255,0.25)";
                    else e.currentTarget.style.background = "transparent";
                  }}
                >
                  {day && (
                    <>
                      <span style={{
                        fontSize: "12px", fontWeight: isToday ? 800 : hasFestival ? 700 : 500,
                        color: isToday ? "#4f46e5" : "var(--color-text-primary)",
                        display: "block", marginBottom: "3px",
                      }}>
                        {day}
                      </span>
                      {festivals.slice(0, 2).map((fest, fi) => {
                        const FIcon = fest.icon;
                        return (
                          <div key={fi} style={{
                            display: "flex", alignItems: "center", gap: "3px",
                            padding: "2px 5px", borderRadius: "4px", marginBottom: "2px",
                            background: `${fest.color}18`,
                          }}>
                            <FIcon size={8} color={fest.color} />
                            <span style={{ fontSize: "9px", fontWeight: 600, color: fest.color, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "60px" }}>
                              {fest.name}
                            </span>
                          </div>
                        );
                      })}
                      {festivals.length > 2 && (
                        <span style={{ fontSize: "9px", color: "var(--color-text-muted)", marginLeft: "4px" }}>+{festivals.length - 2} more</span>
                      )}
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Upcoming Festivals Sidebar */}
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {/* Upcoming */}
          <div className="glass-card" style={{ padding: "16px" }}>
            <p style={{ fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.07em", margin: "0 0 12px" }}>
              Upcoming Festivals
            </p>
            {upcomingFestivals.map((fest, i) => {
              const FIcon = fest.icon;
              const fd = new Date(today.getFullYear(), fest.month, fest.day);
              const daysLeft = Math.ceil((fd - today) / (1000 * 60 * 60 * 24));
              return (
                <div
                  key={i}
                  onClick={() => { setViewMonth(fest.month); setSelectedFestival(fest); }}
                  style={{
                    display: "flex", alignItems: "center", gap: "10px",
                    padding: "10px 12px", borderRadius: "10px",
                    background: "rgba(255,255,255,0.50)", marginBottom: "6px",
                    border: "1px solid rgba(226,232,255,0.60)",
                    cursor: "pointer", transition: "all 0.13s ease",
                    backdropFilter: "blur(8px)",
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = "rgba(238,242,255,0.75)"}
                  onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.50)"}
                >
                  <div style={{
                    width: 32, height: 32, borderRadius: "9px",
                    background: `${fest.color}15`,
                    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                  }}>
                    <FIcon size={14} color={fest.color} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: "12px", fontWeight: 700, color: "var(--color-text-primary)", margin: "0 0 1px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {fest.name}
                    </p>
                    <p style={{ fontSize: "10px", color: "var(--color-text-muted)", margin: 0 }}>
                      {MONTHS[fest.month]} {fest.day}
                    </p>
                  </div>
                  <span style={{
                    fontSize: "10px", fontWeight: 700,
                    padding: "2px 7px", borderRadius: "99px",
                    background: daysLeft <= 7 ? "rgba(254,226,226,0.80)" : "rgba(238,242,255,0.80)",
                    color: daysLeft <= 7 ? "#dc2626" : "#4338ca",
                  }}>
                    {daysLeft}d
                  </span>
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="glass-card" style={{ padding: "14px 16px" }}>
            <p style={{ fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.07em", margin: "0 0 10px" }}>
              Legend
            </p>
            {Object.entries(CATEGORY_COLORS).map(([cat, cfg]) => (
              <div key={cat} style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "7px" }}>
                <div style={{ width: 10, height: 10, borderRadius: "3px", background: cfg.text, flexShrink: 0 }} />
                <span style={{ fontSize: "12px", color: "var(--color-text-secondary)", fontWeight: 500, textTransform: "capitalize" }}>{cat} Festivals</span>
              </div>
            ))}
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "10px", paddingTop: "10px", borderTop: "1px solid rgba(226,232,240,0.50)" }}>
              <Calendar size={12} color="#6366f1" />
              <span style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>{FESTIVALS.length} festivals pre-loaded for {viewYear}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Festival Detail Panel */}
      <FestivalPanel
        festival={selectedFestival}
        year={viewYear}
        month={viewMonth}
        onClose={() => setSelectedFestival(null)}
        onDraftCampaign={handleDraftCampaign}
      />
    </div>
  );
}

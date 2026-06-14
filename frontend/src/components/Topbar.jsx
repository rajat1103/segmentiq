import { useLocation, useNavigate } from "react-router-dom";
import { Bell, Search, Crown, ChevronRight, Sun, Moon, Settings, CreditCard, Sliders, LogOut } from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";

/* Route → breadcrumb label map */
const ROUTE_LABELS = {
  "/":                    ["Dashboard"],
  "/command-center":      ["Command Center"],
  "/dashboard":           ["Dashboard"],
  "/customers":           ["Customers"],
  "/campaigns":           ["Campaigns"],
  "/communication-logs":  ["Communications", "Logs"],
  "/segment-ai":          ["Prism AI"],
  "/settings":            ["Settings"],
};

/* Live clock hook */
function useClock() {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return time;
}

function getGreeting(hour) {
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function Topbar() {
  const location = useLocation();
  const navigate  = useNavigate();
  const now       = useClock();
  const [searchFocused, setSearchFocused] = useState(false);
  const [notifOpen,     setNotifOpen]     = useState(false);
  const [searchVal,     setSearchVal]     = useState("");

  const [darkMode, setDarkMode] = useState(
    localStorage.getItem("theme") === "dark" ||
    (!("theme" in localStorage) && window.matchMedia("(prefers-color-scheme: dark)").matches)
  );
  const isDark = document.documentElement.classList.contains("dark");

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [darkMode]);

  const pageLabels = ROUTE_LABELS[location.pathname] || [];
  const pageTitle  = pageLabels[pageLabels.length - 1] || "Dashboard";

  const { user, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const userName = user?.name || "Guest User";
  const userInitials = user?.name
    ? user.name.split(" ").map(part => part[0]).join("").toUpperCase().slice(0, 2)
    : "GU";
  const firstName = user?.name ? user.name.split(" ")[0] : "Guest";
  const greeting  = getGreeting(now.getHours());

  const timeStr = now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
  const dateStr = now.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });

  /* Mock notifications */
  const NOTIFS = [
    { id: 1, text: "Campaign 'Q3 Blast' launched successfully", time: "2m ago", type: "success" },
    { id: 2, text: "3 new customers added via signup", time: "12m ago", type: "info" },
    { id: 3, text: "Prism AI indexed 847 new chunks", time: "1h ago", type: "ai" },
  ];

  const NOTIF_COLORS = {
    success: { bg: "rgba(220,252,231,0.80)", darkBg: "rgba(16,185,129,0.16)", dot: "#10b981" },
    info:    { bg: "rgba(238,242,255,0.80)", darkBg: "rgba(59,130,246,0.16)", dot: "#6366f1" },
    ai:      { bg: "rgba(245,243,255,0.80)", darkBg: "rgba(139,92,246,0.16)", dot: "#8b5cf6" },
  };

  return (
    <header style={{
      height: "56px",
      background: "var(--glass-bg)",
      backdropFilter: "var(--glass-blur)",
      WebkitBackdropFilter: "var(--glass-blur)",
      borderBottom: "1px solid var(--glass-border)",
      boxShadow: "0 4px 12px rgba(15, 23, 42, 0.03)",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "0 20px",
      flexShrink: 0,
      position: "sticky",
      top: 0,
      zIndex: 10,
    }}>

      {/* ── Left: Breadcrumb + Greeting ──────────────────── */}
      <div>
        {/* Breadcrumb */}
        <div style={{ display: "flex", alignItems: "center", gap: "5px", marginBottom: "1px" }}>
          <span style={{ fontSize: "10.5px", color: "rgba(136,145,168,0.80)", letterSpacing: "0.03em" }}>
            SegmentIQ
          </span>
          {pageLabels.map((seg, i) => (
            <span key={i} style={{ display: "flex", alignItems: "center", gap: "5px" }}>
              <ChevronRight size={10} color="rgba(196,196,220,0.80)" />
              <span style={{
                fontSize: "10.5px",
                fontWeight: i === pageLabels.length - 1 ? 600 : 400,
                color: i === pageLabels.length - 1 ? "var(--color-text-primary)" : "rgba(136,145,168,0.80)",
              }}>
                {seg}
              </span>
            </span>
          ))}
        </div>

        {/* Page title / greeting */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <h1 style={{
            fontFamily: "var(--font-display)",
            fontSize: "14px",
            fontWeight: 700,
            color: "var(--color-text-primary)",
            margin: 0,
            letterSpacing: "-0.01em",
          }}>
            {location.pathname === "/command-center"
              ? `${greeting}, ${firstName} 👋`
              : pageTitle}
          </h1>
          {location.pathname === "/command-center" && (
            <span style={{
              fontSize: "9.5px",
              color: "var(--color-text-muted)",
              fontWeight: 500,
              marginTop: "1px",
            }}>
              {dateStr} · {timeStr}
            </span>
          )}
        </div>
      </div>

      {/* ── Right: Clock + Search + Bell + Avatar ──────── */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>

        {/* Live time (non-command-center pages) */}
        {location.pathname !== "/command-center" && (
          <div style={{
            padding: "4px 10px",
            borderRadius: "6px",
            background: isDark ? "rgba(255,255,255,0.08)" : "rgba(238,242,255,0.60)",
            border: isDark ? "1px solid rgba(148,163,184,0.18)" : "1px solid rgba(196,196,255,0.35)",
            backdropFilter: "blur(8px)",
          }}>
            <p style={{ fontSize: "11px", fontWeight: 700, color: isDark ? "#93c5fd" : "#6366f1", margin: 0, letterSpacing: "0.02em" }}>
              {timeStr}
            </p>
          </div>
        )}

        {/* Search */}
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "7px",
          background: searchFocused ? (isDark ? "rgba(255,255,255,0.08)" : "var(--color-surface-white)") : "var(--glass-bg)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          border: searchFocused
            ? "1px solid rgba(99,102,241,0.50)"
            : "1px solid var(--glass-border)",
          borderRadius: "8px",
          padding: "5px 10px",
          transition: "all 0.18s ease",
          boxShadow: searchFocused ? "0 0 0 3px rgba(99,102,241,0.12)" : "none",
          width: searchFocused ? "220px" : "170px",
        }}>
          <Search size={13} color={searchFocused ? "#6366f1" : "var(--color-text-muted)"} style={{ flexShrink: 0 }} />
          <input
            type="text"
            placeholder="Search…"
            value={searchVal}
            onChange={(e) => setSearchVal(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            style={{
              border: "none",
              background: "transparent",
              outline: "none",
              fontSize: "12.5px",
              color: "var(--color-text-primary)",
              width: "100%",
              fontFamily: "var(--font-sans)",
            }}
          />
        </div>

        {/* Theme switcher toggle */}
        <button
          onClick={() => setDarkMode(!darkMode)}
          style={{
            width: "34px", height: "34px",
            borderRadius: "8px",
            border: "1px solid var(--glass-border)",
            background: "var(--glass-bg)",
            backdropFilter: "blur(10px)",
            WebkitBackdropFilter: "blur(10px)",
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer",
            transition: "all 0.13s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "var(--color-surface-hover)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "var(--glass-bg)";
          }}
          title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
        >
          {darkMode ? <Sun size={15} color="#eab308" /> : <Moon size={15} color="var(--color-text-secondary)" />}
        </button>

        {/* Notification bell */}
        <div style={{ position: "relative" }}>
          <button
            onClick={() => setNotifOpen(!notifOpen)}
            style={{
              width: "34px", height: "34px",
              borderRadius: "8px",
              border: "1px solid var(--glass-border)",
              background: "var(--glass-bg)",
              backdropFilter: "blur(10px)",
              WebkitBackdropFilter: "blur(10px)",
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", position: "relative",
              transition: "all 0.13s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "var(--color-surface-hover)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "var(--glass-bg)";
            }}
          >
            <Bell size={15} color="var(--color-text-secondary)" />
            {/* Unread dot */}
            <span style={{
              position: "absolute", top: "7px", right: "7px",
              width: "6px", height: "6px",
              borderRadius: "50%",
              background: "#f43f5e",
              border: "1.5px solid white",
            }} />
          </button>

          {/* Notification dropdown */}
          {notifOpen && (
            <div style={{
              position: "absolute", top: "42px", right: 0,
              width: "300px",
              background: isDark ? "rgba(15,23,42,0.96)" : "rgba(255,255,255,0.92)",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
              border: isDark ? "1px solid rgba(71,85,105,0.35)" : "1px solid rgba(226,232,255,0.70)",
              borderRadius: "12px",
              boxShadow: isDark ? "0 16px 48px rgba(0,0,0,0.40)" : "0 16px 48px rgba(99,102,241,0.14)",
              zIndex: 50,
              overflow: "hidden",
              animation: "crmFadeIn 0.18s ease",
            }}>
              <div style={{ padding: "12px 14px", borderBottom: isDark ? "1px solid rgba(71,85,105,0.35)" : "1px solid rgba(226,232,255,0.55)" }}>
                <p style={{ fontSize: "12.5px", fontWeight: 700, color: "var(--color-text-primary)", margin: 0 }}>Notifications</p>
                <p style={{ fontSize: "10.5px", color: "var(--color-text-muted)", margin: 0 }}>{NOTIFS.length} recent updates</p>
              </div>
              {NOTIFS.map((n) => {
                const cfg = NOTIF_COLORS[n.type] || NOTIF_COLORS.info;
                const notificationBg = isDark ? cfg.darkBg : cfg.bg;
                return (
                  <div key={n.id} style={{
                    padding: "11px 14px",
                    background: notificationBg,
                    borderBottom: isDark ? "1px solid rgba(71,85,105,0.20)" : "1px solid rgba(226,232,255,0.40)",
                    display: "flex", alignItems: "flex-start", gap: "10px",
                    cursor: "pointer",
                    transition: "all 0.1s ease",
                  }}
                    onMouseEnter={(e) => { e.currentTarget.style.filter = "brightness(0.97)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.filter = "brightness(1)"; }}
                  >
                    <div style={{ width: 7, height: 7, borderRadius: "50%", background: cfg.dot, marginTop: 4, flexShrink: 0 }} />
                    <div style={{ minWidth: 0 }}>
                      <p style={{ fontSize: "12px", color: "var(--color-text-primary)", margin: "0 0 2px", lineHeight: 1.4 }}>{n.text}</p>
                      <p style={{ fontSize: "10px", color: "var(--color-text-muted)", margin: 0 }}>{n.time}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Divider */}
        <div style={{ width: "1px", height: "20px", background: isDark ? "rgba(148,163,184,0.18)" : "rgba(196,196,255,0.45)" }} />

        {/* User avatar */}
        <div style={{ position: "relative" }}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            style={{
              display: "flex", alignItems: "center", gap: "8px",
              padding: "4px 8px 4px 4px",
              borderRadius: "8px",
              border: "1px solid var(--glass-border)",
              background: "var(--glass-bg)",
              backdropFilter: "blur(10px)",
              WebkitBackdropFilter: "blur(10px)",
              cursor: "pointer", transition: "all 0.13s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "var(--color-surface-hover)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "var(--glass-bg)";
            }}
          >
            <div style={{
              width: "26px", height: "26px", borderRadius: "50%",
              background: "linear-gradient(135deg, #a5b4fc, #c4b5fd)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "10px", fontWeight: 700, color: "#3730a3",
              boxShadow: "0 2px 6px rgba(99,102,241,0.25)",
            }}>
              {userInitials}
            </div>
            <span style={{
              fontSize: "12px", fontWeight: 600, color: "var(--color-text-primary)",
              maxWidth: "80px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            }}>
              {userName}
            </span>
          </button>

          {/* User Dropdown Menu */}
          {dropdownOpen && (
            <div style={{
              position: "absolute", top: "42px", right: 0,
              width: "220px",
              background: isDark ? "rgba(15,23,42,0.96)" : "rgba(255,255,255,0.95)",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
              border: isDark ? "1px solid rgba(71,85,105,0.35)" : "1px solid rgba(226,232,255,0.70)",
              borderRadius: "12px",
              boxShadow: isDark ? "0 16px 48px rgba(0,0,0,0.40)" : "0 16px 48px rgba(99,102,241,0.14)",
              zIndex: 50,
              padding: "6px 0",
              animation: "crmFadeIn 0.18s ease",
            }}>
              {/* User Info Header */}
              <div style={{ padding: "10px 16px", borderBottom: isDark ? "1px solid rgba(71,85,105,0.35)" : "1px solid rgba(226,232,255,0.55)", marginBottom: "4px" }}>
                <p style={{ fontSize: "12.5px", fontWeight: 700, color: "var(--color-text-primary)", margin: "0 0 2px" }}>{userName}</p>
                <p style={{ fontSize: "10px", color: "var(--color-text-muted)", margin: 0, overflow: "hidden", textOverflow: "ellipsis" }}>{user?.email || "guest@segmentiq.io"}</p>
              </div>

              {/* Menu Options */}
              {[
                { label: "API Configuration", path: "/settings?tab=api", icon: Settings },
                { label: "Settings / Billing", path: "/settings?tab=db", icon: CreditCard },
                { label: "Preferences", path: "/settings?tab=theme", icon: Sliders },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.label}
                    onClick={() => {
                      setDropdownOpen(false);
                      navigate(item.path);
                    }}
                    style={{
                      width: "100%", padding: "10px 16px",
                      background: "transparent", border: "none",
                      display: "flex", alignItems: "center", gap: "10px",
                      cursor: "pointer", fontSize: "12.5px", color: isDark ? "#cbd5e1" : "#4b5168",
                      textAlign: "left", transition: "all 0.12s ease",
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = isDark ? "rgba(255,255,255,0.05)" : "rgba(99,102,241,0.06)"; e.currentTarget.style.color = "#6366f1"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = isDark ? "#cbd5e1" : "#4b5168"; }}
                  >
                    <Icon size={14} />
                    {item.label}
                  </button>
                );
              })}

              <div style={{ height: "1px", background: "rgba(226,232,255,0.55)", margin: "4px 0" }} />

              {/* Logout Option */}
              <button
                onClick={() => {
                  setDropdownOpen(false);
                  logout();
                  navigate("/login");
                }}
                style={{
                  width: "100%", padding: "10px 16px",
                  background: "transparent", border: "none",
                  display: "flex", alignItems: "center", gap: "10px",
                  cursor: "pointer", fontSize: "12.5px", color: "#ef4444",
                  textAlign: "left", transition: "all 0.12s ease",
                  fontWeight: 600,
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(239,68,68,0.06)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
              >
                <LogOut size={14} />
                Logout
              </button>
            </div>
          )}
        </div>

      </div>

      {/* Click-outside close for dropdowns */}
      {(notifOpen || dropdownOpen) && (
        <div
          onClick={() => {
            setNotifOpen(false);
            setDropdownOpen(false);
          }}
          style={{ position: "fixed", inset: 0, zIndex: 40 }}
        />
      )}
    </header>
  );
}

export default Topbar;